// 配送ルート地図表示（静的地図）

class RouteMapViewer {
    constructor() {
        this.japanCities = {
            '東京': { x: 500, y: 350 },
            '横浜': { x: 520, y: 370 },
            '千葉': { x: 540, y: 340 },
            'さいたま': { x: 480, y: 320 },
            '名古屋': { x: 400, y: 400 },
            '大阪': { x: 350, y: 430 },
            '福岡': { x: 200, y: 520 },
            '札幌': { x: 550, y: 120 },
            '仙台': { x: 560, y: 280 },
            '広島': { x: 280, y: 460 },
            '神戸': { x: 340, y: 440 },
            '京都': { x: 360, y: 420 }
        };
    }

    // 住所から都市を推定
    extractCity(address) {
        for (const city of Object.keys(this.japanCities)) {
            if (address.includes(city)) {
                return city;
            }
        }
        return '東京'; // デフォルト
    }

    // ルート地図のSVGを生成
    generateRouteMap(destinations, width = 700, height = 600) {
        const cities = destinations.map(dest => {
            const destName = typeof dest === 'object' ? dest.destination : dest;
            return {
                name: this.extractCity(destName),
                fullName: destName,
                hasLoad: typeof dest === 'object' ? dest.hasLoad : true,
                hasUnload: typeof dest === 'object' ? dest.hasUnload : false
            };
        });

        // SVG開始
        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

        // 背景
        svg += `<rect width="${width}" height="${height}" fill="#E8F5F9"/>`;

        // 日本列島の簡易表示
        svg += this.drawJapanOutline();

        // 主要都市を描画
        Object.keys(this.japanCities).forEach(city => {
            const pos = this.japanCities[city];
            svg += `<circle cx="${pos.x}" cy="${pos.y}" r="3" fill="#999" opacity="0.5"/>`;
            svg += `<text x="${pos.x + 5}" y="${pos.y - 5}" font-size="10" fill="#666" opacity="0.7">${city}</text>`;
        });

        // ルート線を描画
        for (let i = 0; i < cities.length - 1; i++) {
            const from = this.japanCities[cities[i].name];
            const to = this.japanCities[cities[i + 1].name];

            if (from && to) {
                // 曲線を描画（ベジェ曲線で自然な経路に）
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2 - 30;

                svg += `<path d="M ${from.x},${from.y} Q ${midX},${midY} ${to.x},${to.y}"
                        stroke="#2196F3" stroke-width="3" fill="none" stroke-dasharray="5,5"/>`;

                // 矢印
                const angle = Math.atan2(to.y - from.y, to.x - from.x);
                const arrowX = to.x - Math.cos(angle) * 15;
                const arrowY = to.y - Math.sin(angle) * 15;

                svg += `<polygon points="${to.x},${to.y} ${arrowX - Math.sin(angle) * 5},${arrowY + Math.cos(angle) * 5} ${arrowX + Math.sin(angle) * 5},${arrowY - Math.cos(angle) * 5}"
                        fill="#2196F3"/>`;
            }
        }

        // 地点マーカーを描画
        cities.forEach((city, index) => {
            const pos = this.japanCities[city.name];
            if (!pos) return;

            const isStart = index === 0;
            const isEnd = index === cities.length - 1;
            const color = isStart ? '#4CAF50' : isEnd ? '#F44336' : '#FF9800';
            const icon = isStart ? '🏁' : isEnd ? '🎯' : '📍';

            // マーカー円
            svg += `<circle cx="${pos.x}" cy="${pos.y}" r="20" fill="${color}" opacity="0.9" stroke="white" stroke-width="2"/>`;

            // 番号
            svg += `<text x="${pos.x}" y="${pos.y + 5}" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${index + 1}</text>`;

            // 地名ラベル
            svg += `<rect x="${pos.x - 80}" y="${pos.y + 25}" width="160" height="40" fill="white" rx="5" stroke="${color}" stroke-width="2" opacity="0.95"/>`;
            svg += `<text x="${pos.x}" y="${pos.y + 42}" font-size="12" font-weight="bold" fill="#333" text-anchor="middle">${city.fullName.substring(0, 20)}</text>`;

            // 積載・卸下情報
            let loadInfo = [];
            if (city.hasLoad) loadInfo.push('積載');
            if (city.hasUnload) loadInfo.push('卸下');
            if (loadInfo.length > 0) {
                svg += `<text x="${pos.x}" y="${pos.y + 58}" font-size="10" fill="#666" text-anchor="middle">[${loadInfo.join('・')}]</text>`;
            }
        });

        svg += '</svg>';
        return svg;
    }

    // 日本列島の簡易アウトライン
    drawJapanOutline() {
        // 簡略化した日本列島の形状
        return `
            <path d="M 520,150 Q 540,180 560,220 L 570,300 Q 560,350 540,380 L 520,420 Q 480,450 440,460 L 380,470 Q 340,465 310,450 L 280,420 Q 260,390 250,350 L 240,300 Q 245,250 260,210 L 290,170 Q 320,140 360,130 L 410,125 Q 460,130 500,145 Z"
                  fill="#D7E9D7" opacity="0.3" stroke="#85B285" stroke-width="1"/>
        `;
    }

    // ルート情報テーブルを生成
    generateRouteTable(destinations) {
        let html = '<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">';
        html += '<thead><tr style="background-color: #3498db; color: white;">';
        html += '<th style="padding: 10px; border: 1px solid #ddd;">順序</th>';
        html += '<th style="padding: 10px; border: 1px solid #ddd;">行先</th>';
        html += '<th style="padding: 10px; border: 1px solid #ddd;">日付</th>';
        html += '<th style="padding: 10px; border: 1px solid #ddd;">積載</th>';
        html += '<th style="padding: 10px; border: 1px solid #ddd;">卸下</th>';
        html += '<th style="padding: 10px; border: 1px solid #ddd;">距離</th>';
        html += '</tr></thead><tbody>';

        let totalDistance = 0;
        let currentPoint = '東京都';

        destinations.forEach((dest, index) => {
            const destName = typeof dest === 'object' ? dest.destination : dest;
            const date = typeof dest === 'object' && dest.date ? dest.date : '-';
            const hasLoad = typeof dest === 'object' ? dest.hasLoad : true;
            const hasUnload = typeof dest === 'object' ? dest.hasUnload : false;

            const distance = deliveryAdvanced.calculateDistance(currentPoint, destName);
            totalDistance += distance;

            html += '<tr>';
            html += `<td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${index + 1}</td>`;
            html += `<td style="padding: 10px; border: 1px solid #ddd;">${destName}</td>`;
            html += `<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${date}</td>`;
            html += `<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${hasLoad ? '✓' : '-'}</td>`;
            html += `<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${hasUnload ? '✓' : '-'}</td>`;
            html += `<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${distance} km</td>`;
            html += '</tr>';

            currentPoint = destName;
        });

        html += '<tr style="background-color: #f0f0f0; font-weight: bold;">';
        html += '<td colspan="5" style="padding: 10px; border: 1px solid #ddd; text-align: right;">合計距離:</td>';
        html += `<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${totalDistance} km</td>`;
        html += '</tr>';

        html += '</tbody></table>';
        return html;
    }

    // 配送詳細情報を生成
    generateDeliveryDetails(delivery) {
        const totalDistance = deliveryAdvanced.calculateTotalDistance(delivery.destinations);
        const estimatedTime = deliveryAdvanced.calculateEstimatedTime(totalDistance, delivery.category);
        const fuelCost = deliveryAdvanced.calculateFuelCost(totalDistance, delivery.category);

        return `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px;">
                <div style="padding: 15px; background-color: #e3f2fd; border-radius: 5px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">総距離</div>
                    <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${totalDistance} km</div>
                </div>
                <div style="padding: 15px; background-color: #fff3e0; border-radius: 5px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">予測時間</div>
                    <div style="font-size: 24px; font-weight: bold; color: #f57c00;">${Math.floor(estimatedTime / 60)}時間${estimatedTime % 60}分</div>
                </div>
                <div style="padding: 15px; background-color: #e8f5e9; border-radius: 5px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">予測燃料費</div>
                    <div style="font-size: 24px; font-weight: bold; color: #388e3c;">¥${fuelCost.toLocaleString()}</div>
                </div>
            </div>
        `;
    }
}

// グローバルインスタンス
const routeMapViewer = new RouteMapViewer();
