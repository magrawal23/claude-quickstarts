const puppeteer = require('puppeteer');

(async () => {
  console.log('=== TESTING AUTO-GENERATED TITLES ===\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 900 },
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Load the app
    console.log('1. Loading app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });
    await page.screenshot({ path: 'test-title-1-loaded.png', fullPage: true });
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
    await page.screenshot({ path: 'test-title-2-new-conv.png', fullPage: true });
    console.log('   ✅ New conversation created\n');

    // Send a specific message that should generate a unique title
    console.log('3. Sending message about quantum computing...');
    await page.waitForSelector('textarea', { timeout: 5000 });
    await page.type('textarea', 'Explain quantum entanglement in simple terms');
    await page.screenshot({ path: 'test-title-3-typed.png' });

    await page.click('button[type="submit"]');
    await page.screenshot({ path: 'test-title-4-sent.png' });
    console.log('   ✅ Message sent\n');

    // Wait for response and title generation
    console.log('4. Waiting for response and title generation...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    await page.screenshot({ path: 'test-title-5-response.png', fullPage: true });
    console.log('   ✅ Response received\n');

    // Check if title was generated
    console.log('5. Checking sidebar for generated title...');
    const sidebarText = await page.evaluate(() => {
      const sidebar = document.querySelector('aside') || document.querySelector('[role="complementary"]');
      return sidebar ? sidebar.innerText : 'No sidebar found';
    });

    console.log('   Sidebar content:');
    console.log('   ' + sidebarText.split('\n').slice(0, 10).join('\n   '));

    if (sidebarText.includes('Quantum') || sidebarText.includes('quantum') || sidebarText.includes('Entanglement')) {
      console.log('\n   ✅ SUCCESS! Title was auto-generated!\n');
    } else if (sidebarText.includes('New Conversation')) {
      console.log('\n   ❌ FAILED: Title is still "New Conversation"\n');
    } else {
      console.log('\n   ⚠️  Could not determine title status\n');
    }

    await page.screenshot({ path: 'test-title-6-final.png', fullPage: true });

    console.log('=== TEST COMPLETE ===');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    const page = (await browser.pages())[0];
    if (page) {
      await page.screenshot({ path: 'test-title-error.png', fullPage: true });
    }
  } finally {
    await browser.close();
  }
})();
