package com.gcul.parametric.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.parametric.model.ParametricTriggerLog;

public interface ParametricTriggerLogRepository extends JpaRepository<ParametricTriggerLog, String> {

	List<ParametricTriggerLog> findTop50ByOrderByTriggeredAtDesc();

	List<ParametricTriggerLog> findByPolicyRefOrderByTriggeredAtDesc(String policyRef);

	boolean existsByRuleIdAndTravelDateAndClaimCreatedTrue(String ruleId, String travelDate);

	List<ParametricTriggerLog> findByClaimId(String claimId);
}
