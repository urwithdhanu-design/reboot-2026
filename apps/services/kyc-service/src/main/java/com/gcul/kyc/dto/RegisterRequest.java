package com.gcul.kyc.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

	@NotBlank
	@Size(min = 2, max = 120)
	@JsonProperty("full_name")
	private String fullName;

	@NotBlank
	@Email
	private String email;

	@NotBlank
	@Size(min = 8, max = 24)
	@JsonProperty("mobile_number")
	private String mobileNumber;

	@NotNull
	@JsonProperty("terms_accepted")
	private Boolean termsAccepted;

	@NotBlank
	@Size(min = 8, max = 128)
	private String password;

	public String getFullName() {
		return fullName;
	}

	public void setFullName(String fullName) {
		this.fullName = fullName;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getMobileNumber() {
		return mobileNumber;
	}

	public void setMobileNumber(String mobileNumber) {
		this.mobileNumber = mobileNumber;
	}

	public Boolean getTermsAccepted() {
		return termsAccepted;
	}

	public void setTermsAccepted(Boolean termsAccepted) {
		this.termsAccepted = termsAccepted;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}
}
