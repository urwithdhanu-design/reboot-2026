package com.gcul.policy.vendor;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "insurance_vendors")
public class InsuranceVendor {

	@Id
	@Column(length = 64)
	private String id;

	@Column(nullable = false, length = 160)
	private String name;

	@Column(nullable = false, unique = true, length = 64)
	private String code;

	@Column(nullable = false, length = 120)
	private String categories;

	@Column(name = "contact_email", nullable = false, length = 180)
	private String contactEmail;

	@Column(name = "contact_name", length = 120)
	private String contactName;

	@Column(nullable = false, length = 32)
	private String status = "draft";

	@Column(length = 500)
	private String description;

	@Column(name = "website_url", length = 300)
	private String websiteUrl;

	@Column(name = "ui_deploy_url", length = 300)
	private String uiDeployUrl;

	@Column(name = "ui_version", length = 40)
	private String uiVersion;

	@Lob
	@Column(name = "services_config_json")
	private String servicesConfigJson;

	@Column(name = "published_at")
	private String publishedAt;

	@Column(name = "created_at", nullable = false)
	private String createdAt = Instant.now().toString();

	@Column(name = "updated_at", nullable = false)
	private String updatedAt = Instant.now().toString();

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getCategories() {
		return categories;
	}

	public void setCategories(String categories) {
		this.categories = categories;
	}

	public String getContactEmail() {
		return contactEmail;
	}

	public void setContactEmail(String contactEmail) {
		this.contactEmail = contactEmail;
	}

	public String getContactName() {
		return contactName;
	}

	public void setContactName(String contactName) {
		this.contactName = contactName;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getWebsiteUrl() {
		return websiteUrl;
	}

	public void setWebsiteUrl(String websiteUrl) {
		this.websiteUrl = websiteUrl;
	}

	public String getUiDeployUrl() {
		return uiDeployUrl;
	}

	public void setUiDeployUrl(String uiDeployUrl) {
		this.uiDeployUrl = uiDeployUrl;
	}

	public String getUiVersion() {
		return uiVersion;
	}

	public void setUiVersion(String uiVersion) {
		this.uiVersion = uiVersion;
	}

	public String getServicesConfigJson() {
		return servicesConfigJson;
	}

	public void setServicesConfigJson(String servicesConfigJson) {
		this.servicesConfigJson = servicesConfigJson;
	}

	public String getPublishedAt() {
		return publishedAt;
	}

	public void setPublishedAt(String publishedAt) {
		this.publishedAt = publishedAt;
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
