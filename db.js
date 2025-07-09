// db.js (para PostgreSQL)
const { Pool } = require('pg');

// Configurações do seu banco de dados PostgreSQL usando variáveis de ambiente
// Quando você implanta no Render, ele define automaticamente a variável DATABASE_URL
// com a string de conexão completa para o seu banco de dados no Render.
// Para desenvolvimento local, você pode usar um arquivo .env com DATABASE_URL=postgres://user:password@host:port/database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // A configuração SSL é importante para o Render e outros provedores de nuvem.
    // rejectUnauthorized: false é frequentemente necessário para conexões SSL com provedores que não
    // fornecem um certificado CA específico ou se você não o configura.
    ssl: {
        rejectUnauthorized: false
    }
});

// Testar a conexão com o banco de dados
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

// Criar a tabela 'orcamentos' se ela não existir
pool.query(`
    CREATE TABLE IF NOT EXISTS orcamentos (
        id SERIAL PRIMARY KEY,
        data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        cliente_info JSONB,      -- Armazena informações do cliente como JSON
        itens_pedido JSONB,      -- Armazena a lista de itens do pedido como JSON
        resumo_bitolas JSONB,    -- Armazena o resumo por bitolas como JSON
        resumo_custos JSONB,     -- Armazena o resumo de custos como JSON
        resumo_geral JSONB       -- Armazena o resumo geral como JSON
    );
`).then(() => {
    console.log('Tabela "orcamentos" verificada/criada com sucesso no PostgreSQL.');
}).catch(err => {
    console.error('Erro ao criar tabela de orçamentos no PostgreSQL:', err.message);
});

// Exporta a função 'query' para que o server.js possa interagir com o banco de dados
module.exports = {
    query: (text, params) => pool.query(text, params),
};