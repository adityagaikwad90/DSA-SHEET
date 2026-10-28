import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, BookOpen, CheckCircle, Clock, CircleDot, ChevronRight,
  Filter, Sparkles, Building2, Code2, ExternalLink, ArrowRight,
  RefreshCw, Check, Layers, Flame, Award, Cpu, Globe, Network,
  Activity, Database, Server, HardDrive, Terminal, SlidersHorizontal,
  Copy, ShieldAlert, Zap, ArrowUpRight, CheckCircle2, ChevronDown
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
import systemDesignData from '../data/systemDesignData.json';
import networkingData from '../data/networkingData.json';
import dsaCoreData from '../data/dsaCoreData.json';
import './InterviewHub.css';

const { patterns = [], totalPatterns = 16, totalProblems = 162 } = dsaPatternsData;

const STATUS_FILTERS = [
  { id: 'all', label: 'All Patterns' },
  { id: 'not_started', label: 'Not Started' },
  { id: 'learning', label: 'In Progress' },
  { id: 'completed', label: 'Completed' }
];

const HUB_TABS = [
  { id: 'dsa', label: 'DSA & Patterns', icon: Layers, badge: `${totalPatterns} Patterns` },
  { id: 'system-design', label: 'System Design', icon: Cpu, badge: 'Awesome Guide' },
  { id: 'networking', label: 'Networking', icon: Globe, badge: '7-Layer OSI' },
  { id: 'archive', label: 'Company Archive', icon: Building2, badge: '500+ Solutions' }
];

const InterviewHub = ({ defaultTab = 'dsa' }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Main Hub Tab
  const tabFromQuery = searchParams.get('tab');
  const getInitialTab = () => {
    if (tabFromQuery === 'archive' || tabFromQuery === 'patterns') return tabFromQuery === 'patterns' ? 'dsa' : 'archive';
    if (['dsa', 'system-design', 'networking', 'archive'].includes(tabFromQuery)) return tabFromQuery;
    return defaultTab === 'patterns' ? 'dsa' : defaultTab;
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // 1. DSA Tab Sub-view ('patterns' | 'data-structures' | 'algorithms')
  const [dsaSubView, setDsaSubView] = useState('patterns');
  const [dsaSearchQuery, setDsaSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // User learning progress state
  const [progressMap, setProgressMap] = useState({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(null);

  // 2. System Design Tab state
  const [sysCategory, setSysCategory] = useState('all');
  const [sysSearch, setSysSearch] = useState('');
  const [sysDifficulty, setSysDifficulty] = useState('all');
  const [activeCodeModal, setActiveCodeModal] = useState(null);

  // 3. Networking Tab state
  const [activeOsiLayer, setActiveOsiLayer] = useState(7);
  const [networkSearch, setNetworkSearch] = useState('');

  // 4. Archive Tab state
  const [archiveSearch, setArchiveSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(
    interviewArchiveSummary?.companies?.[0]?.name || 'google'
  );
  const [activeSolutionModal, setActiveSolutionModal] = useState(null);

  // Initial Load of Pattern Progress
  useEffect(() => {
    const uid = currentUser?.uid;
    const local = loadLocalPatternProgress(uid);
    setProgressMap(local);

    if (uid) {
      fetchUserPatternProgressFromFirestore(uid).then((remote) => {
        if (remote) setProgressMap(remote);
      });
    }

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

  // Tab change handler
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Status Change Handler
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

  // Filtered patterns
  const filteredPatterns = useMemo(() => {
    return patterns.filter((pattern) => {
      const status = getPatternStatus(progressMap, pattern.id);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (selectedCategory !== 'all' && pattern.category !== selectedCategory) return false;

      if (dsaSearchQuery.trim()) {
        const query = dsaSearchQuery.toLowerCase().trim();
        const matchesName = pattern.title.toLowerCase().includes(query);
        const matchesSummary = pattern.summary.toLowerCase().includes(query);
        const matchesCategory = (pattern.category || '').toLowerCase().includes(query);
        const matchesProblems = pattern.problems.some((prob) =>
          prob.title.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesSummary && !matchesCategory && !matchesProblems) return false;
      }
      return true;
    });
  }, [dsaSearchQuery, statusFilter, selectedCategory, progressMap]);

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

  // Filtered Company solutions
  const companySolutionsList = useMemo(() => {
    const list = interviewArchiveSummary?.companySolutions?.[selectedCompany] || [];
    if (!archiveSearch.trim()) return list;
    const q = archiveSearch.toLowerCase();
    return list.filter((s) => s.title.toLowerCase().includes(q) || s.fileName.toLowerCase().includes(q));
  }, [selectedCompany, archiveSearch]);

  // Filtered System Design Problems
  const filteredSysProblems = useMemo(() => {
    let list = systemDesignData.interviewProblems || [];
    if (sysDifficulty !== 'all') {
      list = list.filter((p) => p.difficulty.toLowerCase() === sysDifficulty.toLowerCase());
    }
    if (sysSearch.trim()) {
      const q = sysSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.topics.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [sysDifficulty, sysSearch]);

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
            <span>Complete Engineering Interview Suite</span>
          </div>
          <h1 className="hero-title">
            Interview <span className="gradient-highlight">Mastery Hub</span>
          </h1>
          <p className="hero-subtitle">
            Your end-to-end technical interview roadmap: 16 core DSA patterns, high-scale System Design architectures, Computer Networking fundamentals, and 500+ verified FAANG company solutions.
          </p>

          {/* Quick Metrics Bar */}
          <div className="hero-metrics">
            <div className="metric-item">
              <span className="metric-number">{totalPatterns}</span>
              <span className="metric-label">DSA Patterns</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-number">25+</span>
              <span className="metric-label">System Design</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-number">7</span>
              <span className="metric-label">OSI Layers</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-number">{interviewArchiveSummary.totalCompanies || 15}</span>
              <span className="metric-label">Companies</span>
            </div>
          </div>
        </div>

        {/* Global Progress Card */}
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

      {/* Main Hub Tabs Navigation */}
      <div className="hub-tabs-container">
        {HUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`hub-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              <span className="tab-pill-badge">{tab.badge}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          SECTION 1: DATA STRUCTURES & ALGORITHMS (DSA & PATTERNS)
          ========================================================================= */}
      {activeTab === 'dsa' && (
        <motion.div
          key="dsa-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="patterns-section"
        >
          {/* Sub-view Switcher Bar */}
          <div className="dsa-subview-bar">
            <div className="subview-buttons">
              <button
                className={`subview-btn ${dsaSubView === 'patterns' ? 'active' : ''}`}
                onClick={() => setDsaSubView('patterns')}
              >
                <Layers size={15} />
                <span>16 Coding Patterns ({totalPatterns})</span>
              </button>
              <button
                className={`subview-btn ${dsaSubView === 'data-structures' ? 'active' : ''}`}
                onClick={() => setDsaSubView('data-structures')}
              >
                <Database size={15} />
                <span>Data Structures Mastery ({dsaCoreData.dataStructures.length})</span>
              </button>
              <button
                className={`subview-btn ${dsaSubView === 'algorithms' ? 'active' : ''}`}
                onClick={() => setDsaSubView('algorithms')}
              >
                <Zap size={15} />
                <span>Core Algorithms ({dsaCoreData.coreAlgorithms.length})</span>
              </button>
            </div>
          </div>

          {/* Subview 1A: 16 Coding Patterns */}
          {dsaSubView === 'patterns' && (
            <>
              {/* Controls: Search, Status & Categories */}
              <div className="patterns-controls-bar">
                <div className="search-box">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    value={dsaSearchQuery}
                    onChange={(e) => setDsaSearchQuery(e.target.value)}
                    placeholder="Search patterns (e.g. Sliding Window, Two Heaps, Graphs)..."
                    className="search-input"
                  />
                  {dsaSearchQuery && (
                    <button
                      className="search-clear-btn"
                      onClick={() => setDsaSearchQuery('')}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="status-filters-group">
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setStatusFilter(f.id)}
                      className={`status-filter-btn ${statusFilter === f.id ? 'active' : ''}`}
                    >
                      {f.label}
                      {f.id === 'all' && ` (${totalPatterns})`}
                      {f.id === 'completed' && ` (${progressStats.completed})`}
                      {f.id === 'learning' && ` (${progressStats.learning})`}
                      {f.id === 'not_started' && ` (${progressStats.notStarted})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter Ribbon */}
              <div className="category-filters-ribbon">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`cat-filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                  >
                    {cat === 'all' ? 'All Categories' : cat}
                  </button>
                ))}
              </div>

              {/* Results Summary Row */}
              <div className="results-info-row">
                <span className="results-count">
                  Showing <strong>{filteredPatterns.length}</strong> of {totalPatterns} Patterns
                </span>
                {(dsaSearchQuery || statusFilter !== 'all' || selectedCategory !== 'all') && (
                  <button
                    className="reset-filters-btn"
                    onClick={() => {
                      setDsaSearchQuery('');
                      setStatusFilter('all');
                      setSelectedCategory('all');
                    }}
                  >
                    <RefreshCw size={13} /> Reset Filters
                  </button>
                )}
              </div>

              {/* Patterns 3-Column / 4-Column Grid */}
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
                        transition={{ duration: 0.25, delay: index * 0.02 }}
                        className={`pattern-card status-${status}`}
                        onClick={() => navigate(`/interview-hub/patterns/${pattern.slug || pattern.id}`)}
                      >
                        <div className="pattern-card-header">
                          <div className="pattern-number-tag">
                            Pattern {String(pattern.number).padStart(2, '0')}
                          </div>
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

                        {hasDiagram ? (
                          <div className="pattern-diagram-preview">
                            <img
                              src={pattern.coverImage}
                              alt={`${pattern.title} diagram`}
                              loading="lazy"
                              className="diagram-thumb"
                            />
                            <span className="diagram-badge">
                              <Code2 size={12} /> Diagram Included
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

                        <div className="pattern-card-body">
                          <h3 className="pattern-title">{pattern.title}</h3>
                          <p className="pattern-summary">{pattern.summary}</p>
                        </div>

                        <div className="pattern-card-footer">
                          <div className="pattern-stats-chips">
                            <span className="stat-chip">
                              <BookOpen size={13} /> {pattern.problemsCount} Problems
                            </span>
                            <span className="stat-chip time-chip">
                              <Clock size={13} /> {pattern.estimatedTime || '~2h'}
                            </span>
                          </div>

                          <button
                            className="open-lesson-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/interview-hub/patterns/${pattern.slug || pattern.id}`);
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
                <div className="patterns-empty-state">
                  <div className="empty-icon-box">
                    <Search size={36} />
                  </div>
                  <h3>No patterns match your search</h3>
                  <p>Try searching with different keywords, or reset your learning status filters.</p>
                  <button
                    className="primary-btn"
                    onClick={() => {
                      setDsaSearchQuery('');
                      setStatusFilter('all');
                      setSelectedCategory('all');
                    }}
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </>
          )}

          {/* Subview 1B: Data Structures Roadmap (from interviews) */}
          {dsaSubView === 'data-structures' && (
            <div className="dsa-core-grid">
              {dsaCoreData.dataStructures.map((ds) => (
                <div key={ds.id} className="dsa-core-card">
                  <div className="core-card-header">
                    <span className="core-category-pill">{ds.category}</span>
                    <h3 className="core-card-title">{ds.name}</h3>
                  </div>
                  <p className="core-card-desc">{ds.summary}</p>

                  <div className="complexity-grid">
                    <div className="comp-cell">
                      <span className="comp-label">Access</span>
                      <span className="comp-val">{ds.complexity.access}</span>
                    </div>
                    <div className="comp-cell">
                      <span className="comp-label">Search</span>
                      <span className="comp-val">{ds.complexity.search}</span>
                    </div>
                    <div className="comp-cell">
                      <span className="comp-label">Insert</span>
                      <span className="comp-val highlight">{ds.complexity.insert}</span>
                    </div>
                    <div className="comp-cell">
                      <span className="comp-label">Remove</span>
                      <span className="comp-val highlight">{ds.complexity.remove}</span>
                    </div>
                  </div>

                  <div className="core-insights-box">
                    <span className="insights-heading">KEY INTERVIEW INSIGHTS:</span>
                    <ul>
                      {ds.keyInterviewInsights.map((ins, iIdx) => (
                        <li key={iIdx}>{ins}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subview 1C: Core Algorithms (from interviews) */}
          {dsaSubView === 'algorithms' && (
            <div className="algorithms-grid">
              {dsaCoreData.coreAlgorithms.map((algo) => (
                <div key={algo.id} className="algorithm-card">
                  <div className="algo-card-top">
                    <span className="algo-type-tag">{algo.type}</span>
                    {algo.stable !== undefined && (
                      <span className={`stable-tag ${algo.stable ? 'is-stable' : 'is-unstable'}`}>
                        {algo.stable ? 'Stable Sort' : 'Unstable Sort'}
                      </span>
                    )}
                  </div>
                  <h3 className="algo-title">{algo.name}</h3>
                  <p className="algo-summary">{algo.summary}</p>

                  <div className="complexity-grid algo-comp">
                    <div className="comp-cell">
                      <span className="comp-label">Best Time</span>
                      <span className="comp-val highlight">{algo.timeBest}</span>
                    </div>
                    <div className="comp-cell">
                      <span className="comp-label">Avg Time</span>
                      <span className="comp-val">{algo.timeAvg}</span>
                    </div>
                    <div className="comp-cell">
                      <span className="comp-label">Worst Time</span>
                      <span className="comp-val">{algo.timeWorst}</span>
                    </div>
                    <div className="comp-cell">
                      <span className="comp-label">Aux Space</span>
                      <span className="comp-val">{algo.space}</span>
                    </div>
                  </div>

                  <div className="algo-notes-box">
                    <strong>Architectural Note:</strong> {algo.notes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* =========================================================================
          SECTION 2: SYSTEM DESIGN MASTERY (From awesome-system-design-resources)
          ========================================================================= */}
      {activeTab === 'system-design' && (
        <motion.div
          key="system-design-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="system-design-hub"
        >
          {/* Framework Banner */}
          <div className="framework-hero-card">
            <div className="framework-header">
              <div className="framework-badge">
                <Sparkles size={15} />
                <span>Interview Blueprint</span>
              </div>
              <h2 className="framework-title">{systemDesignData.framework.title}</h2>
              <p className="framework-subtitle">
                Master this structured 4-step blueprint during your technical architecture interviews to ensure clarity, thoroughness, and seniority signals.
              </p>
            </div>

            <div className="framework-steps-grid">
              {systemDesignData.framework.steps.map((st) => (
                <div key={st.step} className="framework-step-card">
                  <span className="step-num-badge">STEP 0{st.step}</span>
                  <h4 className="step-title">{st.title}</h4>
                  <p className="step-desc">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Controls & Filter Bar */}
          <div className="sys-controls-bar">
            <div className="sys-category-pills">
              {[
                { id: 'all', label: 'All Resources' },
                { id: 'core', label: '⚙️ Core Concepts' },
                { id: 'databases', label: '🗄️ Databases' },
                { id: 'caching', label: '⚡ Caching & CDN' },
                { id: 'async', label: '🔄 Async & Queues' },
                { id: 'problems', label: '💻 Classic Problems' },
                { id: 'case-studies', label: '📜 Engineering Reads' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSysCategory(c.id)}
                  className={`sys-pill-btn ${sysCategory === c.id ? 'active' : ''}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2A: Core Architectural Concepts */}
          {(sysCategory === 'all' || sysCategory === 'core') && (
            <section className="sys-section-block">
              <div className="section-title-wrap">
                <Cpu size={20} className="section-icon text-teal" />
                <h3>Core Distributed Architecture Concepts</h3>
              </div>
              <div className="sys-concepts-grid">
                {systemDesignData.coreConcepts.map((item) => (
                  <div key={item.id} className="sys-concept-card">
                    <div className="concept-card-top">
                      <span className="concept-badge">{item.badge}</span>
                      {item.hasCode && (
                        <button
                          onClick={() =>
                            setActiveCodeModal({
                              title: `${item.title} - Implementation`,
                              code: item.codeSnippet,
                              lang: 'python'
                            })
                          }
                          className="code-preview-pill"
                        >
                          <Code2 size={13} /> View Code
                        </button>
                      )}
                    </div>
                    <h4 className="concept-title">{item.title}</h4>
                    <p className="concept-summary">{item.summary}</p>
                    <p className="concept-details">{item.details}</p>

                    <div className="concept-key-points">
                      {item.keyPoints.map((kp, idx) => (
                        <div key={idx} className="kp-row">
                          <CheckCircle2 size={14} className="kp-check" />
                          <span>{kp}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="concept-external-link"
                    >
                      <span>Deep Dive Article</span>
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2B: Database & Storage Fundamentals */}
          {(sysCategory === 'all' || sysCategory === 'databases') && (
            <section className="sys-section-block">
              <div className="section-title-wrap">
                <Database size={20} className="section-icon text-amber" />
                <h3>Database Scaling & Storage Architectures</h3>
              </div>
              <div className="sys-concepts-grid">
                {systemDesignData.databaseFundamentals.map((item) => (
                  <div key={item.id} className="sys-concept-card">
                    <span className="concept-badge db-badge">{item.category}</span>
                    <h4 className="concept-title">{item.title}</h4>
                    <p className="concept-summary">{item.summary}</p>
                    <p className="concept-details">{item.details}</p>

                    <div className="concept-key-points">
                      {item.keyPoints.map((kp, idx) => (
                        <div key={idx} className="kp-row">
                          <CheckCircle2 size={14} className="kp-check" />
                          <span>{kp}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="concept-external-link"
                    >
                      <span>Read Guide</span>
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2C: Caching & Content Delivery */}
          {(sysCategory === 'all' || sysCategory === 'caching') && (
            <section className="sys-section-block">
              <div className="section-title-wrap">
                <Zap size={20} className="section-icon text-cyan" />
                <h3>Caching Fundamentals & Global CDNs</h3>
              </div>
              <div className="sys-concepts-grid">
                {systemDesignData.cachingFundamentals.map((item) => (
                  <div key={item.id} className="sys-concept-card">
                    <span className="concept-badge cache-badge">{item.category}</span>
                    <h4 className="concept-title">{item.title}</h4>
                    <p className="concept-summary">{item.summary}</p>
                    <p className="concept-details">{item.details}</p>

                    <div className="concept-key-points">
                      {item.keyPoints.map((kp, idx) => (
                        <div key={idx} className="kp-row">
                          <CheckCircle2 size={14} className="kp-check" />
                          <span>{kp}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="concept-external-link"
                    >
                      <span>Read Guide</span>
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2D: Async, Queues & Microservices */}
          {(sysCategory === 'all' || sysCategory === 'async') && (
            <section className="sys-section-block">
              <div className="section-title-wrap">
                <Server size={20} className="section-icon text-purple" />
                <h3>Asynchronous Systems & Microservice Resilience</h3>
              </div>
              <div className="sys-concepts-grid">
                {systemDesignData.asyncAndMicroservices.map((item) => (
                  <div key={item.id} className="sys-concept-card">
                    <div className="concept-card-top">
                      <span className="concept-badge async-badge">{item.category}</span>
                      {item.hasCode && (
                        <button
                          onClick={() =>
                            setActiveCodeModal({
                              title: `${item.title} - Implementation`,
                              code: item.codeSnippet,
                              lang: 'python'
                            })
                          }
                          className="code-preview-pill"
                        >
                          <Code2 size={13} /> View Code
                        </button>
                      )}
                    </div>
                    <h4 className="concept-title">{item.title}</h4>
                    <p className="concept-summary">{item.summary}</p>
                    <p className="concept-details">{item.details}</p>

                    <div className="concept-key-points">
                      {item.keyPoints.map((kp, idx) => (
                        <div key={idx} className="kp-row">
                          <CheckCircle2 size={14} className="kp-check" />
                          <span>{kp}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="concept-external-link"
                    >
                      <span>Read Guide</span>
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2E: Classic System Design Interview Problems */}
          {(sysCategory === 'all' || sysCategory === 'problems') && (
            <section className="sys-section-block">
              <div className="section-title-wrap">
                <Layers size={20} className="section-icon text-orange" />
                <h3>Classic System Design Problems Library</h3>
              </div>

              {/* Problem Difficulty Filter */}
              <div className="problem-difficulty-filter">
                {['all', 'Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSysDifficulty(diff)}
                    className={`diff-filter-btn ${sysDifficulty === diff ? 'active' : ''}`}
                  >
                    {diff === 'all' ? 'All Difficulties' : diff}
                  </button>
                ))}
              </div>

              <div className="sys-problems-grid">
                {filteredSysProblems.map((prob) => (
                  <div key={prob.id} className="sys-problem-card">
                    <div className="problem-top-row">
                      <span className={`diff-pill diff-${prob.difficulty.toLowerCase()}`}>
                        {prob.difficulty}
                      </span>
                      <span className="scale-metric">Scale: {prob.scale.split(',')[0]}</span>
                    </div>

                    <h4 className="problem-title">{prob.title}</h4>
                    <p className="problem-desc">{prob.description}</p>

                    <div className="problem-topics-wrap">
                      {prob.topics.map((t, idx) => (
                        <span key={idx} className="topic-tag">{t}</span>
                      ))}
                    </div>

                    <div className="key-components-box">
                      <span className="components-label">KEY ARCHITECTURE BLOCKS:</span>
                      <ul>
                        {prob.keyComponents.map((kc, idx) => (
                          <li key={idx}>{kc}</li>
                        ))}
                      </ul>
                    </div>

                    <a
                      href={prob.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="design-solution-btn"
                    >
                      <span>Study System Architecture</span>
                      <ArrowUpRight size={15} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2F: Must-Read Real-World Engineering Case Studies */}
          {(sysCategory === 'all' || sysCategory === 'case-studies') && (
            <section className="sys-section-block">
              <div className="section-title-wrap">
                <BookOpen size={20} className="section-icon text-teal" />
                <h3>Must-Read Production Engineering Case Studies</h3>
              </div>

              <div className="engineering-articles-grid">
                {systemDesignData.mustReadEngineering.map((art, idx) => (
                  <a
                    key={idx}
                    href={art.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="engineering-article-card"
                  >
                    <div className="article-company-badge">{art.company}</div>
                    <h4 className="article-title">{art.title}</h4>
                    <p className="article-desc">{art.desc}</p>
                    <span className="read-article-action">
                      Read Engineering Blog <ExternalLink size={13} />
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Code Viewer Modal */}
          {activeCodeModal && (
            <div className="code-modal-overlay" onClick={() => setActiveCodeModal(null)}>
              <div className="code-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="code-modal-header">
                  <div>
                    <span className="modal-company-tag">SYSTEM DESIGN ALGORITHM</span>
                    <h3 className="modal-title">{activeCodeModal.title}</h3>
                  </div>
                  <button className="modal-close-btn" onClick={() => setActiveCodeModal(null)}>
                    ×
                  </button>
                </div>
                <div className="code-modal-body">
                  <pre className="java-code-pre">
                    <code>{activeCodeModal.code}</code>
                  </pre>
                </div>
                <div className="code-modal-footer">
                  <button
                    className="copy-code-action-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(activeCodeModal.code);
                      alert('Code copied to clipboard!');
                    }}
                  >
                    <Copy size={16} /> Copy Implementation
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* =========================================================================
          SECTION 3: COMPUTER NETWORKING MASTERY
          ========================================================================= */}
      {activeTab === 'networking' && (
        <motion.div
          key="networking-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="networking-hub"
        >
          {/* 3A: Interactive 7-Layer OSI Model */}
          <section className="network-section-block">
            <div className="section-title-wrap">
              <Network size={20} className="section-icon text-cyan" />
              <h3>The 7-Layer OSI Model vs TCP/IP Stack</h3>
            </div>
            <p className="section-intro">
              Click any layer to inspect its Packet Data Unit (PDU), foundational protocols, and exact role in network traversal.
            </p>

            <div className="osi-interactive-layout">
              {/* Left: Layer Selector Stack */}
              <div className="osi-stack-column">
                {networkingData.osiLayers.map((layer) => {
                  const isSelected = activeOsiLayer === layer.layer;
                  return (
                    <button
                      key={layer.layer}
                      onClick={() => setActiveOsiLayer(layer.layer)}
                      className={`osi-layer-pill ${isSelected ? 'active' : ''}`}
                    >
                      <span className="osi-layer-num">L{layer.layer}</span>
                      <span className="osi-layer-name">{layer.name}</span>
                      <span className="osi-pdu-badge">{layer.pdu}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right: Selected Layer Deep Dive Card */}
              <div className="osi-detail-card">
                {(() => {
                  const layer = networkingData.osiLayers.find((l) => l.layer === activeOsiLayer);
                  if (!layer) return null;
                  return (
                    <div>
                      <div className="osi-card-top">
                        <span className="osi-layer-badge">LAYER {layer.layer}</span>
                        <h2 className="osi-card-title">{layer.name} Layer</h2>
                        <span className="osi-pdu-large">PDU: {layer.pdu}</span>
                      </div>

                      <p className="osi-card-summary">{layer.summary}</p>
                      <p className="osi-card-details">{layer.details}</p>

                      <div className="osi-protocols-box">
                        <span className="protocols-title">PRIMARY PROTOCOLS:</span>
                        <div className="protocols-tags">
                          {layer.protocols.map((p, idx) => (
                            <span key={idx} className="proto-pill">{p}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* 3B: Transport Layer Arena (TCP vs UDP) */}
          <section className="network-section-block">
            <div className="section-title-wrap">
              <Activity size={20} className="section-icon text-purple" />
              <h3>Transport Layer: TCP vs UDP Deep Dive</h3>
            </div>

            <div className="tcp-udp-comparison-grid">
              {/* TCP Card */}
              <div className="protocol-arena-card tcp-card">
                <div className="arena-card-header">
                  <span className="proto-name">TCP</span>
                  <span className="proto-sub">Connection-Oriented & Reliable</span>
                </div>
                <ul className="proto-features-list">
                  {networkingData.transportProtocols[0].tcp.features.map((f, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={15} className="feature-check text-teal" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* UDP Card */}
              <div className="protocol-arena-card udp-card">
                <div className="arena-card-header">
                  <span className="proto-name">UDP</span>
                  <span className="proto-sub">Connectionless & Ultra-Fast</span>
                </div>
                <ul className="proto-features-list">
                  {networkingData.transportProtocols[0].udp.features.map((f, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={15} className="feature-check text-amber" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Handshake & Termination Flow */}
            <div className="handshake-flow-card">
              <h4 className="flow-card-title">TCP 3-Way Handshake & 4-Way Termination</h4>
              <div className="handshake-steps-columns">
                <div className="flow-step-col">
                  <span className="flow-col-heading">ESTABLISHMENT (3-Way):</span>
                  <ol>
                    {networkingData.transportProtocols[1].handshakeSteps.map((st, idx) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ol>
                </div>
                <div className="flow-step-col">
                  <span className="flow-col-heading">TERMINATION (4-Way):</span>
                  <ol>
                    {networkingData.transportProtocols[1].terminationSteps.map((st, idx) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </section>

          {/* 3C: DNS Resolution Journey */}
          <section className="network-section-block">
            <div className="section-title-wrap">
              <Globe size={20} className="section-icon text-teal" />
              <h3>The Step-by-Step DNS Resolution Process</h3>
            </div>
            <p className="section-intro">{networkingData.dnsJourney.summary}</p>

            <div className="dns-steps-timeline">
              {networkingData.dnsJourney.steps.map((st) => (
                <div key={st.step} className="dns-step-card">
                  <div className="dns-step-num">{st.step}</div>
                  <h4 className="dns-step-name">{st.name}</h4>
                  <p className="dns-step-desc">{st.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 3D: Web Protocols & Real-Time Communication */}
          <section className="network-section-block">
            <div className="section-title-wrap">
              <Zap size={20} className="section-icon text-amber" />
              <h3>Web Protocols (HTTP/1.1 vs HTTP/2 vs HTTP/3) & Real-time APIs</h3>
            </div>

            {/* HTTP Evolution Cards */}
            <div className="http-versions-grid">
              {networkingData.webProtocols[0].items.map((it, idx) => (
                <div key={idx} className="http-version-card">
                  <span className="http-badge">{it.version.split(' ')[0]}</span>
                  <h4 className="http-ver-title">{it.version}</h4>
                  <p className="http-ver-desc">{it.details}</p>
                </div>
              ))}
            </div>

            {/* Real-Time Communication Table */}
            <div className="realtime-table-card">
              <h4 className="table-title">Real-Time Web Mechanisms: Polling vs SSE vs WebSockets</h4>
              <div className="realtime-table-wrap">
                <table className="realtime-table">
                  <thead>
                    <tr>
                      <th>Technology</th>
                      <th>Mechanism</th>
                      <th>Overhead</th>
                      <th>Ideal Use Case</th>
                    </tr>
                  </thead>
                  <tbody>
                    {networkingData.webProtocols[2].comparisons.map((c, idx) => (
                      <tr key={idx}>
                        <td className="tech-col"><strong>{c.tech}</strong></td>
                        <td>{c.mechanism}</td>
                        <td className="overhead-col">{c.overhead}</td>
                        <td>{c.useCase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 3E: Proxies & Load Balancing */}
          <section className="network-section-block">
            <div className="section-title-wrap">
              <Server size={20} className="section-icon text-cyan" />
              <h3>Proxies & Load Balancing Architecture</h3>
            </div>

            <div className="proxies-grid">
              {networkingData.proxiesAndLoadBalancing.slice(0, 2).map((item) => (
                <div key={item.id} className="proxy-card">
                  <span className="concept-badge">{item.badge}</span>
                  <h4 className="proxy-title">{item.title}</h4>
                  <p className="proxy-summary">{item.summary}</p>
                  <p className="proxy-details">{item.details}</p>
                </div>
              ))}
            </div>

            {/* Load Balancing Algorithms */}
            <div className="lb-algorithms-box">
              <h4 className="box-title">Core Load Balancing Algorithms</h4>
              <div className="algorithms-subgrid">
                {networkingData.proxiesAndLoadBalancing[2].algorithms.map((algo, idx) => (
                  <div key={idx} className="lb-algo-card">
                    <span className="algo-name">{algo.name}</span>
                    <p className="algo-desc">{algo.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </motion.div>
      )}

      {/* =========================================================================
          SECTION 4: COMPANY SOLUTIONS ARCHIVE (From interviews)
          ========================================================================= */}
      {activeTab === 'archive' && (
        <motion.div
          key="archive-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="archive-section"
        >
          {/* Company Selector Ribbon */}
          <div className="companies-pills-scroll">
            {interviewArchiveSummary.companies.map((comp) => {
              const isSelected = selectedCompany === comp.name;
              return (
                <button
                  key={comp.name}
                  className={`company-pill-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedCompany(comp.name)}
                >
                  <span>{comp.displayName}</span>
                  <span className="company-count">{comp.solutionsCount}</span>
                </button>
              );
            })}
          </div>

          {/* Search bar inside company */}
          <div className="archive-controls-row">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                placeholder={`Search ${selectedCompany.toUpperCase()} solutions (e.g. Two Sum, LRU Cache, Binary Search)...`}
                className="search-input"
              />
              {archiveSearch && (
                <button
                  className="search-clear-btn"
                  onClick={() => setArchiveSearch('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <span className="archive-results-count">
              Showing <strong>{companySolutionsList.length}</strong> solutions for <strong>{selectedCompany.toUpperCase()}</strong>
            </span>
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
