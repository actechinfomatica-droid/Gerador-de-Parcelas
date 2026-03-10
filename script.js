document.addEventListener('DOMContentLoaded', () => {
    const amountInput = document.getElementById('amount');
    const extraTaxInput = document.getElementById('extra-tax');
    const installmentsContainer = document.getElementById('installments-container');
    const summaryProduct = document.getElementById('summary-product');
    const summaryTaxLabel = document.getElementById('summary-tax-label');
    const summaryTaxValue = document.getElementById('summary-tax-value');
    const summaryInstallments = document.getElementById('summary-installments');
    const summaryBuyer = document.getElementById('summary-buyer');
    const summarySeller = document.getElementById('summary-seller');
    const brandRadios = document.querySelectorAll('input[name="card_brand"]');
    const modeRadios = document.querySelectorAll('input[name="tax_mode"]');
    
    // Configurações
    const MAX_INSTALLMENTS = 18;
    
    const ratesVisaMaster = {
        1: 3.65, 2: 5.09, 3: 5.78, 4: 6.59, 5: 7.10, 6: 7.91,
        7: 8.69, 8: 9.56, 9: 9.98, 10: 10.63, 11: 11.36, 12: 11.90,
        13: 13.52, 14: 13.95, 15: 14.76, 16: 15.29, 17: 15.89, 18: 16.49
    };

    const ratesOther = {
        1: 4.49, 2: 5.89, 3: 6.99, 4: 7.67, 5: 7.99, 6: 8.54,
        7: 10.27, 8: 10.99, 9: 11.48, 10: 12.22, 11: 12.99, 12: 13.29,
        13: 14.19, 14: 14.74, 15: 15.36, 16: 16.09, 17: 16.58, 18: 17.17
    };
    
    let currentAmount = parseFloat(amountInput.value) || 0;
    let extraTax = extraTaxInput ? (parseFloat(extraTaxInput.value) || 0) : 0;
    let selectedInstallment = 1;
    let selectedBrand = 'visa_master';
    let taxMode = 'discount'; // 'discount' (Descontar) ou 'add' (Repassar)

    // Formatador de Moeda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getCalculatedValues = (amount, installments, brand, extraTx, mode) => {
        if (amount <= 0) return { buyerPays: 0, sellerReceives: 0, installmentValue: 0, totalRate: 0, taxAmount: 0 };
        
        const rates = brand === 'visa_master' ? ratesVisaMaster : ratesOther;
        const rate = rates[installments] || 0;
        
        let buyerPays, sellerReceives;
        
        // Se houver extraTx (e estamos no modo repassar), calculamos o valor extra para o estabelecimento
        const extraAmount = amount * (extraTx / 100);
        
        if (mode === 'add') { // Repassar taxa
            const targetAmountForSeller = amount + extraAmount;
            // O cliente paga as taxas do cartão sobre o (amount + extra)
            buyerPays = targetAmountForSeller / (1 - rate / 100);
            sellerReceives = targetAmountForSeller;
        } else { // Descontar taxa
            buyerPays = amount;
            sellerReceives = amount * (1 - rate / 100);
        }
        
        return {
            buyerPays,
            sellerReceives,
            installmentValue: buyerPays / installments,
            totalRate: rate,
            taxAmount: buyerPays - sellerReceives + (mode === 'add' ? extraAmount : 0) // a diferença entre o q pagam e recebem
        };
    };

    // Renderiza a lista de parcelas
    const renderInstallments = () => {
        installmentsContainer.innerHTML = '';
        
        if (currentAmount <= 0) {
            installmentsContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-secondary);">Insira um valor válido para simular as parcelas.</div>';
            return;
        }

        for (let i = 1; i <= MAX_INSTALLMENTS; i++) {
            const vals = getCalculatedValues(currentAmount, i, selectedBrand, extraTax, taxMode);
            const hasInterest = vals.totalRate > 0;
            
            const item = document.createElement('div');
            item.className = `installment-item ${i === selectedInstallment ? 'active' : ''}`;
            
            // Labels
            const interestLabel = hasInterest 
                ? `<div class="installment-interest">Taxa ${vals.totalRate.toFixed(2).replace('.', ',')}%</div>` 
                : `<div class="installment-interest text-success">Sem juros</div>`;
            
            const extraTaxLabel = (taxMode === 'add' && extraTax > 0)
                ? `<div class="installment-interest" style="color: var(--primary); font-weight: 500; font-size: 0.8rem; margin-top: 2px;">+ ${extraTax.toFixed(2).replace('.', ',')}% Extra</div>`
                : '';
                
            item.innerHTML = `
                <label class="installment-label" style="align-items: center;">
                    <div class="radio-container" style="flex: 1;">
                        <input type="radio" name="installment" class="radio-input" value="${i}" ${i === selectedInstallment ? 'checked' : ''}>
                        <div class="radio-custom"></div>
                        
                        <div class="installment-details">
                            <span class="installment-title" style="font-size: 1.1rem; font-weight: 700; color: var(--primary);">${i}x</span>
                            <span style="font-weight: 600; font-size: 0.95rem; margin-top: 2px;">${formatCurrency(vals.installmentValue)}</span>
                            ${interestLabel}
                            ${extraTaxLabel}
                        </div>
                    </div>
                    
                    <div class="installment-amounts" style="display: flex; flex-direction: column; text-align: right; gap: 8px; border-left: 1px solid var(--border-color); padding-left: 14px;">
                        <div style="display: flex; flex-direction: column; line-height: 1.2;">
                            <span style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Cliente paga</span>
                            <span style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${formatCurrency(vals.buyerPays)}</span>
                        </div>
                        <div style="display: flex; flex-direction: column; line-height: 1.2;">
                            <span style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Você recebe</span>
                            <span style="font-size: 0.95rem; font-weight: 700; color: var(--success);">${formatCurrency(vals.sellerReceives)}</span>
                        </div>
                    </div>
                </label>
            `;
            
            // Adicionar evento de clique para atualizar a seleção
            const radioInput = item.querySelector('.radio-input');
            radioInput.addEventListener('change', (e) => {
                selectedInstallment = parseInt(e.target.value);
                updateSelection();
            });

            installmentsContainer.appendChild(item);
        }
    };

    // Atualiza a interface da seleção atual (Resumo e Active State)
    const updateSelection = () => {
        // Atualiza as classes ativas
        document.querySelectorAll('.installment-item').forEach((item, index) => {
            const input = item.querySelector('.radio-input');
            if (input.checked) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Atualiza o Resumo
        const vals = getCalculatedValues(currentAmount, selectedInstallment, selectedBrand, extraTax, taxMode);

        if (summaryProduct) summaryProduct.textContent = formatCurrency(currentAmount);
        if (summaryTaxLabel) summaryTaxLabel.textContent = `Taxa Cartão (${vals.totalRate.toFixed(2).replace('.', ',')}%)`;
        if (summaryTaxValue) summaryTaxValue.textContent = `- ${formatCurrency(vals.taxAmount - extraTaxInput.value * currentAmount / 100)}`; // display just card tax
        
        let extraRow = document.getElementById('summary-extra-row');
        if (!extraRow) {
            extraRow = document.createElement('div');
            extraRow.id = 'summary-extra-row';
            extraRow.className = 'summary-row';
            
            // Insert before installments
            const detailsDiv = document.querySelector('.summary-details');
            if (detailsDiv) {
                const taxRow = detailsDiv.children[1];
                taxRow.insertAdjacentElement('afterend', extraRow);
            }
        }
        
        if (taxMode === 'add' && extraTax > 0) {
            extraRow.style.display = 'flex';
            extraRow.innerHTML = `
                <span style="color: var(--primary);">Extra para Você (${extraTax.toFixed(2).replace('.', ',')}%)</span>
                <span style="color: var(--success);">+ ${formatCurrency(currentAmount * (extraTax / 100))}</span>
            `;
        } else {
            extraRow.style.display = 'none';
        }
        if (summaryInstallments) summaryInstallments.textContent = `${selectedInstallment}x`;
        if (summaryBuyer) summaryBuyer.textContent = formatCurrency(vals.buyerPays);
        if (summarySeller) summarySeller.textContent = formatCurrency(vals.sellerReceives);
    };

    const toggleExtraTaxVisibility = () => {
        const extraTaxContainer = document.getElementById('extra-tax-container');
        if (extraTaxContainer) {
            extraTaxContainer.style.display = taxMode === 'add' ? 'flex' : 'none';
        }
    };

    // Eventos de Modo (Descontar / Repassar)
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                taxMode = e.target.value;
                
                document.querySelectorAll('.mode-radio').forEach(label => {
                    if (label.querySelector('input').checked) {
                        label.style.borderColor = 'var(--primary)';
                        label.style.boxShadow = 'var(--shadow-glow)';
                    } else {
                        label.style.borderColor = 'var(--border-color)';
                        label.style.boxShadow = 'none';
                    }
                });

                toggleExtraTaxVisibility();
                renderInstallments();
                updateSelection();
            }
        });
    });

    // Eventos Extra Tax
    if (extraTaxInput) {
        extraTaxInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            extraTax = isNaN(val) ? 0 : val;
            renderInstallments();
            updateSelection();
        });
    }

    // Eventos de Bandeira
    brandRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedBrand = e.target.value;
                renderInstallments();
                updateSelection();
            }
        });
    });

    // Eventos do Input
    amountInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        currentAmount = isNaN(val) ? 0 : val;
        
        // Re-renderizar tudo
        renderInstallments();
        updateSelection();
    });

    // Inicialização Inicial
    toggleExtraTaxVisibility();
    renderInstallments();
    updateSelection();
});
