-- NWEPP Database Schema Migration
-- Version: 001_initial_schema

-- ===================== AUTH & USERS =====================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    nik             VARCHAR(16) UNIQUE,
    phone           VARCHAR(20),
    role            VARCHAR(50) NOT NULL DEFAULT 'candidate',
    avatar_url      TEXT,
    province        VARCHAR(100),
    city            VARCHAR(100),
    district        VARCHAR(100),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== LMS MODULE =====================
CREATE TABLE training_tracks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    level           VARCHAR(50),
    estimated_hours INT,
    is_published    BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE courses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id        UUID REFERENCES training_tracks(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    sort_order      INT DEFAULT 0,
    is_published    BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lessons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id       UUID REFERENCES courses(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    content_type    VARCHAR(50),
    content_url     TEXT,
    content_body    TEXT,
    duration_min    INT,
    sort_order      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE,
    status          VARCHAR(20) DEFAULT 'not_started',
    score           DECIMAL(5,2),
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- ===================== CERTIFICATION MODULE =====================
CREATE TABLE certification_levels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level           INT NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    required_track  UUID REFERENCES training_tracks(id),
    passing_score   DECIMAL(5,2) DEFAULT 70.00,
    validity_months INT DEFAULT 24,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exams (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cert_level_id   UUID REFERENCES certification_levels(id),
    exam_type       VARCHAR(50) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    duration_min    INT,
    total_questions INT,
    passing_score   DECIMAL(5,2),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exam_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id         UUID REFERENCES exams(id) ON DELETE CASCADE,
    question_text   TEXT NOT NULL,
    question_type   VARCHAR(50),
    options         JSONB,
    correct_answer  TEXT,
    points          DECIMAL(5,2) DEFAULT 1.00,
    sort_order      INT DEFAULT 0
);

CREATE TABLE exam_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    exam_id         UUID REFERENCES exams(id),
    status          VARCHAR(20) DEFAULT 'in_progress',
    answers         JSONB,
    score           DECIMAL(5,2),
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    submitted_at    TIMESTAMPTZ,
    graded_at       TIMESTAMPTZ
);

CREATE TABLE certificates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    cert_level_id   UUID REFERENCES certification_levels(id),
    certificate_no  VARCHAR(100) UNIQUE NOT NULL,
    issued_at       TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    status          VARCHAR(20) DEFAULT 'active',
    pdf_url         TEXT
);

-- ===================== TALENT MODULE =====================
CREATE TABLE talent_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) UNIQUE,
    education       VARCHAR(100),
    specialization  VARCHAR(255),
    years_experience INT DEFAULT 0,
    previous_roles  JSONB,
    skills          TEXT[],
    willing_relocate BOOLEAN DEFAULT false,
    preferred_locations TEXT[],
    availability    VARCHAR(50) DEFAULT 'available',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE talent_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) UNIQUE,
    exam_score      DECIMAL(5,2) DEFAULT 0,
    practical_score DECIMAL(5,2) DEFAULT 0,
    experience_score DECIMAL(5,2) DEFAULT 0,
    soft_skill_score DECIMAL(5,2) DEFAULT 0,
    total_score     DECIMAL(5,2) GENERATED ALWAYS AS (
        exam_score * 0.4 + practical_score * 0.3 + experience_score * 0.2 + soft_skill_score * 0.1
    ) STORED,
    rank_national   INT,
    rank_provincial INT,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ===================== PLACEMENT MODULE =====================
CREATE TABLE kitchens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50) UNIQUE NOT NULL,
    province        VARCHAR(100),
    city            VARCHAR(100),
    district        VARCHAR(100),
    address         TEXT,
    capacity_meals  INT,
    operator_id     UUID REFERENCES users(id),
    status          VARCHAR(20) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_positions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kitchen_id      UUID REFERENCES kitchens(id),
    title           VARCHAR(255) NOT NULL,
    position_type   VARCHAR(50),
    role_category   VARCHAR(100),
    required_cert   UUID REFERENCES certification_levels(id),
    min_score       DECIMAL(5,2),
    slots           INT DEFAULT 1,
    filled          INT DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'open',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE placements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    position_id     UUID REFERENCES job_positions(id),
    status          VARCHAR(20) DEFAULT 'proposed',
    match_score     DECIMAL(5,2),
    proposed_at     TIMESTAMPTZ DEFAULT NOW(),
    accepted_at     TIMESTAMPTZ,
    start_date      DATE,
    end_date        DATE
);

-- ===================== INDEXES =====================
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_province ON users(province);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_exam_attempts_user ON exam_attempts(user_id);
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_talent_scores_total ON talent_scores(total_score DESC);
CREATE INDEX idx_job_positions_status ON job_positions(status);
CREATE INDEX idx_job_positions_kitchen ON job_positions(kitchen_id);
CREATE INDEX idx_placements_user ON placements(user_id);
CREATE INDEX idx_placements_status ON placements(status);

-- ===================== MEDIA MODULE =====================
CREATE TABLE media_files (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id UUID REFERENCES users(id),
    file_type   VARCHAR(20) NOT NULL,     -- video, image, pdf, document
    file_name   VARCHAR(255) NOT NULL,
    file_size   BIGINT NOT NULL,          -- bytes
    mime_type   VARCHAR(100),
    storage_key TEXT NOT NULL,            -- S3/MinIO object key
    cdn_url     TEXT,                     -- Public CDN URL
    thumbnail   TEXT,                     -- Thumbnail URL for videos
    duration_sec INT,                     -- Video duration
    status      VARCHAR(20) DEFAULT 'processing',
    metadata    JSONB,                    -- Resolution, bitrate, etc.
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_uploader ON media_files(uploader_id);
CREATE INDEX idx_media_type ON media_files(file_type);

-- ===================== SEED: CERTIFICATION LEVELS =====================
INSERT INTO certification_levels (level, name, description, passing_score, validity_months) VALUES
    (1, 'Nutrition Awareness', 'Basic nutrition awareness certification', 60.00, 24),
    (2, 'Food Service Operator', 'Food service operations certification', 65.00, 24),
    (3, 'Kitchen Supervisor', 'Kitchen supervision certification', 70.00, 24),
    (4, 'Nutrition Manager', 'Nutrition management certification', 75.00, 36),
    (5, 'Regional Nutrition Director', 'Regional nutrition direction certification', 80.00, 36);

-- ===================== SEED: TRAINING TRACKS =====================
INSERT INTO training_tracks (name, slug, description, level, estimated_hours, is_published) VALUES
    ('Ahli Gizi', 'ahli-gizi', 'Track pelatihan untuk tenaga ahli gizi - mencakup perencanaan menu, perhitungan nutrisi, audit gizi, dan monitoring status gizi.', 'advanced', 120, true),
    ('Non-Ahli Gizi', 'non-ahli-gizi', 'Track pelatihan untuk tenaga operasional - mencakup dasar gizi, food safety, operasional dapur, dan distribusi makanan.', 'beginner', 80, true),
    ('Manajemen', 'manajemen', 'Track pelatihan untuk manajer - mencakup manajemen dapur besar, supply chain pangan, monitoring program, dan manajemen tim.', 'intermediate', 100, true);
