import Fuse from 'fuse.js';

/**
 * Creates a configured Fuse instance with optimal typo tolerance for DSA problem titles and topics.
 *
 * @param {Array} list - Array of objects to search
 * @param {Array<string>} keys - Keys to index, e.g. ['title', 'topics', 'company']
 * @param {Object} customOptions - Optional custom Fuse options
 */
export function createFuzzySearch(list = [], keys = ['title', 'topics', 'company'], customOptions = {}) {
  const options = {
    keys,
    threshold: 0.35, // Balanced between exact match and typo tolerance
    distance: 100,
    minMatchCharLength: 2,
    ignoreLocation: true,
    ...customOptions
  };

  return new Fuse(list, options);
}

/**
 * Searches a list using Fuse with fallback to substring match if search term is very short.
 *
 * @param {Array} list
 * @param {string} query
 * @param {Array<string>} keys
 * @returns {Array} Matched items in relevance order
 */
export function fuzzyFilter(list = [], query = '', keys = ['title', 'topics', 'company']) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return list;
  }

  const cleanQuery = query.trim();
  const fuse = createFuzzySearch(list, keys);
  const results = fuse.search(cleanQuery);

  return results.map(res => res.item);
}

