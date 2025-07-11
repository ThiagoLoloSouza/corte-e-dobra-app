document.addEventListener('DOMContentLoaded', function () {
    // --- REFERÊNCIAS PARA ELEMENTOS DO FORMULÁRIO PRINCIPAL ---
    const formPeca = document.getElementById('form-peca');
    const tabelaResultados = document.querySelector('#tabela-resultados tbody');
    const resumoBitolasDisplay = document.getElementById("tabela-resumo-bitolas");
    const pesoTotalGeralElement = document.getElementById("peso-total-geral");
    const custoTotalGeralElement = document.getElementById("custo-total-geral");
    const btnSalvarOrcamento = document.getElementById("btnSalvarOrcamento");
    const btnGerarPdf = document.getElementById("btnGerarPdf");

    const clienteInputPrincipal = document.getElementById('cliente');
    const codClienteInputPrincipal = document.getElementById('codCliente');
    const obraInput = document.getElementById('obra');
    const numPedidoInput = document.getElementById('numPedido');
    const recebeCaminhaoSelect = document.getElementById('recebeCaminhao');
    const dataDesejadaInput = document.getElementById('dataDesejada');

    if (clienteInputPrincipal) clienteInputPrincipal.readOnly = true;
    if (codClienteInputPrincipal) codClienteInputPrincipal.readOnly = true;
    if (numPedidoInput) numPedidoInput.readOnly = true;

    const resumoBitolasCalculo = {};
    const resumoCustosCalculo = {};
    const linhasOrcamento = [];

    // --- REFERÊNCIAS E LÓGICA DA MODAL DE CADASTRO DE CLIENTE ---
    const modalCadastroCliente = document.getElementById('modalCadastroCliente');
    const btnAbrirModalCadastroCliente = document.getElementById('btnAbrirModalCadastroCliente');
    const closeModalCadastroCliente = document.getElementById('closeModalCadastroCliente');
    const formCadastroCliente = document.getElementById('formCadastroCliente');
    const cadastroClienteFeedback = document.getElementById('cadastroClienteFeedback');

    const radioJuridica = document.getElementById('radioJuridica');
    const radioFisica = document.getElementById('radioFisica');
    const cnpjGroup = document.getElementById('cnpjGroup');
    const cpfGroup = document.getElementById('cpfGroup');
    const cnpjClienteInput = document.getElementById('cnpjCliente');
    const cpfClienteInput = document.getElementById('cpfCliente');

    function toggleCpfCnpjFields() {
        const tipoPessoaSelecionado = document.querySelector('input[name="tipoPessoa"]:checked')?.value || 'juridica';
        if (tipoPessoaSelecionado === 'juridica') {
            if (cnpjGroup) cnpjGroup.style.display = 'block';
            if (cpfGroup) cpfGroup.style.display = 'none';
            if (cnpjClienteInput) cnpjClienteInput.required = true;
            if (cpfClienteInput) cpfClienteInput.required = false;
            if (cpfClienteInput) cpfClienteInput.value = '';
        } else {
            if (cnpjGroup) cnpjGroup.style.display = 'none';
            if (cpfGroup) cpfGroup.style.display = 'block';
            if (cnpjClienteInput) cnpjClienteInput.required = false;
            if (cpfClienteInput) cpfClienteInput.required = true;
            if (cnpjClienteInput) cnpjClienteInput.value = '';
        }
    }

    if (btnAbrirModalCadastroCliente && modalCadastroCliente) {
        btnAbrirModalCadastroCliente.addEventListener('click', function() {
            modalCadastroCliente.style.display = 'flex';
            toggleCpfCnpjFields();
        });
    }

    if (closeModalCadastroCliente && formCadastroCliente && cadastroClienteFeedback && modalCadastroCliente) {
        closeModalCadastroCliente.addEventListener('click', function() {
            modalCadastroCliente.style.display = 'none';
            formCadastroCliente.reset();
            cadastroClienteFeedback.textContent = '';
            if (radioJuridica) radioJuridica.checked = true;
            toggleCpfCnpjFields();
        });
    }

    if (modalCadastroCliente && formCadastroCliente && cadastroClienteFeedback) {
        window.addEventListener('click', function(event) {
            if (event.target === modalCadastroCliente) {
                modalCadastroCliente.style.display = 'none';
                formCadastroCliente.reset();
                cadastroClienteFeedback.textContent = '';
                if (radioJuridica) radioJuridica.checked = true;
                toggleCpfCnpjFields();
            }
        });
    }

    document.querySelectorAll('input[name="tipoPessoa"]').forEach(radio => {
        radio.addEventListener('change', toggleCpfCnpjFields);
    });

    if (formCadastroCliente && cadastroClienteFeedback && clienteInputPrincipal && codClienteInputPrincipal) {
        formCadastroCliente.addEventListener('submit', async function(event) {
            event.preventDefault();

            cadastroClienteFeedback.textContent = 'Salvando cliente...';
            cadastroClienteFeedback.style.color = 'blue';

            const nomeCliente = document.getElementById('nomeCliente')?.value;
            const tipoPessoa = document.querySelector('input[name="tipoPessoa"]:checked')?.value;
            const cnpjCliente = document.getElementById('cnpjCliente')?.value;
            const cpfCliente = document.getElementById('cpfCliente')?.value;
            const enderecoCliente = document.getElementById('enderecoCliente')?.value;
            const telefoneCliente = document.getElementById('telefoneCliente')?.value;
            const emailCliente = document.getElementById('emailCliente')?.value;

            const clientData = {
                nomeCliente,
                tipoPessoa,
                cnpjCliente: tipoPessoa === 'juridica' ? cnpjCliente : null,
                cpfCliente: tipoPessoa === 'fisica' ? cpfCliente : null,
                enderecoCliente,
                telefoneCliente,
                emailCliente
            };

            const urlBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000'
                : '';

            try {
                const response = await fetch(`${urlBase}/api/clientes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clientData)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao cadastrar cliente.' }));
                    throw new Error(errorData.message || "Erro ao cadastrar cliente.");
                }

                const newClient = await response.json();

                cadastroClienteFeedback.textContent = `Cliente "${newClient.nome}" cadastrado com sucesso! Código: ${newClient.id}`;
                cadastroClienteFeedback.style.color = 'green';

                clienteInputPrincipal.value = newClient.nome;
                codClienteInputPrincipal.value = newClient.id;

                setTimeout(() => {
                    if (modalCadastroCliente) modalCadastroCliente.style.display = 'none';
                    formCadastroCliente.reset();
                    cadastroClienteFeedback.textContent = '';
                    if (radioJuridica) radioJuridica.checked = true;
                    toggleCpfCnpjFields();
                }, 2000);
            } catch (error) {
                console.error("Erro ao cadastrar cliente:", error);
                cadastroClienteFeedback.textContent = "Erro ao cadastrar cliente. Detalhes: " + error.message;
                cadastroClienteFeedback.style.color = 'red';
            }
        });
    }

    // --- LÓGICA DE BUSCA DE CLIENTE EXISTENTE ---
    const buscarClienteInput = document.getElementById('buscarCliente');
    const btnBuscarCliente = document.getElementById('btnBuscarCliente');
    const resultadosBuscaClienteDiv = document.getElementById('resultadosBuscaCliente');

    if (btnBuscarCliente && buscarClienteInput && resultadosBuscaClienteDiv) {
        btnBuscarCliente.addEventListener('click', async () => {
            const searchTerm = buscarClienteInput.value.trim();
            if (!searchTerm) {
                resultadosBuscaClienteDiv.innerHTML = '<p style="color: gray; font-style: italic;">Digite um termo para buscar (nome, código ou documento).</p>';
                return;
            }

            const urlBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000'
                : '';

            try {
                const response = await fetch(`${urlBase}/api/clientes/buscar?q=${encodeURIComponent(searchTerm)}`);
                if (!response.ok) {
                    throw new Error('Erro ao buscar clientes.');
                }
                const clientesEncontrados = await response.json();

                resultadosBuscaClienteDiv.innerHTML = '';
                if (clientesEncontrados.length === 0) {
                    resultadosBuscaClienteDiv.innerHTML = '<p style="color: orange; font-weight: bold;">Nenhum cliente encontrado.</p>';
                } else {
                    clientesEncontrados.forEach(cliente => {
                        const p = document.createElement('p');
                        p.textContent = `${cliente.nome} (Cód: ${cliente.id}) ${cliente.documento ? ` - Doc: ${cliente.documento}` : ''}`;
                        p.classList.add('resultado-cliente-item');
                        p.style.cursor = 'pointer';
                        p.style.padding = '5px';
                        p.style.borderBottom = '1px solid #eee';
                        p.style.backgroundColor = '#f9f9f9';
                        p.addEventListener('mouseover', () => p.style.backgroundColor = '#e0e0e0');
                        p.addEventListener('mouseout', () => p.style.backgroundColor = '#f9f9f9');
                        
                        p.addEventListener('click', () => {
                            if (clienteInputPrincipal) clienteInputPrincipal.value = cliente.nome;
                            if (codClienteInputPrincipal) codClienteInputPrincipal.value = cliente.id;
                            if (obraInput) obraInput.value = '';
                            if (numPedidoInput) numPedidoInput.value = '';
                            if (recebeCaminhaoSelect) recebeCaminhaoSelect.value = 'Sim';
                            if (dataDesejadaInput) dataDesejadaInput.value = '';
                            
                            tabelaResultados.innerHTML = '';
                            Object.keys(resumoBitolasCalculo).forEach(key => delete resumoBitolasCalculo[key]);
                            Object.keys(resumoCustosCalculo).forEach(key => delete resumoCustosCalculo[key]);
                            linhasOrcamento.length = 0;
                            atualizarResumoBitolas();

                            resultadosBuscaClienteDiv.innerHTML = '';
                            buscarClienteInput.value = '';
                        });
                        resultadosBuscaClienteDiv.appendChild(p);
                    });
                }
            } catch (error) {
                console.error('Erro na busca de clientes:', error);
                resultadosBuscaClienteDiv.innerHTML = `<p style="color: red; font-weight: bold;">Erro na busca: ${error.message}</p>`;
            }
        });
    }

    // --- REFERÊNCIAS E LÓGICA DA MODAL DE VISUALIZAÇÃO DE ORÇAMENTOS ---
    const modalVisualizarOrcamentos = document.getElementById('modalVisualizarOrcamentos');
    const btnAbrirModalVisualizarOrcamentos = document.getElementById('btnAbrirModalVisualizarOrcamentos');
    const closeModalVisualizarOrcamentos = document.getElementById('closeModalVisualizarOrcamentos');
    const filtroOrcamentoInput = document.getElementById('filtroOrcamento');
    const btnFiltrarOrcamentos = document.getElementById('btnFiltrarOrcamentos');
    const listaOrcamentosDiv = document.getElementById('listaOrcamentos');
    const visualizarOrcamentoFeedback = document.getElementById('visualizarOrcamentoFeedback');

    // Função para carregar e exibir a lista de orçamentos
    async function carregarOrcamentos(filtro = '') {
        if (!listaOrcamentosDiv) return;
        listaOrcamentosDiv.innerHTML = '<p style="text-align: center; color: gray;">Carregando orçamentos...</p>';
        if(visualizarOrcamentoFeedback) visualizarOrcamentoFeedback.textContent = '';

        try {
            const queryParam = filtro ? `?q=${encodeURIComponent(filtro)}` : '';
            const urlBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000'
                : '';
            const response = await fetch(`${urlBase}/api/orcamentos${queryParam}`);
            if (!response.ok) {
                throw new Error('Erro ao carregar orçamentos.');
            }
            const orcamentos = await response.json();

            listaOrcamentosDiv.innerHTML = '';
            if (orcamentos.length === 0) {
                listaOrcamentosDiv.innerHTML = '<p style="text-align: center; color: orange; font-weight: bold;">Nenhum orçamento encontrado.</p>';
            } else {
                orcamentos.forEach(orcamento => {
                    const p = document.createElement('p');
                    // CORREÇÃO AQUI: Adicionando verificações de existência para clienteInfo e obraInfo
                    const clienteNome = orcamento.clienteInfo?.cliente || 'Cliente Desconhecido';
                    const obraNome = orcamento.obraInfo?.nome || 'Obra Desconhecida';
                    const numPedidoDisplay = orcamento.numPedido || orcamento.id || 'N/A';
                    const dataDisplay = orcamento.dataOrcamento || 'Data Desconhecida';

                    p.textContent = `Pedido Nº: ${numPedidoDisplay} - Cliente: ${clienteNome} - Obra: ${obraNome} - Data: ${dataDisplay}`;
                    p.classList.add('orcamento-item');
                    p.dataset.orcamentoId = orcamento.id;
                    p.style.cursor = 'pointer';
                    p.style.borderBottom = '1px solid #eee';
                    p.style.padding = '8px';
                    p.style.backgroundColor = '#fefefe';
                    p.addEventListener('mouseover', () => p.style.backgroundColor = '#e9ecef');
                    p.addEventListener('mouseout', () => p.style.backgroundColor = '#fefefe');

                    p.addEventListener('click', () => carregarOrcamentoNaTela(orcamento.id));
                    listaOrcamentosDiv.appendChild(p);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar orçamentos:', error);
            listaOrcamentosDiv.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar orçamentos: ${error.message}</p>`;
        }
    }

    // Função para carregar um orçamento específico na tela principal
    async function carregarOrcamentoNaTela(orcamentoId) {
        console.log(`Carregando orçamento ID: ${orcamentoId}`);
        if(visualizarOrcamentoFeedback) {
            visualizarOrcamentoFeedback.textContent = 'Carregando detalhes do orçamento...';
            visualizarOrcamentoFeedback.style.color = 'blue';
        }

        try {
            const urlBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000'
                : '';
            const response = await fetch(`${urlBase}/api/orcamentos/${orcamentoId}`);
            if (!response.ok) {
                throw new Error('Erro ao carregar detalhes do orçamento.');
            }
            const orcamentoDetalhes = await response.json();

            // Preenche os campos do formulário principal com verificações de segurança
            if (clienteInputPrincipal) clienteInputPrincipal.value = orcamentoDetalhes.clienteInfo?.cliente || '';
            if (codClienteInputPrincipal) codClienteInputPrincipal.value = orcamentoDetalhes.clienteInfo?.codCliente || '';
            if (obraInput) obraInput.value = orcamentoDetalhes.obraInfo?.nome || '';
            if (numPedidoInput) numPedidoInput.value = orcamentoDetalhes.obraInfo?.numPedido || orcamentoDetalhes.id || '';
            if (recebeCaminhaoSelect) recebeCaminhaoSelect.value = orcamentoDetalhes.obraInfo?.recebeCaminhao || 'Sim';
            if (dataDesejadaInput) dataDesejadaInput.value = orcamentoDetalhes.obraInfo?.dataDesejada || '';

            // Limpa e preenche a tabela de peças
            linhasOrcamento.length = 0;
            tabelaResultados.innerHTML = '';
            Object.keys(resumoBitolasCalculo).forEach(key => delete resumoBitolasCalculo[key]);
            Object.keys(resumoCustosCalculo).forEach(key => delete resumoCustosCalculo[key]);

            if (orcamentoDetalhes.itensPedido && orcamentoDetalhes.itensPedido.length > 0) {
                orcamentoDetalhes.itensPedido.forEach(item => {
                    const novaLinhaTabela = document.createElement('tr');
                    novaLinhaTabela.innerHTML = `
                        <td>${item.tipo || ''}</td>
                        <td>${item.bitola || ''} mm</td>
                        <td>${item.medidas?.a || ''}${item.medidas?.b ? '/' + item.medidas.b : ''}${item.medidas?.c ? '/' + item.medidas.c : ''}</td>
                        <td>${item.quantidade || ''}</td>
                        <td>${item.comprimentoCm || ''} cm</td>
                        <td>${item.pesoKg || ''} kg</td>
                        <td><button class="btn-excluir">Excluir</button></td>
                    `;
                    novaLinhaTabela.dataset.bitola = item.bitola || '';
                    novaLinhaTabela.dataset.peso = item.pesoKg || '0';
                    novaLinhaTabela.dataset.custo = item.custo || '0';

                    novaLinhaTabela.querySelector(".btn-excluir").addEventListener("click", function () {
                        const bitolaExcluir = novaLinhaTabela.dataset.bitola;
                        const pesoExcluir = parseFloat(novaLinhaTabela.dataset.peso);
                        const custoExcluir = parseFloat(novaLinhaTabela.dataset.custo);

                        if (resumoBitolasCalculo[bitolaExcluir]) { resumoBitolasCalculo[bitolaExcluir] -= pesoExcluir; if (resumoBitolasCalculo[bitolaExcluir] < 0.001) { delete resumoBitolasCalculo[bitolaExcluir]; }}
                        if (resumoCustosCalculo[bitolaExcluir]) { resumoCustosCalculo[bitolaExcluir] -= custoExcluir; if (resumoCustosCalculo[bitolaExcluir] < 0.001) { delete resumoCustosCalculo[bitolaExcluir]; }}

                        const index = linhasOrcamento.findIndex(li =>
                            li.tipo === item.tipo && li.bitola === item.bitola &&
                            li.comprimentoCm === item.comprimentoCm && li.quantidade === item.quantidade
                        );
                        if (index > -1) { linhasOrcamento.splice(index, 1); }

                        novaLinhaTabela.remove();
                        atualizarResumoBitolas();
                    });

                    novaLinhaTabela.orcamentoData = item;
                    linhasOrcamento.push(item);
                    tabelaResultados.appendChild(novaLinhaTabela);

                    resumoBitolasCalculo[item.bitola] = (resumoBitolasCalculo[item.bitola] || 0) + parseFloat(item.pesoKg || 0);
                    resumoCustosCalculo[item.bitola] = (resumoCustosCalculo[item.bitola] || 0) + parseFloat(item.custo || 0);
                });
            }
            atualizarResumoBitolas();

            if (modalVisualizarOrcamentos) modalVisualizarOrcamentos.style.display = 'none';
            if(visualizarOrcamentoFeedback) {
                visualizarOrcamentoFeedback.textContent = 'Orçamento carregado com sucesso!';
                visualizarOrcamentoFeedback.style.color = 'green';
                setTimeout(() => visualizarOrcamentoFeedback.textContent = '', 2000);
            }
        } catch (error) {
            console.error('Erro ao carregar orçamento na tela:', error);
            if(visualizarOrcamentoFeedback) {
                visualizarOrcamentoFeedback.textContent = `Erro ao carregar orçamento: ${error.message}`;
                visualizarOrcamentoFeedback.style.color = 'red';
            }
        }
    }

    // Event listener para abrir a modal de visualização de orçamentos
    if (btnAbrirModalVisualizarOrcamentos && modalVisualizarOrcamentos) {
        btnAbrirModalVisualizarOrcamentos.addEventListener('click', function() {
            modalVisualizarOrcamentos.style.display = 'flex';
            carregarOrcamentos();
        });
    }

    // Event listener para fechar a modal de visualização pelo botão 'x'
    if (closeModalVisualizarOrcamentos && modalVisualizarOrcamentos && filtroOrcamentoInput && listaOrcamentosDiv && visualizarOrcamentoFeedback) {
        closeModalVisualizarOrcamentos.addEventListener('click', function() {
            modalVisualizarOrcamentos.style.display = 'none';
            filtroOrcamentoInput.value = '';
            listaOrcamentosDiv.innerHTML = '';
            visualizarOrcamentoFeedback.textContent = '';
        });
    }

    // Event listener para fechar a modal de visualização clicando fora dela
    if (modalVisualizarOrcamentos && filtroOrcamentoInput && listaOrcamentosDiv && visualizarOrcamentoFeedback) {
        window.addEventListener('click', function(event) {
            if (event.target === modalVisualizarOrcamentos) {
                modalVisualizarOrcamentos.style.display = 'none';
                filtroOrcamentoInput.value = '';
                listaOrcamentosDiv.innerHTML = '';
                visualizarOrcamentoFeedback.textContent = '';
            }
        });
    }

    // Event listener para o botão de filtrar orçamentos
    if (btnFiltrarOrcamentos && filtroOrcamentoInput) {
        btnFiltrarOrcamentos.addEventListener('click', () => carregarOrcamentos(filtroOrcamentoInput.value));
    }


    // --- LÓGICA DE CÁLCULO DE PEÇAS E RESUMO DO ORÇAMENTO (EXISTENTE) ---

    const pesosPorMetro = {
        "4.2": 0.109, "5.0": 0.154, "6.3": 0.249, "8.0": 0.395, "10.0": 0.617,
        "12.5": 0.962, "16.0": 1.578, "20.0": 2.466, "25.0": 3.853
    };

    const precosPorKg = {
        "4.2": 8.50, "5.0": 8.20, "6.3": 7.90, "8.0": 7.80, "10.0": 7.70,
        "12.5": 7.60, "16.0": 7.50, "20.0": 7.40, "25.0": 7.30
    };

    if (formPeca && tabelaResultados) {
        formPeca.addEventListener('submit', function (event) {
            event.preventDefault();

            const tipo = document.getElementById('tipo')?.value;
            const bitola = document.getElementById('bitola')?.value;
            const a = parseFloat(document.getElementById('a')?.value) || 0;
            const b = parseFloat(document.getElementById('b')?.value) || 0;
            const c = parseFloat(document.getElementById('c')?.value) || 0;
            const quantidade = parseInt(document.getElementById('quantidade')?.value) || 0;

            if (!tipo || !bitola || isNaN(a) || isNaN(quantidade) || quantidade <= 0) {
                alert('Por favor, preencha Tipo, Bitola, Medida "a" e Quantidade com valores válidos.');
                return;
            }

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

            const novaLinhaTabela = document.createElement('tr');
            novaLinhaTabela.innerHTML = `
                <td>${tipo}</td>
                <td>${bitola} mm</td>
                <td>${a}${b ? '/' + b : ''}${c ? '/' + c : ''}</td>
                <td>${quantidade}</td>
                <td>${comprimentoCm.toFixed(2)} cm</td>
                <td>${pesoTotalPecas.toFixed(3)} kg</td>
                <td><button class="btn-excluir">Excluir</button></td>
            `;

            novaLinhaTabela.dataset.bitola = bitola;
            novaLinhaTabela.dataset.peso = pesoTotalPecas;
            novaLinhaTabela.dataset.custo = custoTotalPecas;

            novaLinhaTabela.querySelector(".btn-excluir").addEventListener("click", function () {
                const bitolaExcluir = novaLinhaTabela.dataset.bitola;
                const pesoExcluir = parseFloat(novaLinhaTabela.dataset.peso);
                const custoExcluir = parseFloat(novaLinhaTabela.dataset.custo);

                if (resumoBitolasCalculo[bitolaExcluir]) { resumoBitolasCalculo[bitolaExcluir] -= pesoExcluir; if (resumoBitolasCalculo[bitolaExcluir] < 0.001) { delete resumoBitolasCalculo[bitolaExcluir]; }}
                if (resumoCustosCalculo[bitolaExcluir]) { resumoCustosCalculo[bitolaExcluir] -= custoExcluir; if (resumoCustosCalculo[bitolaExcluir] < 0.001) { delete resumoCustosCalculo[bitolaExcluir]; }}

                const index = linhasOrcamento.findIndex(item =>
                    item.tipo === novaLinhaTabela.orcamentoData.tipo &&
                    item.bitola === novaLinhaTabela.orcamentoData.bitola &&
                    item.comprimentoCm === item.comprimentoCm && item.quantidade === item.quantidade
                );
                if (index > -1) { linhasOrcamento.splice(index, 1); }

                novaLinhaTabela.remove();
                atualizarResumoBitolas();
            });

            const dadosPeca = {
                tipo, bitola, medidas: { a, b, c }, quantidade,
                comprimentoCm: comprimentoCm.toFixed(2),
                pesoKg: pesoTotalPecas.toFixed(3),
                custo: custoTotalPecas.toFixed(2)
            };

            novaLinhaTabela.orcamentoData = dadosPeca;
            linhasOrcamento.push(dadosPeca);

            tabelaResultados.appendChild(novaLinhaTabela);

            resumoBitolasCalculo[bitola] = (resumoBitolasCalculo[bitola] || 0) + pesoTotalPecas;
            resumoCustosCalculo[bitola] = (resumoCustosCalculo[bitola] || 0) + custoTotalPecas;

            atualizarResumoBitolas();
            formPeca.reset();
            document.getElementById('b').value = '';
            document.getElementById('c').value = '';
        });
    }

    function atualizarResumoBitolas() {
        if (!resumoBitolasDisplay || !pesoTotalGeralElement || !custoTotalGeralElement) return;

        resumoBitolasDisplay.innerHTML = "";
        let pesoTotalGeral = 0;
        let custoTotalGeral = 0;

        const bitolas = Object.keys(resumoBitolasCalculo).sort((a, b) => parseFloat(a) - parseFloat(b));
        for (const bitola of bitolas) {
            const peso = resumoBitolasCalculo[bitola];
            const custo = resumoCustosCalculo[bitola] || 0;

            pesoTotalGeral += peso;
            custoTotalGeral += custo;

            const linha = document.createElement("tr");
            linha.innerHTML = `
                <td>${bitola} mm</td>
                <td>${peso.toFixed(3)} kg</td>
                <td>R$ ${custo.toFixed(2)}</td>
            `;
            resumoBitolasDisplay.appendChild(linha);
        }

        pesoTotalGeralElement.textContent = pesoTotalGeral.toFixed(3) + " kg";
        custoTotalGeralElement.textContent = "R$ " + custoTotalGeral.toFixed(2);
    }

    function montarOrcamento() {
        const clienteNome = clienteInputPrincipal?.value || '';
        const codCliente = codClienteInputPrincipal?.value || '';
        const obra = obraInput?.value || '';
        const numPedido = numPedidoInput?.value || '';
        const recebeCaminhao = recebeCaminhaoSelect?.value || '';
        const dataDesejada = dataDesejadaInput?.value || '';

        const pesoTotalGeralDisplay = pesoTotalGeralElement?.textContent || '0.00 kg';
        const custoTotalGeralDisplay = custoTotalGeralElement?.textContent || 'R$ 0.00';

        return {
            clienteInfo: { cliente: clienteNome, codCliente: codCliente },
            obraInfo: { nome: obra, numPedido: numPedido, recebeCaminhao: recebeCaminhao, dataDesejada: dataDesejada },
            itensPedido: linhasOrcamento.map(item => ({ ...item, medidas: { ...item.medidas } })),
            resumoBitolas: { ...resumoBitolasCalculo },
            resumoCustos: { ...resumoCustosCalculo },
            resumoGeral: {
                pesoTotalGeral: pesoTotalGeralDisplay,
                custoTotalGeral: custoTotalGeralDisplay,
                custoTotalGeralNumerico: parseFloat(custoTotalGeralDisplay.replace('R$ ', '').replace(',', '.')) || 0
            },
            dataOrcamento: new Date().toLocaleDateString('pt-BR')
        };
    }

    // --- EVENT LISTENERS FOR SAVING AND GENERATING PDF ---

    if (btnSalvarOrcamento) {
        btnSalvarOrcamento.addEventListener("click", async () => {
            if (!clienteInputPrincipal.value || !codClienteInputPrincipal.value) {
                alert('Por favor, cadastre ou selecione um cliente antes de salvar o orçamento.');
                return;
            }
            if (linhasOrcamento.length === 0) {
                alert('Por favor, adicione pelo menos uma peça ao orçamento.');
                return;
            }

            const orcamentoParaSalvar = montarOrcamento();

            const urlBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000'
                : '';

            try {
                const response = await fetch(`${urlBase}/api/orcamentos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orcamentoParaSalvar)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao salvar orçamento.' }));
                    throw new Error(errorData.message || "Erro ao salvar orçamento.");
                }

                const resultado = await response.json();
                alert(`Orçamento salvo com sucesso! Pedido Nº: ${resultado.numPedido || resultado.id}`);

                if (numPedidoInput) {
                    numPedidoInput.value = resultado.numPedido || resultado.id;
                }

                tabelaResultados.innerHTML = '';
                Object.keys(resumoBitolasCalculo).forEach(key => delete resumoBitolasCalculo[key]);
                Object.keys(resumoCustosCalculo).forEach(key => delete resumoCustosCalculo[key]);
                linhasOrcamento.length = 0;
                atualizarResumoBitolas();
            } catch (error) {
                console.error("Erro ao salvar orçamento:", error);
                alert("Erro ao salvar orçamento. Detalhes: " + error.message);
            }
        });
    }

    if (btnGerarPdf) {
        btnGerarPdf.addEventListener("click", () => {
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                console.error("jsPDF não está carregado.");
                alert("Erro: A biblioteca para gerar PDF não foi carregada corretamente.");
                return;
            }

            if (!clienteInputPrincipal.value || !codClienteInputPrincipal.value) {
                alert('Por favor, cadastre ou selecione um cliente antes de gerar o PDF.');
                return;
            }
            if (linhasOrcamento.length === 0) {
                alert('Por favor, adicione pelo menos uma peça ao orçamento.');
                return;
            }

            const orcamento = montarOrcamento();
            const doc = new jsPDF();
            let y = 10;
            const lineHeight = 7;

            doc.setFontSize(16);
            doc.text("Orçamento de Corte e Dobra de Vergalhões", 10, y);
            y += lineHeight * 2;

            doc.setFontSize(12);
            doc.text(`Data do Orçamento: ${orcamento.dataOrcamento}`, 10, y);
            y += lineHeight;

            doc.text(`Cliente: ${orcamento.clienteInfo?.cliente || ''} (Cód: ${orcamento.clienteInfo?.codCliente || ''})`, 10, y);
            y += lineHeight;

            doc.text(`Obra: ${orcamento.obraInfo?.nome || ''}`, 10, y);
            y += lineHeight;

            doc.text(`Número do Pedido: ${orcamento.obraInfo?.numPedido || 'N/A'}`, 10, y);
            y += lineHeight;

            doc.text(`Recebe Caminhão: ${orcamento.obraInfo?.recebeCaminhao || ''}`, 10, y);
            y += lineHeight;

            doc.text(`Data Desejada: ${orcamento.obraInfo?.dataDesejada || 'N/A'}`, 10, y);
            y += lineHeight * 2;

            doc.text("Detalhes das Peças:", 10, y);
            y += lineHeight;

            doc.setFontSize(10);
            doc.text("Tipo", 10, y);
            doc.text("Bitola", 30, y);
            doc.text("Medidas", 50, y);
            doc.text("Qtd", 80, y);
            doc.text("Compr.", 100, y);
            doc.text("Peso (kg)", 130, y);
            doc.text("Custo (R$)", 160, y);
            y += lineHeight;

            doc.setFontSize(9);
            orcamento.itensPedido.forEach(item => {
                const medidasStr = `${item.medidas?.a || ''}${item.medidas?.b ? '/' + item.medidas.b : ''}${item.medidas?.c ? '/' + item.medidas.c : ''}`;
                doc.text(item.tipo || '', 10, y);
                doc.text(item.bitola?.toString() || '', 30, y);
                doc.text(medidasStr, 50, y);
                doc.text(item.quantidade?.toString() || '', 80, y);
                doc.text(item.comprimentoCm || '', 100, y);
                doc.text(item.pesoKg || '', 130, y);
                doc.text(item.custo || '', 160, y);
                y += lineHeight;
                if (y > 280) { doc.addPage(); y = 10; }
            });

            y += lineHeight;
            doc.setFontSize(12);
            doc.text("Resumo por Bitola:", 10, y);
            y += lineHeight;

            // CORREÇÃO AQUI: Iterar sobre orcamento.resumoBitolas (não resumoBitolasCalculo)
            for (const bitola in orcamento.resumoBitolas) {
                const resumo = orcamento.resumoBitolas[bitola];
                doc.text(`Bitola ${bitola}mm: Peso ${resumo.peso?.toFixed(3) || '0.000'} kg - Custo R$ ${resumo.custo?.toFixed(2) || '0.00'}`, 10, y);
                y += lineHeight;
                if (y > 280) { doc.addPage(); y = 10; }
            }

            y += lineHeight;
            doc.setFontSize(14);
            doc.text(`Custo Total Geral: ${orcamento.resumoGeral?.custoTotalGeral || 'R$ 0.00'}`, 10, y);
            y += lineHeight;

            doc.save(`Orcamento_${orcamento.clienteInfo?.cliente?.replace(/[^a-zA-Z0-9]/g, '_') || "cliente"}_${orcamento.obraInfo?.numPedido || 'sem_pedido'}.pdf`);
        });
    }

    // --- INITIALIZATION ON PAGE LOAD ---
    toggleCpfCnpjFields();
    atualizarResumoBitolas();
});
