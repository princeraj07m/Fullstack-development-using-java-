package com.example.demo.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.entity.Student;
import com.example.demo.repository.StudentRepository;

@Service
public class StudentService {
	 @Autowired
	    StudentRepository repository;

	    
	    public Student saveStudent(Student student) {
	        return repository.save(student);
	    }

	   
	    public List<Student> getAllStudents() {
	        return repository.findAll();
	    }

	    
	    public List<Student> getStudentsByDepartment(String department) {
	        return repository.findByDepartment(department);
	    }

	    
	    public List<Student> getStudentsByAge(int age) {
	        return repository.findByAge(age);
	    }
	    

}
