# Claude.ai Clone - AI Chat Interface

A fully functional clone of claude.ai, Anthropic's conversational AI interface. This application provides a clean, modern chat interface for interacting with Claude via the API, including features like conversation management, artifact rendering, project organization, and advanced settings.

## 🎯 Project Overview

This is a production-quality web application that replicates the core functionality and design of claude.ai, built with:

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + SQLite
- **AI Integration**: Anthropic Claude API with streaming support

## ✨ Key Features

### Chat Interface
- Clean, centered chat layout with streaming responses
- Markdown rendering with syntax-highlighted code blocks
- LaTeX/math equation rendering
- Image upload and multi-modal conversations
- Message editing and regeneration
- Multi-turn conversations with full context

### Artifacts
- Automatic detection and rendering of code, HTML, SVG, React components
- Live preview with interactive editing
- Version history and artifact management
- Full-screen mode and download capabilities

### Organization
- **Projects**: Group related conversations with custom instructions
- **Folders**: Organize conversations hierarchically
- **Search**: Full-text search across all conversations
- **Pinning & Archiving**: Manage conversation visibility

### Customization
- **Themes**: Light, Dark, and Auto modes
- **Model Selection**: Switch between Claude Sonnet, Haiku, and Opus
- **Custom Instructions**: Global, project-level, and conversation-level
- **Advanced Settings**: Temperature, max tokens, top-p controls

### Collaboration
- Share conversations via read-only links
- Export to JSON, Markdown, and PDF
- Prompt library with templates
- Usage tracking and analytics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- API key from Anthropic (stored at `/tmp/api-key` or in `.env`)

### Installation & Running

**Option 1: Automated Setup and Run**
```bash
./run.sh
```
This will install all dependencies and start both frontend and backend servers.

**Option 2: Manual Setup**
```bash
# Run setup script
./init.sh

# Start backend (in one terminal)
cd server && node index.js

# Start frontend (in another terminal)
pnpm dev
```

### Accessing the Application

- **Frontend**: http://localhost:5173 (or port shown by Vite)
- **Backend**: http://localhost:3000

## 📁 Project Structure

```
.
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── contexts/          # React contexts for state management
│   ├── pages/             # Page components
│   └── utils/             # Utility functions
├── server/                # Backend source code
│   ├── index.js           # Express server entry point
│   ├── database.js        # SQLite database setup
│   ├── routes/            # API route handlers
│   └── middleware/        # Express middleware
├── public/                # Static assets
├── feature_list.json      # Comprehensive test cases (200+ features)
├── init.sh                # Setup script
├── run.sh                 # Quick start script
└── README.md              # This file
```

## 🧪 Testing & Development

### Feature List

This project includes a comprehensive `feature_list.json` with 200+ detailed end-to-end test cases covering:

- **Functional Tests**: All API endpoints, chat features, artifacts, projects, settings
- **Style Tests**: UI consistency, responsive design, themes, animations
- **Workflows**: Complete user journeys from onboarding to advanced features

Each test includes:
- Category (functional/style)
- Detailed description
- Step-by-step testing instructions
- Pass/fail status

### Development Workflow

1. **Check feature_list.json** to see what needs to be built
2. **Implement features** one at a time
3. **Test thoroughly** following the test steps
4. **Mark as passing** by changing `"passes": false` to `"passes": true`
5. **Commit progress** regularly

### Important Rules

⚠️ **CRITICAL**: Features in `feature_list.json` should NEVER be removed or modified. They can only be marked as passing. This ensures no functionality is missed during development.

## 🎨 Design System

### Colors
- **Primary**: `#CC785C` (Claude orange/amber)
- **Light Mode**: White background, near-black text
- **Dark Mode**: `#1A1A1A` background, `#E5E5E5` text

### Typography
- **Sans-serif**: System font stack (Inter, SF Pro, Roboto)
- **Monospace**: JetBrains Mono, Consolas, Monaco

### Components
- Rounded corners (6-8px)
- Smooth transitions (150-300ms)
- Accessible focus states
- High contrast mode support

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

Or the backend will attempt to read from `/tmp/api-key`.

### Backend Configuration

The backend runs on port 3000 by default. Database is SQLite stored in `server/database.db`.

### Frontend Configuration

Vite configuration in `vite.config.js`. Tailwind CSS loaded via CDN as specified.

## 📊 Database Schema

The SQLite database includes tables for:
- **users**: User profiles and preferences
- **projects**: Project organization
- **conversations**: Chat conversations
- **messages**: Individual messages
- **artifacts**: Code and content artifacts
- **shared_conversations**: Sharing links
- **prompt_library**: Saved prompts
- **usage_tracking**: Token and cost tracking

## 🔐 Security

- API keys stored securely in environment variables
- No API key exposure in client-side code
- Input validation on all endpoints
- SQL injection prevention with parameterized queries
- CORS properly configured

## 🌐 API Endpoints

The backend provides RESTful endpoints for:

- **Authentication**: `/api/auth/*`
- **Conversations**: `/api/conversations/*`
- **Messages**: `/api/conversations/:id/messages` (with SSE streaming)
- **Artifacts**: `/api/artifacts/*`
- **Projects**: `/api/projects/*`
- **Sharing**: `/api/conversations/:id/share`
- **Search**: `/api/search/*`
- **Usage**: `/api/usage/*`
- **Settings**: `/api/settings/*`

## 📱 Responsive Design

- **Mobile**: Single column, collapsible sidebar, touch-optimized
- **Tablet**: Two columns, adaptive layout
- **Desktop**: Three columns when artifacts are present

## ♿ Accessibility

- Full keyboard navigation
- ARIA labels and roles
- Screen reader support
- High contrast mode
- Focus management
- Reduced motion support

## 🚧 Development Status

This project is under active development. See `feature_list.json` for detailed progress on all 200+ features.

To check current progress:
```bash
cat feature_list.json | grep '"passes": true' | wc -l
```

## 📝 License

This is a demonstration/educational project. Anthropic and Claude are trademarks of Anthropic, PBC.

## 🤝 Contributing

This project follows a specific development methodology:

1. Work from `feature_list.json` systematically
2. One feature at a time
3. Test thoroughly before marking complete
4. Commit frequently with descriptive messages
5. Never remove or modify feature tests, only mark as passing

## 📞 Support

For issues or questions about the implementation, refer to:
- `feature_list.json` for detailed requirements
- `app_spec.txt` for complete specifications
- Code comments and documentation

---

**Built with Claude** - An autonomous development project demonstrating production-quality AI-assisted software engineering.
