package com.gcul.premiumdeposit.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.premiumdeposit.model.PremiumDeposit;

public interface PremiumDepositRepository extends JpaRepository<PremiumDeposit, String> {
	List<PremiumDeposit> findAllByOrderByCreatedAtDesc();
}
