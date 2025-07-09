// db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Testar conexão (aparece no log do Render)
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erro ao conectar ao PostgreSQL:', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
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
        data_criacao TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        cliente_info JSONB,
        itens_pedido JSONB,
        resumo_bitolas JSONB,
        resumo_custos JSONB,
        resumo_geral JSONB
    );
`).then(() => {
  console.log('Tabela "orcamentos" verificada/criada com sucesso.');
}).catch(err => {
  console.error('Erro ao criar tabela:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
