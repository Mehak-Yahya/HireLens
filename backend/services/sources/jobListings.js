
// =====================================================
// JOB LISTINGS API SOURCE
// =====================================================

const jobListings = {
  name: "JobListingsAPI",

  // ===================================================
  // SEARCH JOBS
  // ===================================================

  async search({
    keyword,
    location
  }) {
    try {
      // -------------------------------------------------
      // VALIDATE API KEY
      // -------------------------------------------------

      if (!process.env.JLA_API_KEY) {
        console.error(
          "JobListingsAPI: JLA_API_KEY is not configured"
        );

        return [];
      }

      // -------------------------------------------------
      // BUILD API PARAMETERS
      // -------------------------------------------------

      const params =
        new URLSearchParams({
          limit: "20",
          title: keyword,
          country: "PK"
        });

      if (
        location &&
        typeof location === "string"
      ) {
        params.set(
          "location",
          location
        );
      }

      // -------------------------------------------------
      // BUILD REQUEST URL
      // -------------------------------------------------

      const url =
        `https://api.joblistingsapi.com/v1/jobs?${params.toString()}`;

      console.log(
        "\n================================="
      );

      console.log(
        "Job Listings API request"
      );

      console.log(
        "Keyword:",
        keyword
      );

      console.log(
        "Location:",
        location || "Any"
      );

      console.log(
        "API key exists:",
        Boolean(
          process.env.JLA_API_KEY
        )
      );

      console.log(
        "=================================\n"
      );

      // =================================================
      // REQUEST API
      // =================================================

      const response = await fetch(
        url,
        {
          method: "GET",

          headers: {
            "X-API-Key":
              process.env.JLA_API_KEY,

            Accept:
              "application/json"
          }
        }
      );

      // -------------------------------------------------
      // READ RESPONSE
      // -------------------------------------------------

      const text =
        await response.text();

      console.log(
        "JobListingsAPI status:",
        response.status
      );

      // =================================================
      // HANDLE HTTP ERRORS
      // =================================================

      if (!response.ok) {
        console.error(
          "JobListingsAPI response:",
          text
        );

        throw new Error(
          `HTTP ${response.status}: ${text}`
        );
      }

      // =================================================
      // PARSE JSON
      // =================================================

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "JobListingsAPI returned invalid JSON"
        );
      }

      // -------------------------------------------------
      // EXTRACT JOBS
      // -------------------------------------------------

      const apiJobs =
        Array.isArray(data?.jobs)
          ? data.jobs
          : [];

      console.log(
        "JobListingsAPI jobs returned:",
        apiJobs.length
      );

      // =================================================
      // NORMALIZE SOURCE RESPONSE
      // =================================================

      return apiJobs
        .map((job) => {
          if (
            !job ||
            typeof job !== "object"
          ) {
            return null;
          }

          return {
            // -------------------------------------------
            // SOURCE ID
            // -------------------------------------------

            id:
              job.id || null,

            // -------------------------------------------
            // SOURCE
            // -------------------------------------------

            source:
              job.source ||
              "JobListingsAPI",

            // -------------------------------------------
            // BASIC INFORMATION
            // -------------------------------------------

            title:
              job.title ||
              "Untitled Job",

            company:
              job.company ||
              "Unknown Company",

            location:
              typeof job.location === "string"
                ? job.location
                : job.location?.name ||
                  job.location?.city ||
                  job.location?.location ||
                  "Not specified",

            // -------------------------------------------
            // DESCRIPTION
            // -------------------------------------------

            description:
              job.description ||
              "",

            // -------------------------------------------
            // SKILLS
            // -------------------------------------------

            skills:
              Array.isArray(job.skills)
                ? job.skills
                : [],

            // -------------------------------------------
            // EMPLOYMENT TYPE
            // -------------------------------------------

            employmentType:
              job.employment_type ||
              "Not specified",

            // -------------------------------------------
            // EXPERIENCE LEVEL
            // -------------------------------------------

            experienceLevel:
              job.experience_level ||
              "Not specified",

            // -------------------------------------------
            // REMOTE
            // -------------------------------------------

            remote:
              Boolean(
                job.is_remote
              ),

            // -------------------------------------------
            // SALARY
            // -------------------------------------------

            salary:
              job.salary ||
              "Not specified",

            // -------------------------------------------
            // SOURCE URL
            //
            // IMPORTANT:
            // jobNormalizer.js expects sourceUrl.
            // -------------------------------------------

            sourceUrl:
              job.url ||
              job.source_url ||
              "",

            // -------------------------------------------
            // POSTED DATE
            // -------------------------------------------

            postedAt:
              job.listed_at ||
              job.posted_at ||
              null
          };
        })
        .filter(Boolean);

    } catch (error) {
      // =================================================
      // API ERROR
      // =================================================

      console.error(
        "JobListingsAPI failed:",
        error.message
      );

      return [];
    }
  }
};

// =====================================================
// EXPORT
// =====================================================

export default jobListings;

