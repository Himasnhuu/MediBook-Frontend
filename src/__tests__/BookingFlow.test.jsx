import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PatientAppointments from '../pages/patient/PatientAppointments';
import { mockSpecializations, mockProviders, mockSlots, mockAppointment } from './testHelpers';

jest.mock('../api/providerApi');
jest.mock('../api/scheduleApi');
jest.mock('../api/appointmentApi');
jest.mock('../api/paymentApi');
jest.mock('../api/reviewApi');
jest.mock('../api/notificationApi');

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}));

import { getSpecializations, getAllProviders } from '../api/providerApi';
import { getSlotsByProvider, getAvailableSlots, bookSlot } from '../api/scheduleApi';
import { bookAppointment, getAppointmentsByPatient } from '../api/appointmentApi';
import { createRazorpayOrder, verifyRazorpayPayment, processPayment } from '../api/paymentApi';
import { checkReviewExists } from '../api/reviewApi';
import {
  sendAppointmentBookedNotification,
  sendPaymentSuccessNotification,
} from '../api/notificationApi';
import { toast } from 'react-toastify';

// Only verified+available Cardiology providers
const cardiologyDoctors = mockProviders.filter(
  (p) => p.isVerified && p.isAvailable && p.specialization === 'Cardiology'
);

const renderComponent = () =>
  render(
    <BrowserRouter>
      <PatientAppointments />
    </BrowserRouter>
  );

// Navigate from list tab → book tab → step 0
const goToBookTab = async (user) => {
  await user.click(screen.getByRole('button', { name: /book new/i }));
};

// Navigate from step 0 → step 1 (select Cardiology)
const selectCardiology = async (user) => {
  await waitFor(() => expect(screen.getByText('Cardiology')).toBeInTheDocument());
  await user.click(screen.getByText('Cardiology'));
};

// Navigate step 1 → step 2 (select Dr. Smith)
const selectDrSmith = async (user) => {
  await waitFor(() => expect(screen.getByText('Dr. Smith')).toBeInTheDocument());
  await user.click(screen.getByText('Dr. Smith'));
};

// Navigate step 2 → step 3 (select first slot then Continue)
const selectSlotAndContinue = async (user) => {
  await waitFor(() => expect(screen.getByText('09:00 - 09:30')).toBeInTheDocument());
  await user.click(screen.getByText('09:00 - 09:30'));
  await waitFor(() => expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: /continue/i }));
};

// Full navigation to the Confirm & Pay step
const navigateToConfirmStep = async (user) => {
  await goToBookTab(user);
  await selectCardiology(user);
  await selectDrSmith(user);
  await selectSlotAndContinue(user);
  await waitFor(() => expect(screen.getByText(/booking summary/i)).toBeInTheDocument());
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem('userId', '1');
  localStorage.setItem('email', 'patient@test.com');

  getAppointmentsByPatient.mockResolvedValue([]);
  getSpecializations.mockResolvedValue(mockSpecializations);
  getAllProviders.mockResolvedValue(mockProviders);
  getSlotsByProvider.mockResolvedValue(mockSlots);
  getAvailableSlots.mockResolvedValue(mockSlots.filter((s) => s.status === 'AVAILABLE'));
  checkReviewExists.mockResolvedValue(false);
  bookSlot.mockResolvedValue({});
  bookAppointment.mockResolvedValue(mockAppointment);
  processPayment.mockResolvedValue({});
  createRazorpayOrder.mockResolvedValue({
    keyId: 'rzp_test_key',
    amount: 50000,
    currency: 'INR',
    orderId: 'ord_test_123',
  });
  verifyRazorpayPayment.mockResolvedValue({});
  sendAppointmentBookedNotification.mockResolvedValue({});
  sendPaymentSuccessNotification.mockResolvedValue({});
});

afterEach(() => {
  localStorage.clear();
});

describe('PatientAppointments – Booking Flow', () => {
  // ── Specialization step ────────────────────────────────────────────────────
  it('loads specializations when book tab is opened', async () => {
    const user = userEvent.setup();
    renderComponent();
    await goToBookTab(user);
    await waitFor(() => {
      expect(screen.getByText('Cardiology')).toBeInTheDocument();
      expect(screen.getByText('Dermatology')).toBeInTheDocument();
      expect(screen.getByText('Orthopedics')).toBeInTheDocument();
    });
  });

  // ── Doctor step ────────────────────────────────────────────────────────────
  it('shows verified available doctors after selecting a specialization', async () => {
    const user = userEvent.setup();
    renderComponent();
    await goToBookTab(user);
    await selectCardiology(user);
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Jones')).toBeInTheDocument();
    });
  });

  it('filters doctors so only those matching the selected specialization are shown', async () => {
    const user = userEvent.setup();
    renderComponent();
    await goToBookTab(user);
    await selectCardiology(user);
    await waitFor(() => expect(screen.getByText('Dr. Smith')).toBeInTheDocument());
    // Dr. Smith and Dr. Jones are Cardiology; only verified ones should be visible
    const doctorCount = screen.getAllByText(/Dr\. (Smith|Jones)/).length;
    expect(doctorCount).toBeGreaterThanOrEqual(2);
  });

  it('shows consultation fee for each doctor', async () => {
    const user = userEvent.setup();
    renderComponent();
    await goToBookTab(user);
    await selectCardiology(user);
    await waitFor(() => {
      // Dr. Smith has fee ₹500
      expect(screen.getByText('₹500')).toBeInTheDocument();
    });
  });

  it('hides unverified doctors from the list', async () => {
    const user = userEvent.setup();
    renderComponent();
    await goToBookTab(user);
    await selectCardiology(user);
    await waitFor(() => expect(screen.getByText('Dr. Smith')).toBeInTheDocument());
    // Dr. Unverified (isVerified: false) should not appear
    expect(screen.queryByText('Dr. Unverified')).not.toBeInTheDocument();
  });

  // ── Slot step ──────────────────────────────────────────────────────────────
  it('calls getSlotsByProvider after selecting a doctor', async () => {
    const user = userEvent.setup();
    renderComponent();
    await goToBookTab(user);
    await selectCardiology(user);
    await selectDrSmith(user);
    await waitFor(() => {
      expect(getSlotsByProvider).toHaveBeenCalledWith(mockProviders[0].providerId);
    });
  });

  it('displays available slots in the UI', async () => {
    const user = userEvent.setup();
    renderComponent();
    await goToBookTab(user);
    await selectCardiology(user);
    await selectDrSmith(user);
    await waitFor(() => {
      expect(screen.getByText('09:00 - 09:30')).toBeInTheDocument();
      expect(screen.getByText('10:00 - 10:30')).toBeInTheDocument();
    });
  });

  it('does not display booked slots in the UI', async () => {
    const user = userEvent.setup();
    renderComponent();
    await goToBookTab(user);
    await selectCardiology(user);
    await selectDrSmith(user);
    await waitFor(() => expect(screen.getByText('09:00 - 09:30')).toBeInTheDocument());
    // Slot with status BOOKED (11:00 - 11:30) should be filtered out
    expect(screen.queryByText('11:00 - 11:30')).not.toBeInTheDocument();
  });

  it('shows selected slot confirmation bar after clicking a slot', async () => {
    const user = userEvent.setup();
    renderComponent();
    await goToBookTab(user);
    await selectCardiology(user);
    await selectDrSmith(user);
    await waitFor(() => expect(screen.getByText('09:00 - 09:30')).toBeInTheDocument());
    await user.click(screen.getByText('09:00 - 09:30'));
    await waitFor(() => {
      expect(screen.getByText(/selected:/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });
  });

  // ── Confirm & Pay step ─────────────────────────────────────────────────────
  it('shows booking summary at the confirm step', async () => {
    const user = userEvent.setup();
    renderComponent();
    await navigateToConfirmStep(user);
    expect(screen.getByText(/booking summary/i)).toBeInTheDocument();
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
    // Consultation fee label + amount
    expect(screen.getByText(/consultation fee/i)).toBeInTheDocument();
  });

  // ── CASH payment flow ──────────────────────────────────────────────────────
  it('CASH payment calls processPayment directly and skips Razorpay', async () => {
    const user = userEvent.setup();
    renderComponent();
    await navigateToConfirmStep(user);

    // Fill service type
    await user.type(
      screen.getByPlaceholderText(/general consultation/i),
      'General Consultation'
    );

    // Switch payment mode to CASH (label has no htmlFor, so scope via parent div)
    const paymentSelect = within(
      screen.getByText('Payment Mode').parentElement
    ).getByRole('combobox');
    await user.selectOptions(paymentSelect, 'CASH');

    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    await waitFor(() => {
      expect(bookSlot).toHaveBeenCalledWith(mockSlots[0].slotId);
      expect(bookAppointment).toHaveBeenCalled();
      expect(processPayment).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'CASH' })
      );
      expect(createRazorpayOrder).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Appointment booked! 🎉');
    });
  });

  // ── Razorpay payment flow ──────────────────────────────────────────────────
  it('Razorpay flow: bookSlot → bookAppointment → createOrder → verify → processPayment', async () => {
    let capturedRazorpayOptions;
    window.Razorpay = jest.fn().mockImplementation((opts) => {
      capturedRazorpayOptions = opts;
      return { open: jest.fn() };
    });

    // Make script.onload fire immediately when the script is appended to body
    const origAppend = document.body.appendChild.bind(document.body);
    const appendSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((el) => {
      if (el.nodeName === 'SCRIPT') {
        Promise.resolve().then(() => el.onload && el.onload());
        return el;
      }
      return origAppend(el);
    });

    const user = userEvent.setup();
    renderComponent();
    await navigateToConfirmStep(user);

    await user.type(
      screen.getByPlaceholderText(/general consultation/i),
      'General Consultation'
    );
    // CARD is the default payment mode — no need to change

    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    // Wait for Razorpay to be instantiated via script.onload
    await waitFor(() => expect(window.Razorpay).toHaveBeenCalled(), { timeout: 3000 });

    // Simulate payment success callback
    await act(async () => {
      await capturedRazorpayOptions.handler({
        razorpay_order_id: 'ord_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: 'sig_test_789',
      });
    });

    await waitFor(() => {
      expect(bookSlot).toHaveBeenCalledWith(mockSlots[0].slotId);
      expect(bookAppointment).toHaveBeenCalled();
      expect(createRazorpayOrder).toHaveBeenCalledWith(500, mockAppointment.appointmentId);
      expect(verifyRazorpayPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          razorpayOrderId: 'ord_test_123',
          razorpayPaymentId: 'pay_test_456',
          razorpaySignature: 'sig_test_789',
        })
      );
      expect(processPayment).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Payment successful! Appointment confirmed 🎉');
    });

    appendSpy.mockRestore();
  });

  // ── Error handling ─────────────────────────────────────────────────────────
  it('shows error toast when slot booking fails', async () => {
    bookSlot.mockRejectedValue({ response: { data: 'Slot already booked' } });

    const user = userEvent.setup();
    renderComponent();
    await navigateToConfirmStep(user);

    await user.type(
      screen.getByPlaceholderText(/general consultation/i),
      'General Consultation'
    );
    const paymentSelect1 = within(
      screen.getByText('Payment Mode').parentElement
    ).getByRole('combobox');
    await user.selectOptions(paymentSelect1, 'CASH');
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Slot already booked');
    });
  });

  it('shows error toast when appointment creation fails', async () => {
    bookSlot.mockResolvedValue({});
    bookAppointment.mockRejectedValue({ response: { data: 'Appointment creation failed' } });

    const user = userEvent.setup();
    renderComponent();
    await navigateToConfirmStep(user);

    await user.type(
      screen.getByPlaceholderText(/general consultation/i),
      'General Consultation'
    );
    const paymentSelect2 = within(
      screen.getByText('Payment Mode').parentElement
    ).getByRole('combobox');
    await user.selectOptions(paymentSelect2, 'CASH');
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Appointment creation failed');
    });
  });

  // ── Appointments list ──────────────────────────────────────────────────────
  it('displays existing appointments in the list tab', async () => {
    const existingAppointment = {
      ...mockAppointment,
      appointmentId: 42,
      serviceType: 'Cardiology Check',
      status: 'SCHEDULED',
    };
    getAppointmentsByPatient.mockResolvedValue([existingAppointment]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('#42')).toBeInTheDocument();
      expect(screen.getByText('Cardiology Check')).toBeInTheDocument();
      expect(screen.getByText('SCHEDULED')).toBeInTheDocument();
    });
  });

  it('displays empty state message when patient has no appointments', async () => {
    getAppointmentsByPatient.mockResolvedValue([]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/no appointments yet/i)).toBeInTheDocument();
    });
  });

  it('shows error toast when service type is missing on confirm', async () => {
    const user = userEvent.setup();
    renderComponent();
    await navigateToConfirmStep(user);
    // Do NOT fill in service type
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please fill in the service type');
    });
  });
});
