
"use strict";

// ==========================================
// NEON STUDENTHUB - STUDENT MANAGEMENT
// ==========================================

// IMPORTANT: Replace this with your actual Render URL.
const API = "https://YOUR-ACTUAL-RENDER-URL.onrender.com/api";

const COURSE_LIST = [
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

const $ = selector => document.querySelector(selector);

const modalBackdrop = $("#modalBackdrop");
const studentForm = $("#studentForm");
const formError = $("#formError");

let editingId = null;
let toastTimer = null;

// ==========================================
// API REQUEST
// ==========================================

async function request(url, options = {}) {
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  } catch (error) {
    throw new Error(
      "Cannot connect to the server. Check your Render URL and internet connection."
    );
  }

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (response.status === 405) {
      throw new Error(
        "405 Method Not Allowed. Your request may be going to GitHub Pages instead of Render. Check your API URL."
      );
    }

    throw new Error(
      `Server returned an invalid response (${response.status}). Check your Render backend.`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error || `Request failed with status ${response.status}.`
    );
  }

  return data;
}

// ==========================================
// SAFE HTML DISPLAY
// ==========================================

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function displayValue(value) {
  const text = String(value ?? "").trim();

  // Prevent image data or HTML from appearing as student text.
  if (
    /data:image\//i.test(text) ||
    /<img[\s>]/i.test(text) ||
    /src\s*=/i.test(text) ||
    /^data:/i.test(text) ||
    text.length > 500 ||
    /^[A-Za-z0-9+/]{500,}={0,2}$/.test(text)
  ) {
    return "Invalid data";
  }

  return text;
}

// ==========================================
// TOAST NOTIFICATION
// ==========================================

function showToast(message) {
  const toast = $("#toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

// ==========================================
// COURSE OPTIONS
// ==========================================

function populateCourseOptions() {
  const courseSelect = $("#courseSelect");
  const courseFilter = $("#courseFilter");

  const options = COURSE_LIST.map(course => `
    <option value="${escapeHTML(course)}">
      ${escapeHTML(course)}
    </option>
  `).join("");

  if (courseSelect) {
    courseSelect.innerHTML =
      '<option value="">Select course</option>' + options;
  }

  if (courseFilter) {
    courseFilter.innerHTML =
      '<option value="">All Courses</option>' + options;
  }
}

// ==========================================
// MODAL FUNCTIONS
// ==========================================

function openModal(student = null) {
  if (!studentForm || !modalBackdrop) return;

  editingId = student ? Number(student.id) : null;

  studentForm.reset();

  formError.textContent = "";

  $("#modalTitle").textContent = student
    ? "Edit Student"
    : "Add New Student";

  $("#saveStudentBtn").textContent = student
    ? "Update Student"
    : "Save Student";

  if (student) {
    Object.entries(student).forEach(([key, value]) => {
      const field = studentForm.elements[key];

      if (field && !["id", "created_at"].includes(key)) {
        field.value = value ?? "";
      }
    });
  } else if (studentForm.elements.status) {
    studentForm.elements.status.value = "Active";
  }

  modalBackdrop.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modalBackdrop) return;

  modalBackdrop.classList.remove("show");
  document.body.style.overflow = "";

  editingId = null;

  if (formError) {
    formError.textContent = "";
  }
}

// ==========================================
// LOAD STUDENTS
// ==========================================

async function loadStudents() {
  const tbody = $("#studentTableBody");

  if (!tbody) return;

  const params = new URLSearchParams({
    search: $("#searchInput")?.value.trim() || "",
    course: $("#courseFilter")?.value || "",
    gender: $("#genderFilter")?.value || "",
    status: $("#statusFilter")?.value || ""
  });

  try {
    const students = await request(
      `${API}/students?${params.toString()}`
    );

    if (!Array.isArray(students)) {
      throw new Error("Invalid student data received.");
    }

    renderStudents(students);

  } catch (error) {
    console.error("Load students error:", error);

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table">
          ${escapeHTML(error.message)}
        </td>
      </tr>
    `;

    $("#tableSummary").textContent = "Unable to load students.";
    $("#recordCount").textContent = "0 RECORDS";
  }
}

// ==========================================
// RENDER STUDENT TABLE
// ==========================================

function renderStudents(students) {
  const tbody = $("#studentTableBody");

  if (!tbody) return;

  $("#recordCount").textContent =
    `${students.length} RECORD${students.length === 1 ? "" : "S"}`;

  $("#tableSummary").textContent =
    `Showing ${students.length} student${students.length === 1 ? "" : "s"}`;

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table">
          No students found. Add a student to get started.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = students.map(student => {
    const id = Number(student.id);

    const firstName = displayValue(student.first_name);
    const lastName = displayValue(student.last_name);
    const email = displayValue(student.email);
    const course = displayValue(student.course);
    const year = displayValue(student.year_level);
    const gender = displayValue(student.gender);
    const status = displayValue(student.status);

    const initials = (
      firstName.charAt(0) + lastName.charAt(0)
    ).toUpperCase();

    const statusClass =
      status.toLowerCase() === "active"
        ? "active"
        : "inactive";

    return `
      <tr>
        <td class="id-text">
          #${Number.isFinite(id) ? id : ""}
        </td>

        <td>
          <div class="student-cell">
            <div class="student-avatar">
              ${escapeHTML(initials)}
            </div>

            <div>
              <div class="student-name">
                ${escapeHTML(firstName)} ${escapeHTML(lastName)}
              </div>

              <div class="student-email">
                ${escapeHTML(email)}
              </div>
            </div>
          </div>
        </td>

        <td>${escapeHTML(course)}</td>

        <td>${escapeHTML(year)}</td>

        <td>
          <span class="gender-chip">
            ${escapeHTML(gender)}
          </span>
        </td>

        <td>
          <span class="status-chip ${statusClass}">
            ${escapeHTML(status)}
          </span>
        </td>

        <td>
          <div class="action-group">
            <button
              class="action-btn"
              type="button"
              data-action="edit"
              data-id="${id}">
              Edit
            </button>

            <button
              class="action-btn delete"
              type="button"
              data-action="delete"
              data-id="${id}">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

async function loadStats() {
  try {
    const stats = await request(`${API}/stats`);

    $("#totalStudents").textContent = stats.total ?? 0;
    $("#activeStudents").textContent = stats.active ?? 0;
    $("#inactiveStudents").textContent = stats.inactive ?? 0;
    $("#femaleStudents").textContent = stats.female ?? 0;
    $("#maleStudents").textContent = stats.male ?? 0;

    renderCourseAnalytics(stats.courses || []);

  } catch (error) {
    console.error("Statistics error:", error);
  }
}

// ==========================================
// COURSE AND GENDER ANALYTICS
// ==========================================

function renderCourseAnalytics(courses) {
  const container = $("#courseAnalytics");

  if (!container) return;

  if (!Array.isArray(courses) || courses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        No student data yet. Add students to see course analytics.
      </div>
    `;
    return;
  }

  container.innerHTML = courses.map(course => {
    const total = Number(course.total) || 0;
    const female = Number(course.female) || 0;
    const male = Number(course.male) || 0;
    const other = Number(course.undisclosed) || 0;

    const percentage = Number(course.percentage) || 0;

    const femalePercentage =
      total ? (female / total) * 100 : 0;

    const malePercentage =
      total ? (male / total) * 100 : 0;

    const otherPercentage =
      total ? (other / total) * 100 : 0;

    return `
      <div class="course-row">

        <div class="course-name">
          ${escapeHTML(displayValue(course.course))}

          <div class="course-meta">
            ${total} student${total === 1 ? "" : "s"} enrolled
          </div>
        </div>

        <div>
          <div class="population-track">
            <div
              class="population-fill"
              style="width:${Math.min(100, Math.max(0, percentage))}%">
            </div>
          </div>

          <div class="course-percent">
            ${percentage.toFixed(1)}% of total population
          </div>
        </div>

        <div class="course-gender">
          <div class="gender-track">
            <span
              class="gender-female"
              style="width:${femalePercentage}%">
            </span>

            <span
              class="gender-male"
              style="width:${malePercentage}%">
            </span>

            <span
              class="gender-other"
              style="width:${otherPercentage}%">
            </span>
          </div>

          <div class="gender-labels">
            <span>♀ <b>${female}</b> (${femalePercentage.toFixed(1)}%)</span>
            <span>♂ <b>${male}</b> (${malePercentage.toFixed(1)}%)</span>
            <span>Other <b>${other}</b> (${otherPercentage.toFixed(1)}%)</span>
          </div>
        </div>

      </div>
    `;
  }).join("");
}

// ==========================================
// REFRESH DASHBOARD
// ==========================================

async function refreshDashboard() {
  await Promise.all([
    loadStudents(),
    loadStats()
  ]);
}

// ==========================================
// ADD AND UPDATE STUDENT
// ==========================================

if (studentForm) {
  studentForm.addEventListener("submit", async event => {
    event.preventDefault();

    formError.textContent = "";

    const isEditing = editingId !== null;
    const currentId = editingId;

    const formData = Object.fromEntries(
      new FormData(studentForm).entries()
    );

    const url = isEditing
      ? `${API}/students/${currentId}`
      : `${API}/students`;

    const method = isEditing ? "PUT" : "POST";

    const saveButton = $("#saveStudentBtn");

    saveButton.disabled = true;

    saveButton.textContent = isEditing
      ? "Updating..."
      : "Saving...";

    try {
      await request(url, {
        method,
        body: JSON.stringify(formData)
      });

      closeModal();

      showToast(
        isEditing
          ? "Student updated successfully!"
          : "Student added successfully!"
      );

      await refreshDashboard();

    } catch (error) {
      console.error("Save student error:", error);
      formError.textContent = error.message;

    } finally {
      saveButton.disabled = false;

      saveButton.textContent = isEditing
        ? "Update Student"
        : "Save Student";
    }
  });
}

// ==========================================
// EDIT AND DELETE STUDENT
// ==========================================

const studentTableBody = $("#studentTableBody");

if (studentTableBody) {
  studentTableBody.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (!Number.isInteger(id) || id <= 0) return;

    try {
      if (action === "edit") {
        const students = await request(`${API}/students`);

        const student = students.find(
          item => Number(item.id) === id
        );

        if (student) {
          openModal(student);
        } else {
          showToast("Student record not found.");
        }

      } else if (action === "delete") {
        const confirmed = confirm(
          "Are you sure you want to delete this student? This action cannot be undone."
        );

        if (!confirmed) return;

        await request(`${API}/students/${id}`, {
          method: "DELETE"
        });

        showToast("Student deleted successfully!");

        await refreshDashboard();
      }

    } catch (error) {
      showToast(error.message);
      console.error(error);
    }
  });
}

// ==========================================
// MODAL EVENT LISTENERS
// ==========================================

$("#addStudentBtn")?.addEventListener("click", () => {
  openModal();
});

$("#closeModal")?.addEventListener("click", closeModal);

$("#cancelModal")?.addEventListener("click", closeModal);

modalBackdrop?.addEventListener("click", event => {
  if (event.target === modalBackdrop) {
    closeModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeModal();
  }
});

// ==========================================
// SEARCH AND FILTERS
// ==========================================

[
  "searchInput",
  "courseFilter",
  "genderFilter",
  "statusFilter"
].forEach(id => {
  const element = document.getElementById(id);

  if (!element) return;

  element.addEventListener(
    id === "searchInput" ? "input" : "change",
    loadStudents
  );
});

// ==========================================
// NAVIGATION ACTIVE STATE
// ==========================================

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(item => {
      item.classList.remove("active");
    });

    link.classList.add("active");
  });
});

// ==========================================
// INITIALIZE APPLICATION
// ==========================================

populateCourseOptions();
refreshDashboard();
