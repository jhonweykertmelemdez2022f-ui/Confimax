-- ============================================
-- PLATAFORMA EDUCATIVA - ESQUEMA COMPLETO
-- Generado desde Prisma Schema
-- ============================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ENUMS (Tipos enumerados)
-- ============================================

CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'MENTOR', 'ADMIN');
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "CategoryType" AS ENUM ('COURSE', 'RESOURCE');
CREATE TYPE "FileType" AS ENUM ('PDF', 'DOC', 'DOCX', 'ZIP', 'XLS', 'XLSX', 'PPT', 'PPTX');

-- ============================================
-- 2. GESTIÓN DE USUARIOS (Auth)
-- ============================================

CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password_hash" VARCHAR(255),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "avatar_url" TEXT,
    "role" "UserRole" DEFAULT 'STUDENT' NOT NULL,
    "email_verified" BOOLEAN DEFAULT FALSE NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT "users_email_check" CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_users_role" ON "users"("role");

CREATE TABLE "social_accounts" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT "social_accounts_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "social_accounts_provider_unique" UNIQUE ("provider", "provider_id")
);

CREATE INDEX "idx_social_accounts_user_id" ON "social_accounts"("user_id");

CREATE TABLE "password_resets" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) UNIQUE NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used" BOOLEAN DEFAULT FALSE NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT "password_resets_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_password_resets_token" ON "password_resets"("token_hash");
CREATE INDEX "idx_password_resets_user_id" ON "password_resets"("user_id");

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER "users_updated_at_trigger"
    BEFORE UPDATE ON "users"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. CATÁLOGO DE CURSOS
-- ============================================

CREATE TABLE "categories" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) UNIQUE NOT NULL,
    "description" TEXT,
    "type" "CategoryType" DEFAULT 'COURSE' NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX "idx_categories_slug" ON "categories"("slug");
CREATE INDEX "idx_categories_type" ON "categories"("type");

CREATE TABLE "courses" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) UNIQUE NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "price" DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    "mentor_id" UUID NOT NULL,
    "category_id" UUID,
    "is_published" BOOLEAN DEFAULT FALSE NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT "courses_mentor_fk" FOREIGN KEY ("mentor_id") REFERENCES "users"("id"),
    CONSTRAINT "courses_category_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL,
    CONSTRAINT "courses_price_check" CHECK (price >= 0)
);

CREATE INDEX "idx_courses_slug" ON "courses"("slug");
CREATE INDEX "idx_courses_mentor_id" ON "courses"("mentor_id");
CREATE INDEX "idx_courses_category_id" ON "courses"("category_id");
CREATE INDEX "idx_courses_is_published" ON "courses"("is_published");

CREATE TRIGGER "courses_updated_at_trigger"
    BEFORE UPDATE ON "courses"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE "enrollments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "price_paid" DECIMAL(10, 2) NOT NULL,
    "status" "EnrollmentStatus" DEFAULT 'PENDING' NOT NULL,
    "enrolled_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "enrollments_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "enrollments_course_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
    CONSTRAINT "enrollments_price_check" CHECK (price_paid >= 0),
    CONSTRAINT "enrollments_user_course_unique" UNIQUE ("user_id", "course_id")
);

CREATE INDEX "idx_enrollments_user_id" ON "enrollments"("user_id");
CREATE INDEX "idx_enrollments_course_id" ON "enrollments"("course_id");
CREATE INDEX "idx_enrollments_status" ON "enrollments"("status");

CREATE TABLE "reviews" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT "reviews_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "reviews_course_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
    CONSTRAINT "reviews_rating_check" CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT "reviews_user_course_unique" UNIQUE ("user_id", "course_id")
);

CREATE INDEX "idx_reviews_user_id" ON "reviews"("user_id");
CREATE INDEX "idx_reviews_course_id" ON "reviews"("course_id");
CREATE INDEX "idx_reviews_rating" ON "reviews"("rating");

CREATE TRIGGER "reviews_updated_at_trigger"
    BEFORE UPDATE ON "reviews"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. REPOSITORIO DE RECURSOS
-- ============================================

CREATE TABLE "resources" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "file_type" "FileType" DEFAULT 'PDF' NOT NULL,
    "file_size" BIGINT,
    "download_count" INT DEFAULT 0 NOT NULL,
    "category_id" UUID,
    "uploaded_by" UUID NOT NULL,
    "is_published" BOOLEAN DEFAULT FALSE NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT "resources_category_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL,
    CONSTRAINT "resources_uploader_fk" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id"),
    CONSTRAINT "resources_download_count_check" CHECK (download_count >= 0)
);

CREATE INDEX "idx_resources_category_id" ON "resources"("category_id");
CREATE INDEX "idx_resources_uploaded_by" ON "resources"("uploaded_by");
CREATE INDEX "idx_resources_is_published" ON "resources"("is_published");

CREATE TRIGGER "resources_updated_at_trigger"
    BEFORE UPDATE ON "resources"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. COMUNIDAD (FORO)
-- ============================================

CREATE TABLE "forum_categories" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) UNIQUE NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "icon" VARCHAR(50),
    "order" INT DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX "idx_forum_categories_slug" ON "forum_categories"("slug");
CREATE INDEX "idx_forum_categories_order" ON "forum_categories"("order");

CREATE TABLE "forum_topics" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) UNIQUE NOT NULL,
    "content" TEXT NOT NULL,
    "category_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "is_pinned" BOOLEAN DEFAULT FALSE NOT NULL,
    "is_locked" BOOLEAN DEFAULT FALSE NOT NULL,
    "view_count" INT DEFAULT 0 NOT NULL,
    "reply_count" INT DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT "forum_topics_category_fk" FOREIGN KEY ("category_id") REFERENCES "forum_categories"("id") ON DELETE CASCADE,
    CONSTRAINT "forum_topics_author_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "forum_topics_view_count_check" CHECK (view_count >= 0),
    CONSTRAINT "forum_topics_reply_count_check" CHECK (reply_count >= 0)
);

CREATE INDEX "idx_forum_topics_slug" ON "forum_topics"("slug");
CREATE INDEX "idx_forum_topics_category_id" ON "forum_topics"("category_id");
CREATE INDEX "idx_forum_topics_author_id" ON "forum_topics"("author_id");
CREATE INDEX "idx_forum_topics_is_pinned" ON "forum_topics"("is_pinned");
CREATE INDEX "idx_forum_topics_created_at" ON "forum_topics"("created_at" DESC);

CREATE TRIGGER "forum_topics_updated_at_trigger"
    BEFORE UPDATE ON "forum_topics"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE "forum_replies" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "content" TEXT NOT NULL,
    "topic_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "is_solution" BOOLEAN DEFAULT FALSE NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT "forum_replies_topic_fk" FOREIGN KEY ("topic_id") REFERENCES "forum_topics"("id") ON DELETE CASCADE,
    CONSTRAINT "forum_replies_author_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_forum_replies_topic_id" ON "forum_replies"("topic_id");
CREATE INDEX "idx_forum_replies_author_id" ON "forum_replies"("author_id");
CREATE INDEX "idx_forum_replies_is_solution" ON "forum_replies"("is_solution");

CREATE TRIGGER "forum_replies_updated_at_trigger"
    BEFORE UPDATE ON "forum_replies"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. VISTAS ÚTILES
-- ============================================

-- Vista de cursos con información del mentor y promedio de rating
CREATE OR REPLACE VIEW "course_summary" AS
SELECT 
    c.id,
    c.title,
    c.slug,
    c.description,
    c.price,
    c.is_published,
    c.created_at,
    u.first_name AS mentor_first_name,
    u.last_name AS mentor_last_name,
    u.avatar_url AS mentor_avatar,
    cat.name AS category_name,
    COALESCE(AVG(r.rating), 0) AS average_rating,
    COUNT(DISTINCT r.id) AS review_count,
    COUNT(DISTINCT e.id) AS enrollment_count
FROM "courses" c
LEFT JOIN "users" u ON c.mentor_id = u.id
LEFT JOIN "categories" cat ON c.category_id = cat.id
LEFT JOIN "reviews" r ON c.id = r.course_id
LEFT JOIN "enrollments" e ON c.id = e.course_id AND e.status = 'COMPLETED'
GROUP BY c.id, u.first_name, u.last_name, u.avatar_url, cat.name;

-- Vista de usuarios con estadísticas
CREATE OR REPLACE VIEW "user_stats" AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.created_at,
    COUNT(DISTINCT e.id) AS total_enrollments,
    COUNT(DISTINCT r.id) AS total_reviews,
    COUNT(DISTINCT ft.id) AS total_topics,
    COUNT(DISTINCT fr.id) AS total_replies
FROM "users" u
LEFT JOIN "enrollments" e ON u.id = e.user_id
LEFT JOIN "reviews" r ON u.id = r.user_id
LEFT JOIN "forum_topics" ft ON u.id = ft.author_id
LEFT JOIN "forum_replies" fr ON u.id = fr.author_id
GROUP BY u.id;

-- ============================================
-- 7. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE "users" IS 'Usuarios de la plataforma con roles: STUDENT, MENTOR, ADMIN';
COMMENT ON TABLE "courses" IS 'Cursos disponibles con información del mentor y precio';
COMMENT ON TABLE "enrollments" IS 'Inscripciones de usuarios a cursos';
COMMENT ON TABLE "reviews" IS 'Reseñas y testimonios de cursos (rating 1-5)';
COMMENT ON TABLE "resources" IS 'Archivos descargables: ebooks, plantillas, guías';
COMMENT ON TABLE "forum_topics" IS 'Temas del foro de comunidad';
COMMENT ON TABLE "forum_replies" IS 'Respuestas a temas del foro';
