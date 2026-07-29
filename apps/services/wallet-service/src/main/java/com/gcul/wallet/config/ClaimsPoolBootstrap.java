package com.gcul.wallet.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.gcul.wallet.service.ClaimsPoolService;

@Component
@Order(1)
public class ClaimsPoolBootstrap implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(ClaimsPoolBootstrap.class);

	private final ClaimsPoolService claimsPool;

	public ClaimsPoolBootstrap(ClaimsPoolService claimsPool) {
		this.claimsPool = claimsPool;
	}

	@Override
	public void run(ApplicationArguments args) {
		var pool = claimsPool.ensureClaimsPool();
		log.info("Claims pool ready — £{} available for settlements", pool.getBalanceGbp());
	}
}
