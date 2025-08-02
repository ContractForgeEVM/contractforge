#!/usr/bin/env ts-node

import { runTemplateAudit } from './auditExistingTemplates'

// Lancer l'audit et afficher les résultats
async function main() {
  try {
    console.log('🚀 Starting Template Security Audit...\n')
    
    const results = await runTemplateAudit()
    
    // Analyser les résultats pour des recommandations immédiates
    const criticalIssues = results.filter(r => 
      r.vulnerabilities.some(v => v.severity === 'critical')
    )
    
    const highIssues = results.filter(r => 
      r.vulnerabilities.some(v => v.severity === 'high')
    )
    
    console.log('\n🎯 IMMEDIATE ACTION REQUIRED:')
    console.log('=' .repeat(40))
    
    if (criticalIssues.length > 0) {
      console.log('🚨 CRITICAL ISSUES - Must fix before deployment:')
      criticalIssues.forEach(issue => {
        console.log(`   • ${issue.templateId}: ${issue.vulnerabilities.filter(v => v.severity === 'critical').length} critical issues`)
      })
    }
    
    if (highIssues.length > 0) {
      console.log('\n⚠️  HIGH PRIORITY - Should fix soon:')
      highIssues.forEach(issue => {
        console.log(`   • ${issue.templateId}: ${issue.vulnerabilities.filter(v => v.severity === 'high').length} high priority issues`)
      })
    }
    
    const deployableTemplates = results.filter(r => r.securityScore >= 60)
    console.log(`\n✅ DEPLOYABLE TEMPLATES: ${deployableTemplates.length}/${results.length}`)
    
    const averageScore = Math.round(
      results.reduce((sum, r) => sum + r.securityScore, 0) / results.length
    )
    
    console.log(`📊 OVERALL SECURITY SCORE: ${averageScore}/100`)
    
    if (averageScore >= 80) {
      console.log('🏆 EXCELLENT - Your templates are very secure!')
    } else if (averageScore >= 60) {
      console.log('👍 GOOD - Minor improvements needed')
    } else if (averageScore >= 40) {
      console.log('⚠️  NEEDS WORK - Several security issues found')
    } else {
      console.log('🚨 CRITICAL - Major security overhaul required')
    }
    
    console.log('\n📋 NEXT STEPS:')
    console.log('1. Review the detailed report JSON file')
    console.log('2. Fix critical issues first')
    console.log('3. Implement recommended security improvements')
    console.log('4. Re-run audit to verify fixes')
    
  } catch (error) {
    console.error('❌ Audit failed:', error)
    process.exit(1)
  }
}

// Exécuter si ce fichier est lancé directement
if (require.main === module) {
  main()
}

export { main } 