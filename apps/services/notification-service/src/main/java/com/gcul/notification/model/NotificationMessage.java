package com.gcul.notification.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "notifications")
public class NotificationMessage {

	@Id
	private String id;

	@Column(nullable = false)
	private String channel = "email";

	@Column(nullable = false)
	private String recipient;

	@Column(nullable = false)
	private String template;

	@Column(nullable = false)
	private String subject;

	@Lob
	@Column(nullable = false)
	private String body;

	@Column(nullable = false)
	private String status = "queued";

	@Column(nullable = false)
	private Instant createdAt = Instant.now();

	public String getId() { return id; }
	public void setId(String id) { this.id = id; }
	public String getChannel() { return channel; }
	public void setChannel(String channel) { this.channel = channel; }
	public String getRecipient() { return recipient; }
	public void setRecipient(String recipient) { this.recipient = recipient; }
	public String getTemplate() { return template; }
	public void setTemplate(String template) { this.template = template; }
	public String getSubject() { return subject; }
	public void setSubject(String subject) { this.subject = subject; }
	public String getBody() { return body; }
	public void setBody(String body) { this.body = body; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
