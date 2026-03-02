import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock authService
vi.mock('@/services', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

import { authService } from '@/services';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';

// Create a fresh store for each test
function createTestStore() {
  return configureStore({
    reducer: {
      user: (state = { user: null, token: null, isLogin: false }, action: any) => {
        switch (action.type) {
          case 'user/login':
            return { user: action.payload.user, token: action.payload.token, isLogin: true };
          case 'user/logout':
            return { user: null, token: null, isLogin: false };
          default:
            return state;
        }
      },
    },
  });
}

function wrapper({ children }: { children: React.ReactNode }) {
  const store = createTestStore();
  return (
    <Provider store={store}>
      <AuthProvider>{children}</AuthProvider>
    </Provider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial unauthenticated state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for loading to finish
    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login succeeds with valid credentials', async () => {
    const mockResponse = {
      status: 200,
      data: {
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@test.com',
          name: 'Admin',
          surname: 'User',
          role: 'administrator',
          roles: ['Super Admin'],
          permissions: ['armoires.voir'],
          is_active: true,
        },
        token: 'test-token-123',
      },
    };

    (authService.login as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let loginResult: boolean;
    await act(async () => {
      loginResult = await result.current.login('admin', 'password');
    });

    expect(loginResult!).toBe(true);
    expect(authService.login).toHaveBeenCalledWith({ username: 'admin', password: 'password' });
  });

  it('login fails with invalid credentials', async () => {
    (authService.login as any).mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let loginResult: boolean;
    await act(async () => {
      loginResult = await result.current.login('wrong', 'wrong');
    });

    expect(loginResult!).toBe(false);
  });

  it('hasPermission returns false when no user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPermission('armoires.voir')).toBe(false);
  });
});
