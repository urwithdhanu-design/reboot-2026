package com.gcul.policy.service;

import com.gcul.policy.dto.PolicyTypeDto;
import com.gcul.policy.entity.PolicyTypeEntity;
import com.gcul.policy.exception.PolicyNotFoundException;
import com.gcul.policy.mapper.PolicyMapper;
import com.gcul.policy.repository.PolicyTypeRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import org.jboss.logging.Logger;

/**
 * Business logic for the policy catalog.
 * Retrieves policy types, categories and health add-ons from the database.
 */
@ApplicationScoped
public class PolicyCatalogService {

    private static final Logger LOG = Logger.getLogger(PolicyCatalogService.class);

    private final PolicyTypeRepository policyTypeRepository;
    private final PolicyMapper policyMapper;

    @Inject
    public PolicyCatalogService(PolicyTypeRepository policyTypeRepository, PolicyMapper policyMapper) {
        this.policyTypeRepository = policyTypeRepository;
        this.policyMapper = policyMapper;
    }

    /**
     * Returns the complete policy catalog (all types with categories and add-ons).
     *
     * @return list of policy type DTOs; never null
     */
    public List<PolicyTypeDto> getAllPolicies() {
        LOG.debug("Fetching complete policy catalog");
        List<PolicyTypeEntity> entities = policyTypeRepository.findAllOrdered();
        List<PolicyTypeDto> result = policyMapper.toDtoList(entities);
        LOG.info("Returned " + result.size() + " policy type(s)");
        return result;
    }

    /**
     * Returns a single policy type by its code.
     *
     * @param typeCode TRAVEL or HEALTH (case-insensitive)
     * @return the matching DTO
     * @throws PolicyNotFoundException if the type does not exist
     */
    public PolicyTypeDto getPolicyByType(String typeCode) {
        LOG.debugf("Looking up policy type: %s", typeCode);
        PolicyTypeEntity entity = policyTypeRepository.findByCodeIgnoreCase(typeCode)
                .orElseThrow(() -> {
                    LOG.warnf("Policy type not found: %s", typeCode);
                    return new PolicyNotFoundException("Policy type not found: " + typeCode);
                });
        return policyMapper.toDto(entity);
    }
}
