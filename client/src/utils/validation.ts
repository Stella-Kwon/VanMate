export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,}$/;

export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

export const validatePassword = (password: string): boolean => {
  return PASSWORD_REGEX.test(password);
};

export const getPasswordErrorMessage = (): string => {
  return 'Password must be at least 6 characters and contain:\n- One uppercase letter\n- One lowercase letter\n- One number\n- One special character';
};


