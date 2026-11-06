ALTER TABLE public.course_sessions
  ADD COLUMN required boolean NOT NULL DEFAULT true,
  ADD COLUMN starts_at timestamptz,
  ADD COLUMN ends_at timestamptz,
  ADD COLUMN delivery_mode text NOT NULL DEFAULT 'in-person'
    CHECK (delivery_mode IN ('in-person', 'online')),
  ADD COLUMN location text NOT NULL DEFAULT '',
  ADD CONSTRAINT course_sessions_valid_schedule
    CHECK (
      (starts_at IS NULL AND ends_at IS NULL)
      OR (starts_at IS NOT NULL AND ends_at IS NOT NULL AND starts_at < ends_at)
    );

ALTER TABLE public.course_assessments
  ADD COLUMN path_id uuid REFERENCES public.course_learning_paths(id) ON DELETE CASCADE,
  ADD COLUMN opens_at timestamptz,
  ADD COLUMN closes_at timestamptz,
  ADD COLUMN passing_score integer NOT NULL DEFAULT 70
    CHECK (passing_score BETWEEN 0 AND 100),
  ADD CONSTRAINT course_assessments_valid_window
    CHECK (opens_at IS NULL OR closes_at IS NULL OR opens_at < closes_at);

CREATE OR REPLACE FUNCTION public.course_assessment_is_unlocked(p_assessment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_assessments a
    JOIN public.courses c ON c.id = a.course_id
    JOIN public.course_enrollments e
      ON e.course_id = a.course_id
     AND e.user_id = auth.uid()
     AND e.status = 'enrolled'
    WHERE a.id = p_assessment_id
      AND a.published = true
      AND c.published = true
      AND (
        a.path_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.course_learning_paths path
          WHERE path.id = a.path_id
            AND path.published = true
        )
      )
      AND (a.opens_at IS NULL OR a.opens_at <= now())
      AND (a.closes_at IS NULL OR a.closes_at > now())
      AND (
        a.session_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.course_sessions target
          WHERE target.id = a.session_id
            AND target.published = true
            AND (a.path_id IS NULL OR target.path_id = a.path_id)
        )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.course_sessions required_session
        WHERE required_session.course_id = a.course_id
          AND required_session.required = true
          AND required_session.published = true
          AND (
            (
              a.session_id IS NULL
              AND (a.path_id IS NULL OR required_session.path_id = a.path_id)
            )
            OR EXISTS (
              SELECT 1
              FROM public.course_sessions target
              WHERE target.id = a.session_id
                AND required_session.path_id IS NOT DISTINCT FROM target.path_id
                AND (
                  required_session.position < target.position
                  OR (
                    required_session.position = target.position
                    AND required_session.id < target.id
                  )
                )
            )
          )
          AND NOT EXISTS (
            SELECT 1
            FROM public.course_session_completions completion
            WHERE completion.user_id = auth.uid()
              AND completion.session_id = required_session.id
          )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.course_assessment_is_unlocked(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.course_assessment_is_unlocked(uuid) TO authenticated;

DROP POLICY "Members read published assessment questions"
  ON public.course_assessment_questions;
CREATE POLICY "Members read unlocked assessment questions"
  ON public.course_assessment_questions FOR SELECT TO authenticated
  USING (public.course_assessment_is_unlocked(assessment_id));

DROP POLICY "Members read published course assessments"
  ON public.course_assessments;
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
    AND (
      course_assessments.path_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.course_learning_paths path
        WHERE path.id = course_assessments.path_id AND path.published = true
      )
    )
  );

DROP POLICY "Members complete their own published sessions"
  ON public.course_session_completions;
CREATE POLICY "Members complete sessions in curriculum order"
  ON public.course_session_completions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.course_sessions current_session
      JOIN public.courses c ON c.id = current_session.course_id
      JOIN public.course_enrollments e ON e.course_id = c.id
      WHERE current_session.id = session_id
        AND current_session.published = true
        AND c.published = true
        AND e.user_id = auth.uid()
        AND e.status = 'enrolled'
        AND NOT EXISTS (
          SELECT 1
          FROM public.course_sessions prior_session
          WHERE prior_session.course_id = current_session.course_id
            AND prior_session.path_id IS NOT DISTINCT FROM current_session.path_id
            AND prior_session.required = true
            AND prior_session.published = true
            AND (prior_session.position, prior_session.id) < (
              current_session.position,
              current_session.id
            )
            AND NOT EXISTS (
              SELECT 1
              FROM public.course_session_completions completion
              WHERE completion.user_id = auth.uid()
                AND completion.session_id = prior_session.id
            )
        )
    )
  );

ALTER FUNCTION public.submit_course_assessment(uuid, jsonb)
  RENAME TO submit_course_assessment_unchecked;
REVOKE ALL ON FUNCTION public.submit_course_assessment_unchecked(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.submit_course_assessment(p_assessment_id uuid, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_assessment public.course_assessments%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT a.* INTO v_assessment
  FROM public.course_assessments a
  WHERE a.id = p_assessment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment is unavailable';
  END IF;
  IF v_assessment.opens_at IS NOT NULL AND v_assessment.opens_at > now() THEN
    RAISE EXCEPTION 'Assessment is not open yet';
  END IF;
  IF v_assessment.closes_at IS NOT NULL AND v_assessment.closes_at <= now() THEN
    RAISE EXCEPTION 'Assessment is closed';
  END IF;
  IF v_assessment.path_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.course_learning_paths path
    WHERE path.id = v_assessment.path_id AND path.published = true
  ) THEN
    RAISE EXCEPTION 'Assessment is unavailable';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.course_assessments a
    JOIN public.courses c ON c.id = a.course_id
    JOIN public.course_enrollments e
      ON e.course_id = a.course_id
     AND e.user_id = auth.uid()
     AND e.status = 'enrolled'
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
      AND (
        a.path_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.course_learning_paths path
          WHERE path.id = a.path_id AND path.published = true
        )
      )
  ) AND NOT public.course_assessment_is_unlocked(p_assessment_id) THEN
    RAISE EXCEPTION 'Complete the required lessons before submitting this assessment';
  END IF;

  RETURN public.submit_course_assessment_unchecked(p_assessment_id, p_answers);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_course_assessment(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_course_assessment(uuid, jsonb) TO authenticated;

ALTER FUNCTION public.save_course_assessment(
  uuid, uuid, uuid, text, text, integer, boolean, jsonb
) RENAME TO save_course_assessment_legacy;
REVOKE ALL ON FUNCTION public.save_course_assessment_legacy(
  uuid, uuid, uuid, text, text, integer, boolean, jsonb
) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.save_course_assessment(
  p_assessment_id uuid,
  p_course_id uuid,
  p_session_id uuid,
  p_title text,
  p_instructions text,
  p_max_attempts integer,
  p_published boolean,
  p_questions jsonb,
  p_opens_at timestamptz,
  p_closes_at timestamptz,
  p_passing_score integer,
  p_path_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_assessment_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.jwt() -> 'app_metadata' ->> 'is_admin' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Administrator access is required';
  END IF;
  IF p_passing_score IS NULL OR p_passing_score NOT BETWEEN 0 AND 100
    OR (p_opens_at IS NOT NULL AND p_closes_at IS NOT NULL AND p_opens_at >= p_closes_at) THEN
    RAISE EXCEPTION 'Assessment rules are invalid';
  END IF;
  IF p_path_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.course_learning_paths path
    WHERE path.id = p_path_id AND path.course_id = p_course_id
  ) THEN
    RAISE EXCEPTION 'Select a learning path from this course';
  END IF;
  IF p_session_id IS NOT NULL AND p_path_id IS NOT NULL THEN
    RAISE EXCEPTION 'Choose a session assessment or a path final assessment';
  END IF;

  v_assessment_id := public.save_course_assessment_legacy(
    p_assessment_id,
    p_course_id,
    p_session_id,
    p_title,
    p_instructions,
    p_max_attempts,
    p_published,
    p_questions
  );

  UPDATE public.course_assessments
  SET path_id = p_path_id,
      opens_at = p_opens_at,
      closes_at = p_closes_at,
      passing_score = p_passing_score
  WHERE id = v_assessment_id;

  RETURN v_assessment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_course_assessment(
  uuid, uuid, uuid, text, text, integer, boolean, jsonb, timestamptz, timestamptz, integer, uuid
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_course_assessment(
  uuid, uuid, uuid, text, text, integer, boolean, jsonb, timestamptz, timestamptz, integer, uuid
) TO authenticated;
