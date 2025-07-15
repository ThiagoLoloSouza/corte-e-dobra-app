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
        "4.2": 0.109,
        "5.0": 0.154,
        "6.3": 0.249,
        "8.0": 0.395,
        "10.0": 0.617,
        "12.5": 0.962,
        "16.0": 1.578,
        "20.0": 2.466,
        "25.0": 7.30
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
            default: // Caso padrão, todos habilitados ou desabilitados conforme sua lógica inicial
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
                alert('PARA "VARA RETA", APENAS A MEDIDA "A" É NECESSÁRIA. POR FAVOR, LIMPE OS CAMPO "B" E "C".');
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
            const precoPorKg = precosPorKg[bitola];
            const custoTotalPecas = precoPorKg * pesoTotalPecas;

            const novaLinhaTabela = document.createElement('tr');
            novaLinhaTabela.innerHTML = `
                <td data-label="Tipo">${tipo.toUpperCase()}</td>
                <td data-label="Bitola">${bitola} MM</td>
                <td data-label="Medidas">${a}${b ? '/' + b : ''}${c ? '/' + c : ''}</td>
                <td data-label="Qtd">${quantidade}</td>
                <td data-label="Comprimento">${comprimentoCm.toFixed(2)} CM</td>
                <td data-label="Peso">${pesoTotalPecas.toFixed(2)} KG</td>
                <td data-label="Ações"><button class="btn btn-danger btn-excluir"><i class="fas fa-trash-alt"></i> EXCLUIR</button></td>
            `;

            novaLinhaTabela.dataset.bitola = bitola;
            novaLinhaTabela.dataset.peso = pesoTotalPecas.toFixed(2);
            novaLinhaTabela.dataset.custo = custoTotalPecas.toFixed(2); // Armazena o custo para facilitar o recalculo

            novaLinhaTabela.querySelector(".btn-excluir").addEventListener("click", function () {
                const bitolaExcluir = novaLinhaTabela.dataset.bitola;
                const pesoExcluir = parseFloat(novaLinhaTabela.dataset.peso);
                const custoExcluir = parseFloat(novaLinhaTabela.dataset.custo);

                // Subtrai do resumo de bitolas
                if (resumoBitolasCalculo[bitolaExcluir]) {
                    resumoBitolasCalculo[bitolaExcluir] -= pesoExcluir;
                    if (resumoBitolasCalculo[bitolaExcluir] < 0.001) { // Remove se for muito pequeno
                        delete resumoBitolasCalculo[bitolaExcluir];
                    }
                }
                // Subtrai do resumo de custos
                if (resumoCustosCalculo[bitolaExcluir]) {
                    resumoCustosCalculo[bitolaExcluir] -= custoExcluir;
                    if (resumoCustosCalculo[bitolaExcluir] < 0.001) { // Remove se for muito pequeno
                        delete resumoCustosCalculo[bitolaExcluir];
                    }
                }

                // Remove do array linhasOrcamento
                const index = linhasOrcamento.findIndex(item =>
                    item.tipo === tipo &&
                    item.bitola === bitola &&
                    item.medidas.a === a &&
                    item.medidas.b === b &&
                    item.medidas.c === c &&
                    item.quantidade === quantidade
                );
                if (index > -1) {
                    linhasOrcamento.splice(index, 1);
                }

                novaLinhaTabela.remove(); // Remove a linha da tabela HTML
                atualizarResumoBitolas(); // Recalcula e atualiza o resumo
            });

            // Adiciona a peça ao array para geração do PDF
            linhasOrcamento.push({
                tipo,
                bitola,
                medidas: { a, b, c },
                quantidade,
                comprimentoCm,
                pesoKg: pesoTotalPecas,
                custo: custoTotalPecas
            });

            tabelaResultados.appendChild(novaLinhaTabela);

            // Atualiza os totais para o resumo
            resumoBitolasCalculo[bitola] = (resumoBitolasCalculo[bitola] || 0) + pesoTotalPecas;
            resumoCustosCalculo[bitola] = (resumoCustosCalculo[bitola] || 0) + custoTotalPecas;

            atualizarResumoBitolas();

            // Limpa os campos do formulário para a próxima adição
            formPeca.reset();
            validarCamposMedida(); // Reseta os campos b e c
        });
    }


    function atualizarResumoBitolas() {
        if (!resumoBitolasDisplay || !pesoTotalGeralElement || !custoTotalGeralElement) return;

        resumoBitolasDisplay.innerHTML = '';
        let pesoTotalGeral = 0;
        let custoTotalGeral = 0;

        for (const bitola in resumoBitolasCalculo) {
            if (resumoBitolasCalculo.hasOwnProperty(bitola)) {
                const peso = resumoBitolasCalculo[bitola];
                const custo = resumoCustosCalculo[bitola];

                if (peso > 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${bitola} MM</td>
                        <td>${formatWeight(peso)}</td>
                        <td>${formatCurrency(custo)}</td>
                    `;
                    resumoBitolasDisplay.appendChild(row);
                    pesoTotalGeral += peso;
                    custoTotalGeral += custo;
                }
            }
        }
        pesoTotalGeralElement.textContent = formatWeight(pesoTotalGeral);
        custoTotalGeralElement.textContent = formatCurrency(custoTotalGeral);
    }

    // --- Lógica para o campo de busca de cliente (autocomplete/datalist) ---
    const clienteDatalist = document.getElementById('clientesDatalist'); // O datalist em si
    const clienteBuscaInput = document.getElementById('cliente'); // O input ao qual o datalist está vinculado

    if (clienteBuscaInput && clienteDatalist) {
        clienteBuscaInput.addEventListener('input', async function() {
            const searchTerm = clienteBuscaInput.value.trim();
            if (searchTerm.length < 3) { // Só busca se tiver 3 ou mais caracteres
                clienteDatalist.innerHTML = '';
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
                const clientes = await response.json();

                clienteDatalist.innerHTML = ''; // Limpa as opções anteriores
                clientes.forEach(cliente => {
                    const option = document.createElement('option');
                    option.value = cliente.nome; // Exibe o nome no input
                    option.dataset.id = cliente.id; // Armazena o ID no dataset
                    option.dataset.documento = cliente.documento || ''; // Armazena o documento
                    option.dataset.telefone = cliente.telefone || ''; // Armazena o telefone
                    option.dataset.email = cliente.email || ''; // Armazena o email

                    // Adiciona os endereços ao dataset como JSON string
                    if (cliente.enderecos && cliente.enderecos.length > 0) {
                        option.dataset.enderecos = JSON.stringify(cliente.enderecos);
                    } else {
                        option.dataset.enderecos = '[]';
                    }

                    clienteDatalist.appendChild(option);
                });
            } catch (error) {
                console.error('Erro no autocomplete de clientes:', error);
                // Pode adicionar um feedback visual aqui se desejar
            }
        });

        // Evento para quando uma opção do datalist é selecionada (ou o valor é digitado e sai do foco)
        clienteBuscaInput.addEventListener('change', function() {
            const selectedOption = Array.from(clienteDatalist.options).find(
                option => option.value === clienteBuscaInput.value
            );

            if (selectedOption) {
                codClienteInputPrincipal.value = selectedOption.dataset.id || '';
                // Limpa campos de obra e pedido para um novo orçamento ao selecionar um cliente
                if (obraInput) obraInput.value = '';
                if (numPedidoInput) numPedidoInput.value = '';
                if (orcamentoIdInput) orcamentoIdInput.value = ''; // Garante que o ID do orçamento seja limpo
                if (recebeCaminhaoSelect) recebeCaminhaoSelect.value = 'Sim';
                if (dataDesejadaInput) dataDesejadaInput.value = '';

                // Exibe o botão de editar cliente
                if (btnEditarCliente) btnEditarCliente.style.display = 'inline-block';
                
                // Limpa a tabela de peças e o resumo para um novo orçamento
                tabelaResultados.innerHTML = '';
                Object.keys(resumoBitolasCalculo).forEach(key => delete resumoBitolasCalculo[key]);
                Object.keys(resumoCustosCalculo).forEach(key => delete resumoCustosCalculo[key]);
                linhasOrcamento.length = 0;
                atualizarResumoBitolas();

            } else {
                // Se o valor não corresponde a uma opção existente, limpa o código do cliente
                codClienteInputPrincipal.value = '';
                if (btnEditarCliente) btnEditarCliente.style.display = 'none'; // Esconde o botão
            }
        });
    }

    // --- FUNÇÕES DE FORMATAÇÃO ---
    function formatCurrency(value) {
        if (typeof value !== 'number' || isNaN(value)) {
            return 'R$ 0,00';
        }
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatWeight(value) {
        if (typeof value !== 'number' || isNaN(value)) {
            return '0,000 Kg'; // Padrão com 3 casas decimais para peso
        }
        // Garante 3 casas decimais para peso
        return value.toLocaleString('pt-BR', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        }) + ' Kg';
    }


    // --- GERAÇÃO DE PDF (jsPDF) ---
    // Adiciona o script jsPDF dinamicamente se ainda não estiver carregado
    function loadJsPDF(callback) {
        if (typeof jsPDF !== 'undefined') {
            callback();
            return;
        }
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script.onload = () => {
            console.log("jsPDF loaded successfully!");
            callback();
        };
        script.onerror = () => {
            console.error("Failed to load jsPDF script.");
            alert("Erro ao carregar a biblioteca de PDF. Por favor, tente novamente.");
        };
        document.head.appendChild(script);
    }

    // Garante que o html2canvas está carregado
    function loadHtml2Canvas(callback) {
        if (typeof html2canvas !== 'undefined') {
            callback();
            return;
        }
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.onload = () => {
            console.log("html2canvas loaded successfully!");
            callback();
        };
        script.onerror = () => {
            console.error("Failed to load html2canvas script.");
            alert("Erro ao carregar a biblioteca de captura de tela. Por favor, tente novamente.");
        };
        document.head.appendChild(script);
    }

    // Função para adicionar imagem ao PDF diretamente (sem html2canvas)
    function addImageToPdfDirect(doc, imageUrl, x, y, width, height, format = 'JPEG') {
        if (imageUrl) {
            try {
                // `doc.addImage` pode aceitar base64 ou URL de imagem se CORS permitir
                doc.addImage(imageUrl, format, x, y, width, height);
            } catch (e) {
                console.error("Erro ao adicionar imagem ao PDF diretamente:", e);
                // Fallback ou ignorar se a imagem não puder ser carregada
            }
        }
    }


    if (btnGerarPdf) {
        btnGerarPdf.addEventListener('click', async function () {
            // Verifica se há peças no orçamento
            if (linhasOrcamento.length === 0) {
                alert('Não é possível gerar PDF de um orçamento vazio. Adicione peças primeiro.');
                return;
            }

            // Coleta todas as informações necessárias do formulário
            const orcamento = {
                id: orcamentoIdInput.value || 'NOVO',
                dataGeracao: new Date().toLocaleDateString('pt-BR'),
                clienteInfo: {
                    cliente: clienteInputPrincipal.value || 'N/A',
                    codCliente: codClienteInputPrincipal.value || 'N/A',
                    // Não inclui CPF/CNPJ aqui conforme a solicitação
                },
                obraInfo: {
                    nome: obraInput.value || 'N/A',
                    numPedido: numPedidoInput.value || 'N/A',
                    recebeCaminhao: recebeCaminhaoSelect.value || 'N/A',
                    dataDesejada: dataDesejadaInput.value || 'N/A'
                },
                itensPedido: linhasOrcamento,
                resumoBitolas: resumoBitolasCalculo,
                custoTotalGeral: parseFloat(custoTotalGeralElement.textContent.replace('R$', '').replace(/\./g, '').replace(',', '.') || '0'),
                pesoTotalGeral: parseFloat(pesoTotalGeralElement.textContent.replace('Kg', '').replace(/\./g, '').replace(',', '.') || '0')
            };

            loadJsPDF(async () => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                let currentY = 10; // Posição Y inicial

                // --- CABEÇALHO ---
                doc.setFillColor(34, 34, 34); // Cor da tarja escura (um cinza bem escuro)
                doc.rect(0, 0, pageWidth, 40, 'F'); // Tarja escura no topo

                // Título "ORÇAMENTO"
                doc.setTextColor(255, 255, 255); // Branco
                doc.setFont('helvetica', 'bold'); // Negrito
                doc.setFontSize(26); // Tamanho maior
                doc.text("ORÇAMENTO", pageWidth / 2, 25, { align: 'center' }); // Centraliza o título

                // Volta ao normal para os textos abaixo
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);

                // Imagens de acesso e redes sociais (assumindo que são ícones)
                // Você precisará de variáveis para essas imagens (base64 ou URL)
                // Exemplo com placeholders para URLs de imagem (PRECISAM SER REAIS E ACESSÍVEIS OU BASE64)
                // const iconeEstiletes = 'URL_OU_BASE64_ESTILETES';
                // const iconeSite = 'URL_OU_BASE64_SITE';
                // const iconeRedesSociais = 'URL_OU_BASE64_REDESSOCIAIS';

                // Posicione os textos abaixo dos ícones. Coordenadas exatas dependem das imagens.
                doc.setFontSize(8); // Um pouco menor para os links
                doc.setTextColor(255, 255, 255); // Branco para os links de acesso
                doc.text("Acesso as Estiletes", pageWidth - 45, 10); // Exemplo de posição
                doc.text("Acesso no Site", pageWidth - 45, 20);
                doc.text("Redes Sociais", pageWidth - 45, 30);
                doc.setTextColor(0, 0, 0); // Volta para preto padrão para o resto do documento

                currentY = 45; // Posição Y após o cabeçalho

                // --- DADOS DO CLIENTE E OBRA ---
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text("DADOS DO CLIENTE", 10, currentY);
                currentY += 5;
                doc.setDrawColor(150, 150, 150); // Cor da linha

                // Cliente
                doc.setFont('helvetica', 'normal');
                doc.text(`Cliente: ${orcamento.clienteInfo.cliente}`, 10, currentY + 5);
                doc.line(10, currentY + 6, pageWidth - 10, currentY + 6); // Linha
                currentY += 10;

                // Código do Cliente
                doc.text(`Código do Cliente: ${orcamento.clienteInfo.codCliente}`, 10, currentY + 5);
                doc.line(10, currentY + 6, pageWidth - 10, currentY + 6); // Linha
                currentY += 10;

                // Telefone (Se existir no orcamento.clienteInfo, precisa ser passado)
                // Exemplo: if (orcamento.clienteInfo.telefone) { doc.text(`Telefone: ${orcamento.clienteInfo.telefone}`, 10, currentY + 5); doc.line(10, currentY + 6, pageWidth - 10, currentY + 6); currentY += 10; }
                // Email (Se existir no orcamento.clienteInfo, precisa ser passado)
                // Exemplo: if (orcamento.clienteInfo.email) { doc.text(`Email: ${orcamento.clienteInfo.email}`, 10, currentY + 5); doc.line(10, currentY + 6, pageWidth - 10, currentY + 6); currentY += 10; }
                
                // Endereços (se houver, adicione linhas para cada parte do endereço)
                // Para que esta parte funcione, você precisa passar os endereços do cliente para o objeto `orcamento`.
                // Exemplo de como poderia ser, assumindo que `orcamento.clienteInfo.enderecos` é um array:
                /*
                if (orcamento.clienteInfo.enderecos && orcamento.clienteInfo.enderecos.length > 0) {
                    orcamento.clienteInfo.enderecos.forEach((endereco, idx) => {
                        doc.text(`Endereço ${idx + 1}: ${endereco.rua}, ${endereco.numero} - ${endereco.bairro}`, 10, currentY + 5);
                        doc.line(10, currentY + 6, pageWidth - 10, currentY + 6);
                        currentY += 5;
                        doc.text(`${endereco.cidade} - ${endereco.estado}, CEP: ${endereco.cep}`, 10, currentY + 5);
                        doc.line(10, currentY + 6, pageWidth - 10, currentY + 6);
                        currentY += 10;
                    });
                }
                */


                doc.setFont('helvetica', 'bold');
                doc.text("DADOS DA OBRA", 10, currentY + 5);
                currentY += 5;
                doc.setDrawColor(150, 150, 150); // Cor da linha

                doc.setFont('helvetica', 'normal');
                doc.text(`Obra: ${orcamento.obraInfo.nome}`, 10, currentY + 5);
                doc.line(10, currentY + 6, pageWidth - 10, currentY + 6);
                currentY += 10;

                doc.text(`Número do Pedido: ${orcamento.obraInfo.numPedido}`, 10, currentY + 5);
                doc.line(10, currentY + 6, pageWidth - 10, currentY + 6);
                currentY += 10;

                doc.text(`Recebe Caminhão: ${orcamento.obraInfo.recebeCaminhao}`, 10, currentY + 5);
                doc.line(10, currentY + 6, pageWidth - 10, currentY + 6);
                currentY += 10;

                doc.text(`Data Desejada: ${orcamento.obraInfo.dataDesejada}`, 10, currentY + 5);
                doc.line(10, currentY + 6, pageWidth - 10, currentY + 6);
                currentY += 10;


                currentY += 10; // Espaço antes da tabela de itens

                // --- TABELA DE ITENS DO PEDIDO ---
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text("ITENS DO PEDIDO", 10, currentY);
                currentY += 5;
                doc.setDrawColor(0, 0, 0); // Linha preta

                // Cabeçalho da tabela
                const tableStartY = currentY + 5;
                const colWidths = [30, 20, 30, 15, 25, 20, 25]; // Ajuste as larguras das colunas
                const tableHeaders = ["TIPO", "BITOLA", "MEDIDAS", "QTD", "COMPR.", "PESO", "CUSTO"];
                const startX = 10;

                doc.setFillColor(200, 200, 200); // Cor de fundo do cabeçalho da tabela
                doc.rect(startX, tableStartY, colWidths.reduce((a, b) => a + b), 7, 'F'); // Fundo

                doc.setTextColor(0, 0, 0); // Texto preto
                doc.setFont('helvetica', 'bold');
                let colX = startX;
                tableHeaders.forEach((header, index) => {
                    doc.text(header, colX + (colWidths[index] / 2), tableStartY + 5, { align: 'center' });
                    colX += colWidths[index];
                });
                currentY = tableStartY + 7;

                // Dados da tabela
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                orcamento.itensPedido.forEach(item => {
                    // Verifica se a próxima linha excederá a página
                    if (currentY + 6 > pageHeight - 30) { // Margem inferior
                        doc.addPage();
                        currentY = 10; // Volta ao topo da nova página
                        // Recria o cabeçalho da tabela na nova página
                        doc.setFillColor(200, 200, 200);
                        doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b), 7, 'F');
                        doc.setTextColor(0, 0, 0);
                        doc.setFont('helvetica', 'bold');
                        colX = startX;
                        tableHeaders.forEach((header, index) => {
                            doc.text(header, colX + (colWidths[index] / 2), currentY + 5, { align: 'center' });
                            colX += colWidths[index];
                        });
                        currentY += 7;
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(9);
                    }

                    colX = startX;
                    
                    // Ajuste na descrição do produto para adicionar espaços
                    let tipoDisplay = item.tipo.toUpperCase();
                    tipoDisplay = tipoDisplay.replace(/VARAL/g, 'VARA L');
                    tipoDisplay = tipoDisplay.replace(/VARARETA/g, 'VARA RETA');
                    tipoDisplay = tipoDisplay.replace(/TUBOC/g, 'TUBO C');
                    tipoDisplay = tipoDisplay.replace(/CHAPADOBRADA/g, 'CHAPA DOBRADA');
                    // Adicione mais regras de substituição conforme necessário.

                    doc.text(tipoDisplay, colX + (colWidths[0] / 2), currentY + 5, { align: 'center' });
                    colX += colWidths[0];
                    doc.text(`${item.bitola} MM`, colX + (colWidths[1] / 2), currentY + 5, { align: 'center' });
                    colX += colWidths[1];
                    doc.text(`${item.medidas.a}${item.medidas.b ? '/' + item.medidas.b : ''}${item.medidas.c ? '/' + item.medidas.c : ''}`, colX + (colWidths[2] / 2), currentY + 5, { align: 'center' });
                    colX += colWidths[2];
                    doc.text(`${item.quantidade}`, colX + (colWidths[3] / 2), currentY + 5, { align: 'center' });
                    colX += colWidths[3];
                    doc.text(`${item.comprimentoCm.toFixed(2)} CM`, colX + (colWidths[4] / 2), currentY + 5, { align: 'center' });
                    colX += colWidths[4];
                    doc.text(formatWeight(item.pesoKg), colX + (colWidths[5] / 2), currentY + 5, { align: 'center' });
                    colX += colWidths[5];
                    doc.text(formatCurrency(item.custo), colX + (colWidths[6] / 2), currentY + 5, { align: 'center' });
                    colX += colWidths[6];

                    currentY += 6; // Espaçamento entre as linhas
                    doc.line(startX, currentY, startX + colWidths.reduce((a, b) => a + b), currentY); // Linha divisória
                });

                currentY += 10; // Espaço após a tabela

                // --- RESUMO POR BITOLA ---
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text("RESUMO POR BITOLA", 10, currentY);
                currentY += 5;
                doc.setDrawColor(0, 0, 0); // Linha preta

                // Cabeçalho do resumo
                const resumoTableStartY = currentY + 5;
                const resumoColWidths = [30, 30, 30];
                const resumoTableHeaders = ["BITOLA", "PESO", "CUSTO"];

                doc.setFillColor(200, 200, 200);
                doc.rect(startX, resumoTableStartY, resumoColWidths.reduce((a, b) => a + b), 7, 'F');

                doc.setTextColor(0, 0, 0);
                colX = startX;
                resumoTableHeaders.forEach((header, index) => {
                    doc.text(header, colX + (resumoColWidths[index] / 2), resumoTableStartY + 5, { align: 'center' });
                    colX += resumoColWidths[index];
                });
                currentY = resumoTableStartY + 7;

                // Dados do resumo
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                for (const bitola in orcamento.resumoBitolas) {
                    if (orcamento.resumoBitolas.hasOwnProperty(bitola)) {
                        const peso = orcamento.resumoBitolas[bitola];
                        const custo = orcamento.custoTotalGeral * (peso / orcamento.pesoTotalGeral); // Proporcional
                        // Ou, se você tem resumoCustosCalculo no objeto orcamento:
                        const custoBitola = orcamento.resumoCustos ? orcamento.resumoCustos[bitola] : 0;


                        colX = startX;
                        doc.text(`${bitola} MM`, colX + (resumoColWidths[0] / 2), currentY + 5, { align: 'center' });
                        colX += resumoColWidths[0];
                        doc.text(formatWeight(peso), colX + (resumoColWidths[1] / 2), currentY + 5, { align: 'center' });
                        colX += resumoColWidths[1];
                        doc.text(formatCurrency(custoBitola), colX + (resumoColWidths[2] / 2), currentY + 5, { align: 'center' });
                        colX += resumoColWidths[2];

                        currentY += 6;
                        doc.line(startX, currentY, startX + resumoColWidths.reduce((a, b) => a + b), currentY);
                    }
                }

                currentY += 10; // Espaço antes dos totais

                // --- TOTAIS GERAIS ---
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');

                const totalLeftX = pageWidth - 70; // Posição para alinhar os totais à direita
                doc.text(`TOTAL PESO: ${formatWeight(orcamento.pesoTotalGeral)}`, totalLeftX, currentY);
                currentY += 7;
                doc.text(`TOTAL CUSTO: ${formatCurrency(orcamento.custoTotalGeral)}`, totalLeftX, currentY);
                currentY += 15;

                // --- SEÇÃO DE APROVAÇÃO / ASSINATURA ---
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text("APROVAÇÃO DO CLIENTE", 10, currentY);
                currentY += 10;
                doc.line(20, currentY + 10, pageWidth - 20, currentY + 10); // Linha para assinatura
                doc.text("Nome:________________________________________", 20, currentY + 15);
                doc.text("Data: ____/____/________", pageWidth - 60, currentY + 15);
                currentY += 25;

                // --- INFORMAÇÕES ADICIONAIS / Observações ---
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text("OBSERVAÇÕES:", 10, currentY);
                currentY += 5;
                doc.setFont('helvetica', 'normal');
                // Adicione observações dinâmicas se houver
                doc.text("Prazo de entrega a combinar.", 10, currentY + 5);
                doc.text("Orçamento válido por 7 dias.", 10, currentY + 10);
                currentY += 20;

                // --- INFORMAÇÕES DE CONTATO DA EMPRESA (Inferior) ---
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100); // Um cinza claro para o rodapé
                doc.text("Telefone: (XX) XXXX-XXXX | Email: contato@suaempresa.com.br", pageWidth / 2, pageHeight - 20, { align: 'center' });
                doc.text("Site: www.suaempresa.com.br", pageWidth / 2, pageHeight - 15, { align: 'center' });
                doc.setFontSize(10); // Volta ao padrão para a data

                // Data de Geração (no canto inferior direito)
                const rightColX = pageWidth - 10; // Margem direita
                doc.setFontSize(14); // Fonte maior para a data
                doc.setFont('helvetica', 'bold'); // Negrito
                doc.setTextColor(255, 165, 0); // Laranja
                doc.text(orcamento.dataGeracao, rightColX, currentY + 10, { align: 'right' }); // Laranja
                doc.setTextColor(0, 0, 0); // Volta para preto padrão
                doc.setFont('helvetica', 'normal'); // Volta ao padrão

                currentY += 55; // Espaço após a seção inferior

                // --- IMAGEM PRINCIPAL NO MEIO (RODAPÉ) ---
                // Posiciona a imagem principal no centro da página, abaixo das seções principais
                // Adicione a URL ou Base64 da sua imagem. Ex: const dafelMainLogoPDF = "sua_logo_base64_ou_url";
                // addImageToPdfDirect(dafelMainLogoPDF, pageWidth / 2 - 50, currentY + 5, 100, 30, 'JPEG'); // Ajuste as dimensões conforme necessário

                currentY += 40; // Espaço após a imagem principal

                // --- RODAPÉ (Exemplo simples) ---
                doc.setFontSize(7);
                doc.setTextColor(100, 100, 100);
                doc.text("DOCUMENTO GERADO POR CORTAFÁCIL - TODOS OS DIREITOS RESERVADOS.", pageWidth / 2, pageHeight - 5, { align: 'center' });


                // Salva o PDF
                doc.save(`ORCAMENTO_${String(orcamento.clienteInfo?.cliente || '').replace(/[^A-Z0-9]/g, '_') || "CLIENTE"}_${String(orcamento.obraInfo?.numPedido || 'SEM_PEDIDO').toUpperCase()}.PDF`);
            });
        });
    }

    // --- INICIALIZAÇÃO ---
    // Garante que os campos CNPJ/CPF estejam corretos ao carregar a página
    validarCamposMedida();
});