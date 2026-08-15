import jobListings from "../services/sources/jobListings.js";
import companyCareers from "../services/sources/companyCareers.js";

export const searchJobs = async (req, res) => {
  const startTime = Date.now();
  try {
    const keyword = req.query.keyword?.trim();
    const location = req.query.location?.trim();

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Keyword is required"
      });
    }

    console.log("\n=================================");
    console.log("JOB SEARCH");
    console.log("Keyword:", keyword);
    console.log("Location:", location || "Any");
    console.log("=================================\n");

    // Search both sources with error handling
    const results = await Promise.allSettled([
      jobListings.search({
        keyword,
        location
      }),

      companyCareers.search({
        keyword,
        location
      })
    ]);

    const jobs = [];
    const errors = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const sourceJobs = Array.isArray(result.value) ? result.value : [];
        jobs.push(...sourceJobs);
      } else {
        const sourceName = index === 0 ? 'jobListings' : 'companyCareers';
        errors.push(sourceName);
        console.error(`${sourceName} search failed:`, result.reason);
      }
    });

    const duration = Date.now() - startTime;
    console.log(`Search completed in ${duration}ms with ${jobs.length} total results`);

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
      ...(errors.length > 0 && { warnings: `Some sources failed: ${errors.join(', ')}` })
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `Job search controller error (${duration}ms):`,
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to search jobs"
    });
  }
};