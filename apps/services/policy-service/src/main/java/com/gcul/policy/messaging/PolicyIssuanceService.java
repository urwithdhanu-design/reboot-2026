package com.gcul.policy.messaging;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventPublisher;
import com.gcul.policy.client.BlockchainMintClient;
import com.gcul.policy.client.BlockchainMintClient.PolicyRecordView;
import com.gcul.policy.client.KycInternalClient;
import com.gcul.policy.client.WalletLookupClient;
import com.gcul.policy.client.WalletLookupClient.WalletLookup;
import com.gcul.policy.model.PolicyRecord;
import com.gcul.policy.policy.PolicyRecordService;
import com.gcul.policy.policy.PolicyReferenceHasher;
import com.gcul.policy.quote.QuoteService;

@Service
public class PolicyIssuanceService {

	private static final Logger log = LoggerFactory.getLogger(PolicyIssuanceService.class);

	private final QuoteService quotes;
	private final GculEventPublisher publisher;
	private final BlockchainMintClient blockchainMintClient;
	private final WalletLookupClient walletLookupClient;
	private final KycInternalClient kycInternalClient;
	private final PolicyRecordService policyRecords;

	public PolicyIssuanceService(
			QuoteService quotes,
			GculEventPublisher publisher,
			BlockchainMintClient blockchainMintClient,
			WalletLookupClient walletLookupClient,
			KycInternalClient kycInternalClient,
			PolicyRecordService policyRecords) {
		this.quotes = quotes;
		this.publisher = publisher;
		this.blockchainMintClient = blockchainMintClient;
		this.walletLookupClient = walletLookupClient;
		this.kycInternalClient = kycInternalClient;
		this.policyRecords = policyRecords;
	}

	public void onPremiumPaid(Map<String, Object> payload) {
		String quoteId = firstNonBlank(str(payload.get("quoteId")), str(payload.get("quote_id")));
		if (quoteId.isBlank()) {
			log.warn("PremiumPaid missing quoteId");
			return;
		}
		if (policyRecords.findByQuoteId(quoteId).isPresent()) {
			log.debug("Policy already issued for quote {}", quoteId);
			return;
		}

		Map<String, Object> quote;
		try {
			quote = quotes.getQuote(quoteId);
		}
		catch (Exception ex) {
			log.warn("Quote {} not found for PremiumPaid: {}", quoteId, ex.getMessage());
			return;
		}

		String policyId = "POL-" + quoteId.replace("Q-", "");
		String policyNumber = policyId;
		String customerEmail = extractEmail(quote).toLowerCase();
		WalletLookup wallet = resolveWallet(customerEmail, payload.get("walletAddress"));
		String customerId = firstNonBlank(wallet.userId(), customerEmail);
		String walletAddress = wallet.address();
		String productTitle = String.valueOf(quote.getOrDefault("product_title", "Insurance"));
		String policyReferenceHash = PolicyReferenceHasher.hash(policyId, policyNumber, customerId, quoteId);
		String metadataUri = "ipfs://gcul-policy/" + policyId;

		PolicyRecord record = policyRecords.createIssuedPolicy(
				policyId,
				policyNumber,
				quoteId,
				customerId,
				customerEmail,
				productTitle,
				walletAddress,
				policyReferenceHash,
				metadataUri);

		Map<String, Object> created = new LinkedHashMap<>();
		created.put("eventType", "PolicyCreated");
		created.put("policyId", policyId);
		created.put("policyNumber", policyNumber);
		created.put("quoteId", quoteId);
		created.put("customerId", customerId);
		created.put("productTitle", productTitle);
		created.put("status", "ISSUED");
		publisher.publish(EventTopics.POLICY, created);

		if (!wallet.connected() || walletAddress.isBlank()) {
			log.warn("Policy {} issued off-chain — awaiting verified wallet before mint", policyId);
			return;
		}

		if (!kycInternalClient.isVerified(customerId)) {
			log.warn("Policy {} mint deferred — customer {} not KYC verified", policyId, customerId);
			return;
		}

		requestBlockchainMint(record, true);
		log.info("Issued policy {} for quote {}", policyId, quoteId);
	}

	public void onPolicyMinted(Map<String, Object> payload) {
		String policyId = str(payload.get("policyId"));
		if (policyId.isBlank()) {
			return;
		}
		policyRecords.findByPolicyId(policyId).ifPresent(record -> {
			policyRecords.applyMintResult(policyId, payload);
			Map<String, Object> activated = new LinkedHashMap<>();
			activated.put("eventType", "PolicyActivated");
			activated.put("policyId", policyId);
			activated.put("tokenId", payload.get("tokenId"));
			activated.put("status", "ACTIVE");
			publisher.publish(EventTopics.POLICY, activated);
		});
	}

	public void onWalletLinked(Map<String, Object> payload) {
		String customerId = str(payload.get("customerId"));
		String walletAddress = str(payload.get("walletAddress"));
		log.info("Wallet linked for customer {} address {} — checking pending policy mints",
				customerId, walletAddress);

		if (customerId.isBlank() || walletAddress.isBlank()) {
			return;
		}
		if (!kycInternalClient.isVerified(customerId)) {
			return;
		}

		for (PolicyRecord pending : policyRecords.listPendingMint()) {
			if (!customerId.equals(pending.getCustomerId())
					&& !customerId.equalsIgnoreCase(pending.getCustomerEmail())) {
				continue;
			}
			policyRecords.attachWallet(pending.getPolicyId(), walletAddress);
			requestBlockchainMint(pending, true);
		}
	}

	public Map<String, Object> getPolicy(String policyId) {
		return policyRecords.findByPolicyId(policyId)
				.map(policyRecords::toResponse)
				.orElse(null);
	}

	public List<Map<String, Object>> listCustomerPolicies(String customerId, String email) {
		return policyRecords.listForCustomer(customerId, email).stream()
				.map(policyRecords::toResponse)
				.toList();
	}

	private void requestBlockchainMint(PolicyRecord record, boolean kycVerified) {
		try {
			Map<String, Object> mintResult = blockchainMintClient.mintPolicyNft(
					blockchainMintClient.buildMintRequest(toView(record), kycVerified));
			onPolicyMinted(mintResult);
		}
		catch (Exception ex) {
			policyRecords.markMintFailed(record.getPolicyId(), ex.getMessage());
			log.error("Blockchain mint failed for {}: {}", record.getPolicyId(), ex.getMessage());
		}
	}

	private PolicyRecordView toView(PolicyRecord record) {
		return new PolicyRecordView(
				record.getPolicyId(),
				record.getPolicyNumber(),
				record.getQuoteId(),
				record.getCustomerId(),
				record.getWalletAddress(),
				record.getPolicyReferenceHash(),
				record.getMetadataUri(),
				record.getProductTitle());
	}

	private WalletLookup resolveWallet(String customerEmail, Object eventWallet) {
		if (eventWallet != null && !String.valueOf(eventWallet).isBlank()) {
			String address = String.valueOf(eventWallet).trim();
			WalletLookup byEmail = walletLookupClient.lookupByEmail(customerEmail);
			return new WalletLookup(byEmail.userId(), address, true);
		}
		WalletLookup byEmail = walletLookupClient.lookupByEmail(customerEmail);
		if (byEmail.connected()) {
			return byEmail;
		}
		return WalletLookup.empty();
	}

	private static String extractEmail(Map<String, Object> quote) {
		Object answersObj = quote.get("answers");
		if (answersObj instanceof Map<?, ?> answers) {
			Object email = answers.get("email");
			if (email != null && !String.valueOf(email).isBlank()) {
				return String.valueOf(email).trim();
			}
		}
		return "unknown";
	}

	private static String str(Object value) {
		return value == null ? "" : String.valueOf(value).trim();
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (StringUtils.hasText(value)) {
				return value.trim();
			}
		}
		return "";
	}
}
