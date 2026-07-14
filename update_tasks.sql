-- Cập nhật nhiệm vụ REVIEW - TASK POINTS 0 vào Supabase

INSERT INTO public.task_configs (id, name, reward, api_url, max_views, auto, status)
VALUES 
(
  'review_0', 
  'REVIEW - TASK POINTS 0', 
  10000, 
  'https://linktot.net/api_rv_pt.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=', 
  9999, 
  false, 
  'hoạt động'
)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    reward = EXCLUDED.reward,
    api_url = EXCLUDED.api_url,
    max_views = EXCLUDED.max_views,
    auto = EXCLUDED.auto,
    status = EXCLUDED.status;
