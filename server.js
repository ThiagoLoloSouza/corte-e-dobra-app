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
let nextClientIdInMemory = 1; // Contador simples para gerar IDs de cliente em memória

// --- ROTAS DA API ---

// Rota GET de exemplo: Verifica se o backend está funcionando
app.get('/', (req, res) => {
    res.send('Backend do sistema de orçamentos está rodando!');
});

// ROTA: POST /api/clientes - Para cadastrar um novo cliente
app.post('/api/clientes', async (req, res) => {
    const { nomeCliente, tipoPessoa, cnpjCliente, cpfCliente, enderecos, telefoneCliente, emailCliente } = req.body;
    console.log('Recebendo requisição POST para /api/clientes. Dados:', req.body);

    // Validação dos dados recebidos
    if (!nomeCliente || !telefoneCliente || (!cnpjCliente && !cpfCliente) || !enderecos || enderecos.length === 0) {
        let missingFields = [];
        if (!nomeCliente) missingFields.push('Nome');
        if (!telefoneCliente) missingFields.push('Telefone');
        if (!cnpjCliente && !cpfCliente) missingFields.push('CNPJ/CPF');
        if (!enderecos || enderecos.length === 0) missingFields.push('Endereço');

        console.log('Dados do cliente incompletos. Faltando:', missingFields.join(', '));
        return res.status(400).json({
            message: `Dados do cliente incompletos. Os seguintes campos são obrigatórios: ${missingFields.join(', ')}.`,
            details: req.body
        });
    }

    const newClientId = `CLI-${String(nextClientIdInMemory++).padStart(4, '0')}`;

    const newClientData = {
        id: newClientId,
        nome: nomeCliente,
        tipo_pessoa: tipoPessoa,
        documento: tipoPessoa === 'juridica' ? cnpjCliente : cpfCliente,
        enderecos: enderecos, // Agora é um array de objetos JSON
        telefone: telefoneCliente,
        email: emailCliente || null
    };

    try {
        const result = await db.query(
            `INSERT INTO clientes (id, nome, tipo_pessoa, documento, enderecos, telefone, email)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, nome`,
            [newClientData.id, newClientData.nome, newClientData.tipo_pessoa, newClientData.documento, JSON.stringify(newClientData.enderecos), newClientData.telefone, newClientData.email]
        );
        console.log('Cliente salvo no banco de dados:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao salvar cliente no banco de dados:', err);
        return res.status(500).json({ error: 'Erro interno do servidor ao cadastrar cliente.', details: err.message });
    }
});

// ROTA: PUT /api/clientes/:id - Para atualizar um cliente existente
app.put('/api/clientes/:id', async (req, res) => {
    const clientId = req.params.id;
    const { nomeCliente, tipoPessoa, cnpjCliente, cpfCliente, enderecos, telefoneCliente, emailCliente } = req.body;
    console.log(`Recebendo requisição PUT para /api/clientes/${clientId}. Dados:`, req.body);

    if (!nomeCliente || !telefoneCliente || (!cnpjCliente && !cpfCliente) || !enderecos || enderecos.length === 0) {
        let missingFields = [];
        if (!nomeCliente) missingFields.push('Nome');
        if (!telefoneCliente) missingFields.push('Telefone');
        if (!cnpjCliente && !cpfCliente) missingFields.push('CNPJ/CPF');
        if (!enderecos || enderecos.length === 0) missingFields.push('Endereço');

        console.log('Dados do cliente incompletos para atualização. Faltando:', missingFields.join(', '));
        return res.status(400).json({
            message: `Dados do cliente incompletos para atualização. Os seguintes campos são obrigatórios: ${missingFields.join(', ')}.`,
            details: req.body
        });
    }

    const updatedClientData = {
        nome: nomeCliente,
        tipo_pessoa: tipoPessoa,
        documento: tipoPessoa === 'juridica' ? cnpjCliente : cpfCliente,
        enderecos: enderecos, // Agora é um array de objetos JSON
        telefone: telefoneCliente,
        email: emailCliente || null
    };

    try {
        const result = await db.query(
            `UPDATE clientes
             SET nome = $1, tipo_pessoa = $2, documento = $3, enderecos = $4, telefone = $5, email = $6
             WHERE id = $7 RETURNING id, nome`,
            [updatedClientData.nome, updatedClientData.tipo_pessoa, updatedClientData.documento, JSON.stringify(updatedClientData.enderecos), updatedClientData.telefone, updatedClientData.email, clientId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado para atualização.' });
        }

        console.log('Cliente atualizado no banco de dados:', result.rows[0]);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar cliente no banco de dados:', err);
        return res.status(500).json({ error: 'Erro interno do servidor ao atualizar cliente.', details: err.message });
    }
});


// ROTA: GET /api/clientes/buscar - Para buscar clientes existentes
app.get('/api/clientes/buscar', async (req, res) => {
    const searchTerm = req.query.q;
    console.log('Recebendo requisição GET para /api/clientes/buscar. Termo:', searchTerm);

    if (!searchTerm) {
        return res.status(400).json({ message: 'Termo de busca é obrigatório.' });
    }

    try {
        const result = await db.query(
            `SELECT id, nome, documento, enderecos, telefone, email, tipo_pessoa
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

// ROTA: GET /api/clientes/:id - Para obter detalhes de um cliente específico
app.get('/api/clientes/:id', async (req, res) => {
    const clientId = req.params.id;
    console.log(`Recebendo requisição GET para /api/clientes/${clientId}`);

    try {
        const result = await db.query(
            `SELECT id, nome, tipo_pessoa, documento, enderecos, telefone, email
             FROM clientes
             WHERE id = $1`,
            [clientId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao buscar detalhes do cliente:', err);
        res.status(500).json({ error: 'Erro ao buscar detalhes do cliente.', details: err.message });
    }
});


// ROTA: POST /api/orcamentos - Para salvar um novo orçamento
app.post('/api/orcamentos', async (req, res) => {
    console.log('\n--- Requisição POST /api/orcamentos recebida ---');
    console.log('req.body:', req.body);

    const { clienteInfo, itensPedido, resumoBitolas, resumoCustos, resumoGeral, obraInfo } = req.body;

    if (!clienteInfo || !itensPedido || !resumoGeral || !obraInfo || !clienteInfo.codCliente) {
        return res.status(400).json({ error: 'Dados do orçamento incompletos. Cliente, itens do pedido, resumo e informações da obra são obrigatórios.' });
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

// ROTA: PUT /api/orcamentos/:id - Para atualizar um orçamento existente
app.put('/api/orcamentos/:id', async (req, res) => {
    const orcamentoId = req.params.id;
    console.log(`\n--- Requisição PUT /api/orcamentos/${orcamentoId} recebida ---`);
    console.log('req.body:', req.body);

    const { clienteInfo, itensPedido, resumoBitolas, resumoCustos, resumoGeral, obraInfo } = req.body;

    if (!clienteInfo || !itensPedido || !resumoGeral || !obraInfo || !clienteInfo.codCliente) {
        return res.status(400).json({ error: 'Dados do orçamento incompletos para atualização. Cliente, itens do pedido, resumo e informações da obra são obrigatórios.' });
    }

    try {
        const result = await db.query(
            `UPDATE orcamentos
             SET cliente_info = $1, itens_pedido = $2, resumo_bitolas = $3, resumo_custos = $4, resumo_geral = $5, obra_info = $6, updated_at = NOW()
             WHERE id = $7 RETURNING id`,
            [
                JSON.stringify(clienteInfo),
                JSON.stringify(itensPedido),
                JSON.stringify(resumoBitolas),
                JSON.stringify(resumoCustos),
                JSON.stringify(resumoGeral),
                JSON.stringify(obraInfo),
                orcamentoId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Orçamento não encontrado para atualização.' });
        }

        res.status(200).json({
            message: 'Orçamento atualizado com sucesso!',
            id: result.rows[0].id,
            numPedido: obraInfo && obraInfo.numPedido ? obraInfo.numPedido : `PED-${String(result.rows[0].id).padStart(4, '0')}`
        });
    } catch (err) {
        console.error('Erro ao atualizar orçamento:', err);
        res.status(500).json({
            error: 'Erro ao atualizar orçamento.',
            details: err.message
        });
    }
});

// ROTA: GET /api/orcamentos - Para listar todos os orçamentos (com filtro opcional)
app.get('/api/orcamentos', async (req, res) => {
    const searchTerm = req.query.q;
    console.log('Recebendo requisição GET para /api/orcamentos. Termo de filtro:', searchTerm);

    let queryText = `SELECT id, cliente_info, obra_info, created_at FROM orcamentos`;
    const queryParams = [];

    if (searchTerm) {
        // Busca em cliente_info (nome, codCliente), obra_info (numPedido) e id do orçamento
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

// ROTA: DELETE /api/orcamentos/:id - Para excluir um orçamento
app.delete('/api/orcamentos/:id', async (req, res) => {
    const orcamentoId = req.params.id;
    console.log(`Recebendo requisição DELETE para /api/orcamentos/${orcamentoId}`);

    try {
        const result = await db.query(`DELETE FROM orcamentos WHERE id = $1 RETURNING id`, [orcamentoId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Orçamento não encontrado para exclusão.' });
        }

        res.status(200).json({ message: 'Orçamento excluído com sucesso!', id: result.rows[0].id });
    } catch (err) {
        console.error('Erro ao excluir orçamento:', err);
        res.status(500).json({ error: 'Erro ao excluir orçamento.', details: err.message });
    }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Para acessar o frontend, geralmente é em http://localhost:5500/index.html (se estiver usando Live Server)`);
    console.log(`API base: http://localhost:${PORT}`);
});
