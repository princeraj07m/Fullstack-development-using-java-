package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class EmployeeController {
	@Autowired
	private EmployeeRepository repo;
	@GetMapping("/")
	public String home() {
		return "home";
	}
	@GetMapping("/employee")
	public String getEmployee(@RequestParam("id")int id,Model model) {
		Employee emp=repo.findById(id);
		if(emp==null) {
			model.addAttribute("error,employee not found"+id);
			return "employee";
		}
		model.addAttribute("emp",emp);
		return "employee";
		
		
	}
	

}
