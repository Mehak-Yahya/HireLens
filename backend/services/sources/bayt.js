import { chromium } from "playwright";

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const JOB_TERM_MAP = {
  "developer": [
    "developer",
    "software developer",
    "frontend developer",
    "backend developer",
    "full stack developer",
    "web developer",
    "application developer",
    "software engineer",
    "frontend",
    "backend",
    "full stack",
    "web",
    "react",
    "node",
    "python",
    "java",
    "javascript",
    "typescript",
    "php",
    "laravel",
    "ui",
    "api",
    "qa"
  ],
  "software engineer": [
    "software engineer",
    "software developer",
    "application developer",
    "full stack",
    "full-stack",
    "fullstack",
    "frontend",
    "front end",
    "backend",
    "back end",
    "web developer",
    "software development",
    "software"
  ],
  "software developer": [
    "software engineer",
    "software developer",
    "application developer",
    "full stack",
    "full-stack",
    "fullstack",
    "frontend",
    "backend",
    "web developer",
    "software development",
    "software"
  ],
  "frontend developer": [
    "frontend",
    "front end",
    "react",
    "angular",
    "vue",
    "javascript",
    "typescript",
    "web developer",
    "ui developer",
    "user interface"
  ],
  "backend developer": [
    "backend",
    "back end",
    "node",
    "node.js",
    "python",
    "django",
    "fastapi",
    "java",
    "php",
    "laravel",
    "server"
  ],
  "full stack developer": [
    "full stack",
    "full-stack",
    "fullstack",
    "software engineer",
    "software developer",
    "web developer",
    "frontend",
    "backend",
    "node",
    "react"
  ],
  "associate software engineer": [
    "associate software engineer",
    "associate developer",
    "software engineer",
    "software developer",
    "junior software",
    "junior developer",
    "full stack",
    "frontend",
    "backend",
    "web developer"
  ]
};

const NEGATIVE_ROLE_HINTS = [
  "property",
  "real estate",
  "sales",
  "marketing",
  "business development",
  "account manager",
  "hr",
  "recruitment",
  "finance",
  "medical",
  "teacher",
  "construction",
  "transport",
  "security guard",
  "cashier"
];

const TECH_ROLE_HINTS = [
  "software",
  "developer",
  "frontend",
  "backend",
  "full stack",
  "web",
  "react",
  "node",
  "python",
  "java",
  "javascript",
  "typescript",
  "php",
  "laravel",
  "api",
  "sql",
  "database",
  "qa",
  "mobile",
  "android",
  "ios",
  "cloud",
  "devops",
  "embedded",
  "ai",
  "ml",
  "engineering"
];

const getSearchTerms = (keyword = "") => {
  const cleaned = normalizeText(keyword);

  if (!cleaned) {
    return [];
  }

  const directTerms = JOB_TERM_MAP[cleaned]
    ? JOB_TERM_MAP[cleaned]
    : [cleaned];

  const parts = cleaned.split(/\s+/);
  const expanded = new Set(directTerms);

  for (const part of parts) {
    if (part.length < 3) continue;
    expanded.add(part);
  }

  if (cleaned.includes("software")) {
    expanded.add("software");
    expanded.add("software engineer");
    expanded.add("software developer");
    expanded.add("application developer");
    expanded.add("full stack");
    expanded.add("backend");
    expanded.add("frontend");
  }

  if (cleaned.includes("developer") && !cleaned.includes("software")) {
    expanded.add("developer");
    expanded.add("frontend developer");
    expanded.add("backend developer");
    expanded.add("full stack developer");
    expanded.add("web developer");
    expanded.add("software developer");
    expanded.add("software engineer");
  }

  if (cleaned.includes("frontend") || cleaned.includes("front end")) {
    expanded.add("frontend");
    expanded.add("front end");
    expanded.add("react");
    expanded.add("javascript");
    expanded.add("typescript");
  }

  if (cleaned.includes("backend") || cleaned.includes("back end")) {
    expanded.add("backend");
    expanded.add("back end");
    expanded.add("node");
    expanded.add("python");
    expanded.add("java");
  }

  if (cleaned.includes("full stack")) {
    expanded.add("full stack");
    expanded.add("full-stack");
    expanded.add("fullstack");
  }

  return [...expanded].filter(Boolean);
};

const CITY_ALIASES = {
  islamabad: ["islamabad", "rawalpindi"],
  rawalpindi: ["rawalpindi", "islamabad"],
  karachi: ["karachi"],
  lahore: ["lahore"],
  peshawar: ["peshawar"],
  quetta: ["quetta"],
  multan: ["multan"],
  faisalabad: ["faisalabad"],
  gujranwala: ["gujranwala"],
  sialkot: ["sialkot"],
  hyderabad: ["hyderabad"],
  bahawalpur: ["bahawalpur"]
};

const getCityTokens = (locationText = "") => {
  const normalized = normalizeText(locationText);
  if (!normalized) return [];

  const tokens = new Set();
  const cityNames = Object.keys(CITY_ALIASES);

  for (const city of cityNames) {
    if (normalized.includes(city)) {
      tokens.add(city);
    }
  }

  return [...tokens];
};

const areCitiesCompatible = (requestedLocation = "", actualLocation = "") => {
  const requested = normalizeText(requestedLocation);
  const actual = normalizeText(actualLocation);

  if (!requested || !actual) {
    return true;
  }

  const requestedAliases = CITY_ALIASES[requested] || [requested];
  const actualAliases = [
    ...new Set([
      ...getCityTokens(actual),
      ...(CITY_ALIASES[actual] || [actual])
    ])
  ];

  return requestedAliases.some((alias) => actualAliases.includes(alias));
};

const hasExplicitEngineeringRole = (text = "") => {
  const normalized = normalizeText(text);

  return /\b(software\s+(engineer|developer)|full\s*stack|frontend|backend|web\s+developer|application\s+developer|developer|engineer)\b/i.test(
    normalized
  );
};

const hasQualityAssuranceRole = (text = "") => {
  const normalized = normalizeText(text);

  return /\b(quality\s+assurance|sqa|qa\s+analyst|qa\s+engineer)\b/i.test(
    normalized
  );
};

const hasRemoteLikeLocation = (text = "") => {
  const normalized = normalizeText(text);

  return /(remote|hybrid)/.test(normalized);
};

export const matchesUserRequest = (
  { keyword = "", location = "" },
  title = "",
  jobLocation = "",
  description = ""
) => {
  const normalizedKeyword = normalizeText(keyword);
  const normalizedLocation = normalizeText(location);
  const titleText = normalizeText(title);
  const descriptionText = normalizeText(description);
  const locationText = normalizeText(jobLocation);
  const searchableText = `${titleText} ${descriptionText}`;

  if (!normalizedKeyword) {
    return true;
  }

  const terms = getSearchTerms(normalizedKeyword);
  const keywordMatch = terms.some((term) => {
    const normalizedTerm = normalizeText(term);
    if (!normalizedTerm) return false;
    return searchableText.includes(normalizedTerm);
  });

  const hasNegativeRole = NEGATIVE_ROLE_HINTS.some((term) =>
    searchableText.includes(normalizeText(term))
  );

  const hasTechSignal = TECH_ROLE_HINTS.some((term) =>
    searchableText.includes(normalizeText(term))
  );

  const genericDeveloperQuery = /(^|\s)(developer|developers)$/.test(normalizedKeyword);

  if (genericDeveloperQuery && hasNegativeRole) {
    return false;
  }

  let isRelevantByKeyword = keywordMatch;

  if (!isRelevantByKeyword && genericDeveloperQuery) {
    isRelevantByKeyword = hasTechSignal && !hasNegativeRole;
  }

  if (!isRelevantByKeyword) {
    const keywordWords = normalizedKeyword
      .split(/\s+/)
      .filter((word) => word.length > 2);

    const matchedWords = keywordWords.filter((word) =>
      titleText.includes(word) || descriptionText.includes(word)
    );

    if (matchedWords.length >= Math.ceil(keywordWords.length * 0.6)) {
      isRelevantByKeyword = true;
    }
  }

  if (!isRelevantByKeyword) {
    return false;
  }

  const softwareEngineerQuery = normalizedKeyword.includes("software engineer");
  const hasEngineerRoleSignal = hasExplicitEngineeringRole(searchableText);
  const hasQualityAssuranceSignal = hasQualityAssuranceRole(searchableText);

  if (softwareEngineerQuery && hasQualityAssuranceSignal && !hasEngineerRoleSignal) {
    return false;
  }

  if (softwareEngineerQuery && !hasEngineerRoleSignal && !hasQualityAssuranceSignal) {
    return false;
  }

  if (!normalizedLocation || normalizedLocation === "pakistan" || normalizedLocation === "all") {
    return true;
  }

  const requestedLocation = normalizedLocation
    .replace(/^(jobs?\s+in\s+|in\s+)/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!locationText && !requestedLocation) {
    return true;
  }

  if (!locationText) {
    return true;
  }

  if (hasRemoteLikeLocation(locationText) || hasRemoteLikeLocation(titleText)) {
    return true;
  }

  const locationMatchesRequested =
    areCitiesCompatible(requestedLocation, locationText) ||
    locationText.includes(requestedLocation) ||
    titleText.includes(requestedLocation) ||
    descriptionText.includes(requestedLocation);

  if (!locationMatchesRequested) {
    return false;
  }

  return true;
};

// =====================================================
// BAYT SCRAPER
// =====================================================

const bayt = {
  name: "Bayt",

  async search({ keyword = "", location = "" }) {
    let browser;

    try {
      keyword = keyword.trim();
      location = location.trim();

      console.log(`\nBayt search: ${keyword} - ${location}`);

      // =================================================
      // BUILD URL
      // =================================================

      const slug = keyword
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim();

      const locationSlug = location
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim();

      let url;

      if (location && location.toLowerCase() !== "pakistan") {
        url =
          `https://www.bayt.com/en/pakistan/jobs/` +
          `${slug}-jobs-in-${locationSlug}/`;
      } else {
        url =
          `https://www.bayt.com/en/pakistan/jobs/` +
          `?q=${encodeURIComponent(keyword)}`;
      }

      console.log("Bayt URL:", url);

      // =================================================
      // LAUNCH BROWSER
      // =================================================

      browser = await chromium.launch({
        headless: true
      });

      const context = await browser.newContext({
        viewport: {
          width: 1366,
          height: 768
        },

        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/151.0.0.0 Safari/537.36",

        locale: "en-US"
      });

      const page = await context.newPage();

      // =================================================
      // OPEN PAGE
      // =================================================

      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

      console.log(
        "Bayt status:",
        response?.status()
      );

      console.log(
        "Bayt page:",
        await page.title()
      );

      // =================================================
      // WAIT FOR JOB CONTENT
      // =================================================

      await page.waitForTimeout(3000);

      // Scroll slightly so lazy content can load
      await page.evaluate(() => {
        window.scrollTo(0, 700);
      });

      await page.waitForTimeout(1500);

      // =================================================
      // GET HTML
      // =================================================

      const html = await page.content();

      console.log(
        "Bayt HTML length:",
        html.length
      );

      // =================================================
      // DETECT BLOCK
      // =================================================

      const bodyText = await page.locator("body").innerText();

      if (
        bodyText.includes("Access Denied") ||
        bodyText.includes("403 Forbidden")
      ) {
        console.log(
          "Bayt blocked the browser request."
        );

        return [];
      }

      // =================================================
      // EXTRACT JOBS
      // =================================================

      const jobs = await page.evaluate(() => {
        const results = [];
        const seen = new Set();

        const links = Array.from(
          document.querySelectorAll("a[href*='/jobs/']")
        );

        for (const link of links) {
          const href = link.getAttribute("href");

          if (!href) continue;

          // Ignore category/navigation pages
          if (
            href.includes("/jobs/search") ||
            href.includes("/jobs/locations") ||
            href.includes("/jobs/?") ||
            href.endsWith("/jobs/")
          ) {
            continue;
          }

          // Actual Bayt job URLs normally end with numeric ID
          if (!/\/jobs\/[^/]+-\d+\/?$/i.test(href)) {
            continue;
          }

          const sourceUrl = href.startsWith("http")
            ? href
            : `https://www.bayt.com${href}`;

          if (seen.has(sourceUrl)) {
            continue;
          }

          // =============================================
          // FIND CARD
          // =============================================

          let card = link;

          for (let i = 0; i < 6; i++) {
            if (!card.parentElement) break;

            const text =
              card.parentElement.innerText || "";

            if (
              text.length > 80 &&
              text.length < 5000
            ) {
              card = card.parentElement;
              break;
            }

            card = card.parentElement;
          }

          const text =
            card.innerText
              ?.replace(/\s+/g, " ")
              .trim() || "";

          // =============================================
          // TITLE
          // =============================================

          let title =
            link.getAttribute("title") ||
            link.innerText ||
            "";

          title = title
            .replace(/\s+/g, " ")
            .trim();

          if (!title) continue;

          // =============================================
          // COMPANY
          // =============================================

          const normalizeCompanyText = (value = "") =>
            value.replace(/\s+/g, " ").trim();

          const isLocationOnlyText = (value = "") =>
            /^(lahore|karachi|islamabad|rawalpindi|peshawar|faisalabad|multan|gujranwala|hyderabad|sialkot|quetta|bahawalpur|pakistan|jobs?)$/i.test(
              value.trim()
            );

          const getCompanyText = (element) => {
            if (!element) return "";

            const text = normalizeCompanyText(
              element.textContent || ""
            );

            if (!text || text.length < 2) return "";
            if (isLocationOnlyText(text)) return "";

            const href = (element.getAttribute("href") || "").toLowerCase();
            if (
              href.includes("/jobs/jobs-in-") ||
              href.includes("/jobs/?") ||
              href.endsWith("/jobs/")
            ) {
              return "";
            }

            return text;
          };

          const companyCandidates = [
            card.querySelector(".job-company-location-wrapper > div:first-child a"),
            card.querySelector(".job-company-location-wrapper a.t-default.t-bold"),
            card.querySelector(".job-company-location-wrapper a[href*='/company/']"),
            card.querySelector("a[href*='/company/']"),
            card.querySelector("a.t-default.t-bold"),
            card.querySelector("a[rel='nofollow']")
          ];

          let company = "Unknown Company";

          for (const element of companyCandidates) {
            const text = getCompanyText(element);
            if (text) {
              company = text;
              break;
            }
          }

          if (company === "Unknown Company") {
            const altText =
              card.querySelector("img[alt]")?.getAttribute("alt") || "";

            const cleanedAlt = normalizeCompanyText(altText).replace(/\s+logo\s*$/i, "");
            if (cleanedAlt && !isLocationOnlyText(cleanedAlt)) {
              company = cleanedAlt;
            }
          }

          // =============================================
          // LOCATION
          // =============================================

          let jobLocation = "";

          const locationText =
            text.match(
              /\b(Lahore|Karachi|Islamabad|Rawalpindi|Peshawar|Faisalabad|Multan|Gujranwala|Hyderabad|Sialkot|Quetta|Bahawalpur)\b(?:,\s*Pakistan)?/i
            );

          if (locationText) {
            jobLocation = locationText[0];
          }

          // =============================================
          // EXPERIENCE
          // =============================================

          let experienceLevel = "";

          const lowerTitle =
            title.toLowerCase();

          if (lowerTitle.includes("principal")) {
            experienceLevel = "Principal";
          } else if (
            lowerTitle.includes("staff")
          ) {
            experienceLevel = "Staff";
          } else if (
            lowerTitle.includes("lead")
          ) {
            experienceLevel = "Lead";
          } else if (
            lowerTitle.includes("senior")
          ) {
            experienceLevel = "Senior";
          } else if (
            lowerTitle.includes("junior")
          ) {
            experienceLevel = "Junior";
          } else if (
            lowerTitle.includes("associate")
          ) {
            experienceLevel = "Associate";
          }

          // =============================================
          // POSTED
          // =============================================

          let postedAt = null;

          const posted =
            text.match(
              /\b\d+\s+(?:hours?|days?|weeks?|months?)\s+ago\b/i
            );

          if (posted) {
            postedAt = posted[0];
          }

          // =============================================
          // DESCRIPTION
          // =============================================

          let description = "";

          const summary =
            text.match(
              /Summary:\s*(.*?)(?=\d+\s+(?:hours?|days?|weeks?|months?)\s+ago|Easy Apply|$)/i
            );

          if (summary) {
            description =
              summary[1].trim();
          }

          seen.add(sourceUrl);

          results.push({
            source: "bayt",
            title,
            company,
            location: jobLocation,
            description,
            employmentType: "",
            experienceLevel,
            salary: null,
            sourceUrl,
            postedAt
          });
        }

        return results;
      });

      console.log(
        `Bayt jobs found before filtering: ${jobs.length}`
      );

      // =================================================
      // KEYWORD FILTER
      // =================================================

      // =================================================
      // FILTER KEYWORD + LOCATION USING USER REQUEST
      // =================================================

      let filteredJobs = jobs.filter((job) =>
        matchesUserRequest(
          { keyword, location },
          job.title,
          job.location,
          job.description
        )
      );

      console.log(
        `Bayt relevant jobs: ${filteredJobs.length}`
      );

      return filteredJobs;

    } catch (error) {
      console.error(
        "Bayt search failed:",
        error.message
      );

      return [];

    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
};

export default bayt;