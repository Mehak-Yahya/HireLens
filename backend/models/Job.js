import mongoose from "mongoose";

// =====================================================
// JOB SCHEMA
// =====================================================

const jobSchema = new mongoose.Schema(
  {
    // ===================================================
    // JOB KEY
    // Used to identify the same job across sources
    // ===================================================

    jobKey: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    // ===================================================
    // BASIC JOB INFORMATION
    // ===================================================

    title: {
      type: String,
      required: true,
      trim: true
    },

    company: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      default: "Not specified",
      trim: true
    },

    // ===================================================
    // JOB DESCRIPTION
    // ===================================================

    description: {
      type: String,
      default: ""
    },

    // ===================================================
    // SKILLS
    // ===================================================

    skills: {
      type: [String],
      default: []
    },

    // ===================================================
    // EMPLOYMENT
    // ===================================================

    employmentType: {
      type: String,
      default: "Not specified"
    },

    experienceLevel: {
      type: String,
      default: "Not specified"
    },

    salary: {
      type: String,
      default: "Not specified"
    },

    // ===================================================
    // SOURCE INFORMATION
    // ===================================================

    source: {
      type: String,
      default: "Unknown"
    },

    sourceUrl: {
      type: String,
      required: true,
      trim: true
    },

    sources: {
      type: [String],
      default: []
    },

    // ===================================================
    // DATES
    // ===================================================

    postedAt: {
      type: Date,
      default: null
    },

    scrapedAt: {
      type: Date,
      default: Date.now
    },

    // ===================================================
    // STATUS
    // ===================================================

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// =====================================================
// INDEXES
// =====================================================

// -----------------------------------------------------
// ONE DATABASE RECORD PER UNIQUE JOB
// -----------------------------------------------------

jobSchema.index(
  { jobKey: 1 },
  { unique: true }
);

// -----------------------------------------------------
// SOURCE URL INDEX
// -----------------------------------------------------

jobSchema.index({
  sourceUrl: 1
});

// -----------------------------------------------------
// TEXT SEARCH
// -----------------------------------------------------

jobSchema.index({
  title: "text",
  company: "text",
  description: "text"
});

// -----------------------------------------------------
// LOCATION FILTERING
// -----------------------------------------------------

jobSchema.index({
  location: 1
});

// -----------------------------------------------------
// COMPANY FILTERING
// -----------------------------------------------------

jobSchema.index({
  company: 1
});

// =====================================================
// MODEL
// =====================================================

const Job = mongoose.model(
  "Job",
  jobSchema
);

export default Job;

