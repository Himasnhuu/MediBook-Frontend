import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';

// Variables prefixed with 'mock' are exempt from jest.mock hoisting rules
const mockNavigate = jest.fn();
const mockLogin = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

jest.mock('../api/authApi');
jest.mock('../api/providerApi');
jest.mock('../utils/tokenUtils');

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}));

import { loginUser, getUserByEmail } from '../api/authApi';
import { getProviderByUserId } from '../api/providerApi';
import { parseToken } from '../utils/tokenUtils';
import { toast } from 'react-toastify';

const renderLogin = () =>
  render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('LoginPage', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────
  it('renders email and password input fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('renders the Login submit button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('renders a Register here link', () => {
    renderLogin();
    expect(screen.getByText('Register here')).toBeInTheDocument();
  });

  it('renders a Forgot Password? link', () => {
    renderLogin();
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
  });

  // ── Validation ─────────────────────────────────────────────────────────────
  it('shows error toast when form is submitted empty', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(toast.error).toHaveBeenCalledWith('Please enter email and password');
  });

  // ── PATIENT login ──────────────────────────────────────────────────────────
  it('navigates to patient dashboard on PATIENT login', async () => {
    loginUser.mockResolvedValue('fake.jwt.token');
    getUserByEmail.mockResolvedValue({ id: 1, fullName: 'Rohit Patient' });
    parseToken.mockReturnValue({ role: 'PATIENT', sub: 'rohit@medibook.com' });

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('Enter your email'), 'rohit@medibook.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'Password1!');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith('rohit@medibook.com', 'Password1!');
      expect(mockNavigate).toHaveBeenCalledWith('/patient');
    });
  });

  // ── PROVIDER login ─────────────────────────────────────────────────────────
  it('fetches providerId and navigates to provider dashboard on PROVIDER login', async () => {
    loginUser.mockResolvedValue('fake.jwt.token');
    getUserByEmail.mockResolvedValue({ id: 2, fullName: 'Dr. Provider' });
    parseToken.mockReturnValue({ role: 'PROVIDER', sub: 'dr@medibook.com' });
    getProviderByUserId.mockResolvedValue({ providerId: 3 });

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('Enter your email'), 'dr@medibook.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'Password1!');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(getProviderByUserId).toHaveBeenCalledWith(2);
      expect(localStorage.getItem('providerId')).toBe('3');
      expect(mockNavigate).toHaveBeenCalledWith('/provider');
    });
  });

  // ── ADMIN login ────────────────────────────────────────────────────────────
  it('navigates to admin dashboard on ADMIN login', async () => {
    loginUser.mockResolvedValue('fake.jwt.token');
    getUserByEmail.mockResolvedValue({ id: 3, fullName: 'Admin User' });
    parseToken.mockReturnValue({ role: 'ADMIN', sub: 'admin@medibook.com' });

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('Enter your email'), 'admin@medibook.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'Password1!');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  // ── Error handling ─────────────────────────────────────────────────────────
  it('shows server error message when credentials are invalid', async () => {
    const error = { response: { data: 'Invalid credentials' } };
    loginUser.mockRejectedValue(error);

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('Enter your email'), 'wrong@medibook.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('shows fallback error message on network failure', async () => {
    loginUser.mockRejectedValue(new Error('Network Error'));

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('Enter your email'), 'test@medibook.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'somepass');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid email or password');
    });
  });

  // ── localStorage ───────────────────────────────────────────────────────────
  it('clears localStorage at the start of each login attempt', async () => {
    loginUser.mockResolvedValue('fake.jwt.token');
    getUserByEmail.mockResolvedValue({ id: 1, fullName: 'Test User' });
    parseToken.mockReturnValue({ role: 'PATIENT', sub: 'test@medibook.com' });

    localStorage.setItem('staleKey', 'staleValue');

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('Enter your email'), 'test@medibook.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'Password1!');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      // staleKey should be gone; the new login data should be set
      expect(localStorage.getItem('staleKey')).toBeNull();
      expect(localStorage.getItem('userId')).toBe('1');
    });
  });
});
