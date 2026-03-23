-- =========================
-- DEMO SCRIPT
-- =========================

BEGIN;

-- readable tables
\x

-- =========================
-- Show tables exist
-- =========================
\echo 'dt'
\dt

-- =========================
-- SELECT DEMO (1)
-- =========================
\echo '\n--- SELECT DEMO (1)---'
SELECT name, max_stack
FROM public.item
WHERE max_stack IS NOT NULL
ORDER BY max_stack DESC
LIMIT 10;


-- =========================
-- SELECT DEMO (2)
-- =========================
\echo '\n--- SELECT DEMO (2)---'
SELECT name
FROM public.item
WHERE rarity = 'Common'
LIMIT 10;


-- =========================
-- INSERT DEMO
-- =========================
\echo '\n--- INSERT DEMO ---'
INSERT INTO public.item (
    item_id, name, item_id_str, version_added,
    order_added, rarity, max_stack,
    renewable, has_block_form, has_entity_form,
    mining_level, attack_damage, attack_speed,
    admin_id, category_id
)
VALUES (
    9999, 'Demo Sword', 'demo_sword', '1.0 Demo',
    9999, 'Epic', 1,
    true, false, true,
    2, 10, 1.6,
    1, 4
);

SELECT * FROM public.item WHERE item_id = 9999;


-- =========================
-- UPDATE DEMO
-- =========================
\echo '\n--- UPDATE DEMO ---'
UPDATE public.item
SET attack_damage = 15,
    rarity = 'Legendary'
WHERE item_id = 9999;

SELECT item_id, name, attack_damage, rarity
FROM public.item
WHERE item_id = 9999;


-- =========================
-- DELETE DEMO
-- =========================
\echo '\n--- DELETE DEMO ---'
\echo 'Item exists'

SELECT * FROM public.item WHERE item_id = 9999;

DELETE FROM public.item
WHERE item_id = 9999;

\echo '\nItem no longer exists'
SELECT * FROM public.item WHERE item_id = 9999;


-- =========================
-- End of Demo
-- =========================
ROLLBACK;