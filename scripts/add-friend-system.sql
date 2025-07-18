-- Add friend system tables and functions
-- Run this script to add the complete friend system

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
    -- Drop friend_requests policies
    DROP POLICY IF EXISTS "Users can view friend requests involving them" ON friend_requests;
    DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
    DROP POLICY IF EXISTS "Users can update friend requests they received" ON friend_requests;
    
    -- Drop friendships policies
    DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
    DROP POLICY IF EXISTS "System can create friendships" ON friendships;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- RLS policies for friend_requests
CREATE POLICY "Users can view friend requests involving them" ON friend_requests FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);

CREATE POLICY "Users can send friend requests" ON friend_requests FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND sender_id != receiver_id
);

CREATE POLICY "Users can update friend requests they received" ON friend_requests FOR UPDATE USING (
    auth.uid() = receiver_id
);

-- RLS policies for friendships
CREATE POLICY "Users can view their friendships" ON friendships FOR SELECT USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
);

CREATE POLICY "System can create friendships" ON friendships FOR INSERT WITH CHECK (true);

-- Function to handle friend request acceptance
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
            (SELECT username FROM profiles WHERE id = NEW.receiver_id) || ' accepted your friend request!',
            '/social'
        );
        
        -- Award credits to both users for making a friend
        PERFORM public.update_user_credits(NEW.sender_id, 10, 'FRIEND_MADE', NEW.receiver_id);
        PERFORM public.update_user_credits(NEW.receiver_id, 10, 'FRIEND_MADE', NEW.sender_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for friend request acceptance
DROP TRIGGER IF EXISTS on_friend_request_updated ON friend_requests;
CREATE TRIGGER on_friend_request_updated
    AFTER UPDATE ON friend_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_friend_request_accepted();

-- Function to send friend request with validation
CREATE OR REPLACE FUNCTION public.send_friend_request(
    sender_id UUID,
    receiver_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Check if users are already friends
    IF EXISTS (
        SELECT 1 FROM friendships 
        WHERE (user1_id = LEAST(sender_id, receiver_id) AND user2_id = GREATEST(sender_id, receiver_id))
    ) THEN
        RAISE EXCEPTION 'Users are already friends';
    END IF;
    
    -- Check if request already exists
    IF EXISTS (
        SELECT 1 FROM friend_requests 
        WHERE sender_id = sender_id AND receiver_id = receiver_id AND status = 'pending'
    ) THEN
        RAISE EXCEPTION 'Friend request already sent';
    END IF;
    
    -- Insert friend request
    INSERT INTO friend_requests (sender_id, receiver_id)
    VALUES (sender_id, receiver_id);
    
    -- Notify receiver
    PERFORM public.create_notification(
        receiver_id,
        (SELECT username FROM profiles WHERE id = sender_id) || ' sent you a friend request!',
        '/social'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON friend_requests TO authenticated;
GRANT ALL ON friendships TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_friend_request TO authenticated;
