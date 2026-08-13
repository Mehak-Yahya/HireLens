// TEXT NORMALIZATION
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
  let normalized = normalizeText(title);

  // Remove common title variations
  normalized = normalized
    .replace(/\bfull time\b/g, "")
    .replace(/\bpart time\b/g, "")
    .replace(/\bfulltime\b/g, "")
    .replace(/\bparttime\b/g, "")
    .replace(/\bremote\b/g, "")
    .replace(/\bhybrid\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
};

// NORMALIZE COMPANY
const normalizeCompany = (company = "") => {
  return normalizeText(company)
    .replace(/\b(pvt|private|ltd|limited|inc|llc|technologies|technology|solutions)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// NORMALIZE LOCATION
const normalizeLocation = (location = "") => {
  const normalized = normalizeText(location);

  if (
    normalized.includes("lahore")
  ) {
    return "lahore";
  }

  if (
    normalized.includes("karachi")
  ) {
    return "karachi";
  }

  if (
    normalized.includes("islamabad")
  ) {
    return "islamabad";
  }

  if (
    normalized.includes("rawalpindi")
  ) {
    return "rawalpindi";
  }

  if (
    normalized.includes("peshawar")
  ) {
    return "peshawar";
  }

  if (
    normalized.includes("faisalabad")
  ) {
    return "faisalabad";
  }

  if (
    normalized.includes("multan")
  ) {
    return "multan";
  }

  if (
    normalized.includes("remote")
  ) {
    return "remote";
  }

  if (
    normalized.includes("hybrid")
  ) {
    return "hybrid";
  }

  return normalized;
};

// CREATE JOB KEY

const createJobKey = (job) => {
  const title = normalizeTitle(
    job.title
  );

  const company = normalizeCompany(
    job.company
  );

  const location = normalizeLocation(
    job.location
  );

  return `${title}|${company}|${location}`;
};

// MERGE SKILLS

const mergeSkills = (
  existingSkills = [],
  newSkills = []
) => {
  return [
    ...new Set([
      ...existingSkills,
      ...newSkills
    ])
  ];
};

// MERGE SOURCES

const mergeSources = (
  existingSources = [],
  newSources = []
) => {
  return [
    ...new Set([
      ...existingSources,
      ...newSources
    ].filter(Boolean))
  ];
};

// MERGE JOB DATA

const mergeJobs = (
  existingJob,
  newJob
) => {
  // SOURCES
  existingJob.sources =
    mergeSources(
      existingJob.sources,
      [
        existingJob.source,
        ...(newJob.sources || []),
        newJob.source
      ]
    );

  // SKILLS
  existingJob.skills =
    mergeSkills(
      existingJob.skills,
      newJob.skills
    );

  // DESCRIPTION
  if (
    (!existingJob.description ||
      existingJob.description.length < 100) &&
    newJob.description
  ) {
    existingJob.description =
      newJob.description;
  }

  // EMPLOYMENT TYPE
  if (
    (!existingJob.employmentType ||
      existingJob.employmentType ===
        "Not specified") &&
    newJob.employmentType &&
    newJob.employmentType !==
      "Not specified"
  ) {
    existingJob.employmentType =
      newJob.employmentType;
  }

  // EXPERIENCE LEVEL
  if (
    (!existingJob.experienceLevel ||
      existingJob.experienceLevel ===
        "Not specified") &&
    newJob.experienceLevel &&
    newJob.experienceLevel !==
      "Not specified"
  ) {
    existingJob.experienceLevel =
      newJob.experienceLevel;
  }

  // SALARY

  if (
    (!existingJob.salary ||
      existingJob.salary ===
        "Not specified") &&
    newJob.salary &&
    newJob.salary !==
      "Not specified"
  ) {
    existingJob.salary =
      newJob.salary;
  }

  // POSTED DATE
  if (
    !existingJob.postedAt &&
    newJob.postedAt
  ) {
    existingJob.postedAt =
      newJob.postedAt;
  }

  // SOURCE URL
  if (
    !existingJob.sourceUrl &&
    newJob.sourceUrl
  ) {
    existingJob.sourceUrl =
      newJob.sourceUrl;
  }

  return existingJob;
};

// DEDUPLICATE JOBS
const deduplicateJobs = (jobs) => {
  const jobMap = new Map();

  for (const job of jobs) {
    if (
      !job ||
      !job.title ||
      !job.company
    ) {
      continue;
    }

    const key = createJobKey(job);

    if (!jobMap.has(key)) {
      jobMap.set(key, {
        ...job,

        sources: mergeSources(
          job.sources || [],
          [job.source]
        ),

        skills: [
          ...new Set(
            job.skills || []
          )
        ]
      });

      continue;
    }

    const existingJob =
      jobMap.get(key);

    const mergedJob =
      mergeJobs(
        existingJob,
        job
      );

    jobMap.set(
      key,
      mergedJob
    );
  }

  return Array.from(
    jobMap.values()
  );
};

export default deduplicateJobs;

