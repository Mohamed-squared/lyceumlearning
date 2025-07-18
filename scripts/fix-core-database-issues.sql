-- Fix missing helper functions and RLS policies that are causing the errors

-- First, create the missing helper function that's referenced in RLS policies
CREATE OR REPLACE FUNCTION public.is_chat_participant(chat_id_input uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_id = chat_id_input AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate problematic RLS policies with correct logic
DO $$ 
DECLARE 
  r RECORD;
BEGIN 
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
  LOOP 
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename); 
  END LOOP; 
END$$;

-- Enable RLS on all tables
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

-- PROFILES - Allow all authenticated users to view and manage their own
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- POSTS - Allow all authenticated users to create and view posts
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- POST UPVOTES - Allow authenticated users to manage upvotes
CREATE POLICY "Anyone can view upvotes" ON public.post_upvotes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage upvotes" ON public.post_upvotes FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users can delete their own upvotes" ON public.post_upvotes FOR DELETE USING (auth.uid() = user_id);

-- COMMENTS - Allow authenticated users to create and manage comments
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- FOLLOWS - Allow authenticated users to manage follows
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create follows" ON public.follows FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = follower_id);
CREATE POLICY "Users can delete their own follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- CLUBS - Allow authenticated users to create and view clubs
CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create clubs" ON public.clubs FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = owner_id);
CREATE POLICY "Club owners can update their clubs" ON public.clubs FOR UPDATE USING (auth.uid() = owner_id);

-- CLUB MEMBERS - Allow club management
CREATE POLICY "Anyone can view club members" ON public.club_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join clubs" ON public.club_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can leave clubs" ON public.club_members FOR DELETE USING (auth.uid() = user_id);

-- TESTBANKS - Allow authenticated users to create and view testbanks
CREATE POLICY "Users can view accessible testbanks" ON public.testbanks FOR SELECT USING (
  visibility = 'opensource' OR auth.uid() = owner_id
);
CREATE POLICY "Authenticated users can create testbanks" ON public.testbanks FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = owner_id);
CREATE POLICY "Owners can update their testbanks" ON public.testbanks FOR UPDATE USING (auth.uid() = owner_id);

-- QUESTIONS - Allow viewing questions from accessible testbanks
CREATE POLICY "Users can view questions from accessible testbanks" ON public.questions FOR SELECT USING (
  testbank_id IN (
    SELECT id FROM public.testbanks WHERE 
    visibility = 'opensource' OR auth.uid() = owner_id
  )
);
CREATE POLICY "Testbank owners can manage questions" ON public.questions FOR ALL USING (
  testbank_id IN (SELECT id FROM public.testbanks WHERE auth.uid() = owner_id)
);

-- CHATS - Allow users to access their chats
CREATE POLICY "Users can view their chats" ON public.chats FOR SELECT USING (
  id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Authenticated users can create chats" ON public.chats FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CHAT PARTICIPANTS - Allow users to manage chat participation
CREATE POLICY "Users can view chat participants" ON public.chat_participants FOR SELECT USING (
  chat_id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Users can join chats" ON public.chat_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- MESSAGES - Allow users to send and view messages in their chats
CREATE POLICY "Users can view messages in their chats" ON public.messages FOR SELECT USING (
  chat_id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Users can send messages to their chats" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND 
  chat_id IN (SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid())
);

-- FRIEND REQUESTS - Allow users to manage friend requests
CREATE POLICY "Users can view friend requests involving them" ON public.friend_requests FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Authenticated users can send friend requests" ON public.friend_requests FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid() = sender_id AND sender_id != receiver_id
);
CREATE POLICY "Users can update friend requests they received" ON public.friend_requests FOR UPDATE USING (
  auth.uid() = receiver_id
);

-- FRIENDSHIPS - Allow users to view their friendships
CREATE POLICY "Users can view their friendships" ON public.friendships FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);
CREATE POLICY "System can create friendships" ON public.friendships FOR INSERT WITH CHECK (true);

-- NOTIFICATIONS - Allow users to manage their notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- CREDITS LEDGER - Allow users to view their credit history
CREATE POLICY "Users can view their own credit history" ON public.credits_ledger FOR SELECT USING (auth.uid() = user_id);

-- Fix the get_or_create_direct_chat function to work with RLS
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

-- Create storage bucket and policies for post images
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
