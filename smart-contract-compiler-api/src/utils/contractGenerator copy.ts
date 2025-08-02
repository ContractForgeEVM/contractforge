function generateNFTFunctions(features: string[]): string {
  const functions = []
  const hasReentrancy = features.includes('reentrancy') || features.includes('mint') || features.includes('auction')
  
  functions.push(`
    function mint(uint256 quantity) external payable${hasReentrancy ? ' nonReentrant' : ''} {
        require(publicMintEnabled, "Public mint disabled");
        require(quantity > 0 && quantity <= MAX_PER_WALLET, "Invalid quantity");
        require(totalSupply() + quantity <= MAX_SUPPLY, "Exceeds max supply");
        require(mintedPerWallet[msg.sender] + quantity <= MAX_PER_WALLET, "Exceeds max per wallet");
        require(msg.value >= MINT_PRICE * quantity, "Insufficient payment");
        
        ${features.includes('whitelist') ? 'if (whitelistEnabled) require(_whitelist[msg.sender], "Not whitelisted");' : ''}
        ${features.includes('blacklist') ? 'if (blacklistEnabled) require(!_blacklist[msg.sender], "Blacklisted");' : ''}
        
        mintedPerWallet[msg.sender] += quantity;
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = ++_tokenIdCounter;
            _safeMint(msg.sender, tokenId);
        }
        
        ${features.includes('rewards') ? 'if (rewardsEnabled) userRewards[msg.sender] += rewardPerMint * quantity;' : ''}
        
        if (msg.value > MINT_PRICE * quantity) {
            payable(msg.sender).transfer(msg.value - MINT_PRICE * quantity);
        }
    }`)

  functions.push(`
    function ownerMint(address to, uint256 quantity) external onlyOwner {
        require(quantity > 0, "Invalid quantity");
        require(totalSupply() + quantity <= MAX_SUPPLY, "Exceeds max supply");
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = ++_tokenIdCounter;
            _safeMint(to, tokenId);
        }
    }`)

  if (features.includes('whitelist')) {
    functions.push(`
    function addToWhitelist(address account) external onlyOwner {
        _whitelist[account] = true;
        emit WhitelistAdded(account);
    }

    function removeFromWhitelist(address account) external onlyOwner {
        _whitelist[account] = false;
    }

    function isWhitelisted(address account) external view returns (bool) {
        return _whitelist[account];
    }`)
  }

  if (features.includes('blacklist')) {
    functions.push(`
    function addToBlacklist(address account) external onlyOwner {
        _blacklist[account] = true;
        emit BlacklistAdded(account);
    }

    function removeFromBlacklist(address account) external onlyOwner {
        _blacklist[account] = false;
    }

    function isBlacklisted(address account) external view returns (bool) {
        return _blacklist[account];
    }`)
  }

  if (features.includes('royalties')) {
    functions.push(`
    function setDefaultRoyalty(address recipient, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(recipient, feeNumerator);
    }

    function setTokenRoyalty(uint256 tokenId, address recipient, uint96 feeNumerator) external onlyOwner {
        _setTokenRoyalty(tokenId, recipient, feeNumerator);
    }`)
  }

  if (features.includes('auction')) {
    functions.push(`
    function createAuction(uint256 tokenId, uint256 startingPrice) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(!auctions[tokenId].active, "Auction exists");
        require(startingPrice >= minimumStartingPrice, "Price too low");
        
        auctions[tokenId] = Auction({
            seller: msg.sender,
            startingPrice: startingPrice,
            endTime: block.timestamp + defaultAuctionDuration,
            highestBidder: address(0),
            highestBid: 0,
            active: true
        });
        
        emit AuctionCreated(tokenId, startingPrice, defaultAuctionDuration);
    }

    function placeBid(uint256 tokenId) external payable {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "No active auction");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.highestBid, "Bid too low");
        
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }
        
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
    }`)
  }

  if (features.includes('staking')) {
    functions.push(`
    function stakeToken(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(stakedTokens[tokenId] == address(0), "Already staked");
        
        stakedTokens[tokenId] = msg.sender;
        userStakedTokens[msg.sender].push(tokenId);
    }

    function unstakeToken(uint256 tokenId) external {
        require(stakedTokens[tokenId] == msg.sender, "Not staker");
        
        stakedTokens[tokenId] = address(0);
        // Remove from user's staked tokens array (simplified)
        delete userStakedTokens[msg.sender];
    }`)
  }

  if (features.includes('uristorage')) {
    functions.push(`
    function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _setTokenURI(tokenId, _tokenURI);
    }

    function batchSetTokenURI(uint256[] calldata tokenIds, string[] calldata tokenURIs) external onlyOwner {
        require(tokenIds.length == tokenURIs.length, "Array length mismatch");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_ownerOf(tokenIds[i]) != address(0), "Token does not exist");
            _setTokenURI(tokenIds[i], tokenURIs[i]);
        }
    }`)
  }

  if (features.includes('oracle')) {
    functions.push(`
    function setPriceFeed(address _priceFeed) external onlyOwner {
        require(_priceFeed != address(0), "Invalid price feed address");
        priceFeed = AggregatorV3Interface(_priceFeed);
        emit PriceFeedUpdated(_priceFeed);
    }

    function toggleDynamicPricing() external onlyOwner {
        useDynamicPricing = !useDynamicPricing;
    }

    function updateDynamicMintPrice() external onlyOwner {
        require(address(priceFeed) != address(0), "Price feed not set");
        (, int256 price,,,) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        dynamicMintPrice = uint256(price);
    }

    function getCurrentPrice() external view returns (uint256) {
        if (useDynamicPricing && address(priceFeed) != address(0)) {
            return dynamicMintPrice;
        }
        return MINT_PRICE;
    }`)
  }

  return functions.join('\n')
}

function generateNFTOverrides(features: string[]): string {
  const overrides = []
  const hasReentrancy = features.includes('reentrancy') || features.includes('mint') || features.includes('auction')
  
  overrides.push(`
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        ${features.includes('staking') ? 'require(stakedTokens[firstTokenId] == address(0), "Cannot transfer staked token");' : ''}
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }`)

  if (features.includes('uristorage')) {
    overrides.push(`
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }`)
    

    overrides.push(`
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }`)
  }
  const interfaceOverrides = ['ERC721', 'ERC721Enumerable']
  if (features.includes('uristorage')) interfaceOverrides.push('ERC721URIStorage')
  if (features.includes('royalties')) interfaceOverrides.push('ERC2981')
  
  overrides.push(`
    function supportsInterface(bytes4 interfaceId) public view override(${interfaceOverrides.join(', ')}) returns (bool) {
        return super.supportsInterface(interfaceId);
    }`)

  return overrides.join('\n')
}

export function generateContractCode(
  templateType: string,
  params: Record<string, any>,
  features: string[] = [],
  featureConfigs?: Record<string, any>
): string {
  switch (templateType) {
    case 'token':
      return generateTokenContract(params, features, featureConfigs)
    case 'nft':
      return generateNFTContract(params, features, featureConfigs)
    case 'dao':
      return generateDAOContract(params, features, featureConfigs)
    case 'lock':
      return generateLockContract(params, features, featureConfigs)
    case 'liquidity-pool':
        return generateLiquidityPoolContract(params, features, featureConfigs)
      case 'yield-farming':
        return generateYieldFarmingContract(params, features, featureConfigs)
      case 'gamefi-token':
        return generateGameFiTokenContract(params, features, featureConfigs)
      case 'nft-marketplace':
        return generateNFTMarketplaceContract(params, features, featureConfigs)
      case 'revenue-sharing':
        return generateRevenueSharingContract(params, features, featureConfigs)
      case 'loyalty-program':
        return generateLoyaltyProgramContract(params, features, featureConfigs)
      case 'dynamic-nft':
        return generateDynamicNFTContract(params, features, featureConfigs)
      case 'social-token':
        return generateSocialTokenContract(params, features, featureConfigs)
    default:
      throw new Error(`Unknown template type: ${templateType}`)
  }
}
function generateTokenContract(
  params: Record<string, any>, 
  features: string[], 
  featureConfigs?: any
): string {
  const name = params.name || 'MyToken'
  const symbol = params.symbol || 'MTK'
  const decimals = params.decimals || 18
  const totalSupply = params.totalSupply || '1000000'

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
  
  if (features.includes('mintable') || features.includes('pausable') || features.includes('whitelist') || features.includes('blacklist') || features.includes('tax') || features.includes('multisig') || features.includes('airdrop')) {
    if (!inheritance.includes('Ownable')) {
      imports.push('import "@openzeppelin/contracts/access/Ownable.sol";')
      inheritance.push('Ownable')
    }
  }
  
  // 🛡️ SÉCURITÉ: Extensions supportées
  const hasCapped = features.includes('capped')
  const hasPermit = features.includes('permit')
  
  if (hasCapped) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";')
    inheritance.push('ERC20Capped')
  }
  
  if (hasPermit) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";')
    inheritance.push('ERC20Permit')
  }
  
  if (features.includes('flashmint')) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20FlashMint.sol";')
    inheritance.push('ERC20FlashMint')
  }
  
  let constructorInit = ''
  if (features.includes('capped')) {
    const maxSupply = params.maxSupply || totalSupply
    constructorInit = `ERC20("${name}", "${symbol}") ERC20Capped(${maxSupply} * 10 ** ${decimals})`
  } else {
    constructorInit = `ERC20("${name}", "${symbol}")`
  }
  
  if (features.includes('permit')) {
    constructorInit += ` ERC20Permit("${name}")`
  }
  
  if (features.includes('mintable') || features.includes('pausable') || features.includes('whitelist') || features.includes('blacklist') || features.includes('tax') || features.includes('multisig') || features.includes('airdrop')) {
    constructorInit += ' Ownable()'
  }

  // Validate owner address and mint initial supply to owner
  constructorBody.push('require(owner != address(0), "Owner cannot be zero address");')
  constructorBody.push(`_mint(owner, ${totalSupply} * 10 ** ${decimals});`)
  
  if (features.includes('whitelist')) {
    stateVars.push('mapping(address => bool) private _whitelist;')
    stateVars.push('bool public whitelistEnabled = true;')
    functions.push(generateWhitelistFunctions(features.includes('pausable')))
  }

  if (features.includes('blacklist')) {
    stateVars.push('mapping(address => bool) private _blacklist;')
    functions.push(generateBlacklistFunctions(features.includes('pausable')))
  }

  if (features.includes('tax')) {
    stateVars.push('uint256 public taxRate = 0;')
    stateVars.push('address public taxRecipient;')
    constructorBody.push('taxRecipient = msg.sender;')
    functions.push(generateTaxFunctions())
  }

  if (features.includes('multisig')) {
    stateVars.push('address[] public multisigSigners;')
    stateVars.push('uint256 public multisigThreshold;')
    stateVars.push('mapping(bytes32 => mapping(address => bool)) public hasConfirmed;')
    stateVars.push('mapping(bytes32 => uint256) public confirmations;')
    functions.push(generateMultisigFunctions())
  }

  if (features.includes('airdrop')) {
    functions.push(generateAirdropFunctions())
  }

  if (features.includes('pausable')) {
    functions.push(generatePausableFunctions(features.includes('whitelist') || features.includes('blacklist')))
  }

  if (features.includes('mintable')) {
    functions.push(`
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }`)
  }

  // Override _mint when using ERC20Capped to resolve conflicts
  if (features.includes('capped')) {
    functions.push(`
    function _mint(address account, uint256 amount) internal virtual override(ERC20, ERC20Capped) {
        super._mint(account, amount);
    }`)
  }

  if (params.decimals && params.decimals !== 18) {
    functions.push(`
    function decimals() public pure override returns (uint8) {
        return ${params.decimals};
    }`)
  }
  
  const needsUpdateFunction = features.includes('pausable') || features.includes('whitelist') || features.includes('blacklist')
  if (needsUpdateFunction) {
    const overrideParents = ['ERC20']
    // ERC20Capped hérite déjà d'ERC20, donc on ne l'inclut pas dans l'override
    
    const checks = []
    if (features.includes('whitelist')) {
      checks.push('if (whitelistEnabled && from != address(0) && to != address(0)) {')
      checks.push('    require(_whitelist[from], "Transfer from non-whitelisted address");')
      checks.push('    require(_whitelist[to], "Transfer to non-whitelisted address");')
      checks.push('}')
    }
    if (features.includes('blacklist')) {
      checks.push('if (from != address(0) && to != address(0)) {')
      checks.push('    require(!_blacklist[from], "Transfer from blacklisted address");')
      checks.push('    require(!_blacklist[to], "Transfer to blacklisted address");')
      checks.push('}')
    }

    functions.push(`
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        virtual
        override(${overrideParents.join(', ')})${features.includes('pausable') ? '\n        whenNotPaused' : ''}
    {
        ${checks.join('\n        ')}
        super._beforeTokenTransfer(from, to, amount);
    }`)
  }

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

${imports.join('\n')}

contract ${name.replace(/\s+/g, '')} is ${inheritance.join(', ')} {
${stateVars.length > 0 ? `    ${stateVars.join('\n    ')}\n` : ''}
    constructor(address owner) ${constructorInit} {
        ${constructorBody.join('\n        ')}
    }${functions.join('')}
}`
}

function generateWhitelistFunctions(hasPausable: boolean): string {
  return `

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

    event WhitelistAdded(address indexed account);
    event WhitelistRemoved(address indexed account);
    event WhitelistEnabled();
    event WhitelistDisabled();`
}

function generateBlacklistFunctions(hasPausable: boolean): string {
  return `

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

    function isBlacklisted(address account) public view returns (bool) {
        return _blacklist[account];
    }

    event BlacklistAdded(address indexed account);
    event BlacklistRemoved(address indexed account);`
}

function generateTaxFunctions(): string {
  return `

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
        override(ERC20)
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
    event TaxRecipientUpdated(address indexed newRecipient);`
}

function generateMultisigFunctions(): string {
  return `

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

    event MultisigSignersUpdated(address[] signers);
    event MultisigThresholdUpdated(uint256 threshold);`
}

function generateAirdropFunctions(): string {
  return `

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

    event BatchAirdrop(address[] recipients, uint256[] amounts);`
}

function generatePausableFunctions(hasOtherBeforeTransfer: boolean): string {
  return `

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }`
}

// DEPRECATED: Functions for votes and snapshot features (disabled for token template)
// function generateSnapshotFunctions(): string { ... }
// function generateVotesFunctions(features: string[]): string { ... }
function generateNFTContract(
  params: Record<string, any>, 
  features: string[] = [],
  premiumFeatureConfigs?: any
): string {
  const { 
    name = 'MyNFT', 
    symbol = 'MNFT', 
    maxSupply = '10000',
    baseURI = 'https://api.example.com/metadata/'
  } = params

  const mintPrice = params.mintPrice || '0.01'
  const maxPerWallet = params.maxPerWallet || 5

  // Version simplifiée pour tester
  const imports = [
    'import "@openzeppelin/contracts/token/ERC721/ERC721.sol";',
    'import "@openzeppelin/contracts/access/Ownable.sol";'
  ]

  const inheritances = ['ERC721', 'Ownable']
  
  // Ajouter les imports conditionnels seulement si nécessaire
  if (features.includes('enumerable')) {
    imports.push('import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";')
    inheritances.push('ERC721Enumerable')
  }

  if (features.includes('uristorage')) {
    imports.push('import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";')
    inheritances.push('ERC721URIStorage')
  }

  if (features.includes('pausable')) {
    imports.push('import "@openzeppelin/contracts/security/Pausable.sol";')
    inheritances.push('Pausable')
  }

  if (features.includes('burnable')) {
    imports.push('import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";')
    inheritances.push('ERC721Burnable')
  }

  if (features.includes('royalties')) {
    imports.push('import "@openzeppelin/contracts/token/common/ERC2981.sol";')
    inheritances.push('ERC2981')
  }

  if (features.includes('permit')) {
    imports.push('import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";')
    imports.push('import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";')
    inheritances.push('EIP712')
  }

  // Ajouter ReentrancyGuard seulement si nécessaire
  if (features.includes('reentrancy') || features.includes('mint') || features.includes('auction')) {
    imports.push('import "@openzeppelin/contracts/security/ReentrancyGuard.sol";')
    inheritances.push('ReentrancyGuard')
  }

  // Ajouter ERC721Enumerable par défaut car il est utilisé dans les overrides
  if (!features.includes('enumerable')) {
    imports.push('import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";')
    inheritances.push('ERC721Enumerable')
  }

  const stateVars = [
    'uint256 private _tokenIdCounter;',
    `uint256 public constant MAX_SUPPLY = ${maxSupply};`,
    `uint256 public constant MINT_PRICE = ${parseFloat(mintPrice) * 1e18};`,
    `uint256 public constant MAX_PER_WALLET = ${maxPerWallet};`,
    'string private _baseTokenURI;',
    'bool public publicMintEnabled = true;',
    'mapping(address => uint256) public mintedPerWallet;',
    'address public withdrawAddress;'
  ]

  const constructorBody = [
    `_baseTokenURI = "${baseURI}";`,
    'withdrawAddress = msg.sender;'
  ]
  
  if (features.includes('whitelist')) {
    stateVars.push('mapping(address => bool) private _whitelist;', 'bool public whitelistEnabled = true;')
  }

  if (features.includes('blacklist')) {
    stateVars.push('mapping(address => bool) private _blacklist;', 'bool public blacklistEnabled = true;')
  }

  if (features.includes('tax')) {
    stateVars.push('uint256 public transferTaxRate = 250;', 'address public taxRecipient;', 'bool public taxEnabled = true;')
    constructorBody.push('taxRecipient = msg.sender;')
  }

  if (features.includes('royalties')) {
    constructorBody.push('_setDefaultRoyalty(msg.sender, 250);')
  }

  if (features.includes('auction')) {
    stateVars.push(`
    struct Auction {
        address seller;
        uint256 startingPrice;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool active;
    }
    mapping(uint256 => Auction) public auctions;
    uint256 public defaultAuctionDuration = 86400;
    uint256 public minimumStartingPrice = 10000000000000000;`)
  }

  if (features.includes('oracle')) {
    stateVars.push('AggregatorV3Interface internal priceFeed;', 'uint256 public dynamicMintPrice;', 'bool public useDynamicPricing;')
  }

  if (features.includes('rewards')) {
    stateVars.push('mapping(address => uint256) public userRewards;', 'uint256 public rewardPerMint = 10;', 'bool public rewardsEnabled = true;')
  }

  if (features.includes('staking')) {
    stateVars.push('mapping(uint256 => address) public stakedTokens;', 'mapping(address => uint256[]) public userStakedTokens;', 'uint256 public stakingRewardRate = 100;')
  }

  const functions = generateNFTFunctions(features)

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

${imports.join('\n')}

${features.includes('oracle') ? `
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}
` : ''}
contract ${name.replace(/\s+/g, '')} is ${inheritances.join(', ')} {
    ${stateVars.join('\n    ')}
    
    ${features.includes('auction') ? 'event AuctionCreated(uint256 indexed tokenId, uint256 startingPrice, uint256 duration);' : ''}
    ${features.includes('oracle') ? 'event PriceFeedUpdated(address indexed newPriceFeed);' : ''}
    ${features.includes('rewards') ? 'event RewardsAdded(address indexed user, uint256 amount);' : ''}
    ${features.includes('whitelist') ? 'event WhitelistAdded(address indexed account);' : ''}
    ${features.includes('blacklist') ? 'event BlacklistAdded(address indexed account);' : ''}

    constructor() ERC721("${name}", "${symbol}")${features.includes('permit') ? ` EIP712("${name}", "1")` : ''} {
        ${constructorBody.join('\n        ')}
    }

    ${functions}

    function totalSupply() public view override(ERC721Enumerable) returns (uint256) {
        return _tokenIdCounter;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function withdraw() external onlyOwner {
        payable(withdrawAddress).transfer(address(this).balance);
    }

    ${generateNFTOverrides(features)}
}`
}
function generateDAOContract(
  params: Record<string, any>, 
  features: string[], 
  featureConfigs?: any
): string {
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
  
  const timelockFunctions = features.includes('timelock') ? `
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
    }` : ''

  return `// SPDX-License-Identifier: MIT
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
    }${timelockFunctions}
}`
}
function generateLockContract(
  params: Record<string, any>, 
  features: string[], 
  featureConfigs?: any
): string {
  const { 
    tokenAddress = '0x0000000000000000000000000000000000000000',
    beneficiary = '0x0000000000000000000000000000000000000000',
    unlockTime = 'block.timestamp + 365 days'
  } = params

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

  let timelockCode = ''
  if (features.includes('timelock')) {
    timelockCode = `
    uint256 public timelockDelay = 24 hours;
    mapping(bytes32 => uint256) public pendingActions;
    
    function setTimelockDelay(uint256 _delay) public {
        require(msg.sender == beneficiary, "Only beneficiary can set delay");
        timelockDelay = _delay;
    }
    
    function scheduleRelease() public {
        require(msg.sender == beneficiary, "Only beneficiary can schedule");
        bytes32 actionId = keccak256(abi.encodePacked("release"));
        pendingActions[actionId] = block.timestamp + timelockDelay;
    }
    
    function executeRelease() public {
        bytes32 actionId = keccak256(abi.encodePacked("release"));
        require(pendingActions[actionId] > 0, "No pending release");
        require(block.timestamp >= pendingActions[actionId], "Timelock not expired");
        require(block.timestamp >= unlockTime, "Tokens are still locked");
        
        delete pendingActions[actionId];
        
        uint256 amount = token.balanceOf(address(this));
        require(amount > 0, "No tokens to release");
        
        token.transfer(beneficiary, amount);
        emit TokensReleased(amount);
    }`
  }

  let multisigCode = ''
  if (features.includes('multisig')) {
    multisigCode = `
    address[] public signers;
    mapping(address => bool) public isSigner;
    uint256 public requiredSignatures;
    mapping(bytes32 => mapping(address => bool)) public hasSigned;
    mapping(bytes32 => uint256) public signatureCount;
    
    function addSigner(address _signer) public {
        require(msg.sender == beneficiary, "Only beneficiary can add signer");
        require(!isSigner[_signer], "Already a signer");
        signers.push(_signer);
        isSigner[_signer] = true;
    }
    
    function removeSigner(address _signer) public {
        require(msg.sender == beneficiary, "Only beneficiary can remove signer");
        require(isSigner[_signer], "Not a signer");
        isSigner[_signer] = false;
        for (uint i = 0; i < signers.length; i++) {
            if (signers[i] == _signer) {
                signers[i] = signers[signers.length - 1];
                signers.pop();
                break;
            }
        }
    }
    
    function setRequiredSignatures(uint256 _required) public {
        require(msg.sender == beneficiary, "Only beneficiary can set required");
        require(_required <= signers.length, "Too many required signatures");
        requiredSignatures = _required;
    }
    
    function signRelease() public {
        require(isSigner[msg.sender], "Not a signer");
        bytes32 actionId = keccak256(abi.encodePacked("release"));
        require(!hasSigned[actionId][msg.sender], "Already signed");
        
        hasSigned[actionId][msg.sender] = true;
        signatureCount[actionId]++;
        
        if (signatureCount[actionId] >= requiredSignatures) {
            require(block.timestamp >= unlockTime, "Tokens are still locked");
            
            uint256 amount = token.balanceOf(address(this));
            require(amount > 0, "No tokens to release");
            
            token.transfer(beneficiary, amount);
            emit TokensReleased(amount);
            
            // Reset signatures
            for (uint i = 0; i < signers.length; i++) {
                hasSigned[actionId][signers[i]] = false;
            }
            delete signatureCount[actionId];
        }
    }`
  }
  
  let unlockTimeValue = unlockTime
  if (unlockTime && typeof unlockTime === 'string') {
    if (unlockTime.includes('T') || /^\d{4}-\d{2}-\d{2}$/.test(unlockTime)) {
      unlockTimeValue = Math.floor(new Date(unlockTime).getTime() / 1000)
    }
    if (typeof unlockTimeValue === 'string' && !unlockTime.startsWith('block.timestamp')) {
      unlockTimeValue = `"${unlockTimeValue}"`
    }
  }

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TokenLock is ReentrancyGuard {
    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable unlockTime;
    
    event TokensReleased(uint256 amount);
    ${features.includes('vesting') ? 'event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 duration);' : ''}
    ${features.includes('vesting') ? 'event VestedTokensReleased(address indexed beneficiary, uint256 amount);' : ''}
    
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
    ${timelockCode}
    ${multisigCode}
}`
}

function generateLiquidityPoolContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { name = 'LiquidityPool', tokenA = '0x0000000000000000000000000000000000000000', tokenB = '0x0000000000000000000000000000000000000000', fee = 3000, initialPrice = 1.0 } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${name.replace(/\s+/g, '')} is ReentrancyGuard, Ownable {
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;
    uint256 public immutable fee;
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public totalShares;
    mapping(address => uint256) public shares;
    
    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 shares);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 shares);
    event Swap(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut);
    
    constructor(
        address _tokenA,
        address _tokenB,
        uint256 _fee
    ) Ownable() {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        fee = _fee;
    }
    
    function addLiquidity(uint256 amountA, uint256 amountB, uint256 minShares) external nonReentrant {
        require(amountA > 0 && amountB > 0, "Amounts must be positive");
        
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);
        
        uint256 newShares;
        if (totalShares == 0) {
            newShares = sqrt(amountA * amountB);
        } else {
            newShares = min((amountA * totalShares) / reserveA, (amountB * totalShares) / reserveB);
        }
        
        require(newShares >= minShares, "Insufficient shares");
        
        reserveA += amountA;
        reserveB += amountB;
        totalShares += newShares;
        shares[msg.sender] += newShares;
        
        emit LiquidityAdded(msg.sender, amountA, amountB, newShares);
    }
    
    function removeLiquidity(uint256 sharesToRemove, uint256 minAmountA, uint256 minAmountB) external nonReentrant {
        require(sharesToRemove > 0, "Shares must be positive");
        require(shares[msg.sender] >= sharesToRemove, "Insufficient shares");
        
        uint256 amountA = (sharesToRemove * reserveA) / totalShares;
        uint256 amountB = (sharesToRemove * reserveB) / totalShares;
        
        require(amountA >= minAmountA && amountB >= minAmountB, "Insufficient output");
        
        shares[msg.sender] -= sharesToRemove;
        totalShares -= sharesToRemove;
        reserveA -= amountA;
        reserveB -= amountB;
        
        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);
        
        emit LiquidityRemoved(msg.sender, amountA, amountB, sharesToRemove);
    }
    
    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) external nonReentrant {
        require(tokenIn == address(tokenA) || tokenIn == address(tokenB), "Invalid token");
        
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        uint256 amountOut;
        if (tokenIn == address(tokenA)) {
            amountOut = getAmountOut(amountIn, reserveA, reserveB);
            reserveA += amountIn;
            reserveB -= amountOut;
            tokenB.transfer(msg.sender, amountOut);
        } else {
            amountOut = getAmountOut(amountIn, reserveB, reserveA);
            reserveB += amountIn;
            reserveA -= amountOut;
            tokenA.transfer(msg.sender, amountOut);
        }
        
        require(amountOut >= minAmountOut, "Insufficient output");
        
        emit Swap(msg.sender, tokenIn, amountIn, amountOut);
    }
    
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal view returns (uint256) {
        require(amountIn > 0, "Insufficient input");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn * (10000 - fee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 10000) + amountInWithFee;
        return numerator / denominator;
    }
    
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
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}`
}

function generateYieldFarmingContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { name = 'YieldFarm', stakingToken = '0x0000000000000000000000000000000000000000', rewardToken = '0x0000000000000000000000000000000000000000', rewardRate = 0.001, duration = 30 } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${name.replace(/\s+/g, '')} is ReentrancyGuard, Ownable {
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;
    uint256 public rewardRate;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public totalStaked;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    
    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate,
        uint256 _duration
    ) Ownable() {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
        startTime = block.timestamp;
        endTime = block.timestamp + (_duration * 1 days);
    }
    
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(block.timestamp < endTime, "Farming period ended");
        
        updateReward(msg.sender);
        
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;
        
        stakingToken.transferFrom(msg.sender, address(this), amount);
        
        emit Staked(msg.sender, amount);
    }
    
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot withdraw 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");
        
        updateReward(msg.sender);
        
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;
        
        stakingToken.transfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    function claimReward() external nonReentrant {
        updateReward(msg.sender);
        
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }
    
    function updateReward(address account) internal {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
    }
    
    function lastTimeRewardApplicable() internal view returns (uint256) {
        return block.timestamp < endTime ? block.timestamp : endTime;
    }
    
    function rewardPerToken() internal view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + (
            ((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18) / totalStaked
        );
    }
    
    function earned(address account) internal view returns (uint256) {
        return (stakedBalance[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18 + rewards[account];
    }
    
    function getRewardForDuration() external view returns (uint256) {
        return rewardRate * (endTime - startTime);
    }
}`
}

function generateGameFiTokenContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { name = 'GameToken', symbol = 'GAME', maxSupply = '1000000', mintPrice = 0.01, burnRate = 2 } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${name.replace(/\s+/g, '')} is ERC20, Ownable {
    uint256 public maxSupply;
    uint256 public mintPrice;
    uint256 public burnRate;
    uint256 public totalBurned;
    
    event TokensBurned(address indexed from, uint256 amount);
    event MintPriceUpdated(uint256 newPrice);
    event BurnRateUpdated(uint256 newRate);
    
    constructor(
        uint256 _maxSupply,
        uint256 _mintPrice,
        uint256 _burnRate
    ) ERC20("${name}", "${symbol}") Ownable() {
        maxSupply = _maxSupply * 10 ** decimals();
        mintPrice = _mintPrice;
        burnRate = _burnRate;
    }
    
    function mint() external payable {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(totalSupply() + 1 <= maxSupply, "Max supply reached");
        
        _mint(msg.sender, 1);
    }
    
    function _transfer(address from, address to, uint256 amount) internal virtual override {
        super._transfer(from, to, amount);
        
        if (burnRate > 0 && from != address(0) && to != address(0)) {
            uint256 burnAmount = (amount * burnRate) / 10000;
            if (burnAmount > 0) {
                _burn(to, burnAmount);
                totalBurned += burnAmount;
                emit TokensBurned(to, burnAmount);
            }
        }
    }
    
    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
        emit MintPriceUpdated(_mintPrice);
    }
    
    function setBurnRate(uint256 _burnRate) external onlyOwner {
        require(_burnRate <= 1000, "Burn rate too high");
        burnRate = _burnRate;
        emit BurnRateUpdated(_burnRate);
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}`
}

function generateNFTMarketplaceContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { name = 'NFTMarketplace', nftContract = '0x0000000000000000000000000000000000000000', platformFee = 2.5, creatorFee = 5.0, allowMinting = false } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${name.replace(/\s+/g, '')} is ReentrancyGuard, Ownable {
    IERC721 public immutable nftContract;
    uint256 public platformFee;
    uint256 public creatorFee;
    bool public allowMinting;
    
    mapping(uint256 => uint256) public tokenPrices;
    mapping(uint256 => address) public tokenSellers;
    
    event TokenListed(uint256 indexed tokenId, uint256 price, address seller);
    event TokenSold(uint256 indexed tokenId, uint256 price, address seller, address buyer);
    event TokenDelisted(uint256 indexed tokenId, address seller);
    
    constructor(
        address _nftContract,
        uint256 _platformFee,
        uint256 _creatorFee,
        bool _allowMinting
    ) Ownable() {
        nftContract = IERC721(_nftContract);
        platformFee = _platformFee;
        creatorFee = _creatorFee;
        allowMinting = _allowMinting;
    }
    
    function listToken(uint256 tokenId, uint256 price) external {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(nftContract.isApprovedForAll(msg.sender, address(this)), "Not approved");
        require(price > 0, "Price must be positive");
        
        tokenPrices[tokenId] = price;
        tokenSellers[tokenId] = msg.sender;
        
        emit TokenListed(tokenId, price, msg.sender);
    }
    
    function buyToken(uint256 tokenId) external payable nonReentrant {
        require(tokenPrices[tokenId] > 0, "Token not listed");
        require(msg.value >= tokenPrices[tokenId], "Insufficient payment");
        
        address seller = tokenSellers[tokenId];
        uint256 price = tokenPrices[tokenId];
        
        // Calculate fees
        uint256 platformFeeAmount = (price * platformFee) / 1000;
        uint256 creatorFeeAmount = (price * creatorFee) / 1000;
        uint256 sellerAmount = price - platformFeeAmount - creatorFeeAmount;
        
        // Transfer token
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
    
    function setPlatformFee(uint256 _platformFee) external onlyOwner {
        platformFee = _platformFee;
    }
    
    function setCreatorFee(uint256 _creatorFee) external onlyOwner {
        creatorFee = _creatorFee;
    }
}`
}

function generateRevenueSharingContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { name = 'RevenueToken', symbol = 'REV', totalSupply = '1000000', businessWallet = '0x0000000000000000000000000000000000000000', distributionPeriod = 30 } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${name.replace(/\s+/g, '')} is ERC20, Ownable {
    address public businessWallet;
    uint256 public distributionPeriod;
    uint256 public lastDistribution;
    uint256 public totalDistributed;
    
    event RevenueDistributed(uint256 amount, uint256 timestamp);
    
    constructor(
        address _businessWallet,
        uint256 _distributionPeriod
    ) ERC20("${name}", "${symbol}") Ownable() {
        businessWallet = _businessWallet;
        distributionPeriod = _distributionPeriod;
        lastDistribution = block.timestamp;
        
        _mint(msg.sender, ${totalSupply} * 10 ** decimals());
    }
    
    function distributeRevenue() external payable {
        require(msg.sender == businessWallet, "Only business wallet can distribute");
        require(msg.value > 0, "No revenue to distribute");
        require(block.timestamp >= lastDistribution + distributionPeriod, "Distribution period not reached");
        
        uint256 totalSupply = totalSupply();
        if (totalSupply > 0) {
            for (uint256 i = 0; i < totalSupply; i++) {
                address holder = getHolderAtIndex(i);
                if (holder != address(0)) {
                    uint256 share = (balanceOf(holder) * msg.value) / totalSupply;
                    if (share > 0) {
                        payable(holder).transfer(share);
                    }
                }
            }
        }
        
        lastDistribution = block.timestamp;
        totalDistributed += msg.value;
        
        emit RevenueDistributed(msg.value, block.timestamp);
    }
    
    function getHolderAtIndex(uint256 index) internal view returns (address) {
        // Simplified implementation - in practice you'd need a more sophisticated holder tracking
        return address(0);
    }
    
    function setBusinessWallet(address _businessWallet) external onlyOwner {
        businessWallet = _businessWallet;
    }
    
    function setDistributionPeriod(uint256 _distributionPeriod) external onlyOwner {
        distributionPeriod = _distributionPeriod;
    }
}`
}

function generateLoyaltyProgramContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { name = 'LoyaltyProgram', pointsPerPurchase = 10, redemptionRate = 0.01, transferable = false, expirable = true } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ${name.replace(/\s+/g, '')}
 * @dev Comprehensive loyalty program with points, tiers, and rewards
 * Generated by Smart Contract Deployer with security enhancements
 */
contract ${name.replace(/\s+/g, '')} is Ownable, ReentrancyGuard {
    string public programName;
    uint256 public pointsPerPurchase;
    uint256 public redemptionRate;
    bool public transferable;
    bool public expirable;
    
    mapping(address => uint256) public points;
    mapping(address => uint256) public lastActivity;
    
    // Events
    event PointsEarned(address indexed user, uint256 amount, uint256 total);
    event PointsRedeemed(address indexed user, uint256 amount, uint256 total);
    event PointsTransferred(address indexed from, address indexed to, uint256 amount);
    event PointsExpired(address indexed user, uint256 amount);
    
    constructor() Ownable() {
        programName = "${name}";
        pointsPerPurchase = ${pointsPerPurchase};
        redemptionRate = ${Math.floor(parseFloat(redemptionRate.toString()) * 1e18)};
        transferable = ${transferable};
        expirable = ${expirable};
    }
    
    function earnPoints(address user, uint256 purchaseAmount) external onlyOwner nonReentrant {
        require(user != address(0), "Invalid user address");
        require(purchaseAmount > 0, "Purchase amount must be positive");
        
        uint256 pointsToAdd = (purchaseAmount * pointsPerPurchase) / 100;
        
        points[user] += pointsToAdd;
        lastActivity[user] = block.timestamp;
        
        emit PointsEarned(user, pointsToAdd, points[user]);
    }
    
    function redeemPoints(uint256 amount) external nonReentrant {
        require(points[msg.sender] >= amount, "Insufficient points");
        require(amount > 0, "Amount must be positive");
        
        // Check expiration before redemption
        if (expirable && lastActivity[msg.sender] > 0) {
            uint256 daysSinceActivity = (block.timestamp - lastActivity[msg.sender]) / 1 days;
            if (daysSinceActivity > 365) {
                points[msg.sender] = 0;
                emit PointsExpired(msg.sender, points[msg.sender]);
                revert("Points have expired");
            }
        }
        
        points[msg.sender] -= amount;
        lastActivity[msg.sender] = block.timestamp;
        
        emit PointsRedeemed(msg.sender, amount, points[msg.sender]);
    }
    
    function transferPoints(address to, uint256 amount) external nonReentrant {
        require(transferable, "Points not transferable");
        require(to != address(0), "Invalid recipient");
        require(points[msg.sender] >= amount, "Insufficient points");
        require(amount > 0, "Amount must be positive");
        
        points[msg.sender] -= amount;
        points[to] += amount;
        
        emit PointsTransferred(msg.sender, to, amount);
    }
    
    function getPointsBalance(address user) external view returns (uint256) {
        if (expirable && lastActivity[user] > 0) {
            uint256 daysSinceActivity = (block.timestamp - lastActivity[user]) / 1 days;
            if (daysSinceActivity > 365) {
                return 0; // Points expired
            }
        }
        
        return points[user];
    }
    
    function getUserInfo(address user) external view returns (
        uint256 pointsBalance,
        uint256 lastActivityTime,
        bool expired
    ) {
        pointsBalance = points[user];
        lastActivityTime = lastActivity[user];
        expired = false;
        
        if (expirable && lastActivity[user] > 0) {
            uint256 daysSinceActivity = (block.timestamp - lastActivity[user]) / 1 days;
            if (daysSinceActivity > 365) {
                pointsBalance = 0;
                expired = true;
            }
        }
    }
    
    function bulkEarnPoints(address[] memory users, uint256[] memory purchaseAmounts) external onlyOwner {
        require(users.length == purchaseAmounts.length, "Arrays length mismatch");
        require(users.length <= 100, "Too many users");
        
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] != address(0) && purchaseAmounts[i] > 0) {
                uint256 pointsToAdd = (purchaseAmounts[i] * pointsPerPurchase) / 100;
                points[users[i]] += pointsToAdd;
                lastActivity[users[i]] = block.timestamp;
                emit PointsEarned(users[i], pointsToAdd, points[users[i]]);
            }
        }
    }
    
    // Admin functions
    function setPointsPerPurchase(uint256 _pointsPerPurchase) external onlyOwner {
        require(_pointsPerPurchase > 0, "Points per purchase must be positive");
        pointsPerPurchase = _pointsPerPurchase;
    }
    
    function setRedemptionRate(uint256 _redemptionRate) external onlyOwner {
        redemptionRate = _redemptionRate;
    }
    
    function setTransferable(bool _transferable) external onlyOwner {
        transferable = _transferable;
    }
    
    function setExpirable(bool _expirable) external onlyOwner {
        expirable = _expirable;
    }
    
    // Allow contract to receive ETH for rewards
    receive() external payable {}
    
    function withdraw() external onlyOwner nonReentrant {
        require(address(this).balance > 0, "No funds to withdraw");
        payable(owner()).transfer(address(this).balance);
    }
}`
}

function generateDynamicNFTContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { name = 'DynamicNFT', symbol = 'DNFT', maxSupply = '10000', evolvable = true, mergeable = false } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ${name.replace(/\s+/g, '')}
 * @dev Dynamic NFT with evolution and customization features
 * Generated by Smart Contract Deployer with security enhancements
 */
contract ${name.replace(/\s+/g, '')} is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
    
    uint256 private _tokenIdCounter;
    uint256 public constant MAX_SUPPLY = ${maxSupply};
    
    mapping(uint256 => uint256) public tokenLevel;
    mapping(uint256 => uint256) public tokenExperience;
    mapping(uint256 => string) public tokenMetadata;
    
    event TokenEvolved(uint256 indexed tokenId, uint256 newLevel, uint256 experience);
    event TokensMerged(uint256 indexed token1, uint256 indexed token2, uint256 newToken);
    
    constructor() ERC721("${name}", "${symbol}") Ownable() {}
    
    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    function mint(address to) external onlyOwner nonReentrant {
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        require(to != address(0), "Cannot mint to zero address");
        
        uint256 tokenId = ++_tokenIdCounter;
        
        _mint(to, tokenId);
        
        // Initialize token properties
        tokenLevel[tokenId] = 1;
        tokenExperience[tokenId] = 0;
    }
    
    function evolve(uint256 tokenId) external {
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
    }
    
    function mergeTokens(uint256 token1, uint256 token2) external nonReentrant {
        require(_exists(token1) && _exists(token2), "Token does not exist");
        require(ownerOf(token1) == msg.sender && ownerOf(token2) == msg.sender, "Not token owner");
        require(token1 != token2, "Cannot merge same token");
        
        uint256 newTokenId = ++_tokenIdCounter;
        
        // Store combined properties
        uint256 combinedLevel = tokenLevel[token1] + tokenLevel[token2];
        uint256 combinedExperience = tokenExperience[token1] + tokenExperience[token2];
        
        _burn(token1);
        _burn(token2);
        _mint(msg.sender, newTokenId);
        
        // Set new token properties
        tokenLevel[newTokenId] = combinedLevel;
        tokenExperience[newTokenId] = combinedExperience;
        
        emit TokensMerged(token1, token2, newTokenId);
    }
    
    function setTokenMetadata(uint256 tokenId, string memory metadata) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        tokenMetadata[tokenId] = metadata;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        string memory metadata = tokenMetadata[tokenId];
        if (bytes(metadata).length > 0) {
            return metadata;
        }
        
        return super.tokenURI(tokenId);
    }
    
    function totalSupply() public view override(ERC721Enumerable) returns (uint256) {
        return _tokenIdCounter;
    }
    
    // Override required by Solidity
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    )
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`
}

function generateSocialTokenContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { creatorName = 'Creator', symbol = 'SOCIAL', initialSupply = '1000000', creatorShare = 20 } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${creatorName.replace(/\s+/g, '')}Token is ERC20, Ownable {
    address public creator;
    uint256 public creatorShare;
    uint256 public totalTips;
    
    mapping(address => uint256) public creatorTips;
    uint256 public tipFee;
    
    event TipReceived(address indexed from, uint256 amount, string message);
    event CreatorShareWithdrawn(uint256 amount);
    
    constructor(
        address _creator,
        uint256 _creatorShare
    ) ERC20("${creatorName} Token", "${symbol}") Ownable() {
        creator = _creator;
        creatorShare = _creatorShare;
        tipFee = 0.001 ether;
        
        // Mint initial supply to creator
        uint256 creatorAmount = (${initialSupply} * 10 ** decimals() * _creatorShare) / 100;
        _mint(creator, creatorAmount);
        
        // Mint remaining to deployer for distribution
        _mint(msg.sender, ${initialSupply} * 10 ** decimals() - creatorAmount);
    }
    
    function tipCreator(string memory message) external payable {
        require(msg.value > 0, "Tip amount must be positive");
        require(msg.value >= tipFee, "Tip amount below minimum");
        
        uint256 tipAmount = msg.value - tipFee;
        creatorTips[creator] += tipAmount;
        totalTips += tipAmount;
        
        payable(creator).transfer(tipAmount);
        
        emit TipReceived(msg.sender, tipAmount, message);
    }
    
    function withdrawCreatorShare() external {
        require(msg.sender == creator, "Only creator can withdraw");
        
        uint256 balance = balanceOf(creator);
        require(balance > 0, "No tokens to withdraw");
        
        _transfer(creator, msg.sender, balance);
        
        emit CreatorShareWithdrawn(balance);
    }
    
    function setTipFee(uint256 fee) external onlyOwner {
        tipFee = fee;
    }
    
    function getCreatorTips() external view returns (uint256) {
        return creatorTips[creator];
    }
}`
}