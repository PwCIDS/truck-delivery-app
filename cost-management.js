// コスト管理・予算管理機能

class CostManagement {
    constructor() {
        this.fuelPrices = {
            gasoline: 160, // 円/L
            diesel: 140,   // 円/L
            electric: 30   // 円/kWh
        };
        this.init();
    }

    init() {
        this.loadSettings();
    }

    // 設定読み込み
    loadSettings() {
        const saved = localStorage.getItem('cost_management_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.fuelPrices = settings.fuelPrices || this.fuelPrices;
            this.monthlyBudget = settings.monthlyBudget || null;
            this.costAlerts = settings.costAlerts || true;
        }
    }

    // 設定保存
    saveSettings() {
        localStorage.setItem('cost_management_settings', JSON.stringify({
            fuelPrices: this.fuelPrices,
            monthlyBudget: this.monthlyBudget,
            costAlerts: this.costAlerts
        }));
    }

    // 燃料価格設定
    setFuelPrices(prices) {
        this.fuelPrices = { ...this.fuelPrices, ...prices };
        this.saveSettings();
    }

    // 配送コスト計算
    calculateDeliveryCost(delivery) {
        const truck = db.getTruckById(delivery.truckId);
        const driver = db.getDriverById(delivery.driverId);

        if (!truck) {
            return {
                fuelCost: 0,
                laborCost: 0,
                tollCost: 0,
                maintenanceCost: 0,
                totalCost: 0
            };
        }

        // 燃料費
        const distance = delivery.distance || 0;
        const fuelEfficiency = this.getTruckFuelEfficiency(truck);
        const fuelType = truck.fuelType || 'diesel';
        const fuelPrice = this.fuelPrices[fuelType] || this.fuelPrices.diesel;
        const fuelCost = (distance / fuelEfficiency) * fuelPrice;

        // 人件費
        const startDateTime = new Date(delivery.startDate + ' ' + delivery.startTime);
        const endDateTime = new Date(delivery.endDate + ' ' + delivery.endTime);
        const hours = (endDateTime - startDateTime) / (1000 * 60 * 60);
        const hourlyWage = driver?.hourlyWage || 1500; // デフォルト時給
        const laborCost = hours * hourlyWage;

        // 高速道路料金（距離ベースで概算）
        const tollCost = delivery.useTollRoad ? this.estimateTollCost(distance) : 0;

        // メンテナンスコスト（距離ベースで概算）
        const maintenanceCost = this.estimateMaintenanceCost(truck, distance);

        // 保険・その他固定費（日割り）
        const dailyFixedCost = this.calculateDailyFixedCost(truck);

        return {
            fuelCost: Math.round(fuelCost),
            laborCost: Math.round(laborCost),
            tollCost: Math.round(tollCost),
            maintenanceCost: Math.round(maintenanceCost),
            fixedCost: Math.round(dailyFixedCost),
            totalCost: Math.round(fuelCost + laborCost + tollCost + maintenanceCost + dailyFixedCost),
            breakdown: {
                distance: distance,
                hours: hours.toFixed(1),
                fuelEfficiency: fuelEfficiency,
                fuelPrice: fuelPrice
            }
        };
    }

    // トラックの燃費取得
    getTruckFuelEfficiency(truck) {
        // トラック種類別の標準燃費（km/L または km/kWh）
        const efficiency = {
            '配達': 8,
            '保冷': 6,
            '活魚': 5
        };
        return truck.fuelEfficiency || efficiency[truck.type] || 7;
    }

    // 高速道路料金推定
    estimateTollCost(distance) {
        // 簡易計算: 距離×30円/km（大型車の平均）
        return distance * 30;
    }

    // メンテナンスコスト推定
    estimateMaintenanceCost(truck, distance) {
        // 走行距離ベースでのメンテナンスコスト
        // 1kmあたり約5円（オイル、タイヤ、部品交換など）
        return distance * 5;
    }

    // 日割り固定費計算
    calculateDailyFixedCost(truck) {
        // 保険、税金、減価償却などの固定費
        // 年間固定費を365で割る
        const annualInsurance = truck.annualInsurance || 200000; // 年間保険料
        const annualTax = truck.annualTax || 50000; // 年間自動車税
        const annualDepreciation = truck.purchasePrice ? (truck.purchasePrice * 0.2) : 500000; // 年間減価償却（20%）

        return (annualInsurance + annualTax + annualDepreciation) / 365;
    }

    // 月次コスト集計
    getMonthlyCoSummary(year, month) {
        const deliveries = db.getAllDeliveries();
        const targetMonth = `${year}-${String(month).padStart(2, '0')}`;

        const monthlyDeliveries = deliveries.filter(d =>
            d.startDate.startsWith(targetMonth)
        );

        let totalFuelCost = 0;
        let totalLaborCost = 0;
        let totalTollCost = 0;
        let totalMaintenanceCost = 0;
        let totalFixedCost = 0;

        const costByTruck = {};
        const costByCustomer = {};

        monthlyDeliveries.forEach(delivery => {
            const cost = this.calculateDeliveryCost(delivery);

            totalFuelCost += cost.fuelCost;
            totalLaborCost += cost.laborCost;
            totalTollCost += cost.tollCost;
            totalMaintenanceCost += cost.maintenanceCost;
            totalFixedCost += cost.fixedCost;

            // トラック別集計
            const truckId = delivery.truckId;
            if (!costByTruck[truckId]) {
                costByTruck[truckId] = {
                    truck: db.getTruckById(truckId),
                    totalCost: 0,
                    deliveryCount: 0
                };
            }
            costByTruck[truckId].totalCost += cost.totalCost;
            costByTruck[truckId].deliveryCount++;

            // 顧客別集計
            const customerId = delivery.customerId;
            if (!costByCustomer[customerId]) {
                costByCustomer[customerId] = {
                    customer: db.getCustomerById(customerId),
                    totalCost: 0,
                    deliveryCount: 0
                };
            }
            costByCustomer[customerId].totalCost += cost.totalCost;
            costByCustomer[customerId].deliveryCount++;
        });

        const totalCost = totalFuelCost + totalLaborCost + totalTollCost + totalMaintenanceCost + totalFixedCost;

        return {
            month: targetMonth,
            deliveryCount: monthlyDeliveries.length,
            totalCost: Math.round(totalCost),
            breakdown: {
                fuel: Math.round(totalFuelCost),
                labor: Math.round(totalLaborCost),
                toll: Math.round(totalTollCost),
                maintenance: Math.round(totalMaintenanceCost),
                fixed: Math.round(totalFixedCost)
            },
            costByTruck: Object.values(costByTruck),
            costByCustomer: Object.values(costByCustomer),
            averageCostPerDelivery: monthlyDeliveries.length > 0
                ? Math.round(totalCost / monthlyDeliveries.length)
                : 0
        };
    }

    // 予算管理
    setBudget(monthlyBudget) {
        this.monthlyBudget = monthlyBudget;
        this.saveSettings();
    }

    // 予算使用状況チェック
    checkBudgetStatus(year, month) {
        if (!this.monthlyBudget) {
            return {
                budgetSet: false,
                message: '予算が設定されていません'
            };
        }

        const summary = this.getMonthlyCostSummary(year, month);
        const usageRate = (summary.totalCost / this.monthlyBudget) * 100;

        let status = 'normal';
        let message = '予算内です';

        if (usageRate >= 100) {
            status = 'exceeded';
            message = '予算を超過しています';
        } else if (usageRate >= 90) {
            status = 'warning';
            message = '予算の90%に達しています';
        } else if (usageRate >= 80) {
            status = 'caution';
            message = '予算の80%に達しています';
        }

        return {
            budgetSet: true,
            budget: this.monthlyBudget,
            spent: summary.totalCost,
            remaining: this.monthlyBudget - summary.totalCost,
            usageRate: usageRate.toFixed(1),
            status: status,
            message: message
        };
    }

    // コスト削減提案
    getCostReductionSuggestions() {
        const suggestions = [];

        // 燃費の悪いトラックを特定
        const trucks = db.getAllTrucks();
        const deliveries = db.getAllDeliveries();

        trucks.forEach(truck => {
            const truckDeliveries = deliveries.filter(d => d.truckId === truck.id);
            if (truckDeliveries.length > 0) {
                let totalDistance = 0;
                let totalFuelCost = 0;

                truckDeliveries.forEach(d => {
                    totalDistance += d.distance || 0;
                    const cost = this.calculateDeliveryCost(d);
                    totalFuelCost += cost.fuelCost;
                });

                const averageFuelCost = totalFuelCost / truckDeliveries.length;
                const fuelEfficiency = totalDistance > 0
                    ? totalDistance / (totalFuelCost / this.fuelPrices.diesel)
                    : 0;

                if (fuelEfficiency < 5) {
                    suggestions.push({
                        type: 'fuel_efficiency',
                        priority: 'high',
                        truck: truck,
                        message: `${truck.number}の燃費が悪化しています（${fuelEfficiency.toFixed(1)} km/L）`,
                        suggestion: 'メンテナンスまたは買い替えを検討してください',
                        potentialSaving: Math.round(averageFuelCost * 0.2 * truckDeliveries.length)
                    });
                }
            }
        });

        // ルート最適化による削減可能性
        const recentDeliveries = deliveries.slice(-30);
        const longDistanceDeliveries = recentDeliveries.filter(d => (d.distance || 0) > 100);

        if (longDistanceDeliveries.length > 5) {
            const potentialSaving = longDistanceDeliveries.reduce((sum, d) => {
                const cost = this.calculateDeliveryCost(d);
                return sum + (cost.fuelCost * 0.15); // 15%削減可能と仮定
            }, 0);

            suggestions.push({
                type: 'route_optimization',
                priority: 'medium',
                message: '長距離配送が多く発生しています',
                suggestion: 'ルート最適化により燃料費を削減できる可能性があります',
                potentialSaving: Math.round(potentialSaving)
            });
        }

        // 高速道路使用の最適化
        const tollDeliveries = deliveries.filter(d => d.useTollRoad);
        if (tollDeliveries.length > 0) {
            const totalTollCost = tollDeliveries.reduce((sum, d) => {
                const cost = this.calculateDeliveryCost(d);
                return sum + cost.tollCost;
            }, 0);

            if (totalTollCost > 50000) {
                suggestions.push({
                    type: 'toll_optimization',
                    priority: 'low',
                    message: `高速道路料金が月間¥${totalTollCost.toLocaleString()}かかっています`,
                    suggestion: '一部の配送で一般道を利用することでコスト削減可能です',
                    potentialSaving: Math.round(totalTollCost * 0.3)
                });
            }
        }

        return suggestions.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    // コスト比較分析
    compareMonthlyoCosts(months = 6) {
        const comparisons = [];
        const today = new Date();

        for (let i = 0; i < months; i++) {
            const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth() + 1;

            const summary = this.getMonthlyCostSummary(year, month);
            comparisons.push(summary);
        }

        return comparisons.reverse();
    }

    // 収益性分析
    analyzeProfitability(delivery, revenue) {
        const cost = this.calculateDeliveryCost(delivery);
        const profit = revenue - cost.totalCost;
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
            revenue: revenue,
            cost: cost.totalCost,
            profit: profit,
            profitMargin: profitMargin.toFixed(1),
            profitable: profit > 0,
            costBreakdown: cost
        };
    }
}

// グローバルインスタンス
const costManagement = new CostManagement();
