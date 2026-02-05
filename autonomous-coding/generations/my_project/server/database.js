import initSqlJs from 'sql.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, 'database.db')
let SQL = null
let db = null

export async function initializeDatabase() {
  // Initialize sql.js
  if (!SQL) {
    SQL = await initSqlJs()
  }

  // Load existing database or create new one
  try {
    if (existsSync(dbPath)) {
      const buffer = readFileSync(dbPath)
      db = new SQL.Database(buffer)
      console.log('✅ Loaded existing database')
    } else {
      db = new SQL.Database()
      console.log('✅ Created new database')
    }
  } catch (error) {
    console.log('Creating new database due to error:', error.message)
    db = new SQL.Database()
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      name TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      preferences TEXT,
      custom_instructions TEXT
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      custom_instructions TEXT,
      knowledge_base_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_archived INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      project_id INTEGER,
      title TEXT DEFAULT 'New Conversation',
      model TEXT DEFAULT 'claude-sonnet-4-5-20250929',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_message_at DATETIME,
      is_archived INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      settings TEXT,
      token_count INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      edited_at DATETIME,
      tokens INTEGER DEFAULT 0,
      finish_reason TEXT,
      images TEXT,
      parent_message_id INTEGER,
      variation_group_id INTEGER,
      variation_index INTEGER DEFAULT 0,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_message_id) REFERENCES messages(id)
    );

    CREATE TABLE IF NOT EXISTS artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      conversation_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('code', 'html', 'svg', 'react', 'mermaid', 'text')),
      title TEXT,
      identifier TEXT,
      language TEXT,
      content TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS artifact_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artifact_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shared_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      share_token TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      view_count INTEGER DEFAULT 0,
      is_public INTEGER DEFAULT 1,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prompt_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      title TEXT NOT NULL,
      description TEXT,
      prompt_template TEXT NOT NULL,
      category TEXT,
      tags TEXT,
      is_public INTEGER DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS conversation_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      project_id INTEGER,
      name TEXT NOT NULL,
      parent_folder_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      position INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (parent_folder_id) REFERENCES conversation_folders(id)
    );

    CREATE TABLE IF NOT EXISTS conversation_folder_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_id INTEGER NOT NULL,
      conversation_id INTEGER NOT NULL,
      FOREIGN KEY (folder_id) REFERENCES conversation_folders(id) ON DELETE CASCADE,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      UNIQUE(folder_id, conversation_id)
    );

    CREATE TABLE IF NOT EXISTS usage_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      conversation_id INTEGER,
      message_id INTEGER,
      model TEXT,
      input_tokens INTEGER,
      output_tokens INTEGER,
      cost_estimate REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id),
      FOREIGN KEY (message_id) REFERENCES messages(id)
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      key_name TEXT NOT NULL,
      api_key_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_base_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      custom_instructions TEXT,
      settings TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `)

  // Migrate existing tables - Add new columns if they don't exist
  try {
    // Check if variation_group_id exists in messages table
    const columnsResult = db.exec("PRAGMA table_info(messages)")
    if (columnsResult.length > 0) {
      const columns = columnsResult[0].values.map(col => col[1])

      if (!columns.includes('variation_group_id')) {
        console.log('Adding variation_group_id column to messages table...')
        db.run('ALTER TABLE messages ADD COLUMN variation_group_id INTEGER')
      }

      if (!columns.includes('variation_index')) {
        console.log('Adding variation_index column to messages table...')
        db.run('ALTER TABLE messages ADD COLUMN variation_index INTEGER DEFAULT 0')
      }
    }
  } catch (error) {
    console.log('Migration check:', error.message)
  }

  // Create indexes for performance
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_is_deleted ON conversations(is_deleted);
    CREATE INDEX IF NOT EXISTS idx_conversations_is_pinned ON conversations(is_pinned);
    CREATE INDEX IF NOT EXISTS idx_conversations_is_archived ON conversations(is_archived);
    CREATE INDEX IF NOT EXISTS idx_conversations_composite ON conversations(user_id, is_deleted, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
    CREATE INDEX IF NOT EXISTS idx_messages_variation_group ON messages(variation_group_id);
    CREATE INDEX IF NOT EXISTS idx_messages_parent_message ON messages(parent_message_id);
    CREATE INDEX IF NOT EXISTS idx_artifacts_conversation_id ON artifacts(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_artifacts_message_id ON artifacts(message_id);
    CREATE INDEX IF NOT EXISTS idx_artifact_versions_artifact_id ON artifact_versions(artifact_id);
    CREATE INDEX IF NOT EXISTS idx_artifact_versions_version ON artifact_versions(artifact_id, version);
    CREATE INDEX IF NOT EXISTS idx_shared_conversations_token ON shared_conversations(share_token);
    CREATE INDEX IF NOT EXISTS idx_shared_conversations_conversation_id ON shared_conversations(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_usage_tracking_conversation_id ON usage_tracking(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_is_archived ON projects(is_archived);
    CREATE INDEX IF NOT EXISTS idx_prompt_library_user_id ON prompt_library(user_id);
    CREATE INDEX IF NOT EXISTS idx_conversation_folders_user_id ON conversation_folders(user_id);
    CREATE INDEX IF NOT EXISTS idx_conversation_folders_project_id ON conversation_folders(project_id);
    CREATE INDEX IF NOT EXISTS idx_conversation_folder_items_folder_id ON conversation_folder_items(folder_id);
    CREATE INDEX IF NOT EXISTS idx_conversation_folder_items_conversation_id ON conversation_folder_items(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_knowledge_base_documents_project_id ON knowledge_base_documents(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_templates_user_id ON project_templates(user_id);
  `)

  // Insert default user if not exists
  const userExists = db.exec('SELECT COUNT(*) as count FROM users')
  if (!userExists.length || !userExists[0].values.length || userExists[0].values[0][0] === 0) {
    db.run(`
      INSERT INTO users (id, email, name, custom_instructions)
      VALUES (1, 'demo@example.com', 'Demo User', '')
    `)
  }

  // Save database to disk
  saveDatabase()

  console.log('✅ Database initialized successfully')
  return db
}

export function saveDatabase() {
  if (db) {
    const data = db.export()
    const buffer = Buffer.from(data)
    writeFileSync(dbPath, buffer)
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return db
}

// Helper functions to make sql.js work more like better-sqlite3
export function prepare(sql) {
  const database = getDatabase()

  return {
    run: (...params) => {
      // Prepare statement
      const stmt = database.prepare(sql)

      // Bind parameters if any
      if (params.length > 0) {
        stmt.bind(params)
      }

      // Execute
      stmt.step()

      // Get the last inserted row ID BEFORE freeing the statement
      // This must happen immediately after step() while the context is still valid
      const lastIdResult = database.exec('SELECT last_insert_rowid() as id')
      const lastInsertRowid = lastIdResult.length ? lastIdResult[0].values[0][0] : null
      const changes = database.getRowsModified()

      stmt.free()

      saveDatabase()

      return { changes, lastInsertRowid }
    },
    get: (...params) => {
      // Prepare statement
      const stmt = database.prepare(sql)

      // Bind parameters if any
      if (params.length > 0) {
        stmt.bind(params)
      }

      // Get first row
      if (stmt.step()) {
        const columns = stmt.getColumnNames()
        const values = stmt.get()
        stmt.free()

        const obj = {}
        columns.forEach((col, i) => {
          obj[col] = values[i]
        })
        return obj
      }

      stmt.free()
      return null
    },
    all: (...params) => {
      // Prepare statement
      const stmt = database.prepare(sql)

      // Bind parameters if any
      if (params.length > 0) {
        stmt.bind(params)
      }

      // Get all rows
      const results = []
      const columns = stmt.getColumnNames()

      while (stmt.step()) {
        const values = stmt.get()
        const obj = {}
        columns.forEach((col, i) => {
          obj[col] = values[i]
        })
        results.push(obj)
      }

      stmt.free()
      return results
    }
  }
}
