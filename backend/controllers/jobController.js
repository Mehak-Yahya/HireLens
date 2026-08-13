import jobListings from "../services/sources/jobListings.js";

export const searchJobs = async (req, res) => {
  try {
    const keyword = req.query.keyword?.trim();
    const location = req.query.location?.trim();

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Keyword is required"
      });
    }

    const jobs = await jobListings.search({
      keyword,
      location
    });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error("Job search controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search jobs"
    });
  }
};