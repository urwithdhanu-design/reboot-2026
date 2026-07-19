package com.gcul.policy.dto;

public record HealthPolicyDto(
        String name,
        String description,
        long sumInsured,
        int monthlyPremium
) {
}