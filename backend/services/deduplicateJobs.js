
import { createJobKey } from "./jobNormalizer.js";

// =====================================================
// MERGE SKILLS
// =====================================================

const mergeSkills = (
  existingSkills = [],
  newSkills = []
) => {
  const existing = Array.isArray(existingSkills)
    ? existingSkills
    : [];

  const incoming = Array.isArray(newSkills)
    ? newSkills
    : [];

  return [
    ...new Set(
      [...existing, ...incoming]
        .map((skill) =>
          String(skill).trim()
        )
        .filter(Boolean)
    )
  ];
};

// =====================================================
// MERGE SOURCES
// =====================================================

const mergeSources = (
  existingSources = [],
  newSources = []
) => {
  const existing = Array.isArray(existingSources)
    ? existingSources
    : [];

  const incoming = Array.isArray(newSources)
    ? newSources
    : [];

  return [
    ...new Set(
      [...existing, ...incoming]
        .map((source) =>
          String(source).trim()
        )
        .filter(Boolean)
    )
  ];
};

// =====================================================
// CHECK USEFUL VALUE
// =====================================================

const hasUsefulValue = (
  value,
  placeholder = "Not specified"
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return false;
  }

  const normalized =
    String(value).trim();

  return (
    normalized !== "" &&
    normalized.toLowerCase() !==
      placeholder.toLowerCase()
  );
};

// =====================================================
// MERGE DESCRIPTIONS
// =====================================================

const mergeDescriptions = (
  existingDescription = "",
  newDescription = ""
) => {
  const existing =
    String(existingDescription || "").trim();

  const incoming =
    String(newDescription || "").trim();

  if (!existing) {
    return incoming;
  }

  if (!incoming) {
    return existing;
  }

  // Keep the more detailed description.
  return incoming.length > existing.length
    ? incoming
    : existing;
};

// =====================================================
// MERGE JOBS
// =====================================================

const mergeJobs = (
  existingJob,
  newJob
) => {
  const mergedJob = {
    ...existingJob
  };

  // ===================================================
  // SOURCES
  // ===================================================

  mergedJob.sources = mergeSources(
    existingJob.sources,
    [
      existingJob.source,
      ...(newJob.sources || []),
      newJob.source
    ]
  );

  // ===================================================
  // SKILLS
  // ===================================================

  mergedJob.skills = mergeSkills(
    existingJob.skills,
    newJob.skills
  );

  // ===================================================
  // DESCRIPTION
  // ===================================================

  mergedJob.description =
    mergeDescriptions(
      existingJob.description,
      newJob.description
    );

  // ===================================================
  // EMPLOYMENT TYPE
  // ===================================================

  if (
    hasUsefulValue(
      newJob.employmentType
    )
  ) {
    const existingIsMissing =
      !hasUsefulValue(
        existingJob.employmentType
      );

    if (existingIsMissing) {
      mergedJob.employmentType =
        newJob.employmentType;
    }
  }

  // ===================================================
  // EXPERIENCE LEVEL
  // ===================================================

  if (
    hasUsefulValue(
      newJob.experienceLevel
    )
  ) {
    const existingIsMissing =
      !hasUsefulValue(
        existingJob.experienceLevel
      );

    if (existingIsMissing) {
      mergedJob.experienceLevel =
        newJob.experienceLevel;
    }
  }

  // ===================================================
  // SALARY
  // ===================================================

  if (
    hasUsefulValue(
      newJob.salary
    )
  ) {
    const existingIsMissing =
      !hasUsefulValue(
        existingJob.salary
      );

    if (existingIsMissing) {
      mergedJob.salary =
        newJob.salary;
    }
  }

  // ===================================================
  // LOCATION
  // ===================================================

  if (
    hasUsefulValue(
      newJob.location,
      "Not specified"
    ) &&
    !hasUsefulValue(
      existingJob.location,
      "Not specified"
    )
  ) {
    mergedJob.location =
      newJob.location;
  }

  // ===================================================
  // COMPANY
  // ===================================================

  if (
    hasUsefulValue(
      newJob.company,
      "Unknown Company"
    ) &&
    !hasUsefulValue(
      existingJob.company,
      "Unknown Company"
    )
  ) {
    mergedJob.company =
      newJob.company;
  }

  // ===================================================
  // TITLE
  // ===================================================

  if (
    hasUsefulValue(
      newJob.title,
      "Untitled Position"
    ) &&
    !hasUsefulValue(
      existingJob.title,
      "Untitled Position"
    )
  ) {
    mergedJob.title =
      newJob.title;
  }

  // ===================================================
  // REMOTE STATUS
  // ===================================================

  if (
    newJob.remote === true
  ) {
    mergedJob.remote = true;
  }

  // ===================================================
  // POSTED DATE
  // ===================================================

  if (
    !existingJob.postedAt &&
    newJob.postedAt
  ) {
    mergedJob.postedAt =
      newJob.postedAt;
  }

  // ===================================================
  // SOURCE URL
  // ===================================================

  if (
    !existingJob.sourceUrl &&
    newJob.sourceUrl
  ) {
    mergedJob.sourceUrl =
      newJob.sourceUrl;
  }

  // ===================================================
  // SCRAPED DATE
  // ===================================================

  if (
    newJob.scrapedAt
  ) {
    const existingDate =
      existingJob.scrapedAt
        ? new Date(
            existingJob.scrapedAt
          )
        : null;

    const newDate =
      new Date(
        newJob.scrapedAt
      );

    if (
      !existingDate ||
      (
        !Number.isNaN(
          newDate.getTime()
        ) &&
        newDate > existingDate
      )
    ) {
      mergedJob.scrapedAt =
        newJob.scrapedAt;
    }
  }

  // ===================================================
  // ACTIVE STATUS
  // ===================================================

  if (
    newJob.isActive === true
  ) {
    mergedJob.isActive = true;
  }

  // ===================================================
  // KEEP CANONICAL JOB KEY
  // ===================================================

  mergedJob.jobKey =
    existingJob.jobKey ||
    createJobKey(
      mergedJob
    );

  return mergedJob;
};

// =====================================================
// DEDUPLICATE JOBS
// =====================================================

const deduplicateJobs = (
  jobs = []
) => {
  if (!Array.isArray(jobs)) {
    return [];
  }

  const jobMap = new Map();

  for (const job of jobs) {
    // -------------------------------------------------
    // INVALID JOB
    // -------------------------------------------------

    if (
      !job ||
      typeof job !== "object" ||
      !job.title ||
      !job.company
    ) {
      continue;
    }

    // -------------------------------------------------
    // CREATE NORMALIZED KEY
    // -------------------------------------------------

    const key =
      job.jobKey ||
      createJobKey(job);

    // -------------------------------------------------
    // FIRST OCCURRENCE
    // -------------------------------------------------

    if (!jobMap.has(key)) {
      jobMap.set(key, {
        ...job,

        jobKey: key,

        sources: mergeSources(
          job.sources,
          [job.source]
        ),

        skills: mergeSkills(
          job.skills
        )
      });

      continue;
    }

    // -------------------------------------------------
    // DUPLICATE FOUND
    // -------------------------------------------------

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

// =====================================================
// EXPORT
// =====================================================

export {
  mergeSkills,
  mergeSources,
  mergeJobs
};

export default deduplicateJobs;

