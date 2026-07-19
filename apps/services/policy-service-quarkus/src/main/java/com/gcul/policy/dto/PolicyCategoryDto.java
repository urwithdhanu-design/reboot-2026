package com.gcul.policy.dto;

import java.util.List;

public record PolicyCategoryDto(
        Long id,
        String name,
        List<HealthPolicyDto> policies,
        List<String> addons
) {
}