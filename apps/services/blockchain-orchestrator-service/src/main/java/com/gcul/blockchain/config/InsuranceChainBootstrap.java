package com.gcul.blockchain.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.gcul.blockchain.chain.ChainLedger;
import com.gcul.blockchain.chain.ChainTransactionType;
import com.gcul.blockchain.chain.InsuranceChainService;

@Component
@Order(1)
public class InsuranceChainBootstrap implements ApplicationRunner {

	private final InsuranceChainService chain;

	public InsuranceChainBootstrap(InsuranceChainService chain) {
		this.chain = chain;
	}

	@Override
	public void run(ApplicationArguments args) {
		chain.ensureGenesis();
		if (chain.listTransactions().isEmpty()) {
			chain.recordTransaction(new InsuranceChainService.RecordTxRequest(
					ChainTransactionType.AUDIT_RECORD,
					ChainLedger.AUDIT,
					java.util.Map.of("message", "GCUL Insurance Chain genesis audit"),
					"system",
					"platform_admin",
					null,
					null));
		}
	}
}
