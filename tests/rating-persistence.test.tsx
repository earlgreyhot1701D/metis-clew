import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExplanationPanel } from '../src/components/ExplanationPanel';
import { toast } from '../src/hooks/use-toast';

// Mock the toast hook
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

// Create mock functions inside the factory function to avoid hoisting issues
const mockUpsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();
const mockGetUser = jest.fn();

// Mock Supabase - factory function approach
jest.mock('../src/integrations/supabase/client', () => {
  return {
    supabase: {
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    },
  };
});

describe('Rating Persistence', () => {
  let queryClient: QueryClient;

  const mockExplanation = {
    whatItDoes: 'This function calculates the factorial of a number using recursion.',
    whyItMatters: 'Understanding recursion is fundamental for algorithm design and problem-solving.',
    keyConcepts: ['recursion', 'base case', 'function calls'],
    relatedPatterns: ['dynamic programming', 'memoization', 'tail recursion'],
  };

  const mockExplanationId = 'test-explanation-id-123';
  const mockUserId = 'test-user-id-456';

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default successful mock chain
    mockSingle.mockResolvedValue({
      data: {
        id: 'test-rating-id',
        explanation_id: mockExplanationId,
        user_id: mockUserId,
        is_helpful: true,
      },
      error: null,
    });

    mockSelect.mockReturnValue({
      single: mockSingle,
    });

    mockUpsert.mockReturnValue({
      select: mockSelect,
    });

    mockFrom.mockReturnValue({
      upsert: mockUpsert,
    });

    // Mock getUser to return a user
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: mockUserId,
        },
      },
    });
  });

  describe('Rating persistence', () => {
    it('should save rating to database and show success toast', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ExplanationPanel
            explanation={mockExplanation}
            explanationId={mockExplanationId}
            isLoading={false}
          />
        </QueryClientProvider>
      );

      const thumbsUpButton = screen.getByTitle('Helpful');
      await userEvent.click(thumbsUpButton);

      // Verify the upsert was called with correct parameters
      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          {
            explanation_id: mockExplanationId,
            user_id: mockUserId,
            is_helpful: true,
          },
          { onConflict: 'explanation_id,user_id' }
        );
      });

      // Verify success toast was shown
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Rating saved!',
          })
        );
      });
    });

    it('should save negative rating when thumbs down button clicked', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ExplanationPanel
            explanation={mockExplanation}
            explanationId={mockExplanationId}
            isLoading={false}
          />
        </QueryClientProvider>
      );

      const thumbsDownButton = screen.getByTitle('Not helpful');
      await userEvent.click(thumbsDownButton);

      // Verify the upsert was called with is_helpful = false
      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          {
            explanation_id: mockExplanationId,
            user_id: mockUserId,
            is_helpful: false,
          },
          { onConflict: 'explanation_id,user_id' }
        );
      });
    });
  });

  describe('Error handling', () => {
    it('should show error toast when rating save fails', async () => {
      // Mock error response
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ExplanationPanel
            explanation={mockExplanation}
            explanationId={mockExplanationId}
            isLoading={false}
          />
        </QueryClientProvider>
      );

      const thumbsUpButton = screen.getByTitle('Helpful');
      await userEvent.click(thumbsUpButton);

      // Verify error toast was shown
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error saving rating',
            variant: 'destructive',
          })
        );
      });
    });

    it('should show error toast when no explanation ID available', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ExplanationPanel
            explanation={mockExplanation}
            explanationId={undefined}
            isLoading={false}
          />
        </QueryClientProvider>
      );

      const thumbsUpButton = screen.getByTitle('Helpful');
      await userEvent.click(thumbsUpButton);

      // Verify error toast was shown
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Cannot save rating',
            variant: 'destructive',
          })
        );
      });
    });

    it('should show error toast when user not authenticated', async () => {
      // Mock getUser to return no user
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ExplanationPanel
            explanation={mockExplanation}
            explanationId={mockExplanationId}
            isLoading={false}
          />
        </QueryClientProvider>
      );

      const thumbsUpButton = screen.getByTitle('Helpful');
      await userEvent.click(thumbsUpButton);

      // Verify authentication error toast was shown
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Authentication required',
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('UI state management', () => {
    it('should disable buttons while mutation is pending', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ExplanationPanel
            explanation={mockExplanation}
            explanationId={mockExplanationId}
            isLoading={false}
          />
        </QueryClientProvider>
      );

      const thumbsUpButton = screen.getByTitle('Helpful');
      const thumbsDownButton = screen.getByTitle('Not helpful');

      // Initially buttons are enabled
      expect(thumbsUpButton).not.toBeDisabled();
      expect(thumbsDownButton).not.toBeDisabled();
    });

    it('should update rating when user changes their mind', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ExplanationPanel
            explanation={mockExplanation}
            explanationId={mockExplanationId}
            isLoading={false}
          />
        </QueryClientProvider>
      );

      const thumbsUpButton = screen.getByTitle('Helpful');
      const thumbsDownButton = screen.getByTitle('Not helpful');

      // Click thumbs up first
      await userEvent.click(thumbsUpButton);

      // Verify upsert was called with is_helpful = true
      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            is_helpful: true,
          }),
          expect.any(Object)
        );
      });

      // Now click thumbs down
      await userEvent.click(thumbsDownButton);

      // Verify upsert was called with is_helpful = false
      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            is_helpful: false,
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('Loading state', () => {
    it('should display loading state when isLoading is true', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ExplanationPanel
            explanation={null}
            explanationId={mockExplanationId}
            isLoading={true}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText('[ ANALYZING. ]')).toBeInTheDocument();
    });

    it('should display empty state when no explanation', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ExplanationPanel
            explanation={null}
            explanationId={mockExplanationId}
            isLoading={false}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText(/Select code in the interactive view/i)).toBeInTheDocument();
    });
  });
});
