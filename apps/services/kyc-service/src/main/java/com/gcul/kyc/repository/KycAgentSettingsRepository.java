package com.gcul.kyc.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.kyc.model.KycAgentSettings;

public interface KycAgentSettingsRepository extends JpaRepository<KycAgentSettings, String> {
}
