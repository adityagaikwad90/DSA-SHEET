import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT_DIR, 'leetcode-company-wise-problems-main');
const PUBLIC_DATA_DIR = path.join(ROOT_DIR, 'public', 'data');
const PUBLIC_COMPANIES_DIR = path.join(PUBLIC_DATA_DIR, 'companies');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'data');

// Known custom display names for companies
const DISPLAY_NAMES = {
  'tcs': 'TCS',
  'oyo': 'OYO',
  'jio': 'Jio',
  'eBay': 'eBay',
  'ciena': 'Ciena',
  'blinkit': 'Blinkit',
  'carwale': 'CarWale',
  'fourkites': 'FourKites',
  'instabase': 'Instabase',
  'josh technology': 'Josh Technology',
  'opentext': 'OpenText',
  'peak6': 'PEAK6',
  'persistent systems': 'Persistent Systems',
  'razorpay': 'Razorpay',
  'redbus': 'redBus',
  'smartnews': 'SmartNews',
  'thoughtspot': 'ThoughtSpot',
  'zeta suite': 'Zeta Suite',
  'athenahealth': 'athenahealth',
  'hotstar': 'Disney+ Hotstar',
  'walmart labs': 'Walmart Labs'
};

// Top prominent companies for quick filtering / curation badges
const FEATURED_COMPANIES = new Set([
  'google', 'amazon', 'meta', 'microsoft', 'apple', 'netflix', 'uber',
  'bloomberg', 'adobe', 'salesforce', 'oracle', 'goldman-sachs', 'linkedin',
  'paypal', 'spotify', 'stripe', 'bytedance', 'tiktok', 'twitter', 'x',
  'tcs', 'infosys', 'flipkart', 'swiggy', 'zomato', 'paytm'
]);

// Helper to slugify strings safely
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Robust CSV parser handling quotes, commas within fields, and escaped quotes
function parseCSV(content) {
  const lines = content.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header line
  const headerRow = parseCSVLine(lines[0]);
  const headers = headerRow.map(h => h.trim().toLowerCase());

  const diffIdx = headers.findIndex(h => h === 'difficulty');
  const titleIdx = headers.findIndex(h => h === 'title');
  const linkIdx = headers.findIndex(h => h === 'link');
  const topicsIdx = headers.findIndex(h => h === 'topics');
  const freqIdx = headers.findIndex(h => h === 'frequency');
  const accIdx = headers.findIndex(h => h.includes('acceptance'));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    try {
      const cols = parseCSVLine(rawLine);
      const diffRaw = cols[diffIdx] || '';
      const title = (cols[titleIdx] || '').trim();
      const link = (cols[linkIdx] || '').trim();
      const topicsRaw = topicsIdx !== -1 ? cols[topicsIdx] || '' : '';
      const freqRaw = freqIdx !== -1 ? parseFloat(cols[freqIdx]) : NaN;
      const accRaw = accIdx !== -1 ? cols[accIdx] || '' : '';

      if (!title && !link) continue;

      // Normalize difficulty
      let difficulty = 'Medium';
      const dUpper = diffRaw.toUpperCase();
      if (dUpper.includes('EASY')) difficulty = 'Easy';
      else if (dUpper.includes('HARD')) difficulty = 'Hard';
      else if (dUpper.includes('MED')) difficulty = 'Medium';

      // Parse topics into an array
      const topics = topicsRaw
        ? topicsRaw.split(',').map(t => t.trim().replace(/^"|"$/g, '')).filter(Boolean)
        : [];

      // Determine stable question ID/slug
      let id = '';
      if (link) {
        const match = link.match(/\/problems\/([^/?#]+)/i);
        if (match) id = match[1].toLowerCase();
      }
      if (!id) {
        id = slugify(title);
      }

      const frequency = Number.isFinite(freqRaw) ? Math.round(freqRaw * 10) / 10 : 0;

      rows.push({
        id,
        title: title || id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        difficulty,
        link: link.startsWith('http') ? link : (link ? `https://${link}` : ''),
        topics,
        frequency,
        acceptanceRate: accRaw
      });
    } catch (err) {
      // Row parse error - record and skip
    }
  }

  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

function generate() {
  console.log('🚀 Starting Company-Wise DSA Question dataset generation...');

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  // Ensure output directories exist
  fs.mkdirSync(PUBLIC_COMPANIES_DIR, { recursive: true });
  fs.mkdirSync(SRC_DATA_DIR, { recursive: true });

  const companyDirs = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
    .map(dirent => dirent.name);

  console.log(`📂 Discovered ${companyDirs.length} potential company folders.`);

  const companiesSummary = [];
  let totalQuestionsCount = 0;
  let totalDeduplicatedQuestions = 0;
  const globalUniqueQuestions = new Set();

  for (const dirName of companyDirs) {
    const compDir = path.join(SOURCE_DIR, dirName);
    const files = fs.readdirSync(compDir)
      .filter(f => f.endsWith('.csv') && !f.startsWith('.'));

    if (files.length === 0) continue;

    const questionMap = new Map();

    for (const file of files) {
      const filePath = path.join(compDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const questions = parseCSV(content);

        for (const q of questions) {
          totalQuestionsCount++;
          if (!questionMap.has(q.id)) {
            questionMap.set(q.id, { ...q });
          } else {
            // Merge metadata: keep higher frequency and union topics
            const existing = questionMap.get(q.id);
            if (q.frequency > existing.frequency) existing.frequency = q.frequency;
            if (!existing.link && q.link) existing.link = q.link;
            if (q.topics && q.topics.length > 0) {
              const combined = Array.from(new Set([...existing.topics, ...q.topics]));
              existing.topics = combined;
            }
          }
        }
      } catch (err) {
        console.warn(`⚠️ Warning: Error reading ${filePath}:`, err.message);
      }
    }

    const questions = Array.from(questionMap.values());
    if (questions.length === 0) continue;

    // Sort questions: high frequency first, then Easy -> Medium -> Hard, then title
    const diffOrder = { Easy: 1, Medium: 2, Hard: 3 };
    questions.sort((a, b) => {
      if (b.frequency !== a.frequency) return b.frequency - a.frequency;
      if (diffOrder[a.difficulty] !== diffOrder[b.difficulty]) {
        return diffOrder[a.difficulty] - diffOrder[b.difficulty];
      }
      return a.title.localeCompare(b.title);
    });

    const slug = slugify(dirName);
    const displayName = DISPLAY_NAMES[dirName.toLowerCase()] || dirName;

    const easyCount = questions.filter(q => q.difficulty === 'Easy').length;
    const mediumCount = questions.filter(q => q.difficulty === 'Medium').length;
    const hardCount = questions.filter(q => q.difficulty === 'Hard').length;

    totalDeduplicatedQuestions += questions.length;
    questions.forEach(q => globalUniqueQuestions.add(q.id));

    const companyData = {
      name: dirName,
      displayName,
      slug,
      total: questions.length,
      counts: {
        Easy: easyCount,
        Medium: mediumCount,
        Hard: hardCount
      },
      featured: FEATURED_COMPANIES.has(slug),
      questions
    };

    // Save individual company questions JSON
    const companyJsonPath = path.join(PUBLIC_COMPANIES_DIR, `${slug}.json`);
    fs.writeFileSync(companyJsonPath, JSON.stringify(companyData, null, 2));

    // Summary item for company selector
    companiesSummary.push({
      name: dirName,
      displayName,
      slug,
      total: questions.length,
      easy: easyCount,
      medium: mediumCount,
      hard: hardCount,
      featured: FEATURED_COMPANIES.has(slug)
    });
  }

  // Sort summary: featured first, then by total questions descending, then alphabetically
  companiesSummary.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.displayName.localeCompare(b.displayName);
  });

  // Aggregate questions across all companies for the Top 100 Most Repeated Questions
  // Uses normalized LeetCode slug, counts each company only once, secondary sort by title
  const globalQuestionMap = new Map();

  for (const c of companiesSummary) {
    const compJsonPath = path.join(PUBLIC_COMPANIES_DIR, `${c.slug}.json`);
    const data = JSON.parse(fs.readFileSync(compJsonPath, 'utf-8'));
    for (const q of data.questions) {
      if (!globalQuestionMap.has(q.id)) {
        globalQuestionMap.set(q.id, {
          id: q.id,
          title: q.title,
          difficulty: q.difficulty,
          link: q.link,
          topics: q.topics ? [...q.topics] : [],
          frequency: q.frequency || 0,
          companies: new Set([c.displayName]),
          companySlugs: new Set([c.slug])
        });
      } else {
        const existing = globalQuestionMap.get(q.id);
        existing.companies.add(c.displayName);
        existing.companySlugs.add(c.slug);
        if (q.frequency > existing.frequency) existing.frequency = q.frequency;
        if (!existing.link && q.link) existing.link = q.link;
        if (q.topics && q.topics.length > 0) {
          const combined = Array.from(new Set([...existing.topics, ...q.topics]));
          existing.topics = combined;
        }
      }
    }
  }

  // Convert to array and calculate ranking
  const allRankedQuestions = Array.from(globalQuestionMap.values()).map((q) => ({
    id: q.id,
    title: q.title,
    difficulty: q.difficulty,
    link: q.link,
    topics: q.topics,
    frequency: q.frequency,
    companyCount: q.companies.size,
    companies: Array.from(q.companies).sort((a, b) => a.localeCompare(b)),
    companySlugs: Array.from(q.companySlugs)
  }));

  // Primary sort: number of distinct companies descending
  // Secondary sort: question title alphabetically
  allRankedQuestions.sort((a, b) => {
    if (b.companyCount !== a.companyCount) {
      return b.companyCount - a.companyCount;
    }
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });

  // Strictly Top 100 limit
  const top100Questions = allRankedQuestions.slice(0, 100).map((q, idx) => ({
    ...q,
    rank: idx + 1
  }));

  // Save top 100 dataset to public/data and src/data
  const top100Json = JSON.stringify(top100Questions, null, 2);
  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'most-repeated-questions.json'), top100Json);
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'mostRepeatedQuestions.json'), top100Json);

  // Generate compact problem-to-companies index for instantaneous solved calculation
  const slugToIdx = {};
  companiesSummary.forEach((c, idx) => {
    slugToIdx[c.slug] = idx;
  });

  const problemToCompanyIndices = {};
  for (const c of companiesSummary) {
    const compJsonPath = path.join(PUBLIC_COMPANIES_DIR, `${c.slug}.json`);
    const data = JSON.parse(fs.readFileSync(compJsonPath, 'utf-8'));
    for (const q of data.questions) {
      if (!problemToCompanyIndices[q.id]) problemToCompanyIndices[q.id] = [];
      problemToCompanyIndices[q.id].push(slugToIdx[c.slug]);
    }
  }

  const indexJson = JSON.stringify(problemToCompanyIndices);
  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'problem-companies-index.json'), indexJson);
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'problemCompaniesIndex.json'), indexJson);

  // Write summary files to both public/data and src/data
  const summaryJson = JSON.stringify(companiesSummary, null, 2);
  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'companies-summary.json'), summaryJson);
  fs.writeFileSync(path.join(SRC_DATA_DIR, 'companiesSummary.json'), summaryJson);

  console.log('✅ Generation Complete!');
  console.log(`📊 Valid Companies: ${companiesSummary.length}`);
  console.log(`📊 Total Question occurrences: ${totalQuestionsCount}`);
  console.log(`📊 Total Deduplicated Company Questions: ${totalDeduplicatedQuestions}`);
  console.log(`📊 Global Unique Problems: ${globalUniqueQuestions.size}`);
  console.log(`🔥 Top 100 Most Repeated generated (max company count: ${top100Questions[0]?.companyCount}, min: ${top100Questions[top100Questions.length - 1]?.companyCount})`);
  console.log(`📁 Outputs:`);
  console.log(`   - ${path.join(PUBLIC_DATA_DIR, 'companies-summary.json')}`);
  console.log(`   - ${path.join(SRC_DATA_DIR, 'companiesSummary.json')}`);
  console.log(`   - ${path.join(PUBLIC_DATA_DIR, 'most-repeated-questions.json')}`);
  console.log(`   - ${path.join(SRC_DATA_DIR, 'mostRepeatedQuestions.json')}`);
  console.log(`   - ${path.join(PUBLIC_DATA_DIR, 'problem-companies-index.json')}`);
  console.log(`   - ${PUBLIC_COMPANIES_DIR}/*.json (${companiesSummary.length} files)`);
}

generate();
