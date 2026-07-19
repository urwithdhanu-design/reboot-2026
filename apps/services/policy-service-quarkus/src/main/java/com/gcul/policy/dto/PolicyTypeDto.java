package com.gcul.policy.dto;

import java.util.List;

public record PolicyTypeDto(
        String type,
        List<PolicyCategoryDto> categories
) {
}