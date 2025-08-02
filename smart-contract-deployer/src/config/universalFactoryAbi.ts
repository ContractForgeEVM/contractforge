// ABI générée automatiquement pour UniversalFactoryV2
// Version: Fonctions d'estimation corrigées (plus d'erreur 400)
// Adresse Arbitrum: 0x57cf238111014032FF4c0A981B021eF96bc1E09F (Déployé 2024 - Ledger #1)

export const UNIVERSAL_FACTORY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "deployer",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "deployedContract",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum UniversalFactoryV2.TemplateType",
        "name": "templateType",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "platformFee",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "premiumFee",
        "type": "uint256"
      }
    ],
    "name": "ContractDeployed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BASE_DEPLOYMENT_COST",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PLATFORM_FEE_ADDRESS",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PLATFORM_FEE_PERCENTAGE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8[]",
        "name": "features",
        "type": "uint8[]"
      }
    ],
    "name": "calculatePremiumFees",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum UniversalFactoryV2.TemplateType",
        "name": "templateType",
        "type": "uint8"
      },
      {
        "internalType": "bytes",
        "name": "bytecode",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "constructorParams",
        "type": "bytes"
      },
      {
        "internalType": "uint8[]",
        "name": "features",
        "type": "uint8[]"
      }
    ],
    "name": "deployContract",
    "outputs": [
      {
        "internalType": "address",
        "name": "deployedContract",
        "type": "address"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum UniversalFactoryV2.TemplateType",
        "name": "templateType",
        "type": "uint8"
      }
    ],
    "name": "estimateDeploymentCost",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum UniversalFactoryV2.TemplateType",
        "name": "templateType",
        "type": "uint8"
      },
      {
        "internalType": "uint8[]",
        "name": "features",
        "type": "uint8[]"
      }
    ],
    "name": "estimateDeploymentCostWithFeatures",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum UniversalFactoryV2.PremiumFeature",
        "name": "",
        "type": "uint8"
      }
    ],
    "name": "featurePrices",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum UniversalFactoryV2.PremiumFeature",
        "name": "feature",
        "type": "uint8"
      }
    ],
    "name": "getFeaturePrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum UniversalFactoryV2.TemplateType",
        "name": "templateType",
        "type": "uint8"
      }
    ],
    "name": "isTemplateSupported",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      },
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "predictDeploymentAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum UniversalFactoryV2.PremiumFeature",
        "name": "feature",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "setFeaturePrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum UniversalFactoryV2.TemplateType",
        "name": "templateType",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "supported",
        "type": "bool"
      }
    ],
    "name": "setTemplateSupport",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum UniversalFactoryV2.TemplateType",
        "name": "",
        "type": "uint8"
      }
    ],
    "name": "supportedTemplates",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalDeployments",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const UNIVERSAL_FACTORY_BYTECODE = "0x6080604090808252346103115733156102fb575060008054336001600160a01b0319821681178355906001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08380a381600191828055808052600260205281812060ff199084828254161790558382528282208482825416179055600282528282208482825416179055600382528282208482825416179055600482528282208482825416179055600582528282208482825416179055600682528282208482825416179055600782528282208482825416179055600882528282208482825416179055600982528282208482825416179055600a82528282208482825416179055600b825283838320918254161790558080526003602052662386f26fc1000092838383205581526611c37937e08000808383205560028252838383205560038252828220556004815266470de4df82000080838320556005825266354a6ba7a180009384848420556006835281848420556007835284848420556008835280848420556009835283832055600a82528083832055600b82528083832055600c82526658d15e17628000938484842055600d8352666a94d74f4300008085852055600e8452668e1bc9bf040000958686862055600f855266b1a2bc2ec5000090818787205560108652828787205560118652848787205560128652878787205560138652828787205560148652667c5850872380008088882055601587528888882055601687528188882055601787528388882055601887528188882055601987528088882055601a87528388882055601b87528188882055601c87528588882055601d87528488882055601e87528188882055601f875283888820556020875288888820556021875287872055602286528487872055602386528686205560248552818686205560258552858520556026845266d529ae9e8600008585205560278452828585205560288452848420556029835283832055602a825282822055602b8152205551610cb690816103178239f35b631e4fbdf760e01b815260006004820152602490fd5b600080fdfe6080604052600436101561001257600080fd5b60003560e01c806308a544371461012d57806312bab00a146101285780631310741a146100f65780631554823214610123578063233d65a31461011e578063584758de1461011e578063715018a61461011957806377caec0d1461011457806379487d521461010f5780637a273fa21461010a57806384044a6f146101055780638da5cb5b146101005780639ab37ce0146100fb578063a05cdf63146100f6578063e7082467146100f1578063f2fde38b146100ec578063f36e8b87146100e75763fb35b4e4146100e257600080fd5b61089a565b61080a565b6106d1565b610685565b6101d3565b610603565b6105da565b6105ab565b61056b565b610398565b610326565b610297565b610258565b61020d565b6101a2565b610146565b60043590600c82101561014157565b600080fd5b346101415760403660031901126101415761015f610132565b60243590811515809203610141576101756108b8565b600c81101561019d57600052600260205260406000209060ff80198354169116179055600080f35b610229565b3461014157600036600319011261014157602060405166038d7ea4c680008152f35b60043590602c82101561014157565b34610141576020366003190112610141576101ec6101c4565b602c81101561019d5760005260036020526020604060002054604051908152f35b3461014157600036600319011261014157602060405160028152f35b634e487b7160e01b600052602160045260246000fd5b600c81101561019d576000526002602052604060002090565b3461014157602036600319011261014157610271610132565b600c81101561019d576000526002602052602060ff604060002054166040519015158152f35b34610141576000806003193601126102f2576102b16108b8565b80546001600160a01b03198116825581906001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a380f35b80fd5b9181601f840112156101415782359167ffffffffffffffff8311610141576020808501948460051b01011161014157565b346101415760203660031901126101415760043567ffffffffffffffff81116101415761036261035c60209236906004016102f5565b90610b0c565b604051908152f35b9181601f840112156101415782359167ffffffffffffffff8311610141576020838186019501011161014157565b60a0366003190112610141576103ac610132565b67ffffffffffffffff90602435828111610141576103ce90369060040161036a565b9091604435848111610141576103e890369060040161036a565b9094606435908111610141576104029036906004016102f5565b9190956002600154146105595761044a610466936104f198600260015561043a61043561042e8961023f565b5460ff1690565b6108e4565b610445881515610929565b610b0c565b9461045486610990565b96610461883410156109a5565b610bd7565b926104708361097c565b61051e575b8034116104f5575b507f24e7ed3d3eea7a51c1454a6afd4e366d1c36c345aac62b4ac6f72bac31ff5650604051806104b860018060a01b03871695339583610aa3565b0390a36104ce6104c9600454610ac9565b600455565b6104d760018055565b6040516001600160a01b0390911681529081906020820190565b0390f35b60008080806105076105189534610a5a565b335af16105126109e8565b50610a67565b3861047d565b610554600080808061052f8861097c565b7309789515d075ad4f657cf33a7f4adce485ee4f2e5af161054e6109e8565b50610a18565b610475565b604051633ee5aeb560e01b8152600490fd5b34610141576040366003190112610141576105846101c4565b61058c6108b8565b602c81101561019d576000526003602052602435604060002055600080f35b346101415760003660031901126101415760206040517309789515d075ad4f657cf33a7f4adce485ee4f2e8152f35b34610141576000366003190112610141576000546040516001600160a01b039091168152602090f35b346101415760403660031901126101415761061c610132565b60243567ffffffffffffffff81116101415761063c9036906004016102f5565b90600c83101561019d5761066392600052600260205261044560ff604060002054166108e4565b66039faf41abc00090810180911161068057604051908152602090f35b610966565b346101415760203660031901126101415761069e610132565b600c81101561019d5760005260026020526106c060ff604060002054166108e4565b602060405166039faf41abc0008152f35b34610141576020366003190112610141576001600160a01b0360043581811690819003610141576107006108b8565b801561074357600080546001600160a01b03198116831782559092167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08380a380f35b604051631e4fbdf760e01b815260006004820152602490fd5b634e487b7160e01b600052604160045260246000fd5b90601f8019910116810190811067ffffffffffffffff82111761079457604052565b61075c565b67ffffffffffffffff811161079457601f01601f191660200190565b9291926107c182610799565b916107cf6040519384610772565b829481845281830111610141578281602093846000960137010152565b9080601f8301121561014157816020610807933591016107b5565b90565b346101415760603660031901126101415767ffffffffffffffff6004358181116101415761083c9036906004016107ec565b50602435908111610141576108559036906004016107ec565b50606460405162461bcd60e51b815260206004820152602060248201527f416464726573732070726564696374696f6e206e6f7420617661696c61626c656044820152fd5b34610141576000366003190112610141576020600454604051908152f35b6000546001600160a01b031633036108cc57565b60405163118cdaa760e01b8152336004820152602490fd5b156108eb57565b60405162461bcd60e51b815260206004820152601660248201527515195b5c1b185d19481b9bdd081cdd5c1c1bdc9d195960521b6044820152606490fd5b1561093057565b60405162461bcd60e51b815260206004820152600e60248201526d456d7074792062797465636f646560901b6044820152606490fd5b634e487b7160e01b600052601160045260246000fd5b906512309ce5400091820180921161068057565b9066039faf41abc00091820180921161068057565b156109ac57565b60405162461bcd60e51b8152602060048201526014602482015273125b9cdd59999a58da595b9d081c185e5b595b9d60621b6044820152606490fd5b3d15610a13573d906109f982610799565b91610a076040519384610772565b82523d6000602084013e565b606090565b15610a1f57565b60405162461bcd60e51b8152602060048201526013602482015272119959481d1c985b9cd9995c8819985a5b1959606a1b6044820152606490fd5b9190820391821161068057565b15610a6e57565b60405162461bcd60e51b815260206004820152600d60248201526c1499599d5b990819985a5b1959609a1b6044820152606490fd5b9291906060840193600c82101561019d5760409181526512309ce5400060208201520152565b60001981146106805760010190565b9190811015610ae85760051b0190565b634e487b7160e01b600052603260045260246000fd5b3560ff811681036101415790565b9190600092600090815b838110610b235750505050565b60ff602b81610b3b610b36858988610ad8565b610afe565b161115610b52575b50610b4d90610ac9565b610b16565b610b63610b368387869a959a610ad8565b16602c81101561019d5783526003602052604083205481018091116106805794610b4d610b43565b15610b9257565b60405162461bcd60e51b815260206004820152601b60248201527f4e6f20636f6465206174206465706c6f796564206164647265737300000000006044820152606490fd5b909290918115610c6e579181610c12936020938660405197889587870137840191858301600081523701600083820152038084520182610772565b6020815191016000f0906001600160a01b03821615610c3957610c37823b1515610b8b565b565b60405162461bcd60e51b815260206004820152600d60248201526c10d4915055114819985a5b1959609a1b6044820152606490fd5b5050610c7b9136916107b5565b610c1256fea2646970667358221220815cd5b1033e948da0499a1f1e70263daf8065d382fc9f9661d29cfa5c794c0f64736f6c63430008140033";

// Type safety pour les fonctions
export type UniversalFactoryFunctions = 'deployContract' | 'owner' | 'transferOwnership' | 'getFeaturePrice' | 'setFeaturePrice' | 'supportedTemplates' | 'totalDeployments' | 'estimateDeploymentCost';
