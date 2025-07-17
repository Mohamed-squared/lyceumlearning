-- Function to create or get conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
    user1_id UUID,
    user2_id UUID
)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    participant1 UUID;
    participant2 UUID;
BEGIN
    -- Ensure consistent ordering of participants
    IF user1_id < user2_id THEN
        participant1 := user1_id;
        participant2 := user2_id;
    ELSE
        participant1 := user2_id;
        participant2 := user1_id;
    END IF;
    
    -- Try to find existing conversation
    SELECT id INTO conversation_id
    FROM conversations
    WHERE participant1_id = participant1 AND participant2_id = participant2;
    
    -- Create conversation if it doesn't exist
    IF conversation_id IS NULL THEN
        INSERT INTO conversations (participant1_id, participant2_id)
        VALUES (participant1, participant2)
        RETURNING id INTO conversation_id;
    END IF;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation timestamp when message is sent
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_id = NEW.id, updated_at = NOW()
    WHERE (participant1_id = NEW.sender_id AND participant2_id = NEW.recipient_id)
       OR (participant1_id = NEW.recipient_id AND participant2_id = NEW.sender_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update conversation when message is sent
CREATE TRIGGER on_message_sent
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

-- Function to handle challenge creation with credit deduction
CREATE OR REPLACE FUNCTION public.create_challenge(
    challenger_id UUID,
    opponent_id UUID,
    course_id UUID,
    credit_amount INTEGER DEFAULT 20
)
RETURNS UUID AS $$
DECLARE
    challenge_id UUID;
    challenger_credits INTEGER;
BEGIN
    -- Check challenger has enough credits
    SELECT credits INTO challenger_credits
    FROM profiles
    WHERE id = challenger_id;
    
    IF challenger_credits < credit_amount THEN
        RAISE EXCEPTION 'Insufficient credits to create challenge';
    END IF;
    
    -- Deduct credits from challenger
    PERFORM public.update_user_credits(
        challenger_id,
        -credit_amount,
        'CHALLENGE_CREATED'
    );
    
    -- Create challenge
    INSERT INTO challenges (challenger_id, opponent_id, course_id, credit_pot)
    VALUES (challenger_id, opponent_id, course_id, credit_amount)
    RETURNING id INTO challenge_id;
    
    -- Notify opponent
    PERFORM public.create_notification(
        opponent_id,
        'You have been challenged to a learning competition!',
        '/inbox'
    );
    
    RETURN challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle challenge completion
CREATE OR REPLACE FUNCTION public.complete_challenge(
    challenge_id UUID,
    winner_id UUID
)
RETURNS VOID AS $$
DECLARE
    challenge_record RECORD;
BEGIN
    -- Get challenge details
    SELECT * INTO challenge_record
    FROM challenges
    WHERE id = challenge_id AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Challenge not found or not active';
    END IF;
    
    -- Update challenge status
    UPDATE challenges
    SET status = 'completed', winner_id = winner_id
    WHERE id = challenge_id;
    
    -- Award credits to winner
    PERFORM public.update_user_credits(
        winner_id,
        challenge_record.credit_pot,
        'CHALLENGE_WON',
        challenge_id
    );
    
    -- Notify both participants
    PERFORM public.create_notification(
        winner_id,
        'Congratulations! You won the challenge and earned ' || challenge_record.credit_pot || ' credits!',
        '/inbox'
    );
    
    PERFORM public.create_notification(
        CASE WHEN winner_id = challenge_record.challenger_id 
             THEN challenge_record.opponent_id 
             ELSE challenge_record.challenger_id END,
        'Challenge completed. Better luck next time!',
        '/inbox'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
