#!/usr/bin/env node

/**
 * Quality Gates Script
 * Runs comprehensive quality checks and enforces quality standards
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Quality thresholds
const QUALITY_THRESHOLDS = {
  coverage: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80
  },
  performance: {
    bundleSize: 5 * 1024 * 1024, // 5MB
    lighthouse: {
      performance: 90,
      accessibility: 95,
      bestPractices: 90,
      seo: 90
    }
  },
  security: {
    vulnerabilities: {
      critical: 0,
      high: 0,
      moderate: 5
    }
  },
  codeQuality: {
    eslintErrors: 0,
    eslintWarnings: 10,
    typeErrors: 0
  }
};

class QualityGates {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, description) {
    this.log(`Running: ${description}`, 'info');
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: process.cwd()
      });
      return { success: true, output };
    } catch (error) {
      return { 
        success: false, 
        output: error.stdout || error.stderr || error.message 
      };
    }
  }

  async checkCodeCoverage() {
    this.log('Checking code coverage...', 'info');
    
    const result = await this.runCommand(
      'npm run test:coverage -- --silent',
      'Running test coverage'
    );
    
    if (!result.success) {
      this.results.failed.push('Code coverage check failed');
      return false;
    }

    // Parse coverage report
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    if (!fs.existsSync(coveragePath)) {
      this.results.failed.push('Coverage report not found');
      return false;
    }

    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const total = coverage.total;
    
    const checks = [
      { name: 'Lines', actual: total.lines.pct, threshold: QUALITY_THRESHOLDS.coverage.lines },
      { name: 'Functions', actual: total.functions.pct, threshold: QUALITY_THRESHOLDS.coverage.functions },
      { name: 'Branches', actual: total.branches.pct, threshold: QUALITY_THRESHOLDS.coverage.branches },
      { name: 'Statements', actual: total.statements.pct, threshold: QUALITY_THRESHOLDS.coverage.statements }
    ];

    let passed = true;
    for (const check of checks) {
      if (check.actual < check.threshold) {
        this.results.failed.push(
          `${check.name} coverage ${check.actual}% is below threshold ${check.threshold}%`
        );
        passed = false;
      } else {
        this.results.passed.push(
          `${check.name} coverage ${check.actual}% meets threshold ${check.threshold}%`
        );
      }
    }

    return passed;
  }

  async checkLinting() {
    this.log('Checking code linting...', 'info');
    
    const result = await this.runCommand(
      'npm run lint -- --format json --output-file eslint-report.json',
      'Running ESLint'
    );

    // ESLint returns non-zero exit code for errors, but we want to parse the report
    const reportPath = path.join(process.cwd(), 'eslint-report.json');
    if (!fs.existsSync(reportPath)) {
      this.results.failed.push('ESLint report not found');
      return false;
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    let totalErrors = 0;
    let totalWarnings = 0;
    
    report.forEach(file => {
      totalErrors += file.errorCount;
      totalWarnings += file.warningCount;
    });

    let passed = true;
    
    if (totalErrors > QUALITY_THRESHOLDS.codeQuality.eslintErrors) {
      this.results.failed.push(
        `ESLint errors: ${totalErrors} exceeds threshold ${QUALITY_THRESHOLDS.codeQuality.eslintErrors}`
      );
      passed = false;
    } else {
      this.results.passed.push(`ESLint errors: ${totalErrors} within threshold`);
    }

    if (totalWarnings > QUALITY_THRESHOLDS.codeQuality.eslintWarnings) {
      this.results.warnings.push(
        `ESLint warnings: ${totalWarnings} exceeds threshold ${QUALITY_THRESHOLDS.codeQuality.eslintWarnings}`
      );
    } else {
      this.results.passed.push(`ESLint warnings: ${totalWarnings} within threshold`);
    }

    return passed;
  }

  async checkTypeScript() {
    this.log('Checking TypeScript compilation...', 'info');
    
    const result = await this.runCommand(
      'npm run type-check',
      'TypeScript type checking'
    );

    if (!result.success) {
      this.results.failed.push('TypeScript compilation failed');
      return false;
    }

    this.results.passed.push('TypeScript compilation successful');
    return true;
  }

  async checkBundleSize() {
    this.log('Checking bundle size...', 'info');
    
    // Build the application
    const buildResult = await this.runCommand(
      'npm run build',
      'Building application'
    );

    if (!buildResult.success) {
      this.results.failed.push('Application build failed');
      return false;
    }

    // Check bundle size
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      this.results.failed.push('Build output directory not found');
      return false;
    }

    const getBundleSize = (dir) => {
      let size = 0;
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          size += getBundleSize(filePath);
        } else {
          size += stat.size;
        }
      }
      
      return size;
    };

    const bundleSize = getBundleSize(distPath);
    const threshold = QUALITY_THRESHOLDS.performance.bundleSize;

    if (bundleSize > threshold) {
      this.results.failed.push(
        `Bundle size ${(bundleSize / 1024 / 1024).toFixed(2)}MB exceeds threshold ${(threshold / 1024 / 1024).toFixed(2)}MB`
      );
      return false;
    }

    this.results.passed.push(
      `Bundle size ${(bundleSize / 1024 / 1024).toFixed(2)}MB within threshold`
    );
    return true;
  }

  async checkSecurity() {
    this.log('Checking security vulnerabilities...', 'info');
    
    const auditResult = await this.runCommand(
      'npm audit --audit-level moderate --json',
      'Running npm audit'
    );

    // npm audit returns non-zero for vulnerabilities, but we want to parse the output
    let auditData;
    try {
      auditData = JSON.parse(auditResult.output);
    } catch (error) {
      this.results.warnings.push('Could not parse npm audit output');
      return true; // Don't fail the build for parsing issues
    }

    const vulnerabilities = auditData.vulnerabilities || {};
    const metadata = auditData.metadata || {};
    
    let critical = 0;
    let high = 0;
    let moderate = 0;

    Object.values(vulnerabilities).forEach(vuln => {
      if (vuln.severity === 'critical') critical++;
      else if (vuln.severity === 'high') high++;
      else if (vuln.severity === 'moderate') moderate++;
    });

    let passed = true;
    const thresholds = QUALITY_THRESHOLDS.security.vulnerabilities;

    if (critical > thresholds.critical) {
      this.results.failed.push(`Critical vulnerabilities: ${critical} exceeds threshold ${thresholds.critical}`);
      passed = false;
    }

    if (high > thresholds.high) {
      this.results.failed.push(`High vulnerabilities: ${high} exceeds threshold ${thresholds.high}`);
      passed = false;
    }

    if (moderate > thresholds.moderate) {
      this.results.warnings.push(`Moderate vulnerabilities: ${moderate} exceeds threshold ${thresholds.moderate}`);
    }

    if (passed) {
      this.results.passed.push(`Security vulnerabilities within acceptable limits`);
    }

    return passed;
  }

  async checkAccessibility() {
    this.log('Checking accessibility compliance...', 'info');
    
    // Start the application for testing
    const startResult = await this.runCommand(
      'npm run preview &',
      'Starting preview server'
    );

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      const axeResult = await this.runCommand(
        'npx @axe-core/cli http://localhost:4173 --exit --tags wcag2a,wcag2aa',
        'Running axe accessibility tests'
      );

      if (!axeResult.success) {
        this.results.failed.push('Accessibility tests failed');
        return false;
      }

      this.results.passed.push('Accessibility tests passed');
      return true;
    } finally {
      // Kill the preview server
      try {
        execSync('pkill -f "vite preview"', { stdio: 'ignore' });
      } catch (error) {
        // Ignore errors when killing the process
      }
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks: this.results.passed.length + this.results.failed.length + this.results.warnings.length,
        passed: this.results.passed.length,
        failed: this.results.failed.length,
        warnings: this.results.warnings.length,
        success: this.results.failed.length === 0
      },
      details: {
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings
      },
      thresholds: QUALITY_THRESHOLDS
    };

    // Write report to file
    fs.writeFileSync(
      path.join(process.cwd(), 'quality-gates-report.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('                QUALITY GATES REPORT');
    console.log('='.repeat(60));
    
    if (report.summary.success) {
      this.log(`All quality gates passed! ✨`, 'success');
    } else {
      this.log(`Quality gates failed! ❌`, 'error');
    }

    console.log(`\nSummary:`);
    console.log(`  Total Checks: ${report.summary.totalChecks}`);
    console.log(`  ✅ Passed: ${report.summary.passed}`);
    console.log(`  ❌ Failed: ${report.summary.failed}`);
    console.log(`  ⚠️  Warnings: ${report.summary.warnings}`);

    if (report.details.failed.length > 0) {
      console.log(`\n❌ Failed Checks:`);
      report.details.failed.forEach(failure => {
        console.log(`  • ${failure}`);
      });
    }

    if (report.details.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      report.details.warnings.forEach(warning => {
        console.log(`  • ${warning}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }

  async run() {
    this.log('Starting quality gates checks...', 'info');
    
    const checks = [
      { name: 'TypeScript', fn: () => this.checkTypeScript() },
      { name: 'Linting', fn: () => this.checkLinting() },
      { name: 'Code Coverage', fn: () => this.checkCodeCoverage() },
      { name: 'Bundle Size', fn: () => this.checkBundleSize() },
      { name: 'Security', fn: () => this.checkSecurity() },
      { name: 'Accessibility', fn: () => this.checkAccessibility() }
    ];

    let allPassed = true;

    for (const check of checks) {
      try {
        const passed = await check.fn();
        if (!passed) {
          allPassed = false;
        }
      } catch (error) {
        this.log(`Error in ${check.name} check: ${error.message}`, 'error');
        this.results.failed.push(`${check.name} check failed with error: ${error.message}`);
        allPassed = false;
      }
    }

    const report = this.generateReport();
    this.printSummary(report);

    return allPassed;
  }
}

// Run quality gates if called directly
if (require.main === module) {
  const gates = new QualityGates();
  
  gates.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Quality gates failed with error:', error);
      process.exit(1);
    });
}

module.exports = QualityGates;