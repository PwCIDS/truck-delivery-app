class Database {
    constructor() {
        this.dataVersion = '7.0'; // データバージョン（ドライバー顔写真を動物に変更）
        this.checkAndResetData();
        this.deliveries = this.loadData('deliveries') || [];
        this.trucks = this.loadData('trucks') || [];
        this.customers = this.loadData('customers') || [];
        this.drivers = this.loadData('drivers') || [];
        this.maintenances = this.loadData('maintenances') || [];
        this.alerts = this.loadData('alerts') || [];
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

    generateDriverSkills() {
        const allSkills = ['保冷車運転', '活魚車運転', '長距離運転', 'フォークリフト', '危険物取扱'];
        const numSkills = Math.floor(Math.random() * 3); // 0-2個のスキル
        const skills = [];
        for (let i = 0; i < numSkills; i++) {
            const skill = allSkills[Math.floor(Math.random() * allSkills.length)];
            if (!skills.includes(skill)) {
                skills.push(skill);
            }
        }
        return skills;
    }

    generateTruckImage(truckNumber, truckType) {
        // トラックタイプに応じた色を設定
        const colors = {
            '配達': { body: '#4A90E2', accent: '#357ABD', text: '#2C5F8D' },
            '保冷': { body: '#5CB85C', accent: '#449D44', text: '#357935' },
            '活魚': { body: '#F39C12', accent: '#E67E22', text: '#D35400' }
        };
        const color = colors[truckType] || colors['配達'];

        // トラック番号から一意のパターンを生成
        const seed = parseInt(truckNumber.replace(/\D/g, ''));
        const pattern1 = (seed * 13) % 360;
        const pattern2 = (seed * 17) % 100;
        const windowStyle = (seed % 3) + 1;

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
            <!-- 背景 -->
            <rect width="400" height="300" fill="#E8F4F8"/>
            <rect x="0" y="200" width="400" height="100" fill="#7A8A96"/>

            <!-- 道路のライン -->
            <rect x="0" y="245" width="80" height="10" fill="#FFF" opacity="0.8"/>
            <rect x="120" y="245" width="80" height="10" fill="#FFF" opacity="0.8"/>
            <rect x="240" y="245" width="80" height="10" fill="#FFF" opacity="0.8"/>

            <!-- トラック本体（荷台） -->
            <rect x="80" y="110" width="220" height="90" fill="${color.body}" stroke="${color.accent}" stroke-width="3"/>
            <rect x="85" y="115" width="210" height="80" fill="${color.accent}" opacity="0.3"/>

            <!-- トラックタイプ表示 -->
            <text x="190" y="160" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">${truckType}</text>

            <!-- キャビン -->
            <path d="M 300,130 L 360,130 L 360,200 L 300,200 Z" fill="${color.accent}" stroke="${color.text}" stroke-width="2"/>
            <rect x="305" y="135" width="50" height="40" fill="${color.body}" opacity="0.5"/>

            <!-- 窓 -->
            ${windowStyle === 1 ? '<rect x="310" y="140" width="20" height="25" fill="#B3E5FC" stroke="#0277BD" stroke-width="1"/>' : ''}
            ${windowStyle === 2 ? '<circle cx="320" cy="152" r="12" fill="#B3E5FC" stroke="#0277BD" stroke-width="1"/>' : ''}
            ${windowStyle === 3 ? '<path d="M 310,140 L 330,140 L 330,165 L 310,165 Z" fill="#B3E5FC" stroke="#0277BD" stroke-width="1"/>' : ''}
            <rect x="335" y="140" width="18" height="25" fill="#B3E5FC" stroke="#0277BD" stroke-width="1"/>

            <!-- 車輪 -->
            <circle cx="130" cy="200" r="25" fill="#2C3E50" stroke="#34495E" stroke-width="3"/>
            <circle cx="130" cy="200" r="15" fill="#7F8C8D"/>
            <circle cx="130" cy="200" r="8" fill="#34495E"/>

            <circle cx="250" cy="200" r="25" fill="#2C3E50" stroke="#34495E" stroke-width="3"/>
            <circle cx="250" cy="200" r="15" fill="#7F8C8D"/>
            <circle cx="250" cy="200" r="8" fill="#34495E"/>

            <circle cx="340" cy="200" r="25" fill="#2C3E50" stroke="#34495E" stroke-width="3"/>
            <circle cx="340" cy="200" r="15" fill="#7F8C8D"/>
            <circle cx="340" cy="200" r="8" fill="#34495E"/>

            <!-- ライト -->
            <circle cx="355" cy="180" r="6" fill="#FFF9C4" stroke="#F57F17" stroke-width="1"/>
            <circle cx="355" cy="195" r="5" fill="#FFCDD2" stroke="#C62828" stroke-width="1"/>

            <!-- トラックナンバー -->
            <rect x="75" y="185" width="60" height="15" fill="white" stroke="${color.text}" stroke-width="2" rx="2"/>
            <text x="105" y="197" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${color.text}" text-anchor="middle">${truckNumber}</text>

            <!-- 装飾パターン（トラックごとに異なる） -->
            <line x1="80" y1="125" x2="300" y2="125" stroke="white" stroke-width="2" opacity="0.5"/>
            <line x1="80" y1="185" x2="300" y2="185" stroke="white" stroke-width="2" opacity="0.5"/>

            ${pattern2 > 50 ? `<circle cx="${90 + pattern2}" cy="150" r="8" fill="white" opacity="0.3"/>` : ''}
            ${pattern2 > 70 ? `<rect x="${100 + pattern2}" y="140" width="15" height="15" fill="white" opacity="0.2"/>` : ''}
        </svg>`;

        return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    }

    generateDriverPhoto(driverName, driverId) {
        // ドライバーIDから動物の種類を決定
        const animals = [
            'cat', 'dog', 'rabbit', 'bear', 'panda',
            'fox', 'raccoon', 'hamster', 'koala', 'lion'
        ];
        const seed = driverId;
        const animalType = animals[seed % animals.length];
        const hue = (seed * 37) % 360;

        let svg = '';

        if (animalType === 'cat') {
            // 猫
            const catColor = `hsl(${hue}, 60%, 65%)`;
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#E8F4F8"/>
                <!-- 耳 -->
                <path d="M 60,50 L 50,20 L 80,50 Z" fill="${catColor}" stroke="#333" stroke-width="2"/>
                <path d="M 140,50 L 150,20 L 120,50 Z" fill="${catColor}" stroke="#333" stroke-width="2"/>
                <path d="M 60,45 L 55,25 L 75,45 Z" fill="#FFB6C1"/>
                <path d="M 140,45 L 145,25 L 125,45 Z" fill="#FFB6C1"/>
                <!-- 顔 -->
                <circle cx="100" cy="100" r="50" fill="${catColor}" stroke="#333" stroke-width="2"/>
                <!-- 目 -->
                <ellipse cx="80" cy="90" rx="10" ry="15" fill="#FFD700"/>
                <ellipse cx="80" cy="92" rx="4" ry="10" fill="#000"/>
                <ellipse cx="120" cy="90" rx="10" ry="15" fill="#FFD700"/>
                <ellipse cx="120" cy="92" rx="4" ry="10" fill="#000"/>
                <!-- 鼻 -->
                <path d="M 100,105 L 95,110 L 100,112 L 105,110 Z" fill="#FF69B4"/>
                <!-- ヒゲ -->
                <line x1="50" y1="105" x2="75" y2="105" stroke="#333" stroke-width="1"/>
                <line x1="50" y1="110" x2="75" y2="108" stroke="#333" stroke-width="1"/>
                <line x1="125" y1="105" x2="150" y2="105" stroke="#333" stroke-width="1"/>
                <line x1="125" y1="108" x2="150" y2="110" stroke="#333" stroke-width="1"/>
                <!-- 口 -->
                <path d="M 100,112 Q 90,120 85,115" stroke="#333" stroke-width="2" fill="none"/>
                <path d="M 100,112 Q 110,120 115,115" stroke="#333" stroke-width="2" fill="none"/>
                <!-- 名前 -->
                <rect x="10" y="175" width="180" height="20" fill="white" opacity="0.9" rx="3"/>
                <text x="100" y="189" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#2C3E50" text-anchor="middle">${driverName} 🐱</text>
            </svg>`;
        } else if (animalType === 'dog') {
            // 犬
            const dogColor = `hsl(${(hue + 30) % 360}, 50%, 60%)`;
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#E8F4F8"/>
                <!-- 耳 -->
                <ellipse cx="60" cy="80" rx="20" ry="35" fill="${dogColor}" stroke="#333" stroke-width="2"/>
                <ellipse cx="140" cy="80" rx="20" ry="35" fill="${dogColor}" stroke="#333" stroke-width="2"/>
                <!-- 顔 -->
                <circle cx="100" cy="100" r="50" fill="${dogColor}" stroke="#333" stroke-width="2"/>
                <ellipse cx="100" cy="120" rx="35" ry="30" fill="#F5DEB3"/>
                <!-- 目 -->
                <circle cx="80" cy="90" r="8" fill="#000"/>
                <circle cx="82" cy="88" r="3" fill="white"/>
                <circle cx="120" cy="90" r="8" fill="#000"/>
                <circle cx="122" cy="88" r="3" fill="white"/>
                <!-- 鼻 -->
                <ellipse cx="100" cy="110" rx="12" ry="10" fill="#333"/>
                <!-- 舌 -->
                <ellipse cx="100" cy="130" rx="10" ry="8" fill="#FF6B9D"/>
                <!-- 口 -->
                <path d="M 100,110 Q 85,125 80,120" stroke="#333" stroke-width="2" fill="none"/>
                <path d="M 100,110 Q 115,125 120,120" stroke="#333" stroke-width="2" fill="none"/>
                <!-- 名前 -->
                <rect x="10" y="175" width="180" height="20" fill="white" opacity="0.9" rx="3"/>
                <text x="100" y="189" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#2C3E50" text-anchor="middle">${driverName} 🐶</text>
            </svg>`;
        } else if (animalType === 'rabbit') {
            // うさぎ
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#E8F4F8"/>
                <!-- 耳 -->
                <ellipse cx="70" cy="40" rx="15" ry="45" fill="#FFE4E1" stroke="#333" stroke-width="2"/>
                <ellipse cx="70" cy="40" rx="8" ry="35" fill="#FFB6C1"/>
                <ellipse cx="130" cy="40" rx="15" ry="45" fill="#FFE4E1" stroke="#333" stroke-width="2"/>
                <ellipse cx="130" cy="40" rx="8" ry="35" fill="#FFB6C1"/>
                <!-- 顔 -->
                <circle cx="100" cy="100" r="50" fill="#FFE4E1" stroke="#333" stroke-width="2"/>
                <!-- 目 -->
                <circle cx="80" cy="90" r="8" fill="#FF1493"/>
                <circle cx="82" cy="88" r="3" fill="white"/>
                <circle cx="120" cy="90" r="8" fill="#FF1493"/>
                <circle cx="122" cy="88" r="3" fill="white"/>
                <!-- 鼻 -->
                <ellipse cx="100" cy="105" rx="6" ry="4" fill="#FF69B4"/>
                <!-- ヒゲ -->
                <line x1="60" y1="105" x2="85" y2="105" stroke="#333" stroke-width="1"/>
                <line x1="60" y1="110" x2="85" y2="108" stroke="#333" stroke-width="1"/>
                <line x1="115" y1="105" x2="140" y2="105" stroke="#333" stroke-width="1"/>
                <line x1="115" y1="108" x2="140" y2="110" stroke="#333" stroke-width="1"/>
                <!-- 前歯 -->
                <rect x="95" y="115" width="5" height="8" fill="white" stroke="#333" stroke-width="1"/>
                <rect x="100" y="115" width="5" height="8" fill="white" stroke="#333" stroke-width="1"/>
                <!-- 名前 -->
                <rect x="10" y="175" width="180" height="20" fill="white" opacity="0.9" rx="3"/>
                <text x="100" y="189" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#2C3E50" text-anchor="middle">${driverName} 🐰</text>
            </svg>`;
        } else if (animalType === 'bear') {
            // くま
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#E8F4F8"/>
                <!-- 耳 -->
                <circle cx="60" cy="60" r="25" fill="#8B4513" stroke="#333" stroke-width="2"/>
                <circle cx="60" cy="60" r="15" fill="#DEB887"/>
                <circle cx="140" cy="60" r="25" fill="#8B4513" stroke="#333" stroke-width="2"/>
                <circle cx="140" cy="60" r="15" fill="#DEB887"/>
                <!-- 顔 -->
                <circle cx="100" cy="100" r="55" fill="#8B4513" stroke="#333" stroke-width="2"/>
                <!-- マズル -->
                <ellipse cx="100" cy="115" rx="35" ry="30" fill="#DEB887" stroke="#333" stroke-width="2"/>
                <!-- 目 -->
                <circle cx="80" cy="85" r="6" fill="#000"/>
                <circle cx="81" cy="83" r="2" fill="white"/>
                <circle cx="120" cy="85" r="6" fill="#000"/>
                <circle cx="121" cy="83" r="2" fill="white"/>
                <!-- 鼻 -->
                <ellipse cx="100" cy="115" rx="10" ry="8" fill="#333"/>
                <!-- 口 -->
                <path d="M 100,115 Q 90,130 85,125" stroke="#333" stroke-width="2" fill="none"/>
                <path d="M 100,115 Q 110,130 115,125" stroke="#333" stroke-width="2" fill="none"/>
                <!-- 名前 -->
                <rect x="10" y="175" width="180" height="20" fill="white" opacity="0.9" rx="3"/>
                <text x="100" y="189" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#2C3E50" text-anchor="middle">${driverName} 🐻</text>
            </svg>`;
        } else if (animalType === 'panda') {
            // パンダ
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#E8F4F8"/>
                <!-- 耳 -->
                <circle cx="60" cy="65" r="22" fill="#000" stroke="#333" stroke-width="2"/>
                <circle cx="140" cy="65" r="22" fill="#000" stroke="#333" stroke-width="2"/>
                <!-- 顔 -->
                <circle cx="100" cy="100" r="50" fill="#FFF" stroke="#333" stroke-width="2"/>
                <!-- 目の周り（黒） -->
                <ellipse cx="75" cy="90" rx="18" ry="20" fill="#000"/>
                <ellipse cx="125" cy="90" rx="18" ry="20" fill="#000"/>
                <!-- 目 -->
                <circle cx="75" cy="90" r="8" fill="#FFF"/>
                <circle cx="75" cy="90" r="5" fill="#000"/>
                <circle cx="125" cy="90" r="8" fill="#FFF"/>
                <circle cx="125" cy="90" r="5" fill="#000"/>
                <!-- 鼻 -->
                <ellipse cx="100" cy="110" rx="8" ry="6" fill="#000"/>
                <!-- 口 -->
                <path d="M 100,110 Q 90,120 85,115" stroke="#000" stroke-width="2" fill="none"/>
                <path d="M 100,110 Q 110,120 115,115" stroke="#000" stroke-width="2" fill="none"/>
                <!-- 名前 -->
                <rect x="10" y="175" width="180" height="20" fill="white" opacity="0.9" rx="3"/>
                <text x="100" y="189" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#2C3E50" text-anchor="middle">${driverName} 🐼</text>
            </svg>`;
        } else if (animalType === 'fox') {
            // きつね
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#E8F4F8"/>
                <!-- 耳 -->
                <path d="M 55,50 L 40,10 L 75,60 Z" fill="#FF8C00" stroke="#333" stroke-width="2"/>
                <path d="M 58,50 L 50,20 L 72,58 Z" fill="#FFF"/>
                <path d="M 145,50 L 160,10 L 125,60 Z" fill="#FF8C00" stroke="#333" stroke-width="2"/>
                <path d="M 142,50 L 150,20 L 128,58 Z" fill="#FFF"/>
                <!-- 顔 -->
                <circle cx="100" cy="100" r="50" fill="#FF8C00" stroke="#333" stroke-width="2"/>
                <!-- マズル -->
                <ellipse cx="100" cy="115" rx="30" ry="25" fill="#FFF"/>
                <!-- 目 -->
                <ellipse cx="80" cy="88" rx="8" ry="12" fill="#000"/>
                <ellipse cx="80" cy="90" rx="3" ry="8" fill="#FFD700"/>
                <ellipse cx="120" cy="88" rx="8" ry="12" fill="#000"/>
                <ellipse cx="120" cy="90" rx="3" ry="8" fill="#FFD700"/>
                <!-- 鼻 -->
                <path d="M 100,108 L 95,113 L 100,115 L 105,113 Z" fill="#000"/>
                <!-- 口 -->
                <path d="M 100,115 Q 90,122 88,118" stroke="#333" stroke-width="2" fill="none"/>
                <path d="M 100,115 Q 110,122 112,118" stroke="#333" stroke-width="2" fill="none"/>
                <!-- 名前 -->
                <rect x="10" y="175" width="180" height="20" fill="white" opacity="0.9" rx="3"/>
                <text x="100" y="189" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#2C3E50" text-anchor="middle">${driverName} 🦊</text>
            </svg>`;
        } else if (animalType === 'raccoon') {
            // アライグマ
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#E8F4F8"/>
                <!-- 耳 -->
                <circle cx="65" cy="70" r="20" fill="#8B8B8B" stroke="#333" stroke-width="2"/>
                <circle cx="65" cy="70" r="12" fill="#FFF"/>
                <circle cx="135" cy="70" r="20" fill="#8B8B8B" stroke="#333" stroke-width="2"/>
                <circle cx="135" cy="70" r="12" fill="#FFF"/>
                <!-- 顔 -->
                <circle cx="100" cy="100" r="50" fill="#B8B8B8" stroke="#333" stroke-width="2"/>
                <!-- 目の周り（黒マスク） -->
                <ellipse cx="75" cy="90" rx="15" ry="18" fill="#000"/>
                <ellipse cx="125" cy="90" rx="15" ry="18" fill="#000"/>
                <!-- 目 -->
                <circle cx="75" cy="90" r="7" fill="#FFF"/>
                <circle cx="75" cy="90" r="4" fill="#000"/>
                <circle cx="125" cy="90" r="7" fill="#FFF"/>
                <circle cx="125" cy="90" r="4" fill="#000"/>
                <!-- マズル -->
                <ellipse cx="100" cy="115" rx="25" ry="20" fill="#FFF"/>
                <!-- 鼻 -->
                <ellipse cx="100" cy="110" rx="8" ry="6" fill="#000"/>
                <!-- 口 -->
                <path d="M 100,110 Q 90,120 88,116" stroke="#333" stroke-width="2" fill="none"/>
                <path d="M 100,110 Q 110,120 112,116" stroke="#333" stroke-width="2" fill="none"/>
                <!-- 名前 -->
                <rect x="10" y="175" width="180" height="20" fill="white" opacity="0.9" rx="3"/>
                <text x="100" y="189" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#2C3E50" text-anchor="middle">${driverName} 🦝</text>
            </svg>`;
        } else if (animalType === 'hamster') {
            // ハムスター
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#E8F4F8"/>
                <!-- 耳 -->
                <circle cx="70" cy="70" r="15" fill="#F0E68C" stroke="#333" stroke-width="2"/>
                <circle cx="70" cy="70" r="8" fill="#FFB6C1"/>
                <circle cx="130" cy="70" r="15" fill="#F0E68C" stroke="#333" stroke-width="2"/>
                <circle cx="130" cy="70" r="8" fill="#FFB6C1"/>
                <!-- 顔 -->
                <circle cx="100" cy="105" r="50" fill="#F0E68C" stroke="#333" stroke-width="2"/>
                <!-- ほっぺ -->
                <ellipse cx="60" cy="110" rx="20" ry="18" fill="#FFE4B5"/>
                <ellipse cx="140" cy="110" rx="20" ry="18" fill="#FFE4B5"/>
                <!-- 目 -->
                <circle cx="80" cy="95" r="5" fill="#000"/>
                <circle cx="81" cy="93" r="2" fill="white"/>
                <circle cx="120" cy="95" r="5" fill="#000"/>
                <circle cx="121" cy="93" r="2" fill="white"/>
                <!-- 鼻 -->
                <circle cx="100" cy="110" r="4" fill="#FF69B4"/>
                <!-- ヒゲ -->
                <line x1="55" y1="110" x2="80" y2="110" stroke="#333" stroke-width="1"/>
                <line x1="55" y1="115" x2="80" y2="113" stroke="#333" stroke-width="1"/>
                <line x1="120" y1="110" x2="145" y2="110" stroke="#333" stroke-width="1"/>
                <line x1="120" y1="113" x2="145" y2="115" stroke="#333" stroke-width="1"/>
                <!-- 口 -->
                <path d="M 100,110 Q 95,118 92,115" stroke="#333" stroke-width="1" fill="none"/>
                <path d="M 100,110 Q 105,118 108,115" stroke="#333" stroke-width="1" fill="none"/>
                <!-- 前歯 -->
                <rect x="97" y="115" width="3" height="5" fill="white" stroke="#333" stroke-width="0.5"/>
                <rect x="100" y="115" width="3" height="5" fill="white" stroke="#333" stroke-width="0.5"/>
                <!-- 名前 -->
                <rect x="10" y="175" width="180" height="20" fill="white" opacity="0.9" rx="3"/>
                <text x="100" y="189" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#2C3E50" text-anchor="middle">${driverName} 🐹</text>
            </svg>`;
        } else if (animalType === 'koala') {
            // コアラ
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#E8F4F8"/>
                <!-- 耳 -->
                <ellipse cx="55" cy="70" rx="30" ry="35" fill="#A9A9A9" stroke="#333" stroke-width="2"/>
                <ellipse cx="55" cy="75" rx="20" ry="25" fill="#FFF"/>
                <ellipse cx="145" cy="70" rx="30" ry="35" fill="#A9A9A9" stroke="#333" stroke-width="2"/>
                <ellipse cx="145" cy="75" rx="20" ry="25" fill="#FFF"/>
                <!-- 顔 -->
                <circle cx="100" cy="105" r="50" fill="#A9A9A9" stroke="#333" stroke-width="2"/>
                <!-- 目 -->
                <circle cx="80" cy="95" r="5" fill="#000"/>
                <circle cx="120" cy="95" r="5" fill="#000"/>
                <!-- 鼻 -->
                <ellipse cx="100" cy="115" rx="15" ry="12" fill="#000"/>
                <!-- 名前 -->
                <rect x="10" y="175" width="180" height="20" fill="white" opacity="0.9" rx="3"/>
                <text x="100" y="189" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#2C3E50" text-anchor="middle">${driverName} 🐨</text>
            </svg>`;
        } else {
            // ライオン
            svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#E8F4F8"/>
                <!-- たてがみ -->
                <circle cx="100" cy="100" r="70" fill="#FF8C00" stroke="#333" stroke-width="2"/>
                <!-- 顔 -->
                <circle cx="100" cy="100" r="45" fill="#FFD700" stroke="#333" stroke-width="2"/>
                <!-- 目 -->
                <circle cx="85" cy="90" r="7" fill="#000"/>
                <circle cx="86" cy="88" r="2" fill="white"/>
                <circle cx="115" cy="90" r="7" fill="#000"/>
                <circle cx="116" cy="88" r="2" fill="white"/>
                <!-- 鼻 -->
                <path d="M 100,105 L 95,110 L 100,112 L 105,110 Z" fill="#8B4513"/>
                <!-- ヒゲ -->
                <line x1="60" y1="105" x2="85" y2="105" stroke="#333" stroke-width="1"/>
                <line x1="60" y1="110" x2="85" y2="108" stroke="#333" stroke-width="1"/>
                <line x1="115" y1="105" x2="140" y2="105" stroke="#333" stroke-width="1"/>
                <line x1="115" y1="108" x2="140" y2="110" stroke="#333" stroke-width="1"/>
                <!-- 口 -->
                <path d="M 100,112 Q 90,120 85,115" stroke="#333" stroke-width="2" fill="none"/>
                <path d="M 100,112 Q 110,120 115,115" stroke="#333" stroke-width="2" fill="none"/>
                <!-- 名前 -->
                <rect x="10" y="175" width="180" height="20" fill="white" opacity="0.9" rx="3"/>
                <text x="100" y="189" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#2C3E50" text-anchor="middle">${driverName} 🦁</text>
            </svg>`;
        }

        return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
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

                const truckNumber = `T-${String(i).padStart(3, '0')}`;

                this.trucks.push({
                    id: i,
                    number: truckNumber,
                    plate: `${plateArea} 500 ${plateKanaChar} ${plateNumber}`,
                    capacity: capacity,
                    purchaseDate: `${year}-${month}-${day}`,
                    status: 'available',
                    type: type,
                    image: this.generateTruckImage(truckNumber, type)
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

        if (this.drivers.length === 0) {
            this.drivers = [];
            const driverLastNames = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
                                     '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
                                     '池田', '橋本', '阿部', '石川', '前田', '藤田', '後藤', '長谷川', '村上', '近藤'];
            const driverFirstNames = ['太郎', '次郎', '三郎', '健一', '誠', '隆', '浩', '修', '勇', '大輔',
                                      '拓也', '翔太', '直樹', '和也', '雄一', '慎一', '孝', '昭', '豊', '勝'];
            const licenses = ['大型', '大型', '大型', '中型', '準中型'];

            for (let i = 1; i <= 60; i++) {
                const lastName = driverLastNames[Math.floor(Math.random() * driverLastNames.length)];
                const firstName = driverFirstNames[Math.floor(Math.random() * driverFirstNames.length)];
                const name = `${lastName} ${firstName}`;
                const age = Math.floor(Math.random() * 30) + 25; // 25-54歳
                const license = licenses[Math.floor(Math.random() * licenses.length)];
                const experience = Math.floor(Math.random() * 20) + 1; // 1-20年
                const phone = `090-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
                const hireYear = 2010 + Math.floor(Math.random() * 15);
                const hireMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                const hireDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');

                // 生年月日を計算（年齢から逆算）
                const currentYear = new Date().getFullYear();
                const birthYear = currentYear - age;
                const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
                const birthdate = `${birthYear}-${birthMonth}-${birthDay}`;

                // 運転開始年を計算
                const drivingStartYear = currentYear - experience - Math.floor(Math.random() * 3);
                const breakYears = Math.floor(Math.random() * 3); // 0-2年の中断

                this.drivers.push({
                    id: i,
                    code: `D-${String(i).padStart(3, '0')}`,
                    name: name,
                    birthdate: birthdate,
                    age: age,
                    license: license,
                    drivingStartYear: drivingStartYear,
                    breakYears: breakYears,
                    experience: experience,
                    phone: phone,
                    hireDate: `${hireYear}-${hireMonth}-${hireDay}`,
                    status: 'available',
                    specialSkills: this.generateDriverSkills(),
                    photo: this.generateDriverPhoto(name, i)
                });
            }
            this.saveData('drivers', this.drivers);
        }

        if (this.maintenances.length === 0) {
            this.maintenances = [];
            const maintenanceTypes = ['車検', '定期点検', 'オイル交換', 'タイヤ交換', '整備'];

            this.trucks.forEach(truck => {
                // 各トラックに過去のメンテナンス履歴を生成
                for (let i = 0; i < 3; i++) {
                    const pastDate = new Date();
                    pastDate.setMonth(pastDate.getMonth() - Math.floor(Math.random() * 12) - 1);

                    this.maintenances.push({
                        id: this.maintenances.length + 1,
                        truckId: truck.id,
                        type: maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)],
                        date: this.formatDate(pastDate),
                        cost: Math.floor(Math.random() * 50000) + 10000,
                        description: '定期メンテナンス実施',
                        nextDate: null,
                        status: 'completed'
                    });
                }

                // 車検の次回予定を追加
                const nextInspection = new Date();
                nextInspection.setMonth(nextInspection.getMonth() + Math.floor(Math.random() * 6) + 1);

                this.maintenances.push({
                    id: this.maintenances.length + 1,
                    truckId: truck.id,
                    type: '車検',
                    date: null,
                    cost: null,
                    description: '次回車検予定',
                    nextDate: this.formatDate(nextInspection),
                    status: 'scheduled'
                });
            });

            this.saveData('maintenances', this.maintenances);
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
                const driverId = Math.floor(Math.random() * 60) + 1;
                const startHour = 8 + Math.floor(Math.random() * 3);
                const duration = Math.floor(Math.random() * 5) + 4; // 4-8時間
                const isMultiDay = Math.random() > 0.8;

                const startDate = new Date(currentYear, 3, day); // 3 = April (0-indexed)
                const endDate = isMultiDay ? new Date(currentYear, 3, day + 1) : startDate;

                deliveries.push({
                    id: id++,
                    truckId,
                    customerId,
                    driverId,
                    startDate: this.formatDate(startDate),
                    startTime: `${String(startHour).padStart(2, '0')}:00`,
                    endDate: this.formatDate(endDate),
                    endTime: `${String((startHour + duration) % 24).padStart(2, '0')}:00`,
                    destinations: destinations[Math.floor(Math.random() * destinations.length)],
                    cargo: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
                    status: 'completed',
                    detailedStatus: 'completed',
                    actualStartTime: `${String(startHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                    actualEndTime: `${String((startHour + duration) % 24).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                    distance: Math.floor(Math.random() * 300) + 50,
                    fuelCost: Math.floor(Math.random() * 15000) + 5000,
                    notes: ''
                });
            }
        }

        // 5月のデータ（31日分）
        for (let day = 1; day <= 31; day++) {
            const deliveriesPerDay = Math.floor(Math.random() * 10) + 6; // 6-15件/日

            for (let i = 0; i < deliveriesPerDay; i++) {
                const truckId = Math.floor(Math.random() * totalTrucks) + 1;
                const customerId = Math.floor(Math.random() * totalCustomers) + 1;
                const driverId = Math.floor(Math.random() * 60) + 1;
                const startHour = 7 + Math.floor(Math.random() * 4);
                const duration = Math.floor(Math.random() * 6) + 4; // 4-9時間
                const isMultiDay = Math.random() > 0.75;

                const startDate = new Date(currentYear, 4, day); // 4 = May
                const endDate = isMultiDay ? new Date(currentYear, 4, day + 1) : startDate;

                deliveries.push({
                    id: id++,
                    truckId,
                    customerId,
                    driverId,
                    startDate: this.formatDate(startDate),
                    startTime: `${String(startHour).padStart(2, '0')}:00`,
                    endDate: this.formatDate(endDate),
                    endTime: `${String((startHour + duration) % 24).padStart(2, '0')}:00`,
                    destinations: destinations[Math.floor(Math.random() * destinations.length)],
                    cargo: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
                    status: 'completed',
                    detailedStatus: 'completed',
                    actualStartTime: `${String(startHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                    actualEndTime: `${String((startHour + duration) % 24).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                    distance: Math.floor(Math.random() * 300) + 50,
                    fuelCost: Math.floor(Math.random() * 15000) + 5000,
                    notes: ''
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

                let status, detailedStatus;
                const driverId = Math.floor(Math.random() * 60) + 1;

                if (day < currentDay - 1) {
                    status = 'completed';
                    detailedStatus = 'completed';
                } else if (day === currentDay - 1 || day === currentDay) {
                    const rand = Math.random();
                    if (rand > 0.7) {
                        status = 'inprogress';
                        detailedStatus = ['loading', 'intransit', 'unloading'][Math.floor(Math.random() * 3)];
                    } else {
                        status = 'completed';
                        detailedStatus = 'completed';
                    }
                } else {
                    status = 'scheduled';
                    detailedStatus = 'preparing';
                }

                deliveries.push({
                    id: id++,
                    truckId,
                    customerId,
                    driverId,
                    startDate: this.formatDate(startDate),
                    startTime: `${String(startHour).padStart(2, '0')}:00`,
                    endDate: this.formatDate(endDate),
                    endTime: `${String((startHour + duration) % 24).padStart(2, '0')}:00`,
                    destinations: destinations[Math.floor(Math.random() * destinations.length)],
                    cargo: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
                    status,
                    detailedStatus,
                    actualStartTime: status === 'completed' ? `${String(startHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : null,
                    actualEndTime: status === 'completed' ? `${String((startHour + duration) % 24).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : null,
                    distance: Math.floor(Math.random() * 300) + 50,
                    fuelCost: status === 'completed' ? Math.floor(Math.random() * 15000) + 5000 : null,
                    notes: ''
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
        // メンテナンス期間中のチェック
        if (this.isTruckUnderMaintenance(truckId)) {
            return false;
        }

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

    // ドライバー管理
    getAllDrivers() {
        return this.drivers;
    }

    getDriverById(id) {
        return this.drivers.find(d => d.id === id);
    }

    addDriver(driver) {
        const newId = this.drivers.length > 0 ? Math.max(...this.drivers.map(d => d.id)) + 1 : 1;
        driver.id = newId;
        driver.status = 'available';
        this.drivers.push(driver);
        this.saveData('drivers', this.drivers);
        return driver;
    }

    updateDriver(id, updatedDriver) {
        const index = this.drivers.findIndex(d => d.id === id);
        if (index !== -1) {
            updatedDriver.id = id;
            if (!updatedDriver.status) {
                updatedDriver.status = this.drivers[index].status;
            }
            this.drivers[index] = updatedDriver;
            this.saveData('drivers', this.drivers);
            return true;
        }
        return false;
    }

    deleteDriver(id) {
        const hasDeliveries = this.deliveries.some(d => d.driverId === id);
        if (hasDeliveries) {
            return false;
        }

        const index = this.drivers.findIndex(d => d.id === id);
        if (index !== -1) {
            this.drivers.splice(index, 1);
            this.saveData('drivers', this.drivers);
            return true;
        }
        return false;
    }

    isDriverAvailable(driverId, startDate, startTime, endDate, endTime, excludeDeliveryId = null) {
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
            return d.driverId === driverId;
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

    findAvailableDrivers(startDate, startTime, endDate, endTime, excludeDeliveryId = null) {
        const availableDrivers = [];

        for (const driver of this.drivers) {
            if (this.isDriverAvailable(driver.id, startDate, startTime, endDate, endTime, excludeDeliveryId)) {
                availableDrivers.push(driver);
            }
        }

        return availableDrivers;
    }

    // メンテナンス管理
    getAllMaintenances() {
        return this.maintenances;
    }

    getMaintenanceById(id) {
        return this.maintenances.find(m => m.id === id);
    }

    getMaintenancesByTruckId(truckId) {
        return this.maintenances.filter(m => m.truckId === truckId);
    }

    addMaintenance(maintenance) {
        const newId = this.maintenances.length > 0 ? Math.max(...this.maintenances.map(m => m.id)) + 1 : 1;
        maintenance.id = newId;
        this.maintenances.push(maintenance);
        this.saveData('maintenances', this.maintenances);
        return maintenance;
    }

    updateMaintenance(id, updatedMaintenance) {
        const index = this.maintenances.findIndex(m => m.id === id);
        if (index !== -1) {
            updatedMaintenance.id = id;
            this.maintenances[index] = updatedMaintenance;
            this.saveData('maintenances', this.maintenances);
            return true;
        }
        return false;
    }

    deleteMaintenance(id) {
        const index = this.maintenances.findIndex(m => m.id === id);
        if (index !== -1) {
            this.maintenances.splice(index, 1);
            this.saveData('maintenances', this.maintenances);
            return true;
        }
        return false;
    }

    // アラート生成
    generateAlerts() {
        const alerts = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 配送アラート
        this.deliveries.forEach(delivery => {
            if (delivery.status === 'scheduled') {
                const startDateTime = new Date(delivery.startDate + ' ' + delivery.startTime);
                const hoursUntil = (startDateTime - today) / (1000 * 60 * 60);

                // 24時間以内の配送
                if (hoursUntil > 0 && hoursUntil <= 24) {
                    const truck = this.getTruckById(delivery.truckId);
                    const driver = this.getDriverById(delivery.driverId);
                    const customer = this.getCustomerById(delivery.customerId);

                    let message = `配送予定: ${delivery.startDate} ${delivery.startTime}`;
                    let warnings = [];

                    if (!truck) warnings.push('トラック未選択');
                    if (!driver) warnings.push('ドライバー未選択');

                    if (warnings.length > 0) {
                        message += ` (⚠️ ${warnings.join(', ')})`;
                    }

                    alerts.push({
                        type: 'delivery',
                        priority: warnings.length > 0 ? 'high' : 'medium',
                        message: message,
                        detail: `顧客: ${customer ? customer.name : '不明'} / 行先: ${delivery.destinations ? delivery.destinations[0] : ''}`,
                        deliveryId: delivery.id,
                        date: delivery.startDate
                    });
                }
            }
        });

        // メンテナンスアラート
        this.maintenances.forEach(maintenance => {
            if (maintenance.status === 'scheduled' && maintenance.nextDate) {
                const nextDate = new Date(maintenance.nextDate);
                const daysUntil = Math.floor((nextDate - today) / (1000 * 60 * 60 * 24));

                if (daysUntil >= 0 && daysUntil <= 30) {
                    const truck = this.getTruckById(maintenance.truckId);
                    const priority = daysUntil <= 7 ? 'high' : daysUntil <= 14 ? 'medium' : 'low';

                    alerts.push({
                        type: 'maintenance',
                        priority: priority,
                        message: `${maintenance.type}予定: ${maintenance.nextDate} (残り${daysUntil}日)`,
                        detail: `トラック: ${truck ? truck.number : '不明'}`,
                        maintenanceId: maintenance.id,
                        date: maintenance.nextDate
                    });
                }
            }
        });

        // 優先度でソート
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        alerts.sort((a, b) => {
            if (a.priority !== b.priority) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(a.date) - new Date(b.date);
        });

        return alerts;
    }

    // トラックのメンテナンス情報を取得
    getTruckMaintenanceInfo(truckId) {
        const maintenances = this.maintenances.filter(m => m.truckId === truckId);

        // 進行中のメンテナンス（予定ステータスで実施日が今日以降、次回予定日が今日以前のもの）
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = this.formatDate(today);

        const ongoingMaintenance = maintenances.find(m => {
            if (m.status !== 'scheduled') return false;

            // 実施日が設定されている場合
            if (m.date) {
                const maintenanceDate = new Date(m.date);
                maintenanceDate.setHours(0, 0, 0, 0);

                // 実施日が今日または未来の場合、メンテナンス期間中とみなす
                if (maintenanceDate >= today) {
                    // 次回予定日が設定されている場合、その日までメンテナンス中
                    if (m.nextDate) {
                        const nextDate = new Date(m.nextDate);
                        nextDate.setHours(0, 0, 0, 0);
                        return today <= nextDate;
                    }
                    // 次回予定日がない場合、実施日当日のみメンテナンス中
                    return m.date === todayStr;
                }
            }

            return false;
        });

        // 次回予定のメンテナンス
        const upcomingMaintenance = maintenances
            .filter(m => m.status === 'scheduled' && m.nextDate)
            .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate))[0];

        // 最新の完了メンテナンス
        const lastCompletedMaintenance = maintenances
            .filter(m => m.status === 'completed' && m.date)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        return {
            isUnderMaintenance: !!ongoingMaintenance,
            ongoingMaintenance,
            upcomingMaintenance,
            lastCompletedMaintenance,
            totalMaintenances: maintenances.length
        };
    }

    // トラックがメンテナンス期間中かチェック
    isTruckUnderMaintenance(truckId) {
        const info = this.getTruckMaintenanceInfo(truckId);
        return info.isUnderMaintenance;
    }

    // 統計データ生成
    getStatistics() {
        const stats = {
            totalDeliveries: this.deliveries.length,
            completedDeliveries: this.deliveries.filter(d => d.status === 'completed').length,
            inProgressDeliveries: this.deliveries.filter(d => d.status === 'inprogress').length,
            scheduledDeliveries: this.deliveries.filter(d => d.status === 'scheduled').length,
            totalTrucks: this.trucks.length,
            totalDrivers: this.drivers.length,
            totalCustomers: this.customers.length,
            totalFuelCost: 0,
            totalDistance: 0,
            averageFuelCost: 0,
            averageDistance: 0
        };

        const completedDeliveries = this.deliveries.filter(d => d.status === 'completed' && d.fuelCost);

        if (completedDeliveries.length > 0) {
            stats.totalFuelCost = completedDeliveries.reduce((sum, d) => sum + (d.fuelCost || 0), 0);
            stats.totalDistance = completedDeliveries.reduce((sum, d) => sum + (d.distance || 0), 0);
            stats.averageFuelCost = Math.round(stats.totalFuelCost / completedDeliveries.length);
            stats.averageDistance = Math.round(stats.totalDistance / completedDeliveries.length);
        }

        return stats;
    }
}
