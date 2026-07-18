package com.gcul.notification.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.notification.model.NotificationMessage;
import com.gcul.notification.repository.NotificationRepository;

@Service
public class NotificationService {

	private final NotificationRepository repo;

	public NotificationService(NotificationRepository repo) {
		this.repo = repo;
	}

	public Map<String, Object> send(Map<String, Object> body) {
		String recipient = str(body.get("recipient"));
		String template = firstNonBlank(str(body.get("template")), "generic");
		String subject = firstNonBlank(str(body.get("subject")), "Reboot 2026 Insurance update");
		String message = firstNonBlank(str(body.get("body")), str(body.get("message")));
		if (recipient.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "recipient is required");
		}
		if (message.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body is required");
		}

		NotificationMessage row = new NotificationMessage();
		row.setId("NTF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
		row.setChannel(firstNonBlank(str(body.get("channel")), "email"));
		row.setRecipient(recipient);
		row.setTemplate(template);
		row.setSubject(subject);
		row.setBody(message);
		// Demo mode: mark sent immediately (SMTP can be wired later)
		row.setStatus("sent");
		row.setCreatedAt(Instant.now());
		return toMap(repo.save(row));
	}

	public List<Map<String, Object>> list() {
		return repo.findAllByOrderByCreatedAtDesc().stream().map(this::toMap).toList();
	}

	public Map<String, Object> get(String id) {
		return toMap(repo.findById(id).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found")));
	}

	private Map<String, Object> toMap(NotificationMessage n) {
		Map<String, Object> map = new LinkedHashMap<>();
		map.put("id", n.getId());
		map.put("channel", n.getChannel());
		map.put("recipient", n.getRecipient());
		map.put("template", n.getTemplate());
		map.put("subject", n.getSubject());
		map.put("body", n.getBody());
		map.put("status", n.getStatus());
		map.put("created_at", n.getCreatedAt().toString());
		return map;
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) return value;
		}
		return "";
	}
}
