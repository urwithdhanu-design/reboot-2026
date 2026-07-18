package com.gcul.parametric.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.parametric.model.ParametricRule;

public interface ParametricRuleRepository extends JpaRepository<ParametricRule, String> {
	List<ParametricRule> findByActiveTrueOrderByCreatedAtDesc();
	List<ParametricRule> findAllByOrderByCreatedAtDesc();
}
