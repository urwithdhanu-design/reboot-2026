package com.gcul.audit.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.audit.model.AuditEventRecord;

public interface AuditEventRepository extends JpaRepository<AuditEventRecord, Long> {

	List<AuditEventRecord> findByFlowCategoryOrderByOccurredAtDesc(String flowCategory, Pageable pageable);

	List<AuditEventRecord> findByEventTypeOrderByOccurredAtDesc(String eventType, Pageable pageable);

	List<AuditEventRecord> findAllByOrderByOccurredAtDesc(Pageable pageable);
}
