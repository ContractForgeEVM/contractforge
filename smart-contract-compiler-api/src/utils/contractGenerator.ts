export function generateContractCode(
  templateType: string,
  params: Record<string, any>,
  features: string[] = []
): string {
  switch (templateType) {
    case 'token':
      return generateTokenContract(params, features)
    case 'nft':
      return generateNFTContract(params, features)
    case 'dao':
      return generateDAOContract(params, features)
    case 'lock':
      return generateLockContract(params, features)
    // === NOUVEAUX TEMPLATES ===
    case 'liquidity-pool':
      return generateLiquidityPoolContract(params, features)
    case 'yield-farming':
      return generateYieldFarmingContract(params, features)
    case 'gamefi-token':
      return generateGameFiTokenContract(params, features)
    case 'nft-marketplace':
      return generateNFTMarketplaceContract(params, features)
    case 'revenue-sharing':
      return generateRevenueSharingContract(params, features)
    case 'loyalty-program':
      return generateLoyaltyProgramContract(params, features)
    case 'dynamic-nft':
      return generateDynamicNFTContract(params, features)
    case 'social-token':
      return generateSocialTokenContract(params, features)
    default:
      throw new Error(`Unknown template type: ${templateType}`)
  }
}
function generateTokenContract(params: Record<string, any>, features: string[]): string {
  const { name = 'MyToken', symbol = 'MTK', totalSupply = '1000000', decimals = 18 } = params
  const imports = ['import "@openzeppelin/contracts/token/ERC20/ERC20.sol";']
  const inheritance = ['ERC20']
  const functions: string[] = []
  if (features.includes('pausable')) {
    imports.push('import "@openzeppelin/contracts/security/Pausable.sol";')
    imports.push('import "@openzeppelin/contracts/access/Ownable.sol";')
    inheritance.push('Pausable', 'Ownable')
    functions.push(`
    function pause() public onlyOwner {
        _pause();
    }
    function unpause() public onlyOwner {
        _unpause();
    }`)
  }
  if (features.includes('burnable')) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";')
    inheritance.push('ERC20Burnable')
  }
  if (features.includes('mintable')) {
    imports.push('import "@openzeppelin/contracts/access/Ownable.sol";')
    if (!inheritance.includes('Ownable')) {
      inheritance.push('Ownable')
    }
    functions.push(`
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }`)
  }
  return `
pragma solidity ^0.8.20;
${imports.join('\n')}
contract ${name.replace(/\s+/g, '')} is ${inheritance.join(', ')} {
    constructor() ERC20("${name}", "${symbol}") ${inheritance.includes('Ownable') ? 'Ownable()' : ''} {
        _mint(msg.sender, ${totalSupply} * 10 ** ${decimals});
    }
    ${functions.join('\n')}
}`
}
function generateNFTContract(params: Record<string, any>, features: string[]): string {
  const { name = 'MyNFT', symbol = 'MNFT', maxSupply = '10000' } = params
  return `
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract ${name.replace(/\s+/g, '')} is ERC721, Ownable {
    uint256 private _nextTokenId;
    uint256 public maxSupply = ${maxSupply};
    constructor() ERC721("${name}", "${symbol}") Ownable() {}
    function safeMint(address to) public onlyOwner {
        require(_nextTokenId < maxSupply, "Max supply reached");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }
}`
}
function generateDAOContract(params: Record<string, any>, features: string[]): string {
  const { name = 'MyDAO', governanceTokenAddress = '0x0000000000000000000000000000000000000000', proposalThreshold = '100', votingPeriod = '50400' } = params
  return `
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
contract ${name.replace(/\s+/g, '')} is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    constructor(IVotes _token)
        Governor("${name}")
        GovernorSettings(1, ${votingPeriod}, ${proposalThreshold})
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
    {}
    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }
    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }
    function quorum(uint256 blockNumber) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}`
}
function generateLockContract(params: Record<string, any>, features: string[]): string {
  const { tokenAddress = '0x0000000000000000000000000000000000000000', beneficiary = '0x0000000000000000000000000000000000000000' } = params
  return `
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
contract TokenLock is ReentrancyGuard {
    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable unlockTime;
    constructor() {
        token = IERC20(${tokenAddress});
        beneficiary = ${beneficiary};
        unlockTime = block.timestamp + 365 days;
    }
    function release() public nonReentrant {
        require(block.timestamp >= unlockTime, "Tokens are still locked");
        require(msg.sender == beneficiary, "Only beneficiary can release");
        uint256 amount = token.balanceOf(address(this));
        require(amount > 0, "No tokens to release");
        token.transfer(beneficiary, amount);
    }
}`
}

function generateLiquidityPoolContract(params: Record<string, any>, features: string[]): string {
  const { name = 'LiquidityPool', tokenA = '0x0000000000000000000000000000000000000000', tokenB = '0x0000000000000000000000000000000000000000', fee = 3000, initialPrice = 1.0 } = params
  return `
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

function generateYieldFarmingContract(params: Record<string, any>, features: string[]): string {
  const { name = 'YieldFarm', stakingToken = '0x0000000000000000000000000000000000000000', rewardToken = '0x0000000000000000000000000000000000000000', rewardRate = 0.001, duration = 30 } = params
  return `
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

function generateGameFiTokenContract(params: Record<string, any>, features: string[]): string {
  const { name = 'GameToken', symbol = 'GAME', maxSupply = '1000000', mintPrice = 0.01, burnRate = 2 } = params
  return `
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

function generateNFTMarketplaceContract(params: Record<string, any>, features: string[]): string {
  const { name = 'NFTMarketplace', nftContract = '0x0000000000000000000000000000000000000000', platformFee = 2.5, creatorFee = 5.0, allowMinting = false } = params
  return `
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

function generateRevenueSharingContract(params: Record<string, any>, features: string[]): string {
  const { name = 'RevenueToken', symbol = 'REV', totalSupply = '1000000', businessWallet = '0x0000000000000000000000000000000000000000', distributionPeriod = 30 } = params
  return `
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

function generateLoyaltyProgramContract(params: Record<string, any>, features: string[]): string {
  const { name = 'LoyaltyProgram', pointsPerPurchase = 10, redemptionRate = 0.01, transferable = false, expirable = true } = params
  return `
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";
contract ${name.replace(/\s+/g, '')} is Ownable {
    uint256 public pointsPerPurchase;
    uint256 public redemptionRate;
    bool public transferable;
    bool public expirable;
    
    mapping(address => uint256) public points;
    mapping(address => uint256) public lastActivity;
    
    event PointsEarned(address indexed user, uint256 amount, uint256 purchaseValue);
    event PointsRedeemed(address indexed user, uint256 amount, uint256 value);
    event PointsTransferred(address indexed from, address indexed to, uint256 amount);
    
    constructor(
        uint256 _pointsPerPurchase,
        uint256 _redemptionRate,
        bool _transferable,
        bool _expirable
    ) Ownable() {
        pointsPerPurchase = _pointsPerPurchase;
        redemptionRate = _redemptionRate;
        transferable = _transferable;
        expirable = _expirable;
    }
    
    function earnPoints(uint256 purchaseValue) external {
        uint256 pointsToAdd = (purchaseValue * pointsPerPurchase) / 100;
        points[msg.sender] += pointsToAdd;
        lastActivity[msg.sender] = block.timestamp;
        
        emit PointsEarned(msg.sender, pointsToAdd, purchaseValue);
    }
    
    function redeemPoints(uint256 pointsToRedeem) external {
        require(points[msg.sender] >= pointsToRedeem, "Insufficient points");
        
        uint256 value = pointsToRedeem * redemptionRate;
        points[msg.sender] -= pointsToRedeem;
        
        payable(msg.sender).transfer(value);
        
        emit PointsRedeemed(msg.sender, pointsToRedeem, value);
    }
    
    function transferPoints(address to, uint256 amount) external {
        require(transferable, "Points not transferable");
        require(points[msg.sender] >= amount, "Insufficient points");
        
        points[msg.sender] -= amount;
        points[to] += amount;
        
        emit PointsTransferred(msg.sender, to, amount);
    }
    
    function getPoints(address user) external view returns (uint256) {
        uint256 userPoints = points[user];
        
        if (expirable && lastActivity[user] > 0) {
            uint256 daysSinceActivity = (block.timestamp - lastActivity[user]) / 1 days;
            if (daysSinceActivity > 365) {
                return 0; // Points expired
            }
        }
        
        return userPoints;
    }
    
    function setPointsPerPurchase(uint256 _pointsPerPurchase) external onlyOwner {
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
}`
}

function generateDynamicNFTContract(params: Record<string, any>, features: string[]): string {
  const { name = 'DynamicNFT', symbol = 'DNFT', maxSupply = '10000', evolvable = true, mergeable = false } = params
  return `
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract ${name.replace(/\s+/g, '')} is ERC721, Ownable {
    uint256 public maxSupply;
    uint256 public currentSupply;
    
    mapping(uint256 => uint256) public tokenLevel;
    mapping(uint256 => uint256) public tokenExperience;
    mapping(uint256 => string) public tokenMetadata;
    
    event TokenEvolved(uint256 indexed tokenId, uint256 newLevel, uint256 experience);
    event TokensMerged(uint256 indexed token1, uint256 indexed token2, uint256 newToken);
    
    constructor() ERC721("${name}", "${symbol}") Ownable() {
        maxSupply = ${maxSupply};
    }
    
    function mint() external {
        require(currentSupply < maxSupply, "Max supply reached");
        require(msg.sender == owner(), "Only owner can mint");
        
        _mint(msg.sender, currentSupply);
        currentSupply++;
    }
    
    function evolve(uint256 tokenId) external {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        tokenLevel[tokenId]++;
        tokenExperience[tokenId] += 100;
        
        emit TokenEvolved(tokenId, tokenLevel[tokenId], tokenExperience[tokenId]);
    }
    
    function merge(uint256 token1, uint256 token2) external {
        require(_exists(token1) && _exists(token2), "Token does not exist");
        require(ownerOf(token1) == msg.sender && ownerOf(token2) == msg.sender, "Not token owner");
        require(currentSupply < maxSupply, "Max supply reached");
        
        _burn(token1);
        _burn(token2);
        
        _mint(msg.sender, currentSupply);
        tokenLevel[currentSupply] = max(tokenLevel[token1], tokenLevel[token2]) + 1;
        currentSupply++;
        
        emit TokensMerged(token1, token2, currentSupply - 1);
    }
    
    function setTokenMetadata(uint256 tokenId, string memory metadata) external {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        tokenMetadata[tokenId] = metadata;
    }
    
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }
}`
}

function generateSocialTokenContract(params: Record<string, any>, features: string[]): string {
  const { creatorName = 'Creator', symbol = 'SOCIAL', initialSupply = '1000000', creatorShare = 20 } = params
  return `
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