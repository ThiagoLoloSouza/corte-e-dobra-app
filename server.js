// server.js (ou app.js)

require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env (para desenvolvimento local)

const express = require('express');
const bodyParser = require('body-parser'); // Middleware para parsear o corpo das requisições
const cors = require('cors'); // Middleware para permitir requisições de diferentes origens
const db = require('./db'); // Importa sua configuração do banco de dados (db.js)
const path = require('path'); // Módulo 'path' para lidar com caminhos de arquivos

const app = express();
const PORT = process.env.PORT || 3000; // Define a porta, usando a variável de ambiente PORT se disponível (Render usa)

// Middlewares
app.use(cors()); // Habilita o CORS para todas as rotas
app.use(bodyParser.json()); // Habilita o parsing de corpos de requisição JSON

// Serve arquivos estáticos da pasta onde o server.js está localizado.
// Isso fará com que o Express sirva o index.html, cortedobra.css, cortedobra.js etc.,
// quando você acessar http://localhost:3000/ ou a URL do Render.
// Certifique-se de que seus arquivos de frontend (index.html, cortedobra.css, cortedobra.js)
// estejam na mesma pasta que este arquivo server.js.
app.use(express.static(path.join(__dirname, '')));

// Rota para salvar um novo orçamento (POST)
app.post('/api/orcamentos', async (req, res) => {
    // Logs detalhados para depuração no console do servidor
    console.log('\n--- Requisição POST recebida para /api/orcamentos ---');
    console.log('Headers da requisição:', req.headers);
    console.log('Corpo da requisição (req.body):', req.body);
    console.log('----------------------------------------------------');

    try {
        // Verifica se o corpo da requisição está definido
        if (!req.body) {
            console.error('ERRO: req.body está undefined! O body-parser pode não ter funcionado corretamente.');
            return res.status(400).json({ error: 'Dados da requisição ausentes ou mal formatados.' });
        }

        // Desestrutura o corpo da requisição para obter os dados do orçamento
        const { clienteInfo, itensPedido, resumoBitolas, resumoCustos, resumoGeral } = req.body;

        // Verifica se os dados essenciais para o orçamento estão presentes
        if (!clienteInfo || !itensPedido || !resumoGeral) {
             console.error('ERRO: Dados incompletos no corpo da requisição:', req.body);
             return res.status(400).json({ error: 'Dados do orçamento incompletos. Verifique clienteInfo, itensPedido e resumoGeral.' });
        }

        // Converte os objetos JavaScript para strings JSON válidas.
        // Isso é crucial para armazená-los corretamente nas colunas JSONB do PostgreSQL.
        const stringifiedClienteInfo = JSON.stringify(clienteInfo);
        const stringifiedItensPedido = JSON.stringify(itensPedido);
        const stringifiedResumoBitolas = JSON.stringify(resumoBitolas);
        const stringifiedResumoCustos = JSON.stringify(resumoCustos);
        const stringifiedResumoGeral = JSON.stringify(resumoGeral);

        // Executa a query SQL para inserir os dados do orçamento na tabela 'orcamentos'.
        // Os placeholders $1, $2, etc., são preenchidos pelos valores do array.
        // RETURNING id retorna o ID gerado para o novo registro.
        const result = await db.query(
            `INSERT INTO orcamentos (cliente_info, itens_pedido, resumo_bitolas, resumo_custos, resumo_geral)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [stringifiedClienteInfo, stringifiedItensPedido, stringifiedResumoBitolas, stringifiedResumoCustos, stringifiedResumoGeral]
        );

        // Envia uma resposta de sucesso com o ID do orçamento salvo
        res.status(201).json({ message: 'Orçamento salvo com sucesso!', id: result.rows[0].id });
    } catch (err) {
        // Captura e loga quaisquer erros que ocorram durante o processo de salvamento
        console.error('ERRO ao salvar orçamento no banco de dados:', err);
        // Envia uma resposta de erro para o cliente, incluindo detalhes para depuração
        res.status(500).json({
            error: 'Erro interno do servidor ao salvar orçamento.',
            details: err.message, // Mensagem de erro do Node.js/PostgreSQL
            pgCode: err.code // Código de erro específico do PostgreSQL (se disponível)
        });
    }
});

// Inicia o servidor, escutando na porta definida
app.listen(PORT, () => {
    console.log(`\nServidor rodando na porta ${PORT}`);
    console.log(`Para acessar localmente, use http://localhost:${PORT}`);
    console.log(`Para acessar de outros dispositivos na rede, use http://SEU_IP_LOCAL:${PORT}`);
});