package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "interview")
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "interview_id")
    private Integer interviewId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "round_no")
    private Integer roundNo;

    @Column(name = "interview_date")
    private LocalDate interviewDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", length = 20)
    private InterviewMode mode;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", length = 20)
    private InterviewResult result = InterviewResult.PENDING;

    public Integer getInterviewId() { return interviewId; }
    public void setInterviewId(Integer interviewId) { this.interviewId = interviewId; }
    public Application getApplication() { return application; }
    public void setApplication(Application application) { this.application = application; }
    public Integer getRoundNo() { return roundNo; }
    public void setRoundNo(Integer roundNo) { this.roundNo = roundNo; }
    public LocalDate getInterviewDate() { return interviewDate; }
    public void setInterviewDate(LocalDate interviewDate) { this.interviewDate = interviewDate; }
    public InterviewMode getMode() { return mode; }
    public void setMode(InterviewMode mode) { this.mode = mode; }
    public InterviewResult getResult() { return result; }
    public void setResult(InterviewResult result) { this.result = result; }
}
