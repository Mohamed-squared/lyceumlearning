-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE visibility_type AS ENUM ('opensource', 'restricted', 'private');
CREATE TYPE generation_method AS ENUM ('ai', 'manual', 'parsed', 'hybrid');
CREATE TYPE review_status AS ENUM ('not_reviewed', 'manually_reviewed');
CREATE TYPE usage_type AS ENUM ('semi_random', 'hybrid_manual', 'full_manual');
CREATE TYPE question_type AS ENUM ('mcq', 'multipart_problem', 'singlepart_problem');
CREATE TYPE author_type AS ENUM ('ai', 'user');
CREATE TYPE marking_method AS ENUM ('allow_ai', 'manual_only');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE course_type AS ENUM ('textbook', 'course', 'reading_group', 'classroom');
CREATE TYPE enrollment_mode AS ENUM ('viewer', 'full_enroll', 'hybrid');
CREATE TYPE user_role_in_course AS ENUM ('student', 'moderator');
CREATE TYPE content_type AS ENUM ('chapter', 'section', 'lecture', 'meeting_recording', 'organizer_material');
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE assignment_status AS ENUM ('in_progress', 'pending_manual_mark', 'completed');
CREATE TYPE challenge_status AS ENUM ('pending', 'active', 'completed', 'declined');
CREATE TYPE permission_level AS ENUM ('view', 'edit', 'use', 'hybrid', 'full');
CREATE TYPE permission_status AS ENUM ('pending', 'approved', 'declined');
CREATE TYPE club_role AS ENUM ('member', 'moderator');
CREATE TYPE report_content_type AS ENUM ('user', 'post', 'comment', 'course', 'question', 'club');
CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    credits INTEGER DEFAULT 100,
    role user_role DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create follows table
CREATE TABLE follows (
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Create posts table
CREATE TABLE posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post_upvotes table
CREATE TABLE post_upvotes (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, user_id)
);

-- Create comments table
CREATE TABLE comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clubs table
CREATE TABLE clubs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create club_members table
CREATE TABLE club_members (
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role club_role DEFAULT 'member',
    PRIMARY KEY (club_id, user_id)
);

-- Create testbanks table
CREATE TABLE testbanks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    owner_club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
    visibility visibility_type DEFAULT 'private',
    generation_method generation_method DEFAULT 'manual',
    review_status review_status DEFAULT 'not_reviewed',
    recommended_usage usage_type DEFAULT 'semi_random',
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    original_testbank_id UUID REFERENCES testbanks(id) ON DELETE CASCADE NOT NULL,
    current_testbank_id UUID REFERENCES testbanks(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    author_type author_type DEFAULT 'user',
    question_type question_type DEFAULT 'mcq',
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    options JSONB,
    answer TEXT,
    answer_guidelines TEXT,
    marking_method marking_method DEFAULT 'allow_ai',
    difficulty difficulty_level DEFAULT 'medium',
    keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create testbank_permissions table
CREATE TABLE testbank_permissions (
    testbank_id UUID REFERENCES testbanks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    permission_level permission_level NOT NULL,
    status permission_status DEFAULT 'pending',
    PRIMARY KEY (testbank_id, user_id)
);

-- Create courses table
CREATE TABLE courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    course_type course_type DEFAULT 'course',
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    owner_club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
    major TEXT,
    subject TEXT,
    prerequisites TEXT[] DEFAULT '{}',
    corequisites TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    syllabus JSONB,
    marking_scheme JSONB,
    is_archived BOOLEAN DEFAULT FALSE,
    is_starred_by_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create course_enrollments table
CREATE TABLE course_enrollments (
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    enrollment_mode enrollment_mode DEFAULT 'full_enroll',
    role user_role_in_course DEFAULT 'student',
    grade JSONB,
    is_visible_on_profile BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (course_id, user_id)
);

-- Create course_content table
CREATE TABLE course_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    type content_type NOT NULL,
    title TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    content_url TEXT,
    parent_id UUID REFERENCES course_content(id) ON DELETE CASCADE
);

-- Create user_course_progress table
CREATE TABLE user_course_progress (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    status progress_status DEFAULT 'not_started',
    mastery_score FLOAT DEFAULT 0,
    importance_index FLOAT DEFAULT 0,
    PRIMARY KEY (user_id, content_id)
);

-- Create assignments table
CREATE TABLE assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    testbank_id UUID REFERENCES testbanks(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    config JSONB NOT NULL
);

-- Create assignment_submissions table
CREATE TABLE assignment_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status assignment_status DEFAULT 'in_progress',
    score FLOAT,
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create challenges table
CREATE TABLE challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    challenger_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    opponent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status challenge_status DEFAULT 'pending',
    winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    credit_pot INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create credits_ledger table
CREATE TABLE credits_ledger (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    related_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reports table
CREATE TABLE reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    reported_content_type report_content_type NOT NULL,
    reported_content_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status report_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE testbanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE testbank_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
