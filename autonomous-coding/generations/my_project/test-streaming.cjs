const puppeteer = require('puppeteer');

(async () => {
  console.log('Testing streaming visualization...');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    // Create new conversation by clicking the "+ New Chat" button
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('New Chat')) {
        await button.click();
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send a message requesting a long response
    await page.waitForSelector('textarea');
    await page.type('textarea', 'Write a detailed 200-word explanation about how photosynthesis works');
    await page.screenshot({ path: 'test-stream-1-typed.png' });

    await page.click('button[type="submit"]');
    await page.screenshot({ path: 'test-stream-2-sent.png' });

    console.log('Waiting to observe streaming...');

    // Take screenshots at intervals to capture streaming
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'test-stream-3-1sec.png', fullPage: true });

    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'test-stream-4-2sec.png', fullPage: true });

    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'test-stream-5-4sec.png', fullPage: true });

    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'test-stream-6-7sec.png', fullPage: true });

    console.log('✅ Test complete - check screenshots');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
