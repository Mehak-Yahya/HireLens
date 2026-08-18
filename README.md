# HireLens 
## Job Discovery Chrome Extension

HireLens is a Chrome Extension that helps users discover relevant job opportunities from multiple job sources in one place.

It collects job listings, filters relevant opportunities, and displays essential job information including job title, company, source, and original job URL.

Users can open the original job posting and apply directly through the respective job platform.
Discover jobs faster. Apply directly.

---

## Features

- Job discovery from multiple sources
- Relevant job filtering
- Job title display
- Company name display
- Job source display
- Original job URL
- Direct navigation to the original job posting
- MongoDB job storage
- Chrome Extension interface

### Current Job Sources

| Source | Method | Status |
|---|---|---|
| Bayt | Web Scraper | Active |
| Mustakbil | Web Scraper | Active |
| Job Listings API | REST API | Active |
| Company Career Page | Web Scraper | Active |

---

## Tech Stack
### Frontend

- JavaScript
- HTML5
- CSS3
- Chrome Extension Manifest V3
- Chrome Extension APIs

### Backend

- Node.js
- Express.js
- REST API
- Axios
- Cheerio
- Playwright

The backend handles:

- Job collection
- Web scraping
- Job processing
- Job filtering
- API requests
- Database communication

### Database

- MongoDB
- MongoDB Atlas
MongoDB is used to store and manage collected job listings.

### Deployment

- Backend: Railway
- Database: MongoDB Atlas
- Frontend: Chrome Extension

HireLens backend is deployed on Railway and provides the production API used by the Chrome Extension.
The Chrome Extension is currently being developed and tested locally. Chrome Web Store publication is planned for a future release.

---

## Installation

### Backend

```bash
git clone https://github.com/YOUR_USERNAME/HireLens.git
cd HireLens/backend
npm install
```
Create a `.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Start the backend:

```bash
npm start
```

For development:

```bash
npm run dev
```

---
### Screenshots
<img width="1362" height="691" alt="job" src="https://github.com/user-attachments/assets/80fca8f0-251c-4ee7-89e3-34a096b27d32" />
<img width="413" height="601" alt="results" src="https://github.com/user-attachments/assets/6c9de0e9-158b-4907-8069-8899eafee4cc" />
<img width="1366" height="689" alt="backe" src="https://github.com/user-attachments/assets/8d6f6347-956d-4e86-8e30-cb0871f40d06" />

### Chrome Extension

1. Open Google Chrome.
2. Navigate to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the HireLens extension folder.
6. Pin HireLens to the Chrome toolbar.

---

## Current Status

- [x] Chrome Extension frontend
- [x] Node.js backend
- [x] Express REST API
- [x] MongoDB integration
- [x] MongoDB Atlas
- [x] Railway backend deployment
- [x] Bayt integration
- [x] Mustakbil integration
- [x] Job Listings API integration
- [x] Job filtering
- [x] Job title display
- [x] Company display
- [x] Source display
- [x] Original job URL
- [x] Direct navigation to job posting

---

## Future Enhancements

- [ ] AI-powered job matching
- [ ] Resume-job matching
- [ ] Job compatibility scoring
- [ ] Skill-gap analysis
- [ ] Personalized job recommendations
- [ ] Saved jobs
- [ ] Job alerts
- [ ] Application tracking
- [ ] AI-generated cover letters
- [ ] Additional job sources
- [ ] User authentication
- [ ] Chrome Web Store publication

---
## Author
**Mehak Yahya**

## License

This project is currently intended for educational and development purposes.

---
