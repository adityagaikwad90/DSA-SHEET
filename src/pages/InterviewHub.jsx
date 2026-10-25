import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, BookOpen, CheckCircle, Clock, CircleDot, ChevronRight,
  Filter, Sparkles, Building2, Code2, ExternalLink, ArrowRight,
  RefreshCw, Check, Layers, Image as ImageIcon, Flame, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  loadLocalPatternProgress,
  savePatternProgressRecord,
  fetchUserPatternProgressFromFirestore,
  getPatternStatus
} from '../utils/patternProgress';
import dsaPatternsData from '../data/dsaPatternsData.json';
import interviewArchiveSummary from '../data/interviewArchiveSummary.json';
import './InterviewHub.css';

const { patterns = [], totalPatterns = 16, totalProblems = 162 } = dsaPatternsData;

const STATUS_FILTERS = [
  { id: 'all', label: 'All Patterns' },
  { id: 'not_started', label: 'Not Started' },
  { id: 'learning', label: 'In Progress' },
  { id: 'completed', label: 'Completed' }
];

const InterviewHub = ({ defaultTab = 'patterns' }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab: 'patterns' | 'java-archive'
  const tabFromQuery = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromQuery === 'archive' ? 'archive' : 'patterns');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // User learning progress state
  const [progressMap, setProgressMap] = useState({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(null);

  // Archive tab state
  const [archiveSearch, setArchiveSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(
    interviewArchiveSummary?.companies?.[0]?.name || 'google'
  );
  const [activeSolutionModal, setActiveSolutionModal] = useState(null);

  // 1. Initial Load of Progress
  useEffect(() => {
    const uid = currentUser?.uid;
    const local = loadLocalPatternProgress(uid);
    setProgressMap(local);

    if (uid) {
      fetchUserPatternProgressFromFirestore(uid).then((remote) => {
        if (remote) setProgressMap(remote);
      });
    }

    // Reactive listener for progress updates
    const handleProgressUpdate = (e) => {
      if (e.detail?.all) {
        setProgressMap(e.detail.all);
      } else if (e.detail?.patternId) {
        setProgressMap((prev) => ({
          ...prev,
          [e.detail.patternId]: e.detail.record || { status: e.detail.status }
        }));
      }
    };

    window.addEventListener('dsa-pattern-progress-updated', handleProgressUpdate);
    return () => window.removeEventListener('dsa-pattern-progress-updated', handleProgressUpdate);
  }, [currentUser]);

  // Sync tab with URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab: tab === 'archive' ? 'archive' : 'patterns' });
  };

  // Status Change Handler with quick toggle
  const handleStatusChange = async (e, patternId, newStatus) => {
    e.stopPropagation();
    setIsUpdatingStatus(patternId);
    try {
      await savePatternProgressRecord(currentUser?.uid, patternId, newStatus);
      setProgressMap((prev) => ({
        ...prev,
        [patternId]: { ...(prev[patternId] || {}), status: newStatus }
      }));
    } catch (err) {
      console.error('Failed to update pattern status:', err);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Categories list derived from patterns
  const categories = useMemo(() => {
    const set = new Set(patterns.map((p) => p.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, []);

  // Filtered patterns calculation
  const filteredPatterns = useMemo(() => {
    return patterns.filter((pattern) => {
      const status = getPatternStatus(progressMap, pattern.id);

      // Status filter
      if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && pattern.category !== selectedCategory) {
        return false;
      }

      // Search query filter (matches name, summary, category, or subproblem titles)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = pattern.title.toLowerCase().includes(query);
        const matchesSummary = pattern.summary.toLowerCase().includes(query);
        const matchesCategory = (pattern.category || '').toLowerCase().includes(query);
        const matchesProblems = pattern.problems.some((prob) =>
          prob.title.toLowerCase().includes(query)
        );

        if (!matchesName && !matchesSummary && !matchesCategory && !matchesProblems) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, statusFilter, selectedCategory, progressMap]);

  // Progress stats calculation
  const progressStats = useMemo(() => {
    let completed = 0;
    let learning = 0;
    let notStarted = 0;

    patterns.forEach((p) => {
      const status = getPatternStatus(progressMap, p.id);
      if (status === 'completed') completed++;
      else if (status === 'learning') learning++;
      else notStarted++;
    });

    const completionRate = Math.round((completed / totalPatterns) * 100) || 0;

    return { completed, learning, notStarted, completionRate };
  }, [progressMap]);

  // Archive filtered company solutions
  const companySolutionsList = useMemo(() => {
    const list = interviewArchiveSummary?.companySolutions?.[selectedCompany] || [];
    if (!archiveSearch.trim()) return list;
    const q = archiveSearch.toLowerCase();
    return list.filter((s) => s.title.toLowerCase().includes(q) || s.fileName.toLowerCase().includes(q));
  }, [selectedCompany, archiveSearch]);

  return (
    <div className="interview-hub-container">
      {/* Hero Header */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="interview-hub-hero"
      >
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Interview Mastery Center</span>
          </div>
          <h1 className="hero-title">
            Interview <span className="gradient-highlight">Hub</span>
          </h1>
          <p className="hero-subtitle">
            Master the 16 core DSA patterns asked by top tech giants and explore 500+ verified Java interview solutions.
          </p>

          {/* Quick Metrics Bar */}
          <div className="hero-metrics">
            <div className="metric-item">
              <span className="metric-number">{totalPatterns}</span>
              <span className="metric-label">Core Patterns</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-number">{totalProblems}+</span>
              <span className="metric-label">Pattern Problems</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-number">{progressStats.completed}</span>
              <span className="metric-label">Completed</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-number">{interviewArchiveSummary.totalCompanies || 15}</span>
              <span className="metric-label">Companies</span>
            </div>
          </div>
        </div>

        {/* Global Progress Progress Card */}
        <div className="hero-progress-card">
          <div className="progress-card-header">
            <div className="progress-info">
              <Award size={22} className="award-icon" />
              <div>
                <h4>Pattern Proficiency</h4>
                <p>{progressStats.completed} of {totalPatterns} Patterns Mastered</p>
              </div>
            </div>
            <span className="progress-percentage">{progressStats.completionRate}%</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progressStats.completionRate}%` }}
            />
          </div>

          <div className="progress-breakdown">
            <span className="pill-completed">
              <CheckCircle size={13} /> {progressStats.completed} Completed
            </span>
            <span className="pill-learning">
              <Clock size={13} /> {progressStats.learning} In Progress
            </span>
            <span className="pill-not-started">
              <CircleDot size={13} /> {progressStats.notStarted} Remaining
            </span>
          </div>
        </div>
      </motion.section>

      {/* Navigation Tabs */}
      <div className="hub-tabs-container">
        <button
          className={`hub-tab-btn ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => handleTabChange('patterns')}
        >
          <Layers size={18} />
          <span>DSA Patterns ({totalPatterns})</span>
        </button>

        <button
          className={`hub-tab-btn ${activeTab === 'archive' ? 'active' : ''}`}
          onClick={() => handleTabChange('archive')}
        >
          <Building2 size={18} />
          <span>Java Solutions Archive (500+)</span>
        </button>
      </div>

      {/* TAB 1: DSA PATTERNS */}
      {activeTab === 'patterns' && (
        <motion.div
          key="patterns-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="patterns-section"
        >
          {/* Controls: Search, Filter & Categories */}
          <div className="patterns-controls-bar">
            {/* Search Input */}
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patterns (e.g. Sliding Window, Two Heaps, Graphs)..."
                className="search-input"
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="status-filters-group">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  className={`status-filter-btn ${statusFilter === filter.id ? 'active' : ''}`}
                  onClick={() => setStatusFilter(filter.id)}
                >
                  {filter.label}
                  {filter.id === 'all' && ` (${totalPatterns})`}
                  {filter.id === 'completed' && ` (${progressStats.completed})`}
                  {filter.id === 'learning' && ` (${progressStats.learning})`}
                  {filter.id === 'not_started' && ` (${progressStats.notStarted})`}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          <div className="results-info-row">
            <span className="results-count">
              Showing <strong>{filteredPatterns.length}</strong> of {totalPatterns} Patterns
            </span>
            {(searchQuery || statusFilter !== 'all' || selectedCategory !== 'all') && (
              <button
                className="reset-filters-btn"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setSelectedCategory('all');
                }}
              >
                <RefreshCw size={13} /> Reset Filters
              </button>
            )}
          </div>

          {/* Patterns Grid */}
          {filteredPatterns.length > 0 ? (
            <div className="patterns-grid">
              {filteredPatterns.map((pattern, index) => {
                const status = getPatternStatus(progressMap, pattern.id);
                const hasDiagram = Boolean(pattern.coverImage);

                return (
                  <motion.div
                    key={pattern.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className={`pattern-card status-${status}`}
                    onClick={() => navigate(`/interview-hub/patterns/${pattern.slug}`)}
                  >
                    {/* Top Tag & Status */}
                    <div className="pattern-card-header">
                      <div className="pattern-number-tag">
                        Pattern {String(pattern.number).padStart(2, '0')}
                      </div>

                      {/* Interactive Learning Status Dropdown */}
                      <div className="status-dropdown-wrapper" onClick={(e) => e.stopPropagation()}>
                        <select
                          className={`status-select-badge status-${status}`}
                          value={status}
                          disabled={isUpdatingStatus === pattern.id}
                          onChange={(e) => handleStatusChange(e, pattern.id, e.target.value)}
                        >
                          <option value="not_started">⚪ Not Started</option>
                          <option value="learning">🟡 In Progress</option>
                          <option value="completed">🟢 Completed</option>
                        </select>
                      </div>
                    </div>

                    {/* Diagram Preview Thumbnail if available */}
                    {hasDiagram ? (
                      <div className="pattern-diagram-preview">
                        <img
                          src={pattern.coverImage}
                          alt={`${pattern.title} diagram`}
                          loading="lazy"
                          className="diagram-thumb"
                        />
                        <span className="diagram-badge">
                          <ImageIcon size={12} /> Diagram Included
                        </span>
                      </div>
                    ) : (
                      <div className="pattern-abstract-thumb">
                        <div className="abstract-pattern-icon">
                          <Code2 size={24} />
                        </div>
                        <span className="abstract-category-text">{pattern.category}</span>
                      </div>
                    )}

                    {/* Pattern Content */}
                    <div className="pattern-card-body">
                      <h3 className="pattern-title">{pattern.title}</h3>
                      <p className="pattern-summary">{pattern.summary}</p>
                    </div>

                    {/* Footer Info & CTA */}
                    <div className="pattern-card-footer">
                      <div className="pattern-stats-chips">
                        <span className="stat-chip">
                          <BookOpen size={13} /> {pattern.problemsCount} Problems
                        </span>
                        <span className="stat-chip time-chip">
                          <Clock size={13} /> {pattern.estimatedTime}
                        </span>
                      </div>

                      <button
                        className="open-lesson-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/interview-hub/patterns/${pattern.slug}`);
                        }}
                      >
                        <span>Start Lesson</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="patterns-empty-state">
              <div className="empty-icon-box">
                <Search size={36} />
              </div>
              <h3>No patterns match your search</h3>
              <p>Try searching with different keywords, or reset your learning status filters.</p>
              <button
                className="primary-btn"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setSelectedCategory('all');
                }}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* TAB 2: JAVA SOLUTIONS ARCHIVE (from interviews-master) */}
      {activeTab === 'archive' && (
        <motion.div
          key="archive-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="archive-section"
        >
          {/* Header Info */}
          <div className="archive-intro-box">
            <div className="archive-intro-text">
              <h3>
                <Building2 size={22} className="text-primary" /> Verified Company Java Solutions
              </h3>
              <p>
                Browse authentic Java solutions asked during technical rounds at top tech companies. Kept synchronized with your interview prep.
              </p>
            </div>
          </div>

          {/* Company Selector Pills */}
          <div className="companies-pills-scroll">
            {interviewArchiveSummary.companies?.map((comp) => (
              <button
                key={comp.name}
                className={`company-pill-btn ${selectedCompany === comp.name ? 'active' : ''}`}
                onClick={() => setSelectedCompany(comp.name)}
              >
                <span className="company-name">{comp.displayName}</span>
                <span className="company-count">{comp.solutionsCount}</span>
              </button>
            ))}
          </div>

          {/* Search within Company */}
          <div className="archive-search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              value={archiveSearch}
              onChange={(e) => setArchiveSearch(e.target.value)}
              placeholder={`Search ${selectedCompany.toUpperCase()} Java problems...`}
              className="search-input"
            />
          </div>

          {/* Solutions List */}
          <div className="company-solutions-grid">
            {companySolutionsList.length > 0 ? (
              companySolutionsList.map((sol, idx) => (
                <div key={idx} className="archive-solution-card">
                  <div className="archive-card-top">
                    <span className="company-tag">{selectedCompany.toUpperCase()}</span>
                    <span className="lines-tag">{sol.linesCount} lines</span>
                  </div>
                  <h4 className="solution-title">{sol.title}</h4>
                  <p className="solution-filename">{sol.fileName}</p>

                  <div className="archive-card-actions">
                    <button
                      className="view-code-btn"
                      onClick={() => setActiveSolutionModal(sol)}
                    >
                      <Code2 size={15} /> View Java Code
                    </button>
                    <a
                      href={`https://leetcode.com/problemset/all/?search=${encodeURIComponent(sol.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="practice-link-btn"
                      title="Practice on LeetCode"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="archive-empty-state">
                <p>No solutions matched "{archiveSearch}" for {selectedCompany}.</p>
              </div>
            )}
          </div>

          {/* Java Code Lightbox Modal */}
          {activeSolutionModal && (
            <div className="code-modal-overlay" onClick={() => setActiveSolutionModal(null)}>
              <div className="code-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="code-modal-header">
                  <div>
                    <span className="modal-company-tag">{selectedCompany.toUpperCase()} INTERVIEW</span>
                    <h3 className="modal-title">{activeSolutionModal.title}</h3>
                  </div>
                  <button
                    className="modal-close-btn"
                    onClick={() => setActiveSolutionModal(null)}
                  >
                    ×
                  </button>
                </div>
                <div className="code-modal-body">
                  <pre className="java-code-pre">
                    <code>{activeSolutionModal.code}</code>
                  </pre>
                </div>
                <div className="code-modal-footer">
                  <button
                    className="copy-code-action-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(activeSolutionModal.code);
                      alert('Java solution copied to clipboard!');
                    }}
                  >
                    <Code2 size={16} /> Copy Java Solution
                  </button>
                  <a
                    href={`https://leetcode.com/problemset/all/?search=${encodeURIComponent(activeSolutionModal.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-practice-btn"
                  >
                    Practice on LeetCode <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default InterviewHub;
