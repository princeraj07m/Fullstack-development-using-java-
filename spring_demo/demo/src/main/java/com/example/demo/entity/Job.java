package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "job")
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "job_id")
    private Integer jobId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "role", length = 100)
    private String role;

    @Column(name = "package_lpa", precision = 5, scale = 2)
    private BigDecimal packageLpa;

    @Column(name = "min_cgpa", precision = 3, scale = 2)
    private BigDecimal minCgpa;

    @Column(name = "eligible_branch", length = 100)
    private String eligibleBranch;

    @Column(name = "last_date")
    private LocalDate lastDate;

    @JsonIgnore
    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Application> applications = new ArrayList<>();

    public Integer getJobId() { return jobId; }
    public void setJobId(Integer jobId) { this.jobId = jobId; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public BigDecimal getPackageLpa() { return packageLpa; }
    public void setPackageLpa(BigDecimal packageLpa) { this.packageLpa = packageLpa; }
    public BigDecimal getMinCgpa() { return minCgpa; }
    public void setMinCgpa(BigDecimal minCgpa) { this.minCgpa = minCgpa; }
    public String getEligibleBranch() { return eligibleBranch; }
    public void setEligibleBranch(String eligibleBranch) { this.eligibleBranch = eligibleBranch; }
    public LocalDate getLastDate() { return lastDate; }
    public void setLastDate(LocalDate lastDate) { this.lastDate = lastDate; }
    public List<Application> getApplications() { return applications; }
    public void setApplications(List<Application> applications) { this.applications = applications; }
}
