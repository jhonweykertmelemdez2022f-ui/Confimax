/**
 * Ejemplo de uso integrado: Prisma + MongoDB (logs) + Redis (caché)
 * 
 * Este archivo muestra cómo usar las tres tecnologías juntas
 * en un flujo típico de la plataforma educativa.
 */

import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import Log from '../models/log.model.js';
import cacheService from '../services/cache.service.js';

const prisma = new PrismaClient();

// ============================================
// EJEMPLO 1: Obtener curso con caché
// ============================================
async function getCourseWithCache(courseId, userId) {
  // 1. Intentar obtener del caché (Redis)
  let course = await cacheService.getCourse(courseId);
  
  if (course) {
    // Caché hit - loguear en MongoDB
    await Log.logCourse(userId, 'course_cache_hit', courseId, {
      source: 'redis_cache',
      courseTitle: course.title
    });
    return { ...course, _source: 'cache' };
  }

  // 2. Caché miss - consultar PostgreSQL (Prisma)
  course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      mentor: {
        select: { firstName: true, lastName: true, avatarUrl: true }
      },
      category: true,
      _count: {
        select: { enrollments: true, reviews: true }
      }
    }
  });

  if (!course) {
    // Log error en MongoDB
    await Log.logError('courses', new Error('Course not found'), {
      userId,
      action: 'get_course',
      details: { courseId }
    });
    return null;
  }

  // 3. Guardar en caché (Redis)
  await cacheService.setCourse(courseId, course);

  // 4. Log en MongoDB
  await Log.logCourse(userId, 'course_db_fetch', courseId, {
    source: 'postgresql',
    courseTitle: course.title,
    mentorName: `${course.mentor.firstName} ${course.mentor.lastName}`
  });

  return { ...course, _source: 'database' };
}

// ============================================
// EJEMPLO 2: Inscribir usuario a curso
// ============================================
async function enrollUserToCourse(userId, courseId, session) {
  try {
    // 1. Verificar rate limiting (Redis)
    const rateLimit = await cacheService.checkRateLimit(`enroll:${userId}`, 3, 300);
    if (!rateLimit.allowed) {
      await Log.logError('enrollments', new Error('Rate limit exceeded'), {
        userId,
        action: 'enroll_user',
        details: { courseId, rateLimit }
      });
      throw new Error('Demasiados intentos. Por favor espera 5 minutos.');
    }

    // 2. Verificar si ya está inscrito (PostgreSQL/Prisma)
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId }
      }
    });

    if (existing) {
      await Log.logEnrollment(userId, courseId, 'enroll_duplicate_attempt', {
        existingStatus: existing.status,
        ip: session.ip
      });
      throw new Error('Ya estás inscrito en este curso');
    }

    // 3. Obtener info del curso para precio
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true, title: true }
    });

    // 4. Crear inscripción (PostgreSQL/Prisma)
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        pricePaid: course.price,
        status: 'COMPLETED'
      }
    });

    // 5. Invalidar caché de inscripciones (Redis)
    await cacheService.invalidateUserEnrollments(userId);

    // 6. Log éxito en MongoDB
    await Log.logEnrollment(userId, courseId, 'enroll_success', {
      enrollmentId: enrollment.id,
      pricePaid: course.price,
      ip: session.ip,
      userAgent: session.userAgent
    });

    return enrollment;

  } catch (error) {
    // Log error en MongoDB
    await Log.logError('enrollments', error, {
      userId,
      action: 'enroll_user',
      session,
      details: { courseId }
    });
    throw error;
  }
}

// ============================================
// EJEMPLO 3: Crear tema en foro
// ============================================
async function createForumTopic(authorId, data, session) {
  // 1. Verificar rate limiting (Redis)
  const rateLimit = await cacheService.checkRateLimit(`forum:topic:${authorId}`, 10, 60);
  if (!rateLimit.allowed) {
    await Log.logError('forum', new Error('Rate limit exceeded'), {
      userId: authorId,
      action: 'create_topic',
      session
    });
    throw new Error('Demasiados temas creados. Espera un momento.');
  }

  // 2. Crear tema (PostgreSQL/Prisma)
  const topic = await prisma.forumTopic.create({
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content,
      categoryId: data.categoryId,
      authorId
    },
    include: {
      author: {
        select: { firstName: true, lastName: true, avatarUrl: true }
      }
    }
  });

  // 3. Invalidar caché de lista de temas (Redis)
  await cacheService.invalidateByPattern(`forum:topics:${data.categoryId}:*`);

  // 4. Log en MongoDB
  await Log.logForum(authorId, 'topic_created', topic.id, {
    categoryId: data.categoryId,
    title: data.title,
    ip: session.ip
  });

  return topic;
}

// ============================================
// EJEMPLO 4: Login de usuario
// ============================================
async function loginUser(email, password, session) {
  // 1. Verificar rate limiting de auth (Redis)
  const rateLimit = await cacheService.checkAuthRateLimit(session.ip);
  if (!rateLimit.allowed) {
    await Log.logError('auth', new Error('Auth rate limit exceeded'), {
      action: 'login',
      session
    });
    throw new Error('Demasiados intentos. Por favor espera 5 minutos.');
  }

  try {
    // 2. Buscar usuario (PostgreSQL/Prisma)
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      await Log.logAuth(null, 'login_failed_user_not_found', {
        email,
        ip: session.ip
      }, session);
      throw new Error('Credenciales inválidas');
    }

    // 3. Verificar contraseña (ejemplo con bcrypt)
    // const validPassword = await bcrypt.compare(password, user.passwordHash);
    const validPassword = true; // Simplificado para ejemplo

    if (!validPassword) {
      await Log.logAuth(user.id, 'login_failed_wrong_password', {
        email,
        ip: session.ip
      }, session);
      throw new Error('Credenciales inválidas');
    }

    // 4. Crear sesión en caché (Redis)
    const sessionId = `sess_${Date.now()}_${user.id}`;
    const sessionData = {
      userId: user.id,
      email: user.email,
      role: user.role,
      loginAt: new Date().toISOString()
    };
    await cacheService.setSession(sessionId, sessionData);

    // 5. Guardar info de usuario en caché (Redis)
    await cacheService.setUser(user.id, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl
    });

    // 6. Log éxito en MongoDB
    await Log.logAuth(user.id, 'login_success', {
      sessionId,
      ip: session.ip,
      userAgent: session.userAgent
    }, session);

    return { user, sessionId };

  } catch (error) {
    if (error.message !== 'Credenciales inválidas') {
      await Log.logError('auth', error, {
        action: 'login',
        session,
        details: { email }
      });
    }
    throw error;
  }
}

// ============================================
// EJEMPLO 5: Listar cursos con caché
// ============================================
async function listCourses(page = 1, limit = 10, filters = {}, userId) {
  const cacheKey = `courses:list:${page}:${limit}:${JSON.stringify(filters)}`;
  
  // 1. Intentar obtener del caché
  let result = await cacheService.getCourseList(page, limit, filters);
  
  if (result) {
    await Log.logCourse(userId, 'course_list_cache_hit', null, {
      page,
      limit,
      filters,
      resultCount: result.data.length
    });
    return { ...result, _source: 'cache' };
  }

  // 2. Consultar PostgreSQL (Prisma)
  const where = { isPublished: true };
  if (filters.category) where.categoryId = filters.category;
  if (filters.mentor) where.mentorId = filters.mentor;
  if (filters.minPrice) where.price = { gte: parseFloat(filters.minPrice) };
  if (filters.maxPrice) where.price = { ...where.price, lte: parseFloat(filters.maxPrice) };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        mentor: { select: { firstName: true, lastName: true } },
        category: true,
        _count: { select: { reviews: true, enrollments: true } }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.course.count({ where })
  ]);

  result = {
    data: courses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };

  // 3. Guardar en caché
  await cacheService.setCourseList(page, limit, filters, result);

  // 4. Log en MongoDB
  await Log.logCourse(userId, 'course_list_db_fetch', null, {
    page,
    limit,
    filters,
    resultCount: courses.length,
    total
  });

  return { ...result, _source: 'database' };
}

// ============================================
// EJEMPLO 6: Dashboard Stats (Redis + MongoDB)
// ============================================
async function getDashboardStats(userId) {
  // 1. Intentar obtener stats del caché
  const cacheKey = `stats:dashboard:${userId}`;
  let stats = await cacheService.get(cacheKey);
  
  if (stats) {
    return { ...stats, _source: 'cache' };
  }

  // 2. Calcular estadísticas desde PostgreSQL
  const [enrollments, reviews, topics, replies] = await Promise.all([
    prisma.enrollment.count({ where: { userId } }),
    prisma.review.count({ where: { userId } }),
    prisma.forumTopic.count({ where: { authorId: userId } }),
    prisma.forumReply.count({ where: { authorId: userId } })
  ]);

  stats = {
    enrollments,
    reviews,
    forumTopics: topics,
    forumReplies: replies,
    totalActivity: enrollments + reviews + topics + replies,
    computedAt: new Date().toISOString()
  };

  // 3. Guardar en caché (TTL corto: 1 minuto)
  await cacheService.set(cacheKey, stats, 60);

  return { ...stats, _source: 'database' };
}

// ============================================
// EJEMPLO 7: Análisis de logs (MongoDB)
// ============================================
async function analyzeUserActivity(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Consultar MongoDB para obtener actividad del usuario
  const activity = await Log.find({
    userId,
    timestamp: { $gte: startDate }
  }).sort({ timestamp: -1 });

  // Agrupar por tipo de acción
  const summary = activity.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});

  return {
    userId,
    period: `${days} days`,
    totalActions: activity.length,
    summary,
    recentActivity: activity.slice(0, 10)
  };
}

// ============================================
// EJEMPLO 8: Health Check de Servicios
// ============================================
async function healthCheck() {
  const checks = {
    postgresql: false,
    mongodb: false,
    redis: false
  };

  try {
    // Check PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    checks.postgresql = true;
  } catch (e) {
    console.error('PostgreSQL error:', e.message);
  }

  try {
    // Check MongoDB
    await mongoose.connection.db.admin().ping();
    checks.mongodb = true;
  } catch (e) {
    console.error('MongoDB error:', e.message);
  }

  try {
    // Check Redis
    checks.redis = await cacheService.healthCheck();
  } catch (e) {
    console.error('Redis error:', e.message);
  }

  return checks;
}

// ============================================
// Exportar funciones de ejemplo
// ============================================
export {
  getCourseWithCache,
  enrollUserToCourse,
  createForumTopic,
  loginUser,
  listCourses,
  getDashboardStats,
  analyzeUserActivity,
  healthCheck
};

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Ejemplos de uso cargados. Para probar:');
  console.log('  - getCourseWithCache(courseId, userId)');
  console.log('  - enrollUserToCourse(userId, courseId, session)');
  console.log('  - loginUser(email, password, session)');
  console.log('  - healthCheck()');
}
