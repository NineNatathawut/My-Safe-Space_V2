-- =============================================
-- Migration 007: DASS-21 (แบบวัดภาวะอารมณ์ 3 ด้าน)
--
-- DASS-21 = 21 ข้อ (ด้านละ 7 ข้อ) ตัวเลือก 0–3
-- สูตร: ผลรวมคะแนนแต่ละด้าน x2 เพื่อเทียบสเกล DASS-42 (สูงสุดแต่ละด้าน = 42)
--
-- จุดตัด (cut-off) ต่างกันต่อแต่ละด้าน:
--   ระดับ (Severity)      Depression   Anxiety    Stress
--   ปกติ (normal)           0–9         0–7        0–14
--   เล็กน้อย (mild)        10–13        8–9       15–18
--   ปานกลาง (moderate)    14–20       10–14       19–25
--   รุนแรง (severe)        21–27       15–19       26–33
--   รุนแรงมาก (extreme)     28+          20+         34+
--
-- ผล: แสดงการ์ด 3 ใบ (ด้านละใบ) + แถบแดง "มีความเสี่ยงภาวะอารมณ์ระดับสูง"
-- เมื่อมีด้านใดด้านหนึ่งเป็น severe/extremely_severe + ปุ่มสายด่วน 1323/1669
--
-- code = 'dass21' → Standard Assessment (บันทึกประวัติ + แสดงใน Profile ร่วมกับ ST-5)
--
-- หมายเหตุ: seed idempotent — ถ้ารันซ้ำจะข้าม
-- =============================================

-- 1. แยกผลแบบหลายมิติ (dimension) — questions / rules / submissions
ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS score_multiplier DOUBLE PRECISION DEFAULT 1;

ALTER TABLE assessment_questions
  ADD COLUMN IF NOT EXISTS dimension TEXT;

ALTER TABLE interpretation_rules
  ADD COLUMN IF NOT EXISTS dimension TEXT;

ALTER TABLE assessment_submissions
  ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '[]';

-- 2. เปิดอ่าน rules ให้ทุกคนทำแบบประเมินแล้วเห็นผล (ป้องกันกรณี policy ยังไม่ครบ)
ALTER TABLE interpretation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read interpretation_rules" ON interpretation_rules;
CREATE POLICY "Anyone can read interpretation_rules"
  ON interpretation_rules FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Seed DASS-21
DO $$
DECLARE
  dass_id UUID;
  q_id UUID;

  q_depression TEXT[] := ARRAY[
    'ฉันแทบไม่รู้สึกกับความรู้สึกในทางบวกเลย',
    'ฉันพบว่ามันยากที่จะลงมือทำสิ่งต่าง ๆ',
    'ฉันรู้สึกว่าตนเองไร้ซึ่งแรงจูงใจในการทำสิ่งต่าง ๆ',
    'ฉันรู้สึกหมดหวัง ซึมซ้ำ เศร้า',
    'ฉันรู้สึกไม่กระตือรือร้นในสิ่งใดเลย',
    'ฉันรู้สึกว่าตนเองไม่มีคุณค่าพอในตัวเอง',
    'ฉันรู้สึกว่าชีวิตไม่มีความหมาย'
  ];

  q_anxiety TEXT[] := ARRAY[
    'ฉันรู้สึกว่าปากของฉันแห้ง',
    'ฉันประสบปัญหาในการหายใจ (เช่น หายใจเร็ว แม้ไม่ได้ออกกำลังกาย)',
    'ฉันมีอาการตัวสั่น (เช่น มือสั่น)',
    'ฉันกังวลในสถานการณ์ที่อาจทำให้เกิดอาการตื่นตระหนกและทำตัวน่าอาย',
    'ฉันรู้สึกว่าตนเองใกล้จะแตกตื่น / ควบคุมตัวเองไม่ได้',
    'ฉันรู้สึกถึงการเต้นของหัวใจ แม้ฉันไม่ได้ออกกำลังกาย',
    'ฉันรู้สึกกลัวโดยไม่มีเหตุผลสมควร'
  ];

  q_stress TEXT[] := ARRAY[
    'ฉันรู้สึกว่ามันยากที่จะทำให้จิตใจผ่อนคลายลง',
    'ฉันมักตอบสนองต่อเหตุการณ์มากเกินไป',
    'ฉันรู้สึกว่าตนเองใช้พลังทางใจไปมากเกินไป',
    'ฉันพบว่าตนเองกระวนกระวายใจในเรื่องต่าง ๆ',
    'ฉันรู้สึกว่าตนเองจัดการกับความเครียดไม่ค่อยได้',
    'ฉันรู้สึกว่าตนเองตอบโต้สถานการณ์ด้วยอารมณ์มากเกินไป',
    'ฉันรู้สึกว่าตนเองกังวลมากกว่าปกติกับเรื่องเล็ก ๆ น้อย ๆ'
  ];
BEGIN
  IF EXISTS (SELECT 1 FROM assessments WHERE code = 'dass21') THEN
    RAISE NOTICE 'DASS-21 already exists — skip seed';
    RETURN;
  END IF;

  -- 3.1 สร้างแบบประเมินหลัก
  INSERT INTO assessments (
    code,
    title,
    description,
    category,
    estimated_time_mins,
    version,
    type,
    status,
    scoring_method,
    open_in_new_tab,
    score_multiplier
  )
  VALUES (
    'dass21',
    'DASS-21: แบบวัดภาวะอารมณ์ 3 ด้าน',
    'แบบประเมินระดับภาวะซึมเศร้า ภาวะวิตกกังวล และความเครียด 21 ข้อ (ด้านละ 7 ข้อ) ด้วยตัวเลือก 0–3 — ผลรวมของแต่ละด้านจะถูกคูณด้วย 2 เพื่อเทียบเคียงสเกลมาตรฐาน DASS-42',
    'General Mental Health',
    7,
    1,
    'INTERNAL',
    'PUBLISHED',
    'TOTAL_SCORE',
    true,
    2
  )
  RETURNING id INTO dass_id;

  -- 3.2 สร้างคำถามด้านละ 7 ข้อ (dimension กำกับ) พร้อม 4 ตัวเลือก 0–3
  FOR i IN 1..7 LOOP
    INSERT INTO assessment_questions (assessment_id, dimension, question_text, type, order_index, is_required)
    VALUES (dass_id, 'depression', q_depression[i], 'RADIO', i, true)
    RETURNING id INTO q_id;

    INSERT INTO question_choices (question_id, choice_text, score, weight, order_index) VALUES
      (q_id, 'ไม่ตรงกับฉันเลย',       0, 1.0, 1),
      (q_id, 'ตรงกับฉันบ้าง',         1, 1.0, 2),
      (q_id, 'ตรงกับฉันค่อนข้างมาก',   2, 1.0, 3),
      (q_id, 'ตรงกับฉันมากที่สุด',      3, 1.0, 4);

    INSERT INTO assessment_questions (assessment_id, dimension, question_text, type, order_index, is_required)
    VALUES (dass_id, 'anxiety', q_anxiety[i], 'RADIO', 7 + i, true)
    RETURNING id INTO q_id;

    INSERT INTO question_choices (question_id, choice_text, score, weight, order_index) VALUES
      (q_id, 'ไม่ตรงกับฉันเลย',       0, 1.0, 1),
      (q_id, 'ตรงกับฉันบ้าง',         1, 1.0, 2),
      (q_id, 'ตรงกับฉันค่อนข้างมาก',   2, 1.0, 3),
      (q_id, 'ตรงกับฉันมากที่สุด',      3, 1.0, 4);

    INSERT INTO assessment_questions (assessment_id, dimension, question_text, type, order_index, is_required)
    VALUES (dass_id, 'stress', q_stress[i], 'RADIO', 14 + i, true)
    RETURNING id INTO q_id;

    INSERT INTO question_choices (question_id, choice_text, score, weight, order_index) VALUES
      (q_id, 'ไม่ตรงกับฉันเลย',       0, 1.0, 1),
      (q_id, 'ตรงกับฉันบ้าง',         1, 1.0, 2),
      (q_id, 'ตรงกับฉันค่อนข้างมาก',   2, 1.0, 3),
      (q_id, 'ตรงกับฉันมากที่สุด',      3, 1.0, 4);
  END LOOP;

  -- 3.3 เกณฑ์แปลผลตามจุดตัดแต่ละด้าน (severity 5 ระดับ)
  --   depression  : 0–9 / 10–13 / 14–20 / 21–27 / 28–42
  --   anxiety     : 0–7 / 8–9 / 10–14 / 15–19 / 20–42
  --   stress      : 0–14 / 15–18 / 19–25 / 26–33 / 34–42
  INSERT INTO interpretation_rules
    (assessment_id, dimension, min_score, max_score, title, description, recommendation, color_code, severity)
  VALUES
    -- ── Depression ──
    (dass_id, 'depression',  0,  9, 'ปกติ',
      'ระดับภาวะซึมเศร้าอยู่ในเกณฑ์ปกติ',
      'ดูแลตัวเองต่อเนื่อง ฝึกผ่อนคลาย พักผ่อนให้เพียงพอ หากมีข้อกังวลสามารถปรึกษาคนที่ไว้ใจได้',
      '#16a34a', 'normal'),

    (dass_id, 'depression', 10, 13, 'เล็กน้อย',
      'มีสัญญาณภาวะซึมเศร้าเล็กน้อย',
      'ลองจัดตารางกิจกรรมที่ให้ความสุข ออกกำลังกาย พูดคุยกับคนสนิท แล้วประเมินซ้ำใน 2 สัปดาห์',
      '#0ea5e9', 'mild'),

    (dass_id, 'depression', 14, 20, 'ปานกลาง',
      'มีภาวะซึมเศร้าในระดับปานกลาง',
      'ควรให้ความสำคัญกับตนเองมากขึ้น หาเวลาพักผ่อน พูดคุยกับคนที่ไว้ใจ และหากยังคงอยู่แนะนำปรึกษานักจิตวิทยา',
      '#f59e0b', 'moderate'),

    (dass_id, 'depression', 21, 27, 'รุนแรง',
      'มีภาวะซึมเศร้าในเกณฑ์รุนแรง',
      'แนะนำพบจิตแพทย์หรือนักจิตวิทยาโดยเร็ว ถ้ามี ความคิดทำร้ายตัวเองให้โทร 1323 ทันที',
      '#f97316', 'severe'),

    (dass_id, 'depression', 28, 42, 'รุนแรงมาก',
      'มีภาวะซึมเศร้าในเกณฑ์รุนแรงมาก',
      'รีบพบจิตแพทย์/นักจิตวิทยาโดยเร็ว หรือโทรสายด่วนสุขภาพจิต 1323 (ฟรี 24 ชม.) กรณีฉุกเฉิน 1669',
      '#dc2626', 'extremely_severe'),

    -- ── Anxiety ──
    (dass_id, 'anxiety',  0,  7, 'ปกติ',
      'ระดับความวิตกกังวลอยู่ในเกณฑ์ปกติ',
      'ดูแลตัวเองต่อเนื่อง ฝึกการหายใจเพื่อสงบใจ และพักผ่อนให้เพียงพอ',
      '#16a34a', 'normal'),

    (dass_id, 'anxiety',  8,  9, 'เล็กน้อย',
      'มีสัญญาณความวิตกกังวลเล็กน้อย',
      'ฝึกเทคนิคหายใจ 4-7-8 หาเวลาสงบ และสังเกตอาการของตัวเองใน 2 สัปดาห์ถัดไป',
      '#0ea5e9', 'mild'),

    (dass_id, 'anxiety', 10, 14, 'ปานกลาง',
      'มีความวิตกกังวลระดับปานกลาง',
      'หาเทคนิคผ่อนคลาย ลดสิ่งเร้าความกังวล หากกระทบชีวิตประจำวันแนะนำปรึกษานักจิตวิทยา',
      '#f59e0b', 'moderate'),

    (dass_id, 'anxiety', 15, 19, 'รุนแรง',
      'มีความวิตกกังวลในเกณฑ์รุนแรง',
      'แนะนำพบจิตแพทย์/นักจิตวิทยา เพื่อเข้ารับการดูแลอย่างใกล้ชิด หรือโทรสายด่วน 1323',
      '#f97316', 'severe'),

    (dass_id, 'anxiety', 20, 42, 'รุนแรงมาก',
      'มีความวิตกกังวลในเกณฑ์รุนแรงมาก',
      'รีบพบจิตแพทย์โดยเร็ว หรือโทรสายด่วนสุขภาพจิต 1323 (ฟรี 24 ชม.) กรณีฉุกเฉิน 1669',
      '#dc2626', 'extremely_severe'),

    -- ── Stress ──
    (dass_id, 'stress',  0, 14, 'ปกติ',
      'ระดับความเครียดอยู่ในเกณฑ์ปกติ',
      'ดูแลตัวเองต่อเนื่อง ฝึกหายใจผ่อนคลาย และมีเวลาทำสิ่งที่ชอบ',
      '#16a34a', 'normal'),

    (dass_id, 'stress', 15, 18, 'เล็กน้อย',
      'มีความเครียดเล็กน้อย',
      'จัดเวลาผ่อนคลาย ออกกำลังกาย นอนให้พอ แล้วประเมินซ้ำใน 2 สัปดาห์',
      '#0ea5e9', 'mild'),

    (dass_id, 'stress', 19, 25, 'ปานกลาง',
      'มีความเครียดในระดับปานกลาง',
      'หาเวลาผ่อนคลายอย่างจริงจัง ลดสิ่งเร้าความเครียด พูดคุยกับคนที่ไว้ใจ และประเมินซ้ำ',
      '#f59e0b', 'moderate'),

    (dass_id, 'stress', 26, 33, 'รุนแรง',
      'มีความเครียดในเกณฑ์รุนแรง',
      'แนะนำปรึกษานักจิตวิทยาหรือพบผู้เชี่ยวชาญโดยเร็ว หรือโทรสายด่วน 1323',
      '#f97316', 'severe'),

    (dass_id, 'stress', 34, 42, 'รุนแรงมาก',
      'มีความเครียดในเกณฑ์รุนแรงมาก',
      'รีบขอรับความช่วยเหลือจากผู้เชี่ยวชาญ โทร 1323 (ฟรี 24 ชม.) กรณีฉุกเฉิน 1669',
      '#dc2626', 'extremely_severe');

END $$;