import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock permission hooks
const mockUsePermission = vi.fn();
const mockUseHasAnyPermission = vi.fn();
const mockUseHasAnyRole = vi.fn();
vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => mockUsePermission(),
  useHasAnyPermission: () => mockUseHasAnyPermission(),
  useHasAnyRole: () => mockUseHasAnyRole(),
}));

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const renderWithRouter = (ui: React.ReactElement, initialRoute = '/protected') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        <Route path="/protected" element={ui} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockUseHasAnyPermission.mockReturnValue(true);
    mockUseHasAnyRole.mockReturnValue(true);
  });

  it('shows loader when auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when user is authenticated with no permission required', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test', roles: ['Admin'], permissions: [] },
      isLoading: false,
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to unauthorized when user lacks required permission', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test', roles: ['Observateur'], permissions: [] },
      isLoading: false,
    });
    mockUsePermission.mockReturnValue(false);

    renderWithRouter(
      <ProtectedRoute permission="armoires.creer">
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });

  it('shows error page when showError is true and user is unauthorized', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test', roles: ['Observateur'], permissions: [] },
      isLoading: false,
    });
    mockUsePermission.mockReturnValue(false);

    renderWithRouter(
      <ProtectedRoute permission="armoires.creer" showError>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Accès non autorisé')).toBeInTheDocument();
  });

  it('redirects to unauthorized when user lacks required role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test', roles: ['Observateur'], permissions: [] },
      isLoading: false,
    });
    mockUseHasAnyRole.mockReturnValue(false);

    renderWithRouter(
      <ProtectedRoute anyRole={['Super Admin']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });
});
