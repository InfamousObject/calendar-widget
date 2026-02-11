/**
 * Tests for the widget page chat view behavior.
 *
 * Reproduces bugs:
 * 1. Header shows "Book an Appointment" when view=chat — should be hidden
 * 2. Close button should be a floating button, not an X in the header
 * 3. Greeting message not displayed when chatbot config is present
 * 4. Chat API errors show generic message instead of actual error details
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── jsdom stubs ─────────────────────────────────────────────────────────────

// scrollIntoView is not implemented in jsdom
Element.prototype.scrollIntoView = jest.fn();

// window.parent.postMessage
window.parent.postMessage = jest.fn();

// ── Mocks ───────────────────────────────────────────────────────────────────

// Mock next/navigation
let mockSearchParamsView: string | null = null;
jest.mock('next/navigation', () => ({
  useParams: () => ({ widgetId: 'test-widget-id' }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'view' ? mockSearchParamsView : null),
  }),
}));

// Mock analytics
jest.mock('@/lib/analytics/track', () => ({
  trackConversion: jest.fn(),
}));

// Helper to build a valid widget config response
function makeConfig(overrides: Record<string, any> = {}) {
  return {
    widgetId: 'test-widget-id',
    businessName: 'Test Business',
    welcomeMessage: 'Welcome!',
    appearance: {
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      borderRadius: 'medium',
      fontFamily: 'system',
    },
    bookingSettings: { timeFormat: '12h', requirePhone: false, showNotes: true },
    chatbot: {
      enabled: true,
      botName: 'TestBot',
      greetingMessage: 'Hello! How can I help you?',
    },
    features: { appointmentTypes: [], forms: [] },
    ...overrides,
  };
}

// ── Import the component under test ─────────────────────────────────────────

import WidgetPage from '../[widgetId]/page';

// ── Test suite ──────────────────────────────────────────────────────────────

describe('Widget Chat View', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    mockSearchParamsView = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Bug 1: Header should be hidden in chat view ────────────────────────

  describe('when view=chat', () => {
    beforeEach(() => {
      mockSearchParamsView = 'chat';
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => makeConfig(),
      });
    });

    it('should NOT display the business name as a title', async () => {
      render(<WidgetPage />);

      await waitFor(() => {
        // Chat view has loaded — the input field should be present
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
      });

      // The business name should NOT appear as a header
      expect(screen.queryByText('Test Business')).not.toBeInTheDocument();
    });

    // ── Bug 2: Close button should be a floating button ─────────────────

    it('should render a floating close button (not in a header bar)', async () => {
      render(<WidgetPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
      });

      // There should be a close button with an accessible label
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(
        (btn) => btn.getAttribute('aria-label') === 'Close chat'
      );
      expect(closeButton).toBeDefined();
    });
  });

  // ── Bug 3: Greeting message should be displayed ────────────────────────

  describe('greeting message', () => {
    beforeEach(() => {
      mockSearchParamsView = 'chat';
    });

    it('should display the greeting message from chatbot config', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => makeConfig(),
      });

      render(<WidgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
      });
    });

    it('should show a default greeting when chatbot config is missing', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => makeConfig({ chatbot: undefined }),
      });

      render(<WidgetPage />);

      // Should show a default greeting even without chatbot config
      await waitFor(() => {
        expect(screen.getByText('Hi! How can I help you today?')).toBeInTheDocument();
      });
    });
  });

  // ── Bug 4: Chat errors should surface actual API message ───────────────

  describe('chat error handling', () => {
    beforeEach(() => {
      mockSearchParamsView = 'chat';
    });

    it('should display the actual error message from the API, not a generic one', async () => {
      // First call: config fetch succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => makeConfig(),
      });

      render(<WidgetPage />);

      // Wait for greeting to appear
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
      });

      // Second call: chat API returns a specific error
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Chatbot is not enabled' }),
      });

      // Type a message and send
      const input = screen.getByPlaceholderText('Type your message...');
      fireEvent.change(input, { target: { value: 'Hi there' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Should show the ACTUAL error, not the generic fallback
      await waitFor(() => {
        expect(
          screen.queryByText('Sorry, I encountered an error. Please try again.')
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Chatbot is not enabled')).toBeInTheDocument();
      });
    });

    it('should show subscription-related errors to help the user', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => makeConfig(),
      });

      render(<WidgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Chatbot is only available on Chatbot and Bundle plans. Please upgrade to access this feature.',
        }),
      });

      const input = screen.getByPlaceholderText('Type your message...');
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(
          screen.getByText(
            'Chatbot is only available on Chatbot and Bundle plans. Please upgrade to access this feature.'
          )
        ).toBeInTheDocument();
      });
    });
  });
});
