-- One member can have only one enrollment record for a given course.
-- This unique index is also the conflict target used by the dashboard sign-up upsert.
CREATE UNIQUE INDEX course_enrollments_user_id_course_id_key
  ON public.course_enrollments (user_id, course_id);
