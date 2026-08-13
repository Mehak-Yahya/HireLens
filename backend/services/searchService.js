import sources from "./sources/index.js";
import { normalizeJobs } from "./jobNormalizer.js";
import deduplicateJobs from "./deduplicateJobs.js";
import Job from "../models/Job.js";

// =====================================================
// SEARCH ALL JOB SOURCES
// =====================================================

const searchAllSources = async ({
  keyword,
  location
}) => {
  const sourceList = Object.values(
    sources
  );

  console.log(`Starting live scrape for keyword='${keyword}' location='${location}' across ${sourceList.length} sources`);

  // ===================================================
  // SEARCH ALL SOURCES IN PARALLEL
  // ===================================================

  const results =
    await Promise.allSettled(
      sourceList.map(async (source) => {
        console.log(`Running source scraper: ${source.name}`);
        return source.search({ keyword, location });
      })
    );

  const jobs = [];

  // ===================================================
  // COLLECT SUCCESSFUL RESULTS
  // ===================================================

  results.forEach(
    (result, index) => {
      const source =
        sourceList[index];

      if (
        result.status ===
        "fulfilled"
      ) {
        const normalizedJobs =
          normalizeJobs(
            result.value,
            source.name
          );

        jobs.push(
          ...normalizedJobs
        );
      } else {
        console.error(
          `${source.name} search failed:`,
          result.reason?.message ||
            result.reason
        );
      }
    }
  );

  // ===================================================
  // REMOVE DUPLICATES
  // ===================================================

  const uniqueJobs =
    deduplicateJobs(jobs);

  console.log(
    `Found ${jobs.length} jobs`
  );

  console.log(
    `${uniqueJobs.length} unique jobs after deduplication`
  );

  // ===================================================
  // SAVE / UPDATE MONGODB
  // ===================================================

  const savedJobs = [];

  for (const job of uniqueJobs) {
    try {
      // ------------------------------------------------
      // VALIDATE REQUIRED DATA
      // ------------------------------------------------

      if (
        !job.jobKey ||
        !job.sourceUrl
      ) {
        console.warn(
          "Skipping invalid job:",
          job.title
        );

        continue;
      }

      // ------------------------------------------------
      // FIND JOB USING JOB KEY
      // ------------------------------------------------

      const existingJob =
        await Job.findOne({
          jobKey: job.jobKey
        });

      // =================================================
      // NEW JOB
      // =================================================

      if (!existingJob) {
        const newJob =
          await Job.create({
            ...job,

            sources:
              job.sources?.length
                ? job.sources
                : [
                    job.source ||
                      "Unknown"
                  ],

            scrapedAt:
              new Date(),

            isActive: true
          });

        savedJobs.push(
          newJob
        );

        console.log(
          `NEW JOB: ${job.title} - ${job.company}`
        );

        continue;
      }

      // =================================================
      // EXISTING JOB
      // =================================================

      // -------------------------------------------------
      // MERGE SOURCES
      // -------------------------------------------------

      const existingSources =
        existingJob.sources ||
        [];

      const incomingSources =
        job.sources?.length
          ? job.sources
          : [
              job.source ||
                "Unknown"
            ];

      existingJob.sources = [
        ...new Set([
          ...existingSources,
          ...incomingSources
        ])
      ];

      // -------------------------------------------------
      // UPDATE BASIC INFORMATION
      // -------------------------------------------------

      if (job.title) {
        existingJob.title =
          job.title;
      }

      if (job.company) {
        existingJob.company =
          job.company;
      }

      if (job.location) {
        existingJob.location =
          job.location;
      }

      // -------------------------------------------------
      // UPDATE DESCRIPTION
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
      // MERGE SKILLS
      // -------------------------------------------------

      existingJob.skills = [
        ...new Set([
          ...(existingJob.skills ||
            []),
          ...(job.skills || [])
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

      if (
        job.postedAt &&
        !existingJob.postedAt
      ) {
        existingJob.postedAt =
          job.postedAt;
      }

      // -------------------------------------------------
      // KEEP SOURCE URL
      // -------------------------------------------------

      if (
        !existingJob.sourceUrl &&
        job.sourceUrl
      ) {
        existingJob.sourceUrl =
          job.sourceUrl;
      }

      // -------------------------------------------------
      // UPDATE SCRAPE STATUS
      // -------------------------------------------------

      existingJob.scrapedAt =
        new Date();

      existingJob.isActive =
        true;

      // -------------------------------------------------
      // SAVE
      // -------------------------------------------------

      await existingJob.save();

      savedJobs.push(
        existingJob
      );

      console.log(
        `UPDATED JOB: ${existingJob.title} - ${existingJob.company}`
      );
    } catch (error) {
      // =================================================
      // DATABASE ERROR
      // =================================================

      console.error(
        `Failed to save job: ${job.title}`,
        error.message
      );
    }
  }

  // ===================================================
  // RETURN JOBS
  // ===================================================

  return savedJobs;
};

export default searchAllSources;

