// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title GCUL Insurance Policy NFT (ERC-721)
/// @notice Insurer-only minting — each policy is a unique token sent to the customer's wallet.
contract InsurancePolicyNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    mapping(string => uint256) public policyHashToTokenId;
    mapping(uint256 => string) public tokenIdToPolicyHash;

    event PolicyMinted(
        uint256 indexed tokenId,
        address indexed to,
        string policyReferenceHash,
        string metadataURI
    );

    constructor() ERC721("GCUL Insurance Policy", "GCULPOL") Ownable(msg.sender) {}

    /// @notice Mint a policy NFT to a verified customer wallet. Only the insurer (owner) may call.
    function mintPolicy(
        address to,
        string calldata policyReferenceHash,
        string calldata metadataURI
    ) external onlyOwner returns (uint256 tokenId) {
        require(to != address(0), "Invalid recipient");
        require(bytes(policyReferenceHash).length > 0, "Policy reference hash required");
        require(policyHashToTokenId[policyReferenceHash] == 0, "Policy already minted");

        tokenId = _nextTokenId;
        unchecked {
            _nextTokenId++;
        }

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        policyHashToTokenId[policyReferenceHash] = tokenId + 1;
        tokenIdToPolicyHash[tokenId] = policyReferenceHash;

        emit PolicyMinted(tokenId, to, policyReferenceHash, metadataURI);
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    function getTokenIdForPolicyHash(string calldata policyReferenceHash) external view returns (uint256) {
        uint256 stored = policyHashToTokenId[policyReferenceHash];
        require(stored > 0, "Policy not minted");
        return stored - 1;
    }
}
