pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PriceOracle.sol";
contract SubscriptionManager is Ownable, ReentrancyGuard {
    enum PlanType { STARTER, PRO, ENTERPRISE }
    enum Duration { MONTHLY, YEARLY }
    struct Plan {
        uint256 monthlyPriceETH;     
        uint256 monthlyPriceUSDC;    
        uint256 yearlyPriceETH;      
        uint256 yearlyPriceUSDC;     
        uint16 platformFeeRate;      
        uint32 deploymentsLimit;     
        bool active;                 
    }
    struct Subscription {
        address subscriber;
        PlanType planType;
        Duration duration;
        uint256 expiresAt;
        uint256 lastPayment;
        bool autoRenew;
        address paymentToken;        
    }
    mapping(PlanType => Plan) public plans;
    mapping(address => Subscription) public subscriptions;
    mapping(address => bool) public supportedTokens;
    address public immutable USDC;
    address public treasury;
    address public platformFeeAddress;
    PriceOracle public priceOracle;
    uint256 public constant MONTHLY_DURATION = 30 days;
    uint256 public constant YEARLY_DURATION = 365 days;
    event SubscriptionCreated(address indexed subscriber, PlanType planType, Duration duration, uint256 expiresAt);
    event SubscriptionRenewed(address indexed subscriber, PlanType planType, Duration duration, uint256 newExpiresAt);
    event PaymentReceived(address indexed subscriber, address token, uint256 amount, Duration duration);
    event PlanUpdated(PlanType planType, uint256 monthlyPriceETH, uint256 yearlyPriceETH);
    constructor(address _treasury, address _platformFeeAddress, address _usdc, address _priceOracle) Ownable(msg.sender) {
        treasury = _treasury;
        platformFeeAddress = _platformFeeAddress;
        USDC = _usdc;
        priceOracle = PriceOracle(_priceOracle);
        plans[PlanType.STARTER] = Plan({
            monthlyPriceETH: 0.003 ether,        
            monthlyPriceUSDC: 9 * 10**6,         
            yearlyPriceETH: 0.03 ether,          
            yearlyPriceUSDC: 90 * 10**6,         
            platformFeeRate: 150,                
            deploymentsLimit: 5,
            active: true
        });
        plans[PlanType.PRO] = Plan({
            monthlyPriceETH: 0.0063 ether,       
            monthlyPriceUSDC: 19 * 10**6,        
            yearlyPriceETH: 0.063 ether,         
            yearlyPriceUSDC: 190 * 10**6,        
            platformFeeRate: 200,                
            deploymentsLimit: 100,
            active: true
        });
        plans[PlanType.ENTERPRISE] = Plan({
            monthlyPriceETH: 0.033 ether,        
            monthlyPriceUSDC: 99 * 10**6,        
            yearlyPriceETH: 0.33 ether,          
            yearlyPriceUSDC: 990 * 10**6,        
            platformFeeRate: 150,                
            deploymentsLimit: 1000,
            active: true
        });
        supportedTokens[address(0)] = true;  
        supportedTokens[USDC] = true;         
    }
    function subscribeWithETH(
        PlanType _planType, 
        Duration _duration,
        bool _autoRenew
    ) external payable nonReentrant {
        Plan memory plan = plans[_planType];
        require(plan.active, "Plan not active");
        uint256 usdPrice = _duration == Duration.MONTHLY 
            ? plan.monthlyPriceUSDC 
            : plan.yearlyPriceUSDC;
        uint256 requiredETH = priceOracle.calculateTokenAmount("ETH", usdPrice);
        require(msg.value >= requiredETH, "Insufficient payment");
        _createOrRenewSubscription(msg.sender, _planType, _duration, _autoRenew, address(0));
        (bool success, ) = treasury.call{value: msg.value}("");
        require(success, "Payment transfer failed");
        emit PaymentReceived(msg.sender, address(0), msg.value, _duration);
    }
    function subscribeWithUSDC(
        PlanType _planType,
        Duration _duration,
        bool _autoRenew
    ) external nonReentrant {
        require(supportedTokens[USDC], "USDC not supported");
        Plan memory plan = plans[_planType];
        require(plan.active, "Plan not active");
        uint256 amount = _duration == Duration.MONTHLY 
            ? plan.monthlyPriceUSDC 
            : plan.yearlyPriceUSDC;
        IERC20(USDC).transferFrom(msg.sender, treasury, amount);
        _createOrRenewSubscription(msg.sender, _planType, _duration, _autoRenew, USDC);
        emit PaymentReceived(msg.sender, USDC, amount, _duration);
    }
    function _createOrRenewSubscription(
        address _subscriber,
        PlanType _planType,
        Duration _duration,
        bool _autoRenew,
        address _paymentToken
    ) internal {
        Subscription storage sub = subscriptions[_subscriber];
        uint256 subscriptionDuration = _duration == Duration.MONTHLY 
            ? MONTHLY_DURATION 
            : YEARLY_DURATION;
        uint256 newExpiresAt;
        if (sub.expiresAt > block.timestamp) {
            newExpiresAt = sub.expiresAt + subscriptionDuration;
            emit SubscriptionRenewed(_subscriber, _planType, _duration, newExpiresAt);
        } else {
            newExpiresAt = block.timestamp + subscriptionDuration;
            emit SubscriptionCreated(_subscriber, _planType, _duration, newExpiresAt);
        }
        sub.subscriber = _subscriber;
        sub.planType = _planType;
        sub.duration = _duration;
        sub.expiresAt = newExpiresAt;
        sub.lastPayment = block.timestamp;
        sub.autoRenew = _autoRenew;
        sub.paymentToken = _paymentToken;
    }
    function getPricing(PlanType _planType, Duration _duration) external view returns (
        uint256 priceETH,
        uint256 priceUSDC,
        uint256 durationSeconds
    ) {
        Plan memory plan = plans[_planType];
        uint256 usdPrice = _duration == Duration.MONTHLY 
            ? plan.monthlyPriceUSDC 
            : plan.yearlyPriceUSDC;
        uint256 ethPrice = priceOracle.calculateTokenAmount("ETH", usdPrice);
        if (_duration == Duration.MONTHLY) {
            return (ethPrice, plan.monthlyPriceUSDC, MONTHLY_DURATION);
        } else {
            return (ethPrice, plan.yearlyPriceUSDC, YEARLY_DURATION);
        }
    }
    function getYearlySavings(PlanType _planType) external view returns (
        uint256 savingsETH,
        uint256 savingsUSDC,
        uint256 savingsPercentage
    ) {
        Plan memory plan = plans[_planType];
        uint256 yearlyAsMonthlyETH = plan.monthlyPriceETH * 12;
        uint256 yearlyAsMonthlyUSDC = plan.monthlyPriceUSDC * 12;
        savingsETH = yearlyAsMonthlyETH - plan.yearlyPriceETH;
        savingsUSDC = yearlyAsMonthlyUSDC - plan.yearlyPriceUSDC;
        savingsPercentage = (savingsETH * 100) / yearlyAsMonthlyETH; 
        return (savingsETH, savingsUSDC, savingsPercentage);
    }
    function hasActiveSubscription(address _user) external view returns (bool) {
        return subscriptions[_user].expiresAt > block.timestamp;
    }
    function getSubscription(address _user) external view returns (
        PlanType planType,
        Duration duration,
        uint256 expiresAt,
        uint16 platformFeeRate,
        uint32 deploymentsLimit,
        bool canDeploy
    ) {
        Subscription memory sub = subscriptions[_user];
        Plan memory plan = plans[sub.planType];
        bool isActive = sub.expiresAt > block.timestamp;
        return (
            sub.planType,
            sub.duration,
            sub.expiresAt,
            isActive ? plan.platformFeeRate : 200, 
            isActive ? plan.deploymentsLimit : 0,
            isActive
        );
    }
    function updatePlan(
        PlanType _planType,
        uint256 _monthlyPriceETH,
        uint256 _monthlyPriceUSDC,
        uint256 _yearlyPriceETH,
        uint256 _yearlyPriceUSDC,
        uint16 _platformFeeRate,
        uint32 _deploymentsLimit
    ) external onlyOwner {
        Plan storage plan = plans[_planType];
        plan.monthlyPriceETH = _monthlyPriceETH;
        plan.monthlyPriceUSDC = _monthlyPriceUSDC;
        plan.yearlyPriceETH = _yearlyPriceETH;
        plan.yearlyPriceUSDC = _yearlyPriceUSDC;
        plan.platformFeeRate = _platformFeeRate;
        plan.deploymentsLimit = _deploymentsLimit;
        emit PlanUpdated(_planType, _monthlyPriceETH, _yearlyPriceETH);
    }
    function setSupportedToken(address _token, bool _supported) external onlyOwner {
        supportedTokens[_token] = _supported;
    }
    function updateTreasury(address _newTreasury) external onlyOwner {
        treasury = _newTreasury;
    }
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
}