CREATE TABLE public.course_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  member_name text NOT NULL,
  course_title text NOT NULL,
  instructor text NOT NULL,
  certificate_code text NOT NULL UNIQUE DEFAULT (
    'DDNI-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  ),
  issued_at timestamptz NOT NULL DEFAULT now(),
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT course_certificates_user_course_key UNIQUE (user_id, course_id)
);

ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read their own course certificates"
  ON public.course_certificates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all course certificates"
  ON public.course_certificates
  FOR SELECT
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

CREATE POLICY "Admins issue course certificates"
  ON public.course_certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true'
    AND issued_by = auth.uid()
  );
