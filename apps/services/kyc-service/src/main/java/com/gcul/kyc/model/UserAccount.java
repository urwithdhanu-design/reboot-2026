package com.gcul.kyc.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class UserAccount {

	@Id
	@Column(length = 36)
	private String id;

	@Column(name = "full_name", nullable = false, length = 120)
	private String fullName;

	@Column(nullable = false, unique = true, length = 120)
	private String email;

	@Column(name = "mobile_number", nullable = false, length = 24)
	private String mobileNumber;

	@Column(name = "password_hash", nullable = false, length = 200)
	private String passwordHash;

	@Column(name = "terms_accepted", nullable = false)
	private boolean termsAccepted;

	@Column(name = "created_at", nullable = false, length = 40)
	private String createdAt;

	@Column(name = "kyc_status", length = 32)
	private String kycStatus = "not_started";

	@Column(name = "kyc_document_type", length = 40)
	private String kycDocumentType;

	@Column(name = "kyc_progress_json", length = 1000)
	private String kycProgressJson;

	@Column(name = "kyc_submitted_at", length = 40)
	private String kycSubmittedAt;

	@Column(name = "wallet_address", length = 64)
	private String walletAddress;

	@Column(name = "wallet_status", length = 32)
	private String walletStatus;

	@Column(name = "wallet_provider", length = 64)
	private String walletProvider;

	@Column(name = "wallet_mode", length = 32)
	private String walletMode;

	@Column(name = "wallet_note", length = 255)
	private String walletNote;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

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

	public String getPasswordHash() {
		return passwordHash;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public boolean isTermsAccepted() {
		return termsAccepted;
	}

	public void setTermsAccepted(boolean termsAccepted) {
		this.termsAccepted = termsAccepted;
	}

	public String getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(String createdAt) {
		this.createdAt = createdAt;
	}

	public String getKycStatus() {
		return kycStatus;
	}

	public void setKycStatus(String kycStatus) {
		this.kycStatus = kycStatus;
	}

	public String getKycDocumentType() {
		return kycDocumentType;
	}

	public void setKycDocumentType(String kycDocumentType) {
		this.kycDocumentType = kycDocumentType;
	}

	public String getKycProgressJson() {
		return kycProgressJson;
	}

	public void setKycProgressJson(String kycProgressJson) {
		this.kycProgressJson = kycProgressJson;
	}

	public String getKycSubmittedAt() {
		return kycSubmittedAt;
	}

	public void setKycSubmittedAt(String kycSubmittedAt) {
		this.kycSubmittedAt = kycSubmittedAt;
	}

	public String getWalletAddress() {
		return walletAddress;
	}

	public void setWalletAddress(String walletAddress) {
		this.walletAddress = walletAddress;
	}

	public String getWalletStatus() {
		return walletStatus;
	}

	public void setWalletStatus(String walletStatus) {
		this.walletStatus = walletStatus;
	}

	public String getWalletProvider() {
		return walletProvider;
	}

	public void setWalletProvider(String walletProvider) {
		this.walletProvider = walletProvider;
	}

	public String getWalletMode() {
		return walletMode;
	}

	public void setWalletMode(String walletMode) {
		this.walletMode = walletMode;
	}

	public String getWalletNote() {
		return walletNote;
	}

	public void setWalletNote(String walletNote) {
		this.walletNote = walletNote;
	}

	public boolean hasConnectedWallet() {
		return "connected".equals(walletStatus) && walletAddress != null;
	}
}
