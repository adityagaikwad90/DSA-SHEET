import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Search,
  CheckCircle2,
  Circle,
  ExternalLink,
  RotateCcw,
  SlidersHorizontal,
  Building2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trophy,
  Filter
} from 'lucide-react';
import './MostRepeatedSection.css';

const MostRepeatedSection = ({
  topQuestions = [],
  solvedQuestions = [],
  savedRecords = {},
  onOpenCompletionDialog
}) => {
  // Filters & Controls (strictly inside the Top 100 questions)
  const [difficultyFilter, setDifficultyFilter] = useState('All'); // All | Easy | Medium | Hard
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | unsolved | solved | solved_easily | needs_practice
  const [sortBy, setSortBy] = useState('rank'); // rank | diff-asc | diff-desc | title | solved
  const [expandedCompanies, setExpandedCompanies] = useState({});

  // Ensure dataset is strictly capped at 100 questions regardless of anything
  const top100Base = useMemo(() => {
    return (topQuestions || []).slice(0, 100);
  }, [topQuestions]);

  const solvedSet = useMemo(() => new Set(solvedQuestions), [solvedQuestions]);

  // Statistics within the Top 100
  const stats = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;
    let solvedCount = 0;
    let solvedEasilyCount = 0;
    let needsPracticeCount = 0;

    for (const q of top100Base) {
      if (q.difficulty === 'Easy') easy++;
      else if (q.difficulty === 'Medium') medium++;
      else if (q.difficulty === 'Hard') hard++;

      const isSolved = solvedSet.has(q.id);
      if (isSolved) {
        solvedCount++;
        const record = savedRecords[q.id];
        if (record?.status === 'needs_practice') {
          needsPracticeCount++;
        } else {
          solvedEasilyCount++;
        }
      }
    }

    const pct = top100Base.length > 0 ? Math.round((solvedCount / top100Base.length) * 100) : 0;

    return {
      total: top100Base.length,
      easy,
      medium,
      hard,
      solvedCount,
      solvedEasilyCount,
      needsPracticeCount,
      pct,
      maxCompanies: top100Base[0]?.companyCount || 0
    };
  }, [top100Base, solvedSet, savedRecords]);

  // Toggle company list expansion for a specific question
  const toggleExpandCompanies = (questionId) => {
    setExpandedCompanies((prev) => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Filter within the Top 100 strictly
  const filteredQuestions = useMemo(() => {
    return top100Base.filter((q) => {
      // 1. Difficulty filter
      if (difficultyFilter !== 'All' && q.difficulty !== difficultyFilter) {
        return false;
      }

      // 2. Status filter
      const isSolved = solvedSet.has(q.id);
      const record = savedRecords[q.id];
      const status = record?.status || (isSolved ? 'solved_easily' : 'unsolved');

      if (statusFilter === 'unsolved' && isSolved) return false;
      if (statusFilter === 'solved' && !isSolved) return false;
      if (statusFilter === 'solved_easily' && (!isSolved || status !== 'solved_easily')) return false;
      if (statusFilter === 'needs_practice' && (!isSolved || status !== 'needs_practice')) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = (q.title || '').toLowerCase().includes(query);
        const topicMatch = (q.topics || []).some((t) => t.toLowerCase().includes(query));
        const companyMatch = (q.companies || []).some((c) => c.toLowerCase().includes(query));
        if (!titleMatch && !topicMatch && !companyMatch) return false;
      }

      return true;
    });
  }, [top100Base, difficultyFilter, statusFilter, searchQuery, solvedSet, savedRecords]);

  // Sort within the filtered Top 100
  const sortedQuestions = useMemo(() => {
    const list = [...filteredQuestions];
    const diffOrder = { Easy: 1, Medium: 2, Hard: 3 };

    list.sort((a, b) => {
      if (sortBy === 'rank') {
        // Primary: companyCount descending, Secondary: title alphabetical
        if (b.companyCount !== a.companyCount) {
          return b.companyCount - a.companyCount;
        }
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      }

      if (sortBy === 'diff-asc') {
        if (diffOrder[a.difficulty] !== diffOrder[b.difficulty]) {
          return diffOrder[a.difficulty] - diffOrder[b.difficulty];
        }
        return b.companyCount - a.companyCount;
      }

      if (sortBy === 'diff-desc') {
        if (diffOrder[a.difficulty] !== diffOrder[b.difficulty]) {
          return diffOrder[b.difficulty] - diffOrder[a.difficulty];
        }
        return b.companyCount - a.companyCount;
      }

      if (sortBy === 'title') {
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      }

      if (sortBy === 'solved') {
        const aSolved = solvedSet.has(a.id) ? 1 : 0;
        const bSolved = solvedSet.has(b.id) ? 1 : 0;
        if (bSolved !== aSolved) return bSolved - aSolved;
        return a.rank - b.rank;
      }

      return 0;
    });

    return list;
  }, [filteredQuestions, sortBy, solvedSet]);

  return (
    <section className="most-repeated-section" id="most-repeated-questions">
      {/* Section Header */}
      <div className="most-repeated-header">
        <div className="repeated-badge">
          <Flame size={15} className="flame-icon-pulse" />
          <span>High-Yield Interview Focus</span>
        </div>

        <h3 className="repeated-main-title">
          Most Repeated Questions — Top 100 Limit
        </h3>

        <p className="repeated-main-subtitle">
          The 100 most widely shared coding interview problems across 420+ tech companies,
          ranked dynamically by the number of distinct companies featuring each problem.
        </p>

        {/* Top 100 Progress & Distribution Stats */}
        <div className="repeated-stats-card">
          <div className="repeated-stat-block">
            <div className="stat-label-row">
              <span className="stat-name">Top 100 Mastery</span>
              <span className="stat-count-text">
                <strong>{stats.solvedCount}</strong> / {stats.total} Solved ({stats.pct}%)
              </span>
            </div>
            <div className="repeated-progress-track">
              <div
                className="repeated-progress-fill"
                style={{ width: `${stats.pct}%` }}
              />
            </div>
          </div>

          <div className="repeated-metrics-row">
            <div className="metric-chip metric-easy">
              <span className="dot dot-easy"></span>
              <span>Easy: {stats.easy}</span>
            </div>
            <div className="metric-chip metric-medium">
              <span className="dot dot-medium"></span>
              <span>Medium: {stats.medium}</span>
            </div>
            <div className="metric-chip metric-hard">
              <span className="dot dot-hard"></span>
              <span>Hard: {stats.hard}</span>
            </div>
            <div className="metric-chip metric-peak">
              <Building2 size={13} />
              <span>Max Breadth: {stats.maxCompanies} Companies</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Difficulty Tabs, Search, Status, and Sort */}
      <div className="repeated-controls-bar">
        {/* Difficulty Filter Tabs */}
        <div className="repeated-diff-tabs" role="tablist">
          <button
            className={`diff-tab ${difficultyFilter === 'All' ? 'active' : ''}`}
            onClick={() => setDifficultyFilter('All')}
          >
            All <span className="tab-pill">{stats.total}</span>
          </button>
          <button
            className={`diff-tab diff-tab-easy ${difficultyFilter === 'Easy' ? 'active' : ''}`}
            onClick={() => setDifficultyFilter('Easy')}
          >
            Easy <span className="tab-pill">{stats.easy}</span>
          </button>
          <button
            className={`diff-tab diff-tab-medium ${difficultyFilter === 'Medium' ? 'active' : ''}`}
            onClick={() => setDifficultyFilter('Medium')}
          >
            Medium <span className="tab-pill">{stats.medium}</span>
          </button>
          <button
            className={`diff-tab diff-tab-hard ${difficultyFilter === 'Hard' ? 'active' : ''}`}
            onClick={() => setDifficultyFilter('Hard')}
          >
            Hard <span className="tab-pill">{stats.hard}</span>
          </button>
        </div>

        {/* Search, Status, and Sort Controls */}
        <div className="repeated-filter-inputs">
          {/* Search Box */}
          <div className="repeated-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Top 100 problems, companies, topics..."
              className="repeated-search-input"
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="repeated-status-select-wrap">
            <Filter size={14} className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="repeated-select"
            >
              <option value="all">All Status</option>
              <option value="unsolved">Unsolved</option>
              <option value="solved">Completed</option>
              <option value="solved_easily">Solved Easily</option>
              <option value="needs_practice">Needs Practice</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="repeated-sort-select-wrap">
            <SlidersHorizontal size={14} className="sort-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="repeated-select"
            >
              <option value="rank">Sort: Most Companies (#1 - #100)</option>
              <option value="diff-asc">Difficulty: Easy → Hard</option>
              <option value="diff-desc">Difficulty: Hard → Easy</option>
              <option value="title">Problem Title: A → Z</option>
              <option value="solved">Solved Status First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Limit Notice */}
      <div className="repeated-pool-notice">
        <span>
          Showing <strong>{sortedQuestions.length}</strong> of <strong>{stats.total}</strong> problems in the Top 100 limit
          {difficultyFilter !== 'All' || statusFilter !== 'all' || searchQuery.trim() ? ' (filtered within Top 100)' : ''}
        </span>
      </div>

      {/* Questions List */}
      <div className="repeated-questions-list">
        {sortedQuestions.length === 0 ? (
          <div className="repeated-empty-state">
            <div className="empty-icon-box">
              <Search size={28} />
            </div>
            <h4>No Questions Found in Top 100</h4>
            <p>No questions within the Top 100 matched your current filter or search criteria.</p>
            <button
              className="reset-filters-btn"
              onClick={() => {
                setDifficultyFilter('All');
                setStatusFilter('all');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          sortedQuestions.map((q) => {
            const isSolved = solvedSet.has(q.id);
            const record = savedRecords[q.id];
            const isNeedsPractice = isSolved && record?.status === 'needs_practice';
            const isExpanded = !!expandedCompanies[q.id];
            const visibleCompanies = isExpanded ? q.companies : (q.companies || []).slice(0, 5);
            const remainingCount = Math.max(0, (q.companies?.length || 0) - 5);

            return (
              <motion.article
                key={q.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`repeated-card ${isSolved ? (isNeedsPractice ? 'needs-practice-card' : 'solved-card') : ''}`}
              >
                {/* Left: Rank & Status Toggle */}
                <div className="repeated-card-left">
                  <div className={`rank-badge ${q.rank <= 3 ? `top-rank-${q.rank}` : q.rank <= 10 ? 'top-10' : ''}`}>
                    <span>#{q.rank}</span>
                  </div>

                  <button
                    type="button"
                    id={`repeated-completion-btn-${q.id}`}
                    className={`repeated-checkbox-btn ${isSolved ? 'completed' : ''} ${isNeedsPractice ? 'needs-practice' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onOpenCompletionDialog({
                        id: q.id,
                        title: q.title,
                        difficulty: q.difficulty,
                        link: q.link,
                        url: q.link,
                        company: q.companies?.[0] || 'Top 100 Most Repeated',
                        topics: q.topics || []
                      });
                    }}
                    title={
                      isSolved
                        ? isNeedsPractice
                          ? 'Needs Practice (Click to edit notes/status)'
                          : 'Solved Easily (Click to edit notes/status)'
                        : 'Mark as Completed / Update Progress'
                    }
                    aria-label={`Update progress for ${q.title}`}
                  >
                    {isSolved ? (
                      isNeedsPractice ? (
                        <RotateCcw size={17} className="status-icon-practice" />
                      ) : (
                        <CheckCircle2 size={18} className="status-icon-solved" />
                      )
                    ) : (
                      <Circle size={18} className="status-icon-unsolved" />
                    )}
                  </button>
                </div>

                {/* Center: Details & Metadata */}
                <div className="repeated-card-content">
                  <div className="repeated-title-row">
                    <a
                      href={q.link || `https://leetcode.com/problems/${q.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="repeated-title-link"
                    >
                      <span className="repeated-title-text">{q.title}</span>
                      <ExternalLink size={13} className="ext-icon" />
                    </a>

                    <span className={`diff-chip diff-${q.difficulty?.toLowerCase()}`}>
                      {q.difficulty}
                    </span>

                    {isSolved && (
                      <span className={`status-badge-chip ${isNeedsPractice ? 'chip-practice' : 'chip-solved'}`}>
                        {isNeedsPractice ? (
                          <>
                            <RotateCcw size={11} /> Needs Practice
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={11} /> Solved Easily
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Company Frequency & Company Pills */}
                  <div className="repeated-companies-row">
                    <div className="company-count-badge" title="Number of distinct companies asking this question">
                      <Building2 size={13} className="building-icon" />
                      <span>{q.companyCount} Companies</span>
                    </div>

                    <div className="company-pills-wrap">
                      {visibleCompanies.map((comp) => (
                        <span key={comp} className="company-mini-pill">
                          {comp}
                        </span>
                      ))}

                      {!isExpanded && remainingCount > 0 && (
                        <button
                          type="button"
                          className="expand-companies-btn"
                          onClick={() => toggleExpandCompanies(q.id)}
                        >
                          +{remainingCount} more
                          <ChevronDown size={12} />
                        </button>
                      )}

                      {isExpanded && remainingCount > 0 && (
                        <button
                          type="button"
                          className="collapse-companies-btn"
                          onClick={() => toggleExpandCompanies(q.id)}
                        >
                          Show less
                          <ChevronUp size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Topic Tags */}
                  {q.topics && q.topics.length > 0 && (
                    <div className="repeated-topics-row">
                      {q.topics.slice(0, 4).map((topic) => (
                        <span key={topic} className="repeated-topic-pill">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Quick Action Link */}
                <div className="repeated-card-right">
                  <a
                    href={q.link || `https://leetcode.com/problems/${q.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="practice-leetcode-btn"
                  >
                    <span>Solve</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </motion.article>
            );
          })
        )}
      </div>
    </section>
  );
};

export default MostRepeatedSection;
