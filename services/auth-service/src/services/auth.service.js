const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { Profile } = require('../models/user.model');
const { getRedisClient } = require('../services/redis.service');

const AuthService = {
  async register(userData) {
    const { name, email, password, role, phone } = userData;

    const existingEmail = await Profile.findByEmail(email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    const profile = await Profile.create({
      name,
      email,
      role,
      phone,
    });

    const tokens = await this.generateTokens(profile);
    
    return {
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      },
      ...tokens,
    };
  },

  async login(credentials) {
    const { username, email, password } = credentials;
    const loginIdentifier = username || email;

    if (!loginIdentifier) {
      throw new Error('Username or email is required');
    }

    if (!password) {
      throw new Error('Password is required');
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
      throw new Error('Invalid credentials');
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
      throw new Error('Invalid credentials');
    }
    
    await Profile.updateLastLogin(profile.id);

    const tokens = await this.generateTokens(profile);

    return {
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      },
      ...tokens,
    };
  },

  async generateTokens(profile) {
    const accessToken = jwt.sign(
      { userId: profile.id, name: profile.name, role: profile.role },
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
};

module.exports = AuthService;
