'use client';

import { usePathname } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ChatWithBoth } from '@/app/utils/api';
// If you have an Auth hook, import it here
// import { useAuth } from '@/app/hooks/AuthContext';

export default function ChatButton() {
  const pathname = usePathname();
  // const { isLoggedIn } = useAuth(); // If you need login checks

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 1) Optionally skip rendering on /login, if desired
  if (pathname === '/login') {
    return null;
  }

  // 2) If you want to persist messages or handle logout resets, add localStorage logic here (omitted for brevity)

  // 3) Handle sending a new message
  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // Add the user's message to the chat
    setMessages((prev) => [...prev, `User: ${trimmed}`]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 4) POST to Django endpoint (change host if needed)
      const response = await ChatWithBoth(trimmed);
      // data.response should be "Message received successfully"
      setMessages((prev) => [...prev, `Server: ${response}`]);
    } catch (error) {
      console.error('Fetch error:', error);
      setMessages((prev) => [...prev, 'Server: Something went wrong.']);
    } finally {
      setIsLoading(false);
    }
  };

  // 5) A basic UI with a reset button just to illustrate
  const handleResetChat = () => {
    setMessages([]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          border: 'none',
          backgroundColor: '#f1f1f1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '300px',
            height: '400px',
            border: '1px solid #ccc',
            backgroundColor: '#fff',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              padding: '0.5rem',
              borderBottom: '1px solid #ccc',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <strong>Chat</strong>
            <button
              onClick={handleResetChat}
              style={{
                border: '1px solid #ccc',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  // If message starts with 'Server:', we color it differently
                  backgroundColor: msg.startsWith('Server:')
                    ? '#e1f5fe'
                    : '#e5e5e5',
                  maxWidth: '80%',
                }}
              >
                {msg}
              </div>
            ))}
            {isLoading && (
              <div
                style={{
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  backgroundColor: '#e1f5fe',
                  maxWidth: '80%',
                  fontStyle: 'italic'
                }}
              >
                Server is processing...
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderTop: '1px solid #ccc',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                border: 'none',
                borderLeft: '1px solid #ccc',
                backgroundColor: '#f1f1f1',
                padding: '0.5rem 1rem',
                cursor: 'pointer'
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
