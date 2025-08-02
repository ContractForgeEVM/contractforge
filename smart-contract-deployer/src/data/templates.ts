import type { ContractTemplate } from '../types'
export const templates: ContractTemplate[] = [
  {
    id: 'token',
    name: 'ERC20 Token',
    description: 'Create your own ERC20 token with customizable supply and decimals',
    icon: '🪙',
    fields: [
      {
        name: 'name',
        label: 'contractName',
        type: 'text',
        placeholder: 'MyToken',
        defaultValue: 'MyToken',
        validation: {
          required: true
        }
      },
      {
        name: 'symbol',
        label: 'symbol',
        type: 'text',
        placeholder: 'MTK',
        defaultValue: 'MTK',
        validation: {
          required: true,
          pattern: '^[A-Z]{1,5}$'
        }
      },
      {
        name: 'totalSupply',
        label: 'totalSupply',
        type: 'number',
        placeholder: '1000000',
        defaultValue: 1000000,
        validation: {
          required: true,
          min: 1
        }
      },
      {
        name: 'decimals',
        label: 'decimals',
        type: 'number',
        placeholder: '18',
        defaultValue: 18,
        validation: {
          required: true,
          min: 0,
          max: 18
        }
      }
    ]
  },
  {
    id: 'nft',
    name: 'NFT Collection',
    description: 'Deploy an NFT collection with minting capabilities',
    icon: '🎨',
    fields: [
      {
        name: 'name',
        label: 'contractName',
        type: 'text',
        placeholder: 'MyNFTCollection',
        defaultValue: 'MyNFTCollection',
        validation: {
          required: true
        }
      },
      {
        name: 'symbol',
        label: 'symbol',
        type: 'text',
        placeholder: 'MNFT',
        defaultValue: 'MNFT',
        validation: {
          required: true,
          pattern: '^[A-Z]{1,5}$'
        }
      },
      {
        name: 'maxSupply',
        label: 'maxSupply',
        type: 'number',
        placeholder: '10000',
        defaultValue: 10000,
        validation: {
          required: true,
          min: 1
        }
      },
      {
        name: 'baseURI',
        label: 'baseURI',
        type: 'text',
        placeholder: 'https://api.example.com/metadata/',
        defaultValue: '',
        validation: {
          required: false
        }
      }
    ]
  },
  {
    id: 'dao',
    name: 'DAO',
    description: 'Create a decentralized autonomous organization',
    icon: '🏛️',
    fields: [
      {
        name: 'name',
        label: 'contractName',
        type: 'text',
        placeholder: 'MyDAO',
        defaultValue: 'MyDAO',
        validation: {
          required: true
        }
      },
      {
        name: 'governanceTokenAddress',
        label: 'governanceTokenAddress',
        type: 'address',
        placeholder: '0x...',
        defaultValue: '',
        validation: {
          required: true
        }
      },
      {
        name: 'proposalThreshold',
        label: 'proposalThreshold',
        type: 'number',
        placeholder: '100',
        defaultValue: 100,
        validation: {
          required: true,
          min: 1
        }
      },
      {
        name: 'votingPeriod',
        label: 'votingPeriod',
        type: 'number',
        placeholder: '50400',
        defaultValue: 50400,
        validation: {
          required: true,
          min: 1
        }
      }
    ]
  },
  {
    id: 'lock',
    name: 'Token Lock',
    description: 'Lock tokens until a specified time',
    icon: '🔒',
    fields: [
      {
        name: 'tokenAddress',
        label: 'Token Address',
        type: 'address',
        placeholder: '0x...',
        defaultValue: '',
        validation: {
          required: true
        }
      },
      {
        name: 'beneficiary',
        label: 'beneficiary',
        type: 'address',
        placeholder: '0x...',
        defaultValue: '',
        validation: {
          required: true
        }
      },
      {
        name: 'unlockTime',
        label: 'unlockTime',
        type: 'datetime',
        placeholder: '',
        defaultValue: '',
        validation: {
          required: true
        }
      }
    ]
  },
  // === NOUVEAUX TEMPLATES ===
  {
    id: 'liquidity-pool',
    name: 'Liquidity Pool',
    description: 'Create a Uniswap V3-style liquidity pool for token trading',
    icon: '💧',
    fields: [
      {
        name: 'name',
        label: 'Pool Name',
        type: 'text',
        placeholder: 'ETH/USDC Pool',
        defaultValue: 'Liquidity Pool',
        validation: {
          required: true
        }
      },
      {
        name: 'tokenA',
        label: 'Token A Address',
        type: 'address',
        placeholder: '0x...',
        defaultValue: '',
        validation: {
          required: true
        }
      },
      {
        name: 'tokenB',
        label: 'Token B Address',
        type: 'address',
        placeholder: '0x...',
        defaultValue: '',
        validation: {
          required: true
        }
      },
      {
        name: 'fee',
        label: 'Fee Tier (bps)',
        type: 'select',
        options: [
          { value: 500, label: '0.05% (500 bps)' },
          { value: 3000, label: '0.3% (3000 bps)' },
          { value: 10000, label: '1% (10000 bps)' }
        ],
        defaultValue: 3000,
        validation: {
          required: true
        }
      },
      {
        name: 'initialPrice',
        label: 'Initial Price (Token B per Token A)',
        type: 'number',
        placeholder: '1.0',
        defaultValue: 1.0,
        validation: {
          required: true,
          min: 0.000001
        }
      }
    ]
  },
  {
    id: 'yield-farming',
    name: 'Yield Farming',
    description: 'Deploy a yield farming protocol with staking rewards',
    icon: '🌾',
    fields: [
      {
        name: 'name',
        label: 'Farm Name',
        type: 'text',
        placeholder: 'My Yield Farm',
        defaultValue: 'Yield Farm',
        validation: {
          required: true
        }
      },
      {
        name: 'stakingToken',
        label: 'Staking Token Address',
        type: 'address',
        placeholder: '0x...',
        defaultValue: '',
        validation: {
          required: true
        }
      },
      {
        name: 'rewardToken',
        label: 'Reward Token Address',
        type: 'address',
        placeholder: '0x...',
        defaultValue: '',
        validation: {
          required: true
        }
      },
      {
        name: 'rewardRate',
        label: 'Reward Rate (tokens per second)',
        type: 'number',
        placeholder: '0.001',
        defaultValue: 0.001,
        validation: {
          required: true,
          min: 0.000001
        }
      },
      {
        name: 'duration',
        label: 'Farming Duration (days)',
        type: 'number',
        placeholder: '30',
        defaultValue: 30,
        validation: {
          required: true,
          min: 1,
          max: 365
        }
      }
    ]
  },
  {
    id: 'gamefi-token',
    name: 'GameFi Token',
    description: 'Create a gaming token with play-to-earn mechanics',
    icon: '🎮',
    fields: [
      {
        name: 'name',
        label: 'Game Token Name',
        type: 'text',
        placeholder: 'MyGameToken',
        defaultValue: 'GameToken',
        validation: {
          required: true
        }
      },
      {
        name: 'symbol',
        label: 'Symbol',
        type: 'text',
        placeholder: 'GAME',
        defaultValue: 'GAME',
        validation: {
          required: true,
          pattern: '^[A-Z]{1,5}$'
        }
      },
      {
        name: 'maxSupply',
        label: 'Maximum Supply',
        type: 'number',
        placeholder: '1000000',
        defaultValue: 1000000,
        validation: {
          required: true,
          min: 1
        }
      },
      {
        name: 'mintPrice',
        label: 'Mint Price (ETH)',
        type: 'number',
        placeholder: '0.01',
        defaultValue: 0.01,
        validation: {
          required: true,
          min: 0
        }
      },
      {
        name: 'burnRate',
        label: 'Burn Rate (%)',
        type: 'number',
        placeholder: '2',
        defaultValue: 2,
        validation: {
          required: true,
          min: 0,
          max: 10
        }
      }
    ]
  },
  {
    id: 'nft-marketplace',
    name: 'NFT Marketplace',
    description: 'Deploy a complete NFT marketplace with trading capabilities',
    icon: '🏪',
    fields: [
      {
        name: 'name',
        label: 'Marketplace Name',
        type: 'text',
        placeholder: 'My NFT Market',
        defaultValue: 'NFT Market',
        validation: {
          required: true
        }
      },
      {
        name: 'nftContract',
        label: 'NFT Contract Address',
        type: 'address',
        placeholder: '0x...',
        defaultValue: '',
        validation: {
          required: true
        }
      },
      {
        name: 'platformFee',
        label: 'Platform Fee (%)',
        type: 'number',
        placeholder: '2.5',
        defaultValue: 2.5,
        validation: {
          required: true,
          min: 0,
          max: 10
        }
      },
      {
        name: 'creatorFee',
        label: 'Creator Fee (%)',
        type: 'number',
        placeholder: '5.0',
        defaultValue: 5.0,
        validation: {
          required: true,
          min: 0,
          max: 15
        }
      },
      {
        name: 'allowMinting',
        label: 'Allow Direct Minting',
        type: 'boolean',
        defaultValue: false,
        validation: {
          required: false
        }
      }
    ]
  },
  {
    id: 'revenue-sharing',
    name: 'Revenue Sharing',
    description: 'Create a token that distributes business revenue to holders',
    icon: '💰',
    fields: [
      {
        name: 'name',
        label: 'Revenue Token Name',
        type: 'text',
        placeholder: 'Revenue Token',
        defaultValue: 'Revenue Token',
        validation: {
          required: true
        }
      },
      {
        name: 'symbol',
        label: 'Symbol',
        type: 'text',
        placeholder: 'REV',
        defaultValue: 'REV',
        validation: {
          required: true,
          pattern: '^[A-Z]{1,5}$'
        }
      },
      {
        name: 'totalSupply',
        label: 'Total Supply',
        type: 'number',
        placeholder: '1000000',
        defaultValue: 1000000,
        validation: {
          required: true,
          min: 1
        }
      },
      {
        name: 'businessWallet',
        label: 'Business Wallet Address',
        type: 'address',
        placeholder: '0x...',
        defaultValue: '',
        validation: {
          required: true
        }
      },
      {
        name: 'distributionPeriod',
        label: 'Distribution Period (days)',
        type: 'number',
        placeholder: '30',
        defaultValue: 30,
        validation: {
          required: true,
          min: 1,
          max: 365
        }
      }
    ]
  },
  {
    id: 'loyalty-program',
    name: 'Loyalty Program',
    description: 'Deploy a customer loyalty program with points and rewards',
    icon: '🎯',
    fields: [
      {
        name: 'name',
        label: 'Loyalty Program Name',
        type: 'text',
        placeholder: 'My Loyalty Program',
        defaultValue: 'Loyalty Program',
        validation: {
          required: true
        }
      },
      {
        name: 'pointsPerPurchase',
        label: 'Points per Purchase (USD)',
        type: 'number',
        placeholder: '10',
        defaultValue: 10,
        validation: {
          required: true,
          min: 1
        }
      },
      {
        name: 'redemptionRate',
        label: 'Redemption Rate (USD per point)',
        type: 'number',
        placeholder: '0.01',
        defaultValue: 0.01,
        validation: {
          required: true,
          min: 0.001
        }
      },
      {
        name: 'transferable',
        label: 'Points Transferable',
        type: 'boolean',
        defaultValue: false,
        validation: {
          required: false
        }
      },
      {
        name: 'expirable',
        label: 'Points Expirable',
        type: 'boolean',
        defaultValue: true,
        validation: {
          required: false
        }
      }
    ]
  },
  {
    id: 'dynamic-nft',
    name: 'Dynamic NFT (dNFT)',
    description: 'Create evolvable NFTs that change over time or conditions',
    icon: '🔄',
    fields: [
      {
        name: 'name',
        label: 'dNFT Collection Name',
        type: 'text',
        placeholder: 'My Dynamic NFTs',
        defaultValue: 'Dynamic NFTs',
        validation: {
          required: true
        }
      },
      {
        name: 'symbol',
        label: 'Symbol',
        type: 'text',
        placeholder: 'DNFT',
        defaultValue: 'DNFT',
        validation: {
          required: true,
          pattern: '^[A-Z]{1,5}$'
        }
      },
      {
        name: 'maxSupply',
        label: 'Maximum Supply',
        type: 'number',
        placeholder: '10000',
        defaultValue: 10000,
        validation: {
          required: true,
          min: 1
        }
      },
      {
        name: 'evolvable',
        label: 'Evolvable NFTs',
        type: 'boolean',
        defaultValue: true,
        validation: {
          required: false
        }
      },
      {
        name: 'mergeable',
        label: 'Mergeable NFTs',
        type: 'boolean',
        defaultValue: false,
        validation: {
          required: false
        }
      }
    ]
  },
  {
    id: 'social-token',
    name: 'Social Token',
    description: 'Create a token for creators and communities',
    icon: '👥',
    fields: [
      {
        name: 'creatorName',
        label: 'Creator/Community Name',
        type: 'text',
        placeholder: 'My Community',
        defaultValue: 'Social Token',
        validation: {
          required: true
        }
      },
      {
        name: 'symbol',
        label: 'Symbol',
        type: 'text',
        placeholder: 'SOCIAL',
        defaultValue: 'SOCIAL',
        validation: {
          required: true,
          pattern: '^[A-Z]{1,5}$'
        }
      },
      {
        name: 'initialSupply',
        label: 'Initial Supply',
        type: 'number',
        placeholder: '1000000',
        defaultValue: 1000000,
        validation: {
          required: true,
          min: 1
        }
      },
      {
        name: 'creatorShare',
        label: 'Creator Share (%)',
        type: 'number',
        placeholder: '20',
        defaultValue: 20,
        validation: {
          required: true,
          min: 0,
          max: 100
        }
      },
      {
        name: 'communityGoverned',
        label: 'Community Governed',
        type: 'boolean',
        defaultValue: true,
        validation: {
          required: false
        }
      }
    ]
  }
]