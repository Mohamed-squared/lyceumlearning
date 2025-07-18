-- Verification script to check if database is properly configured
-- Run this to verify everything is working correctly

-- Check if all required tables exist
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    table_name TEXT;
    required_tables TEXT[] := ARRAY[
        'profiles', 'follows', 'posts', 'post_upvotes', 'comments',
        'clubs', 'club_members', 'testbanks', 'questions', 'testbank_permissions',
        'courses', 'course_enrollments', 'course_content', 'user_course_progress',
        'assignments', 'assignment_submissions', 'challenges', 'credits_ledger',
        'chats', 'chat_participants', 'messages', 'notifications', 'reports',
        'friend_requests', 'friendships'
    ];
BEGIN
    FOREACH table_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'All required tables exist ✓';
    END IF;
END $$;

-- Check if all required functions exist
DO $$
DECLARE
    missing_functions TEXT[] := ARRAY[]::TEXT[];
    function_name TEXT;
    required_functions TEXT[] := ARRAY[
        'handle_new_user', 'create_notification', 'get_or_create_direct_chat', 'handle_friend_request_accepted'
    ];
BEGIN
    FOREACH function_name IN ARRAY required_functions
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = function_name AND routine_schema = 'public') THEN
            missing_functions := array_append(missing_functions, function_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_functions, 1) > 0 THEN
        RAISE NOTICE 'Missing functions: %', array_to_string(missing_functions, ', ');
    ELSE
        RAISE NOTICE 'All required functions exist ✓';
    END IF;
END $$;

-- Check if RLS is enabled on all tables
DO $$
DECLARE
    tables_without_rls TEXT[] := ARRAY[]::TEXT[];
    table_name TEXT;
    required_tables TEXT[] := ARRAY[
        'profiles', 'follows', 'posts', 'post_upvotes', 'comments',
        'clubs', 'club_members', 'testbanks', 'questions', 'testbank_permissions',
        'courses', 'course_enrollments', 'course_content', 'user_course_progress',
        'assignments', 'assignment_submissions', 'challenges', 'credits_ledger',
        'chats', 'chat_participants', 'messages', 'notifications', 'reports',
        'friend_requests', 'friendships'
    ];
BEGIN
    FOREACH table_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = table_name 
            AND n.nspname = 'public' 
            AND c.relrowsecurity = true
        ) THEN
            tables_without_rls := array_append(tables_without_rls, table_name);
        END IF;
    END LOOP;
    
    IF array_length(tables_without_rls, 1) > 0 THEN
        RAISE NOTICE 'Tables without RLS: %', array_to_string(tables_without_rls, ', ');
    ELSE
        RAISE NOTICE 'RLS enabled on all tables ✓';
    END IF;
END $$;

-- Test basic functionality
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Test if we can create a test notification (this tests the function)
    IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
        SELECT id INTO test_user_id FROM auth.users LIMIT 1;
        PERFORM public.create_notification(test_user_id, 'Database verification test', '/test');
        RAISE NOTICE 'Notification function working ✓';
    ELSE
        RAISE NOTICE 'No users found to test notification function';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Notification function failed: %', SQLERRM;
END $$;

-- Show table counts
SELECT 
    t.schemaname,
    t.tablename,
    t.n_tup_ins as inserts,
    t.n_tup_upd as updates,
    t.n_tup_del as deletes,
    t.n_live_tup as live_rows
FROM pg_stat_user_tables t
WHERE t.schemaname = 'public'
ORDER BY t.tablename;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Database verification complete!';
END $$;
