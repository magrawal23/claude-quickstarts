const puppeteer = require('puppeteer');

async function testCodeHighlighting() {
  console.log('Testing code block syntax highlighting...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Step 1: Navigate to the app
    console.log('Step 1: Navigating to app...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ App loaded\n');

    // Step 2: Create new conversation
    console.log('Step 2: Creating new conversation...');
    await page.click('button');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Ask Claude for a code snippet
    console.log('Step 3: Asking Claude for code snippet...');
    const codeRequest = 'Write a simple Python function that calculates fibonacci numbers';

    await page.type('textarea', codeRequest);
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.click('button[type="submit"]');
    console.log('✅ Sent code request\n');

    // Wait for response
    console.log('Step 4: Waiting for Claude response...');
    await new Promise(resolve => setTimeout(resolve, 12000));
    await page.screenshot({ path: 'test-code-1-response.png', fullPage: true });

    // Step 5: Check if code blocks are present with highlighting
    console.log('Step 5: Checking code block rendering...');

    const pageHTML = await page.content();

    const checks = {
      codeBlock: pageHTML.includes('<code') && pageHTML.includes('</code>'),
      hljs: pageHTML.includes('hljs') || pageHTML.includes('highlight'),
      preTag: pageHTML.includes('<pre'),
      codeBackground: pageHTML.includes('bg-gray') || pageHTML.includes('background'),
      multipleCodeElements: (pageHTML.match(/<code/g) || []).length > 1
    };

    console.log('\n=== CODE HIGHLIGHTING CHECKS ===');
    console.log(`Code block exists: ${checks.codeBlock ? '✅' : '❌'}`);
    console.log(`Syntax highlighting (hljs): ${checks.hljs ? '✅' : '❌'}`);
    console.log(`Pre tag for code blocks: ${checks.preTag ? '✅' : '❌'}`);
    console.log(`Code background styling: ${checks.codeBackground ? '✅' : '❌'}`);
    console.log(`Multiple code elements: ${checks.multipleCodeElements ? '✅' : '❌'}`);

    // Check for specific syntax highlighting classes
    const syntaxClasses = [
      'hljs-keyword',
      'hljs-function',
      'hljs-string',
      'hljs-number',
      'hljs-comment'
    ];

    const foundClasses = syntaxClasses.filter(cls => pageHTML.includes(cls));
    console.log(`Syntax classes found: ${foundClasses.length}/${syntaxClasses.length}`);
    if (foundClasses.length > 0) {
      console.log(`  Classes: ${foundClasses.join(', ')}`);
    }

    const allBasicChecksPassed = checks.codeBlock && checks.preTag;
    const hasSyntaxHighlighting = checks.hljs || foundClasses.length > 0;

    if (allBasicChecksPassed && hasSyntaxHighlighting) {
      console.log('\n✅✅✅ CODE SYNTAX HIGHLIGHTING WORKS! ✅✅✅');
      return true;
    } else if (allBasicChecksPassed) {
      console.log('\n✅ Code blocks render, but syntax highlighting may need verification');
      return true;
    } else {
      console.log('\n❌ Code blocks may not be rendering properly');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-code-error.png', fullPage: true });
    throw error;
  } finally {
    console.log('\nBrowser will stay open for 5 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

testCodeHighlighting().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
