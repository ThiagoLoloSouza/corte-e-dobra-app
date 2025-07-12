// db.js - Temporário para adicionar a coluna updated_at

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessário para Render/Heroku SSL
    }
});

async function connectDbAndAlterTable() {
    try {
        await pool.connect();
        console.log('Conectado ao PostgreSQL!');

        // Comando SQL para adicionar a coluna updated_at se ela não existir
        // O "IF NOT EXISTS" é crucial para evitar erros se você rodar isso mais de uma vez
        const alterTableQuery = `
            ALTER TABLE orcamentos
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        `;
        await pool.query(alterTableQuery);
        console.log('Coluna updated_at adicionada ou já existente na tabela orcamentos.');

    } catch (err) {
        console.error('Erro ao conectar ou inicializar o banco de dados:', err);
    } finally {
        // Não feche o pool aqui se o servidor precisar dele para outras operações.
        // A conexão será gerenciada pelo pool.
    }
}

connectDbAndAlterTable(); // Chama a função para conectar e tentar alterar a tabela

module.exports = {
    query: (text, params) => pool.query(text, params),
    // Não é necessário exportar connectDbAndAlterTable para uso externo,
    // ela é executada na inicialização.
};
