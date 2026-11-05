CREATE TABLE public.course_learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.course_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  path_id uuid REFERENCES public.course_learning_paths(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  video_url text,
  duration_minutes integer NOT NULL DEFAULT 0 CHECK (duration_minutes BETWEEN 0 AND 1440),
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.course_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.course_sessions(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  resource_type text NOT NULL,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.course_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.course_sessions(id) ON DELETE SET NULL,
  title text NOT NULL,
  instructions text NOT NULL DEFAULT '',
  max_attempts integer NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 50),
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.course_assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.course_assessments(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'written')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(options) = 'array'),
  points integer NOT NULL DEFAULT 1 CHECK (points BETWEEN 1 AND 100),
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0)
);

CREATE TABLE public.course_assessment_answer_keys (
  question_id uuid PRIMARY KEY REFERENCES public.course_assessment_questions(id) ON DELETE CASCADE,
  correct_answer text NOT NULL
);

CREATE TABLE public.course_assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.course_assessments(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending_review', 'graded')),
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  max_score integer NOT NULL CHECK (max_score >= 0),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz,
  graded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.course_assessment_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.course_assessment_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.course_assessment_questions(id) ON DELETE RESTRICT,
  answer text NOT NULL,
  is_correct boolean,
  points_awarded integer CHECK (points_awarded IS NULL OR points_awarded BETWEEN 0 AND 100),
  feedback text NOT NULL DEFAULT '',
  UNIQUE (attempt_id, question_id)
);

CREATE TABLE public.course_session_completions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.course_sessions(id) ON DELETE RESTRICT,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, session_id)
);

CREATE INDEX course_learning_paths_course_idx ON public.course_learning_paths (course_id);
CREATE INDEX course_sessions_course_position_idx ON public.course_sessions (course_id, position);
CREATE INDEX course_materials_course_position_idx ON public.course_materials (course_id, position);
CREATE INDEX course_assessments_course_idx ON public.course_assessments (course_id);
CREATE INDEX course_assessment_questions_assessment_position_idx ON public.course_assessment_questions (assessment_id, position);
CREATE INDEX course_assessment_attempts_user_assessment_idx ON public.course_assessment_attempts (user_id, assessment_id, submitted_at DESC);
CREATE INDEX course_assessment_answers_attempt_idx ON public.course_assessment_answers (attempt_id);

ALTER TABLE public.course_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assessment_answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_session_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read published course learning paths"
  ON public.course_learning_paths FOR SELECT TO authenticated
  USING (
    published = true
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.published = true
    )
    AND EXISTS (
      SELECT 1 FROM public.course_enrollments e
      WHERE e.course_id = course_id AND e.user_id = auth.uid() AND e.status = 'enrolled'
    )
  );
CREATE POLICY "Admins manage course learning paths"
  ON public.course_learning_paths FOR ALL TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

CREATE POLICY "Members read published course sessions"
  ON public.course_sessions FOR SELECT TO authenticated
  USING (
    published = true
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.published = true
    )
    AND EXISTS (
      SELECT 1 FROM public.course_enrollments e
      WHERE e.course_id = course_id AND e.user_id = auth.uid() AND e.status = 'enrolled'
    )
  );
CREATE POLICY "Admins manage course sessions"
  ON public.course_sessions FOR ALL TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

CREATE POLICY "Members read published course materials"
  ON public.course_materials FOR SELECT TO authenticated
  USING (
    published = true
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.published = true
    )
    AND EXISTS (
      SELECT 1 FROM public.course_enrollments e
      WHERE e.course_id = course_id AND e.user_id = auth.uid() AND e.status = 'enrolled'
    )
    AND (
      course_materials.session_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.course_sessions s
        WHERE s.id = course_materials.session_id AND s.published = true
      )
    )
  );
CREATE POLICY "Admins manage course materials"
  ON public.course_materials FOR ALL TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

CREATE POLICY "Members read published course assessments"
  ON public.course_assessments FOR SELECT TO authenticated
  USING (
    published = true
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.published = true
    )
    AND EXISTS (
      SELECT 1 FROM public.course_enrollments e
      WHERE e.course_id = course_id AND e.user_id = auth.uid() AND e.status = 'enrolled'
    )
    AND (
      course_assessments.session_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.course_sessions s
        WHERE s.id = course_assessments.session_id AND s.published = true
      )
    )
  );
CREATE POLICY "Admins manage course assessments"
  ON public.course_assessments FOR ALL TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

CREATE POLICY "Members read published assessment questions"
  ON public.course_assessment_questions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.course_assessments a
      JOIN public.courses c ON c.id = a.course_id
      JOIN public.course_enrollments e ON e.course_id = c.id
      WHERE a.id = assessment_id
        AND a.published = true
        AND c.published = true
        AND (
          a.session_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.course_sessions s
            WHERE s.id = a.session_id AND s.published = true
          )
        )
        AND e.user_id = auth.uid()
        AND e.status = 'enrolled'
    )
  );
CREATE POLICY "Admins manage assessment questions"
  ON public.course_assessment_questions FOR ALL TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

CREATE POLICY "Admins manage assessment answer keys"
  ON public.course_assessment_answer_keys FOR ALL TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

CREATE POLICY "Members read their own assessment attempts"
  ON public.course_assessment_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admins manage assessment attempts"
  ON public.course_assessment_attempts FOR ALL TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

CREATE POLICY "Members read their own assessment answers"
  ON public.course_assessment_answers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_assessment_attempts a
      WHERE a.id = attempt_id AND a.user_id = auth.uid()
    )
  );
CREATE POLICY "Admins manage assessment answers"
  ON public.course_assessment_answers FOR ALL TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

CREATE POLICY "Members read their own session completions"
  ON public.course_session_completions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Members complete their own published sessions"
  ON public.course_session_completions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.course_sessions s
      JOIN public.courses c ON c.id = s.course_id
      JOIN public.course_enrollments e ON e.course_id = c.id
      WHERE s.id = session_id
        AND s.published = true
        AND c.published = true
        AND e.user_id = auth.uid()
        AND e.status = 'enrolled'
    )
  );
CREATE POLICY "Members clear their own session completions"
  ON public.course_session_completions FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admins manage session completions"
  ON public.course_session_completions FOR ALL TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true');

CREATE OR REPLACE FUNCTION public.save_course_assessment(
  p_assessment_id uuid,
  p_course_id uuid,
  p_session_id uuid,
  p_title text,
  p_instructions text,
  p_max_attempts integer,
  p_published boolean,
  p_questions jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_assessment_id uuid;
  v_question jsonb;
  v_question_id uuid;
  v_question_type text;
  v_options jsonb;
  v_correct_answer text;
  v_option jsonb;
  v_option_text text;
  v_points integer;
  v_title text := btrim(p_title);
  v_count integer := 0;
BEGIN
  IF v_admin_id IS NULL OR auth.jwt() -> 'app_metadata' ->> 'is_admin' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Administrator access is required';
  END IF;
  IF p_course_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.courses c WHERE c.id = p_course_id) THEN
    RAISE EXCEPTION 'Select an existing course';
  END IF;
  IF p_session_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.course_sessions s
    WHERE s.id = p_session_id AND s.course_id = p_course_id
  ) THEN
    RAISE EXCEPTION 'Select a session from this course';
  END IF;
  IF v_title IS NULL OR length(v_title) < 2 OR length(v_title) > 160
    OR length(coalesce(p_instructions, '')) > 2000
    OR p_max_attempts IS NULL OR p_max_attempts NOT BETWEEN 1 AND 50
    OR p_published IS NULL THEN
    RAISE EXCEPTION 'Assessment details are invalid';
  END IF;
  IF jsonb_typeof(p_questions) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Assessment questions are invalid';
  END IF;
  IF jsonb_array_length(p_questions) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Assessment details are invalid';
  END IF;

  IF p_assessment_id IS NULL THEN
    INSERT INTO public.course_assessments (
      course_id, session_id, title, instructions, max_attempts, published, created_by
    )
    VALUES (
      p_course_id, p_session_id, v_title, btrim(coalesce(p_instructions, '')), p_max_attempts, p_published, v_admin_id
    )
    RETURNING id INTO v_assessment_id;
  ELSE
    SELECT a.id INTO v_assessment_id
    FROM public.course_assessments a
    WHERE a.id = p_assessment_id AND a.course_id = p_course_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Assessment not found';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.course_assessment_attempts a
      WHERE a.assessment_id = v_assessment_id
    ) THEN
      RAISE EXCEPTION 'This assessment has member attempts. Create a new assessment to change its questions.';
    END IF;
    UPDATE public.course_assessments
    SET session_id = p_session_id,
        title = v_title,
        instructions = btrim(coalesce(p_instructions, '')),
        max_attempts = p_max_attempts,
        published = p_published,
        updated_at = now()
    WHERE id = v_assessment_id;
    DELETE FROM public.course_assessment_questions
    WHERE assessment_id = v_assessment_id;
  END IF;

  FOR v_question IN SELECT value FROM jsonb_array_elements(p_questions)
  LOOP
    v_count := v_count + 1;
    IF jsonb_typeof(v_question) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'Assessment question % is invalid', v_count;
    END IF;
    v_question_type := v_question ->> 'question_type';
    v_options := coalesce(v_question -> 'options', '[]'::jsonb);
    v_correct_answer := v_question ->> 'correct_answer';
    IF jsonb_typeof(v_question -> 'prompt') IS DISTINCT FROM 'string'
      OR length(btrim(v_question ->> 'prompt')) NOT BETWEEN 2 AND 2000
      OR jsonb_typeof(v_question -> 'points') IS DISTINCT FROM 'number'
      OR (v_question ->> 'points') !~ '^[0-9]+$'
      OR v_question_type IS NULL
      OR v_question_type NOT IN ('multiple_choice', 'true_false', 'written')
      OR jsonb_typeof(v_options) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Assessment question % is invalid', v_count;
    END IF;
    IF length(v_question ->> 'points') > 3 THEN
      RAISE EXCEPTION 'Assessment question % has an invalid score', v_count;
    END IF;
    v_points := (v_question ->> 'points')::integer;
    IF v_points NOT BETWEEN 1 AND 100 THEN
      RAISE EXCEPTION 'Assessment question % has an invalid score', v_count;
    END IF;
    IF v_question_type = 'multiple_choice' THEN
      IF jsonb_array_length(v_options) NOT BETWEEN 2 AND 10
        OR jsonb_typeof(v_question -> 'correct_answer') IS DISTINCT FROM 'string' THEN
        RAISE EXCEPTION 'Multiple-choice question % needs distinct options and one correct answer', v_count;
      END IF;
      FOR v_option IN SELECT value FROM jsonb_array_elements(v_options)
      LOOP
        IF jsonb_typeof(v_option) IS DISTINCT FROM 'string' THEN
          RAISE EXCEPTION 'Multiple-choice options must be text';
        END IF;
        v_option_text := btrim(v_option #>> '{}');
        IF length(v_option_text) NOT BETWEEN 1 AND 300 THEN
          RAISE EXCEPTION 'Multiple-choice options must be 1 to 300 characters';
        END IF;
      END LOOP;
      IF (SELECT count(DISTINCT lower(btrim(option #>> '{}'))) FROM jsonb_array_elements(v_options) option) <> jsonb_array_length(v_options)
        OR NOT (v_options @> jsonb_build_array(v_correct_answer)) THEN
        RAISE EXCEPTION 'Multiple-choice question % needs distinct options and one correct answer', v_count;
      END IF;
    ELSIF v_question_type = 'true_false' THEN
      IF v_options <> '["True","False"]'::jsonb
        OR v_correct_answer IS NULL
        OR v_correct_answer NOT IN ('True', 'False') THEN
        RAISE EXCEPTION 'True/false question % is invalid', v_count;
      END IF;
    ELSIF jsonb_array_length(v_options) <> 0 OR v_correct_answer IS NOT NULL THEN
      RAISE EXCEPTION 'Written question % cannot have answer options', v_count;
    END IF;

    INSERT INTO public.course_assessment_questions (
      assessment_id, prompt, question_type, options, points, position
    )
    VALUES (
      v_assessment_id,
      btrim(v_question ->> 'prompt'),
      v_question_type,
      v_options,
      v_points,
      v_count - 1
    )
    RETURNING id INTO v_question_id;
    IF v_question_type <> 'written' THEN
      INSERT INTO public.course_assessment_answer_keys (question_id, correct_answer)
      VALUES (v_question_id, v_correct_answer);
    END IF;
  END LOOP;

  RETURN v_assessment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_course_assessment(p_assessment_id uuid, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_assessment public.course_assessments%ROWTYPE;
  v_question record;
  v_answer jsonb;
  v_answer_text text;
  v_expected text;
  v_attempt_id uuid;
  v_question_count integer;
  v_attempt_count integer;
  v_max_score integer;
  v_score integer := 0;
  v_is_correct boolean;
  v_has_written boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF jsonb_typeof(p_answers) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid assessment answers';
  END IF;
  IF jsonb_array_length(p_answers) > 100 THEN
    RAISE EXCEPTION 'Invalid assessment answers';
  END IF;

  SELECT a.* INTO v_assessment
  FROM public.course_assessments a
  JOIN public.courses c ON c.id = a.course_id
  WHERE a.id = p_assessment_id
    AND a.published = true
    AND c.published = true
    AND (
      a.session_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.course_sessions s
        WHERE s.id = a.session_id AND s.published = true
      )
    )
  FOR UPDATE OF a;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment is unavailable';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.course_enrollments e
    WHERE e.user_id = v_user_id
      AND e.course_id = v_assessment.course_id
      AND e.status = 'enrolled'
  ) THEN
    RAISE EXCEPTION 'Course access is required';
  END IF;

  SELECT count(*) INTO v_attempt_count
  FROM public.course_assessment_attempts a
  WHERE a.assessment_id = p_assessment_id AND a.user_id = v_user_id;
  IF v_attempt_count >= v_assessment.max_attempts THEN
    RAISE EXCEPTION 'Assessment attempt limit reached';
  END IF;

  SELECT count(*), coalesce(sum(points), 0)
  INTO v_question_count, v_max_score
  FROM public.course_assessment_questions
  WHERE assessment_id = p_assessment_id;
  IF v_question_count = 0 OR jsonb_array_length(p_answers) <> v_question_count THEN
    RAISE EXCEPTION 'Answer every assessment question';
  END IF;
  IF (SELECT count(DISTINCT value ->> 'question_id') FROM jsonb_array_elements(p_answers)) <> v_question_count THEN
    RAISE EXCEPTION 'Each assessment question must have one answer';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.course_assessment_questions q
    WHERE q.assessment_id = p_assessment_id AND q.question_type = 'written'
  ) INTO v_has_written;

  INSERT INTO public.course_assessment_attempts (assessment_id, user_id, status, score, max_score)
  VALUES (p_assessment_id, v_user_id, CASE WHEN v_has_written THEN 'pending_review' ELSE 'graded' END, 0, v_max_score)
  RETURNING id INTO v_attempt_id;

  FOR v_question IN
    SELECT q.id, q.question_type, q.options, q.points
    FROM public.course_assessment_questions q
    WHERE q.assessment_id = p_assessment_id
    ORDER BY q.position, q.id
  LOOP
    SELECT value INTO v_answer
    FROM jsonb_array_elements(p_answers)
    WHERE value ->> 'question_id' = v_question.id::text;
    IF v_answer IS NULL OR jsonb_typeof(v_answer -> 'answer') IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION 'Invalid assessment answer';
    END IF;
    v_answer_text := btrim(v_answer ->> 'answer');
    IF length(v_answer_text) > 5000 THEN
      RAISE EXCEPTION 'Assessment answer is too long';
    END IF;

    IF v_question.question_type = 'written' THEN
      INSERT INTO public.course_assessment_answers (attempt_id, question_id, answer)
      VALUES (v_attempt_id, v_question.id, v_answer_text);
      CONTINUE;
    END IF;

    IF NOT (v_question.options @> jsonb_build_array(v_answer_text)) THEN
      RAISE EXCEPTION 'Select one of the available answers';
    END IF;
    SELECT k.correct_answer INTO v_expected
    FROM public.course_assessment_answer_keys k
    WHERE k.question_id = v_question.id;
    IF v_expected IS NULL THEN
      RAISE EXCEPTION 'Assessment answer key is unavailable';
    END IF;
    v_is_correct := v_answer_text = v_expected;
    IF v_is_correct THEN
      v_score := v_score + v_question.points;
    END IF;
    INSERT INTO public.course_assessment_answers (attempt_id, question_id, answer, is_correct, points_awarded)
    VALUES (v_attempt_id, v_question.id, v_answer_text, v_is_correct, CASE WHEN v_is_correct THEN v_question.points ELSE 0 END);
  END LOOP;

  UPDATE public.course_assessment_attempts
  SET score = v_score
  WHERE id = v_attempt_id;
  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'score', v_score,
    'max_score', v_max_score,
    'needs_review', v_has_written,
    'attempts_used', v_attempt_count + 1,
    'attempts_allowed', v_assessment.max_attempts
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.grade_course_assessment_attempt(p_attempt_id uuid, p_grades jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_attempt public.course_assessment_attempts%ROWTYPE;
  v_answer record;
  v_grade jsonb;
  v_points integer;
  v_feedback text;
  v_written_count integer;
  v_score integer;
BEGIN
  IF v_admin_id IS NULL OR auth.jwt() -> 'app_metadata' ->> 'is_admin' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Administrator access is required';
  END IF;
  IF jsonb_typeof(p_grades) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid assessment grades';
  END IF;
  IF jsonb_array_length(p_grades) > 100 THEN
    RAISE EXCEPTION 'Invalid assessment grades';
  END IF;

  SELECT * INTO v_attempt
  FROM public.course_assessment_attempts
  WHERE id = p_attempt_id
  FOR UPDATE;
  IF NOT FOUND OR v_attempt.status <> 'pending_review' THEN
    RAISE EXCEPTION 'Assessment attempt is unavailable for grading';
  END IF;

  SELECT count(*) INTO v_written_count
  FROM public.course_assessment_answers a
  WHERE a.attempt_id = p_attempt_id AND a.is_correct IS NULL;
  IF v_written_count = 0 OR jsonb_array_length(p_grades) <> v_written_count
    OR (SELECT count(DISTINCT value ->> 'question_id') FROM jsonb_array_elements(p_grades)) <> v_written_count THEN
    RAISE EXCEPTION 'Grade every written response exactly once';
  END IF;

  FOR v_answer IN
    SELECT a.question_id, q.points
    FROM public.course_assessment_answers a
    JOIN public.course_assessment_questions q ON q.id = a.question_id
    WHERE a.attempt_id = p_attempt_id AND a.is_correct IS NULL
  LOOP
    SELECT value INTO v_grade
    FROM jsonb_array_elements(p_grades)
    WHERE value ->> 'question_id' = v_answer.question_id::text;
    IF v_grade IS NULL OR jsonb_typeof(v_grade -> 'points_awarded') IS DISTINCT FROM 'number'
      OR jsonb_typeof(v_grade -> 'feedback') IS DISTINCT FROM 'string'
      OR (v_grade ->> 'points_awarded') !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Grade details are invalid';
    END IF;
    IF length(v_grade ->> 'points_awarded') > 3 THEN
      RAISE EXCEPTION 'Points must be within the question maximum';
    END IF;
    v_points := (v_grade ->> 'points_awarded')::integer;
    IF v_points < 0 OR v_points > v_answer.points THEN
      RAISE EXCEPTION 'Points must be within the question maximum';
    END IF;
    v_feedback := coalesce(v_grade ->> 'feedback', '');
    IF length(v_feedback) > 1000 THEN
      RAISE EXCEPTION 'Feedback is too long';
    END IF;
    UPDATE public.course_assessment_answers
    SET points_awarded = v_points, feedback = v_feedback, is_correct = v_points = v_answer.points
    WHERE attempt_id = p_attempt_id AND question_id = v_answer.question_id;
  END LOOP;

  SELECT coalesce(sum(coalesce(a.points_awarded, 0)), 0) INTO v_score
  FROM public.course_assessment_answers a
  WHERE a.attempt_id = p_attempt_id;
  UPDATE public.course_assessment_attempts
  SET status = 'graded', score = v_score, graded_at = now(), graded_by = v_admin_id
  WHERE id = p_attempt_id;
  RETURN jsonb_build_object('attempt_id', p_attempt_id, 'score', v_score, 'max_score', v_attempt.max_score);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_course_assessment(uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.grade_course_assessment_attempt(uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_course_assessment(uuid, uuid, uuid, text, text, integer, boolean, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_course_assessment(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grade_course_assessment_attempt(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_course_assessment(uuid, uuid, uuid, text, text, integer, boolean, jsonb) TO authenticated;
