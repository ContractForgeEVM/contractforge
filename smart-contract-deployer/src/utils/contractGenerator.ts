import type { DeploymentParams, TemplateType, PremiumFeatureConfig } from '../types'
export const generateContract = (params: DeploymentParams): string => {
  const { template, params: contractParams, premiumFeatures = [], premiumFeatureConfigs } = params
  switch (template) {
    case 'token':
      return generateTokenContract(contractParams, premiumFeatures, premiumFeatureConfigs)
    case 'nft':
      return generateNFTContract(contractParams, premiumFeatures, premiumFeatureConfigs)
    case 'dao':
      return generateDAOContract(contractParams, premiumFeatures, premiumFeatureConfigs)
    case 'lock':
      return generateLockContract(contractParams, premiumFeatures, premiumFeatureConfigs)
    // === NOUVEAUX TEMPLATES ===
    case 'liquidity-pool':
      return generateLiquidityPoolContract(contractParams, premiumFeatures, premiumFeatureConfigs)
    case 'yield-farming':
      return generateYieldFarmingContract(contractParams, premiumFeatures, premiumFeatureConfigs)
    case 'gamefi-token':
      return generateGameFiTokenContract(contractParams, premiumFeatures, premiumFeatureConfigs)
    case 'nft-marketplace':
      return generateNFTMarketplaceContract(contractParams, premiumFeatures, premiumFeatureConfigs)
    case 'revenue-sharing':
      return generateRevenueSharingContract(contractParams, premiumFeatures, premiumFeatureConfigs)
    case 'loyalty-program':
      return generateLoyaltyProgramContract(contractParams, premiumFeatures, premiumFeatureConfigs)
    case 'dynamic-nft':
      return generateDynamicNFTContract(contractParams, premiumFeatures, premiumFeatureConfigs)
    case 'social-token':
      return generateSocialTokenContract(contractParams, premiumFeatures, premiumFeatureConfigs)
    default:
      throw new Error(`Unknown template: ${template}`)
  }
}
export const generateContractCode = (templateType: TemplateType, params: Record<string, any>): string => {
  const deploymentParams: DeploymentParams = {
    template: templateType,
    params,
    chainId: 1,
    premiumFeatures: []
  }
  return generateContract(deploymentParams)
}
function generateTokenContract(params: Record<string, any>, features: string[], premiumFeatureConfigs?: PremiumFeatureConfig): string {
  const imports = ['import "@openzeppelin/contracts/token/ERC20/ERC20.sol";']
  const inheritance = ['ERC20']
  const stateVars: string[] = []
  const constructorBody: string[] = []
  const functions: string[] = []
  if (features.includes('pausable')) {
    imports.push('import "@openzeppelin/contracts/security/Pausable.sol";')
    inheritance.push('Pausable')
  }
  if (features.includes('burnable')) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";')
    inheritance.push('ERC20Burnable')
  }
  if (features.includes('mintable')) {
    imports.push('import "@openzeppelin/contracts/access/Ownable.sol";')
    inheritance.push('Ownable')
  }
  if (features.includes('capped')) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";')
    inheritance.splice(inheritance.indexOf('ERC20'), 1)
    inheritance.push('ERC20Capped')
  }
  if (features.includes('snapshot')) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";')
    inheritance.push('ERC20Snapshot')
  }
  if (features.includes('permit')) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";')
    inheritance.push('ERC20Permit')
  }
  if (features.includes('votes')) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";')
    inheritance.push('ERC20Votes')
  }
  if (features.includes('flashmint')) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20FlashMint.sol";')
    inheritance.push('ERC20FlashMint')
  }
  if (features.includes('whitelist') || features.includes('blacklist') || features.includes('tax') || features.includes('multisig') || features.includes('airdrop')) {
    if (!inheritance.includes('Ownable')) {
      imports.push('import "@openzeppelin/contracts/access/Ownable.sol";')
      inheritance.push('Ownable')
    }
  }
  let constructorInit = ''
  if (features.includes('capped')) {
    constructorInit = `ERC20("${params.name || 'MyToken'}", "${params.symbol || 'MTK'}") ERC20Capped(${params.maxSupply || params.totalSupply || '1000000'} * 10 ** decimals())`
  } else {
    constructorInit = `ERC20("${params.name || 'MyToken'}", "${params.symbol || 'MTK'}")`
  }
  if (features.includes('permit')) {
    constructorInit += ` ERC20Permit("${params.name || 'MyToken'}")`
  }
  if (features.includes('mintable') || features.includes('whitelist') || features.includes('blacklist') || features.includes('tax') || features.includes('multisig') || features.includes('airdrop')) {
    constructorInit += ' Ownable()'
  }
  const decimals = params.decimals || 18
  const totalSupply = params.totalSupply || '1000000'
  constructorBody.push(`_mint(msg.sender, ${totalSupply} * 10 ** ${decimals});`)
  if (features.includes('whitelist')) {
    stateVars.push('mapping(address => bool) private _whitelist;')
    stateVars.push('bool public whitelistEnabled = true;')
    functions.push(`
    modifier onlyWhitelisted(address account) {
        require(!whitelistEnabled || _whitelist[account], "Address not whitelisted");
        _;
    }
    function addToWhitelist(address account) public onlyOwner {
        _whitelist[account] = true;
        emit WhitelistAdded(account);
    }
    function removeFromWhitelist(address account) public onlyOwner {
        _whitelist[account] = false;
        emit WhitelistRemoved(account);
    }
    function addMultipleToWhitelist(address[] memory accounts) public onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            _whitelist[accounts[i]] = true;
            emit WhitelistAdded(accounts[i]);
        }
    }
    function isWhitelisted(address account) public view returns (bool) {
        return _whitelist[account];
    }
    function enableWhitelist() public onlyOwner {
        whitelistEnabled = true;
        emit WhitelistEnabled();
    }
    function disableWhitelist() public onlyOwner {
        whitelistEnabled = false;
        emit WhitelistDisabled();
    }
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        virtual
        override${features.includes('pausable') ? '(ERC20, Pausable)' : ''}
    {
        super._beforeTokenTransfer(from, to, amount);
        if (whitelistEnabled && from != address(0) && to != address(0)) {
            require(_whitelist[from], "Transfer from non-whitelisted address");
            require(_whitelist[to], "Transfer to non-whitelisted address");
        }
    }
    event WhitelistAdded(address indexed account);
    event WhitelistRemoved(address indexed account);
    event WhitelistEnabled();
    event WhitelistDisabled();`)
  }
  if (features.includes('blacklist')) {
    stateVars.push('mapping(address => bool) private _blacklist;')
    functions.push(`
    modifier notBlacklisted(address account) {
        require(!_blacklist[account], "Address is blacklisted");
        _;
    }
    function addToBlacklist(address account) public onlyOwner {
        _blacklist[account] = true;
        emit BlacklistAdded(account);
    }
    function removeFromBlacklist(address account) public onlyOwner {
        _blacklist[account] = false;
        emit BlacklistRemoved(account);
    }
    function addMultipleToBlacklist(address[] memory accounts) public onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            _blacklist[accounts[i]] = true;
            emit BlacklistAdded(accounts[i]);
        }
    }
    function isBlacklisted(address account) public view returns (bool) {
        return _blacklist[account];
    }
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        virtual
        override${features.includes('pausable') ? '(ERC20, Pausable)' : ''}
    {
        super._beforeTokenTransfer(from, to, amount);
        if (from != address(0) && to != address(0)) {
            require(!_blacklist[from], "Transfer from blacklisted address");
            require(!_blacklist[to], "Transfer to blacklisted address");
        }
    }
    event BlacklistAdded(address indexed account);
    event BlacklistRemoved(address indexed account);`)
  }
  if (features.includes('tax')) {
          stateVars.push('uint256 public taxRate = 0;') 
    stateVars.push('address public taxRecipient = address(0);')
    functions.push(`
    function setTaxRate(uint256 _taxRate) public onlyOwner {
        require(_taxRate <= 2500, "Tax rate cannot exceed 25%");
        taxRate = _taxRate;
        emit TaxRateUpdated(_taxRate);
    }
    function setTaxRecipient(address _taxRecipient) public onlyOwner {
        require(_taxRecipient != address(0), "Invalid tax recipient");
        taxRecipient = _taxRecipient;
        emit TaxRecipientUpdated(_taxRecipient);
    }
    function _transfer(address from, address to, uint256 amount)
        internal
        virtual
        override
    {
        if (taxRate > 0 && taxRecipient != address(0) && from != address(0) && to != address(0)) {
            uint256 taxAmount = (amount * taxRate) / 10000;
            uint256 transferAmount = amount - taxAmount;
            super._transfer(from, taxRecipient, taxAmount);
            super._transfer(from, to, transferAmount);
        } else {
            super._transfer(from, to, amount);
        }
    }
    event TaxRateUpdated(uint256 newRate);
    event TaxRecipientUpdated(address indexed newRecipient);`)
  }
  if (features.includes('multisig')) {
    stateVars.push('address[] public multisigSigners;')
    stateVars.push('uint256 public multisigThreshold;')
    stateVars.push('mapping(bytes32 => mapping(address => bool)) public hasConfirmed;')
    stateVars.push('mapping(bytes32 => uint256) public confirmations;')
    functions.push(`
    modifier onlyMultisigSigner() {
        bool isSigner = false;
        for (uint256 i = 0; i < multisigSigners.length; i++) {
            if (multisigSigners[i] == msg.sender) {
                isSigner = true;
                break;
            }
        }
        require(isSigner, "Only multisig signer");
        _;
    }
    function setMultisigSigners(address[] memory _signers) public onlyOwner {
        require(_signers.length > 0, "At least one signer required");
        multisigSigners = _signers;
        emit MultisigSignersUpdated(_signers);
    }
    function setMultisigThreshold(uint256 _threshold) public onlyOwner {
        require(_threshold > 0 && _threshold <= multisigSigners.length, "Invalid threshold");
        multisigThreshold = _threshold;
        emit MultisigThresholdUpdated(_threshold);
    }
    function confirmTransaction(bytes32 transactionHash) public onlyMultisigSigner {
        require(!hasConfirmed[transactionHash][msg.sender], "Already confirmed");
        hasConfirmed[transactionHash][msg.sender] = true;
        confirmations[transactionHash]++;
        emit TransactionConfirmed(transactionHash, msg.sender);
    }
    function revokeConfirmation(bytes32 transactionHash) public onlyMultisigSigner {
        require(hasConfirmed[transactionHash][msg.sender], "Not confirmed");
        hasConfirmed[transactionHash][msg.sender] = false;
        confirmations[transactionHash]--;
        emit TransactionConfirmationRevoked(transactionHash, msg.sender);
    }
    function isTransactionConfirmed(bytes32 transactionHash) public view returns (bool) {
        return confirmations[transactionHash] >= multisigThreshold;
    }
    event MultisigSignersUpdated(address[] signers);
    event MultisigThresholdUpdated(uint256 threshold);
    event TransactionConfirmed(bytes32 indexed transactionHash, address indexed signer);
    event TransactionConfirmationRevoked(bytes32 indexed transactionHash, address indexed signer);`)
  }
  if (features.includes('airdrop')) {
    functions.push(`
    function batchAirdrop(address[] memory recipients, uint256[] memory amounts) public onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty arrays");
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Invalid amount");
            _transfer(msg.sender, recipients[i], amounts[i]);
        }
        emit BatchAirdrop(recipients, amounts);
    }
    event BatchAirdrop(address[] recipients, uint256[] amounts);`)
  }
  if (features.includes('pausable')) {
    functions.push(`
    function pause() public onlyOwner {
        _pause();
    }
    function unpause() public onlyOwner {
        _unpause();
    }${!features.includes('whitelist') && !features.includes('blacklist') ? `
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }` : ''}`)
  }
  if (features.includes('mintable')) {
    functions.push(`
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }`)
  }
  if (features.includes('snapshot')) {
    stateVars.push('uint256 private _currentSnapshotId;')
    functions.push(`
    function snapshot() public onlyOwner returns (uint256) {
        _currentSnapshotId++;
        _snapshot();
        return _currentSnapshotId;
    }
    function getCurrentSnapshotId() public view returns (uint256) {
        return _currentSnapshotId;
    }`)
  }
  if (features.includes('votes')) {
    functions.push(`
    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20${features.includes('snapshot') ? ', ERC20Snapshot' : ''}${features.includes('votes') ? ', ERC20Votes' : ''})
    {
        super._afterTokenTransfer(from, to, amount);
    }
    function _mint(address to, uint256 amount)
        internal
        override(ERC20${features.includes('capped') ? ', ERC20Capped' : ''}${features.includes('votes') ? ', ERC20Votes' : ''})
    {
        super._mint(to, amount);
    }
    function _burn(address account, uint256 amount)
        internal
        override(ERC20${features.includes('votes') ? ', ERC20Votes' : ''})
    {
        super._burn(account, amount);
    }`)
  }
  if (params.decimals && params.decimals !== 18) {
    functions.push(`
    function decimals() public pure override returns (uint8) {
        return ${params.decimals};
    }`)
  }
  return `
pragma solidity ^0.8.20;
${imports.join('\n')}
contract ${(params.name || 'MyToken').replace(/\s+/g, '')} is ${inheritance.join(', ')} {
${stateVars.length > 0 ? '    ' + stateVars.join('\n    ') + '\n' : ''}
    constructor() ${constructorInit} {
${constructorBody.map(line => '        ' + line).join('\n')}
    }
${functions.join('\n')}
}`
}
const generateNFTContract = (params: Record<string, any>, features: string[], premiumFeatureConfigs?: PremiumFeatureConfig): string => {
  const name = (params.name || 'MyNFT').replace(/\s+/g, '')
  const symbol = params.symbol || 'MNFT'
  const maxSupply = params.maxSupply || 10000
  const baseURI = params.baseURI || 'https://api.mynft.com/metadata/'
  
  // Mint pricing configuration
  const mintPrice = params.mintPrice || '0.01' // Default 0.01 ETH
  const maxPerWallet = params.maxPerWallet || 5
  const enablePublicMint = params.enablePublicMint !== false // Default true
  
  const imports = [
    'import "@openzeppelin/contracts/token/ERC721/ERC721.sol";',
    'import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";',
    'import "@openzeppelin/contracts/access/Ownable.sol";',
    'import "@openzeppelin/contracts/security/ReentrancyGuard.sol";',
    'import "@openzeppelin/contracts/utils/Counters.sol";'
  ]

  const inheritances = ['ERC721', 'ERC721Enumerable', 'Ownable', 'ReentrancyGuard']
  
  // Add features based imports
  if (features.includes('uristorage')) {
    imports.push('import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";')
    if (!inheritances.includes('ERC721URIStorage')) {
      inheritances.push('ERC721URIStorage')
    }
  }

  if (features.includes('pausable')) {
    imports.push('import "@openzeppelin/contracts/security/Pausable.sol";')
    if (!inheritances.includes('Pausable')) {
      inheritances.push('Pausable')
    }
  }

  if (features.includes('burnable')) {
    imports.push('import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";')
    if (!inheritances.includes('ERC721Burnable')) {
      inheritances.push('ERC721Burnable')
    }
  }

  // State variables
  const stateVars = [
    'using Counters for Counters.Counter;',
    'Counters.Counter private _tokenIdCounter;',
    `uint256 public constant MAX_SUPPLY = ${maxSupply};`,
    `uint256 public constant MINT_PRICE = ${parseFloat(mintPrice) * 1e18}; // ${mintPrice} ETH`,
    `uint256 public constant MAX_PER_WALLET = ${maxPerWallet};`,
    'string private _baseTokenURI;',
    'bool public publicMintEnabled = true;',
    'mapping(address => uint256) public mintedPerWallet;',
    'address public withdrawAddress;'
  ]

  // Constructor
  const constructorBody = [
    `_baseTokenURI = "${baseURI}";`,
    'withdrawAddress = msg.sender;'
  ]

  // Extensions
  const extensions = []

  // Public mint function
  extensions.push(`
    /**
     * @dev Public mint function - anyone can mint by paying the mint price
     */
    function mint(uint256 quantity) external payable nonReentrant {
        require(publicMintEnabled, "Public mint is not enabled");
        require(quantity > 0 && quantity <= MAX_PER_WALLET, "Invalid quantity");
        require(totalSupply() + quantity <= MAX_SUPPLY, "Exceeds maximum supply");
        require(mintedPerWallet[msg.sender] + quantity <= MAX_PER_WALLET, "Exceeds maximum per wallet");
        require(msg.value >= MINT_PRICE * quantity, "Insufficient payment");
        
        // Update minted count for wallet
        mintedPerWallet[msg.sender] += quantity;
        
        // Mint tokens
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(msg.sender, tokenId);
        }
        
        // Refund excess payment
        if (msg.value > MINT_PRICE * quantity) {
            payable(msg.sender).transfer(msg.value - (MINT_PRICE * quantity));
        }
    }`)

  // Owner mint function
  extensions.push(`
    /**
     * @dev Owner mint function - free mint for owner/airdrops
     */
    function ownerMint(address to, uint256 quantity) external onlyOwner {
        require(quantity > 0, "Quantity must be positive");
        require(totalSupply() + quantity <= MAX_SUPPLY, "Exceeds maximum supply");
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(to, tokenId);
        }
    }`)

  // Batch mint for airdrops
  extensions.push(`
    /**
     * @dev Batch mint for airdrops
     */
    function batchMint(address[] calldata recipients, uint256[] calldata quantities) external onlyOwner {
        require(recipients.length == quantities.length, "Arrays length mismatch");
        
        uint256 totalMinting = 0;
        for (uint256 i = 0; i < quantities.length; i++) {
            totalMinting += quantities[i];
        }
        require(totalSupply() + totalMinting <= MAX_SUPPLY, "Exceeds maximum supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            for (uint256 j = 0; j < quantities[i]; j++) {
                uint256 tokenId = _tokenIdCounter.current();
                _tokenIdCounter.increment();
                _safeMint(recipients[i], tokenId);
            }
        }
    }`)

  // Utility functions
  extensions.push(`
    /**
     * @dev Returns the current total supply
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @dev Returns the base URI for tokens
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Set the base URI (owner only)
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Toggle public mint
     */
    function togglePublicMint() external onlyOwner {
        publicMintEnabled = !publicMintEnabled;
    }
    
    /**
     * @dev Set withdraw address
     */
    function setWithdrawAddress(address newAddress) external onlyOwner {
        require(newAddress != address(0), "Invalid address");
        withdrawAddress = newAddress;
    }
    
    /**
     * @dev Withdraw contract balance
     */
    function withdraw() external onlyOwner {
        require(withdrawAddress != address(0), "Withdraw address not set");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(withdrawAddress).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Get mint info for a wallet
     */
    function getMintInfo(address wallet) external view returns (
        uint256 mintedCount,
        uint256 remainingMints,
        uint256 mintPrice,
        bool canMint
    ) {
        mintedCount = mintedPerWallet[wallet];
        remainingMints = MAX_PER_WALLET - mintedCount;
        mintPrice = MINT_PRICE;
        canMint = publicMintEnabled && remainingMints > 0 && totalSupply() < MAX_SUPPLY;
        
        return (mintedCount, remainingMints, mintPrice, canMint);
    }`)

  // Pausable functions
  if (features.includes('pausable')) {
    extensions.push(`
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }`)
  }

  // Required overrides
  const overrides = []
  
  if (features.includes('uristorage') || features.includes('enumerable')) {
    overrides.push(`
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
        ${features.includes('pausable') ? 'whenNotPaused' : ''}
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }`)
  }

  if (features.includes('uristorage')) {
    overrides.push(`
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }`)
  }

  return `
pragma solidity ^0.8.20;

${imports.join('\n')}

/**
 * @title ${name}
 * @dev ERC721 NFT contract with public minting functionality
 * @notice This contract allows public minting at ${mintPrice} ETH per NFT
 */
contract ${name} is ${inheritances.join(', ')} {
    ${stateVars.join('\n    ')}

    constructor() ERC721("${params.name || 'MyNFT'}", "${symbol}") {
        ${constructorBody.join('\n        ')}
    }

    ${extensions.join('\n')}
    ${overrides.join('\n')}
}
`
}
const generateDAOContract = (params: Record<string, any>, features: string[], premiumFeatureConfigs?: PremiumFeatureConfig): string => {
  const {
    name = 'MyDAO',
    proposalThreshold = '100',
    votingPeriod = '50400'
  } = params
  const imports: string[] = [
    'import "@openzeppelin/contracts/governance/Governor.sol";',
    'import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";',
    'import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";',
    'import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";',
    'import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";'
  ]
  const inheritances: string[] = [
    'Governor',
    'GovernorSettings',
    'GovernorCountingSimple',
    'GovernorVotes',
    'GovernorVotesQuorumFraction'
  ]
  if (features.includes('timelock')) {
    imports.push('import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";')
    inheritances.push('GovernorTimelockControl')
  }
  return `
pragma solidity ^0.8.20;
${imports.join('\n')}
contract ${name.replace(/\s+/g, '')}DAO is ${inheritances.join(', ')} {
    constructor(IVotes _token${features.includes('timelock') ? ', TimelockController _timelock' : ''})
        Governor("${name}")
        GovernorSettings(1, ${votingPeriod}, ${proposalThreshold})
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
        ${features.includes('timelock') ? 'GovernorTimelockControl(_timelock)' : ''}
    {}
    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }
    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }
    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
    ${features.includes('timelock') ? `
    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }
    function _execute(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }
    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }
    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }` : ''}
}`
}
const generateLockContract = (params: Record<string, any>, features: string[], premiumFeatureConfigs?: PremiumFeatureConfig): string => {
  const { tokenAddress = '0x0000000000000000000000000000000000000000',
          beneficiary = '0x0000000000000000000000000000000000000000',
          unlockTime = 'block.timestamp + 365 days' } = params
  let vestingCode = ''
  if (features.includes('vesting')) {
    vestingCode = `
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        uint256 slicePeriod;
    }
    mapping(address => VestingSchedule) public vestingSchedules;
    function createVestingSchedule(
        address _beneficiary,
        uint256 _amount,
        uint256 _duration,
        uint256 _slicePeriod
    ) public {
        require(msg.sender == beneficiary, "Only beneficiary can create vesting");
        require(_amount > 0, "Amount must be > 0");
        require(_duration > 0, "Duration must be > 0");
        vestingSchedules[_beneficiary] = VestingSchedule({
            totalAmount: _amount,
            releasedAmount: 0,
            startTime: block.timestamp,
            duration: _duration,
            slicePeriod: _slicePeriod
        });
    }
    function releaseVested(address _beneficiary) public {
        VestingSchedule storage schedule = vestingSchedules[_beneficiary];
        require(schedule.totalAmount > 0, "No vesting schedule");
        uint256 vestedAmount = computeVestedAmount(schedule);
        uint256 releasableAmount = vestedAmount - schedule.releasedAmount;
        require(releasableAmount > 0, "No tokens to release");
        schedule.releasedAmount += releasableAmount;
        token.transfer(_beneficiary, releasableAmount);
    }
    function computeVestedAmount(VestingSchedule memory schedule) private view returns (uint256) {
        uint256 currentTime = block.timestamp;
        if (currentTime < schedule.startTime) {
            return 0;
        } else if (currentTime >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount;
        } else {
            uint256 timeFromStart = currentTime - schedule.startTime;
            uint256 vestedSlices = timeFromStart / schedule.slicePeriod;
            uint256 totalSlices = schedule.duration / schedule.slicePeriod;
            return (schedule.totalAmount * vestedSlices) / totalSlices;
        }
    }`
  }
  const unlockTimeValue = unlockTime && typeof unlockTime === 'string' && unlockTime.includes('T')
    ? Math.floor(new Date(unlockTime).getTime() / 1000)
    : unlockTime
  return `
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
contract TokenLock is ReentrancyGuard {
    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable unlockTime;
    event TokensReleased(uint256 amount);
    constructor() {
        token = IERC20(${tokenAddress});
        beneficiary = ${beneficiary};
        unlockTime = ${unlockTimeValue || 'block.timestamp + 365 days'};
        require(unlockTime > block.timestamp, "Unlock time must be in the future");
    }
    function release() public nonReentrant {
        require(block.timestamp >= unlockTime, "Tokens are still locked");
        require(msg.sender == beneficiary, "Only beneficiary can release");
        uint256 amount = token.balanceOf(address(this));
        require(amount > 0, "No tokens to release");
        token.transfer(beneficiary, amount);
        emit TokensReleased(amount);
    }
    function getTimeUntilUnlock() public view returns (uint256) {
        if (block.timestamp >= unlockTime) {
            return 0;
        }
        return unlockTime - block.timestamp;
    }
    ${vestingCode}
}`
}

// === NOUVELLES FONCTIONS DE GÉNÉRATION ===

const generateLiquidityPoolContract = (params: Record<string, any>, features: string[], premiumFeatureConfigs?: PremiumFeatureConfig): string => {
  const {
    name = 'LiquidityPool',
    tokenA = '0x0000000000000000000000000000000000000000',
    tokenB = '0x0000000000000000000000000000000000000000',
    fee = '3000',
    initialPrice = '1.0'
  } = params

  const imports = [
    'import "@openzeppelin/contracts/token/ERC20/IERC20.sol";',
    'import "@openzeppelin/contracts/access/Ownable.sol";',
    'import "@openzeppelin/contracts/security/ReentrancyGuard.sol";'
  ]

  const inheritance = ['Ownable', 'ReentrancyGuard']

  if (features.includes('pausable')) {
    imports.push('import "@openzeppelin/contracts/security/Pausable.sol";')
    inheritance.push('Pausable')
  }

  if (features.includes('oracle')) {
    imports.push('import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";')
  }

  return `
pragma solidity ^0.8.20;

${imports.join('\n')}

contract ${name.replace(/\s+/g, '')} is ${inheritance.join(', ')} {
    // Token addresses
    address public immutable tokenA;
    address public immutable tokenB;
    
    // Pool configuration
    uint256 public immutable fee;
    uint256 public initialPrice;
    
    // Pool state
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public totalSupply;
    
    // Fee collector
    address public feeCollector;
    
    ${features.includes('oracle') ? `
    // Oracle integration
    AggregatorV3Interface public priceOracle;
    ` : ''}
    
    // Events
    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 shares);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 shares);
    event Swap(address indexed user, address indexed tokenIn, uint256 amountIn, uint256 amountOut);
    event FeeCollected(uint256 amountA, uint256 amountB);
    
    constructor(
        address _tokenA,
        address _tokenB,
        uint256 _fee,
        uint256 _initialPrice,
        address _feeCollector
    ) Ownable(msg.sender) {
        require(_tokenA != _tokenB, "Tokens must be different");
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token addresses");
        require(_fee >= 500 && _fee <= 10000, "Fee must be between 0.05% and 1%");
        require(_initialPrice > 0, "Initial price must be positive");
        
        tokenA = _tokenA;
        tokenB = _tokenB;
        fee = _fee;
        initialPrice = _initialPrice;
        feeCollector = _feeCollector;
    }
    
    function addLiquidity(
        uint256 amountA,
        uint256 amountB,
        uint256 minShares
    ) external nonReentrant${features.includes('pausable') ? ' whenNotPaused' : ''} returns (uint256 shares) {
        require(amountA > 0 && amountB > 0, "Amounts must be positive");
        
        uint256 _totalSupply = totalSupply;
        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;
        
        if (_totalSupply == 0) {
            shares = sqrt(amountA * amountB);
            require(shares >= minShares, "Insufficient shares");
        } else {
            uint256 sharesA = (amountA * _totalSupply) / _reserveA;
            uint256 sharesB = (amountB * _totalSupply) / _reserveB;
            shares = sharesA < sharesB ? sharesA : sharesB;
            require(shares >= minShares, "Insufficient shares");
        }
        
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);
        
        reserveA += amountA;
        reserveB += amountB;
        totalSupply += shares;
        
        emit LiquidityAdded(msg.sender, amountA, amountB, shares);
    }
    
    function swap(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant${features.includes('pausable') ? ' whenNotPaused' : ''} returns (uint256 amountOut) {
        require(tokenIn == tokenA || tokenIn == tokenB, "Invalid token");
        require(amountIn > 0, "Amount must be positive");
        
        address tokenOut = tokenIn == tokenA ? tokenB : tokenA;
        uint256 reserveIn = tokenIn == tokenA ? reserveA : reserveB;
        uint256 reserveOut = tokenIn == tokenA ? reserveB : reserveA;
        
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn * (10000 - fee);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * 10000 + amountInWithFee);
        
        require(amountOut >= minAmountOut, "Slippage exceeded");
        require(amountOut < reserveOut, "Insufficient output");
        
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        
        if (tokenIn == tokenA) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }
        
        emit Swap(msg.sender, tokenIn, amountIn, amountOut);
    }
    
    function getPrice() external view returns (uint256) {
        if (reserveA == 0 || reserveB == 0) return initialPrice;
        return (reserveB * 1e18) / reserveA;
    }
    
    ${features.includes('pausable') ? `
    function setPaused(bool _paused) external onlyOwner {
        if (_paused) {
            _pause();
        } else {
            _unpause();
        }
    }
    ` : ''}
    
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}`
}

const generateYieldFarmingContract = (params: Record<string, any>, features: string[], premiumFeatureConfigs?: PremiumFeatureConfig): string => {
  const {
    name = 'YieldFarm',
    stakingToken = '0x0000000000000000000000000000000000000000',
    rewardToken = '0x0000000000000000000000000000000000000000',
    rewardRate = '0.001',
    duration = '30'
  } = params

  const imports = [
    'import "@openzeppelin/contracts/token/ERC20/IERC20.sol";',
    'import "@openzeppelin/contracts/access/Ownable.sol";',
    'import "@openzeppelin/contracts/security/ReentrancyGuard.sol";'
  ]

  const inheritance = ['Ownable', 'ReentrancyGuard']
  const stateVars: string[] = []
  const functions: string[] = []

  if (features.includes('pausable')) {
    imports.push('import "@openzeppelin/contracts/security/Pausable.sol";')
    inheritance.push('Pausable')
  }

  if (features.includes('whitelist')) {
    stateVars.push('mapping(address => bool) private _whitelist;')
    stateVars.push('bool public whitelistEnabled = true;')
    functions.push(`
    modifier onlyWhitelisted(address account) {
        require(!whitelistEnabled || _whitelist[account], "Address not whitelisted");
        _;
    }
    function addToWhitelist(address account) public onlyOwner {
        _whitelist[account] = true;
        emit WhitelistAdded(account);
    }
    function removeFromWhitelist(address account) public onlyOwner {
        _whitelist[account] = false;
        emit WhitelistRemoved(account);
    }
    function isWhitelisted(address account) public view returns (bool) {
        return _whitelist[account];
    }
    function enableWhitelist() public onlyOwner {
        whitelistEnabled = true;
        emit WhitelistEnabled();
    }
    function disableWhitelist() public onlyOwner {
        whitelistEnabled = false;
        emit WhitelistDisabled();
    }
    event WhitelistAdded(address indexed account);
    event WhitelistRemoved(address indexed account);
    event WhitelistEnabled();
    event WhitelistDisabled();`)
  }

  if (features.includes('tiered')) {
    stateVars.push('mapping(address => uint256) public userTier;')
    stateVars.push('mapping(uint256 => uint256) public tierMultiplier;')
    functions.push(`
    function setUserTier(address user, uint256 tier) external onlyOwner {
        userTier[user] = tier;
    }
    
    function setTierMultiplier(uint256 tier, uint256 multiplier) external onlyOwner {
        tierMultiplier[tier] = multiplier;
    }
    
    function getTierMultiplier(address user) public view returns (uint256) {
        uint256 tier = userTier[user];
        return tierMultiplier[tier] > 0 ? tierMultiplier[tier] : 100; // Default 100%
    }`)
  }

  if (features.includes('lockup')) {
    stateVars.push('mapping(address => uint256) public lockupEndTime;')
    stateVars.push('uint256 public lockupDuration;')
    functions.push(`
    function setLockupDuration(uint256 duration) external onlyOwner {
        lockupDuration = duration;
    }
    
    function getLockupEndTime(address user) external view returns (uint256) {
        return lockupEndTime[user];
    }
    
    function isLocked(address user) public view returns (bool) {
        return block.timestamp < lockupEndTime[user];
    }`)
  }

  if (features.includes('antiBot')) {
    stateVars.push('mapping(address => uint256) public lastStakeTime;')
    stateVars.push('uint256 public constant MIN_STAKE_INTERVAL = 1 hours;')
  }

  return `
pragma solidity ^0.8.20;

${imports.join('\n')}

contract ${name.replace(/\s+/g, '')} is ${inheritance.join(', ')} {
    // Token addresses
    address public immutable stakingToken;
    address public immutable rewardToken;
    
    // Farming configuration
    uint256 public rewardRate; // tokens per second
    uint256 public startTime;
    uint256 public endTime;
    uint256 public lastUpdateTime;
    
    // Staking state
    uint256 public totalStaked;
    uint256 public rewardPerTokenStored;
    
    // User state
    mapping(address => uint256) public userStaked;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    
    ${stateVars.join('\n    ')}
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    
    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate,
        uint256 _startTime,
        uint256 _endTime
    ) Ownable(msg.sender)${features.includes('pausable') ? ' Pausable()' : ''} {
        require(_stakingToken != address(0) && _rewardToken != address(0), "Invalid token addresses");
        require(_rewardRate > 0, "Reward rate must be positive");
        require(_startTime >= block.timestamp, "Start time must be in the future");
        require(_endTime > _startTime, "End time must be after start time");
        
        stakingToken = _stakingToken;
        rewardToken = _rewardToken;
        rewardRate = _rewardRate;
        startTime = _startTime;
        endTime = _endTime;
        lastUpdateTime = _startTime;
        
        ${features.includes('tiered') ? `
        // Initialize tier multipliers
        tierMultiplier[1] = 100; // 100% for tier 1
        tierMultiplier[2] = 120; // 120% for tier 2
        tierMultiplier[3] = 150; // 150% for tier 3` : ''}
        
        ${features.includes('lockup') ? `
        lockupDuration = 30 days;` : ''}
    }
    
    function stake(uint256 amount) external nonReentrant${features.includes('pausable') ? ' whenNotPaused' : ''}${features.includes('whitelist') ? ' onlyWhitelisted(msg.sender)' : ''} {
        require(block.timestamp >= startTime, "Staking not started");
        require(block.timestamp <= endTime, "Staking ended");
        require(amount > 0, "Amount must be positive");
        ${features.includes('antiBot') ? `
        require(
            block.timestamp >= lastStakeTime[msg.sender] + MIN_STAKE_INTERVAL,
            "Staking too frequent"
        );
        ` : ''}
        
        _updateReward(msg.sender);
        
        userStaked[msg.sender] += amount;
        totalStaked += amount;
        ${features.includes('antiBot') ? 'lastStakeTime[msg.sender] = block.timestamp;' : ''}
        ${features.includes('lockup') ? 'lockupEndTime[msg.sender] = block.timestamp + lockupDuration;' : ''}
        
        IERC20(stakingToken).transferFrom(msg.sender, address(this), amount);
        
        emit Staked(msg.sender, amount);
    }
    
    function withdraw(uint256 amount) external nonReentrant${features.includes('pausable') ? ' whenNotPaused' : ''} {
        require(amount > 0, "Amount must be positive");
        require(userStaked[msg.sender] >= amount, "Insufficient staked amount");
        ${features.includes('lockup') ? `
        require(!isLocked(msg.sender), "Tokens are locked");` : ''}
        
        _updateReward(msg.sender);
        
        userStaked[msg.sender] -= amount;
        totalStaked -= amount;
        
        IERC20(stakingToken).transfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    function claimReward() external nonReentrant${features.includes('pausable') ? ' whenNotPaused' : ''} {
        _updateReward(msg.sender);
        
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        
        ${features.includes('tiered') ? `
        // Apply tier multiplier to rewards
        uint256 multiplier = getTierMultiplier(msg.sender);
        uint256 adjustedReward = (reward * multiplier) / 100;` : `
        uint256 adjustedReward = reward;`}
        
        rewards[msg.sender] = 0;
        
        IERC20(rewardToken).transfer(msg.sender, adjustedReward);
        
        emit RewardPaid(msg.sender, adjustedReward);
    }
    
    function _updateReward(address user) internal {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        
        if (user != address(0)) {
            rewards[user] = earned(user);
            userRewardPerTokenPaid[user] = rewardPerTokenStored;
        }
    }
    
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        if (block.timestamp > endTime) {
            timeElapsed = endTime - lastUpdateTime;
        }
        
        return rewardPerTokenStored + (timeElapsed * rewardRate * 1e18) / totalStaked;
    }
    
    function earned(address user) public view returns (uint256) {
        return (
            userStaked[user] * (rewardPerToken() - userRewardPerTokenPaid[user]) / 1e18
        ) + rewards[user];
    }
    
    ${functions.join('\n    ')}
    
    ${features.includes('pausable') ? `
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }` : ''}
}`
}

const generateGameFiTokenContract = (params: Record<string, any>, features: string[], premiumFeatureConfigs?: PremiumFeatureConfig): string => {
  const {
    name = 'GameToken',
    symbol = 'GAME',
    maxSupply = '1000000',
    mintPrice = '0.01',
    burnRate = '2'
  } = params

  // Utiliser la fonction token existante avec des paramètres spécifiques au GameFi
  return generateTokenContract({
    name,
    symbol,
    totalSupply: maxSupply,
    decimals: 18,
    ...params
  }, [...features, 'burnable', 'mintable'])
}

const generateNFTMarketplaceContract = (params: Record<string, any>, features: string[], premiumFeatureConfigs?: PremiumFeatureConfig): string => {
  const {
    name = 'NFTMarketplace',
    nftContract = '0x0000000000000000000000000000000000000000',
    platformFee = '2.5',
    creatorFee = '5.0'
  } = params

  // Gestion des fonctionnalités premium
  const imports = [
    'import "@openzeppelin/contracts/token/ERC721/IERC721.sol";',
    'import "@openzeppelin/contracts/access/Ownable.sol";',
    'import "@openzeppelin/contracts/security/ReentrancyGuard.sol";'
  ]
  
  const inheritance = ['Ownable', 'ReentrancyGuard']
  const stateVars: string[] = []
  const functions: string[] = []

  // Ajout des fonctionnalités premium
  if (features.includes('pausable')) {
    imports.push('import "@openzeppelin/contracts/security/Pausable.sol";')
    inheritance.push('Pausable')
  }

  if (features.includes('whitelist')) {
    stateVars.push('mapping(address => bool) private _whitelist;')
    stateVars.push('bool public whitelistEnabled = true;')
    functions.push(`
    modifier onlyWhitelisted(address account) {
        require(!whitelistEnabled || _whitelist[account], "Address not whitelisted");
        _;
    }
    function addToWhitelist(address account) public onlyOwner {
        _whitelist[account] = true;
        emit WhitelistAdded(account);
    }
    function removeFromWhitelist(address account) public onlyOwner {
        _whitelist[account] = false;
        emit WhitelistRemoved(account);
    }
    function isWhitelisted(address account) public view returns (bool) {
        return _whitelist[account];
    }
    function enableWhitelist() public onlyOwner {
        whitelistEnabled = true;
        emit WhitelistEnabled();
    }
    function disableWhitelist() public onlyOwner {
        whitelistEnabled = false;
        emit WhitelistDisabled();
    }
    event WhitelistAdded(address indexed account);
    event WhitelistRemoved(address indexed account);
    event WhitelistEnabled();
    event WhitelistDisabled();`)
  }

  if (features.includes('auction')) {
    stateVars.push('mapping(uint256 => Auction) public auctions;')
    stateVars.push('struct Auction {')
    stateVars.push('    address seller;')
    stateVars.push('    uint256 startingPrice;')
    stateVars.push('    uint256 endTime;')
    stateVars.push('    address highestBidder;')
    stateVars.push('    uint256 highestBid;')
    stateVars.push('    bool active;')
    stateVars.push('}')
    functions.push(`
    function createAuction(uint256 tokenId, uint256 startingPrice, uint256 duration) external {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(nftContract.isApprovedForAll(msg.sender, address(this)), "Not approved");
        require(!auctions[tokenId].active, "Auction already exists");
        
        auctions[tokenId] = Auction({
            seller: msg.sender,
            startingPrice: startingPrice,
            endTime: block.timestamp + duration,
            highestBidder: address(0),
            highestBid: 0,
            active: true
        });
        
        emit AuctionCreated(tokenId, startingPrice, duration);
    }
    
    function placeBid(uint256 tokenId) external payable {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.highestBid, "Bid too low");
        
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }
        
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        
        emit BidPlaced(tokenId, msg.sender, msg.value);
    }
    
    function endAuction(uint256 tokenId) external {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        
        auction.active = false;
        
        if (auction.highestBidder != address(0)) {
            nftContract.safeTransferFrom(auction.seller, auction.highestBidder, tokenId);
            uint256 platformFeeAmount = (auction.highestBid * platformFee) / 1000;
            payable(auction.seller).transfer(auction.highestBid - platformFeeAmount);
            payable(owner()).transfer(platformFeeAmount);
            emit AuctionEnded(tokenId, auction.highestBidder, auction.highestBid);
        } else {
            emit AuctionEnded(tokenId, address(0), 0);
        }
    }
    
    event AuctionCreated(uint256 indexed tokenId, uint256 startingPrice, uint256 duration);
    event BidPlaced(uint256 indexed tokenId, address bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address winner, uint256 amount);`)
  }

  if (features.includes('escrow')) {
    stateVars.push('mapping(uint256 => Escrow) public escrows;')
    stateVars.push('struct Escrow {')
    stateVars.push('    address buyer;')
    stateVars.push('    address seller;')
    stateVars.push('    uint256 amount;')
    stateVars.push('    uint256 deadline;')
    stateVars.push('    bool active;')
    stateVars.push('}')
    functions.push(`
    function createEscrow(uint256 tokenId, address buyer) external payable {
        require(tokenPrices[tokenId] > 0, "Token not for sale");
        require(msg.value >= tokenPrices[tokenId], "Insufficient payment");
        require(buyer != address(0), "Invalid buyer");
        
        escrows[tokenId] = Escrow({
            buyer: buyer,
            seller: tokenSellers[tokenId],
            amount: msg.value,
            deadline: block.timestamp + 7 days,
            active: true
        });
        
        delete tokenPrices[tokenId];
        delete tokenSellers[tokenId];
        
        emit EscrowCreated(tokenId, buyer, msg.sender, msg.value);
    }
    
    function releaseEscrow(uint256 tokenId) external {
        Escrow storage escrow = escrows[tokenId];
        require(escrow.active, "Escrow not active");
        require(msg.sender == escrow.buyer, "Only buyer can release");
        
        escrow.active = false;
        nftContract.safeTransferFrom(escrow.seller, escrow.buyer, tokenId);
        
        uint256 platformFeeAmount = (escrow.amount * platformFee) / 1000;
        payable(escrow.seller).transfer(escrow.amount - platformFeeAmount);
        payable(owner()).transfer(platformFeeAmount);
        
        emit EscrowReleased(tokenId, escrow.buyer, escrow.seller);
    }
    
    function cancelEscrow(uint256 tokenId) external {
        Escrow storage escrow = escrows[tokenId];
        require(escrow.active, "Escrow not active");
        require(block.timestamp >= escrow.deadline, "Deadline not reached");
        require(msg.sender == escrow.buyer, "Only buyer can cancel");
        
        escrow.active = false;
        payable(escrow.buyer).transfer(escrow.amount);
        
        emit EscrowCancelled(tokenId, escrow.buyer);
    }
    
    event EscrowCreated(uint256 indexed tokenId, address buyer, address seller, uint256 amount);
    event EscrowReleased(uint256 indexed tokenId, address buyer, address seller);
    event EscrowCancelled(uint256 indexed tokenId, address buyer);`)
  }

  // Construction du code
  const contractCode = `
pragma solidity ^0.8.20;

${imports.join('\n')}

contract ${name.replace(/\s+/g, '')} is ${inheritance.join(', ')} {
    IERC721 public immutable nftContract;
    uint256 public platformFee;
    uint256 public creatorFee;
    
    mapping(uint256 => uint256) public tokenPrices;
    mapping(uint256 => address) public tokenSellers;
    
    ${stateVars.join('\n    ')}
    
    event TokenListed(uint256 indexed tokenId, uint256 price, address seller);
    event TokenSold(uint256 indexed tokenId, uint256 price, address seller, address buyer);
    event TokenDelisted(uint256 indexed tokenId, address seller);
    
    constructor(
        address _nftContract,
        uint256 _platformFee,
        uint256 _creatorFee
    ) Ownable(msg.sender)${features.includes('pausable') ? ' Pausable()' : ''} {
        nftContract = IERC721(_nftContract);
        platformFee = _platformFee;
        creatorFee = _creatorFee;
    }
    
    function listToken(uint256 tokenId, uint256 price) external${features.includes('pausable') ? ' whenNotPaused' : ''}${features.includes('whitelist') ? ' onlyWhitelisted(msg.sender)' : ''} {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(nftContract.isApprovedForAll(msg.sender, address(this)), "Not approved");
        require(price > 0, "Price must be positive");
        
        tokenPrices[tokenId] = price;
        tokenSellers[tokenId] = msg.sender;
        
        emit TokenListed(tokenId, price, msg.sender);
    }
    
    function buyToken(uint256 tokenId) external payable nonReentrant${features.includes('pausable') ? ' whenNotPaused' : ''}${features.includes('whitelist') ? ' onlyWhitelisted(msg.sender)' : ''} {
        require(tokenPrices[tokenId] > 0, "Token not for sale");
        require(msg.value >= tokenPrices[tokenId], "Insufficient payment");
        
        address seller = tokenSellers[tokenId];
        uint256 price = tokenPrices[tokenId];
        
        // Calculate fees
        uint256 platformFeeAmount = (price * platformFee) / 1000;
        uint256 creatorFeeAmount = (price * creatorFee) / 1000;
        uint256 sellerAmount = price - platformFeeAmount - creatorFeeAmount;
        
        // Transfer NFT
        nftContract.safeTransferFrom(seller, msg.sender, tokenId);
        
        // Transfer payments
        payable(seller).transfer(sellerAmount);
        payable(owner()).transfer(platformFeeAmount);
        
        // Clear listing
        delete tokenPrices[tokenId];
        delete tokenSellers[tokenId];
        
        emit TokenSold(tokenId, price, seller, msg.sender);
    }
    
    function delistToken(uint256 tokenId) external {
        require(tokenSellers[tokenId] == msg.sender, "Not token seller");
        
        delete tokenPrices[tokenId];
        delete tokenSellers[tokenId];
        
        emit TokenDelisted(tokenId, msg.sender);
    }
    
    ${functions.join('\n    ')}
    
    ${features.includes('pausable') ? `
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }` : ''}
}`
  
  return contractCode
}

const generateRevenueSharingContract = (params: Record<string, any>, features: string[], premiumFeatureConfigs?: PremiumFeatureConfig): string => {
  const {
    name = 'RevenueToken',
    symbol = 'REV',
    totalSupply = '1000000',
    businessWallet = '0x0000000000000000000000000000000000000000',
    distributionPeriod = '30'
  } = params

  // Gestion des fonctionnalités premium
  const imports = [
    'import "@openzeppelin/contracts/token/ERC20/ERC20.sol";',
    'import "@openzeppelin/contracts/access/Ownable.sol";'
  ]
  
  const inheritance = ['ERC20', 'Ownable']
  const stateVars: string[] = []
  const functions: string[] = []

  // Ajout des fonctionnalités premium
  if (features.includes('pausable')) {
    imports.push('import "@openzeppelin/contracts/security/Pausable.sol";')
    inheritance.push('Pausable')
  }

  if (features.includes('snapshot')) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";')
    inheritance.push('ERC20Snapshot')
  }

  if (features.includes('accounting')) {
    stateVars.push('mapping(uint256 => Distribution) public distributions;')
    stateVars.push('uint256 public distributionCount;')
    stateVars.push('struct Distribution {')
    stateVars.push('    uint256 amount;')
    stateVars.push('    uint256 timestamp;')
    stateVars.push('    uint256 totalSupply;')
    stateVars.push('    bool processed;')
    stateVars.push('}')
    functions.push(`
    function getDistributionHistory(uint256 start, uint256 end) external view returns (Distribution[] memory) {
        require(end <= distributionCount, "Invalid range");
        Distribution[] memory history = new Distribution[](end - start);
        for (uint256 i = start; i < end; i++) {
            history[i - start] = distributions[i];
        }
        return history;
    }
    
    function getTotalDistributed() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < distributionCount; i++) {
            if (distributions[i].processed) {
                total += distributions[i].amount;
            }
        }
        return total;
    }`)
  }

  if (features.includes('tiered')) {
    stateVars.push('mapping(address => uint256) public userTier;')
    stateVars.push('mapping(uint256 => uint256) public tierMultiplier;')
    stateVars.push('uint256 public tierThreshold;')
    functions.push(`
    function setUserTier(address user, uint256 tier) external onlyOwner {
        userTier[user] = tier;
    }
    
    function setTierMultiplier(uint256 tier, uint256 multiplier) external onlyOwner {
        tierMultiplier[tier] = multiplier;
    }
    
    function setTierThreshold(uint256 threshold) external onlyOwner {
        tierThreshold = threshold;
    }
    
    function getTierMultiplier(address user) public view returns (uint256) {
        uint256 tier = userTier[user];
        return tierMultiplier[tier] > 0 ? tierMultiplier[tier] : 100; // Default 100%
    }`)
  }

  if (features.includes('rewards')) {
    stateVars.push('mapping(address => uint256) public userRewards;')
    stateVars.push('uint256 public totalRewards;')
    functions.push(`
    function addRewards(address user, uint256 amount) external onlyOwner {
        userRewards[user] += amount;
        totalRewards += amount;
    }
    
    function claimRewards() external {
        uint256 amount = userRewards[msg.sender];
        require(amount > 0, "No rewards to claim");
        
        userRewards[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
    
    function getRewards(address user) external view returns (uint256) {
        return userRewards[user];
    }`)
  }

  // Construction du code
  const contractCode = `
pragma solidity ^0.8.20;

${imports.join('\n')}

contract ${name.replace(/\s+/g, '')} is ${inheritance.join(', ')} {
    address public businessWallet;
    uint256 public distributionPeriod;
    uint256 public lastDistribution;
    uint256 public totalDistributed;
    
    ${stateVars.join('\n    ')}
    
    event RevenueDistributed(uint256 amount, uint256 timestamp);
    ${features.includes('accounting') ? 'event DistributionRecorded(uint256 indexed distributionId, uint256 amount, uint256 timestamp);' : ''}
    ${features.includes('rewards') ? 'event RewardsAdded(address indexed user, uint256 amount);' : ''}
    ${features.includes('rewards') ? 'event RewardsClaimed(address indexed user, uint256 amount);' : ''}
    
    constructor(
        address _businessWallet,
        uint256 _distributionPeriod
    ) ERC20("${name}", "${symbol}") Ownable(msg.sender)${features.includes('pausable') ? ' Pausable()' : ''} {
        businessWallet = _businessWallet;
        distributionPeriod = _distributionPeriod;
        lastDistribution = block.timestamp;
        
        _mint(msg.sender, ${totalSupply} * 10 ** decimals());
        
        ${features.includes('tiered') ? `
        // Initialize tier multipliers
        tierMultiplier[1] = 100; // 100% for tier 1
        tierMultiplier[2] = 120; // 120% for tier 2
        tierMultiplier[3] = 150; // 150% for tier 3
        tierThreshold = 1000 * 10 ** decimals(); // 1000 tokens for tier 2` : ''}
    }
    
    function distributeRevenue() external payable${features.includes('pausable') ? ' whenNotPaused' : ''} {
        require(msg.sender == businessWallet, "Only business wallet");
        require(msg.value > 0, "No revenue to distribute");
        require(block.timestamp >= lastDistribution + distributionPeriod, "Too early");
        
        uint256 totalSupply_ = totalSupply();
        require(totalSupply_ > 0, "No tokens in circulation");
        
        ${features.includes('accounting') ? `
        // Record distribution for accounting
        distributions[distributionCount] = Distribution({
            amount: msg.value,
            timestamp: block.timestamp,
            totalSupply: totalSupply_,
            processed: true
        });
        distributionCount++;
        emit DistributionRecorded(distributionCount - 1, msg.value, block.timestamp);` : ''}
        
        lastDistribution = block.timestamp;
        totalDistributed += msg.value;
        
        emit RevenueDistributed(msg.value, block.timestamp);
    }
    
    function setBusinessWallet(address _businessWallet) external onlyOwner {
        businessWallet = _businessWallet;
    }
    
    ${functions.join('\n    ')}
    
    ${features.includes('pausable') ? `
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }` : ''}
    
    ${features.includes('snapshot') ? `
    function snapshot() external onlyOwner {
        _snapshot();
    }` : ''}
}`
  
  return contractCode
}

const generateLoyaltyProgramContract = (params: Record<string, any>, features: string[], premiumFeatureConfigs?: PremiumFeatureConfig): string => {
  const {
    name = 'LoyaltyProgram',
    pointsPerPurchase = '10',
    redemptionRate = '0.01',
    transferable = false,
    expirable = true
  } = params

  // Gestion des fonctionnalités premium
  const imports = [
    'import "@openzeppelin/contracts/access/Ownable.sol";'
  ]
  
  const inheritance = ['Ownable']
  const stateVars: string[] = []
  const functions: string[] = []

  // Ajout des fonctionnalités premium
  if (features.includes('pausable')) {
    imports.push('import "@openzeppelin/contracts/security/Pausable.sol";')
    inheritance.push('Pausable')
  }

  if (features.includes('tiered')) {
    stateVars.push('mapping(address => uint256) public userTier;')
    stateVars.push('mapping(uint256 => uint256) public tierMultiplier;')
    stateVars.push('uint256 public tierThreshold;')
    functions.push(`
    function setUserTier(address user, uint256 tier) external onlyOwner {
        userTier[user] = tier;
    }
    
    function setTierMultiplier(uint256 tier, uint256 multiplier) external onlyOwner {
        tierMultiplier[tier] = multiplier;
    }
    
    function setTierThreshold(uint256 threshold) external onlyOwner {
        tierThreshold = threshold;
    }
    
    function getTierMultiplier(address user) public view returns (uint256) {
        uint256 tier = userTier[user];
        return tierMultiplier[tier] > 0 ? tierMultiplier[tier] : 100; // Default 100%
    }`)
  }

  if (features.includes('rewards')) {
    stateVars.push('mapping(address => uint256) public userRewards;')
    stateVars.push('uint256 public totalRewards;')
    functions.push(`
    function addRewards(address user, uint256 amount) external onlyOwner {
        userRewards[user] += amount;
        totalRewards += amount;
    }
    
    function claimRewards() external {
        uint256 amount = userRewards[msg.sender];
        require(amount > 0, "No rewards to claim");
        
        userRewards[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
    
    function getRewards(address user) external view returns (uint256) {
        return userRewards[user];
    }`)
  }

  if (features.includes('governance')) {
    stateVars.push('mapping(address => bool) public governors;')
    stateVars.push('uint256 public proposalCount;')
    stateVars.push('mapping(uint256 => Proposal) public proposals;')
    stateVars.push('struct Proposal {')
    stateVars.push('    string description;')
    stateVars.push('    uint256 yesVotes;')
    stateVars.push('    uint256 noVotes;')
    stateVars.push('    uint256 endTime;')
    stateVars.push('    bool executed;')
    stateVars.push('    mapping(address => bool) hasVoted;')
    stateVars.push('}')
    functions.push(`
    function addGovernor(address governor) external onlyOwner {
        governors[governor] = true;
    }
    
    function removeGovernor(address governor) external onlyOwner {
        governors[governor] = false;
    }
    
    function createProposal(string memory description, uint256 duration) external {
        require(governors[msg.sender], "Only governors can create proposals");
        
        proposals[proposalCount] = Proposal({
            description: description,
            yesVotes: 0,
            noVotes: 0,
            endTime: block.timestamp + duration,
            executed: false
        });
        
        proposalCount++;
    }
    
    function vote(uint256 proposalId, bool support) external {
        require(governors[msg.sender], "Only governors can vote");
        require(proposalId < proposalCount, "Invalid proposal");
        require(block.timestamp < proposals[proposalId].endTime, "Voting ended");
        require(!proposals[proposalId].hasVoted[msg.sender], "Already voted");
        
        proposals[proposalId].hasVoted[msg.sender] = true;
        
        if (support) {
            proposals[proposalId].yesVotes++;
        } else {
            proposals[proposalId].noVotes++;
        }
    }`)
  }

  // Construction du code
  const contractCode = `
pragma solidity ^0.8.20;

${imports.join('\n')}

contract ${name.replace(/\s+/g, '')} is ${inheritance.join(', ')} {
    string public programName;
    uint256 public pointsPerPurchase;
    uint256 public redemptionRate;
    bool public transferable;
    bool public expirable;
    
    mapping(address => uint256) public points;
    mapping(address => uint256) public lastActivity;
    
    ${stateVars.join('\n    ')}
    
    event PointsEarned(address indexed user, uint256 amount, uint256 total);
    event PointsRedeemed(address indexed user, uint256 amount, uint256 total);
    event PointsTransferred(address indexed from, address indexed to, uint256 amount);
    ${features.includes('rewards') ? 'event RewardsAdded(address indexed user, uint256 amount);' : ''}
    ${features.includes('rewards') ? 'event RewardsClaimed(address indexed user, uint256 amount);' : ''}
    ${features.includes('governance') ? 'event ProposalCreated(uint256 indexed proposalId, string description);' : ''}
    ${features.includes('governance') ? 'event Voted(uint256 indexed proposalId, address indexed voter, bool support);' : ''}
    
    constructor(
        string memory _programName,
        uint256 _pointsPerPurchase,
        uint256 _redemptionRate,
        bool _transferable,
        bool _expirable
    ) Ownable(msg.sender)${features.includes('pausable') ? ' Pausable()' : ''} {
        programName = _programName;
        pointsPerPurchase = _pointsPerPurchase;
        redemptionRate = _redemptionRate;
        transferable = _transferable;
        expirable = _expirable;
        
        ${features.includes('tiered') ? `
        // Initialize tier multipliers
        tierMultiplier[1] = 100; // 100% for tier 1
        tierMultiplier[2] = 120; // 120% for tier 2
        tierMultiplier[3] = 150; // 150% for tier 3
        tierThreshold = 1000; // 1000 points for tier 2` : ''}
        
        ${features.includes('governance') ? `
        // Add deployer as first governor
        governors[msg.sender] = true;` : ''}
    }
    
    function earnPoints(address user, uint256 purchaseAmount) external onlyOwner${features.includes('pausable') ? ' whenNotPaused' : ''} {
        uint256 basePoints = (purchaseAmount * pointsPerPurchase) / 100;
        
        ${features.includes('tiered') ? `
        // Apply tier multiplier
        uint256 multiplier = getTierMultiplier(user);
        uint256 pointsToAdd = (basePoints * multiplier) / 100;` : `
        uint256 pointsToAdd = basePoints;`}
        
        points[user] += pointsToAdd;
        lastActivity[user] = block.timestamp;
        
        emit PointsEarned(user, pointsToAdd, points[user]);
    }
    
    function redeemPoints(uint256 amount) external${features.includes('pausable') ? ' whenNotPaused' : ''} {
        require(points[msg.sender] >= amount, "Insufficient points");
        
        points[msg.sender] -= amount;
        lastActivity[msg.sender] = block.timestamp;
        
        emit PointsRedeemed(msg.sender, amount, points[msg.sender]);
    }
    
    ${transferable ? `
    function transferPoints(address to, uint256 amount) external${features.includes('pausable') ? ' whenNotPaused' : ''} {
        require(transferable, "Points not transferable");
        require(points[msg.sender] >= amount, "Insufficient points");
        
        points[msg.sender] -= amount;
        points[to] += amount;
        
        emit PointsTransferred(msg.sender, to, amount);
    }` : ''}
    
    ${functions.join('\n    ')}
    
    ${features.includes('pausable') ? `
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }` : ''}
}`
  
  return contractCode
}

const generateDynamicNFTContract = (params: Record<string, any>, features: string[], premiumFeatureConfigs?: PremiumFeatureConfig): string => {
  const {
    name = 'DynamicNFT',
    symbol = 'DNFT',
    maxSupply = '10000',
    evolvable = true,
    mergeable = false
  } = params

  // Gestion des fonctionnalités premium
  const imports = [
    'import "@openzeppelin/contracts/token/ERC721/ERC721.sol";',
    'import "@openzeppelin/contracts/access/Ownable.sol";'
  ]
  
  const inheritance = ['ERC721', 'Ownable']
  const stateVars: string[] = []
  const functions: string[] = []

  // Ajout des fonctionnalités premium
  if (features.includes('pausable')) {
    imports.push('import "@openzeppelin/contracts/security/Pausable.sol";')
    inheritance.push('Pausable')
  }

  if (features.includes('evolution')) {
    stateVars.push('mapping(uint256 => uint256) public evolutionStage;')
    stateVars.push('mapping(uint256 => uint256) public evolutionCooldown;')
    stateVars.push('uint256 public evolutionCost;')
    functions.push(`
    function evolve(uint256 tokenId) external payable {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(msg.value >= evolutionCost, "Insufficient evolution cost");
        require(block.timestamp >= evolutionCooldown[tokenId], "Evolution cooldown active");
        
        evolutionStage[tokenId]++;
        evolutionCooldown[tokenId] = block.timestamp + 1 days;
        
        emit TokenEvolved(tokenId, evolutionStage[tokenId], msg.value);
    }
    
    function setEvolutionCost(uint256 cost) external onlyOwner {
        evolutionCost = cost;
    }
    
    function getEvolutionStage(uint256 tokenId) external view returns (uint256) {
        return evolutionStage[tokenId];
    }`)
  }

  if (features.includes('breeding')) {
    stateVars.push('mapping(uint256 => uint256) public breedingCooldown;')
    stateVars.push('mapping(uint256 => uint256) public breedingCost;')
    stateVars.push('uint256 public breedingFee;')
    functions.push(`
    function breed(uint256 parent1, uint256 parent2) external payable {
        require(_exists(parent1) && _exists(parent2), "Token does not exist");
        require(ownerOf(parent1) == msg.sender && ownerOf(parent2) == msg.sender, "Not token owner");
        require(parent1 != parent2, "Cannot breed same token");
        require(block.timestamp >= breedingCooldown[parent1], "Parent 1 cooldown active");
        require(block.timestamp >= breedingCooldown[parent2], "Parent 2 cooldown active");
        require(msg.value >= breedingFee, "Insufficient breeding fee");
        require(currentSupply < maxSupply, "Max supply reached");
        
        uint256 newTokenId = currentSupply;
        currentSupply++;
        
        _mint(msg.sender, newTokenId);
        
        // Set cooldowns
        breedingCooldown[parent1] = block.timestamp + 7 days;
        breedingCooldown[parent2] = block.timestamp + 7 days;
        breedingCooldown[newTokenId] = block.timestamp + 14 days;
        
        emit TokensBred(parent1, parent2, newTokenId, msg.value);
    }
    
    function setBreedingFee(uint256 fee) external onlyOwner {
        breedingFee = fee;
    }
    
    function getBreedingCooldown(uint256 tokenId) external view returns (uint256) {
        return breedingCooldown[tokenId];
    }`)
  }

  if (features.includes('auction')) {
    stateVars.push('mapping(uint256 => Auction) public auctions;')
    stateVars.push('struct Auction {')
    stateVars.push('    address seller;')
    stateVars.push('    uint256 startingPrice;')
    stateVars.push('    uint256 endTime;')
    stateVars.push('    address highestBidder;')
    stateVars.push('    uint256 highestBid;')
    stateVars.push('    bool active;')
    stateVars.push('}')
    functions.push(`
    function createAuction(uint256 tokenId, uint256 startingPrice, uint256 duration) external {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(!auctions[tokenId].active, "Auction already exists");
        
        auctions[tokenId] = Auction({
            seller: msg.sender,
            startingPrice: startingPrice,
            endTime: block.timestamp + duration,
            highestBidder: address(0),
            highestBid: 0,
            active: true
        });
        
        emit AuctionCreated(tokenId, startingPrice, duration);
    }
    
    function placeBid(uint256 tokenId) external payable {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.highestBid, "Bid too low");
        
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }
        
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        
        emit BidPlaced(tokenId, msg.sender, msg.value);
    }
    
    function endAuction(uint256 tokenId) external {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        
        auction.active = false;
        
        if (auction.highestBidder != address(0)) {
            _transfer(auction.seller, auction.highestBidder, tokenId);
            payable(auction.seller).transfer(auction.highestBid);
            emit AuctionEnded(tokenId, auction.highestBidder, auction.highestBid);
        } else {
            emit AuctionEnded(tokenId, address(0), 0);
        }
    }`)
  }

  // Construction du code
  const contractCode = `
pragma solidity ^0.8.20;

${imports.join('\n')}

contract ${name.replace(/\s+/g, '')} is ${inheritance.join(', ')} {
    uint256 public maxSupply;
    uint256 public currentSupply;
    
    mapping(uint256 => uint256) public tokenLevel;
    mapping(uint256 => uint256) public tokenExperience;
    mapping(uint256 => string) public tokenMetadata;
    
    ${stateVars.join('\n    ')}
    
    ${evolvable ? `
    event TokenEvolved(uint256 indexed tokenId, uint256 newLevel, uint256 experience);
    ` : ''}
    
    ${mergeable ? `
    event TokensMerged(uint256 indexed token1, uint256 indexed token2, uint256 newToken);
    ` : ''}
    
    ${features.includes('evolution') ? `
    event TokenEvolved(uint256 indexed tokenId, uint256 newStage, uint256 cost);
    ` : ''}
    
    ${features.includes('breeding') ? `
    event TokensBred(uint256 indexed parent1, uint256 indexed parent2, uint256 newToken, uint256 cost);
    ` : ''}
    
    ${features.includes('auction') ? `
    event AuctionCreated(uint256 indexed tokenId, uint256 startingPrice, uint256 duration);
    event BidPlaced(uint256 indexed tokenId, address bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address winner, uint256 amount);
    ` : ''}
    
    constructor() ERC721("${name}", "${symbol}") Ownable(msg.sender)${features.includes('pausable') ? ' Pausable()' : ''} {
        maxSupply = ${maxSupply};
        
        ${features.includes('evolution') ? `
        evolutionCost = 0.01 ether;` : ''}
        
        ${features.includes('breeding') ? `
        breedingFee = 0.02 ether;` : ''}
    }
    
    function mint() external${features.includes('pausable') ? ' whenNotPaused' : ''} {
        require(currentSupply < maxSupply, "Max supply reached");
        require(msg.sender == owner(), "Only owner can mint");
        
        _mint(msg.sender, currentSupply);
        currentSupply++;
    }
    
    ${evolvable ? `
    function evolve(uint256 tokenId) external${features.includes('pausable') ? ' whenNotPaused' : ''} {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        uint256 experience = tokenExperience[tokenId];
        uint256 currentLevel = tokenLevel[tokenId];
        uint256 requiredExp = currentLevel * 100;
        
        require(experience >= requiredExp, "Insufficient experience");
        
        tokenLevel[tokenId] = currentLevel + 1;
        tokenExperience[tokenId] = experience - requiredExp;
        
        emit TokenEvolved(tokenId, tokenLevel[tokenId], tokenExperience[tokenId]);
    }
    
    function addExperience(uint256 tokenId, uint256 amount) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        tokenExperience[tokenId] += amount;
    }` : ''}
    
    ${mergeable ? `
    function mergeTokens(uint256 token1, uint256 token2) external${features.includes('pausable') ? ' whenNotPaused' : ''} {
        require(_exists(token1) && _exists(token2), "Token does not exist");
        require(ownerOf(token1) == msg.sender && ownerOf(token2) == msg.sender, "Not token owner");
        require(token1 != token2, "Cannot merge same token");
        
        uint256 newTokenId = currentSupply;
        currentSupply++;
        
        _burn(token1);
        _burn(token2);
        _mint(msg.sender, newTokenId);
        
        // Combine levels and experience
        tokenLevel[newTokenId] = tokenLevel[token1] + tokenLevel[token2];
        tokenExperience[newTokenId] = tokenExperience[token1] + tokenExperience[token2];
        
        emit TokensMerged(token1, token2, newTokenId);
    }` : ''}
    
    ${functions.join('\n    ')}
    
    ${features.includes('pausable') ? `
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }` : ''}
}`
  
  return contractCode
}

const generateSocialTokenContract = (params: Record<string, any>, features: string[], premiumFeatureConfigs?: PremiumFeatureConfig): string => {
  const {
    creatorName = 'Creator',
    symbol = 'SOCIAL',
    initialSupply = '1000000',
    creatorShare = '20'
  } = params

  // Gestion des fonctionnalités premium
  const imports = [
    'import "@openzeppelin/contracts/token/ERC20/ERC20.sol";',
    'import "@openzeppelin/contracts/access/Ownable.sol";'
  ]
  
  const inheritance = ['ERC20', 'Ownable']
  const stateVars: string[] = []
  const functions: string[] = []

  // Ajout des fonctionnalités premium
  if (features.includes('pausable')) {
    imports.push('import "@openzeppelin/contracts/security/Pausable.sol";')
    inheritance.push('Pausable')
  }

  if (features.includes('governance')) {
    imports.push('import "@openzeppelin/contracts/governance/Governor.sol";')
    imports.push('import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";')
    imports.push('import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";')
    imports.push('import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";')
    imports.push('import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";')
    inheritance.push('Governor', 'GovernorSettings', 'GovernorCountingSimple', 'GovernorVotes', 'GovernorVotesQuorumFraction')
  }

  if (features.includes('tipping')) {
    stateVars.push('mapping(address => uint256) public creatorTips;')
    stateVars.push('uint256 public totalTips;')
    stateVars.push('uint256 public tipFee;')
    functions.push(`
    function tipCreator(string memory message) external payable {
        require(msg.value > 0, "Tip amount must be positive");
        require(msg.value >= tipFee, "Tip amount below minimum");
        
        uint256 tipAmount = msg.value - tipFee;
        creatorTips[creator] += tipAmount;
        totalTips += tipAmount;
        
        payable(creator).transfer(tipAmount);
        
        emit TipReceived(msg.sender, tipAmount, message);
    }
    
    function setTipFee(uint256 fee) external onlyOwner {
        tipFee = fee;
    }
    
    function getCreatorTips() external view returns (uint256) {
        return creatorTips[creator];
    }`)
  }

  if (features.includes('rewards')) {
    stateVars.push('mapping(address => uint256) public userRewards;')
    stateVars.push('uint256 public totalRewards;')
    functions.push(`
    function addRewards(address user, uint256 amount) external onlyOwner {
        userRewards[user] += amount;
        totalRewards += amount;
    }
    
    function claimRewards() external {
        uint256 amount = userRewards[msg.sender];
        require(amount > 0, "No rewards to claim");
        
        userRewards[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
    
    function getRewards(address user) external view returns (uint256) {
        return userRewards[user];
    }`)
  }

  if (features.includes('communityGoverned')) {
    stateVars.push('mapping(address => bool) public communityMembers;')
    stateVars.push('uint256 public proposalCount;')
    stateVars.push('mapping(uint256 => CommunityProposal) public proposals;')
    stateVars.push('struct CommunityProposal {')
    stateVars.push('    string description;')
    stateVars.push('    uint256 yesVotes;')
    stateVars.push('    uint256 noVotes;')
    stateVars.push('    uint256 endTime;')
    stateVars.push('    bool executed;')
    stateVars.push('    mapping(address => bool) hasVoted;')
    stateVars.push('}')
    functions.push(`
    function addCommunityMember(address member) external onlyOwner {
        communityMembers[member] = true;
    }
    
    function removeCommunityMember(address member) external onlyOwner {
        communityMembers[member] = false;
    }
    
    function createCommunityProposal(string memory description, uint256 duration) external {
        require(communityMembers[msg.sender], "Only community members can create proposals");
        
        proposals[proposalCount] = CommunityProposal({
            description: description,
            yesVotes: 0,
            noVotes: 0,
            endTime: block.timestamp + duration,
            executed: false
        });
        
        proposalCount++;
    }
    
    function voteOnProposal(uint256 proposalId, bool support) external {
        require(communityMembers[msg.sender], "Only community members can vote");
        require(proposalId < proposalCount, "Invalid proposal");
        require(block.timestamp < proposals[proposalId].endTime, "Voting ended");
        require(!proposals[proposalId].hasVoted[msg.sender], "Already voted");
        
        proposals[proposalId].hasVoted[msg.sender] = true;
        
        if (support) {
            proposals[proposalId].yesVotes++;
        } else {
            proposals[proposalId].noVotes++;
        }
    }`)
  }

  // Construction du code
  const contractCode = `
pragma solidity ^0.8.20;

${imports.join('\n')}

contract ${creatorName.replace(/\s+/g, '')}Token is ${inheritance.join(', ')} {
    address public creator;
    uint256 public creatorShare;
    uint256 public totalTips;
    
    ${stateVars.join('\n    ')}
    
    event TipReceived(address indexed from, uint256 amount, string message);
    event CreatorShareWithdrawn(uint256 amount);
    ${features.includes('rewards') ? 'event RewardsAdded(address indexed user, uint256 amount);' : ''}
    ${features.includes('rewards') ? 'event RewardsClaimed(address indexed user, uint256 amount);' : ''}
    ${features.includes('communityGoverned') ? 'event CommunityProposalCreated(uint256 indexed proposalId, string description);' : ''}
    ${features.includes('communityGoverned') ? 'event CommunityVoted(uint256 indexed proposalId, address indexed voter, bool support);' : ''}
    
    constructor(
        address _creator,
        uint256 _creatorShare
    ) ERC20("${creatorName} Token", "${symbol}") Ownable(msg.sender)${features.includes('pausable') ? ' Pausable()' : ''}${features.includes('governance') ? ' Governor("${creatorName} Governor") GovernorSettings(1, 50400, 0) GovernorVotesQuorumFraction(4)' : ''} {
        creator = _creator;
        creatorShare = _creatorShare;
        
        // Mint initial supply to creator
        uint256 creatorAmount = (${initialSupply} * 10 ** decimals() * _creatorShare) / 100;
        _mint(creator, creatorAmount);
        
        // Mint remaining to deployer for distribution
        _mint(msg.sender, ${initialSupply} * 10 ** decimals() - creatorAmount);
        
        ${features.includes('tipping') ? `
        tipFee = 0.001 ether;` : ''}
        
        ${features.includes('communityGoverned') ? `
        // Add deployer as first community member
        communityMembers[msg.sender] = true;` : ''}
    }
    
    function tipCreator(string memory message) external payable${features.includes('pausable') ? ' whenNotPaused' : ''} {
        require(msg.value > 0, "Tip amount must be positive");
        
        ${features.includes('tipping') ? `
        require(msg.value >= tipFee, "Tip amount below minimum");
        uint256 tipAmount = msg.value - tipFee;
        creatorTips[creator] += tipAmount;
        totalTips += tipAmount;
        payable(creator).transfer(tipAmount);
        emit TipReceived(msg.sender, tipAmount, message);` : `
        totalTips += msg.value;
        payable(creator).transfer(msg.value);
        emit TipReceived(msg.sender, msg.value, message);`}
    }
    
    function withdrawCreatorShare() external${features.includes('pausable') ? ' whenNotPaused' : ''} {
        require(msg.sender == creator, "Only creator can withdraw");
        
        uint256 balance = balanceOf(creator);
        require(balance > 0, "No tokens to withdraw");
        
        _transfer(creator, msg.sender, balance);
        
        emit CreatorShareWithdrawn(balance);
    }
    
    ${functions.join('\n    ')}
    
    ${features.includes('pausable') ? `
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }` : ''}
    
    ${features.includes('governance') ? `
    // Governance functions
    function votingDelay() public pure override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }
    
    function votingPeriod() public pure override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }
    
    function quorum(uint256 blockNumber) public pure override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }
    
    function state(uint256 proposalId) public view override(Governor) returns (ProposalState) {
        return super.state(proposalId);
    }
    
    function propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) public override(Governor) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }
    
    function proposalThreshold() public pure override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
    
    function _execute(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) internal override(Governor) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }
    
    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) internal override(Governor) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }
    
    function _executor() internal view override(Governor) returns (address) {
        return super._executor();
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(Governor) returns (bool) {
        return super.supportsInterface(interfaceId);
    }` : ''}
}`
  
  return contractCode
}