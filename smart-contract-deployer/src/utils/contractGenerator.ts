import type { DeploymentParams, TemplateType } from '../types'
export const generateContract = (params: DeploymentParams): string => {
  const { template, params: contractParams, premiumFeatures = [] } = params
  switch (template) {
    case 'token':
      return generateTokenContract(contractParams, premiumFeatures)
    case 'nft':
      return generateNFTContract(contractParams, premiumFeatures)
    case 'dao':
      return generateDAOContract(contractParams, premiumFeatures)
    case 'lock':
      return generateLockContract(contractParams, premiumFeatures)
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
function generateTokenContract(params: Record<string, any>, features: string[]): string {
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
const generateNFTContract = (params: Record<string, any>, features: string[]): string => {
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
const generateDAOContract = (params: Record<string, any>, features: string[]): string => {
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
const generateLockContract = (params: Record<string, any>, features: string[]): string => {
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