document.addEventListener('DOMContentLoaded', function () {
    // --- REFERÊNCIAS PARA ELEMENTOS DO FORMULÁRIO PRINCIPAL ---
    const formPeca = document.getElementById('form-peca');
    const tabelaResultados = document.querySelector('#tabela-resultados tbody');
    const resumoBitolasDisplay = document.getElementById("tabela-resumo-bitolas");
    const pesoTotalGeralElement = document.getElementById("peso-total-geral");
    const custoTotalGeralElement = document.getElementById("custo-total-geral");
    const btnSalvarOrcamento = document.getElementById("btnSalvarOrcamento");
    const btnGerarPdf = document = document.getElementById("btnGerarPdf");
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

    // Referência para o botão "Cadastrar Novo Cliente"
    const btnAbrirModalCadastroCliente = document.getElementById('btnAbrirModalCadastroCliente');
    // NOVO: Referência para o botão "Editar Cliente"
    const btnEditarCliente = document.getElementById('btnEditarCliente');


    if (clienteInputPrincipal) clienteInputPrincipal.readOnly = true;
    if (codClienteInputPrincipal) codClienteInputPrincipal.readOnly = true;
    if (numPedidoInput) numPedidoInput.readOnly = true;

    // Variáveis para armazenar dados do orçamento e cálculos
    const resumoBitolasCalculo = {};
    const resumoCustosCalculo = {};
    const linhasOrcamento = []; // Armazena os dados das peças adicionadas

    // --- REFERÊNCIAS E LÓGICA DA MODAL DE CADASTRO/EDIÇÃO DE CLIENTE ---
    const modalCadastroCliente = document.getElementById('modalCadastroCliente');
    const closeModalCadastroCliente = document.getElementById('closeModalCadastroCliente');
    const formCadastroCliente = document.getElementById('formCadastroCliente');
    const cadastroClienteFeedback = document.getElementById('cadastroClienteFeedback');
    const modalClienteTitle = document.getElementById('modalClienteTitle'); // Título da modal

    const radioJuridica = document.getElementById('radioJuridica');
    const radioFisica = document.getElementById('radioFisica');
    const cnpjGroup = document.getElementById('cnpjGroup');
    const cpfGroup = document.getElementById('cpfGroup');
    const cnpjClienteInput = document.getElementById('cnpjCliente');
    const cpfClienteInput = document.getElementById('cpfCliente');

    // Campos da modal para edição/cadastro
    const nomeClienteInput = document.getElementById('nomeCliente');
    const clienteIdParaEdicaoInput = document.getElementById('clienteIdParaEdicao'); // Campo oculto para ID do cliente
    const telefoneClienteInput = document.getElementById('telefoneCliente');
    const emailClienteInput = document.getElementById('emailCliente');

    // NOVO: Container para múltiplos endereços
    const enderecosContainer = document.getElementById('enderecosContainer');
    const btnAddEndereco = document.getElementById('btnAddEndereco');

    // Array para armazenar os endereços da modal antes de enviar
    let currentClientAddresses = [];


    /**
     * Alterna a visibilidade dos campos CNPJ e CPF na modal de cadastro de cliente.
     */
    function toggleCpfCnpjFields() {
        const tipoPessoaSelecionado = document.querySelector('input[name="tipoPessoa"]:checked')?.value || 'juridica';
        if (cnpjGroup) cnpjGroup.style.display = (tipoPessoaSelecionado === 'juridica') ? 'block' : 'none';
        if (cpfGroup) cpfGroup.style.display = (tipoPessoaSelecionado === 'fisica') ? 'block' : 'none';
        if (cnpjClienteInput) cnpjClienteInput.required = (tipoPessoaSelecionado === 'juridica');
        if (cpfClienteInput) cpfClienteInput.required = (tipoPessoaSelecionado === 'fisica');
        if (tipoPessoaSelecionado === 'juridica' && cpfClienteInput) cpfClienteInput.value = '';
        if (tipoPessoaSelecionado === 'fisica' && cnpjClienteInput) cnpjClienteInput.value = '';
    }

    /**
     * Adiciona um novo bloco de campos de endereço na modal.
     * @param {object} [addressData={}] - Dados do endereço para preencher os campos (opcional).
     * @param {boolean} [isPrimary=false] - Indica se é o endereço principal (para desabilitar remoção).
     */
    function addEnderecoField(addressData = {}, isPrimary = false) {
        const index = enderecosContainer.children.length; // Usar o número de filhos como índice
        const addressDiv = document.createElement('div');
        addressDiv.classList.add('endereco-group');
        addressDiv.dataset.index = index; // Adiciona um data attribute para fácil referência

        addressDiv.innerHTML = `
            <h4 class="endereco-title">${isPrimary ? 'Endereço Principal' : `Endereço ${index + 1}`}</h4>
            <div class="form-group-grid">
                <label for="ruaCliente_${index}">Rua:</label>
                <input type="text" id="ruaCliente_${index}" name="ruaCliente_${index}" value="${addressData.rua || ''}" required>
            </div>
            <div class="form-row-grid">
                <div class="form-group-grid">
                    <label for="numeroCliente_${index}">Número:</label>
                    <input type="text" id="numeroCliente_${index}" name="numeroCliente_${index}" value="${addressData.numero || ''}">
                </div>
                <div class="form-group-grid">
                    <label for="bairroCliente_${index}">Bairro:</label>
                    <input type="text" id="bairroCliente_${index}" name="bairroCliente_${index}" value="${addressData.bairro || ''}">
                </div>
            </div>
            <div class="form-row-grid">
                <div class="form-group-grid">
                    <label for="cidadeCliente_${index}">Cidade:</label>
                    <input type="text" id="cidadeCliente_${index}" name="cidadeCliente_${index}" value="${addressData.cidade || ''}" required>
                </div>
                <div class="form-group-grid">
                    <label for="estadoCliente_${index}">Estado (UF):</label>
                    <input type="text" id="estadoCliente_${index}" name="estadoCliente_${index}" maxlength="2" value="${addressData.estado || ''}" required>
                </div>
                <div class="form-group-grid">
                    <label for="cepCliente_${index}">CEP:</label>
                    <input type="text" id="cepCliente_${index}" name="cepCliente_${index}" value="${addressData.cep || ''}">
                </div>
            </div>
            ${!isPrimary ? `<button type="button" class="btn btn-danger btn-remove-endereco" data-index="${index}"><i class="fas fa-minus-circle"></i> Remover Endereço</button>` : ''}
        `;
        enderecosContainer.appendChild(addressDiv);

        // Adiciona listener para o botão de remover
        if (!isPrimary) {
            addressDiv.querySelector('.btn-remove-endereco').addEventListener('click', function() {
                addressDiv.remove();
                updateEnderecoTitles(); // Atualiza os títulos após remover
            });
        }
    }

    /**
     * Atualiza os títulos dos endereços após adição/remoção.
     */
    function updateEnderecoTitles() {
        const enderecoGroups = enderecosContainer.querySelectorAll('.endereco-group');
        enderecoGroups.forEach((group, i) => {
            const titleElement = group.querySelector('.endereco-title');
            if (titleElement) {
                titleElement.textContent = i === 0 ? 'Endereço Principal' : `Endereço ${i + 1}`;
            }
            // Atualiza o data-index e o data-index do botão de remover
            group.dataset.index = i;
            const removeBtn = group.querySelector('.btn-remove-endereco');
            if (removeBtn) {
                removeBtn.dataset.index = i;
            }
        });
    }


    // Event listeners para abrir/fechar a modal de cadastro de cliente
    if (btnAbrirModalCadastroCliente && modalCadastroCliente) {
        btnAbrirModalCadastroCliente.addEventListener('click', function() {
            modalCadastroCliente.style.display = 'flex';
            modalClienteTitle.textContent = 'Cadastrar Novo Cliente';
            formCadastroCliente.reset(); // Limpa o formulário ao abrir
            clienteIdParaEdicaoInput.value = ''; // Garante que o ID de edição esteja vazio
            cadastroClienteFeedback.textContent = ''; // Limpa feedback
            if (radioJuridica) radioJuridica.checked = true; // Garante Jurídica selecionada
            toggleCpfCnpjFields();
            enderecosContainer.innerHTML = ''; // Limpa endereços anteriores
            addEnderecoField({}, true); // Adiciona um endereço principal vazio
            currentClientAddresses = []; // Reseta o array de endereços
        });
    }

    if (closeModalCadastroCliente && formCadastroCliente && cadastroClienteFeedback && modalCadastroCliente) {
        closeModalCadastroCliente.addEventListener('click', function() {
            modalCadastroCliente.style.display = 'none';
            formCadastroCliente.reset();
            clienteIdParaEdicaoInput.value = '';
            cadastroClienteFeedback.textContent = '';
            if (radioJuridica) radioJuridica.checked = true;
            toggleCpfCnpjFields();
            enderecosContainer.innerHTML = '';
            currentClientAddresses = [];
        });
    }

    if (modalCadastroCliente && formCadastroCliente && cadastroClienteFeedback) {
        window.addEventListener('click', function(event) {
            if (event.target === modalCadastroCliente) {
                modalCadastroCliente.style.display = 'none';
                formCadastroCliente.reset();
                clienteIdParaEdicaoInput.value = '';
                cadastroClienteFeedback.textContent = '';
                if (radioJuridica) radioJuridica.checked = true;
                toggleCpfCnpjFields();
                enderecosContainer.innerHTML = '';
                currentClientAddresses = [];
            }
        });
    }

    // Event listener para os botões de rádio de tipo de pessoa
    document.querySelectorAll('input[name="tipoPessoa"]').forEach(radio => {
        radio.addEventListener('change', toggleCpfCnpjFields);
    });

    // Event listener para adicionar novo endereço
    if (btnAddEndereco) {
        btnAddEndereco.addEventListener('click', () => addEnderecoField({}));
    }


    /**
     * Envia os dados do novo/editado cliente para o backend.
     */
    if (formCadastroCliente && cadastroClienteFeedback && clienteInputPrincipal && codClienteInputPrincipal) {
        formCadastroCliente.addEventListener('submit', async function(event) {
            event.preventDefault();

            cadastroClienteFeedback.textContent = 'Salvando cliente...';
            cadastroClienteFeedback.style.color = 'blue';

            const idParaEdicao = clienteIdParaEdicaoInput?.value;
            const nomeCliente = nomeClienteInput?.value;
            const tipoPessoa = document.querySelector('input[name="tipoPessoa"]:checked')?.value;
            const cnpjCliente = cnpjClienteInput?.value;
            const cpfCliente = cpfClienteInput?.value;
            const telefoneCliente = telefoneClienteInput?.value;
            const emailCliente = emailClienteInput?.value;

            // Coleta todos os endereços dos campos dinâmicos
            const collectedAddresses = [];
            enderecosContainer.querySelectorAll('.endereco-group').forEach((group, index) => {
                const rua = document.getElementById(`ruaCliente_${index}`)?.value || '';
                const numero = document.getElementById(`numeroCliente_${index}`)?.value || '';
                const bairro = document.getElementById(`bairroCliente_${index}`)?.value || '';
                const cidade = document.getElementById(`cidadeCliente_${index}`)?.value || '';
                const estado = document.getElementById(`estadoCliente_${index}`)?.value || '';
                const cep = document.getElementById(`cepCliente_${index}`)?.value || '';
                collectedAddresses.push({ rua, numero, bairro, cidade, estado, cep });
            });

            const clientData = {
                nomeCliente,
                tipoPessoa,
                cnpjCliente: tipoPessoa === 'juridica' ? cnpjCliente : null,
                cpfCliente: tipoPessoa === 'fisica' ? cpfCliente : null,
                enderecos: collectedAddresses, // Envia o array de endereços
                telefoneCliente,
                emailCliente
            };

            const urlBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000'
                : '';

            let method = 'POST';
            let url = `${urlBase}/api/clientes`;
            if (idParaEdicao) {
                method = 'PUT';
                url = `${urlBase}/api/clientes/${idParaEdicao}`;
            }

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clientData)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao cadastrar/atualizar cliente.' }));
                    throw new Error(errorData.message || "Erro ao cadastrar/atualizar cliente.");
                }

                const newClient = await response.json();

                cadastroClienteFeedback.textContent = `Cliente "${newClient.nome}" ${method === 'POST' ? 'cadastrado' : 'atualizado'} com sucesso! Código: ${newClient.id}`;
                cadastroClienteFeedback.style.color = 'green';

                // Atualiza os campos principais se for um novo cadastro ou se o cliente editado for o atual
                if (method === 'POST' || (clienteInputPrincipal.value === '' && codClienteInputPrincipal.value === '') || codClienteInputPrincipal.value === newClient.id) {
                    clienteInputPrincipal.value = newClient.nome;
                    codClienteInputPrincipal.value = newClient.id;
                }

                setTimeout(() => {
                    if (modalCadastroCliente) modalCadastroCliente.style.display = 'none';
                    formCadastroCliente.reset();
                    clienteIdParaEdicaoInput.value = '';
                    cadastroClienteFeedback.textContent = '';
                    if (radioJuridica) radioJuridica.checked = true;
                    toggleCpfCnpjFields();
                    enderecosContainer.innerHTML = '';
                    currentClientAddresses = [];
                }, 2000);
            } catch (error) {
                console.error("Erro ao cadastrar/atualizar cliente:", error);
                cadastroClienteFeedback.textContent = "Erro ao cadastrar/atualizar cliente. Detalhes: " + error.message;
                cadastroClienteFeedback.style.color = 'red';
            }
        });
    }

    // NOVO: Lógica para carregar cliente para edição
    if (btnEditarCliente) {
        btnEditarCliente.addEventListener('click', async function() {
            const currentClientId = codClienteInputPrincipal.value;
            if (!currentClientId) {
                alert('Por favor, selecione ou cadastre um cliente primeiro para poder editá-lo.');
                return;
            }
            await carregarClienteParaEdicao(currentClientId);
        });
    }

    /**
     * Carrega os dados de um cliente específico na modal de cadastro/edição.
     * @param {string} clientId - O ID do cliente a ser editado.
     */
    async function carregarClienteParaEdicao(clientId) {
        if (!clientId) return;

        modalCadastroCliente.style.display = 'flex';
        modalClienteTitle.textContent = 'Editar Cliente';
        formCadastroCliente.reset();
        cadastroClienteFeedback.textContent = 'Carregando dados do cliente...';
        cadastroClienteFeedback.style.color = 'blue';
        enderecosContainer.innerHTML = ''; // Limpa endereços anteriores
        currentClientAddresses = []; // Reseta o array de endereços

        const urlBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000'
            : '';

        try {
            const response = await fetch(`${urlBase}/api/clientes/${clientId}`);
            if (!response.ok) {
                throw new Error('Erro ao carregar dados do cliente para edição.');
            }
            const cliente = await response.json();

            // Preenche os campos da modal
            clienteIdParaEdicaoInput.value = cliente.id;
            nomeClienteInput.value = cliente.nome;
            telefoneClienteInput.value = cliente.telefone || '';
            emailClienteInput.value = cliente.email || '';

            if (cliente.tipo_pessoa === 'fisica') {
                radioFisica.checked = true;
                cpfClienteInput.value = cliente.documento || '';
            } else {
                radioJuridica.checked = true;
                cnpjClienteInput.value = cliente.documento || '';
            }
            toggleCpfCnpjFields(); // Garante a visibilidade correta do CNPJ/CPF

            // Preenche os endereços
            if (cliente.enderecos && cliente.enderecos.length > 0) {
                cliente.enderecos.forEach((addr, i) => {
                    addEnderecoField(addr, i === 0); // O primeiro é o principal
                });
                currentClientAddresses = [...cliente.enderecos]; // Salva para controle
            } else {
                addEnderecoField({}, true); // Adiciona um endereço principal vazio se não houver
            }

            cadastroClienteFeedback.textContent = 'Dados do cliente carregados.';
            cadastroClienteFeedback.style.color = 'green';
            setTimeout(() => cadastroClienteFeedback.textContent = '', 2000);

        } catch (error) {
            console.error("Erro ao carregar cliente para edição:", error);
            cadastroClienteFeedback.textContent = "Erro ao carregar cliente. Detalhes: " + error.message;
            cadastroClienteFeedback.style.color = 'red';
        }
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
                resultadosBuscaClienteDiv.innerHTML = '<p class="loading-message" style="color: gray; font-style: italic;">Digite um termo para buscar (nome, código ou documento).</p>';
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
                    resultadosBuscaClienteDiv.innerHTML = '<p class="loading-message" style="color: orange; font-weight: bold;">Nenhum cliente encontrado.</p>';
                } else {
                    clientesEncontrados.forEach(cliente => {
                        const p = document.createElement('p');
                        p.textContent = `${cliente.nome} (Cód: ${cliente.id}) ${cliente.documento ? ` - Doc: ${cliente.documento}` : ''}`;
                        p.classList.add('resultado-cliente-item');
                        p.addEventListener('click', () => {
                            // Preenche os campos do formulário principal com os dados do cliente selecionado
                            if (clienteInputPrincipal) clienteInputPrincipal.value = cliente.nome;
                            if (codClienteInputPrincipal) codClienteInputPrincipal.value = cliente.id;
                            // Exibe o botão de editar cliente
                            if (btnEditarCliente) btnEditarCliente.style.display = 'inline-block';

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
                resultadosBuscaClienteDiv.innerHTML = `<p class="loading-message" style="color: red; font-weight: bold;">Erro na busca: ${error.message}</p>`;
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
        listaOrcamentosDiv.innerHTML = '<p class="loading-message">Carregando orçamentos...</p>';
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
                listaOrcamentosDiv.innerHTML = '<p class="loading-message" style="color: orange; font-weight: bold;">Nenhum orçamento encontrado.</p>';
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
                        spanText.textContent = `PEDIDO Nº: ${String(numPedidoDisplay).toUpperCase()} - CLIENTE: ${String(clienteNome).toUpperCase()} - OBRA: ${String(obraNome).toUpperCase()} - DATA: ${String(dataDisplay).toUpperCase()}`;
                        
                        // Crie o botão de excluir
                        const btnExcluir = document.createElement('button');
                        btnExcluir.classList.add('btn', 'btn-danger', 'btn-excluir-orcamento');
                        btnExcluir.dataset.orcamentoId = orcamento.id;
                        btnExcluir.innerHTML = '<i class="fas fa-trash-alt"></i> EXCLUIR';

                        // Anexe os event listeners
                        spanText.addEventListener('click', () => carregarOrcamentoNaTela(orcamento.id));
                        btnExcluir.addEventListener('click', (e) => {
                            e.stopPropagation(); // Impede que o clique no botão ative o clique no item pai
                            if (confirm(`TEM CERTEZA QUE DESEJA EXCLUIR O ORÇAMENTO PEDIDO Nº: ${String(numPedidoDisplay).toUpperCase()}?`)) {
                                const idParaExcluir = e.target.dataset.orcamentoId || e.target.closest('button').dataset.orcamentoId; // Pega o ID do botão ou do pai
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
                listaOrcamentosDiv.innerHTML = `<p class="loading-message" style="color: red; text-align: center;">ERRO AO CARREGAR ORÇAMENTOS: ${String(error.message).toUpperCase()}</p>`;
            }
        }

    /**
     * Carrega um orçamento específico na tela principal para visualização/edição.
     * @param {string} orcamentoId - O ID numérico do orçamento a ser carregado.
     */
    async function carregarOrcamentoNaTela(orcamentoId) {
        console.log(`CARREGANDO ORÇAMENTO ID: ${orcamentoId}`);
        if(visualizarOrcamentoFeedback) {
            visualizarOrcamentoFeedback.textContent = 'CARREGANDO DETALHES DO ORÇAMENTO...';
            visualizarOrcamentoFeedback.style.color = 'blue';
        }

        try {
            const urlBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000'
                : '';
            const response = await fetch(`${urlBase}/api/orcamentos/${orcamentoId}`);
            if (!response.ok) {
                throw new Error('ERRO AO CARREGAR DETALHES DO ORÇAMENTO.');
            }
            const orcamentoDetalhes = await response.json();

            // Preenche os campos do formulário principal com verificações de segurança
            if (clienteInputPrincipal) clienteInputPrincipal.value = (String(orcamentoDetalhes.clienteInfo?.cliente || '')).toUpperCase();
            if (codClienteInputPrincipal) codClienteInputPrincipal.value = (String(orcamentoDetalhes.clienteInfo?.codCliente || '')).toUpperCase();
            if (obraInput) obraInput.value = (String(orcamentoDetalhes.obraInfo?.nome || '')).toUpperCase();
            if (numPedidoInput) numPedidoInput.value = (String(orcamentoDetalhes.obraInfo?.numPedido || orcamentoDetalhes.id || '')).toUpperCase();
            if (orcamentoIdInput) orcamentoIdInput.value = orcamentoDetalhes.id; // Define o ID do orçamento para edição
            if (recebeCaminhaoSelect) recebeCaminhaoSelect.value = (String(orcamentoDetalhes.obraInfo?.recebeCaminhao || 'SIM')).toUpperCase();
            if (dataDesejadaInput) dataDesejadaInput.value = (String(orcamentoDetalhes.obraInfo?.dataDesejada || '')).toUpperCase();
            // Exibe o botão de editar cliente
            if (btnEditarCliente) btnEditarCliente.style.display = 'inline-block';


            // Limpa e preenche a tabela de peças
            linhasOrcamento.length = 0;
            tabelaResultados.innerHTML = '';
            Object.keys(resumoBitolasCalculo).forEach(key => delete resumoBitolasCalculo[key]);
            Object.keys(resumoCustosCalculo).forEach(key => delete resumoCustosCalculo[key]);

            if (orcamentoDetalhes.itensPedido && orcamentoDetalhes.itensPedido.length > 0) {
                orcamentoDetalhes.itensPedido.forEach(item => {
                    const novaLinhaTabela = document.createElement('tr');
                    novaLinhaTabela.innerHTML = `
                        <td data-label="Tipo">${(String(item.tipo || '')).toUpperCase()}</td>
                        <td data-label="Bitola">${(String(item.bitola || '')).toUpperCase()} MM</td>
                        <td data-label="Medidas">${(String(item.medidas?.a || '')).toUpperCase()}${(item.medidas?.b ? '/' + String(item.medidas.b) : '').toUpperCase()}${(item.medidas?.c ? '/' + String(item.medidas.c) : '').toUpperCase()}</td>
                        <td data-label="Qtd">${(String(item.quantidade || '')).toUpperCase()}</td>
                        <td data-label="Comprimento">${(String(item.comprimentoCm || '')).toUpperCase()} CM</td>
                        <td data-label="Peso">${(String(item.pesoKg || '')).toUpperCase()} KG</td>
                        <td data-label="Ações"><button class="btn btn-danger btn-excluir"><i class="fas fa-trash-alt"></i> EXCLUIR</button></td>
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

                        const index = linhasOrcamento.findIndex(item =>
                            item.tipo === novaLinhaTabela.orcamentoData.tipo &&
                            item.bitola === novaLinhaTabela.orcamentoData.bitola &&
                            item.comprimentoCm === novaLinhaTabela.orcamentoData.comprimentoCm &&
                            item.quantidade === novaLinhaTabela.orcamentoData.quantidade
                        );
                        if (index > -1) { linhasOrcamento.splice(index, 1); }

                        novaLinhaTabela.remove(); // Remove a linha da tabela HTML
                        atualizarResumoBitolas(); // Recalcula e atualiza o resumo
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
                visualizarOrcamentoFeedback.textContent = 'ORÇAMENTO CARREGADO COM SUCESSO!';
                visualizarOrcamentoFeedback.style.color = 'green';
                setTimeout(() => visualizarOrcamentoFeedback.textContent = '', 2000);
            }
        } catch (error) {
            console.error('ERRO AO CARREGAR ORÇAMENTO NA TELA:', error);
            if(visualizarOrcamentoFeedback) {
                visualizarOrcamentoFeedback.textContent = `ERRO AO CARREGAR ORÇAMENTO: ${String(error.message).toUpperCase()}`;
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

            alert('ORÇAMENTO EXCLUÍDO COM SUCESSO!');
            carregarOrcamentos(); // Recarrega a lista de orçamentos após a exclusão
            iniciarNovoOrcamento(); // Limpa o formulário principal caso o orçamento excluído estivesse carregado
        } catch (error) {
                console.error('ERRO AO EXCLUIR ORÇAMENTO:', error);
                // Usar uma modal customizada em vez de alert
                const feedbackDiv = document.getElementById('visualizarOrcamentoFeedback');
                if (feedbackDiv) {
                    feedbackDiv.textContent = `ERRO AO EXCLUIR ORÇAMENTO: ${String(error.message).toUpperCase()}`;
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
        if (btnEditarCliente) btnEditarCliente.style.display = 'none'; // Esconde o botão de editar cliente

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
        "12.5": 0.962, "16.0": 1.578, "20.0": 2.466, "25.0": 7.30
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
                alert('PARA "VARA RETA", APENAS A MEDIDA "A" É NECESSÁRIA. POR FAVOR, LIMPE OS CAMPOS "B" E "C".');
                return;
            }
            if ((tipo === 'varaL' || tipo === 'estribo') && medidaCInput.value !== '') {
                alert(`PARA "${tipo === 'varaL' ? 'VARA EM L' : 'ESTRIBO'}", APENAS AS MEDIDAS "A" E "B" SÃO NECESSÁRIAS. POR FAVOR, LIMPE O CAMPO "C".`);
                return;
            }
            if (tipo === 'varaU' && (isNaN(b) || isNaN(c))) {
                alert('PARA "VARA EM U", AS MEDIDAS "A", "B" E "C" SÃO NECESSÁRIAS.');
                return;
            }
            if ((tipo === 'varaL' || tipo === 'estribo') && isNaN(b)) {
                alert(`PARA "${tipo === 'varaL' ? 'VARA EM L' : 'ESTRIBO'}", AS MEDIDAS "A" E "B" SÃO NECESSÁRIAS.`);
                return;
            }


            if (!tipo || !bitola || isNaN(a) || isNaN(quantidade) || quantidade <= 0) {
                alert('POR FAVOR, PREENCHA TIPO, BITOLA, MEDIDA "A" E QUANTIDADE COM VALORES VÁLIDOS.');
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
                <td data-label="Tipo">${tipo.toUpperCase()}</td>
                <td data-label="Bitola">${bitola.toUpperCase()} MM</td>
                <td data-label="Medidas">${String(a).toUpperCase()}${b ? '/' + String(b).toUpperCase() : ''}${c ? '/' + String(c).toUpperCase() : ''}</td>
                <td data-label="Qtd">${String(quantidade).toUpperCase()}</td>
                <td data-label="Comprimento">${comprimentoCm.toFixed(2).toUpperCase()} CM</td>
                <td data-label="Peso">${pesoTotalPecas.toFixed(3).toUpperCase()} KG</td>
                <td data-label="Ações"><button class="btn btn-danger btn-excluir"><i class="fas fa-trash-alt"></i> EXCLUIR</button></td>
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
            linhasOrcamento.push(dadosPeca); // Adiciona ao array global de peças

            novaLinhaTabela.querySelector(".btn-excluir").addEventListener("click", function () {
                const bitolaExcluir = novaLinhaTabela.dataset.bitola;
                const pesoExcluir = parseFloat(novaLinhaTabela.dataset.peso);
                const custoExcluir = parseFloat(novaLinhaTabela.dataset.custo);

                if (resumoBitolasCalculo[bitolaExcluir]) { resumoBitolasCalculo[bitolaExcluir] -= pesoExcluir; if (resumoBitolasCalculo[bitolaExcluir] < 0.001) { delete resumoBitolasCalculo[bitolaExcluir]; } }
                if (resumoCustosCalculo[bitolaExcluir]) { resumoCustosCalculo[bitolaExcluir] -= custoExcluir; if (resumoCustosCalculo[bitolaExcluir] < 0.001) { delete resumoCustosCalculo[bitolaExcluir]; } }

                // Encontra e remove a peça do array linhasOrcamento
                const index = linhasOrcamento.findIndex(item =>
                    item.tipo === dadosPeca.tipo && // Use dadosPeca aqui para se referir à peça original desta linha
                    item.bitola === dadosPeca.bitola &&
                    item.comprimentoCm === dadosPeca.comprimentoCm &&
                    item.quantidade === dadosPeca.quantidade
                );
                if (index > -1) { linhasOrcamento.splice(index, 1); }

                novaLinhaTabela.remove(); // Remove a linha da tabela HTML
                atualizarResumoBitolas(); // Recalcula e atualiza o resumo
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
                <td data-label="Bitola">${bitola.toUpperCase()} MM</td>
                <td data-label="Peso Total (kg)">${peso.toFixed(3).toUpperCase()} KG</td>
                <td data-label="Custo Total (R$)">R$ ${custo.toFixed(2).toUpperCase()}</td>
            `;
            resumoBitolasDisplay.appendChild(linha);
        }

        pesoTotalGeralElement.textContent = pesoTotalGeral.toFixed(3).toUpperCase() + " KG";
        custoTotalGeralElement.textContent = "R$ " + custoTotalGeral.toFixed(2).toUpperCase();
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

        const pesoTotalGeralDisplay = pesoTotalGeralElement?.textContent || '0.00 KG';
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
                alert('POR FAVOR, CADASTRE OU SELECIONE UM CLIENTE ANTES DE SALVAR O ORÇAMENTO.');
                return;
            }
            if (linhasOrcamento.length === 0) {
                alert('POR FAVOR, ADICIONE PELO MENOS UMA PEÇA AO ORÇAMENTO.');
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
                    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao cadastrar/atualizar orçamento.' }));
                    throw new Error(errorData.message || "Erro ao cadastrar/atualizar orçamento.");
                }

                const resultado = await response.json();
                alert(`ORÇAMENTO ${method === 'POST' ? 'SALVO' : 'ATUALIZADO'} COM SUCESSO! PEDIDO Nº: ${String(resultado.numPedido || resultado.id).toUpperCase()}`);

                if (numPedidoInput) {
                    numPedidoInput.value = String(resultado.numPedido || resultado.id).toUpperCase();
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
                console.error("ERRO AO SALVAR/ATUALIZAR ORÇAMENTO:", error);
                alert("ERRO AO SALVAR/ATUALIZAR ORÇAMENTO. DETALHES: " + String(error.message).toUpperCase());
            }
        });
    }

    /**
     * Gera um PDF do orçamento atual com layout aprimorado e horizontal.
     */
    if (btnGerarPdf) {
        btnGerarPdf.addEventListener("click", async () => {
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                console.error("JSPDF NÃO ESTÁ CARREGADO.");
                alert("ERRO: A BIBLIOTECA PARA GERAR PDF NÃO FOI CARREGADA CORRETAMENTE.");
                return;
            }

            if (!clienteInputPrincipal.value || !codClienteInputPrincipal.value) {
                alert('POR FAVOR, CADASTRE OU SELECIONE UM CLIENTE ANTES DE GERAR O PDF.');
                return;
            }
            if (linhasOrcamento.length === 0) {
                alert('POR FAVOR, ADICIONE PELO MENOS UMA PEÇA AO ORÇAMENTO.');
                return;
            }

            const orcamento = montarOrcamento();
            // Define o PDF em modo paisagem (horizontal)
            const doc = new jsPDF('l', 'mm', 'a4'); // 'l' para paisagem (landscape)

            // Dimensões da página A4 em mm no modo paisagem
            const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
            const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
            const marginX = 10; // Margem lateral
            let currentY = 10; // Posição Y atual para desenhar

            // --- FUNÇÕES AUXILIARES PARA DESENHO ---
            const addRect = (x, y, width, height, fillColor, style = 'F') => {
                doc.setFillColor(fillColor);
                doc.rect(x, y, width, height, style);
            };

            const addText = (text, x, y, options = {}) => {
                doc.setFont(options.font || 'helvetica');
                doc.setFontSize(options.fontSize || 10);
                doc.setTextColor(options.textColor || 0, 0, 0); // Preto padrão
                doc.text(String(text).toUpperCase(), x, y, options.align ? { align: options.align } : {}); // CONVERTE PARA MAIÚSCULAS DE FORMA SEGURA
            };

            // Função para formatar números para moeda brasileira
            const formatCurrency = (value) => {
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(value);
            };

            // --- IMAGENS (PARA PDF - SUBSTITUA COM SUAS URLs PÚBLICAS DO GITHUB PAGES) ---
            // ATENÇÃO: As URLs abaixo são **APENAS EXEMPLOS**. VOCÊ DEVE SUBSTITUÍ-LAS PELAS SUAS PRÓPRIAS URLs
            // DE IMAGENS HOSPEDADAS NO SEU GITHUB PAGES, VERIFICANDO CADA UMA DELAS.
            // Acesse seu repositório no GitHub, vá para Settings > Pages, e veja qual branch e pasta está configurada.
            // Se as imagens estão na branch 'main' na raiz, as URLs devem ser como os exemplos abaixo.
            // Para obter a URL EXATA de uma imagem: vá para a imagem no GitHub, clique nela, e depois clique no botão 'Raw'.
            const dafelLogoSuperiorPDF = "https://thiagololosouza.github.io/corte-e-dobra-app/grupo-dafel-squarelogo-1724229844318.png"; // COLOQUE SUA URL AQUI
            const dafelSeriedadeNossaMarcaPDF = "https://thiagololosouza.github.io/corte-e-dobra-app/client-4.png"; // COLOQUE SUA URL AQUI
            const laranjaDadosClientePDF = "https://thiagololosouza.github.io/corte-e-dobra-app/411878334_914510800158541_3475139305395707762_n.jpg"; // COLOQUE SUA URL AQUI
            const dafelMainLogoPDF = "https://thiagololosouza.github.io/corte-e-dobra-app/images-1.jpg"; // COLOQUE SUA URL AQUI (se renomeou images (1).jpg)
           
            const addImageToPdfDirect = (imgUrl, x, y, width, height, format = 'PNG') => {
                // Tentar adicionar imagem. Se a URL for inválida, a imagem não aparecerá, mas o PDF será gerado.
                try {
                    doc.addImage(imgUrl, format, x, y, width, height);
                } catch (e) {
                    console.warn(`Não foi possível adicionar a imagem ${imgUrl} ao PDF. Erro: ${e.message}`);
                    // Opcional: Adicionar um texto placeholder ou um retângulo para indicar a falha da imagem
                    // doc.text("IMAGEM INVÁLIDA", x + width / 2, y + height / 2, { align: 'center' });
                }
            };


            // --- CABEÇALHO SUPERIOR ---
            // Fundo azul escuro para o cabeçalho superior
            addRect(0, 0, pageWidth, 20, '#333333'); // Ajustado para a largura da página horizontal

            // Texto "ORÇAMENTO" - MAIOR E MAIS GORDINHO (BOLD)
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255); // Branco
            doc.setFont('helvetica', 'bold');
            doc.text("ORÇAMENTO", marginX, 13);
            doc.setFontSize(10); // Volta ao padrão
            doc.setFont('helvetica', 'normal'); // Volta ao padrão

            // AJUSTES DE POSICIONAMENTO DAS IMAGENS DO CABEÇALHO
            // 1. Logo "Grupo Dafel" (dafelLogoSuperiorPDF) - no centro
            const dafelLogoSuperiorWidth = 40; 
            const dafelLogoSuperiorHeight = 15; 
            const dafelLogoSuperiorX = (pageWidth / 2) - (dafelLogoSuperiorWidth / 2);
            const dafelLogoSuperiorY = 3; 
            addImageToPdfDirect(dafelLogoSuperiorPDF, dafelLogoSuperiorX, dafelLogoSuperiorY, dafelLogoSuperiorWidth, dafelLogoSuperiorHeight, 'PNG'); 
            
            // 2. Logo "Dafé Seriedade Nossa Marca" (dafelSeriedadeNossaMarcaPDF) - na ponta direita, mais quadradinha
            const dafelSeriedadeWidth = 40; 
            const dafelSeriedadeHeight = 15; 
            const dafelSeriedadeX = pageWidth - marginX - dafelSeriedadeWidth;
            const dafelSeriedadeY = 3; 
            addImageToPdfDirect(dafelSeriedadeNossaMarcaPDF, dafelSeriedadeX, dafelSeriedadeY, dafelSeriedadeWidth, dafelSeriedadeHeight, 'PNG'); 

            // Informações do site e redes sociais (lado esquerdo do cabeçalho) - TEXTO BRANCO
            doc.setTextColor(255, 255, 255); // Cor branca para estes textos
            addText("ACESSE NOSSO SITE", pageWidth - marginX - 100, 7, { fontSize: 7, align: 'right', textColor: [255, 255, 255] }); 
            addText("WWW.DAFEL.COM.BR", pageWidth - marginX - 100, 10, { fontSize: 9, align: 'right', textColor: [255, 255, 255] }); 
            addText("REDES SOCIAIS", pageWidth - marginX - 45, 14, { fontSize: 7, align: 'right', textColor: [255, 255, 255] }); 
            addText("DAFELOFICIAL", pageWidth - marginX - 45, 17, { fontSize: 9, align: 'right', textColor: [255, 255, 255] }); 
            doc.setTextColor(0, 0, 0); // Volta para preto padrão

            currentY = 25; // Posição Y inicial após o cabeçalho superior

            // --- BLOCO DE DADOS DO CLIENTE ---
            // Retângulo principal que engloba as duas colunas com borda
            doc.setDrawColor(0); // Cor da borda preta
            addRect(marginX, currentY, pageWidth - (2 * marginX), 45, '#FFFFFF', 'FD'); // Fundo branco e borda

            // Imagem laranja na seção "Dados do Cliente"
            addImageToPdfDirect(laranjaDadosClientePDF, marginX + 2, currentY + 2, 20, 20, 'JPEG'); // Posição e tamanho da imagem laranja

            // Buscar documento e endereços do cliente (assíncrono)
            const urlBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : '';
            let clienteDetalhes = { documento: 'N/A', telefone: 'N/A', enderecos: [] };
            try {
                const response = await fetch(`${urlBase}/api/clientes/${orcamento.clienteInfo?.codCliente}`);
                if (response.ok) {
                    clienteDetalhes = await response.json();
                }
            } catch (e) {
                console.error("ERRO AO BUSCAR DETALHES DO CLIENTE PARA PDF:", e);
            }

            // --- DADOS DO CLIENTE (ORGANIZADO COM LINHAS) ---
            const clientSectionY = currentY + 2;
            const clientCol1X = marginX + 25; // Após a imagem laranja
            const clientCol2X = marginX + 90;
            const clientCol3X = marginX + 155;
            // A largura das colunas será implicitamente definida pelo espaçamento do texto

            // Cabeçalhos da seção do cliente (laranja)
            doc.setFillColor(255, 140, 0); // Laranja
            doc.rect(clientCol1X, clientSectionY, pageWidth - (2 * marginX) - clientCol1X + marginX, 6, 'F'); // Fundo laranja para os cabeçalhos
            doc.setDrawColor(0); // Borda preta
            doc.rect(clientCol1X, clientSectionY, pageWidth - (2 * marginX) - clientCol1X + marginX, 6, 'S'); // Borda para o cabeçalho

            doc.setTextColor(255, 255, 255); // Branco
            doc.setFont('helvetica', 'bold');
            addText("DADOS DO CLIENTE", clientCol1X + 2, clientSectionY + 4, { fontSize: 8 });
            addText("CÓDIGO", clientCol2X + 2, clientSectionY + 4, { fontSize: 8 });
            addText("TELEFONE", clientCol3X + 2, clientSectionY + 4, { fontSize: 8 });
            doc.setTextColor(0, 0, 0); // Volta para preto padrão
            doc.setFont('helvetica', 'normal');

            // Linha 1 de dados do cliente
            const clientDataY1 = clientSectionY + 6;
            doc.setDrawColor(0);
            doc.rect(clientCol1X, clientDataY1, pageWidth - (2 * marginX) - clientCol1X + marginX, 7, 'S'); // Borda para a linha de dados

            addText(String(orcamento.clienteInfo?.cliente || 'N/A'), clientCol1X + 2, clientDataY1 + 4.5, { fontSize: 9, fontStyle: 'bold' });
            addText(String(orcamento.clienteInfo?.codCliente || 'N/A'), clientCol2X + 2, clientDataY1 + 4.5, { fontSize: 9 });
            addText(String(clienteDetalhes.telefone || 'N/A'), clientCol3X + 2, clientDataY1 + 4.5, { fontSize: 9 });

            // Linha 2 de dados do cliente (Endereço Principal)
            const clientDataY2 = clientDataY1 + 7;
            doc.setDrawColor(0);
            doc.rect(clientCol1X, clientDataY2, pageWidth - (2 * marginX) - clientCol1X + marginX, 7, 'S'); // Borda para a linha de dados

            addText("ENDEREÇO PRINCIPAL", clientCol1X + 2, clientDataY2 + 4.5, { fontSize: 8, textColor: 0 });
            addText("BAIRRO", clientCol2X + 2, clientDataY2 + 4.5, { fontSize: 8, textColor: 0 });
            addText("CIDADE/ESTADO", clientCol3X + 2, clientDataY2 + 4.5, { fontSize: 8, textColor: 0 });

            // Linha 3 de dados do cliente (Detalhes do Endereço)
            const clientDataY3 = clientDataY2 + 7;
            doc.setDrawColor(0);
            doc.rect(clientCol1X, clientDataY3, pageWidth - (2 * marginX) - clientCol1X + marginX, 7, 'S'); // Borda para a linha de dados

            if (clienteDetalhes.enderecos && clienteDetalhes.enderecos.length > 0) {
                const principal = clienteDetalhes.enderecos[0];
                let ruaNumero = `${String(principal.rua || '')}, ${String(principal.numero || '')}`;
                // Ajustar a largura para o texto do endereço para quebrar a linha se necessário
                const maxTextWidth = (clientCol2X - clientCol1X) - 4; // Largura da primeira coluna de dados - padding
                const splitAddress = doc.splitTextToSize(ruaNumero.toUpperCase(), maxTextWidth);
                doc.text(splitAddress, clientCol1X + 2, clientDataY3 + 4.5, { fontSize: 9 });
                
                addText(String(principal.bairro || 'N/A'), clientCol2X + 2, clientDataY3 + 4.5, { fontSize: 9 });
                addText(`${String(principal.cidade || 'N/A')}/${String(principal.estado || 'N/A')}`, clientCol3X + 2, clientDataY3 + 4.5, { fontSize: 9 });
            } else {
                addText("NENHUM ENDEREÇO PRINCIPAL.", clientCol1X + 2, clientDataY3 + 4.5, { fontSize: 9 });
            }

            // Data de Impressão (no canto inferior direito do bloco do cliente)
            const today = new Date();
            const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            addText(formattedDate, pageWidth - marginX - 2, currentY + 40, { fontSize: 12, textColor: 0, align: 'right' });
            doc.setFontSize(10); // Volta ao padrão
            doc.setFont('helvetica', 'normal'); // Volta ao padrão


            currentY += 50; // Espaço após o bloco de informações do cliente

            // --- DETALHES DOS PRODUTOS (TABELA) ---
            // Cabeçalho da tabela de produtos
            addRect(marginX, currentY, pageWidth - (2 * marginX), 8, '#ff8c00'); // Fundo laranja
            doc.setDrawColor(0); // Cor da borda preta
            doc.rect(marginX, currentY, pageWidth - (2 * marginX), 8, 'S'); // Borda para o cabeçalho

            doc.setTextColor(255, 255, 255); // Branco para o cabeçalho da tabela
            doc.setFont('helvetica', 'bold'); // Negrito
            addText("PRODUTO", marginX + 2, currentY + 5, { fontSize: 9 });
            addText("UND", marginX + 90, currentY + 5, { fontSize: 9 }); 
            addText("QTD", marginX + 120, currentY + 5, { fontSize: 9 });
            addText("PESO (KG)", marginX + 170, currentY + 5, { fontSize: 9, align: 'right' });
            addText("PREÇO/KG", marginX + 210, currentY + 5, { fontSize: 9, align: 'right' });
            addText("TOTAL", pageWidth - marginX - 2, currentY + 5, { fontSize: 9, align: 'right' });
            doc.setTextColor(0, 0, 0); // Volta para preto padrão
            doc.setFont('helvetica', 'normal'); // Volta ao padrão


            currentY += 8; // Posição Y após o cabeçalho da tabela

            // Linhas dos itens do pedido
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0); // Texto preto para os itens

            // Posições das linhas verticais da tabela
            const col1X = marginX + 85; // Após PRODUTO
            const col2X = marginX + 115; // Após UND
            const col3X = marginX + 140; // Após QTD
            const col4X = marginX + 195; // Após PESO (KG)
            const col5X = marginX + 235; // Após PREÇO/KG

            orcamento.itensPedido.forEach((item, index) => {
                // Fundo zebrado para as linhas
                if (index % 2 === 0) {
                    addRect(marginX, currentY, pageWidth - (2 * marginX), 7, '#F8F8F8'); // Cinza claro
                } else {
                    addRect(marginX, currentY, pageWidth - (2 * marginX), 7, '#FFFFFF'); // Branco
                }
                doc.setDrawColor(0); // Cor da borda preta
                doc.rect(marginX, currentY, pageWidth - (2 * marginX), 7, 'S'); // Borda para a linha do item

                // Formatar o tipo de peça (ex: "varaReta" para "VARA RETA")
                const formattedTipo = item.tipo.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
                const medidasStr = `${String(item.medidas?.a || '')}${item.medidas?.b ? '/' + String(item.medidas.b) : ''}${item.medidas?.c ? '/' + String(item.medidas.c) : ''}`;
                const produtoDesc = `${formattedTipo} ${String(item.bitola)}MM (${medidasStr} CM)`; // Descrição mais completa

                const precoPorKgItem = (parseFloat(item.pesoKg) > 0) ? (parseFloat(item.custo) / parseFloat(item.pesoKg)) : 0;

                addText(produtoDesc, marginX + 2, currentY + 4.5);
                addText("PC", marginX + 90, currentY + 4.5); // Unidade de medida
                addText(String(item.quantidade || ''), marginX + 120, currentY + 4.5); // Converte para string
                addText(`${parseFloat(item.pesoKg).toFixed(3)}`, marginX + 170, currentY + 4.5, { align: 'right' }); // Peso
                addText(formatCurrency(precoPorKgItem), marginX + 210, currentY + 4.5, { align: 'right' }); // Preço/KG formatado
                addText(formatCurrency(parseFloat(item.custo)), pageWidth - marginX - 2, currentY + 4.5, { align: 'right' }); // Total da linha formatado

                // Linhas verticais para cada linha de item
                doc.line(col1X, currentY, col1X, currentY + 7);
                doc.line(col2X, currentY, col2X, currentY + 7);
                doc.line(col3X, currentY, col3X, currentY + 7); 
                doc.line(col4X, currentY, col4X, currentY + 7);
                doc.line(col5X, currentY, col5X, currentY + 7);


                currentY += 7; // Altura da linha
                if (currentY > pageHeight - 50) { // Nova página se estiver perto do final
                    doc.addPage('l', 'mm', 'a4'); // Adiciona nova página em paisagem
                    currentY = 10;
                    // Recria cabeçalho da tabela
                    addRect(marginX, currentY, pageWidth - (2 * marginX), 8, '#ff8c00'); // Fundo laranja
                    doc.setDrawColor(0);
                    doc.rect(marginX, currentY, pageWidth - (2 * marginX), 8, 'S'); // Borda para o cabeçalho

                    doc.setTextColor(255, 255, 255); // Branco para o cabeçalho da tabela
                    doc.setFont('helvetica', 'bold'); // Negrito
                    addText("PRODUTO", marginX + 2, currentY + 5, { fontSize: 9 });
                    addText("UND", marginX + 90, currentY + 5, { fontSize: 9 });
                    addText("QTD", marginX + 120, currentY + 5, { fontSize: 9 });
                    addText("PESO (KG)", marginX + 170, currentY + 5, { fontSize: 9, align: 'right' });
                    addText("PREÇO/KG", marginX + 210, currentY + 5, { fontSize: 9, align: 'right' });
                    addText("TOTAL", pageWidth - marginX - 2, currentY + 5, { fontSize: 9, align: 'right' });
                    doc.setTextColor(0, 0, 0); // Volta para preto padrão
                    doc.setFont('helvetica', 'normal'); // Volta ao padrão
                    currentY += 8;
                }
            });

            currentY += 5; // Espaçamento após a tabela de itens

            // --- TOTAIS DA TABELA (VALOR TOTAL) ---
            addRect(marginX, currentY, pageWidth - (2 * marginX), 8, '#ff8c00'); // Fundo laranja
            doc.setDrawColor(0);
            doc.rect(marginX, currentY, pageWidth - (2 * marginX), 8, 'S'); // Borda para o total

            doc.setTextColor(255, 255, 255); // Branco para o total
            doc.setFont('helvetica', 'bold'); // Negrito
            addText(`TOTAL: ${formatCurrency(orcamento.resumoGeral.custoTotalGeralNumerico)}`, pageWidth - marginX - 2, currentY + 5, { fontSize: 12, align: 'right' });
            doc.setTextColor(0, 0, 0); // Volta para preto padrão
            doc.setFont('helvetica', 'normal'); // Volta ao padrão

            currentY += 13; // Espaço após os totais da tabela

            // --- SEÇÃO INFERIOR: ENDEREÇO ENTREGA E PREVISÃO ---
            // Ajuste da altura do retângulo para ser mais "quadradinho"
            const deliverySectionHeight = 35; // Altura reduzida
            addRect(marginX, currentY, pageWidth - (2 * marginX), deliverySectionHeight, '#F0F0F0'); // Fundo cinza claro
            doc.setDrawColor(0);
            doc.rect(marginX, currentY, pageWidth - (2 * marginX), deliverySectionHeight, 'S'); // Borda para a seção inferior

            doc.setDrawColor(200); // Cor da linha divisória interna
            doc.line(marginX + (pageWidth - (2 * marginX)) * 0.45, currentY, marginX + (pageWidth - (2 * marginX)) * 0.45, currentY + deliverySectionHeight); // Linha vertical no meio

            // Coluna esquerda da seção inferior
            const leftColX = marginX;

            addText("ENDEREÇO ENTREGA", leftColX + 2, currentY + 5, { fontSize: 8, textColor: 0 });
            addText(String(orcamento.obraInfo?.nome || 'N/A'), leftColX + 2, currentY + 10, { fontSize: 9, textColor: 0, fontStyle: 'bold' }); // Converte para string
            // Endereço de entrega da obra (usando o primeiro endereço do cliente como exemplo, ou da obra se existir)
            const enderecoEntrega = clienteDetalhes.enderecos?.[0] || {};
            let fullAddress = `${String(enderecoEntrega.rua || '')}, ${String(enderecoEntrega.numero || '')} - ${String(enderecoEntrega.bairro || '')}, ${String(enderecoEntrega.cidade || '')}/${String(enderecoEntrega.estado || '')}`;
            // Quebrar a linha do endereço se for muito longo
            const splitAddress = doc.splitTextToSize(fullAddress.toUpperCase(), (pageWidth - (2 * marginX)) * 0.45 - 5); // Ajusta para a largura da coluna
            doc.text(splitAddress, leftColX + 2, currentY + 15, { fontSize: 8, textColor: 0 });


            // Coluna direita da seção inferior
            const rightColX = marginX + (pageWidth - (2 * marginX)) * 0.45 + 5; // Posição X para a coluna da direita

            // Previsão de Entrega (mock data)
            const previsaoEntregaData = new Date();
            previsaoEntregaData.setDate(previsaoEntregaData.getDate() + 7); // Exemplo: 7 dias a partir de hoje
            addText("PREVISÃO DE ENTREGA", rightColX, currentY + 5, { fontSize: 8, textColor: 0 });
            doc.setTextColor(255, 140, 0); // Cor laranja para a previsão de entrega
            doc.setFont('helvetica', 'bold'); // Negrito
            addText(previsaoEntregaData.toLocaleDateString('pt-BR'), rightColX, currentY + 10, { fontSize: 14 }); 
            doc.setTextColor(0, 0, 0); // Volta para preto padrão
            doc.setFont('helvetica', 'normal'); // Volta ao padrão

            currentY += deliverySectionHeight + 5; // Espaço após a seção inferior

            // --- IMAGEM PRINCIPAL NO MEIO (RODAPÉ) ---
            // Posiciona a imagem principal no centro da página, abaixo das seções principais
            // Ajustando largura e altura para tentar melhorar a qualidade e evitar esticamento
            const dafelMainLogoWidth = 100; // Largura ajustada
            const dafelMainLogoHeight = 30; // Altura ajustada
            const dafelMainLogoX = (pageWidth / 2) - (dafelMainLogoWidth / 2);
            addImageToPdfDirect(dafelMainLogoPDF, dafelMainLogoX, currentY + 5, dafelMainLogoWidth, dafelMainLogoHeight, 'JPEG'); 

            currentY += 40; // Espaço após a imagem principal

            // --- RODAPÉ (Exemplo simples) ---
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text("DOCUMENTO GERADO POR CORTAFÁCIL - TODOS OS DIREITOS RESERVADOS.", pageWidth / 2, pageHeight - 5, { align: 'center' });

            // Adiciona QR Code no rodapé (exemplo)
            const qrCodeSize = 25;
            const qrCodeX = pageWidth - marginX - qrCodeSize;
            const qrCodeY = pageHeight - marginX - qrCodeSize + 5; // Ajustado para ficar mais acima do rodapé
            addImageToPdfDirect(qrCodePDF, qrCodeX, qrCodeY, qrCodeSize, qrCodeSize, 'PNG');


            // Salva o PDF
            doc.save(`ORCAMENTO_${String(orcamento.clienteInfo?.cliente || '').replace(/[^A-Z0-9]/g, '_') || "CLIENTE"}_${String(orcamento.obraInfo?.numPedido || 'SEM_PEDIDO').toUpperCase()}.PDF`);
        });
    }

    // --- INICIALIZAÇÃO ---
    // Garante que os campos CNPJ/CPF estejam corretos ao carregar a página
    toggleCpfCnpjFields();
    // Atualiza o resumo inicial (pode ser 0.00 kg, R$ 0.00)
    atualizarResumoBitolas();
    // Valida os campos de medida ao carregar a página
    validarCamposMedida();
}); // FIM DO DOMContentLoaded (ÚNICO FECHAMENTO)
