export const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter (A-Z)');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter (a-z)');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('At least one number (0-9)');
  }
  if (!/[@#$%^&*!]/.test(password)) {
    errors.push('At least one symbol (@#$%^&*!)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[@#$%^&*!]/.test(password)) score++;

  if (score <= 2) return { label: 'Weak', color: '#DC2626' };
  if (score <= 3) return { label: 'Fair', color: '#C9963F' };
  if (score <= 4) return { label: 'Good', color: '#2D6B6B' };
  return { label: 'Strong', color: '#16A34A' };
};
