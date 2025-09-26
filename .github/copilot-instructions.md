# AI Agent Instructions for LLM Chatbot

This guide helps AI coding agents understand the key aspects of this Internet Computer (ICP) chatbot project that integrates with large language models (LLMs).

## Project Architecture

### Core Components
- `backend/app.mo`: Motoko canister (smart contract) that interfaces with LLM service
  - Handles `prompt` and `chat` functions using the `mo:llm` library
  - Uses enhanced orthogonal persistence for state management
- `frontend/src/main.jsx`: React frontend for chat interface
  - Manages chat state and message history
  - Handles error states and loading indicators
- `llm` canister: Remote dependency that provides LLM integration
  - Uses Ollama for model serving in local development
  - References official DFINITY LLM canister in production

### Key Dependencies
- Internet Computer SDK (dfx)
- Ollama for local LLM serving
- React + Vite for frontend
- MOPS package manager for Motoko

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
- Messages format: `{ system: { content: string } }`
- Error handling extracts messages from `SysTransient/CanisterReject` errors

#### Backend
- Uses persistent actor for state preservation
- LLM interactions wrapped in error handling
- Model selection fixed to `#Llama3_1_8B`

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

### Adding New Chat Features
1. Extend message types in frontend state
2. Add corresponding handlers in `app.mo`
3. Update chat display in `main.jsx`

### Modifying LLM Integration
1. Adjust model parameters in `app.mo`
2. Test with local Ollama instance
3. Deploy to verify ICP integration

## Debugging Tips
- Check Ollama server logs for model issues
- Use dfx console logs for canister debugging
- Frontend errors surface in browser console
- Watch for transformation/serialization issues between frontend/backend