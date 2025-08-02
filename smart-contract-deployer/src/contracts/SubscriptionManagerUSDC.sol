pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SubscriptionManagerUSDC is Ownable, ReentrancyGuard {
    enum PlanType { STARTER, PRO, ENTERPRISE }
    enum Duration { MONTHLY, YEARLY }
    
    struct Plan {
        uint256 monthlyPriceUSDC;    // Prix mensuel en USDC (6 decimals)
        uint256 yearlyPriceUSDC;     // Prix annuel en USDC (6 decimals)
        uint16 platformFeeRate;      // Frais de plateforme en bps (basis points)
        uint32 deploymentsLimit;     // Limite de déploiements
        bool active;                 // Plan actif ou non
    }
    
    struct Subscription {
        address subscriber;
        PlanType planType;
        Duration duration;
        uint256 expiresAt;
        uint256 lastPayment;
        bool autoRenew;
    }
    
    // Storage
    mapping(PlanType => Plan) public plans;
    mapping(address => Subscription) public subscriptions;
    
    address public immutable USDC;
    address public treasury;
    address public platformFeeAddress;
    
    uint256 public constant MONTHLY_DURATION = 30 days;
    uint256 public constant YEARLY_DURATION = 365 days;
    
    // Events
    event SubscriptionCreated(address indexed subscriber, PlanType planType, Duration duration, uint256 expiresAt);
    event SubscriptionRenewed(address indexed subscriber, PlanType planType, Duration duration, uint256 newExpiresAt);
    event PaymentReceived(address indexed subscriber, uint256 amount, Duration duration);
    event PlanUpdated(PlanType planType, uint256 monthlyPriceUSDC, uint256 yearlyPriceUSDC);
    
    constructor(address _treasury, address _platformFeeAddress, address _usdc) Ownable() {
        treasury = _treasury;
        platformFeeAddress = _platformFeeAddress;
        USDC = _usdc;
        
        // Configuration des plans (prix en USDC avec 6 decimals)
        plans[PlanType.STARTER] = Plan({
            monthlyPriceUSDC: 9 * 10**6,         // $9 USDC
            yearlyPriceUSDC: 90 * 10**6,         // $90 USDC (économie de 2 mois)
            platformFeeRate: 150,                // 1.5%
            deploymentsLimit: 5,
            active: true
        });
        
        plans[PlanType.PRO] = Plan({
            monthlyPriceUSDC: 19 * 10**6,        // $19 USDC
            yearlyPriceUSDC: 190 * 10**6,        // $190 USDC (économie de 2 mois)
            platformFeeRate: 200,                // 2.0%
            deploymentsLimit: 100,
            active: true
        });
        
        plans[PlanType.ENTERPRISE] = Plan({
            monthlyPriceUSDC: 99 * 10**6,        // $99 USDC
            yearlyPriceUSDC: 990 * 10**6,        // $990 USDC (économie de 2 mois)
            platformFeeRate: 150,                // 1.5%
            deploymentsLimit: 1000,
            active: true
        });
    }
    
    /**
     * @dev Souscrire avec USDC uniquement
     */
    function subscribe(
        PlanType _planType,
        Duration _duration,
        bool _autoRenew
    ) external nonReentrant {
        Plan memory plan = plans[_planType];
        require(plan.active, "Plan not active");
        
        uint256 amount = _duration == Duration.MONTHLY 
            ? plan.monthlyPriceUSDC 
            : plan.yearlyPriceUSDC;
        
        // Transférer USDC du utilisateur vers le treasury
        IERC20(USDC).transferFrom(msg.sender, treasury, amount);
        
        // Créer ou renouveler la souscription
        _createOrRenewSubscription(msg.sender, _planType, _duration, _autoRenew);
        
        emit PaymentReceived(msg.sender, amount, _duration);
    }
    
    /**
     * @dev Créer ou renouveler une souscription
     */
    function _createOrRenewSubscription(
        address _subscriber,
        PlanType _planType,
        Duration _duration,
        bool _autoRenew
    ) internal {
        Subscription storage sub = subscriptions[_subscriber];
        
        uint256 subscriptionDuration = _duration == Duration.MONTHLY 
            ? MONTHLY_DURATION 
            : YEARLY_DURATION;
        
        uint256 newExpiresAt;
        
        if (sub.expiresAt > block.timestamp) {
            // Étendre la souscription existante
            newExpiresAt = sub.expiresAt + subscriptionDuration;
            emit SubscriptionRenewed(_subscriber, _planType, _duration, newExpiresAt);
        } else {
            // Nouvelle souscription
            newExpiresAt = block.timestamp + subscriptionDuration;
            emit SubscriptionCreated(_subscriber, _planType, _duration, newExpiresAt);
        }
        
        sub.subscriber = _subscriber;
        sub.planType = _planType;
        sub.duration = _duration;
        sub.expiresAt = newExpiresAt;
        sub.lastPayment = block.timestamp;
        sub.autoRenew = _autoRenew;
    }
    
    /**
     * @dev Obtenir les prix d'un plan
     */
    function getPricing(PlanType _planType, Duration _duration) external view returns (
        uint256 priceUSDC,
        uint256 durationSeconds
    ) {
        Plan memory plan = plans[_planType];
        
        if (_duration == Duration.MONTHLY) {
            return (plan.monthlyPriceUSDC, MONTHLY_DURATION);
        } else {
            return (plan.yearlyPriceUSDC, YEARLY_DURATION);
        }
    }
    
    /**
     * @dev Calculer les économies annuelles
     */
    function getYearlySavings(PlanType _planType) external view returns (
        uint256 savingsUSDC,
        uint256 savingsPercentage
    ) {
        Plan memory plan = plans[_planType];
        uint256 yearlyAsMonthlyUSDC = plan.monthlyPriceUSDC * 12;
        
        savingsUSDC = yearlyAsMonthlyUSDC - plan.yearlyPriceUSDC;
        savingsPercentage = (savingsUSDC * 100) / yearlyAsMonthlyUSDC;
        
        return (savingsUSDC, savingsPercentage);
    }
    
    /**
     * @dev Vérifier si un utilisateur a une souscription active
     */
    function hasActiveSubscription(address _user) external view returns (bool) {
        return subscriptions[_user].expiresAt > block.timestamp;
    }
    
    /**
     * @dev Obtenir les détails d'une souscription
     */
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
            isActive ? plan.platformFeeRate : 200, // Frais par défaut si pas d'abonnement
            isActive ? plan.deploymentsLimit : 0,
            isActive
        );
    }
    
    // === ADMIN FUNCTIONS ===
    
    /**
     * @dev Mettre à jour un plan (owner uniquement)
     */
    function updatePlan(
        PlanType _planType,
        uint256 _monthlyPriceUSDC,
        uint256 _yearlyPriceUSDC,
        uint16 _platformFeeRate,
        uint32 _deploymentsLimit
    ) external onlyOwner {
        Plan storage plan = plans[_planType];
        plan.monthlyPriceUSDC = _monthlyPriceUSDC;
        plan.yearlyPriceUSDC = _yearlyPriceUSDC;
        plan.platformFeeRate = _platformFeeRate;
        plan.deploymentsLimit = _deploymentsLimit;
        
        emit PlanUpdated(_planType, _monthlyPriceUSDC, _yearlyPriceUSDC);
    }
    
    /**
     * @dev Activer/désactiver un plan
     */
    function setPlanActive(PlanType _planType, bool _active) external onlyOwner {
        plans[_planType].active = _active;
    }
    
    /**
     * @dev Mettre à jour l'adresse du treasury
     */
    function updateTreasury(address _newTreasury) external onlyOwner {
        treasury = _newTreasury;
    }
    
    /**
     * @dev Retrait d'urgence (si des tokens sont bloqués)
     */
    function emergencyWithdraw(address _token) external onlyOwner {
        if (_token == address(0)) {
            // ETH
            (bool success, ) = owner().call{value: address(this).balance}("");
            require(success, "ETH withdraw failed");
        } else {
            // ERC20
            IERC20 token = IERC20(_token);
            uint256 balance = token.balanceOf(address(this));
            require(token.transfer(owner(), balance), "Token withdraw failed");
        }
    }
} 