# GCUL Insurance Policy NFT (ERC-721)

Solidity contract and Hardhat tooling for minting insurance policies as ERC-721 tokens on **Ethereum Sepolia**.

## Contract

`InsurancePolicyNFT.sol` — insurer-owned (`onlyOwner`) `mintPolicy(address to, string policyId, string tokenURI)`:

- Mints directly to the customer's verified wallet
- Prevents duplicate mints per `policyId`
- Emits `PolicyMinted(tokenId, to, policyId, tokenURI)`

## Deploy to Sepolia

```powershell
cd contracts
copy .env.example .env
# Edit .env: ALCHEMY_RPC_URL, INSURER_MINT_PRIVATE_KEY
npm install
npm run deploy:sepolia
```

Output: `deployments/sepolia.json` with `contractAddress`.

Set `POLICY_NFT_CONTRACT_ADDRESS` in `blockchain-orchestrator-service` and enable Ethereum:

```properties
GCUL_ETHEREUM_ENABLED=true
```

## Related

- [`docs/BLOCKCHAIN-INSURER-MINT.md`](../docs/BLOCKCHAIN-INSURER-MINT.md)
- [`scripts/local/test-policy-nft-mint.ps1`](../scripts/local/test-policy-nft-mint.ps1)
