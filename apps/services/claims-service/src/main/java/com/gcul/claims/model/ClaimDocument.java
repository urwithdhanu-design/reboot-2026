package com.gcul.claims.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "claim_documents")
public class ClaimDocument {

	@Id
	private String id;

	@Column(nullable = false)
	private String claimId;

	@Column(nullable = false)
	private String fileName;

	@Column(nullable = false)
	private String originalFileName;

	@Column(nullable = false)
	private String contentType;

	private long fileSize;

	private String label;

	private String queryId;

	@Column(nullable = false)
	private String storagePath;

	@Column(nullable = false)
	private Instant uploadedAt = Instant.now();

	public String getId() { return id; }
	public void setId(String id) { this.id = id; }
	public String getClaimId() { return claimId; }
	public void setClaimId(String claimId) { this.claimId = claimId; }
	public String getFileName() { return fileName; }
	public void setFileName(String fileName) { this.fileName = fileName; }
	public String getOriginalFileName() { return originalFileName; }
	public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
	public String getContentType() { return contentType; }
	public void setContentType(String contentType) { this.contentType = contentType; }
	public long getFileSize() { return fileSize; }
	public void setFileSize(long fileSize) { this.fileSize = fileSize; }
	public String getLabel() { return label; }
	public void setLabel(String label) { this.label = label; }
	public String getQueryId() { return queryId; }
	public void setQueryId(String queryId) { this.queryId = queryId; }
	public String getStoragePath() { return storagePath; }
	public void setStoragePath(String storagePath) { this.storagePath = storagePath; }
	public Instant getUploadedAt() { return uploadedAt; }
	public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }
}
