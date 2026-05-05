package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.entity.Student;

public interface StudentRepository extends JpaRepository<Student,Integer> {
	List<Student>findByDepartment(String department);
	List<Student>findByAge(int age);

}
