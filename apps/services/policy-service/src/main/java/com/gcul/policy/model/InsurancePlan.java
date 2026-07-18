package com.gcul.policy.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "insurance_plans")
public class InsurancePlan {

	@Id
	@Column(length = 64)
	private String id;

	@Column(nullable = false, length = 120)
	private String title;

	@Column(nullable = false, length = 500)
	private String description;

	@Column(length = 500)
	private String tagline;

	@Lob
	@Column(name = "bullets_json")
	private String bulletsJson;

	@Column(name = "cta_label", length = 120)
	private String ctaLabel;

	@Column(nullable = false, length = 40)
	private String category;

	@Column(name = "price_from", nullable = false)
	private double priceFrom;

	@Column(name = "price_unit", nullable = false, length = 20)
	private String priceUnit;

	@Column(nullable = false, length = 8)
	private String currency;

	@Column(nullable = false)
	private double rating;

	@Column(name = "review_count", nullable = false)
	private int reviewCount;

	@Column(name = "best_seller", nullable = false)
	private boolean bestSeller;

	@Column(nullable = false, length = 32)
	private String icon;

	public InsurancePlan() {
	}

	public InsurancePlan(
			String id,
			String title,
			String description,
			String tagline,
			String bulletsJson,
			String ctaLabel,
			String category,
			double priceFrom,
			String priceUnit,
			String currency,
			double rating,
			int reviewCount,
			boolean bestSeller,
			String icon) {
		this.id = id;
		this.title = title;
		this.description = description;
		this.tagline = tagline;
		this.bulletsJson = bulletsJson;
		this.ctaLabel = ctaLabel;
		this.category = category;
		this.priceFrom = priceFrom;
		this.priceUnit = priceUnit;
		this.currency = currency;
		this.rating = rating;
		this.reviewCount = reviewCount;
		this.bestSeller = bestSeller;
		this.icon = icon;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getTagline() {
		return tagline;
	}

	public void setTagline(String tagline) {
		this.tagline = tagline;
	}

	public String getBulletsJson() {
		return bulletsJson;
	}

	public void setBulletsJson(String bulletsJson) {
		this.bulletsJson = bulletsJson;
	}

	public String getCtaLabel() {
		return ctaLabel;
	}

	public void setCtaLabel(String ctaLabel) {
		this.ctaLabel = ctaLabel;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public double getPriceFrom() {
		return priceFrom;
	}

	public void setPriceFrom(double priceFrom) {
		this.priceFrom = priceFrom;
	}

	public String getPriceUnit() {
		return priceUnit;
	}

	public void setPriceUnit(String priceUnit) {
		this.priceUnit = priceUnit;
	}

	public String getCurrency() {
		return currency;
	}

	public void setCurrency(String currency) {
		this.currency = currency;
	}

	public double getRating() {
		return rating;
	}

	public void setRating(double rating) {
		this.rating = rating;
	}

	public int getReviewCount() {
		return reviewCount;
	}

	public void setReviewCount(int reviewCount) {
		this.reviewCount = reviewCount;
	}

	public boolean isBestSeller() {
		return bestSeller;
	}

	public void setBestSeller(boolean bestSeller) {
		this.bestSeller = bestSeller;
	}

	public String getIcon() {
		return icon;
	}

	public void setIcon(String icon) {
		this.icon = icon;
	}
}
