-- =============================================
-- Migration 005: Seed แบบประเมินความเครียด ST-5
--
-- เครื่องมือคัดกรองความเครียด 5 ข้อ (ST-5) ตามคู่มือกรมสุขภาพจิต
-- กระทรวงสาธารณสุข — ใช้ประเมินระดับความเครียดในช่วง 2 สัปดาห์ที่ผ่านมา
--
-- เงื่อนไข: ต้องรันหลัง migration 004 (มี columns assessments.code
-- และ interpretation_rules.severity)
--
-- code = 'st5' หมายถึง "Standard Assessment"
--   → ผลจะถูกบันทึกเป็นประวัติสุขภาพใจในหน้า Profile (assessment_submissions)
--   → ใช้คำนวณ Onboarding / การสะกิดหน้า Home / การ์ดสายด่วน (severe & critical)
--
-- การให้คะแนน: 0 = น้อยมาก/แทบไม่มี, 1 = บางครั้ง, 2 = บ่อยครั้ง, 3 = เป็นประจำ
--      รวม 5 ข้อ → คะแนนเต็ม 15
--
-- การแปลผล (คะแนนรวม):
--   0–4  = ความเครียดน้อย      (severity: normal)
--   5–7  = ความเครียดปานกลาง   (severity: moderate)
--   8–9  = ความเครียดมาก       (severity: severe)
--   10–15 = ความเครียดมากที่สุด  (severity: critical)
--
-- หมายเหตุ: seed นี้เป็น idempotent — ถ้ารันซ้ำจะข้ามไม่สร้างซ้ำ
-- =============================================

DO $$
DECLARE
  st5_id UUID;
  q_id   UUID;
  q_texts TEXT[] := ARRAY[
    'มีปัญหาการนอน / นอนไม่หลับหรือนอนมาก',
    'มีสมาธิน้อยลง',
    'หงุดหงิด / กระวนกระวาย / ว้าวุ่นใจ',
    'รู้สึกเบื่อ เซ็ง',
    'ไม่อยากพบปะผู้คน'
  ];
BEGIN
  -- ── กันการรันซ้ำ: ถ้า code 'st5' มีอยู่แล้วให้ข้าม ──
  IF EXISTS (SELECT 1 FROM assessments WHERE code = 'st5') THEN
    RAISE NOTICE 'ST-5 assessment already exists — skip seed';
    RETURN;
  END IF;

  -- 1. สร้างแบบประเมินหลัก
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
    open_in_new_tab
  )
  VALUES (
    'st5',
    'แบบประเมินความเครียด (ST-5)',
    'เครื่องมือคัดกรองความเครียด 5 ข้อ ตามคู่มือกรมสุขภาพจิต กระทรวงสาธารณสุข — ใช้ประเมินระดับความเครียดในช่วง 2 สัปดาห์ที่ผ่านมา',
    'General Mental Health',
    2,
    1,
    'INTERNAL',
    'PUBLISHED',
    'TOTAL_SCORE',
    true
  )
  RETURNING id INTO st5_id;

  -- 2. สร้าง 5 คำถาม พร้อม 4 ตัวเลือก (0–3)
  FOR i IN 1..5 LOOP
    INSERT INTO assessment_questions (assessment_id, question_text, type, order_index, is_required)
    VALUES (st5_id, q_texts[i], 'RADIO', i, true)
    RETURNING id INTO q_id;

    INSERT INTO question_choices (question_id, choice_text, score, weight, order_index) VALUES
      (q_id, 'น้อยมากหรือแทบไม่มี', 0, 1.0, 1),
      (q_id, 'บางครั้ง',             1, 1.0, 2),
      (q_id, 'บ่อยครั้ง',             2, 1.0, 3),
      (q_id, 'เป็นประจำ',             3, 1.0, 4);
  END LOOP;

  -- 3. เกณฑ์การแปลผล (severity เชื่อมกับระบบที่ออกแบบไว้)
  INSERT INTO interpretation_rules
    (assessment_id, min_score, max_score, title, description, recommendation, color_code, severity)
  VALUES
    (st5_id,  0,  4, 'ความเครียดน้อย',
      'ความเครียดอยู่ในระดับปกติ ยังดูแลใจตัวเองได้',
      'ดูแลตัวเองต่อเนื่อง ฝึกเทคนิคผ่อนคลาย เช่น การหายใจ 4-7-8 พักผ่อนให้เพียงพอ ออกกำลังกายสม่ำเสมอ',
      'green',  'normal'),

    (st5_id,  5,  7, 'ความเครียดปานกลาง',
      'เริ่มมีสัญญาณความเครียด ควรให้ความสำคัญกับตัวเองมากขึ้น',
      'หาเวลาผ่อนคลายอย่างจริงจัง ออกกำลังกาย นอนหลับให้พอ ลดสิ่งเร้าความเครียด แล้วลองประเมินซ้ำในอีก 2 สัปดาห์',
      'amber', 'moderate'),

    (st5_id,  8,  9, 'ความเครียดมาก',
      'ความเครียดค่อนข้างมากและอาจกระทบการใช้ชีวิตประจำวัน',
      'จัดกิจกรรมผ่อนคลายอย่างจริงจัง พูดคุยกับคนที่ไว้ใจ และหากยังไม่ดีขึ้นแนะนำปรึกษานักจิตวิทยา',
      'orange', 'severe'),

    (st5_id, 10, 15, 'ความเครียดมากที่สุด',
      'ความเครียดระดับสูงมาก ควรได้รับการดูแลจากผู้เชี่ยวชาญ',
      'แนะนำพบจิตแพทย์/นักจิตวิทยาโดยเร็ว หรือโทรสายด่วนสุขภาพจิต 1323 (ฟรี 24 ชม.) กรณีฉุกเฉิน 1669',
      'red', 'critical');

END $$;