# AI Agent Instructions for LLM Chatbot

This guide helps AI coding agents understand the key aspects of this Internet Computer (ICP) chatbot project that integrates with large language models (LLMs) and Internet Identity authentication.

## Project Architecture

### Core Components
- `backend/app.mo`: Motoko canister (smart contract) that interfaces with LLM service
  - Handles `prompt` and `chat` functions using the `mo:llm` library
  - Uses enhanced orthogonal persistence for state management
  - Stores chat history per authenticated user
  - Uses stable storage for persistent data across upgrades
- `frontend/src/main.jsx`: React frontend for chat interface
  - Manages chat state and message history
  - Handles error states and loading indicators
  - Integrates Internet Identity authentication
  - Displays persistent chat history for authenticated users
- `llm` canister: Remote dependency that provides LLM integration
  - Uses Ollama for model serving in local development
  - References official DFINITY LLM canister in production
- `internet_identity`: Remote canister for user authentication
  - Handles user login/logout flows
  - Provides Principal IDs for user identification

### Key Dependencies
- Internet Computer SDK (dfx)
- Ollama for local LLM serving
- React + Vite for frontend
- MOPS package manager for Motoko
- Internet Identity canister for authentication
- `@dfinity/auth-client` for frontend authentication
- `@dfinity/agent` for canister interactions

## Development Workflow

### Local Development Setup
1. Install IC SDK and Ollama
2. Run `ollama serve` (port 11434)
3. Download model: `ollama run llama3.1:8b` (~4GB)
4. Start local replica: `dfx start --background --clean`
5. Deploy: `dfx deploy`

### Project Conventions

#### Frontend 
- Chat state managed in root App component
- Messages format: `{ system: { content: string } }` or `{ user: { content: string } }`
- Error handling extracts messages from `SysTransient/CanisterReject` errors
- Authentication state managed with AuthClient
- Principal ID used as user identifier
- Chat history fetched on authentication

#### Backend
- Uses persistent actor for state preservation
- LLM interactions wrapped in error handling
- Model selection fixed to `#Llama3_1_8B`
- Stable HashMap for chat history storage: `Principal -> [ChatMessage]`
- Access control based on caller Principal
- History pagination support with configurable limits

## Key Integration Points

### Frontend ↔ Backend
- Frontend declarations auto-generated from canister
- Async communication via `backend.chat()` calls
- Error states propagated through alert dialogs

### Backend ↔ LLM Service
- Integration through `mo:llm` library
- Response processing handles null content cases
- Messages follow standard chat format

## Common Tasks

### Authentication Flow
1. Initialize AuthClient in frontend
2. Handle login/logout UI interactions
3. Store Principal ID after authentication
4. Update canister calls with identity context

### Chat History Management
1. Store messages in stable storage by Principal
2. Implement pagination for large chat histories
3. Handle canister upgrades gracefully
4. Clean up old/inactive chat histories

### Adding New Chat Features
1. Extend message types in frontend state
2. Add corresponding handlers in `app.mo`
3. Update chat display in `main.jsx`
4. Consider authentication context

### Modifying LLM Integration
1. Adjust model parameters in `app.mo`
2. Test with local Ollama instance
3. Deploy to verify ICP integration

### User Management
1. Implement user preferences storage
2. Add chat history export/import
3. Handle user data deletion requests
4. Monitor storage usage per user

## Debugging Tips
- Check Ollama server logs for model issues
- Use dfx console logs for canister debugging
- Frontend errors surface in browser console
- Watch for transformation/serialization issues between frontend/backend
- Monitor Internet Identity integration in browser devtools
- Check Principal ID in request headers
- Verify stable storage state during upgrades
- Track chat history memory usage
- Monitor authentication token expiration
- Test with multiple authenticated users

## Security Considerations
- Validate Principal ID on every request
- Implement rate limiting per user
- Sanitize chat history inputs
- Handle authentication timeouts gracefully
- Protect against memory exhaustion attacks
- Implement secure upgrade patterns
- Monitor and limit storage per user
- Validate message format and size
- Handle auth token expiration
- Implement proper error boundaries