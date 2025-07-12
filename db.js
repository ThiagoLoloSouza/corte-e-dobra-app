// db.js - Temporário para recriar a tabela clientes com a coluna enderecos JSONB[]

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessário para Render/Heroku SSL
    }
});

async function connectDbAndRecreateClientsTable() {
    try {
        await pool.connect();
        console.log('Conectado ao PostgreSQL!');

        // 1. Apaga a tabela 'clientes' se ela existir.
        // Isso removerá todos os dados e a estrutura atual.
        const dropClientsTableQuery = `
            DROP TABLE IF EXISTS clientes CASCADE;
        `;
        await pool.query(dropClientsTableQuery);
        console.log('Tabela "clientes" removida (se existia).');

        // 2. Recria a tabela 'clientes' com a estrutura correta.
        // A coluna 'enderecos' é criada diretamente como JSONB[].
        const createClientsTableQuery = `
            CREATE TABLE clientes (
                id VARCHAR(255) PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                tipo_pessoa VARCHAR(50),
                documento VARCHAR(255),
                enderecos JSONB[], -- AGORA CORRETO: Array de objetos JSONB
                telefone VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(createClientsTableQuery);
        console.log('Tabela "clientes" recriada com a coluna "enderecos" como JSONB[].');

        // 3. Adiciona a coluna 'updated_at' na tabela 'orcamentos' se ela não existir.
        // Mantemos essa verificação aqui para garantir que 'orcamentos' também esteja com a coluna correta.
        const alterOrcamentosTableQuery = `
            ALTER TABLE orcamentos
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        `;
        await pool.query(alterOrcamentosTableQuery);
        console.log('Coluna "updated_at" adicionada ou já existente na tabela "orcamentos".');

    } catch (err) {
        console.error('Erro ao conectar ou inicializar o banco de dados:', err);
    } finally {
        // Não feche o pool aqui se o servidor precisar dele para outras operações.
        // A conexão será gerenciada pelo pool.
    }
}

connectDbAndRecreateClientsTable(); // Chama a função para conectar e tentar recriar a tabela

module.exports = {
    query: (text, params) => pool.query(text, params),
};
