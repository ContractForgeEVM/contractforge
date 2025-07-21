// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title UniversalFactoryV2
 * @dev Version simplifiée qui fonctionne vraiment
 */
contract UniversalFactoryV2 is Ownable, ReentrancyGuard {
    
    // Template types
    enum TemplateType {
        TOKEN,       // 0
        NFT,         // 1
        DAO,         // 2
        LOCK,        // 3
        LIQUIDITY_POOL, // 4
        YIELD_FARMING,  // 5
        GAMEFI_TOKEN,   // 6
        NFT_MARKETPLACE, // 7
        REVENUE_SHARING, // 8
        LOYALTY_PROGRAM, // 9
        DYNAMIC_NFT,     // 10
        SOCIAL_TOKEN     // 11
    }
    
    // Premium features (prix en ETH)
    enum PremiumFeature {
        PAUSABLE,     // 0
        BURNABLE,     // 1
        MINTABLE,     // 2
        CAPPED,       // 3
        SNAPSHOT,     // 4
        PERMIT,       // 5
        VOTES,        // 6
        ROYALTIES,    // 7
        ENUMERABLE,   // 8
        URISTORAGE,   // 9
        WHITELIST,    // 10
        BLACKLIST,    // 11
        TAX,          // 12
        TIMELOCK,     // 13
        MULTISIG,     // 14
        UPGRADEABLE,  // 15
        VESTING,      // 16
        AIRDROP,      // 17
        STAKING,      // 18
        FLASHMINT,    // 19
        ORACLE,       // 20
        AUTOMATED,    // 21
        ANTIBOT,      // 22
        EVOLUTION,    // 23
        MERGING,      // 24
        BREEDING,     // 25
        AUCTION,      // 26
        ESCROW,       // 27
        CURATION,     // 28
        LAZYMINT,     // 29
        TIERED,       // 30
        REWARDS,      // 31
        PARTNERSHIP,  // 32
        GOVERNANCE,   // 33
        TIPPING,      // 34
        EXCLUSIVE,    // 35
        ACCOUNTING,   // 36
        INSURANCE,    // 37
        CROSSCHAIN,   // 38
        ANALYTICS,    // 39
        API,          // 40
        WEBHOOK,      // 41
        BACKUP,       // 42
        MONITORING    // 43
    }
    
    // Events
    event ContractDeployed(
        address indexed deployer,
        address indexed deployedContract,
        TemplateType templateType,
        uint256 platformFee,
        uint256 premiumFee
    );
    
    // State
    address public constant PLATFORM_FEE_ADDRESS = 0x09789515d075Ad4f657cF33a7f4adCe485Ee4f2E;
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 2; // 2%
    uint256 public constant BASE_DEPLOYMENT_COST = 0.001 ether;
    
    mapping(TemplateType => bool) public supportedTemplates;
    mapping(PremiumFeature => uint256) public featurePrices;
    uint256 public totalDeployments;
    
    constructor() Ownable(msg.sender) {
        // Activer TOUS les templates par défaut
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
        
        // Initialiser les prix des premium features
        _initializePremiumPrices();
    }
    
    /**
     * @dev Initialize premium feature prices
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
     * @dev Deploy contract with premium features (VRAIMENT prises en compte maintenant !)
     */
    function deployContract(
        TemplateType templateType,
        bytes calldata bytecode,
        bytes calldata constructorParams,
        uint8[] calldata features,
        bytes32 salt
    ) external payable nonReentrant returns (address deployedContract) {
        require(supportedTemplates[templateType], "Template not supported");
        require(bytecode.length > 0, "Empty bytecode");
        
        // Calculer les frais RÉELS avec premium features
        uint256 premiumFee = _calculatePremiumFees(features);
        uint256 platformFee = (BASE_DEPLOYMENT_COST * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 totalRequired = BASE_DEPLOYMENT_COST + platformFee + premiumFee;
        
        require(msg.value >= totalRequired, "Insufficient payment");
        
        // Déployer le contrat (méthode SimpleFactory prouvée)
        deployedContract = _deployContract(bytecode, constructorParams);
        
        // Transférer les frais à la plateforme
        if (platformFee + premiumFee > 0) {
            (bool success, ) = PLATFORM_FEE_ADDRESS.call{value: platformFee + premiumFee}("");
            require(success, "Fee transfer failed");
        }
        
        // Rembourser l'excédent
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
     * @dev Estimation simple des coûts (retourne le coût total uniquement)
     */
    function estimateDeploymentCost(TemplateType templateType) 
        external 
        view 
        returns (uint256) 
    {
        require(supportedTemplates[templateType], "Template not supported");
        
        // Coût minimal suggéré
        uint256 deploymentCost = BASE_DEPLOYMENT_COST;
        uint256 platformFee = (deploymentCost * PLATFORM_FEE_PERCENTAGE) / 100;
        return deploymentCost + platformFee;
    }

    /**
     * @dev Estimation avec features premium (retourne le coût total uniquement)
     */
    function estimateDeploymentCostWithFeatures(
        TemplateType templateType,
        uint8[] calldata features
    ) external view returns (uint256) {
        require(supportedTemplates[templateType], "Template not supported");
        
        // Coût de base
        uint256 deploymentCost = BASE_DEPLOYMENT_COST;
        uint256 platformFee = (deploymentCost * PLATFORM_FEE_PERCENTAGE) / 100;
        
        // Calculer les frais premium RÉELS
        uint256 premiumFee = _calculatePremiumFees(features);
        
        return deploymentCost + platformFee + premiumFee;
    }
    
    /**
     * @dev Calculer les frais des premium features
     */
    function _calculatePremiumFees(uint8[] calldata features) private view returns (uint256 total) {
        for (uint256 i = 0; i < features.length; i++) {
            if (features[i] <= uint8(type(PremiumFeature).max)) {
                total += featurePrices[PremiumFeature(features[i])];
            }
        }
    }
    
    /**
     * @dev Déploiement interne (copié de SimpleFactory)
     */
    function _deployContract(
        bytes calldata bytecode,
        bytes calldata constructorArgs
    ) internal returns (address deployedContract) {
        bytes memory deploymentBytecode = constructorArgs.length > 0
            ? abi.encodePacked(bytecode, constructorArgs)
            : bytecode;
        
        // Utiliser CREATE de manière sûre
        assembly {
            deployedContract := create(
                0,
                add(deploymentBytecode, 0x20),
                mload(deploymentBytecode)
            )
        }
        
        // Vérifications post-déploiement
        require(deployedContract != address(0), "CREATE failed");
        
        // Vérifier que le contrat a bien du code
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(deployedContract)
        }
        require(codeSize > 0, "No code at deployed address");
    }
    
    /**
     * @dev Gestion des templates
     */
    function setTemplateSupport(TemplateType templateType, bool supported) external onlyOwner {
        supportedTemplates[templateType] = supported;
    }
    
    function isTemplateSupported(TemplateType templateType) external view returns (bool) {
        return supportedTemplates[templateType];
    }
    
    /**
     * @dev Gestion des prix premium features
     */
    function getFeaturePrice(PremiumFeature feature) external view returns (uint256) {
        return featurePrices[feature];
    }
    
    function setFeaturePrice(PremiumFeature feature, uint256 price) external onlyOwner {
        featurePrices[feature] = price;
    }
    
    /**
     * @dev Calculer les frais premium publique (pour le frontend)
     */
    function calculatePremiumFees(uint8[] calldata features) external view returns (uint256) {
        return _calculatePremiumFees(features);
    }
    
    // Compatibilité avec l'ABI existante (fonction désactivée)
    function predictDeploymentAddress(
        bytes memory,
        bytes memory,
        bytes32
    ) external pure returns (address) {
        revert("Address prediction not available");
    }
} 