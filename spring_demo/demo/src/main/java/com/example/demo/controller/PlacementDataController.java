package com.example.demo.controller;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * REST endpoints to view PLACEMENT data in the backend.
 * Open these URLs in browser or use Postman/curl.
 */
@RestController
@RequestMapping("/api")
public class PlacementDataController {

    private final StudentRepository studentRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final AdminRepository adminRepository;
    private final InterviewRepository interviewRepository;

    public PlacementDataController(StudentRepository studentRepository,
                                   CompanyRepository companyRepository,
                                   JobRepository jobRepository,
                                   ApplicationRepository applicationRepository,
                                   AdminRepository adminRepository,
                                   InterviewRepository interviewRepository) {
        this.studentRepository = studentRepository;
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.adminRepository = adminRepository;
        this.interviewRepository = interviewRepository;
    }

    /** GET /api — list of data endpoints (avoids 404 when visiting /api) */
    @GetMapping
    public ResponseEntity<Map<String, Object>> apiInfo() {
        return ResponseEntity.ok(Map.of(
                "message", "PLACEMENT API — use the endpoints below to view data",
                "endpoints", List.of(
                        "/api/students",
                        "/api/companies",
                        "/api/jobs",
                        "/api/applications",
                        "/api/admins",
                        "/api/interviews"
                ),
                "dbVerify", "/api/db/verify"
        ));
    }

    @Transactional(readOnly = true)
    @GetMapping("/students")
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(studentRepository.findAll());
    }

    @Transactional(readOnly = true)
    @GetMapping("/students/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Integer id) {
        return studentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Transactional(readOnly = true)
    @GetMapping("/companies")
    public ResponseEntity<List<Company>> getAllCompanies() {
        return ResponseEntity.ok(companyRepository.findAll());
    }

    @Transactional(readOnly = true)
    @GetMapping("/companies/{id}")
    public ResponseEntity<Company> getCompanyById(@PathVariable Integer id) {
        return companyRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Transactional(readOnly = true)
    @GetMapping("/jobs")
    public ResponseEntity<List<Job>> getAllJobs() {
        return ResponseEntity.ok(jobRepository.findAll());
    }

    @Transactional(readOnly = true)
    @GetMapping("/jobs/{id}")
    public ResponseEntity<Job> getJobById(@PathVariable Integer id) {
        return jobRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Transactional(readOnly = true)
    @GetMapping("/applications")
    public ResponseEntity<List<Application>> getAllApplications() {
        return ResponseEntity.ok(applicationRepository.findAll());
    }

    @Transactional(readOnly = true)
    @GetMapping("/applications/{id}")
    public ResponseEntity<Application> getApplicationById(@PathVariable Integer id) {
        return applicationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Transactional(readOnly = true)
    @GetMapping("/admins")
    public ResponseEntity<List<Admin>> getAllAdmins() {
        return ResponseEntity.ok(adminRepository.findAll());
    }

    @Transactional(readOnly = true)
    @GetMapping("/admins/{id}")
    public ResponseEntity<Admin> getAdminById(@PathVariable Integer id) {
        return adminRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Transactional(readOnly = true)
    @GetMapping("/interviews")
    public ResponseEntity<List<Interview>> getAllInterviews() {
        return ResponseEntity.ok(interviewRepository.findAll());
    }

    @Transactional(readOnly = true)
    @GetMapping("/interviews/{id}")
    public ResponseEntity<Interview> getInterviewById(@PathVariable Integer id) {
        return interviewRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
