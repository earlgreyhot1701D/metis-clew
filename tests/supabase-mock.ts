export interface MockSupabaseClient {
  auth: {
    getUser: jest.Mock;
    getSession: jest.Mock;
  };
  from: jest.Mock;
  functions: {
    invoke: jest.Mock;
  };
}

export const createMockSupabaseClient = (): MockSupabaseClient => {
  const mockFrom = jest.fn(() => ({
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  }));

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      }),
    },
    from: mockFrom,
    functions: {
      invoke: jest.fn().mockResolvedValue({
        data: {
          explanation: {
            whatItDoes: 'This is a test explanation',
            whyItMatters: 'It helps understand the code',
            keyConcepts: ['testing', 'mocking'],
            relatedPatterns: ['unit testing', 'integration testing'],
          },
          explanationId: 'test-explanation-id',
        },
        error: null,
      }),
    },
  };
};

export const mockSupabaseUpsert = (mockClient: MockSupabaseClient, response: any = {}) => {
  const chainedMethods = {
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'test-rating-id',
        explanation_id: 'test-explanation-id',
        user_id: 'test-user-id',
        rating: 1,
        created_at: new Date().toISOString(),
        ...response,
      },
      error: null,
    }),
  };

  const upsertMock = jest.fn().mockReturnValue(chainedMethods);

  mockClient.from = jest.fn(() => ({
    upsert: upsertMock,
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  }));

  return upsertMock;
};

export const mockSupabaseError = (mockClient: MockSupabaseClient, errorMessage: string) => {
  const chainedMethods = {
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: null,
      error: { message: errorMessage },
    }),
  };

  mockClient.from = jest.fn(() => ({
    upsert: jest.fn().mockReturnValue(chainedMethods),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: { message: errorMessage } }),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  }));
};
