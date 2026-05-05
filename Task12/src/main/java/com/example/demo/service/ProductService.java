package com.example.demo.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.model.Product;
import com.example.demo.repository.ProductRepository;

@Service
public class ProductService {
	 @Autowired
	    private ProductRepository repo;

	    public List<Product> getAllProducts() {
	        return repo.findAll();
	    }

	    public Product getProductById(Long id) {
	        return repo.findById(id).orElse(null);
	    }

	    public Product saveProduct(Product product) {
	        return repo.save(product);
	    }

	    public Product updateProduct(Long id, Product newProduct) {
	        Product p = repo.findById(id).orElse(null);
	        if (p != null) {
	            p.setName(newProduct.getName());
	            p.setPrice(newProduct.getPrice());
	            return repo.save(p);
	        }
	        return null;
	    }

	    public void deleteProduct(Long id) {
	        repo.deleteById(id);
	    }

}
