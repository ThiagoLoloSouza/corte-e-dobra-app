// server.js - Seu arquivo principal do backend

require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env
const express = require('express');
const bodyParser = require('body-parser'); // Middleware para parsear o corpo das requisições
const cors = require('cors'); // Middleware para habilitar CORS (Cross-Origin Resource Sharing)
const db = require('./db'); // Importa o módulo de conexão com o banco de dados (db.js)
const path = require('path'); // Módulo para lidar com caminhos de arquivos

const app = express();
const PORT = process.env.PORT || 3000; // Define a porta do servidor, padrão 3000

// --- MIDDLEWARES ---

// Habilita o CORS para todas as rotas. Essencial para permitir que seu frontend
// (rodando em uma porta diferente, ex: 5500 via Live Server) se comunique com seu backend.
app.use(cors());

// Habilita o parsing de JSON para o corpo das requisições.
// Permite que o servidor entenda os dados JSON enviados pelo frontend.
app.use(bodyParser.json());

// Serve arquivos estáticos da raiz do projeto.
// Isso é útil se você quiser servir seu frontend diretamente do backend em produção.
app.use(express.static(path.join(__dirname, '')));

// --- VARIÁVEIS EM MEMÓRIA (PARA GERAÇÃO TEMPORÁRIA DE IDs SE NÃO HOUVER DB) ---
// Estas variáveis são usadas para gerar IDs únicos (CLI-0001)
// quando o salvamento no banco de dados ainda não está totalmente implementado ou testado.
// Uma vez que o salvamento no DB esteja funcionando e retornando IDs reais do DB,
// a lógica de geração de ID pode ser simplificada para usar apenas os IDs do banco.
let nextClientIdInMemory = 1; // Contador simples para gerar IDs de cliente em memória

// --- ROTAS DA API ---

// Rota GET de exemplo: Verifica se o backend está funcionando
app.get('/', (req, res) => {
    res.send('Backend do sistema de orçamentos está rodando!');
});

// ROTA: POST /api/clientes - Para cadastrar um novo cliente
app.post('/api/clientes', async (req, res) => {
    const { nomeCliente, tipoPessoa, cnpjCliente, cpfCliente, enderecoCliente, telefoneCliente, emailCliente } = req.body;
    console.log('Recebendo requisição POST para /api/clientes. Dados:', req.body);

    if (!nomeCliente || !enderecoCliente || !telefoneCliente || (!cnpjCliente && !cpfCliente)) {
        console.log('Dados do cliente incompletos.');
        return res.status(400).json({ message: 'Dados do cliente incompletos. Nome, endereço, telefone e CNPJ/CPF são obrigatórios.' });
    }

    const newClientId = `CLI-${String(nextClientIdInMemory++).padStart(4, '0')}`;

    const newClientData = {
        id: newClientId,
        nome: nomeCliente,
        tipo_pessoa: tipoPessoa,
        documento: tipoPessoa === 'juridica' ? cnpjCliente : cpfCliente,
        endereco: enderecoCliente,
        telefone: telefoneCliente,
        email: emailCliente || null
    };

    try {
        const result = await db.query(
            `INSERT INTO clientes (id, nome, tipo_pessoa, documento, endereco, telefone, email)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, nome`,
            [newClientData.id, newClientData.nome, newClientData.tipo_pessoa, newClientData.documento, newClientData.endereco, newClientData.telefone, newClientData.email]
        );
        console.log('Cliente salvo no banco de dados:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao salvar cliente no banco de dados:', err);
        return res.status(500).json({ error: 'Erro interno do servidor ao cadastrar cliente.', details: err.message });
    }
});

// ROTA: GET /api/clientes/buscar - Para buscar clientes existentes no banco de dados
app.get('/api/clientes/buscar', async (req, res) => {
    const searchTerm = req.query.q;
    console.log('Recebendo requisição GET para /api/clientes/buscar. Termo:', searchTerm);

    if (!searchTerm) {
        return res.status(400).json({ message: 'Termo de busca é obrigatório.' });
    }

    try {
        const result = await db.query(
            `SELECT id, nome, documento, endereco, telefone, email, tipo_pessoa
             FROM clientes
             WHERE nome ILIKE $1 OR id ILIKE $1 OR documento ILIKE $1
             ORDER BY nome
             LIMIT 10`,
            [`%${searchTerm}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar clientes:', err);
        res.status(500).json({ error: 'Erro ao buscar clientes.', details: err.message });
    }
});


// ROTA: POST /api/orcamentos - Para salvar um orçamento
app.post('/api/orcamentos', async (req, res) => {
    console.log('\n--- Requisição POST /api/orcamentos recebida ---');
    console.log('req.body:', req.body);

    const { clienteInfo, itensPedido, resumoBitolas, resumoCustos, resumoGeral, obraInfo } = req.body;

    if (!clienteInfo || !itensPedido || !resumoGeral || !obraInfo) {
        return res.status(400).json({ error: 'Dados do orçamento incompletos.' });
    }

    try {
        const result = await db.query(
            `INSERT INTO orcamentos (cliente_info, itens_pedido, resumo_bitolas, resumo_custos, resumo_geral, obra_info)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [
                JSON.stringify(clienteInfo),
                JSON.stringify(itensPedido),
                JSON.stringify(resumoBitolas),
                JSON.stringify(resumoCustos),
                JSON.stringify(resumoGeral),
                JSON.stringify(obraInfo)
            ]
        );

        const novoIdOrcamento = result.rows[0].id;

        res.status(201).json({
            message: 'Orçamento salvo com sucesso!',
            id: novoIdOrcamento,
            numPedido: `PED-${String(novoIdOrcamento).padStart(4, '0')}`
        });
    } catch (err) {
        console.error('Erro ao salvar orçamento:', err);
        res.status(500).json({
            error: 'Erro ao salvar orçamento.',
            details: err.message
        });
    }
});

// ROTA: GET /api/orcamentos - Para listar todos os orçamentos (com filtro opcional)
// Esta é a rota que estava dando 404. Verifique se ela está exatamente assim no seu arquivo.
app.get('/api/orcamentos', async (req, res) => {
    const searchTerm = req.query.q;
    console.log('Recebendo requisição GET para /api/orcamentos. Termo de filtro:', searchTerm);

    let queryText = `SELECT id, cliente_info, obra_info, created_at FROM orcamentos`;
    const queryParams = [];

    if (searchTerm) {
        queryText += ` WHERE cliente_info->>'cliente' ILIKE $1 OR cliente_info->>'codCliente' ILIKE $1 OR obra_info->>'numPedido' ILIKE $1 OR id::text ILIKE $1`;
        queryParams.push(`%${searchTerm}%`);
    }

    queryText += ` ORDER BY created_at DESC LIMIT 20`;

    try {
        const result = await db.query(queryText, queryParams);
        const orcamentosFormatados = result.rows.map(row => ({
            id: row.id,
            clienteInfo: row.cliente_info,
            obraInfo: row.obra_info,
            dataOrcamento: new Date(row.created_at).toLocaleDateString('pt-BR'),
            numPedido: row.obra_info && row.obra_info.numPedido ? row.obra_info.numPedido : `PED-${String(row.id).padStart(4, '0')}`
        }));
        res.json(orcamentosFormatados);
    } catch (err) {
        console.error('Erro ao listar orçamentos:', err);
        res.status(500).json({ error: 'Erro ao listar orçamentos.', details: err.message });
    }
});

// ROTA: GET /api/orcamentos/:id - Para obter detalhes de um orçamento específico
app.get('/api/orcamentos/:id', async (req, res) => {
    const orcamentoId = req.params.id;
    console.log('Recebendo requisição GET para /api/orcamentos/:id. ID:', orcamentoId);

    try {
        const result = await db.query(`SELECT * FROM orcamentos WHERE id = $1`, [orcamentoId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Orçamento não encontrado.' });
        }

        const orcamento = result.rows[0];
        const orcamentoDetalhes = {
            id: orcamento.id,
            clienteInfo: orcamento.cliente_info,
            itensPedido: orcamento.itens_pedido,
            resumoBitolas: orcamento.resumo_bitolas,
            resumoCustos: orcamento.resumo_custos,
            resumoGeral: orcamento.resumo_geral,
            obraInfo: orcamento.obra_info,
            dataOrcamento: new Date(orcamento.created_at).toLocaleDateString('pt-BR'),
            numPedido: orcamento.obra_info && orcamento.obra_info.numPedido ? orcamento.obra_info.numPedido : `PED-${String(orcamento.id).padStart(4, '0')}`
        };

        res.json(orcamentoDetalhes);
    } catch (err) {
        console.error('Erro ao buscar detalhes do orçamento:', err);
        res.status(500).json({ error: 'Erro ao buscar detalhes do orçamento.', details: err.message });
    }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Para acessar o frontend, geralmente é em http://localhost:5500/index.html (se estiver usando Live Server)`);
    console.log(`API base: http://localhost:${PORT}`);
});
