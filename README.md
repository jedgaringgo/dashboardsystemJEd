# Neon StudentHub — Student Management Dashboard

A responsive student management web app with a neon pink/purple theme, Express.js backend, SQLite database, CRUD operations, and course/gender population analytics.

## Requirements
- Node.js 18 or newer
- npm
- Visual Studio Code

## Run locally
1. Extract the ZIP file.
2. Open the `NeonStudentHub` folder in VS Code.
3. Open Terminal → New Terminal.
4. Install dependencies:

   ```bash
   npm install
   ```

5. (Optional) Copy `.env.example` to `.env`. The default port is 3000.
6. Start the server:

   ```bash
   npm start
   ```

7. Open **http://localhost:3000** in your browser.

The SQLite database (`students.db`) and `students` table are created automatically the first time the server starts.

## Features
- Create, read, update, and delete student records.
- Student fields: first name, last name, email, contact number, course, year level, gender, and status.
- Gender options: Female, Male, Prefer not to say.
- Dashboard counts for total, active, inactive, male, and female students.
- Course population percentage based on the total number of students.
- Per-course male/female/undisclosed counts and percentages.
- Search and filter by course, gender, and status.
- Responsive neon pink/purple dashboard.

## API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/students` | List students; supports `search`, `course`, `gender`, `status` query parameters |
| GET | `/api/stats` | Dashboard totals and course/gender analytics |
| GET | `/api/courses` | List available courses |
| POST | `/api/students` | Create a student |
| PUT | `/api/students/:id` | Update a student |
| DELETE | `/api/students/:id` | Delete a student |

## Upload to GitHub
1. Create a new empty repository on GitHub, for example `neon-studenthub`.
2. In VS Code, open the project terminal and run:

   ```bash
   git init
   git add .
   git commit -m "Create Neon StudentHub CRUD dashboard"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/neon-studenthub.git
   git push -u origin main
   ```

3. Replace `YOUR-USERNAME` with your GitHub username.
4. Do not upload `node_modules`, `.env`, or `students.db`; these are excluded by `.gitignore`.

## Notes
- The dashboard starts empty. Add student records to populate the statistics and charts.
- Percentages are calculated from the records currently stored in the database.
- The gender distribution for each course is calculated using that course's student total.
