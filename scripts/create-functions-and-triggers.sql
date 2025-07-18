-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Give admin role to specific email
  IF NEW.email = 'mohamed2008309@gmail.com' THEN
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE id = NEW.id;
  END IF;
  
  -- Award signup credits
  PERFORM public.update_user_credits(NEW.id, 50, 'SIGNUP_BONUS');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user credits
CREATE OR REPLACE FUNCTION public.update_user_credits(
  user_id UUID,
  amount INTEGER,
  reason TEXT,
  related_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update user credits
  UPDATE public.profiles
  SET credits = credits + amount
  WHERE id = user_id;
  
  -- Log the transaction
  INSERT INTO public.credits_ledger (user_id, amount, reason, related_entity_id)
  VALUES (user_id, amount, reason, related_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  user_id UUID,
  content TEXT,
  link TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.notifications (user_id, content, link)
  VALUES (user_id, content, link);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle post creation credits
CREATE OR REPLACE FUNCTION public.handle_post_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 5 credits for creating a post
  PERFORM public.update_user_credits(NEW.user_id, 5, 'POST_CREATION', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for post creation
CREATE TRIGGER on_post_created
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_creation();

-- Function to handle popular post credits
CREATE OR REPLACE FUNCTION public.handle_upvote_credits()
RETURNS TRIGGER AS $$
DECLARE
  upvote_count INTEGER;
  post_author_id UUID;
BEGIN
  -- Get the post author and current upvote count
  SELECT user_id INTO post_author_id
  FROM public.posts
  WHERE id = NEW.post_id;
  
  SELECT COUNT(*) INTO upvote_count
  FROM public.post_upvotes
  WHERE post_id = NEW.post_id;
  
  -- Award 25 credits when post reaches 10 upvotes
  IF upvote_count = 10 THEN
    PERFORM public.update_user_credits(post_author_id, 25, 'POPULAR_POST', NEW.post_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for upvote credits
CREATE TRIGGER on_post_upvote
  AFTER INSERT ON public.post_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.handle_upvote_credits();

-- Function to get or create direct chat
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
  FROM public.chats c
  WHERE c.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM public.chat_participants cp1
      WHERE cp1.chat_id = c.id AND cp1.user_id = user1_id
    )
    AND EXISTS (
      SELECT 1 FROM public.chat_participants cp2
      WHERE cp2.chat_id = c.id AND cp2.user_id = user2_id
    );
  
  -- If no existing chat, create one
  IF chat_id IS NULL THEN
    INSERT INTO public.chats (type) VALUES ('direct') RETURNING id INTO chat_id;
    
    -- Add participants
    INSERT INTO public.chat_participants (chat_id, user_id)
    VALUES (chat_id, user1_id), (chat_id, user2_id);
  END IF;
  
  RETURN chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ban user
CREATE OR REPLACE FUNCTION public.ban_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET is_banned = TRUE
  WHERE id = user_id;
  
  -- Create notification
  PERFORM public.create_notification(
    user_id,
    'Your account has been banned. Contact support if you believe this is an error.',
    '/support'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unban user
CREATE OR REPLACE FUNCTION public.unban_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET is_banned = FALSE
  WHERE id = user_id;
  
  -- Create notification
  PERFORM public.create_notification(
    user_id,
    'Your account has been restored. Welcome back to Lyceum!',
    '/dashboard'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update chat last message time
CREATE OR REPLACE FUNCTION public.update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating chat last message time
CREATE TRIGGER on_message_sent
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_chat_last_message();
