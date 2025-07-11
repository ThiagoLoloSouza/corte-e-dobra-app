const { Pool } = require('pg');

let poolConfig = {};

// Verifica se a DATABASE_URL está definida (comum em ambientes de produção como Render, ou como você no local)
if (process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL;

    // Lógica SSL para DATABASE_URL
    // Se NODE_ENV for 'production' (Render) ou se for uma URL remota, habilita SSL.
    // Caso contrário (como seu localhost com DATABASE_URL), desabilita SSL.
    if (process.env.NODE_ENV === 'production' || !process.env.DATABASE_URL.includes('localhost')) {
        poolConfig.ssl = {
            rejectUnauthorized: false // Necessário para muitos provedores de nuvem
        };
        console.log('Configurando conexão PostgreSQL com SSL (via DATABASE_URL em produção/remoto).');
    } else {
        poolConfig.ssl = false; // Desabilita SSL para localhost via DATABASE_URL
        console.log('Configurando conexão PostgreSQL sem SSL (via DATABASE_URL em ambiente local).');
    }
} else {
    // Fallback: Se DATABASE_URL NÃO estiver definida, usa variáveis separadas (menos comum agora para você)
    poolConfig = {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    };
    // Lógica SSL para variáveis separadas
    if (process.env.NODE_ENV === 'production') { // Se NODE_ENV for 'production'
        poolConfig.ssl = { rejectUnauthorized: false };
        console.log('Configurando conexão PostgreSQL com SSL (via variáveis separadas em produção).');
    } else {
        poolConfig.ssl = false; // Desabilita SSL para ambiente local
        console.log('Configurando conexão PostgreSQL sem SSL (via variáveis separadas em ambiente local).');
    }
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

// Função assíncrona para criar as tabelas se elas não existirem
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
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Tabela "orcamentos" verificada/creada com sucesso.');

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
        console.log('Tabela "clientes" verificada/creada con éxito.');

    } catch (err) {
        console.error('Erro ao criar tabela:', err.message);
    }
}

// Chama a função para criar tabelas assim que o módulo db for importado
createTables();

module.exports = pool;