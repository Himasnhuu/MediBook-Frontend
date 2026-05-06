import '@testing-library/jest-dom';

// react-router-dom v7 uses TextEncoder which jsdom doesn't provide
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.Razorpay
window.Razorpay = jest.fn().mockImplementation(() => ({
  open: jest.fn(),
}));
