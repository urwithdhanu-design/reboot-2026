package com.gcul.blockchain.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gcul.ethereum")
public class EthereumProperties {

	private boolean enabled = false;

	private String rpcUrl = "";

	private long chainId = 11155111L;

	private String insurerPrivateKey = "";

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getRpcUrl() {
		return rpcUrl;
	}

	public void setRpcUrl(String rpcUrl) {
		this.rpcUrl = rpcUrl;
	}

	public long getChainId() {
		return chainId;
	}

	public void setChainId(long chainId) {
		this.chainId = chainId;
	}

	public String getInsurerPrivateKey() {
		return insurerPrivateKey;
	}

	public void setInsurerPrivateKey(String insurerPrivateKey) {
		this.insurerPrivateKey = insurerPrivateKey;
	}
}
