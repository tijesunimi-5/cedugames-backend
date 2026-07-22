-- Editable starter deductions for common educational quiz-game actions.
-- Templates are intentionally inactive until an admin enables them and the matching game event is connected.
INSERT INTO coin_rules(id,name,event_key,type,amount,frequency,description,is_active)
VALUES
  ('20000000-0000-4000-8000-000000000001','Retry a question','question_retried','deduction',5,'per_event','Charge coins when a player retries the current question.',false),
  ('20000000-0000-4000-8000-000000000002','Reveal the correct answer','answer_revealed','deduction',10,'per_event','Charge coins when a player reveals the correct answer.',false),
  ('20000000-0000-4000-8000-000000000003','Remove one wrong option','wrong_option_removed','deduction',5,'per_event','Charge coins to remove one incorrect answer option.',false),
  ('20000000-0000-4000-8000-000000000004','Add extra question time','extra_time_used','deduction',5,'per_event','Charge coins when extra time is added to a timed question.',false),
  ('20000000-0000-4000-8000-000000000005','Restart a level','level_restarted','deduction',10,'per_event','Charge coins when a player restarts an unfinished level.',false),
  ('20000000-0000-4000-8000-000000000006','Extra level attempt','extra_level_attempt','deduction',15,'per_event','Charge coins for an additional attempt outside the normal life allowance.',false),
  ('20000000-0000-4000-8000-000000000007','Unlock the next level early','next_level_unlocked_early','deduction',50,'per_event','Charge coins to unlock the next level before completing the current requirement.',false),
  ('20000000-0000-4000-8000-000000000008','Unlock a locked category','category_unlocked','deduction',100,'per_event','Charge coins to unlock an optional locked learning category.',false),
  ('20000000-0000-4000-8000-000000000009','Protect learning streak','streak_protected','deduction',25,'daily','Charge coins to protect a learning streak for a missed day.',false),
  ('20000000-0000-4000-8000-000000000010','Enter a tournament','tournament_entered','deduction',50,'per_event','Charge an entry amount when a player joins a tournament or competition.',false),
  ('20000000-0000-4000-8000-000000000011','Enter a bonus round','bonus_round_entered','deduction',20,'per_event','Charge coins when a player chooses to enter an optional bonus round.',false),
  ('20000000-0000-4000-8000-000000000012','Download learning material','learning_material_downloaded','deduction',10,'per_event','Charge coins for optional downloadable learning material.',false),
  ('20000000-0000-4000-8000-000000000013','Buy an avatar item','avatar_item_purchased','deduction',25,'per_event','Deduct coins when a player purchases an avatar or profile item.',false),
  ('20000000-0000-4000-8000-000000000014','Buy a game theme','game_theme_purchased','deduction',50,'per_event','Deduct coins when a player purchases an optional visual theme.',false),
  ('20000000-0000-4000-8000-000000000015','Send a player gift','player_gift_sent','deduction',20,'per_event','Deduct coins from the sender when an in-game gift is sent.',false)
ON CONFLICT DO NOTHING;

-- migrate:down
DELETE FROM coin_rules WHERE id IN (
  '20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000004',
  '20000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000006',
  '20000000-0000-4000-8000-000000000007','20000000-0000-4000-8000-000000000008',
  '20000000-0000-4000-8000-000000000009','20000000-0000-4000-8000-000000000010',
  '20000000-0000-4000-8000-000000000011','20000000-0000-4000-8000-000000000012',
  '20000000-0000-4000-8000-000000000013','20000000-0000-4000-8000-000000000014',
  '20000000-0000-4000-8000-000000000015'
);
