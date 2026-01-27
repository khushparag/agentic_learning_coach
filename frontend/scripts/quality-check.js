#!/usr/bin/env node

/**
 * Quality Check Script
 * Runs comprehensive quality checks for the frontend application
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class QualityChecker {
  constructor() {
    this.results = {
      lint: false,
      typeCheck: false,
      tests: false,
      coverage: false,
      security: false,
      accessibility: false,
      performance: false,
      build: false,
    };
    this.errors = [];
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
    };
    console.log(colors[type](`[${type.toUpperCase()}] ${message}`));
  }

  async runCommand(command, description, required = true) {
    this.log(`Running: ${description}`, 'info');
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      this.log(`✅ ${description} passed`, 'success');
      return { success: true, output };
    } catch (error) {
      const message = `❌ ${description} failed: ${error.message}`;
      this.log(message, 'error');
      if (required) {
        this.errors.push(message);
      }
      return { success: false, error: error.message };
    }
  }

  async checkLinting() {
    this.log('🔍 Checking code quality...', 'info');
    
    // ESLint
    const eslintResult = await this.runCommand(
      'npm run lint',
      'ESLint code quality check'
    );
    
    // Prettier
    const prettierResult = await this.runCommand(
      'npm run format:check',
      'Prettier formatting check'
    );
    
    this.results.lint = eslintResult.success && prettierResult.success;
  }

  async checkTypeScript() {
    this.log('📝 Checking TypeScript types...', 'info');
    
    const result = await this.runCommand(
      'npm run type-check',
      'TypeScript type checking'
    );
    
    this.results.typeCheck = result.success;
  }

  async runTests() {
    this.log('🧪 Running tests...', 'info');
    
    // Unit tests
    const unitTestResult = await this.runCommand(
      'npm run test:unit',
      'Unit tests'
    );
    
    // Integration tests
    const integrationTestResult = await this.runCommand(
      'npm run test:integration',
      'Integration tests',
      false // Not required for basic quality check
    );
    
    this.results.tests = unitTestResult.success;
  }

  async checkCoverage() {
    this.log('📊 Checking test coverage...', 'info');
    
    const result = await this.runCommand(
      'npm run test:coverage',
      'Test coverage analysis'
    );
    
    if (result.success) {
      // Check coverage thresholds
      try {
        const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
        if (fs.existsSync(coveragePath)) {
          const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          const totalCoverage = coverage.total;
          
          const thresholds = {
            statements: 80,
            branches: 75,
            functions: 80,
            lines: 80,
          };
          
          let coveragePassed = true;
          for (const [metric, threshold] of Object.entries(thresholds)) {
            const actual = totalCoverage[metric].pct;
            if (actual < threshold) {
              this.log(`❌ ${metric} coverage ${actual}% is below threshold ${threshold}%`, 'error');
              coveragePassed = false;
            } else {
              this.log(`✅ ${metric} coverage ${actual}% meets threshold ${threshold}%`, 'success');
            }
          }
          
          this.results.coverage = coveragePassed;
        }
      } catch (error) {
        this.log(`Warning: Could not parse coverage report: ${error.message}`, 'warning');
        this.results.coverage = result.success;
      }
    } else {
      this.results.coverage = false;
    }
  }

  async checkSecurity() {
    this.log('🔒 Running security checks...', 'info');
    
    // npm audit
    const auditResult = await this.runCommand(
      'npm audit --audit-level moderate',
      'npm audit security check',
      false // Warnings are acceptable
    );
    
    // Check for known vulnerabilities in dependencies
    const result = await this.runCommand(
      'npm run security:check',
      'Dependency security scan',
      false
    );
    
    this.results.security = auditResult.success || result.success;
  }

  async checkAccessibility() {
    this.log('♿ Checking accessibility...', 'info');
    
    const result = await this.runCommand(
      'npm run test:accessibility',
      'Accessibility tests',
      false
    );
    
    this.results.accessibility = result.success;
  }

  async checkPerformance() {
    this.log('⚡ Checking performance...', 'info');
    
    // Build the app first
    const buildResult = await this.runCommand(
      'npm run build',
      'Production build'
    );
    
    if (buildResult.success) {
      // Check bundle size
      const bundleResult = await this.runCommand(
        'npm run analyze:bundle',
        'Bundle size analysis',
        false
      );
      
      // Run performance tests
      const perfResult = await this.runCommand(
        'npm run test:performance',
        'Performance tests',
        false
      );
      
      this.results.performance = bundleResult.success && perfResult.success;
      this.results.build = true;
    } else {
      this.results.performance = false;
      this.results.build = false;
    }
  }

  async checkBundleSize() {
    this.log('📦 Analyzing bundle size...', 'info');
    
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      this.log('❌ Dist folder not found. Run build first.', 'error');
      return false;
    }
    
    try {
      // Get main bundle size
      const files = fs.readdirSync(distPath);
      const jsFiles = files.filter(file => file.endsWith('.js'));
      const cssFiles = files.filter(file => file.endsWith('.css'));
      
      let totalJsSize = 0;
      let totalCssSize = 0;
      
      jsFiles.forEach(file => {
        const stats = fs.statSync(path.join(distPath, file));
        totalJsSize += stats.size;
      });
      
      cssFiles.forEach(file => {
        const stats = fs.statSync(path.join(distPath, file));
        totalCssSize += stats.size;
      });
      
      const formatSize = (bytes) => {
        const kb = bytes / 1024;
        return kb > 1024 ? `${(kb / 1024).toFixed(2)}MB` : `${kb.toFixed(2)}KB`;
      };
      
      this.log(`📊 Bundle Analysis:`, 'info');
      this.log(`   JavaScript: ${formatSize(totalJsSize)}`, 'info');
      this.log(`   CSS: ${formatSize(totalCssSize)}`, 'info');
      this.log(`   Total: ${formatSize(totalJsSize + totalCssSize)}`, 'info');
      
      // Check against thresholds
      const jsThreshold = 500 * 1024; // 500KB
      const cssThreshold = 100 * 1024; // 100KB
      
      if (totalJsSize > jsThreshold) {
        this.log(`❌ JavaScript bundle size ${formatSize(totalJsSize)} exceeds threshold ${formatSize(jsThreshold)}`, 'error');
        return false;
      }
      
      if (totalCssSize > cssThreshold) {
        this.log(`❌ CSS bundle size ${formatSize(totalCssSize)} exceeds threshold ${formatSize(cssThreshold)}`, 'error');
        return false;
      }
      
      this.log('✅ Bundle sizes are within acceptable limits', 'success');
      return true;
    } catch (error) {
      this.log(`❌ Bundle analysis failed: ${error.message}`, 'error');
      return false;
    }
  }

  generateReport() {
    this.log('\n📋 Quality Check Report', 'info');
    this.log('========================', 'info');
    
    const checks = [
      { name: 'Linting', result: this.results.lint },
      { name: 'Type Check', result: this.results.typeCheck },
      { name: 'Tests', result: this.results.tests },
      { name: 'Coverage', result: this.results.coverage },
      { name: 'Security', result: this.results.security },
      { name: 'Accessibility', result: this.results.accessibility },
      { name: 'Performance', result: this.results.performance },
      { name: 'Build', result: this.results.build },
    ];
    
    let passedChecks = 0;
    checks.forEach(check => {
      const status = check.result ? '✅ PASS' : '❌ FAIL';
      const color = check.result ? 'success' : 'error';
      this.log(`${check.name.padEnd(15)} ${status}`, color);
      if (check.result) passedChecks++;
    });
    
    this.log(`\nOverall: ${passedChecks}/${checks.length} checks passed`, 
      passedChecks === checks.length ? 'success' : 'error');
    
    if (this.errors.length > 0) {
      this.log('\n❌ Errors:', 'error');
      this.errors.forEach(error => this.log(`  - ${error}`, 'error'));
    }
    
    return passedChecks === checks.length;
  }

  async run() {
    this.log('🚀 Starting quality checks...', 'info');
    
    try {
      await this.checkLinting();
      await this.checkTypeScript();
      await this.runTests();
      await this.checkCoverage();
      await this.checkSecurity();
      await this.checkAccessibility();
      await this.checkPerformance();
      
      const success = this.generateReport();
      
      if (success) {
        this.log('\n🎉 All quality checks passed!', 'success');
        process.exit(0);
      } else {
        this.log('\n💥 Some quality checks failed!', 'error');
        process.exit(1);
      }
    } catch (error) {
      this.log(`💥 Quality check failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run quality checks if this script is executed directly
if (require.main === module) {
  const checker = new QualityChecker();
  checker.run();
}

module.exports = QualityChecker;