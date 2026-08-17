import express from "express";
import Job from "../models/Job.js";
import { searchJobs } from "../controllers/jobController.js";

const router = express.Router();

// =====================================================
// INPUT VALIDATION MIDDLEWARE
// =====================================================

const validateSearchParams = (req, res, next) => {
  const { keyword, location } = req.query;
  
  if (keyword) {
    if (typeof keyword !== 'string' || keyword.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Invalid keyword parameter"
      });
    }
  }
  
  if (location) {
    if (typeof location !== 'string' || location.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Invalid location parameter"
      });
    }
  }
  
  next();
};

const validateJobInput = (req, res, next) => {
  const { title, company, sourceUrl } = req.body;
  
  if (title && (typeof title !== 'string' || title.length > 500)) {
    return res.status(400).json({
      success: false,
      message: "Invalid title field"
    });
  }
  
  if (company && (typeof company !== 'string' || company.length > 300)) {
    return res.status(400).json({
      success: false,
      message: "Invalid company field"
    });
  }
  
  if (sourceUrl && (typeof sourceUrl !== 'string' || sourceUrl.length > 2048)) {
    return res.status(400).json({
      success: false,
      message: "Invalid sourceUrl field"
    });
  }
  
  next();
};

// =====================================================
// SEARCH JOBS
// GET /api/jobs/search?keyword=Software%20Engineer&location=Lahore
// =====================================================

router.get("/search", validateSearchParams, searchJobs);

// =====================================================
// GET ALL JOBS
// GET /api/jobs
// =====================================================

router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error("Get jobs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs"
    });
  }
});

// =====================================================
// CREATE / UPDATE JOB
// POST /api/jobs
// =====================================================

router.post("/", validateJobInput, async (req, res) => {
  try {
    const {
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
      postedAt
    } = req.body;

    // ---------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------

    if (!title || !company || !source || !sourceUrl) {
      return res.status(400).json({
        success: false,
        message: "title, company, source and sourceUrl are required"
      });
    }

    // ---------------------------------------------------
    // CREATE STABLE JOB KEY
    // ---------------------------------------------------

    const jobKey = `${title}|${company}|${location || ""}`
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    // ---------------------------------------------------
    // CREATE NEW JOB OR UPDATE EXISTING JOB
    // ---------------------------------------------------

    const job = await Job.findOneAndUpdate(
      { jobKey },

      {
        $set: {
          title,
          company,
          location: location || "Not specified",
          description: description || "",
          skills: Array.isArray(skills) ? skills : [],
          employmentType:
            employmentType || "Not specified",
          experienceLevel:
            experienceLevel || "Not specified",
          salary:
            salary || "Not specified",
          source,
          sourceUrl,
          postedAt: postedAt || null,
          scrapedAt: new Date(),
          isActive: true
        },

        $setOnInsert: {
          jobKey
        }
      },

      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    // ---------------------------------------------------
    // RESPONSE
    // ---------------------------------------------------

    res.status(200).json({
      success: true,
      message: "Job saved successfully",
      job
    });

  } catch (error) {
    console.error("Save job error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save job"
    });
  }
});

export default router;