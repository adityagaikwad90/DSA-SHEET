import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const getStorageKey = (uid) => `dsa-solved-status-${uid || 'guest'}`;
export const getRecordsStorageKey = (uid) => `dsa-saved-records-${uid || 'guest'}`;

/**
 * Loads the dictionary of saved question records for a user from localStorage.
 * Format: { [questionId]: { questionId, title, status, notes, company, difficulty, url, completedAt, updatedAt } }
 */
export const loadSavedRecords = (uid) => {
  try {
    const key = getRecordsStorageKey(uid);
    const saved = localStorage.getItem(key);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    console.error('Failed to load saved question records from localStorage:', error);
    return {};
  }
};

/**
 * Saves the dictionary of question records to localStorage.
 */
export const saveLocalSavedRecords = (uid, recordsMap) => {
  try {
    const key = getRecordsStorageKey(uid);
    localStorage.setItem(key, JSON.stringify(recordsMap));
  } catch (error) {
    console.error('Failed to save question records to localStorage:', error);
  }
};

/**
 * Loads solved question IDs array from localStorage (backward-compatibility & quick indexing).
 */
export const loadLocalSolved = (uid) => {
  try {
    const key = getStorageKey(uid);
    const saved = localStorage.getItem(key);
    if (!saved) {
      // Fallback: derive from saved records if available
      const records = loadSavedRecords(uid);
      const ids = Object.keys(records);
      return ids;
    }
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.map(id => String(id))));
  } catch (error) {
    console.error('Failed to load local solved progress:', error);
    return [];
  }
};

/**
 * Saves solved question IDs to localStorage.
 */
export const saveLocalSolved = (uid, solvedArray) => {
  try {
    const key = getStorageKey(uid);
    const unique = Array.from(new Set(solvedArray.map(id => String(id))));
    localStorage.setItem(key, JSON.stringify(unique));
  } catch (error) {
    console.error('Failed to save local solved progress:', error);
  }
};

/**
 * Saves or updates a completed question record in both localStorage and Firestore.
 * Preserves completedAt if the question was already saved, and updates updatedAt.
 */
export const saveQuestionProgressRecord = async (uid, questionData, status, notes = '') => {
  const userId = uid || 'guest';
  const questionId = String(questionData.id || questionData.questionId);
  const nowIso = new Date().toISOString();

  // Load existing local records
  const existingRecords = loadSavedRecords(userId);
  const prevRecord = existingRecords[questionId] || null;

  const record = {
    id: prevRecord?.id || `${userId}_${questionId}`,
    questionId,
    userId,
    title: questionData.title || questionData.question || questionId,
    question: questionData.title || questionData.question || questionId, // MySheet compatibility
    company: questionData.company || prevRecord?.company || '',
    difficulty: questionData.difficulty || prevRecord?.difficulty || 'Medium',
    url: questionData.link || questionData.url || prevRecord?.url || '',
    link: questionData.link || questionData.url || prevRecord?.link || '', // MySheet compatibility
    notes: typeof notes === 'string' ? notes : (prevRecord?.notes || ''),
    status: status === 'needs_practice' ? 'needs_practice' : 'solved_easily',
    topics: Array.isArray(questionData.topics) ? questionData.topics : (prevRecord?.topics || []),
    completedAt: prevRecord?.completedAt || nowIso,
    updatedAt: nowIso,
    date: prevRecord?.date || new Date().toLocaleDateString()
  };

  // Update local records dictionary
  existingRecords[questionId] = record;
  saveLocalSavedRecords(userId, existingRecords);

  // Update solved questions ID list
  const currentSolved = loadLocalSolved(userId);
  if (!currentSolved.includes(questionId)) {
    const updatedSolved = [...currentSolved, questionId];
    saveLocalSolved(userId, updatedSolved);
  }

  // Broadcast update event to all components (MySheet, Code Arena, etc.)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('dsa-progress-updated', {
        detail: { questionId, status: record.status, record }
      })
    );
  }

  // If authenticated, persist to Firestore collection "progress"
  if (uid) {
    try {
      const docRef = doc(db, 'progress', `${uid}_${questionId}`);
      await setDoc(docRef, {
        ...record,
        timestamp: serverTimestamp()
      }, { merge: true });

      // Also sync userProgress list
      const solvedList = Object.keys(existingRecords);
      const userProgressDoc = doc(db, 'userProgress', uid);
      await setDoc(userProgressDoc, {
        solvedQuestions: solvedList,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore progress sync note:', error.message);
      // Non-fatal: local storage is already updated and valid
    }
  }

  return record;
};

/**
 * Deletes a question record from localStorage and Firestore.
 */
export const deleteQuestionProgressRecord = async (uid, questionId) => {
  const userId = uid || 'guest';
  const qId = String(questionId);

  const existingRecords = loadSavedRecords(userId);
  const docIdToDelete = existingRecords[qId]?.id || `${userId}_${qId}`;
  delete existingRecords[qId];
  saveLocalSavedRecords(userId, existingRecords);

  const currentSolved = loadLocalSolved(userId).filter(id => id !== qId);
  saveLocalSolved(userId, currentSolved);

  // Broadcast update event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('dsa-progress-updated', {
        detail: { questionId: qId, deleted: true }
      })
    );
  }

  if (uid) {
    try {
      await deleteDoc(doc(db, 'progress', docIdToDelete));
      const userProgressDoc = doc(db, 'userProgress', uid);
      await setDoc(userProgressDoc, {
        solvedQuestions: Object.keys(existingRecords),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore delete note:', error.message);
    }
  }
};

/**
 * Fetches all saved question progress records from Firestore for an authenticated user.
 */
export const fetchUserProgressRecordsFromFirestore = async (uid) => {
  if (!uid) return null;
  try {
    const q = query(collection(db, 'progress'), where('userId', '==', uid));
    const snapshot = await getDocs(q);
    const recordsMap = {};

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const questionId = data.questionId || (data.question ? data.question.toLowerCase().replace(/[^a-z0-9]+/g, '-') : docSnap.id);
      recordsMap[questionId] = {
        id: docSnap.id,
        ...data,
        questionId
      };
    });

    // Merge with local records
    const local = loadSavedRecords(uid);
    const merged = { ...local, ...recordsMap };
    saveLocalSavedRecords(uid, merged);

    const solvedList = Object.keys(merged);
    saveLocalSolved(uid, solvedList);

    return merged;
  } catch (error) {
    console.warn('Firestore progress fetch note:', error.message);
    return null;
  }
};

/**
 * Syncs solved list to Firestore (kept for compatibility).
 */
export const syncSolvedToFirestore = async (uid, solvedArray) => {
  if (!uid) return;
  try {
    const docRef = doc(db, 'userProgress', uid);
    await setDoc(docRef, {
      solvedQuestions: solvedArray,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore progress sync note:', error.message);
  }
};

/**
 * Fetches solved list from Firestore (kept for compatibility).
 */
export const fetchFirestoreSolved = async (uid) => {
  if (!uid) return null;
  try {
    const docRef = doc(db, 'userProgress', uid);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (Array.isArray(data.solvedQuestions)) {
        return Array.from(new Set(data.solvedQuestions.map(id => String(id))));
      }
    }
  } catch (error) {
    console.warn('Firestore progress fetch note:', error.message);
  }
  return null;
};

/**
 * Computes solved count per company using the precomputed problem-to-companies index.
 */
export const computeCompanySolvedMap = (solvedSet, companiesSummary, problemIndex) => {
  const map = {};
  if (!solvedSet || solvedSet.size === 0 || !problemIndex || !companiesSummary) {
    return map;
  }

  solvedSet.forEach((problemId) => {
    const companyIndices = problemIndex[problemId];
    if (Array.isArray(companyIndices)) {
      for (let i = 0; i < companyIndices.length; i++) {
        const compIdx = companyIndices[i];
        const company = companiesSummary[compIdx];
        if (company) {
          map[company.slug] = (map[company.slug] || 0) + 1;
        }
      }
    }
  });

  return map;
};
