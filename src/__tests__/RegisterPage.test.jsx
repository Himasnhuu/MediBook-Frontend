import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../pages/auth/RegisterPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../api/authApi');
jest.mock('../api/providerApi');

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}));

import { registerUser, sendOtp, verifyOtp } from '../api/authApi';
import { getSpecializations } from '../api/providerApi';
import { toast } from 'react-toastify';

const renderRegister = () =>
  render(
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>
  );

// A valid password that passes all validatePassword checks
const STRONG_PASSWORD = 'Password1!';
// Weak password — no uppercase, no digit, no symbol
const WEAK_PASSWORD = 'password';

const fillForm = async (user, overrides = {}) => {
  const values = {
    fullName: 'Test User',
    email: 'test@medibook.com',
    phone: '9876543210',
    password: STRONG_PASSWORD,
    confirmPassword: STRONG_PASSWORD,
    ...overrides,
  };
  await user.type(screen.getByPlaceholderText('Enter your full name'), values.fullName);
  await user.type(screen.getByPlaceholderText('Enter your email'), values.email);
  await user.type(screen.getByPlaceholderText('Enter your phone number'), values.phone);
  await user.type(screen.getByPlaceholderText('Min 6 characters'), values.password);
  await user.type(screen.getByPlaceholderText('Re-enter your password'), values.confirmPassword);
};

beforeEach(() => {
  jest.clearAllMocks();
  getSpecializations.mockResolvedValue([]);
});

describe('RegisterPage', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────
  it('renders all required form fields', async () => {
    renderRegister();
    // findBy* waits for the useEffect/getSpecializations to settle
    expect(await screen.findByPlaceholderText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min 6 characters')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Re-enter your password')).toBeInTheDocument();
  });

  it('renders PATIENT and Doctor role selection buttons', async () => {
    renderRegister();
    expect(await screen.findByRole('button', { name: /patient/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /doctor/i })).toBeInTheDocument();
  });

  it('renders a Login here link', async () => {
    renderRegister();
    expect(await screen.findByText('Login here')).toBeInTheDocument();
  });

  // ── Password validation ────────────────────────────────────────────────────
  it('shows error toast when password is weak (less than 8 chars)', async () => {
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { password: 'abc', confirmPassword: 'abc' });
    await user.click(screen.getByRole('button', { name: /send verification otp/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Password requirements not met')
      );
    });
  });

  it('shows error toast when password has no uppercase letter', async () => {
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { password: 'password1!', confirmPassword: 'password1!' });
    await user.click(screen.getByRole('button', { name: /send verification otp/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('At least one uppercase letter')
      );
    });
  });

  it('shows error toast when passwords do not match', async () => {
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, { password: STRONG_PASSWORD, confirmPassword: 'DifferentPass1!' });
    await user.click(screen.getByRole('button', { name: /send verification otp/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Passwords do not match');
    });
  });

  it('shows error toast when required fields are empty', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.click(screen.getByRole('button', { name: /send verification otp/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please fill in all fields');
    });
  });

  // ── OTP flow ───────────────────────────────────────────────────────────────
  it('calls sendOtp with the email after valid form submission', async () => {
    sendOtp.mockResolvedValue('OTP sent');
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /send verification otp/i }));
    await waitFor(() => {
      expect(sendOtp).toHaveBeenCalledWith('test@medibook.com');
    });
  });

  it('shows OTP step with OTP input after sending OTP', async () => {
    sendOtp.mockResolvedValue('OTP sent');
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /send verification otp/i }));
    await waitFor(() => {
      expect(screen.getByText('Verify Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('_ _ _ _ _ _')).toBeInTheDocument();
    });
  });

  it('renders Verify & Create Account button on OTP step', async () => {
    sendOtp.mockResolvedValue('OTP sent');
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /send verification otp/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify.*create account/i })).toBeInTheDocument();
    });
  });

  it('calls verifyOtp and registerUser on OTP submit, then navigates to login', async () => {
    sendOtp.mockResolvedValue('OTP sent');
    verifyOtp.mockResolvedValue('verified');
    registerUser.mockResolvedValue({ id: 1 });

    const user = userEvent.setup();
    renderRegister();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /send verification otp/i }));

    await waitFor(() => expect(screen.getByPlaceholderText('_ _ _ _ _ _')).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText('_ _ _ _ _ _'), '123456');
    await user.click(screen.getByRole('button', { name: /verify.*create account/i }));

    await waitFor(() => {
      expect(verifyOtp).toHaveBeenCalledWith('test@medibook.com', '123456');
      expect(registerUser).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Test User',
          email: 'test@medibook.com',
          passwordHash: STRONG_PASSWORD,
          phone: '9876543210',
          role: 'PATIENT',
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Account created successfully! Please login.');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error toast when OTP send fails', async () => {
    const error = { response: { data: 'Email service unavailable' } };
    sendOtp.mockRejectedValue(error);

    const user = userEvent.setup();
    renderRegister();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /send verification otp/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email service unavailable');
    });
  });

  it('shows error toast when OTP verification fails', async () => {
    sendOtp.mockResolvedValue('OTP sent');
    verifyOtp.mockRejectedValue(new Error('Wrong OTP'));

    const user = userEvent.setup();
    renderRegister();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /send verification otp/i }));

    await waitFor(() => expect(screen.getByPlaceholderText('_ _ _ _ _ _')).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText('_ _ _ _ _ _'), '000000');
    await user.click(screen.getByRole('button', { name: /verify.*create account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid OTP. Please try again.');
    });
  });

  it('back button from OTP step returns to the registration form', async () => {
    sendOtp.mockResolvedValue('OTP sent');
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /send verification otp/i }));

    await waitFor(() => expect(screen.getByText('Verify Email')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /back to edit/i }));

    await waitFor(() => {
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });
  });
});
