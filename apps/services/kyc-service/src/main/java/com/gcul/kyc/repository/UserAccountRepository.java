package com.gcul.kyc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gcul.kyc.model.UserAccount;

public interface UserAccountRepository extends JpaRepository<UserAccount, String> {

	Optional<UserAccount> findByEmailIgnoreCase(String email);

	Optional<UserAccount> findByMobileNumber(String mobileNumber);

	long countByKycStatus(String kycStatus);

	List<UserAccount> findByKycStatusOrderByKycSubmittedAtDesc(String kycStatus);

	List<UserAccount> findByKycStatusInOrderByKycSubmittedAtDesc(List<String> statuses);

	@Query("""
			select u from UserAccount u
			where u.kycSubmittedAt is not null
			order by u.kycSubmittedAt desc
			""")
	List<UserAccount> findKycSubmissionHistory();

	@Query("""
			select u from UserAccount u
			where (:q is null or :q = ''
			  or lower(u.fullName) like lower(concat('%', :q, '%'))
			  or lower(u.email) like lower(concat('%', :q, '%'))
			  or u.mobileNumber like concat('%', :q, '%'))
			  and (:kyc is null or :kyc = '' or u.kycStatus = :kyc)
			order by u.createdAt desc
			""")
	List<UserAccount> searchAdmin(@Param("q") String q, @Param("kyc") String kyc);
}
