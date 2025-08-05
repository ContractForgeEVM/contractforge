#!/usr/bin/env python3
"""
Wrapper Python pour Slither - Analyse de sécurité des contrats Solidity
Usage: python3 slither_wrapper.py <contract_file> <contract_name>
"""

import sys
import json
import tempfile
import os
import ssl
from pathlib import Path
from typing import Dict, List, Any

# Configuration SSL pour résoudre les problèmes de certificats
try:
    import certifi
    ssl._create_default_https_context = ssl._create_unverified_context
    os.environ['SSL_CERT_FILE'] = certifi.where()
    os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
except ImportError:
    pass

try:
    from slither import Slither
    from slither.core.declarations import Function
    from slither.detectors import all_detectors
    from slither.detectors.abstract_detector import AbstractDetector
except ImportError:
    print(json.dumps({
        "error": "Slither not available",
        "issues": [],
        "toolsUsed": []
    }))
    sys.exit(1)

def analyze_contract_with_slither(contract_file: str, contract_name: str) -> Dict[str, Any]:
    """
    Analyse un contrat avec Slither et retourne les résultats au format JSON
    """
    try:
        # Initialiser Slither avec gestion d'erreurs de compilation
        try:
            # Vérifier si un fichier remappings.txt existe dans le répertoire du contrat
            contract_dir = os.path.dirname(os.path.abspath(contract_file))
            remappings_file = os.path.join(contract_dir, 'remappings.txt')
            
            if os.path.exists(remappings_file):
                # Utiliser les remappings avec Slither et forcer le mode hors ligne
                slither = Slither(contract_file, solc_arguments=[
                    '--allow-paths', contract_dir,
                    '--base-path', contract_dir,
                    '--include-path', os.path.join(contract_dir, 'lib'),
                    '--offline',
                    '--no-download'
                ])
            else:
                # Forcer le mode hors ligne même sans remappings
                slither = Slither(contract_file, solc_arguments=['--offline', '--no-download'])
        except Exception as compilation_error:
            # Si la compilation échoue, retourner les erreurs comme issues
            error_message = str(compilation_error)
            

            
            if "deprecated" in error_message.lower() or "invalid" in error_message.lower():
                # Extraire les erreurs de compilation
                lines = error_message.split('\n')
                compilation_issues = []
                
                for line in lines:
                    if '-->' in line and ':' in line:
                        # Parser les erreurs de compilation
                        parts = line.split('-->')
                        if len(parts) >= 2:
                            file_info = parts[1].strip()
                            if ':' in file_info:
                                line_num = file_info.split(':')[1].strip()
                                try:
                                    line_num = int(line_num)
                                except:
                                    line_num = 1
                                
                                # Déterminer la sévérité basée sur le type d'erreur
                                severity = 'MEDIUM'
                                if 'deprecated' in error_message.lower():
                                    severity = 'HIGH'
                                elif 'invalid' in error_message.lower():
                                    severity = 'CRITICAL'
                                
                                compilation_issues.append({
                                    "id": f"compilation-error-{line_num}",
                                    "severity": severity,
                                    "category": "COMPILATION",
                                    "title": "Compilation Error",
                                    "description": error_message,
                                    "line": line_num,
                                    "file": contract_name,
                                    "tool": "SLITHER",
                                    "recommendation": "Fix compilation errors before security audit",
                                    "impact": "Contract cannot be compiled"
                                })
                
                return {
                    "success": True,
                    "issues": compilation_issues,
                    "toolsUsed": ["Slither"],
                    "contractName": contract_name,
                    "totalIssues": len(compilation_issues)
                }
            else:
                # Autres erreurs de compilation
                return {
                    "success": True,
                    "issues": [{
                        "id": "compilation-failed",
                        "severity": "CRITICAL",
                        "category": "COMPILATION",
                        "title": "Compilation Failed",
                        "description": error_message,
                        "line": 1,
                        "file": contract_name,
                        "tool": "SLither",
                        "recommendation": "Fix compilation errors",
                        "impact": "Contract cannot be analyzed"
                    }],
                    "toolsUsed": ["Slither"],
                    "contractName": contract_name,
                    "totalIssues": 1
                }
        
        # Obtenir le contrat
        contracts = slither.contracts
        if not contracts:
            return {
                "error": f"No contracts found in {contract_file}",
                "issues": [],
                "toolsUsed": []
            }
        
        # Trouver le contrat spécifique
        target_contract = None
        for contract in contracts:
            if contract.name == contract_name:
                target_contract = contract
                break
        
        if not target_contract:
            return {
                "error": f"Contract {contract_name} not found",
                "issues": [],
                "toolsUsed": []
            }
        
        # Exécuter tous les détecteurs
        issues = []
        
        # Détecteurs spécifiques pour les vulnérabilités critiques
        critical_detectors = [
            'reentrancy-eth',
            'reentrancy-no-eth',
            'reentrancy-benign',
            'reentrancy-events',
            'controlled-delegatecall',
            'arbitrary-send-eth',
            'arbitrary-send-erc20',
            'unchecked-transfer',
            'unchecked-lowlevel',
            'unchecked-send',
            'unchecked-call',
            'tx-origin',
            'weak-prng',
            'suicidal',
            'delegatecall-loop',
            'state-variable-assignment',
            'state-variable-constant',
            'uninitialized-state',
            'uninitialized-storage',
            'unused-return',
            'incorrect-equality',
            'incorrect-modifier',
            'incorrect-shift',
            'incorrect-unary',
            'incorrect-erc20',
            'incorrect-erc721',
            'incorrect-erc777',
            'incorrect-erc165',
            'incorrect-erc1820',
            'incorrect-erc2612',
            'incorrect-erc4626',
            'incorrect-erc1155',
            'incorrect-erc1167',
            'incorrect-erc1271',
            'incorrect-erc1363',
            'incorrect-erc1400',
            'incorrect-erc1404',
            'incorrect-erc1410',
            'incorrect-erc1594',
            'incorrect-erc1643',
            'incorrect-erc1644',
            'incorrect-erc1646',
            'incorrect-erc777',
            'incorrect-erc820',
            'incorrect-erc831',
            'incorrect-erc884',
            'incorrect-erc900',
            'incorrect-erc948',
            'incorrect-erc998',
            'incorrect-erc1155',
            'incorrect-erc1167',
            'incorrect-erc1271',
            'incorrect-erc1363',
            'incorrect-erc1400',
            'incorrect-erc1404',
            'incorrect-erc1410',
            'incorrect-erc1594',
            'incorrect-erc1643',
            'incorrect-erc1644',
            'incorrect-erc1646',
            'incorrect-erc777',
            'incorrect-erc820',
            'incorrect-erc831',
            'incorrect-erc884',
            'incorrect-erc900',
            'incorrect-erc948',
            'incorrect-erc998'
        ]
        
        # Exécuter les détecteurs critiques
        for detector_name in critical_detectors:
            try:
                detector_class = all_detectors.get(detector_name)
                if detector_class:
                    detector = detector_class(slither, {})
                    detector_results = detector._detect()
                    
                    for result in detector_results:
                        if hasattr(result, 'elements') and result.elements:
                            for element in result.elements:
                                if hasattr(element, 'source_mapping'):
                                    source_mapping = element.source_mapping
                                    line = source_mapping.lines[0] if source_mapping.lines else 0
                                    
                                    # Déterminer la sévérité
                                    severity = 'MEDIUM'
                                    if detector_name in ['reentrancy-eth', 'controlled-delegatecall', 'arbitrary-send-eth']:
                                        severity = 'CRITICAL'
                                    elif detector_name in ['reentrancy-no-eth', 'unchecked-transfer', 'tx-origin']:
                                        severity = 'HIGH'
                                    
                                    issues.append({
                                        "id": f"slither-{detector_name}-{line}",
                                        "severity": severity,
                                        "category": "SECURITY",
                                        "title": f"Slither: {detector_name.replace('-', ' ').title()}",
                                        "description": str(result.description) if hasattr(result, 'description') else f"Detected by {detector_name}",
                                        "line": line,
                                        "file": contract_name,
                                        "tool": "SLITHER",
                                        "recommendation": f"Fix {detector_name} vulnerability",
                                        "impact": "Security vulnerability"
                                    })
            except Exception as e:
                # Ignorer les erreurs de détecteurs individuels
                continue
        
        # Analyse des patterns de base
        basic_patterns = analyze_basic_patterns(target_contract)
        issues.extend(basic_patterns)
        
        return {
            "success": True,
            "issues": issues,
            "toolsUsed": ["Slither"],
            "contractName": contract_name,
            "totalIssues": len(issues)
        }
        
    except Exception as e:
        return {
            "error": f"Slither analysis failed: {str(e)}",
            "issues": [],
            "toolsUsed": []
        }

def analyze_basic_patterns(contract) -> List[Dict[str, Any]]:
    """
    Analyse des patterns de base avec Slither
    """
    issues = []
    
    # Analyser les fonctions
    for function in contract.functions:
        # Vérifier les appels externes
        for call in function.external_calls_as_expressions:
            if hasattr(call, 'source_mapping') and call.source_mapping.lines:
                line = call.source_mapping.lines[0]
                
                # Vérifier si c'est un appel de transfert
                if 'transfer' in str(call).lower() or 'send' in str(call).lower():
                    issues.append({
                        "id": f"slither-external-call-{line}",
                        "severity": "MEDIUM",
                        "category": "EXTERNAL_CALL",
                        "title": "External Call Detected",
                        "description": "External call found in function",
                        "line": line,
                        "file": contract.name,
                        "tool": "SLITHER",
                        "recommendation": "Review external call for security implications",
                        "impact": "Potential security risk"
                    })
    
    # Analyser les variables d'état
    for variable in contract.state_variables:
        if hasattr(variable, 'source_mapping') and variable.source_mapping.lines:
            line = variable.source_mapping.lines[0]
            
            # Vérifier les variables publiques
            if variable.visibility == 'public':
                issues.append({
                    "id": f"slither-public-var-{line}",
                    "severity": "LOW",
                    "category": "ACCESS_CONTROL",
                    "title": "Public State Variable",
                    "description": f"Public state variable: {variable.name}",
                    "line": line,
                    "file": contract.name,
                    "tool": "SLITHER",
                    "recommendation": "Consider if public visibility is necessary",
                    "impact": "Information disclosure"
                })
    
    return issues

def main():
    """
    Point d'entrée principal
    """
    if len(sys.argv) != 3:
        print(json.dumps({
            "error": "Usage: python3 slither_wrapper.py <contract_file> <contract_name>",
            "issues": [],
            "toolsUsed": []
        }))
        sys.exit(1)
    
    contract_file = sys.argv[1]
    contract_name = sys.argv[2]
    
    if not os.path.exists(contract_file):
        print(json.dumps({
            "error": f"Contract file not found: {contract_file}",
            "issues": [],
            "toolsUsed": []
        }))
        sys.exit(1)
    
    # Analyser le contrat
    result = analyze_contract_with_slither(contract_file, contract_name)
    
    # Retourner le résultat en JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 