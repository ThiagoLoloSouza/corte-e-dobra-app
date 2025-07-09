document.addEventListener('DOMContentLoaded', function () {
    const formPeca = document.getElementById('form-peca');
    const tabelaResultados = document.querySelector('#tabela-resultados tbody');
    const resumoBitolas = {};
    const resumoCustos = {};
    const linhasOrcamento = [];

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

    formPeca.addEventListener('submit', function (event) {
        event.preventDefault();

        const tipo = document.getElementById('tipo').value;
        const bitola = document.getElementById('bitola').value;
        const a = parseFloat(document.getElementById('a').value) || 0;
        const b = parseFloat(document.getElementById('b').value) || 0;
        const c = parseFloat(document.getElementById('c').value) || 0;
        const quantidade = parseInt(document.getElementById('quantidade').value) || 0;

        let comprimentoCm;
        if (tipo.toLowerCase() === "estribo") {
            comprimentoCm = (a + b) * 2 + 10;
        } else {
            comprimentoCm = a + b + c;
        }

        const comprimentoM = comprimentoCm / 100;
        const pesoPorMetro = pesosPorMetro[bitola];
        const pesoTotalPecas = comprimentoM * pesoPorMetro * quantidade;
        const precoPorKgDaBitola = precosPorKg[bitola] || 0;
        const custoTotalPecas = pesoTotalPecas * precoPorKgDaBitola;

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

        novaLinha.dataset.bitola = bitola;
        novaLinha.dataset.peso = pesoTotalPecas;
        novaLinha.dataset.custo = custoTotalPecas;

        novaLinha.querySelector(".btn-excluir").addEventListener("click", function () {
            const bitolaExcluir = novaLinha.dataset.bitola;
            const pesoExcluir = parseFloat(novaLinha.dataset.peso);
            const custoExcluir = parseFloat(novaLinha.dataset.custo);

            if (resumoBitolas[bitolaExcluir]) {
                resumoBitolas[bitolaExcluir] -= pesoExcluir;
                if (resumoBitolas[bitolaExcluir] < 0.001) {
                    delete resumoBitolas[bitolaExcluir];
                }
            }

            if (resumoCustos[bitolaExcluir]) {
                resumoCustos[bitolaExcluir] -= custoExcluir;
                if (resumoCustos[bitolaExcluir] < 0.001) {
                    delete resumoCustos[bitolaExcluir];
                }
            }

            const index = linhasOrcamento.indexOf(novaLinha.orcamentoData);
            if (index > -1) {
                linhasOrcamento.splice(index, 1);
            }

            novaLinha.remove();
            atualizarResumoBitolas();
        });

        const dadosPeca = {
            tipo,
            bitola,
            medidas: { a, b, c },
            quantidade,
            comprimentoCm: comprimentoCm.toFixed(2),
            pesoKg: pesoTotalPecas.toFixed(3),
            custo: custoTotalPecas.toFixed(2)
        };

        novaLinha.orcamentoData = dadosPeca;
        linhasOrcamento.push(dadosPeca);

        tabelaResultados.appendChild(novaLinha);

        resumoBitolas[bitola] = (resumoBitolas[bitola] || 0) + pesoTotalPecas;
        resumoCustos[bitola] = (resumoCustos[bitola] || 0) + custoTotalPecas;

        atualizarResumoBitolas();
        formPeca.reset();
        document.getElementById('b').value = '';
        document.getElementById('c').value = '';
    });

    function atualizarResumoBitolas() {
        const corpoResumo = document.getElementById("tabela-resumo-bitolas");
        corpoResumo.innerHTML = "";
        let pesoTotalGeral = 0;
        let custoTotalGeral = 0;

        const bitolas = Object.keys(resumoBitolas).sort((a, b) => parseFloat(a) - parseFloat(b));
        for (const bitola of bitolas) {
            const peso = resumoBitolas[bitola];
            const custo = resumoCustos[bitola] || 0;
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

        document.getElementById("peso-total-geral").textContent = pesoTotalGeral.toFixed(3) + " kg";
        document.getElementById("custo-total-geral").textContent = "R$ " + custoTotalGeral.toFixed(2);
    }

    function montarOrcamento() {
        const cliente = document.getElementById('cliente').value;
        const codCliente = document.getElementById('codCliente').value;
        const obra = document.getElementById('obra').value;
        const numPedido = document.getElementById('numPedido').value;
        const recebeCaminhao = document.getElementById('recebeCaminhao').value;
        const dataDesejada = document.getElementById('dataDesejada').value;

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
            itensPedido: linhasOrcamento,
            resumoBitolas: resumoBitolas,
            resumoCustos: resumoCustos,
            resumoGeral: {
                pesoTotalGeral: pesoTotalGeral,
                custoTotalGeral: custoTotalGeral
            }
        };
    }

    // ✅ Envio para o backend
    document.getElementById("btnSalvarOrcamento").addEventListener("click", async () => {
        const orcamentoCompleto = montarOrcamento();
        const urlBase = window.location.hostname.includes('localhost')
            ? 'http://localhost:3000'
            : ''; // Render usa domínio já

        try {
            const response = await fetch(`${urlBase}/api/orcamentos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orcamentoCompleto)
            });

            if (!response.ok) throw new Error("Erro ao salvar orçamento.");
            const resultado = await response.json();
            alert("Orçamento salvo com sucesso! ID: " + resultado.id);
        } catch (error) {
                        alert("Erro ao salvar orçamento.");
                    }
                });
            
            });
        

            
