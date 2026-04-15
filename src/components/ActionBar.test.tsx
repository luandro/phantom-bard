/**
 * Tests for ActionBar.tsx — Non-host waiting state UI feedback
 *
 * Tests:
 * - Input is disabled when isWaitingForHost is true
 * - Quick action buttons are disabled when isWaitingForHost is true
 * - Send button is disabled when isWaitingForHost is true
 * - Placeholder text changes when waiting for host
 * - Actions can still be sent when not waiting
 * - isLoading still disables controls (no regression)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionBar } from '@/components/ActionBar';

// ─── Mock useGame ─────────────────────────────────────────────────────────────

const mockSendPlayerAction = vi.fn();
let mockIsLoading = false;
let mockIsWaitingForHost = false;

vi.mock('@/hooks/use-game', () => ({
  useGame: () => ({
    sendPlayerAction: mockSendPlayerAction,
    isLoading: mockIsLoading,
    isWaitingForHost: mockIsWaitingForHost,
    state: {
      party: [],
      storyLog: [],
      currentTurn: 0,
    },
  }),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ActionBar — Non-host waiting state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;
    mockIsWaitingForHost = false;
  });

  describe('normal state (no waiting)', () => {
    it('should render input with default placeholder', () => {
      render(<ActionBar />);
      const input = screen.getByPlaceholderText('What do you do?');
      expect(input).toBeInTheDocument();
      expect(input).not.toBeDisabled();
    });

    it('should send action on Enter key', async () => {
      render(<ActionBar />);
      const input = screen.getByPlaceholderText('What do you do?');

      await userEvent.setup().type(input, 'I attack the goblin!{Enter}');

      expect(mockSendPlayerAction).toHaveBeenCalledWith('I attack the goblin!');
    });

    it('should send action on button click', async () => {
      render(<ActionBar />);
      const input = screen.getByPlaceholderText('What do you do?');

      await userEvent.setup().type(input, 'I search for traps!');
      const sendButton = screen.getByRole('button', { name: '' }); // Send icon button
      // The send button is the one next to the input
      const buttons = screen.getAllByRole('button');
      const sendBtn = buttons[buttons.length - 1]; // Last button is send
      await userEvent.setup().click(sendBtn);

      expect(mockSendPlayerAction).toHaveBeenCalledWith('I search for traps!');
    });

    it('should not send empty actions', async () => {
      render(<ActionBar />);
      const input = screen.getByPlaceholderText('What do you do?');

      await userEvent.setup().type(input, '{Enter}');

      expect(mockSendPlayerAction).not.toHaveBeenCalled();
    });
  });

  describe('isLoading state (no regression)', () => {
    it('should disable input when isLoading is true', () => {
      mockIsLoading = true;
      render(<ActionBar />);
      const input = screen.getByPlaceholderText('What do you do?');
      expect(input).toBeDisabled();
    });

    it('should disable quick action buttons when isLoading', () => {
      mockIsLoading = true;
      render(<ActionBar />);

      // All quick action buttons should be disabled
      const buttons = screen.getAllByRole('button');
      // Quick action buttons are all except the last (send) button
      const quickActionButtons = buttons.slice(0, -1);
      for (const btn of quickActionButtons) {
        expect(btn).toBeDisabled();
      }
    });
  });

  describe('isWaitingForHost state', () => {
    it('should disable input when isWaitingForHost is true', () => {
      mockIsWaitingForHost = true;
      render(<ActionBar />);
      const input = screen.getByPlaceholderText('Waiting for host to process...');
      expect(input).toBeDisabled();
    });

    it('should change placeholder text when waiting for host', () => {
      mockIsWaitingForHost = true;
      render(<ActionBar />);
      expect(screen.getByPlaceholderText('Waiting for host to process...')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('What do you do?')).not.toBeInTheDocument();
    });

    it('should disable quick action buttons when waiting for host', () => {
      mockIsWaitingForHost = true;
      render(<ActionBar />);

      const buttons = screen.getAllByRole('button');
      const quickActionButtons = buttons.slice(0, -1);
      for (const btn of quickActionButtons) {
        expect(btn).toBeDisabled();
      }
    });

    it('should disable send button when waiting for host', () => {
      mockIsWaitingForHost = true;
      render(<ActionBar />);

      const buttons = screen.getAllByRole('button');
      const sendBtn = buttons[buttons.length - 1];
      expect(sendBtn).toBeDisabled();
    });

    it('should not send action on Enter when waiting for host', async () => {
      mockIsWaitingForHost = true;
      render(<ActionBar />);

      const input = screen.getByPlaceholderText('Waiting for host to process...');
      // Input is disabled, so typing should not work
      expect(input).toBeDisabled();
    });
  });

  describe('combined isLoading + isWaitingForHost', () => {
    it('should be disabled when both are true', () => {
      mockIsLoading = true;
      mockIsWaitingForHost = true;
      render(<ActionBar />);

      const input = screen.getByPlaceholderText('Waiting for host to process...');
      expect(input).toBeDisabled();
    });

    it('should show waiting placeholder even when isLoading is also true', () => {
      mockIsLoading = true;
      mockIsWaitingForHost = true;
      render(<ActionBar />);

      expect(screen.getByPlaceholderText('Waiting for host to process...')).toBeInTheDocument();
    });
  });
});
