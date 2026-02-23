package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "application", uniqueConstraints = {
    @UniqueConstraint(columnNames = { "student_id", "job_id" })
})
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "application_id")
    private Integer applicationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    @Column(name = "applied_at")
    private Instant appliedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Interview> interviews = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (appliedAt == null) appliedAt = Instant.now();
    }

    public Integer getApplicationId() { return applicationId; }
    public void setApplicationId(Integer applicationId) { this.applicationId = applicationId; }
    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }
    public Job getJob() { return job; }
    public void setJob(Job job) { this.job = job; }
    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }
    public Instant getAppliedAt() { return appliedAt; }
    public void setAppliedAt(Instant appliedAt) { this.appliedAt = appliedAt; }
    public List<Interview> getInterviews() { return interviews; }
    public void setInterviews(List<Interview> interviews) { this.interviews = interviews; }
}
