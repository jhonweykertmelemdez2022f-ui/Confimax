/**
 * User Entity - Domain Layer (Arquitectura Hexagonal)
 * 
 * Esta capa contiene la lógica de negocio pura sin dependencias externas.
 */

/**
 * Valida los datos de un usuario
 * @param {Object} user - Datos del usuario a validar
 * @returns {Object} Resultado de la validación con isValid y errors
 */
function validateUser(user) {
  const errors = [];

  if (!user.username || user.username.length < 3) {
    errors.push('Username debe tener al menos 3 caracteres');
  }

  if (!user.email || !user.email.includes('@')) {
    errors.push('Email inválido');
  }

  if (!user.password || user.password.length < 8) {
    errors.push('Password debe tener al menos 8 caracteres');
  }

  if (!user.role || !['admin', 'vendor', 'customer'].includes(user.role)) {
    errors.push('Role debe ser admin, vendor o customer');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Crea una entidad de usuario
 * @param {Object} userData - Datos del usuario
 * @returns {Object} Entidad de usuario creada
 */
function createUser(userData) {
  const validation = validateUser(userData);
  
  if (!validation.isValid) {
    throw new Error(`Invalid user data: ${validation.errors.join(', ')}`);
  }

  return {
    id: generateUUID(),
    username: userData.username,
    email: userData.email,
    password: userData.password, // En producción debería estar hasheado
    role: userData.role,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Genera un UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = {
  validateUser,
  createUser,
  generateUUID
};
