import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  ExternalLink,
  Bookmark,
  Share2,
  Key,
  Cpu,
  Clock,
  Sparkles,
  Check,
  AlertCircle,
  X,
  Grid,
  List,
  Radio,
  ArrowUpRight,
  Zap,
  Bot,
  ShieldAlert,
  Code2,
  Cloud,
  Layers,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import {
  fetchTechNews,
  getNewsApiKey,
  setNewsApiKey,
  clearNewsCache,
  getBookmarkedArticles,
  toggleBookmarkArticle
} from '../utils/techNewsService';
import './TechNews.css';

const CATEGORIES = [
  { id: 'all', label: 'All Tech', icon: Cpu },
  { id: 'ai', label: 'AI & Machine Learning', icon: Bot },
  { id: 'dev', label: 'Software & Dev', icon: Code2 },
  { id: 'cybersecurity', label: 'Cybersecurity', icon: ShieldAlert },
  { id: 'big-tech', label: 'Big Tech & Cloud', icon: Cloud },
  { id: 'hardware', label: 'Hardware & EV', icon: Zap },
  { id: 'saved', label: 'Saved Articles', icon: Bookmark }
];

export default function TechNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Filters & Controls
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest' | 'oldest'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState([]);

  // API Key modal state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [inputApiKey, setInputApiKey] = useState('');
  const [keyStatus, setKeyStatus] = useState('');

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Load bookmarks on mount
  useEffect(() => {
    setBookmarks(getBookmarkedArticles());
    setInputApiKey(getNewsApiKey());
  }, []);

  // Show quick toast message
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Fetch news
  const loadNews = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetchTechNews({ forceRefresh: force });
      setArticles(res.articles || []);
      setIsDemoMode(res.isDemo);
      setStatusMessage(res.message || '');
      if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err) {
      console.error('Error loading news:', err);
      setErrorMsg(err.message || 'Failed to fetch technology news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadNews();
  }, []);

  // Handle Save / Remove Bookmark
  const handleToggleBookmark = (article, e) => {
    e.stopPropagation();
    const result = toggleBookmarkArticle(article);
    setBookmarks(result.updatedList);
    showToast(
      result.bookmarked ? 'Article added to saved list' : 'Article removed from saved list',
      'success'
    );
  };

  // Check if article is bookmarked
  const isBookmarked = (article) => {
    return bookmarks.some(item => item.url === article.url || item.title === article.title);
  };

  // Handle Copy / Share Link
  const handleShare = (article, e) => {
    e.stopPropagation();
    if (navigator.clipboard && article.url) {
      navigator.clipboard.writeText(article.url);
      showToast('Article link copied to clipboard!', 'success');
    } else {
      showToast('Could not copy link', 'error');
    }
  };

  // Save new API Key
  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    const cleanKey = inputApiKey.trim();
    setNewsApiKey(cleanKey);
    setIsKeyModalOpen(false);
    showToast(cleanKey ? 'News API Key saved! Refreshing...' : 'API Key cleared. Using demo mode.', 'info');
    await loadNews(true);
  };

  // Filtered & Sorted Articles
  const filteredArticles = useMemo(() => {
    let list = activeCategory === 'saved' ? bookmarks : articles;

    // Filter by Category
    if (activeCategory !== 'all' && activeCategory !== 'saved') {
      list = list.filter(item => item.category?.id === activeCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item =>
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.source?.name?.toLowerCase().includes(q)
      );
    }

    // Sort order: strict latest vs oldest
    return [...list].sort((a, b) => {
      const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return sortOrder === 'latest' ? timeB - timeA : timeA - timeB;
    });
  }, [articles, bookmarks, activeCategory, searchQuery, sortOrder]);

  // Spotlight Hero article (only on 'all' tab with no search query)
  const heroArticle = useMemo(() => {
    if (activeCategory === 'all' && !searchQuery.trim() && filteredArticles.length > 0) {
      return filteredArticles[0];
    }
    return null;
  }, [filteredArticles, activeCategory, searchQuery]);

  // Remaining articles excluding the spotlight hero
  const gridArticles = useMemo(() => {
    if (heroArticle) {
      return filteredArticles.slice(1);
    }
    return filteredArticles;
  }, [filteredArticles, heroArticle]);

  // Icon mapping for categories
  const getCategoryIcon = (categoryId) => {
    switch (categoryId) {
      case 'ai': return Bot;
      case 'cybersecurity': return ShieldAlert;
      case 'dev': return Code2;
      case 'big-tech': return Cloud;
      case 'hardware': return Zap;
      default: return Cpu;
    }
  };

  return (
    <div className="tech-news-page">
      {/* Toast Alert */}
      {toast && (
        <div className={`tech-news-toast toast-${toast.type}`}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <header className="tech-news-header">
        <div className="header-meta">
          <div className="tech-pulse-badge">
            <span className={`pulse-indicator ${isDemoMode ? 'indicator-demo' : 'indicator-live'}`} />
            <Radio size={14} className="radar-icon" />
            <span>{isDemoMode ? 'Curated Tech Feed (Demo Mode)' : 'Live Technology Radar'}</span>
          </div>
          <span className="source-counter">
            {filteredArticles.length} {filteredArticles.length === 1 ? 'Article' : 'Articles'} Available
          </span>
        </div>

        <div className="header-main-row">
          <div>
            <h1 className="tech-news-title">
              Tech & Engineering <span className="gradient-highlight">Pulse</span>
            </h1>
            <p className="tech-news-subtitle">
              Strictly filtered technology headlines, AI advancements, developer tools, and silicon breakthroughs.
            </p>
          </div>

          <div className="header-actions">
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className={`api-key-btn ${getNewsApiKey() ? 'has-key' : ''}`}
              title="Configure NewsAPI Key"
            >
              <Key size={16} />
              <span>{getNewsApiKey() ? 'API Key Active' : 'Set API Key'}</span>
              {getNewsApiKey() && <CheckCircle2 size={14} className="key-check" />}
            </button>

            <button
              onClick={() => loadNews(true)}
              className="refresh-btn"
              disabled={loading || refreshing}
              title="Refresh Latest News"
            >
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
              <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Demo Mode Notice if applicable */}
        {isDemoMode && (
          <div className="demo-notice-bar">
            <AlertCircle size={16} className="notice-icon" />
            <div className="notice-text">
              <strong>Showing curated tech news.</strong> NewsAPI provides 100 free requests/day.
              Click <strong>"Set API Key"</strong> to plug in your key and stream real-time global tech stories.
            </div>
            <button onClick={() => setIsKeyModalOpen(true)} className="notice-action-btn">
              Configure Key
            </button>
          </div>
        )}
      </header>

      {/* Search, Filter & Controls Bar */}
      <section className="tech-news-controls">
        {/* Categories Bar */}
        <div className="categories-track">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = cat.id === 'saved'
              ? bookmarks.length
              : cat.id === 'all'
                ? articles.length
                : articles.filter(a => a.category?.id === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              >
                <Icon size={15} />
                <span>{cat.label}</span>
                <span className="pill-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search, Sort and Layout Row */}
        <div className="filter-actions-row">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search tech news, frameworks, AI models, companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="clear-search-btn">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="controls-right">
            <div className="sort-wrapper">
              <SlidersHorizontal size={14} className="sort-icon" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="sort-select"
              >
                <option value="latest">Sort: Latest First</option>
                <option value="oldest">Sort: Oldest First</option>
              </select>
            </div>

            <div className="view-mode-toggle">
              <button
                onClick={() => setViewMode('grid')}
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="Grid View"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="tech-news-content">
        {loading ? (
          <div className="news-loading-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skeleton skeleton-img" />
                <div className="skeleton-body">
                  <div className="skeleton skeleton-badge" />
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" />
                  <div className="skeleton skeleton-text-short" />
                  <div className="skeleton skeleton-meta" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="empty-news-state">
            <div className="empty-icon-circle">
              <AlertCircle size={32} />
            </div>
            <h3>No Technology Articles Found</h3>
            <p>
              {activeCategory === 'saved'
                ? "You haven't bookmarked any technology stories yet. Bookmark articles using the ribbon icon to read them later!"
                : "No tech news matches your current filter or search criteria."}
            </p>
            {(searchQuery || activeCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="reset-filters-btn"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Spotlight Hero Article */}
            {heroArticle && (
              <article className="hero-tech-card">
                <div className="hero-image-wrap">
                  <img
                    src={heroArticle.urlToImage}
                    alt={heroArticle.title}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  <div className="hero-gradient-overlay" />
                  <span className="hero-breaking-badge">
                    <Sparkles size={13} />
                    LATEST BREAKING
                  </span>
                </div>

                <div className="hero-content">
                  <div className="card-top-meta">
                    <span className="source-pill">
                      {heroArticle.source?.name || 'Technology News'}
                    </span>
                    <span className="category-tag tag-hero">
                      {heroArticle.category?.label || 'Tech'}
                    </span>
                    <span className="time-badge">
                      <Clock size={12} />
                      {heroArticle.timeAgo}
                    </span>
                  </div>

                  <h2 className="hero-title">
                    <a href={heroArticle.url} target="_blank" rel="noopener noreferrer">
                      {heroArticle.title}
                    </a>
                  </h2>

                  <p className="hero-desc">{heroArticle.description}</p>

                  <div className="hero-footer">
                    <div className="author-info">
                      <span className="author-name">{heroArticle.author}</span>
                      <span className="read-time-dot">•</span>
                      <span className="read-time">{heroArticle.readTime}</span>
                    </div>

                    <div className="card-actions">
                      <button
                        onClick={(e) => handleToggleBookmark(heroArticle, e)}
                        className={`action-btn bookmark-btn ${isBookmarked(heroArticle) ? 'active' : ''}`}
                        title={isBookmarked(heroArticle) ? 'Remove from Saved' : 'Save Article'}
                      >
                        <Bookmark size={16} fill={isBookmarked(heroArticle) ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        onClick={(e) => handleShare(heroArticle, e)}
                        className="action-btn share-btn"
                        title="Copy Article Link"
                      >
                        <Share2 size={16} />
                      </button>

                      <a
                        href={heroArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="read-full-btn"
                      >
                        <span>Read Full Story</span>
                        <ArrowUpRight size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* Articles Grid or List */}
            <div className={`tech-news-${viewMode}`}>
              {gridArticles.map((article, idx) => {
                const CategoryIcon = getCategoryIcon(article.category?.id);
                const bookmarked = isBookmarked(article);

                return (
                  <article key={`${article.url || article.title}-${idx}`} className="news-card">
                    <div className="card-media">
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <div className="media-overlay" />
                      <span className="card-category-badge" style={{ borderColor: article.category?.color }}>
                        <CategoryIcon size={12} style={{ color: article.category?.color }} />
                        <span>{article.category?.label}</span>
                      </span>
                    </div>

                    <div className="card-content">
                      <div className="card-header-meta">
                        <span className="card-source">{article.source?.name || 'Tech'}</span>
                        <span className="card-date">
                          <Clock size={12} />
                          {article.timeAgo}
                        </span>
                      </div>

                      <h3 className="card-title">
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                          {article.title}
                        </a>
                      </h3>

                      <p className="card-description">{article.description}</p>

                      <div className="card-bottom">
                        <div className="card-author-meta">
                          <span className="meta-author" title={article.author}>
                            {article.author}
                          </span>
                          <span className="meta-dot">•</span>
                          <span className="meta-read">{article.readTime}</span>
                        </div>

                        <div className="card-actions">
                          <button
                            onClick={(e) => handleToggleBookmark(article, e)}
                            className={`action-btn bookmark-btn ${bookmarked ? 'active' : ''}`}
                            title={bookmarked ? 'Remove Bookmark' : 'Save Article'}
                          >
                            <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
                          </button>

                          <button
                            onClick={(e) => handleShare(article, e)}
                            className="action-btn share-btn"
                            title="Share Article Link"
                          >
                            <Share2 size={15} />
                          </button>

                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card-read-link"
                            title="Read on original website"
                          >
                            <ExternalLink size={15} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsKeyModalOpen(false)}>
          <div className="api-key-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="key-icon-box">
                  <Key size={18} />
                </div>
                <div>
                  <h3>Configure NewsAPI Key</h3>
                  <p>Stream real-time, live technology articles directly into your app</p>
                </div>
              </div>
              <button onClick={() => setIsKeyModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveApiKey} className="modal-form">
              <div className="form-group">
                <label htmlFor="apiKeyInput">NewsAPI Key</label>
                <input
                  id="apiKeyInput"
                  type="text"
                  placeholder="Paste your 32-character API key (e.g. 7f83...)"
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  className="key-input"
                />
                <span className="input-hint">
                  Saved securely in your browser's local storage or in your project's <code>.env</code> as <code>VITE_NEWS_API_KEY</code>.
                </span>
              </div>

              <div className="api-info-card">
                <h4>How to get a free API Key:</h4>
                <ol>
                  <li>Visit <a href="https://newsapi.org/register" target="_blank" rel="noopener noreferrer">newsapi.org/register <ExternalLink size={12} /></a></li>
                  <li>Sign up for a free developer account (100 free requests/day)</li>
                  <li>Copy your API key and paste it above</li>
                </ol>
              </div>

              <div className="modal-actions">
                {getNewsApiKey() && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputApiKey('');
                      setNewsApiKey('');
                      setIsKeyModalOpen(false);
                      showToast('API Key removed. Switched to demo mode.', 'info');
                      loadNews(true);
                    }}
                    className="modal-clear-btn"
                  >
                    Clear Key
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="modal-cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn">
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

