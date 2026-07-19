package com.gcul.policy.mapper;

import com.gcul.policy.dto.HealthPolicyDto;
import com.gcul.policy.dto.PolicyCategoryDto;
import com.gcul.policy.dto.PolicyTypeDto;
import com.gcul.policy.entity.HealthPolicyEntity;
import com.gcul.policy.entity.PolicyCategoryEntity;
import com.gcul.policy.entity.PolicyTypeEntity;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class PolicyMapper {

    public List<PolicyTypeDto> toDtoList(List<PolicyTypeEntity> entities) {
        if (entities == null || entities.isEmpty()) {
            return Collections.emptyList();
        }
        return entities.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public PolicyTypeDto toDto(PolicyTypeEntity entity) {
        if (entity == null) {
            return null;
        }
        List<PolicyCategoryDto> categories = entity.categories == null
                ? Collections.emptyList()
                : entity.categories.stream()
                .map(this::toCategoryDto)
                .collect(Collectors.toList());
        return new PolicyTypeDto(entity.code, categories);
    }

    private PolicyCategoryDto toCategoryDto(PolicyCategoryEntity entity) {
        List<HealthPolicyDto> policies = entity.policies == null
                ? Collections.emptyList()
                : entity.policies.stream()
                .map(p -> new HealthPolicyDto(p.name, p.description, p.sumInsured, p.monthlyPremium))
                .collect(Collectors.toList());

        List<String> addons = entity.addons == null || entity.addons.isEmpty()
                ? Collections.emptyList()   // changed to empty list instead of null
                : List.copyOf(entity.addons);

        return new PolicyCategoryDto(entity.id, entity.name, policies, addons);
    }
}