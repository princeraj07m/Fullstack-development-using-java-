package com.example.demo.repository;

import com.example.demo.entity.Application;
import com.example.demo.entity.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Integer> {

    List<Application> findByStudentStudentId(Integer studentId);

    List<Application> findByJobJobId(Integer jobId);

    List<Application> findByStatus(ApplicationStatus status);

    Optional<Application> findByStudentStudentIdAndJobJobId(Integer studentId, Integer jobId);
}
