#!/usr/bin/env node

/**
 * Automated Screenshot Script for Agentic Learning Coach
 * 
 * This script uses Playwright to automatically navigate through the application
 * and capture screenshots of all major pages and components.
 * 
 * Usage:
 *   npm install playwright
 *   node scripts/take-screenshots.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = 'screenshots';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function takeScreenshots() {
  console.log('🚀 Starting automated screenshot capture...');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 1000 // Slow down for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // 1. Landing/Dashboard Page
    console.log('📸 Capturing Dashboard...');
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '01-dashboard.png'),
      fullPage: true 
    });
    
    // 2. Onboarding Flow
    console.log('📸 Capturing Onboarding...');
    await page.goto(`${FRONTEND_URL}/onboarding`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '02-onboarding.png'),
      fullPage: true 
    });
    
    // 3. Learning Path
    console.log('📸 Capturing Learning Path...');
    await page.goto(`${FRONTEND_URL}/learning-path`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '03-learning-path.png'),
      fullPage: true 
    });
    
    // 4. Exercises Page
    console.log('📸 Capturing Exercises...');
    await page.goto(`${FRONTEND_URL}/exercises`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '04-exercises.png'),
      fullPage: true 
    });
    
    // 5. Settings Page
    console.log('📸 Capturing Settings...');
    await page.goto(`${FRONTEND_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '05-settings.png'),
      fullPage: true 
    });
    
    // 6. Social/Collaboration Page
    console.log('📸 Capturing Social Features...');
    await page.goto(`${FRONTEND_URL}/social`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '06-social.png'),
      fullPage: true 
    });
    
    // 7. Gamification/Achievements
    console.log('📸 Capturing Achievements...');
    await page.goto(`${FRONTEND_URL}/achievements`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '07-achievements.png'),
      fullPage: true 
    });
    
    // 8. Leaderboard
    console.log('📸 Capturing Leaderboard...');
    await page.goto(`${FRONTEND_URL}/leaderboard`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '08-leaderboard.png'),
      fullPage: true 
    });
    
    // 9. Tasks Management
    console.log('📸 Capturing Tasks...');
    await page.goto(`${FRONTEND_URL}/tasks`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '09-tasks.png'),
      fullPage: true 
    });
    
    // 10. Dashboard - Different Views
    console.log('📸 Capturing Dashboard Analytics View...');
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    
    // Click on Analytics tab if available
    try {
      await page.click('button:has-text("Analytics")');
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, '10-dashboard-analytics.png'),
        fullPage: true 
      });
    } catch (e) {
      console.log('Analytics tab not found, skipping...');
    }
    
    // 11. Dashboard - Tasks View
    console.log('📸 Capturing Dashboard Tasks View...');
    try {
      await page.click('button:has-text("Tasks")');
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, '11-dashboard-tasks.png'),
        fullPage: true 
      });
    } catch (e) {
      console.log('Tasks tab not found, skipping...');
    }
    
    // 12. Mobile View (responsive)
    console.log('📸 Capturing Mobile View...');
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '12-mobile-dashboard.png'),
      fullPage: true 
    });
    
    console.log('✅ Screenshot capture completed!');
    console.log(`📁 Screenshots saved to: ${path.resolve(SCREENSHOTS_DIR)}`);
    
  } catch (error) {
    console.error('❌ Error during screenshot capture:', error);
  } finally {
    await browser.close();
  }
}

// Run the screenshot capture
takeScreenshots().catch(console.error);