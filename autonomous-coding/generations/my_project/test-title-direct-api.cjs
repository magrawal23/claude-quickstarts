const http = require('http');

function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3004,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
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

function streamRequest(path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3004,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const events = [];

    const req = http.request(options, (res) => {
      let buffer = '';

      res.on('data', chunk => {
        buffer += chunk.toString();
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              events.push(data);
              console.log(`  [Event] ${data.type}`);
              if (data.type === 'title_updated') {
                console.log(`  [Title] ${data.conversation.title}`);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      });

      res.on('end', () => {
        resolve(events);
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== TESTING TITLE GENERATION (Direct API) ===\n');

  try {
    // Step 1: Create a new conversation
    console.log('1. Creating new conversation...');
    const conversation = await apiRequest('POST', '/api/conversations', {
      title: 'New Conversation'
    });
    console.log(`   ✅ Created conversation ID: ${conversation.id}`);
    console.log(`   Initial title: "${conversation.title}"\n`);

    // Step 2: Send first message (should trigger title generation)
    console.log('2. Sending first message...');
    console.log('   Message: "Explain quantum entanglement in simple terms"\n');

    const events = await streamRequest(
      `/api/conversations/${conversation.id}/messages/stream`,
      { content: 'Explain quantum entanglement in simple terms' }
    );

    console.log(`\n   ✅ Received ${events.length} events\n`);

    // Step 3: Check if title was updated
    const titleEvent = events.find(e => e.type === 'title_updated');

    if (titleEvent) {
      console.log('✅ SUCCESS! Title was auto-generated!');
      console.log(`   New title: "${titleEvent.conversation.title}"\n`);

      // Verify it's different from "New Conversation"
      if (titleEvent.conversation.title !== 'New Conversation') {
        console.log('✅ Title is different from default\n');
      } else {
        console.log('❌ Title is still "New Conversation"\n');
      }
    } else {
      console.log('❌ FAILED: No title_updated event received');
      console.log('   Events received:', events.map(e => e.type).join(', '));
      console.log('\n');
    }

    // Step 4: Verify via API
    console.log('3. Verifying via GET API...');
    const updatedConv = await apiRequest('GET', `/api/conversations/${conversation.id}`);
    console.log(`   Current title: "${updatedConv.title}"`);

    if (updatedConv.title !== 'New Conversation' && updatedConv.title !== conversation.title) {
      console.log('   ✅ Title was persisted to database\n');
    } else {
      console.log('   ❌ Title was not updated in database\n');
    }

    console.log('=== TEST COMPLETE ===');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error(error);
  }
}

main();
