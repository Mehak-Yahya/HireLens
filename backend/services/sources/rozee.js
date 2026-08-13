import axios from "axios";
import * as cheerio from "cheerio";

const rozee = {
  name: "Rozee",

  async search({ keyword, location }) {
    try {
      const searchUrl = `https://www.rozee.pk/job/jsearch/q/${encodeURIComponent(keyword)}`;

      console.log(`Rozee search: ${keyword} - ${location}`);

      const response = await axios.get(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36"
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const jobs = [];

      $("a").each((index, element) => {
        const title = $(element).text().trim();
        const href = $(element).attr("href");

        if (
          title &&
          href &&
          href.includes("rozee.pk") &&
          title.length > 5
        ) {
          jobs.push({
            source: "Rozee",
            title,
            company: "",
            location,
            url: href.startsWith("http")
              ? href
              : `https://www.rozee.pk${href}`
          });
        }
      });

      return jobs;
    } catch (error) {
      console.error("Rozee search failed:", error.message);
      return [];
    }
  }
};

export default rozee;