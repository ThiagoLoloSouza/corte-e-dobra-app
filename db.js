// db.js - Temporário para corrigir e adicionar a coluna enderecos (Versão 2)

const { Pool } = require('pg');

const pool = new Pool({
    // Corrigido: 'connection' para 'connectionString'
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessário para Render/Heroku SSL
    }
});

async function connectDbAndAlterTable() {
    try {
        await pool.connect();
        console.log('Conectado ao PostgreSQL!');

        // 1. Tenta remover a coluna 'enderecos' se ela já existir, para garantir um estado limpo.
        // Isso é seguro com IF EXISTS.
        const dropEnderecosColumnQuery = `
            ALTER TABLE clientes
            DROP COLUMN IF EXISTS enderecos;
        `;
        await pool.query(dropEnderecosColumnQuery);
        console.log('Coluna "enderecos" removida (se existia) para recriação.');

        // 2. Adiciona a coluna 'enderecos' como um array de JSONB.
        // O tipo JSONB[] é crucial aqui para armazenar múltiplos endereços.
        const addEnderecosColumnQuery = `
            ALTER TABLE clientes
            ADD COLUMN enderecos JSONB[];
        `;
        await pool.query(addEnderecosColumnQuery);
        console.log('Coluna "enderecos" adicionada como JSONB[].');

        // 3. Migra dados da antiga coluna 'endereco' (se existir) para a nova 'enderecos'.
        // Verifica se 'endereco' existe e não é nulo, e se 'enderecos' ainda não foi preenchido.
        // Converte o 'endereco' existente para JSONB e o coloca dentro de um array.
        const migrateOldEnderecoDataQuery = `
            UPDATE clientes
            SET enderecos = ARRAY[endereco::jsonb]
            WHERE endereco IS NOT NULL
            AND (enderecos IS NULL OR jsonb_array_length(enderecos) = 0);
        `;
        await pool.query(migrateOldEnderecoDataQuery);
        console.log('Dados da antiga coluna "endereco" migrados para "enderecos" (se aplicável).');

        // 4. Opcional: Remover a antiga coluna 'endereco' após a migração (CUIDADO!)
        // Descomente a linha abaixo SOMENTE se você tiver certeza que a migração foi bem-sucedida
        // e que não precisa mais da coluna 'endereco' antiga.
        // const dropOldEnderecoColumnQuery = `
        //     ALTER TABLE clientes
        //     DROP COLUMN IF EXISTS endereco;
        // `;
        // await pool.query(dropOldEnderecoColumnQuery);
        // console.log('Antiga coluna "endereco" removida (se existia).');

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
};
