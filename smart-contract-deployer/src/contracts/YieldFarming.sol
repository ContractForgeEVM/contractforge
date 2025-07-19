// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title YieldFarming
 * @dev A yield farming contract with staking rewards
 */
contract YieldFarming is Ownable, ReentrancyGuard, Pausable {
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
    
    // Anti-bot protection
    mapping(address => uint256) public lastStakeTime;
    uint256 public constant MIN_STAKE_INTERVAL = 1 hours;
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);
    event FarmingPeriodUpdated(uint256 newStartTime, uint256 newEndTime);
    
    // Errors
    error StakingNotStarted();
    error StakingEnded();
    error InsufficientBalance();
    error StakingTooFrequent();
    error NoRewardsToClaim();
    
    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate,
        uint256 _startTime,
        uint256 _endTime
    ) Ownable(msg.sender) {
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
    }
    
    /**
     * @dev Stake tokens to earn rewards
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(block.timestamp >= startTime, "Staking not started");
        require(block.timestamp <= endTime, "Staking ended");
        require(amount > 0, "Amount must be positive");
        require(
            block.timestamp >= lastStakeTime[msg.sender] + MIN_STAKE_INTERVAL,
            "Staking too frequent"
        );
        
        _updateReward(msg.sender);
        
        userStaked[msg.sender] += amount;
        totalStaked += amount;
        lastStakeTime[msg.sender] = block.timestamp;
        
        IERC20(stakingToken).transferFrom(msg.sender, address(this), amount);
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @dev Withdraw staked tokens
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(userStaked[msg.sender] >= amount, "Insufficient staked balance");
        
        _updateReward(msg.sender);
        
        userStaked[msg.sender] -= amount;
        totalStaked -= amount;
        
        IERC20(stakingToken).transfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Claim earned rewards
     */
    function claimReward() external nonReentrant {
        _updateReward(msg.sender);
        
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        
        rewards[msg.sender] = 0;
        
        IERC20(rewardToken).transfer(msg.sender, reward);
        
        emit RewardPaid(msg.sender, reward);
    }
    
    /**
     * @dev Exit: withdraw all staked tokens and claim rewards
     */
    function exit() external {
        withdraw(userStaked[msg.sender]);
        claimReward();
    }
    
    /**
     * @dev Get pending rewards for a user
     */
    function pendingReward(address user) external view returns (uint256) {
        uint256 rewardPerToken = rewardPerTokenStored;
        
        if (totalStaked > 0 && block.timestamp > lastUpdateTime) {
            uint256 timeElapsed = block.timestamp - lastUpdateTime;
            if (block.timestamp > endTime) {
                timeElapsed = endTime - lastUpdateTime;
            }
            rewardPerToken += (timeElapsed * rewardRate * 1e18) / totalStaked;
        }
        
        return (
            userStaked[user] * (rewardPerToken - userRewardPerTokenPaid[user]) / 1e18
        ) + rewards[user];
    }
    
    /**
     * @dev Get user info
     */
    function getUserInfo(address user) external view returns (
        uint256 staked,
        uint256 pending,
        uint256 lastStake
    ) {
        staked = userStaked[user];
        pending = this.pendingReward(user);
        lastStake = lastStakeTime[user];
    }
    
    /**
     * @dev Get farming info
     */
    function getFarmingInfo() external view returns (
        uint256 _totalStaked,
        uint256 _rewardRate,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _timeRemaining
    ) {
        _totalStaked = totalStaked;
        _rewardRate = rewardRate;
        _startTime = startTime;
        _endTime = endTime;
        _timeRemaining = block.timestamp < endTime ? endTime - block.timestamp : 0;
    }
    
    /**
     * @dev Update reward for a user
     */
    function _updateReward(address user) internal {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        
        if (user != address(0)) {
            rewards[user] = earned(user);
            userRewardPerTokenPaid[user] = rewardPerTokenStored;
        }
    }
    
    /**
     * @dev Calculate reward per token
     */
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
    
    /**
     * @dev Calculate earned rewards for a user
     */
    function earned(address user) public view returns (uint256) {
        return (
            userStaked[user] * (rewardPerToken() - userRewardPerTokenPaid[user]) / 1e18
        ) + rewards[user];
    }
    
    // === ADMIN FUNCTIONS ===
    
    /**
     * @dev Update reward rate
     */
    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        require(_rewardRate > 0, "Reward rate must be positive");
        
        _updateReward(address(0));
        rewardRate = _rewardRate;
        
        emit RewardRateUpdated(_rewardRate);
    }
    
    /**
     * @dev Update farming period
     */
    function setFarmingPeriod(uint256 _startTime, uint256 _endTime) external onlyOwner {
        require(_startTime >= block.timestamp, "Start time must be in the future");
        require(_endTime > _startTime, "End time must be after start time");
        
        startTime = _startTime;
        endTime = _endTime;
        
        emit FarmingPeriodUpdated(_startTime, _endTime);
    }
    
    /**
     * @dev Pause/unpause farming
     */
    function setPaused(bool _paused) external onlyOwner {
        if (_paused) {
            _pause();
        } else {
            _unpause();
        }
    }
    
    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner(), balance);
    }
    
    /**
     * @dev Recover stuck tokens (owner only)
     */
    function recoverToken(address token, uint256 amount) external onlyOwner {
        require(token != stakingToken && token != rewardToken, "Cannot recover staking or reward tokens");
        IERC20(token).transfer(owner(), amount);
    }
} 