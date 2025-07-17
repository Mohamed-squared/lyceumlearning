export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          credits: number
          role: "user" | "admin"
          created_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          credits?: number
          role?: "user" | "admin"
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          credits?: number
          role?: "user" | "admin"
          created_at?: string
        }
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          created_at?: string
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
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          created_at?: string
        }
      }
      testbanks: {
        Row: {
          id: string
          owner_id: string | null
          owner_club_id: string | null
          visibility: "opensource" | "restricted" | "private"
          generation_method: "ai" | "manual" | "parsed" | "hybrid"
          review_status: "not_reviewed" | "manually_reviewed"
          recommended_usage: "semi_random" | "hybrid_manual" | "full_manual"
          title: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          owner_club_id?: string | null
          visibility?: "opensource" | "restricted" | "private"
          generation_method?: "ai" | "manual" | "parsed" | "hybrid"
          review_status?: "not_reviewed" | "manually_reviewed"
          recommended_usage?: "semi_random" | "hybrid_manual" | "full_manual"
          title: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string | null
          owner_club_id?: string | null
          visibility?: "opensource" | "restricted" | "private"
          generation_method?: "ai" | "manual" | "parsed" | "hybrid"
          review_status?: "not_reviewed" | "manually_reviewed"
          recommended_usage?: "semi_random" | "hybrid_manual" | "full_manual"
          title?: string
          description?: string | null
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          original_testbank_id: string
          current_testbank_id: string
          author_id: string | null
          author_type: "ai" | "user"
          question_type: "mcq" | "multipart_problem" | "singlepart_problem"
          topic: string
          content: string
          options: any | null
          answer: string | null
          answer_guidelines: string | null
          marking_method: "allow_ai" | "manual_only"
          difficulty: "easy" | "medium" | "hard"
          keywords: string[]
          created_at: string
        }
        Insert: {
          id?: string
          original_testbank_id: string
          current_testbank_id: string
          author_id?: string | null
          author_type?: "ai" | "user"
          question_type?: "mcq" | "multipart_problem" | "singlepart_problem"
          topic: string
          content: string
          options?: any | null
          answer?: string | null
          answer_guidelines?: string | null
          marking_method?: "allow_ai" | "manual_only"
          difficulty?: "easy" | "medium" | "hard"
          keywords?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          original_testbank_id?: string
          current_testbank_id?: string
          author_id?: string | null
          author_type?: "ai" | "user"
          question_type?: "mcq" | "multipart_problem" | "singlepart_problem"
          topic?: string
          content?: string
          options?: any | null
          answer?: string | null
          answer_guidelines?: string | null
          marking_method?: "allow_ai" | "manual_only"
          difficulty?: "easy" | "medium" | "hard"
          keywords?: string[]
          created_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          course_type: "textbook" | "course" | "reading_group" | "classroom"
          owner_id: string | null
          owner_club_id: string | null
          major: string | null
          subject: string | null
          prerequisites: string[]
          corequisites: string[]
          keywords: string[]
          syllabus: any | null
          marking_scheme: any | null
          is_archived: boolean
          is_starred_by_admin: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          course_type?: "textbook" | "course" | "reading_group" | "classroom"
          owner_id?: string | null
          owner_club_id?: string | null
          major?: string | null
          subject?: string | null
          prerequisites?: string[]
          corequisites?: string[]
          keywords?: string[]
          syllabus?: any | null
          marking_scheme?: any | null
          is_archived?: boolean
          is_starred_by_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          course_type?: "textbook" | "course" | "reading_group" | "classroom"
          owner_id?: string | null
          owner_club_id?: string | null
          major?: string | null
          subject?: string | null
          prerequisites?: string[]
          corequisites?: string[]
          keywords?: string[]
          syllabus?: any | null
          marking_scheme?: any | null
          is_archived?: boolean
          is_starred_by_admin?: boolean
          created_at?: string
        }
      }
      credits_ledger: {
        Row: {
          id: string
          user_id: string
          amount: number
          reason: string
          related_entity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          reason: string
          related_entity_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          reason?: string
          related_entity_id?: string | null
          created_at?: string
        }
      }
      clubs: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          content: string
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
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
