package com.example.demo.repository;

import com.example.demo.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Integer> {

    List<Job> findByCompanyCompanyId(Integer companyId);
}
