const puppeteer = require('puppeteer');

(async () => {
  console.log('=== TESTING AUTO-GENERATED TITLES (UI) ===\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 1000 },
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Load the app
    console.log('1. Loading app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });
    await page.screenshot({ path: 'test-title-ui-1-loaded.png', fullPage: true });
    console.log('   ✅ App loaded\n');

    // Create a new conversation
    console.log('2. Creating new conversation...');
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('New') && (text.includes('Chat') || text.includes('Conversation'))) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'test-title-ui-2-new-conv.png', fullPage: true });
    console.log('   ✅ New conversation created\n');

    // Check initial sidebar state
    let sidebarText = await page.evaluate(() => {
      const sidebar = document.querySelector('aside') || document.querySelector('[class*="sidebar"]');
      return sidebar ? sidebar.innerText : 'No sidebar';
    });
    console.log('   Sidebar shows:', sidebarText.split('\n')[2] || 'Could not find conversation title');

    // Send a specific message
    console.log('\n3. Sending message about machine learning...');
    await page.waitForSelector('textarea', { timeout: 5000 });
    await page.type('textarea', 'Explain how neural networks learn from data');
    await page.screenshot({ path: 'test-title-ui-3-typed.png' });

    await page.click('button[type="submit"]');
    await page.screenshot({ path: 'test-title-ui-4-sent.png' });
    console.log('   ✅ Message sent\n');

    // Wait for response and title generation
    console.log('4. Waiting for response and title generation...');
    console.log('   This may take 10-15 seconds...\n');

    // Wait for Claude's response to complete
    await new Promise(resolve => setTimeout(resolve, 10000));
    await page.screenshot({ path: 'test-title-ui-5-response.png', fullPage: true });

    // Check if title was updated in sidebar
    sidebarText = await page.evaluate(() => {
      const sidebar = document.querySelector('aside') || document.querySelector('[class*="sidebar"]');
      return sidebar ? sidebar.innerText : 'No sidebar';
    });

    console.log('5. Checking sidebar for generated title...\n');
    const sidebarLines = sidebarText.split('\n');
    const conversationLine = sidebarLines.find(line =>
      line && line !== 'New Chat' && line !== 'Search conversations...' && !line.includes('Dark Mode')
    );

    console.log('   Sidebar content (first 10 lines):');
    sidebarLines.slice(0, 10).forEach((line, i) => {
      console.log(`   ${i + 1}. ${line}`);
    });
    console.log('');

    if (conversationLine && conversationLine !== 'New Conversation') {
      console.log(`✅ SUCCESS! Title was auto-generated to: "${conversationLine}"\n`);
    } else if (conversationLine === 'New Conversation') {
      console.log(`❌ FAILED: Title is still "New Conversation"\n`);
    } else {
      console.log(`⚠️  Could not determine title (found: "${conversationLine}")\n`);
    }

    await page.screenshot({ path: 'test-title-ui-6-final.png', fullPage: true });

    console.log('=== TEST COMPLETE ===\n');
    console.log('Screenshots saved:');
    console.log('  - test-title-ui-1-loaded.png');
    console.log('  - test-title-ui-2-new-conv.png');
    console.log('  - test-title-ui-3-typed.png');
    console.log('  - test-title-ui-4-sent.png');
    console.log('  - test-title-ui-5-response.png');
    console.log('  - test-title-ui-6-final.png');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    const page = (await browser.pages())[0];
    if (page) {
      await page.screenshot({ path: 'test-title-ui-error.png', fullPage: true });
    }
  } finally {
    await browser.close();
  }
})();
