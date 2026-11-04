
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// CORS CONFIGURATION
// ========================================

const allowedOrigins = [
  "https://jedgaringgo.github.io",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files if available
app.use(express.static(path.join(__dirname, "public")));

// ========================================
// COURSE OPTIONS
// ========================================

const COURSES = [
  "BS Information Technology",
  "BS Computer Science",
  "BS Business Administration",
  "BS Education",
  "BS Criminology",
  "BS Hospitality Management",
  "BS Accountancy",
  "BS Psychology"
];

const YEAR_LEVELS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year"
];

const GENDERS = [
  "Male",
  "Female",
  "Prefer not to say"
];

const STATUSES = [
  "Active",
  "Inactive"
];

// ========================================
// STUDENT VALIDATION
// ========================================

function validateStudent(body) {
  const required = [
    "first_name",
    "last_name",
    "email",
    "course",
    "year_level",
    "gender"
  ];

  for (const field of required) {
    if (!String(body[field] || "").trim()) {
      return `${field.replaceAll("_", " ")} is required.`;
    }
  }

  const email = String(body.email).trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address.";
  }

  if (!COURSES.includes(body.course)) {
    return "Please choose a valid course.";
  }

  if (!YEAR_LEVELS.includes(body.year_level)) {
    return "Please choose a valid year level.";
  }

  if (!GENDERS.includes(body.gender)) {
    return "Please choose a valid gender.";
  }

  if (body.status && !STATUSES.includes(body.status)) {
    return "Please choose a valid status.";
  }

  return null;
}

// ========================================
// GET COURSES
// ========================================

app.get("/api/courses", (req, res) => {
  res.json(COURSES);
});

// ========================================
// GET ALL STUDENTS + SEARCH + FILTER
// ========================================

app.get("/api/students", (req, res) => {
  try {
    const {
      search = "",
      course = "",
      gender = "",
      status = ""
    } = req.query;

    let sql = "SELECT * FROM students WHERE 1=1";
    const params = [];

    if (search) {
      sql += `
        AND (
          first_name LIKE ?
          OR last_name LIKE ?
          OR email LIKE ?
          OR CAST(id AS TEXT) LIKE ?
        )
      `;

      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (course) {
      sql += " AND course = ?";
      params.push(course);
    }

    if (gender) {
      sql += " AND gender = ?";
      params.push(gender);
    }

    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }

    sql += " ORDER BY id DESC";

    const students = db.prepare(sql).all(...params);

    res.json(students);

  } catch (err) {
    console.error("Get students error:", err);

    res.status(500).json({
      error: "Unable to retrieve students."
    });
  }
});

// ========================================
// DASHBOARD STATISTICS
// ========================================

app.get("/api/stats", (req, res) => {
  try {
    const total = db.prepare(
      "SELECT COUNT(*) AS count FROM students"
    ).get().count;

    const active = db.prepare(
      "SELECT COUNT(*) AS count FROM students WHERE status = 'Active'"
    ).get().count;

    const inactive = db.prepare(
      "SELECT COUNT(*) AS count FROM students WHERE status = 'Inactive'"
    ).get().count;

    const male = db.prepare(
      "SELECT COUNT(*) AS count FROM students WHERE gender = 'Male'"
    ).get().count;

    const female = db.prepare(
      "SELECT COUNT(*) AS count FROM students WHERE gender = 'Female'"
    ).get().count;

    const undisclosed = db.prepare(
      "SELECT COUNT(*) AS count FROM students WHERE gender = 'Prefer not to say'"
    ).get().count;

    const courseRows = db.prepare(`
      SELECT
        course,
        COUNT(*) AS total,
        SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) AS male,
        SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) AS female,
        SUM(CASE WHEN gender = 'Prefer not to say' THEN 1 ELSE 0 END) AS undisclosed
      FROM students
      GROUP BY course
      ORDER BY total DESC, course ASC
    `).all();

    const courses = courseRows.map(row => ({
      ...row,

      percentage: total
        ? Number(((row.total / total) * 100).toFixed(1))
        : 0,

      male_percentage: row.total
        ? Number(((row.male / row.total) * 100).toFixed(1))
        : 0,

      female_percentage: row.total
        ? Number(((row.female / row.total) * 100).toFixed(1))
        : 0,

      undisclosed_percentage: row.total
        ? Number(((row.undisclosed / row.total) * 100).toFixed(1))
        : 0
    }));

    res.json({
      total,
      active,
      inactive,
      male,
      female,
      undisclosed,
      courses
    });

  } catch (err) {
    console.error("Statistics error:", err);

    res.status(500).json({
      error: "Unable to retrieve dashboard statistics."
    });
  }
});

// ========================================
// ADD STUDENT
// ========================================

app.post("/api/students", (req, res) => {
  const error = validateStudent(req.body);

  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const result = db.prepare(`
      INSERT INTO students (
        first_name,
        last_name,
        email,
        contact_number,
        course,
        year_level,
        gender,
        status
      )
      VALUES (
        @first_name,
        @last_name,
        @email,
        @contact_number,
        @course,
        @year_level,
        @gender,
        @status
      )
    `).run({
      first_name: req.body.first_name.trim(),
      last_name: req.body.last_name.trim(),
      email: req.body.email.trim().toLowerCase(),
      contact_number: String(req.body.contact_number || "").trim(),
      course: req.body.course,
      year_level: req.body.year_level,
      gender: req.body.gender,
      status: req.body.status || "Active"
    });

    const student = db.prepare(
      "SELECT * FROM students WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json(student);

  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        error: "That email address is already registered."
      });
    }

    console.error("Add student error:", err);

    res.status(500).json({
      error: "Unable to add student."
    });
  }
});

// ========================================
// UPDATE STUDENT
// ========================================

app.put("/api/students/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      error: "Invalid student ID."
    });
  }

  const error = validateStudent(req.body);

  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const result = db.prepare(`
      UPDATE students SET
        first_name = @first_name,
        last_name = @last_name,
        email = @email,
        contact_number = @contact_number,
        course = @course,
        year_level = @year_level,
        gender = @gender,
        status = @status
      WHERE id = @id
    `).run({
      id,
      first_name: req.body.first_name.trim(),
      last_name: req.body.last_name.trim(),
      email: req.body.email.trim().toLowerCase(),
      contact_number: String(req.body.contact_number || "").trim(),
      course: req.body.course,
      year_level: req.body.year_level,
      gender: req.body.gender,
      status: req.body.status || "Active"
    });

    if (!result.changes) {
      return res.status(404).json({
        error: "Student not found."
      });
    }

    const student = db.prepare(
      "SELECT * FROM students WHERE id = ?"
    ).get(id);

    res.json(student);

  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        error: "That email address is already registered."
      });
    }

    console.error("Update student error:", err);

    res.status(500).json({
      error: "Unable to update student."
    });
  }
});

// ========================================
// DELETE STUDENT
// ========================================

app.delete("/api/students/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      error: "Invalid student ID."
    });
  }

  try {
    const result = db.prepare(
      "DELETE FROM students WHERE id = ?"
    ).run(id);

    if (!result.changes) {
      return res.status(404).json({
        error: "Student not found."
      });
    }

    res.json({
      message: "Student deleted successfully."
    });

  } catch (err) {
    console.error("Delete student error:", err);

    res.status(500).json({
      error: "Unable to delete student."
    });
  }
});

// ========================================
// UNKNOWN API ROUTES
// ========================================

app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API route not found."
  });
});

// ========================================
// FRONTEND FALLBACK
// ========================================

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"), err => {
    if (err) {
      res.status(404).send("StudentHub frontend is not installed on this service.");
    }
  });
});

// ========================================
// SERVER START
// ========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Neon StudentHub running on port ${PORT}`);
});
