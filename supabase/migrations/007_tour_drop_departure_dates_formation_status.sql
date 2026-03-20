-- 將僅有 departure_dates、尚無逐日狀態的列回填到 departure_date_statuses（預設未成團）
UPDATE tour t
SET departure_date_statuses = sub.j
FROM (
  SELECT
    id,
    (
      SELECT COALESCE(
        jsonb_agg(jsonb_build_object('date', elem, 'status', '未成團') ORDER BY elem),
        '[]'::jsonb
      )
      FROM unnest(departure_dates) AS elem
      WHERE elem IS NOT NULL AND trim(elem) <> ''
    ) AS j
  FROM tour
  WHERE
    COALESCE(jsonb_array_length(departure_date_statuses), 0) = 0
    AND departure_dates IS NOT NULL
    AND cardinality(departure_dates) > 0
) sub
WHERE t.id = sub.id AND sub.j IS NOT NULL AND jsonb_array_length(sub.j) > 0;

ALTER TABLE tour DROP COLUMN IF EXISTS departure_dates;
ALTER TABLE tour DROP COLUMN IF EXISTS formation_status;
