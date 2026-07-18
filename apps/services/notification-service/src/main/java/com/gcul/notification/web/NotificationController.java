package com.gcul.notification.web;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gcul.notification.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

	private final NotificationService notifications;

	public NotificationController(NotificationService notifications) {
		this.notifications = notifications;
	}

	@GetMapping
	public Map<String, Object> list() {
		List<Map<String, Object>> items = notifications.list();
		return Map.of("notifications", items, "count", items.size());
	}

	@PostMapping("/send")
	public Map<String, Object> send(@RequestBody Map<String, Object> body) {
		return notifications.send(body);
	}

	@GetMapping("/{id}")
	public Map<String, Object> get(@PathVariable String id) {
		return notifications.get(id);
	}
}
