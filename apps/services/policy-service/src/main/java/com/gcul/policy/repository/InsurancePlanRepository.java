package com.gcul.policy.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gcul.policy.model.InsurancePlan;

public interface InsurancePlanRepository extends JpaRepository<InsurancePlan, String> {

	List<InsurancePlan> findByCategoryIgnoreCaseOrderByTitleAsc(String category);

	@Query("""
			select p from InsurancePlan p
			where (:category is null or lower(p.category) = lower(:category))
			  and (
			    :q is null or :q = ''
			    or lower(p.title) like lower(concat('%', :q, '%'))
			    or lower(p.description) like lower(concat('%', :q, '%'))
			  )
			order by p.category, p.title
			""")
	List<InsurancePlan> search(@Param("category") String category, @Param("q") String q);
}
