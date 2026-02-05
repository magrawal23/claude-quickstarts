const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function testSearchAPI() {
  console.log('Testing Search API Endpoints\n');
  console.log('=' .repeat(60));

  // Test 1: Search conversations
  console.log('\n✓ Test 1: Search conversations for "hello"');
  try {
    const result1 = await makeRequest('/api/search/conversations?q=hello');
    console.log(`Status: ${result1.status}`);
    console.log(`Results: ${result1.data.count} conversations found`);
    if (result1.data.results && result1.data.results.length > 0) {
      console.log('Sample result:', {
        id: result1.data.results[0].id,
        title: result1.data.results[0].title,
        message_count: result1.data.results[0].message_count
      });
    }
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 2: Search messages
  console.log('\n✓ Test 2: Search messages for "hello"');
  try {
    const result2 = await makeRequest('/api/search/messages?q=hello');
    console.log(`Status: ${result2.status}`);
    console.log(`Results: ${result2.data.count} messages found`);
    if (result2.data.results && result2.data.results.length > 0) {
      console.log('Sample result:', {
        id: result2.data.results[0].id,
        role: result2.data.results[0].role,
        conversation_title: result2.data.results[0].conversation_title,
        content_preview: result2.data.results[0].content.substring(0, 50) + '...'
      });
    }
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 3: Search all
  console.log('\n✓ Test 3: Search all for "SVG"');
  try {
    const result3 = await makeRequest('/api/search/all?q=SVG');
    console.log(`Status: ${result3.status}`);
    console.log(`Conversations: ${result3.data.conversations.count}`);
    console.log(`Messages: ${result3.data.messages.count}`);
    console.log(`Artifacts: ${result3.data.artifacts.count}`);
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 4: Error handling - missing query
  console.log('\n✓ Test 4: Error handling (missing query)');
  try {
    const result4 = await makeRequest('/api/search/conversations');
    console.log(`Status: ${result4.status}`);
    console.log(`Error message: ${result4.data.error}`);
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 5: Search with limit
  console.log('\n✓ Test 5: Search with limit=5');
  try {
    const result5 = await makeRequest('/api/search/conversations?q=e&limit=5');
    console.log(`Status: ${result5.status}`);
    console.log(`Results: ${result5.data.count} conversations (max 5)`);
  } catch (error) {
    console.log('Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All search API tests completed!');
}

testSearchAPI().catch(console.error);
