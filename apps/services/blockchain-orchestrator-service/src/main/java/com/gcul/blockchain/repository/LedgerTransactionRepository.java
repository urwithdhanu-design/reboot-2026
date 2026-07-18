package com.gcul.blockchain.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.blockchain.model.LedgerTransaction;

public interface LedgerTransactionRepository extends JpaRepository<LedgerTransaction, String> {
	List<LedgerTransaction> findAllByOrderByCreatedAtDesc();
}
