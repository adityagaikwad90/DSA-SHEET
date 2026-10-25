import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Search,
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Code2,
  Sparkles,
  Trophy,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Layers,
  Zap,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Check,
  AlertCircle
} from 'lucide-react';
import { triggerRewardCelebration } from '../utils/celebration';
import {
  loadLocalSolved,
  saveLocalSolved,
  loadSavedRecords,
  saveQuestionProgressRecord,
  fetchUserProgressRecordsFromFirestore,
  fetchFirestoreSolved,
  computeCompanySolvedMap
} from '../utils/userProgress';
import {
  getCompaniesSummary,
  fetchProblemCompaniesIndex,
  fetchCompanyQuestions,
  getStaticTopRepeatedQuestions,
  fetchTopRepeatedQuestions
} from '../utils/companyDataLoader';
import QuestionCompletionDialog from '../components/QuestionCompletionDialog';
import MostRepeatedSection from '../components/MostRepeatedSection';
import './Questions.css';

// Brand colors for top tech companies
const COMPANY_ACCENTS = {
  google: { bg: 'rgba(66, 133, 244, 0.15)', border: 'rgba(66, 133, 244, 0.35)', color: '#60a5fa' },
  amazon: { bg: 'rgba(255, 153, 0, 0.15)', border: 'rgba(255, 153, 0, 0.35)', color: '#fb923c' },
  meta: { bg: 'rgba(6, 104, 225, 0.15)', border: 'rgba(6, 104, 225, 0.35)', color: '#38bdf8' },
  microsoft: { bg: 'rgba(0, 164, 239, 0.15)', border: 'rgba(0, 164, 239, 0.35)', color: '#38bdf8' },
  apple: { bg: 'rgba(255, 255, 255, 0.12)', border: 'rgba(255, 255, 255, 0.25)', color: '#e2e8f0' },
  netflix: { bg: 'rgba(229, 9, 20, 0.15)', border: 'rgba(229, 9, 20, 0.35)', color: '#f87171' },
  uber: { bg: 'rgba(255, 255, 255, 0.1)', border: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' },
  bloomberg: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)', color: '#fbbf24' },
  adobe: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.35)', color: '#f87171' },
  salesforce: { bg: 'rgba(0, 161, 224, 0.15)', border: 'rgba(0, 161, 224, 0.35)', color: '#38bdf8' },
  oracle: { bg: 'rgba(248, 0, 0, 0.15)', border: 'rgba(248, 0, 0, 0.35)', color: '#f87171' },
  linkedin: { bg: 'rgba(10, 102, 194, 0.15)', border: 'rgba(10, 102, 194, 0.35)', color: '#60a5fa' },
  spotify: { bg: 'rgba(29, 185, 84, 0.15)', border: 'rgba(29, 185, 84, 0.35)', color: '#4ade80' },
  stripe: { bg: 'rgba(99, 91, 255, 0.15)', border: 'rgba(99, 91, 255, 0.35)', color: '#a78bfa' },
  tcs: { bg: 'rgba(0, 130, 202, 0.15)', border: 'rgba(0, 130, 202, 0.35)', color: '#38bdf8' },
  flipkart: { bg: 'rgba(40, 116, 240, 0.15)', border: 'rgba(40, 116, 240, 0.35)', color: '#60a5fa' },
  swiggy: { bg: 'rgba(252, 128, 25, 0.15)', border: 'rgba(252, 128, 25, 0.35)', color: '#fb923c' },
  zomato: { bg: 'rgba(203, 32, 45, 0.15)', border: 'rgba(203, 32, 45, 0.35)', color: '#f87171' }
};

// Generates 2-letter initials for company
function getInitials(name) {
  if (!name) return 'DS';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Subtle background particles
const Particles = () => {
  return (
    <div className="particles-container" aria-hidden="true">
      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          className="particle"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * -120],
            opacity: [0, 0.35, 0],
          }}
          transition={{
            duration: Math.random() * 12 + 14,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

const Questions = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const activeCompanySlug = searchParams.get('company') || '';

  const isTop100Path = location.pathname === '/top-100';
  const activeSectionParam = searchParams.get('section') || searchParams.get('tab') || '';
  const [activeTab, setActiveTab] = useState(() => {
    if (isTop100Path || activeSectionParam === 'most-repeated' || activeSectionParam === 'top-100') {
      return 'repeated';
    }
    return 'companies';
  });

  // Top 100 Most Repeated questions dataset
  const [top100Questions, setTop100Questions] = useState(() => getStaticTopRepeatedQuestions());

  useEffect(() => {
    fetchTopRepeatedQuestions().then((data) => {
      if (data && data.length > 0) setTop100Questions(data);
    });
  }, []);

  // Synchronize activeTab with URL params or route
  useEffect(() => {
    if (isTop100Path || activeSectionParam === 'most-repeated' || activeSectionParam === 'top-100') {
      setActiveTab('repeated');
    } else if (activeSectionParam === 'companies' || (!activeSectionParam && !isTop100Path)) {
      setActiveTab('companies');
    }
  }, [isTop100Path, activeSectionParam]);

  const handleTabSwitch = (newTab) => {
    setActiveTab(newTab);
    const newParams = new URLSearchParams(searchParams);
    if (newTab === 'repeated') {
      newParams.set('section', 'most-repeated');
      newParams.delete('company');
    } else {
      newParams.delete('section');
      newParams.delete('tab');
    }
    setSearchParams(newParams);
  };

  // Data sets
  const companiesSummary = useMemo(() => getCompaniesSummary(), []);
  const [problemIndex, setProblemIndex] = useState({});

  useEffect(() => {
    fetchProblemCompaniesIndex().then((idx) => {
      if (idx) setProblemIndex(idx);
    });
  }, []);

  // Solved state and Saved Question Records dictionary
  const [solvedQuestions, setSolvedQuestions] = useState(() => {
    return loadLocalSolved(currentUser?.uid);
  });
  const [savedRecords, setSavedRecords] = useState(() => {
    return loadSavedRecords(currentUser?.uid);
  });

  // Dialog State
  const [activeDialogQuestion, setActiveDialogQuestion] = useState(null);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [dialogErrorMessage, setDialogErrorMessage] = useState('');

  // Selected company full dataset
  const [currentCompanyData, setCurrentCompanyData] = useState(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [companyLoadError, setCompanyLoadError] = useState(null);

  // Filters for Company List View
  const [companySearch, setCompanySearch] = useState('');
  const [companyCategoryFilter, setCompanyCategoryFilter] = useState('all'); // all | featured | in-progress | completed | unattempted
  const [companySortBy, setCompanySortBy] = useState('questions'); // questions | name | solved | progress
  const [visibleCompanyCount, setVisibleCompanyCount] = useState(36);

  // Filters for Question Detail View
  const [difficultyFilter, setDifficultyFilter] = useState('All'); // All | Easy | Medium | Hard
  const [questionSearch, setQuestionSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | unsolved | solved | solved_easily | needs_practice
  const [questionSortBy, setQuestionSortBy] = useState('frequency'); // frequency | difficulty | title
  const [visibleQuestionsCount, setVisibleQuestionsCount] = useState(40);

  const listTopRef = useRef(null);

  // Sync solved status and records when user changes or from Firestore
  useEffect(() => {
    const local = loadLocalSolved(currentUser?.uid);
    setSolvedQuestions(local);

    const localRecs = loadSavedRecords(currentUser?.uid);
    setSavedRecords(localRecs);

    if (currentUser?.uid) {
      fetchUserProgressRecordsFromFirestore(currentUser.uid).then((records) => {
        if (records) {
          setSavedRecords(records);
          setSolvedQuestions(Object.keys(records));
        }
      });
    }
  }, [currentUser]);

  // Synchronize across components via custom event
  useEffect(() => {
    const handleProgressUpdate = (e) => {
      if (e.detail?.record) {
        setSavedRecords((prev) => ({
          ...prev,
          [e.detail.questionId]: e.detail.record
        }));
        setSolvedQuestions((prev) => {
          if (!prev.includes(e.detail.questionId)) {
            return [...prev, e.detail.questionId];
          }
          return prev;
        });
      } else if (e.detail?.deleted) {
        setSavedRecords((prev) => {
          const next = { ...prev };
          delete next[e.detail.questionId];
          return next;
        });
        setSolvedQuestions((prev) => prev.filter((id) => id !== e.detail.questionId));
      }
    };

    window.addEventListener('dsa-progress-updated', handleProgressUpdate);
    return () => window.removeEventListener('dsa-progress-updated', handleProgressUpdate);
  }, []);

  // Solved question set for O(1) lookups
  const solvedSet = useMemo(() => new Set(solvedQuestions), [solvedQuestions]);

  // Compute solved counts per company using the precomputed problem index
  const companySolvedMap = useMemo(() => {
    return computeCompanySolvedMap(solvedSet, companiesSummary, problemIndex);
  }, [solvedSet, companiesSummary, problemIndex]);

  // Load selected company data whenever activeCompanySlug changes
  useEffect(() => {
    if (!activeCompanySlug) {
      setCurrentCompanyData(null);
      setCompanyLoadError(null);
      return;
    }

    let isMounted = true;
    setIsLoadingCompany(true);
    setCompanyLoadError(null);
    setVisibleQuestionsCount(40);
    setQuestionSearch('');
    setDifficultyFilter('All');
    setStatusFilter('all');

    fetchCompanyQuestions(activeCompanySlug)
      .then((data) => {
        if (isMounted) {
          setCurrentCompanyData(data);
          setIsLoadingCompany(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setCompanyLoadError(err.message || 'Failed to load company problems');
          setIsLoadingCompany(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeCompanySlug]);

  // Dialog Interaction Handlers
  const handleOpenCompletionDialog = (question) => {
    setActiveDialogQuestion({
      ...question,
      company: question.company || currentCompanyData?.displayName || activeCompanySlug || 'Top 100 Most Repeated'
    });
    setDialogErrorMessage('');
  };

  const handleCloseDialog = () => {
    if (isSavingProgress) return;
    setActiveDialogQuestion(null);
    setDialogErrorMessage('');
  };

  const handleSaveProgress = async (status, notes) => {
    if (!activeDialogQuestion) return;
    setIsSavingProgress(true);
    setDialogErrorMessage('');

    try {
      const updatedRecord = await saveQuestionProgressRecord(
        currentUser?.uid,
        activeDialogQuestion,
        status,
        notes
      );

      setSavedRecords((prev) => ({
        ...prev,
        [activeDialogQuestion.id]: updatedRecord
      }));

      setSolvedQuestions((prev) => {
        if (!prev.includes(activeDialogQuestion.id)) {
          return [...prev, activeDialogQuestion.id];
        }
        return prev;
      });

      // Celebration effect when marked as Solved Easily
      if (status === 'solved_easily') {
        triggerRewardCelebration(window.innerWidth / 2, window.innerHeight * 0.4);
      }

      setIsSavingProgress(false);
      setActiveDialogQuestion(null);
    } catch (error) {
      console.error('Failed to save progress:', error);
      setDialogErrorMessage(error.message || 'Failed to save progress. Please try again.');
      setIsSavingProgress(false);
    }
  };

  // Select a company
  const handleSelectCompany = (slug) => {
    setSearchParams({ company: slug });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to company list
  const handleBackToCompanies = () => {
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Total problems solved across all companies
  const totalSolvedUnique = solvedQuestions.length;

  // Filtered and sorted companies for the selection view
  const filteredCompanies = useMemo(() => {
    let list = [...companiesSummary];

    // Search query
    if (companySearch.trim()) {
      const q = companySearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.slug.includes(q)
      );
    }

    // Category Filter
    if (companyCategoryFilter === 'featured') {
      list = list.filter((c) => c.featured);
    } else if (companyCategoryFilter === 'in-progress') {
      list = list.filter((c) => {
        const solved = companySolvedMap[c.slug] || 0;
        return solved > 0 && solved < c.total;
      });
    } else if (companyCategoryFilter === 'completed') {
      list = list.filter((c) => {
        const solved = companySolvedMap[c.slug] || 0;
        return solved >= c.total && c.total > 0;
      });
    } else if (companyCategoryFilter === 'unattempted') {
      list = list.filter((c) => {
        const solved = companySolvedMap[c.slug] || 0;
        return solved === 0;
      });
    }

    // Sorting
    list.sort((a, b) => {
      const solvedA = companySolvedMap[a.slug] || 0;
      const solvedB = companySolvedMap[b.slug] || 0;
      const progressA = a.total > 0 ? solvedA / a.total : 0;
      const progressB = b.total > 0 ? solvedB / b.total : 0;

      if (companySortBy === 'questions') {
        if (b.total !== a.total) return b.total - a.total;
        return a.displayName.localeCompare(b.displayName);
      }
      if (companySortBy === 'name') {
        return a.displayName.localeCompare(b.displayName);
      }
      if (companySortBy === 'solved') {
        if (solvedB !== solvedA) return solvedB - solvedA;
        return b.total - a.total;
      }
      if (companySortBy === 'progress') {
        if (progressB !== progressA) return progressB - progressA;
        return b.total - a.total;
      }
      return 0;
    });

    return list;
  }, [companiesSummary, companySearch, companyCategoryFilter, companySortBy, companySolvedMap]);

  // Questions filtering and sorting for active company view
  const filteredQuestions = useMemo(() => {
    if (!currentCompanyData || !currentCompanyData.questions) return [];

    let list = [...currentCompanyData.questions];

    // Difficulty filter
    if (difficultyFilter !== 'All') {
      list = list.filter((q) => q.difficulty.toLowerCase() === difficultyFilter.toLowerCase());
    }

    // Status filter
    if (statusFilter === 'solved') {
      list = list.filter((q) => Boolean(savedRecords[q.id]));
    } else if (statusFilter === 'unsolved') {
      list = list.filter((q) => !savedRecords[q.id]);
    } else if (statusFilter === 'solved_easily') {
      list = list.filter((q) => savedRecords[q.id]?.status === 'solved_easily');
    } else if (statusFilter === 'needs_practice') {
      list = list.filter((q) => savedRecords[q.id]?.status === 'needs_practice');
    }

    // Text search
    if (questionSearch.trim()) {
      const q = questionSearch.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.topics.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sorting
    const diffWeights = { Easy: 1, Medium: 2, Hard: 3 };
    list.sort((a, b) => {
      if (questionSortBy === 'frequency') {
        if (b.frequency !== a.frequency) return b.frequency - a.frequency;
        return diffWeights[a.difficulty] - diffWeights[b.difficulty];
      }
      if (questionSortBy === 'difficulty-asc') {
        if (diffWeights[a.difficulty] !== diffWeights[b.difficulty]) {
          return diffWeights[a.difficulty] - diffWeights[b.difficulty];
        }
        return b.frequency - a.frequency;
      }
      if (questionSortBy === 'difficulty-desc') {
        if (diffWeights[b.difficulty] !== diffWeights[a.difficulty]) {
          return diffWeights[b.difficulty] - diffWeights[a.difficulty];
        }
        return b.frequency - a.frequency;
      }
      if (questionSortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }, [currentCompanyData, difficultyFilter, statusFilter, questionSearch, questionSortBy, solvedSet, savedRecords]);

  // Current company question counts and solved counts
  const companyStats = useMemo(() => {
    if (!currentCompanyData || !currentCompanyData.questions) {
      return { total: 0, solved: 0, easyTotal: 0, easySolved: 0, medTotal: 0, medSolved: 0, hardTotal: 0, hardSolved: 0 };
    }
    const questions = currentCompanyData.questions;
    let solved = 0;
    let easyTotal = 0;
    let easySolved = 0;
    let medTotal = 0;
    let medSolved = 0;
    let hardTotal = 0;
    let hardSolved = 0;

    for (const q of questions) {
      const isSolved = solvedSet.has(q.id);
      if (isSolved) solved++;

      if (q.difficulty === 'Easy') {
        easyTotal++;
        if (isSolved) easySolved++;
      } else if (q.difficulty === 'Medium') {
        medTotal++;
        if (isSolved) medSolved++;
      } else if (q.difficulty === 'Hard') {
        hardTotal++;
        if (isSolved) hardSolved++;
      }
    }

    return {
      total: questions.length,
      solved,
      easyTotal,
      easySolved,
      medTotal,
      medSolved,
      hardTotal,
      hardSolved
    };
  }, [currentCompanyData, solvedSet]);

  return (
    <div className="questions-container">
      <Particles />

      {/* Main View: Either Company Selection or Company Problem List */}
      <AnimatePresence mode="wait">
        {!activeCompanySlug ? (
          // ==========================================
          // 1. COMPANY SELECTION INTERFACE
          // ==========================================
          <motion.div
            key="company-list-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            {/* Page Header */}
            <header className="questions-header">
              <div className="header-badge">
                <Sparkles size={14} className="sparkle-icon" />
                <span>Interview Preparation Arena</span>
              </div>
              <h1 className="questions-title">Company-Wise DSA</h1>
              <p className="questions-subtitle">
                Explore real LeetCode interview questions asked by top tech giants,
                organized by frequency and difficulty with live progress tracking.
              </p>

              {/* Global Quick Stats */}
              <div className="global-stats-bar">
                <div className="stat-item">
                  <div className="stat-icon-wrap stat-icon-companies">
                    <Building2 size={18} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{companiesSummary.length}</span>
                    <span className="stat-label">Companies</span>
                  </div>
                </div>

                <div className="stat-divider" />

                <div className="stat-item">
                  <div className="stat-icon-wrap stat-icon-questions">
                    <Layers size={18} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">3,396+</span>
                    <span className="stat-label">Curated Problems</span>
                  </div>
                </div>

                <div className="stat-divider" />

                <div className="stat-item">
                  <div className="stat-icon-wrap stat-icon-solved">
                    <Trophy size={18} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{totalSolvedUnique}</span>
                    <span className="stat-label">Problems Solved</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Arena Mode Switcher: Company-Wise vs Most Repeated Questions */}
            <div className="arena-mode-nav" role="tablist">
              <button
                role="tab"
                id="arena-tab-companies"
                aria-selected={activeTab === 'companies'}
                className={`arena-tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('companies')}
              >
                <Building2 size={16} />
                <span className="tab-label-full">Company-Wise DSA</span>
                <span className="tab-label-short">Company-Wise</span>
                <span className="arena-tab-count">{companiesSummary.length}</span>
              </button>

              <button
                role="tab"
                id="arena-tab-repeated"
                aria-selected={activeTab === 'repeated'}
                className={`arena-tab-btn arena-tab-repeated ${activeTab === 'repeated' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('repeated')}
              >
                <Flame size={16} className="tab-flame-icon" />
                <span className="tab-label-full">Most Repeated Questions</span>
                <span className="tab-label-short">Most Repeated</span>
                <span className="arena-tab-pill">Top 100</span>
              </button>
            </div>

            {/* Render either Most Repeated Section or Company Selection Grid */}
            {activeTab === 'repeated' ? (
              <MostRepeatedSection
                topQuestions={top100Questions}
                solvedQuestions={solvedQuestions}
                savedRecords={savedRecords}
                onOpenCompletionDialog={handleOpenCompletionDialog}
              />
            ) : (
              <>
                {/* Teaser banner to Top 100 */}
                <div
                  className="top-repeated-teaser-banner"
                  onClick={() => handleTabSwitch('repeated')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="teaser-banner-left">
                    <div className="teaser-icon-box">
                      <Flame size={22} />
                    </div>
                    <div className="teaser-text">
                      <strong>Looking for the highest-yield interview questions?</strong>
                      <span>Explore the Top 100 most repeated problems across 420+ tech companies ranked by company breadth.</span>
                    </div>
                  </div>
                  <button className="teaser-action-btn" type="button">
                    Explore Top 100
                    <ChevronRight size={15} />
                  </button>
                </div>

                {/* Filter and Search Controls */}
                <div className="company-controls-section">
              <div className="search-filter-row">
                <div className="company-search-box">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => {
                      setCompanySearch(e.target.value);
                      setVisibleCompanyCount(36);
                    }}
                    placeholder="Search 420+ companies (e.g. Google, Amazon, Meta, TCS)..."
                    className="company-search-input"
                  />
                  {companySearch && (
                    <button
                      className="clear-search-btn"
                      onClick={() => setCompanySearch('')}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="sort-selector-box">
                  <SlidersHorizontal size={16} className="sort-icon" />
                  <select
                    value={companySortBy}
                    onChange={(e) => setCompanySortBy(e.target.value)}
                    className="company-sort-select"
                  >
                    <option value="questions">Sort: Most Questions</option>
                    <option value="name">Sort: Alphabetical (A-Z)</option>
                    <option value="solved">Sort: Most Solved</option>
                    <option value="progress">Sort: Highest Progress</option>
                  </select>
                </div>
              </div>

              {/* Category Pills */}
              <div className="category-pills-row">
                {[
                  { id: 'all', label: 'All Companies', count: companiesSummary.length },
                  { id: 'featured', label: 'Top Tech / FAANG', count: companiesSummary.filter(c => c.featured).length },
                  { id: 'in-progress', label: 'In Progress' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'unattempted', label: 'Unattempted' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    className={`category-pill ${companyCategoryFilter === cat.id ? 'active' : ''}`}
                    onClick={() => {
                      setCompanyCategoryFilter(cat.id);
                      setVisibleCompanyCount(36);
                    }}
                  >
                    <span>{cat.label}</span>
                    {typeof cat.count === 'number' && (
                      <span className="pill-count">{cat.count}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Companies Grid */}
            {filteredCompanies.length === 0 ? (
              <div className="empty-state-card">
                <AlertCircle size={40} className="empty-icon" />
                <h3>No companies found</h3>
                <p>Try refining your search keyword or selecting a different filter.</p>
                <button
                  className="reset-filters-btn"
                  onClick={() => {
                    setCompanySearch('');
                    setCompanyCategoryFilter('all');
                  }}
                >
                  <RotateCcw size={15} /> Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="company-results-meta">
                  <span>Showing {Math.min(visibleCompanyCount, filteredCompanies.length)} of {filteredCompanies.length} companies</span>
                </div>

                <div className="companies-grid">
                  {filteredCompanies.slice(0, visibleCompanyCount).map((company, index) => {
                    const solved = companySolvedMap[company.slug] || 0;
                    const percent = company.total > 0 ? Math.round((solved / company.total) * 100) : 0;
                    const accent = COMPANY_ACCENTS[company.slug] || null;

                    return (
                      <motion.div
                        key={company.slug}
                        className={`company-card ${solved > 0 ? 'has-progress' : ''}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.2) }}
                        whileHover={{ y: -4 }}
                        onClick={() => handleSelectCompany(company.slug)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectCompany(company.slug);
                          }
                        }}
                      >
                        {/* Card Top */}
                        <div className="company-card-top">
                          <div
                            className="company-avatar"
                            style={{
                              background: accent ? accent.bg : 'rgba(0, 184, 163, 0.12)',
                              borderColor: accent ? accent.border : 'rgba(0, 184, 163, 0.25)',
                              color: accent ? accent.color : 'var(--color-primary)'
                            }}
                          >
                            {getInitials(company.displayName)}
                          </div>

                          <div className="company-card-title-wrap">
                            <div className="company-title-row">
                              <h3 className="company-card-name">{company.displayName}</h3>
                              {company.featured && (
                                <span className="featured-chip">Featured</span>
                              )}
                            </div>
                            <span className="company-total-q">
                              {company.total} {company.total === 1 ? 'Question' : 'Questions'}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="company-card-progress-section">
                          <div className="progress-labels-row">
                            <span className="progress-solved-text">
                              {solved} / {company.total} Solved
                            </span>
                            <span className="progress-percent-text">{percent}%</span>
                          </div>
                          <div className="company-progress-track">
                            <motion.div
                              className="company-progress-fill"
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.6 }}
                            />
                          </div>
                        </div>

                        {/* Difficulty Count Pills */}
                        <div className="company-diff-row">
                          <span className="diff-pill diff-pill-easy" title="Easy Questions">
                            <span className="diff-dot easy-dot" /> {company.easy} Easy
                          </span>
                          <span className="diff-pill diff-pill-medium" title="Medium Questions">
                            <span className="diff-dot med-dot" /> {company.medium} Med
                          </span>
                          <span className="diff-pill diff-pill-hard" title="Hard Questions">
                            <span className="diff-dot hard-dot" /> {company.hard} Hard
                          </span>
                        </div>

                        {/* Card Action Hint */}
                        <div className="company-card-footer">
                          <span className="view-questions-text">
                            Practice Questions <ChevronRight size={14} />
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Load More Companies Button */}
                {visibleCompanyCount < filteredCompanies.length && (
                  <div className="load-more-container">
                    <button
                      className="load-more-btn"
                      onClick={() => setVisibleCompanyCount((prev) => prev + 36)}
                    >
                      Load More Companies ({filteredCompanies.length - visibleCompanyCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
              </>
            )}
          </motion.div>
        ) : (
          // ==========================================
          // 2. COMPANY DETAIL & PROBLEM LIST VIEW
          // ==========================================
          <motion.div
            key="company-detail-view"
            className="company-detail-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            ref={listTopRef}
          >
            {/* Top Back Navigation Bar */}
            <div className="detail-top-nav">
              <button
                className="back-btn"
                onClick={handleBackToCompanies}
                aria-label="Back to company selection"
              >
                <ArrowLeft size={16} />
                <span>All Companies</span>
              </button>
              <div className="detail-breadcrumbs">
                <span className="breadcrumb-sub">Code Arena</span>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-active">
                  {currentCompanyData?.displayName || activeCompanySlug}
                </span>
              </div>
            </div>

            {/* Loading State */}
            {isLoadingCompany && (
              <div className="company-loading-card">
                <div className="loading-spinner" />
                <h3>Loading questions for {activeCompanySlug}...</h3>
                <p>Retrieving curated interview dataset and frequency stats</p>
              </div>
            )}

            {/* Error State */}
            {!isLoadingCompany && companyLoadError && (
              <div className="company-error-card">
                <AlertCircle size={38} className="error-icon" />
                <h3>Failed to load questions</h3>
                <p>{companyLoadError}</p>
                <button
                  className="retry-btn"
                  onClick={() => {
                    setIsLoadingCompany(true);
                    setCompanyLoadError(null);
                    fetchCompanyQuestions(activeCompanySlug)
                      .then((d) => {
                        setCurrentCompanyData(d);
                        setIsLoadingCompany(false);
                      })
                      .catch((e) => {
                        setCompanyLoadError(e.message);
                        setIsLoadingCompany(false);
                      });
                  }}
                >
                  <RotateCcw size={15} /> Retry
                </button>
              </div>
            )}

            {/* Loaded Content */}
            {!isLoadingCompany && !companyLoadError && currentCompanyData && (
              <>
                {/* Company Banner Header */}
                <div className="company-detail-banner">
                  <div className="banner-left">
                    <div
                      className="company-banner-avatar"
                      style={{
                        background: COMPANY_ACCENTS[activeCompanySlug]?.bg || 'rgba(0, 184, 163, 0.15)',
                        borderColor: COMPANY_ACCENTS[activeCompanySlug]?.border || 'rgba(0, 184, 163, 0.3)',
                        color: COMPANY_ACCENTS[activeCompanySlug]?.color || 'var(--color-primary)'
                      }}
                    >
                      {getInitials(currentCompanyData.displayName)}
                    </div>
                    <div>
                      <div className="banner-title-row">
                        <h1 className="banner-company-title">
                          {currentCompanyData.displayName}
                        </h1>
                        {currentCompanyData.featured && (
                          <span className="featured-chip">Featured Company</span>
                        )}
                      </div>
                      <p className="banner-company-desc">
                        {currentCompanyData.total} curated interview questions asked during technical rounds
                      </p>
                    </div>
                  </div>

                  {/* Company Solved Stats Progress */}
                  <div className="banner-right">
                    <div className="banner-progress-stats">
                      <div className="progress-stat-pill">
                        <span className="stat-num">{companyStats.solved}</span>
                        <span className="stat-sub">/ {companyStats.total} Solved</span>
                      </div>
                      <div className="stat-percent-badge">
                        {companyStats.total > 0
                          ? Math.round((companyStats.solved / companyStats.total) * 100)
                          : 0}
                        % Complete
                      </div>
                    </div>

                    <div className="banner-progress-track">
                      <motion.div
                        className="banner-progress-fill"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            companyStats.total > 0
                              ? (companyStats.solved / companyStats.total) * 100
                              : 0
                          }%`
                        }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Difficulty Segmented Tabs */}
                <div className="difficulty-tabs-container">
                  <div className="difficulty-tabs-list">
                    {[
                      {
                        id: 'All',
                        label: 'All Questions',
                        total: companyStats.total,
                        solved: companyStats.solved
                      },
                      {
                        id: 'Easy',
                        label: 'Easy',
                        total: companyStats.easyTotal,
                        solved: companyStats.easySolved
                      },
                      {
                        id: 'Medium',
                        label: 'Medium',
                        total: companyStats.medTotal,
                        solved: companyStats.medSolved
                      },
                      {
                        id: 'Hard',
                        label: 'Hard',
                        total: companyStats.hardTotal,
                        solved: companyStats.hardSolved
                      }
                    ].map((tab) => {
                      const isActive = difficultyFilter.toLowerCase() === tab.id.toLowerCase();
                      return (
                        <button
                          key={tab.id}
                          className={`difficulty-tab-btn ${isActive ? 'active' : ''} tab-${tab.id.toLowerCase()}`}
                          onClick={() => {
                            setDifficultyFilter(tab.id);
                            setVisibleQuestionsCount(40);
                          }}
                        >
                          <span className="tab-label">{tab.label}</span>
                          <span className="tab-badge">
                            {tab.solved}/{tab.total}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Search and Secondary Controls */}
                <div className="questions-filter-toolbar">
                  <div className="question-search-box">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      value={questionSearch}
                      onChange={(e) => {
                        setQuestionSearch(e.target.value);
                        setVisibleQuestionsCount(40);
                      }}
                      placeholder={`Search in ${currentCompanyData.displayName} questions by title or topic...`}
                      className="question-search-input"
                    />
                    {questionSearch && (
                      <button
                        className="clear-search-btn"
                        onClick={() => setQuestionSearch('')}
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="toolbar-right-controls">
                    {/* Status Filter */}
                    <div className="toolbar-select-wrap">
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setVisibleQuestionsCount(40);
                        }}
                        className="toolbar-select"
                      >
                        <option value="all">Status: All</option>
                        <option value="unsolved">Status: Unsolved Only</option>
                        <option value="solved">Status: Completed (All)</option>
                        <option value="solved_easily">Status: Solved Easily</option>
                        <option value="needs_practice">Status: Needs Practice</option>
                      </select>
                    </div>

                    {/* Question Sorting */}
                    <div className="toolbar-select-wrap">
                      <select
                        value={questionSortBy}
                        onChange={(e) => setQuestionSortBy(e.target.value)}
                        className="toolbar-select"
                      >
                        <option value="frequency">Sort: Frequency (High to Low)</option>
                        <option value="difficulty-asc">Difficulty: Easy to Hard</option>
                        <option value="difficulty-desc">Difficulty: Hard to Easy</option>
                        <option value="title">Title (A-Z)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Questions Grid / Empty State */}
                {filteredQuestions.length === 0 ? (
                  <div className="empty-state-card">
                    <AlertCircle size={36} className="empty-icon" />
                    <h3>No matching questions found</h3>
                    <p>No questions matched your current difficulty or search criteria.</p>
                    <button
                      className="reset-filters-btn"
                      onClick={() => {
                        setQuestionSearch('');
                        setDifficultyFilter('All');
                        setStatusFilter('all');
                      }}
                    >
                      <RotateCcw size={15} /> Clear Filters
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="questions-grid-meta">
                      <span>
                        Showing {Math.min(visibleQuestionsCount, filteredQuestions.length)} of {filteredQuestions.length} questions
                      </span>
                    </div>

                    <div className="questions-grid">
                      {filteredQuestions.slice(0, visibleQuestionsCount).map((q, index) => {
                        const record = savedRecords[q.id];
                        const isSolvedEasily = record?.status === 'solved_easily';
                        const isNeedsPractice = record?.status === 'needs_practice';

                        let cardClass = '';
                        let toggleClass = '';
                        let tooltipText = 'Update Progress';
                        let statusIcon = <Circle className="solved-icon" />;

                        if (isSolvedEasily) {
                          cardClass = 'solved-card';
                          toggleClass = 'active solved-easily';
                          tooltipText = 'Solved Easily (click to update)';
                          statusIcon = <CheckCircle2 className="solved-icon active solved-easily-icon" />;
                        } else if (isNeedsPractice) {
                          cardClass = 'needs-practice-card';
                          toggleClass = 'active needs-practice';
                          tooltipText = 'Needs Practice (click to update)';
                          statusIcon = <RotateCcw className="solved-icon active needs-practice-icon" />;
                        }

                        return (
                          <motion.div
                            key={q.id}
                            className={`question-card ${cardClass}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.2) }}
                            whileHover={{ y: -3, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
                          >
                            <div className="card-content">
                              {/* Header: Title and Completion Dialog Trigger */}
                              <div className="question-header">
                                <h3 className="question-name" title={q.title}>
                                  {q.title}
                                </h3>

                                <div className="tooltip-container">
                                  <motion.button
                                    id={`completion-btn-${q.id}`}
                                    className={`solved-toggle ${toggleClass}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenCompletionDialog(q);
                                    }}
                                    whileTap={{ scale: 0.9 }}
                                    aria-label={tooltipText}
                                  >
                                    {statusIcon}
                                  </motion.button>
                                  <span className="tooltip-text">
                                    {tooltipText}
                                  </span>
                                </div>
                              </div>

                              {/* Badges: Difficulty, Frequency, Status chip */}
                              <div className="question-badges-row">
                                <span className={`question-difficulty difficulty-${q.difficulty.toLowerCase()}`}>
                                  {q.difficulty}
                                </span>

                                {isNeedsPractice && (
                                  <span className="needs-practice-chip" title="Needs Practice">
                                    <RotateCcw size={11} className="needs-practice-chip-icon" /> Needs Practice
                                  </span>
                                )}

                                {q.frequency > 0 && (
                                  <span className="frequency-chip" title="Interview Frequency">
                                    <Flame size={12} className="flame-icon" />
                                    <span>{q.frequency}%</span>
                                  </span>
                                )}

                                <span className="question-slug-hint" title={`ID: ${q.id}`}>
                                  #{q.id}
                                </span>
                              </div>

                              {/* Topics Tags */}
                              {q.topics && q.topics.length > 0 && (
                                <div className="topics-list">
                                  {q.topics.slice(0, 3).map((topic, tIdx) => (
                                    <span key={tIdx} className="topic-pill">
                                      {topic}
                                    </span>
                                  ))}
                                  {q.topics.length > 3 && (
                                    <span className="topic-pill topic-more" title={q.topics.slice(3).join(', ')}>
                                      +{q.topics.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Platform Action Links */}
                              <div className="question-links">
                                {q.link ? (
                                  <a
                                    href={q.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link-btn link-leetcode"
                                  >
                                    <Code2 size={15} /> LeetCode
                                    <ExternalLink size={13} className="ext-icon" />
                                  </a>
                                ) : (
                                  <span className="no-link-text">Practice on LeetCode</span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Incremental Loading */}
                    {visibleQuestionsCount < filteredQuestions.length && (
                      <div className="load-more-container">
                        <button
                          className="load-more-btn"
                          onClick={() => setVisibleQuestionsCount((prev) => prev + 40)}
                        >
                          Load More Questions ({filteredQuestions.length - visibleQuestionsCount} remaining)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Completion Modal Dialog */}
      <QuestionCompletionDialog
        isOpen={Boolean(activeDialogQuestion)}
        question={activeDialogQuestion}
        existingRecord={activeDialogQuestion ? (savedRecords[activeDialogQuestion.id] || null) : null}
        onSave={handleSaveProgress}
        onClose={handleCloseDialog}
        isSaving={isSavingProgress}
        errorMessage={dialogErrorMessage}
      />
    </div>
  );
};

export default Questions;
