import { initializeDatabase, prepare } from './server/database.js';

async function test() {
  console.log('Initializing database...');
  await initializeDatabase();

  console.log('\n1. Testing INSERT (run):');
  const result = prepare(`
    INSERT INTO conversations (title, model, project_id, user_id)
    VALUES (?, ?, ?, 1)
  `).run('Direct Test Conversation', 'claude-sonnet-4-20250514', null);

  console.log('Insert result:', result);
  console.log('Last Insert Rowid:', result.lastInsertRowid);

  console.log('\n2. Testing SELECT (get) with the inserted ID:');
  const conversation = prepare(`
    SELECT * FROM conversations WHERE id = ?
  `).get(result.lastInsertRowid);

  console.log('Retrieved conversation:', conversation);

  if (!conversation) {
    console.log('\n❌ BUG CONFIRMED: Cannot retrieve conversation after insert!');

    console.log('\n3. Testing fallback - get latest conversation:');
    const latest = prepare(`
      SELECT * FROM conversations ORDER BY id DESC LIMIT 1
    `).get();
    console.log('Latest conversation:', latest);
  } else {
    console.log('\n✅ Database operations working correctly!');
  }
}

test().catch(console.error);
