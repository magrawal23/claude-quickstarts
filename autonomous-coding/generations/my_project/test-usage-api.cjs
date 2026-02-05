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

async function testUsageAPI() {
  console.log('Testing Usage API Endpoints\n');
  console.log('=' .repeat(60));

  // Test 1: Daily usage
  console.log('\n✓ Test 1: GET /api/usage/daily');
  try {
    const result1 = await makeRequest('/api/usage/daily');
    console.log(`Status: ${result1.status}`);
    console.log(`Success: ${result1.data.success}`);
    if (result1.data.data) {
      console.log(`Days with data: ${result1.data.data.length}`);
      console.log('Totals:', {
        message_count: result1.data.totals.message_count,
        input_tokens: result1.data.totals.input_tokens,
        output_tokens: result1.data.totals.output_tokens,
        total_cost: result1.data.totals.total_cost?.toFixed(4)
      });
      if (result1.data.data.length > 0) {
        console.log('Sample day:', result1.data.data[0]);
      }
    }
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 2: Monthly usage
  console.log('\n✓ Test 2: GET /api/usage/monthly');
  try {
    const result2 = await makeRequest('/api/usage/monthly');
    console.log(`Status: ${result2.status}`);
    console.log(`Success: ${result2.data.success}`);
    if (result2.data.data) {
      console.log(`Months with data: ${result2.data.data.length}`);
      console.log('Totals:', {
        message_count: result2.data.totals.message_count,
        input_tokens: result2.data.totals.input_tokens,
        output_tokens: result2.data.totals.output_tokens,
        total_cost: result2.data.totals.total_cost?.toFixed(4)
      });
      if (result2.data.data.length > 0) {
        console.log('Sample month:', result2.data.data[0]);
      }
    }
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 3: By-model usage
  console.log('\n✓ Test 3: GET /api/usage/by-model');
  try {
    const result3 = await makeRequest('/api/usage/by-model');
    console.log(`Status: ${result3.status}`);
    console.log(`Success: ${result3.data.success}`);
    if (result3.data.data) {
      console.log(`Models: ${result3.data.data.length}`);
      console.log('Breakdown by model:');
      result3.data.data.forEach(model => {
        console.log(`  - ${model.model}: ${model.message_count} messages, ${model.input_tokens + model.output_tokens} tokens`);
      });
      console.log('Totals:', {
        message_count: result3.data.totals.message_count,
        total_tokens: result3.data.totals.input_tokens + result3.data.totals.output_tokens,
        total_cost: result3.data.totals.total_cost?.toFixed(4)
      });
    }
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 4: Usage with model filter
  console.log('\n✓ Test 4: GET /api/usage/daily?model=sonnet');
  try {
    const result4 = await makeRequest('/api/usage/daily?model=sonnet');
    console.log(`Status: ${result4.status}`);
    console.log(`Success: ${result4.data.success}`);
    if (result4.data.totals) {
      console.log('Sonnet usage totals:', {
        message_count: result4.data.totals.message_count,
        total_tokens: result4.data.totals.input_tokens + result4.data.totals.output_tokens
      });
    }
  } catch (error) {
    console.log('Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All usage API tests completed!');
}

testUsageAPI().catch(console.error);
