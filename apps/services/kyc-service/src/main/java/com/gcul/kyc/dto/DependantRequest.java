package com.gcul.kyc.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class DependantRequest {

	@NotBlank
	@Size(max = 120)
	@JsonProperty("full_name")
	private String fullName;

	@NotBlank
	@Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}")
	@JsonProperty("date_of_birth")
	private String dateOfBirth;

	@NotBlank
	@Size(max = 32)
	private String relationship;

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
}
