package com.gcul.wallet.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.wallet.model.PlatformWallet;

public interface PlatformWalletRepository extends JpaRepository<PlatformWallet, String> {
}
