/**
 * User Repository PostgreSQL - Infrastructure Layer (Arquitectura Hexagonal)
 * 
 * Adaptador que implementa el puerto del repositorio de usuarios usando PostgreSQL.
 * Usa la librería moderna 'postgres' en lugar de 'pg'.
 */

/**
 * Repositorio de usuarios en PostgreSQL
 */
class UserRepositoryPG {
  /**
   * @param {Object} sql - Instancia de postgres (librería moderna)
   * @param {string} schema - Schema de PostgreSQL (default: 'auth')
   */
  constructor(sql, schema = 'auth') {
    this.sql = sql;
    this.schema = schema;
  }

  /**
   * Crear un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Object} Usuario creado
   */
  async create(userData) {
    const { username, email, password, role = 'vendor' } = userData;
    
    const result = await this.sql`
      INSERT INTO ${this.sql(this.schema)}.users (username, email, password, role, active)
       VALUES (${username}, ${email}, ${password}, ${role}, true)
       RETURNING id, username, email, role, active, created_at, updated_at
    `;

    return result[0];
  }

  /**
   * Buscar usuario por email
   * @param {string} email - Email del usuario
   * @returns {Object|null} Usuario encontrado o null
   */
  async findByEmail(email) {
    const result = await this.sql`
      SELECT * FROM ${this.sql(this.schema)}.users WHERE email = ${email}
    `;

    return result[0] || null;
  }

  /**
   * Buscar usuario por ID
   * @param {string} id - ID del usuario
   * @returns {Object|null} Usuario encontrado o null
   */
  async findById(id) {
    const result = await this.sql`
      SELECT id, username, email, role, active, created_at, updated_at 
       FROM ${this.sql(this.schema)}.users WHERE id = ${id}
    `;

    return result[0] || null;
  }

  /**
   * Listar usuarios con filtros
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Array} Lista de usuarios
   */
  async list(filters = {}) {
    const { limit = 50, offset = 0, role, active } = filters;
    
    let query = this.sql`
      SELECT id, username, email, role, active, created_at, updated_at 
      FROM ${this.sql(this.schema)}.users WHERE 1=1
    `;

    if (role) {
      query = query`${query} AND role = ${role}`;
    }

    if (active !== undefined) {
      query = query`${query} AND active = ${active}`;
    }

    query = query`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await query;
    return result;
  }

  /**
   * Actualizar usuario
   * @param {string} id - ID del usuario
   * @param {Object} updates - Campos a actualizar
   * @returns {Object|null} Usuario actualizado o null
   */
  async update(id, updates) {
    const validFields = ['username', 'email', 'password', 'role', 'active'];
    const updateFields = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (validFields.includes(key)) {
        updateFields[key] = value;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return this.findById(id);
    }

    updateFields.updated_at = this.sql`NOW()`;

    const result = await this.sql`
      UPDATE ${this.sql(this.schema)}.users 
       SET ${this.sql(updateFields)}
       WHERE id = ${id}
       RETURNING id, username, email, role, active, created_at, updated_at
    `;

    return result[0] || null;
  }

  /**
   * Eliminar usuario
   * @param {string} id - ID del usuario
   * @returns {boolean} true si se eliminó correctamente
   */
  async delete(id) {
    const result = await this.sql`
      DELETE FROM ${this.sql(this.schema)}.users WHERE id = ${id}
    `;

    return result.count > 0;
  }

  /**
   * Verificar contraseña
   * @param {Object} user - Usuario de la BD
   * @param {string} password - Contraseña a verificar
   * @returns {boolean} true si la contraseña es correcta
   */
  async verifyPassword(user, password) {
    // En producción usar bcrypt.compare
    // Por simplicidad, comparación directa para tests
    return user.password === password;
  }

  /**
   * Cerrar conexión (no-op, la conexión se maneja externamente)
   */
  async close() {
    // La conexión se maneja externamente por el módulo postgres-connection
  }
}

module.exports = UserRepositoryPG;
