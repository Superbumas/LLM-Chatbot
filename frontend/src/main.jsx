import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { authService } from './services/auth';
import botImg from '/bot.svg';
import userImg from '/user.svg';
import '/index.css';

const DEFAULT_CHAT = [
  {
    system: { content: "I'm a sovereign AI agent living on the Internet Computer. Ask me anything." },
  },
];

const getMessageContent = (message) => {
  if ('user' in message) {
    return message.user.content;
  }
  if ('assistant' in message) {
    return message.assistant.content;
  }
  if ('system' in message) {
    return message.system.content;
  }
  return '';
};

const getMessageRole = (message) => {
  if ('user' in message) {
    return 'User';
  }
  if ('assistant' in message) {
    return 'Assistant';
  }
  if ('system' in message) {
    return 'System';
  }
  return 'Unknown';
};

const App = () => {
  const [chat, setChat] = useState(() => [...DEFAULT_CHAT]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const chatBoxRef = useRef(null);

  const formatDate = (date) => {
    const h = `0${date.getHours()}`;
    const m = `0${date.getMinutes()}`;
    return `${h.slice(-2)}:${m.slice(-2)}`;
  };

  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const loadHistory = useCallback(async () => {
    try {
      const actor = authService.getBackendActor();
      const history = await actor.getChatHistory();
      if (Array.isArray(history) && history.length > 0) {
        setChat(history);
      } else {
        setChat([...DEFAULT_CHAT]);
      }
    } catch (error) {
      console.error('Failed to load chat history', error);
      setChat([...DEFAULT_CHAT]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const authenticated = await authService.initialize();
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error('Failed to initialize authentication', error);
      } finally {
        await loadHistory();
        setIsInitializing(false);
      }
    };

    init();
  }, [loadHistory]);

  const askAgent = async (messages) => {
    try {
      const actor = authService.getBackendActor();
      const history = await actor.chat(messages);
      setChat(history);
    } catch (error) {
      console.error(error);
      const match = String(error).match(/(SysTransient|CanisterReject), \\+"([^\\"]+)/);
      if (match) {
        alert(match[2]);
      }
      setChat((prevChat) => {
        const newChat = [...prevChat];
        newChat.pop();
        return newChat;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { user: { content: inputValue } };
    const thinkingMessage = { system: { content: 'Thinking ...' } };

    setChat((prevChat) => [...prevChat, userMessage, thinkingMessage]);
    setInputValue('');
    setIsLoading(true);

    const messagesToSend = chat.slice(1).concat(userMessage);
    askAgent(messagesToSend);
  };

  const handleLogin = async () => {
    try {
      await authService.login();
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      await loadHistory();
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      await loadHistory();
    } catch (error) {
      console.error('Logout failed', error);
      setChat([...DEFAULT_CHAT]);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b bg-gray-100 p-4">
          <div className="text-lg font-semibold text-gray-700">LLM Chatbot</div>
          {!isAuthenticated ? (
            <button
              onClick={handleLogin}
              className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
            >
              Login with Internet Identity
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            >
              Logout
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-100 p-4" ref={chatBoxRef}>
          {chat.map((message, index) => {
            const isUser = 'user' in message;
            const img = isUser ? userImg : botImg;
            const name = getMessageRole(message);
            const text = getMessageContent(message);

            return (
              <div key={index} className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div
                    className="mr-2 h-10 w-10 rounded-full"
                    style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover' }}
                  ></div>
                )}
                <div className={`max-w-[70%] rounded-lg p-3 ${isUser ? 'bg-blue-500 text-white' : 'bg-white shadow'}`}>
                  <div
                    className={`mb-1 flex items-center justify-between text-sm ${isUser ? 'text-white' : 'text-gray-500'}`}
                  >
                    <div>{name}</div>
                    <div className="mx-2">{formatDate(new Date())}</div>
                  </div>
                  <div>{text}</div>
                </div>
                {isUser && (
                  <div
                    className="ml-2 h-10 w-10 rounded-full"
                    style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover' }}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
        <form className="flex border-t bg-white p-4" onSubmit={handleSubmit}>
          <input
            type="text"
            className="flex-1 rounded-l border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask anything ..."
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="rounded-r bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

