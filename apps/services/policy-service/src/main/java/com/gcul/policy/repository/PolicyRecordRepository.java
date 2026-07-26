package com.gcul.policy.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.policy.model.PolicyRecord;

public interface PolicyRecordRepository extends JpaRepository<PolicyRecord, String> {

	Optional<PolicyRecord> findByQuoteId(String quoteId);

	List<PolicyRecord> findByCustomerIdOrderByIssuedAtDesc(String customerId);

	List<PolicyRecord> findByCustomerEmailOrderByIssuedAtDesc(String customerEmail);

	List<PolicyRecord> findByMintStatusOrderByIssuedAtAsc(String mintStatus);

	List<PolicyRecord> findByMintStatusInOrderByIssuedAtAsc(Collection<String> mintStatuses);

	List<PolicyRecord> findByMintStatusOrderByIssuedAtDesc(String mintStatus);

	List<PolicyRecord> findAllByOrderByIssuedAtDesc();

	long countByMintStatus(String mintStatus);
}
