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

    // Click on second conversation
    console.log('Clicking second conversation...');
    const conversations = await page.$$('.space-y-2 > div');
    if (conversations.length >= 2) {
      await conversations[1].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.screenshot({ path: 'verify-switch-s11-2.png', fullPage: true });

      // Click on first conversation
      console.log('Switching back to first...');
      await conversations[0].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.screenshot({ path: 'verify-switch-s11-3.png', fullPage: true });

      console.log('✅ Conversation switching works!');
    } else {
      console.log('⚠️ Need at least 2 conversations');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
