package com.gcul.blockchain.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "gcul.canton")
public class CantonProperties {

	private boolean enabled = false;
	private String jsonApiUrl = "http://127.0.0.1:7575";
	private String insurerPartyHint = "GCUL_Insurer";
	private String defaultCustomerPartyHint = "GCUL_Customer";
	private String packageId = "";
	private String authorityContractId = "";
	private String network = "Canton Local Sandbox";
	private String ledgerId = "sandbox";
	private long ledgerOffset = 0L;

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getJsonApiUrl() {
		return jsonApiUrl;
	}

	public void setJsonApiUrl(String jsonApiUrl) {
		this.jsonApiUrl = jsonApiUrl;
	}

	public String getInsurerPartyHint() {
		return insurerPartyHint;
	}

	public void setInsurerPartyHint(String insurerPartyHint) {
		this.insurerPartyHint = insurerPartyHint;
	}

	public String getDefaultCustomerPartyHint() {
		return defaultCustomerPartyHint;
	}

	public void setDefaultCustomerPartyHint(String defaultCustomerPartyHint) {
		this.defaultCustomerPartyHint = defaultCustomerPartyHint;
	}

	public String getPackageId() {
		return packageId;
	}

	public void setPackageId(String packageId) {
		this.packageId = packageId;
	}

	public String getAuthorityContractId() {
		return authorityContractId;
	}

	public void setAuthorityContractId(String authorityContractId) {
		this.authorityContractId = authorityContractId;
	}

	public String getNetwork() {
		return network;
	}

	public void setNetwork(String network) {
		this.network = network;
	}

	public String getLedgerId() {
		return ledgerId;
	}

	public void setLedgerId(String ledgerId) {
		this.ledgerId = ledgerId;
	}

	public long getLedgerOffset() {
		return ledgerOffset;
	}

	public void setLedgerOffset(long ledgerOffset) {
		this.ledgerOffset = ledgerOffset;
	}

	public String templateId(String module, String template) {
		if (packageId == null || packageId.isBlank()) {
			return module + ":" + template;
		}
		return packageId + ":" + module + ":" + template;
	}
}
