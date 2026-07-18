package com.gcul.kyc.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.kyc.model.UserAccount;

public interface UserAccountRepository extends JpaRepository<UserAccount, String> {

	Optional<UserAccount> findByEmailIgnoreCase(String email);

	Optional<UserAccount> findByMobileNumber(String mobileNumber);
}
