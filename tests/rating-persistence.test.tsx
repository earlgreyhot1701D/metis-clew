import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExplanationPanel } from '../src/components/ExplanationPanel';
import { createMockSupabaseClient, mockSupabaseUpsert, mockSupabaseError } from './supabase-mock';
import type { MockSupabaseClient } from './supabase-mock';
import { toast } from '../src/hooks/use-toast';

// Mock the toast hook - create inline to avoid hoisting issues
jest.mock('../src/hooks/use-toast', () => {
  const mockToastFn = jest.fn(() => ({
    id: 'test-toast-id',
    dismiss: jest.fn(),
    update: jest.fn(),
  }));

  return {
    toast: mockToastFn,
    useToast: () => ({
      toast: mockToastFn,
    }),
  };
});

// Mock the Supabase client module
let mockSupabaseClient: MockSupabaseClient;

jest.mock('../src/integrations/supabase/client', () => ({
  supabase: {
    get auth() {
      return mockSupabaseClient.auth;
    },
    get from() {
      return mockSupabaseClient.from;
    },
    get functions() {
      return mockSupabaseClient.functions;
    },
  },
}));

describe('Rating Persistence', () => {
  let queryClient: QueryClient;
  let upsertMock: jest.Mock;

  const mockExplanation = {
    whatItDoes: 'This function calculates the factorial of a number using recursion.',
    whyItMatters: 'Understanding recursion is fundamental for algorithm design and problem-solving.',
    keyConcepts: ['recursion', 'base case', 'function calls'],
    relatedPatterns: ['dynamic programming', 'memoization', 'tail recursion'],
  };

  const mockExplanationId = 'test-explanation-123';
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    // Create a fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset mocks
    jest.clearAllMocks();

    // Create fresh Supabase mock
    mockSupabaseClient = createMockSupabaseClient();

    // Setup upsert mock
    upsertMock = mockSupabaseUpsert(mockSupabaseClient, {
      id: 'test-rating-id',
      explanation_id: mockExplanationId,
      user_id: mockUserId,
      rating: 1,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderComponent = (explanationId?: string) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ExplanationPanel
          explanation={mockExplanation}
          explanationId={explanationId}
          isLoading={false}
        />
      </QueryClientProvider>
    );
  };

  describe('Rating persists when user clicks thumbs up', () => {
    it('should save rating to database and show success toast', async () => {
      const user = userEvent.setup();

      // Render the component with an explanation
      renderComponent(mockExplanationId);

      // Verify explanation content is displayed
      expect(screen.getByText(/This function calculates the factorial/i)).toBeInTheDocument();
      expect(screen.getByText(/Understanding recursion is fundamental/i)).toBeInTheDocument();

      // Find and click the thumbs up button
      const thumbsUpButton = screen.getByTitle('Helpful');
      expect(thumbsUpButton).toBeInTheDocument();
      expect(thumbsUpButton).not.toBeDisabled();

      await user.click(thumbsUpButton);

      // Verify the upsert was called with correct data
      await waitFor(() => {
        expect(upsertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            explanation_id: mockExplanationId,
            user_id: mockUserId,
            rating: 1,
          }),
          expect.objectContaining({
            onConflict: 'explanation_id,user_id',
          })
        );
      });

      // Verify success toast was shown
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Rating saved!',
            description: 'Your feedback helps Metis Clew learn your preferences',
          })
        );
      });

      // Verify button has visual feedback (green highlight)
      expect(thumbsUpButton).toHaveClass('bg-green-500/20');
    });

    it('should save neutral rating when meh button clicked', async () => {
      const user = userEvent.setup();

      // Update upsert mock for neutral rating
      upsertMock = mockSupabaseUpsert(mockSupabaseClient, {
        rating: 0,
      });

      renderComponent(mockExplanationId);

      // Find and click the neutral (meh) button
      const mehButton = screen.getByTitle('Neutral');
      await user.click(mehButton);

      // Verify the upsert was called with rating = 0
      await waitFor(() => {
        expect(upsertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            rating: 0,
          }),
          expect.anything()
        );
      });

      // Verify button has visual feedback (yellow highlight)
      expect(mehButton).toHaveClass('bg-yellow-500/20');
    });

    it('should save negative rating when thumbs down button clicked', async () => {
      const user = userEvent.setup();

      // Update upsert mock for negative rating
      upsertMock = mockSupabaseUpsert(mockSupabaseClient, {
        rating: -1,
      });

      renderComponent(mockExplanationId);

      // Find and click the thumbs down button
      const thumbsDownButton = screen.getByTitle('Not helpful');
      await user.click(thumbsDownButton);

      // Verify the upsert was called with rating = -1
      await waitFor(() => {
        expect(upsertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            rating: -1,
          }),
          expect.anything()
        );
      });

      // Verify button has visual feedback (red highlight)
      expect(thumbsDownButton).toHaveClass('bg-red-500/20');
    });
  });

  describe('Error handling', () => {
    it('should show error toast when rating save fails', async () => {
      const user = userEvent.setup();

      // Mock an error response
      mockSupabaseError(mockSupabaseClient, 'Database connection failed');

      renderComponent(mockExplanationId);

      const thumbsUpButton = screen.getByTitle('Helpful');
      await user.click(thumbsUpButton);

      // Verify error toast was shown
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error saving rating',
            description: 'Database connection failed',
            variant: 'destructive',
          })
        );
      });
    });

    it('should show error when user is not authenticated', async () => {
      const user = userEvent.setup();

      // Mock unauthenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      renderComponent(mockExplanationId);

      const thumbsUpButton = screen.getByTitle('Helpful');
      await user.click(thumbsUpButton);

      // Verify authentication error toast was shown
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Authentication required',
            description: 'Please sign in to rate explanations',
            variant: 'destructive',
          })
        );
      });

      // Verify upsert was NOT called
      expect(upsertMock).not.toHaveBeenCalled();
    });

    it('should show error when explanation ID is missing', async () => {
      const user = userEvent.setup();

      // Render without explanation ID
      renderComponent(undefined);

      const thumbsUpButton = screen.getByTitle('Helpful');
      await user.click(thumbsUpButton);

      // Verify error toast was shown
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Cannot save rating',
            description: 'No explanation ID available',
            variant: 'destructive',
          })
        );
      });

      // Verify upsert was NOT called
      expect(upsertMock).not.toHaveBeenCalled();
    });
  });

  describe('UI state management', () => {
    it('should disable buttons while mutation is pending', async () => {
      const user = userEvent.setup();

      // Create a slow-resolving promise to simulate pending state
      let resolveUpsert: any;
      const slowUpsertPromise = new Promise((resolve) => {
        resolveUpsert = resolve;
      });

      const slowChainedMethods = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue(slowUpsertPromise),
      };

      mockSupabaseClient.from = jest.fn(() => ({
        upsert: jest.fn().mockReturnValue(slowChainedMethods),
      }));

      renderComponent(mockExplanationId);

      const thumbsUpButton = screen.getByTitle('Helpful');
      const mehButton = screen.getByTitle('Neutral');
      const thumbsDownButton = screen.getByTitle('Not helpful');

      // Click thumbs up
      await user.click(thumbsUpButton);

      // All buttons should be disabled while pending
      await waitFor(() => {
        expect(thumbsUpButton).toBeDisabled();
        expect(mehButton).toBeDisabled();
        expect(thumbsDownButton).toBeDisabled();
      });

      // Resolve the promise
      resolveUpsert({ data: { id: 'test' }, error: null });

      // Buttons should be enabled again
      await waitFor(() => {
        expect(thumbsUpButton).not.toBeDisabled();
        expect(mehButton).not.toBeDisabled();
        expect(thumbsDownButton).not.toBeDisabled();
      });
    });

    it('should update rating when user changes their mind', async () => {
      const user = userEvent.setup();

      renderComponent(mockExplanationId);

      // First, click thumbs up
      const thumbsUpButton = screen.getByTitle('Helpful');
      await user.click(thumbsUpButton);

      await waitFor(() => {
        expect(thumbsUpButton).toHaveClass('bg-green-500/20');
      });

      // Then click thumbs down
      const thumbsDownButton = screen.getByTitle('Not helpful');

      // Update mock for new rating
      upsertMock = mockSupabaseUpsert(mockSupabaseClient, { rating: -1 });

      await user.click(thumbsDownButton);

      // Verify upsert was called twice with different ratings
      await waitFor(() => {
        expect(upsertMock).toHaveBeenCalled();
      });

      // Verify visual state changed
      expect(thumbsDownButton).toHaveClass('bg-red-500/20');
    });
  });

  describe('Loading and empty states', () => {
    it('should show loading state', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ExplanationPanel
            explanation={null}
            isLoading={true}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText(/ANALYZING/i)).toBeInTheDocument();
    });

    it('should show empty state when no explanation', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ExplanationPanel
            explanation={null}
            isLoading={false}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText(/Select code in the interactive view/i)).toBeInTheDocument();
    });
  });
});
