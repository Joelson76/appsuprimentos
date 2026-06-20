-- Ver valores do enum status_po
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'status_po'::regtype
ORDER BY enumsortorder;
