import dotenv from "dotenv";
import jobListings from "./services/sources/jobListings.js";
import mustakbil from "./services/sources/mustakbil.js";

dotenv.config();

const keyword = "Software Engineer";
const location = "Lahore";

// =====================================================
// TEST JOBLISTINGS API
// =====================================================

console.log("\n=================================");
console.log("TESTING JOBLISTINGS API");
console.log("=================================\n");

const jobListingsJobs = await jobListings.search({
  keyword,
  location
});

console.log(
  "\nJobListingsAPI Jobs found:",
  jobListingsJobs.length
);

console.dir(jobListingsJobs.slice(0, 10), {
  depth: null
});

// =====================================================
// TEST MUSTAKBIL
// =====================================================

console.log("\n=================================");
console.log("TESTING MUSTAKBIL");
console.log("=================================\n");

const mustakbilJobs = await mustakbil.search({
  keyword,
  location
});

console.log(
  "\nMustakbil Jobs found:",
  mustakbilJobs.length
);

console.dir(mustakbilJobs.slice(0, 10), {
  depth: null
});

// =====================================================
// SUMMARY
// =====================================================

console.log("\n=================================");
console.log("SEARCH SUMMARY");
console.log("=================================");

console.log(
  "JobListingsAPI:",
  jobListingsJobs.length
);

console.log(
  "Mustakbil:",
  mustakbilJobs.length
);

console.log(
  "Total:",
  jobListingsJobs.length + mustakbilJobs.length
);

console.log("=================================\n");