package com.gcul.policy.vendor;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorAccountRepository extends JpaRepository<VendorAccount, String> {
	Optional<VendorAccount> findByEmailIgnoreCase(String email);

	Optional<VendorAccount> findByVendorId(String vendorId);
}
