// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title
 * @dev 
 */
contract UniversalFactoryV2 is Ownable, ReentrancyGuard {
    

    enum TemplateType {
        TOKEN,
        NFT,
        DAO,
        LOCK,
        LIQUIDITY_POOL,
        YIELD_FARMING,
        GAMEFI_TOKEN,
        NFT_MARKETPLACE,
        REVENUE_SHARING,
        LOYALTY_PROGRAM,
        DYNAMIC_NFT,
        SOCIAL_TOKEN
    }
    
    enum PremiumFeature {
        PAUSABLE,
        BURNABLE,
        MINTABLE,
        CAPPED,
        SNAPSHOT,
        PERMIT,
        VOTES,
        ROYALTIES,
        ENUMERABLE,
        URISTORAGE,
        WHITELIST,
        BLACKLIST,
        TAX,
        TIMELOCK,
        MULTISIG,
        UPGRADEABLE,
        VESTING,
        AIRDROP,
        STAKING,
        FLASHMINT,
        ORACLE,
        AUTOMATED,
        ANTIBOT,
        EVOLUTION,
        MERGING,
        BREEDING,
        AUCTION,
        ESCROW,
        CURATION,
        LAZYMINT,
        TIERED,
        REWARDS,
        PARTNERSHIP,
        GOVERNANCE,
        TIPPING,
        EXCLUSIVE,
        ACCOUNTING,
        INSURANCE,
        CROSSCHAIN,
        ANALYTICS,
        API,
        WEBHOOK,
        BACKUP,
        MONITORING
    }
    
    event ContractDeployed(
        address indexed deployer,
        address indexed deployedContract,
        TemplateType templateType,
        uint256 platformFee,
        uint256 premiumFee
    );
    
    address public constant PLATFORM_FEE_ADDRESS = 0x2A5954bA696AD11BabD9B5398fa3ecA6Da98420C;
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 2;
    uint256 public constant BASE_DEPLOYMENT_COST = 0.001 ether;
    
    mapping(TemplateType => bool) public supportedTemplates;
    mapping(PremiumFeature => uint256) public featurePrices;
    uint256 public totalDeployments;
    
    constructor() Ownable() ReentrancyGuard() {
        supportedTemplates[TemplateType.TOKEN] = true;
        supportedTemplates[TemplateType.NFT] = true;
        supportedTemplates[TemplateType.DAO] = true;
        supportedTemplates[TemplateType.LOCK] = true;
        supportedTemplates[TemplateType.LIQUIDITY_POOL] = true;
        supportedTemplates[TemplateType.YIELD_FARMING] = true;
        supportedTemplates[TemplateType.GAMEFI_TOKEN] = true;
        supportedTemplates[TemplateType.NFT_MARKETPLACE] = true;
        supportedTemplates[TemplateType.REVENUE_SHARING] = true;
        supportedTemplates[TemplateType.LOYALTY_PROGRAM] = true;
        supportedTemplates[TemplateType.DYNAMIC_NFT] = true;
        supportedTemplates[TemplateType.SOCIAL_TOKEN] = true;
        
        _initializePremiumPrices();
    }
    
    /**
     * @dev 
     */
    function _initializePremiumPrices() private {
        featurePrices[PremiumFeature.PAUSABLE] = 0.01 ether;
        featurePrices[PremiumFeature.BURNABLE] = 0.005 ether;
        featurePrices[PremiumFeature.MINTABLE] = 0.01 ether;
        featurePrices[PremiumFeature.CAPPED] = 0.005 ether;
        featurePrices[PremiumFeature.SNAPSHOT] = 0.02 ether;
        featurePrices[PremiumFeature.PERMIT] = 0.015 ether;
        featurePrices[PremiumFeature.VOTES] = 0.02 ether;
        featurePrices[PremiumFeature.ROYALTIES] = 0.015 ether;
        featurePrices[PremiumFeature.ENUMERABLE] = 0.01 ether;
        featurePrices[PremiumFeature.URISTORAGE] = 0.01 ether;
        featurePrices[PremiumFeature.WHITELIST] = 0.02 ether;
        featurePrices[PremiumFeature.BLACKLIST] = 0.02 ether;
        featurePrices[PremiumFeature.TAX] = 0.025 ether;
        featurePrices[PremiumFeature.TIMELOCK] = 0.03 ether;
        featurePrices[PremiumFeature.MULTISIG] = 0.04 ether;
        featurePrices[PremiumFeature.UPGRADEABLE] = 0.05 ether;
        featurePrices[PremiumFeature.VESTING] = 0.03 ether;
        featurePrices[PremiumFeature.AIRDROP] = 0.02 ether;
        featurePrices[PremiumFeature.STAKING] = 0.04 ether;
        featurePrices[PremiumFeature.FLASHMINT] = 0.03 ether;
        featurePrices[PremiumFeature.ORACLE] = 0.035 ether;
        featurePrices[PremiumFeature.AUTOMATED] = 0.04 ether;
        featurePrices[PremiumFeature.ANTIBOT] = 0.025 ether;
        featurePrices[PremiumFeature.EVOLUTION] = 0.03 ether;
        featurePrices[PremiumFeature.MERGING] = 0.025 ether;
        featurePrices[PremiumFeature.BREEDING] = 0.035 ether;
        featurePrices[PremiumFeature.AUCTION] = 0.03 ether;
        featurePrices[PremiumFeature.ESCROW] = 0.025 ether;
        featurePrices[PremiumFeature.CURATION] = 0.02 ether;
        featurePrices[PremiumFeature.LAZYMINT] = 0.015 ether;
        featurePrices[PremiumFeature.TIERED] = 0.025 ether;
        featurePrices[PremiumFeature.REWARDS] = 0.03 ether;
        featurePrices[PremiumFeature.PARTNERSHIP] = 0.04 ether;
        featurePrices[PremiumFeature.GOVERNANCE] = 0.035 ether;
        featurePrices[PremiumFeature.TIPPING] = 0.02 ether;
        featurePrices[PremiumFeature.EXCLUSIVE] = 0.025 ether;
        featurePrices[PremiumFeature.ACCOUNTING] = 0.03 ether;
        featurePrices[PremiumFeature.INSURANCE] = 0.05 ether;
        featurePrices[PremiumFeature.CROSSCHAIN] = 0.06 ether;
        featurePrices[PremiumFeature.ANALYTICS] = 0.02 ether;
        featurePrices[PremiumFeature.API] = 0.03 ether;
        featurePrices[PremiumFeature.WEBHOOK] = 0.015 ether;
        featurePrices[PremiumFeature.BACKUP] = 0.02 ether;
        featurePrices[PremiumFeature.MONITORING] = 0.04 ether;
    }
    

    /**
     * @dev 
     */
    function deployContract(
        TemplateType templateType,
        bytes calldata bytecode,
        bytes calldata constructorParams,
        uint8[] calldata features
    ) external payable nonReentrant returns (address deployedContract) {
        require(supportedTemplates[templateType], "Template not supported");
        require(bytecode.length > 0, "Empty bytecode");
        
        uint256 premiumFee = _calculatePremiumFees(features);
        uint256 platformFee = (BASE_DEPLOYMENT_COST * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 totalRequired = BASE_DEPLOYMENT_COST + platformFee + premiumFee;
        
        require(msg.value >= totalRequired, "Insufficient payment");
        
        deployedContract = _deployContract(bytecode, constructorParams);
        
        if (platformFee + premiumFee > 0) {
            (bool success, ) = PLATFORM_FEE_ADDRESS.call{value: platformFee + premiumFee}("");
            require(success, "Fee transfer failed");
        }
        
        if (msg.value > totalRequired) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - totalRequired}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit ContractDeployed(
            msg.sender,
            deployedContract,
            templateType,
            platformFee,
            premiumFee
        );
        
        totalDeployments++;
    }
    
    /**
     * @dev 
     */
    function estimateDeploymentCost(TemplateType templateType) 
        external 
        view 
        returns (uint256) 
    {
        require(supportedTemplates[templateType], "Template not supported");
        
        uint256 deploymentCost = BASE_DEPLOYMENT_COST;
        uint256 platformFee = (deploymentCost * PLATFORM_FEE_PERCENTAGE) / 100;
        return deploymentCost + platformFee;
    }

    /**
     * @dev 
     */
    function estimateDeploymentCostWithFeatures(
        TemplateType templateType,
        uint8[] calldata features
    ) external view returns (uint256) {
        require(supportedTemplates[templateType], "Template not supported");
        
        uint256 deploymentCost = BASE_DEPLOYMENT_COST;
        uint256 platformFee = (deploymentCost * PLATFORM_FEE_PERCENTAGE) / 100;
        

        uint256 premiumFee = _calculatePremiumFees(features);
        
        return deploymentCost + platformFee + premiumFee;
    }
    
    /**
     * @dev 
     */
    function _calculatePremiumFees(uint8[] calldata features) private view returns (uint256 total) {
        for (uint256 i = 0; i < features.length; i++) {
            if (features[i] <= uint8(type(PremiumFeature).max)) {
                total += featurePrices[PremiumFeature(features[i])];
            }
        }
    }
    
    /**
     * @dev 
     */
    function _deployContract(
        bytes calldata bytecode,
        bytes calldata constructorArgs
    ) internal returns (address deployedContract) {
        bytes memory deploymentBytecode = constructorArgs.length > 0
            ? abi.encodePacked(bytecode, constructorArgs)
            : bytecode;
        

        assembly {
            deployedContract := create(
                0,
                add(deploymentBytecode, 0x20),
                mload(deploymentBytecode)
            )
        }
        

        require(deployedContract != address(0), "CREATE failed");
        

        uint256 codeSize;
        assembly {
            codeSize := extcodesize(deployedContract)
        }
        require(codeSize > 0, "No code at deployed address");
    }
    
    /**
     * @dev 
     */
    function setTemplateSupport(TemplateType templateType, bool supported) external onlyOwner {
        supportedTemplates[templateType] = supported;
    }
    
    function isTemplateSupported(TemplateType templateType) external view returns (bool) {
        return supportedTemplates[templateType];
    }
    
    /**
     * @dev 
     */
    function getFeaturePrice(PremiumFeature feature) external view returns (uint256) {
        return featurePrices[feature];
    }
    
    function setFeaturePrice(PremiumFeature feature, uint256 price) external onlyOwner {
        featurePrices[feature] = price;
    }
    
    /**
     * @dev 
     */
    function calculatePremiumFees(uint8[] calldata features) external view returns (uint256) {
        return _calculatePremiumFees(features);
    }
    
    function predictDeploymentAddress(
        bytes memory,
        bytes memory,
        bytes32
    ) external pure returns (address) {
        revert("Address prediction not available");
    }
} 