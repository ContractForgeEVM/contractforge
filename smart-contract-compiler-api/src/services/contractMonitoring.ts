import { ethers } from 'ethers'
import { supabase } from '../config/supabase'

// Types et interfaces pour le monitoring
export interface ContractMetrics {
  contractAddress: string
  chainId: number
  totalTransactions: number
  dailyTransactions: number
  weeklyTransactions: number
  monthlyTransactions: number
  averageGasUsed: number
  failedTransactions: number
  totalValue: string
  averageTransactionValue: string
  totalFeesPaid: string
  averageFeePerTx: string
  lastActivity: Date
  functionCalls: Record<string, {
    count: number
    averageGas: number
    successRate: number
  }>
}

export interface ContractEvent {
  id?: string
  contractAddress: string
  chainId: number
  eventName: string
  eventType: 'mint' | 'transfer' | 'approval' | 'burn' | 'custom' | 'error'
  from?: string
  to?: string
  value?: string
  tokenId?: string
  args: any
  gasUsed: number
  gasPrice: string
  blockNumber: number
  transactionHash: string
  timestamp: Date
  success: boolean
}

export interface ContractState {
  contractAddress: string
  chainId: number
  balance: string
  owner?: string
  paused?: boolean
  totalSupply?: string
  holders?: number
  topHolders?: Array<{
    address: string
    balance: string
    percentage: number
  }>
  totalMinted?: number
  uniqueOwners?: number
  floorPrice?: string
  lastUpdated: Date
}

export interface ContractAlert {
  id?: string
  contractAddress: string
  chainId: number
  type: 'high_gas' | 'failed_tx' | 'unusual_activity' | 'security_risk' | 'low_balance' | 'ownership_change'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: Date
  acknowledged: boolean
  userId: string
  triggerData?: any
}

// Configuration des réseaux pour le monitoring
const NETWORK_CONFIGS: Record<number, { 
  name: string
  rpcUrl: string
  symbol: string
  explorer: string
  blockTime: number // en secondes
}> = {
  1: {
    name: 'Ethereum',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
    blockTime: 12
  },
  137: {
    name: 'Polygon',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
    symbol: 'MATIC',
    explorer: 'https://polygonscan.com',
    blockTime: 2
  },
  42161: {
    name: 'Arbitrum',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    symbol: 'ETH',
    explorer: 'https://arbiscan.io',
    blockTime: 1
  },
  10: {
    name: 'Optimism',
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    symbol: 'ETH',
    explorer: 'https://optimistic.etherscan.io',
    blockTime: 2
  },
  56: {
    name: 'BSC',
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    symbol: 'BNB',
    explorer: 'https://bscscan.com',
    blockTime: 3
  },
  8453: {
    name: 'Base',
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    symbol: 'ETH',
    explorer: 'https://basescan.org',
    blockTime: 2
  }
}

class ContractMonitoringService {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map()
  private contracts: Map<string, { contract: ethers.Contract, chainId: number, userId: string }> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private alertRules: AlertRule[] = []

  constructor() {
    this.initializeProviders()
    this.setupAlertRules()
    console.log('🎯 Contract Monitoring Service initialized')
  }

  private initializeProviders() {
    for (const [chainId, config] of Object.entries(NETWORK_CONFIGS)) {
      const provider = new ethers.JsonRpcProvider(config.rpcUrl)
      this.providers.set(parseInt(chainId), provider)
    }
  }

  private setupAlertRules() {
    this.alertRules = [
      // Gas usage anormalement élevé
      {
        id: 'high_gas_usage',
        name: 'Gas usage excessif',
        condition: (event: ContractEvent, history: ContractEvent[]) => {
          const recentEvents = history.filter(e => 
            e.timestamp > new Date(Date.now() - 3600000) && e.success
          )
          if (recentEvents.length < 5) return false
          
          const avgGas = recentEvents.reduce((sum, e) => sum + e.gasUsed, 0) / recentEvents.length
          return event.gasUsed > avgGas * 2.5
        },
        severity: 'medium' as const,
        message: 'Transaction with unusually high gas usage detected'
      },

      // Pic de transactions échouées
      {
        id: 'failed_transactions_spike',
        name: 'Pic de transactions échouées',
        condition: (event: ContractEvent, history: ContractEvent[]) => {
          const recentFailed = history.filter(e => 
            e.timestamp > new Date(Date.now() - 1800000) && !e.success // 30 min
          ).length
          return recentFailed > 5
        },
        severity: 'high' as const,
        message: 'High number of failed transactions detected in the last 30 minutes'
      },

      // Transfert de valeur inhabituel
      {
        id: 'unusual_value_transfer',
        name: 'Transfert de valeur exceptionnel',
        condition: (event: ContractEvent, history: ContractEvent[]) => {
          if (!event.value || event.value === '0') return false
          
          const value = parseFloat(ethers.formatEther(event.value))
          const recentTransfers = history.filter(e => 
            e.value && e.value !== '0' && 
            e.timestamp > new Date(Date.now() - 86400000) // 24h
          )
          
          if (recentTransfers.length < 3) return value > 100 // Plus de 100 ETH
          
          const avgValue = recentTransfers
            .map(e => parseFloat(ethers.formatEther(e.value!)))
            .reduce((sum, v) => sum + v, 0) / recentTransfers.length
          
          return value > avgValue * 10
        },
        severity: 'critical' as const,
        message: 'Exceptionally large value transfer detected'
      },

      // Balance faible du contrat
      {
        id: 'low_contract_balance',
        name: 'Balance du contrat faible',
        condition: (event: ContractEvent, history: ContractEvent[], contractState?: ContractState | null) => {
          if (!contractState || !contractState.balance) return false
          const balance = parseFloat(ethers.formatEther(contractState.balance))
          return balance < 0.01 && balance > 0 // Moins de 0.01 ETH mais pas vide
        },
        severity: 'low' as const,
        message: 'Contract balance is running low'
      }
    ]
  }

  // Démarrer le monitoring d'un contrat
  async startMonitoring(
    contractAddress: string, 
    chainId: number, 
    abi: any[], 
    userId: string,
    templateType?: string
  ): Promise<void> {
    try {
      const provider = this.getProvider(chainId)
      const contract = new ethers.Contract(contractAddress, abi, provider)
      
      // Enregistrer le contrat
      const contractKey = `${contractAddress}-${chainId}`
      this.contracts.set(contractKey, { contract, chainId, userId })

      // Sauvegarder dans la base de données
      await this.saveMonitoredContract(contractAddress, chainId, userId, abi, templateType)

      // Écouter tous les événements du contrat
      contract.on('*', (event) => {
        this.handleContractEvent(contractAddress, chainId, userId, event)
      })

      // Surveillance périodique de l'état
      const stateInterval = setInterval(() => {
        this.collectContractState(contractAddress, chainId, contract, userId)
      }, 30000) // Toutes les 30 secondes

      this.intervals.set(contractKey, stateInterval)

      // Collecter l'état initial
      await this.collectContractState(contractAddress, chainId, contract, userId)

      console.log(`✅ Started monitoring contract ${contractAddress} on chain ${chainId}`)
    } catch (error) {
      console.error(`❌ Failed to start monitoring ${contractAddress}:`, error)
      throw error
    }
  }

  // Arrêter le monitoring d'un contrat
  async stopMonitoring(contractAddress: string, chainId: number): Promise<void> {
    const contractKey = `${contractAddress}-${chainId}`
    
    if (this.contracts.has(contractKey)) {
      const { contract } = this.contracts.get(contractKey)!
      contract.removeAllListeners()
      this.contracts.delete(contractKey)
    }

    if (this.intervals.has(contractKey)) {
      clearInterval(this.intervals.get(contractKey)!)
      this.intervals.delete(contractKey)
    }

    // Marquer comme non monitoré dans la DB
    await supabase
      .from('monitored_contracts')
      .update({ is_active: false, stopped_at: new Date().toISOString() })
      .eq('contract_address', contractAddress)
      .eq('chain_id', chainId)

    console.log(`🛑 Stopped monitoring contract ${contractAddress} on chain ${chainId}`)
  }

  // Gestionnaire d'événements de contrat
  private async handleContractEvent(
    contractAddress: string, 
    chainId: number, 
    userId: string, 
    event: any
  ): Promise<void> {
    try {
      const provider = this.getProvider(chainId)
      const receipt = await provider.getTransactionReceipt(event.transactionHash)
      const transaction = await provider.getTransaction(event.transactionHash)

      const eventData: ContractEvent = {
        contractAddress,
        chainId,
        eventName: event.event || 'Unknown',
        eventType: this.classifyEventType(event.event),
        from: event.args?.from,
        to: event.args?.to,
        value: event.args?.value?.toString(),
        tokenId: event.args?.tokenId?.toString(),
        args: event.args ? Object.values(event.args) : [],
        gasUsed: receipt?.gasUsed ? Number(receipt.gasUsed) : 0,
        gasPrice: transaction?.gasPrice?.toString() || '0',
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: new Date(),
        success: receipt?.status === 1
      }

      // Sauvegarder l'événement
      await this.saveEvent(eventData, userId)

      // Vérifier les conditions d'alerte
      await this.checkAlerts(contractAddress, chainId, userId, eventData)

      // Mettre à jour les métriques
      await this.updateMetrics(contractAddress, chainId, eventData)

    } catch (error) {
      console.error('Error handling contract event:', error)
    }
  }

  // Collecter l'état du contrat
  private async collectContractState(
    contractAddress: string, 
    chainId: number, 
    contract: ethers.Contract,
    userId: string
  ): Promise<void> {
    try {
      const provider = this.getProvider(chainId)
      const balance = await provider.getBalance(contractAddress)

      const state: ContractState = {
        contractAddress,
        chainId,
        balance: balance.toString(),
        lastUpdated: new Date()
      }

      // Collecter des données spécifiques selon le type de contrat
      try {
        // Pour les tokens ERC20
        if (contract.interface.hasFunction('totalSupply')) {
          state.totalSupply = (await contract.totalSupply()).toString()
        }
        if (contract.interface.hasFunction('owner')) {
          state.owner = await contract.owner()
        }
        if (contract.interface.hasFunction('paused')) {
          state.paused = await contract.paused()
        }

        // Pour les NFT (données plus complexes à calculer)
        if (contract.interface.hasFunction('ownerOf')) {
          // Ces calculs sont coûteux, on les fait moins fréquemment
          const shouldCalculateNFTMetrics = Math.random() < 0.1 // 10% de chance
          if (shouldCalculateNFTMetrics) {
            state.totalMinted = await this.calculateTotalNFTMinted(contract)
            state.uniqueOwners = await this.calculateUniqueNFTOwners(contract)
          }
        }
      } catch (error) {
        // Les erreurs de fonction spécifiques ne sont pas critiques
        console.log('Some contract-specific functions not available:', (error as Error).message)
      }

      await this.saveContractState(state, userId)

    } catch (error) {
      console.error(`Error collecting state for ${contractAddress}:`, error)
    }
  }

  // Vérifier les conditions d'alerte
  private async checkAlerts(
    contractAddress: string, 
    chainId: number, 
    userId: string, 
    event: ContractEvent
  ): Promise<void> {
    try {
      const history = await this.getContractHistory(contractAddress, chainId, 24) // 24h
      const contractState = await this.getContractState(contractAddress, chainId)

      for (const rule of this.alertRules) {
        if (rule.condition(event, history, contractState)) {
          await this.triggerAlert(contractAddress, chainId, userId, rule, event)
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error)
    }
  }

  // Déclencher une alerte
  private async triggerAlert(
    contractAddress: string,
    chainId: number,
    userId: string,
    rule: AlertRule,
    event: ContractEvent
  ): Promise<void> {
    const alert: ContractAlert = {
      contractAddress,
      chainId,
      type: rule.id as any,
      severity: rule.severity,
      title: rule.name,
      message: rule.message,
      timestamp: new Date(),
      acknowledged: false,
      userId,
      triggerData: {
        eventHash: event.transactionHash,
        blockNumber: event.blockNumber,
        gasUsed: event.gasUsed
      }
    }

    await this.saveAlert(alert)
    
    // Notification en temps réel (WebSocket ou autres moyens)
    await this.notifyUser(userId, alert)

    console.log(`🚨 Alert triggered: ${rule.name} for ${contractAddress}`)
  }

  // Méthodes de base de données
  private async saveMonitoredContract(
    contractAddress: string,
    chainId: number,
    userId: string,
    abi: any[],
    templateType?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('monitored_contracts')
      .upsert({
        contract_address: contractAddress,
        chain_id: chainId,
        user_id: userId,
        abi: abi,
        template_type: templateType,
        is_active: true,
        started_at: new Date().toISOString(),
        last_check: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving monitored contract:', error)
      throw error
    }
  }

  private async saveEvent(event: ContractEvent, userId: string): Promise<void> {
    const { error } = await supabase
      .from('contract_events')
      .insert({
        contract_address: event.contractAddress,
        chain_id: event.chainId,
        user_id: userId,
        event_name: event.eventName,
        event_type: event.eventType,
        from_address: event.from,
        to_address: event.to,
        value: event.value,
        token_id: event.tokenId,
        args: event.args,
        gas_used: event.gasUsed,
        gas_price: event.gasPrice,
        block_number: event.blockNumber,
        transaction_hash: event.transactionHash,
        timestamp: event.timestamp.toISOString(),
        success: event.success
      })

    if (error) {
      console.error('Error saving event:', error)
    }
  }

  private async saveContractState(state: ContractState, userId: string): Promise<void> {
    const { error } = await supabase
      .from('contract_states')
      .upsert({
        contract_address: state.contractAddress,
        chain_id: state.chainId,
        user_id: userId,
        balance: state.balance,
        owner: state.owner,
        paused: state.paused,
        total_supply: state.totalSupply,
        holders: state.holders,
        top_holders: state.topHolders,
        total_minted: state.totalMinted,
        unique_owners: state.uniqueOwners,
        floor_price: state.floorPrice,
        last_updated: state.lastUpdated.toISOString()
      })

    if (error) {
      console.error('Error saving contract state:', error)
    }
  }

  private async saveAlert(alert: ContractAlert): Promise<void> {
    const { error } = await supabase
      .from('contract_alerts')
      .insert({
        contract_address: alert.contractAddress,
        chain_id: alert.chainId,
        user_id: alert.userId,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
        acknowledged: alert.acknowledged,
        trigger_data: alert.triggerData
      })

    if (error) {
      console.error('Error saving alert:', error)
    }
  }

  // Méthodes d'aide
  private getProvider(chainId: number): ethers.JsonRpcProvider {
    const provider = this.providers.get(chainId)
    if (!provider) {
      throw new Error(`No provider configured for chain ${chainId}`)
    }
    return provider
  }

  private classifyEventType(eventName: string): ContractEvent['eventType'] {
    const name = eventName?.toLowerCase() || ''
    
    if (name.includes('mint')) return 'mint'
    if (name.includes('transfer')) return 'transfer'
    if (name.includes('approval')) return 'approval'
    if (name.includes('burn')) return 'burn'
    if (name.includes('error') || name.includes('failed')) return 'error'
    
    return 'custom'
  }

  private async getContractHistory(
    contractAddress: string, 
    chainId: number, 
    hours: number
  ): Promise<ContractEvent[]> {
    const { data, error } = await supabase
      .from('contract_events')
      .select('*')
      .eq('contract_address', contractAddress)
      .eq('chain_id', chainId)
      .gte('timestamp', new Date(Date.now() - hours * 3600000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Error fetching contract history:', error)
      return []
    }

    return data?.map((row: any) => ({
      contractAddress: row.contract_address,
      chainId: row.chain_id,
      eventName: row.event_name,
      eventType: row.event_type,
      from: row.from_address,
      to: row.to_address,
      value: row.value,
      tokenId: row.token_id,
      args: row.args,
      gasUsed: row.gas_used,
      gasPrice: row.gas_price,
      blockNumber: row.block_number,
      transactionHash: row.transaction_hash,
      timestamp: new Date(row.timestamp),
      success: row.success
    })) || []
  }

  private async getContractState(
    contractAddress: string, 
    chainId: number
  ): Promise<ContractState | null> {
    const { data, error } = await supabase
      .from('contract_states')
      .select('*')
      .eq('contract_address', contractAddress)
      .eq('chain_id', chainId)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null

    return {
      contractAddress: data.contract_address,
      chainId: data.chain_id,
      balance: data.balance,
      owner: data.owner,
      paused: data.paused,
      totalSupply: data.total_supply,
      holders: data.holders,
      topHolders: data.top_holders,
      totalMinted: data.total_minted,
      uniqueOwners: data.unique_owners,
      floorPrice: data.floor_price,
      lastUpdated: new Date(data.last_updated)
    }
  }

  private async calculateTotalNFTMinted(contract: ethers.Contract): Promise<number> {
    try {
      if (contract.interface.hasFunction('totalSupply')) {
        return Number(await contract.totalSupply())
      }
      return 0
    } catch (error) {
      return 0
    }
  }

  private async calculateUniqueNFTOwners(contract: ethers.Contract): Promise<number> {
    // Implémentation simplifiée - dans un vrai système on utiliserait The Graph ou un indexer
    try {
      const totalSupply = await this.calculateTotalNFTMinted(contract)
      const owners = new Set<string>()
      
      // Échantillonnage pour éviter trop d'appels RPC
      const sampleSize = Math.min(totalSupply, 50)
      for (let i = 0; i < sampleSize; i++) {
        try {
          const owner = await contract.ownerOf(i)
          owners.add(owner)
        } catch (error) {
          // Token peut ne pas exister
        }
      }
      
      // Estimation basée sur l'échantillon
      return Math.ceil(owners.size * (totalSupply / sampleSize))
    } catch (error) {
      return 0
    }
  }

  private async updateMetrics(
    contractAddress: string,
    chainId: number,
    event: ContractEvent
  ): Promise<void> {
    // Mise à jour des métriques en temps réel
    // Cette fonction sera appelée à chaque événement pour maintenir les statistiques
    try {
      const { error } = await supabase.rpc('update_contract_metrics', {
        contract_addr: contractAddress,
        chain_id: chainId,
        gas_used: event.gasUsed,
        tx_success: event.success,
        tx_value: event.value || '0'
      })

      if (error) {
        console.error('Error updating metrics:', error)
      }
    } catch (error) {
      console.error('Error in updateMetrics:', error)
    }
  }

  private async notifyUser(userId: string, alert: ContractAlert): Promise<void> {
    // Implémentation de notification (WebSocket, email, etc.)
    console.log(`📧 Notifying user ${userId} about alert: ${alert.title}`)
    
    // TODO: Implémenter les notifications réelles
    // - WebSocket pour notifications en temps réel
    // - Email pour alertes critiques
    // - Discord/Telegram pour les entreprises
  }

  // Méthodes publiques pour l'API
  async getMonitoredContracts(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('monitored_contracts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching monitored contracts:', error)
      return []
    }

    return data || []
  }

  async getContractMetrics(contractAddress: string, chainId: number): Promise<ContractMetrics | null> {
    // Calculer les métriques depuis les événements stockés
    const events = await this.getContractHistory(contractAddress, chainId, 24 * 30) // 30 jours
    
    if (events.length === 0) return null

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const dailyEvents = events.filter(e => e.timestamp > oneDayAgo)
    const weeklyEvents = events.filter(e => e.timestamp > oneWeekAgo)
    const monthlyEvents = events.filter(e => e.timestamp > oneMonthAgo)
    const failedEvents = events.filter(e => !e.success)

    const totalGas = events.reduce((sum, e) => sum + e.gasUsed, 0)
    const totalValue = events
      .filter(e => e.value && e.value !== '0')
      .reduce((sum, e) => sum + parseFloat(ethers.formatEther(e.value!)), 0)

    const functionCalls: Record<string, any> = {}
    events.forEach(event => {
      if (!functionCalls[event.eventName]) {
        functionCalls[event.eventName] = { count: 0, totalGas: 0, successes: 0 }
      }
      functionCalls[event.eventName].count++
      functionCalls[event.eventName].totalGas += event.gasUsed
      if (event.success) functionCalls[event.eventName].successes++
    })

    Object.keys(functionCalls).forEach(fn => {
      const data = functionCalls[fn]
      functionCalls[fn] = {
        count: data.count,
        averageGas: Math.round(data.totalGas / data.count),
        successRate: (data.successes / data.count) * 100
      }
    })

    return {
      contractAddress,
      chainId,
      totalTransactions: events.length,
      dailyTransactions: dailyEvents.length,
      weeklyTransactions: weeklyEvents.length,
      monthlyTransactions: monthlyEvents.length,
      averageGasUsed: Math.round(totalGas / events.length),
      failedTransactions: failedEvents.length,
      totalValue: totalValue.toFixed(6),
      averageTransactionValue: events.length > 0 ? (totalValue / events.length).toFixed(6) : '0',
      totalFeesPaid: events.reduce((sum, e) => {
        const fee = (e.gasUsed * parseFloat(e.gasPrice)) / 1e18
        return sum + fee
      }, 0).toFixed(6),
      averageFeePerTx: events.length > 0 ? (events.reduce((sum, e) => {
        const fee = (e.gasUsed * parseFloat(e.gasPrice)) / 1e18
        return sum + fee
      }, 0) / events.length).toFixed(6) : '0',
      lastActivity: events[0]?.timestamp || new Date(),
      functionCalls
    }
  }

  async getContractAlerts(
    userId: string, 
    contractAddress?: string, 
    limit: number = 50
  ): Promise<ContractAlert[]> {
    let query = supabase
      .from('contract_alerts')
      .select('*')
      .eq('user_id', userId)

    if (contractAddress) {
      query = query.eq('contract_address', contractAddress)
    }

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching alerts:', error)
      return []
    }

    return data?.map((row: any) => ({
      id: row.id,
      contractAddress: row.contract_address,
      chainId: row.chain_id,
      type: row.type,
      severity: row.severity,
      title: row.title,
      message: row.message,
      timestamp: new Date(row.timestamp),
      acknowledged: row.acknowledged,
      userId: row.user_id,
      triggerData: row.trigger_data
    })) || []
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('contract_alerts')
      .update({ acknowledged: true })
      .eq('id', alertId)
      .eq('user_id', userId)

    return !error
  }
}

// Types pour les règles d'alerte
interface AlertRule {
  id: string
  name: string
  condition: (event: ContractEvent, history: ContractEvent[], contractState?: ContractState | null) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
}

// Instance singleton
export const contractMonitoringService = new ContractMonitoringService() 