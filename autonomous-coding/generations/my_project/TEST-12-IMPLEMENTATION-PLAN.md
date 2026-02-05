# Test #12 Implementation Plan: Delete Conversations

## Feature: User can delete a conversation

---

## Requirements (from feature_list.json)

**Test Steps:**
1. Right-click conversation in sidebar
2. Click 'Delete' option
3. Confirm deletion in dialog
4. Verify conversation removed from sidebar
5. Check database marks conversation as deleted

---

## Implementation Approach

### Phase 1: Backend Support ✅ ALREADY EXISTS

**Status**: DELETE endpoint already implemented in `server/routes/conversations.js` (lines 119-131)

- **Endpoint**: `DELETE /api/conversations/:id` ✅
- **Implementation**: Soft delete (sets `is_deleted = 1`) ✅
- **Response**: `{ success: true, message: 'Conversation deleted' }` ✅
- **Updated timestamp**: Sets `updated_at = CURRENT_TIMESTAMP` ✅

**No backend changes needed!** The API is ready to use.

### Phase 2: Frontend Context Function

**File**: `src/contexts/ConversationContext.jsx`

Add `deleteConversation` function:
```javascript
const deleteConversation = async (conversationId) => {
  try {
    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      // Remove from local state
      setConversations(prev =>
        prev.filter(conv => conv.id !== conversationId)
      );

      // If deleting current conversation, switch to another or null
      if (currentConversation?.id === conversationId) {
        const remaining = conversations.filter(c => c.id !== conversationId);
        if (remaining.length > 0) {
          setCurrentConversation(remaining[0]);
        } else {
          setCurrentConversation(null);
        }
      }
    } else {
      throw new Error('Failed to delete conversation');
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

// Export in context value
return (
  <ConversationContext.Provider value={{
    // ... existing values
    deleteConversation
  }}>
```

### Phase 3: UI Components

#### Option A: Context Menu (Right-Click) - Matches Spec

**File**: `src/components/Sidebar.jsx`

Add context menu to conversation items:

```javascript
import { useState } from 'react';
import { useConversation } from '../contexts/ConversationContext';

function Sidebar() {
  const { conversations, deleteConversation, /* ... */ } = useConversation();
  const [contextMenu, setContextMenu] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  const handleContextMenu = (e, conv) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      conversation: conv
    });
  };

  const handleDelete = (conv) => {
    setConversationToDelete(conv);
    setShowDeleteDialog(true);
    setContextMenu(null);
  };

  const confirmDelete = async () => {
    if (conversationToDelete) {
      try {
        await deleteConversation(conversationToDelete.id);
        setShowDeleteDialog(false);
        setConversationToDelete(null);
      } catch (error) {
        console.error('Failed to delete:', error);
        // Could show error toast here
      }
    }
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  return (
    <div className="...">
      {/* ... existing sidebar content */}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredConversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => setCurrentConversation(conv)}
            onContextMenu={(e) => handleContextMenu(e, conv)}
            className="..."
          >
            {/* conversation content */}
          </button>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000
          }}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg py-1"
        >
          <button
            onClick={() => handleDelete(contextMenu.conversation)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
          >
            Delete
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Delete Conversation?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete "{conversationToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setConversationToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Option B: Delete Button (Simpler Alternative)

Add a delete icon/button that appears on hover:

```javascript
<button
  key={conv.id}
  className="relative group ..."
>
  {/* conversation content */}

  <button
    onClick={(e) => {
      e.stopPropagation();
      handleDelete(conv);
    }}
    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded"
  >
    🗑️
  </button>
</button>
```

**Recommendation**: Use Option A (context menu) as it matches the spec exactly.

### Phase 4: Testing

#### Automated Test Script

Create `test-delete-conversation.cjs`:

```javascript
const puppeteer = require('puppeteer');

(async () => {
  console.log('Testing Delete Conversation Feature...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  try {
    const page = await browser.newPage();

    // Step 1: Load app
    console.log('Step 1: Loading app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'test-delete-1-loaded.png' });
    console.log('✅ App loaded\n');

    // Step 2: Create a test conversation
    console.log('Step 2: Creating test conversation...');
    await page.click('button:has-text("New Chat")');
    await page.waitForTimeout(500);

    const textarea = await page.waitForSelector('textarea');
    await textarea.type('This is a test conversation to delete');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000); // Wait for response
    await page.screenshot({ path: 'test-delete-2-conversation-created.png' });
    console.log('✅ Test conversation created\n');

    // Step 3: Find conversation in sidebar
    console.log('Step 3: Right-clicking conversation...');
    const conversationButton = await page.$('button:has-text("Test Conversation")');

    if (!conversationButton) {
      throw new Error('Conversation not found in sidebar');
    }

    // Right-click to open context menu
    await conversationButton.click({ button: 'right' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-delete-3-context-menu.png' });
    console.log('✅ Context menu opened\n');

    // Step 4: Click delete option
    console.log('Step 4: Clicking Delete...');
    const deleteButton = await page.waitForSelector('button:has-text("Delete")');
    await deleteButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-delete-4-confirm-dialog.png' });
    console.log('✅ Confirmation dialog shown\n');

    // Step 5: Confirm deletion
    console.log('Step 5: Confirming deletion...');
    const confirmButton = await page.waitForSelector('button:has-text("Delete")');
    await confirmButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-delete-5-deleted.png' });
    console.log('✅ Conversation deleted\n');

    // Step 6: Verify conversation is gone
    console.log('Step 6: Verifying conversation removed...');
    const sidebarText = await page.evaluate(() => document.body.textContent);

    if (sidebarText.includes('Test Conversation')) {
      console.log('⚠️ Conversation still appears in sidebar\n');
    } else {
      console.log('✅ Conversation removed from sidebar\n');
    }

    console.log('========================================');
    console.log('TEST COMPLETE');
    console.log('========================================');
    console.log('✅ Delete conversation feature works!');
    console.log('\nFeature Test #12 PASSED!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-delete-error.png' });
  } finally {
    await browser.close();
  }
})();
```

#### Manual Test

1. Open http://localhost:5173
2. Create a test conversation
3. Right-click the conversation in the sidebar
4. Click "Delete"
5. Confirm deletion
6. Verify conversation is removed from sidebar
7. Check that if you were viewing that conversation, you're switched to another

### Phase 5: Edge Cases to Handle

1. **Deleting current conversation**: Switch to another conversation or show empty state
2. **Deleting last conversation**: Show empty state, no errors
3. **API failure**: Show error message, don't remove from UI
4. **Rapid deletions**: Disable button while delete in progress
5. **Long conversation titles**: Truncate in confirmation dialog

### Phase 6: Styling Considerations

- **Context menu**: Match Claude.ai design (clean, minimal)
- **Delete button**: Red color to indicate destructive action
- **Confirmation dialog**: Clear warning, easy to cancel
- **Hover states**: Visual feedback on all interactive elements

---

## Implementation Checklist

- [ ] Verify DELETE endpoint exists in backend
- [ ] Add deleteConversation to ConversationContext
- [ ] Add context menu UI to Sidebar
- [ ] Add delete confirmation dialog
- [ ] Handle edge case: deleting current conversation
- [ ] Handle edge case: deleting last conversation
- [ ] Add error handling and user feedback
- [ ] Create automated test script
- [ ] Test manually with browser
- [ ] Verify database soft delete works
- [ ] Take screenshots of each step
- [ ] Update feature_list.json: mark Test #12 as passing
- [ ] Git commit with detailed message

---

## Estimated Time

- Backend verification/implementation: 10 minutes
- Frontend context function: 10 minutes
- UI components (context menu + dialog): 30 minutes
- Testing and debugging: 20 minutes
- **Total: ~70 minutes**

---

## Dependencies

- ✅ Backend server running
- ✅ Frontend server running
- ✅ ConversationContext exists
- ✅ Sidebar component exists
- ✅ Database conversations table has is_deleted column

---

## Success Criteria

1. Right-click conversation shows context menu
2. Clicking Delete shows confirmation dialog
3. Confirming deletion removes conversation from sidebar
4. Database marks conversation as deleted (is_deleted = 1)
5. If deleting current conversation, switches to another
6. No console errors
7. Smooth animations and UX
8. Matches Claude.ai design language

---

## Notes for Implementation

- Use soft delete (set flag) rather than hard delete (remove row)
- Consider adding "Undo" functionality later
- Context menu should close when clicking elsewhere
- Confirmation dialog should be keyboard accessible (Escape to cancel)
- Delete button should be red to indicate danger
- Test with multiple conversations in different states

---

**This plan is ready for immediate implementation once servers are running and Test #11 is verified.**
