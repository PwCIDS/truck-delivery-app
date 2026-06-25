const db = new Database();
let currentView = 'calendar';
let currentMonth = new Date();
let destinations = [];
let currentTruckSearch = null;
let currentCustomerSearch = null;
let currentSortField = null;
let currentSortOrder = 'desc';
let aiSuggestedTruck = null;

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initDeliveryManagement();
    initTruckManagement();
    initDriverManagement();
    initCustomerManagement();
    initMaintenanceManagement();
    initDataManagement();
    initReportsManagement();
    initKeyboardShortcuts();
    loadDashboard();
});

function initNavigation() {
    document.getElementById('nav-dashboard').addEventListener('click', () => switchSection('dashboard'));
    document.getElementById('nav-delivery').addEventListener('click', () => switchSection('delivery'));
    document.getElementById('nav-trucks').addEventListener('click', () => switchSection('trucks'));
    document.getElementById('nav-drivers').addEventListener('click', () => switchSection('drivers'));
    document.getElementById('nav-customers').addEventListener('click', () => switchSection('customers'));
    document.getElementById('nav-maintenance').addEventListener('click', () => switchSection('maintenance'));
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
    } else if (section === 'drivers') {
        loadDriversList();
    } else if (section === 'customers') {
        loadCustomersList();
    } else if (section === 'maintenance') {
        loadMaintenanceList();
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
    initSearchableSelect('delivery-driver', 'drivers');

    document.getElementById('ai-suggest-truck').addEventListener('click', openAISuggestionModal);
    document.getElementById('ai-suggest-driver').addEventListener('click', openAIDriverSuggestionModal);
    document.getElementById('cancel-ai-suggestion').addEventListener('click', closeAISuggestionModal);
    document.getElementById('confirm-ai-suggestion').addEventListener('click', confirmAISuggestionGeneric);

    const aiModal = document.getElementById('ai-suggestion-modal');
    aiModal.querySelector('.close').addEventListener('click', closeAISuggestionModal);

    // 配送指示書
    const instructionModal = document.getElementById('delivery-instruction-modal');
    instructionModal.querySelector('.close').addEventListener('click', closeInstructionModal);
    document.getElementById('close-instruction').addEventListener('click', closeInstructionModal);
    document.getElementById('print-instruction').addEventListener('click', printInstruction);
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
    } else if (dataType === 'drivers') {
        items = db.getAllDrivers();
    }

    const filtered = items.filter(item => {
        if (dataType === 'trucks') {
            return item.number.toLowerCase().includes(query) ||
                   item.plate.toLowerCase().includes(query);
        } else if (dataType === 'customers') {
            return item.name.toLowerCase().includes(query) ||
                   item.code.toLowerCase().includes(query) ||
                   (item.address && item.address.toLowerCase().includes(query));
        } else if (dataType === 'drivers') {
            return item.name.toLowerCase().includes(query) ||
                   item.code.toLowerCase().includes(query);
        }
        return false;
    });

    optionsDiv.innerHTML = '';
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'select-option';

        if (dataType === 'trucks') {
            const maintenanceInfo = db.getTruckMaintenanceInfo(item.id);
            let maintenanceWarning = '';
            if (maintenanceInfo.isUnderMaintenance) {
                maintenanceWarning = ' <span style="color: #ffc107; font-weight: bold;">⚠️ メンテナンス中</span>';
                div.style.opacity = '0.6';
            }
            div.innerHTML = `${item.number} - ${item.plate} (${item.capacity}kg) <span class="truck-type-badge type-${item.type || '配達'}">${item.type || '配達'}</span>${maintenanceWarning}`;
        } else if (dataType === 'customers') {
            div.textContent = `${item.code} - ${item.name}`;
        } else if (dataType === 'drivers') {
            div.innerHTML = `${item.code} - ${item.name} (${item.license}免許)`;
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
            <span>${item.number} - ${item.plate} (${item.capacity}kg) <span class="truck-type-badge type-${item.type || '配達'}">${item.type || '配達'}</span></span>
            <button type="button" class="remove-btn" onclick="clearSelection('${fieldName}', '${dataType}')">&times;</button>
        `;
    } else if (dataType === 'customers') {
        searchInput.value = '';
        selectedDiv.innerHTML = `
            <span>${item.code} - ${item.name}</span>
            <button type="button" class="remove-btn" onclick="clearSelection('${fieldName}', '${dataType}')">&times;</button>
        `;
    } else if (dataType === 'drivers') {
        searchInput.value = '';
        selectedDiv.innerHTML = `
            <span>${item.code} - ${item.name} (${item.license}免許)</span>
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

    // トラックを1列に10台ずつ表示
    const trucksPerRow = 10;
    const truckGroups = [];
    for (let i = 0; i < trucks.length; i += trucksPerRow) {
        truckGroups.push(trucks.slice(i, i + trucksPerRow));
    }

    let html = '';

    // 各トラックグループごとにテーブルを作成
    truckGroups.forEach((truckGroup, groupIndex) => {
        html += '<table class="calendar-table"><thead><tr><th class="date-header">日付</th>';

        // トラックヘッダー（横）
        truckGroup.forEach(truck => {
            html += `<th class="truck-header-new">
                <div class="truck-info-compact">
                    <div class="truck-number">${truck.number}</div>
                    <div class="truck-plate">${truck.plate}</div>
                    <span class="truck-type-badge type-${truck.type || '配達'}">${truck.type || '配達'}</span>
                </div>
            </th>`;
        });

        html += '</tr></thead><tbody>';

        // 日付行（縦）
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayClass = dayOfWeek === '日' ? 'sunday' : dayOfWeek === '土' ? 'saturday' : '';

            html += `<tr><td class="date-cell ${dayClass}">${day}日<br>(${dayOfWeek})</td>`;

            // 各トラックのセル
            truckGroup.forEach(truck => {
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
                    html += `<td class="calendar-cell occupied" onclick="editDelivery(${delivery.id})" title="${customer ? customer.name : ''} - ${destText}">
                        <div class="delivery-info-compact">
                            <div class="delivery-customer-short">${customer ? customer.name.substring(0, 8) : ''}</div>
                        </div>
                    </td>`;
                } else {
                    html += `<td class="calendar-cell" onclick="addDeliveryForDate('${dateStr}', ${truck.id})"></td>`;
                }
            });

            html += '</tr>';
        }

        html += '</tbody></table>';

        // グループ間の区切り
        if (groupIndex < truckGroups.length - 1) {
            html += '<div class="calendar-separator"></div>';
        }
    });

    // トラック未選択の配送を表示
    const unassignedDeliveries = deliveries.filter(d => !d.truckId);
    if (unassignedDeliveries.length > 0) {
        html += '<div class="unassigned-section">';
        html += '<h3 class="unassigned-title">⚠️ トラック未選択の配送</h3>';
        html += '<div class="unassigned-list">';

        const unassignedByDate = {};
        unassignedDeliveries.forEach(delivery => {
            const dateStr = delivery.startDate;
            if (!unassignedByDate[dateStr]) {
                unassignedByDate[dateStr] = [];
            }
            unassignedByDate[dateStr].push(delivery);
        });

        Object.keys(unassignedByDate).sort().forEach(dateStr => {
            const deliveriesOnDate = unassignedByDate[dateStr];
            html += `<div class="unassigned-date-group">`;
            html += `<div class="unassigned-date">${dateStr}</div>`;
            deliveriesOnDate.forEach(delivery => {
                const customer = db.getCustomerById(delivery.customerId);
                const destText = delivery.destinations ? delivery.destinations[0] : '';
                html += `<div class="unassigned-item" onclick="editDelivery(${delivery.id})">
                    <div class="unassigned-time">${delivery.startTime} - ${delivery.endTime}</div>
                    <div class="unassigned-customer">${customer ? customer.name : ''}</div>
                    <div class="unassigned-dest">${destText}</div>
                </div>`;
            });
            html += `</div>`;
        });

        html += '</div></div>';
    }

    document.getElementById('calendar-matrix').innerHTML = html;
}

function loadListView() {
    const deliveries = db.getAllDeliveries();
    const trucks = db.getAllTrucks();
    const customers = db.getAllCustomers();
    const drivers = db.getAllDrivers();

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
        const driver = drivers.find(d => d.id === delivery.driverId);

        const detailedStatusText = {
            'preparing': '準備中',
            'loading': '積込中',
            'intransit': '配送中',
            'unloading': '荷卸中',
            'completed': '完了'
        }[delivery.detailedStatus || delivery.status];

        const destText = delivery.destinations ? delivery.destinations.join(' → ') : '';
        const startDateTime = `${delivery.startDate} ${delivery.startTime}`;
        const endDateTime = `${delivery.endDate} ${delivery.endTime}`;

        let truckDisplay = '';
        if (truck) {
            truckDisplay = `${truck.number} <span class="truck-type-badge type-${truck.type || '配達'}">${truck.type || '配達'}</span>`;
        } else {
            truckDisplay = '<span class="truck-not-assigned">未選択</span>';
        }

        let driverDisplay = '';
        if (driver) {
            driverDisplay = driver.name;
        } else {
            driverDisplay = '<span class="truck-not-assigned">未選択</span>';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${startDateTime}</td>
            <td>${endDateTime}</td>
            <td>${truckDisplay}</td>
            <td>${driverDisplay}</td>
            <td>${customer ? customer.name : ''}</td>
            <td>${destText}</td>
            <td>${delivery.cargo}</td>
            <td><span class="status-badge status-${delivery.detailedStatus || delivery.status}">${detailedStatusText}</span></td>
            <td>
                <button class="btn-edit" onclick="editDelivery(${delivery.id})">編集</button>
                <button class="btn-secondary" onclick="printDeliveryInstruction(${delivery.id})" title="配送指示書">🖨</button>
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
    clearSelection('delivery-driver', 'drivers');

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
    } else {
        clearSelection('delivery-truck', 'trucks');
    }

    const customer = db.getCustomerById(delivery.customerId);
    if (customer) {
        selectOption('delivery-customer', 'customers', customer);
    }

    const driver = db.getDriverById(delivery.driverId);
    if (driver) {
        selectOption('delivery-driver', 'drivers', driver);
    } else {
        clearSelection('delivery-driver', 'drivers');
    }

    document.getElementById('delivery-start-date').value = delivery.startDate;
    document.getElementById('delivery-start-time').value = delivery.startTime;
    document.getElementById('delivery-end-date').value = delivery.endDate;
    document.getElementById('delivery-end-time').value = delivery.endTime;
    document.getElementById('delivery-cargo').value = delivery.cargo;

    // 配送区分を設定
    const categoryValue = delivery.category || '配達';
    const categoryRadio = document.querySelector(`input[name="delivery-category"][value="${categoryValue}"]`);
    if (categoryRadio) {
        categoryRadio.checked = true;
    }

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
    const truckIdValue = document.getElementById('delivery-truck').value;
    const truckId = truckIdValue ? parseInt(truckIdValue) : null;
    const driverIdValue = document.getElementById('delivery-driver').value;
    const driverId = driverIdValue ? parseInt(driverIdValue) : null;
    const customerId = parseInt(document.getElementById('delivery-customer').value);
    const startDate = document.getElementById('delivery-start-date').value;
    const startTime = document.getElementById('delivery-start-time').value;
    const endDate = document.getElementById('delivery-end-date').value;
    const endTime = document.getElementById('delivery-end-time').value;
    const cargo = document.getElementById('delivery-cargo').value;
    const category = document.querySelector('input[name="delivery-category"]:checked').value;

    if (!customerId) {
        alert('顧客を選択してください。');
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

    if (truckId) {
        const isAvailable = db.isTruckAvailable(truckId, startDate, startTime, endDate, endTime, id ? parseInt(id) : null);

        if (!isAvailable) {
            alert('選択したトラックは指定の日時で既に予約されています。別のトラックまたは時間を選択してください。');
            return;
        }
    }

    if (driverId) {
        const isAvailable = db.isDriverAvailable(driverId, startDate, startTime, endDate, endTime, id ? parseInt(id) : null);

        if (!isAvailable) {
            alert('選択したドライバーは指定の日時で既に配送が入っています。別のドライバーまたは時間を選択してください。');
            return;
        }
    }

    // ドライバーのスキルと配送区分のマッチングチェック
    if (driverId) {
        const driver = db.getDriverById(driverId);

        if (driver) {
            // 活魚の場合、活魚車運転スキルが必要
            if (category === '活魚') {
                if (!driver.specialSkills || !driver.specialSkills.includes('活魚車運転')) {
                    alert('活魚配送には「活魚車運転」スキルを持つドライバーを選択してください。\n\n現在選択中のドライバー: ' + driver.name + '\n必要なスキル: 活魚車運転');
                    return;
                }
            }

            // 保冷の場合、保冷車運転スキルが必要
            if (category === '保冷') {
                if (!driver.specialSkills || !driver.specialSkills.includes('保冷車運転')) {
                    alert('保冷配送には「保冷車運転」スキルを持つドライバーを選択してください。\n\n現在選択中のドライバー: ' + driver.name + '\n必要なスキル: 保冷車運転');
                    return;
                }
            }
        }
    }

    // トラックタイプと配送区分のマッチングチェック
    if (truckId) {
        const truck = db.getTruckById(truckId);

        if (truck && truck.type !== category) {
            alert('配送区分とトラックの種類が一致しません。\n\n配送区分: ' + category + '\nトラック種類: ' + truck.type + '\n\n同じ種類を選択してください。');
            return;
        }
    }

    const deliveryData = {
        truckId,
        driverId,
        customerId,
        startDate,
        startTime,
        endDate,
        endTime,
        destinations: [...destinations],
        cargo,
        category
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

    // 画像アップロード処理
    document.getElementById('truck-image-button').addEventListener('click', function() {
        document.getElementById('truck-image-upload').click();
    });

    document.getElementById('truck-image-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imageData = event.target.result;
                document.getElementById('truck-image').value = imageData;

                // プレビュー表示
                const preview = document.getElementById('truck-image-preview');
                preview.innerHTML = `<img src="${imageData}" style="max-width: 200px; max-height: 150px; border-radius: 5px; border: 2px solid #ddd;">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

function loadTrucksList() {
    const trucks = db.getAllTrucks();
    const tbody = document.getElementById('trucks-list');
    tbody.innerHTML = '';

    trucks.forEach(truck => {
        // メンテナンス情報を取得
        const maintenanceInfo = db.getTruckMaintenanceInfo(truck.id);

        // メンテナンス情報の表示内容を構築
        let maintenanceDisplay = '';
        if (maintenanceInfo.isUnderMaintenance && maintenanceInfo.ongoingMaintenance) {
            const m = maintenanceInfo.ongoingMaintenance;
            maintenanceDisplay = `<div class="maintenance-status maintenance-ongoing">
                <strong>⚠️ メンテナンス中</strong><br>
                <span style="font-size: 12px;">${m.type} (${m.date})</span>
            </div>`;
        } else if (maintenanceInfo.upcomingMaintenance) {
            const m = maintenanceInfo.upcomingMaintenance;
            maintenanceDisplay = `<div class="maintenance-status maintenance-upcoming">
                <strong>次回:</strong> ${m.type}<br>
                <span style="font-size: 12px;">${m.nextDate}</span>
            </div>`;
        } else if (maintenanceInfo.lastCompletedMaintenance) {
            const m = maintenanceInfo.lastCompletedMaintenance;
            maintenanceDisplay = `<div class="maintenance-status maintenance-completed">
                <strong>前回:</strong> ${m.type}<br>
                <span style="font-size: 12px;">${m.date}</span>
            </div>`;
        } else {
            maintenanceDisplay = '<span style="color: #999;">記録なし</span>';
        }

        // ステータスの自動判定
        let truckStatus = truck.status;
        let statusText = truck.status === 'available' ? '利用可能' : '使用中';

        // メンテナンス期間中の場合、強制的に利用不可
        if (maintenanceInfo.isUnderMaintenance) {
            truckStatus = 'maintenance';
            statusText = 'メンテナンス中';
        }

        // 画像表示
        let imageDisplay = '';
        if (truck.image) {
            imageDisplay = `<img src="${truck.image}" class="truck-thumbnail" alt="${truck.number}" onclick="showImageModal('${truck.image}')">`;
        } else {
            imageDisplay = '<div class="truck-thumbnail-placeholder">📷</div>';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${imageDisplay}</td>
            <td>${truck.number}</td>
            <td>${truck.plate}</td>
            <td><span class="truck-type-badge type-${truck.type || '配達'}">${truck.type || '配達'}</span></td>
            <td>${truck.capacity} kg</td>
            <td>${truck.purchaseDate}</td>
            <td>${maintenanceDisplay}</td>
            <td><span class="status-badge status-${truckStatus}">${statusText}</span></td>
            <td>
                <button class="btn-secondary" onclick="showTruckHistory(${truck.id})" title="配送履歴">📋 詳細</button>
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
    document.getElementById('truck-image').value = '';
    document.getElementById('truck-image-preview').innerHTML = '';

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
    document.getElementById('truck-type').value = truck.type || '配達';
    document.getElementById('truck-capacity').value = truck.capacity;
    document.getElementById('truck-purchase-date').value = truck.purchaseDate;

    // 画像を設定
    document.getElementById('truck-image').value = truck.image || '';
    const preview = document.getElementById('truck-image-preview');
    if (truck.image) {
        preview.innerHTML = `<img src="${truck.image}" style="max-width: 200px; max-height: 150px; border-radius: 5px; border: 2px solid #ddd;">`;
    } else {
        preview.innerHTML = '';
    }

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
        type: document.getElementById('truck-type').value,
        capacity: parseInt(document.getElementById('truck-capacity').value),
        purchaseDate: document.getElementById('truck-purchase-date').value,
        image: document.getElementById('truck-image').value || null
    };

    if (id) {
        db.updateTruck(parseInt(id), truckData);
    } else {
        db.addTruck(truckData);
    }

    closeTruckModal();
    loadTrucksList();
}

function initDriverManagement() {
    document.getElementById('add-driver').addEventListener('click', openDriverModal);
    document.getElementById('cancel-driver').addEventListener('click', closeDriverModal);

    const driverModal = document.getElementById('driver-modal');
    driverModal.querySelector('.close').addEventListener('click', closeDriverModal);

    document.getElementById('driver-form').addEventListener('submit', handleDriverSubmit);
    document.getElementById('search-driver').addEventListener('input', filterDrivers);
    document.getElementById('filter-driver-license').addEventListener('change', filterDrivers);

    // 顔写真アップロード処理
    document.getElementById('driver-photo-button').addEventListener('click', function() {
        document.getElementById('driver-photo-upload').click();
    });

    document.getElementById('driver-photo-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imageData = event.target.result;
                document.getElementById('driver-photo').value = imageData;

                // プレビュー表示
                const preview = document.getElementById('driver-photo-preview');
                preview.innerHTML = `<img src="${imageData}" style="max-width: 150px; max-height: 150px; border-radius: 50%; border: 3px solid #ddd; object-fit: cover;">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // 生年月日から年齢を自動計算
    document.getElementById('driver-birthdate').addEventListener('change', function() {
        calculateAge();
    });

    // 運転開始年と中断年数から経験年数を自動計算
    document.getElementById('driver-driving-start-year').addEventListener('input', calculateExperience);
    document.getElementById('driver-break-years').addEventListener('input', calculateExperience);
}

function calculateAge() {
    const birthdate = document.getElementById('driver-birthdate').value;
    if (!birthdate) {
        document.getElementById('driver-age-display').value = '';
        document.getElementById('driver-age').value = '';
        return;
    }

    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    document.getElementById('driver-age-display').value = age + '歳';
    document.getElementById('driver-age').value = age;
}

function calculateExperience() {
    const startYear = parseInt(document.getElementById('driver-driving-start-year').value) || 0;
    const breakYears = parseInt(document.getElementById('driver-break-years').value) || 0;

    if (!startYear) {
        document.getElementById('driver-experience-display').value = '';
        document.getElementById('driver-experience').value = '';
        return;
    }

    const currentYear = new Date().getFullYear();
    const totalYears = currentYear - startYear;
    const experience = Math.max(0, totalYears - breakYears);

    document.getElementById('driver-experience-display').value = experience + '年';
    document.getElementById('driver-experience').value = experience;
}

function loadDriversList() {
    const drivers = db.getAllDrivers();
    const tbody = document.getElementById('drivers-list');
    tbody.innerHTML = '';

    drivers.forEach(driver => {
        const skillsHtml = driver.specialSkills && driver.specialSkills.length > 0
            ? driver.specialSkills.map(skill => `<span class="skill-badge">${skill}</span>`).join(' ')
            : '-';

        // 顔写真表示
        let photoDisplay = '';
        if (driver.photo) {
            photoDisplay = `<img src="${driver.photo}" class="driver-photo-thumbnail" alt="${driver.name}" onclick="showImageModal('${driver.photo}')">`;
        } else {
            photoDisplay = '<div class="driver-photo-placeholder">👤</div>';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${photoDisplay}</td>
            <td>${driver.code}</td>
            <td>${driver.name}</td>
            <td>${driver.age}歳</td>
            <td>${driver.license}</td>
            <td>${driver.experience}年</td>
            <td><div class="driver-skills">${skillsHtml}</div></td>
            <td>${driver.phone}</td>
            <td><span class="status-badge status-${driver.status}">${driver.status === 'available' ? '利用可能' : '配送中'}</span></td>
            <td>
                <button class="btn-secondary" onclick="showDriverHistory(${driver.id})" title="配送履歴">📋 詳細</button>
                <button class="btn-edit" onclick="editDriver(${driver.id})">編集</button>
                <button class="btn-danger" onclick="deleteDriver(${driver.id})">削除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openDriverModal() {
    const modal = document.getElementById('driver-modal');
    const form = document.getElementById('driver-form');
    form.reset();

    document.getElementById('driver-modal-title').textContent = '新規ドライバー登録';
    document.getElementById('driver-id').value = '';

    // チェックボックスをクリア
    document.querySelectorAll('#driver-form input[type="checkbox"]').forEach(cb => cb.checked = false);

    // 写真と計算フィールドをクリア
    document.getElementById('driver-photo').value = '';
    document.getElementById('driver-photo-preview').innerHTML = '';
    document.getElementById('driver-age-display').value = '';
    document.getElementById('driver-age').value = '';
    document.getElementById('driver-experience-display').value = '';
    document.getElementById('driver-experience').value = '';

    modal.classList.add('active');
}

function closeDriverModal() {
    document.getElementById('driver-modal').classList.remove('active');
}

function editDriver(id) {
    const driver = db.getDriverById(id);
    if (!driver) return;

    const modal = document.getElementById('driver-modal');
    document.getElementById('driver-modal-title').textContent = 'ドライバー編集';

    document.getElementById('driver-id').value = driver.id;
    document.getElementById('driver-code').value = driver.code;
    document.getElementById('driver-name').value = driver.name;

    // 生年月日を設定
    document.getElementById('driver-birthdate').value = driver.birthdate || '';
    document.getElementById('driver-age').value = driver.age;
    document.getElementById('driver-age-display').value = driver.age ? driver.age + '歳' : '';

    document.getElementById('driver-license').value = driver.license;

    // 運転開始年と中断年数を設定
    document.getElementById('driver-driving-start-year').value = driver.drivingStartYear || '';
    document.getElementById('driver-break-years').value = driver.breakYears || 0;
    document.getElementById('driver-experience').value = driver.experience;
    document.getElementById('driver-experience-display').value = driver.experience ? driver.experience + '年' : '';

    document.getElementById('driver-phone').value = driver.phone;
    document.getElementById('driver-hire-date').value = driver.hireDate;

    // 顔写真を設定
    document.getElementById('driver-photo').value = driver.photo || '';
    const preview = document.getElementById('driver-photo-preview');
    if (driver.photo) {
        preview.innerHTML = `<img src="${driver.photo}" style="max-width: 150px; max-height: 150px; border-radius: 50%; border: 3px solid #ddd; object-fit: cover;">`;
    } else {
        preview.innerHTML = '';
    }

    // スキルのチェックボックスを設定
    document.querySelectorAll('#driver-form input[type="checkbox"]').forEach(cb => {
        cb.checked = driver.specialSkills && driver.specialSkills.includes(cb.value);
    });

    modal.classList.add('active');
}

function deleteDriver(id) {
    if (confirm('このドライバーを削除しますか? 配送記録がある場合は削除できません。')) {
        const result = db.deleteDriver(id);
        if (result) {
            loadDriversList();
        } else {
            alert('このドライバーには配送記録があるため削除できません。');
        }
    }
}

function handleDriverSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('driver-id').value;

    // スキルを取得
    const specialSkills = [];
    document.querySelectorAll('#driver-form input[type="checkbox"]:checked').forEach(cb => {
        specialSkills.push(cb.value);
    });

    const driverData = {
        code: document.getElementById('driver-code').value,
        name: document.getElementById('driver-name').value,
        birthdate: document.getElementById('driver-birthdate').value,
        age: parseInt(document.getElementById('driver-age').value),
        license: document.getElementById('driver-license').value,
        drivingStartYear: parseInt(document.getElementById('driver-driving-start-year').value),
        breakYears: parseInt(document.getElementById('driver-break-years').value) || 0,
        experience: parseInt(document.getElementById('driver-experience').value),
        phone: document.getElementById('driver-phone').value,
        hireDate: document.getElementById('driver-hire-date').value,
        specialSkills: specialSkills,
        photo: document.getElementById('driver-photo').value || null
    };

    if (id) {
        db.updateDriver(parseInt(id), driverData);
    } else {
        db.addDriver(driverData);
    }

    closeDriverModal();
    loadDriversList();
}

function filterDrivers() {
    const searchText = document.getElementById('search-driver').value.toLowerCase();
    const filterLicense = document.getElementById('filter-driver-license').value;
    const rows = document.querySelectorAll('#drivers-list tr');

    rows.forEach(row => {
        const cells = row.cells;
        const codeText = cells[0].textContent.toLowerCase();
        const nameText = cells[1].textContent.toLowerCase();
        const licenseText = cells[3].textContent;

        let show = true;

        if (searchText && !codeText.includes(searchText) && !nameText.includes(searchText)) {
            show = false;
        }

        if (filterLicense && !licenseText.includes(filterLicense)) {
            show = false;
        }

        row.style.display = show ? '' : 'none';
    });
}

function initMaintenanceManagement() {
    document.getElementById('add-maintenance').addEventListener('click', openMaintenanceModal);
    document.getElementById('cancel-maintenance').addEventListener('click', closeMaintenanceModal);

    const maintenanceModal = document.getElementById('maintenance-modal');
    maintenanceModal.querySelector('.close').addEventListener('click', closeMaintenanceModal);

    document.getElementById('maintenance-form').addEventListener('submit', handleMaintenanceSubmit);
    document.getElementById('search-maintenance').addEventListener('input', filterMaintenances);
    document.getElementById('filter-maintenance-type').addEventListener('change', filterMaintenances);
    document.getElementById('filter-maintenance-status').addEventListener('change', filterMaintenances);

    initSearchableSelect('maintenance-truck', 'trucks');
}

function loadMaintenanceList() {
    const maintenances = db.getAllMaintenances();
    const trucks = db.getAllTrucks();
    const tbody = document.getElementById('maintenance-list');
    tbody.innerHTML = '';

    maintenances.sort((a, b) => {
        if (a.status !== b.status) {
            return a.status === 'scheduled' ? -1 : 1;
        }
        const dateA = new Date(a.nextDate || a.date || '9999-12-31');
        const dateB = new Date(b.nextDate || b.date || '9999-12-31');
        return dateA - dateB;
    });

    maintenances.forEach(maintenance => {
        const truck = trucks.find(t => t.id === maintenance.truckId);
        const statusText = maintenance.status === 'scheduled' ? '予定' : '完了';
        const costDisplay = maintenance.cost ? `¥${maintenance.cost.toLocaleString()}` : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${truck ? truck.number : '不明'}</td>
            <td>${maintenance.type}</td>
            <td>${maintenance.date || '-'}</td>
            <td>${maintenance.nextDate || '-'}</td>
            <td class="cost-value">${costDisplay}</td>
            <td>${maintenance.description || '-'}</td>
            <td><span class="status-badge status-${maintenance.status}">${statusText}</span></td>
            <td>
                <button class="btn-edit" onclick="editMaintenance(${maintenance.id})">編集</button>
                <button class="btn-danger" onclick="deleteMaintenance(${maintenance.id})">削除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openMaintenanceModal() {
    const modal = document.getElementById('maintenance-modal');
    const form = document.getElementById('maintenance-form');
    form.reset();

    document.getElementById('maintenance-modal-title').textContent = '新規メンテナンス登録';
    document.getElementById('maintenance-id').value = '';

    clearSelection('maintenance-truck', 'trucks');

    modal.classList.add('active');
}

function closeMaintenanceModal() {
    document.getElementById('maintenance-modal').classList.remove('active');
}

function editMaintenance(id) {
    const maintenance = db.getMaintenanceById(id);
    if (!maintenance) return;

    const modal = document.getElementById('maintenance-modal');
    document.getElementById('maintenance-modal-title').textContent = 'メンテナンス編集';

    document.getElementById('maintenance-id').value = maintenance.id;

    const truck = db.getTruckById(maintenance.truckId);
    if (truck) {
        selectOption('maintenance-truck', 'trucks', truck);
    }

    document.getElementById('maintenance-type').value = maintenance.type;
    document.getElementById('maintenance-date').value = maintenance.date || '';
    document.getElementById('maintenance-next-date').value = maintenance.nextDate || '';
    document.getElementById('maintenance-cost').value = maintenance.cost || '';
    document.getElementById('maintenance-description').value = maintenance.description || '';
    document.getElementById('maintenance-status').value = maintenance.status;

    modal.classList.add('active');
}

function deleteMaintenance(id) {
    if (confirm('このメンテナンス記録を削除しますか?')) {
        db.deleteMaintenance(id);
        loadMaintenanceList();
    }
}

function handleMaintenanceSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('maintenance-id').value;
    const truckId = parseInt(document.getElementById('maintenance-truck').value);

    if (!truckId) {
        alert('トラックを選択してください。');
        return;
    }

    const maintenanceData = {
        truckId: truckId,
        type: document.getElementById('maintenance-type').value,
        date: document.getElementById('maintenance-date').value || null,
        nextDate: document.getElementById('maintenance-next-date').value || null,
        cost: document.getElementById('maintenance-cost').value ? parseInt(document.getElementById('maintenance-cost').value) : null,
        description: document.getElementById('maintenance-description').value,
        status: document.getElementById('maintenance-status').value
    };

    if (id) {
        db.updateMaintenance(parseInt(id), maintenanceData);
    } else {
        db.addMaintenance(maintenanceData);
    }

    closeMaintenanceModal();
    loadMaintenanceList();
}

function filterMaintenances() {
    const searchText = document.getElementById('search-maintenance').value.toLowerCase();
    const filterType = document.getElementById('filter-maintenance-type').value;
    const filterStatus = document.getElementById('filter-maintenance-status').value;
    const rows = document.querySelectorAll('#maintenance-list tr');

    rows.forEach(row => {
        const cells = row.cells;
        const truckText = cells[0].textContent.toLowerCase();
        const typeText = cells[1].textContent;
        const statusElement = cells[6].querySelector('.status-badge');

        let show = true;

        if (searchText && !truckText.includes(searchText)) {
            show = false;
        }

        if (filterType && typeText !== filterType) {
            show = false;
        }

        if (filterStatus && !statusElement.classList.contains(`status-${filterStatus}`)) {
            show = false;
        }

        row.style.display = show ? '' : 'none';
    });
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
    const drivers = db.getAllDrivers();
    const stats = db.getStatistics();

    document.getElementById('total-deliveries').textContent = stats.totalDeliveries;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthDeliveries = deliveries.filter(d => {
        const startDate = new Date(d.startDate);
        return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
    });
    document.getElementById('month-deliveries').textContent = monthDeliveries.length;

    document.getElementById('completed-deliveries').textContent = stats.completedDeliveries;
    document.getElementById('inprogress-deliveries').textContent = stats.inProgressDeliveries;

    // コスト統計
    document.getElementById('total-fuel-cost').textContent = `¥${stats.totalFuelCost.toLocaleString()}`;
    document.getElementById('avg-fuel-cost').textContent = `¥${stats.averageFuelCost.toLocaleString()}`;
    document.getElementById('total-distance').textContent = `${stats.totalDistance.toLocaleString()} km`;
    document.getElementById('avg-distance').textContent = `${stats.averageDistance} km`;

    loadTruckUtilization(deliveries, trucks);
    loadCustomerRanking(deliveries, customers);
    loadMonthlyTrend(deliveries);
    loadDriverUtilization(deliveries, drivers);
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

function loadDriverUtilization(deliveries, drivers) {
    const container = document.getElementById('driver-utilization');
    container.innerHTML = '';

    const driverStats = drivers.map(driver => {
        const driverDeliveries = deliveries.filter(d => d.driverId === driver.id);
        return {
            driver,
            count: driverDeliveries.length
        };
    });

    driverStats.sort((a, b) => b.count - a.count);
    const top10 = driverStats.slice(0, 10);

    if (top10.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">データがありません</p>';
        return;
    }

    const maxCount = Math.max(...top10.map(d => d.count), 1);

    top10.forEach(stat => {
        const percentage = (stat.count / maxCount) * 100;
        const barHTML = `
            <div class="chart-bar">
                <div class="chart-label">${stat.driver.name} (${stat.driver.license})</div>
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

function initReportsManagement() {
    document.getElementById('print-reports').addEventListener('click', () => {
        window.print();
    });
}

function loadDashboard() {
    const deliveries = db.getAllDeliveries();
    const trucks = db.getAllTrucks();
    const customers = db.getAllCustomers();
    const drivers = db.getAllDrivers();

    // アラート表示
    const alerts = db.generateAlerts();
    const alertsContainer = document.getElementById('alerts-list');
    alertsContainer.innerHTML = '';

    if (alerts.length === 0) {
        alertsContainer.innerHTML = '<div class="alert-empty">現在アラートはありません</div>';
    } else {
        alerts.slice(0, 5).forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert-item priority-${alert.priority}`;
            alertDiv.innerHTML = `
                <div class="alert-message">${alert.message}</div>
                <div class="alert-detail">${alert.detail}</div>
            `;

            if (alert.deliveryId) {
                alertDiv.onclick = () => editDelivery(alert.deliveryId);
            } else if (alert.maintenanceId) {
                alertDiv.onclick = () => {
                    switchSection('maintenance');
                    setTimeout(() => editMaintenance(alert.maintenanceId), 300);
                };
            }

            alertsContainer.appendChild(alertDiv);
        });

        if (alerts.length > 5) {
            alertsContainer.innerHTML += `<div class="alert-detail" style="text-align: center; margin-top: 10px;">他 ${alerts.length - 5} 件のアラート</div>`;
        }
    }

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

        let truckDisplay = '';
        if (truck) {
            truckDisplay = `${truck.number} <span class="truck-type-badge type-${truck.type || '配達'}" style="font-size: 10px; padding: 2px 6px;">${truck.type || '配達'}</span>`;
        } else {
            truckDisplay = '<span class="truck-not-assigned" style="font-size: 11px;">未選択</span>';
        }

        const itemHTML = `
            <div class="delivery-item" onclick="editDelivery(${delivery.id})">
                <div class="delivery-item-header">
                    <div class="delivery-item-time">${delivery.startTime} - ${delivery.endTime}</div>
                    <div class="delivery-item-truck">${truckDisplay}</div>
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
    const drivers = db.getAllDrivers();

    deliveries.forEach(delivery => {
        const truck = trucks.find(t => t.id === delivery.truckId);
        const customer = customers.find(c => c.id === delivery.customerId);
        const driver = drivers.find(d => d.id === delivery.driverId);

        const detailedStatusText = {
            'preparing': '準備中',
            'loading': '積込中',
            'intransit': '配送中',
            'unloading': '荷卸中',
            'completed': '完了'
        }[delivery.detailedStatus || delivery.status];

        const destText = delivery.destinations ? delivery.destinations.join(' → ') : '';
        const startDateTime = `${delivery.startDate} ${delivery.startTime}`;
        const endDateTime = `${delivery.endDate} ${delivery.endTime}`;

        let truckDisplay = '';
        if (truck) {
            truckDisplay = `${truck.number} <span class="truck-type-badge type-${truck.type || '配達'}">${truck.type || '配達'}</span>`;
        } else {
            truckDisplay = '<span class="truck-not-assigned">未選択</span>';
        }

        let driverDisplay = '';
        if (driver) {
            driverDisplay = driver.name;
        } else {
            driverDisplay = '<span class="truck-not-assigned">未選択</span>';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${startDateTime}</td>
            <td>${endDateTime}</td>
            <td>${truckDisplay}</td>
            <td>${driverDisplay}</td>
            <td>${customer ? customer.name : ''}</td>
            <td>${destText}</td>
            <td>${delivery.cargo}</td>
            <td><span class="status-badge status-${delivery.detailedStatus || delivery.status}">${detailedStatusText}</span></td>
            <td>
                <button class="btn-edit" onclick="editDelivery(${delivery.id})">編集</button>
                <button class="btn-secondary" onclick="printDeliveryInstruction(${delivery.id})" title="配送指示書">🖨</button>
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
                case 'i':
                    e.preventDefault();
                    switchSection('drivers');
                    break;
                case 'c':
                    e.preventDefault();
                    switchSection('customers');
                    break;
                case 'm':
                    e.preventDefault();
                    switchSection('maintenance');
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
                    } else if (activeSection.id === 'drivers-section') {
                        openDriverModal();
                    } else if (activeSection.id === 'customers-section') {
                        openCustomerModal();
                    } else if (activeSection.id === 'maintenance-section') {
                        openMaintenanceModal();
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
            closeDriverModal();
            closeCustomerModal();
            closeMaintenanceModal();
            closeShortcutsModal();
            closeAISuggestionModal();
            closeInstructionModal();
        }
    });
}

function openShortcutsModal() {
    document.getElementById('shortcuts-modal').classList.add('active');
}

function closeShortcutsModal() {
    document.getElementById('shortcuts-modal').classList.remove('active');
}

// 配送指示書印刷
function printDeliveryInstruction(deliveryId) {
    const delivery = db.getDeliveryById(deliveryId);
    if (!delivery) return;

    const truck = db.getTruckById(delivery.truckId);
    const driver = db.getDriverById(delivery.driverId);
    const customer = db.getCustomerById(delivery.customerId);

    const modal = document.getElementById('delivery-instruction-modal');

    // 日付
    document.getElementById('instruction-date').textContent = new Date().toLocaleDateString('ja-JP');

    // 配送情報
    document.getElementById('instruction-delivery-id').textContent = `#${delivery.id}`;
    document.getElementById('instruction-start').textContent = `${delivery.startDate} ${delivery.startTime}`;
    document.getElementById('instruction-end').textContent = `${delivery.endDate} ${delivery.endTime}`;
    document.getElementById('instruction-truck').textContent = truck ? `${truck.number} - ${truck.plate} (${truck.type})` : '未選択';
    document.getElementById('instruction-driver').textContent = driver ? `${driver.name} (${driver.license}免許)` : '未選択';

    const detailedStatusText = {
        'preparing': '準備中',
        'loading': '積込中',
        'intransit': '配送中',
        'unloading': '荷卸中',
        'completed': '完了'
    }[delivery.detailedStatus || delivery.status];
    document.getElementById('instruction-status').textContent = detailedStatusText;

    // 顧客情報
    if (customer) {
        document.getElementById('instruction-customer').textContent = customer.name;
        document.getElementById('instruction-customer-address').textContent = customer.address;
        document.getElementById('instruction-customer-phone').textContent = customer.phone;
    } else {
        document.getElementById('instruction-customer').textContent = '不明';
        document.getElementById('instruction-customer-address').textContent = '-';
        document.getElementById('instruction-customer-phone').textContent = '-';
    }

    // 配送ルート
    const routeContainer = document.getElementById('instruction-route');
    routeContainer.innerHTML = '';
    if (delivery.destinations && delivery.destinations.length > 0) {
        delivery.destinations.forEach((dest, index) => {
            const routeDiv = document.createElement('div');
            routeDiv.className = 'instruction-route-item';
            routeDiv.innerHTML = `
                <div class="route-number">${index + 1}</div>
                <div style="flex: 1;">${dest}</div>
                ${index < delivery.destinations.length - 1 ? '<div class="route-arrow">↓</div>' : ''}
            `;
            routeContainer.appendChild(routeDiv);
        });
    } else {
        routeContainer.textContent = '行先が設定されていません';
    }

    // 積載内容
    document.getElementById('instruction-cargo').textContent = delivery.cargo || '未記入';

    // 備考
    let notes = delivery.notes || 'なし';
    if (delivery.distance) {
        notes += `\n予定距離: ${delivery.distance}km`;
    }
    document.getElementById('instruction-notes').textContent = notes;

    modal.classList.add('active');
}

function closeInstructionModal() {
    document.getElementById('delivery-instruction-modal').classList.remove('active');
}

function printInstruction() {
    window.print();
}

// AI提案機能
function openAISuggestionModal() {
    const startDate = document.getElementById('delivery-start-date').value;
    const startTime = document.getElementById('delivery-start-time').value;
    const endDate = document.getElementById('delivery-end-date').value;
    const endTime = document.getElementById('delivery-end-time').value;

    if (!startDate || !startTime || !endDate || !endTime) {
        alert('出発日時と到着日時を入力してください。');
        return;
    }

    const modal = document.getElementById('ai-suggestion-modal');
    const contentDiv = document.getElementById('ai-suggestion-content');
    const listDiv = document.getElementById('ai-suggestion-list');
    const confirmBtn = document.getElementById('confirm-ai-suggestion');

    contentDiv.innerHTML = '<p>指定された日時で利用可能なトラックを探しています...</p>';
    listDiv.innerHTML = '';
    confirmBtn.style.display = 'none';
    aiSuggestedTruck = null;

    modal.classList.add('active');

    // AIシミュレーション(少し待機)
    setTimeout(() => {
        const deliveryId = document.getElementById('delivery-id').value;
        const availableTrucks = db.findAvailableTrucks(
            startDate,
            startTime,
            endDate,
            endTime,
            deliveryId ? parseInt(deliveryId) : null
        );

        if (availableTrucks.length === 0) {
            contentDiv.innerHTML = '<p style="color: #e74c3c;">指定された日時で利用可能なトラックが見つかりませんでした。</p>';
        } else {
            contentDiv.innerHTML = `<p style="color: #27ae60;">✓ ${availableTrucks.length}台の利用可能なトラックが見つかりました。</p>`;

            availableTrucks.forEach(truck => {
                const div = document.createElement('div');
                div.className = 'ai-suggestion-item';
                div.innerHTML = `
                    <div class="ai-suggestion-header">
                        <span class="ai-suggestion-truck-number">${truck.number} - ${truck.plate}</span>
                        <span class="ai-suggestion-truck-type type-${truck.type || '配達'}">${truck.type || '配達'}</span>
                    </div>
                    <div class="ai-suggestion-details">
                        最大積載量: ${truck.capacity}kg | 購入日: ${truck.purchaseDate}
                    </div>
                `;

                div.addEventListener('click', () => {
                    document.querySelectorAll('.ai-suggestion-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    div.classList.add('selected');
                    aiSuggestedTruck = truck;
                    confirmBtn.style.display = 'inline-block';
                });

                listDiv.appendChild(div);
            });
        }
    }, 800);
}

function closeAISuggestionModal() {
    document.getElementById('ai-suggestion-modal').classList.remove('active');
    aiSuggestedTruck = null;
}

function confirmAISuggestion() {
    if (!aiSuggestedTruck) {
        alert('トラックを選択してください。');
        return;
    }

    selectOption('delivery-truck', 'trucks', aiSuggestedTruck);
    closeAISuggestionModal();
}

// AIドライバー提案機能
function openAIDriverSuggestionModal() {
    const startDate = document.getElementById('delivery-start-date').value;
    const startTime = document.getElementById('delivery-start-time').value;
    const endDate = document.getElementById('delivery-end-date').value;
    const endTime = document.getElementById('delivery-end-time').value;

    if (!startDate || !startTime || !endDate || !endTime) {
        alert('出発日時と到着日時を入力してください。');
        return;
    }

    const modal = document.getElementById('ai-suggestion-modal');
    const contentDiv = document.getElementById('ai-suggestion-content');
    const listDiv = document.getElementById('ai-suggestion-list');
    const confirmBtn = document.getElementById('confirm-ai-suggestion');

    contentDiv.innerHTML = '<p>指定された日時で利用可能なドライバーを探しています...</p>';
    listDiv.innerHTML = '';
    confirmBtn.style.display = 'none';
    aiSuggestedTruck = null; // ドライバー用に再利用

    modal.classList.add('active');

    // AIシミュレーション
    setTimeout(() => {
        const deliveryId = document.getElementById('delivery-id').value;
        const availableDrivers = db.findAvailableDrivers(
            startDate,
            startTime,
            endDate,
            endTime,
            deliveryId ? parseInt(deliveryId) : null
        );

        if (availableDrivers.length === 0) {
            contentDiv.innerHTML = '<p style="color: #e74c3c;">指定された日時で利用可能なドライバーが見つかりませんでした。</p>';
        } else {
            contentDiv.innerHTML = `<p style="color: #27ae60;">✓ ${availableDrivers.length}名の利用可能なドライバーが見つかりました。</p>`;

            availableDrivers.forEach(driver => {
                const div = document.createElement('div');
                div.className = 'ai-suggestion-item';

                const skillsHtml = driver.specialSkills && driver.specialSkills.length > 0
                    ? driver.specialSkills.map(skill => `<span class="skill-badge" style="font-size: 10px; padding: 2px 6px;">${skill}</span>`).join(' ')
                    : 'なし';

                div.innerHTML = `
                    <div class="ai-suggestion-header">
                        <span class="ai-suggestion-truck-number">${driver.code} - ${driver.name}</span>
                        <span class="ai-suggestion-truck-type">${driver.license}免許</span>
                    </div>
                    <div class="ai-suggestion-details">
                        年齢: ${driver.age}歳 | 経験: ${driver.experience}年 | 電話: ${driver.phone}
                    </div>
                    <div class="ai-suggestion-details" style="margin-top: 5px;">
                        特殊スキル: ${skillsHtml}
                    </div>
                `;

                div.addEventListener('click', () => {
                    document.querySelectorAll('.ai-suggestion-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    div.classList.add('selected');
                    aiSuggestedTruck = driver; // 再利用
                    confirmBtn.style.display = 'inline-block';
                });

                listDiv.appendChild(div);
            });
        }
    }, 800);
}

// 確定ボタンを修正（ドライバーとトラック両対応）
function confirmAISuggestionGeneric() {
    if (!aiSuggestedTruck) {
        alert('選択してください。');
        return;
    }

    // ドライバーかトラックか判定
    if (aiSuggestedTruck.license) {
        // ドライバー
        selectOption('delivery-driver', 'drivers', aiSuggestedTruck);
    } else {
        // トラック
        selectOption('delivery-truck', 'trucks', aiSuggestedTruck);
    }
    closeAISuggestionModal();
}

// 画像拡大表示モーダル
function showImageModal(imageSrc) {
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    modalImage.src = imageSrc;
    modal.classList.add('active');
}

function closeImageModal() {
    document.getElementById('image-modal').classList.remove('active');
}

// 画像モーダルの初期化
document.addEventListener('DOMContentLoaded', function() {
    const imageModal = document.getElementById('image-modal');
    if (imageModal) {
        imageModal.querySelector('.close').addEventListener('click', closeImageModal);
        imageModal.addEventListener('click', function(e) {
            if (e.target === imageModal) {
                closeImageModal();
            }
        });
    }

    // トラック配送履歴モーダルの初期化
    const historyModal = document.getElementById('truck-history-modal');
    if (historyModal) {
        historyModal.querySelector('.close').addEventListener('click', closeTruckHistoryModal);
        document.getElementById('close-truck-history').addEventListener('click', closeTruckHistoryModal);
        document.getElementById('history-filter-status').addEventListener('change', filterTruckHistory);
        document.getElementById('history-filter-start').addEventListener('change', filterTruckHistory);
        document.getElementById('history-filter-end').addEventListener('change', filterTruckHistory);
        document.getElementById('history-clear-filter').addEventListener('click', clearTruckHistoryFilter);
    }

    // ドライバー配送履歴モーダルの初期化
    const driverHistoryModal = document.getElementById('driver-history-modal');
    if (driverHistoryModal) {
        driverHistoryModal.querySelector('.close').addEventListener('click', closeDriverHistoryModal);
        document.getElementById('close-driver-history').addEventListener('click', closeDriverHistoryModal);
        document.getElementById('driver-history-filter-status').addEventListener('change', filterDriverHistory);
        document.getElementById('driver-history-filter-start').addEventListener('change', filterDriverHistory);
        document.getElementById('driver-history-filter-end').addEventListener('change', filterDriverHistory);
        document.getElementById('driver-history-clear-filter').addEventListener('click', clearDriverHistoryFilter);
    }
});

// トラック配送履歴表示
let currentTruckHistoryId = null;
let currentTruckHistoryDeliveries = [];

function showTruckHistory(truckId) {
    currentTruckHistoryId = truckId;
    const truck = db.getTruckById(truckId);
    if (!truck) return;

    const modal = document.getElementById('truck-history-modal');

    // トラック情報表示
    const maintenanceInfo = db.getTruckMaintenanceInfo(truckId);
    let imageDisplay = truck.image ? `<img src="${truck.image}" style="width: 100px; height: 75px; object-fit: cover; border-radius: 5px; margin-right: 15px; float: left;">` : '';

    document.getElementById('truck-history-info').innerHTML = `
        ${imageDisplay}
        <div>
            <h3 style="margin: 0 0 5px 0;">${truck.number} - ${truck.plate}</h3>
            <p style="margin: 5px 0;">
                <span class="truck-type-badge type-${truck.type || '配達'}">${truck.type || '配達'}</span>
                <span style="margin-left: 10px;">最大積載量: ${truck.capacity}kg</span>
                <span style="margin-left: 10px;">購入日: ${truck.purchaseDate}</span>
            </p>
        </div>
        <div style="clear: both;"></div>
    `;

    document.getElementById('truck-history-title').textContent = `配送履歴 - ${truck.number}`;

    // 配送履歴を取得
    const allDeliveries = db.getAllDeliveries();
    currentTruckHistoryDeliveries = allDeliveries.filter(d => d.truckId === truckId);

    // 統計計算
    const completedDeliveries = currentTruckHistoryDeliveries.filter(d => d.status === 'completed');
    const totalDistance = completedDeliveries.reduce((sum, d) => sum + (d.distance || 0), 0);
    const totalFuel = completedDeliveries.reduce((sum, d) => sum + (d.fuelCost || 0), 0);

    document.getElementById('history-total-count').textContent = currentTruckHistoryDeliveries.length;
    document.getElementById('history-completed-count').textContent = completedDeliveries.length;
    document.getElementById('history-total-distance').textContent = totalDistance.toLocaleString() + ' km';
    document.getElementById('history-total-fuel').textContent = '¥' + totalFuel.toLocaleString();

    // フィルタをクリア
    document.getElementById('history-filter-status').value = '';
    document.getElementById('history-filter-start').value = '';
    document.getElementById('history-filter-end').value = '';

    // 配送履歴リストを表示
    renderTruckHistory(currentTruckHistoryDeliveries);

    modal.classList.add('active');
}

function renderTruckHistory(deliveries) {
    const tbody = document.getElementById('truck-history-list');
    tbody.innerHTML = '';

    // 日付の新しい順にソート
    deliveries.sort((a, b) => {
        const dateA = new Date(a.startDate + ' ' + a.startTime);
        const dateB = new Date(b.startDate + ' ' + b.startTime);
        return dateB - dateA;
    });

    const drivers = db.getAllDrivers();
    const customers = db.getAllCustomers();

    deliveries.forEach(delivery => {
        const driver = drivers.find(d => d.id === delivery.driverId);
        const customer = customers.find(c => c.id === delivery.customerId);

        const detailedStatusText = {
            'preparing': '準備中',
            'loading': '積込中',
            'intransit': '配送中',
            'unloading': '荷卸中',
            'completed': '完了',
            'scheduled': '予定',
            'inprogress': '運転中'
        }[delivery.detailedStatus || delivery.status];

        const destText = delivery.destinations ? delivery.destinations.join(' → ') : '';
        const startDateTime = `${delivery.startDate} ${delivery.startTime}`;
        const endDateTime = `${delivery.endDate} ${delivery.endTime}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${delivery.id}</td>
            <td>${startDateTime}</td>
            <td>${endDateTime}</td>
            <td>${driver ? driver.name : '<span style="color: #999;">未選択</span>'}</td>
            <td>${customer ? customer.name : ''}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${destText}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${delivery.cargo}</td>
            <td><span class="status-badge status-${delivery.detailedStatus || delivery.status}">${detailedStatusText}</span></td>
            <td>
                <button class="btn-secondary" onclick="editDelivery(${delivery.id})" title="編集">✏️</button>
                <button class="btn-secondary" onclick="printDeliveryInstruction(${delivery.id})" title="配送指示書">🖨</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (deliveries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #999; padding: 40px;">配送履歴がありません</td></tr>';
    }
}

function filterTruckHistory() {
    const statusFilter = document.getElementById('history-filter-status').value;
    const startDateFilter = document.getElementById('history-filter-start').value;
    const endDateFilter = document.getElementById('history-filter-end').value;

    let filtered = [...currentTruckHistoryDeliveries];

    if (statusFilter) {
        filtered = filtered.filter(d => d.status === statusFilter || d.detailedStatus === statusFilter);
    }

    if (startDateFilter) {
        filtered = filtered.filter(d => d.startDate >= startDateFilter);
    }

    if (endDateFilter) {
        filtered = filtered.filter(d => d.startDate <= endDateFilter);
    }

    renderTruckHistory(filtered);
}

function clearTruckHistoryFilter() {
    document.getElementById('history-filter-status').value = '';
    document.getElementById('history-filter-start').value = '';
    document.getElementById('history-filter-end').value = '';
    renderTruckHistory(currentTruckHistoryDeliveries);
}

function closeTruckHistoryModal() {
    document.getElementById('truck-history-modal').classList.remove('active');
    currentTruckHistoryId = null;
    currentTruckHistoryDeliveries = [];
}

// ドライバー配送履歴表示
let currentDriverHistoryId = null;
let currentDriverHistoryDeliveries = [];

function showDriverHistory(driverId) {
    currentDriverHistoryId = driverId;
    const driver = db.getDriverById(driverId);
    if (!driver) return;

    const modal = document.getElementById('driver-history-modal');

    // ドライバー情報表示
    let photoDisplay = driver.photo ? `<img src="${driver.photo}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #ddd; margin-right: 15px; float: left;">` : '';

    const skillsHtml = driver.specialSkills && driver.specialSkills.length > 0
        ? driver.specialSkills.map(skill => `<span class="skill-badge">${skill}</span>`).join(' ')
        : 'なし';

    document.getElementById('driver-history-info').innerHTML = `
        ${photoDisplay}
        <div>
            <h3 style="margin: 0 0 5px 0;">${driver.code} - ${driver.name}</h3>
            <p style="margin: 5px 0;">
                <strong>年齢:</strong> ${driver.age}歳
                <span style="margin-left: 15px;"><strong>免許:</strong> ${driver.license}</span>
                <span style="margin-left: 15px;"><strong>経験年数:</strong> ${driver.experience}年</span>
            </p>
            <p style="margin: 5px 0;">
                <strong>電話:</strong> ${driver.phone}
                <span style="margin-left: 15px;"><strong>入社日:</strong> ${driver.hireDate}</span>
            </p>
            <p style="margin: 5px 0;">
                <strong>特殊スキル:</strong> ${skillsHtml}
            </p>
        </div>
        <div style="clear: both;"></div>
    `;

    document.getElementById('driver-history-title').textContent = `配送履歴 - ${driver.name}`;

    // 配送履歴を取得
    const allDeliveries = db.getAllDeliveries();
    currentDriverHistoryDeliveries = allDeliveries.filter(d => d.driverId === driverId);

    // 統計計算
    const completedDeliveries = currentDriverHistoryDeliveries.filter(d => d.status === 'completed');
    const totalDistance = completedDeliveries.reduce((sum, d) => sum + (d.distance || 0), 0);
    const totalFuel = completedDeliveries.reduce((sum, d) => sum + (d.fuelCost || 0), 0);

    document.getElementById('driver-history-total-count').textContent = currentDriverHistoryDeliveries.length;
    document.getElementById('driver-history-completed-count').textContent = completedDeliveries.length;
    document.getElementById('driver-history-total-distance').textContent = totalDistance.toLocaleString() + ' km';
    document.getElementById('driver-history-total-fuel').textContent = '¥' + totalFuel.toLocaleString();

    // フィルタをクリア
    document.getElementById('driver-history-filter-status').value = '';
    document.getElementById('driver-history-filter-start').value = '';
    document.getElementById('driver-history-filter-end').value = '';

    // 配送履歴リストを表示
    renderDriverHistory(currentDriverHistoryDeliveries);

    modal.classList.add('active');
}

function renderDriverHistory(deliveries) {
    const tbody = document.getElementById('driver-history-list');
    tbody.innerHTML = '';

    // 日付の新しい順にソート
    deliveries.sort((a, b) => {
        const dateA = new Date(a.startDate + ' ' + a.startTime);
        const dateB = new Date(b.startDate + ' ' + b.startTime);
        return dateB - dateA;
    });

    const trucks = db.getAllTrucks();
    const customers = db.getAllCustomers();

    deliveries.forEach(delivery => {
        const truck = trucks.find(t => t.id === delivery.truckId);
        const customer = customers.find(c => c.id === delivery.customerId);

        const detailedStatusText = {
            'preparing': '準備中',
            'loading': '積込中',
            'intransit': '配送中',
            'unloading': '荷卸中',
            'completed': '完了',
            'scheduled': '予定',
            'inprogress': '運転中'
        }[delivery.detailedStatus || delivery.status];

        const destText = delivery.destinations ? delivery.destinations.join(' → ') : '';
        const startDateTime = `${delivery.startDate} ${delivery.startTime}`;
        const endDateTime = `${delivery.endDate} ${delivery.endTime}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${delivery.id}</td>
            <td>${startDateTime}</td>
            <td>${endDateTime}</td>
            <td>${truck ? `${truck.number} <span class="truck-type-badge type-${truck.type || '配達'}" style="font-size: 10px; padding: 2px 6px;">${truck.type || '配達'}</span>` : '<span style="color: #999;">未選択</span>'}</td>
            <td>${customer ? customer.name : ''}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${destText}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${delivery.cargo}</td>
            <td><span class="status-badge status-${delivery.detailedStatus || delivery.status}">${detailedStatusText}</span></td>
            <td>
                <button class="btn-secondary" onclick="editDelivery(${delivery.id})" title="編集">✏️</button>
                <button class="btn-secondary" onclick="printDeliveryInstruction(${delivery.id})" title="配送指示書">🖨</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (deliveries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #999; padding: 40px;">配送履歴がありません</td></tr>';
    }
}

function filterDriverHistory() {
    const statusFilter = document.getElementById('driver-history-filter-status').value;
    const startDateFilter = document.getElementById('driver-history-filter-start').value;
    const endDateFilter = document.getElementById('driver-history-filter-end').value;

    let filtered = [...currentDriverHistoryDeliveries];

    if (statusFilter) {
        filtered = filtered.filter(d => d.status === statusFilter || d.detailedStatus === statusFilter);
    }

    if (startDateFilter) {
        filtered = filtered.filter(d => d.startDate >= startDateFilter);
    }

    if (endDateFilter) {
        filtered = filtered.filter(d => d.startDate <= endDateFilter);
    }

    renderDriverHistory(filtered);
}

function clearDriverHistoryFilter() {
    document.getElementById('driver-history-filter-status').value = '';
    document.getElementById('driver-history-filter-start').value = '';
    document.getElementById('driver-history-filter-end').value = '';
    renderDriverHistory(currentDriverHistoryDeliveries);
}

function closeDriverHistoryModal() {
    document.getElementById('driver-history-modal').classList.remove('active');
    currentDriverHistoryId = null;
    currentDriverHistoryDeliveries = [];
}
