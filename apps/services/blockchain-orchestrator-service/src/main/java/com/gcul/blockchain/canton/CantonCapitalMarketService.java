package com.gcul.blockchain.canton;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.gcul.blockchain.config.CantonProperties;

/**
 * Phase D capital market Daml kit — template catalog and demo script reference.
 */
@Service
public class CantonCapitalMarketService {

	private final CantonProperties cantonProperties;

	public CantonCapitalMarketService(CantonProperties cantonProperties) {
		this.cantonProperties = cantonProperties;
	}

	public Map<String, Object> status() {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("phase", "D");
		body.put("kit", "gcul-capital-market-daml");
		body.put("demoScript", "Gcul.CapitalMarketDemo:demo");
		body.put("initScript", "Gcul.Setup:initialize");
		body.put("templates", List.of(
				templateModule("Gcul.Common.DvP", "DvPProposal", "DvPSettlement"),
				templateModule("Gcul.Common.Eligibility", "InvestorEligibility", "InvestorEligibilityGate"),
				templateModule("Gcul.Common.OracleAttestation", "OracleCommitteeAuthority", "OracleAttestation"),
				templateModule(
						"Gcul.CapitalMarket.InsuranceLinkedNote",
						"InsuranceLinkedNote")));
		body.put("packageId", cantonProperties.getPackageId());
		body.put("network", cantonProperties.getNetwork());
		return body;
	}

	private Map<String, Object> templateModule(String module, String... templates) {
		Map<String, Object> row = new LinkedHashMap<>();
		row.put("module", module);
		row.put("templates", List.of(templates));
		return row;
	}
}
