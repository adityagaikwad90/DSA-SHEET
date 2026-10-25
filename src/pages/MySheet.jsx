import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  RotateCcw,
  Pencil,
  Building2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { DSA_TOPICS, IMPORTANCE_LEVELS } from '../constants';
import {
  loadSavedRecords,
  saveQuestionProgressRecord,
  deleteQuestionProgressRecord
} from '../utils/userProgress';
import QuestionCompletionDialog from '../components/QuestionCompletionDialog';
import './MySheet.css';

const MySheet = () => {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | solved_easily | needs_practice
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit dialog state
  const [editingEntry, setEditingEntry] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState('');

  // Manual Add Form Data
  const [formData, setFormData] = useState({
    question: '',
    selectedTopics: [],
    link: '',
    notes: '',
    importance: 'Medium',
    company: '',
    difficulty: 'Medium'
  });

  // Load entries from localStorage and Firestore
  useEffect(() => {
    let isMounted = true;

    // 1. Initial synchronous load from localStorage for instant display
    const localRecords = loadSavedRecords(currentUser?.uid);
    const localList = Object.values(localRecords);
    if (localList.length > 0 && isMounted) {
      localList.sort((a, b) => new Date(b.updatedAt || b.completedAt || 0) - new Date(a.updatedAt || a.completedAt || 0));
      setEntries(localList);
      setLoading(false);
    }

    // 2. Fetch from Firestore if user is authenticated
    const fetchEntries = async () => {
      if (!currentUser) {
        if (isMounted) setLoading(false);
        return;
      }

      const timeoutId = setTimeout(() => {
        if (isMounted && loading) {
          setLoading(false);
        }
      }, 4000);

      try {
        const q = query(
          collection(db, 'progress'),
          where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const firestoreEntries = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        // Merge Firestore entries with local records map
        const mergedMap = { ...localRecords };
        firestoreEntries.forEach((entry) => {
          const qId = entry.questionId || entry.id;
          mergedMap[qId] = {
            ...mergedMap[qId],
            ...entry,
            questionId: qId
          };
        });

        const mergedList = Object.values(mergedMap);
        mergedList.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.completedAt || a.date || 0).getTime();
          const timeB = new Date(b.updatedAt || b.completedAt || b.date || 0).getTime();
          return timeB - timeA;
        });

        if (isMounted) setEntries(mergedList);
      } catch (error) {
        console.warn('Error fetching Firestore progress:', error.message);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setLoading(false);
      }
    };

    fetchEntries();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Synchronize across components via custom event without full page reloads
  useEffect(() => {
    const handleProgressUpdate = (e) => {
      if (e.detail?.record) {
        setEntries((prevEntries) => {
          const updatedRecord = e.detail.record;
          const index = prevEntries.findIndex(
            (item) => (item.questionId || item.id) === (updatedRecord.questionId || updatedRecord.id)
          );
          if (index !== -1) {
            const next = [...prevEntries];
            next[index] = { ...next[index], ...updatedRecord };
            return next;
          }
          return [updatedRecord, ...prevEntries];
        });
      } else if (e.detail?.deleted) {
        setEntries((prevEntries) =>
          prevEntries.filter((item) => (item.questionId || item.id) !== e.detail.questionId)
        );
      }
    };

    window.addEventListener('dsa-progress-updated', handleProgressUpdate);
    return () => window.removeEventListener('dsa-progress-updated', handleProgressUpdate);
  }, []);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Status filter
      if (statusFilter === 'solved_easily' && entry.status !== 'solved_easily') return false;
      if (statusFilter === 'needs_practice' && entry.status !== 'needs_practice') return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const titleMatch = (entry.title || entry.question || '').toLowerCase().includes(q);
        const notesMatch = (entry.notes || '').toLowerCase().includes(q);
        const companyMatch = (entry.company || '').toLowerCase().includes(q);
        const diffMatch = (entry.difficulty || '').toLowerCase().includes(q);
        const topicMatch = Array.isArray(entry.topics) && entry.topics.some((t) => t.toLowerCase().includes(q));
        return titleMatch || notesMatch || companyMatch || diffMatch || topicMatch;
      }

      return true;
    });
  }, [entries, statusFilter, searchTerm]);

  // Status counts for filters
  const counts = useMemo(() => {
    const total = entries.length;
    const solvedEasily = entries.filter((e) => e.status === 'solved_easily').length;
    const needsPractice = entries.filter((e) => e.status === 'needs_practice').length;
    return { total, solvedEasily, needsPractice };
  }, [entries]);

  // Topic changes for manual add form
  const handleTopicChange = (e) => {
    const topic = e.target.value;
    if (topic && !formData.selectedTopics.includes(topic)) {
      setFormData({
        ...formData,
        selectedTopics: [...formData.selectedTopics, topic]
      });
    }
    e.target.value = '';
  };

  const removeTopic = (topicToRemove) => {
    setFormData({
      ...formData,
      selectedTopics: formData.selectedTopics.filter((t) => t !== topicToRemove)
    });
  };

  // Submit manual add form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question) {
      alert('Please enter a question name.');
      return;
    }

    const questionId = formData.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newRecordData = {
      id: questionId,
      questionId,
      title: formData.question,
      question: formData.question,
      link: formData.link,
      url: formData.link,
      topics: formData.selectedTopics,
      notes: formData.notes,
      company: formData.company || 'General',
      difficulty: formData.difficulty || 'Medium'
    };

    try {
      const saved = await saveQuestionProgressRecord(
        currentUser?.uid,
        newRecordData,
        'solved_easily',
        formData.notes
      );

      setEntries((prev) => [saved, ...prev]);
      setFormData({
        question: '',
        selectedTopics: [],
        link: '',
        notes: '',
        importance: 'Medium',
        company: '',
        difficulty: 'Medium'
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving manual question:', error);
      alert('Failed to save question.');
    }
  };

  // Delete question
  const handleDelete = async (entry) => {
    const questionTitle = entry.title || entry.question || 'this question';
    if (!window.confirm(`Are you sure you want to remove "${questionTitle}" from your sheet?`)) return;

    const qId = entry.questionId || entry.id;
    try {
      await deleteQuestionProgressRecord(currentUser?.uid, qId);
      setEntries((prev) => prev.filter((item) => (item.questionId || item.id) !== qId));
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question.');
    }
  };

  // Open Edit Dialog
  const handleEdit = (entry) => {
    setEditingEntry({
      id: entry.questionId || entry.id,
      questionId: entry.questionId || entry.id,
      title: entry.title || entry.question,
      question: entry.title || entry.question,
      link: entry.url || entry.link,
      url: entry.url || entry.link,
      company: entry.company,
      difficulty: entry.difficulty,
      topics: entry.topics,
      status: entry.status,
      notes: entry.notes,
      completedAt: entry.completedAt
    });
    setEditErrorMessage('');
  };

  // Save changes from Edit Dialog
  const handleSaveEdit = async (status, notes) => {
    if (!editingEntry) return;
    setIsSavingEdit(true);
    setEditErrorMessage('');

    try {
      const updated = await saveQuestionProgressRecord(
        currentUser?.uid,
        editingEntry,
        status,
        notes
      );

      setEntries((prev) =>
        prev.map((item) =>
          (item.questionId || item.id) === (editingEntry.questionId || editingEntry.id)
            ? { ...item, ...updated }
            : item
        )
      );

      setIsSavingEdit(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Failed to update question progress:', error);
      setEditErrorMessage(error.message || 'Failed to update. Please try again.');
      setIsSavingEdit(false);
    }
  };

  // Format date helper
  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="mysheet-container">
      {/* Header */}
      <div className="mysheet-header">
        <div className="mysheet-header-badge">
          <Sparkles size={14} className="sparkle-icon" />
          <span>Personal Revision Bank</span>
        </div>
        <h1 className="mysheet-title">My Personal Sheet</h1>
        <p className="mysheet-subtitle">
          Your customized collection of solved questions, key learning notes, and revision priorities
        </p>

        {/* Overview Stats */}
        <div className="mysheet-stats-overview">
          <div className="overview-card">
            <span className="overview-num">{counts.total}</span>
            <span className="overview-label">Total Saved</span>
          </div>
          <div className="overview-divider" />
          <div className="overview-card">
            <span className="overview-num stat-solved-num">{counts.solvedEasily}</span>
            <span className="overview-label">Solved Easily</span>
          </div>
          <div className="overview-divider" />
          <div className="overview-card">
            <span className="overview-num stat-practice-num">{counts.needsPractice}</span>
            <span className="overview-label">Needs Practice</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Tabs */}
      <div className="mysheet-controls-wrapper">
        <div className="mysheet-tabs-bar">
          <button
            className={`mysheet-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Saved Questions
            <span className="tab-pill">{counts.total}</span>
          </button>
          <button
            className={`mysheet-tab tab-solved ${statusFilter === 'solved_easily' ? 'active' : ''}`}
            onClick={() => setStatusFilter('solved_easily')}
          >
            <CheckCircle2 size={14} />
            Solved Easily
            <span className="tab-pill">{counts.solvedEasily}</span>
          </button>
          <button
            className={`mysheet-tab tab-practice ${statusFilter === 'needs_practice' ? 'active' : ''}`}
            onClick={() => setStatusFilter('needs_practice')}
          >
            <RotateCcw size={14} />
            Needs Practice
            <span className="tab-pill">{counts.needsPractice}</span>
          </button>
        </div>

        <div className="mysheet-controls-row">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by title, notes, company, topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                ×
              </button>
            )}
          </div>

          <button
            className="btn-add-question"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={16} /> Add Custom Question
          </button>
        </div>
      </div>

      {/* Optional Manual Add Question Form */}
      {showAddForm && (
        <form className="add-question-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Question Title *</label>
              <input
                type="text"
                placeholder="e.g. Two Sum"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Problem URL</label>
              <input
                type="url"
                placeholder="https://leetcode.com/problems/..."
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Company (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Google, Amazon"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Topics</label>
            <select onChange={handleTopicChange} defaultValue="">
              <option value="" disabled>Select Topic...</option>
              {DSA_TOPICS.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
            <div className="selected-topics">
              {formData.selectedTopics.map((topic) => (
                <span key={topic} className="topic-chip">
                  {topic}
                  <button type="button" onClick={() => removeTopic(topic)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Learning Notes</label>
            <textarea
              placeholder="What approach or key observation did you learn?"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Save to Sheet
            </button>
          </div>
        </form>
      )}

      {/* Sheet Content Listing */}
      <div className="sheet-content">
        {loading ? (
          <div className="mysheet-loading">
            <div className="loading-spinner" />
            <p>Loading your saved questions...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty-state">
            <Layers size={36} className="empty-icon" />
            <h3>No questions found</h3>
            <p>
              {searchTerm
                ? 'No questions matched your search query.'
                : statusFilter === 'needs_practice'
                ? 'No questions currently marked as Needs Practice. Keep up the great work!'
                : statusFilter === 'solved_easily'
                ? 'No questions marked as Solved Easily yet.'
                : 'Your sheet is empty. Solve questions in Code Arena and save your notes here!'}
            </p>
          </div>
        ) : (
          <div className="mysheet-table-container">
            <table className="mysheet-table">
              <thead>
                <tr>
                  <th className="th-problem">Problem</th>
                  <th className="th-company">Company & Difficulty</th>
                  <th className="th-status">Status</th>
                  <th className="th-notes">Learning Notes</th>
                  <th className="th-date">Completed</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const title = entry.title || entry.question;
                  const problemUrl = entry.url || entry.link;
                  const company = entry.company || 'General';
                  const difficulty = entry.difficulty || 'Medium';
                  const isNeedsPractice = entry.status === 'needs_practice';

                  return (
                    <tr key={entry.id || entry.questionId} className={`entry-row ${isNeedsPractice ? 'row-practice' : ''}`}>
                      {/* Problem Title & Link */}
                      <td className="col-problem">
                        <div className="problem-title-text" title={title}>
                          {title}
                        </div>
                        {problemUrl && (
                          <a
                            href={problemUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="problem-link"
                          >
                            <ExternalLink size={12} /> LeetCode
                          </a>
                        )}
                      </td>

                      {/* Company & Difficulty */}
                      <td className="col-company">
                        <div className="company-diff-wrapper">
                          <span className="company-badge-pill" title={`Company: ${company}`}>
                            <Building2 size={12} /> {company}
                          </span>
                          <span className={`diff-badge diff-${difficulty.toLowerCase()}`}>
                            {difficulty}
                          </span>
                        </div>
                      </td>

                      {/* Status: Solved Easily or Needs Practice */}
                      <td className="col-status">
                        {isNeedsPractice ? (
                          <span className="status-chip chip-practice">
                            <RotateCcw size={12} /> Needs Practice
                          </span>
                        ) : (
                          <span className="status-chip chip-solved">
                            <CheckCircle2 size={12} /> Solved Easily
                          </span>
                        )}
                      </td>

                      {/* Saved Learning Notes */}
                      <td className="col-notes">
                        {entry.notes ? (
                          <div className="notes-content-box" title={entry.notes}>
                            {entry.notes}
                          </div>
                        ) : (
                          <span className="no-notes-text">No notes added</span>
                        )}
                      </td>

                      {/* Completion Date */}
                      <td className="col-date">
                        <div className="date-text">
                          <Calendar size={12} className="calendar-icon" />
                          <span>{formatDate(entry.completedAt || entry.date)}</span>
                        </div>
                      </td>

                      {/* Actions: Edit Notes/Status & Delete */}
                      <td className="col-actions">
                        <div className="actions-button-group">
                          <button
                            type="button"
                            className="btn-action btn-action-edit"
                            onClick={() => handleEdit(entry)}
                            title="Edit notes & status"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-delete"
                            onClick={() => handleDelete(entry)}
                            title="Remove from sheet"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Completion Dialog */}
      <QuestionCompletionDialog
        isOpen={Boolean(editingEntry)}
        question={editingEntry}
        existingRecord={editingEntry}
        onSave={handleSaveEdit}
        onClose={() => setEditingEntry(null)}
        isSaving={isSavingEdit}
        errorMessage={editErrorMessage}
      />
    </div>
  );
};

export default MySheet;
