// Add boards only after confirming the ATS provider and board slug from the
// company's careers site. These are public job feeds; no ATS credentials belong here.
//
// Example (replace the provider and slug with values verified from that company's careers site):
// { companyId: 'comp_415', companyName: 'Company name', provider: 'greenhouse', boardSlug: 'verified-board-token', careersUrl: 'https://company.example/careers' }
//
// Supported provider values: greenhouse, lever, lever-eu, ashby.
exports.JOB_BOARDS = [
  {
    companyId: 'custom_openai',
    companyName: 'OpenAI',
    provider: 'ashby',
    boardSlug: 'openai',
    careersUrl: 'https://openai.com/careers/',
  },
];
