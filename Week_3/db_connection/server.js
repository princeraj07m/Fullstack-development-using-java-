const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "@Prince2427",   // change
    database: "PLACEMENT"
});

db.connect(err => {
    if (err) console.log("DB Error:", err);
    else console.log("Connected to PLACEMENT DB");
});


// =========================
// 🔹 STUDENT
// =========================

// GET all students
app.get("/students", (req, res) => {
    db.query("SELECT * FROM student", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// INSERT student
app.post("/students", (req, res) => {
    const { roll_no, name, email, phone, branch, cgpa, graduation_year, password_hash } = req.body;

    const sql = `
        INSERT INTO student 
        (roll_no, name, email, phone, branch, cgpa, graduation_year, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [roll_no, name, email, phone, branch, cgpa, graduation_year, password_hash],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Student inserted" });
        });
});


// =========================
// 🔹 COMPANY
// =========================

app.get("/companies", (req, res) => {
    db.query("SELECT * FROM company", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.post("/companies", (req, res) => {
    const { name, email, location, website } = req.body;

    db.query(
        "INSERT INTO company (name, email, location, website) VALUES (?, ?, ?, ?)",
        [name, email, location, website],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Company inserted" });
        }
    );
});


// =========================
// 🔹 JOB
// =========================

app.get("/jobs", (req, res) => {
    db.query("SELECT * FROM job", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.post("/jobs", (req, res) => {
    const { company_id, role, package_lpa, min_cgpa, eligible_branch, last_date } = req.body;

    const sql = `
        INSERT INTO job
        (company_id, role, package_lpa, min_cgpa, eligible_branch, last_date)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql,
        [company_id, role, package_lpa, min_cgpa, eligible_branch, last_date],
        (err, result) => {
            if (err) {
                console.log("JOB INSERT ERROR:", err);
                return res.status(500).json({ error: err.sqlMessage });
            }
            res.json({ message: "Job inserted" });
        }
    );
});



// =========================
// 🔹 APPLICATION
// =========================

app.get("/applications", (req, res) => {
    db.query("SELECT * FROM application", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.post("/applications", (req, res) => {
    const { student_id, job_id, status } = req.body;

    db.query(
        "INSERT INTO application (student_id, job_id, status) VALUES (?, ?, ?)",
        [student_id, job_id, status],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.sqlMessage });
            res.json({ message: "Application inserted" });
        }
    );
});


// =========================
// 🔹 ADMIN
// =========================

app.get("/admins", (req, res) => {
    db.query("SELECT * FROM admin", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.post("/admins", (req, res) => {
    const { name, email, password_hash } = req.body;

    db.query(
        "INSERT INTO admin (name, email, password_hash) VALUES (?, ?, ?)",
        [name, email, password_hash],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Admin inserted" });
        }
    );
});


// =========================
// 🔹 INTERVIEW
// =========================

app.get("/interviews", (req, res) => {
    db.query("SELECT * FROM interview", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.post("/interviews", (req, res) => {
    const { application_id, round_no, interview_date, mode, result } = req.body;

    const sql = `
        INSERT INTO interview
        (application_id, round_no, interview_date, mode, result)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql,
        [application_id, round_no, interview_date, mode, result],
        (err, resultDB) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Interview inserted" });
        });
});


// ================= DASHBOARD =================

// Total Students
app.get("/dashboard/total-students", (req, res) => {
    db.query("SELECT COUNT(*) AS total FROM student", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]);
    });
});

// Total Companies
app.get("/dashboard/total-companies", (req, res) => {
    db.query("SELECT COUNT(*) AS total FROM company", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]);
    });
});

// Total Jobs
app.get("/dashboard/total-jobs", (req, res) => {
    db.query("SELECT COUNT(*) AS total FROM job", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]);
    });
});

// Status-wise Applications
app.get("/dashboard/application-status", (req, res) => {
    db.query(
        "SELECT status, COUNT(*) AS count FROM application GROUP BY status",
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        }
    );
});

// Highest Package
app.get("/dashboard/highest-package", (req, res) => {
    db.query("SELECT MAX(package_lpa) AS highest FROM job",
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result[0]);
        });
});






// =========================

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
