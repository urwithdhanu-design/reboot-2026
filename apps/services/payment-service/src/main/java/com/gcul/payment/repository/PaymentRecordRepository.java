package com.gcul.payment.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.payment.model.PaymentRecord;

public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, String> {
	List<PaymentRecord> findByQuoteIdOrderByCreatedAtDesc(String quoteId);
	List<PaymentRecord> findAllByOrderByCreatedAtDesc();
}
