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
    
    -- Grant admin role to specific email
    IF NEW.email = 'mohamed2008309@gmail.com' THEN
        UPDATE public.profiles 
        SET role = 'admin' 
        WHERE id = NEW.id;
    END IF;
    
    -- Add signup credit
    INSERT INTO public.credits_ledger (user_id, amount, reason)
    VALUES (NEW.id, 100, 'SIGNUP_BONUS');
    
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
    -- Update credits in profiles table
    UPDATE profiles 
    SET credits = credits + amount 
    WHERE id = user_id;
    
    -- Log the transaction
    INSERT INTO credits_ledger (user_id, amount, reason, related_entity_id)
    VALUES (user_id, amount, reason, related_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
    user_id UUID,
    content TEXT,
    link TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO notifications (user_id, content, link)
    VALUES (user_id, content, link);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle post creation credits
CREATE OR REPLACE FUNCTION public.handle_post_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Award credits for post creation
    PERFORM public.update_user_credits(NEW.user_id, 5, 'POST_CREATION', NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for post creation
CREATE TRIGGER on_post_created
    AFTER INSERT ON posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_post_creation();

-- Function to handle upvote credits (first 10 upvotes)
CREATE OR REPLACE FUNCTION public.handle_upvote_credits()
RETURNS TRIGGER AS $$
DECLARE
    upvote_count INTEGER;
    post_owner_id UUID;
BEGIN
    -- Get post owner and current upvote count
    SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
    SELECT COUNT(*) INTO upvote_count FROM post_upvotes WHERE post_id = NEW.post_id;
    
    -- Award credits for first 10 upvotes
    IF upvote_count <= 10 THEN
        PERFORM public.update_user_credits(post_owner_id, 1, 'POST_UPVOTE', NEW.post_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for upvote credits
CREATE TRIGGER on_upvote_created
    AFTER INSERT ON post_upvotes
    FOR EACH ROW EXECUTE FUNCTION public.handle_upvote_credits();
