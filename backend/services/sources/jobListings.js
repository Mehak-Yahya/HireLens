const jobListings = {
  name: "JobListingsAPI",

  async search({ keyword, location }) {
    try {
      const params = new URLSearchParams({
        limit: "20",
        title: keyword,
        country: "PK"
      });

      if (location) {
        params.set("location", location);
      }

      const url =
        `https://api.joblistingsapi.com/v1/jobs?${params.toString()}`;

      console.log("\n=================================");
      console.log("Job Listings API request");
      console.log("URL:", url);
      console.log("API key exists:", !!process.env.JLA_API_KEY);
      console.log("=================================\n");

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-Key": process.env.JLA_API_KEY,
          "Accept": "application/json"
        }
      });

      const text = await response.text();

      console.log("Status:", response.status);
      console.log("Response:", text);

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${text}`
        );
      }

      const data = JSON.parse(text);

      console.log(
        "API jobs returned:",
        data.jobs?.length || 0
      );

      return (data.jobs || []).map((job) => ({
        id: job.id,
        source: job.source,
        title: job.title,
        company: job.company,
        location: job.location,
        employmentType: job.employment_type,
        remote: job.is_remote,
        salary: job.salary,
        url: job.url,
        postedAt: job.listed_at
      }));

    } catch (error) {
      console.error(
        "Job Listings API failed:",
        error.message
      );

      return [];
    }
  }
};

export default jobListings;