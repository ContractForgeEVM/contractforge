pragma solidity ^0.8.20;
contract ContractFactory {
    address public immutable platformFeeAddress;
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 2;
    event ContractDeployed(
        address indexed deployer,
        address indexed deployedContract,
        uint256 platformFee,
        uint256 premiumFee,
        string[] premiumFeatures
    );
    event PremiumFeatureConfigured(
        address indexed deployedContract,
        string featureType,
        uint256 addressCount
    );
    struct WhitelistConfig {
        address[] addresses;
        bool enabled;
    }
    struct BlacklistConfig {
        address[] addresses;
    }
    struct TaxConfig {
        uint256 rate;
        address recipient;
    }
    struct CappedConfig {
        uint256 maxSupply;
    }
    struct VestingSchedule {
        address beneficiary;
        uint256 amount;
        uint256 startTime;
        uint256 duration;
        uint256 cliff;
    }
    struct VestingConfig {
        VestingSchedule[] schedules;
    }
    struct MultisigConfig {
        address[] signers;
        uint256 threshold;
    }
    struct AirdropRecipient {
        address recipient;
        uint256 amount;
    }
    struct AirdropConfig {
        AirdropRecipient[] recipients;
    }
    struct TimelockConfig {
        uint256 delay;
    }
    struct PremiumConfig {
        WhitelistConfig whitelist;
        BlacklistConfig blacklist;
        TaxConfig tax;
        CappedConfig capped;
        VestingConfig vesting;
        MultisigConfig multisig;
        AirdropConfig airdrop;
        TimelockConfig timelock;
        string[] enabledFeatures;
    }
    mapping(address => PremiumConfig) public deployedContractConfigs;
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
    function deployContractWithPremiumFeatures(
        bytes memory bytecode,
        bytes memory constructorArgs,
        uint256 premiumFee,
        string[] memory premiumFeatures,
        PremiumConfig memory premiumConfig
    ) external payable returns (address) {
        _validatePremiumConfig(premiumFeatures, premiumConfig);
        return _deployContract(bytecode, constructorArgs, premiumFee, premiumFeatures, premiumConfig);
    }
    function _getEmptyPremiumConfig() internal pure returns (PremiumConfig memory) {
        return PremiumConfig({
            whitelist: WhitelistConfig({addresses: new address[](0), enabled: false}),
            blacklist: BlacklistConfig({addresses: new address[](0)}),
            tax: TaxConfig({rate: 0, recipient: address(0)}),
            capped: CappedConfig({maxSupply: 0}),
            vesting: VestingConfig({schedules: new VestingSchedule[](0)}),
            multisig: MultisigConfig({signers: new address[](0), threshold: 0}),
            airdrop: AirdropConfig({recipients: new AirdropRecipient[](0)}),
            timelock: TimelockConfig({delay: 0}),
            enabledFeatures: new string[](0)
        });
    }
    function _deployContract(
        bytes memory bytecode,
        bytes memory constructorArgs,
        uint256 premiumFee,
        string[] memory premiumFeatures,
        PremiumConfig memory premiumConfig
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
            _configurePremiumFeatures(deployedContract, premiumFeatures, premiumConfig);
        }
        (bool success, ) = platformFeeAddress.call{value: totalFees}("");
        require(success, "Fee transfer failed");
        uint256 excess = msg.value - totalFees;
        if (excess > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: excess}("");
            require(refundSuccess, "Refund failed");
        }
        emit ContractDeployed(msg.sender, deployedContract, platformFee, premiumFee, premiumFeatures);
        return deployedContract;
    }
    function _validatePremiumConfig(
        string[] memory premiumFeatures,
        PremiumConfig memory premiumConfig
    ) internal pure {
        bool hasWhitelist = false;
        bool hasBlacklist = false;
        bool hasTax = false;
        bool hasCapped = false;
        bool hasVesting = false;
        bool hasMultisig = false;
        bool hasAirdrop = false;
        bool hasTimelock = false;
        for (uint i = 0; i < premiumFeatures.length; i++) {
            string memory feature = premiumFeatures[i];
            if (keccak256(bytes(feature)) == keccak256(bytes("whitelist"))) {
                hasWhitelist = true;
            } else if (keccak256(bytes(feature)) == keccak256(bytes("blacklist"))) {
                hasBlacklist = true;
            } else if (keccak256(bytes(feature)) == keccak256(bytes("tax"))) {
                hasTax = true;
            } else if (keccak256(bytes(feature)) == keccak256(bytes("capped"))) {
                hasCapped = true;
            } else if (keccak256(bytes(feature)) == keccak256(bytes("vesting"))) {
                hasVesting = true;
            } else if (keccak256(bytes(feature)) == keccak256(bytes("multisig"))) {
                hasMultisig = true;
            } else if (keccak256(bytes(feature)) == keccak256(bytes("airdrop"))) {
                hasAirdrop = true;
            } else if (keccak256(bytes(feature)) == keccak256(bytes("timelock"))) {
                hasTimelock = true;
            }
        }
        require(!(hasWhitelist && hasBlacklist), "Whitelist and blacklist cannot be used together");
        if (hasWhitelist) {
            require(premiumConfig.whitelist.addresses.length > 0, "Whitelist addresses required when whitelist feature enabled");
            _validateAddresses(premiumConfig.whitelist.addresses);
        }
        if (hasBlacklist) {
            require(premiumConfig.blacklist.addresses.length > 0, "Blacklist addresses required when blacklist feature enabled");
            _validateAddresses(premiumConfig.blacklist.addresses);
        }
        if (hasTax) {
            require(premiumConfig.tax.rate > 0 && premiumConfig.tax.rate <= 2500, "Tax rate must be between 0.01% and 25%");
            require(premiumConfig.tax.recipient != address(0), "Tax recipient address required");
        }
        if (hasCapped) {
            require(premiumConfig.capped.maxSupply > 0, "Maximum supply must be greater than 0");
        }
        if (hasVesting) {
            require(premiumConfig.vesting.schedules.length > 0, "Vesting schedules required when vesting feature enabled");
            _validateVestingSchedules(premiumConfig.vesting.schedules);
        }
        if (hasMultisig) {
            require(premiumConfig.multisig.signers.length > 0, "Multisig signers required when multisig feature enabled");
            require(premiumConfig.multisig.threshold > 0 && premiumConfig.multisig.threshold <= premiumConfig.multisig.signers.length,
                   "Invalid multisig threshold");
            _validateAddresses(premiumConfig.multisig.signers);
        }
        if (hasAirdrop) {
            require(premiumConfig.airdrop.recipients.length > 0, "Airdrop recipients required when airdrop feature enabled");
            _validateAirdropRecipients(premiumConfig.airdrop.recipients);
        }
        if (hasTimelock) {
            require(premiumConfig.timelock.delay > 0, "Timelock delay must be greater than 0");
        }
    }
    function _validateAddresses(address[] memory addresses) internal pure {
        for (uint i = 0; i < addresses.length; i++) {
            require(addresses[i] != address(0), "Invalid address in configuration");
        }
    }
    function _validateVestingSchedules(VestingSchedule[] memory schedules) internal pure {
        for (uint i = 0; i < schedules.length; i++) {
            require(schedules[i].beneficiary != address(0), "Invalid beneficiary address");
            require(schedules[i].amount > 0, "Vesting amount must be greater than 0");
            require(schedules[i].duration > 0, "Vesting duration must be greater than 0");
            require(schedules[i].cliff <= schedules[i].duration, "Cliff cannot exceed duration");
        }
    }
    function _validateAirdropRecipients(AirdropRecipient[] memory recipients) internal pure {
        for (uint i = 0; i < recipients.length; i++) {
            require(recipients[i].recipient != address(0), "Invalid recipient address");
            require(recipients[i].amount > 0, "Airdrop amount must be greater than 0");
        }
    }
    function _configurePremiumFeatures(
        address deployedContract,
        string[] memory premiumFeatures,
        PremiumConfig memory premiumConfig
    ) internal {
        for (uint i = 0; i < premiumFeatures.length; i++) {
            string memory feature = premiumFeatures[i];
            if (keccak256(bytes(feature)) == keccak256(bytes("whitelist"))) {
                _configureWhitelist(deployedContract, premiumConfig.whitelist);
            } else if (keccak256(bytes(feature)) == keccak256(bytes("blacklist"))) {
                _configureBlacklist(deployedContract, premiumConfig.blacklist);
            } else if (keccak256(bytes(feature)) == keccak256(bytes("tax"))) {
                _configureTax(deployedContract, premiumConfig.tax);
            } else if (keccak256(bytes(feature)) == keccak256(bytes("capped"))) {
                _configureCapped(deployedContract, premiumConfig.capped);
            } else if (keccak256(bytes(feature)) == keccak256(bytes("vesting"))) {
                _configureVesting(deployedContract, premiumConfig.vesting);
            } else if (keccak256(bytes(feature)) == keccak256(bytes("multisig"))) {
                _configureMultisig(deployedContract, premiumConfig.multisig);
            } else if (keccak256(bytes(feature)) == keccak256(bytes("airdrop"))) {
                _configureAirdrop(deployedContract, premiumConfig.airdrop);
            } else if (keccak256(bytes(feature)) == keccak256(bytes("timelock"))) {
                _configureTimelock(deployedContract, premiumConfig.timelock);
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
            emit PremiumFeatureConfigured(deployedContract, "whitelist", config.addresses.length);
        }
    }
    function _configureBlacklist(address deployedContract, BlacklistConfig memory config) internal {
        if (config.addresses.length > 0) {
            (bool success, ) = deployedContract.call(
                abi.encodeWithSignature("addMultipleToBlacklist(address[])", config.addresses)
            );
            emit PremiumFeatureConfigured(deployedContract, "blacklist", config.addresses.length);
        }
    }
    function _configureTax(address deployedContract, TaxConfig memory config) internal {
        if (config.rate > 0 && config.recipient != address(0)) {
            deployedContract.call(abi.encodeWithSignature("setTaxRate(uint256)", config.rate));
            deployedContract.call(abi.encodeWithSignature("setTaxRecipient(address)", config.recipient));
            emit PremiumFeatureConfigured(deployedContract, "tax", 1);
        }
    }
    function _configureCapped(address deployedContract, CappedConfig memory config) internal {
        if (config.maxSupply > 0) {
            deployedContract.call(abi.encodeWithSignature("setMaxSupply(uint256)", config.maxSupply));
            emit PremiumFeatureConfigured(deployedContract, "capped", 1);
        }
    }
    function _configureVesting(address deployedContract, VestingConfig memory config) internal {
        if (config.schedules.length > 0) {
            for (uint i = 0; i < config.schedules.length; i++) {
                VestingSchedule memory schedule = config.schedules[i];
                deployedContract.call(abi.encodeWithSignature(
                    "addVestingSchedule(address,uint256,uint256,uint256,uint256)",
                    schedule.beneficiary,
                    schedule.amount,
                    schedule.startTime,
                    schedule.duration,
                    schedule.cliff
                ));
            }
            emit PremiumFeatureConfigured(deployedContract, "vesting", config.schedules.length);
        }
    }
    function _configureMultisig(address deployedContract, MultisigConfig memory config) internal {
        if (config.signers.length > 0 && config.threshold > 0) {
            deployedContract.call(abi.encodeWithSignature("setMultisigSigners(address[])", config.signers));
            deployedContract.call(abi.encodeWithSignature("setMultisigThreshold(uint256)", config.threshold));
            emit PremiumFeatureConfigured(deployedContract, "multisig", config.signers.length);
        }
    }
    function _configureAirdrop(address deployedContract, AirdropConfig memory config) internal {
        if (config.recipients.length > 0) {
            address[] memory recipients = new address[](config.recipients.length);
            uint256[] memory amounts = new uint256[](config.recipients.length);
            for (uint i = 0; i < config.recipients.length; i++) {
                recipients[i] = config.recipients[i].recipient;
                amounts[i] = config.recipients[i].amount;
            }
            deployedContract.call(abi.encodeWithSignature("batchAirdrop(address[],uint256[])", recipients, amounts));
            emit PremiumFeatureConfigured(deployedContract, "airdrop", config.recipients.length);
        }
    }
    function _configureTimelock(address deployedContract, TimelockConfig memory config) internal {
        if (config.delay > 0) {
            deployedContract.call(abi.encodeWithSignature("setTimelockDelay(uint256)", config.delay));
            emit PremiumFeatureConfigured(deployedContract, "timelock", 1);
        }
    }
    function getDeployedContractConfig(address contractAddress) external view returns (PremiumConfig memory) {
        return deployedContractConfigs[contractAddress];
    }
    function isContractDeployedByFactory(address contractAddress) external view returns (bool) {
        return deployedContractConfigs[contractAddress].enabledFeatures.length > 0;
    }
}