package com.gcul.kyc.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class KycSubmitRequest {

	@NotBlank
	@Pattern(regexp = "passport|driving_licence|national_id")
	@JsonProperty("document_type")
	private String documentType;

	@JsonProperty("document_uploaded")
	private boolean documentUploaded = true;

	@JsonProperty("selfie_captured")
	private boolean selfieCaptured = true;

	public String getDocumentType() {
		return documentType;
	}

	public void setDocumentType(String documentType) {
		this.documentType = documentType;
	}

	public boolean isDocumentUploaded() {
		return documentUploaded;
	}

	public void setDocumentUploaded(boolean documentUploaded) {
		this.documentUploaded = documentUploaded;
	}

	public boolean isSelfieCaptured() {
		return selfieCaptured;
	}

	public void setSelfieCaptured(boolean selfieCaptured) {
		this.selfieCaptured = selfieCaptured;
	}
}
