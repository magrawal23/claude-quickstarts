// Simple test script to verify backend functionality
import fetch from 'node-fetch'
import { getDatabase, prepare } from './server/database.js'

async function testBackend() {
  console.log('🧪 Testing Backend Functionality\n')

  // Test 1: Health endpoint
  console.log('Test 1: Health Endpoint')
  try {
    const response = await fetch('http://localhost:3000/health')
    const data = await response.json()
    console.log('  ✅ Health endpoint:', data.status)
  } catch (error) {
    console.log('  ❌ Health endpoint failed:', error.message)
  }

  // Test 2: Database file exists
  console.log('\nTest 2: Database File')
  try {
    const fs = await import('fs')
    const exists = fs.existsSync('./server/database.db')
    if (exists) {
      const stats = fs.statSync('./server/database.db')
      console.log('  ✅ Database file exists, size:', stats.size, 'bytes')
    } else {
      console.log('  ❌ Database file not found')
    }
  } catch (error) {
    console.log('  ❌ Database check failed:', error.message)
  }

  // Test 3: Create conversation
  console.log('\nTest 3: Create Conversation')
  try {
    const response = await fetch('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Conversation' })
    })
    const data = await response.json()
    console.log('  ✅ Conversation created:', data.id, '-', data.title)
  } catch (error) {
    console.log('  ❌ Create conversation failed:', error.message)
  }

  // Test 4: List conversations
  console.log('\nTest 4: List Conversations')
  try {
    const response = await fetch('http://localhost:3000/api/conversations')
    const data = await response.json()
    console.log('  ✅ Conversations retrieved:', data.length, 'conversations')
    data.forEach(c => console.log('    -', c.id, ':', c.title))
  } catch (error) {
    console.log('  ❌ List conversations failed:', error.message)
  }

  console.log('\n✅ Backend tests complete!')
}

testBackend().catch(console.error)
