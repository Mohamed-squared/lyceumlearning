export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      assignment_submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          id: string
          score: number | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          id?: string
          score?: number | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          id?: string
          score?: number | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string
          user_id?: string
        }
      }
      assignments: {
        Row: {
          config: Json
          course_id: string
          created_at: string
          id: string
          is_default: boolean
          testbank_id: string | null
          title: string
        }
        Insert: {
          config: Json
          course_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          testbank_id?: string | null
          title: string
        }
        Update: {
          config?: Json
          course_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          testbank_id?: string | null
          title?: string
        }
      }
      challenges: {
        Row: {
          challenger_id: string
          course_id: string
          created_at: string
          credit_pot: number
          id: string
          opponent_id: string
          status: Database["public"]["Enums"]["challenge_status"]
          winner_id: string | null
        }
        Insert: {
          challenger_id: string
          course_id: string
          created_at?: string
          credit_pot: number
          id?: string
          opponent_id: string
          status?: Database["public"]["Enums"]["challenge_status"]
          winner_id?: string | null
        }
        Update: {
          challenger_id?: string
          course_id?: string
          created_at?: string
          credit_pot?: number
          id?: string
          opponent_id?: string
          status?: Database["public"]["Enums"]["challenge_status"]
          winner_id?: string | null
        }
      }
      chat_participants: {
        Row: {
          chat_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          chat_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          joined_at?: string
          user_id?: string
        }
      }
      chats: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          name: string | null
          type: Database["public"]["Enums"]["chat_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          name?: string | null
          type: Database["public"]["Enums"]["chat_type"]
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          name?: string | null
          type?: Database["public"]["Enums"]["chat_type"]
        }
      }
      club_members: {
        Row: {
          club_id: string
          joined_at: string
          role: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Insert: {
          club_id: string
          joined_at?: string
          role?: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Update: {
          club_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["club_role"]
          user_id?: string
        }
      }
      clubs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          post_id?: string
          user_id?: string
        }
      }
      course_content: {
        Row: {
          content_url: string | null
          course_id: string
          created_at: string
          id: string
          order: number
          parent_id: string | null
          title: string
          type: Database["public"]["Enums"]["content_type"]
        }
        Insert: {
          content_url?: string | null
          course_id: string
          created_at?: string
          id?: string
          order: number
          parent_id?: string | null
          title: string
          type: Database["public"]["Enums"]["content_type"]
        }
        Update: {
          content_url?: string | null
          course_id?: string
          created_at?: string
          id?: string
          order?: number
          parent_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
        }
      }
      course_enrollments: {
        Row: {
          course_id: string
          enrollment_mode: Database["public"]["Enums"]["enrollment_mode"]
          grade: Json | null
          is_visible_on_profile: boolean
          role: Database["public"]["Enums"]["course_role"]
          user_id: string
        }
        Insert: {
          course_id: string
          enrollment_mode?: Database["public"]["Enums"]["enrollment_mode"]
          grade?: Json | null
          is_visible_on_profile?: boolean
          role?: Database["public"]["Enums"]["course_role"]
          user_id: string
        }
        Update: {
          course_id?: string
          enrollment_mode?: Database["public"]["Enums"]["enrollment_mode"]
          grade?: Json | null
          is_visible_on_profile?: boolean
          role?: Database["public"]["Enums"]["course_role"]
          user_id?: string
        }
      }
      courses: {
        Row: {
          corequisites: string[]
          course_type: Database["public"]["Enums"]["course_type"]
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          is_starred_by_admin: boolean
          keywords: string[]
          major: string | null
          marking_scheme: Json | null
          owner_club_id: string | null
          owner_id: string | null
          prerequisites: string[]
          subject: string | null
          syllabus: Json | null
          title: string
        }
        Insert: {
          corequisites?: string[]
          course_type?: Database["public"]["Enums"]["course_type"]
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_starred_by_admin?: boolean
          keywords?: string[]
          major?: string | null
          marking_scheme?: Json | null
          owner_club_id?: string | null
          owner_id?: string | null
          prerequisites?: string[]
          subject?: string | null
          syllabus?: Json | null
          title: string
        }
        Update: {
          corequisites?: string[]
          course_type?: Database["public"]["Enums"]["course_type"]
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_starred_by_admin?: boolean
          keywords?: string[]
          major?: string | null
          marking_scheme?: Json | null
          owner_club_id?: string | null
          owner_id?: string | null
          prerequisites?: string[]
          subject?: string | null
          syllabus?: Json | null
          title?: string
        }
      }
      credits_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          related_entity_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          related_entity_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          related_entity_id?: string | null
          user_id?: string
        }
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          user_id?: string
        }
      }
      post_upvotes: {
        Row: {
          post_id: string
          user_id: string
        }
        Insert: {
          post_id: string
          user_id: string
        }
        Update: {
          post_id?: string
          user_id?: string
        }
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          user_id?: string
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          credits: number
          full_name: string | null
          id: string
          is_banned: boolean
          role: Database["public"]["Enums"]["user_role"]
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          credits?: number
          full_name?: string | null
          id: string
          is_banned?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          credits?: number
          full_name?: string | null
          id?: string
          is_banned?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          username?: string
        }
      }
      questions: {
        Row: {
          answer: string | null
          answer_guidelines: string | null
          author_id: string | null
          author_type: Database["public"]["Enums"]["author_type"]
          content: string
          created_at: string
          current_testbank_id: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          id: string
          keywords: string[]
          marking_method: Database["public"]["Enums"]["marking_method"]
          options: Json | null
          original_testbank_id: string
          topic: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          answer?: string | null
          answer_guidelines?: string | null
          author_id?: string | null
          author_type?: Database["public"]["Enums"]["author_type"]
          content: string
          created_at?: string
          current_testbank_id: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id?: string
          keywords?: string[]
          marking_method?: Database["public"]["Enums"]["marking_method"]
          options?: Json | null
          original_testbank_id: string
          topic: string
          type?: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          answer?: string | null
          answer_guidelines?: string | null
          author_id?: string | null
          author_type?: Database["public"]["Enums"]["author_type"]
          content?: string
          created_at?: string
          current_testbank_id?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id?: string
          keywords?: string[]
          marking_method?: Database["public"]["Enums"]["marking_method"]
          options?: Json | null
          original_testbank_id?: string
          topic?: string
          type?: Database["public"]["Enums"]["question_type"]
        }
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported_content_id: string
          reported_content_type: Database["public"]["Enums"]["content_type_report"]
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reported_content_id: string
          reported_content_type: Database["public"]["Enums"]["content_type_report"]
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported_content_id?: string
          reported_content_type?: Database["public"]["Enums"]["content_type_report"]
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
        }
      }
      testbank_permissions: {
        Row: {
          created_at: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          status: Database["public"]["Enums"]["permission_status"]
          testbank_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          permission_level: Database["public"]["Enums"]["permission_level"]
          status?: Database["public"]["Enums"]["permission_status"]
          testbank_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          permission_level?: Database["public"]["Enums"]["permission_level"]
          status?: Database["public"]["Enums"]["permission_status"]
          testbank_id?: string
          user_id?: string
        }
      }
      testbanks: {
        Row: {
          created_at: string
          description: string | null
          generation_method: Database["public"]["Enums"]["generation_method"]
          id: string
          owner_club_id: string | null
          owner_id: string | null
          recommended_usage: Database["public"]["Enums"]["recommended_usage"]
          review_status: Database["public"]["Enums"]["review_status"]
          title: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          generation_method?: Database["public"]["Enums"]["generation_method"]
          id?: string
          owner_club_id?: string | null
          owner_id?: string | null
          recommended_usage?: Database["public"]["Enums"]["recommended_usage"]
          review_status?: Database["public"]["Enums"]["review_status"]
          title: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          created_at?: string
          description?: string | null
          generation_method?: Database["public"]["Enums"]["generation_method"]
          id?: string
          owner_club_id?: string | null
          owner_id?: string | null
          recommended_usage?: Database["public"]["Enums"]["recommended_usage"]
          review_status?: Database["public"]["Enums"]["review_status"]
          title?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
      }
      user_course_progress: {
        Row: {
          content_id: string
          importance_index: number
          last_accessed_at: string
          mastery_score: number
          status: Database["public"]["Enums"]["progress_status"]
          user_id: string
        }
        Insert: {
          content_id: string
          importance_index?: number
          last_accessed_at?: string
          mastery_score?: number
          status?: Database["public"]["Enums"]["progress_status"]
          user_id: string
        }
        Update: {
          content_id?: string
          importance_index?: number
          last_accessed_at?: string
          mastery_score?: number
          status?: Database["public"]["Enums"]["progress_status"]
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          user_id: string
          content: string
          link?: string
        }
        Returns: void
      }
      update_user_credits: {
        Args: {
          user_id: string
          amount: number
          reason: string
          related_id?: string
        }
        Returns: void
      }
      get_or_create_direct_chat: {
        Args: {
          user1_id: string
          user2_id: string
        }
        Returns: string
      }
      ban_user: {
        Args: {
          user_id: string
        }
        Returns: void
      }
      unban_user: {
        Args: {
          user_id: string
        }
        Returns: void
      }
    }
    Enums: {
      author_type: "ai" | "user"
      challenge_status: "pending" | "active" | "completed" | "declined"
      chat_type: "direct" | "group"
      club_role: "member" | "moderator" | "owner"
      content_type: "chapter" | "section" | "lecture" | "meeting_recording" | "organizer_material"
      content_type_report: "user" | "post" | "comment" | "course" | "question" | "club"
      course_role: "student" | "moderator"
      course_type: "textbook" | "course" | "reading_group" | "classroom"
      difficulty: "easy" | "medium" | "hard"
      enrollment_mode: "viewer" | "full_enroll" | "hybrid"
      generation_method: "ai" | "manual" | "parsed" | "hybrid"
      marking_method: "allow_ai" | "manual_only"
      permission_level: "view" | "edit" | "use" | "hybrid" | "full"
      permission_status: "pending" | "approved" | "declined"
      progress_status: "not_started" | "in_progress" | "completed"
      question_type: "mcq" | "multipart_problem" | "singlepart_problem"
      recommended_usage: "semi_random" | "hybrid_manual" | "full_manual"
      report_status: "pending" | "resolved" | "dismissed"
      review_status: "not_reviewed" | "manually_reviewed"
      submission_status: "in_progress" | "pending_manual_mark" | "completed"
      user_role: "user" | "admin"
      visibility: "opensource" | "restricted" | "private"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Post = Database["public"]["Tables"]["posts"]["Row"]
export type Comment = Database["public"]["Tables"]["comments"]["Row"]
export type Testbank = Database["public"]["Tables"]["testbanks"]["Row"]
export type Question = Database["public"]["Tables"]["questions"]["Row"]
export type Course = Database["public"]["Tables"]["courses"]["Row"]
export type Club = Database["public"]["Tables"]["clubs"]["Row"]
export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
export type Chat = Database["public"]["Tables"]["chats"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]
export type Assignment = Database["public"]["Tables"]["assignments"]["Row"]
export type AssignmentSubmission = Database["public"]["Tables"]["assignment_submissions"]["Row"]
export type Challenge = Database["public"]["Tables"]["challenges"]["Row"]
export type CourseContent = Database["public"]["Tables"]["course_content"]["Row"]
export type CourseEnrollment = Database["public"]["Tables"]["course_enrollments"]["Row"]
export type UserCourseProgress = Database["public"]["Tables"]["user_course_progress"]["Row"]
