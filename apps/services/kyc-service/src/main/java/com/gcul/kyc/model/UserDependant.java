package com.gcul.kyc.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_dependants")
public class UserDependant {

	@Id
	@Column(length = 36)
	private String id;

	@Column(name = "user_id", nullable = false, length = 36)
	private String userId;

	@Column(name = "full_name", nullable = false, length = 120)
	private String fullName;

	@Column(name = "date_of_birth", nullable = false, length = 10)
	private String dateOfBirth;

	@Column(nullable = false, length = 32)
	private String relationship;

	@Column(name = "created_at", nullable = false, length = 40)
	private String createdAt;

	@Column(name = "updated_at", length = 40)
	private String updatedAt;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getFullName() {
		return fullName;
	}

	public void setFullName(String fullName) {
		this.fullName = fullName;
	}

	public String getDateOfBirth() {
		return dateOfBirth;
	}

	public void setDateOfBirth(String dateOfBirth) {
		this.dateOfBirth = dateOfBirth;
	}

	public String getRelationship() {
		return relationship;
	}

	public void setRelationship(String relationship) {
		this.relationship = relationship;
	}

	public String getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(String createdAt) {
		this.createdAt = createdAt;
	}

	public String getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(String updatedAt) {
		this.updatedAt = updatedAt;
	}
}
