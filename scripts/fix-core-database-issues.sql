-- PERFECT DATABASE FIX SCRIPT
-- This script will fix all RLS policies, functions, and database issues

-- Step 1: Drop all existing RLS policies FIRST (before dropping functions)
DO $$ 
DECLARE 
  r RECORD;
BEGIN 
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
  LOOP 
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename); 
  END LOOP; 
END$$;

-- Step 2: Now drop all existing functions (no dependencies left)
DROP FUNCTION IF EXISTS public.is_chat_participant(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_direct_chat(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_accepted_friend_request() CASCADE;
DROP FUNCTION IF EXISTS public.ban_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.unban_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_credits(uuid, integer, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_club_owner(uuid) CASCADE;

-- Step 3: Create all necessary helper functions
CREATE OR REPLACE FUNCTION public.is_chat_participant(chat_id_input uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_id = chat_id_input AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_club_owner(club_id_input uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clubs
    WHERE id = club_id_input AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_accepted_friend_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    INSERT INTO public.friendships (user1_id, user2_id)
    VALUES (LEAST(NEW.sender_id, NEW.receiver_id), GREATEST(NEW.sender_id, NEW.receiver_id))
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user' || substr(new.id::text, 1, 8)),
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  chat_id uuid;
BEGIN
  -- Check if user is authorized (must be one of the participants)
  IF auth.uid() NOT IN (user1_id, user2_id) THEN
    RAISE EXCEPTION 'Not authorized to create this chat';
  END IF;

  -- Try to find existing direct chat between these users
  SELECT c.id INTO chat_id
  FROM public.chats c
  JOIN public.chat_participants cp1 ON c.id = cp1.chat_id
  JOIN public.chat_participants cp2 ON c.id = cp2.chat_id
  WHERE c.type = 'direct'
    AND cp1.user_id = user1_id
    AND cp2.user_id = user2_id
    AND cp1.user_id != cp2.user_id;

  -- If no existing chat, create one
  IF chat_id IS NULL THEN
    INSERT INTO public.chats (type) VALUES ('direct') RETURNING id INTO chat_id;
    
    -- Add participants
    INSERT INTO public.chat_participants (chat_id, user_id)
    VALUES (chat_id, user1_id), (chat_id, user2_id);
  END IF;

  RETURN chat_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ban_user(user_id_input uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Forbidden: Admin access required';
  END IF;
  
  UPDATE public.profiles SET is_banned = TRUE WHERE id = user_id_input;
END;
$$;

CREATE OR REPLACE FUNCTION public.unban_user(user_id_input uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Forbidden: Admin access required';
  END IF;
  
  UPDATE public.profiles SET is_banned = FALSE WHERE id = user_id_input;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_credits(user_id_input uuid, amount_input int, reason_input text, related_id_input uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles SET credits = credits + amount_input WHERE id = user_id_input;
  INSERT INTO public.credits_ledger (user_id, amount, reason, related_entity_id)
  VALUES (user_id_input, amount_input, reason_input, related_id_input);
END;
$$;

-- Step 4: Create triggers
DROP TRIGGER IF EXISTS on_friend_requests_update ON public.friend_requests;
CREATE TRIGGER on_friend_requests_update 
  BEFORE UPDATE ON public.friend_requests 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_friend_request_accepted ON public.friend_requests;
CREATE TRIGGER on_friend_request_accepted 
  AFTER UPDATE ON public.friend_requests 
  FOR EACH ROW 
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'accepted') 
  EXECUTE PROCEDURE public.handle_accepted_friend_request();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 5: Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testbanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testbank_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;

-- Step 6: Create comprehensive RLS policies

-- PROFILES - Allow viewing and self-management
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- POSTS - Social media functionality
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- POST UPVOTES
CREATE POLICY "Anyone can view upvotes" ON public.post_upvotes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage upvotes" ON public.post_upvotes FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users can delete their own upvotes" ON public.post_upvotes FOR DELETE USING (auth.uid() = user_id);

-- COMMENTS
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- FOLLOWS
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create follows" ON public.follows FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = follower_id);
CREATE POLICY "Users can delete their own follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- CLUBS
CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create clubs" ON public.clubs FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = owner_id);
CREATE POLICY "Club owners can update their clubs" ON public.clubs FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Club owners can delete their clubs" ON public.clubs FOR DELETE USING (auth.uid() = owner_id);

-- CLUB MEMBERS
CREATE POLICY "Anyone can view club members" ON public.club_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join clubs" ON public.club_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can leave clubs" ON public.club_members FOR DELETE USING (auth.uid() = user_id);

-- TESTBANKS
CREATE POLICY "Users can view accessible testbanks" ON public.testbanks FOR SELECT USING (
  visibility = 'opensource' OR auth.uid() = owner_id
);
CREATE POLICY "Authenticated users can create testbanks" ON public.testbanks FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = owner_id);
CREATE POLICY "Owners can update their testbanks" ON public.testbanks FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their testbanks" ON public.testbanks FOR DELETE USING (auth.uid() = owner_id);

-- QUESTIONS
CREATE POLICY "Users can view questions from accessible testbanks" ON public.questions FOR SELECT USING (
  testbank_id IN (
    SELECT id FROM public.testbanks WHERE 
    visibility = 'opensource' OR auth.uid() = owner_id
  )
);
CREATE POLICY "Testbank owners can manage questions" ON public.questions FOR ALL USING (
  testbank_id IN (SELECT id FROM public.testbanks WHERE auth.uid() = owner_id)
);

-- CHATS
CREATE POLICY "Users can view their chats" ON public.chats FOR SELECT USING (
  id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Authenticated users can create chats" ON public.chats FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CHAT PARTICIPANTS
CREATE POLICY "Users can view chat participants" ON public.chat_participants FOR SELECT USING (
  chat_id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Users can join chats" ON public.chat_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- MESSAGES
CREATE POLICY "Users can view messages in their chats" ON public.messages FOR SELECT USING (
  chat_id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Users can send messages to their chats" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND 
  chat_id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid())
);

-- FRIEND REQUESTS
CREATE POLICY "Users can view friend requests involving them" ON public.friend_requests FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Authenticated users can send friend requests" ON public.friend_requests FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid() = sender_id AND sender_id != receiver_id
);
CREATE POLICY "Users can update friend requests they received" ON public.friend_requests FOR UPDATE USING (
  auth.uid() = receiver_id
);

-- FRIENDSHIPS
CREATE POLICY "Users can view their friendships" ON public.friendships FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- NOTIFICATIONS
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- CREDITS LEDGER
CREATE POLICY "Users can view their own credit history" ON public.credits_ledger FOR SELECT USING (auth.uid() = user_id);

-- COURSES
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create courses" ON public.courses FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = instructor_id);
CREATE POLICY "Instructors can update their courses" ON public.courses FOR UPDATE USING (auth.uid() = instructor_id);

-- COURSE ENROLLMENTS
CREATE POLICY "Users can view their enrollments" ON public.course_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll in courses" ON public.course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ASSIGNMENTS
CREATE POLICY "Users can view assignments from enrolled courses" ON public.assignments FOR SELECT USING (
  course_id IN (SELECT course_id FROM public.course_enrollments WHERE user_id = auth.uid())
);
CREATE POLICY "Instructors can manage assignments" ON public.assignments FOR ALL USING (
  course_id IN (SELECT id FROM public.courses WHERE instructor_id = auth.uid())
);

-- ASSIGNMENT SUBMISSIONS
CREATE POLICY "Users can view their own submissions" ON public.assignment_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create submissions" ON public.assignment_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own submissions" ON public.assignment_submissions FOR UPDATE USING (auth.uid() = user_id);

-- CHALLENGES
CREATE POLICY "Anyone can view challenges" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create challenges" ON public.challenges FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = creator_id);

-- REPORTS
CREATE POLICY "Authenticated users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = reporter_id);
CREATE POLICY "Admins can manage reports" ON public.reports FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- TESTBANK PERMISSIONS
CREATE POLICY "Users can view testbank permissions" ON public.testbank_permissions FOR SELECT USING (
  auth.uid() = user_id OR 
  testbank_id IN (SELECT id FROM public.testbanks WHERE owner_id = auth.uid())
);

-- USER COURSE PROGRESS
CREATE POLICY "Users can view their own progress" ON public.user_course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_course_progress FOR ALL USING (auth.uid() = user_id);

-- COURSE CONTENT
CREATE POLICY "Users can view content from enrolled courses" ON public.course_content FOR SELECT USING (
  course_id IN (SELECT course_id FROM public.course_enrollments WHERE user_id = auth.uid())
);
CREATE POLICY "Instructors can manage course content" ON public.course_content FOR ALL USING (
  course_id IN (SELECT id FROM public.courses WHERE instructor_id = auth.uid())
);

-- Step 7: Create storage bucket and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;

-- Create storage policies
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- Step 8: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
