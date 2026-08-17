// Production Railway backend
const PRODUCTION_API = 'https://hirelens-production-c545.up.railway.app';

const API_URL = typeof CONFIG !== 'undefined'
  ? CONFIG.API_URL
  : `${PRODUCTION_API}/api/search`;

const PAKISTAN_JOBS_API = typeof CONFIG !== 'undefined'
  ? CONFIG.PAKISTAN_JOBS_API
  : `${PRODUCTION_API}/api/jobs/search`;

const REQUEST_TIMEOUT_MS = typeof CONFIG !== 'undefined'
  ? CONFIG.REQUEST_TIMEOUT_MS
  : 10000;

const searchBtn = document.getElementById("searchBtn");
const searchBtnText = document.getElementById("searchBtnText");
const keywordInput = document.getElementById("keyword");
const locationInput = document.getElementById("location");
const pageStatus = document.getElementById("pageStatus");
const jobCard = document.getElementById("jobCard");
const resultsSection = document.getElementById("resultsSection");
const jobsList = document.getElementById("jobsList");
const resultCount = document.getElementById("resultCount");
const message = document.getElementById("message");

document.addEventListener("DOMContentLoaded", () => {
  detectCurrentJob();
  searchBtn?.addEventListener("click", searchJobs);
});

// DETECT CURRENT JOB
async function detectCurrentJob() {
  if (!jobCard || !pageStatus) {
    console.error("Current job elements are missing.");
    return;
  }
  pageStatus.textContent = "Detecting...";
  pageStatus.className = "badge";

  jobCard.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      Checking current page...
    </div>
  `;

  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    const tab = tabs?.[0];
    if (!tab?.id) {
      showNoJob("Unable to access the current tab.");
      return;
    }

    // Chrome internal pages cannot run content scripts
    if (
      !tab.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:")
    ) {
      showNoJob("Open a normal job website first.");
      return;
    }
    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, {
        action: "GET_JOB_DATA"
      });
    } catch (error) {
      console.warn(
        "Content script communication failed:",
        error.message
      );

      showNoJob(
        "Refresh the job page and open HireLens again."
      );

      return;
    }

    if (!response?.success || !response.job) {
      showNoJob("No job information detected.");
      return;
    }

    const job = response.job;

    if (!job.isJobPage) {
      showNoJob(
        "This page does not appear to be a job posting."
      );

      return;
    }

    showDetectedJob(job);

  } catch (error) {
    console.error(
      "Job detection failed:",
      error
    );

    showNoJob(
      "Could not analyze this page."
    );
  }
}

// SHOW DETECTED JOB
function showDetectedJob(job) {
  pageStatus.textContent = "Job Detected";
  pageStatus.className = "badge success";

  const title = escapeHtml(
    job.title || "Untitled Job"
  );

  const company = escapeHtml(
    job.company || "Company not detected"
  );

  const url = escapeHtml(
    job.url || ""
  );
  jobCard.innerHTML = `
    <div class="detected-job">

      <div class="detected-job-title">
        ${title}
      </div>

      <div class="detected-company">
        ${company}
      </div>

      <div class="job-url">
        ${url}
      </div>

      <div class="job-actions">

        <button id="analyzeCurrentJob">
          Analyze Job
        </button>

        <button id="openCurrentJob">
          Open Page
        </button>

      </div>

    </div>
  `;

  document
    .getElementById("analyzeCurrentJob")
    ?.addEventListener(
      "click",
      () => analyzeCurrentJob(job)
    );

  document
    .getElementById("openCurrentJob")
    ?.addEventListener(
      "click",
      () => openCurrentJob(job.url)
    );
}

// SHOW NO JOB
function showNoJob(text) {
  if (pageStatus) {
    pageStatus.textContent = "Not Detected";
    pageStatus.className = "badge error";
  }
  if (jobCard) {
    jobCard.innerHTML = `
      <div class="job-placeholder">

        <div class="placeholder-icon">
          💼
        </div>

        <h3>No job detected</h3>

        <p>
          ${escapeHtml(text)}
        </p>

      </div>
    `;
  }
}

// ANALYZE CURRENT JOB
async function analyzeCurrentJob(job) {
  if (!job) {
    showMessage(
      "No job information available.",
      "error"
    );

    return;
  }
  showMessage(
    "Job detected successfully. AI analysis will be added next.",
    "success"
  );
}

// OPEN CURRENT JOB
function openCurrentJob(url) {
  if (!url) {
    return;
  }
  chrome.tabs.create({
    url
  });
}

// SEARCH JOBS
// EXISTING COMPANY SEARCH + NEW PAKISTAN JOBS
async function searchJobs() {
  const keyword =
    keywordInput?.value?.trim() || "";

  const location =
    locationInput?.value?.trim() || "";

  if (!keyword) {
    showMessage(
      "Please enter a job title.",
      "error"
    );

    keywordInput?.focus();

    return;
  }
  if (!location) {
    showMessage(
      "Please enter a location.",
      "error"
    );
    locationInput?.focus();
    return;
  }
  setLoading(true);
  hideMessage();

  if (resultsSection) {
    resultsSection.classList.add("hidden");
  }

  console.log(
    `Initiating search request for keyword='${keyword}' location='${location}'`
  );

  showMessage(
    "Searching jobs...",
    "info"
  );

  try {

    // 1. EXISTING COMPANY/SOURCE SEARCH
    const existingSearchPromise = fetch(
      API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          keyword,
          location
        })
      }
    );

    // 2. NEW PAKISTAN JOBS SEARCH
    const pakistanSearchPromise =
      searchPakistanJobs(
        keyword,
        location
      );

    // Run both at the same time
    const [
      existingResponse,
      pakistanJobs
    ] = await Promise.all([
      existingSearchPromise,
      pakistanSearchPromise
    ]);

    // PROCESS EXISTING SEARCH
    if (!existingResponse.ok) {
      throw new Error(
        `Existing search server returned ${existingResponse.status}`
      );
    }
    const existingData =
      await existingResponse.json();

    console.log(
      "Existing search response:",
      existingData
    );

    if (!existingData.success) {
      throw new Error(
        existingData.message ||
        "Existing job search failed."
      );
    }

    const existingJobs =
      Array.isArray(existingData.jobs)
        ? existingData.jobs
        : [];

    // NORMALIZE NEW PAKISTAN JOBS
    const normalizedPakistanJobs =
      pakistanJobs.map(
        normalizePakistanJob
      );

    // COMBINE BOTH SOURCES
    const combinedJobs = [
      ...existingJobs,
      ...normalizedPakistanJobs
    ];

    // Remove duplicate jobs
    const uniqueJobs =
      removeDuplicateJobs(
        combinedJobs
      );

    console.log(
      "Combined jobs:",
      uniqueJobs
    );
    // DISPLAY
    displayJobs(
      uniqueJobs
    );

    const existingCount =
      existingJobs.length;

    const pakistanCount =
      normalizedPakistanJobs.length;

    showMessage(
      `${uniqueJobs.length} jobs found. ` +
      `${existingCount} existing + ` +
      `${pakistanCount} Pakistan jobs.`,
      "success"
    );

    // KEEP EXISTING BACKGROUND REFRESH
    if (existingData.backgroundScrape) {

      showMessage(
        `${uniqueJobs.length} jobs shown. Refreshing live results...`,
        "success"
      );

      setTimeout(() => {
        refreshSearch(
          keyword,
          location
        );

      }, 5000);
    }

  } catch (error) {

    console.error(
      "Job search failed:",
      error
    );
    showMessage(
      getSearchErrorMessage(error),
      "error"
    );

  } finally {

    setLoading(false);

  }
}

// SEARCH PAKISTAN JOBS
// NEW API — DOES NOT REPLACE EXISTING SEARCH
async function searchPakistanJobs(
  keyword,
  location
) {
  try {
    // Validate inputs
    if (!keyword || typeof keyword !== 'string') {
      console.error('Invalid keyword');
      return [];
    }
    if (location && typeof location !== 'string') {
      console.error('Invalid location');
      return [];
    }

    const params =
      new URLSearchParams({
        keyword: keyword.substring(0, 100),
        location: location.substring(0, 100)
      });

    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response =
      await fetch(
        `${PAKISTAN_JOBS_API}?${params.toString()}`,
        {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Accept": "application/json"
          }
        }
      );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        "Pakistan jobs API:",
        response.status
      );
      return [];
    }

    const data =
      await response.json();

    console.log(
      "Pakistan jobs response:",
      data
    );

    if (!data.success) {
      return [];
    }

    return Array.isArray(data.jobs)
      ? data.jobs
      : [];

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Pakistan jobs search timeout');
    } else {
      console.error(
        "Pakistan jobs search failed:",
        error
      );
    }
    return [];
  }
}

// NORMALIZE PAKISTAN JOB
function normalizePakistanJob(job) {

  let location = "Not specified";

  if (
    typeof job.location === "string"
  ) {

    location =
      job.location;

  } else if (
    job.location
  ) {

    location =
      job.location.raw ||
      job.location.city ||
      "Not specified";
  }

  return {

    ...job,
    // Make the new API compatible
    // with the existing UI.

    source:
      job.source ||
      "Job Listings API",

    sourceUrl:
      job.url ||
      job.sourceUrl ||
      "",

    location,

    experienceLevel:
      job.experienceLevel ||
      "Not specified",

    employmentType:
      job.employmentType ||
      "Not specified"
  };
}

// REMOVE DUPLICATES
function removeDuplicateJobs(
  jobs
) {

  const seen =
    new Set();

  return jobs.filter(
    (job) => {

      const key =
        (
          job.sourceUrl ||
          job.url ||
          `${job.title}-${job.company}`
        )
        .toLowerCase()
        .trim();

      if (!key) {
        return true;
      }

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    }
  );
}

// EXISTING REFRESH SEARCH
async function refreshSearch(
  keyword,
  location
) {

  try {

    const response =
      await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            keyword,
            location,
            forceLive: true
          })
        }
      );

    if (!response.ok) {

      throw new Error(
        `Server returned ${response.status}`
      );

    }

    const data =
      await response.json();

    if (!data.success) {

      throw new Error(
        data.message ||
        "Job search failed."
      );

    }

    if (
      data.jobs?.length > 0
    ) {

      displayJobs(
        data.jobs
      );

      const sourceLabel =
        data.source === "cache"
          ? "Cached results"
          : "Live results";

      showMessage(
        `${data.jobs.length} jobs found. ${sourceLabel}.`,
        "success"
      );

    } else {

      showMessage(
        "Live refresh found no new matching jobs. Showing cached results.",
        "info"
      );

    }

  } catch (error) {

    console.error(
      "Live refresh failed:",
      error
    );

    showMessage(
      "Live refresh failed. Showing cached results.",
      "error"
    );
  }
}

// DISPLAY JOBS
function displayJobs(
  jobs
) {

  if (
    !resultsSection ||
    !jobsList ||
    !resultCount
  ) {

    console.error(
      "Search result elements are missing."
    );

    return;
  }

  jobsList.innerHTML =
    "";

  resultCount.textContent =
    jobs.length;

  resultsSection.classList.remove(
    "hidden"
  );

  if (!jobs.length) {

    jobsList.innerHTML = `
      <div class="loading">
        No matching jobs found.
      </div>
    `;

    return;
  }

  jobs.forEach(
    (job) => {

      const card =
        createJobCard(
          job
        );

      jobsList.appendChild(
        card
      );

    }
  );
}

// CREATE JOB CARD
function createJobCard(
  job
) {

  const card =
    document.createElement(
      "div"
    );

  card.className =
    "result-job";

  const title =
    escapeHtml(
      job.title ||
      "Untitled Position"
    );

  const company =
    escapeHtml(
      job.company ||
      "Unknown Company"
    );

  // Support both:
  // Existing API location string
  // New API location object

  let locationText =
    "Not specified";

  if (
    typeof job.location ===
    "string"
  ) {

    locationText =
      job.location;

  } else if (
    job.location
  ) {

    locationText =
      job.location.raw ||
      job.location.city ||
      "Not specified";
  }

  const location =
    escapeHtml(
      locationText
    );

  const experience =
    escapeHtml(
      job.experienceLevel ||
      "Not specified"
    );

  const employment =
    escapeHtml(
      job.employmentType ||
      "Not specified"
    );

  // Support both APIs
  const sourceUrl =
    job.sourceUrl ||
    job.url ||
    "";

  const source =
    escapeHtml(
      job.source ||
      ""
    );

  card.innerHTML = `
    <div class="result-job-title">
      ${title}
    </div>

    <div class="result-job-company">
      ${company}
    </div>

    <div class="result-job-location">
      ${location}
    </div>

    ${
      source
        ? `
          <div class="result-job-source">
            ${source}
          </div>
        `
        : ""
    }

    <button class="view-job-btn">
      View Job
    </button>
  `;

  const viewButton =
    card.querySelector(
      ".view-job-btn"
    );

  viewButton?.addEventListener(
    "click",
    () => {

      if (!sourceUrl) {

        showMessage(
          "This job does not have a valid URL.",
          "error"
        );

        return;
      }

      chrome.tabs.create({
        url: sourceUrl
      });

    }
  );

  return card;
}

// LOADING STATE
function setLoading(
  isLoading
) {

  if (
    !searchBtn ||
    !searchBtnText
  ) {

    console.error(
      "Search button elements are missing."
    );

    return;
  }

  searchBtn.disabled =
    isLoading;

  if (isLoading) {

    searchBtnText.innerHTML = `
      <span
        class="spinner"
        style="
          display:inline-block;
          width:13px;
          height:13px;
          margin:0 6px 0 0;
          border-width:2px;
          vertical-align:-2px;
        ">
      </span>
      Searching...
    `;

  } else {

    searchBtnText.textContent =
      "Search Jobs";

  }
}

// MESSAGE
function showMessage(
  text,
  type = ""
) {

  if (!message) {

    console.error(
      "Message element is missing."
    );

    return;
  }

  message.textContent =
    text;

  message.className =
    `message ${type}`;

  message.classList.remove(
    "hidden"
  );
}

// HIDE MESSAGE
function hideMessage() {

  if (!message) {
    return;
  }

  message.classList.add(
    "hidden"
  );
}

// SEARCH ERROR MESSAGE

function getSearchErrorMessage(
  error
) {

  if (
    error?.message?.includes(
      "Failed to fetch"
    )
  ) {

    return (
      "Cannot connect to the backend. " +
      "Make sure your Node.js server is running."
    );

  }

  return (
    error?.message ||
    "Job search failed."
  );
}

// ESCAPE HTML
function escapeHtml(
  value
) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

