
// =====================================================
// HireLens / Job Application Extension
// content.js
// =====================================================

// XSS Protection: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Get visible text safely
function getPageText() {
  return document.body?.innerText || "";
}

// Try to find the job title from common selectors
function getJobTitle() {
  const selectors = [
    "h1",
    "[class*='job-title']",
    "[class*='jobTitle']",
    "[class*='position-title']",
    "[class*='posting-title']",
    "[data-testid*='job-title']",
    "[data-testid*='jobTitle']"
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);

    if (element?.innerText?.trim()) {
      return element.innerText.trim().substring(0, 500);
    }
  }

  return (document.title || "").substring(0, 500);
}

// Try to find company name
function getCompanyName() {
  const selectors = [
    "[class*='company-name']",
    "[class*='companyName']",
    "[class*='employer']",
    "[class*='company']",
    "[data-testid*='company']"
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);

    if (element?.innerText?.trim()) {
      return element.innerText.trim().substring(0, 500);
    }
  }

  return "";
}

// Detect whether current page looks like a job page
function isJobPage() {
  const url = window.location.href.toLowerCase();

  const jobUrlPatterns = [
    "/job/",
    "/jobs/",
    "/career/",
    "/careers/",
    "/apply/",
    "/vacancy/",
    "/vacancies/",
    "/position/",
    "/positions/",
    "/opening/",
    "/openings/",
    "applytojob.com",
    "greenhouse.io",
    "lever.co",
    "workdayjobs.com",
    "linkedin.com/jobs"
  ];

  if (
    jobUrlPatterns.some((pattern) =>
      url.includes(pattern)
    )
  ) {
    return true;
  }

  const pageText = getPageText().toLowerCase();

  const jobKeywords = [
    "job description",
    "responsibilities",
    "qualifications",
    "requirements",
    "experience",
    "apply now",
    "skills required"
  ];

  const matches = jobKeywords.filter((keyword) =>
    pageText.includes(keyword)
  ).length;

  return matches >= 2;
}

// Collect job information
function collectJobData() {
  try {
    return {
      title: getJobTitle(),
      company: getCompanyName(),
      url: window.location.href.substring(0, 2000),
      pageText: getPageText().slice(0, 15000),
      isJobPage: isJobPage()
    };
  } catch (error) {
    console.error('Error collecting job data:', error);
    return {
      title: "",
      company: "",
      url: window.location.href.substring(0, 2000),
      pageText: "",
      isJobPage: false
    };
  }
}

// =====================================================
// MESSAGE HANDLER
// =====================================================

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    try {
      if (message?.action === "GET_JOB_DATA") {
        const jobData = collectJobData();

        sendResponse({
          success: true,
          job: jobData
        });

        return true;
      }

      if (message?.action === "IS_JOB_PAGE") {
        sendResponse({
          success: true,
          isJobPage: isJobPage()
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({
        success: false,
        error: 'Handler error'
      });
      return true;
    }
  }
);

// =====================================================
// OPTIONAL PAGE DETECTION
// =====================================================

console.log(
  "HireLens content script loaded:",
  window.location.href
);

