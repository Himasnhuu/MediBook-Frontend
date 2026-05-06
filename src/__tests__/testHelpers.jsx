import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { createContext, useContext } from 'react';

// Minimal AuthContext for wrapping components that need it
const MockAuthContext = createContext(null);

export const mockPatient = {
  token: 'mock-token',
  role: 'PATIENT',
  email: 'rohit@medibook.com',
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: () => true,
  isPatient: () => true,
  isProvider: () => false,
  isAdmin: () => false,
};

export const mockProvider = {
  token: 'mock-token',
  role: 'PROVIDER',
  email: 'provider@medibook.com',
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: () => true,
  isPatient: () => false,
  isProvider: () => true,
  isAdmin: () => false,
  providerId: 3,
  userId: 2,
};

export const mockAdmin = {
  token: 'mock-token',
  role: 'ADMIN',
  email: 'admin@medibook.com',
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: () => true,
  isPatient: () => false,
  isProvider: () => false,
  isAdmin: () => true,
  userId: 3,
};

export const renderWithProviders = (ui, { authValue = mockPatient } = {}) => {
  return render(
    <MockAuthContext.Provider value={authValue}>
      <BrowserRouter>{ui}</BrowserRouter>
    </MockAuthContext.Provider>
  );
};

// Mock data factories
export const mockSpecializations = [
  { id: 1, name: 'Cardiology' },
  { id: 2, name: 'Dermatology' },
  { id: 3, name: 'Orthopedics' },
];

export const mockProviders = [
  {
    providerId: 1,
    doctorName: 'Smith',
    specialization: 'Cardiology',
    isVerified: true,
    isAvailable: true,
    consultationFee: 500,
    rating: 4.5,
    clinicName: 'City Clinic',
    clinicAddress: '123 Main St',
    qualification: 'MBBS',
    experienceYears: 10,
    profilePhotoUrl: null,
  },
  {
    providerId: 2,
    doctorName: 'Jones',
    specialization: 'Cardiology',
    isVerified: true,
    isAvailable: true,
    consultationFee: 600,
    rating: 4.0,
    clinicName: 'Health Plus',
    clinicAddress: '456 Oak Ave',
    qualification: 'MD',
    experienceYears: 8,
    profilePhotoUrl: null,
  },
  {
    providerId: 3,
    doctorName: 'Unverified',
    specialization: 'Cardiology',
    isVerified: false,
    isAvailable: true,
    consultationFee: 400,
    rating: 3.5,
    clinicName: 'Med Center',
    clinicAddress: '789 Pine Rd',
    qualification: 'MBBS',
    experienceYears: 2,
    profilePhotoUrl: null,
  },
];

export const mockSlots = [
  {
    slotId: 1,
    providerId: 1,
    date: '2099-12-30',
    startTime: '09:00',
    endTime: '09:30',
    status: 'AVAILABLE',
  },
  {
    slotId: 2,
    providerId: 1,
    date: '2099-12-30',
    startTime: '10:00',
    endTime: '10:30',
    status: 'AVAILABLE',
  },
  {
    slotId: 3,
    providerId: 1,
    date: '2099-12-30',
    startTime: '11:00',
    endTime: '11:30',
    status: 'BOOKED',
  },
];

export const mockAppointment = {
  appointmentId: 101,
  patientId: 1,
  providerId: 1,
  slotId: 1,
  serviceType: 'General Consultation',
  appointmentDate: '2099-12-30',
  startTime: '09:00',
  endTime: '09:30',
  modeOfConsultation: 'IN_PERSON',
  status: 'SCHEDULED',
  notes: '',
};
