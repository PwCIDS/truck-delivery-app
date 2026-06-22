class Database {
    constructor() {
        this.dataVersion = '2.0'; // データバージョン
        this.checkAndResetData();
        this.deliveries = this.loadData('deliveries') || [];
        this.trucks = this.loadData('trucks') || [];
        this.customers = this.loadData('customers') || [];
        this.initSampleData();
    }

    checkAndResetData() {
        const currentVersion = localStorage.getItem('dataVersion');
        if (currentVersion !== this.dataVersion) {
            console.log('新しいデータバージョンを検出しました。データをリセットします。');
            localStorage.clear();
            localStorage.setItem('dataVersion', this.dataVersion);
        }
    }

    loadData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    initSampleData() {
        if (this.trucks.length === 0) {
            this.trucks = [];
            const truckTypes = ['配達', '保冷', '活魚'];
            const plateAreas = ['品川', '練馬', '足立', '世田谷', '多摩', '横浜', '川崎', '相模', '千葉', '柏', 'さいたま', '大宮'];
            const plateKana = ['あ', 'い', 'う', 'え', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ'];

            for (let i = 1; i <= 50; i++) {
                const type = truckTypes[Math.floor(Math.random() * truckTypes.length)];
                const capacity = [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000][Math.floor(Math.random() * 8)];
                const plateArea = plateAreas[Math.floor(Math.random() * plateAreas.length)];
                const plateKanaChar = plateKana[Math.floor(Math.random() * plateKana.length)];
                const plateNumber = String(Math.floor(Math.random() * 9000) + 1000);
                const year = 2020 + Math.floor(Math.random() * 5);
                const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');

                this.trucks.push({
                    id: i,
                    number: `T-${String(i).padStart(3, '0')}`,
                    plate: `${plateArea} 500 ${plateKanaChar} ${plateNumber}`,
                    capacity: capacity,
                    purchaseDate: `${year}-${month}-${day}`,
                    status: 'available',
                    type: type
                });
            }
            this.saveData('trucks', this.trucks);
        }

        if (this.customers.length === 0) {
            this.customers = [];
            const companyTypes = ['株式会社', '有限会社', '合同会社', '合資会社'];
            const companySuffixes = ['商事', '物産', '運輸', '流通', '貿易', '産業', '工業', 'エンタープライズ', 'ホールディングス', 'コーポレーション', 'トレーディング', 'ロジスティクス', 'サービス', 'システムズ', 'テクノロジー'];
            const companyPrefixes = ['東日本', '西日本', '中央', '太平洋', '大和', '富士', '日興', 'グローバル', 'アジア', 'ジャパン', '東京', '関東', '関西', '全国'];
            const prefectures = [
                { name: '東京都', cities: ['千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区', '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区', '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区', '葛飾区', '江戸川区'] },
                { name: '神奈川県', cities: ['横浜市中区', '横浜市西区', '横浜市南区', '横浜市港北区', '川崎市川崎区', '川崎市幸区', '相模原市中央区', '藤沢市', '横須賀市', '平塚市'] },
                { name: '千葉県', cities: ['千葉市中央区', '千葉市美浜区', '船橋市', '松戸市', '市川市', '柏市', '浦安市', '習志野市'] },
                { name: '埼玉県', cities: ['さいたま市大宮区', 'さいたま市浦和区', '川口市', '所沢市', '越谷市', '草加市', '春日部市', '熊谷市'] },
                { name: '大阪府', cities: ['大阪市北区', '大阪市中央区', '大阪市西区', '大阪市天王寺区', '堺市堺区', '豊中市', '吹田市', '高槻市'] },
                { name: '愛知県', cities: ['名古屋市中区', '名古屋市中村区', '名古屋市東区', '豊田市', '岡崎市', '一宮市', '豊橋市'] },
                { name: '福岡県', cities: ['福岡市博多区', '福岡市中央区', '北九州市小倉北区', '久留米市', '飯塚市'] }
            ];
            const lastNames = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水'];
            const firstNames = ['太郎', '次郎', '三郎', '一郎', '健一', '誠', '隆', '浩', '修', '勇', '花子', '美咲', '愛', '優子', '恵子', '由美', '真由美', '智子', '陽子', '麻美'];

            for (let i = 1; i <= 100; i++) {
                const companyType = companyTypes[Math.floor(Math.random() * companyTypes.length)];
                const companySuffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
                const companyPrefix = Math.random() > 0.3 ? companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)] : '';
                const companyName = `${companyType}${companyPrefix}${companySuffix}`;

                const prefecture = prefectures[Math.floor(Math.random() * prefectures.length)];
                const city = prefecture.cities[Math.floor(Math.random() * prefecture.cities.length)];
                const buildingNumber = `${Math.floor(Math.random() * 5) + 1}-${Math.floor(Math.random() * 20) + 1}-${Math.floor(Math.random() * 20) + 1}`;
                const address = `${prefecture.name}${city}${buildingNumber}`;

                const areaCode = prefecture.name.includes('東京') ? '03' :
                                prefecture.name.includes('神奈川') ? '045' :
                                prefecture.name.includes('千葉') ? '043' :
                                prefecture.name.includes('埼玉') ? '048' :
                                prefecture.name.includes('大阪') ? '06' :
                                prefecture.name.includes('愛知') ? '052' : '092';
                const phoneNumber = `${areaCode}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;

                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const contactName = `${lastName} ${firstName}`;

                this.customers.push({
                    id: i,
                    code: `C-${String(i).padStart(3, '0')}`,
                    name: companyName,
                    address: address,
                    phone: phoneNumber,
                    contact: contactName
                });
            }
            this.saveData('customers', this.customers);
        }

        if (this.deliveries.length === 0) {
            this.deliveries = this.generateSampleDeliveries();
            this.saveData('deliveries', this.deliveries);
        }
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    generateSampleDeliveries() {
        const deliveries = [];
        let id = 1;
        const currentYear = new Date().getFullYear();
        const totalTrucks = this.trucks.length;
        const totalCustomers = this.customers.length;

        const destinations = [
            ['東京都千代田区'],
            ['東京都港区', '東京都品川区'],
            ['神奈川県横浜市'],
            ['神奈川県川崎市', '神奈川県横浜市'],
            ['埼玉県さいたま市'],
            ['千葉県千葉市', '千葉県船橋市'],
            ['静岡県静岡市'],
            ['愛知県名古屋市'],
            ['大阪府大阪市'],
            ['福岡県福岡市'],
            ['東京都新宿区', '東京都渋谷区', '東京都世田谷区'],
            ['神奈川県相模原市'],
            ['千葉県柏市'],
            ['埼玉県川口市', '埼玉県越谷市'],
            ['東京都中央区', '東京都台東区'],
            ['神奈川県藤沢市'],
            ['千葉県市川市', '千葉県松戸市'],
            ['埼玉県所沢市'],
            ['大阪府堺市'],
            ['愛知県豊田市']
        ];

        const cargoTypes = [
            '電化製品 500kg',
            '食品 800kg',
            '衣料品 300kg',
            '建材 1200kg',
            '医薬品 200kg',
            '精密機器 400kg',
            '日用品 600kg',
            '書籍 350kg',
            '家具 900kg',
            '工業部品 750kg',
            '飲料 1000kg',
            '冷凍食品 650kg',
            '化学製品 550kg',
            '文房具 250kg',
            'OA機器 450kg',
            '生鮮食品 700kg',
            '冷凍魚介類 850kg',
            '活魚 300kg',
            '野菜・果物 600kg',
            '加工食品 950kg'
        ];

        // 4月のデータ（30日分）
        for (let day = 1; day <= 30; day++) {
            const deliveriesPerDay = Math.floor(Math.random() * 8) + 5; // 5-12件/日

            for (let i = 0; i < deliveriesPerDay; i++) {
                const truckId = Math.floor(Math.random() * totalTrucks) + 1;
                const customerId = Math.floor(Math.random() * totalCustomers) + 1;
                const startHour = 8 + Math.floor(Math.random() * 3);
                const duration = Math.floor(Math.random() * 5) + 4; // 4-8時間
                const isMultiDay = Math.random() > 0.8;

                const startDate = new Date(currentYear, 3, day); // 3 = April (0-indexed)
                const endDate = isMultiDay ? new Date(currentYear, 3, day + 1) : startDate;

                deliveries.push({
                    id: id++,
                    truckId,
                    customerId,
                    startDate: this.formatDate(startDate),
                    startTime: `${String(startHour).padStart(2, '0')}:00`,
                    endDate: this.formatDate(endDate),
                    endTime: `${String((startHour + duration) % 24).padStart(2, '0')}:00`,
                    destinations: destinations[Math.floor(Math.random() * destinations.length)],
                    cargo: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
                    status: 'completed'
                });
            }
        }

        // 5月のデータ（31日分）
        for (let day = 1; day <= 31; day++) {
            const deliveriesPerDay = Math.floor(Math.random() * 10) + 6; // 6-15件/日

            for (let i = 0; i < deliveriesPerDay; i++) {
                const truckId = Math.floor(Math.random() * totalTrucks) + 1;
                const customerId = Math.floor(Math.random() * totalCustomers) + 1;
                const startHour = 7 + Math.floor(Math.random() * 4);
                const duration = Math.floor(Math.random() * 6) + 4; // 4-9時間
                const isMultiDay = Math.random() > 0.75;

                const startDate = new Date(currentYear, 4, day); // 4 = May
                const endDate = isMultiDay ? new Date(currentYear, 4, day + 1) : startDate;

                deliveries.push({
                    id: id++,
                    truckId,
                    customerId,
                    startDate: this.formatDate(startDate),
                    startTime: `${String(startHour).padStart(2, '0')}:00`,
                    endDate: this.formatDate(endDate),
                    endTime: `${String((startHour + duration) % 24).padStart(2, '0')}:00`,
                    destinations: destinations[Math.floor(Math.random() * destinations.length)],
                    cargo: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
                    status: 'completed'
                });
            }
        }

        // 6月のデータ（現在の日付まで + 未来の予定）
        const today = new Date();
        const currentDay = today.getMonth() === 5 ? today.getDate() : 30;

        for (let day = 1; day <= 30; day++) {
            const deliveriesPerDay = Math.floor(Math.random() * 10) + 6; // 6-15件/日

            for (let i = 0; i < deliveriesPerDay; i++) {
                const truckId = Math.floor(Math.random() * totalTrucks) + 1;
                const customerId = Math.floor(Math.random() * totalCustomers) + 1;
                const startHour = 7 + Math.floor(Math.random() * 5);
                const duration = Math.floor(Math.random() * 6) + 4; // 4-9時間
                const isMultiDay = Math.random() > 0.8;

                const startDate = new Date(currentYear, 5, day); // 5 = June
                const endDate = isMultiDay ? new Date(currentYear, 5, day + 1) : startDate;

                let status;
                if (day < currentDay - 1) {
                    status = 'completed';
                } else if (day === currentDay - 1 || day === currentDay) {
                    status = Math.random() > 0.5 ? 'inprogress' : 'completed';
                } else {
                    status = 'scheduled';
                }

                deliveries.push({
                    id: id++,
                    truckId,
                    customerId,
                    startDate: this.formatDate(startDate),
                    startTime: `${String(startHour).padStart(2, '0')}:00`,
                    endDate: this.formatDate(endDate),
                    endTime: `${String((startHour + duration) % 24).padStart(2, '0')}:00`,
                    destinations: destinations[Math.floor(Math.random() * destinations.length)],
                    cargo: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
                    status
                });
            }
        }

        return deliveries;
    }

    getAllDeliveries() {
        return this.deliveries;
    }

    getDeliveryById(id) {
        return this.deliveries.find(d => d.id === id);
    }

    addDelivery(delivery) {
        const newId = this.deliveries.length > 0 ? Math.max(...this.deliveries.map(d => d.id)) + 1 : 1;
        delivery.id = newId;
        delivery.status = this.getDeliveryStatus(delivery.startDate, delivery.startTime, delivery.endDate, delivery.endTime);
        this.deliveries.push(delivery);
        this.saveData('deliveries', this.deliveries);
        return delivery;
    }

    updateDelivery(id, updatedDelivery) {
        const index = this.deliveries.findIndex(d => d.id === id);
        if (index !== -1) {
            updatedDelivery.id = id;
            if (updatedDelivery.manualStatus) {
                updatedDelivery.status = updatedDelivery.manualStatus;
            } else {
                updatedDelivery.status = this.getDeliveryStatus(updatedDelivery.startDate, updatedDelivery.startTime, updatedDelivery.endDate, updatedDelivery.endTime);
            }
            this.deliveries[index] = updatedDelivery;
            this.saveData('deliveries', this.deliveries);
            return true;
        }
        return false;
    }

    deleteDelivery(id) {
        const index = this.deliveries.findIndex(d => d.id === id);
        if (index !== -1) {
            this.deliveries.splice(index, 1);
            this.saveData('deliveries', this.deliveries);
            return true;
        }
        return false;
    }

    getDeliveryStatus(startDate, startTime, endDate, endTime) {
        const now = new Date();

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const startDateTime = new Date(startDate);
        startDateTime.setHours(startHour, startMinute);

        const endDateTime = new Date(endDate);
        endDateTime.setHours(endHour, endMinute);

        if (now < startDateTime) {
            return 'scheduled';
        } else if (now >= startDateTime && now <= endDateTime) {
            return 'inprogress';
        } else {
            return 'completed';
        }
    }

    isTruckAvailable(truckId, startDate, startTime, endDate, endTime, excludeDeliveryId = null) {
        const [newStartHour, newStartMinute] = startTime.split(':').map(Number);
        const [newEndHour, newEndMinute] = endTime.split(':').map(Number);

        const newStartDateTime = new Date(startDate);
        newStartDateTime.setHours(newStartHour, newStartMinute, 0, 0);

        const newEndDateTime = new Date(endDate);
        newEndDateTime.setHours(newEndHour, newEndMinute, 0, 0);

        const deliveries = this.deliveries.filter(d => {
            if (excludeDeliveryId && d.id === excludeDeliveryId) {
                return false;
            }
            return d.truckId === truckId;
        });

        for (const delivery of deliveries) {
            const [existingStartHour, existingStartMinute] = delivery.startTime.split(':').map(Number);
            const [existingEndHour, existingEndMinute] = delivery.endTime.split(':').map(Number);

            const existingStartDateTime = new Date(delivery.startDate);
            existingStartDateTime.setHours(existingStartHour, existingStartMinute, 0, 0);

            const existingEndDateTime = new Date(delivery.endDate);
            existingEndDateTime.setHours(existingEndHour, existingEndMinute, 0, 0);

            if (!(newEndDateTime <= existingStartDateTime || newStartDateTime >= existingEndDateTime)) {
                return false;
            }
        }

        return true;
    }

    getAllTrucks() {
        return this.trucks;
    }

    getTruckById(id) {
        return this.trucks.find(t => t.id === id);
    }

    addTruck(truck) {
        const newId = this.trucks.length > 0 ? Math.max(...this.trucks.map(t => t.id)) + 1 : 1;
        truck.id = newId;
        truck.status = 'available';
        if (!truck.type) {
            truck.type = '配達'; // デフォルトは配達
        }
        this.trucks.push(truck);
        this.saveData('trucks', this.trucks);
        return truck;
    }

    updateTruck(id, updatedTruck) {
        const index = this.trucks.findIndex(t => t.id === id);
        if (index !== -1) {
            updatedTruck.id = id;
            updatedTruck.status = this.trucks[index].status;
            if (!updatedTruck.type) {
                updatedTruck.type = this.trucks[index].type || '配達';
            }
            this.trucks[index] = updatedTruck;
            this.saveData('trucks', this.trucks);
            return true;
        }
        return false;
    }

    deleteTruck(id) {
        const hasDeliveries = this.deliveries.some(d => d.truckId === id);
        if (hasDeliveries) {
            return false;
        }

        const index = this.trucks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.trucks.splice(index, 1);
            this.saveData('trucks', this.trucks);
            return true;
        }
        return false;
    }

    getAllCustomers() {
        return this.customers;
    }

    getCustomerById(id) {
        return this.customers.find(c => c.id === id);
    }

    addCustomer(customer) {
        const newId = this.customers.length > 0 ? Math.max(...this.customers.map(c => c.id)) + 1 : 1;
        customer.id = newId;
        this.customers.push(customer);
        this.saveData('customers', this.customers);
        return customer;
    }

    updateCustomer(id, updatedCustomer) {
        const index = this.customers.findIndex(c => c.id === id);
        if (index !== -1) {
            updatedCustomer.id = id;
            this.customers[index] = updatedCustomer;
            this.saveData('customers', this.customers);
            return true;
        }
        return false;
    }

    deleteCustomer(id) {
        const hasDeliveries = this.deliveries.some(d => d.customerId === id);
        if (hasDeliveries) {
            return false;
        }

        const index = this.customers.findIndex(c => c.id === id);
        if (index !== -1) {
            this.customers.splice(index, 1);
            this.saveData('customers', this.customers);
            return true;
        }
        return false;
    }

    // AI機能: 空きトラックを探す
    findAvailableTrucks(startDate, startTime, endDate, endTime, excludeDeliveryId = null) {
        const availableTrucks = [];

        for (const truck of this.trucks) {
            if (this.isTruckAvailable(truck.id, startDate, startTime, endDate, endTime, excludeDeliveryId)) {
                availableTrucks.push(truck);
            }
        }

        return availableTrucks;
    }
}
