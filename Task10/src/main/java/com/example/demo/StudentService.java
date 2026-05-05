package com.example.demo;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
@Service
public class StudentService {
	 @Autowired
	    StudentRepo repo;

	    public Student saveStudent(Student s) {
	        return repo.save(s);
	    }

	    public List<Student> getAllStudents() {
	        return repo.findAll();
	    }

	    public Student getStudentById(int id) {
	        return repo.findById(id).orElse(null);
	    }
	    public Student updateStudent(Student student) {
	        return repo.save(student);
	    }

	    public void deleteStudent(int id) {
	        repo.deleteById(id);
	    }

}
