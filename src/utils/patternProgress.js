import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const getPatternStorageKey = (uid) => `dsa-pattern-progress-${uid || 'guest'}`;

export const VALID_STATUSES = ['not_started', 'learning', 'completed'];

/**
 * Loads the dictionary of pattern progress from localStorage.
 * Format: { [patternId]: { patternId, status: 'not_started' | 'learning' | 'completed', updatedAt: string } }
 */
export const loadLocalPatternProgress = (uid) => {
  try {
    const key = getPatternStorageKey(uid);
    const saved = localStorage.getItem(key);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    console.error('Failed to load pattern progress from localStorage:', error);
    return {};
  }
};

/**
 * Saves the dictionary of pattern progress to localStorage.
 */
export const saveLocalPatternProgress = (uid, progressMap) => {
  try {
    const key = getPatternStorageKey(uid);
    localStorage.setItem(key, JSON.stringify(progressMap));
  } catch (error) {
    console.error('Failed to save pattern progress to localStorage:', error);
  }
};

/**
 * Gets the status for a given pattern ID. Defaults to 'not_started'.
 */
export const getPatternStatus = (progressMap, patternId) => {
  if (!progressMap || !patternId) return 'not_started';
  return progressMap[patternId]?.status || 'not_started';
};

/**
 * Saves or updates the progress status for a pattern in both localStorage and Firestore (if authenticated).
 * Valid statuses: 'not_started' | 'learning' | 'completed'
 */
export const savePatternProgressRecord = async (uid, patternId, newStatus) => {
  const userId = uid || 'guest';
  const status = VALID_STATUSES.includes(newStatus) ? newStatus : 'not_started';
  const nowIso = new Date().toISOString();

  // Load current local progress
  const currentProgress = loadLocalPatternProgress(userId);

  const prevRecord = currentProgress[patternId];
  const updatedRecord = {
    patternId,
    status,
    startedAt: prevRecord?.startedAt || (status !== 'not_started' ? nowIso : null),
    completedAt: status === 'completed' ? (prevRecord?.completedAt || nowIso) : null,
    updatedAt: nowIso
  };

  currentProgress[patternId] = updatedRecord;
  saveLocalPatternProgress(userId, currentProgress);

  // Dispatch custom event for cross-component reactive updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('dsa-pattern-progress-updated', {
        detail: { patternId, status, record: updatedRecord, all: currentProgress }
      })
    );
  }

  // If user is authenticated, sync to Firestore
  if (uid) {
    try {
      const docRef = doc(db, 'pattern_progress', uid);
      await setDoc(docRef, {
        patterns: currentProgress,
        lastUpdatedPattern: patternId,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore pattern progress sync warning:', error.message);
    }
  }

  return updatedRecord;
};

/**
 * Fetches pattern progress from Firestore for an authenticated user and merges with local storage.
 */
export const fetchUserPatternProgressFromFirestore = async (uid) => {
  if (!uid) return null;
  try {
    const docRef = doc(db, 'pattern_progress', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const firestorePatterns = data?.patterns || {};

      // Merge with localStorage
      const local = loadLocalPatternProgress(uid);
      const merged = { ...local, ...firestorePatterns };
      saveLocalPatternProgress(uid, merged);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dsa-pattern-progress-updated', {
            detail: { all: merged }
          })
        );
      }

      return merged;
    }
  } catch (error) {
    console.warn('Failed to fetch pattern progress from Firestore:', error.message);
  }
  return null;
};
