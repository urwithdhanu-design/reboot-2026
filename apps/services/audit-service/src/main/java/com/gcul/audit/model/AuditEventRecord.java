package com.gcul.audit.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(
		name = "audit_events",
		indexes = {
				@Index(name = "idx_audit_event_type", columnList = "eventType"),
				@Index(name = "idx_audit_flow", columnList = "flowCategory"),
				@Index(name = "idx_audit_timestamp", columnList = "occurredAt"),
				@Index(name = "idx_audit_customer", columnList = "customerId"),
				@Index(name = "idx_audit_policy", columnList = "policyId"),
		})
public class AuditEventRecord {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 64)
	private String eventId;

	@Column(nullable = false, length = 64)
	private String eventType;

	@Column(length = 64)
	private String sourceEventType;

	@Column(length = 64)
	private String sourcePublisher;

	@Column(length = 32)
	private String sourceTopic;

	@Column(nullable = false, length = 32)
	private String flowCategory;

	@Column(length = 64)
	private String customerId;

	@Column(length = 64)
	private String policyId;

	@Column(length = 64)
	private String claimId;

	@Column(length = 64)
	private String quoteId;

	@Column(nullable = false)
	private Instant occurredAt;

	@Column(nullable = false, length = 8000)
	private String payloadJson;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getEventId() {
		return eventId;
	}

	public void setEventId(String eventId) {
		this.eventId = eventId;
	}

	public String getEventType() {
		return eventType;
	}

	public void setEventType(String eventType) {
		this.eventType = eventType;
	}

	public String getSourceEventType() {
		return sourceEventType;
	}

	public void setSourceEventType(String sourceEventType) {
		this.sourceEventType = sourceEventType;
	}

	public String getSourcePublisher() {
		return sourcePublisher;
	}

	public void setSourcePublisher(String sourcePublisher) {
		this.sourcePublisher = sourcePublisher;
	}

	public String getSourceTopic() {
		return sourceTopic;
	}

	public void setSourceTopic(String sourceTopic) {
		this.sourceTopic = sourceTopic;
	}

	public String getFlowCategory() {
		return flowCategory;
	}

	public void setFlowCategory(String flowCategory) {
		this.flowCategory = flowCategory;
	}

	public String getCustomerId() {
		return customerId;
	}

	public void setCustomerId(String customerId) {
		this.customerId = customerId;
	}

	public String getPolicyId() {
		return policyId;
	}

	public void setPolicyId(String policyId) {
		this.policyId = policyId;
	}

	public String getClaimId() {
		return claimId;
	}

	public void setClaimId(String claimId) {
		this.claimId = claimId;
	}

	public String getQuoteId() {
		return quoteId;
	}

	public void setQuoteId(String quoteId) {
		this.quoteId = quoteId;
	}

	public Instant getOccurredAt() {
		return occurredAt;
	}

	public void setOccurredAt(Instant occurredAt) {
		this.occurredAt = occurredAt;
	}

	public String getPayloadJson() {
		return payloadJson;
	}

	public void setPayloadJson(String payloadJson) {
		this.payloadJson = payloadJson;
	}
}
