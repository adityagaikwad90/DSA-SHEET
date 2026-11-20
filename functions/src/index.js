const { createHash } = require('node:crypto');
const admin = require('firebase-admin');
const { HttpsError, onCall } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { JOB_BOARDS } = require('./jobBoards');

admin.initializeApp();
const db = admin.firestore();
const JOBS_COLLECTION = 'job_openings';
const META_DOC = 'job_feed_meta/current';
const REGION = 'us-central1';
const BATCH_LIMIT = 400;

function safeText(value) {
  if (Array.isArray(value)) return value.map(safeText).filter(Boolean).join(', ');
  if (value && typeof value === 'object') return safeText(value.name || value.location || '');
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
}

function normalizeJob(board, item) {
  const externalId = String(item.id || item.internalJobId || item.jobId || item.reqId || '');
  const title = safeText(item.title || item.text || item.name);
  const applyUrl = safeText(item.applyUrl || item.absolute_url || item.hostedUrl || item.jobUrl);
  if (!externalId || !title || !/^https:\/\//i.test(applyUrl)) return null;

  const categories = item.categories || {};
  const location = safeText(item.location?.name || item.location || categories.location || item.primaryLocation);
  const employmentType = safeText(item.employmentType || item.commitment || categories.commitment);
  const workplaceType = safeText(item.workplaceType || item.workplace || item.remote || '');
  const publishedAt = safeText(item.updated_at || item.createdAt || item.publishedAt || item.openedAt);
  const digest = createHash('sha256').update(`${board.provider}:${board.companyId}:${externalId}`).digest('hex');

  return {
    id: digest,
    sourceJobId: externalId,
    companyId: board.companyId,
    companyName: board.companyName,
    provider: board.provider,
    title,
    department: safeText(item.department || categories.department || categories.team),
    location,
    employmentType,
    workplaceType,
    publishedAt,
    applyUrl,
    careersUrl: board.careersUrl,
    isActive: true,
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Feed request failed (${response.status})`);
  return response.json();
}

async function getBoardJobs(board) {
  const slug = encodeURIComponent(board.boardSlug);
  if (board.provider === 'greenhouse') {
    const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=false`);
    return (data.jobs || []).map((job) => normalizeJob(board, job)).filter(Boolean);
  }
  if (board.provider === 'ashby') {
    const data = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
    return (data.jobs || []).filter((job) => job.isListed !== false).map((job) => normalizeJob(board, job)).filter(Boolean);
  }
  if (board.provider === 'lever' || board.provider === 'lever-eu') {
    const host = board.provider === 'lever-eu' ? 'api.eu.lever.co' : 'api.lever.co';
    const jobs = [];
    for (let skip = 0; skip < 1000; skip += 100) {
      const page = await fetchJson(`https://${host}/v0/postings/${slug}?mode=json&limit=100&skip=${skip}`);
      if (!Array.isArray(page)) throw new Error('Invalid Lever response');
      jobs.push(...page);
      if (page.length < 100) break;
    }
    return jobs.map((job) => normalizeJob(board, job)).filter(Boolean);
  }
  throw new Error(`Unsupported job board provider: ${board.provider}`);
}

async function writeJobsForBoard(board, jobs, syncedAt) {
  const activeSnapshot = await db.collection(JOBS_COLLECTION)
    .where('companyId', '==', board.companyId).where('isActive', '==', true).get();
  const activeIds = new Set(jobs.map((job) => job.id));
  const writes = [
    ...jobs.map((job) => ({ ref: db.collection(JOBS_COLLECTION).doc(job.id), data: { ...job, syncedAt } })),
    ...activeSnapshot.docs.filter((doc) => !activeIds.has(doc.id)).map((doc) => ({ ref: doc.ref, data: { isActive: false, syncedAt } })),
  ];

  for (let offset = 0; offset < writes.length; offset += BATCH_LIMIT) {
    const batch = db.batch();
    writes.slice(offset, offset + BATCH_LIMIT).forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
    await batch.commit();
  }
}

async function syncJobBoards() {
  const startedAt = new Date().toISOString();
  let imported = 0;
  const failures = [];
  for (const board of JOB_BOARDS.filter((item) => item.enabled !== false)) {
    try {
      const jobs = await getBoardJobs(board);
      await writeJobsForBoard(board, jobs, startedAt);
      imported += jobs.length;
    } catch (error) {
      console.error(`Job feed failed for ${board.companyName}`, error);
      failures.push(board.companyId);
    }
  }
  await db.doc(META_DOC).set({ updatedAt: startedAt, boardCount: JOB_BOARDS.length, importedCount: imported, failedBoardIds: failures }, { merge: true });
  console.info(`Job feeds refreshed: ${imported} roles, ${failures.length} failed boards.`);
}

exports.refreshJobOpenings = onSchedule({ schedule: 'every 6 hours', timeZone: 'Etc/UTC', region: REGION, timeoutSeconds: 540, memory: '512MiB' }, syncJobBoards);

exports.getLiveJobOpenings = onCall({ region: REGION, maxInstances: 10 }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to view live job openings.');
  const snapshot = await db.collection(JOBS_COLLECTION).where('isActive', '==', true).limit(500).get();
  const meta = await db.doc(META_DOC).get();
  return {
    jobs: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    updatedAt: meta.exists ? meta.data().updatedAt : null,
  };
});
