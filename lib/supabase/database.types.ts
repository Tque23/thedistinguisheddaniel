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

type CourseCertificate = {
  id: string
  user_id: string
  course_id: string | null
  member_name: string
  course_title: string
  instructor: string
  certificate_code: string
  issued_at: string
  issued_by: string | null
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

type CourseLearningPath = {
  id: string
  course_id: string
  title: string
  description: string
  published: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

type CourseSession = {
  id: string
  course_id: string
  path_id: string | null
  title: string
  description: string
  video_url: string | null
  duration_minutes: number
  position: number
  published: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

type CourseMaterial = {
  id: string
  course_id: string
  session_id: string | null
  title: string
  description: string
  resource_type: string
  url: string
  position: number
  published: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

type CourseAssessment = {
  id: string
  course_id: string
  session_id: string | null
  title: string
  instructions: string
  max_attempts: number
  published: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

type CourseAssessmentQuestion = {
  id: string
  assessment_id: string
  prompt: string
  question_type: "multiple_choice" | "true_false" | "written"
  options: Json
  points: number
  position: number
}

type CourseAssessmentAnswerKey = {
  question_id: string
  correct_answer: string
}

type CourseAssessmentAttempt = {
  id: string
  assessment_id: string
  user_id: string
  status: "pending_review" | "graded"
  score: number
  max_score: number
  submitted_at: string
  graded_at: string | null
  graded_by: string | null
}

type CourseAssessmentAnswer = {
  id: string
  attempt_id: string
  question_id: string
  answer: string
  is_correct: boolean | null
  points_awarded: number | null
  feedback: string
}

type CourseSessionCompletion = {
  user_id: string
  session_id: string
  completed_at: string
}

type OptionalInsert<Row, Required extends keyof Row> = Pick<Row, Required> & Partial<Omit<Row, Required>>

export type Database = {
  public: {
    Tables: {
      announcements: Table<Announcement, OptionalInsert<Announcement, "title" | "body">>
      blog_posts: Table<BlogPost, OptionalInsert<BlogPost, "title" | "instructor" | "body">>
      courses: Table<Course, OptionalInsert<Course, "slug" | "title" | "instructor">>
      course_assessment_answers: Table<CourseAssessmentAnswer, OptionalInsert<CourseAssessmentAnswer, "attempt_id" | "question_id" | "answer">>
      course_assessment_answer_keys: Table<CourseAssessmentAnswerKey, CourseAssessmentAnswerKey>
      course_assessment_attempts: Table<CourseAssessmentAttempt, OptionalInsert<CourseAssessmentAttempt, "assessment_id" | "user_id" | "max_score">>
      course_assessment_questions: Table<CourseAssessmentQuestion, OptionalInsert<CourseAssessmentQuestion, "assessment_id" | "prompt" | "question_type">>
      course_assessments: Table<CourseAssessment, OptionalInsert<CourseAssessment, "course_id" | "title">>
      course_certificates: Table<CourseCertificate, OptionalInsert<CourseCertificate, "user_id" | "member_name" | "course_title" | "instructor">>
      course_enrollments: Table<CourseEnrollment, OptionalInsert<CourseEnrollment, "user_id" | "course_id">>
      course_learning_paths: Table<CourseLearningPath, OptionalInsert<CourseLearningPath, "course_id" | "title">>
      course_materials: Table<CourseMaterial, OptionalInsert<CourseMaterial, "course_id" | "title" | "resource_type" | "url">>
      course_session_completions: Table<CourseSessionCompletion, OptionalInsert<CourseSessionCompletion, "user_id" | "session_id">>
      course_sessions: Table<CourseSession, OptionalInsert<CourseSession, "course_id" | "title">>
      member_profiles: Table<MemberProfile, OptionalInsert<MemberProfile, "id">>
      resources: Table<Resource, OptionalInsert<Resource, "title" | "resource_type" | "url">>
    }
    Views: Record<string, never>
    Functions: {
      grade_course_assessment_attempt: {
        Args: { p_attempt_id: string; p_grades: Json }
        Returns: Json
      }
      save_course_assessment: {
        Args: {
          p_assessment_id: string | null
          p_course_id: string
          p_session_id: string | null
          p_title: string
          p_instructions: string
          p_max_attempts: number
          p_published: boolean
          p_questions: Json
        }
        Returns: string
      }
      submit_course_assessment: {
        Args: { p_assessment_id: string; p_answers: Json }
        Returns: Json
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
