const puppeteer = require('puppeteer');
const fs = require('fs');

async function runVerification() {
  console.log('🔍 Starting verification test...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('📍 Step 1: Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 10000 });

    console.log('✅ Page loaded successfully\n');

    // Take screenshot
    await page.screenshot({ path: 'verification-test-1.png', fullPage: true });
    console.log('📸 Screenshot saved: verification-test-1.png\n');

    // Check for key UI elements
    console.log('🔍 Checking for UI elements...');

    const checks = {
      sidebar: await page.$('.sidebar, [class*="sidebar"]') !== null,
      newChatButton: await page.$$eval('button', btns => btns.some(b => b.textContent.includes('New'))).catch(() => false),
      chatArea: await page.$('.chat-area, [class*="chat"]') !== null,
      messageInput: await page.$('textarea, input[type="text"]') !== null,
      sendButton: await page.$$eval('button', btns => btns.some(b => b.textContent.includes('Send') || b.type === 'submit')).catch(() => false)
    };

    console.log('\nUI Elements Check:');
    console.log(`  Sidebar: ${checks.sidebar ? '✅' : '❌'}`);
    console.log(`  New Chat Button: ${checks.newChatButton ? '✅' : '❌'}`);
    console.log(`  Chat Area: ${checks.chatArea ? '✅' : '❌'}`);
    console.log(`  Message Input: ${checks.messageInput ? '✅' : '❌'}`);
    console.log(`  Send Button: ${checks.sendButton ? '✅' : '❌'}`);

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    if (errors.length > 0) {
      console.log('\n⚠️  Console Errors:');
      errors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('\n✅ No console errors detected');
    }

    const allPassed = Object.values(checks).every(v => v) && errors.length === 0;

    console.log('\n' + '='.repeat(50));
    if (allPassed) {
      console.log('✅ VERIFICATION PASSED - Frontend is working correctly');
    } else {
      console.log('⚠️  VERIFICATION ISSUES DETECTED - See details above');
    }
    console.log('='.repeat(50) + '\n');

    await browser.close();
    return allPassed;

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    await browser.close();
    return false;
  }
}

runVerification().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
