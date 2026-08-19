-- =============================================
-- BANK API DATABASE SETUP
-- 03 - SAFE DEMO SEED DATA
-- =============================================

-- SEED DATA
INSERT INTO
    roles (role_name)
VALUES ('Admin'),
    ('Customer'),
    ('Employee') ON CONFLICT DO NOTHING;

INSERT INTO
    currencies (code, name, symbol)
VALUES ('TRY', 'Türk Lirası', '₺'),
    ('USD', 'US Dollar', '$'),
    ('EUR', 'Euro', '€') ON CONFLICT DO NOTHING;