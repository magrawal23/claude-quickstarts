const http = require('http');

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testExpirationFeature() {
  console.log('=== Test #71: Shared conversation has expiration date ===\n');

  // Step 1: Get an existing conversation
  console.log('Step 1: Get existing conversation...');
  const convs = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/conversations',
    method: 'GET'
  });

  if (convs.data.length === 0) {
    console.log('❌ No conversations found');
    return;
  }

  const testConv = convs.data.find(c => c.title && c.title.includes('Quick Test Hello'));
  if (!testConv) {
    console.log('❌ Could not find test conversation');
    return;
  }

  console.log(`✅ Found conversation: ${testConv.title} (ID: ${testConv.id})\n`);

  // Step 2: Create share link with expiration (7 days from now)
  console.log('Step 2: Create share link with 7-day expiration...');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const createShare = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/conversations/${testConv.id}/share`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { expiresAt });

  if (createShare.status !== 200) {
    console.log(`❌ Failed to create share: ${createShare.status}`);
    console.log(createShare.data);
    return;
  }

  console.log(`✅ Share link created: ${createShare.data.url}`);
  console.log(`   Token: ${createShare.data.shareToken}`);
  console.log(`   Expires: ${new Date(createShare.data.expiresAt).toLocaleString()}\n`);

  // Step 3: Verify expiration is stored
  console.log('Step 3: Verify expiration stored in database...');
  const shareInfo = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/conversations/${testConv.id}/share`,
    method: 'GET'
  });

  if (!shareInfo.data.expiresAt) {
    console.log('❌ Expiration date not stored');
    return;
  }

  console.log(`✅ Expiration date stored: ${new Date(shareInfo.data.expiresAt).toLocaleString()}\n`);

  // Step 4: Access the shared link (should work - not expired)
  console.log('Step 4: Access shared link (should work)...');
  const accessShare = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/shared/${createShare.data.shareToken}`,
    method: 'GET'
  });

  if (accessShare.status !== 200) {
    console.log(`❌ Failed to access share: ${accessShare.status}`);
    return;
  }

  console.log(`✅ Successfully accessed shared conversation`);
  console.log(`   Title: ${accessShare.data.conversation.title}`);
  console.log(`   Messages: ${accessShare.data.messages.length}`);
  console.log(`   Views: ${accessShare.data.share.viewCount}\n`);

  // Step 5: Test with expired date
  console.log('Step 5: Create share with past expiration date...');

  // First, delete the existing share
  const deleteResult = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/conversations/${testConv.id}/share`,
    method: 'DELETE'
  });
  console.log(`   Deleted existing share (status: ${deleteResult.status})`);

  // Create new share with past expiration
  const pastDate = new Date(Date.now() - 1000).toISOString(); // 1 second ago
  const expiredShare = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/conversations/${testConv.id}/share`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { expiresAt: pastDate });

  console.log(`   Created share with expired date: ${new Date(pastDate).toLocaleString()}`);

  // Step 6: Try to access expired link
  console.log('\nStep 6: Try to access expired link...');
  const accessExpired = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/shared/${expiredShare.data.shareToken}`,
    method: 'GET'
  });

  if (accessExpired.status === 410) {
    console.log(`✅ Correctly blocked with status 410 (Gone)`);
    console.log(`   Error message: ${accessExpired.data.error}`);
  } else {
    console.log(`❌ Should have returned 410, got ${accessExpired.status}`);
    return;
  }

  console.log('\n=== ✅ All Test #71 Steps Passed! ===');
  console.log('✅ Share link can be created with expiration date');
  console.log('✅ Expiration date is stored in database');
  console.log('✅ Non-expired links work correctly');
  console.log('✅ Expired links return 410 status with error message');
}

testExpirationFeature().catch(console.error);
