const fetch = require('node-fetch');

async function testShareRevoke() {
  const baseUrl = 'http://localhost:3000';

  console.log('=== Test #72: User can revoke shared conversation link ===\n');

  try {
    // Step 1: Create a new conversation for testing
    console.log('Step 1: Creating test conversation...');
    const createConvRes = await fetch(`${baseUrl}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Share Revoke Test',
        userId: 1,
        model: 'claude-sonnet-4-5-20250929'
      })
    });
    const conversation = await createConvRes.json();
    console.log(`✓ Created conversation ID: ${conversation.id}`);

    // Step 2: Create a share link
    console.log('\nStep 2: Creating share link...');
    const createShareRes = await fetch(`${baseUrl}/api/conversations/${conversation.id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const shareData = await createShareRes.json();
    console.log(`✓ Share link created: ${shareData.url}`);
    console.log(`  Token: ${shareData.shareToken}`);
    console.log(`  Created: ${shareData.createdAt}`);

    // Step 3: Verify share link works
    console.log('\nStep 3: Verifying share link works...');
    const accessShareRes = await fetch(`${baseUrl}/api/shared/${shareData.shareToken}`);
    if (accessShareRes.ok) {
      const sharedData = await accessShareRes.json();
      console.log(`✓ Share link accessible (Status: ${accessShareRes.status})`);
      console.log(`  Conversation: ${sharedData.conversation.title}`);
      console.log(`  View count: ${sharedData.share.viewCount}`);
    } else {
      console.log(`✗ Share link not accessible (Status: ${accessShareRes.status})`);
      return false;
    }

    // Step 4: Revoke the share link
    console.log('\nStep 4: Revoking share link...');
    const revokeRes = await fetch(`${baseUrl}/api/conversations/${conversation.id}/share`, {
      method: 'DELETE'
    });
    if (revokeRes.ok) {
      const revokeData = await revokeRes.json();
      console.log(`✓ Share link revoked (Status: ${revokeRes.status})`);
      console.log(`  Message: ${revokeData.message}`);
    } else {
      console.log(`✗ Failed to revoke share link (Status: ${revokeRes.status})`);
      return false;
    }

    // Step 5: Verify share link no longer works
    console.log('\nStep 5: Verifying share link is revoked...');
    const accessRevokedRes = await fetch(`${baseUrl}/api/shared/${shareData.shareToken}`);
    if (accessRevokedRes.status === 404) {
      const errorData = await accessRevokedRes.json();
      console.log(`✓ Share link no longer accessible (Status: ${accessRevokedRes.status})`);
      console.log(`  Error: ${errorData.error}`);
    } else if (accessRevokedRes.ok) {
      console.log(`✗ Share link still accessible! Revoke failed.`);
      return false;
    }

    // Step 6: Verify share status shows not shared
    console.log('\nStep 6: Verifying share status...');
    const statusRes = await fetch(`${baseUrl}/api/conversations/${conversation.id}/share`);
    const statusData = await statusRes.json();
    if (statusData.shared === false) {
      console.log(`✓ Share status correctly shows: shared = false`);
    } else {
      console.log(`✗ Share status incorrect: shared = ${statusData.shared}`);
      return false;
    }

    console.log('\n=== All tests passed! ✅ ===');
    console.log('\nTest #72 Summary:');
    console.log('✓ Share link created successfully');
    console.log('✓ Share link accessible before revocation');
    console.log('✓ Share link revoked via DELETE API');
    console.log('✓ Share link returns 404 after revocation');
    console.log('✓ Share status correctly updated');

    return true;
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    return false;
  }
}

testShareRevoke().then(success => {
  process.exit(success ? 0 : 1);
});
