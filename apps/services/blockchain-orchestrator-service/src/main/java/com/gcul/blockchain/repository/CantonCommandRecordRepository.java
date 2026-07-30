package com.gcul.blockchain.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.blockchain.model.CantonCommandRecord;

public interface CantonCommandRecordRepository extends JpaRepository<CantonCommandRecord, String> {

	Optional<CantonCommandRecord> findByPolicyIdAndCommandType(String policyId, String commandType);
}
