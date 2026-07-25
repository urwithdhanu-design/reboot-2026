// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title GCUL Insurance Policy NFT (ERC-721)
/// @notice Insurer-only minting — each policy is a unique token sent to the customer's wallet.
contract InsurancePolicyNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    mapping(string => uint256) public policyIdToTokenId;
    mapping(uint256 => string) public tokenIdToPolicyId;

    event PolicyMinted(
        uint256 indexed tokenId,
        address indexed to,
        string policyId,
        string tokenURI
    );

    constructor() ERC721("GCUL Insurance Policy", "GCULPOL") Ownable(msg.sender) {}

    /// @notice Mint a policy NFT to a verified customer wallet. Only the insurer (owner) may call.
    function mintPolicy(
        address to,
        string calldata policyId,
        string calldata tokenURI_
    ) external onlyOwner returns (uint256 tokenId) {
        require(to != address(0), "Invalid recipient");
        require(bytes(policyId).length > 0, "Policy ID required");
        require(policyIdToTokenId[policyId] == 0, "Policy already minted");

        tokenId = _nextTokenId;
        unchecked {
            _nextTokenId++;
        }

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);

        policyIdToTokenId[policyId] = tokenId + 1; // store tokenId+1 so 0 means unminted
        tokenIdToPolicyId[tokenId] = policyId;

        emit PolicyMinted(tokenId, to, policyId, tokenURI_);
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    function getTokenIdForPolicy(string calldata policyId) external view returns (uint256) {
        uint256 stored = policyIdToTokenId[policyId];
        require(stored > 0, "Policy not minted");
        return stored - 1;
    }
}
