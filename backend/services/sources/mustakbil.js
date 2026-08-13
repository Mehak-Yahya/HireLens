import axios from "axios";
import * as cheerio from "cheerio";

const mustakbil = {
  name: "Mustakbil",

  async search({ keyword, location }) {
    try {
      console.log(`Mustakbil search: ${keyword} - ${location}`);

      // Currently working Mustakbil public jobs page
      const searchUrl = "https://www.mustakbil.com/jobs/pakistan";

      const response = await axios.get(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36",

          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

          "Accept-Language": "en-US,en;q=0.9"
        },

        timeout: 15000
      });

      console.log("Mustakbil status:", response.status);

      const $ = cheerio.load(response.data);

      const jobs = [];
      const seenUrls = new Set();

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

          location,

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
          "laravel",
          "qa",
          "quality assurance",
          "sqa"
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

        return terms.some((term) =>
          title.includes(term)
        );
      });

      console.log(
        `Mustakbil relevant jobs: ${filteredJobs.length}`
      );

      return filteredJobs;

    } catch (error) {
      console.error(
        "Mustakbil search failed:",
        error.response?.status || error.message
      );

      return [];
    }
  }
};

export default mustakbil;