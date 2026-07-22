INSERT INTO coin_rules(id,name,event_key,type,amount,frequency,description,is_active)
VALUES
  ('10000000-0000-4000-8000-000000000001','Hint used','hint_used','deduction',5,'per_event','Deduct coins whenever a player asks for a hint.',false),
  ('10000000-0000-4000-8000-000000000002','Question skipped','question_skipped','deduction',10,'per_event','Deduct coins whenever a player skips a question.',false),
  ('10000000-0000-4000-8000-000000000003','Premium challenge entry','premium_challenge_entered','deduction',25,'per_event','Charge coins when a player enters a premium challenge.',false)
ON CONFLICT DO NOTHING;

-- migrate:down
DELETE FROM coin_rules WHERE id IN (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003'
);
