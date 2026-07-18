package com.gcul.notification.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.notification.model.NotificationMessage;

public interface NotificationRepository extends JpaRepository<NotificationMessage, String> {
	List<NotificationMessage> findAllByOrderByCreatedAtDesc();
}
