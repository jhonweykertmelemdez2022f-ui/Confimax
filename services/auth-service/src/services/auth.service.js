const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { Profile } = require('../models/user.model');
const { getRedisClient, messageQueue } = require('../services/redis.service');

const FAILED_LOGIN_LIMIT = 3;
const LOCKOUT_SECONDS = 30;

const getFailedLoginKey = (identifier, ip) => {
  const safeIdentifier = identifier ? identifier.toString().trim().toLowerCase().replace(/[^a-z0-9@.-]/g, '_') : 'anonymous';
  const safeIp = ip ? ip.toString().replace(/[^a-zA-Z0-9.:]/g, '_') : 'unknown';
  return `auth:login:failed:${safeIdentifier}:${safeIp}`;
};

const AuthService = {
  async register(userData) {
    const { name, email, password, role, phone } = userData;
    const cleanUsername = (name || userData.username || '').trim();
    const cleanEmail = (email || '').trim();

    const existingEmail = await Profile.findByEmail(cleanEmail);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Encriptar la contraseña con bcrypt antes de guardarla en base de datos
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Normalize role to consistent values
    let normalizedRole = role || 'customer';
    if (normalizedRole === 'cliente') normalizedRole = 'customer';
    if (normalizedRole === 'vendedor') normalizedRole = 'vendor';
    
    const profile = await Profile.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: normalizedRole,
      active: userData.active !== undefined ? userData.active : true,
    });

    const tokens = await this.generateTokens(profile);
    
    return {
      user: {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        role: profile.role,
        active: profile.active,
      },
      ...tokens,
    };
  },

  async login(credentials) {
    const { username, email, password } = credentials;
    const loginIdentifier = (username || email || '').trim();
    const ipAddress = credentials.ip || 'unknown';
    const failedLoginKey = getFailedLoginKey(loginIdentifier, ipAddress);

    if (!loginIdentifier) {
      throw new Error('Username or email is required');
    }

    if (!password) {
      throw new Error('Password is required');
    }

    const previousAttempts = Number(await messageQueue.get(failedLoginKey)) || 0;
    if (previousAttempts >= FAILED_LOGIN_LIMIT) {
      const ttl = await messageQueue.ttl(failedLoginKey);
      const wait = ttl > 0 ? ttl : LOCKOUT_SECONDS;
      const error = new Error(`Demasiados intentos fallidos. Espera ${wait} segundos antes de volver a intentar.`);
      error.statusCode = 429;
      throw error;
    }

    let profile = null;

    // Si tiene un formato de correo, buscar por email primero
    if (loginIdentifier.includes('@')) {
      profile = await Profile.findByEmail(loginIdentifier);
    } else {
      profile = await Profile.findByUsername(loginIdentifier);
    }

    // Fallback: si no encontró por la primera opción, intentar con la otra
    if (!profile) {
      profile = await Profile.findByUsername(loginIdentifier) || await Profile.findByEmail(loginIdentifier);
    }

    if (!profile) {
      const currentAttempts = await messageQueue.incr(failedLoginKey);
      if (currentAttempts === 1) {
        await messageQueue.expire(failedLoginKey, LOCKOUT_SECONDS);
      }
      if (currentAttempts >= FAILED_LOGIN_LIMIT) {
        const ttl = await messageQueue.ttl(failedLoginKey);
        const wait = ttl > 0 ? ttl : LOCKOUT_SECONDS;
        const error = new Error(`Demasiados intentos fallidos. Espera ${wait} segundos antes de volver a intentar.`);
        error.statusCode = 429;
        throw error;
      }
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    // Verificar contraseña en texto plano (como está en el seeder local)
    // o con bcrypt si es hash
    let passwordMatches = false;
    
    if (profile.password.startsWith('$2a$') || profile.password.startsWith('$2b$')) {
      // Es un hash bcrypt
      passwordMatches = await bcrypt.compare(password, profile.password);
    } else {
      // Contraseña en texto plano
      passwordMatches = profile.password === password;
    }

    if (!passwordMatches) {
      const currentAttempts = await messageQueue.incr(failedLoginKey);
      if (currentAttempts === 1) {
        await messageQueue.expire(failedLoginKey, LOCKOUT_SECONDS);
      }
      if (currentAttempts >= FAILED_LOGIN_LIMIT) {
        const ttl = await messageQueue.ttl(failedLoginKey);
        const wait = ttl > 0 ? ttl : LOCKOUT_SECONDS;
        const error = new Error(`Demasiados intentos fallidos. Espera ${wait} segundos antes de volver a intentar.`);
        error.statusCode = 429;
        throw error;
      }
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    await messageQueue.del(failedLoginKey);
    await Profile.updateLastLogin(profile.id);

    const tokens = await this.generateTokens(profile);

    return {
      user: {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        role: profile.role,
        active: profile.active,
      },
      ...tokens,
    };
  },

  async generateTokens(profile) {
    const accessToken = jwt.sign(
      { userId: profile.id, username: profile.username, role: profile.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiration }
    );

    const refreshToken = uuidv4();

    const redis = getRedisClient();
    if (redis) {
      await redis.setEx(`refresh:${refreshToken}`, 7 * 24 * 60 * 60, profile.id.toString());
    }

    return { accessToken, refreshToken };
  },

  async refreshAccessToken(refreshToken) {
    const redis = getRedisClient();
    let userId;

    if (redis) {
      userId = await redis.get(`refresh:${refreshToken}`);
    }

    if (!userId) {
      throw new Error('Invalid refresh token');
    }

    const profile = await Profile.findById(userId);
    if (!profile) {
      throw new Error('User not found');
    }

    const newAccessToken = jwt.sign(
      { userId: profile.id, name: profile.name, role: profile.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiration }
    );

    return { accessToken: newAccessToken };
  },

  async logout(refreshToken) {
    const redis = getRedisClient();
    if (redis) {
      await redis.del(`refresh:${refreshToken}`);
    }
  },

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const profile = await Profile.findById(decoded.userId);
      if (!profile) {
        throw new Error('User not found');
      }
      return profile;
    } catch (error) {
      throw new Error('Invalid token');
    }
  },

  async changePassword(userId, oldPassword, newPassword) {
    const profile = await Profile.findById(userId);
    if (!profile) {
      throw new Error('User not found');
    }

    // Nota: Cambio de password debe hacerse via Supabase Auth SDK
    // Este es un placeholder para compatibilidad
    throw new Error('Use Supabase Auth to change password');
  },

  async listUsers(limit = 100, offset = 0) {
    return await Profile.list(limit, offset);
  },

  async updateUser(id, updateData) {
    const updated = await Profile.update(id, updateData);
    if (!updated) {
      throw new Error('User not found or unable to update');
    }
    return updated;
  },

  async deleteUser(id) {
    const profile = await Profile.findById(id);
    if (!profile) {
      throw new Error('User not found');
    }
    await Profile.deactivate(id);
    return { message: 'User deleted successfully' };
  },
};

module.exports = AuthService;
