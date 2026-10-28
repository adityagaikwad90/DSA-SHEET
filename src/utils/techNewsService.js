/**
 * Tech News Service
 * Handles fetching, strict technology filtering, deduplication, and latest-first sorting
 * for technology news from NewsAPI (or proxy / fallback).
 */

const LOCAL_STORAGE_KEY = 'TECH_NEWS_API_KEY';
const CACHE_KEY = 'TECH_NEWS_CACHE_V1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache to preserve NewsAPI free tier limits (100 req/day)

// Curated high-relevance tech keywords
export const TECH_KEYWORDS = [
  'technology', 'tech', 'software', 'hardware', 'programming', 'developer', 'coding', 'code',
  'artificial intelligence', 'ai', 'machine learning', 'deep learning', 'neural network', 'llm',
  'gpt', 'gemini', 'openai', 'anthropic', 'claude', 'deepmind', 'copilot', 'model',
  'algorithm', 'data science', 'database', 'sql', 'nosql', 'postgres', 'redis', 'mongodb',
  'python', 'javascript', 'typescript', 'react', 'vue', 'angular', 'node', 'rust', 'golang', 'c++',
  'cloud', 'aws', 'azure', 'google cloud', 'gcp', 'devops', 'kubernetes', 'docker', 'serverless',
  'cybersecurity', 'security', 'vulnerability', 'cve', 'patch', 'malware', 'ransomware', 'zero-day',
  'chip', 'semiconductor', 'processor', 'gpu', 'cpu', 'nvidia', 'intel', 'amd', 'tsmc', 'arm',
  'apple', 'google', 'microsoft', 'meta', 'amazon', 'tesla', 'netflix', 'github', 'gitlab',
  'linux', 'open-source', 'open source', 'kernel', 'operating system', 'windows', 'macos', 'android', 'ios',
  'quantum', 'quantum computing', 'robotics', 'robot', 'automation', 'drone',
  'ev', 'electric vehicle', 'battery tech', 'clean energy', 'smart home', 'iot',
  'gadget', 'smartphone', 'wearable', 'augmented reality', 'virtual reality', 'vr', 'ar', 'spatial computing',
  'web3', 'blockchain', 'crypto', 'cryptocurrency', 'fintech', 'api', 'framework', 'library'
];

// Recognized tech publications & blogs
export const TECH_SOURCES = [
  'electrek', 'techcrunch', 'the verge', 'wired', 'ars technica', 'engadget',
  '9to5mac', '9to5google', 'android central', 'tom\'s hardware', 'tom\'s guide',
  'anandtech', 'hacker news', 'github', 'venturebeat', 'bleepingcomputer',
  'zdnet', 'cnet', 'macrumors', 'gizmodo', 'ieee spectrum', 'mit technology review',
  'techradar', 'digital trends', 'siliconangle', 'the next web', 'xda developers',
  'the register', 'slashdot', 'infoworld', 'dev.to', 'infoq', 'dzone', 'mashable',
  'reuters tech', 'bloomberg technology', 'wsj tech', 'cnbc tech'
];

// Negative filters to discard pure entertainment, celebrity, or sports news
export const NON_TECH_EXCLUSIONS = [
  'celebrity gossip', 'horoscope', 'zodiac', 'kardashian', 'box office',
  'soap opera', 'red carpet', 'reality tv', 'grammy award', 'oscar nomination',
  'nfl score', 'nba finals', 'premier league score', 'fifa world cup match'
];

// Fallback tech news dataset with user-provided sample and verified developer news
export const FALLBACK_TECH_NEWS = [
  {
    source: { id: null, name: "Electrek" },
    author: "Fred Lambert",
    title: "Dems introduce new $15,000 EV tax credit bill that has no chance — and that’s a problem",
    description: "Rep. Greg Landsman (D-OH) wants to bring back the federal EV tax credit and double it. His new bill, the “21st Century Vehicle Choice Act” (H.R. 10881), would offer up to $15,000 on a new electric vehicle and $8,000 on a used one, and it would make both credi…",
    url: "http://electrek.co/2026/10/28/15000-ev-tax-credit-bill-landsman-no-chance/",
    urlToImage: "https://electrek.co/wp-content/uploads/sites/3/2025/06/gas-vs-electric.png?resize=1200,628",
    publishedAt: "2026-10-28T19:38:37Z",
    content: "Rep. Greg Landsman (D-OH) wants to bring back the federal EV tax credit and double it. His new bill, the “21st Century Vehicle Choice Act” (H.R. 10881), would offer up to $15,000 on a new electric ve… [+6820 chars]"
  },
  {
    source: { id: "techcrunch", name: "TechCrunch" },
    author: "Frederic Lardinois",
    title: "Next-Gen AI Developer Agents Redefine Autonomous Code Generation and Bug Fixing",
    description: "The latest benchmark tests show breakthrough capabilities in LLM-assisted multi-agent software engineering, solving complex distributed systems bugs autonomously with zero human intervention.",
    url: "https://techcrunch.com",
    urlToImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-28T18:15:20Z",
    content: "Developers around the world are adopting autonomous coding agents that can inspect test suites, generate pull requests, and optimize algorithms in real time..."
  },
  {
    source: { id: "the-verge", name: "The Verge" },
    author: "Tom Warren",
    title: "Nvidia and TSMC Announce Breakthrough 2nm GPU Architecture Tailored for Generative Reasoning",
    description: "Silicon manufacturing enters a new era as TSMC and Nvidia unveil ultra-dense 2nm packaging delivering 3x compute efficiency for trillion-parameter AI models.",
    url: "https://theverge.com",
    urlToImage: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-28T16:42:10Z",
    content: "The cutting-edge 2nm process technology promises to drastically reduce data center power consumption while accelerating neural network inference speeds..."
  },
  {
    source: { id: "wired", name: "Wired" },
    author: "Lily Hay Newman",
    title: "Critical Zero-Day Vulnerability Discovered in Cloud Ingress Routers: Urgent Patch Deployed",
    description: "Cybersecurity researchers uncover an unauthenticated remote code execution flaw affecting enterprise cloud proxies. Cloud providers have pushed automated mitigations.",
    url: "https://wired.com",
    urlToImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-28T14:20:00Z",
    content: "Security teams across the globe spent their morning applying emergency firmware patches after an advanced threat group released a zero-day exploit..."
  },
  {
    source: { id: "ars-technica", name: "Ars Technica" },
    author: "Samuel Axon",
    title: "React 19 & Next-Gen Compiler Ecosystem: The Shift to Automatic Memoization and Native Signals",
    description: "Frontend engineering teams celebrate simpler state management and sub-millisecond component renders as modern web standards embrace automatic dependency tracking.",
    url: "https://arstechnica.com",
    urlToImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-28T12:05:45Z",
    content: "Manual memoization hooks like useMemo and useCallback are gradually becoming relics of the past thanks to reactive compiler optimizations..."
  },
  {
    source: { id: "venturebeat", name: "VentureBeat" },
    author: "Michael Nuñez",
    title: "Open Source AI Weights Challenge Proprietary Models in Mathematics and Coding Benchmarks",
    description: "New open-weights models achieve parity with closed commercial systems on LeetCode-style competitive programming challenges, fostering independent developer innovation.",
    url: "https://venturebeat.com",
    urlToImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-28T09:30:12Z",
    content: "The open source community continues to make astonishing strides, proving that decentralized model training and fine-tuning can rival the largest tech giants..."
  },
  {
    source: { id: "github-blog", name: "GitHub Blog" },
    author: "Engineering Team",
    title: "Optimizing Distributed Git Storage: How GitHub Reduced Monorepo Clone Latencies by 60%",
    description: "A deep dive into custom file indexing, partial packfiles, and high-performance Rust daemons powering modern cloud software repositories.",
    url: "https://github.blog",
    urlToImage: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-28T07:14:00Z",
    content: "Handling terabyte-scale code repositories required our infrastructure engineers to reimagine packfile traversal and zero-copy network buffers..."
  },
  {
    source: { id: "bleepingcomputer", name: "BleepingComputer" },
    author: "Sergiu Gatlan",
    title: "Rust-Powered Kernel Modules Approved for Mainline Linux LTS Branches",
    description: "Kernel maintainers greenlight core device drivers written in memory-safe Rust, permanently mitigating entire classes of buffer overflow vulnerabilities.",
    url: "https://bleepingcomputer.com",
    urlToImage: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-27T22:50:00Z",
    content: "The transition towards memory safety in systems programming reaches a historic milestone as Linux kernel maintainers merge full Rust toolchain support..."
  }
];

/**
 * Get active API key from localStorage or Vite environment variables
 */
export function getNewsApiKey() {
  try {
    const customKey = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    if (customKey && customKey.trim().length > 0) {
      return customKey.trim();
    }
  } catch (e) {
    console.warn('LocalStorage read error', e);
  }
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_NEWS_API_KEY : '';
  if (envKey && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return '';
}

/**
 * Save user's NewsAPI key to localStorage
 */
export function setNewsApiKey(key) {
  try {
    if (!key || !key.trim()) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, key.trim());
    }
  } catch (e) {
    console.warn('LocalStorage write error', e);
  }
  // Clear cache so fresh requests use the updated key
  clearNewsCache();
}

/**
 * Clear cached tech news
 */
export function clearNewsCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.warn('Unable to clear sessionStorage cache', e);
  }
}

/**
 * Check whether an article is strictly related to technology
 */
export function isTechnologyArticle(article) {
  if (!article || !article.title) return false;

  // 1. Filter out removed or deleted articles from NewsAPI
  const rawTitle = article.title.trim();
  if (rawTitle === '[Removed]' || rawTitle.toLowerCase().includes('[removed]')) {
    return false;
  }
  if (article.description && article.description.trim() === '[Removed]') {
    return false;
  }
  if (rawTitle.length < 10) {
    return false;
  }

  const titleLower = rawTitle.toLowerCase();
  const descLower = (article.description || '').toLowerCase();
  const contentLower = (article.content || '').toLowerCase();
  const sourceNameLower = (article.source?.name || '').toLowerCase();
  const combined = `${titleLower} ${descLower} ${contentLower} ${sourceNameLower}`;

  // 2. Reject pure entertainment or sports clickbait
  for (const neg of NON_TECH_EXCLUSIONS) {
    if (titleLower.includes(neg)) {
      return false;
    }
  }

  // 3. Match recognized tech news publisher
  const isFromTechSource = TECH_SOURCES.some(src => sourceNameLower.includes(src));
  if (isFromTechSource) {
    return true;
  }

  // 4. Keyword matching in title and description
  const hasKeyword = TECH_KEYWORDS.some(keyword => {
    // Escaped regex for word-boundary matching
    const escaped = keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return regex.test(titleLower) || regex.test(descLower);
  });

  return hasKeyword;
}

/**
 * Tag article with a specific category for tabs and badges
 */
export function categorizeArticle(article) {
  const text = `${article.title || ''} ${article.description || ''} ${article.source?.name || ''}`.toLowerCase();

  if (/\b(ai|artificial intelligence|machine learning|deep learning|neural|llm|gpt|openai|claude|gemini|deepmind|copilot)\b/i.test(text)) {
    return { id: 'ai', label: 'AI & Machine Learning', color: '#00d2b8', icon: 'Bot' };
  }
  if (/\b(cybersecurity|security|vulnerability|malware|ransomware|cve|zero-day|hacker|patch|exploit|breach)\b/i.test(text)) {
    return { id: 'cybersecurity', label: 'Cybersecurity', color: '#ef4444', icon: 'ShieldAlert' };
  }
  if (/\b(code|coding|software|developer|programming|react|python|javascript|typescript|github|frontend|backend|api|rust|golang|linux|monorepo)\b/i.test(text)) {
    return { id: 'dev', label: 'Software & Dev', color: '#3b82f6', icon: 'Code2' };
  }
  if (/\b(apple|google|microsoft|amazon|meta|cloud|aws|azure|gcp|enterprise)\b/i.test(text)) {
    return { id: 'big-tech', label: 'Big Tech & Cloud', color: '#a855f7', icon: 'Cloud' };
  }
  if (/\b(ev|electric vehicle|tesla|battery|chip|semiconductor|gpu|cpu|nvidia|hardware|tsmc|intel|amd|robot|robotics|gadget|phone)\b/i.test(text)) {
    return { id: 'hardware', label: 'Hardware & EV', color: '#ffa116', icon: 'Zap' };
  }
  return { id: 'general', label: 'Tech Innovation', color: '#00b8a3', icon: 'Cpu' };
}

/**
 * Format relative time (e.g. "2h ago", "Yesterday")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch {
    return 'Recently';
  }
}

/**
 * Estimate read time from content and description
 */
export function estimateReadTime(text = '') {
  const words = text ? text.trim().split(/\s+/).length : 0;
  const minutes = Math.max(2, Math.ceil(words / 45));
  return `${minutes} min read`;
}

/**
 * Deduplicate articles by normalized title and URL
 */
export function deduplicateArticles(articles) {
  const seenTitles = new Set();
  const seenUrls = new Set();

  return articles.filter(article => {
    if (!article || !article.title) return false;
    const cleanTitle = article.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanUrl = (article.url || '').toLowerCase().trim();

    if (seenTitles.has(cleanTitle) || (cleanUrl && seenUrls.has(cleanUrl))) {
      return false;
    }

    seenTitles.add(cleanTitle);
    if (cleanUrl) seenUrls.add(cleanUrl);
    return true;
  });
}

/**
 * Sort articles strictly by publishedAt descending (latest first)
 */
export function sortArticlesByLatest(articles) {
  return [...articles].sort((a, b) => {
    const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return timeB - timeA;
  });
}

/**
 * Process raw API articles:
 * 1. Deduplicates
 * 2. Filters strictly for technology articles
 * 3. Sorts latest first
 * 4. Augments with category, readTime, relative time, and fallback image
 */
export function processAndFilterTechArticles(rawArticles = []) {
  if (!Array.isArray(rawArticles)) return [];

  const unique = deduplicateArticles(rawArticles);
  const techOnly = unique.filter(isTechnologyArticle);
  const sortedLatest = sortArticlesByLatest(techOnly);

  return sortedLatest.map(article => {
    const categoryInfo = categorizeArticle(article);
    const readTime = estimateReadTime(`${article.title} ${article.description} ${article.content}`);
    const timeAgo = formatRelativeTime(article.publishedAt);

    // Reliable tech fallback images based on category if original image is missing
    const fallbackImages = {
      ai: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      cybersecurity: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
      dev: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
      'big-tech': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      hardware: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80',
      general: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
    };

    return {
      ...article,
      category: categoryInfo,
      timeAgo,
      readTime,
      urlToImage: article.urlToImage || fallbackImages[categoryInfo.id] || fallbackImages.general,
      author: article.author || article.source?.name || 'Tech Editor'
    };
  });
}

/**
 * Fetch tech news from NewsAPI with multi-tiered fallback and proxy support
 */
export async function fetchTechNews({ forceRefresh = false, searchQuery = '' } = {}) {
  const apiKey = getNewsApiKey();

  // If no API key provided, immediately return processed fallback tech news
  if (!apiKey) {
    const processed = processAndFilterTechArticles(FALLBACK_TECH_NEWS);
    return {
      success: true,
      isDemo: true,
      articles: processed,
      totalResults: processed.length,
      message: 'Demo Mode: Add your NewsAPI key to fetch live headlines.'
    };
  }

  // Check cache if not forcing refresh and no search query
  if (!forceRefresh && !searchQuery) {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.articles?.length > 0) {
          return {
            success: true,
            isDemo: false,
            isCached: true,
            articles: parsed.articles,
            totalResults: parsed.articles.length,
            message: 'Loaded from cache'
          };
        }
      }
    } catch (e) {
      console.warn('Cache read error', e);
    }
  }

  // Determine endpoint URLs:
  // 1. Try local dev proxy `/api/news/...` first to avoid browser CORS
  // 2. Fall back to direct `https://newsapi.org/v2/...`
  const isDev = Boolean(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);
  const devProxyBase = '/api/news';
  const directApiBase = 'https://newsapi.org/v2';

  // Build query:
  // If search query is provided, use /everything with tech context
  // Otherwise use /top-headlines with category=technology for verified fresh tech news
  let queryPath = '';
  if (searchQuery && searchQuery.trim()) {
    const encodedQ = encodeURIComponent(`(${searchQuery.trim()}) AND (technology OR tech OR software OR ai OR coding)`);
    queryPath = `/everything?q=${encodedQ}&language=en&sortBy=publishedAt&pageSize=40&apiKey=${apiKey}`;
  } else {
    queryPath = `/top-headlines?category=technology&language=en&pageSize=40&apiKey=${apiKey}`;
  }

  const endpointsToTry = isDev
    ? [`${devProxyBase}${queryPath}`, `${directApiBase}${queryPath}`]
    : [`${directApiBase}${queryPath}`];

  let rawArticles = null;
  let fetchError = null;

  for (const url of endpointsToTry) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error with status ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'ok' && Array.isArray(data.articles)) {
        rawArticles = data.articles;
        break;
      } else {
        throw new Error(data.message || 'Invalid response received from News API');
      }
    } catch (err) {
      console.warn(`Fetch failed from ${url}:`, err.message);
      fetchError = err;
    }
  }

  if (rawArticles && rawArticles.length > 0) {
    const processed = processAndFilterTechArticles(rawArticles);

    // Save to session cache
    if (!searchQuery) {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          articles: processed
        }));
      } catch (e) {
        console.warn('Cache write failed', e);
      }
    }

    return {
      success: true,
      isDemo: false,
      articles: processed,
      totalResults: processed.length,
      message: 'Latest technology news updated.'
    };
  }

  // If live fetch failed (e.g. CORS restriction, quota reached, or offline),
  // fallback gracefully to our curated tech news with user notification
  console.warn('Falling back to curated tech news due to:', fetchError?.message);
  const fallbackProcessed = processAndFilterTechArticles(FALLBACK_TECH_NEWS);

  return {
    success: false,
    isDemo: true,
    error: fetchError?.message || 'Failed to connect to News API',
    articles: fallbackProcessed,
    totalResults: fallbackProcessed.length,
    message: fetchError?.message?.includes('cors') || fetchError?.message?.includes('Failed to fetch')
      ? 'Browser CORS restriction detected. Showing curated tech news.'
      : (fetchError?.message || 'Using curated tech news fallback.')
  };
}

/**
 * Saved / Bookmarked articles management in localStorage
 */
const BOOKMARKS_KEY = 'DSA_TECH_NEWS_BOOKMARKS';

export function getBookmarkedArticles() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleBookmarkArticle(article) {
  try {
    const current = getBookmarkedArticles();
    const exists = current.some(item => item.url === article.url || item.title === article.title);

    let updated;
    if (exists) {
      updated = current.filter(item => item.url !== article.url && item.title !== article.title);
    } else {
      updated = [article, ...current];
    }

    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    return { bookmarked: !exists, updatedList: updated };
  } catch (e) {
    console.error('Bookmark error', e);
    return { bookmarked: false, updatedList: [] };
  }
}
