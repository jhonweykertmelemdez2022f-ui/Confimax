export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'El email es requerido';
  if (!re.test(String(email).toLowerCase())) return 'El formato del email es inválido';
  return null;
};

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8}$/;

export const validatePassword = (password) => {
  if (!password) return 'La contraseña es requerida';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!passwordPattern.test(password)) return 'La contraseña debe contener letras, números y signos';
  return null;
};

export const validateUsername = (username) => {
  if (!username) return 'El nombre de usuario es requerido';
  if (username.length < 3) return 'El nombre de usuario debe tener al menos 3 caracteres';
  return null;
};
