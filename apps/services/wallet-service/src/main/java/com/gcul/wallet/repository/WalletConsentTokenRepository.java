package com.gcul.wallet.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.wallet.model.WalletConsentToken;

public interface WalletConsentTokenRepository extends JpaRepository<WalletConsentToken, String> {

	Optional<WalletConsentToken> findByTokenHashAndUsedAtIsNull(String tokenHash);

	List<WalletConsentToken> findByUserIdAndUsedAtIsNull(String userId);
}
