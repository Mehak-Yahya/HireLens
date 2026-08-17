import sources from "./sources/index.js";
import { normalizeJobs } from "./jobNormalizer.js";
import deduplicateJobs from "./deduplicateJobs.js";
import Job from "../models/Job.js";
import careerSources from "./careerSources.js";

// =====================================================
// SEARCH ALL JOB SOURCES
// =====================================================

const searchAllSources = async ({ keyword, location }) => {
  try {
    // -------------------------------------------------
    // VALIDATE INPUT
    // -------------------------------------------------

    if (!keyword || typeof keyword !== "string") {
      console.error("Invalid keyword");
      return [];
    }

    if (
      location !== undefined &&
      location !== null &&
      typeof location !== "string"
    ) {
      console.error("Invalid location");
      return [];
    }

    const sourceList = Object.values(sources).filter(
      (source) =>
        source &&
        typeof source.search === "function"
    );

    console.log(
      `Starting live scrape for keyword="${keyword}" ` +
      `location="${location || "Any"}" ` +
      `across ${sourceList.length} sources`
    );

    // =================================================
    // SEARCH ALL SOURCES IN PARALLEL
    // =================================================

    const results = await Promise.allSettled(
      sourceList.map(async (source) => {
        console.log(
          `Running source scraper: ${source.name}`
        );

        try {
          const sourceJobs = await source.search({
            keyword,
            location,
            sources: careerSources
          });

          return Array.isArray(sourceJobs)
            ? sourceJobs
            : [];
        } catch (error) {
          console.error(
            `${source.name} error:`,
            error.message
          );

          return [];
        }
      })
    );

    // =================================================
    // NORMALIZE RESULTS
    // =================================================

    const jobs = [];

    results.forEach((result, index) => {
      const source = sourceList[index];

      if (result.status !== "fulfilled") {
        console.error(
          `${source.name} search failed:`,
          result.reason?.message ||
            result.reason ||
            "Unknown error"
        );

        return;
      }

      const sourceJobs = Array.isArray(result.value)
        ? result.value
        : [];

      if (sourceJobs.length === 0) {
        console.log(
          `${source.name}: 0 jobs returned`
        );

        return;
      }

      const normalizedJobs = normalizeJobs(
        sourceJobs,
        source.name
      );

      console.log(
        `${source.name}: ${normalizedJobs.length} valid jobs after normalization`
      );

      jobs.push(...normalizedJobs);
    });

    // =================================================
    // DEDUPLICATE
    // =================================================

    const uniqueJobs = deduplicateJobs(jobs);

    console.log(
      `Found ${jobs.length} normalized jobs`
    );

    console.log(
      `${uniqueJobs.length} unique jobs after deduplication`
    );

    // =================================================
    // SAVE TO MONGODB
    // =================================================

    if (uniqueJobs.length > 0) {
      const saveResult = await saveJobsToDatabase(
        uniqueJobs
      );

      console.log(
        `MongoDB: ${saveResult.saved} saved, ${saveResult.failed} failed`
      );
    } else {
      console.log(
        "No jobs to save to MongoDB."
      );
    }

    // =================================================
    // RETURN JOBS
    // =================================================

    return uniqueJobs;

  } catch (error) {
    console.error(
      "searchAllSources fatal error:",
      error.message
    );

    return [];
  }
};

// =====================================================
// SAVE JOBS TO MONGODB
// =====================================================

const saveJobsToDatabase = async (uniqueJobs) => {
  let savedCount = 0;
  let failedCount = 0;

  for (const job of uniqueJobs) {
    try {
      // -------------------------------------------------
      // VALIDATE JOB
      // -------------------------------------------------

      if (
        !job?.jobKey ||
        !job?.title ||
        !job?.company ||
        !job?.sourceUrl
      ) {
        console.warn(
          "Skipping invalid job:",
          job?.title || "Unknown title"
        );

        failedCount++;
        continue;
      }

      // -------------------------------------------------
      // FIND EXISTING JOB
      // -------------------------------------------------

      const existingJob = await Job.findOne({
        jobKey: job.jobKey
      });

      // =================================================
      // CREATE NEW JOB
      // =================================================

      if (!existingJob) {
        await Job.create({
          jobKey: job.jobKey,

          title: job.title,

          company: job.company,

          location:
            job.location || "Not specified",

          description:
            job.description || "",

          skills:
            Array.isArray(job.skills)
              ? job.skills
              : [],

          employmentType:
            job.employmentType ||
            "Not specified",

          experienceLevel:
            job.experienceLevel ||
            "Not specified",

          salary:
            job.salary ||
            "Not specified",

          source:
            job.source ||
            "Unknown",

          sourceUrl:
            job.sourceUrl,

          sources:
            Array.isArray(job.sources) &&
            job.sources.length > 0
              ? job.sources
              : [
                  job.source ||
                  "Unknown"
                ],

          postedAt:
            job.postedAt || null,

          scrapedAt:
            new Date(),

          isActive:
            true
        });

        savedCount++;

        console.log(
          `NEW JOB SAVED: ${job.title} - ${job.company}`
        );

        continue;
      }

      // =================================================
      // UPDATE EXISTING JOB
      // =================================================

      // -------------------------------------------------
      // SOURCES
      // -------------------------------------------------

      const existingSources =
        Array.isArray(existingJob.sources)
          ? existingJob.sources
          : [];

      const incomingSources =
        Array.isArray(job.sources) &&
        job.sources.length > 0
          ? job.sources
          : [
              job.source ||
              "Unknown"
            ];

      existingJob.sources = [
        ...new Set(
          [
            ...existingSources,
            ...incomingSources
          ].filter(Boolean)
        )
      ];

      // -------------------------------------------------
      // BASIC INFORMATION
      // -------------------------------------------------

      if (job.title) {
        existingJob.title = job.title;
      }

      if (job.company) {
        existingJob.company = job.company;
      }

      if (job.location) {
        existingJob.location = job.location;
      }

      // -------------------------------------------------
      // DESCRIPTION
      // -------------------------------------------------

      if (
        job.description &&
        (
          !existingJob.description ||
          job.description.length >
            existingJob.description.length
        )
      ) {
        existingJob.description =
          job.description;
      }

      // -------------------------------------------------
      // SKILLS
      // -------------------------------------------------

      existingJob.skills = [
        ...new Set([
          ...(Array.isArray(existingJob.skills)
            ? existingJob.skills
            : []),

          ...(Array.isArray(job.skills)
            ? job.skills
            : [])
        ])
      ];

      // -------------------------------------------------
      // EMPLOYMENT TYPE
      // -------------------------------------------------

      if (
        job.employmentType &&
        job.employmentType !==
          "Not specified"
      ) {
        existingJob.employmentType =
          job.employmentType;
      }

      // -------------------------------------------------
      // EXPERIENCE LEVEL
      // -------------------------------------------------

      if (
        job.experienceLevel &&
        job.experienceLevel !==
          "Not specified"
      ) {
        existingJob.experienceLevel =
          job.experienceLevel;
      }

      // -------------------------------------------------
      // SALARY
      // -------------------------------------------------

      if (
        job.salary &&
        job.salary !==
          "Not specified"
      ) {
        existingJob.salary =
          job.salary;
      }

      // -------------------------------------------------
      // POSTED DATE
      // -------------------------------------------------

      if (job.postedAt) {
        existingJob.postedAt =
          job.postedAt;
      }

      // -------------------------------------------------
      // SOURCE URL
      // -------------------------------------------------

      if (job.sourceUrl) {
        existingJob.sourceUrl =
          job.sourceUrl;
      }

      // -------------------------------------------------
      // SCRAPE STATUS
      // -------------------------------------------------

      existingJob.scrapedAt =
        new Date();

      existingJob.isActive =
        true;

      // -------------------------------------------------
      // SAVE
      // -------------------------------------------------

      await existingJob.save();

      savedCount++;

      console.log(
        `UPDATED JOB: ${existingJob.title} - ${existingJob.company}`
      );

    } catch (error) {
      failedCount++;

      console.error(
        `Failed to save job: ${
          job?.title ||
          "Unknown title"
        }`,
        error.message
      );
    }
  }

  // =================================================
  // SAVE RESULT
  // =================================================

  console.log(
    `Database save complete: ${savedCount} saved, ${failedCount} failed`
  );

  // =================================================
  // VERIFY DATABASE
  // =================================================

  const totalJobsInDatabase =
    await Job.countDocuments();

  console.log(
    `MongoDB verification: ${totalJobsInDatabase} total jobs currently stored`
  );

  return {
    saved: savedCount,
    failed: failedCount
  };
};

// =====================================================
// EXPORT
// =====================================================

export default searchAllSources;

