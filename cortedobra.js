document.addEventListener('DOMContentLoaded', function () {
    // --- REFERÊNCIAS PARA ELEMENTOS DO FORMULÁRIO PRINCIPAL ---
    const formPeca = document.getElementById('form-peca');
    const tabelaResultados = document.querySelector('#tabela-resultados tbody');
    const resumoBitolasDisplay = document.getElementById("tabela-resumo-bitolas");
    const pesoTotalGeralElement = document.getElementById("peso-total-geral");
    const custoTotalGeralElement = document.getElementById("custo-total-geral");
    const btnSalvarOrcamento = document.getElementById("btnSalvarOrcamento");
    const btnGerarPdf = document.getElementById("btnGerarPdf");
    const btnNovoOrcamento = document.getElementById("btnNovoOrcamento");

    const clienteInputPrincipal = document.getElementById('cliente');
    const codClienteInputPrincipal = document.getElementById('codCliente');
    const obraInput = document.getElementById('obra');
    const numPedidoInput = document.getElementById('numPedido');
    const orcamentoIdInput = document.getElementById('orcamentoId'); // Campo oculto para ID do orçamento (para edição)
    const recebeCaminhaoSelect = document.getElementById('recebeCaminhao');
    const dataDesejadaInput = document.getElementById('dataDesejada');

    // Campos de medida da peça
    const tipoPecaSelect = document.getElementById('tipo');
    const medidaAInput = document.getElementById('a');
    const medidaBInput = document.getElementById('b');
    const medidaCInput = document.getElementById('c');
    const bitolaSelect = document.getElementById('bitola'); // Referência para o select da bitola

    // Referência para o botão "Cadastrar Novo Cliente" movido
    const btnAbrirModalCadastroCliente = document.getElementById('btnAbrirModalCadastroCliente');


    if (clienteInputPrincipal) clienteInputPrincipal.readOnly = true;
    if (codClienteInputPrincipal) codClienteInputPrincipal.readOnly = true;
    if (numPedidoInput) numPedidoInput.readOnly = true;

    // Variáveis para armazenar dados do orçamento e cálculos
    const resumoBitolasCalculo = {};
    const resumoCustosCalculo = {};
    const linhasOrcamento = []; // Armazena os dados das peças adicionadas

    // --- REFERÊNCIAS E LÓGICA DA MODAL DE CADASTRO DE CLIENTE ---
    const modalCadastroCliente = document.getElementById('modalCadastroCliente');
    const closeModalCadastroCliente = document.getElementById('closeModalCadastroCliente');
    const formCadastroCliente = document.getElementById('formCadastroCliente');
    const cadastroClienteFeedback = document.getElementById('cadastroClienteFeedback');

    const radioJuridica = document.getElementById('radioJuridica');
    const radioFisica = document.getElementById('radioFisica');
    const cnpjGroup = document.getElementById('cnpjGroup');
    const cpfGroup = document.getElementById('cpfGroup');
    const cnpjClienteInput = document.getElementById('cnpjCliente');
    const cpfClienteInput = document.getElementById('cpfCliente');

    // Campo de endereço único (conforme o HTML atual)
    const enderecoClienteInput = document.getElementById('enderecoCliente');

    const telefoneClienteInput = document.getElementById('telefoneCliente');
    const emailClienteInput = document.getElementById('emailCliente');


    /**
     * Alterna a visibilidade dos campos CNPJ e CPF na modal de cadastro de cliente.
     */
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

    // Event listeners para abrir/fechar a modal de cadastro de cliente
    if (btnAbrirModalCadastroCliente && modalCadastroCliente) {
        btnAbrirModalCadastroCliente.addEventListener('click', function() {
            modalCadastroCliente.style.display = 'flex';
            formCadastroCliente.reset(); // Limpa o formulário ao abrir
            cadastroClienteFeedback.textContent = ''; // Limpa feedback
            if (radioJuridica) radioJuridica.checked = true; // Garante Jurídica selecionada
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

    // Event listener para os botões de rádio de tipo de pessoa
    document.querySelectorAll('input[name="tipoPessoa"]').forEach(radio => {
        radio.addEventListener('change', toggleCpfCnpjFields);
    });

    /**
     * Envia os dados do novo cliente para o backend.
     */
    if (formCadastroCliente && cadastroClienteFeedback && clienteInputPrincipal && codClienteInputPrincipal) {
        formCadastroCliente.addEventListener('submit', async function(event) {
            event.preventDefault();

            cadastroClienteFeedback.textContent = 'Salvando cliente...';
            cadastroClienteFeedback.style.color = 'blue';

            const nomeCliente = document.getElementById('nomeCliente')?.value;
            const tipoPessoa = document.querySelector('input[name="tipoPessoa"]:checked')?.value;
            const cnpjCliente = document.getElementById('cnpjCliente')?.value;
            const cpfCliente = document.getElementById('cpfCliente')?.value;
            
            // Coleta o valor do campo de endereço único
            const endereco = enderecoClienteInput?.value; // Chave 'endereco' para o backend

            const telefoneCliente = telefoneClienteInput?.value;
            const emailCliente = emailClienteInput?.value;

            const clientData = {
                nomeCliente,
                tipoPessoa,
                cnpjCliente: tipoPessoa === 'juridica' ? cnpjCliente : null,
                cpfCliente: tipoPessoa === 'fisica' ? cpfCliente : null,
                endereco: endereco, // A chave agora é 'endereco'
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

    /**
     * Busca clientes no backend e exibe os resultados.
     */
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
                            // Preenche os campos do formulário principal com os dados do cliente selecionado
                            if (clienteInputPrincipal) clienteInputPrincipal.value = cliente.nome;
                            if (codClienteInputPrincipal) codClienteInputPrincipal.value = cliente.id;
                            // Limpa os campos de obra e pedido para um novo orçamento
                            if (obraInput) obraInput.value = '';
                            if (numPedidoInput) numPedidoInput.value = '';
                            if (orcamentoIdInput) orcamentoIdInput.value = ''; // Limpa o ID do orçamento atual
                            if (recebeCaminhaoSelect) recebeCaminhaoSelect.value = 'Sim';
                            if (dataDesejadaInput) dataDesejadaInput.value = '';
                            
                            // Limpa a tabela de peças e resumo para um novo orçamento
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

    /**
     * Carrega e exibe a lista de orçamentos na modal de visualização.
     * @param {string} filtro - Termo opcional para filtrar orçamentos.
     */
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
                    // Crie uma div para cada item do orçamento para melhor controle de layout
                    const divItem = document.createElement('div');
                    divItem.classList.add('orcamento-item'); // Classe para estilização
                    divItem.dataset.orcamentoId = orcamento.id; // Armazena o ID do orçamento

                    const clienteNome = orcamento.clienteInfo?.cliente || 'Cliente Desconhecido';
                    const obraNome = orcamento.obraInfo?.nome || 'Obra Desconhecida';
                    const numPedidoDisplay = orcamento.numPedido || orcamento.id || 'N/A';
                    const dataDisplay = orcamento.dataOrcamento || 'Data Desconhecida';

                    // Crie um span para o texto clicável
                    const spanText = document.createElement('span');
                    spanText.classList.add('orcamento-text-clickable');
                    spanText.textContent = `Pedido Nº: ${numPedidoDisplay} - Cliente: ${clienteNome} - Obra: ${obraNome} - Data: ${dataDisplay}`;
                    
                    // Crie o botão de excluir
                    const btnExcluir = document.createElement('button');
                    btnExcluir.classList.add('btn-excluir-orcamento');
                    btnExcluir.dataset.orcamentoId = orcamento.id;
                    btnExcluir.textContent = 'Excluir';

                    // Anexe os event listeners
                    spanText.addEventListener('click', () => carregarOrcamentoNaTela(orcamento.id));
                    btnExcluir.addEventListener('click', (e) => {
                        e.stopPropagation(); // Impede que o clique no botão ative o clique no item pai
                        const idParaExcluir = e.target.dataset.orcamentoId;
                        if (confirm(`Tem certeza que deseja excluir o orçamento Pedido Nº: ${numPedidoDisplay}?`)) {
                            excluirOrcamento(idParaExcluir);
                        }
                    });

                    // Adicione o texto e o botão à div do item
                    divItem.appendChild(spanText);
                    divItem.appendChild(btnExcluir);
                    
                    // Adicione a div do item à lista de orçamentos
                    listaOrcamentosDiv.appendChild(divItem);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar orçamentos:', error);
            listaOrcamentosDiv.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar orçamentos: ${error.message}</p>`;
        }
    }

    /**
     * Carrega um orçamento específico na tela principal para visualização/edição.
     * @param {string} orcamentoId - O ID numérico do orçamento a ser carregado.
     */
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
            if (orcamentoIdInput) orcamentoIdInput.value = orcamentoDetalhes.id; // Define o ID do orçamento para edição
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
                        <td data-label="Tipo">${item.tipo || ''}</td>
                        <td data-label="Bitola">${item.bitola || ''} mm</td>
                        <td data-label="Medidas">${item.medidas?.a || ''}${item.medidas?.b ? '/' + item.medidas.b : ''}${item.medidas?.c ? '/' + item.medidas.c : ''}</td>
                        <td data-label="Qtd">${item.quantidade || ''}</td>
                        <td data-label="Comprimento">${item.comprimentoCm || ''} cm</td>
                        <td data-label="Peso">${item.pesoKg || ''} kg</td>
                        <td data-label="Ações"><button class="btn-excluir">Excluir</button></td>
                    `;
                    novaLinhaTabela.dataset.bitola = item.bitola || '';
                    novaLinhaTabela.dataset.peso = item.pesoKg || '0';
                    novaLinhaTabela.dataset.custo = item.custo || '0';
                    // Armazena os dados originais da peça para facilitar a remoção do array
                    novaLinhaTabela.orcamentoData = item;

                    novaLinhaTabela.querySelector(".btn-excluir").addEventListener("click", function () {
                        const bitolaExcluir = novaLinhaTabela.dataset.bitola;
                        const pesoExcluir = parseFloat(novaLinhaTabela.dataset.peso);
                        const custoExcluir = parseFloat(novaLinhaTabela.dataset.custo);

                        if (resumoBitolasCalculo[bitolaExcluir]) { resumoBitolasCalculo[bitolaExcluir] -= pesoExcluir; if (resumoBitolasCalculo[bitolaExcluir] < 0.001) { delete resumoBitolasCalculo[bitolaExcluir]; } }
                        if (resumoCustosCalculo[bitolaExcluir]) { resumoCustosCalculo[bitolaExcluir] -= custoExcluir; if (resumoCustosCalculo[bitolaExcluir] < 0.001) { delete resumoCustosCalculo[bitolaExcluir]; } }

                        // Encontra o índice da peça no array linhasOrcamento para remover
                        const index = linhasOrcamento.findIndex(li =>
                            li.tipo === novaLinhaTabela.orcamentoData.tipo &&
                            li.bitola === novaLinhaTabela.orcamentoData.bitola &&
                            li.comprimentoCm === novaLinhaTabela.orcamentoData.comprimentoCm &&
                            li.quantidade === novaLinhaTabela.orcamentoData.quantidade
                        );
                        if (index > -1) { linhasOrcamento.splice(index, 1); }

                        novaLinhaTabela.remove();
                        atualizarResumoBitolas();
                    });

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

    /**
     * Envia uma requisição para excluir um orçamento.
     * @param {string} id - O ID do orçamento a ser excluído.
     */
    async function excluirOrcamento(id) {
        const urlBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000'
            : '';
        try {
            const response = await fetch(`${urlBase}/api/orcamentos/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao excluir orçamento.' }));
                throw new Error(errorData.message || "Erro ao excluir orçamento.");
            }

            alert('Orçamento excluído com sucesso!');
            carregarOrcamentos(); // Recarrega a lista de orçamentos após a exclusão
            iniciarNovoOrcamento(); // Limpa o formulário principal caso o orçamento excluído estivesse carregado
        } catch (error) {
                console.error('Erro ao excluir orçamento:', error);
                // Usar uma modal customizada em vez de alert
                const feedbackDiv = document.getElementById('visualizarOrcamentoFeedback');
                if (feedbackDiv) {
                    feedbackDiv.textContent = `Erro ao excluir orçamento: ${error.message}`;
                    feedbackDiv.style.color = 'red';
                    setTimeout(() => feedbackDiv.textContent = '', 5000);
                }
            }
        }


    // Event listeners para abrir/fechar a modal de visualização de orçamentos
    if (btnAbrirModalVisualizarOrcamentos && modalVisualizarOrcamentos) {
        btnAbrirModalVisualizarOrcamentos.addEventListener('click', function() {
            modalVisualizarOrcamentos.style.display = 'flex';
            carregarOrcamentos();
        });
    }

    if (closeModalVisualizarOrcamentos && modalVisualizarOrcamentos && filtroOrcamentoInput && listaOrcamentosDiv && visualizarOrcamentoFeedback) {
        closeModalVisualizarOrcamentos.addEventListener('click', function() {
            modalVisualizarOrcamentos.style.display = 'none';
            filtroOrcamentoInput.value = '';
            listaOrcamentosDiv.innerHTML = '';
            visualizarOrcamentoFeedback.textContent = '';
        });
    }

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

    /**
     * Limpa todos os campos do formulário principal e o resumo para iniciar um novo orçamento.
     */
    function iniciarNovoOrcamento() {
        // Limpar campos de Dados do Cliente
        if (clienteInputPrincipal) clienteInputPrincipal.value = '';
        if (codClienteInputPrincipal) codClienteInputPrincipal.value = '';
        if (obraInput) obraInput.value = '';
        if (numPedidoInput) numPedidoInput.value = '';
        if (orcamentoIdInput) orcamentoIdInput.value = ''; // Limpa o ID do orçamento atual
        if (recebeCaminhaoSelect) recebeCaminhaoSelect.value = 'Sim'; // Valor padrão
        if (dataDesejadaInput) dataDesejadaInput.value = '';
        if (buscarClienteInput) buscarClienteInput.value = ''; // Limpa o campo de busca de cliente
        if (resultadosBuscaClienteDiv) resultadosBuscaClienteDiv.innerHTML = ''; // Limpa resultados da busca

        // Limpar tabela de peças
        tabelaResultados.innerHTML = '';
        linhasOrcamento.length = 0; // Zera o array de peças

        // Limpar cálculos de resumo
        Object.keys(resumoBitolasCalculo).forEach(key => delete resumoBitolasCalculo[key]);
        Object.keys(resumoCustosCalculo).forEach(key => delete resumoCustosCalculo[key]);
        atualizarResumoBitolas(); // Atualiza os totais para zero

        // Limpar formulário de Adicionar Peça
        formPeca.reset();
        // Garante que os campos de medida estejam corretos para o tipo padrão (Vara em U)
        if (tipoPecaSelect) tipoPecaSelect.value = 'varaU';
        validarCamposMedida(); // Chama a validação para resetar os campos b e c
        
        // Opcional: Focar no primeiro campo para nova entrada
        if (clienteInputPrincipal) clienteInputPrincipal.focus();
    }

    // --- EVENT LISTENER para o botão "Novo Orçamento" ---
    if (btnNovoOrcamento) {
        btnNovoOrcamento.addEventListener('click', iniciarNovoOrcamento);
    }


    // --- LÓGICA DE CÁLCULO DE PEÇAS E RESUMO DO ORÇAMENTO ---

    const pesosPorMetro = {
        "4.2": 0.109, "5.0": 0.154, "6.3": 0.249, "8.0": 0.395, "10.0": 0.617,
        "12.5": 0.962, "16.0": 1.578, "20.0": 2.466, "25.0": 3.853
    };

    const precosPorKg = {
        "4.2": 8.50, "5.0": 8.20, "6.3": 7.90, "8.0": 7.80, "10.0": 7.70,
        "12.5": 7.60, "16.0": 7.50, "20.0": 7.40, "25.0": 7.30
    };

    /**
     * Valida e ajusta a visibilidade/obrigatoriedade dos campos de medida (b, c)
     * com base no tipo de peça selecionado.
     */
    function validarCamposMedida() {
        const tipoSelecionado = tipoPecaSelect.value;

        // Resetar todos os campos e estados primeiro
        medidaBInput.value = '';
        medidaCInput.value = '';
        medidaBInput.disabled = false;
        medidaCInput.disabled = false;
        medidaBInput.required = false;
        medidaCInput.required = false;

        switch (tipoSelecionado) {
            case 'varaReta':
                medidaBInput.disabled = true;
                medidaCInput.disabled = true;
                break;
            case 'varaL':
            case 'estribo': // Estribo também usa A e B
                medidaCInput.disabled = true;
                medidaBInput.required = true;
                break;
            case 'varaU':
                medidaBInput.required = true;
                medidaCInput.required = true;
                break;
            default:
                // Caso padrão, todos habilitados ou desabilitados conforme sua lógica inicial
                break;
        }
    }

    // Event listener para o tipo de peça mudar
    if (tipoPecaSelect) {
        tipoPecaSelect.addEventListener('change', validarCamposMedida);
    }

    if (formPeca && tabelaResultados) {
        formPeca.addEventListener('submit', function (event) {
            event.preventDefault();

            const tipo = tipoPecaSelect.value;
            const bitola = bitolaSelect.value; // Usar a referência direta
            const a = parseFloat(medidaAInput.value) || 0;
            const b = parseFloat(medidaBInput.value) || 0;
            const c = parseFloat(medidaCInput.value) || 0;
            const quantidade = parseInt(document.getElementById('quantidade')?.value) || 0;

            // Validação adicional baseada no tipo de peça
            if (tipo === 'varaReta' && (medidaBInput.value !== '' || medidaCInput.value !== '')) {
                alert('Para "Vara Reta", apenas a medida "a" é necessária. Por favor, limpe os campos "b" e "c".');
                return;
            }
            if ((tipo === 'varaL' || tipo === 'estribo') && medidaCInput.value !== '') {
                alert(`Para "${tipo === 'varaL' ? 'Vara em L' : 'Estribo'}", apenas as medidas "a" e "b" são necessárias. Por favor, limpe o campo "c".`);
                return;
            }
            if (tipo === 'varaU' && (isNaN(b) || isNaN(c))) {
                alert('Para "Vara em U", as medidas "a", "b" e "c" são necessárias.');
                return;
            }
            if ((tipo === 'varaL' || tipo === 'estribo') && isNaN(b)) {
                alert(`Para "${tipo === 'varaL' ? 'Vara em L' : 'Estribo'}", as medidas "a" e "b" são necessárias.`);
                return;
            }


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
            const pesoTotalPecas = pesoPorMetro * comprimentoM * quantidade;
            const precoPorKgDaBitola = precosPorKg[bitola] || 0;
            const custoTotalPecas = pesoTotalPecas * precoPorKgDaBitola;

            const novaLinhaTabela = document.createElement('tr');
            novaLinhaTabela.innerHTML = `
                <td data-label="Tipo">${tipo}</td>
                <td data-label="Bitola">${bitola} mm</td>
                <td data-label="Medidas">${a}${b ? '/' + b : ''}${c ? '/' + c : ''}</td>
                <td data-label="Qtd">${quantidade}</td>
                <td data-label="Comprimento">${comprimentoCm.toFixed(2)} cm</td>
                <td data-label="Peso">${pesoTotalPecas.toFixed(3)} kg</td>
                <td data-label="Ações"><button class="btn-excluir">Excluir</button></td>
            `;

            novaLinhaTabela.dataset.bitola = bitola;
            novaLinhaTabela.dataset.peso = pesoTotalPecas;
            novaLinhaTabela.dataset.custo = custoTotalPecas;
            // Armazena os dados originais da peça para facilitar a remoção do array
            const dadosPeca = {
                tipo, bitola, medidas: { a, b, c }, quantidade,
                comprimentoCm: comprimentoCm.toFixed(2),
                pesoKg: pesoTotalPecas.toFixed(3),
                custo: custoTotalPecas.toFixed(2)
            };
            novaLinhaTabela.orcamentoData = dadosPeca; // Associa os dados à linha HTML
            linhasOrcamento.push(dadosPeca); // Adiciona ao array global de peças

            novaLinhaTabela.querySelector(".btn-excluir").addEventListener("click", function () {
                const bitolaExcluir = novaLinhaTabela.dataset.bitola;
                const pesoExcluir = parseFloat(novaLinhaTabela.dataset.peso);
                const custoExcluir = parseFloat(novaLinhaTabela.dataset.custo);

                if (resumoBitolasCalculo[bitolaExcluir]) { resumoBitolasCalculo[bitolaExcluir] -= pesoExcluir; if (resumoBitolasCalculo[bitolaExcluir] < 0.001) { delete resumoBitolasCalculo[bitolaExcluir]; } }
                if (resumoCustosCalculo[bitolaExcluir]) { resumoCustosCalculo[bitolaExcluir] -= custoExcluir; if (resumoCustosCalculo[bitolaExcluir] < 0.001) { delete resumoCustosCalculo[bitolaExcluir]; } }

                const index = linhasOrcamento.findIndex(item =>
                    item.tipo === novaLinhaTabela.orcamentoData.tipo &&
                    item.bitola === novaLinhaTabela.orcamentoData.bitola &&
                    item.comprimentoCm === novaLinhaTabela.orcamentoData.comprimentoCm &&
                    item.quantidade === novaLinhaTabela.orcamentoData.quantidade
                );
                if (index > -1) { linhasOrcamento.splice(index, 1); }

                novaLinhaTabela.remove();
                atualizarResumoBitolas();
            });

            tabelaResultados.appendChild(novaLinhaTabela);

            resumoBitolasCalculo[bitola] = (resumoBitolasCalculo[bitola] || 0) + pesoTotalPecas;
            resumoCustosCalculo[bitola] = (resumoCustosCalculo[bitola] || 0) + custoTotalPecas;

            atualizarResumoBitolas();
            formPeca.reset();
            validarCamposMedida(); // Reseta os campos b e c após adicionar a peça
        });
    }

    /**
     * Atualiza o resumo de pesos e custos por bitola e os totais gerais.
     */
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
                <td data-label="Bitola">${bitola} mm</td>
                <td data-label="Peso Total (kg)">${peso.toFixed(3)} kg</td>
                <td data-label="Custo Total (R$)">R$ ${custo.toFixed(2)}</td>
            `;
            resumoBitolasDisplay.appendChild(linha);
        }

        pesoTotalGeralElement.textContent = pesoTotalGeral.toFixed(3) + " kg";
        custoTotalGeralElement.textContent = "R$ " + custoTotalGeral.toFixed(2);
    }

    /**
     * Monta um objeto de orçamento com os dados atuais do formulário.
     * @returns {object} Objeto contendo todos os dados do orçamento.
     */
    function montarOrcamento() {
        const clienteNome = clienteInputPrincipal?.value || '';
        const codCliente = codClienteInputPrincipal?.value || '';
        const obra = obraInput?.value || '';
        const numPedido = numPedidoInput?.value || '';
        const orcamentoId = orcamentoIdInput?.value || ''; // Pega o ID do orçamento para edição
        const recebeCaminhao = recebeCaminhaoSelect?.value || '';
        const dataDesejada = dataDesejadaInput?.value || '';

        const pesoTotalGeralDisplay = pesoTotalGeralElement?.textContent || '0.00 kg';
        const custoTotalGeralDisplay = custoTotalGeralElement?.textContent || 'R$ 0.00';

        return {
            id: orcamentoId, // Inclui o ID para operações de PUT (edição)
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

    // --- EVENT LISTENERS PARA SALVAR E GERAR PDF ---

    /**
     * Salva ou atualiza um orçamento no backend.
     */
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

            let method = 'POST';
            let url = `${urlBase}/api/orcamentos`;

            // Se orcamentoIdInput.value tem um valor, é uma edição (PUT)
            if (orcamentoParaSalvar.id) {
                method = 'PUT';
                url = `${urlBase}/api/orcamentos/${orcamentoParaSalvar.id}`;
            }

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orcamentoParaSalvar)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao salvar/atualizar orçamento.' }));
                    throw new Error(errorData.message || "Erro ao salvar/atualizar orçamento.");
                }

                const resultado = await response.json();
                alert(`Orçamento ${method === 'POST' ? 'salvo' : 'atualizado'} com sucesso! Pedido Nº: ${resultado.numPedido || resultado.id}`);

                if (numPedidoInput) {
                    numPedidoInput.value = resultado.numPedido || resultado.id;
                }
                if (orcamentoIdInput && method === 'POST') {
                    orcamentoIdInput.value = resultado.id; // Define o ID para o novo orçamento salvo
                }

                // Após salvar/atualizar, inicia um novo orçamento automaticamente
                // ou mantém o atual se for edição e o usuário quiser continuar trabalhando nele
                if (method === 'POST') { // Apenas limpa para um novo orçamento se for um POST
                    iniciarNovoOrcamento();
                }

            } catch (error) {
                console.error("Erro ao salvar/atualizar orçamento:", error);
                alert("Erro ao salvar/atualizar orçamento. Detalhes: " + error.message);
            }
        });
    }

    /**
     * Gera um PDF do orçamento atual.
     */
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

            for (const bitola in orcamento.resumoBitolas) {
                const resumo = orcamento.resumoBitolas[bitola];
                doc.text(`Bitola ${bitola}mm: Peso ${resumo.toFixed(3) || '0.000'} kg - Custo R$ ${orcamento.resumoCustos[bitola]?.toFixed(2) || '0.00'}`, 10, y);
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
    validarCamposMedida(); // Chama a validação inicial para o tipo de peça padrão
});
