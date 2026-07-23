package com.gcul.blockchain.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

@Configuration
@EnableConfigurationProperties(EthereumProperties.class)
public class EthereumConfig {

	private static final Logger log = LoggerFactory.getLogger(EthereumConfig.class);

	@Bean
	@ConditionalOnProperty(name = "gcul.ethereum.enabled", havingValue = "true")
	Web3j web3j(EthereumProperties props) {
		if (!StringUtils.hasText(props.getRpcUrl())) {
			throw new IllegalStateException("gcul.ethereum.enabled=true requires gcul.ethereum.rpc-url (Alchemy HTTPS URL)");
		}
		log.info("Ethereum web3j client enabled (chainId={})", props.getChainId());
		return Web3j.build(new HttpService(props.getRpcUrl()));
	}
}
