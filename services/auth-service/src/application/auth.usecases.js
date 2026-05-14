/**
 * Auth Use Cases - Application Layer (Arquitectura Hexagonal)
 * 
 * Esta capa contiene los casos de uso de la aplicación.
 * Orquesta la lógica de negocio y coordina entre el dominio y la infraestructura.
 */

/**
 * Casos de uso de autenticación
 */
class AuthUseCases {
  /**
   * @param {Object} userRepository - Repositorio de usuarios (puerto)
   * @param {Object} tokenService - Servicio de tokens (puerto)
   */
  constructor(userRepository, tokenService) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
  }

  /**
   * Registrar un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Object} Usuario creado con token
   */
  async register(userData) {
    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Crear usuario
    const user = await this.userRepository.create(userData);

    // Generar token
    const token = this.tokenService.generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return { user, token };
  }

  /**
   * Iniciar sesión
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Object} Usuario con token
   */
  async login(email, password) {
    // Buscar usuario
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar contraseña
    const isValidPassword = await this.userRepository.verifyPassword(user, password);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar que el usuario está activo
    if (!user.active) {
      throw new Error('Usuario inactivo');
    }

    // Generar token
    const token = this.tokenService.generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return { user, token };
  }

  /**
   * Obtener usuario por ID
   * @param {string} id - ID del usuario
   * @returns {Object} Usuario encontrado
   */
  async getUserById(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return user;
  }

  /**
   * Actualizar usuario
   * @param {string} id - ID del usuario
   * @param {Object} updates - Campos a actualizar
   * @returns {Object} Usuario actualizado
   */
  async updateUser(id, updates) {
    const user = await this.userRepository.update(id, updates);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return user;
  }

  /**
   * Desactivar usuario
   * @param {string} id - ID del usuario
   * @returns {boolean} true si se desactivó correctamente
   */
  async deactivateUser(id) {
    const user = await this.userRepository.update(id, { active: false });
    return !!user;
  }
}

module.exports = AuthUseCases;
