-- BANK API DATABASE SETUP
-- 01 - TABLES / DATABASE STRUCTURE
-- =============================================

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
DROP TABLE IF EXISTS exchange_rates CASCADE;

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
    realized_profit_loss NUMERIC(18,2),

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