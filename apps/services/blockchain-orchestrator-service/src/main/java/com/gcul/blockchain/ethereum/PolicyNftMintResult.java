package com.gcul.blockchain.ethereum;

public record PolicyNftMintResult(
		String policyId,
		String tokenId,
		String transactionHash,
		String walletAddress,
		String contractAddress,
		long chainId,
		String network,
		String tokenUri,
		String mode,
		String status) {
}
