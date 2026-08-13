import dotenv from "dotenv";

dotenv.config();

const appId = process.env.ADZUNA_APP_ID;
const appKey = process.env.ADZUNA_APP_KEY;

console.log("App ID loaded:", !!appId);
console.log("App Key loaded:", !!appKey);

const url =
  `https://api.adzuna.com/v1/api/jobs/in/search/1` +
  `?app_id=${appId}` +
  `&app_key=${appKey}` +
  `&what=developer` +
  `&where=Pakistan` +
  `&results_per_page=10`;

try {
  const response = await fetch(url);

  console.log("API status:", response.status);

  const data = await response.json();

  if (!response.ok) {
    console.log("API error:", data);
    process.exit(1);
  }

  console.log(`\nFound ${data.results.length} jobs:\n`);

  data.results.forEach((job, index) => {
    console.log(`${index + 1}. ${job.title}`);
    console.log(`   Company: ${job.company?.display_name || "Unknown"}`);
    console.log(`   Location: ${job.location?.display_name || "Unknown"}`);
    console.log(`   URL: ${job.redirect_url || "No URL"}`);
    console.log("");
  });
} catch (error) {
  console.error("Request failed:", error.message);
}