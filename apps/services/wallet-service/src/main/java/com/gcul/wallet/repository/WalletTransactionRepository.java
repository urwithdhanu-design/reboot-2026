package com.gcul.wallet.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.wallet.model.WalletTransaction;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, String> {

	List<WalletTransaction> findTop20ByUserIdOrderByCreatedAtDesc(String userId);

	List<WalletTransaction> findTop100ByOrderByCreatedAtDesc();

	Optional<WalletTransaction> findByReferenceAndType(String reference, String type);
}
