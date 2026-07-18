package com.gcul.policy.vendor;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InsuranceVendorRepository extends JpaRepository<InsuranceVendor, String> {
	Optional<InsuranceVendor> findByCodeIgnoreCase(String code);

	List<InsuranceVendor> findByStatusIgnoreCaseOrderByCreatedAtDesc(String status);

	List<InsuranceVendor> findAllByOrderByCreatedAtDesc();
}
