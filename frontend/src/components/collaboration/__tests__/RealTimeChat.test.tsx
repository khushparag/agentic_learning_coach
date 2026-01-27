import React from 'react';
import { render, screen, waitFor } from '@/test/utils';
import { RealTimeChat } from '../RealTimeChat';
import { userInteractions } from '@/test/utils/user-interactions';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN,
};

global.WebSocket = jest.fn(() => mockWebSocket) as any;

describe('RealTimeChat', () => {
  const mockChatData = {
    roomId: 'room-123',
    messages: [
      {
        id: 'msg-1',
        userId: 'user-1',
        username: 'Alice',
        message: 'Hello everyone!',
        timestamp: new Date().toISOString(),
        type: 'text'
      },
      {
        id: 'msg-2',
        userId: 'user-2',
        username: 'Bob',
        message: 'Hey Alice! How are you?',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        type: 'text'
      },
      {
        id: 'msg-3',
        userId: 'user-1',
        username: 'Alice',
        message: 'console.log("Hello World");',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        type: 'code'
      }
    ],
    participants: [
      { id: 'user-1', username: 'Alice', isOnline: true },
      { id: 'user-2', username: 'Bob', isOnline: true },
      { id: 'user-3', username: 'Charlie', isOnline: false }
    ]
  };

  const defaultProps = {
    roomId: 'room-123',
    currentUserId: 'user-1'
  };

  describe('Rendering', () => {
    it('renders chat interface with messages', async () => {
      render(<RealTimeChat {...defaultProps} />);
      
      expect(screen.getByText('Chat')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
        expect(screen.getByText('Hey Alice! How are you?')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      render(<RealTimeChat {...defaultProps} />);
      
      expect(screen.getByTestId('chat-loading')).toBeInTheDocument();
    });

    it('shows empty state when no messages', async () => {
      render(<RealTimeChat {...defaultProps} />);
      
      // Mock empty chat
      await waitFor(() => {
        if (screen.queryByText('No messages yet')) {
          expect(screen.getByText('No messages yet')).toBeInTheDocument();
          expect(screen.getByText('Start the conversation!')).toBeInTheDocument();
        }
      });
    });
  });

  describe('Message Display', () => {
    it('displays messages with correct formatting', async () => {
      render(<RealTimeChat {...defaultProps} />);
      
      await waitFor(() => {
        // Text message
        const textMessage = screen.getByTestId('message-msg-1');
        expect(textMessage).toHaveTextContent('Hello everyone!');
        expect(textMessage).toHaveTextContent('Alice');
        
        // Code message
        const codeMessage = screen.getByTestId('message-msg-3');
        expect(codeMessage).toHaveTextContent('console.log("Hello World");');
        expect(codeMessage.querySelector('code')).toBeInTheDocument();
      });
    });

    it('shows message timestamps', async () => {
      render(<RealTimeChat {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('just now')).toBeInTheDocument();
        expect(screen.getByText('1 minute ago')).toBeInTheDocument();
        expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
      });
    });

    it('groups consecutive messages from same user', async () => {
      const messagesFromSameUser = {
        ...mockChatData,
        messages: [
          {
            id: 'msg-1',
            userId: 'user-1',
            username: 'Alice',
            message: 'First message',
            timestamp: new Date().toISOString(),
            type: 'text'
          },
          {
            id: 'msg-2',
            userId: 'user-1',
            username: 'Alice',
            message: 'Second message',
            timestamp: new Date(Date.now() - 30000).toISOString(),
            type: 'text'
          }
        ]
      };

      render(<RealTimeChat {...defaultProps} />);
      
      await waitFor(() => {
        const messageGroup = screen.getByTestId('message-group-user-1');
        expect(messageGroup).toBeInTheDocument();
        expect(messageGroup).toHaveTextContent('First message');
        expect(messageGroup).toHaveTextContent('Second message');
      });
    });

    it('highlights own messages differently', async () => {
      render(<RealTimeChat {...defaultProps} />);
      
      await waitFor(() => {
        const ownMessage = screen.getByTestId('message-msg-1');
        const otherMessage = screen.getByTestId('message-msg-2');
        
        expect(ownMessage).toHaveClass('ml-auto', 'bg-blue-500');
        expect(otherMessage).toHaveClass('mr-auto', 'bg-gray-200');
      });
    });
  });

  describe('Message Sending', () => {
    it('sends text message', async () => {
      render(
        <WebSocketProvider mockMode={false}>
          <RealTimeChat {...defaultProps} />
        </WebSocketProvider>
      );
      
      const messageInput = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await userInteractions.clearAndType(messageInput, 'Hello world!');
      await userInteractions.setup().click(sendButton);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'chat_message',
          roomId: 'room-123',
          message: 'Hello world!',
          messageType: 'text'
        })
      );
      
      // Input should be cleared
      expect(messageInput).toHaveValue('');
    });

    it('sends message with Enter key', async () => {
      render(
        <WebSocketProvider mockMode={false}>
          <RealTimeChat {...defaultProps} />
        </WebSocketProvider>
      );
      
      const messageInput = screen.getByPlaceholderText('Type a message...');
      
      await userInteractions.clearAndType(messageInput, 'Hello world!');
      await userInteractions.keyboard.enter();
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'chat_message',
          roomId: 'room-123',
          message: 'Hello world!',
          messageType: 'text'
        })
      );
    });

    it('prevents sending empty messages', async () => {
      render(<RealTimeChat {...defaultProps} />);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Button should be disabled when input is empty
      expect(sendButton).toBeDisabled();
      
      await userInteractions.setup().click(sendButton);
      
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it('sends code snippet', async () => {
      render(
        <WebSocketProvider mockMode={false}>
          <RealTimeChat {...defaultProps} />
        </WebSocketProvider>
      );
      
      const codeButton = screen.getByRole('button', { name: /code/i });
      await userInteractions.setup().click(codeButton);
      
      // Should open code input modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Share Code Snippet')).toBeInTheDocument();
      });
      
      const codeInput = screen.getByRole('textbox', { name: /code/i });
      await userInteractions.clearAndType(codeInput, 'console.log("test");');
      
      const shareButton = screen.getByRole('button', { name: /share/i });
      await userInteractions.setup().click(shareButton);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'chat_message',
          roomId: 'room-123',
          message: 'console.log("test");',
          messageType: 'code'
        })
      );
    });
  });

  describe('Real-time Updates', () => {
    it('receives and displays new messages', async () => {
      render(
        <WebSocketProvider mockMode={false}>
          <RealTimeChat {...defaultProps} />
        </WebSocketProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
      });
      
      // Simulate receiving new message
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'chat_message',
          data: {
            id: 'msg-new',
            userId: 'user-2',
            username: 'Bob',
            message: 'New message!',
            timestamp: new Date().toISOString(),
            type: 'text'
          }
        })
      });
      
      const messageHandler = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')?.[1];
      
      if (messageHandler) {
        messageHandler(messageEvent);
      }
      
      await waitFor(() => {
        expect(screen.getByText('New message!')).toBeInTheDocument();
      });
    });

    it('shows typing indicators', async () => {
      render(
        <WebSocketProvider mockMode={false}>
          <RealTimeChat {...defaultProps} />
        </WebSocketProvider>
      );
      
      // Simulate typing indicator
      const typingEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'user_typing',
          data: {
            userId: 'user-2',
            username: 'Bob',
            isTyping: true
          }
        })
      });
      
      const messageHandler = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')?.[1];
      
      if (messageHandler) {
        messageHandler(typingEvent);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Bob is typing...')).toBeInTheDocument();
      });
    });

    it('updates participant list', async () => {
      render(<RealTimeChat {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('3 participants')).toBeInTheDocument();
      });
      
      // Should show online status
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie (offline)')).toBeInTheDocument();
    });
  });

  describe('Message Actions', () => {
    it('allows copying message text', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      });

      render(<RealTimeChat {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
      });
      
      const message = screen.getByTestId('message-msg-1');
      await userInteractions.rightClick(message);
      
      const copyButton = screen.getByRole('menuitem', { name: /copy/i });
      await userInteractions.setup().click(copyButton);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello everyone!');
    });

    it('allows replying to message', async () => {
      render(<RealTimeChat {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
      });
      
      const message = screen.getByTestId('message-msg-1');
      await userInteractions.rightClick(message);
      
      const replyButton = screen.getByRole('menuitem', { name: /reply/i });
      await userInteractions.setup().click(replyButton);
      
      // Should show reply indicator in input
      expect(screen.getByText('Replying to Alice')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel reply/i })).toBeInTheDocument();
    });

    it('allows deleting own messages', async () => {
      render(<RealTimeChat {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
      });
      
      const ownMessage = screen.getByTestId('message-msg-1');
      await userInteractions.rightClick(ownMessage);
      
      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      await userInteractions.setup().click(deleteButton);
      
      // Should show confirmation
      expect(screen.getByText('Delete message?')).toBeInTheDocument();
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await userInteractions.setup().click(confirmButton);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'delete_message',
          messageId: 'msg-1',
          roomId: 'room-123'
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<RealTimeChat {...defaultProps} />);
      
      expect(screen.getByRole('log', { name: /chat messages/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /message input/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('announces new messages to screen readers', async () => {
      render(
        <WebSocketProvider mockMode={false}>
          <RealTimeChat {...defaultProps} />
        </WebSocketProvider>
      );
      
      // Simulate new message
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify({
          type: 'chat_message',
          data: {
            id: 'msg-new',
            userId: 'user-2',
            username: 'Bob',
            message: 'New message!',
            timestamp: new Date().toISOString(),
            type: 'text'
          }
        })
      });
      
      const messageHandler = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')?.[1];
      
      if (messageHandler) {
        messageHandler(messageEvent);
      }
      
      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toHaveTextContent('New message from Bob: New message!');
      });
    });

    it('supports keyboard navigation', async () => {
      render(<RealTimeChat {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      });
      
      // Tab to message input
      await userInteractions.keyboard.tab();
      expect(document.activeElement).toHaveAttribute('placeholder', 'Type a message...');
      
      // Tab to send button
      await userInteractions.keyboard.tab();
      expect(document.activeElement).toHaveAccessibleName(/send/i);
    });

    it('passes axe accessibility tests', async () => {
      const { container } = render(<RealTimeChat {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Performance', () => {
    it('virtualizes long message lists', async () => {
      const manyMessages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        userId: `user-${i % 3}`,
        username: `User${i % 3}`,
        message: `Message ${i}`,
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        type: 'text'
      }));

      render(<RealTimeChat {...defaultProps} />);
      
      await waitFor(() => {
        // Should only render visible messages
        const visibleMessages = screen.getAllByTestId(/message-/);
        expect(visibleMessages.length).toBeLessThan(100);
      });
    });

    it('debounces typing indicators', async () => {
      render(
        <WebSocketProvider mockMode={false}>
          <RealTimeChat {...defaultProps} />
        </WebSocketProvider>
      );
      
      const messageInput = screen.getByPlaceholderText('Type a message...');
      
      // Type quickly
      await userInteractions.clearAndType(messageInput, 'test');
      
      // Should debounce typing indicator
      await waitFor(() => {
        const typingCalls = mockWebSocket.send.mock.calls.filter(call => 
          JSON.parse(call[0]).type === 'typing_indicator'
        );
        expect(typingCalls.length).toBeLessThan(4); // Less than number of characters
      });
    });
  });

  describe('Error Handling', () => {
    it('handles WebSocket connection errors', async () => {
      render(
        <WebSocketProvider mockMode={false}>
          <RealTimeChat {...defaultProps} />
        </WebSocketProvider>
      );
      
      // Simulate connection error
      const errorHandler = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'error')?.[1];
      
      if (errorHandler) {
        errorHandler(new Event('error'));
      }
      
      await waitFor(() => {
        expect(screen.getByText('Connection lost. Trying to reconnect...')).toBeInTheDocument();
      });
    });

    it('shows retry button on connection failure', async () => {
      render(<RealTimeChat {...defaultProps} />);
      
      // Simulate connection failure
      await waitFor(() => {
        if (screen.queryByText('Failed to connect to chat')) {
          expect(screen.getByText('Failed to connect to chat')).toBeInTheDocument();
          expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
        }
      });
    });
  });
});
