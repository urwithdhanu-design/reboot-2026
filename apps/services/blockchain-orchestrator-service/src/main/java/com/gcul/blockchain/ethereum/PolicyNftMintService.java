package com.gcul.blockchain.ethereum;

import java.math.BigInteger;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.web3j.abi.EventEncoder;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Event;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.EthCall;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.core.methods.response.Log;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.response.PollingTransactionReceiptProcessor;
import org.web3j.utils.Numeric;

import com.gcul.blockchain.config.EthereumProperties;
import com.gcul.blockchain.ethereum.PolicyMintValidator.MintContext;
import com.gcul.blockchain.model.PolicyNftRecord;
import com.gcul.blockchain.repository.PolicyNftRecordRepository;

@Service
public class PolicyNftMintService {

	private static final Logger log = LoggerFactory.getLogger(PolicyNftMintService.class);
	private static final String NETWORK = "Ethereum Sepolia";
	private static final Event POLICY_MINTED_EVENT = new Event(
			"PolicyMinted",
			Arrays.asList(
					new TypeReference<Uint256>(true) {},
					new TypeReference<Address>(true) {},
					new TypeReference<Utf8String>() {},
					new TypeReference<Utf8String>() {}));

	private final EthereumProperties props;
	private final PolicyNftRecordRepository repository;
	private final PolicyMintValidator validator;
	private final Optional<Web3j> web3j;
	private final Optional<Credentials> insurerCredentials;

	public PolicyNftMintService(
			EthereumProperties props,
			PolicyNftRecordRepository repository,
			PolicyMintValidator validator,
			Optional<Web3j> web3j,
			Optional<Credentials> insurerCredentials) {
		this.props = props;
		this.repository = repository;
		this.validator = validator;
		this.web3j = web3j;
		this.insurerCredentials = insurerCredentials;
	}

	public boolean isEthereumLive() {
		return props.isEnabled()
				&& web3j.isPresent()
				&& insurerCredentials.isPresent()
				&& StringUtils.hasText(props.getContractAddress());
	}

	public Map<String, Object> status() {
		Map<String, Object> status = new LinkedHashMap<>();
		status.put("enabled", props.isEnabled());
		status.put("live", isEthereumLive());
		status.put("chainId", props.getChainId());
		status.put("network", NETWORK);
		status.put("contractAddress", props.getContractAddress());
		status.put("insurerAddress", insurerCredentials.map(c -> c.getAddress()).orElse(null));
		status.put("rpcConfigured", StringUtils.hasText(props.getRpcUrl()));
		status.put("mode", isEthereumLive() ? "ethereum" : "simulated");
		return status;
	}

	@Transactional
	public PolicyNftMintResult mintPolicyNft(MintRequest request) {
		String policyId = requireText(request.policyId(), "policyId");
		String policyReferenceHash = requireText(request.policyReferenceHash(), "policyReferenceHash");
		String walletAddress = EthereumAddressValidator.normalize(request.walletAddress());
		String metadataUri = requireText(
				StringUtils.hasText(request.metadataUri()) ? request.metadataUri() : buildMetadataUri(policyId),
				"metadataURI");
		String policyNumber = firstNonBlank(request.policyNumber(), policyId);
		String customerId = firstNonBlank(request.customerId(), "unknown");

		validator.validate(new MintContext(
				policyId,
				policyReferenceHash,
				walletAddress,
				metadataUri,
				customerId,
				request.kycVerified(),
				request.policyEligible()));

		PolicyNftMintResult result = isEthereumLive()
				? mintOnChain(policyId, policyReferenceHash, policyNumber, customerId, walletAddress, metadataUri)
				: mintSimulated(policyId, policyReferenceHash, policyNumber, customerId, walletAddress, metadataUri);

		saveRecord(result, policyNumber, customerId);
		return result;
	}

	public List<PolicyNftRecord> recentMints() {
		return repository.findTop20ByOrderByMintedAtDesc();
	}

	public Optional<PolicyNftRecord> findByPolicyId(String policyId) {
		return repository.findByPolicyId(policyId);
	}

	private PolicyNftMintResult mintOnChain(
			String policyId,
			String policyReferenceHash,
			String policyNumber,
			String customerId,
			String walletAddress,
			String metadataUri) {
		Web3j client = web3j.orElseThrow();
		Credentials credentials = insurerCredentials.orElseThrow();
		String contractAddress = props.getContractAddress().trim();

		try {
			RawTransactionManager txManager = new RawTransactionManager(
					client,
					credentials,
					props.getChainId(),
					new PollingTransactionReceiptProcessor(client, 3_000, 40));

			@SuppressWarnings("unchecked")
			List<TypeReference<?>> mintOutputs = (List<TypeReference<?>>) (List<?>)
					List.of(new TypeReference<Uint256>() {});
			String data = FunctionEncoder.encode(new Function(
					"mintPolicy",
					Arrays.asList(
							new Address(walletAddress),
							new Utf8String(policyReferenceHash),
							new Utf8String(metadataUri)),
					mintOutputs));

			BigInteger gasPrice = client.ethGasPrice().send().getGasPrice();
			BigInteger gasLimit = BigInteger.valueOf(350_000L);

			EthSendTransaction sent = txManager.sendTransaction(
					gasPrice,
					gasLimit,
					contractAddress,
					data,
					BigInteger.ZERO);
			if (sent.hasError()) {
				throw new IllegalStateException("Mint transaction rejected: " + sent.getError().getMessage());
			}

			String txHash = sent.getTransactionHash();
			PollingTransactionReceiptProcessor receiptProcessor =
					new PollingTransactionReceiptProcessor(client, 3_000, 40);
			TransactionReceipt receipt = receiptProcessor.waitForTransactionReceipt(txHash);

			if (!"0x1".equalsIgnoreCase(receipt.getStatus())) {
				throw new IllegalStateException("Mint transaction reverted: " + txHash);
			}

			String tokenId = extractTokenIdFromReceipt(receipt)
					.orElseGet(() -> readTokenIdForPolicyHash(client, contractAddress, policyReferenceHash));
			long blockNumber = parseBlockNumber(receipt.getBlockNumber());

			log.info("On-chain policy NFT minted policyId={} tokenId={} txHash={} block={} wallet={}",
					policyId, tokenId, txHash, blockNumber, walletAddress);

			return new PolicyNftMintResult(
					policyId,
					policyReferenceHash,
					tokenId,
					txHash,
					walletAddress,
					contractAddress,
					props.getChainId(),
					blockNumber,
					NETWORK,
					metadataUri,
					"ethereum",
					"MINTED");
		}
		catch (ResponseStatusException ex) {
			throw ex;
		}
		catch (Exception ex) {
			log.error("Ethereum mint failed for policy {}: {}", policyId, ex.getMessage(), ex);
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Ethereum mint failed: " + ex.getMessage(), ex);
		}
	}

	private PolicyNftMintResult mintSimulated(
			String policyId,
			String policyReferenceHash,
			String policyNumber,
			String customerId,
			String walletAddress,
			String metadataUri) {
		String tokenId = "SIM-" + policyId.replace("POL-", "");
		String txHash = "0xsim" + UUID.randomUUID().toString().replace("-", "");
		log.info("Simulated policy NFT mint policyId={} tokenId={} wallet={}", policyId, tokenId, walletAddress);
		return new PolicyNftMintResult(
				policyId,
				policyReferenceHash,
				tokenId,
				txHash,
				walletAddress,
				"simulated",
				props.getChainId(),
				0L,
				NETWORK,
				metadataUri,
				"simulated",
				"MINTED");
	}

	private void saveRecord(PolicyNftMintResult result, String policyNumber, String customerId) {
		PolicyNftRecord record = new PolicyNftRecord();
		record.setPolicyId(result.policyId());
		record.setPolicyReferenceHash(result.policyReferenceHash());
		record.setPolicyNumber(policyNumber);
		record.setCustomerId(customerId);
		record.setWalletAddress(result.walletAddress());
		record.setTokenId(result.tokenId());
		record.setTransactionHash(result.transactionHash());
		record.setContractAddress(result.contractAddress());
		record.setChainId(result.chainId());
		record.setNetwork(result.network());
		record.setTokenUri(result.metadataUri());
		record.setBlockNumber(result.blockNumber());
		record.setMintMode(result.mode());
		record.setMintStatus(result.mintStatus());
		record.setMintedAt(Instant.now());
		repository.save(record);
	}

	private String buildMetadataUri(String policyId) {
		if (StringUtils.hasText(props.getTokenUriBase())) {
			String base = props.getTokenUriBase().trim();
			return base.endsWith("/") ? base + policyId : base + "/" + policyId;
		}
		return "ipfs://gcul-policy/" + policyId;
	}

	private Optional<String> extractTokenIdFromReceipt(TransactionReceipt receipt) {
		String signature = EventEncoder.encode(POLICY_MINTED_EVENT);
		for (Log eventLog : receipt.getLogs()) {
			if (eventLog.getTopics() == null || eventLog.getTopics().isEmpty()) {
				continue;
			}
			if (!signature.equalsIgnoreCase(eventLog.getTopics().get(0))) {
				continue;
			}
			if (eventLog.getTopics().size() > 1) {
				return Optional.of(Numeric.toBigInt(eventLog.getTopics().get(1)).toString());
			}
		}
		return Optional.empty();
	}

	private String readTokenIdForPolicyHash(Web3j client, String contractAddress, String policyReferenceHash) {
		try {
			@SuppressWarnings("unchecked")
			List<TypeReference<?>> outputTypes = (List<TypeReference<?>>) (List<?>)
					List.of(new TypeReference<Uint256>() {});
			String data = FunctionEncoder.encode(new Function(
					"getTokenIdForPolicyHash",
					Collections.singletonList(new Utf8String(policyReferenceHash)),
					outputTypes));
			EthCall response = client.ethCall(
					Transaction.createEthCallTransaction(null, contractAddress, data),
					DefaultBlockParameterName.LATEST).send();
			if (response.hasError()) {
				throw new IllegalStateException(response.getError().getMessage());
			}
			@SuppressWarnings("unchecked")
			List<TypeReference<Type>> decoderTypes = (List<TypeReference<Type>>) (List<?>) outputTypes;
			List<Type> decoded = FunctionReturnDecoder.decode(response.getValue(), decoderTypes);
			return ((Uint256) decoded.get(0)).getValue().toString();
		}
		catch (Exception ex) {
			throw new IllegalStateException("Unable to read tokenId for policy hash " + policyReferenceHash, ex);
		}
	}

	private static long parseBlockNumber(Object blockNumber) {
		if (blockNumber == null) {
			return 0L;
		}
		if (blockNumber instanceof BigInteger value) {
			return value.longValue();
		}
		return Numeric.decodeQuantity(String.valueOf(blockNumber)).longValue();
	}

	private static String requireText(String value, String field) {
		if (!StringUtils.hasText(value)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
		}
		return value.trim();
	}

	private static String firstNonBlank(String... values) {
		for (String value : values) {
			if (StringUtils.hasText(value)) {
				return value.trim();
			}
		}
		return "";
	}

	public record MintRequest(
			String policyId,
			String policyNumber,
			String customerId,
			String walletAddress,
			String policyReferenceHash,
			String metadataUri,
			boolean kycVerified,
			boolean policyEligible,
			Map<String, Object> metadata) {
	}
}
