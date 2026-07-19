package com.gcul.policy.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "health_policy")
public class HealthPolicyEntity extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    public String name;
    public String description;

    @Column(name = "sum_insured")
    public long sumInsured;

    @Column(name = "monthly_premium")
    public int monthlyPremium;

    @ManyToOne
    @JoinColumn(name = "category_id")
    public PolicyCategoryEntity category;

    public HealthPolicyEntity() {}
}