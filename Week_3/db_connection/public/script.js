// ===== Load Dashboard =====
async function loadDashboard() {
    const students = await fetch("/students").then(r => r.json());
    const companies = await fetch("/companies").then(r => r.json());
    const jobs = await fetch("/jobs").then(r => r.json());

    document.getElementById("totalStudents").textContent = students.length;
    document.getElementById("totalCompanies").textContent = companies.length;
    document.getElementById("totalJobs").textContent = jobs.length;

    loadTable("studentTable", students);
    loadTable("companyTable", companies);
    loadTable("jobTable", jobs);
}

function loadTable(id, data) {
    const table = document.getElementById(id);
    if (!data.length) return;

    table.innerHTML = "";

    const header = Object.keys(data[0]);
    table.innerHTML += "<tr>" + header.map(h => `<th>${h}</th>`).join("") + "</tr>";

    data.forEach(row => {
        table.innerHTML += "<tr>" +
            header.map(h => `<td>${row[h]}</td>`).join("") +
            "</tr>";
    });
}

loadDashboard();


// ===== Student Form =====
document.getElementById("studentForm").addEventListener("submit", async e => {
    e.preventDefault();

    const cgpa = parseFloat(document.getElementById("cgpa").value);

    if (cgpa < 0 || cgpa > 10) {
        alert("CGPA must be between 0 and 10");
        return;
    }

    await fetch("/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            roll_no: roll_no.value,
            name: student_name.value,
            email: student_email.value,
            phone: null,
            branch: "CSE",
            cgpa: cgpa,
            graduation_year: 2026,
            password_hash: "default"
        })
    });

    loadDashboard();
});


// ===== Company Form =====
document.getElementById("companyForm").addEventListener("submit", async e => {
    e.preventDefault();

    await fetch("/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: company_name.value,
            email: company_email.value,
            location: location.value,
            website: website.value
        })
    });

    loadDashboard();
});


// ===== Job Form =====
document.getElementById("jobForm").addEventListener("submit", async e => {
    e.preventDefault();

    const minCgpa = parseFloat(min_cgpa.value);
    if (minCgpa < 0 || minCgpa > 10) {
        alert("Min CGPA must be 0-10");
        return;
    }

    await fetch("/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            company_id: company_id.value,
            role: role.value,
            package_lpa: package.value,
            min_cgpa: minCgpa,
            eligible_branch: "CSE",
            last_date: "2026-12-31"
        })
    });

    loadDashboard();
});
