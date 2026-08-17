// =====================================================
// HIRELENS EXTENSION CONFIGURATION
// =====================================================
// Update these URLs based on your environment

const CONFIG = {
  // Backend API endpoints
  API_URL: 'http://localhost:5000/api/search',
  PAKISTAN_JOBS_API: 'http://localhost:5000/api/jobs/search',
  
  // Request timeout in milliseconds
  REQUEST_TIMEOUT_MS: 10000,
  
  // Environment
  isDevelopment: true,
  isProduction: false
};

// Override for production
if (CONFIG.isProduction) {
  CONFIG.API_URL = 'https://hirelens.com/api/search';
  CONFIG.PAKISTAN_JOBS_API = 'https://hirelens.com/api/jobs/search';
}
