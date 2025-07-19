import type { WalletClient, PublicClient } from 'viem'
import { encodeFunctionData, encodeAbiParameters } from 'viem'
import { compileContract } from './contractCompiler'
import type { TemplateType, GasEstimate, DeploymentParams, PremiumFeatureConfig } from '../types'
import { config } from '../config'
import { FACTORY_ADDRESSES, FACTORY_ABI } from '../config/factoryAddresses'
const PLATFORM_FEE_ADDRESS = config.platformFeeAddress
interface DeploymentResult {
  address: string
  hash: string
  error?: string
}
export const deployContractWithWagmi = async (
  templateType: TemplateType,
  params: Record<string, any>,
  walletClient: WalletClient,
  publicClient: PublicClient,
  gasEstimate: GasEstimate,
  premiumFeatures: string[] = [],
  premiumFeatureConfigs?: PremiumFeatureConfig
): Promise<DeploymentResult> => {
  try {
    const { bytecode, abi } = await compileContract(templateType, params, premiumFeatures)
    if (!bytecode || bytecode === '0x') {
      throw new Error('Failed to compile contract')
    }
    const [account] = await walletClient.getAddresses()
    if (!account) {
      throw new Error('No account connected')
    }
    const totalFees = gasEstimate.platformFee + gasEstimate.premiumFee
    const constructorArgs = getConstructorArgs(templateType, params)
    console.log('🚀 Deployment details:', {
      templateType,
      account,
      totalFees: totalFees.toString(),
      constructorArgs,
      bytecodeLength: bytecode.length,
      premiumFeatures,
      premiumFeatureConfigs
    })
    const factoryAddress = FACTORY_ADDRESSES[walletClient.chain?.id || 1]
    if (!factoryAddress || factoryAddress === '0x0000000000000000000000000000000000000000') {
      console.warn('Factory contract not deployed on this chain, using direct deployment')
      return await directDeploy(bytecode, abi, constructorArgs, account, walletClient, publicClient, totalFees)
    }
    try {
      const encodedConstructorArgs = constructorArgs.length > 0
        ? encodeAbiParameters(
            getConstructorAbiParams(templateType),
            constructorArgs
          ) as `0x${string}`
        : '0x' as `0x${string}`
      const hasWhitelistConfig = premiumFeatureConfigs?.whitelist && premiumFeatures.includes('whitelist')
      const hasBlacklistConfig = premiumFeatureConfigs?.blacklist && premiumFeatures.includes('blacklist')
      const hasTaxConfig = premiumFeatureConfigs?.tax && premiumFeatures.includes('tax')
      const hasCappedConfig = premiumFeatureConfigs?.capped && premiumFeatures.includes('capped')
      const hasVestingConfig = premiumFeatureConfigs?.vesting && premiumFeatures.includes('vesting')
      const hasMultisigConfig = premiumFeatureConfigs?.multisig && premiumFeatures.includes('multisig')
      const hasAirdropConfig = premiumFeatureConfigs?.airdrop && premiumFeatures.includes('airdrop')
      const hasTimelockConfig = premiumFeatureConfigs?.timelock && premiumFeatures.includes('timelock')
      let deployData: string
      let functionName: string
      if ((hasWhitelistConfig || hasBlacklistConfig || hasTaxConfig || hasCappedConfig ||
           hasVestingConfig || hasMultisigConfig || hasAirdropConfig || hasTimelockConfig) && premiumFeatureConfigs) {
        functionName = 'deployContractWithPremiumFeatures'
        const premiumConfig = {
          whitelist: {
            addresses: premiumFeatureConfigs.whitelist?.addresses || [],
            enabled: hasWhitelistConfig && (premiumFeatureConfigs.whitelist?.addresses?.length || 0) > 0
          },
          blacklist: {
            addresses: premiumFeatureConfigs.blacklist?.addresses || []
          },
          tax: {
            rate: premiumFeatureConfigs.tax?.rate || 0,
            recipient: premiumFeatureConfigs.tax?.recipient || '0x0000000000000000000000000000000000000000'
          },
          capped: {
            maxSupply: premiumFeatureConfigs.capped?.maxSupply || 0
          },
          vesting: {
            schedules: premiumFeatureConfigs.vesting?.schedules || []
          },
          multisig: {
            signers: premiumFeatureConfigs.multisig?.signers || [],
            threshold: premiumFeatureConfigs.multisig?.threshold || 0
          },
          airdrop: {
            recipients: premiumFeatureConfigs.airdrop?.recipients || []
          },
          timelock: {
            delay: premiumFeatureConfigs.timelock?.delay || 0
          },
          enabledFeatures: premiumFeatures
        }
        deployData = encodeFunctionData({
          abi: FACTORY_ABI,
          functionName: 'deployContractWithPremiumFeatures',
          args: [
            bytecode as `0x${string}`,
            encodedConstructorArgs as `0x${string}`,
            gasEstimate.premiumFee,
            premiumFeatures,
            premiumConfig
          ]
        })
        console.log('🔧 Using premium features deployment with configurations:', {
          whitelist: premiumConfig.whitelist,
          blacklist: premiumConfig.blacklist,
          tax: premiumConfig.tax,
          capped: premiumConfig.capped,
          vesting: premiumConfig.vesting,
          multisig: premiumConfig.multisig,
          airdrop: premiumConfig.airdrop,
          timelock: premiumConfig.timelock,
          features: premiumFeatures
        })
      } else {
        functionName = constructorArgs.length > 0 ? 'deployContractWithConstructor' : 'deployContract'
        deployData = encodeFunctionData({
          abi: FACTORY_ABI,
          functionName,
          args: constructorArgs.length > 0
            ? [bytecode as `0x${string}`, encodedConstructorArgs as `0x${string}`, gasEstimate.premiumFee]
            : [bytecode as `0x${string}`, gasEstimate.premiumFee]
        })
      }
      const deploymentValue = gasEstimate.deploymentCost + totalFees
      console.log('Deploying via factory:', {
        factory: factoryAddress,
        function: functionName,
        value: deploymentValue.toString(),
        premiumFee: gasEstimate.premiumFee.toString(),
        premiumFeatures: premiumFeatures.length > 0 ? premiumFeatures : 'none'
      })
      const hash = await walletClient.sendTransaction({
        account,
        to: factoryAddress as `0x${string}`,
        data: deployData as `0x${string}`,
        value: deploymentValue,
        chain: walletClient.chain,
      })
      console.log('Factory deployment transaction:', hash)
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      })
      console.log('Transaction receipt:', receipt)
      console.log('Logs:', receipt.logs)
      const factoryLog = receipt.logs.find(log =>
        log.address.toLowerCase() === factoryAddress.toLowerCase()
      )
      if (!factoryLog) {
        console.error('No factory log found in receipt')
        throw new Error('Failed to get deployed contract address from factory')
      }
      console.log('Factory log:', factoryLog)
      if (!factoryLog.topics || factoryLog.topics.length < 3) {
        console.error('Invalid log structure:', factoryLog)
        throw new Error('Invalid factory event log')
      }
      const addressTopic = factoryLog.topics[2]
      if (!addressTopic) {
        throw new Error('No deployed address in factory event')
      }
      const deployedAddress = `0x${addressTopic.slice(26)}`
      console.log('Contract deployed at:', deployedAddress)
      return {
        address: deployedAddress,
        hash: receipt.transactionHash,
      }
    } catch (error: any) {
      console.error('Deployment error:', error)
      let errorMessage = 'Deployment failed'
      if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user'
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for deployment'
      } else if (error.message?.includes('stack underflow')) {
        errorMessage = 'Contract compilation error - please check your parameters'
      } else if (error.message?.includes('simulation failed')) {
        errorMessage = 'Transaction simulation failed - please check your wallet balance and network'
      } else if (error.message) {
        errorMessage = error.message
      }
      return {
        address: '',
        hash: '',
        error: errorMessage
      }
    }
  } catch (error: any) {
    console.error('Deployment error:', error)
    let errorMessage = 'Deployment failed'
    if (error.message?.includes('user rejected')) {
      errorMessage = 'Transaction rejected by user'
    } else if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for deployment'
    } else if (error.message?.includes('stack underflow')) {
      errorMessage = 'Contract compilation error - please check your parameters'
    } else if (error.message?.includes('simulation failed')) {
      errorMessage = 'Transaction simulation failed - please check your wallet balance and network'
    } else if (error.message) {
      errorMessage = error.message
    }
    return {
      address: '',
      hash: '',
      error: errorMessage
    }
  }
}
async function directDeploy(
  bytecode: string,
  abi: any[],
  constructorArgs: any[],
  account: `0x${string}`,
  walletClient: WalletClient,
  publicClient: PublicClient,
  totalFees: bigint
): Promise<DeploymentResult> {
  const hash = await walletClient.deployContract({
    abi,
    account,
    bytecode: bytecode as `0x${string}`,
    args: constructorArgs,
    chain: walletClient.chain,
  })
  console.log('Direct deployment transaction hash:', hash)
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    confirmations: 1,
  })
  if (!receipt.contractAddress) {
    throw new Error('Contract deployment failed - no address returned')
  }
  console.log('Contract deployed at:', receipt.contractAddress)
  if (totalFees > 0n) {
    try {
      console.log('Sending platform fees separately:', totalFees.toString())
      const feeHash = await walletClient.sendTransaction({
        account,
        to: PLATFORM_FEE_ADDRESS as `0x${string}`,
        value: totalFees,
        chain: walletClient.chain,
      })
      console.log('Platform fee transaction:', feeHash)
      await publicClient.waitForTransactionReceipt({
        hash: feeHash,
        confirmations: 1,
      })
      console.log('Platform fee sent successfully')
    } catch (feeError) {
      console.error('Failed to send platform fee:', feeError)
    }
  }
  return {
    address: receipt.contractAddress,
    hash: receipt.transactionHash,
  }
}
function getConstructorAbiParams(templateType: TemplateType): any[] {
  switch (templateType) {
    case 'token':
      return []
    case 'nft':
      return []
    case 'dao':
      return [{ type: 'address', name: '_token' }]
    case 'lock':
      return [
        { type: 'address', name: '_token' },
        { type: 'address', name: '_beneficiary' },
        { type: 'uint256', name: '_unlockTime' }
      ]
    default:
      return []
  }
}
function getConstructorArgs(templateType: TemplateType, params: Record<string, any>): any[] {
  switch (templateType) {
    case 'token':
      return []
    case 'nft':
      return []
    case 'dao':
      if (params.tokenAddress && params.tokenAddress !== '') {
        return [params.tokenAddress as `0x${string}`]
      }
      throw new Error('DAO requires a governance token address')
    case 'lock':
      if (!params.tokenAddress || params.tokenAddress === '') {
        throw new Error('Token address is required for Lock contract')
      }
      if (!params.beneficiary || params.beneficiary === '') {
        throw new Error('Beneficiary address is required for Lock contract')
      }
      const unlockTime = params.unlockTime
        ? Math.floor(new Date(params.unlockTime).getTime() / 1000)
        : Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
      const tokenAddress = params.tokenAddress
      const beneficiary = params.beneficiary
      if (!tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid token address format')
      }
      if (!beneficiary.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid beneficiary address format')
      }
      return [tokenAddress as `0x${string}`, beneficiary as `0x${string}`, BigInt(unlockTime)]
    default:
      return []
  }
}
export const deployContract = async (params: DeploymentParams) => {
  if (typeof window !== 'undefined' && (window as any).wagmiClient) {
    const { wagmiClient } = window as any
    const walletClient = await wagmiClient.getWalletClient()
    const publicClient = wagmiClient.getPublicClient()
    if (walletClient && publicClient) {
      const { estimateGas } = await import('./gasEstimator')
      const gasEstimate = await estimateGas(params.chainId, params.premiumFeatures || [])
      return deployContractWithWagmi(
        params.template,
        params.params,
        walletClient,
        publicClient,
        gasEstimate,
        params.premiumFeatures || [],
        params.premiumFeatureConfigs
      )
    }
  }
  console.log('Using mock deployment - wagmi not available')
  await new Promise(resolve => setTimeout(resolve, 3000))
  const randomAddress = `0x${Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`
  return {
    address: randomAddress,
    hash: `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`,
  }
}