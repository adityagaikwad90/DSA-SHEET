import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ZIP_PATH = path.resolve(__dirname, '../../moreThanFAANGM-main.zip');
const OUTPUT_PATH = path.resolve(__dirname, '../src/data/careerCompaniesData.json');

console.log('Extracting and parsing moreThanFAANGM dataset from:', ZIP_PATH);

if (!fs.existsSync(ZIP_PATH)) {
  if (fs.existsSync(OUTPUT_PATH)) {
    console.warn('Career data source archive not found; using the existing generated dataset.');
    process.exit(0);
  }

  console.error('ZIP file not found and no generated career dataset exists:', ZIP_PATH);
  process.exit(1);
}

const readmeContent = execSync(`unzip -p "${ZIP_PATH}" moreThanFAANGM-main/README.md`).toString();
const regex = /<li><a href="([^"]+)">([^<]+)<\/a>\s*<\/li>/g;

const CATEGORY_RULES = [
  {
    category: 'Big Tech & Tier 1',
    keywords: ['google', 'meta', 'amazon', 'apple', 'microsoft', 'netflix', 'adobe', 'uber', 'airbnb', 'oracle', 'salesforce', 'nvidia', 'intel', 'amd', 'cisco', 'ibm', 'qualcomm', 'atlassian', 'twitter', 'x', 'linkedin', 'spotify', 'tesla']
  },
  {
    category: 'FinTech & Quant',
    keywords: ['stripe', 'paypal', 'razorpay', 'cred', 'visa', 'mastercard', 'american express', 'goldman', 'morgan stanley', 'jpmorgan', 'chase', 'de shaw', 'd.e. shaw', 'alpha-grep', 'angelone', 'angel one', 'coindcx', 'coinbase', 'phonepe', 'bharatpe', 'zerodha', 'groww', 'paytm', 'barclays', 'fidelity', 'citadel', 'two sigma', 'jump trading', 'tower research', 'affirm', 'klarna', 'robinhood', 'plaid', 'sofi', 'revolut', 'acko', 'navi', 'rupeek', 'jupiter', 'fi money', 'scripbox', 'kuvera', 'slice']
  },
  {
    category: 'Cloud & Enterprise SaaS',
    keywords: ['databricks', 'snowflake', 'postman', 'mongodb', 'elastic', 'akamai', 'cloudflare', 'twilio', 'vmware', 'zoom', 'github', 'gitlab', 'vercel', 'supabase', 'hasura', 'browserstack', 'freshworks', 'zoho', 'servicenow', 'workday', 'sap', 'hashicorp', 'confluent', 'splunk', 'datadog', 'dynatrace', 'new relic', 'pagerduty', 'docker', 'canonical', 'red hat', 'suse', 'inmobi', 'chargebee', 'druva', 'harness', 'clevertap', 'moengage', 'sprinklr', 'highradius', 'mindtickle', 'whatfix', 'postman', 'airbase']
  },
  {
    category: 'High-Growth Startups & Unicorns',
    keywords: ['swiggy', 'zomato', 'meesho', 'urban company', 'zepto', 'blinkit', 'dream11', 'sharechat', 'ola', 'rapido', 'nykaa', 'spinny', 'cars24', 'carwale', 'curefit', 'cult.fit', 'unacademy', 'byju', 'eruditus', 'upgrad', 'leadiq', 'apna', 'kuku fm', 'pocket fm', 'glance', 'mpl', 'games24x7', 'winzo', 'gameskraft', 'udaan', 'shadowfax', 'delhivery', 'shiprocket', 'dunzo', 'porter', 'blackbuck', 'khatabook', 'okcredit', 'dukaan', 'classplus', 'teachmint', 'loco', 'rooter']
  },
  {
    category: 'AI & DeepTech',
    keywords: ['openai', 'anthropic', 'agnikul', 'agnikul cosmos', 'pixxel', 'skyroot', 'bellatrix', 'greyorange', 'addverb', 'tonbo', 'ideaforge', 'neuralink', 'spacex', 'scale ai', 'hugging face', 'cohere', 'mistral', 'runway', 'midjourney', 'jasper', 'synthesia', 'soundhound', 'cerence', 'applied intuition', 'waymo', 'cruise', 'aurora', 'nuro', 'samsung r&d', 'ti', 'texas instruments', 'broadcom', 'synopsys', 'cadence', 'arm', 'asml', 'nxp', 'micron', 'western digital', 'seagate']
  },
  {
    category: 'E-Commerce & Digital Media',
    keywords: ['flipkart', 'myntra', 'ajio', 'tata 1mg', 'pharmeasy', 'netmeds', 'medlife', 'disney', 'hotstar', 'sony', 'activision', 'blizzard', 'electronic arts', 'ea', 'ubisoft', 'riot games', 'epic games', 'krafton', 'zynga', 'bytedance', 'tiktok', 'snap', 'pinterest', 'reddit', 'discord', 'twitch', 'dailymotion', 'zee', 'voot', 'jio cinema', 'bookmyshow', 'makemytrip', 'goibibo', 'yatra', 'cleartrip', 'ixigo', 'redbus', 'oyoclass', 'oyo', 'treebo', 'fabhotels', 'airbnb', 'expedia', 'booking.com', 'agoda', 'kayak', 'trivago']
  }
];

const FEATURED_COMPANIES = new Set([
  'google', 'meta', 'amazon', 'apple', 'microsoft', 'netflix', 'adobe', 'uber', 'airbnb', 
  'stripe', 'goldman sachs', 'morgan stanley', 'de shaw', 'atlassian', 'salesforce', 
  'nvidia', 'databricks', 'snowflake', 'postman', 'razorpay', 'cred', 'swiggy', 'zomato', 
  'flipkart', 'meesho', 'zepto', 'blinkit', 'browserstack', 'dream11', 'zerodha'
]);

function determineCategory(name, domain, url) {
  const combined = `${name} ${domain} ${url}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => combined.includes(kw))) {
      return rule.category;
    }
  }
  return 'Global Product Leaders';
}

let match;
const companies = [];
let id = 1;

while ((match = regex.exec(readmeContent)) !== null) {
  const url = match[1].trim();
  const rawName = match[2].trim();

  let domain = '';
  try {
    const parsed = new URL(url);
    domain = parsed.hostname.replace(/^www\./, '');
  } catch (e) {
    domain = '';
  }

  const cleanName = rawName.replace(/\s+/g, ' ');
  const firstChar = cleanName.charAt(0).toUpperCase();
  const letter = /^[A-Z]$/.test(firstChar) ? firstChar : '0-9';

  const category = determineCategory(cleanName, domain, url);
  const isFeatured = FEATURED_COMPANIES.has(cleanName.toLowerCase()) || 
                     FEATURED_COMPANIES.has(cleanName.split(' ')[0].toLowerCase());

  companies.push({
    id: `comp_${id++}`,
    name: cleanName,
    url,
    domain,
    letter,
    category,
    featured: isFeatured,
    remoteFriendly: true,
    hiringRoles: [
      'Software Development Engineer',
      'Frontend / React',
      'Backend / Distributed Systems',
      'Full Stack Engineer',
      'System Architecture'
    ]
  });
}

// Sort alphabetically by company name
companies.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

// Group stats
const categoryCounts = {};
companies.forEach(c => {
  categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
});

const output = {
  totalCount: companies.length,
  updatedAt: new Date().toISOString(),
  categoryCounts,
  companies
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');

console.log(`Successfully generated ${companies.length} companies to:`, OUTPUT_PATH);
console.log('Category breakdown:', categoryCounts);

