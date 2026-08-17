import axios from "axios";

// =====================================================
// NORMALIZATION
// =====================================================

const normalizeText = (value = "") =>
  String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();

const normalizeForComparison = (value = "") =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^\w\s+#.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// =====================================================
// KEYWORD MATCHING
// =====================================================

const titleMatchesKeyword = (title = "", keyword = "") => {
  if (!keyword?.trim()) {
    return true;
  }

  const normalizedTitle =
    normalizeForComparison(title);

  const normalizedKeyword =
    normalizeForComparison(keyword);

  if (!normalizedTitle || !normalizedKeyword) {
    return false;
  }

  if (normalizedTitle.includes(normalizedKeyword)) {
    return true;
  }

  const aliases = {
    "software engineer": [
      "software engineer",
      "software developer",
      "full stack engineer",
      "full stack developer",
      "frontend engineer",
      "frontend developer",
      "backend engineer",
      "backend developer"
    ],

    "software developer": [
      "software developer",
      "software engineer",
      "full stack developer",
      "full stack engineer",
      "frontend developer",
      "frontend engineer",
      "backend developer",
      "backend engineer"
    ],

    "frontend developer": [
      "frontend developer",
      "frontend engineer",
      "front end developer",
      "front end engineer",
      "react developer"
    ],

    "backend developer": [
      "backend developer",
      "backend engineer",
      "back end developer",
      "back end engineer",
      "node developer",
      "node.js developer"
    ],

    "full stack developer": [
      "full stack developer",
      "full stack engineer",
      "full-stack developer",
      "full-stack engineer"
    ],

    "machine learning engineer": [
      "machine learning engineer",
      "ml engineer",
      "ai engineer",
      "artificial intelligence engineer"
    ],

    "data scientist": [
      "data scientist",
      "machine learning scientist",
      "applied scientist"
    ]
  };

  const aliasesForKeyword =
    aliases[normalizedKeyword];

  if (aliasesForKeyword) {
    return aliasesForKeyword.some((alias) =>
      normalizedTitle.includes(alias)
    );
  }

  return normalizedKeyword
    .split(/\s+/)
    .filter(Boolean)
    .every((token) =>
      normalizedTitle.includes(token)
    );
};

// =====================================================
// GREENHOUSE BOARD TOKEN
// =====================================================

const extractBoardToken = (url = "") => {
  try {
    const parsed = new URL(url);

    const hostname =
      parsed.hostname.toLowerCase();

    if (
      hostname !== "boards.greenhouse.io" &&
      hostname !== "job-boards.greenhouse.io"
    ) {
      return null;
    }

    const parts =
      parsed.pathname
        .split("/")
        .filter(Boolean);

    return parts[0] || null;

  } catch {
    return null;
  }
};

// =====================================================
// LOCATION MATCHING
// =====================================================

const locationMatches = (
  jobLocation = "",
  searchLocation = ""
) => {
  if (!searchLocation?.trim()) {
    return true;
  }

  const job =
    normalizeForComparison(jobLocation);

  const search =
    normalizeForComparison(searchLocation);

  if (!job || !search) {
    return false;
  }

  // Pakistan-wide
  if (
    search === "pakistan" ||
    search === "pk"
  ) {
    return (
      job.includes("pakistan") ||
      job.includes("remote")
    );
  }

  // Direct match
  if (job.includes(search)) {
    return true;
  }

  // Remote Pakistan
  if (
    job.includes("remote") &&
    job.includes("pakistan")
  ) {
    return true;
  }

  return false;
};

// =====================================================
// SKILLS
// =====================================================

const extractSkills = (description = "") => {
  const text =
    normalizeForComparison(description);

  const skills = [
    "javascript",
    "typescript",
    "react",
    "react native",
    "next.js",
    "angular",
    "vue",
    "node.js",
    "node",
    "express",
    "python",
    "java",
    "c++",
    "c#",
    ".net",
    "php",
    "laravel",
    "django",
    "flask",
    "fastapi",
    "flutter",
    "dart",
    "kotlin",
    "mongodb",
    "mysql",
    "postgresql",
    "sql",
    "redis",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "git",
    "github",
    "gitlab",
    "machine learning",
    "deep learning",
    "artificial intelligence",
    "tensorflow",
    "pytorch",
    "nlp",
    "graphql",
    "rest api",
    "microservices",
    "ci/cd"
  ];

  return skills.filter((skill) =>
    text.includes(skill)
  );
};

// =====================================================
// NORMALIZE JOB
// =====================================================

const normalizeJob = (
  job,
  source
) => {
  const title =
    normalizeText(job.title || "");

  const description =
    normalizeText(
      job.content ||
      job.description ||
      ""
    );

  const location =
    normalizeText(
      job.location?.name ||
      job.location ||
      ""
    );

  const company =
    normalizeText(
      source.company ||
      source.companyName ||
      job.company?.name ||
      ""
    ) || "Unknown Company";

  return {
    title,

    company,

    location:
      location || "Not specified",

    description:
      description.slice(0, 5000),

    skills:
      extractSkills(description),

    employmentType:
      normalizeText(
        job.metadata?.find(
          (item) =>
            item.name?.toLowerCase() ===
            "employment type"
        )?.value ||
        "Not specified"
      ),

    experienceLevel:
      "Not specified",

    salary:
      "Not specified",

    source:
      "Greenhouse",

    sourceUrl:
      job.absolute_url ||
      job.url ||
      "",

    postedAt:
      job.updated_at ||
      job.created_at ||
      null
  };
};

// =====================================================
// GREENHOUSE SOURCE
// =====================================================

const greenhouse = {

  name: "Greenhouse",

  async search({
    keyword = "",
    location = "",
    sources = []
  }) {

    // IMPORTANT:
    // This array must exist inside search()
    const jobs = [];

    try {

      // =================================================
      // FIND GREENHOUSE SOURCES
      // =================================================

      const greenhouseSources =
        Array.isArray(sources)
          ? sources
              .filter((source) => {

                if (!source || source.enabled === false) {
                  return false;
                }

                const platform =
                  String(
                    source.platform || ""
                  ).toLowerCase();

                const boardToken =
                  source.boardToken ||
                  extractBoardToken(
                    source.careersUrl ||
                    source.url ||
                    ""
                  );

                return (
                  platform === "greenhouse" ||
                  Boolean(boardToken)
                );
              })
              .map((source) => ({
                ...source,

                boardToken:
                  source.boardToken ||
                  extractBoardToken(
                    source.careersUrl ||
                    source.url ||
                    ""
                  )
              }))
              .filter(
                (source) =>
                  Boolean(source.boardToken)
              )
          : [];

      // =================================================
      // REMOVE DUPLICATE BOARDS
      // =================================================

      const uniqueSources =
        Array.from(
          new Map(
            greenhouseSources.map(
              (source) => [
                source.boardToken,
                source
              ]
            )
          ).values()
        );

      if (!uniqueSources.length) {

        console.log(
          "Greenhouse: No valid Greenhouse boards found in careerSources."
        );

        return [];
      }

      console.log(
        `Greenhouse: Searching ${uniqueSources.length} boards`
      );

      // =================================================
      // SEARCH ALL BOARDS
      // =================================================

      await Promise.allSettled(

        uniqueSources.map(
          async (source) => {

            try {

              const apiUrl =
                `https://boards-api.greenhouse.io/v1/boards/` +
                `${source.boardToken}/jobs`;

              console.log(
                `Greenhouse: Requesting ${apiUrl}`
              );

              const response =
                await axios.get(
                  apiUrl,
                  {
                    timeout: 15000,

                    headers: {
                      "User-Agent":
                        "Mozilla/5.0",
                      Accept:
                        "application/json"
                    }
                  }
                );

              const boardJobs =
                Array.isArray(
                  response.data?.jobs
                )
                  ? response.data.jobs
                  : [];

              let matched = 0;

              // =========================================
              // PROCESS JOBS
              // =========================================

              for (
                const job of boardJobs
              ) {

                const title =
                  normalizeText(
                    job.title || ""
                  );

                if (!title) {
                  continue;
                }

                // KEYWORD
                if (
                  !titleMatchesKeyword(
                    title,
                    keyword
                  )
                ) {
                  continue;
                }

                // LOCATION
                const jobLocation =
                  normalizeText(
                    job.location?.name ||
                    job.location ||
                    ""
                  );

                if (
                  location &&
                  !locationMatches(
                    jobLocation,
                    location
                  )
                ) {
                  continue;
                }

                // ADD JOB
                jobs.push(
                  normalizeJob(
                    job,
                    source
                  )
                );

                matched++;
              }

              console.log(
                `Greenhouse [` +
                `${source.company || source.name || source.boardToken}` +
                `]: ` +
                `${boardJobs.length} scanned, ` +
                `${matched} matched`
              );

            } catch (error) {

              console.warn(
                `Greenhouse source failed (` +
                `${source.company || source.name || source.boardToken}): ` +
                `${error.message}`
              );
            }
          }
        )
      );

      // =================================================
      // REMOVE DUPLICATE JOB URLS
      // =================================================

      const uniqueJobs =
        Array.from(
          new Map(
            jobs.map((job) => [
              job.sourceUrl ||
                `${job.company}|${job.title}|${job.location}`,
              job
            ])
          ).values()
        );

      console.log(
        `Greenhouse: ${uniqueJobs.length} relevant jobs found`
      );

      return uniqueJobs;

    } catch (error) {

      console.error(
        "Greenhouse scraper failed:",
        error.message
      );

      return [];
    }
  }
};

export default greenhouse;