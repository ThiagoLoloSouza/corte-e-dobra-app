document.addEventListener('DOMContentLoaded', function () {
    const formPeca = document.getElementById('form-peca');
    const tabelaResultados = document.querySelector('#tabela-resultados tbody');
    const resumoBitolas = {}; // Armazena o peso total por bitola
    const resumoCustos = {};   // Armazena o custo total por bitola
    const linhasOrcamento = []; // Armazena os dados das peças adicionadas para o PDF e salvamento

    // Pesos do vergalhão por metro (kg/m) para cada bitola
    const pesosPorMetro = {
        "4.2": 0.109,
        "5.0": 0.154,
        "6.3": 0.249,
        "8.0": 0.395,
        "10.0": 0.617,
        "12.5": 0.962,
        "16.0": 1.578,
        "20.0": 2.466,
        "25.0": 3.853
    };

    // Preços por quilo (R$/kg) para cada bitola (exemplo de valores)
    const precosPorKg = {
        "4.2": 8.50,
        "5.0": 8.20,
        "6.3": 7.90,
        "8.0": 7.80,
        "10.0": 7.70,
        "12.5": 7.60,
        "16.0": 7.50,
        "20.0": 7.40,
        "25.0": 7.30
    };

    // Event listener para adicionar uma nova peça
    formPeca.addEventListener('submit', function (event) {
        event.preventDefault(); // Impede o envio padrão do formulário

        const tipo = document.getElementById('tipo').value;
        const bitola = document.getElementById('bitola').value;
        const a = parseFloat(document.getElementById('a').value) || 0;
        const b = parseFloat(document.getElementById('b').value) || 0;
        const c = parseFloat(document.getElementById('c').value) || 0;
        const quantidade = parseInt(document.getElementById('quantidade').value) || 0;

        let comprimentoCm;
        // Lógica para calcular o comprimento total da peça com base no tipo
        if (tipo.toLowerCase() === "estribo") {
            // Fórmula do estribo (a + b) * 2 + 10cm de dobra/gancho
            comprimentoCm = (a + b) * 2 + 10;
        } else {
            // Para outras formas, soma simples das medidas
            comprimentoCm = a + b + c;
        }

        const comprimentoM = comprimentoCm / 100; // Converte cm para metros
        const pesoPorMetro = pesosPorMetro[bitola]; // Pega o peso por metro da bitola
        const pesoTotalPecas = comprimentoM * pesoPorMetro * quantidade; // Calcula o peso total
        const precoPorKgDaBitola = precosPorKg[bitola] || 0; // Pega o preço por kg da bitola
        const custoTotalPecas = pesoTotalPecas * precoPorKgDaBitola; // Calcula o custo total

        // Cria uma nova linha na tabela de resultados
        const novaLinha = document.createElement('tr');
        novaLinha.innerHTML = `
            <td>${tipo}</td>
            <td>${bitola} mm</td>
            <td>${a}${b ? '/' + b : ''}${c ? '/' + c : ''}</td>
            <td>${quantidade}</td>
            <td>${comprimentoCm.toFixed(2)} cm</td>
            <td>${pesoTotalPecas.toFixed(3)} kg</td>
            <td><button class="btn-excluir">Excluir</button></td>
        `;

        // Armazena dados na linha para fácil acesso ao excluir
        novaLinha.dataset.bitola = bitola;
        novaLinha.dataset.peso = pesoTotalPecas;
        novaLinha.dataset.custo = custoTotalPecas;

        // Adiciona evento de clique para o botão 'Excluir'
        novaLinha.querySelector(".btn-excluir").addEventListener("click", function () {
            const bitolaExcluir = novaLinha.dataset.bitola;
            const pesoExcluir = parseFloat(novaLinha.dataset.peso);
            const custoExcluir = parseFloat(novaLinha.dataset.custo);

            // Atualiza o resumo de pesos por bitola
            if (resumoBitolas[bitolaExcluir]) {
                resumoBitolas[bitolaExcluir] -= pesoExcluir;
                // Remove a bitola do resumo se o peso for muito pequeno (quase zero)
                if (resumoBitolas[bitolaExcluir] < 0.001) {
                    delete resumoBitolas[bitolaExcluir];
                }
            }

            // Atualiza o resumo de custos por bitola
            if (resumoCustos[bitolaExcluir]) {
                resumoCustos[bitolaExcluir] -= custoExcluir;
                // Remove a bitola do resumo se o custo for muito pequeno (quase zero)
                if (resumoCustos[bitolaExcluir] < 0.001) {
                    delete resumoCustos[bitolaExcluir];
                }
            }

            // Remove a peça do array de linhasOrcamento para o PDF
            const index = linhasOrcamento.indexOf(novaLinha.orcamentoData);
            if (index > -1) {
                linhasOrcamento.splice(index, 1);
            }

            novaLinha.remove(); // Remove a linha da tabela HTML
            atualizarResumoBitolas(); // Recalcula e atualiza o resumo
        });

        // Prepara os dados da peça para serem armazenados e usados no PDF/salvamento
        const dadosPeca = {
            tipo,
            bitola,
            medidas: { a, b, c },
            quantidade,
            comprimentoCm: comprimentoCm.toFixed(2),
            pesoKg: pesoTotalPecas.toFixed(3),
            custo: custoTotalPecas.toFixed(2)
        };

        // Associa os dados da peça à linha da tabela (útil para exclusão)
        novaLinha.orcamentoData = dadosPeca;
        linhasOrcamento.push(dadosPeca); // Adiciona a peça ao array global

        tabelaResultados.appendChild(novaLinha); // Adiciona a nova linha à tabela

        // Atualiza os totais de peso e custo para a bitola específica
        resumoBitolas[bitola] = (resumoBitolas[bitola] || 0) + pesoTotalPecas;
        resumoCustos[bitola] = (resumoCustos[bitola] || 0) + custoTotalPecas;

        atualizarResumoBitolas(); // Atualiza a tabela de resumo por bitola
        formPeca.reset(); // Limpa o formulário de adição de peça
        // Limpa campos específicos que podem não ser limpos pelo reset
        document.getElementById('b').value = '';
        document.getElementById('c').value = '';
    });

    // Função para atualizar a tabela de resumo por bitola e os totais gerais
    function atualizarResumoBitolas() {
        const corpoResumo = document.getElementById("tabela-resumo-bitolas");
        corpoResumo.innerHTML = ""; // Limpa a tabela de resumo
        let pesoTotalGeral = 0;
        let custoTotalGeral = 0;

        // Ordena as bitolas para exibir na ordem correta
        const bitolas = Object.keys(resumoBitolas).sort((a, b) => parseFloat(a) - parseFloat(b));
        for (const bitola of bitolas) {
            const peso = resumoBitolas[bitola];
            const custo = resumoCustos[bitola] || 0; // Garante que o custo seja 0 se não existir

            pesoTotalGeral += peso;
            custoTotalGeral += custo;

            const linha = document.createElement("tr");
            linha.innerHTML = `
                <td>${bitola} mm</td>
                <td>${peso.toFixed(3)} kg</td>
                <td>R$ ${custo.toFixed(2)}</td>
            `;
            corpoResumo.appendChild(linha);
        }

        // Atualiza os spans com os totais gerais
        document.getElementById("peso-total-geral").textContent = pesoTotalGeral.toFixed(3) + " kg";
        document.getElementById("custo-total-geral").textContent = "R$ " + custoTotalGeral.toFixed(2);
    }

    // Função para montar o objeto completo do orçamento (dados do cliente + itens + resumos)
    function montarOrcamento() {
        const cliente = document.getElementById('cliente').value;
        const codCliente = document.getElementById('codCliente').value;
        const obra = document.getElementById('obra').value;
        const numPedido = document.getElementById('numPedido').value;
        const recebeCaminhao = document.getElementById('recebeCaminhao').value;
        const dataDesejada = document.getElementById('dataDesejada').value;

        // Pega os valores formatados dos totais gerais diretamente do HTML
        const pesoTotalGeral = document.getElementById("peso-total-geral").textContent;
        const custoTotalGeral = document.getElementById("custo-total-geral").textContent;

        return {
            clienteInfo: {
                cliente,
                codCliente,
                obra,
                numPedido,
                recebeCaminhao,
                dataDesejada
            },
            // Cria uma cópia profunda para garantir que as medidas sejam armazenadas corretamente
            // e evitar problemas de referência se o objeto original for alterado
            itensPedido: linhasOrcamento.map(item => ({
                ...item,
                medidas: { ...item.medidas } // Copia as medidas também
            })),
            resumoBitolas: { ...resumoBitolas }, // Copia o objeto
            resumoCustos: { ...resumoCustos },     // Copia o objeto
            resumoGeral: {
                pesoTotalGeral: pesoTotalGeral,
                custoTotalGeral: custoTotalGeral
            }
        };
    }

    // ✅ Event listener para o botão "Salvar Orçamento"
    document.getElementById("btnSalvarOrcamento").addEventListener("click", async () => {
        const orcamentoCompleto = montarOrcamento(); // Monta o objeto do orçamento

        // Determina a URL base para o backend (ajuste conforme seu setup)
        const urlBase = window.location.hostname.includes('localhost')
            ? 'http://localhost:3000' // Para ambiente de desenvolvimento local
            : ''; // Se estiver em produção (ex: Render), o domínio já é a URL base

        try {
            const response = await fetch(`${urlBase}/api/orcamentos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orcamentoCompleto) // Envia o objeto como JSON
            });

            if (!response.ok) {
                // Se a resposta não for OK (status 2xx), lança um erro
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao salvar.' }));
                throw new Error(errorData.message || "Erro ao salvar orçamento.");
            }

            const resultado = await response.json(); // Pega a resposta do servidor
            alert("Orçamento salvo com sucesso! ID: " + resultado.id); // Alerta de sucesso
        } catch (error) {
            console.error("Erro ao salvar orçamento:", error);
            alert("Erro ao salvar orçamento. Detalhes: " + error.message); // Alerta de erro
        }
    });


    // ✅ Event listener para o botão "Gerar PDF do Orçamento"
    document.getElementById("btnGerarPdf").addEventListener("click", () => {
        // Garante que a biblioteca jsPDF esteja carregada no objeto window
        // Importante: <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        // deve estar no HTML ANTES deste script.
        const { jsPDF } = window.jspdf;

        const doc = new jsPDF(); // Inicializa um novo documento PDF
        const orcamento = montarOrcamento(); // Pega os dados completos do orçamento
        let y = 10; // Posição vertical inicial no PDF

        // Cabeçalho do PDF
        doc.setFontSize(14);
        doc.text("Orçamento - Corte e Dobra", 10, y);
        y += 10;

        // Informações do Cliente
        doc.setFontSize(11);
        doc.text(`Cliente: ${orcamento.clienteInfo.cliente || ''}`, 10, y); y += 6;
        doc.text(`Código: ${orcamento.clienteInfo.codCliente || ''}`, 10, y); y += 6;
        doc.text(`Obra: ${orcamento.clienteInfo.obra || ''}`, 10, y); y += 6;
        doc.text(`Pedido nº: ${orcamento.clienteInfo.numPedido || ''}`, 10, y); y += 6;
        doc.text(`Recebe Caminhão: ${orcamento.clienteInfo.recebeCaminhao || ''}`, 10, y); y += 6;
        doc.text(`Data Desejada: ${orcamento.clienteInfo.dataDesejada || ''}`, 10, y); y += 10;

        // Título da seção de Peças
        doc.setFontSize(12);
        doc.text("Peças:", 10, y); y += 6;

        // Lista de Peças
        doc.setFontSize(10);
        // Verifica se há itens antes de iterar para evitar erros
        if (orcamento.itensPedido && orcamento.itensPedido.length > 0) {
            orcamento.itensPedido.forEach((item, index) => {
                // Formata as medidas para exibição
                const medidasStr = `${item.medidas.a}${item.medidas.b ? '/' + item.medidas.b : ''}${item.medidas.c ? '/' + item.medidas.c : ''}`;
                doc.text(
                    `${index + 1}. ${item.tipo} - ${item.bitola}mm - ${medidasStr}cm - Qtde: ${item.quantidade} - Peso: ${item.pesoKg}kg - Custo: R$ ${item.custo}`,
                    10,
                    y
                );
                y += 6;
                // Adiciona nova página se o conteúdo exceder a altura da página
                if (y > 270) { // Limite de altura da página (aproximadamente, pode ajustar)
                    doc.addPage();
                    y = 10; // Reinicia a posição vertical na nova página
                }
            });
        } else {
            doc.text("Nenhuma peça adicionada.", 10, y);
            y += 10;
        }


        // Resumo por Bitola (Opcional, mas útil)
        y += 10;
        doc.setFontSize(12);
        doc.text("Resumo por Bitola:", 10, y); y += 6;
        doc.setFontSize(10);
        const bitolasOrdenadas = Object.keys(orcamento.resumoBitolas).sort((a, b) => parseFloat(a) - parseFloat(b));
        if (bitolasOrdenadas.length > 0) {
            bitolasOrdenadas.forEach(bitola => {
                const peso = orcamento.resumoBitolas[bitola];
                const custo = orcamento.resumoCustos[bitola];
                doc.text(`${bitola}mm: Peso ${peso.toFixed(3)} kg - Custo R$ ${custo.toFixed(2)}`, 15, y);
                y += 6;
                 if (y > 270) {
                    doc.addPage();
                    y = 10;
                }
            });
        } else {
            doc.text("Nenhum resumo de bitola disponível.", 10, y);
            y += 6;
        }


        // Totais Gerais
        y += 10;
        doc.setFontSize(12);
        doc.text(`Peso Total Geral: ${orcamento.resumoGeral.pesoTotalGeral}`, 10, y); y += 6;
        doc.text(`Custo Total Geral: ${orcamento.resumoGeral.custoTotalGeral}`, 10, y);

        // Salva o PDF com um nome de arquivo dinâmico
        doc.save(`Orcamento_${orcamento.clienteInfo.cliente.replace(/[^a-zA-Z0-9]/g, '_') || "cliente"}.pdf`);
        // O .replace() acima remove caracteres especiais do nome do cliente para o nome do arquivo
    });

}); // Fim do DOMContentLoaded