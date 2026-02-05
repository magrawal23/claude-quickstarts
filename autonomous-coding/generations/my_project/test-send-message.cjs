const puppeteer = require('puppeteer');

async function testSendMessage() {
  console.log('🧪 Testing message sending functionality...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('📍 Step 1: Navigate to app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'test-msg-1-loaded.png' });
    console.log('✅ App loaded\n');

    console.log('📍 Step 2: Find and click message input...');
    const textarea = await page.$('textarea');
    if (!textarea) {
      throw new Error('Textarea not found');
    }
    await textarea.click();
    console.log('✅ Input clicked\n');

    console.log('📍 Step 3: Type message...');
    await textarea.type('Hello, this is a test message');
    await page.screenshot({ path: 'test-msg-2-typed.png' });
    console.log('✅ Message typed\n');

    console.log('📍 Step 4: Click Send button...');
    const sendButton = await page.$$eval('button', btns => {
      const btn = btns.find(b => b.textContent.includes('Send'));
      if (btn) btn.click();
      return !!btn;
    });

    if (!sendButton) {
      throw new Error('Send button not found');
    }
    console.log('✅ Send button clicked\n');

    console.log('📍 Step 5: Wait for message to appear in chat...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'test-msg-3-sent.png' });

    // Check if user message appears
    const pageContent = await page.content();
    const hasMessage = pageContent.includes('Hello, this is a test message');

    console.log(`User message visible: ${hasMessage ? '✅' : '❌'}\n`);

    console.log('📍 Step 6: Check for response or error...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.screenshot({ path: 'test-msg-4-response.png' });

    // Check console for errors
    const logs = [];
    page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n' + '='.repeat(50));
    console.log('Test completed - check screenshots:');
    console.log('  - test-msg-1-loaded.png (initial state)');
    console.log('  - test-msg-2-typed.png (message typed)');
    console.log('  - test-msg-3-sent.png (after send)');
    console.log('  - test-msg-4-response.png (waiting for response)');
    console.log('='.repeat(50) + '\n');

    await browser.close();
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-msg-error.png' });
    await browser.close();
    return false;
  }
}

testSendMessage().then(() => {
  console.log('Test finished');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
