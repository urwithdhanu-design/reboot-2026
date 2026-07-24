package com.gcul.policy.web;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.policy.admin.AdminProductService;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

	private final AdminProductService products;

	public AdminProductController(AdminProductService products) {
		this.products = products;
	}

	@GetMapping
	public Map<String, Object> list() {
		return products.listProducts();
	}

	@PutMapping("/{productId}")
	public Map<String, Object> update(
			@PathVariable String productId,
			@RequestBody Map<String, Object> body) {
		return products.updateProduct(productId, body);
	}

	@PostMapping("/refresh-cache")
	public Map<String, Object> refreshCache() {
		return products.refreshCache();
	}
}
