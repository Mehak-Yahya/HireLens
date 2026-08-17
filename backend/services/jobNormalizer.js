
// =====================================================
// TEXT NORMALIZATION
// =====================================================

const normalizeText = (text = "") => {
  return String(text)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s+#.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// =====================================================
// NORMALIZE JOB TITLE
// =====================================================

const normalizeTitle = (title = "") => {
  return normalizeText(title)
    .replace(/\bfull time\b/g, "")
    .replace(/\bpart time\b/g, "")
    .replace(/\bfulltime\b/g, "")
    .replace(/\bparttime\b/g, "")
    .replace(/\bremote\b/g, "")
    .replace(/\bhybrid\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// =====================================================
// NORMALIZE COMPANY
// =====================================================

const normalizeCompany = (company = "") => {
  return normalizeText(company)
    .replace(
      /\b(pvt|private|ltd|limited|inc|llc|technologies|technology|solutions)\b/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
};

// =====================================================
// NORMALIZE LOCATION
// =====================================================

const normalizeLocation = (location = "") => {
  const normalized = normalizeText(location);

  if (normalized.includes("lahore")) {
    return "lahore";
  }

  if (normalized.includes("karachi")) {
    return "karachi";
  }

  if (normalized.includes("islamabad")) {
    return "islamabad";
  }

  if (normalized.includes("rawalpindi")) {
    return "rawalpindi";
  }

  if (normalized.includes("peshawar")) {
    return "peshawar";
  }

  if (normalized.includes("faisalabad")) {
    return "faisalabad";
  }

  if (normalized.includes("multan")) {
    return "multan";
  }

  if (normalized.includes("remote")) {
    return "remote";
  }

  if (normalized.includes("hybrid")) {
    return "hybrid";
  }

  return normalized;
};

// =====================================================
// NORMALIZE DATE
// =====================================================

const normalizeDate = (date) => {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

// =====================================================
// CREATE JOB KEY
// =====================================================

const createJobKey = ({
  title = "",
  company = "",
  location = ""
}) => {
  const normalizedTitle =
    normalizeTitle(title);

  const normalizedCompany =
    normalizeCompany(company);

  const normalizedLocation =
    normalizeLocation(location);

  return [
    normalizedTitle,
    normalizedCompany,
    normalizedLocation
  ].join("|");
};

// =====================================================
// NORMALIZE SKILLS
// =====================================================

const normalizeSkills = (skills = []) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  return [
    ...new Set(
      skills
        .map((skill) =>
          String(skill)
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    )
  ];
};

// =====================================================
// NORMALIZE SINGLE JOB
// =====================================================

const normalizeJob = (
  job = {},
  sourceName = "Unknown"
) => {
  // ---------------------------------------------------
  // BASIC INFORMATION
  // ---------------------------------------------------

  const title =
    String(job.title || "").trim() ||
    "Untitled Position";

  const company =
    String(job.company || "").trim() ||
    "Unknown Company";

  const location =
    String(job.location || "").trim() ||
    "Not specified";

  // ---------------------------------------------------
  // DESCRIPTION
  // ---------------------------------------------------

  const description =
    String(job.description || "").trim();

  // ---------------------------------------------------
  // SKILLS
  // ---------------------------------------------------

  const skills =
    normalizeSkills(job.skills);

  // ---------------------------------------------------
  // EMPLOYMENT TYPE
  // ---------------------------------------------------

  const employmentType =
    String(
      job.employmentType || ""
    ).trim() ||
    "Not specified";

  // ---------------------------------------------------
  // EXPERIENCE LEVEL
  // ---------------------------------------------------

  const experienceLevel =
    String(
      job.experienceLevel || ""
    ).trim() ||
    "Not specified";

  // ---------------------------------------------------
  // SALARY
  // ---------------------------------------------------

  const salary =
    String(
      job.salary || ""
    ).trim() ||
    "Not specified";

  // ---------------------------------------------------
  // SOURCE
  // ---------------------------------------------------

  const source =
    String(
      sourceName ||
      job.source ||
      "Unknown"
    ).trim();

  // ---------------------------------------------------
  // SOURCE URL
  // ---------------------------------------------------

  const sourceUrl =
    String(
      job.sourceUrl ||
      job.url ||
      ""
    ).trim();

  // ---------------------------------------------------
  // POSTED DATE
  // ---------------------------------------------------

  const postedAt =
    normalizeDate(
      job.postedAt
    );

  // ---------------------------------------------------
  // REMOTE STATUS
  // ---------------------------------------------------

  const remote =
    Boolean(job.remote);

  // ===================================================
  // JOB KEY
  // ===================================================

  const jobKey =
    createJobKey({
      title,
      company,
      location
    });

  // ===================================================
  // FINAL NORMALIZED JOB
  // ===================================================

  return {
    jobKey,

    title,

    company,

    location,

    description,

    skills,

    employmentType,

    experienceLevel,

    salary,

    remote,

    source,

    sourceUrl,

    sources: [source],

    postedAt,

    scrapedAt: new Date(),

    isActive: true
  };
};

// =====================================================
// NORMALIZE MULTIPLE JOBS
// =====================================================

const normalizeJobs = (
  jobs = [],
  sourceName = "Unknown"
) => {
  if (!Array.isArray(jobs)) {
    return [];
  }

  return jobs
    .filter(
      (job) =>
        job &&
        typeof job === "object"
    )
    .map((job) =>
      normalizeJob(
        job,
        sourceName
      )
    )
    .filter(
      (job) =>
        Boolean(job.sourceUrl)
    );
};

// =====================================================
// EXPORTS
// =====================================================

export {
  normalizeText,
  normalizeTitle,
  normalizeCompany,
  normalizeLocation,
  normalizeDate,
  normalizeSkills,
  createJobKey,
  normalizeJob,
  normalizeJobs
};

