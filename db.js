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
                    -- Remova a linha 'obra_info JSONB,' daqui se ela já estava no seu db.js original
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Tabela "orcamentos" verificada/criada com sucesso.');

            // **NOVA LINHA TEMPORÁRIA: Adiciona a coluna obra_info se ela não existir**
            // Esta linha tentará adicionar a coluna. Se ela já existir, o PostgreSQL
            // pode dar um aviso/erro, mas a operação continuará.
            await pool.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'orcamentos'::regclass AND attname = 'obra_info') THEN
                        ALTER TABLE orcamentos ADD COLUMN obra_info JSONB;
                        RAISE NOTICE 'Coluna obra_info adicionada à tabela orcamentos.';
                    ELSE
                        RAISE NOTICE 'Coluna obra_info já existe na tabela orcamentos.';
                    END IF;
                END
                $$;
            `);
            console.log('Verificação/Adição da coluna "obra_info" concluída.');


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
            console.error('Erro ao criar tabela ou adicionar coluna:', err.message);
        }
    }

    createTables();

    module.exports = pool;
    