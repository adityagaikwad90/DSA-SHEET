import staticSummary from '../data/companiesSummary.json';
import staticTopRepeated from '../data/mostRepeatedQuestions.json';

// In-memory cache for company questions
const questionsCache = new Map();
let problemIndexPromise = null;
let cachedProblemIndex = null;
let topRepeatedPromise = null;
let cachedTopRepeated = null;

/**
 * Returns the companies summary list.
 */
export const getCompaniesSummary = () => {
  return staticSummary;
};

/**
 * Returns the precomputed Top 100 Most Repeated questions statically.
 */
export const getStaticTopRepeatedQuestions = () => {
  return staticTopRepeated;
};

/**
 * Loads the Top 100 Most Repeated questions asynchronously with fallback.
 */
export const fetchTopRepeatedQuestions = async () => {
  if (cachedTopRepeated) return cachedTopRepeated;

  if (!topRepeatedPromise) {
    topRepeatedPromise = fetch('/data/most-repeated-questions.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load most repeated questions');
        return res.json();
      })
      .then((data) => {
        cachedTopRepeated = data;
        return data;
      })
      .catch((err) => {
        console.warn('Falling back to bundled top repeated questions:', err.message);
        cachedTopRepeated = staticTopRepeated;
        return staticTopRepeated;
      });
  }

  return topRepeatedPromise;
};

/**
 * Loads the problem-to-companies index on demand.
 */
export const fetchProblemCompaniesIndex = async () => {
  if (cachedProblemIndex) return cachedProblemIndex;

  if (!problemIndexPromise) {
    problemIndexPromise = fetch('/data/problem-companies-index.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load problem index');
        return res.json();
      })
      .then((data) => {
        cachedProblemIndex = data;
        return data;
      })
      .catch((err) => {
        console.warn('Could not load problem companies index:', err.message);
        return {};
      });
  }

  return problemIndexPromise;
};

/**
 * Loads a company's full question dataset by its slug.
 * Uses in-memory cache for instant subsequent access.
 */
export const fetchCompanyQuestions = async (slug) => {
  if (!slug) return null;

  if (questionsCache.has(slug)) {
    return questionsCache.get(slug);
  }

  try {
    const res = await fetch(`/data/companies/${slug}.json`);
    if (!res.ok) {
      throw new Error(`Failed to load company questions (${res.status} ${res.statusText})`);
    }
    const data = await res.json();
    questionsCache.set(slug, data);
    return data;
  } catch (error) {
    console.error(`Error loading questions for ${slug}:`, error);
    throw error;
  }
};
