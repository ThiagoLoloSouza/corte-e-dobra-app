// db.js - Versão original e padrão

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessário para Render/Heroku SSL
    }
});

async function connectDb() {
    try {
        await pool.connect();
        console.log('Conectado ao PostgreSQL!');
    } catch (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    }
}

connectDb();

module.exports = {
    query: (text, params) => pool.query(text, params),
};
