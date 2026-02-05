// Direct test of the database functions
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function testDatabase() {
  console.log('Testing database operations...\n');

  const dbPath = path.join(__dirname, 'server', 'database.db');

  // Load database
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  console.log('Step 1: Check current conversations');
  const before = db.exec('SELECT * FROM conversations');
  console.log('Conversations before:', before[0]?.values?.length || 0);

  console.log('\nStep 2: Insert new conversation');
  const sql = 'INSERT INTO conversations (title, model, project_id, user_id) VALUES (?, ?, ?, 1)';
  const stmt = db.prepare(sql);
  stmt.bind(['Debug Test Conversation', 'claude-sonnet-4-20250514', null]);
  stmt.step();
  stmt.free();

  console.log('\nStep 3: Get last insert rowid');
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const lastInsertRowid = lastIdResult.length ? lastIdResult[0].values[0][0] : null;
  console.log('Last insert rowid:', lastInsertRowid);

  console.log('\nStep 4: Try to retrieve the conversation');
  const getStmt = db.prepare('SELECT * FROM conversations WHERE id = ?');
  getStmt.bind([lastInsertRowid]);

  if (getStmt.step()) {
    const columns = getStmt.getColumnNames();
    const values = getStmt.get();
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = values[i];
    });
    console.log('Retrieved conversation:', obj);
  } else {
    console.log('❌ Could not retrieve conversation!');
  }
  getStmt.free();

  console.log('\nStep 5: Check all conversations again');
  const after = db.exec('SELECT id, title FROM conversations');
  console.log('Conversations after:', after[0]?.values || []);

  // Save database
  const data = db.export();
  const newBuffer = Buffer.from(data);
  fs.writeFileSync(dbPath, newBuffer);
  console.log('\n✅ Database saved');

  db.close();
}

testDatabase().catch(console.error);
