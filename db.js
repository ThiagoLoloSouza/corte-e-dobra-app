    // db.js

    const { Pool } = require('pg');

    let poolConfig = {};

    // Prioriza o uso de DATABASE_URL se ela estiver definida (comum em ambientes de produção como Render)
    if (process.env.DATABASE_URL) {
        poolConfig.connectionString = process.env.DATABASE_URL;

        // Para o Render e outros ambientes de produção, SSL é quase sempre obrigatório.
        // O 'rejectUnauthorized: false' é frequentemente necessário para certificados autoassinados.
        poolConfig.ssl = {
            rejectUnauthorized: false
        };
        console.log('Configurando conexão PostgreSQL com SSL (via DATABASE_URL).');
    } else {
        // Fallback para ambiente local usando variáveis separadas e sem SSL
        poolConfig = {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            ssl: false // Desabilita SSL para localhost
        };
        console.log('Configurando conexão PostgreSQL sem SSL (ambiente local).');
    }

    const pool = new Pool(poolConfig);

    // Event listener para quando a conexão for estabelecida
    pool.on('connect', () => {
        console.log('Conectado ao PostgreSQL!');
    });

    // Event listener para erros de conexão
    pool.on('error', (err) => {
        console.error('Erro na conexão com o PostgreSQL:', err);
    });

    // Função assíncrona para criar as tabelas e adicionar colunas se necessário
    async function createTables() {
        try {
            // Cria a tabela 'orcamentos' se não existir.
            // NOTA: As colunas obra_info e created_at NÃO são incluídas aqui,
            // pois serão adicionadas via ALTER TABLE abaixo se não existirem.
            await pool.query(`
                CREATE TABLE IF NOT EXISTS orcamentos (
                    id SERIAL PRIMARY KEY,
                    cliente_info JSONB,
                    itens_pedido JSONB,
                    resumo_bitolas JSONB,
                    resumo_custos JSONB,
                    resumo_geral JSONB
                );
            `);
            console.log('Tabela "orcamentos" verificada/criada com sucesso.');

            // **BLOCO TEMPORÁRIO: Adiciona a coluna obra_info se ela não existir**
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

            // **BLOCO TEMPORÁRIO: Adiciona a coluna created_at se ela não existir**
            await pool.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'orcamentos'::regclass AND attname = 'created_at') THEN
                        ALTER TABLE orcamentos ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
                        RAISE NOTICE 'Coluna created_at adicionada à tabela orcamentos.';
                    ELSE
                        RAISE NOTICE 'Coluna created_at já existe na tabela orcamentos.';
                    END IF;
                END
                $$;
            `);
            console.log('Verificação/Adição da coluna "created_at" concluída.');


            // Cria a tabela 'clientes' se não existir
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

    // Chama a função para criar tabelas assim que o módulo db for importado
    createTables();

    module.exports = pool;
    
    