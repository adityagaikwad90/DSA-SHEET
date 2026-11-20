# Live job openings setup

The Careers page is connected to a Firebase Cloud Functions job-feed backend. It imports published postings from ATS public feeds, caches them in Firestore, and displays direct application links in the signed-in Careers page.

## What is already implemented

- A scheduled Firebase Function refreshes configured boards every six hours.
- Greenhouse, Lever (global and EU), and Ashby public job feeds are supported.
- Removed postings are marked inactive after a successful feed refresh.
- The callable endpoint only returns active postings to signed-in users.
- Search, location and remote filters, direct apply links, and per-browser application status tracking are in the Careers UI.

No ATS credentials are needed for these public job feeds. The application is not an auto-apply bot: candidates submit on the employer's own application page.

## 1. Choose companies and identify their ATS board IDs

Each feed entry needs the provider and board slug/token. Find the company's own careers page, follow its job-listing link, and identify whether it redirects to Greenhouse, Lever, or Ashby. The final path segment is commonly the board slug. Confirm that the public feed endpoint returns JSON before adding it.

Feed URL patterns:

- Greenhouse: `https://boards-api.greenhouse.io/v1/boards/BOARD_TOKEN/jobs?content=false`
- Lever: `https://api.lever.co/v0/postings/BOARD_SLUG?mode=json`
- Lever EU: `https://api.eu.lever.co/v0/postings/BOARD_SLUG?mode=json`
- Ashby: `https://api.ashbyhq.com/posting-api/job-board/BOARD_NAME`

Provider documentation:

- [Greenhouse Job Board API](https://developers.greenhouse.io/job-board.html)
- [Lever Postings API](https://github.com/lever/postings-api)
- [Ashby Public Job Posting API](https://developers.ashbyhq.com/docs/public-job-posting-api)

The company directory is broader than the supported ATS providers. Companies on Workday or a custom platform will not appear in Live openings yet; they continue to have their career portal in the Company directory.

## 2. Add verified boards

Edit `functions/src/jobBoards.js`. Add a record for each confirmed board:

```js
exports.JOB_BOARDS = [
  {
    companyId: 'comp_415',
    companyName: 'Company display name',
    provider: 'greenhouse',
    boardSlug: 'verified-board-token',
    careersUrl: 'https://company.example/careers',
  },
];
```

Use the company's existing `id` from `src/data/careerCompaniesData.json` when it is already in the directory. For a company that is not in that directory, make a stable ID such as `custom_companyname`. Valid `provider` values are `greenhouse`, `lever`, `lever-eu`, and `ashby`. `enabled: false` temporarily disables one configured board.

The starter list includes OpenAI's Ashby board. Only add other slugs verified against the employer's own careers page. When you add additional companies, prefer the stable ID from `src/data/careerCompaniesData.json`.

## 3. Enable Firebase Functions deployment

The Firebase project already used by the web app is configured in `src/firebase.js`. Confirm you have Firebase project access and that Cloud Firestore is enabled. Scheduled Functions use Cloud Scheduler and require the Firebase project to be on the **Blaze** billing plan; review expected usage and any applicable billing alerts in Firebase before enabling it. The scheduled task runs every six hours.

From this repository root (`vite-project/`), install the Firebase CLI if needed, log in, select the existing project, install the function dependencies, and deploy:

```bash
npx firebase-tools login
npx firebase-tools use --add
cd functions
npm install
cd ..
npx firebase-tools deploy --only functions
```

When `use --add` prompts, select the same Firebase project ID shown in `src/firebase.js`. This creates the local `.firebaserc` file; keep it local unless you intentionally want to commit a shared project alias.

## 4. Run the first refresh

The scheduler will refresh automatically at its next six-hour run. To populate the page immediately after deployment, open Firebase Console → Functions / Google Cloud Scheduler, find the scheduled `refreshJobOpenings` job, and run it once. Once it completes, open `/careers` while signed in. The page calls the callable function and displays the cached roles.

## Adding or changing feeds later

1. Update `functions/src/jobBoards.js` with verified company/provider/slug details.
2. Run `npx firebase-tools deploy --only functions` from the repository root.
3. Run the scheduled job once for an immediate refresh, or wait up to six hours.

The user-specific saved/applied/interviewing/offer status currently lives in local storage on the current browser/device. It does not yet sync across devices. Job listing data is shared and cached in Firestore by the scheduled backend.
