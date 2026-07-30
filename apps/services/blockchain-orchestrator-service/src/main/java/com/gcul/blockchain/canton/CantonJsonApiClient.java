package com.gcul.blockchain.canton;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gcul.blockchain.config.CantonProperties;

@Component
public class CantonJsonApiClient {

	private static final Logger log = LoggerFactory.getLogger(CantonJsonApiClient.class);

	private final CantonProperties props;
	private final RestClient restClient;
	private final ObjectMapper objectMapper;

	public CantonJsonApiClient(CantonProperties props, ObjectMapper objectMapper) {
		this.props = props;
		this.objectMapper = objectMapper;
		this.restClient = RestClient.builder()
				.baseUrl(trimTrailingSlash(props.getJsonApiUrl()))
				.build();
	}

	private String ledgerId() {
		return StringUtils.hasText(props.getLedgerId()) ? props.getLedgerId().trim() : "sandbox";
	}

	public boolean isReachable() {
		try {
			restClient.get()
					.uri("/v1/parties")
					.header("Authorization", "Bearer " + CantonJwtFactory.adminToken(objectMapper, ledgerId()))
					.retrieve()
					.toBodilessEntity();
			return true;
		}
		catch (Exception ex) {
			log.debug("Canton JSON API not reachable: {}", ex.getMessage());
			return false;
		}
	}

	public String resolveInsurerParty() {
		return findPartyByHint(props.getInsurerPartyHint())
				.orElseThrow(() -> new ResponseStatusException(
						org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
						"Insurer party not found on Canton ledger: " + props.getInsurerPartyHint()));
	}

	public String resolveCustomerParty(String customerId) {
		String hint = customerPartyHint(customerId);
		Optional<String> existing = findPartyByHint(hint);
		if (existing.isPresent()) {
			return existing.get();
		}
		return allocateParty(hint);
	}

	public String findAuthorityContractId(String insurerParty) {
		if (StringUtils.hasText(props.getAuthorityContractId())) {
			return props.getAuthorityContractId().trim();
		}
		String templateId = resolveTemplateId("Gcul.InsurancePolicy", "InsurerMintAuthority");
		List<Map<String, Object>> contracts = queryContracts(templateId, Map.of("insurer", insurerParty), insurerParty);
		if (contracts.isEmpty()) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
					"InsurerMintAuthority contract not found on Canton ledger");
		}
		Object contractId = contracts.get(0).get("contractId");
		if (contractId == null) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
					"InsurerMintAuthority contract missing contractId");
		}
		return String.valueOf(contractId);
	}

	public CantonMintResult mintPolicy(CantonMintCommand command) {
		String insurerParty = resolveInsurerParty();
		String customerParty = resolveCustomerParty(command.customerId());
		String authorityContractId = findAuthorityContractId(insurerParty);
		String authorityTemplateId = resolveTemplateId("Gcul.InsurancePolicy", "InsurerMintAuthority");
		String policyTemplateId = resolveTemplateId("Gcul.InsurancePolicy", "InsurancePolicy");

		Map<String, Object> argument = new LinkedHashMap<>();
		argument.put("customer", customerParty);
		argument.put("policyId", command.policyId());
		argument.put("policyNumber", command.policyNumber());
		argument.put("policyReferenceHash", command.policyReferenceHash());
		argument.put("customerId", command.customerId());
		argument.put("walletAddress", command.walletAddress());
		argument.put("metadataUri", command.metadataUri());

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("templateId", authorityTemplateId);
		body.put("contractId", authorityContractId);
		body.put("choice", "MintPolicy");
		body.put("argument", argument);
		body.put("commandId", "gcul-mint-" + command.policyId().replaceAll("[^A-Za-z0-9_-]", "-"));

		JsonNode response = postJson(
				"/v1/exercise",
				body,
				CantonJwtFactory.submitToken(objectMapper, ledgerId(), List.of(insurerParty)));
		JsonNode result = response.path("result");
		String contractId = extractCreatedContractId(result).orElseGet(() -> textOrEmpty(result.path("contractId")));
		String updateId = textOrEmpty(result.path("updateId"));
		if (updateId.isBlank()) {
			updateId = textOrEmpty(result.path("transactionId"));
		}
		long offset = result.path("offset").asLong(props.getLedgerOffset());
		if (contractId.isBlank()) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_GATEWAY,
					"Canton MintPolicy exercise did not return InsurancePolicy contractId");
		}

		log.info("Canton policy minted via MintPolicy exercise policyId={} contractId={} updateId={} offset={}",
				command.policyId(), contractId, updateId, offset);

		return new CantonMintResult(
				contractId,
				updateId.isBlank() ? "canton-update-" + offset : updateId,
				offset,
				insurerParty,
				customerParty,
				policyTemplateId,
				props.getNetwork());
	}

	public JsonNode getPackages() {
		return getJson("/v1/packages");
	}

	public Optional<String> verifyPolicyContract(String policyReferenceHash) {
		if (!StringUtils.hasText(policyReferenceHash)) {
			return Optional.empty();
		}
		String insurerParty = resolveInsurerParty();
		return queryPolicyContractId(insurerParty, policyReferenceHash.trim());
	}

	public Map<String, Object> verifyPolicy(String policyId, String policyReferenceHash) {
		String insurerParty = resolveInsurerParty();
		Optional<String> contractId = queryPolicyContractId(insurerParty, policyReferenceHash);
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("policyId", policyId);
		result.put("policyReferenceHash", policyReferenceHash);
		result.put("verified", contractId.isPresent());
		result.put("ledger", "canton");
		result.put("ledgerId", "canton");
		result.put("ledgerMode", com.gcul.blockchain.ledger.LedgerMode.CANTON.id());
		result.put("network", props.getNetwork());
		result.put("packageId", props.getPackageId());
		result.put("package_id", props.getPackageId());
		contractId.ifPresent(id -> result.put("contractId", id));
		contractId.ifPresent(id -> result.put("templateId", resolveTemplateId("Gcul.InsurancePolicy", "InsurancePolicy")));
		return result;
	}

	public CantonClaimSettlementResult settleClaim(CantonClaimSettlementCommand command) {
		String insurerParty = resolveInsurerParty();
		String customerParty = resolveCustomerParty(command.customerId());
		String templateId = resolveTemplateId("Gcul.InsurancePolicy", "ClaimSettlement");

		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("insurer", insurerParty);
		payload.put("customer", customerParty);
		payload.put("claimId", command.claimId());
		payload.put("policyId", command.policyId());
		payload.put("customerId", command.customerId());
		payload.put("walletAddress", command.walletAddress());
		payload.put("amountGbp", DamlTypeEncoder.decimal(command.amountGbp()));
		payload.put("settlementSource", command.settlementSource());
		payload.put("settledAt", DamlTypeEncoder.time(java.time.Instant.now()));

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("templateId", templateId);
		body.put("payload", payload);
		body.put("commandId", "gcul-claim-settlement-" + command.claimId().replaceAll("[^A-Za-z0-9_-]", "-"));

		JsonNode response = postJson("/v1/create", body,
				CantonJwtFactory.submitToken(objectMapper, ledgerId(), List.of(insurerParty)));
		JsonNode result = response.path("result");
		String contractId = textOrEmpty(result.path("contractId"));
		String updateId = textOrEmpty(result.path("updateId"));
		long offset = result.path("offset").asLong(props.getLedgerOffset());
		if (contractId.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Canton claim settlement did not return contractId");
		}
		return new CantonClaimSettlementResult(contractId,
				updateId.isBlank() ? "canton-claim-update-" + offset : updateId,
				offset, templateId, props.getNetwork());
	}

	private Optional<String> queryPolicyContractId(String insurerParty, String policyReferenceHash) {
		String templateId = resolveTemplateId("Gcul.InsurancePolicy", "InsurancePolicy");
		List<Map<String, Object>> contracts = queryContracts(templateId, Map.of(
				"insurer", insurerParty,
				"policyReferenceHash", policyReferenceHash), insurerParty);
		if (contracts.isEmpty()) {
			return Optional.empty();
		}
		Object contractId = contracts.get(0).get("contractId");
		return contractId == null ? Optional.empty() : Optional.of(String.valueOf(contractId));
	}

	@SuppressWarnings("unchecked")
	private List<Map<String, Object>> queryContracts(String templateId, Map<String, Object> query, String readAsParty) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("templateIds", List.of(templateId));
		body.put("query", query);
		String token = CantonJwtFactory.actAsToken(objectMapper, ledgerId(), List.of(readAsParty));
		JsonNode response = postJson("/v1/query", body, token);
		JsonNode result = response.path("result");
		if (!result.isArray()) {
			return List.of();
		}
		List<Map<String, Object>> contracts = new ArrayList<>();
		for (JsonNode node : result) {
			contracts.add(objectMapper.convertValue(node, Map.class));
		}
		return contracts;
	}

	private Optional<String> findPartyByHint(String hint) {
		JsonNode response = getJson("/v1/parties");
		JsonNode result = response.path("result");
		if (!result.isArray()) {
			return Optional.empty();
		}
		for (JsonNode party : result) {
			String identifier = textOrEmpty(party.path("identifier"));
			if (identifier.contains(hint)) {
				return Optional.of(identifier);
			}
		}
		return Optional.empty();
	}

	private String allocateParty(String hint) {
		Map<String, Object> body = Map.of("identifierHint", hint);
		JsonNode response = postJson("/v1/parties/allocate", body);
		String identifier = textOrEmpty(response.path("result").path("identifier"));
		if (!StringUtils.hasText(identifier)) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_GATEWAY,
					"Failed to allocate Canton party: " + hint);
		}
		log.info("Allocated Canton party {} for hint {}", identifier, hint);
		return identifier;
	}

	private Optional<String> extractCreatedContractId(JsonNode exerciseResult) {
		JsonNode events = exerciseResult.path("events");
		if (!events.isArray()) {
			return Optional.empty();
		}
		for (JsonNode event : events) {
			JsonNode created = event.path("created");
			if (!created.isMissingNode()) {
				String contractId = textOrEmpty(created.path("contractId"));
				String templateId = textOrEmpty(created.path("templateId"));
				if (contractId.isBlank()) {
					continue;
				}
				if (templateId.contains("InsurancePolicy") && !templateId.contains("InsurerMintAuthority")) {
					return Optional.of(contractId);
				}
			}
		}
		return Optional.empty();
	}

	private JsonNode getJson(String path) {
		return getJson(path, CantonJwtFactory.adminToken(objectMapper, ledgerId()));
	}

	private JsonNode getJson(String path, String token) {
		try {
			String raw = restClient.get()
					.uri(path)
					.header("Authorization", "Bearer " + token)
					.accept(MediaType.APPLICATION_JSON)
					.retrieve()
					.onStatus(HttpStatusCode::isError, (req, res) -> {
						throw new ResponseStatusException(
								org.springframework.http.HttpStatus.BAD_GATEWAY,
								"Canton JSON API GET " + path + " failed: " + res.getStatusCode());
					})
					.body(String.class);
			return objectMapper.readTree(raw == null ? "{}" : raw);
		}
		catch (ResponseStatusException ex) {
			throw ex;
		}
		catch (Exception ex) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_GATEWAY,
					"Canton JSON API GET failed: " + ex.getMessage(), ex);
		}
	}

	private JsonNode postJson(String path, Map<String, Object> body) {
		return postJson(path, body, CantonJwtFactory.adminToken(objectMapper, ledgerId()));
	}

	private JsonNode postJson(String path, Map<String, Object> body, String token) {
		try {
			var spec = restClient.post()
					.uri(path)
					.contentType(MediaType.APPLICATION_JSON)
					.header("Authorization", "Bearer " + token)
					.accept(MediaType.APPLICATION_JSON)
					.body(body);
			String raw = spec.retrieve()
					.onStatus(HttpStatusCode::isError, (req, res) -> {
						String errorBody = "";
						try {
							errorBody = new String(res.getBody().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
						}
						catch (Exception ignored) {
							// ignore
						}
						throw new ResponseStatusException(
								org.springframework.http.HttpStatus.BAD_GATEWAY,
								"Canton JSON API POST " + path + " failed: " + res.getStatusCode()
										+ (errorBody.isBlank() ? "" : " — " + errorBody));
					})
					.body(String.class);
			return objectMapper.readTree(raw == null ? "{}" : raw);
		}
		catch (ResponseStatusException ex) {
			throw ex;
		}
		catch (Exception ex) {
			throw new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_GATEWAY,
					"Canton JSON API POST failed: " + ex.getMessage(), ex);
		}
	}

	private String resolveTemplateId(String module, String template) {
		if (StringUtils.hasText(props.getPackageId())) {
			return props.getPackageId().trim() + ":" + module + ":" + template;
		}
		return module + ":" + template;
	}

	private static String customerPartyHint(String customerId) {
		String sanitized = customerId.toLowerCase()
				.replaceAll("[^a-z0-9]+", "_")
				.replaceAll("^_+|_+$", "");
		if (sanitized.isBlank()) {
			sanitized = "anonymous";
		}
		if (sanitized.length() > 40) {
			sanitized = sanitized.substring(0, 40);
		}
		return "GCUL_Customer_" + sanitized;
	}

	private static String textOrEmpty(JsonNode node) {
		return node == null || node.isMissingNode() || node.isNull() ? "" : node.asText("");
	}

	private static String trimTrailingSlash(String url) {
		if (url == null) {
			return "";
		}
		return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
	}

	public record CantonMintCommand(
			String policyId,
			String policyNumber,
			String policyReferenceHash,
			String customerId,
			String walletAddress,
			String metadataUri) {
	}

	public record CantonMintResult(
			String contractId,
			String updateId,
			long offset,
			String insurerParty,
			String customerParty,
			String templateId,
		String network) {
	}

	public record CantonClaimSettlementCommand(
			String claimId,
			String policyId,
			String customerId,
			String walletAddress,
			double amountGbp,
			String settlementSource) {
	}

	public record CantonClaimSettlementResult(
			String contractId,
			String updateId,
			long offset,
			String templateId,
			String network) {
	}
}
