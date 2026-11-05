ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS directory_visible boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Members read visible profiles" ON public.member_profiles;

CREATE POLICY "Members read visible profiles"
  ON public.member_profiles
  FOR SELECT
  TO authenticated
  USING (directory_visible = true);

CREATE OR REPLACE FUNCTION public.hide_member_profile_until_admin_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role'
    AND auth.jwt() -> 'app_metadata' ->> 'is_admin' IS DISTINCT FROM 'true' THEN
    NEW.directory_visible := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hide_member_profile_until_admin_review ON public.member_profiles;
CREATE TRIGGER hide_member_profile_until_admin_review
  BEFORE INSERT OR UPDATE ON public.member_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.hide_member_profile_until_admin_review();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins manage blog posts" ON public.blog_posts;
CREATE POLICY "Anyone can read published blog posts"
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "Admins manage blog posts"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

DROP POLICY IF EXISTS "Members manage their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Members read own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Members request own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Members update own enrollment requests" ON public.course_enrollments;
DROP POLICY IF EXISTS "Members delete own enrollments" ON public.course_enrollments;

CREATE POLICY "Members read own enrollments"
  ON public.course_enrollments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Members request own enrollments"
  ON public.course_enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      status = 'pending'
      OR (
        status = 'enrolled'
        AND EXISTS (
          SELECT 1
          FROM public.courses
          WHERE courses.id = course_enrollments.course_id
            AND courses.published = true
            AND courses.is_free = true
        )
      )
    )
  );

CREATE POLICY "Members update own enrollment requests"
  ON public.course_enrollments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      status = 'pending'
      OR (
        status = 'enrolled'
        AND EXISTS (
          SELECT 1
          FROM public.courses
          WHERE courses.id = course_enrollments.course_id
            AND courses.published = true
            AND courses.is_free = true
        )
      )
    )
  );

CREATE POLICY "Members delete own enrollments"
  ON public.course_enrollments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
