require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '')));

// Rota para salvar orçamento
app.post('/api/orcamentos', async (req, res) => {
  console.log('\n--- Requisição POST recebida ---');
  console.log('req.body:', req.body);

  const { clienteInfo, itensPedido, resumoBitolas, resumoCustos, resumoGeral } = req.body;

  if (!clienteInfo || !itensPedido || !resumoGeral) {
    return res.status(400).json({ error: 'Dados do orçamento incompletos.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO orcamentos (cliente_info, itens_pedido, resumo_bitolas, resumo_custos, resumo_geral)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        JSON.stringify(clienteInfo),
        JSON.stringify(itensPedido),
        JSON.stringify(resumoBitolas),
        JSON.stringify(resumoCustos),
        JSON.stringify(resumoGeral)
      ]
    );

    res.status(201).json({ message: 'Orçamento salvo com sucesso!', id: result.rows[0].id });
  } catch (err) {
    console.error('Erro ao salvar orçamento:', err);
    res.status(500).json({
      error: 'Erro ao salvar orçamento.',
      details: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
