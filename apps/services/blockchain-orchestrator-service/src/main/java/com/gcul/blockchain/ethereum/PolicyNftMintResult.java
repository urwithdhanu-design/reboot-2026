package com.gcul.blockchain.ethereum;

public record PolicyNftMintResult(
		String policyId,
		String policyReferenceHash,
		String tokenId,
		String transactionHash,
		String walletAddress,
		String contractAddress,
		long chainId,
		long blockNumber,
		String network,
		String metadataUri,
		String mode,
		String mintStatus) {
}
