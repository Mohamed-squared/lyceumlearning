-- Complete database configuration fix script
-- This script ensures all tables, functions, and policies are properly set up

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all required enums
DO $$ 
BEGIN
    -- User role enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
    END IF;
    
    -- Author type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'author_type') THEN
        CREATE TYPE author_type AS ENUM ('ai', 'user');
    END IF;
    
    -- Challenge status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_status') THEN
        CREATE TYPE challenge_status AS ENUM ('pending', 'active', 'completed', 'declined');
    END IF;
    
    -- Chat type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_type') THEN
        CREATE TYPE chat_type AS ENUM ('direct', 'group');
    END IF;
    
    -- Club role enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'club_role') THEN
        CREATE TYPE club_role AS ENUM ('member', 'moderator', 'owner');
    END IF;
    
    -- Content type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
        CREATE TYPE content_type AS ENUM ('chapter', 'section', 'lecture', 'meeting_recording', 'organizer_material');
    END IF;
    
    -- Content type report enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type_report') THEN
        CREATE TYPE content_type_report AS ENUM ('user', 'post', 'comment', 'course', 'question', 'club');
    END IF;
    
    -- Course role enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_role') THEN
        CREATE TYPE course_role AS ENUM ('student', 'moderator');
    END IF;
    
    -- Course type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_type') THEN
        CREATE TYPE course_type AS ENUM ('textbook', 'course', 'reading_group', 'classroom');
    END IF;
    
    -- Difficulty enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty') THEN
        CREATE TYPE difficulty AS ENUM ('easy', 'medium', 'hard');
    END IF;
    
    -- Enrollment mode enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_mode') THEN
        CREATE TYPE enrollment_mode AS ENUM ('viewer', 'full_enroll', 'hybrid');
    END IF;
    
    -- Generation method enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'generation_method') THEN
        CREATE TYPE generation_method AS ENUM ('ai', 'manual', 'parsed', 'hybrid');
    END IF;
    
    -- Marking method enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marking_method') THEN
        CREATE TYPE marking_method AS ENUM ('allow_ai', 'manual_only');
    END IF;
    
    -- Permission level enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_level') THEN
        CREATE TYPE permission_level AS ENUM ('view', 'edit', 'use', 'hybrid', 'full');
    END IF;
    
    -- Permission status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_status') THEN
        CREATE TYPE permission_status AS ENUM ('pending', 'approved', 'declined');
    END IF;
    
    -- Progress status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_status') THEN
        CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');
    END IF;
    
    -- Question type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
        CREATE TYPE question_type AS ENUM ('mcq', 'multipart_problem', 'singlepart_problem');
    END IF;
    
    -- Recommended usage enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recommended_usage') THEN
        CREATE TYPE recommended_usage AS ENUM ('semi_random', 'hybrid_manual', 'full_manual');
    END IF;
    
    -- Report status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');
    END IF;
    
    -- Review status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE review_status AS ENUM ('not_reviewed', 'manually_reviewed');
    END IF;
    
    -- Submission status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
        CREATE TYPE submission_status AS ENUM ('in_progress', 'pending_manual_mark', 'completed');
    END IF;
    
    -- Visibility enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility') THEN
        CREATE TYPE visibility AS ENUM ('opensource', 'restricted', 'private');
    END IF;
    
    -- Friend request status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friend_request_status') THEN
        CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'declined');
    END IF;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    credits INTEGER DEFAULT 0,
    role user_role DEFAULT 'user',
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post_upvotes table
CREATE TABLE IF NOT EXISTS post_upvotes (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, post_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create clubs table
CREATE TABLE IF NOT EXISTS clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create club_members table
CREATE TABLE IF NOT EXISTS club_members (
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role club_role DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (club_id, user_id)
);

-- Create testbanks table
CREATE TABLE IF NOT EXISTS testbanks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    owner_club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
    visibility visibility DEFAULT 'private',
    generation_method generation_method DEFAULT 'manual',
    recommended_usage recommended_usage DEFAULT 'full_manual',
    review_status review_status DEFAULT 'not_reviewed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    current_testbank_id UUID REFERENCES testbanks(id) ON DELETE CASCADE NOT NULL,
    original_testbank_id UUID REFERENCES testbanks(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    type question_type DEFAULT 'mcq',
    difficulty difficulty DEFAULT 'medium',
    topic TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    options JSONB,
    answer TEXT,
    answer_guidelines TEXT,
    marking_method marking_method DEFAULT 'manual_only',
    author_type author_type DEFAULT 'user',
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create testbank_permissions table
CREATE TABLE IF NOT EXISTS testbank_permissions (
    testbank_id UUID REFERENCES testbanks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    permission_level permission_level NOT NULL,
    status permission_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (testbank_id, user_id)
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    major TEXT,
    course_type course_type DEFAULT 'course',
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    owner_club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
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
CREATE TABLE IF NOT EXISTS course_enrollments (
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role course_role DEFAULT 'student',
    enrollment_mode enrollment_mode DEFAULT 'full_enroll',
    grade JSONB,
    is_visible_on_profile BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (course_id, user_id)
);

-- Create course_content table
CREATE TABLE IF NOT EXISTS course_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type content_type NOT NULL,
    content_url TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_course_progress table
CREATE TABLE IF NOT EXISTS user_course_progress (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    status progress_status DEFAULT 'not_started',
    mastery_score DECIMAL DEFAULT 0,
    importance_index DECIMAL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, content_id)
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    testbank_id UUID REFERENCES testbanks(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    config JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignment_submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status submission_status DEFAULT 'in_progress',
    score DECIMAL,
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenger_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    opponent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    credit_pot INTEGER NOT NULL,
    status challenge_status DEFAULT 'pending',
    winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create credits_ledger table
CREATE TABLE IF NOT EXISTS credits_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    related_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type chat_type NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ
);

-- Create chat_participants table
CREATE TABLE IF NOT EXISTS chat_participants (
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (chat_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    reported_content_type content_type_report NOT NULL,
    reported_content_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status report_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status friend_request_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id),
    CHECK (sender_id != receiver_id)
);

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id < user2_id)
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_testbanks_owner_id ON testbanks(owner_id);
CREATE INDEX IF NOT EXISTS idx_questions_testbank_id ON questions(current_testbank_id);
CREATE INDEX IF NOT EXISTS idx_courses_owner_id ON courses(owner_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user1_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user2_id);

-- Create essential functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_notification(
    user_id UUID,
    content TEXT,
    link TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, content, link)
    VALUES (user_id, content, link)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat(
    user1_id UUID,
    user2_id UUID
)
RETURNS UUID AS $$
DECLARE
    chat_id UUID;
BEGIN
    -- Try to find existing direct chat between these users
    SELECT c.id INTO chat_id
    FROM chats c
    WHERE c.type = 'direct'
    AND EXISTS (
        SELECT 1 FROM chat_participants cp1 
        WHERE cp1.chat_id = c.id AND cp1.user_id = user1_id
    )
    AND EXISTS (
        SELECT 1 FROM chat_participants cp2 
        WHERE cp2.chat_id = c.id AND cp2.user_id = user2_id
    )
    AND (
        SELECT COUNT(*) FROM chat_participants cp 
        WHERE cp.chat_id = c.id
    ) = 2;
    
    -- If no chat exists, create one
    IF chat_id IS NULL THEN
        INSERT INTO chats (type) VALUES ('direct') RETURNING id INTO chat_id;
        
        INSERT INTO chat_participants (chat_id, user_id) VALUES (chat_id, user1_id);
        INSERT INTO chat_participants (chat_id, user_id) VALUES (chat_id, user2_id);
    END IF;
    
    RETURN chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_friend_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
    -- Create friendship when request is accepted
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO public.friendships (user1_id, user2_id)
        VALUES (
            LEAST(NEW.sender_id, NEW.receiver_id),
            GREATEST(NEW.sender_id, NEW.receiver_id)
        )
        ON CONFLICT DO NOTHING;
        
        -- Notify sender
        PERFORM public.create_notification(
            NEW.sender_id,
            'Your friend request was accepted!',
            '/social'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_friend_request_updated ON friend_requests;
CREATE TRIGGER on_friend_request_updated
    AFTER UPDATE ON friend_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_friend_request_accepted();
