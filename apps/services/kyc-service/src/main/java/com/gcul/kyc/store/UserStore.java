package com.gcul.kyc.store;

import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gcul.kyc.model.UserAccount;
import com.gcul.kyc.repository.UserAccountRepository;

@Service
public class UserStore {

	private final UserAccountRepository repository;

	public UserStore(UserAccountRepository repository) {
		this.repository = repository;
	}

	@Transactional
	public UserAccount save(UserAccount user) {
		return repository.save(user);
	}

	@Transactional(readOnly = true)
	public Optional<UserAccount> findById(String id) {
		return repository.findById(id);
	}

	@Transactional(readOnly = true)
	public Optional<UserAccount> findByEmail(String email) {
		return repository.findByEmailIgnoreCase(email);
	}

	@Transactional(readOnly = true)
	public Optional<UserAccount> findByMobile(String mobile) {
		String normalized = mobile.replace(" ", "");
		return repository.findAll().stream()
				.filter(u -> u.getMobileNumber().replace(" ", "").equals(normalized))
				.findFirst();
	}
}
