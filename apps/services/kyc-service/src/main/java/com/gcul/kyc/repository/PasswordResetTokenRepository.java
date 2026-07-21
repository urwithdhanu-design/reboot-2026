package com.gcul.kyc.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.kyc.model.PasswordResetToken;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {

	Optional<PasswordResetToken> findByTokenAndUsedFalse(String token);
}
