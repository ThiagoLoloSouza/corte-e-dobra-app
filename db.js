// db.js (para PostgreSQL) 
const { Pool } = require('pg');

// Configurações do seu banco de dados PostgreSQL
const pool = new Pool({
    user: 'postgres',           // <-- Mude para o seu usuário do PostgreSQL
    host: 'localhost',          // Geralmente 'localhost' se o DB está na mesma máquina
    database: 'cortedobra_db',  // <-- Mude para o nome do banco de dados que você criou
    password: 'Thiago@1583',    // <-- Mude para a SUA SENHA do usuário
    port: 5432,                 // Porta padrão do PostgreSQL, raramente muda
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Erro ao conectar ao banco de dados PostgreSQL:', err.stack);
    }
    client.query('SELECT NOW()', (err, result) => {
        release(); // Libera o cliente de volta para o pool
        if (err) {
            return console.error('Erro ao executar query de teste:', err.stack);
        }
        console.log('Conectado ao PostgreSQL com sucesso!', result.rows[0].now);
    });
});

// Criar a tabela se não existir 
pool.query(`
    CREATE TABLE IF NOT EXISTS orcamentos (
        id SERIAL PRIMARY KEY,
        data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        cliente_info JSONB,  -- JSONB é melhor para JSON no PostgreSQL
        itens_pedido JSONB,
        resumo_bitolas JSONB,
        resumo_custos JSONB,
        resumo_geral JSONB
    );
`).then(() => {
    console.log('Tabela "orcamentos" verificada/criada com sucesso no PostgreSQL.');
}).catch(err => {
    console.error('Erro ao criar tabela de orçamentos no PostgreSQL:', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};