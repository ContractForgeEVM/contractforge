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