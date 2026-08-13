import axios from "axios";
import * as cheerio from "cheerio";
import careerSources from "../careerSources.js";

// =====================================================
// JOB TITLE KEYWORDS
// =====================================================

const JOB_TITLE_KEYWORDS = [
  "software engineer",
  "software developer",
  "frontend developer",
  "front end developer",
  "backend developer",
  "back end developer",
  "full stack developer",
  "full-stack developer",
  "mern developer",
  "react developer",
  "node.js developer",
  "node developer",
  "python developer",
  "java developer",
  "mobile developer",
  "flutter developer",
  "devops engineer",
  "qa engineer",
  "quality assurance engineer",
  "data engineer",
  "machine learning engineer",
  "ai engineer",
  "ml engineer",
  "network engineer",
  "support engineer",
  "cyber security engineer",
  "security engineer",
  "cloud engineer",
  "software architect",
  "technical lead",
  "tech lead",
  "web developer",
  "ios developer",
  "android developer",
  "intern",
  "trainee"
];

// =====================================================
// JOB PAGE CONTENT KEYWORDS
// =====================================================

const JOB_PAGE_KEYWORDS = [
  "job description",
  "job responsibilities",
  "responsibilities",
  "requirements",
  "qualifications",
  "experience",
  "apply now",
  "apply for this job",
  "skills required",
  "education",
  "about the role",
  "about this role",
  "what you'll do",
  "what you will do"
];

// =====================================================
// URL PATTERNS THAT OFTEN REPRESENT JOB PAGES
// =====================================================

const JOB_URL_PATTERNS = [
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
  "/job-detail/",
  "/job-details/",
  "/jobdetail/",
  "/job-details",
  "applytojob.com"
];

// =====================================================
// NORMALIZE TEXT
// =====================================================

const normalizeText = (text = "") => {
  return text
    .replace(/\s+/g, " ")
    .trim();
};

// =====================================================
// CHECK JOB TITLE
// =====================================================

const looksLikeJobTitle = (title, keyword) => {
  const normalizedTitle = title
    .toLowerCase()
    .trim();

  const normalizedKeyword = (keyword || "")
    .toLowerCase()
    .trim();

  // If a user provided a search keyword, require the title to include it
  // as an exact phrase (whole-word match).
  if (normalizedKeyword) {
    // Tokenize the keyword and require all tokens to appear as whole words
    const tokens = normalizedKeyword.split(/\s+/).filter(Boolean);

    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    return tokens.every((t) => {
      const tokenRegex = new RegExp(`\\b${escapeRegex(t)}\\b`, "i");

      return tokenRegex.test(normalizedTitle);
    });
  }

  // Otherwise, match known job title keywords.
  return JOB_TITLE_KEYWORDS.some((jobKeyword) =>
    normalizedTitle.includes(jobKeyword)
  );
};

// =====================================================
// CHECK JOB URL
// =====================================================

const looksLikeJobUrl = (url) => {
  const normalizedUrl = url.toLowerCase();

  return JOB_URL_PATTERNS.some((pattern) =>
    normalizedUrl.includes(pattern)
  );
};

// =====================================================
// CHECK JOB PAGE CONTENT
// =====================================================

const looksLikeJobPage = ($) => {
  const pageText = $("body")
    .text()
    .toLowerCase();

  let matches = 0;

  for (const keyword of JOB_PAGE_KEYWORDS) {
    if (pageText.includes(keyword)) {
      matches++;
    }
  }

  return matches >= 2;
};

// =====================================================
// EXTRACT JOB DESCRIPTION
// =====================================================

const extractDescription = ($) => {
  const selectors = [
    "[class*='job-description']",
    "[class*='job_description']",
    "[class*='description']",
    "[id*='job-description']",
    "[id*='job_description']",
    "[class*='responsibilit']",
    "[class*='requirement']",
    "article",
    "main"
  ];

  for (const selector of selectors) {
    const text = normalizeText(
      $(selector).first().text()
    );

    if (text.length > 100) {
      return text.slice(0, 5000);
    }
  }

  return "";
};

// =====================================================
// EXTRACT LOCATION
// =====================================================

const extractLocation = ($) => {
  const selectors = [
    "[class*='location']",
    "[id*='location']",
    "[class*='job-location']",
    "[class*='job_location']"
  ];

  for (const selector of selectors) {
    const text = normalizeText(
      $(selector).first().text()
    );

    if (
      text.length >= 2 &&
      text.length <= 150
    ) {
      return text;
    }
  }

  const bodyText = normalizeText($("body").text());

  const locationMatch = bodyText.match(
    /\b(Lahore|Karachi|Islamabad|Rawalpindi|Peshawar|Faisalabad|Multan|Remote|Hybrid)\b/i
  );

  if (locationMatch) {
    return locationMatch[1];
  }

  // If no explicit location found on the page, return empty string
  return "";
};

// =====================================================
// LOCATION MATCHING HELPERS
// =====================================================

const tokenizeLocation = (loc = "") => {
  return loc
    .toLowerCase()
    .replace(/[()]/g, " ")
    .split(/[,/|\\-]+|\\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
};

const locationMatches = (searchLoc, jobLoc) => {
  if (!searchLoc || !jobLoc) return false;

  const s = searchLoc.toLowerCase().trim();
  const jobTokens = tokenizeLocation(jobLoc);

  // direct whole token match
  return jobTokens.some((t) => t === s);
};

// =====================================================
// EXTRACT SKILLS
// =====================================================

const extractSkills = (description) => {
  const knownSkills = [
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Express",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Python",
    "Django",
    "Flask",
    "FastAPI",
    "Java",
    "Spring Boot",
    "Spring Security",
    "Spring Data",
    "Kotlin",
    "Ktor",
    "C++",
    "C#",
    ".NET",
    "PHP",
    "Laravel",
    "Flutter",
    "Dart",
    "Android",
    "iOS",
    "AWS",
    "Azure",
    "Google Cloud",
    "Docker",
    "Kubernetes",
    "Git",
    "GitHub",
    "GitLab",
    "Machine Learning",
    "Artificial Intelligence",
    "TensorFlow",
    "PyTorch",
    "LangChain",
    "LangGraph",
    "LLM",
    "LLMs",
    "RAG",
    "SQL",
    "Redis",
    "GraphQL",
    "REST API",
    "RESTful API",
    "Microservices",
    "CI/CD",
    "Kafka",
    "Databricks",
    "PySpark"
  ];

  const text = description.toLowerCase();

  return knownSkills.filter((skill) => {
    const skillText = skill.toLowerCase();

    const escapedSkill = skillText.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const regex = new RegExp(
      `\\b${escapedSkill}\\b`,
      "i"
    );

    return regex.test(text);
  });
};

// =====================================================
// EXTRACT EXPERIENCE LEVEL
// =====================================================

const extractExperienceLevel = (
  title,
  description
) => {
  const text =
    `${title} ${description}`.toLowerCase();

  if (
    text.includes("intern") ||
    text.includes("internship")
  ) {
    return "Internship";
  }

  if (
    text.includes("junior") ||
    text.includes("entry level") ||
    text.includes("entry-level")
  ) {
    return "Entry Level";
  }

  if (
    text.includes("senior") ||
    text.includes("lead") ||
    text.includes("principal")
  ) {
    return "Senior";
  }

  if (
    text.includes("mid-level") ||
    text.includes("mid level")
  ) {
    return "Mid Level";
  }

  return "Not specified";
};

// =====================================================
// EXTRACT EMPLOYMENT TYPE
// =====================================================

const extractEmploymentType = (
  description
) => {
  const text = description.toLowerCase();

  if (
    text.includes("full-time") ||
    text.includes("full time")
  ) {
    return "Full-time";
  }

  if (
    text.includes("part-time") ||
    text.includes("part time")
  ) {
    return "Part-time";
  }

  if (text.includes("contract")) {
    return "Contract";
  }

  if (
    text.includes("internship") ||
    text.includes("intern")
  ) {
    return "Internship";
  }

  return "Not specified";
};

// =====================================================
// COMPANY CAREERS ADAPTER
// =====================================================

const companyCareers = {
  name: "Company Careers",

  async search({ keyword, location }) {
    const jobs = [];

    // =================================================
    // LOOP THROUGH CONFIGURED COMPANIES
    // =================================================

    for (const company of careerSources) {
      if (!company.enabled) {
        continue;
      }

      try {
        console.log(
          `Searching ${company.name}: ${company.careersUrl}`
        );

        // =============================================
        // FETCH CAREER PAGE
        // =============================================

        const response = await axios.get(
          company.careersUrl,
          {
            timeout: 10000,

            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0 Safari/537.36"
            }
          }
        );

        const $ = cheerio.load(
          response.data
        );

        const links = [];

        // =============================================
        // FIND POSSIBLE JOB LINKS
        // =============================================

        $("a").each((_, element) => {
          const title = normalizeText(
            $(element).text()
          );

          const href =
            $(element).attr("href");

          if (!title || !href) {
            return;
          }

          if (title.length < 5) {
            return;
          }

          // Convert relative URL to absolute
          let sourceUrl;

          try {
            sourceUrl = new URL(
              href,
              company.careersUrl
            ).href;
          } catch {
            return;
          }

          // ===========================================
          // CHECK TITLE
          // ===========================================

          if (
            !looksLikeJobTitle(
              title,
              keyword
            )
          ) {
            return;
          }

          // ===========================================
          // CHECK URL
          // ===========================================

          if (
            !looksLikeJobUrl(sourceUrl)
          ) {
            console.log(
              `Skipped non-job URL: ${title}`
            );

            return;
          }

          // ===========================================
          // AVOID DUPLICATES
          // ===========================================

          const alreadyExists =
            links.some(
              (link) =>
                link.sourceUrl ===
                sourceUrl
            );

          if (alreadyExists) {
            return;
          }

          links.push({
            title,
            sourceUrl
          });
        });

        // =============================================
        // VISIT POSSIBLE JOB PAGES
        // =============================================

        for (const link of links) {
          try {
            console.log(
              `Checking job page: ${link.title}`
            );

            const jobResponse =
              await axios.get(
                link.sourceUrl,
                {
                  timeout: 10000,

                  headers: {
                    "User-Agent":
                      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0 Safari/537.36"
                  }
                }
              );

            const jobPage =
              cheerio.load(
                jobResponse.data
              );

            // =========================================
            // VERIFY ACTUAL JOB PAGE
            // =========================================

            if (
              !looksLikeJobPage(
                jobPage
              )
            ) {
              console.log(
                `Skipped non-job page: ${link.title}`
              );

              continue;
            }

            // =========================================
            // DESCRIPTION
            // =========================================

            const description =
              extractDescription(
                jobPage
              );

            // =========================================
            // LOCATION
            // =========================================

            const jobLocation = extractLocation(jobPage);

            // =========================================
            // SKILLS
            // =========================================

            const skills =
              extractSkills(
                description
              );

            // =========================================
            // EXPERIENCE
            // =========================================

            const experienceLevel =
              extractExperienceLevel(
                link.title,
                description
              );

            // =========================================
            // EMPLOYMENT TYPE
            // =========================================

            const employmentType =
              extractEmploymentType(
                description
              );

            // If a location filter was provided, ensure the page's
            // extracted location matches the requested location.
            if (location) {
              if (!locationMatches(location, jobLocation)) {
                console.log(
                  `Skipping job due to location mismatch: ${link.title} - found: ${jobLocation}`
                );

                continue;
              }
            }

            // =========================================
            // ADD JOB
            // =========================================

            jobs.push({
              title: link.title,

              company: company.name,

              location: jobLocation,

              description,

              skills,

              employmentType,

              experienceLevel,

              salary: "Not specified",

              source: "Company Careers",

              sourceUrl: link.sourceUrl,

              postedAt: null
            });

          } catch (error) {
            console.error(
              `Job page failed: ${link.sourceUrl}`,
              error.message
            );
          }
        }
      } catch (error) {
        console.error(
          `${company.name} failed:`,
          error.message
        );
      }
    }

    return jobs;
  }
};

export default companyCareers;

