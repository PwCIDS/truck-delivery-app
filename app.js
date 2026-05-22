const db = new Database();
let currentView = 'calendar';
let currentMonth = new Date();
let destinations = [];
let currentTruckSearch = null;
let currentCustomerSearch = null;
let currentSortField = null;
let currentSortOrder = 'desc';

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initDeliveryManagement();
    initTruckManagement();
    initCustomerManagement();
    initDataManagement();
    initReportsManagement();
    initKeyboardShortcuts();
    loadDashboard();
});

function initNavigation() {
    document.getElementById('nav-dashboard').addEventListener('click', () => switchSection('dashboard'));
    document.getElementById('nav-delivery').addEventListener('click', () => switchSection('delivery'));
    document.getElementById('nav-trucks').addEventListener('click', () => switchSection('trucks'));
    document.getElementById('nav-customers').addEventListener('click', () => switchSection('customers'));
    document.getElementById('nav-reports').addEventListener('click', () => switchSection('reports'));
    document.getElementById('nav-data').addEventListener('click', () => switchSection('data'));
}

function switchSection(section) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));

    document.getElementById(`nav-${section}`).classList.add('active');
    document.getElementById(`${section}-section`).classList.add('active');

    if (section === 'dashboard') {
        loadDashboard();
    } else if (section === 'delivery') {
        loadDeliveryView();
    } else if (section === 'trucks') {
        loadTrucksList();
    } else if (section === 'customers') {
        loadCustomersList();
    } else if (section === 'reports') {
        loadReportsView();
    } else if (section === 'data') {
        // データ管理画面は特に読み込み処理なし
    }
}

function initDeliveryManagement() {
    document.getElementById('view-calendar').addEventListener('click', () => switchView('calendar'));
    document.getElementById('view-list').addEventListener('click', () => switchView('list'));

    document.getElementById('add-delivery').addEventListener('click', openDeliveryModal);
    document.getElementById('cancel-delivery').addEventListener('click', closeDeliveryModal);

    const deliveryModal = document.getElementById('delivery-modal');
    deliveryModal.querySelector('.close').addEventListener('click', closeDeliveryModal);

    document.getElementById('delivery-form').addEventListener('submit', handleDeliverySubmit);

    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));

    document.getElementById('search-delivery').addEventListener('input', filterDeliveries);
    document.getElementById('filter-truck').addEventListener('change', filterDeliveries);
    document.getElementById('filter-customer').addEventListener('change', filterDeliveries);
    document.getElementById('filter-status').addEventListener('change', filterDeliveries);
    document.getElementById('filter-start-date').addEventListener('change', filterDeliveries);
    document.getElementById('filter-end-date').addEventListener('change', filterDeliveries);
    document.getElementById('clear-filters').addEventListener('click', clearDeliveryFilters);

    document.getElementById('add-destination').addEventListener('click', addDestination);
    document.getElementById('destination-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addDestination();
        }
    });

    document.getElementById('print-delivery').addEventListener('click', printDeliveryView);

    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', function() {
            const sortField = this.getAttribute('data-sort');
            sortDeliveries(sortField);
        });
    });

    initSearchableSelect('delivery-truck', 'trucks');
    initSearchableSelect('delivery-customer', 'customers');
}

function initSearchableSelect(fieldName, dataType) {
    const searchInput = document.getElementById(`${fieldName}-search`);
    const hiddenInput = document.getElementById(fieldName);
    const optionsDiv = document.getElementById(`${fieldName}-options`);
    const selectedDiv = document.getElementById(`${fieldName}-selected`);

    searchInput.addEventListener('focus', function() {
        showOptions(fieldName, dataType, '');
    });

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        showOptions(fieldName, dataType, query);
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest(`#${fieldName}-search`) && !e.target.closest(`#${fieldName}-options`)) {
            optionsDiv.classList.remove('active');
        }
    });
}

function showOptions(fieldName, dataType, query) {
    const optionsDiv = document.getElementById(`${fieldName}-options`);
    let items = [];

    if (dataType === 'trucks') {
        items = db.getAllTrucks();
    } else if (dataType === 'customers') {
        items = db.getAllCustomers();
    }

    const filtered = items.filter(item => {
        if (dataType === 'trucks') {
            return item.number.toLowerCase().includes(query) ||
                   item.plate.toLowerCase().includes(query);
        } else if (dataType === 'customers') {
            return item.name.toLowerCase().includes(query) ||
                   item.code.toLowerCase().includes(query) ||
                   (item.address && item.address.toLowerCase().includes(query));
        }
        return false;
    });

    optionsDiv.innerHTML = '';
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'select-option';

        if (dataType === 'trucks') {
            div.textContent = `${item.number} - ${item.plate} (${item.capacity}kg)`;
        } else if (dataType === 'customers') {
            div.textContent = `${item.code} - ${item.name}`;
        }

        div.addEventListener('click', () => selectOption(fieldName, dataType, item));
        optionsDiv.appendChild(div);
    });

    optionsDiv.classList.add('active');
}

function selectOption(fieldName, dataType, item) {
    const searchInput = document.getElementById(`${fieldName}-search`);
    const hiddenInput = document.getElementById(fieldName);
    const optionsDiv = document.getElementById(`${fieldName}-options`);
    const selectedDiv = document.getElementById(`${fieldName}-selected`);

    hiddenInput.value = item.id;

    if (dataType === 'trucks') {
        searchInput.value = '';
        selectedDiv.innerHTML = `
            <span>${item.number} - ${item.plate} (${item.capacity}kg)</span>
            <button type="button" class="remove-btn" onclick="clearSelection('${fieldName}', '${dataType}')">&times;</button>
        `;
    } else if (dataType === 'customers') {
        searchInput.value = '';
        selectedDiv.innerHTML = `
            <span>${item.code} - ${item.name}</span>
            <button type="button" class="remove-btn" onclick="clearSelection('${fieldName}', '${dataType}')">&times;</button>
        `;
    }

    selectedDiv.classList.add('active');
    searchInput.style.display = 'none';
    optionsDiv.classList.remove('active');
}

function clearSelection(fieldName, dataType) {
    const searchInput = document.getElementById(`${fieldName}-search`);
    const hiddenInput = document.getElementById(fieldName);
    const selectedDiv = document.getElementById(`${fieldName}-selected`);

    hiddenInput.value = '';
    selectedDiv.classList.remove('active');
    selectedDiv.innerHTML = '';
    searchInput.style.display = 'block';
    searchInput.focus();
}

function addDestination() {
    const input = document.getElementById('destination-input');
    const destination = input.value.trim();

    if (destination) {
        destinations.push(destination);
        input.value = '';
        renderDestinations();
    }
}

function removeDestination(index) {
    destinations.splice(index, 1);
    renderDestinations();
}

function renderDestinations() {
    const container = document.getElementById('destinations-list');
    container.innerHTML = '';

    destinations.forEach((dest, index) => {
        const div = document.createElement('div');
        div.className = 'destination-item';
        div.innerHTML = `
            <span class="destination-order">${index + 1}.</span>
            <span class="destination-text">${dest}</span>
            <button type="button" class="remove-destination" onclick="removeDestination(${index})">&times;</button>
        `;
        container.appendChild(div);
    });
}

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));

    if (view === 'calendar') {
        document.getElementById('view-calendar').classList.add('active');
        document.getElementById('calendar-view').style.display = 'block';
        document.getElementById('list-view').style.display = 'none';
        loadCalendarView();
    } else {
        document.getElementById('view-list').classList.add('active');
        document.getElementById('calendar-view').style.display = 'none';
        document.getElementById('list-view').style.display = 'block';
        loadListView();
    }
}

function loadDeliveryView() {
    if (currentView === 'calendar') {
        loadCalendarView();
    } else {
        loadListView();
    }
}

function changeMonth(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    loadCalendarView();
}

function loadCalendarView() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    document.getElementById('current-month').textContent = `${year}年 ${month + 1}月`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const trucks = db.getAllTrucks();
    const deliveries = db.getAllDeliveries();

    let html = '<table class="calendar-table"><thead><tr><th>トラック</th>';

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
        html += `<th>${day}日<br>(${dayOfWeek})</th>`;
    }

    html += '</tr></thead><tbody>';

    trucks.forEach(truck => {
        html += `<tr><td class="truck-header">${truck.number}<br>${truck.plate}</td>`;

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const deliveriesOnDate = deliveries.filter(d => {
                if (d.truckId !== truck.id) return false;

                const startDate = new Date(d.startDate);
                const endDate = new Date(d.endDate);
                const currentDate = new Date(dateStr);

                return currentDate >= startDate && currentDate <= endDate;
            });

            if (deliveriesOnDate.length > 0) {
                const delivery = deliveriesOnDate[0];
                const customer = db.getCustomerById(delivery.customerId);
                const destText = delivery.destinations ? delivery.destinations[0] : '';
                html += `<td class="calendar-cell occupied" onclick="editDelivery(${delivery.id})">
                    <div class="delivery-info">
                        <div>${customer ? customer.name : ''}</div>
                        <div>${destText}</div>
                    </div>
                </td>`;
            } else {
                html += `<td class="calendar-cell" onclick="addDeliveryForDate('${dateStr}', ${truck.id})"></td>`;
            }
        }

        html += '</tr>';
    });

    html += '</tbody></table>';

    document.getElementById('calendar-matrix').innerHTML = html;
}

function loadListView() {
    const deliveries = db.getAllDeliveries();
    const trucks = db.getAllTrucks();
    const customers = db.getAllCustomers();

    const filterTruckSelect = document.getElementById('filter-truck');
    filterTruckSelect.innerHTML = '<option value="">全てのトラック</option>';
    trucks.forEach(truck => {
        filterTruckSelect.innerHTML += `<option value="${truck.id}">${truck.number} - ${truck.plate}</option>`;
    });

    const filterCustomerSelect = document.getElementById('filter-customer');
    filterCustomerSelect.innerHTML = '<option value="">全ての顧客</option>';
    customers.forEach(customer => {
        filterCustomerSelect.innerHTML += `<option value="${customer.id}">${customer.name}</option>`;
    });

    const tbody = document.getElementById('delivery-list');
    tbody.innerHTML = '';

    deliveries.sort((a, b) => {
        const dateA = new Date(a.startDate + ' ' + a.startTime);
        const dateB = new Date(b.startDate + ' ' + b.startTime);
        return dateB - dateA;
    });

    deliveries.forEach(delivery => {
        const truck = trucks.find(t => t.id === delivery.truckId);
        const customer = customers.find(c => c.id === delivery.customerId);

        const statusText = {
            'scheduled': '予定',
            'inprogress': '運転中',
            'completed': '完了'
        }[delivery.status];

        const destText = delivery.destinations ? delivery.destinations.join(' → ') : '';
        const startDateTime = `${delivery.startDate} ${delivery.startTime}`;
        const endDateTime = `${delivery.endDate} ${delivery.endTime}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${startDateTime}</td>
            <td>${endDateTime}</td>
            <td>${truck ? truck.number : ''}</td>
            <td>${customer ? customer.name : ''}</td>
            <td>${destText}</td>
            <td>${delivery.cargo}</td>
            <td><span class="status-badge status-${delivery.status}">${statusText}</span></td>
            <td>
                <button class="btn-edit" onclick="editDelivery(${delivery.id})">編集</button>
                <button class="btn-secondary" onclick="duplicateDelivery(${delivery.id})" title="複製">📋</button>
                <button class="btn-danger" onclick="deleteDelivery(${delivery.id})">削除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterDeliveries() {
    const searchText = document.getElementById('search-delivery').value.toLowerCase();
    const filterTruckId = parseInt(document.getElementById('filter-truck').value) || null;
    const filterCustomerId = parseInt(document.getElementById('filter-customer').value) || null;
    const filterStatus = document.getElementById('filter-status').value;
    const filterStartDate = document.getElementById('filter-start-date').value;
    const filterEndDate = document.getElementById('filter-end-date').value;

    const rows = document.querySelectorAll('#delivery-list tr');
    const deliveries = db.getAllDeliveries();

    rows.forEach((row, index) => {
        const cells = row.cells;
        const delivery = deliveries[deliveries.length - 1 - index];

        if (!delivery) return;

        const truckText = cells[2].textContent.toLowerCase();
        const customerText = cells[3].textContent.toLowerCase();
        const destinationText = cells[4].textContent.toLowerCase();
        const cargoText = cells[5].textContent.toLowerCase();
        const statusElement = cells[6].querySelector('.status-badge');

        let show = true;

        if (searchText && !truckText.includes(searchText) && !customerText.includes(searchText) &&
            !destinationText.includes(searchText) && !cargoText.includes(searchText)) {
            show = false;
        }

        if (filterTruckId && delivery.truckId !== filterTruckId) {
            show = false;
        }

        if (filterCustomerId && delivery.customerId !== filterCustomerId) {
            show = false;
        }

        if (filterStatus && !statusElement.classList.contains(`status-${filterStatus}`)) {
            show = false;
        }

        if (filterStartDate && delivery.startDate < filterStartDate) {
            show = false;
        }

        if (filterEndDate && delivery.startDate > filterEndDate) {
            show = false;
        }

        row.style.display = show ? '' : 'none';
    });
}

function clearDeliveryFilters() {
    document.getElementById('search-delivery').value = '';
    document.getElementById('filter-truck').value = '';
    document.getElementById('filter-customer').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    filterDeliveries();
}

function openDeliveryModal(prefilledData = {}) {
    const modal = document.getElementById('delivery-modal');
    const form = document.getElementById('delivery-form');
    form.reset();

    destinations = [];
    renderDestinations();

    clearSelection('delivery-truck', 'trucks');
    clearSelection('delivery-customer', 'customers');

    if (prefilledData.startDate) {
        document.getElementById('delivery-start-date').value = prefilledData.startDate;
        document.getElementById('delivery-end-date').value = prefilledData.startDate;
    } else {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('delivery-start-date').value = today;
        document.getElementById('delivery-end-date').value = today;
    }

    if (prefilledData.truckId) {
        const truck = db.getTruckById(prefilledData.truckId);
        if (truck) {
            selectOption('delivery-truck', 'trucks', truck);
        }
    }

    document.getElementById('delivery-modal-title').textContent = '新規配送登録';
    document.getElementById('delivery-id').value = '';
    document.getElementById('status-field').style.display = 'none';

    modal.classList.add('active');
}

function closeDeliveryModal() {
    document.getElementById('delivery-modal').classList.remove('active');
}

function addDeliveryForDate(date, truckId) {
    openDeliveryModal({ startDate: date, truckId });
}

function editDelivery(id) {
    const delivery = db.getDeliveryById(id);
    if (!delivery) return;

    const modal = document.getElementById('delivery-modal');
    document.getElementById('delivery-modal-title').textContent = '配送編集';

    document.getElementById('delivery-id').value = delivery.id;

    const truck = db.getTruckById(delivery.truckId);
    if (truck) {
        selectOption('delivery-truck', 'trucks', truck);
    }

    const customer = db.getCustomerById(delivery.customerId);
    if (customer) {
        selectOption('delivery-customer', 'customers', customer);
    }

    document.getElementById('delivery-start-date').value = delivery.startDate;
    document.getElementById('delivery-start-time').value = delivery.startTime;
    document.getElementById('delivery-end-date').value = delivery.endDate;
    document.getElementById('delivery-end-time').value = delivery.endTime;
    document.getElementById('delivery-cargo').value = delivery.cargo;

    document.getElementById('status-field').style.display = 'block';
    document.getElementById('delivery-status').value = delivery.status;

    destinations = delivery.destinations ? [...delivery.destinations] : [];
    renderDestinations();

    modal.classList.add('active');
}

function deleteDelivery(id) {
    if (confirm('この配送を削除しますか?')) {
        db.deleteDelivery(id);
        loadDeliveryView();
    }
}

function handleDeliverySubmit(e) {
    e.preventDefault();

    const id = document.getElementById('delivery-id').value;
    const truckId = parseInt(document.getElementById('delivery-truck').value);
    const customerId = parseInt(document.getElementById('delivery-customer').value);
    const startDate = document.getElementById('delivery-start-date').value;
    const startTime = document.getElementById('delivery-start-time').value;
    const endDate = document.getElementById('delivery-end-date').value;
    const endTime = document.getElementById('delivery-end-time').value;
    const cargo = document.getElementById('delivery-cargo').value;

    if (!truckId || !customerId) {
        alert('トラックと顧客を選択してください。');
        return;
    }

    if (destinations.length === 0) {
        alert('行先を少なくとも1つ追加してください。');
        return;
    }

    const startDateTime = new Date(startDate + ' ' + startTime);
    const endDateTime = new Date(endDate + ' ' + endTime);

    if (endDateTime <= startDateTime) {
        alert('到着日時は出発日時より後に設定してください。');
        return;
    }

    const isAvailable = db.isTruckAvailable(truckId, startDate, startTime, endDate, endTime, id ? parseInt(id) : null);

    if (!isAvailable) {
        alert('選択したトラックは指定の日時で既に予約されています。別のトラックまたは時間を選択してください。');
        return;
    }

    const deliveryData = {
        truckId,
        customerId,
        startDate,
        startTime,
        endDate,
        endTime,
        destinations: [...destinations],
        cargo
    };

    if (id) {
        const manualStatus = document.getElementById('delivery-status').value;
        deliveryData.manualStatus = manualStatus;
        db.updateDelivery(parseInt(id), deliveryData);
    } else {
        db.addDelivery(deliveryData);
    }

    closeDeliveryModal();
    loadDeliveryView();
}

function initTruckManagement() {
    document.getElementById('add-truck').addEventListener('click', openTruckModal);
    document.getElementById('cancel-truck').addEventListener('click', closeTruckModal);

    const truckModal = document.getElementById('truck-modal');
    truckModal.querySelector('.close').addEventListener('click', closeTruckModal);

    document.getElementById('truck-form').addEventListener('submit', handleTruckSubmit);
    document.getElementById('search-truck').addEventListener('input', filterTrucks);
}

function loadTrucksList() {
    const trucks = db.getAllTrucks();
    const tbody = document.getElementById('trucks-list');
    tbody.innerHTML = '';

    trucks.forEach(truck => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${truck.number}</td>
            <td>${truck.plate}</td>
            <td>${truck.capacity} kg</td>
            <td>${truck.purchaseDate}</td>
            <td><span class="status-badge status-${truck.status}">${truck.status === 'available' ? '利用可能' : '使用中'}</span></td>
            <td>
                <button class="btn-edit" onclick="editTruck(${truck.id})">編集</button>
                <button class="btn-danger" onclick="deleteTruck(${truck.id})">削除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openTruckModal() {
    const modal = document.getElementById('truck-modal');
    const form = document.getElementById('truck-form');
    form.reset();

    document.getElementById('truck-modal-title').textContent = '新規トラック登録';
    document.getElementById('truck-id').value = '';

    modal.classList.add('active');
}

function closeTruckModal() {
    document.getElementById('truck-modal').classList.remove('active');
}

function editTruck(id) {
    const truck = db.getTruckById(id);
    if (!truck) return;

    const modal = document.getElementById('truck-modal');
    document.getElementById('truck-modal-title').textContent = 'トラック編集';

    document.getElementById('truck-id').value = truck.id;
    document.getElementById('truck-number').value = truck.number;
    document.getElementById('truck-plate').value = truck.plate;
    document.getElementById('truck-capacity').value = truck.capacity;
    document.getElementById('truck-purchase-date').value = truck.purchaseDate;

    modal.classList.add('active');
}

function deleteTruck(id) {
    if (confirm('このトラックを削除しますか? 配送記録がある場合は削除できません。')) {
        const result = db.deleteTruck(id);
        if (result) {
            loadTrucksList();
        } else {
            alert('このトラックには配送記録があるため削除できません。');
        }
    }
}

function handleTruckSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('truck-id').value;
    const truckData = {
        number: document.getElementById('truck-number').value,
        plate: document.getElementById('truck-plate').value,
        capacity: parseInt(document.getElementById('truck-capacity').value),
        purchaseDate: document.getElementById('truck-purchase-date').value
    };

    if (id) {
        db.updateTruck(parseInt(id), truckData);
    } else {
        db.addTruck(truckData);
    }

    closeTruckModal();
    loadTrucksList();
}

function initCustomerManagement() {
    document.getElementById('add-customer').addEventListener('click', openCustomerModal);
    document.getElementById('cancel-customer').addEventListener('click', closeCustomerModal);

    const customerModal = document.getElementById('customer-modal');
    customerModal.querySelector('.close').addEventListener('click', closeCustomerModal);

    document.getElementById('customer-form').addEventListener('submit', handleCustomerSubmit);
    document.getElementById('search-customer').addEventListener('input', filterCustomers);
}

function loadCustomersList() {
    const customers = db.getAllCustomers();
    const tbody = document.getElementById('customers-list');
    tbody.innerHTML = '';

    customers.forEach(customer => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${customer.code}</td>
            <td>${customer.name}</td>
            <td>${customer.address}</td>
            <td>${customer.phone}</td>
            <td>${customer.contact || '-'}</td>
            <td>
                <button class="btn-edit" onclick="editCustomer(${customer.id})">編集</button>
                <button class="btn-danger" onclick="deleteCustomer(${customer.id})">削除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openCustomerModal() {
    const modal = document.getElementById('customer-modal');
    const form = document.getElementById('customer-form');
    form.reset();

    document.getElementById('customer-modal-title').textContent = '新規顧客登録';
    document.getElementById('customer-id').value = '';

    modal.classList.add('active');
}

function closeCustomerModal() {
    document.getElementById('customer-modal').classList.remove('active');
}

function editCustomer(id) {
    const customer = db.getCustomerById(id);
    if (!customer) return;

    const modal = document.getElementById('customer-modal');
    document.getElementById('customer-modal-title').textContent = '顧客編集';

    document.getElementById('customer-id').value = customer.id;
    document.getElementById('customer-code').value = customer.code;
    document.getElementById('customer-name').value = customer.name;
    document.getElementById('customer-address').value = customer.address;
    document.getElementById('customer-phone').value = customer.phone;
    document.getElementById('customer-contact').value = customer.contact || '';

    modal.classList.add('active');
}

function deleteCustomer(id) {
    if (confirm('この顧客を削除しますか? 配送記録がある場合は削除できません。')) {
        const result = db.deleteCustomer(id);
        if (result) {
            loadCustomersList();
        } else {
            alert('この顧客には配送記録があるため削除できません。');
        }
    }
}

function handleCustomerSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('customer-id').value;
    const customerData = {
        code: document.getElementById('customer-code').value,
        name: document.getElementById('customer-name').value,
        address: document.getElementById('customer-address').value,
        phone: document.getElementById('customer-phone').value,
        contact: document.getElementById('customer-contact').value
    };

    if (id) {
        db.updateCustomer(parseInt(id), customerData);
    } else {
        db.addCustomer(customerData);
    }

    closeCustomerModal();
    loadCustomersList();
}

function initDataManagement() {
    document.getElementById('export-deliveries').addEventListener('click', () => exportToCSV('deliveries'));
    document.getElementById('export-trucks').addEventListener('click', () => exportToCSV('trucks'));
    document.getElementById('export-customers').addEventListener('click', () => exportToCSV('customers'));
    document.getElementById('export-all').addEventListener('click', () => exportAllData());

    document.getElementById('import-deliveries').addEventListener('click', () => {
        document.getElementById('import-deliveries-file').click();
    });
    document.getElementById('import-deliveries-file').addEventListener('change', (e) => {
        importFromCSV(e.target.files[0], 'deliveries');
        e.target.value = '';
    });

    document.getElementById('import-trucks').addEventListener('click', () => {
        document.getElementById('import-trucks-file').click();
    });
    document.getElementById('import-trucks-file').addEventListener('change', (e) => {
        importFromCSV(e.target.files[0], 'trucks');
        e.target.value = '';
    });

    document.getElementById('import-customers').addEventListener('click', () => {
        document.getElementById('import-customers-file').click();
    });
    document.getElementById('import-customers-file').addEventListener('change', (e) => {
        importFromCSV(e.target.files[0], 'customers');
        e.target.value = '';
    });

    document.getElementById('clear-all-data').addEventListener('click', clearAllData);
}

function exportToCSV(type) {
    let data, headers, filename;

    if (type === 'deliveries') {
        data = db.getAllDeliveries();
        headers = ['ID', '出発日', '出発時刻', '到着日', '到着時刻', 'トラックID', '顧客ID', '行先', '積載内容', 'ステータス'];
        filename = 'deliveries.csv';

        const rows = data.map(d => [
            d.id,
            d.startDate,
            d.startTime,
            d.endDate,
            d.endTime,
            d.truckId,
            d.customerId,
            d.destinations ? d.destinations.join('|') : '',
            d.cargo,
            d.status
        ]);

        downloadCSV(headers, rows, filename);
    } else if (type === 'trucks') {
        data = db.getAllTrucks();
        headers = ['ID', 'トラックNo', '車両番号', '最大積載量', '購入日', 'ステータス'];
        filename = 'trucks.csv';

        const rows = data.map(t => [
            t.id,
            t.number,
            t.plate,
            t.capacity,
            t.purchaseDate,
            t.status
        ]);

        downloadCSV(headers, rows, filename);
    } else if (type === 'customers') {
        data = db.getAllCustomers();
        headers = ['ID', '顧客コード', '顧客名', '住所', '電話番号', '担当者'];
        filename = 'customers.csv';

        const rows = data.map(c => [
            c.id,
            c.code,
            c.name,
            c.address,
            c.phone,
            c.contact || ''
        ]);

        downloadCSV(headers, rows, filename);
    }
}

function downloadCSV(headers, rows, filename) {
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const bom = '﻿';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function exportAllData() {
    const allData = {
        deliveries: db.getAllDeliveries(),
        trucks: db.getAllTrucks(),
        customers: db.getAllCustomers(),
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'truck-delivery-backup.json';
    link.click();
}

function importFromCSV(file, type) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            alert('CSVファイルが空です。');
            return;
        }

        const data = lines.slice(1).map(line => {
            const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g).map(val => val.replace(/^"|"$/g, '').trim());
            return values;
        });

        if (type === 'deliveries') {
            data.forEach(row => {
                const delivery = {
                    truckId: parseInt(row[5]),
                    customerId: parseInt(row[6]),
                    startDate: row[1],
                    startTime: row[2],
                    endDate: row[3],
                    endTime: row[4],
                    destinations: row[7] ? row[7].split('|') : [],
                    cargo: row[8],
                    status: row[9]
                };
                db.addDelivery(delivery);
            });
            alert(`${data.length}件の配送データをインポートしました。`);
            loadDeliveryView();
        } else if (type === 'trucks') {
            data.forEach(row => {
                const truck = {
                    number: row[1],
                    plate: row[2],
                    capacity: parseInt(row[3]),
                    purchaseDate: row[4],
                    status: row[5]
                };
                db.addTruck(truck);
            });
            alert(`${data.length}件のトラックデータをインポートしました。`);
            loadTrucksList();
        } else if (type === 'customers') {
            data.forEach(row => {
                const customer = {
                    code: row[1],
                    name: row[2],
                    address: row[3],
                    phone: row[4],
                    contact: row[5]
                };
                db.addCustomer(customer);
            });
            alert(`${data.length}件の顧客データをインポートしました。`);
            loadCustomersList();
        }
    };

    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('本当に全てのデータを削除しますか？この操作は取り消せません。')) {
        if (confirm('最終確認: 全てのデータが削除されます。よろしいですか？')) {
            localStorage.clear();
            alert('全てのデータを削除しました。ページを再読み込みします。');
            location.reload();
        }
    }
}

function printDeliveryView() {
    window.print();
}

function loadReportsView() {
    const deliveries = db.getAllDeliveries();
    const trucks = db.getAllTrucks();
    const customers = db.getAllCustomers();

    document.getElementById('total-deliveries').textContent = deliveries.length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthDeliveries = deliveries.filter(d => {
        const startDate = new Date(d.startDate);
        return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
    });
    document.getElementById('month-deliveries').textContent = monthDeliveries.length;

    const completedDeliveries = deliveries.filter(d => d.status === 'completed');
    document.getElementById('completed-deliveries').textContent = completedDeliveries.length;

    const inprogressDeliveries = deliveries.filter(d => d.status === 'inprogress');
    document.getElementById('inprogress-deliveries').textContent = inprogressDeliveries.length;

    loadTruckUtilization(deliveries, trucks);
    loadCustomerRanking(deliveries, customers);
    loadMonthlyTrend(deliveries);
}

function loadTruckUtilization(deliveries, trucks) {
    const container = document.getElementById('truck-utilization');
    container.innerHTML = '';

    const truckStats = trucks.map(truck => {
        const truckDeliveries = deliveries.filter(d => d.truckId === truck.id);
        return {
            truck,
            count: truckDeliveries.length
        };
    });

    const maxCount = Math.max(...truckStats.map(t => t.count), 1);

    truckStats.forEach(stat => {
        const percentage = (stat.count / maxCount) * 100;
        const barHTML = `
            <div class="chart-bar">
                <div class="chart-label">${stat.truck.number} (${stat.truck.plate})</div>
                <div class="chart-bar-container">
                    <div class="chart-bar-fill" style="width: ${percentage}%">
                        <span class="chart-bar-value">${stat.count}件</span>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += barHTML;
    });
}

function loadCustomerRanking(deliveries, customers) {
    const container = document.getElementById('customer-ranking');
    container.innerHTML = '';

    const customerStats = customers.map(customer => {
        const customerDeliveries = deliveries.filter(d => d.customerId === customer.id);
        return {
            customer,
            count: customerDeliveries.length
        };
    });

    customerStats.sort((a, b) => b.count - a.count);
    const top10 = customerStats.slice(0, 10);

    top10.forEach((stat, index) => {
        const rankHTML = `
            <div class="ranking-item">
                <div class="ranking-rank">${index + 1}位</div>
                <div class="ranking-name">${stat.customer.name}</div>
                <div class="ranking-count">${stat.count}件</div>
            </div>
        `;
        container.innerHTML += rankHTML;
    });

    if (top10.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">データがありません</p>';
    }
}

function loadMonthlyTrend(deliveries) {
    const container = document.getElementById('monthly-trend');
    container.innerHTML = '';

    const now = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        const monthDeliveries = deliveries.filter(d => {
            const startDate = new Date(d.startDate);
            return startDate.getFullYear() === year && startDate.getMonth() === month;
        });

        monthlyData.push({
            label: `${year}年${month + 1}月`,
            count: monthDeliveries.length
        });
    }

    const maxCount = Math.max(...monthlyData.map(m => m.count), 1);

    monthlyData.forEach(data => {
        const percentage = (data.count / maxCount) * 100;
        const barHTML = `
            <div class="chart-bar">
                <div class="chart-label">${data.label}</div>
                <div class="chart-bar-container">
                    <div class="chart-bar-fill" style="width: ${percentage}%">
                        <span class="chart-bar-value">${data.count}件</span>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += barHTML;
    });
}

function initReportsManagement() {
    document.getElementById('print-reports').addEventListener('click', () => {
        window.print();
    });
}

function loadDashboard() {
    const deliveries = db.getAllDeliveries();
    const trucks = db.getAllTrucks();
    const customers = db.getAllCustomers();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDateToString(today);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDateToString(tomorrow);

    const todayDeliveries = deliveries.filter(d => d.startDate === todayStr);
    renderDeliveryItems('today-deliveries', todayDeliveries, trucks, customers);

    const tomorrowDeliveries = deliveries.filter(d => d.startDate === tomorrowStr);
    renderDeliveryItems('tomorrow-deliveries', tomorrowDeliveries, trucks, customers);

    const inprogressDeliveries = deliveries.filter(d => d.status === 'inprogress');
    renderDeliveryItems('inprogress-deliveries-list', inprogressDeliveries, trucks, customers);

    const alertDeliveries = deliveries.filter(d => {
        const startDateTime = new Date(d.startDate + ' ' + d.startTime);
        const endDateTime = new Date(d.endDate + ' ' + d.endTime);
        const now = new Date();
        const hoursUntilStart = (startDateTime - now) / (1000 * 60 * 60);
        return (d.status === 'scheduled' && hoursUntilStart < 24 && hoursUntilStart > 0);
    });
    renderDeliveryItems('alert-deliveries', alertDeliveries, trucks, customers);

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthDeliveries = deliveries.filter(d => {
        const startDate = new Date(d.startDate);
        return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
    });

    const monthCompleted = monthDeliveries.filter(d => d.status === 'completed').length;
    const monthInProgress = monthDeliveries.filter(d => d.status === 'inprogress').length;
    const monthScheduled = monthDeliveries.filter(d => d.status === 'scheduled').length;

    document.getElementById('month-summary').innerHTML = `
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-label">総配送数</div>
                <div class="summary-value">${monthDeliveries.length}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">完了</div>
                <div class="summary-value">${monthCompleted}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">運転中</div>
                <div class="summary-value">${monthInProgress}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">予定</div>
                <div class="summary-value">${monthScheduled}</div>
            </div>
        </div>
    `;
}

function renderDeliveryItems(containerId, deliveries, trucks, customers) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (deliveries.length === 0) {
        container.innerHTML = '<div class="empty-message">該当する配送はありません</div>';
        return;
    }

    deliveries.forEach(delivery => {
        const truck = trucks.find(t => t.id === delivery.truckId);
        const customer = customers.find(c => c.id === delivery.customerId);

        const itemHTML = `
            <div class="delivery-item" onclick="editDelivery(${delivery.id})">
                <div class="delivery-item-header">
                    <div class="delivery-item-time">${delivery.startTime} - ${delivery.endTime}</div>
                    <div class="delivery-item-truck">${truck ? truck.number : ''}</div>
                </div>
                <div class="delivery-item-body">
                    <div class="delivery-item-customer">${customer ? customer.name : ''}</div>
                    <div class="delivery-item-destination">${delivery.destinations ? delivery.destinations.join(' → ') : ''}</div>
                </div>
            </div>
        `;
        container.innerHTML += itemHTML;
    });
}

function formatDateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function filterTrucks() {
    const searchText = document.getElementById('search-truck').value.toLowerCase();
    const rows = document.querySelectorAll('#trucks-list tr');

    rows.forEach(row => {
        const cells = row.cells;
        const numberText = cells[0].textContent.toLowerCase();
        const plateText = cells[1].textContent.toLowerCase();

        const show = numberText.includes(searchText) || plateText.includes(searchText);
        row.style.display = show ? '' : 'none';
    });
}

function filterCustomers() {
    const searchText = document.getElementById('search-customer').value.toLowerCase();
    const rows = document.querySelectorAll('#customers-list tr');

    rows.forEach(row => {
        const cells = row.cells;
        const codeText = cells[0].textContent.toLowerCase();
        const nameText = cells[1].textContent.toLowerCase();
        const addressText = cells[2].textContent.toLowerCase();

        const show = codeText.includes(searchText) || nameText.includes(searchText) || addressText.includes(searchText);
        row.style.display = show ? '' : 'none';
    });
}

function sortDeliveries(field) {
    if (currentSortField === field) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortField = field;
        currentSortOrder = 'asc';
    }

    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });

    const activeHeader = document.querySelector(`.sortable[data-sort="${field}"]`);
    if (activeHeader) {
        activeHeader.classList.add(`sort-${currentSortOrder}`);
    }

    const deliveries = db.getAllDeliveries();

    deliveries.sort((a, b) => {
        let valueA, valueB;

        if (field === 'startDate') {
            valueA = new Date(a.startDate + ' ' + a.startTime);
            valueB = new Date(b.startDate + ' ' + b.startTime);
        } else if (field === 'endDate') {
            valueA = new Date(a.endDate + ' ' + a.endTime);
            valueB = new Date(b.endDate + ' ' + b.endTime);
        } else if (field === 'status') {
            const statusOrder = { scheduled: 1, inprogress: 2, completed: 3 };
            valueA = statusOrder[a.status];
            valueB = statusOrder[b.status];
        }

        if (currentSortOrder === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });

    const tbody = document.getElementById('delivery-list');
    tbody.innerHTML = '';

    const trucks = db.getAllTrucks();
    const customers = db.getAllCustomers();

    deliveries.forEach(delivery => {
        const truck = trucks.find(t => t.id === delivery.truckId);
        const customer = customers.find(c => c.id === delivery.customerId);

        const statusText = {
            'scheduled': '予定',
            'inprogress': '運転中',
            'completed': '完了'
        }[delivery.status];

        const destText = delivery.destinations ? delivery.destinations.join(' → ') : '';
        const startDateTime = `${delivery.startDate} ${delivery.startTime}`;
        const endDateTime = `${delivery.endDate} ${delivery.endTime}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${startDateTime}</td>
            <td>${endDateTime}</td>
            <td>${truck ? truck.number : ''}</td>
            <td>${customer ? customer.name : ''}</td>
            <td>${destText}</td>
            <td>${delivery.cargo}</td>
            <td><span class="status-badge status-${delivery.status}">${statusText}</span></td>
            <td>
                <button class="btn-edit" onclick="editDelivery(${delivery.id})">編集</button>
                <button class="btn-secondary" onclick="duplicateDelivery(${delivery.id})" title="複製">📋</button>
                <button class="btn-danger" onclick="deleteDelivery(${delivery.id})">削除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    filterDeliveries();
}

function duplicateDelivery(id) {
    const delivery = db.getDeliveryById(id);
    if (!delivery) return;

    if (confirm('この配送を複製しますか？')) {
        const newDelivery = {
            truckId: delivery.truckId,
            customerId: delivery.customerId,
            startDate: delivery.startDate,
            startTime: delivery.startTime,
            endDate: delivery.endDate,
            endTime: delivery.endTime,
            destinations: [...delivery.destinations],
            cargo: delivery.cargo
        };

        db.addDelivery(newDelivery);
        loadDeliveryView();
        alert('配送を複製しました。');
    }
}

function initKeyboardShortcuts() {
    document.getElementById('show-shortcuts').addEventListener('click', openShortcutsModal);

    const shortcutsModal = document.getElementById('shortcuts-modal');
    shortcutsModal.querySelector('.close').addEventListener('click', closeShortcutsModal);

    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }

        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'h':
                    e.preventDefault();
                    switchSection('dashboard');
                    break;
                case 'd':
                    e.preventDefault();
                    switchSection('delivery');
                    break;
                case 't':
                    e.preventDefault();
                    switchSection('trucks');
                    break;
                case 'c':
                    e.preventDefault();
                    switchSection('customers');
                    break;
                case 'r':
                    e.preventDefault();
                    switchSection('reports');
                    break;
                case 'n':
                    e.preventDefault();
                    const activeSection = document.querySelector('.section.active');
                    if (activeSection.id === 'delivery-section') {
                        openDeliveryModal();
                    } else if (activeSection.id === 'trucks-section') {
                        openTruckModal();
                    } else if (activeSection.id === 'customers-section') {
                        openCustomerModal();
                    }
                    break;
                case 'p':
                    e.preventDefault();
                    window.print();
                    break;
                case '/':
                case '?':
                    e.preventDefault();
                    openShortcutsModal();
                    break;
            }
        }

        if (e.key === 'Escape') {
            closeDeliveryModal();
            closeTruckModal();
            closeCustomerModal();
            closeShortcutsModal();
        }
    });
}

function openShortcutsModal() {
    document.getElementById('shortcuts-modal').classList.add('active');
}

function closeShortcutsModal() {
    document.getElementById('shortcuts-modal').classList.remove('active');
}
