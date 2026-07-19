package com.gcul.policy.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a top-level policy type (TRAVEL or HEALTH).
 * Each type owns a collection of {@link PolicyCategoryEntity}.
 */
@Entity
@Table(name = "policy_type")
public class PolicyTypeEntity extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    /**
     * Stable code used in API paths and responses, e.g. TRAVEL, HEALTH.
     */
    @Column(nullable = false, unique = true, length = 32)
    public String code;

    @Column(length = 255)
    public String description;

    @OneToMany(mappedBy = "policyType", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    public List<PolicyCategoryEntity> categories = new ArrayList<>();

    public PolicyTypeEntity() {
    }

    public PolicyTypeEntity(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
