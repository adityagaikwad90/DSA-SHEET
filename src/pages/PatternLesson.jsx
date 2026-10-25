import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Clock, CircleDot,
  BookOpen, ExternalLink, Code2, Copy, Check, Sparkles, Layers,
  Compass, AlertCircle, Award, Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  loadLocalPatternProgress,
  savePatternProgressRecord,
  fetchUserPatternProgressFromFirestore,
  getPatternStatus
} from '../utils/patternProgress';
import SafeMarkdownRenderer from '../components/SafeMarkdownRenderer';
import dsaPatternsData from '../data/dsaPatternsData.json';
import './PatternLesson.css';

const { patterns = [], totalPatterns = 16 } = dsaPatternsData;

const PatternLesson = () => {
  const { patternId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Find pattern by slug, id, or number
  const patternIndex = useMemo(() => {
    return patterns.findIndex((p) =>
      p.slug === patternId ||
      p.id === patternId ||
      String(p.number) === String(patternId)
    );
  }, [patternId]);

  const pattern = patternIndex >= 0 ? patterns[patternIndex] : null;
  const prevPattern = patternIndex > 0 ? patterns[patternIndex - 1] : null;
  const nextPattern = patternIndex < patterns.length - 1 ? patterns[patternIndex + 1] : null;

  // Active view tab: 'lesson' | 'problems' | 'cheat-sheet'
  const [activeTab, setActiveTab] = useState('lesson');

  // User progress state
  const [progressMap, setProgressMap] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedProblemId, setCopiedProblemId] = useState(null);
  const [selectedLanguageMap, setSelectedLanguageMap] = useState({}); // problemId -> 'js' | 'java'

  // Scroll to top when pattern changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveTab('lesson');
  }, [patternId]);

  // Load progress
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

  // If pattern not found
  if (!pattern) {
    return (
      <div className="pattern-lesson-not-found">
        <div className="not-found-card">
          <AlertCircle size={48} className="text-amber-400" />
          <h2>Pattern Not Found</h2>
          <p>We could not find a pattern matching "{patternId}".</p>
          <Link to="/interview-hub" className="primary-btn">
            ← Return to Interview Hub
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = getPatternStatus(progressMap, pattern.id);

  // Status Change Handler
  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      await savePatternProgressRecord(currentUser?.uid, pattern.id, newStatus);
      setProgressMap((prev) => ({
        ...prev,
        [pattern.id]: { ...(prev[pattern.id] || {}), status: newStatus }
      }));
    } catch (err) {
      console.error('Failed to update pattern status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyCode = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedProblemId(id);
    setTimeout(() => setCopiedProblemId(null), 2000);
  };

  return (
    <div className="pattern-lesson-page">
      {/* Top Header & Breadcrumbs */}
      <div className="lesson-top-bar">
        <div className="lesson-breadcrumbs">
          <Link to="/interview-hub" className="back-link">
            <ArrowLeft size={16} />
            <span>Interview Hub</span>
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Pattern {pattern.number} of {totalPatterns}</span>
        </div>

        {/* Prev / Next Pattern Nav Buttons */}
        <div className="lesson-sequence-nav">
          <button
            className="seq-nav-btn"
            disabled={!prevPattern}
            onClick={() => prevPattern && navigate(`/interview-hub/patterns/${prevPattern.slug}`)}
            title={prevPattern ? `Previous: ${prevPattern.title}` : 'No previous pattern'}
          >
            <ChevronLeft size={16} />
            <span className="seq-btn-text">Previous</span>
          </button>

          <button
            className="seq-nav-btn"
            disabled={!nextPattern}
            onClick={() => nextPattern && navigate(`/interview-hub/patterns/${nextPattern.slug}`)}
            title={nextPattern ? `Next: ${nextPattern.title}` : 'No next pattern'}
          >
            <span className="seq-btn-text">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Pattern Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="pattern-lesson-hero"
      >
        <div className="hero-pattern-meta">
          <div className="meta-badges">
            <span className="pattern-number-pill">Pattern {String(pattern.number).padStart(2, '0')}</span>
            <span className="pattern-category-pill">{pattern.category}</span>
            <span className="pattern-time-pill"><Clock size={13} /> {pattern.estimatedTime}</span>
          </div>

          <h1 className="pattern-lesson-title">{pattern.title}</h1>
          <p className="pattern-lesson-summary">{pattern.summary}</p>
        </div>

        {/* Learning Status Controller Card */}
        <div className="hero-status-control">
          <span className="status-label">Your Learning Status</span>
          <div className="status-buttons-group">
            <button
              className={`status-btn not-started ${currentStatus === 'not_started' ? 'active' : ''}`}
              onClick={() => handleStatusChange('not_started')}
              disabled={isUpdating}
            >
              <CircleDot size={14} />
              <span>Not Started</span>
            </button>

            <button
              className={`status-btn learning ${currentStatus === 'learning' ? 'active' : ''}`}
              onClick={() => handleStatusChange('learning')}
              disabled={isUpdating}
            >
              <Clock size={14} />
              <span>In Progress</span>
            </button>

            <button
              className={`status-btn completed ${currentStatus === 'completed' ? 'active' : ''}`}
              onClick={() => handleStatusChange('completed')}
              disabled={isUpdating}
            >
              <CheckCircle2 size={14} />
              <span>Completed</span>
            </button>
          </div>

          {currentStatus === 'completed' && (
            <div className="status-success-banner">
              <Sparkles size={14} /> Pattern Mastered! Keep Practicing.
            </div>
          )}
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <div className="lesson-tabs-nav">
        <button
          className={`lesson-tab-btn ${activeTab === 'lesson' ? 'active' : ''}`}
          onClick={() => setActiveTab('lesson')}
        >
          <BookOpen size={16} />
          <span>Complete Lesson & Notes</span>
        </button>

        <button
          className={`lesson-tab-btn ${activeTab === 'problems' ? 'active' : ''}`}
          onClick={() => setActiveTab('problems')}
        >
          <Code2 size={16} />
          <span>Practice Problems ({pattern.problemsCount})</span>
        </button>

        <button
          className={`lesson-tab-btn ${activeTab === 'cheat-sheet' ? 'active' : ''}`}
          onClick={() => setActiveTab('cheat-sheet')}
        >
          <Compass size={16} />
          <span>Strategy & Intuition</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="lesson-tab-content">
        {/* TAB 1: COMPLETE LESSON & NOTES */}
        {activeTab === 'lesson' && (
          <motion.div
            key="lesson-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="lesson-markdown-wrapper"
          >
            {/* Attribution Callout */}
            <div className="attribution-banner">
              <BookOpen size={18} className="attribution-icon" />
              <div>
                <strong>Original Course Study Notes</strong>
                <p>
                  Rendered faithfully from the curated coding interview notes. Includes step-by-step intuition, brute force analysis, optimized algorithms, and problem walkthroughs.
                </p>
              </div>
            </div>

            {/* Markdown Body */}
            <SafeMarkdownRenderer content={pattern.contentMarkdown} />
          </motion.div>
        )}

        {/* TAB 2: PRACTICE PROBLEMS */}
        {activeTab === 'problems' && (
          <motion.div
            key="problems-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="problems-list-wrapper"
          >
            <div className="problems-header-info">
              <h3>{pattern.problemsCount} Curated Practice Problems</h3>
              <p>Solve each problem using the <strong>{pattern.title}</strong> pattern. Compare original JavaScript notes and verified Java archive implementations.</p>
            </div>

            <div className="problems-accordion-list">
              {pattern.problems.map((prob, idx) => {
                const selectedLang = selectedLanguageMap[prob.id] || (prob.hasJavaSolution ? 'java' : 'js');
                const hasJava = prob.hasJavaSolution && prob.javaSolution;

                return (
                  <div key={prob.id} className="problem-detail-card">
                    {/* Top Row: Number, Title, Difficulty, External URL */}
                    <div className="problem-card-top">
                      <div className="problem-title-group">
                        <span className="problem-index-tag">#{idx + 1}</span>
                        <h4 className="problem-heading">{prob.title}</h4>
                        <span className={`difficulty-badge difficulty-${prob.difficulty.toLowerCase()}`}>
                          {prob.difficulty}
                        </span>
                      </div>

                      {prob.url && (
                        <a
                          href={prob.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="leetcode-practice-btn"
                        >
                          <span>Solve on LeetCode</span>
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>

                    {/* Problem Statement Blockquote */}
                    {prob.description && (
                      <div className="problem-description-box">
                        <p>{prob.description}</p>
                      </div>
                    )}

                    {/* Time & Space Complexity Chips */}
                    {(prob.timeComplexity || prob.spaceComplexity) && (
                      <div className="complexity-chips-row">
                        {prob.timeComplexity && (
                          <div className="complexity-chip">
                            <span className="chip-label">Time:</span>
                            <span className="chip-val">{prob.timeComplexity}</span>
                          </div>
                        )}
                        {prob.spaceComplexity && (
                          <div className="complexity-chip">
                            <span className="chip-label">Space:</span>
                            <span className="chip-val">{prob.spaceComplexity}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Java Support / Language Toggle if Java Solution is matched */}
                    {hasJava && (
                      <div className="solution-language-container">
                        <div className="language-selector-tabs">
                          <button
                            className={`lang-tab-btn ${selectedLang === 'java' ? 'active' : ''}`}
                            onClick={() => setSelectedLanguageMap((prev) => ({ ...prev, [prob.id]: 'java' }))}
                          >
                            <span>☕ Java (Verified Archive Solution)</span>
                          </button>
                        </div>

                        {selectedLang === 'java' && (
                          <div className="java-solution-view">
                            <div className="code-viewer-header">
                              <span className="code-source-label">
                                Verified Java Solution: {prob.javaSolution.fileName}
                              </span>
                              <button
                                className="copy-code-btn"
                                onClick={() => handleCopyCode(prob.javaSolution.code, prob.id)}
                              >
                                {copiedProblemId === prob.id ? (
                                  <>
                                    <Check size={14} /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy size={14} /> Copy Code
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="problem-code-pre">
                              <code>{prob.javaSolution.code}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 3: STRATEGY & INTUITION */}
        {activeTab === 'cheat-sheet' && (
          <motion.div
            key="cheat-sheet-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="cheat-sheet-wrapper"
          >
            <div className="strategy-grid">
              <div className="strategy-card">
                <div className="strategy-card-header">
                  <Compass size={20} className="text-primary" />
                  <h4>When to Use This Pattern</h4>
                </div>
                <div className="strategy-card-body">
                  <p>{pattern.summary}</p>
                </div>
              </div>

              <div className="strategy-card">
                <div className="strategy-card-header">
                  <Award size={20} className="text-secondary" />
                  <h4>Pattern Highlights</h4>
                </div>
                <div className="strategy-card-body">
                  <ul className="strategy-bullet-list">
                    <li>Total core problems covered: <strong>{pattern.problemsCount}</strong></li>
                    <li>Primary category: <strong>{pattern.category}</strong></li>
                    <li>Source lesson file: <code>{pattern.originalFile}</code></li>
                    <li>Target technical interview frequency: <strong>High Yield</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Diagram Highlights */}
            {pattern.allImages && pattern.allImages.length > 0 && (
              <div className="strategy-diagrams-section">
                <h4>Visual Diagrams ({pattern.allImages.length})</h4>
                <div className="diagrams-gallery">
                  {pattern.allImages.map((imgUrl, i) => (
                    <figure key={i} className="gallery-figure">
                      <img
                        src={imgUrl}
                        alt={`${pattern.title} diagram ${i + 1}`}
                        loading="lazy"
                        className="gallery-img"
                      />
                      <figcaption>Diagram {i + 1}: {pattern.title}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom Footer Navigator & Mark as Completed CTA */}
      <div className="lesson-bottom-cta">
        <div className="completion-action-box">
          <div className="action-text">
            <h4>Ready to move forward?</h4>
            <p>Mark this lesson as completed to track your DSA proficiency.</p>
          </div>
          <div className="action-buttons">
            {currentStatus !== 'completed' ? (
              <button
                className="complete-cta-btn"
                onClick={() => handleStatusChange('completed')}
                disabled={isUpdating}
              >
                <CheckCircle2 size={18} /> Mark Pattern as Completed
              </button>
            ) : (
              <span className="already-completed-tag">
                <CheckCircle2 size={18} /> Completed
              </span>
            )}

            {nextPattern && (
              <button
                className="next-pattern-cta-btn"
                onClick={() => navigate(`/interview-hub/patterns/${nextPattern.slug}`)}
              >
                <span>Next: {nextPattern.title}</span>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternLesson;
