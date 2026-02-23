package com.example.demo.repository;

import com.example.demo.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Integer> {

    List<Interview> findByApplicationApplicationId(Integer applicationId);
}
