package com.gcul.wallet.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.wallet.model.CustomerWallet;

public interface CustomerWalletRepository extends JpaRepository<CustomerWallet, String> {

	Optional<CustomerWallet> findByUserId(String userId);
}
