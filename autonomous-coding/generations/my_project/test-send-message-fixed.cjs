const puppeteer = require('puppeteer');

async function testSendMessage() {
  console.log('🧪 Testing message sending with FIXED backend...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Capture console logs
    const logs = [];
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
      console.log(`Browser: [${msg.type()}] ${msg.text()}`);
    });

    console.log('📍 Step 1: Navigate to app on port 5174...');
    try {
      await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 10000 });
    } catch (e) {
      console.log('Timeout on networkidle0, continuing anyway...');
      await page.goto('http://localhost:5174', { waitUntil: 'load' });
    }
    await page.screenshot({ path: 'test-fixed-1-loaded.png' });
    console.log('✅ App loaded\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📍 Step 2: Type and send message...');
    await page.type('textarea', 'Hello! This is a test with the fixed backend.');
    await page.screenshot({ path: 'test-fixed-2-typed.png' });
    console.log('✅ Message typed\n');

    console.log('📍 Step 3: Click Send button...');
    await page.click('button[type="submit"]');
    await page.screenshot({ path: 'test-fixed-3-clicked.png' });
    console.log('✅ Send clicked\n');

    console.log('📍 Step 4: Wait for message to appear...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'test-fixed-4-after-send.png', fullPage: true });

    // Check page content
    const content = await page.content();
    const hasMessage = content.includes('Hello! This is a test');

    console.log(`\nUser message in page: ${hasMessage ? '✅ YES' : '❌ NO'}`);

    console.log('\n📍 Step 5: Wait for response (if API key configured)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.screenshot({ path: 'test-fixed-5-response.png', fullPage: true });

    console.log('\n' + '='.repeat(50));
    console.log('Test completed - check screenshots:');
    console.log('  - test-fixed-1-loaded.png');
    console.log('  - test-fixed-2-typed.png');
    console.log('  - test-fixed-3-clicked.png');
    console.log('  - test-fixed-4-after-send.png');
    console.log('  - test-fixed-5-response.png');
    console.log('='.repeat(50));

    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-fixed-error.png' });
    await browser.close();
    return false;
  }
}

testSendMessage().then(() => {
  console.log('\nTest finished');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
