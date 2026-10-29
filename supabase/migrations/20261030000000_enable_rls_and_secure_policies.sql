-- RLS policies use the server-managed app_metadata.is_admin JWT claim. Never
-- place this claim in user_metadata, which users can modify themselves.

ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members manage their own profile" ON public.member_profiles;
DROP POLICY IF EXISTS "Admins manage all profiles" ON public.member_profiles;
DROP POLICY IF EXISTS "Members manage their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins manage all enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Anyone can read published courses" ON public.courses;
DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can read published resources" ON public.resources;
DROP POLICY IF EXISTS "Admins manage resources" ON public.resources;
DROP POLICY IF EXISTS "Anyone can read published announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;

CREATE POLICY "Members manage their own profile"
  ON public.member_profiles
  FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins manage all profiles"
  ON public.member_profiles
  FOR ALL
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

CREATE POLICY "Members manage their own enrollments"
  ON public.course_enrollments
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage all enrollments"
  ON public.course_enrollments
  FOR ALL
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

CREATE POLICY "Anyone can read published courses"
  ON public.courses
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "Admins manage courses"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

CREATE POLICY "Anyone can read published resources"
  ON public.resources
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "Admins manage resources"
  ON public.resources
  FOR ALL
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

CREATE POLICY "Anyone can read published announcements"
  ON public.announcements
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "Admins manage announcements"
  ON public.announcements
  FOR ALL
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');
