-- =============================================
-- BANK API DATABASE SCHEMA & PROCEDURES (FINAL)
-- =============================================

-- 1. ROLES
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. CURRENCIES
CREATE TABLE IF NOT EXISTS currencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5) NOT NULL
);

-- 3. USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles (id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users (id),
    tckn VARCHAR(11) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    birth_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ACCOUNTS
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers (id),
    currency_id INT NOT NULL REFERENCES currencies (id),
    iban VARCHAR(34) UNIQUE NOT NULL,
     nickname VARCHAR(100),
    balance DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    source_account_id INT REFERENCES accounts (id),
    target_account_id INT REFERENCES accounts (id),
    amount DECIMAL(18, 2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    tax_amount DECIMAL(18, 2) DEFAULT 0.00,
    description VARCHAR(255),
    status VARCHAR(20) DEFAULT 'COMPLETED',
    reference_no VARCHAR(50) UNIQUE,
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exchange_rate DECIMAL(18, 4),
    exchange_rate_type VARCHAR(10),
    converted_amount DECIMAL(18,2)
);

-- 7. LOANS
CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers (id),
    account_id INT NOT NULL REFERENCES accounts (id),
    amount DECIMAL(18, 2) NOT NULL,
    interest_rate DECIMAL(5, 4) NOT NULL,
    term_in_months INT NOT NULL,
    total_repayment DECIMAL(18, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. LOAN INSTALLMENTS
CREATE TABLE IF NOT EXISTS loan_installments (
    id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL REFERENCES loans (id),
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    paid_at TIMESTAMP
);

-- 9. TAX RATES
CREATE TABLE IF NOT EXISTS tax_rates (
    id SERIAL PRIMARY KEY,
    tax_type VARCHAR(50) NOT NULL UNIQUE,
    rate DECIMAL(5, 4) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. EXCHANGE RATES
 TABLE IF EXISTS exchaDROPnge_rates CASCADE;

-- 10. EXCHANGE RATES
CREATE TABLE exchange_rates (
    id SERIAL PRIMARY KEY,
    from_currency_id INT NOT NULL REFERENCES currencies (id),
    to_currency_id INT NOT NULL REFERENCES currencies (id),
    buying_rate DECIMAL(18, 4) NOT NULL,
    selling_rate DECIMAL(18, 4) NOT NULL,
    rate DECIMAL(18, 4) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- =============================================
-- 1. Register Customer Procedure
-- =============================================
CREATE OR REPLACE PROCEDURE sp_register_customer(
    p_email VARCHAR(255),
    p_password_hash VARCHAR(255),
    p_role_id INT,
    p_tckn VARCHAR(11),
    p_first_name VARCHAR(100),
    p_last_name VARCHAR(100),
    p_phone_number VARCHAR(20),
    p_birth_date DATE,
    INOUT p_user_id INT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO users (email, password_hash, role_id)
    VALUES (p_email, p_password_hash, p_role_id)
    RETURNING id INTO p_user_id;

    INSERT INTO customers (user_id, tckn, first_name, last_name, phone_number, birth_date)
    VALUES (p_user_id, p_tckn, p_first_name, p_last_name, p_phone_number, p_birth_date);
END;
$$;

-- =============================================
-- 2. Create Account Function
-- =============================================
CREATE OR REPLACE FUNCTION fn_create_account(
    p_user_id INT,
    p_currency_id INT,
    p_nickname VARCHAR
)
RETURNS TABLE (account_id INT, iban VARCHAR)
LANGUAGE plpgsql
AS $$
DECLARE
    v_customer_id INT;
    v_iban VARCHAR(34);
BEGIN
    SELECT c.id INTO v_customer_id FROM customers c WHERE c.user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bu kullanıcıya ait müşteri kaydı bulunamadı.';
    END IF;

    LOOP
        v_iban := 'TR99000620' || LPAD((RANDOM()*10000000000000000)::BIGINT::TEXT,16,'0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM accounts a WHERE a.iban = v_iban);
    END LOOP;

    RETURN QUERY
    INSERT INTO accounts (customer_id, currency_id, iban, nickname, balance, status)
    VALUES (v_customer_id, p_currency_id, v_iban,p_nickname, 0.00, 'ACTIVE')
    RETURNING accounts.id, accounts.iban;
END;
$$;

-- =============================================
-- 3. Get My Accounts Function
-- =============================================
CREATE OR REPLACE FUNCTION fn_get_my_accounts(p_user_id INT)
RETURNS TABLE (
    account_id INT,
    iban VARCHAR,
    nickname VARCHAR,
    balance DECIMAL,
    currency_code VARCHAR,
    status VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.iban, a.nickname, a.balance, c.code, a.status
    FROM customers cu
    INNER JOIN accounts a ON cu.id = a.customer_id
    INNER JOIN currencies c ON c.id = a.currency_id
    WHERE cu.user_id = p_user_id
    ORDER BY a.created_at;
END;
$$;

-- =============================================
-- 4. Transfer Money Function
-- =============================================
CREATE OR REPLACE FUNCTION fn_transfer_money(
    p_user_id INT,
    p_source_account_id INT,
    p_target_iban VARCHAR(34),
    p_amount DECIMAL(18,2),
    p_description VARCHAR(255) DEFAULT 'Hesaplar Arası Transfer'
)
RETURNS TABLE(
    transaction_id INT, 
    reference_no VARCHAR, 
    message VARCHAR
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_customer_id INT;
    v_source_balance DECIMAL(18,2);
    v_source_currency_id INT;
    v_source_status VARCHAR(20);
    v_target_account_id INT;
    v_target_currency_id INT;
    v_target_status VARCHAR(20);
    v_ref_no VARCHAR(50);
    v_txn_id INT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Transfer tutarı 0''dan büyük olmalıdır.';
    END IF;

    SELECT id INTO v_customer_id FROM customers WHERE user_id = p_user_id;
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Kullanıcıya ait müşteri kaydı bulunamadı.';
    END IF;

    SELECT balance, currency_id, status 
    INTO v_source_balance, v_source_currency_id, v_source_status
    FROM accounts 
    WHERE id = p_source_account_id AND customer_id = v_customer_id
    FOR UPDATE;

    IF v_source_status IS NULL THEN
        RAISE EXCEPTION 'Gönderen hesap bulunamadı veya bu kullanıcıya ait değil.';
    END IF;

    IF v_source_status != 'ACTIVE' THEN
        RAISE EXCEPTION 'Gönderen hesap aktif durumda değil.';
    END IF;

    SELECT id, currency_id, status 
    INTO v_target_account_id, v_target_currency_id, v_target_status
    FROM accounts 
    WHERE iban = p_target_iban
    FOR UPDATE;

    IF v_target_account_id IS NULL THEN
        RAISE EXCEPTION 'Alıcı IBAN adresi bulunamadı.';
    END IF;

    IF v_target_status != 'ACTIVE' THEN
        RAISE EXCEPTION 'Alıcı hesap aktif durumda değil.';
    END IF;

    IF p_source_account_id = v_target_account_id THEN
        RAISE EXCEPTION 'Kendi hesabınıza transfer gerçekleştiremezsiniz.';
    END IF;

    IF v_source_currency_id != v_target_currency_id THEN
        RAISE EXCEPTION 'Farklı para birimleri arasında transfer henüz desteklenmiyor.';
    END IF;

    IF v_source_balance < p_amount THEN
        RAISE EXCEPTION 'Yetersiz bakiye. Mevcut bakiye: % TL', v_source_balance;
    END IF;

    v_ref_no := 'TRX' || TO_CHAR(CLOCK_TIMESTAMP(), 'YYYYMMDDHH24MISSMS') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    UPDATE accounts SET balance = balance - p_amount WHERE id = p_source_account_id;
    UPDATE accounts SET balance = balance + p_amount WHERE id = v_target_account_id;

    INSERT INTO transactions (
        source_account_id, target_account_id, amount, 
        transaction_type, description, status, reference_no
    )
    VALUES (
        p_source_account_id, v_target_account_id, p_amount, 
        'TRANSFER', p_description, 'COMPLETED', v_ref_no
    )
    RETURNING id INTO v_txn_id;

    RETURN QUERY SELECT v_txn_id, v_ref_no, 'Transfer işlemi başarıyla gerçekleştirildi.'::VARCHAR;
END;
$$;

DROP FUNCTION IF EXISTS fn_get_transaction_history(INT);

CREATE OR REPLACE FUNCTION fn_get_transaction_history(
    p_user_id INT
)
RETURNS TABLE
(
    transaction_id INT,
    reference_no VARCHAR,
    source_iban VARCHAR,
    target_iban VARCHAR,
    amount NUMERIC(18,2),
    currency_code VARCHAR,
    currency_symbol VARCHAR,
    transaction_type VARCHAR,
    description VARCHAR,
    status VARCHAR,
    transaction_time TIMESTAMP,
    is_outgoing BOOLEAN
)
LANGUAGE plpgsql
AS
$$
DECLARE
    v_customer_id INT;
BEGIN

    SELECT id
    INTO v_customer_id
    FROM customers
    WHERE user_id = p_user_id;

    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Kullanıcıya ait müşteri bulunamadı.';
    END IF;

    RETURN QUERY

    SELECT

        t.id::INT,

        t.reference_no::VARCHAR,

        CASE
            WHEN t.transaction_type = 'DEPOSIT'
                THEN 'ATM'
            ELSE
                COALESCE(sa.iban, '-')::VARCHAR
        END,

        CASE
            WHEN t.transaction_type = 'WITHDRAW'
                THEN 'ATM'
            ELSE
                COALESCE(ta.iban, '-')::VARCHAR
        END,

        t.amount::NUMERIC(18,2),

        c.code::VARCHAR,

        c.symbol::VARCHAR,

        t.transaction_type::VARCHAR,

        COALESCE(t.description, '-')::VARCHAR,

        t.status::VARCHAR,

        t.transaction_time::TIMESTAMP,

        CASE

            WHEN t.transaction_type = 'WITHDRAW'
                THEN TRUE

            WHEN t.transaction_type = 'DEPOSIT'
                THEN FALSE

            WHEN sa.customer_id = v_customer_id
                THEN TRUE

            ELSE FALSE

        END::BOOLEAN

    FROM transactions t

    LEFT JOIN accounts sa
        ON sa.id = t.source_account_id

    LEFT JOIN accounts ta
        ON ta.id = t.target_account_id

    LEFT JOIN currencies c
        ON c.id = COALESCE(sa.currency_id, ta.currency_id)

    WHERE

        sa.customer_id = v_customer_id

        OR

        ta.customer_id = v_customer_id

    ORDER BY t.transaction_time DESC;

END;
$$;

-- =============================================
-- 6. Deposit Money Function
-- =============================================
CREATE OR REPLACE FUNCTION fn_deposit_money(
    p_user_id INT,
    p_account_id INT,
    p_amount DECIMAL(18,2),
    p_description VARCHAR(255)
)
RETURNS TABLE(
    transaction_id INT,
    reference_no VARCHAR,
    new_balance DECIMAL(18,2),
    message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_customer_id INT;
    v_balance DECIMAL(18,2);
    v_status VARCHAR(20);
    v_ref_no VARCHAR(50);
    v_txn_id INT;
BEGIN

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Tutar 0''dan büyük olmalıdır.';
    END IF;

    SELECT id
    INTO v_customer_id
    FROM customers
    WHERE user_id = p_user_id;

    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Müşteri bulunamadı.';
    END IF;

    SELECT balance, status
    INTO v_balance, v_status
    FROM accounts
    WHERE id = p_account_id
      AND customer_id = v_customer_id
    FOR UPDATE;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'Hesap bulunamadı.';
    END IF;

    IF v_status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'Hesap aktif değil.';
    END IF;

    UPDATE accounts
    SET balance = balance + p_amount
    WHERE id = p_account_id
    RETURNING balance INTO v_balance;

    v_ref_no :=
        'DEP'
        || TO_CHAR(CLOCK_TIMESTAMP(),'YYYYMMDDHH24MISSMS')
        || LPAD(FLOOR(RANDOM()*10000)::TEXT,4,'0');

    INSERT INTO transactions
    (
        source_account_id,
        amount,
        transaction_type,
        description,
        status,
        reference_no
    )
    VALUES
    (
        p_account_id,
        p_amount,
        'DEPOSIT',
        p_description,
        'COMPLETED',
        v_ref_no
    )
    RETURNING id INTO v_txn_id;

    RETURN QUERY
    SELECT
        v_txn_id,
        v_ref_no,
        v_balance,
        'Para yatırma başarılı.'::VARCHAR;

END;
$$;


-- 8. Get Dashboard Summary Function
DROP FUNCTION IF EXISTS fn_get_dashboard_summary(INT);

CREATE OR REPLACE FUNCTION fn_get_dashboard_summary(
    p_user_id INT
)
RETURNS TABLE(
    customer_name VARCHAR,
    currency_code VARCHAR,
    currency_symbol VARCHAR,
    balance DECIMAL(18,2),
    account_count INT,
    active_account_count INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_customer_id INT;
    v_customer_name VARCHAR(201);
BEGIN

    SELECT
        c.id,
        c.first_name || ' ' || c.last_name
    INTO
        v_customer_id,
        v_customer_name
    FROM customers c
    WHERE c.user_id = p_user_id;

    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Kullanıcıya ait müşteri kaydı bulunamadı.';
    END IF;

    RETURN QUERY
    SELECT
        v_customer_name::VARCHAR,
        cur.code::VARCHAR,
        cur.symbol::VARCHAR,

        COALESCE(SUM(a.balance), 0.00)::DECIMAL(18,2),

        (
            SELECT COUNT(*)::INT
            FROM accounts
            WHERE customer_id = v_customer_id
        ),

        (
            SELECT COUNT(*)::INT
            FROM accounts
            WHERE customer_id = v_customer_id
              AND status = 'ACTIVE'
        )

    FROM currencies cur

    LEFT JOIN accounts a
        ON a.currency_id = cur.id
       AND a.customer_id = v_customer_id

    GROUP BY
        cur.id,
        cur.code,
        cur.symbol

    ORDER BY cur.id;

END;
$$;
CREATE OR REPLACE FUNCTION fn_update_account_nickname(
    p_account_id INT,
    p_nickname VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN

UPDATE accounts
SET nickname = p_nickname
WHERE id = p_account_id;

END;
$$;
CREATE OR REPLACE FUNCTION fn_deactivate_account(
    p_account_id INT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN

UPDATE accounts
SET status = 'PASSIVE'
WHERE id = p_account_id;

END;
$$;
CREATE OR REPLACE FUNCTION fn_withdraw_money(
    p_user_id INT,
    p_account_id INT,
    p_amount DECIMAL(18,2),
    p_description VARCHAR(255) DEFAULT 'ATM Para Çekme'
)
RETURNS TABLE(
    transaction_id INT,
    reference_no VARCHAR,
    new_balance DECIMAL,
    message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_customer_id INT;
    v_balance DECIMAL(18,2);
    v_status VARCHAR(20);
    v_ref_no VARCHAR(50);
    v_txn_id INT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Çekilecek tutar 0''dan büyük olmalıdır.';
    END IF;

    SELECT id
    INTO v_customer_id
    FROM customers
    WHERE user_id = p_user_id;

    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Kullanıcı bulunamadı.';
    END IF;

    SELECT balance, status
    INTO v_balance, v_status
    FROM accounts
    WHERE id = p_account_id
      AND customer_id = v_customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Hesap bulunamadı.';
    END IF;

    IF v_status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'Hesap aktif değil.';
    END IF;

    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Yetersiz bakiye.';
    END IF;

    UPDATE accounts
    SET balance = balance - p_amount
    WHERE id = p_account_id;

    v_ref_no :=
        'WDR' ||
        TO_CHAR(CLOCK_TIMESTAMP(),'YYYYMMDDHH24MISSMS') ||
        LPAD(FLOOR(RANDOM()*10000)::TEXT,4,'0');

    INSERT INTO transactions
    (
        source_account_id,
        amount,
        transaction_type,
        description,
        status,
        reference_no
    )
    VALUES
    (
        p_account_id,
        p_amount,
        'WITHDRAW',
        p_description,
        'COMPLETED',
        v_ref_no
    )
    RETURNING id
    INTO v_txn_id;

    RETURN QUERY
    SELECT
        v_txn_id,
        v_ref_no,
        (SELECT balance FROM accounts WHERE id = p_account_id),
        'Para çekme işlemi başarılı.'::VARCHAR;
END;
$$;
DROP FUNCTION IF EXISTS fn_get_profile(INT);

CREATE OR REPLACE FUNCTION fn_get_profile(
    p_user_id INT
)
RETURNS TABLE(
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    phone_number VARCHAR,
    tckn VARCHAR,
    birth_date DATE,
    created_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN

    RETURN QUERY
    SELECT
        c.first_name,
        c.last_name,
        u.email,
        c.phone_number,
        c.tckn,
        c.birth_date,
        c.created_at
    FROM customers c
    INNER JOIN users u
        ON u.id = c.user_id
    WHERE c.user_id = p_user_id;

END;
$$;
DROP FUNCTION IF EXISTS fn_exchange_currency(
    INT,
    INT,
    INT,
    DECIMAL,
    VARCHAR
);

CREATE OR REPLACE FUNCTION fn_exchange_currency(
    p_user_id INT,
    p_source_account_id INT,
    p_target_account_id INT,
    p_amount DECIMAL(18,2),
    p_description VARCHAR(255) DEFAULT 'Döviz Dönüşümü'
)
RETURNS TABLE(
    transaction_id INT,
    reference_no VARCHAR,
    source_amount DECIMAL(18,2),
    target_amount DECIMAL(18,2),
    exchange_rate DECIMAL(18,6),
    exchange_rate_type VARCHAR,
    message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_customer_id INT;

    v_source_balance DECIMAL(18,2);
    v_source_currency_id INT;
    v_source_currency_code VARCHAR(10);
    v_source_status VARCHAR(20);

    v_target_currency_id INT;
    v_target_currency_code VARCHAR(10);
    v_target_status VARCHAR(20);

    v_buying_rate DECIMAL(18,6);
    v_selling_rate DECIMAL(18,6);
    v_exchange_rate DECIMAL(18,6);
    v_exchange_rate_type VARCHAR(10);

    v_target_amount DECIMAL(18,2);

    v_transaction_id INT;
    v_reference_no VARCHAR(50);
BEGIN

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Dönüştürülecek tutar 0''dan büyük olmalıdır.';
    END IF;

    IF p_source_account_id = p_target_account_id THEN
        RAISE EXCEPTION 'Kaynak ve hedef hesap aynı olamaz.';
    END IF;

    SELECT id
    INTO v_customer_id
    FROM customers
    WHERE user_id = p_user_id;

    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Kullanıcıya ait müşteri bulunamadı.';
    END IF;

    SELECT
        a.balance,
        a.currency_id,
        c.code,
        a.status
    INTO
        v_source_balance,
        v_source_currency_id,
        v_source_currency_code,
        v_source_status
    FROM accounts a
    INNER JOIN currencies c
        ON c.id = a.currency_id
    WHERE a.id = p_source_account_id
      AND a.customer_id = v_customer_id
    FOR UPDATE;

    IF v_source_status IS NULL THEN
        RAISE EXCEPTION 'Kaynak hesap bulunamadı.';
    END IF;

    IF v_source_status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'Kaynak hesap aktif değil.';
    END IF;

    SELECT
        a.currency_id,
        c.code,
        a.status
    INTO
        v_target_currency_id,
        v_target_currency_code,
        v_target_status
    FROM accounts a
    INNER JOIN currencies c
        ON c.id = a.currency_id
    WHERE a.id = p_target_account_id
      AND a.customer_id = v_customer_id
    FOR UPDATE;

    IF v_target_status IS NULL THEN
        RAISE EXCEPTION 'Hedef hesap bulunamadı.';
    END IF;

    IF v_target_status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'Hedef hesap aktif değil.';
    END IF;

    IF v_source_currency_code = v_target_currency_code THEN
        RAISE EXCEPTION 'Aynı para birimleri arasında döviz dönüşümü yapılamaz.';
    END IF;

    IF v_source_balance < p_amount THEN
        RAISE EXCEPTION 'Yetersiz bakiye.';
    END IF;

    /*
        TRY -> USD/EUR
        Banka dövizi müşteriye satıyor.
        Bu nedenle SELLING kullanılır.
    */
    IF v_source_currency_code = 'TRY'
       AND v_target_currency_code IN ('USD', 'EUR')
    THEN

        SELECT
            selling_rate
        INTO
            v_selling_rate
        FROM exchange_rates
        WHERE from_currency_id = v_target_currency_id
          AND to_currency_id = v_source_currency_id;

        IF v_selling_rate IS NULL THEN
            RAISE EXCEPTION
                '%/% kuru bulunamadı.',
                v_target_currency_code,
                v_source_currency_code;
        END IF;

        v_exchange_rate := v_selling_rate;
        v_exchange_rate_type := 'SELLING';

        v_target_amount :=
            ROUND(p_amount / v_selling_rate, 2);

    /*
        USD/EUR -> TRY
        Banka dövizi müşteriden satın alıyor.
        Bu nedenle BUYING kullanılır.
    */
    ELSIF v_source_currency_code IN ('USD', 'EUR')
          AND v_target_currency_code = 'TRY'
    THEN

        SELECT
            buying_rate
        INTO
            v_buying_rate
        FROM exchange_rates
        WHERE from_currency_id = v_source_currency_id
          AND to_currency_id = v_target_currency_id;

        IF v_buying_rate IS NULL THEN
            RAISE EXCEPTION
                '%/% kuru bulunamadı.',
                v_source_currency_code,
                v_target_currency_code;
        END IF;

        v_exchange_rate := v_buying_rate;
        v_exchange_rate_type := 'BUYING';

        v_target_amount :=
            ROUND(p_amount * v_buying_rate, 2);

    ELSE

        RAISE EXCEPTION
            'Bu para birimleri arasındaki dönüşüm şu anda desteklenmiyor.';

    END IF;

    v_reference_no :=
        'FX'
        || TO_CHAR(
            CLOCK_TIMESTAMP(),
            'YYYYMMDDHH24MISSMS'
        )
        || LPAD(
            FLOOR(RANDOM() * 10000)::TEXT,
            4,
            '0'
        );

    UPDATE accounts
    SET balance = balance - p_amount
    WHERE id = p_source_account_id;

    UPDATE accounts
    SET balance = balance + v_target_amount
    WHERE id = p_target_account_id;

    INSERT INTO transactions
    (
        source_account_id,
        target_account_id,
        amount,
        transaction_type,
        description,
        status,
        reference_no,
        exchange_rate,
        exchange_rate_type,
        converted_amount
    )
    VALUES
    (
        p_source_account_id,
        p_target_account_id,
        p_amount,
        'EXCHANGE',
        p_description,
        'COMPLETED',
        v_reference_no,
        v_exchange_rate,
        v_exchange_rate_type,
        v_target_amount
    )
    RETURNING id
    INTO v_transaction_id;

    RETURN QUERY
    SELECT
        v_transaction_id,
        v_reference_no,
        p_amount,
        v_target_amount,
        v_exchange_rate,
        v_exchange_rate_type,
        'Döviz dönüşümü başarıyla gerçekleştirildi.'::VARCHAR;

END;
$$;
CREATE TABLE investment_accounts (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    cash_balance NUMERIC(18,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_investment_account_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT uq_investment_account_user
        UNIQUE (user_id),

    CONSTRAINT chk_investment_cash_balance
        CHECK (cash_balance >= 0)
);
CREATE TABLE portfolio_positions (
    id SERIAL PRIMARY KEY,

    investment_account_id INTEGER NOT NULL,

    symbol VARCHAR(20) NOT NULL,

    quantity NUMERIC(18,4) NOT NULL DEFAULT 0,

    average_cost NUMERIC(18,4) NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_portfolio_investment_account
        FOREIGN KEY (investment_account_id)
        REFERENCES investment_accounts(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_portfolio_symbol
        UNIQUE (investment_account_id, symbol),

    CONSTRAINT chk_portfolio_quantity
        CHECK (quantity >= 0),

    CONSTRAINT chk_portfolio_average_cost
        CHECK (average_cost >= 0)
);
CREATE TABLE investment_transactions (
    id SERIAL PRIMARY KEY,

    investment_account_id INTEGER NOT NULL,

    symbol VARCHAR(20) NOT NULL,

    transaction_type VARCHAR(10) NOT NULL,

    quantity NUMERIC(18,4) NOT NULL,

    price NUMERIC(18,4) NOT NULL,

    total_amount NUMERIC(18,2) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_investment_transaction_account
        FOREIGN KEY (investment_account_id)
        REFERENCES investment_accounts(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_investment_transaction_type
        CHECK (transaction_type IN ('BUY', 'SELL')),

    CONSTRAINT chk_investment_transaction_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_investment_transaction_price
        CHECK (price > 0),

    CONSTRAINT chk_investment_transaction_total
        CHECK (total_amount > 0)
);
CREATE OR REPLACE FUNCTION fn_get_or_create_investment_account(
    p_user_id INTEGER
)
RETURNS TABLE (
    id INTEGER,
    user_id INTEGER,
    cash_balance NUMERIC,
    created_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN

    RETURN QUERY
    SELECT
        ia.id,
        ia.user_id,
        ia.cash_balance,
        ia.created_at
    FROM investment_accounts AS ia
    WHERE ia.user_id = p_user_id;

    IF FOUND THEN
        RETURN;
    END IF;

    INSERT INTO investment_accounts (
        user_id,
        cash_balance
    )
    VALUES (
        p_user_id,
        0
    )
    ON CONFLICT ON CONSTRAINT uq_investment_account_user
    DO NOTHING;

    RETURN QUERY
    SELECT
        ia.id,
        ia.user_id,
        ia.cash_balance,
        ia.created_at
    FROM investment_accounts AS ia
    WHERE ia.user_id = p_user_id;

END;
$$;
CREATE OR REPLACE FUNCTION fn_transfer_to_investment_account(
    p_user_id INTEGER,
    p_source_account_id INTEGER,
    p_amount NUMERIC
)
RETURNS TABLE (
    investment_account_id INTEGER,
    source_account_id INTEGER,
    new_source_balance NUMERIC,
    new_investment_balance NUMERIC,
    message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_investment_account_id INTEGER;
    v_source_balance NUMERIC;
BEGIN

    -- Tutar kontrolü
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Aktarılacak tutar sıfırdan büyük olmalıdır.';
    END IF;

    -- Kaynak hesabın kullanıcıya ait olup olmadığını,
    -- aktif olduğunu ve TRY hesabı olduğunu kontrol et
    SELECT
        a.balance
    INTO
        v_source_balance
    FROM accounts AS a
    INNER JOIN customers AS c
        ON c.id = a.customer_id
    INNER JOIN currencies AS cu
        ON cu.id = a.currency_id
    WHERE a.id = p_source_account_id
      AND c.user_id = p_user_id
      AND cu.code = 'TRY'
      AND a.status = 'ACTIVE';

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Kaynak hesap bulunamadı, kullanıcıya ait değil, aktif değil veya TRY hesabı değil.';
    END IF;

    -- Bakiye kontrolü
    IF v_source_balance < p_amount THEN
        RAISE EXCEPTION 'Yetersiz bakiye.';
    END IF;

    -- Yatırım hesabını garanti et
    SELECT ia.id
    INTO v_investment_account_id
    FROM fn_get_or_create_investment_account(p_user_id) AS ia;

    -- Banka hesabından düş
    UPDATE accounts AS a
    SET balance = balance - p_amount
    WHERE a.id = p_source_account_id;

    -- Yatırım hesabına ekle
    UPDATE investment_accounts AS ia
    SET cash_balance = cash_balance + p_amount
    WHERE ia.id = v_investment_account_id;

    -- Güncel bakiyeleri döndür
    RETURN QUERY
    SELECT
        v_investment_account_id,
        p_source_account_id,
        a.balance,
        ia.cash_balance,
        'Yatırım hesabına para aktarımı başarılı.'::VARCHAR
    FROM accounts AS a
    CROSS JOIN investment_accounts AS ia
    WHERE a.id = p_source_account_id
      AND ia.id = v_investment_account_id;

END;
$$;