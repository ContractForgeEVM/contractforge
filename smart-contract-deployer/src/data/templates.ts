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
  }
]