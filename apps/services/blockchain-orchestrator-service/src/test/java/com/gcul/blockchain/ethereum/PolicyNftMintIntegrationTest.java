package com.gcul.blockchain.ethereum;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.client.RestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
		"gcul.h2.url=jdbc:h2:mem:policy-nft-test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
		"gcul.ethereum.enabled=false"
})
class PolicyNftMintIntegrationTest {

	@LocalServerPort
	private int port;

	@Autowired
	private PolicyNftMintService mintService;

	@Test
	void mintsSimulatedPolicyNftEndToEnd() {
		assertThat(mintService.status().get("mode")).isEqualTo("simulated");

		RestClient client = RestClient.create("http://127.0.0.1:" + port);
		@SuppressWarnings("unchecked")
		Map<String, Object> result = client.post()
				.uri("/api/blockchain/internal/policy-nft/mint")
				.contentType(MediaType.APPLICATION_JSON)
				.body(Map.of(
						"policyId", "POL-TEST-001",
						"policyNumber", "POL-TEST-001",
						"customerId", "test@example.com",
						"walletAddress", "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"))
				.retrieve()
				.body(Map.class);

		assertThat(result).isNotNull();
		assertThat(result.get("tokenId")).isNotNull();
		assertThat(result.get("transactionHash")).asString().startsWith("0x");
		assertThat(result.get("walletAddress"))
				.isEqualTo("0x70997970c51812dc3a010c7d01b50e0d17dc79c8");
		assertThat(result.get("mode")).isEqualTo("simulated");

		@SuppressWarnings("unchecked")
		Map<String, Object> record = client.get()
				.uri("/api/blockchain/internal/policy-nft/POL-TEST-001")
				.retrieve()
				.body(Map.class);
		assertThat(record.get("policyId")).isEqualTo("POL-TEST-001");
	}
}
