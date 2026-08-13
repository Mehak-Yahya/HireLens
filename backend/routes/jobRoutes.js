import express from "express";
import Job from "../models/Job.js";
import { searchJobs } from "../controllers/jobController.js";

const router = express.Router();

// =====================================================
// SEARCH JOBS FROM JOB LISTINGS API
// GET /api/jobs/search?keyword=Software%20Engineer&location=Lahore
// =====================================================

router.get("/search", searchJobs);

// =====================================================
// GET ALL JOBS FROM DATABASE
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
// CREATE JOB
// POST /api/jobs
// =====================================================

router.post("/", async (req, res) => {
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

    if (!title || !company || !source || !sourceUrl) {
      return res.status(400).json({
        success: false,
        message: "title, company, source and sourceUrl are required"
      });
    }

    const existingJob = await Job.findOne({
      sourceUrl
    });

    if (existingJob) {
      return res.status(409).json({
        success: false,
        message: "Job already exists",
        job: existingJob
      });
    }

    const job = await Job.create({
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
    });

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      job
    });
  } catch (error) {
    console.error("Create job error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create job"
    });
  }
});

export default router;