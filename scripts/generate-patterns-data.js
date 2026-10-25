import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const PATTERNS_SOURCE_DIR = fs.existsSync(path.join(ROOT_DIR, 'src', 'content', 'patterns'))
  ? path.join(ROOT_DIR, 'src', 'content', 'patterns')
  : path.resolve(ROOT_DIR, '..', 'Several-Coding-Patterns-for-Solving-Data-Structures-and-Algorithms-Problems-during-Interviews-main');

const INTERVIEWS_SOURCE_DIR = path.resolve(ROOT_DIR, '..', 'interviews');
const PUBLIC_PATTERNS_IMG_DIR = path.join(ROOT_DIR, 'public', 'patterns', 'images');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'data');
const SRC_CONTENT_DIR = path.join(ROOT_DIR, 'src', 'content', 'patterns');

// Ensure destination directories exist
fs.mkdirSync(PUBLIC_PATTERNS_IMG_DIR, { recursive: true });
fs.mkdirSync(SRC_DATA_DIR, { recursive: true });
fs.mkdirSync(SRC_CONTENT_DIR, { recursive: true });

// Copy images if source directory has images
const sourceImagesDir = path.join(PATTERNS_SOURCE_DIR, 'images');
const fallbackSourceImagesDir = path.resolve(ROOT_DIR, '..', 'Several-Coding-Patterns-for-Solving-Data-Structures-and-Algorithms-Problems-during-Interviews-main', 'images');
const actualImgDir = fs.existsSync(sourceImagesDir) ? sourceImagesDir : (fs.existsSync(fallbackSourceImagesDir) ? fallbackSourceImagesDir : null);

if (actualImgDir) {
  const images = fs.readdirSync(actualImgDir);
  for (const img of images) {
    if (img.endsWith('.png') || img.endsWith('.jpg') || img.endsWith('.jpeg') || img.endsWith('.gif') || img.endsWith('.svg')) {
      const srcPath = path.join(actualImgDir, img);
      const destPath = path.join(PUBLIC_PATTERNS_IMG_DIR, img);
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Helper to normalize problem names for cross-referencing
function normalizeProblemKey(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\.java$/i, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

// 1. Index Java solutions from interviews directory
console.log('Indexing Java solutions from interviews archive...');
const javaSolutionsByNormName = new Map();
const companySolutions = {};
const topicSolutions = {};

function scanJavaFiles(dir, category, groupName) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (item !== '.git' && item !== '.DS_Store') {
        scanJavaFiles(fullPath, category, item);
      }
    } else if (item.endsWith('.java')) {
      try {
        const code = fs.readFileSync(fullPath, 'utf8');
        const rawName = item.replace('.java', '');
        const normKey = normalizeProblemKey(rawName);

        // Derive clean title from PascalCase name (e.g. MergeIntervals -> Merge Intervals)
        const title = rawName.replace(/([A-Z])/g, ' $1').trim();

        const solutionObj = {
          fileName: item,
          rawName,
          title,
          category,
          group: groupName || 'general',
          code: code.trim(),
          linesCount: code.split('\n').length
        };

        if (!javaSolutionsByNormName.has(normKey)) {
          javaSolutionsByNormName.set(normKey, []);
        }
        javaSolutionsByNormName.get(normKey).push(solutionObj);

        if (category === 'company') {
          if (!companySolutions[groupName]) companySolutions[groupName] = [];
          companySolutions[groupName].push({
            title,
            fileName: item,
            code: code.trim(),
            linesCount: code.split('\n').length
          });
        } else if (category === 'leetcode') {
          if (!topicSolutions[groupName]) topicSolutions[groupName] = [];
          topicSolutions[groupName].push({
            title,
            fileName: item,
            code: code.trim(),
            linesCount: code.split('\n').length
          });
        }
      } catch (err) {
        console.warn(`Error reading ${fullPath}:`, err.message);
      }
    }
  }
}

if (fs.existsSync(INTERVIEWS_SOURCE_DIR)) {
  scanJavaFiles(path.join(INTERVIEWS_SOURCE_DIR, 'company'), 'company', '');
  scanJavaFiles(path.join(INTERVIEWS_SOURCE_DIR, 'leetcode'), 'leetcode', '');
}

console.log(`Indexed ${javaSolutionsByNormName.size} unique normalized Java problem keys.`);

// 2. Discover and parse all 16 Pattern markdown files
const patternFiles = fs.readdirSync(PATTERNS_SOURCE_DIR).filter(f => f.endsWith('.md') && f !== 'README.md');

// Map clean titles & primary diagrams
const PATTERN_METADATA = {
  1: {
    title: 'Sliding Window',
    slug: 'sliding-window',
    coverImage: null,
    category: 'Array / String',
    estimatedTime: '45 mins',
    summary: 'Efficiently process contiguous subarrays or sublists of a given size or condition in O(N) by reusing calculation results and sliding window pointers.'
  },
  2: {
    title: 'Two Pointers',
    slug: 'two-pointers',
    coverImage: null,
    category: 'Array / LinkedList',
    estimatedTime: '40 mins',
    summary: 'Search for pairs, triplets, or subarrays in sorted collections by iterating with two pointers converging from both ends or moving at different conditions.'
  },
  3: {
    title: 'Fast & Slow Pointers',
    slug: 'fast-and-slow-pointers',
    coverImage: null,
    category: 'LinkedList / Cycle Detection',
    estimatedTime: '35 mins',
    summary: 'Hare & Tortoise algorithm using two pointers moving at different speeds to detect cycles, find middle nodes, or identify loop starting points.'
  },
  4: {
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    coverImage: '/patterns/images/mergeintervals.png',
    category: 'Intervals / Sorting',
    estimatedTime: '45 mins',
    summary: 'Technique to resolve overlapping intervals, finding mutual exclusions, merging overlapping slots, and solving scheduling problems.'
  },
  5: {
    title: 'Cyclic Sort',
    slug: 'cyclic-sort',
    coverImage: '/patterns/images/cyclicsort.png',
    category: 'Array / Index Placement',
    estimatedTime: '35 mins',
    summary: 'Sort arrays containing numbers in a given range 1 to N in O(N) time and O(1) space by placing each number directly into its target index.'
  },
  6: {
    title: 'In-place Reversal of a LinkedList',
    slug: 'in-place-reversal-of-a-linkedlist',
    coverImage: null,
    category: 'LinkedList / Pointers',
    estimatedTime: '40 mins',
    summary: 'Reverse links between nodes in a singly or doubly linked list in-place without allocating additional memory nodes.'
  },
  7: {
    title: 'Tree Breadth First Search',
    slug: 'tree-breadth-first-search',
    coverImage: null,
    category: 'Trees / BFS',
    estimatedTime: '50 mins',
    summary: 'Traverse trees level-by-level using a queue, solving level order traversals, zigzag views, minimum depths, and connected sibling pointers.'
  },
  8: {
    title: 'Tree Depth First Search (DFS)',
    slug: 'tree-depth-first-search',
    coverImage: null,
    category: 'Trees / DFS / Recursion',
    estimatedTime: '45 mins',
    summary: 'Traverse trees branch-by-branch using recursion or stack to find root-to-leaf paths, path sums, diameters, and sequence validations.'
  },
  9: {
    title: 'Two Heaps',
    slug: 'two-heaps',
    coverImage: null,
    category: 'Heaps / Priority Queue',
    estimatedTime: '40 mins',
    summary: 'Divide elements into two halves using a Max-Heap for the smaller half and a Min-Heap for the larger half to track medians and boundaries.'
  },
  10: {
    title: 'Subsets',
    slug: 'subsets',
    coverImage: null,
    category: 'Backtracking / BFS',
    estimatedTime: '45 mins',
    summary: 'Systematically generate permutations, combinations, and subsets using BFS level expansion or backtracking.'
  },
  11: {
    title: 'Modified Binary Search',
    slug: 'modified-binary-search',
    coverImage: null,
    category: 'Binary Search',
    estimatedTime: '45 mins',
    summary: 'Adapt binary search for order-agnostic arrays, rotated arrays, bitonic arrays, ceilings/floors, and infinite streams.'
  },
  12: {
    title: 'Bitwise XOR',
    slug: 'bitwise-xor',
    coverImage: null,
    category: 'Bit Manipulation',
    estimatedTime: '30 mins',
    summary: 'Leverage properties of XOR (X ^ X = 0, X ^ 0 = X) to identify missing numbers, single distinct elements, and bitwise complements in O(1) space.'
  },
  13: {
    title: "Top 'K' Elements",
    slug: 'top-k-elements',
    coverImage: null,
    category: 'Heaps / Sorting',
    estimatedTime: '50 mins',
    summary: 'Find top, smallest, or most frequent K elements efficiently using Min-Heap or Max-Heap in O(N * log K) instead of full sorting O(N log N).'
  },
  14: {
    title: 'K-way Merge',
    slug: 'k-way-merge',
    coverImage: '/patterns/images/kwaymatrix.png',
    category: 'Heaps / Sorted Lists',
    estimatedTime: '45 mins',
    summary: 'Merge K sorted arrays or lists using a Min-Heap of size K to produce a single sorted stream or find the Kth smallest element across lists.'
  },
  15: {
    title: '0-1 Knapsack (Dynamic Programming)',
    slug: '0-1-knapsack-dynamic-programming',
    coverImage: '/patterns/images/knapsack.png',
    category: 'Dynamic Programming',
    estimatedTime: '65 mins',
    summary: 'Core DP pattern for optimization problems: breaking down into overlapping subproblems, memoization (top-down), and tabulation (bottom-up).'
  },
  16: {
    title: 'Topological Sort (Graph)',
    slug: 'topological-sort-graph',
    coverImage: '/patterns/images/topsort.png',
    category: 'Graph / BFS / DAG',
    estimatedTime: '50 mins',
    summary: 'Linear ordering of vertices in a Directed Acyclic Graph (DAG) with dependencies, using in-degree counts and BFS queue processing.'
  }
};

const patterns = [];

for (const fileName of patternFiles) {
  const filePath = path.join(PATTERNS_SOURCE_DIR, fileName);
  let rawContent = fs.readFileSync(filePath, 'utf8');

  // Also make sure it is saved in src/content/patterns/ for clean repo inclusion
  const destFilePath = path.join(SRC_CONTENT_DIR, fileName);
  if (filePath !== destFilePath) {
    fs.writeFileSync(destFilePath, rawContent, 'utf8');
  }

  // Determine pattern number
  const matchNum = fileName.match(/Pattern\s*0?(\d+)/i) || rawContent.match(/#\s*[^\n]*Pattern\s*0?(\d+)/i);
  const number = matchNum ? parseInt(matchNum[1], 10) : 0;
  if (!number) continue;

  const meta = PATTERN_METADATA[number] || {
    title: `Pattern ${number}`,
    slug: `pattern-${number}`,
    coverImage: null,
    category: 'Algorithms',
    estimatedTime: '45 mins',
    summary: 'Coding pattern for technical interviews.'
  };

  // Rewrite image markdown syntax to absolute public path /patterns/images/
  let normalizedContent = rawContent
    .replace(/!\[(.*?)\]\(\.?\/?images\/(.*?)\)/g, '![$1](/patterns/images/$2)')
    .replace(/<img(.*?)src=["']\.?\/?images\/(.*?)["'](.*?)>/g, '<img$1src="/patterns/images/$2"$3>');

  // Extract all images referenced in this pattern
  const imageMatches = Array.from(normalizedContent.matchAll(/!\[(.*?)\]\((.*?)\)/g));
  const images = imageMatches.map(m => m[2]);

  // Extract overview (text between top heading and first ## problem heading)
  const lines = normalizedContent.split('\n');
  const overviewLines = [];
  let pastH1 = false;
  for (const line of lines) {
    if (line.startsWith('# ')) {
      pastH1 = true;
      continue;
    }
    if (pastH1) {
      if (line.startsWith('## ')) break;
      overviewLines.push(line);
    }
  }

  let rawOverview = overviewLines.join('\n').trim();
  // Strip HTML tags for clean card description
  let cleanSummary = rawOverview
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[#*`_>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If parsed clean summary is short or starts weirdly (e.g. course link), fallback to curated meta summary
  if (cleanSummary.length > 280) {
    cleanSummary = cleanSummary.slice(0, 280).replace(/\s+\S*$/, '') + '...';
  }
  if (!cleanSummary || cleanSummary.startsWith('from this course') || cleanSummary.length < 30) {
    cleanSummary = meta.summary;
  }

  // Parse problems (sections starting with ## )
  const problemSections = [];
  const rawSections = normalizedContent.split(/\n(?=##\s+)/);

  for (let i = 1; i < rawSections.length; i++) {
    const sec = rawSections[i];
    const secLines = sec.split('\n');
    const headingLine = secLines[0] || '';
    const rawHeading = headingLine.replace(/^##\s+/, '').trim();

    // Clean emojis & tags from heading
    const cleanTitle = rawHeading
      .replace(/^[^\w\s\d'"]+/, '')
      .replace(/\s*\((easy|medium|hard)\)\s*/i, '')
      .replace(/aka.*$/i, '')
      .trim();

    // Determine difficulty
    let difficulty = 'Medium';
    if (/easy/i.test(rawHeading)) difficulty = 'Easy';
    else if (/hard/i.test(rawHeading)) difficulty = 'Hard';

    // Find LeetCode or external link
    let url = '';
    const urlMatch = sec.match(/https?:\/\/(?:www\.)?(?:leetcode\.com\/problems\/[a-zA-Z0-9_-]+|github\.com[^\s\)]+|[a-zA-Z0-9./_-]+)/);
    if (urlMatch) {
      url = urlMatch[0];
    }

    // Extract problem statement (first blockquote > )
    let description = '';
    const descMatch = sec.match(/>\s*([^\n]+(?:\n>\s*[^\n]+)*)/);
    if (descMatch) {
      description = descMatch[1].replace(/^>\s*/gm, '').replace(/<[^>]+>/g, '').trim();
    }

    // Extract time and space complexity if documented
    let timeComplexity = '';
    let spaceComplexity = '';

    const tcMatch = sec.match(/(?:time\s*complexity|time:?)\s*(?:<\/b>|:)?\s*([^\n.]+)/i);
    if (tcMatch) {
      timeComplexity = tcMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    const scMatch = sec.match(/(?:space\s*complexity|space:?)\s*(?:<\/b>|:)?\s*([^\n.]+)/i);
    if (scMatch) {
      spaceComplexity = scMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Check for matching Java solution from interviews archive
    const normKey = normalizeProblemKey(cleanTitle);
    const matchedJavaList = javaSolutionsByNormName.get(normKey) || [];
    let javaSolution = null;

    if (matchedJavaList.length > 0) {
      // Pick best matching java solution
      javaSolution = matchedJavaList[0];
    }

    problemSections.push({
      id: `problem-${number}-${i}`,
      title: cleanTitle || rawHeading,
      rawHeading,
      difficulty,
      url,
      description,
      timeComplexity: timeComplexity || null,
      spaceComplexity: spaceComplexity || null,
      hasJavaSolution: Boolean(javaSolution),
      javaSolution: javaSolution ? {
        title: javaSolution.title,
        fileName: javaSolution.fileName,
        category: javaSolution.category,
        group: javaSolution.group,
        code: javaSolution.code
      } : null
    });
  }

  // Cover image preference: curated cover image, or first image in markdown, or null
  const coverImage = meta.coverImage || (images.length > 0 ? images[0] : null);

  patterns.push({
    id: `pattern-${String(number).padStart(2, '0')}`,
    number,
    title: meta.title,
    slug: meta.slug,
    category: meta.category,
    estimatedTime: meta.estimatedTime,
    summary: cleanSummary,
    coverImage,
    allImages: images,
    problemsCount: problemSections.length,
    problems: problemSections,
    contentMarkdown: normalizedContent,
    originalFile: fileName
  });
}

// Sort by pattern number 1..16
patterns.sort((a, b) => a.number - b.number);

console.log(`Successfully parsed all ${patterns.length} patterns!`);

// Write the main patterns data JSON
const patternsDataPath = path.join(SRC_DATA_DIR, 'dsaPatternsData.json');
fs.writeFileSync(patternsDataPath, JSON.stringify({
  version: '1.0.0',
  totalPatterns: patterns.length,
  totalProblems: patterns.reduce((sum, p) => sum + p.problemsCount, 0),
  generatedAt: new Date().toISOString(),
  patterns
}, null, 2), 'utf8');

// Also write public version for direct fetching if ever needed
const publicPatternsDataPath = path.join(ROOT_DIR, 'public', 'data', 'dsa-patterns.json');
fs.writeFileSync(publicPatternsDataPath, JSON.stringify({
  version: '1.0.0',
  totalPatterns: patterns.length,
  patterns: patterns.map(p => ({
    id: p.id,
    number: p.number,
    title: p.title,
    slug: p.slug,
    category: p.category,
    estimatedTime: p.estimatedTime,
    summary: p.summary,
    coverImage: p.coverImage,
    problemsCount: p.problemsCount
  }))
}, null, 2), 'utf8');

// Write the interviews archive summary
const archiveSummaryPath = path.join(SRC_DATA_DIR, 'interviewArchiveSummary.json');
fs.writeFileSync(archiveSummaryPath, JSON.stringify({
  version: '1.0.0',
  totalCompanies: Object.keys(companySolutions).length,
  totalTopics: Object.keys(topicSolutions).length,
  companies: Object.keys(companySolutions).sort().map(comp => ({
    name: comp,
    displayName: comp.charAt(0).toUpperCase() + comp.slice(1),
    solutionsCount: companySolutions[comp].length,
    sampleProblems: companySolutions[comp].slice(0, 5).map(s => s.title)
  })),
  topics: Object.keys(topicSolutions).sort().map(topic => ({
    name: topic,
    displayName: topic.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    solutionsCount: topicSolutions[topic].length,
    sampleProblems: topicSolutions[topic].slice(0, 5).map(s => s.title)
  })),
  companySolutions,
  topicSolutions
}, null, 2), 'utf8');

console.log('DSA Patterns & Interview Archive data generated successfully!');
