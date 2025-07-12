// db.js - Temporário para adicionar a coluna enderecos

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

        // Adiciona a coluna 'enderecos' como um array de JSONB se ela não existir
        // Esta coluna irá armazenar múltiplos endereços
        const addEnderecosColumnQuery = `
            ALTER TABLE clientes
            ADD COLUMN IF NOT EXISTS enderecos JSONB[];
        `;
        await pool.query(addEnderecosColumnQuery);
        console.log('Coluna "enderecos" adicionada ou já existente na tabela clientes.');

        // Opcional: Migrar dados da antiga coluna 'endereco' para a nova 'enderecos'
        // Esta parte é importante se você já tem clientes cadastrados com um único endereço
        // e quer que eles apareçam na nova estrutura de múltiplos endereços.
        // Se você não tem dados antigos ou não se importa em perdê-los, pode remover este bloco.
        const migrateOldEnderecoDataQuery = `
            UPDATE clientes
            SET enderecos = ARRAY[endereco]
            WHERE endereco IS NOT NULL AND (enderecos IS NULL OR array_length(enderecos, 1) IS NULL);
        `;
        await pool.query(migrateOldEnderecoDataQuery);
        console.log('Dados da coluna "endereco" migrados para "enderecos" (se aplicável).');

        // Opcional: Remover a antiga coluna 'endereco' após a migração (CUIDADO!)
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
