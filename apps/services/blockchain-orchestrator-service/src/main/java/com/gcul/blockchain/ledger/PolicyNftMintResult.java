package com.gcul.blockchain.ledger;

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
		String mintStatus,
		String ledgerMode,
		String packageId) {

	public PolicyNftMintResult(
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
		this(
				policyId,
				policyReferenceHash,
				tokenId,
				transactionHash,
				walletAddress,
				contractAddress,
				chainId,
				blockNumber,
				network,
				metadataUri,
				mode,
				mintStatus,
				LedgerMode.fromLedgerId(mode).id(),
				"");
	}
}
