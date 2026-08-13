import dotenv from "dotenv";
import mustakbil from "./services/sources/mustakbil.js";

dotenv.config();

const jobs = await mustakbil.search({
  keyword: "Software Engineer",
  location: "Lahore"
});

console.log("\nJobs found:", jobs.length);

console.dir(jobs.slice(0, 10), {
  depth: null
});