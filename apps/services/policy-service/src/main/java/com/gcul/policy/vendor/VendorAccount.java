package com.gcul.policy.vendor;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "vendor_accounts")
public class VendorAccount {

	@Id
	@Column(length = 64)
	private String id;

	@Column(name = "vendor_id", nullable = false, length = 64)
	private String vendorId;

	@Column(nullable = false, unique = true, length = 180)
	private String email;

	@Column(name = "password_hash", nullable = false, length = 120)
	private String passwordHash;

	@Column(name = "full_name", length = 120)
	private String fullName;

	@Column(nullable = false, length = 40)
	private String role = "vendor_admin";

	@Column(name = "last_login_at")
	private String lastLoginAt;

	@Column(name = "created_at", nullable = false)
	private String createdAt = Instant.now().toString();

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getVendorId() {
		return vendorId;
	}

	public void setVendorId(String vendorId) {
		this.vendorId = vendorId;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public String getFullName() {
		return fullName;
	}

	public void setFullName(String fullName) {
		this.fullName = fullName;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public String getLastLoginAt() {
		return lastLoginAt;
	}

	public void setLastLoginAt(String lastLoginAt) {
		this.lastLoginAt = lastLoginAt;
	}

	public String getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(String createdAt) {
		this.createdAt = createdAt;
	}
}
