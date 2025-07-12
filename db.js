    // db.js

    const { Pool } = require('pg');

    let poolConfig = {};

    if (process.env.DATABASE_URL) {
        poolConfig.connectionString = process.env.DATABASE_URL;
        poolConfig.ssl = {
            rejectUnauthorized: false
        };
        console.log('Configurando conexão PostgreSQL com SSL (via DATABASE_URL).');
    } else {
        poolConfig = {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            ssl: false
        };
        console.log('Configurando conexão PostgreSQL sem SSL (ambiente local).');
    }

    const pool = new Pool(poolConfig);

    pool.on('connect', () => {
        console.log('Conectado ao PostgreSQL!');
    });

    pool.on('error', (err) => {
        console.error('Erro na conexão com o PostgreSQL:', err);
    });

    async function createTables() {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS orcamentos (
                    id SERIAL PRIMARY KEY,
                    cliente_info JSONB,
                    itens_pedido JSONB,
                    resumo_bitolas JSONB,
                    resumo_custos JSONB,
                    resumo_geral JSONB,
                    obra_info JSONB, -- Esta coluna já deve existir no seu DB do Render agora
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Esta coluna já deve existir no seu DB do Render agora
                );
            `);
            console.log('Tabela "orcamentos" verificada/criada com sucesso.');

            await pool.query(`
                CREATE TABLE IF NOT EXISTS clientes (
                    id VARCHAR(20) PRIMARY KEY,
                    nome VARCHAR(255) NOT NULL,
                    tipo_pessoa VARCHAR(10) NOT NULL,
                    documento VARCHAR(20),
                    endereco TEXT,
                    telefone VARCHAR(20),
                    email VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Tabela "clientes" verificada/criada com sucesso.');

        } catch (err) {
            console.error('Erro ao criar tabela:', err.message);
        }
    }

    createTables();

    module.exports = pool;
    