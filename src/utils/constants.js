export const API_BASE_URL = 'http://localhost:8080/api';

export const ROLES = {
  PATIENT: 'PATIENT',
  PROVIDER: 'PROVIDER',
  ADMIN: 'ADMIN'
};

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  PATIENT_DASHBOARD: '/patient',
  PATIENT_SEARCH: '/patient/search',
  PATIENT_APPOINTMENTS: '/patient/appointments',
  PATIENT_RECORDS: '/patient/records',
  PATIENT_PAYMENTS: '/patient/payments',
  PROVIDER_DASHBOARD: '/provider',
  PROVIDER_SLOTS: '/provider/slots',
  PROVIDER_APPOINTMENTS: '/provider/appointments',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_PROVIDERS: '/admin/providers',
  ADMIN_USERS: '/admin/users'
};

export const SPECIALIZATIONS = [
  'Cardiology',
  'Neurology',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'Gynecology',
  'Ophthalmology',
  'Dentistry',
  'Psychiatry',
  'General Physician',
  'ENT',
  'Urology',
  'Oncology',
  'Endocrinology',
  'Gastroenterology'
];
