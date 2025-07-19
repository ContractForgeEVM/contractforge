pragma solidity ^0.8.20;
contract ContractFactoryLite {
    address public immutable platformFeeAddress;
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 2;
    event ContractDeployed(
        address indexed deployer,
        address indexed deployedContract,
        uint256 platformFee,
        uint256 premiumFee
    );
    struct WhitelistConfig {
        address[] addresses;
        bool enabled;
    }
    struct TaxConfig {
        uint256 rate;
        address recipient;
    }
    struct BasicPremiumConfig {
        WhitelistConfig whitelist;
        TaxConfig tax;
        string[] enabledFeatures;
    }
    mapping(address => BasicPremiumConfig) public deployedContractConfigs;
    constructor(address _platformFeeAddress) {
        require(_platformFeeAddress != address(0), "Invalid fee address");
        platformFeeAddress = _platformFeeAddress;
    }
    function deployContract(
        bytes memory bytecode,
        uint256 premiumFee
    ) external payable returns (address) {
        return _deployContract(bytecode, "", premiumFee, new string[](0), _getEmptyPremiumConfig());
    }
    function deployContractWithConstructor(
        bytes memory bytecode,
        bytes memory constructorArgs,
        uint256 premiumFee
    ) external payable returns (address) {
        return _deployContract(bytecode, constructorArgs, premiumFee, new string[](0), _getEmptyPremiumConfig());
    }
    function deployContractWithBasicFeatures(
        bytes memory bytecode,
        bytes memory constructorArgs,
        uint256 premiumFee,
        string[] memory premiumFeatures,
        BasicPremiumConfig memory premiumConfig
    ) external payable returns (address) {
        _validateBasicPremiumConfig(premiumFeatures, premiumConfig);
        return _deployContract(bytecode, constructorArgs, premiumFee, premiumFeatures, premiumConfig);
    }
    function _getEmptyPremiumConfig() internal pure returns (BasicPremiumConfig memory) {
        return BasicPremiumConfig({
            whitelist: WhitelistConfig({addresses: new address[](0), enabled: false}),
            tax: TaxConfig({rate: 0, recipient: address(0)}),
            enabledFeatures: new string[](0)
        });
    }
    function _deployContract(
        bytes memory bytecode,
        bytes memory constructorArgs,
        uint256 premiumFee,
        string[] memory premiumFeatures,
        BasicPremiumConfig memory premiumConfig
    ) internal returns (address) {
        uint256 deploymentCost = msg.value - premiumFee;
        uint256 platformFee = (deploymentCost * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 totalFees = platformFee + premiumFee;
        require(msg.value >= totalFees, "Insufficient payment");
        bytes memory deploymentBytecode = constructorArgs.length > 0
            ? abi.encodePacked(bytecode, constructorArgs)
            : bytecode;
        address deployedContract;
        assembly {
            deployedContract := create(
                0,
                add(deploymentBytecode, 0x20),
                mload(deploymentBytecode)
            )
            if iszero(extcodesize(deployedContract)) {
                revert(0, 0)
            }
        }
        if (premiumFeatures.length > 0) {
            deployedContractConfigs[deployedContract] = premiumConfig;
            _configureBasicPremiumFeatures(deployedContract, premiumFeatures, premiumConfig);
        }
        (bool success, ) = platformFeeAddress.call{value: totalFees}("");
        require(success, "Fee transfer failed");
        uint256 excess = msg.value - totalFees;
        if (excess > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: excess}("");
            require(refundSuccess, "Refund failed");
        }
        emit ContractDeployed(msg.sender, deployedContract, platformFee, premiumFee);
        return deployedContract;
    }
    function _validateBasicPremiumConfig(
        string[] memory premiumFeatures,
        BasicPremiumConfig memory premiumConfig
    ) internal pure {
        bool hasWhitelist = false;
        bool hasTax = false;
        for (uint i = 0; i < premiumFeatures.length; i++) {
            string memory feature = premiumFeatures[i];
            if (keccak256(bytes(feature)) == keccak256(bytes("whitelist"))) {
                hasWhitelist = true;
            } else if (keccak256(bytes(feature)) == keccak256(bytes("tax"))) {
                hasTax = true;
            }
        }
        if (hasWhitelist) {
            require(premiumConfig.whitelist.addresses.length > 0, "Whitelist addresses required when whitelist feature enabled");
            _validateAddresses(premiumConfig.whitelist.addresses);
        }
        if (hasTax) {
            require(premiumConfig.tax.rate > 0 && premiumConfig.tax.rate <= 2500, "Tax rate must be between 0.01% and 25%");
            require(premiumConfig.tax.recipient != address(0), "Tax recipient address required");
        }
    }
    function _validateAddresses(address[] memory addresses) internal pure {
        for (uint i = 0; i < addresses.length; i++) {
            require(addresses[i] != address(0), "Invalid address in configuration");
        }
    }
    function _configureBasicPremiumFeatures(
        address deployedContract,
        string[] memory premiumFeatures,
        BasicPremiumConfig memory premiumConfig
    ) internal {
        for (uint i = 0; i < premiumFeatures.length; i++) {
            string memory feature = premiumFeatures[i];
            if (keccak256(bytes(feature)) == keccak256(bytes("whitelist"))) {
                _configureWhitelist(deployedContract, premiumConfig.whitelist);
            } else if (keccak256(bytes(feature)) == keccak256(bytes("tax"))) {
                _configureTax(deployedContract, premiumConfig.tax);
            }
        }
    }
    function _configureWhitelist(address deployedContract, WhitelistConfig memory config) internal {
        if (config.addresses.length > 0) {
            (bool success, ) = deployedContract.call(
                abi.encodeWithSignature("addMultipleToWhitelist(address[])", config.addresses)
            );
            if (success && config.enabled) {
                deployedContract.call(abi.encodeWithSignature("enableWhitelist()"));
            }
        }
    }
    function _configureTax(address deployedContract, TaxConfig memory config) internal {
        if (config.rate > 0 && config.recipient != address(0)) {
            deployedContract.call(abi.encodeWithSignature("setTaxRate(uint256)", config.rate));
            deployedContract.call(abi.encodeWithSignature("setTaxRecipient(address)", config.recipient));
        }
    }
    function getDeployedContractConfig(address contractAddress) external view returns (BasicPremiumConfig memory) {
        return deployedContractConfigs[contractAddress];
    }
    function isContractDeployedByFactory(address contractAddress) external view returns (bool) {
        return deployedContractConfigs[contractAddress].enabledFeatures.length > 0;
    }
}