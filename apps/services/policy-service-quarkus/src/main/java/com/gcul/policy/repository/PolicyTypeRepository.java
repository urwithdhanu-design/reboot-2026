package com.gcul.policy.repository;

import com.gcul.policy.entity.PolicyTypeEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

/**
 * Data access for {@link PolicyTypeEntity}.
 */
@ApplicationScoped
public class PolicyTypeRepository implements PanacheRepository<PolicyTypeEntity> {

    /**
     * Finds all policy types ordered by id, with categories eagerly loaded.
     */
    public List<PolicyTypeEntity> findAllOrdered() {
        return list("ORDER BY id ASC");
    }

    /**
     * Finds a policy type by its stable code (e.g. TRAVEL, HEALTH). Case-insensitive.
     */
    public Optional<PolicyTypeEntity> findByCodeIgnoreCase(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        return find("LOWER(code) = LOWER(?1)", code.trim()).firstResultOptional();
    }
}
