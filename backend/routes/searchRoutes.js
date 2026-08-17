import express from "express";
import searchAllSources from "../services/searchService.js";
import Job from "../models/Job.js";

const router = express.Router();
const activeScrapes = new Set();

const makeSearchKey = (keyword, location) =>
  `${keyword.toLowerCase().trim()}|${location.toLowerCase().trim()}`;

// =====================================================
// INPUT VALIDATION MIDDLEWARE
// =====================================================

const validateSearchInput = (req, res, next) => {
  const { keyword, location } = req.body;
  
  if (!keyword || typeof keyword !== 'string' || keyword.length > 200 || keyword.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid keyword: must be non-empty string (max 200 chars)"
    });
  }
  
  if (!location || typeof location !== 'string' || location.length > 200 || location.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid location: must be non-empty string (max 200 chars)"
    });
  }
  
  next();
};

const startBackgroundScrape = async (searchKey, keyword, location) => {
  if (activeScrapes.has(searchKey)) {
    return;
  }

  activeScrapes.add(searchKey);

  try {
    console.log(`Starting background scrape for ${searchKey}`);

    await searchAllSources({
      keyword,
      location
    });

    console.log(`Background scrape complete for ${searchKey}`);
  } catch (error) {
    console.error(`Background scrape failed for ${searchKey}:`, error.message || error);
  } finally {
    activeScrapes.delete(searchKey);
  }
};

// =====================================================
// SEARCH JOBS
// POST /api/search
// body: { keyword, location, forceLive(boolean) }
// =====================================================

router.post("/", validateSearchInput, async (req, res) => {
  try {
    const { keyword, location, forceLive } = req.body;

    console.log(`Search route received request: keyword='${keyword || ""}' location='${location || ""}' forceLive=${Boolean(forceLive)}`);

    if (!keyword || !location) {
      return res.status(400).json({
        success: false,
        message: "keyword and location are required"
      });
    }

    const cleanKeyword = keyword.trim();
    const cleanLocation = location.trim();
    const searchKey = makeSearchKey(cleanKeyword, cleanLocation);

    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
    const tokens = cleanKeyword.toLowerCase().split(/\s+/).filter(Boolean);

    const query = {};

    if (tokens.length === 1) {
      query.title = { $regex: new RegExp(`\\b${escapeRegex(tokens[0])}\\b`, "i") };
    } else if (tokens.length > 1) {
      query.$and = tokens.map((t) => ({ title: { $regex: new RegExp(`\\b${escapeRegex(t)}\\b`, "i") } }));
    }

    if (cleanLocation) {
      query.location = { $regex: new RegExp(`\\b${escapeRegex(cleanLocation)}\\b`, "i") };
    }

    if (!forceLive) {
      console.log(`Checking cache for '${cleanKeyword}' in '${cleanLocation}'`);
      const cachedJobs = await Job.find(query)
        .sort({ scrapedAt: -1 })
        .limit(50)
        .lean();

      console.log(`Cached jobs found: ${cachedJobs.length}`);

      if (cachedJobs.length > 0) {
        console.log(`Cache hit: returning ${cachedJobs.length} jobs and starting background refresh`);
        startBackgroundScrape(searchKey, cleanKeyword, cleanLocation);

        return res.json({
          success: true,
          keyword: cleanKeyword,
          location: cleanLocation,
          count: cachedJobs.length,
          jobs: cachedJobs,
          source: "cache",
          backgroundScrape: true
        });
      }

      console.log("No cached jobs found, running live scrape.");
    } else {
      console.log("forceLive=true, skipping cache and running live scrape.");
    }

    const jobs = await searchAllSources({
      keyword: cleanKeyword,
      location: cleanLocation
    });

    res.json({
      success: true,
      keyword: keyword.trim(),
      location: location.trim(),
      count: jobs.length,
      jobs,
      source: "live"
    });
  } catch (error) {
    console.error("Search error:", error);

    res.status(500).json({
      success: false,
      message: "Job search failed"
    });
  }
});

export default router;