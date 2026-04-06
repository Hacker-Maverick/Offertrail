# OfferTrail - Job & Internship Application Tracker

OfferTrail is a clean, minimal, and usable application to track your job and internship applications. It helps you stay organized, track resume versions, and never miss a follow-up.

## Features
- **Dashboard**: Quick overview of your applications, interviews, and offers.
- **Application Tracking**: Detailed logging of company, role, status, category, etc.
- **Reminder System**: Highlighting today's and overdue follow-ups.
- **Resume Versioning**: Link specific resume versions to each application.
- **Referral Tracking**: Keep track of who referred you.
- **CSV Export**: Export your data anytime.
- **Authentication**: Secure signup, login, and password reset.

## Tech Stack
- **Backend**: Node.js, Express.js, MongoDB Atlas
- **Frontend**: EJS Templating, Plain CSS
- **Auth**: express-session, bcryptjs
- **Email**: Nodemailer (Gmail SMTP)

## Local Setup

### 1. Clone the repository
```bash
git clone <your-repo-link>
cd offertrail
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add the following:
```env
PORT=3000
MONGO_URI=your_mongodb_atlas_connection_string
SESSION_SECRET=a_random_secret_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
BASE_URL=http://localhost:3000
```
*Note: For `EMAIL_PASS`, you must use a [Gmail App Password](https://support.google.com/accounts/answer/185833), not your regular password.*

### 4. Run the application
```bash
npm start
```
Visit `http://localhost:3000` in your browser.

## Deployment Checklist (Render / Heroku)
1. Create a MongoDB Atlas cluster (Free Tier).
2. Set up the Environment Variables on your hosting platform.
3. Ensure the `PORT` variable is set to `process.env.PORT`.
4. Deploy the main branch.

## Built for Students and Job Seekers
Stay organized and land your dream job!
