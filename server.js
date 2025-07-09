// server.js (ou app.js)
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db'); // Importa sua configuração do banco de dados
const path = require('path'); // Módulo 'path' para lidar com caminhos de arquivos

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permite requisições de diferentes origens
app.use(bodyParser.json()); // Habilita o parsing de JSON no corpo das requisições

// Serve arquivos estáticos da pasta onde o server.js está localizado.
// Isso fará com que o Express sirva o index.html, cortedobra.css, cortedobra.js etc.,
// quando você acessar http://localhost:3000/
// Certifique-se de que seus arquivos de frontend (index.html, cortedobra.css, cortedobra.js)
// estejam na mesma pasta que este arquivo server.js, ou ajuste 'public' se estiverem em subpasta.
app.use(express.static(path.join(__dirname, '')));

// Rota para salvar orçamentos (POST)
app.post('/api/orcamentos', async (req, res) => {
    // Logs para depuração
    console.log('\n--- Requisição POST recebida para /api/orcamentos ---');
    console.log('Headers da requisição:', req.headers);
    console.log('Corpo da requisição (req.body):', req.body);
    console.log('----------------------------------------------------');

    try {
        // Verifica se req.body está definido antes de desestruturar
        if (!req.body) {
            console.error('ERRO: req.body está undefined! O body-parser pode não ter funcionado corretamente.');
            return res.status(400).json({ error: 'Dados da requisição ausentes ou mal formatados.' });
        }

        // Desestrutura o corpo da requisição
        const { clienteInfo, itensPedido, resumoBitolas, resumoCustos, resumoGeral } = req.body;

        // Verifica se os dados essenciais estão presentes
        if (!clienteInfo || !itensPedido || !resumoGeral) {
             console.error('ERRO: Dados incompletos no corpo da requisição:', req.body);
             return res.status(400).json({ error: 'Dados do orçamento incompletos. Verifique clienteInfo, itensPedido e resumoGeral.' });
        }

        // É CRÍTICO converter os objetos/arrays JavaScript para strings JSON válidas
        // antes de enviá-los para as colunas JSONB do PostgreSQL.
        const stringifiedClienteInfo = JSON.stringify(clienteInfo);
        const stringifiedItensPedido = JSON.stringify(itensPedido);
        const stringifiedResumoBitolas = JSON.stringify(resumoBitolas);
        const stringifiedResumoCustos = JSON.stringify(resumoCustos);
        const stringifiedResumoGeral = JSON.stringify(resumoGeral);

        // Insere os dados no banco de dados
        const result = await db.query(
            `INSERT INTO orcamentos (cliente_info, itens_pedido, resumo_bitolas, resumo_custos, resumo_geral)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [stringifiedClienteInfo, stringifiedItensPedido, stringifiedResumoBitolas, stringifiedResumoCustos, stringifiedResumoGeral]
        );
        res.status(201).json({ message: 'Orçamento salvo com sucesso!', id: result.rows[0].id });
    } catch (err) {
        console.error('ERRO ao salvar orçamento no banco de dados:', err);
        // Retorna uma mensagem de erro mais detalhada em caso de falha no DB
        res.status(500).json({
            error: 'Erro interno do servidor ao salvar orçamento.',
            details: err.message,
            pgCode: err.code // Código de erro do PostgreSQL, se disponível
        });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`\nServidor rodando na porta ${PORT}`);
    console.log(`Para acessar localmente, use http://localhost:${PORT}`);
    console.log(`Para acessar de outros dispositivos na rede, use http://SEU_IP_LOCAL:${PORT}`);
});