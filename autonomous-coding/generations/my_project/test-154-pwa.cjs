// Test #154: Progressive Web App can be installed
const fetch = require('node-fetch');

async function testPWA() {
  console.log('=== Test #154: Progressive Web App Installation ===\n');

  let passed = true;

  // Step 3: Check manifest.json exists and is valid
  console.log('Step 3: Checking manifest.json...');
  try {
    const manifestResponse = await fetch('http://localhost:5173/manifest.json');

    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      console.log('✅ manifest.json exists and is accessible');

      // Validate required fields
      const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
      const missingFields = requiredFields.filter(field => !manifest[field]);

      if (missingFields.length === 0) {
        console.log('✅ manifest.json has all required fields');
        console.log(`   - name: ${manifest.name}`);
        console.log(`   - short_name: ${manifest.short_name}`);
        console.log(`   - display: ${manifest.display}`);
        console.log(`   - icons: ${manifest.icons.length} icon(s)`);
      } else {
        console.log(`❌ manifest.json missing fields: ${missingFields.join(', ')}`);
        passed = false;
      }

      // Check icons
      if (manifest.icons && manifest.icons.length >= 2) {
        const has192 = manifest.icons.some(icon => icon.sizes === '192x192');
        const has512 = manifest.icons.some(icon => icon.sizes === '512x512');

        if (has192 && has512) {
          console.log('✅ manifest.json has required icon sizes (192x192 and 512x512)');
        } else {
          console.log('❌ manifest.json missing required icon sizes');
          passed = false;
        }
      } else {
        console.log('❌ manifest.json has insufficient icons');
        passed = false;
      }
    } else {
      console.log(`❌ manifest.json not accessible (status: ${manifestResponse.status})`);
      passed = false;
    }
  } catch (error) {
    console.log(`❌ Error checking manifest.json: ${error.message}`);
    passed = false;
  }

  console.log();

  // Step 4: Verify service worker exists
  console.log('Step 4: Checking service worker...');
  try {
    const swResponse = await fetch('http://localhost:5173/service-worker.js');

    if (swResponse.ok) {
      const swContent = await swResponse.text();
      console.log('✅ service-worker.js exists and is accessible');

      // Check for key service worker features
      const hasInstallEvent = swContent.includes('addEventListener(\'install\'');
      const hasActivateEvent = swContent.includes('addEventListener(\'activate\'');
      const hasFetchEvent = swContent.includes('addEventListener(\'fetch\'');

      if (hasInstallEvent && hasActivateEvent && hasFetchEvent) {
        console.log('✅ service-worker.js has required event listeners');
        console.log('   - install event: ✓');
        console.log('   - activate event: ✓');
        console.log('   - fetch event: ✓');
      } else {
        console.log('❌ service-worker.js missing required event listeners');
        passed = false;
      }
    } else {
      console.log(`❌ service-worker.js not accessible (status: ${swResponse.status})`);
      passed = false;
    }
  } catch (error) {
    console.log(`❌ Error checking service-worker.js: ${error.message}`);
    passed = false;
  }

  console.log();

  // Check icon files exist
  console.log('Checking icon files...');
  try {
    const icon192Response = await fetch('http://localhost:5173/icon-192.png');
    const icon512Response = await fetch('http://localhost:5173/icon-512.png');

    if (icon192Response.ok && icon512Response.ok) {
      console.log('✅ Icon files (192x192 and 512x512) are accessible');
    } else {
      console.log('❌ One or more icon files are not accessible');
      passed = false;
    }
  } catch (error) {
    console.log(`❌ Error checking icon files: ${error.message}`);
    passed = false;
  }

  console.log();

  // Summary
  console.log('=== Test Summary ===');
  if (passed) {
    console.log('✅ ALL PWA REQUIREMENTS PASSED');
    console.log('\nPWA Installation Requirements Met:');
    console.log('1. Valid manifest.json with required fields ✓');
    console.log('2. Service worker with install, activate, and fetch events ✓');
    console.log('3. Required icon sizes (192x192, 512x512) ✓');
    console.log('4. HTTPS or localhost (localhost) ✓');
    console.log('\nThe app can now be installed as a PWA!');
    console.log('To test installation:');
    console.log('- Chrome: Look for install button in address bar');
    console.log('- Chrome DevTools: Application > Manifest');
    console.log('- Mobile: "Add to Home Screen" option in browser menu');
  } else {
    console.log('❌ SOME PWA REQUIREMENTS FAILED');
    console.log('Please fix the issues above before the app can be installed as a PWA.');
  }

  return passed;
}

testPWA().then(passed => {
  process.exit(passed ? 0 : 1);
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
