import express from 'express'
import { securityAuditor, AuditResult } from '../services/securityAuditor'
import { rateLimit } from 'express-rate-limit'

const router = express.Router()

// Rate limiting pour l'audit de sécurité
const auditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 audits par IP par fenêtre
  message: {
    error: 'Too many audit requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * @route POST /api/security-audit
 * @desc Effectuer un audit de sécurité sur un contrat Solidity
 * @access Public (avec rate limiting)
 */
router.post('/audit', auditLimiter, async (req, res) => {
  try {
    const { sourceCode, contractName } = req.body

    // Validation des paramètres
    if (!sourceCode || typeof sourceCode !== 'string') {
      return res.status(400).json({
        error: 'Source code is required and must be a string',
        code: 'MISSING_SOURCE_CODE'
      })
    }

    if (!contractName || typeof contractName !== 'string') {
      return res.status(400).json({
        error: 'Contract name is required and must be a string',
        code: 'MISSING_CONTRACT_NAME'
      })
    }

    if (sourceCode.length > 50000) {
      return res.status(400).json({
        error: 'Source code is too large (max 50KB)',
        code: 'SOURCE_CODE_TOO_LARGE'
      })
    }

    // Validation basique du format Solidity
    if (!sourceCode.includes('pragma solidity') && !sourceCode.includes('contract')) {
      return res.status(400).json({
        error: 'Invalid Solidity code format',
        code: 'INVALID_SOLIDITY_FORMAT'
      })
    }

    console.log(`🔍 Starting security audit for contract: ${contractName}`)
    console.log(`📊 Source code length: ${sourceCode.length} characters`)

    // Effectuer l'audit
    const auditResult: AuditResult = await securityAuditor.auditContract(sourceCode, contractName)

    console.log(`✅ Audit completed for ${contractName}:`)
    console.log(`   Score: ${auditResult.score}/100 (Grade: ${auditResult.grade})`)
    console.log(`   Issues: ${auditResult.issues.length} total`)
    console.log(`   Tools used: ${auditResult.toolsUsed.join(', ')}`)
    console.log(`   Audit time: ${auditResult.auditTime}ms`)

    // Retourner le résultat
    res.json({
      success: true,
      data: auditResult,
      message: `Security audit completed for ${contractName}`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Security audit error:', error)
    
    res.status(500).json({
      error: 'Internal server error during security audit',
      code: 'AUDIT_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * @route GET /api/security-audit/health
 * @desc Vérifier la santé du service d'audit de sécurité
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    // Test simple avec un contrat basique
    const testContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TestContract {
    uint256 public value;
    
    function setValue(uint256 _value) public {
        value = _value;
    }
    
    function getValue() public view returns (uint256) {
        return value;
    }
}`

    const testResult = await securityAuditor.auditContract(testContract, 'TestContract')
    
    res.json({
      success: true,
      status: 'healthy',
      tools: {
        solhint: testResult.toolsUsed.includes('Solhint'),
        customPatterns: testResult.toolsUsed.includes('Custom Patterns'),
        gasAnalysis: testResult.toolsUsed.includes('Gas Analysis')
      },
      testAudit: {
        score: testResult.score,
        grade: testResult.grade,
        issuesFound: testResult.issues.length,
        auditTime: testResult.auditTime
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Security audit health check failed:', error)
    
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Security audit service is not responding',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * @route GET /api/security-audit/standards
 * @desc Obtenir les standards de sécurité de la plateforme
 * @access Public
 */
router.get('/standards', (req, res) => {
  res.json({
    success: true,
    data: {
      approvalCriteria: {
        minScore: 70,
        maxCriticalIssues: 0,
        maxHighIssues: 0,
        maxMediumIssues: 0,
        maxLowIssues: 10
      },
      rejectionCriteria: {
        scoreBelow: 70,
        anyCriticalIssues: true,
        anyHighIssues: true,
        anyMediumIssues: true,
        majorVulnerabilities: true
      },
      scoringSystem: {
        criticalPenalty: 25,
        highPenalty: 15,
        mediumPenalty: 8,
        lowPenalty: 3,
        maxScore: 100
      },
      gradeSystem: {
        A: '90-100',
        B: '80-89',
        C: '70-79',
        D: '60-69',
        F: '0-59'
      },
      tools: {
        solhint: 'Static analysis for Solidity best practices',
        customPatterns: 'Advanced vulnerability pattern detection',
        gasAnalysis: 'Gas optimization analysis'
      }
    },
    message: 'Platform security standards',
    timestamp: new Date().toISOString()
  })
})

export default router 