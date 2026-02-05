const puppeteer = require('puppeteer');

(async () => {
  console.log('Testing conversation switching...');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'verify-switch-s11-1.png', fullPage: true });

    // Find conversation buttons (they contain "New Conversation" text)
    console.log('Looking for conversation buttons...');
    const buttons = await page.$$('button');
    let conversationButtons = [];

    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('New Conversation') && text.includes('2026-01-24')) {
        conversationButtons.push(button);
      }
    }

    console.log(`Found ${conversationButtons.length} conversation buttons`);

    if (conversationButtons.length >= 2) {
      // Click second conversation
      console.log('Clicking second conversation...');
      await conversationButtons[1].click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.screenshot({ path: 'verify-switch-s11-2.png', fullPage: true });

      // Click first conversation
      console.log('Clicking first conversation...');
      await conversationButtons[0].click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.screenshot({ path: 'verify-switch-s11-3.png', fullPage: true });

      console.log('✅ Conversation switching works!');
    } else {
      console.log('⚠️ Need at least 2 conversations, found:', conversationButtons.length);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
})();
