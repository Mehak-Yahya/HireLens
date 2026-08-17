import axios from "axios";
import * as cheerio from "cheerio";

// Rate limiting and retry constants
const REQUEST_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
let lastRequestTime = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const validateInput = (keyword, location) => {
  if (!keyword || typeof keyword !== "string" || keyword.trim().length === 0) {
    throw new Error("Invalid keyword: must be non-empty string");
  }
  if (location && typeof location !== "string") {
    throw new Error("Invalid location: must be string");
  }
  return true;
};

const mustakbil = {
  name: "Mustakbil",

  async search({ keyword, location }) {
    try {
      // Validate inputs
      validateInput(keyword, location);
      console.log(`Mustakbil search: ${keyword} - ${location}`);

      // Apply rate limiting
      const timeSinceLastRequest = Date.now() - lastRequestTime;
      if (timeSinceLastRequest < REQUEST_DELAY_MS) {
        await sleep(REQUEST_DELAY_MS - timeSinceLastRequest);
      }
      lastRequestTime = Date.now();

      // Currently working Mustakbil public jobs page
      const searchUrl = "https://www.mustakbil.com/jobs/pakistan";

      let response;
      let attempt = 0;
      
      while (attempt < MAX_RETRIES) {
        try {
          response = await axios.get(searchUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36",

              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

              "Accept-Language": "en-US,en;q=0.9"
            },

            timeout: 15000
          });

          if (!response || response.status !== 200) {
            console.error("Invalid response status:", response?.status);
            return [];
          }

          console.log("Mustakbil status:", response.status);
          break; // Success, exit retry loop
        } catch (error) {
          attempt++;
          if (attempt >= MAX_RETRIES) throw error;
          console.warn(`Mustakbil request failed (attempt ${attempt}), retrying...`);
          await sleep(RETRY_DELAY_MS);
        }
      }

      const $ = cheerio.load(response.data);

      const jobs = [];
      const seenUrls = new Set();

      const extractLocationFromText = (text = "") => {
        if (!text) {
          return "";
        }

        const match = text.match(
          /\b(Lahore|Karachi|Islamabad|Rawalpindi|Peshawar|Faisalabad|Multan|Remote|Hybrid|Pakistan)\b/i
        );

        return match ? match[0].trim() : "";
      };

      // =====================================================
      // EXTRACT JOBS
      // =====================================================

      $("a[href*='/jobs/job/']").each((index, element) => {
        const href = $(element).attr("href");

        if (!href) {
          return;
        }

        const url = href.startsWith("http")
          ? href
          : `https://www.mustakbil.com${href}`;

        // Remove duplicate job URLs
        if (seenUrls.has(url)) {
          return;
        }

        let title = $(element)
          .text()
          .replace(/arrow_forward/gi, "")
          .trim();

        // Ignore buttons/navigation
        if (
          !title ||
          title.toLowerCase().includes("view job")
        ) {
          return;
        }

        const card = $(element).closest("article") || $(element).closest(".jc-card");

        const cardText = card.length
          ? card.text().replace(/\s+/g, " ").trim()
          : $(element).parent().text().replace(/\s+/g, " ").trim();

        const jobLocation =
          extractLocationFromText(cardText) ||
          extractLocationFromText(title);

        const company =
          card
            .find(".jc-byline__company")
            .first()
            .text()
            .replace(/\s+/g, " ")
            .trim() ||
          card
            .find("a[href*='/companies/company/']")
            .first()
            .text()
            .replace(/\s+/g, " ")
            .trim() ||
          $(element)
            .closest(".jd-hero__brand-copy")
            .find("a.jd-hero__company")
            .first()
            .text()
            .replace(/\s+/g, " ")
            .trim() ||
          "Unknown Company";

        seenUrls.add(url);

        jobs.push({
          source: "mustakbil",

          title,

          company,

          location: jobLocation,

          employmentType: "",

          experienceLevel: "",

          salary: null,

          sourceUrl: url,

          postedAt: null
        });
      });

      console.log(
        `Mustakbil jobs found before filtering: ${jobs.length}`
      );

      // =====================================================
      // KEYWORD MATCHING
      // =====================================================

      const searchTerm = keyword
        .toLowerCase()
        .trim();

      const relatedTerms = {
        "software engineer": [
          "software engineer",
          "software developer",
          "full stack",
          "fullstack",
          "frontend",
          "front end",
          "backend",
          "back end",
          "web developer",
          "application developer",
          "node",
          "react",
          "angular",
          "vue",
          "javascript",
          "typescript",
          "python developer",
          "java developer",
          "php developer",
          "laravel"
        ],

        "associate software engineer": [
          "associate software engineer",
          "software engineer",
          "software developer",
          "associate developer",
          "junior software",
          "junior developer",
          "full stack",
          "fullstack",
          "frontend",
          "front end",
          "backend",
          "back end",
          "web developer",
          "node",
          "react",
          "angular"
        ],

        "frontend developer": [
          "frontend",
          "front end",
          "react",
          "angular",
          "vue",
          "javascript",
          "typescript",
          "web developer"
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
          "fullstack",
          "software engineer",
          "software developer",
          "web developer",
          "frontend",
          "backend",
          "node",
          "react"
        ]
      };

      const terms =
        relatedTerms[searchTerm] || [searchTerm];

      // =====================================================
      // FILTER RELEVANT JOBS
      // =====================================================

      const filteredJobs = jobs.filter((job) => {
        const title = job.title.toLowerCase();

        if (
          searchTerm === "software engineer" &&
          /(quality assurance|sqa|qa analyst|qa engineer)/.test(title) &&
          !/(software engineer|software developer|developer|engineer|full stack|frontend|backend|node|react|python|java|javascript)/.test(title)
        ) {
          return false;
        }

        if (
          searchTerm === "software engineer" &&
          !/(software engineer|software developer|developer|engineer|full stack|frontend|backend|node\.?js|react|python|java|javascript|typescript)/.test(title)
        ) {
          return false;
        }

        return terms.some((term) =>
          title.includes(term)
        );
      });

      console.log(
        `Mustakbil relevant jobs: ${filteredJobs.length}`
      );

      return filteredJobs;

    } catch (error) {
      const errorMsg = error.response?.status 
        ? `HTTP ${error.response.status}` 
        : error.message;
      console.error(`Mustakbil search failed: ${errorMsg}`);
      
      // Don't expose sensitive error details
      if (error.response?.status === 429) {
        console.warn("Rate limited by Mustakbil, backing off...");
      }
      
      return [];
    }
  }
};

export default mustakbil;