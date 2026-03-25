package com.example.studentcrud.repository;

import com.example.studentcrud.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {
    
    // Task 5.4: Custom query method to retrieve records based on department condition
    List<Student> findByDepartment(String department);
    
}