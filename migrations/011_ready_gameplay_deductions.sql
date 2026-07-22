-- These rules are connected to working controls in the quiz interface.
UPDATE coin_rules SET is_active=true,updated_at=NOW()
WHERE type='deduction' AND event_key IN ('question_skipped','wrong_option_removed','answer_revealed');

-- Ensure every connected rule exists even when earlier template migrations were skipped.
INSERT INTO coin_rules(id,name,event_key,type,amount,frequency,description,is_active)
VALUES
 ('30000000-0000-4000-8000-000000000001','Skip this question','question_skipped','deduction',10,'per_event','Use coins to skip the current question and continue.',true),
 ('30000000-0000-4000-8000-000000000002','Remove one wrong answer','wrong_option_removed','deduction',5,'per_event','Use coins to remove one incorrect answer option.',true),
 ('30000000-0000-4000-8000-000000000003','Reveal the correct answer','answer_revealed','deduction',10,'per_event','Use coins to reveal the correct answer.',true)
ON CONFLICT(event_key,type) DO UPDATE SET is_active=true,updated_at=NOW();

-- migrate:down
UPDATE coin_rules SET is_active=false,updated_at=NOW()
WHERE type='deduction' AND event_key IN ('question_skipped','wrong_option_removed','answer_revealed');
