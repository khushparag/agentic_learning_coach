#!/usr/bin/env python3
"""
Test runner for Remotion Implementation Standards property-based tests.

This script runs the property-based tests for validating Remotion implementation
standards and provides detailed reporting.
"""

import sys
import subprocess
import json
from pathlib import Path
from typing import Dict, Any, List
import time


def run_remotion_property_tests() -> Dict[str, Any]:
    """Run the Remotion property-based tests and collect results."""
    
    print("🎬 Running Remotion Implementation Standards Property Tests...")
    print("=" * 60)
    
    test_file = Path(__file__).parent / "test_remotion_implementation_standards.py"
    
    # Run the tests with detailed output
    cmd = [
        sys.executable, "-m", "pytest",
        str(test_file),
        "-v",
        "--tb=short",
        "--hypothesis-show-statistics",
        "--hypothesis-seed=42",
        "--json-report",
        "--json-report-file=remotion_test_results.json"
    ]
    
    start_time = time.time()
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Parse results
        test_results = {
            "success": result.returncode == 0,
            "duration": duration,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "return_code": result.returncode
        }
        
        # Try to load JSON report if available
        json_report_path = Path("remotion_test_results.json")
        if json_report_path.exists():
            try:
                with open(json_report_path, 'r') as f:
                    json_data = json.load(f)
                    test_results["detailed_results"] = json_data
            except Exception as e:
                test_results["json_parse_error"] = str(e)
        
        return test_results
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "duration": time.time() - start_time
        }


def analyze_remotion_implementation() -> Dict[str, Any]:
    """Analyze the current Remotion implementation for compliance."""
    
    print("\n📊 Analyzing Remotion Implementation...")
    print("-" * 40)
    
    video_project_path = Path("video-project")
    analysis = {
        "project_exists": video_project_path.exists(),
        "structure_analysis": {},
        "configuration_analysis": {},
        "component_analysis": {}
    }
    
    if not analysis["project_exists"]:
        print("❌ Video project directory not found")
        return analysis
    
    # Analyze project structure
    src_path = video_project_path / "src"
    package_json_path = video_project_path / "package.json"
    
    analysis["structure_analysis"] = {
        "has_src_directory": src_path.exists(),
        "has_package_json": package_json_path.exists(),
        "component_count": len(list(src_path.rglob("*.tsx"))) if src_path.exists() else 0
    }
    
    # Analyze package.json
    if package_json_path.exists():
        try:
            with open(package_json_path, 'r') as f:
                package_data = json.load(f)
                
            analysis["configuration_analysis"] = {
                "has_remotion_dependency": "remotion" in package_data.get("dependencies", {}),
                "remotion_version": package_data.get("dependencies", {}).get("remotion", "not found"),
                "has_remotion_config": "remotion" in package_data,
                "scripts": package_data.get("scripts", {})
            }
        except Exception as e:
            analysis["configuration_analysis"]["error"] = str(e)
    
    # Analyze main composition
    main_comp_path = src_path / "ComprehensiveProjectVideo.tsx"
    if main_comp_path.exists():
        try:
            with open(main_comp_path, 'r') as f:
                content = f.read()
            
            analysis["component_analysis"] = {
                "has_main_composition": True,
                "uses_composition_component": "<Composition" in content,
                "uses_remotion_imports": any(hook in content for hook in [
                    "useCurrentFrame", "useVideoConfig", "interpolate", "spring"
                ]),
                "file_size": len(content)
            }
        except Exception as e:
            analysis["component_analysis"]["error"] = str(e)
    else:
        analysis["component_analysis"]["has_main_composition"] = False
    
    return analysis


def print_test_summary(results: Dict[str, Any], analysis: Dict[str, Any]):
    """Print a comprehensive test summary."""
    
    print("\n" + "=" * 60)
    print("🎬 REMOTION IMPLEMENTATION STANDARDS TEST SUMMARY")
    print("=" * 60)
    
    # Test Results
    if results["success"]:
        print("✅ Property-based tests: PASSED")
    else:
        print("❌ Property-based tests: FAILED")
    
    print(f"⏱️  Test duration: {results['duration']:.2f} seconds")
    
    # Implementation Analysis
    print("\n📊 Implementation Analysis:")
    print(f"   Project exists: {'✅' if analysis['project_exists'] else '❌'}")
    
    if analysis["project_exists"]:
        struct = analysis["structure_analysis"]
        print(f"   Source directory: {'✅' if struct['has_src_directory'] else '❌'}")
        print(f"   Package.json: {'✅' if struct['has_package_json'] else '❌'}")
        print(f"   Component files: {struct['component_count']}")
        
        config = analysis["configuration_analysis"]
        if config:
            print(f"   Remotion dependency: {'✅' if config.get('has_remotion_dependency') else '❌'}")
            if config.get('remotion_version'):
                print(f"   Remotion version: {config['remotion_version']}")
        
        comp = analysis["component_analysis"]
        if comp:
            print(f"   Main composition: {'✅' if comp.get('has_main_composition') else '❌'}")
            print(f"   Uses Remotion hooks: {'✅' if comp.get('uses_remotion_imports') else '❌'}")
    
    # Detailed Results
    if "detailed_results" in results:
        detailed = results["detailed_results"]
        if "summary" in detailed:
            summary = detailed["summary"]
            print(f"\n📈 Test Statistics:")
            print(f"   Total tests: {summary.get('total', 0)}")
            print(f"   Passed: {summary.get('passed', 0)}")
            print(f"   Failed: {summary.get('failed', 0)}")
            print(f"   Skipped: {summary.get('skipped', 0)}")
    
    # Error Details
    if not results["success"]:
        print("\n❌ Test Failures:")
        if results.get("stderr"):
            print(results["stderr"][:1000])  # Limit output
        if results.get("stdout"):
            print("\nTest Output:")
            print(results["stdout"][:1000])  # Limit output
    
    print("\n" + "=" * 60)


def main():
    """Main test runner function."""
    
    print("🚀 Starting Remotion Implementation Standards Validation")
    print("Testing Property 7: Remotion Implementation Standards")
    print("Validates: Requirements 13.3, 13.4, 13.5")
    print()
    
    # Run analysis first
    analysis = analyze_remotion_implementation()
    
    # Run property-based tests
    results = run_remotion_property_tests()
    
    # Print comprehensive summary
    print_test_summary(results, analysis)
    
    # Return appropriate exit code
    return 0 if results["success"] else 1


if __name__ == "__main__":
    sys.exit(main())