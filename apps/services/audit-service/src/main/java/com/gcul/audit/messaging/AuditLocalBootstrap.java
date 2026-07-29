package com.gcul.audit.messaging;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.gcul.audit.service.AuditRecordService;
import com.gcul.messaging.EventTopics;
import com.gcul.messaging.LocalEventBus;

@Component
public class AuditLocalBootstrap implements ApplicationRunner {

	private final AuditRecordService auditRecords;

	public AuditLocalBootstrap(AuditRecordService auditRecords) {
		this.auditRecords = auditRecords;
	}

	@Override
	public void run(ApplicationArguments args) {
		LocalEventBus.register(EventTopics.AUDIT, (eventType, payload) -> {
			auditRecords.record(eventType, payload);
			return true;
		});
	}
}
