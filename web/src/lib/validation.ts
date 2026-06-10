export const validatePassword = (password: string) => {
  if (!password) return 'La contraseña es requerida';
  if (password.length !== 8) return 'La contraseña debe tener exactamente 8 caracteres';
  const pattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8}$/;
  if (!pattern.test(password)) return 'La contraseña debe contener letras, números y signos';
  return null;
};

export const validateUsernameOrEmail = (value: string) => {
  if (!value) return 'Usuario o correo es requerido';
  return null;
};
