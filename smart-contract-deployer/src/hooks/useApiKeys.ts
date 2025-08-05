import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'

interface ApiKey {
  id: string
  name: string
  key: string
  subscriptionTier: 'free' | 'basic' | 'premium' | 'enterprise'
  isActive: boolean
  createdAt: string
  lastUsed?: string
  usageCount: number
  rateLimit: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
  }
}

interface CreateApiKeyRequest {
  name: string
  subscriptionTier: 'free' | 'basic' | 'premium' | 'enterprise'
  permissions?: string[]
}

interface UseApiKeysReturn {
  apiKeys: ApiKey[]
  currentApiKey: string | null
  loading: boolean
  error: string | null
  createApiKey: (request: CreateApiKeyRequest) => Promise<{ id: string; key: string }>
  deleteApiKey: (id: string) => Promise<void>
  setCurrentApiKey: (key: string | null) => void
  refreshApiKeys: () => Promise<void>
  testApiKey: (key: string) => Promise<boolean>
}

export const useApiKeys = (): UseApiKeysReturn => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [currentApiKey, setCurrentApiKeyState] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { address, isConnected } = useAccount()
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004'

  // Charger la clé API actuelle depuis localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('contractforge_api_key')
    setCurrentApiKeyState(savedApiKey)
  }, [])

  // Charger les clés API de l'utilisateur
  const refreshApiKeys = useCallback(async () => {
    if (!isConnected || !address) {
      setApiKeys([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Pour l'instant, l'endpoint pour lister les clés d'un utilisateur n'est pas implémenté
      // On utilise une liste vide en attendant l'implémentation
      setApiKeys([])
      
    } catch (err: any) {
      console.error('Error fetching API keys:', err)
      setError(err.message || 'Erreur lors du chargement des clés API')
      setApiKeys([])
    } finally {
      setLoading(false)
    }
  }, [isConnected, address, API_BASE])

  // Créer une nouvelle clé API
  const createApiKey = useCallback(async (request: CreateApiKeyRequest): Promise<{ id: string; key: string }> => {
    if (!isConnected || !address) {
      throw new Error('Wallet non connecté')
    }

    try {
      setError(null)
      
      const response = await fetch(`${API_BASE}/api/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_MASTER_API_KEY}`
        },
        body: JSON.stringify({
          name: request.name,
          userId: address,
          subscriptionTier: request.subscriptionTier,
          permissions: request.permissions || ['compile', 'deploy', 'verify', 'analytics'],
          walletAddress: address
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la création de la clé API')
      }

      const result = await response.json()
      
      // Rafraîchir la liste
      await refreshApiKeys()
      
      return {
        id: result.apiKey?.id || result.id,
        key: result.apiKey?.key || result.key
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la clé API')
      throw err
    }
  }, [isConnected, address, API_BASE, refreshApiKeys])

  // Supprimer une clé API
  const deleteApiKey = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null)
      
      const response = await fetch(`${API_BASE}/api/keys/${id}/revoke`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_MASTER_API_KEY}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de la clé API')
      }

      // Rafraîchir la liste
      await refreshApiKeys()
      
      // Si c'était la clé active, la supprimer
      const deletedKey = apiKeys.find(key => key.id === id)
      if (deletedKey && currentApiKey === deletedKey.key) {
        setCurrentApiKey(null)
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression de la clé API')
      throw err
    }
  }, [API_BASE, refreshApiKeys, apiKeys, currentApiKey])

  // Définir la clé API actuelle
  const setCurrentApiKey = useCallback((key: string | null) => {
    if (key) {
      localStorage.setItem('contractforge_api_key', key)
    } else {
      localStorage.removeItem('contractforge_api_key')
    }
    setCurrentApiKeyState(key)
  }, [])

  // Tester une clé API
  const testApiKey = useCallback(async (key: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/api/web/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          sourceCode: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\ncontract Test {}',
          contractName: 'Test'
        })
      })

      return response.ok
    } catch (err) {
      console.error('Error testing API key:', err)
      return false
    }
  }, [API_BASE])

  // Charger les clés au montage du composant
  useEffect(() => {
    if (isConnected && address) {
      refreshApiKeys()
    }
  }, [isConnected, address, refreshApiKeys])

  return {
    apiKeys,
    currentApiKey,
    loading,
    error,
    createApiKey,
    deleteApiKey,
    setCurrentApiKey,
    refreshApiKeys,
    testApiKey
  }
}