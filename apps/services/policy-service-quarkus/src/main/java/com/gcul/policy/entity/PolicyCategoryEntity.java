package com.gcul.policy.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "policy_category")
public class PolicyCategoryEntity extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, length = 128)
    public String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "policy_type_id", nullable = false)
    public PolicyTypeEntity policyType;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "policy_category_addons", joinColumns = @JoinColumn(name = "policy_category_id"))
    @Column(name = "addon", nullable = false, length = 128)
    public List<String> addons = new ArrayList<>();

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    public List<HealthPolicyEntity> policies = new ArrayList<>();

    public PolicyCategoryEntity() {}
}