// Exemples de contrats pour tester l'audit de sécurité

export const AUDIT_EXAMPLES = {
  // Contrat sécurisé avec bonnes pratiques
  secure: {
    name: "SecureToken",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract SecureToken is ERC20, Ownable, ReentrancyGuard, Pausable {
    uint256 public maxSupply;
    bool public mintingEnabled;
    
    event MintingToggled(bool enabled);
    event MaxSupplyUpdated(uint256 newMaxSupply);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 _maxSupply
    ) ERC20(name, symbol) Ownable() {
        require(_maxSupply >= initialSupply, "Max supply must be >= initial supply");
        maxSupply = _maxSupply;
        mintingEnabled = true;
        
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
    }
    
    function mint(address to, uint256 amount) 
        external 
        onlyOwner 
        nonReentrant 
        whenNotPaused 
    {
        require(mintingEnabled, "Minting is disabled");
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= maxSupply, "Would exceed max supply");
        
        _mint(to, amount);
    }
    
    function toggleMinting() external onlyOwner {
        mintingEnabled = !mintingEnabled;
        emit MintingToggled(mintingEnabled);
    }
    
    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply >= totalSupply(), "New max supply must be >= current supply");
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function transfer(address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.transferFrom(from, to, amount);
    }
}`
  },

  // Contrat avec vulnérabilités
  vulnerable: {
    name: "VulnerableToken",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

contract VulnerableToken {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    string public name = "Vulnerable Token";
    string public symbol = "VULN";
    uint256 public totalSupply;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        totalSupply = 1000000 * 10**18;
        balances[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // VULNERABILITY: State change after external call
        balances[msg.sender] -= amount;
        balances[to] += amount;
        
        // External call without protection
        if (to.isContract()) {
            // This could trigger reentrancy
            (bool success,) = to.call("");
            if (!success) {
                revert();
            }
        }
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(balances[from] >= amount, "Insufficient balance");
        require(allowances[from][msg.sender] >= amount, "Insufficient allowance");
        
        // VULNERABILITY: Unchecked arithmetic (Solidity < 0.8.0)
        balances[from] -= amount;
        balances[to] += amount;
        allowances[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }
    
    // VULNERABILITY: Use of tx.origin
    function withdraw() public {
        require(tx.origin == msg.sender, "Only EOA can withdraw");
        uint256 balance = balances[msg.sender];
        balances[msg.sender] = 0;
        
        // VULNERABILITY: Unchecked transfer
        msg.sender.transfer(balance);
    }
    
    // VULNERABILITY: Block timestamp dependency
    function timeLockedFunction() public {
        require(block.timestamp > 1640995200, "Too early");
        // Function logic here
    }
    
    // VULNERABILITY: Selfdestruct function
    function destroy() public {
        selfdestruct(payable(msg.sender));
    }
    
    // VULNERABILITY: Inline assembly
    function dangerousAssembly() public pure returns (uint256) {
        assembly {
            let result := 42
            return(result, 32)
        }
    }
    
    // VULNERABILITY: Low level call
    function lowLevelCall(address target) public {
        (bool success,) = target.call("");
        require(success, "Call failed");
    }
    
    // VULNERABILITY: Storage in loop
    function expensiveLoop() public {
        for (uint i = 0; i < 100; i++) {
            balances[msg.sender] += 1; // Storage operation in loop
        }
    }
}`
  },

  // Contrat avec vulnérabilités moyennes
  medium: {
    name: "MediumRiskToken",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MediumRiskToken is ERC20, Ownable {
    uint256 public maxSupply;
    bool public mintingEnabled;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 _maxSupply
    ) ERC20(name, symbol) Ownable() {
        maxSupply = _maxSupply;
        mintingEnabled = true;
        
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        require(mintingEnabled, "Minting is disabled");
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= maxSupply, "Would exceed max supply");
        
        _mint(to, amount);
    }
    
    function toggleMinting() external onlyOwner {
        mintingEnabled = !mintingEnabled;
    }
    
    // MEDIUM RISK: Block number dependency
    function timeBasedFunction() public view returns (bool) {
        return block.number > 1000000;
    }
    
    // MEDIUM RISK: Unchecked transfer return value
    function transferTokens(address token, address to, uint256 amount) external {
        // This could fail silently
        IERC20(token).transfer(to, amount);
    }
    
    // MEDIUM RISK: Gas optimization issue
    function expensiveFunction() public {
        for (uint i = 0; i < 50; i++) {
            // Storage operation in loop
            maxSupply += 1;
        }
    }
    
    // MEDIUM RISK: Nested mappings
    mapping(address => mapping(address => mapping(uint256 => bool))) public complexMapping;
    
    function setComplexMapping(address a, address b, uint256 c, bool value) external {
        complexMapping[a][b][c] = value;
    }
    
    // MEDIUM RISK: Array deletion
    uint256[] public items;
    
    function addItem(uint256 item) external {
        items.push(item);
    }
    
    function removeItem(uint256 index) external {
        require(index < items.length, "Index out of bounds");
        delete items[index]; // Expensive operation
    }
}`
  }
}

// Interface pour les exemples
export interface AuditExample {
  name: string
  code: string
  description: string
  expectedScore: number
  expectedGrade: string
  vulnerabilities: string[]
}

export const AUDIT_EXAMPLES_WITH_INFO: Record<string, AuditExample> = {
  secure: {
    name: "SecureToken",
    code: AUDIT_EXAMPLES.secure.code,
    description: "Contrat sécurisé avec toutes les bonnes pratiques OpenZeppelin",
    expectedScore: 95,
    expectedGrade: "A",
    vulnerabilities: []
  },
  vulnerable: {
    name: "VulnerableToken",
    code: AUDIT_EXAMPLES.vulnerable.code,
    description: "Contrat avec de nombreuses vulnérabilités critiques",
    expectedScore: 25,
    expectedGrade: "F",
    vulnerabilities: [
      "Reentrancy attacks",
      "Use of tx.origin",
      "Unchecked arithmetic",
      "Block timestamp dependency",
      "Selfdestruct function",
      "Inline assembly",
      "Low level calls",
      "Storage operations in loops"
    ]
  },
  medium: {
    name: "MediumRiskToken",
    code: AUDIT_EXAMPLES.medium.code,
    description: "Contrat avec quelques vulnérabilités moyennes",
    expectedScore: 65,
    expectedGrade: "D",
    vulnerabilities: [
      "Block number dependency",
      "Unchecked transfer return values",
      "Gas optimization issues",
      "Nested mappings",
      "Array deletion"
    ]
  }
} 

export const VULNERABLE_CONTRACT: AuditExample = {
  name: "VulnerableContract",
  description: "Contrat avec plusieurs vulnérabilités Not So Smart Contracts",
  expectedScore: 20,
  expectedGrade: "F",
  vulnerabilities: [
    "Bad Randomness (block.timestamp)",
    "Race Condition (transfer sans protection)",
    "Denial of Service (boucle infinie)",
    "Rug Pull (transferOwnership non protégé)",
    "Honeypot (require(false))",
    "Forced Ether Reception (receive())",
    "Constructor Error (ancienne syntaxe)",
    "Variable Shadowing"
  ],
  code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VulnerableContract {
    uint256 public balance;
    address public owner;
    mapping(address => uint256) public userBalances;
    
    // CONSTRUCTOR_ERROR: Ancienne syntaxe de constructeur
    function VulnerableContract() {
        owner = msg.sender;
    }
    
    // BAD_RANDOMNESS: Utilisation de block.timestamp pour la randomisation
    function randomNumber() public view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % 100;
    }
    
    // RACE_CONDITION: Appel externe sans protection
    function withdraw() public {
        uint256 amount = userBalances[msg.sender];
        require(amount > 0, "No balance");
        
        userBalances[msg.sender] = 0;
        payable(msg.sender).transfer(amount); // Appel externe sans protection
    }
    
    // DENIAL_OF_SERVICE: Boucle dans fonction publique
    function processUsers(address[] memory users) public {
        for (uint i = 0; i < users.length; i++) {
            userBalances[users[i]] += 1; // Boucle sans limite
        }
    }
    
    // RUG_PULL: Fonction critique non protégée
    function transferOwnership(address newOwner) public {
        owner = newOwner; // Pas de modifier onlyOwner
    }
    
    // HONEYPOT: Code qui force l'échec
    function buy() public payable {
        require(false, "This will always fail"); // Honeypot
    }
    
    // FORCED_ETHER: Fonction receive
    receive() external payable {
        balance += msg.value;
    }
    
    // VARIABLE_SHADOWING: Variable locale qui masque une globale
    function setBalance(uint256 balance) public {
        balance = balance; // Variable locale masque la variable d'état
    }
}`
} 

export const ADVANCED_VULNERABLE_CONTRACT: AuditExample = {
  name: "AdvancedVulnerableContract",
  description: "Contrat avec les 4 nouvelles vulnérabilités Not So Smart Contracts",
  expectedScore: 15,
  expectedGrade: "F",
  vulnerabilities: [
    "Integer Overflow (opérations arithmétiques)",
    "Unchecked External Call (appels non vérifiés)",
    "Incorrect Interface (interface non implémentée)",
    "Wrong Constructor Name (ancienne syntaxe)"
  ],
  code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract AdvancedVulnerableContract {
    uint256 public totalSupply;
    mapping(address => uint256) public balances;
    
    // WRONG_CONSTRUCTOR_NAME: Ancienne syntaxe de constructeur
    function AdvancedVulnerableContract() {
        totalSupply = 1000000;
    }
    
    // INTEGER_OVERFLOW: Opérations arithmétiques sans vérification
    function addBalance(address user, uint256 amount) public {
        balances[user] = balances[user] + amount; // Pas de vérification de débordement
    }
    
    function multiplyBalance(address user, uint256 factor) public {
        balances[user] = balances[user] * factor; // Multiplication sans vérification
    }
    
    function subtractBalance(address user, uint256 amount) public {
        balances[user] = balances[user] - amount; // Soustraction sans vérification
    }
    
    // UNCHECKED_EXTERNAL_CALL: Appels externes non vérifiés
    function unsafeCall(address target, bytes memory data) public {
        target.call(data); // Pas de vérification du retour
    }
    
    function unsafeDelegateCall(address target, bytes memory data) public {
        target.delegatecall(data); // Pas de vérification du retour
    }
    
    function unsafeStaticCall(address target, bytes memory data) public {
        target.staticcall(data); // Pas de vérification du retour
    }
    
    // INTERFACE_ERROR: Interface déclarée mais non implémentée
    // Le contrat ne déclare pas "is IToken" donc l'interface n'est pas implémentée
    
    function transfer(address to, uint256 amount) public returns (bool) {
        // Cette fonction ne correspond pas à l'interface IToken
        if (balances[msg.sender] >= amount) {
            balances[msg.sender] -= amount;
            balances[to] += amount;
            return true;
        }
        return false;
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }
}`
} 