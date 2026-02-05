const puppeteer = require('puppeteer');

async function testMarkdownRendering() {
  console.log('Testing markdown rendering functionality...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Step 1: Navigate to the app
    console.log('Step 1: Navigating to app...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ App loaded\n');

    // Step 2: Create new conversation
    console.log('Step 2: Creating new conversation...');
    await page.click('button'); // Click New Chat
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Ask Claude to format response with markdown
    console.log('Step 3: Asking Claude to format with markdown...');
    const markdownRequest = `Please respond with markdown formatting including:
- **Bold text**
- *Italic text*
- A numbered list
- A bullet list
- A link to https://example.com
- A code snippet`;

    await page.type('textarea', markdownRequest);
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.click('button[type="submit"]');
    console.log('✅ Sent markdown request\n');

    // Wait for response
    console.log('Step 4: Waiting for Claude response...');
    await new Promise(resolve => setTimeout(resolve, 12000));
    await page.screenshot({ path: 'test-markdown-1-response.png', fullPage: true });

    // Step 5: Check if markdown is rendered
    console.log('Step 5: Checking markdown rendering...');

    const pageHTML = await page.content();

    // Check for markdown elements
    const checks = {
      bold: pageHTML.includes('<strong>') || pageHTML.includes('font-weight: bold') || pageHTML.includes('font-weight:700'),
      italic: pageHTML.includes('<em>') || pageHTML.includes('font-style: italic'),
      lists: pageHTML.includes('<ul>') || pageHTML.includes('<ol>') || pageHTML.includes('<li>'),
      links: pageHTML.includes('<a ') && pageHTML.includes('href='),
      code: pageHTML.includes('<code>') || pageHTML.includes('class="hljs"'),
      prose: pageHTML.includes('prose') // Tailwind prose class for markdown
    };

    console.log('\n=== MARKDOWN RENDERING CHECKS ===');
    console.log(`Bold text: ${checks.bold ? '✅' : '❌'}`);
    console.log(`Italic text: ${checks.italic ? '✅' : '❌'}`);
    console.log(`Lists: ${checks.lists ? '✅' : '❌'}`);
    console.log(`Links: ${checks.links ? '✅' : '❌'}`);
    console.log(`Code blocks: ${checks.code ? '✅' : '❌'}`);
    console.log(`Prose styling: ${checks.prose ? '✅' : '❌'}`);

    const allPassed = Object.values(checks).every(v => v);

    if (allPassed) {
      console.log('\n✅✅✅ MARKDOWN RENDERING WORKS! ✅✅✅');
    } else {
      console.log('\n⚠️  Some markdown features may not be rendering');
    }

    // Visual inspection
    console.log('\n=== VISUAL INSPECTION ===');
    console.log('Screenshot saved: test-markdown-1-response.png');
    console.log('Please visually verify:');
    console.log('  - Bold text appears heavier/darker');
    console.log('  - Italic text is slanted');
    console.log('  - Lists are properly formatted with bullets/numbers');
    console.log('  - Links are blue and underlined');
    console.log('  - Code has a gray background');

    return allPassed;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-markdown-error.png', fullPage: true });
    throw error;
  } finally {
    console.log('\nBrowser will stay open for 5 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

testMarkdownRendering().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
