-- Add messages table for chat functionality
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add conversations table to track message threads
CREATE TABLE conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    participant1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    participant2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    last_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant1_id, participant2_id)
);

-- Enable RLS on new tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view messages they sent or received" ON messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
);

CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
);

CREATE POLICY "Users can update messages they received" ON messages FOR UPDATE USING (
    auth.uid() = recipient_id
);

-- RLS policies for conversations
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
);

CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
);

CREATE POLICY "Users can update their conversations" ON conversations FOR UPDATE USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
);
