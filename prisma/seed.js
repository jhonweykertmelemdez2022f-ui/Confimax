import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // ============================================
  // 1. Crear usuarios de ejemplo
  // ============================================
  console.log('Creando usuarios...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const mentorPassword = await bcrypt.hash('mentor123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@edulearn.com',
      passwordHash: adminPassword,
      firstName: 'Administrador',
      lastName: 'Sistema',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  const mentor1 = await prisma.user.create({
    data: {
      email: 'mentor1@edulearn.com',
      passwordHash: mentorPassword,
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      role: 'MENTOR',
      emailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    },
  });

  const mentor2 = await prisma.user.create({
    data: {
      email: 'mentor2@edulearn.com',
      passwordHash: mentorPassword,
      firstName: 'María',
      lastName: 'González',
      role: 'MENTOR',
      emailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: 'student1@edulearn.com',
      passwordHash: studentPassword,
      firstName: 'Juan',
      lastName: 'Pérez',
      role: 'STUDENT',
      emailVerified: true,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'student2@edulearn.com',
      passwordHash: studentPassword,
      firstName: 'Ana',
      lastName: 'López',
      role: 'STUDENT',
      emailVerified: true,
    },
  });

  console.log('✅ Usuarios creados');

  // ============================================
  // 2. Crear categorías
  // ============================================
  console.log('Creando categorías...');

  const courseCategories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Desarrollo Web',
        slug: 'desarrollo-web',
        description: 'Aprende a crear sitios y aplicaciones web modernas',
        type: 'COURSE',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Diseño UX/UI',
        slug: 'diseno-ux-ui',
        description: 'Diseña experiencias digitales intuitivas y atractivas',
        type: 'COURSE',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Marketing Digital',
        slug: 'marketing-digital',
        description: 'Estrategias de marketing para el mundo digital',
        type: 'COURSE',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Plantillas',
        slug: 'plantillas',
        description: 'Plantillas profesionales para tus proyectos',
        type: 'RESOURCE',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Ebooks',
        slug: 'ebooks',
        description: 'Libros electrónicos especializados',
        type: 'RESOURCE',
      },
    }),
  ]);

  console.log('✅ Categorías creadas');

  // ============================================
  // 3. Crear cursos
  // ============================================
  console.log('Creando cursos...');

  const courses = await Promise.all([
    prisma.course.create({
      data: {
        title: 'React.js desde Cero a Experto',
        slug: 'react-js-desde-cero',
        description: 'Aprende React.js desde los fundamentos hasta conceptos avanzados como Hooks, Context API y Next.js. Curso práctico con proyectos reales.',
        imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
        price: 99.99,
        mentorId: mentor1.id,
        categoryId: courseCategories[0].id,
        isPublished: true,
      },
    }),
    prisma.course.create({
      data: {
        title: 'Diseño de Interfaces Modernas',
        slug: 'diseno-interfaces-modernas',
        description: 'Domina Figma y aprende a crear interfaces de usuario atractivas y funcionales. Incluye principios de UX/UI y prototipado.',
        imageUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800',
        price: 79.99,
        mentorId: mentor2.id,
        categoryId: courseCategories[1].id,
        isPublished: true,
      },
    }),
    prisma.course.create({
      data: {
        title: 'Marketing en Redes Sociales',
        slug: 'marketing-redes-sociales',
        description: 'Estrategias efectivas para Instagram, TikTok, LinkedIn y más. Aprende a crear contenido viral y aumentar tu alcance.',
        imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800',
        price: 59.99,
        mentorId: mentor1.id,
        categoryId: courseCategories[2].id,
        isPublished: true,
      },
    }),
    prisma.course.create({
      data: {
        title: 'Node.js y Express',
        slug: 'nodejs-express',
        description: 'Construye APIs RESTful robustas con Node.js, Express y MongoDB. Autenticación, autorización y despliegue.',
        imageUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800',
        price: 89.99,
        mentorId: mentor1.id,
        categoryId: courseCategories[0].id,
        isPublished: false,
      },
    }),
  ]);

  console.log('✅ Cursos creados');

  // ============================================
  // 4. Crear inscripciones
  // ============================================
  console.log('Creando inscripciones...');

  await Promise.all([
    prisma.enrollment.create({
      data: {
        userId: student1.id,
        courseId: courses[0].id,
        pricePaid: 99.99,
        status: 'COMPLETED',
        enrolledAt: new Date('2024-01-15'),
        completedAt: new Date('2024-03-20'),
      },
    }),
    prisma.enrollment.create({
      data: {
        userId: student1.id,
        courseId: courses[1].id,
        pricePaid: 79.99,
        status: 'COMPLETED',
        enrolledAt: new Date('2024-02-10'),
      },
    }),
    prisma.enrollment.create({
      data: {
        userId: student2.id,
        courseId: courses[0].id,
        pricePaid: 99.99,
        status: 'PENDING',
        enrolledAt: new Date('2024-04-01'),
      },
    }),
    prisma.enrollment.create({
      data: {
        userId: student2.id,
        courseId: courses[2].id,
        pricePaid: 59.99,
        status: 'COMPLETED',
        enrolledAt: new Date('2024-01-20'),
        completedAt: new Date('2024-02-28'),
      },
    }),
  ]);

  console.log('✅ Inscripciones creadas');

  // ============================================
  // 5. Crear reseñas
  // ============================================
  console.log('Creando reseñas...');

  await Promise.all([
    prisma.review.create({
      data: {
        userId: student1.id,
        courseId: courses[0].id,
        rating: 5,
        comment: 'Excelente curso, Carlos explica muy bien. Los proyectos prácticos son de gran ayuda.',
      },
    }),
    prisma.review.create({
      data: {
        userId: student1.id,
        courseId: courses[1].id,
        rating: 5,
        comment: 'María es una mentora increíble. Aprendí mucho sobre diseño y usabilidad.',
      },
    }),
    prisma.review.create({
      data: {
        userId: student2.id,
        courseId: courses[0].id,
        rating: 4,
        comment: 'Muy buen curso, aunque me gustaría más contenido sobre testing.',
      },
    }),
    prisma.review.create({
      data: {
        userId: student2.id,
        courseId: courses[2].id,
        rating: 5,
        comment: 'Increíble curso de marketing. Estrategias actualizadas y aplicables.',
      },
    }),
  ]);

  console.log('✅ Reseñas creadas');

  // ============================================
  // 6. Crear recursos
  // ============================================
  console.log('Creando recursos...');

  await Promise.all([
    prisma.resource.create({
      data: {
        title: 'Guía Completa de React Hooks',
        description: 'PDF con ejemplos prácticos de todos los hooks de React.',
        fileUrl: 'https://example.com/resources/react-hooks-guide.pdf',
        fileType: 'PDF',
        fileSize: 2500000,
        categoryId: courseCategories[4].id,
        uploadedBy: mentor1.id,
        isPublished: true,
      },
    }),
    prisma.resource.create({
      data: {
        title: 'Kit de Plantillas UI para Figma',
        description: '50+ componentes de UI pre-diseñados para Figma.',
        fileUrl: 'https://example.com/resources/figma-ui-kit.zip',
        fileType: 'ZIP',
        fileSize: 15000000,
        categoryId: courseCategories[3].id,
        uploadedBy: mentor2.id,
        isPublished: true,
      },
    }),
    prisma.resource.create({
      data: {
        title: 'Calendario Editorial 2024',
        description: 'Plantilla de calendario editorial para redes sociales.',
        fileUrl: 'https://example.com/resources/calendar-2024.xlsx',
        fileType: 'XLSX',
        fileSize: 500000,
        categoryId: courseCategories[3].id,
        uploadedBy: mentor1.id,
        isPublished: true,
      },
    }),
  ]);

  console.log('✅ Recursos creados');

  // ============================================
  // 7. Crear categorías del foro
  // ============================================
  console.log('Creando categorías del foro...');

  const forumCategories = await Promise.all([
    prisma.forumCategory.create({
      data: {
        name: 'Presentaciones',
        slug: 'presentaciones',
        description: 'Preséntate a la comunidad',
        color: '#3b82f6',
        icon: 'User',
        order: 1,
      },
    }),
    prisma.forumCategory.create({
      data: {
        name: 'Ayuda y Soporte',
        slug: 'ayuda-soporte',
        description: 'Resuelve tus dudas sobre los cursos',
        color: '#10b981',
        icon: 'HelpCircle',
        order: 2,
      },
    }),
    prisma.forumCategory.create({
      data: {
        name: 'Discusiones Técnicas',
        slug: 'discusiones-tecnicas',
        description: 'Habla sobre desarrollo, diseño y tecnología',
        color: '#8b5cf6',
        icon: 'Code',
        order: 3,
      },
    }),
    prisma.forumCategory.create({
      data: {
        name: 'Proyectos',
        slug: 'proyectos',
        description: 'Muestra tus proyectos y recibe feedback',
        color: '#f59e0b',
        icon: 'Folder',
        order: 4,
      },
    }),
  ]);

  console.log('✅ Categorías del foro creadas');

  // ============================================
  // 8. Crear temas del foro
  // ============================================
  console.log('Creando temas del foro...');

  const topics = await Promise.all([
    prisma.forumTopic.create({
      data: {
        title: 'Hola a todos! Soy nuevo en la comunidad',
        slug: 'hola-todos-soy-nuevo',
        content: '¡Hola! Me llamo Juan y acabo de empezar el curso de React. Estoy emocionado por aprender con todos ustedes.',
        categoryId: forumCategories[0].id,
        authorId: student1.id,
        isPinned: false,
        isLocked: false,
        viewCount: 45,
        replyCount: 3,
      },
    }),
    prisma.forumTopic.create({
      data: {
        title: 'Duda sobre useEffect en React',
        slug: 'duda-useeffect-react',
        content: 'Tengo una duda sobre el ciclo de vida de useEffect. ¿Alguien me puede explicar cuándo se ejecuta exactamente?',
        categoryId: forumCategories[2].id,
        authorId: student1.id,
        isPinned: false,
        isLocked: false,
        viewCount: 120,
        replyCount: 5,
      },
    }),
    prisma.forumTopic.create({
      data: {
        title: 'Bienvenidos al Foro - Lee las Reglas',
        slug: 'bienvenidos-foro-reglas',
        content: 'Bienvenidos a la comunidad. Por favor lean las reglas antes de participar. Se respetuoso y constructivo.',
        categoryId: forumCategories[0].id,
        authorId: admin.id,
        isPinned: true,
        isLocked: true,
        viewCount: 500,
        replyCount: 12,
      },
    }),
  ]);

  console.log('✅ Temas del foro creados');

  // ============================================
  // 9. Crear respuestas del foro
  // ============================================
  console.log('Creando respuestas del foro...');

  await Promise.all([
    prisma.forumReply.create({
      data: {
        content: '¡Bienvenido Juan! Espero que disfrutes el curso. Cualquier duda, aquí estamos para ayudar.',
        topicId: topics[0].id,
        authorId: mentor1.id,
      },
    }),
    prisma.forumReply.create({
      data: {
        content: '¡Hola! Yo también estoy empezando. ¿Qué te parece el curso hasta ahora?',
        topicId: topics[0].id,
        authorId: student2.id,
      },
    }),
    prisma.forumReply.create({
      data: {
        content: 'useEffect se ejecuta después de que React renderiza el componente. Te recomiendo revisar la documentación oficial.',
        topicId: topics[1].id,
        authorId: mentor1.id,
        isSolution: true,
      },
    }),
    prisma.forumReply.create({
      data: {
        content: 'Yo también tenía esa duda. Gracias por la explicación!',
        topicId: topics[1].id,
        authorId: student2.id,
      },
    }),
  ]);

  console.log('✅ Respuestas del foro creadas');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\nDatos creados:');
  console.log('- 1 Administrador');
  console.log('- 2 Mentores');
  console.log('- 2 Estudiantes');
  console.log('- 5 Categorías (3 cursos + 2 recursos)');
  console.log('- 4 Cursos');
  console.log('- 4 Inscripciones');
  console.log('- 4 Reseñas');
  console.log('- 3 Recursos');
  console.log('- 4 Categorías de foro');
  console.log('- 3 Temas de foro');
  console.log('- 4 Respuestas de foro');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
