-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Post upvotes policies
CREATE POLICY "Anyone can view upvotes" ON post_upvotes FOR SELECT USING (true);
CREATE POLICY "Users can manage own upvotes" ON post_upvotes FOR ALL USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON follows FOR ALL USING (auth.uid() = follower_id);

-- Clubs policies
CREATE POLICY "Anyone can view clubs" ON clubs FOR SELECT USING (true);
CREATE POLICY "Users can create clubs" ON clubs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Club owners can update clubs" ON clubs FOR UPDATE USING (auth.uid() = owner_id);

-- Club members policies
CREATE POLICY "Anyone can view club members" ON club_members FOR SELECT USING (true);
CREATE POLICY "Club owners and members can manage membership" ON club_members FOR ALL USING (
    auth.uid() IN (
        SELECT owner_id FROM clubs WHERE id = club_id
        UNION
        SELECT user_id FROM club_members WHERE club_id = club_members.club_id AND user_id = auth.uid()
    )
);

-- Testbanks policies
CREATE POLICY "Users can view accessible testbanks" ON testbanks FOR SELECT USING (
    visibility = 'opensource' OR 
    owner_id = auth.uid() OR
    owner_club_id IN (SELECT club_id FROM club_members WHERE user_id = auth.uid()) OR
    id IN (SELECT testbank_id FROM testbank_permissions WHERE user_id = auth.uid() AND status = 'approved')
);
CREATE POLICY "Users can create testbanks" ON testbanks FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update testbanks" ON testbanks FOR UPDATE USING (auth.uid() = owner_id);

-- Questions policies
CREATE POLICY "Users can view questions from accessible testbanks" ON questions FOR SELECT USING (
    current_testbank_id IN (
        SELECT id FROM testbanks WHERE 
        visibility = 'opensource' OR 
        owner_id = auth.uid() OR
        owner_club_id IN (SELECT club_id FROM club_members WHERE user_id = auth.uid()) OR
        id IN (SELECT testbank_id FROM testbank_permissions WHERE user_id = auth.uid() AND status = 'approved')
    )
);

-- Courses policies
CREATE POLICY "Anyone can view public courses" ON courses FOR SELECT USING (NOT is_archived);
CREATE POLICY "Users can create courses" ON courses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update courses" ON courses FOR UPDATE USING (auth.uid() = owner_id);

-- Course enrollments policies
CREATE POLICY "Users can view course enrollments" ON course_enrollments FOR SELECT USING (
    user_id = auth.uid() OR 
    course_id IN (SELECT id FROM courses WHERE owner_id = auth.uid())
);
CREATE POLICY "Users can manage own enrollments" ON course_enrollments FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Credits ledger policies
CREATE POLICY "Users can view own credit history" ON credits_ledger FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for reports
CREATE POLICY "Admins can view all reports" ON reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
