export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

type Announcement = {
  id: string
  title: string
  body: string
  published: boolean
  created_at: string
  created_by: string | null
}

type Course = {
  id: string
  slug: string
  title: string
  instructor: string
  category: string | null
  description: string | null
  duration: string | null
  event_date: string | null
  thumbnail_url: string | null
  price: string | null
  is_free: boolean
  published: boolean
  created_at: string
  updated_at: string | null
}

type CourseEnrollment = {
  id: string
  user_id: string
  course_id: string
  status: "pending" | "enrolled" | "revoked"
  source: string
  created_at: string
  updated_at: string | null
}

type MemberProfile = {
  id: string
  headline: string | null
  role: string | null
  company: string | null
  location: string | null
  website: string | null
  linkedin_url: string | null
  bio: string | null
  skills: Json
  directory_visible: boolean
  updated_at: string
}

type Resource = {
  id: string
  title: string
  resource_type: string
  url: string
  description: string | null
  published: boolean
  created_at: string
  created_by: string | null
}

type BlogPost = {
  id: string
  title: string
  instructor: string
  event_date: string | null
  thumbnail_url: string | null
  media_url: string | null
  body: string
  published: boolean
  created_at: string
  created_by: string | null
}

type OptionalInsert<Row, Required extends keyof Row> = Pick<Row, Required> & Partial<Omit<Row, Required>>

export type Database = {
  public: {
    Tables: {
      announcements: Table<Announcement, OptionalInsert<Announcement, "title" | "body">>
      blog_posts: Table<BlogPost, OptionalInsert<BlogPost, "title" | "instructor" | "body">>
      courses: Table<Course, OptionalInsert<Course, "slug" | "title" | "instructor">>
      course_enrollments: Table<CourseEnrollment, OptionalInsert<CourseEnrollment, "user_id" | "course_id">>
      member_profiles: Table<MemberProfile, OptionalInsert<MemberProfile, "id">>
      resources: Table<Resource, OptionalInsert<Resource, "title" | "resource_type" | "url">>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
