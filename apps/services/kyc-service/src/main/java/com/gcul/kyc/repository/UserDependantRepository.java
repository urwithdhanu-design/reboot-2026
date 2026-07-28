package com.gcul.kyc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.kyc.model.UserDependant;

public interface UserDependantRepository extends JpaRepository<UserDependant, String> {

	List<UserDependant> findByUserIdOrderByCreatedAtAsc(String userId);

	Optional<UserDependant> findByIdAndUserId(String id, String userId);
}
