// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title LiquidityPool
 * @dev A simplified Uniswap V3-style liquidity pool
 */
contract LiquidityPool is Ownable, ReentrancyGuard, Pausable {
    // Token addresses
    address public immutable tokenA;
    address public immutable tokenB;
    
    // Pool configuration
    uint256 public immutable fee;
    uint256 public immutable tickSpacing;
    uint256 public initialPrice;
    
    // Pool state
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public totalSupply;
    
    // Fee collector
    address public feeCollector;
    
    // Events
    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 shares);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 shares);
    event Swap(address indexed user, address indexed tokenIn, uint256 amountIn, uint256 amountOut);
    event FeeCollected(uint256 amountA, uint256 amountB);
    
    // Errors
    error InsufficientLiquidity();
    error InvalidAmount();
    error InvalidTokens();
    error SlippageExceeded();
    
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
        tickSpacing = _fee == 500 ? 10 : _fee == 3000 ? 60 : 200;
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Add liquidity to the pool
     */
    function addLiquidity(
        uint256 amountA,
        uint256 amountB,
        uint256 minShares
    ) external nonReentrant whenNotPaused returns (uint256 shares) {
        require(amountA > 0 && amountB > 0, "Amounts must be positive");
        
        uint256 _totalSupply = totalSupply;
        uint256 _reserveA = reserveA;
        uint256 _reserveB = reserveB;
        
        if (_totalSupply == 0) {
            // Initial liquidity
            shares = sqrt(amountA * amountB);
            require(shares >= minShares, "Insufficient shares");
        } else {
            // Calculate shares based on current reserves
            uint256 sharesA = (amountA * _totalSupply) / _reserveA;
            uint256 sharesB = (amountB * _totalSupply) / _reserveB;
            shares = sharesA < sharesB ? sharesA : sharesB;
            require(shares >= minShares, "Insufficient shares");
        }
        
        // Transfer tokens from user
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);
        
        // Update reserves
        reserveA += amountA;
        reserveB += amountB;
        totalSupply += shares;
        
        emit LiquidityAdded(msg.sender, amountA, amountB, shares);
    }
    
    /**
     * @dev Remove liquidity from the pool
     */
    function removeLiquidity(
        uint256 shares,
        uint256 minAmountA,
        uint256 minAmountB
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        require(shares > 0, "Shares must be positive");
        require(shares <= totalSupply, "Insufficient shares");
        
        uint256 _totalSupply = totalSupply;
        amountA = (shares * reserveA) / _totalSupply;
        amountB = (shares * reserveB) / _totalSupply;
        
        require(amountA >= minAmountA && amountB >= minAmountB, "Slippage exceeded");
        
        // Update reserves
        reserveA -= amountA;
        reserveB -= amountB;
        totalSupply -= shares;
        
        // Transfer tokens to user
        IERC20(tokenA).transfer(msg.sender, amountA);
        IERC20(tokenB).transfer(msg.sender, amountB);
        
        emit LiquidityRemoved(msg.sender, amountA, amountB, shares);
    }
    
    /**
     * @dev Swap tokens
     */
    function swap(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        require(tokenIn == tokenA || tokenIn == tokenB, "Invalid token");
        require(amountIn > 0, "Amount must be positive");
        
        address tokenOut = tokenIn == tokenA ? tokenB : tokenA;
        uint256 reserveIn = tokenIn == tokenA ? reserveA : reserveB;
        uint256 reserveOut = tokenIn == tokenA ? reserveB : reserveA;
        
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        // Calculate amount out with fee
        uint256 amountInWithFee = amountIn * (10000 - fee);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * 10000 + amountInWithFee);
        
        require(amountOut >= minAmountOut, "Slippage exceeded");
        require(amountOut < reserveOut, "Insufficient output");
        
        // Transfer tokens
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        
        // Update reserves
        if (tokenIn == tokenA) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }
        
        emit Swap(msg.sender, tokenIn, amountIn, amountOut);
    }
    
    /**
     * @dev Get current price (tokenB per tokenA)
     */
    function getPrice() external view returns (uint256) {
        if (reserveA == 0 || reserveB == 0) return initialPrice;
        return (reserveB * 1e18) / reserveA;
    }
    
    /**
     * @dev Get reserves
     */
    function getReserves() external view returns (uint256 _reserveA, uint256 _reserveB) {
        _reserveA = reserveA;
        _reserveB = reserveB;
    }
    
    /**
     * @dev Calculate amount out for a given amount in
     */
    function getAmountOut(
        address tokenIn,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        require(tokenIn == tokenA || tokenIn == tokenB, "Invalid token");
        require(amountIn > 0, "Amount must be positive");
        
        uint256 reserveIn = tokenIn == tokenA ? reserveA : reserveB;
        uint256 reserveOut = tokenIn == tokenA ? reserveB : reserveA;
        
        if (reserveIn == 0 || reserveOut == 0) return 0;
        
        uint256 amountInWithFee = amountIn * (10000 - fee);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * 10000 + amountInWithFee);
    }
    
    /**
     * @dev Collect accumulated fees
     */
    function collectFees() external {
        require(msg.sender == feeCollector || msg.sender == owner(), "Not authorized");
        
        uint256 feeAmountA = (reserveA * fee) / 10000;
        uint256 feeAmountB = (reserveB * fee) / 10000;
        
        if (feeAmountA > 0) {
            IERC20(tokenA).transfer(feeCollector, feeAmountA);
            reserveA -= feeAmountA;
        }
        
        if (feeAmountB > 0) {
            IERC20(tokenB).transfer(feeCollector, feeAmountB);
            reserveB -= feeAmountB;
        }
        
        emit FeeCollected(feeAmountA, feeAmountB);
    }
    
    /**
     * @dev Pause/unpause the pool
     */
    function setPaused(bool _paused) external onlyOwner {
        if (_paused) {
            _pause();
        } else {
            _unpause();
        }
    }
    
    /**
     * @dev Update fee collector
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner(), balance);
    }
    
    /**
     * @dev Calculate square root
     */
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
} 