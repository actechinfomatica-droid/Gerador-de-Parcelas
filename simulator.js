document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let products = [{ id: 1, name: '', cost: 0, price: 0, qty: 1 }];
    let tradeIn = [];
    let nextProductId = 2;
    let nextTradeInId = 1;
    let selectedPaymentMethod = 'credito';
    let selectedBrand = 'visa_master';
    let selectedInstallment = 1;

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

    let machineFeePercent = ratesVisaMaster[1]; // Default Crédito 1x

    // --- DOM Elements ---
    const productsContainer = document.getElementById('products-container');
    const tradeinContainer = document.getElementById('tradein-container');
    const addProductBtn = document.getElementById('add-product-btn');
    const addTradeinBtn = document.getElementById('add-tradein-btn');
    const paymentMethodBtns = document.querySelectorAll('.payment-method-btn');
    const creditOptionsContainer = document.getElementById('credit-options-container');
    const brandRadios = document.querySelectorAll('input[name="card_brand"]');
    
    // Custom Dropdown Elements
    const customSelect = document.getElementById('installment-custom-select');
    const selectSelected = customSelect.querySelector('.select-selected');
    const selectItems = customSelect.querySelector('.select-items');
    const options = selectItems.querySelectorAll('div');

    // Summary Elements
    const sumSalesEl = document.getElementById('sum-sales');
    const sumCostsEl = document.getElementById('sum-costs');
    const rowTradein = document.getElementById('row-tradein');
    const sumTradeinEl = document.getElementById('sum-tradein');
    const cardAmountEl = document.getElementById('card-amount');
    const activeFeeLabel = document.getElementById('active-fee-label');
    const sumFeesEl = document.getElementById('sum-fees');
    const netProfitEl = document.getElementById('net-profit');
    const profitMarginEl = document.getElementById('profit-margin');
    const dashboard = document.getElementById('profit-dashboard');
    const alertMessage = document.getElementById('alert-message');

    // --- Utility Functions ---
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const parseMoney = (valueStr) => {
        if (!valueStr) return 0;
        // Allows both "1000.50" and "1000,50"
        return parseFloat(valueStr.toString().replace(/\./g, '').replace(',', '.')) || 0;
    };

    // --- Core Logic ---
    const calculateTotals = () => {
        let totalSales = 0;
        let totalCosts = 0;
        let totalTradeIn = 0;

        // Calculate Products
        products.forEach(p => {
            totalSales += p.price * p.qty;
            totalCosts += p.cost * p.qty;
        });

        // Calculate Trade-ins
        tradeIn.forEach(t => {
            totalTradeIn += t.value;
        });

        // Calculate Finance
        // Montante no Cartão = Total Venda - Total Retoma (Não pode ser negativo)
        const checkAmountOnCard = totalSales - totalTradeIn;
        const amountOnCard = checkAmountOnCard > 0 ? checkAmountOnCard : 0; 
        
        if (selectedPaymentMethod === 'pix') {
            machineFeePercent = 0;
        } else if (selectedPaymentMethod === 'debito') {
            machineFeePercent = 1.99;
        } else {
            const rates = selectedBrand === 'visa_master' ? ratesVisaMaster : ratesOther;
            machineFeePercent = rates[parseInt(selectedInstallment)] || 0;
        }

        const machineFeeValue = amountOnCard * (machineFeePercent / 100);
        
        // Lucro Líquido = Total Venda Bruta - Taxa Cartão - Custo Produtos
        // (A retoma não entra na soma do lucro porque o valor dela já compunha o preço de venda. Ela só abate a taxa de cartão.)
        const netProfit = totalSales - machineFeeValue - totalCosts;
        
        let profitMargin = 0;
        if (totalSales > 0) {
            profitMargin = (netProfit / totalSales) * 100;
        }

        updateDashboardUI(totalSales, totalCosts, totalTradeIn, amountOnCard, machineFeeValue, netProfit, profitMargin);
    };

    const updateDashboardUI = (sales, costs, tradein, cardAmount, fees, profit, margin) => {
        sumSalesEl.textContent = formatCurrency(sales);
        sumCostsEl.textContent = `- ${formatCurrency(costs)}`;
        
        if (tradein > 0) {
            rowTradein.style.display = 'flex';
            sumTradeinEl.textContent = `(Abate) ${formatCurrency(tradein)}`;
        } else {
            rowTradein.style.display = 'none';
        }

        cardAmountEl.textContent = formatCurrency(cardAmount);
        sumFeesEl.textContent = `- ${formatCurrency(fees)}`;
        activeFeeLabel.textContent = `${machineFeePercent.toFixed(2)}%`;
        
        netProfitEl.textContent = formatCurrency(profit);
        profitMarginEl.textContent = `${margin.toFixed(1)}%`;

        // Reset classes
        dashboard.className = 'summary-card glassmorphism profit-dashboard';
        alertMessage.style.display = 'none';

        if (sales === 0) return; // Neutral state if empty

        // Apply health themes
        if (margin > 10) {
            dashboard.classList.add('health-good');
        } else if (margin >= 0) {
            dashboard.classList.add('health-warn');
        } else {
            dashboard.classList.add('health-danger');
            alertMessage.style.display = 'block';
        }
    };

    // --- Render Functions ---
    const renderProducts = () => {
        productsContainer.innerHTML = '';
        products.forEach((p, index) => {
            const html = `
                <div class="item-row" data-id="${p.id}">
                    <div class="form-group">
                        <label>Qtd</label>
                        <input type="number" class="p-qty" value="${p.qty}" min="1">
                    </div>
                    <div class="form-group">
                        <label>Modelo (Opcional)</label>
                        <input type="text" class="p-name" value="${p.name}" placeholder="Ex: iPhone 13">
                    </div>
                    <div class="form-group">
                        <label>Custo Unit.</label>
                        <input type="number" class="p-cost" value="${p.cost || ''}" step="0.01" placeholder="R$ 0,00">
                    </div>
                    <div class="form-group">
                        <label>Venda Unit.</label>
                        <input type="number" class="p-price" value="${p.price || ''}" step="0.01" placeholder="R$ 0,00">
                    </div>
                    ${products.length > 1 ? `
                    <button class="remove-btn remove-product" title="Remover Produto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    ` : '<div style="width: 40px;"></div>'}
                </div>
            `;
            productsContainer.insertAdjacentHTML('beforeend', html);
        });
        attachProductEvents();
    };

    const renderTradeIn = () => {
        tradeinContainer.innerHTML = '';
        if (tradeIn.length === 0) {
            tradeinContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-size: 0.9rem; padding: 10px;">Nenhum aparelho na retoma.</div>';
            return;
        }

        tradeIn.forEach((t) => {
            const html = `
                <div class="item-row tradein-row" data-id="${t.id}">
                    <div class="form-group">
                        <label>Modelo do Aparelho</label>
                        <input type="text" class="t-name" value="${t.name}" placeholder="Ex: iPhone 11 (Usado)">
                    </div>
                    <div class="form-group">
                        <label>Valor de Avaliação</label>
                        <input type="number" class="t-value" value="${t.value || ''}" step="0.01" placeholder="R$ 0,00">
                    </div>
                    <button class="remove-btn remove-tradein" title="Remover Retoma">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `;
            tradeinContainer.insertAdjacentHTML('beforeend', html);
        });
        attachTradeInEvents();
    };

    // --- Event Listeners Attachment ---
    const attachProductEvents = () => {
        const rows = document.querySelectorAll('#products-container .item-row');
        rows.forEach(row => {
            const id = parseInt(row.getAttribute('data-id'));
            
            row.querySelector('.p-qty').addEventListener('input', (e) => {
                const p = products.find(p => p.id === id);
                p.qty = parseInt(e.target.value) || 1;
                calculateTotals();
            });
            row.querySelector('.p-name').addEventListener('input', (e) => {
                const p = products.find(p => p.id === id);
                p.name = e.target.value;
            });
            row.querySelector('.p-cost').addEventListener('input', (e) => {
                const p = products.find(p => p.id === id);
                p.cost = parseFloat(e.target.value) || 0;
                calculateTotals();
            });
            row.querySelector('.p-price').addEventListener('input', (e) => {
                const p = products.find(p => p.id === id);
                p.price = parseFloat(e.target.value) || 0;
                calculateTotals();
            });

            const removeBtn = row.querySelector('.remove-product');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    products = products.filter(p => p.id !== id);
                    renderProducts();
                    calculateTotals();
                });
            }
        });
    };

    const attachTradeInEvents = () => {
        const rows = document.querySelectorAll('#tradein-container .item-row');
        rows.forEach(row => {
            const id = parseInt(row.getAttribute('data-id'));
            
            row.querySelector('.t-name').addEventListener('input', (e) => {
                const t = tradeIn.find(t => t.id === id);
                t.name = e.target.value;
            });
            row.querySelector('.t-value').addEventListener('input', (e) => {
                const t = tradeIn.find(t => t.id === id);
                t.value = parseFloat(e.target.value) || 0;
                calculateTotals();
            });

            const removeBtn = row.querySelector('.remove-tradein');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    tradeIn = tradeIn.filter(t => t.id !== id);
                    renderTradeIn();
                    calculateTotals();
                });
            }
        });
    };

    // --- Global Events ---
    addProductBtn.addEventListener('click', () => {
        products.push({ id: nextProductId++, name: '', cost: 0, price: 0, qty: 1 });
        renderProducts();
        calculateTotals();
    });

    addTradeinBtn.addEventListener('click', () => {
        tradeIn.push({ id: nextTradeInId++, name: '', value: 0 });
        renderTradeIn();
        calculateTotals();
    });

    // --- Payment Methods Logic ---
    paymentMethodBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update UI
            paymentMethodBtns.forEach(b => {
                b.classList.remove('active');
                b.style.borderColor = 'var(--border-color)';
                b.style.background = 'rgba(255, 255, 255, 0.03)';
                b.style.color = 'var(--text-primary)';
            });
            
            const target = e.target;
            target.classList.add('active');
            target.style.borderColor = 'var(--primary)';
            target.style.background = 'rgba(99, 102, 241, 0.1)';
            target.style.color = 'var(--primary)';
            
            // Set State
            selectedPaymentMethod = target.getAttribute('data-method');
            
            // Toggle Credit Options
            if (selectedPaymentMethod === 'credito') {
                creditOptionsContainer.style.display = 'flex';
            } else {
                creditOptionsContainer.style.display = 'none';
            }
            
            calculateTotals();
        });
    });

    brandRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedBrand = e.target.value;
                calculateTotals();
            }
        });
    });

    // --- Custom Dropdown Logic ---
    selectSelected.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('select-arrow-active');
        selectItems.classList.toggle('select-hide');
    });

    options.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Update UI
            selectSelected.innerHTML = this.innerHTML;
            options.forEach(opt => opt.classList.remove('same-as-selected'));
            this.classList.add('same-as-selected');
            
            // Close dropdown
            selectSelected.classList.remove('select-arrow-active');
            selectItems.classList.add('select-hide');
            
            // Trigger logic
            selectedInstallment = this.getAttribute('data-value');
            calculateTotals();
        });
    });

    // Close the dropdown if the user clicks anywhere outside of it
    document.addEventListener('click', function() {
        selectSelected.classList.remove('select-arrow-active');
        selectItems.classList.add('select-hide');
    });

    // --- Init ---
    renderProducts();
    renderTradeIn();
    calculateTotals();
});
