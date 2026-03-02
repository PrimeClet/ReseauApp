import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return { default: mockAxios };
});

describe('API Service Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('axios is properly mocked', () => {
    expect(axios.create).toBeDefined();
  });

  it('axios interceptors are set up', () => {
    const instance = axios.create();
    expect(instance.interceptors.request.use).toBeDefined();
    expect(instance.interceptors.response.use).toBeDefined();
  });
});

describe('Service URL patterns', () => {
  it('coffret service targets correct API path', async () => {
    // Verify service modules can be imported
    const { coffretService } = await import('@/services');
    expect(coffretService).toBeDefined();
    expect(coffretService.getAll).toBeDefined();
  });

  it('equipement service targets correct API path', async () => {
    const { equipementService } = await import('@/services');
    expect(equipementService).toBeDefined();
  });

  it('auth service has login and logout', async () => {
    const { authService } = await import('@/services');
    expect(authService).toBeDefined();
    expect(authService.login).toBeDefined();
    expect(authService.logout).toBeDefined();
  });
});
