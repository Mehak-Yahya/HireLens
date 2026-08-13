// NORMALIZE TEXT

const normalizeText = (text = "") => {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// NORMALIZE JOB TITLE
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

// NORMALIZE COMPANY
const normalizeCompany = (company = "") => {
  return normalizeText(company)
    .replace(
      /\b(pvt|private|ltd|limited|inc|llc|technologies|technology|solutions)\b/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
};

// NORMALIZE LOCATION
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

// CREATE JOB KEY
const createJobKey = ({
  title,
  company,
  location
}) => {
  const normalizedTitle =
    normalizeTitle(title);

  const normalizedCompany =
    normalizeCompany(company);

  const normalizedLocation =
    normalizeLocation(location);

  return `${normalizedTitle}|${normalizedCompany}|${normalizedLocation}`;
};

// NORMALIZE SINGLE JOB

const normalizeJob = (
  job,
  sourceName
) => {
  const title =
    job.title?.trim() ||
    "Untitled Position";

  const company =
    job.company?.trim() ||
    "Unknown Company";

  const location =
    job.location?.trim() ||
    "Not specified";

  const description =
    job.description?.trim() ||
    "";

  const skills =
    Array.isArray(job.skills)
      ? job.skills
          .map((skill) =>
            String(skill).trim()
          )
          .filter(Boolean)
      : [];

  const employmentType =
    job.employmentType?.trim() ||
    "Not specified";

  const experienceLevel =
    job.experienceLevel?.trim() ||
    "Not specified";

  const salary =
    job.salary?.trim() ||
    "Not specified";

  const source =
    sourceName ||
    job.source ||
    "Unknown";

  const sourceUrl =
    job.sourceUrl?.trim() ||
    "";

  const postedAt =
    job.postedAt
      ? new Date(job.postedAt)
      : null;

  // ===================================================
  // CREATE PERMANENT JOB KEY
  // ===================================================

  const jobKey = createJobKey({
    title,
    company,
    location
  });

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

    source,

    sourceUrl,

    sources: [source],

    postedAt,

    scrapedAt: new Date(),

    isActive: true
  };
};

// NORMALIZE MULTIPLE JOBS

const normalizeJobs = (
  jobs,
  sourceName
) => {
  if (!Array.isArray(jobs)) {
    return [];
  }

  return jobs
    .map((job) =>
      normalizeJob(
        job,
        sourceName
      )
    )
    .filter(
      (job) =>
        job.sourceUrl
    );
};

// EXPORTS
export {
  normalizeJob,
  normalizeJobs,
  createJobKey
};

