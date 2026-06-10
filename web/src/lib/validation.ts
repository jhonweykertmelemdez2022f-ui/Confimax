export const validateLoginPassword = (password: string) => {
  if (!password) return 'La contraseña es requerida';
  return null;
};

const registrationPasswordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8}$/;

export const validatePassword = (password: string) => {
  if (!password) return 'La contraseña es requerida';
  if (password.length !== 8) return 'La contraseña debe tener exactamente 8 caracteres';
  if (!registrationPasswordPattern.test(password)) return 'La contraseña debe tener mayúsculas, minúsculas, números y signos';
  return null;
};

export const validateUsernameOrEmail = (value: string) => {
  if (!value) return 'Usuario o correo es requerido';
  return null;
};
