// 高度な分析・レポート機能

class AdvancedAnalytics {
    constructor() {
        this.init();
    }

    init() {
        // 初期化処理
    }

    // ダッシュボード用の総合分析
    getDashboardAnalytics() {
        const deliveries = db.getAllDeliveries();
        const today = new Date();
        const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        // 今月の配送
        const monthlyDeliveries = deliveries.filter(d => d.startDate.startsWith(thisMonth));
        const completed = monthlyDeliveries.filter(d => d.status === 'completed');
        const inProgress = monthlyDeliveries.filter(d => d.status === 'inprogress');
        const scheduled = monthlyDeliveries.filter(d => d.status === 'scheduled');

        // 時刻通り完了率
        let onTimeCount = 0;
        completed.forEach(d => {
            const scheduledEnd = new Date(d.endDate + ' ' + d.endTime);
            const actualEnd = d.actualEndDateTime ? new Date(d.actualEndDateTime) : scheduledEnd;
            if (actualEnd <= scheduledEnd) onTimeCount++;
        });

        const onTimeRate = completed.length > 0 ? (onTimeCount / completed.length) * 100 : 0;

        // 総走行距離と燃料費
        let totalDistance = 0;
        let totalFuelCost = 0;
        monthlyDeliveries.forEach(d => {
            totalDistance += d.distance || 0;
            const cost = costManagement.calculateDeliveryCost(d);
            totalFuelCost += cost.fuelCost;
        });

        return {
            totalDeliveries: monthlyDeliveries.length,
            completed: completed.length,
            inProgress: inProgress.length,
            scheduled: scheduled.length,
            completionRate: monthlyDeliveries.length > 0
                ? (completed.length / monthlyDeliveries.length * 100).toFixed(1)
                : 0,
            onTimeRate: onTimeRate.toFixed(1),
            totalDistance: Math.round(totalDistance),
            averageDistance: monthlyDeliveries.length > 0
                ? Math.round(totalDistance / monthlyDeliveries.length)
                : 0,
            totalFuelCost: Math.round(totalFuelCost),
            averageFuelCost: monthlyDeliveries.length > 0
                ? Math.round(totalFuelCost / monthlyDeliveries.length)
                : 0
        };
    }

    // トラック稼働率分析
    analyzeTruckUtilization(period = 30) {
        const trucks = db.getAllTrucks();
        const deliveries = db.getAllDeliveries();
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);

        const utilization = [];

        trucks.forEach(truck => {
            const truckDeliveries = deliveries.filter(d => {
                const deliveryDate = new Date(d.startDate);
                return d.truckId === truck.id &&
                       deliveryDate >= startDate &&
                       deliveryDate <= endDate;
            });

            // 稼働日数
            const uniqueDates = [...new Set(truckDeliveries.map(d => d.startDate))];
            const utilizationRate = (uniqueDates.length / period) * 100;

            // 総稼働時間
            let totalHours = 0;
            truckDeliveries.forEach(d => {
                const start = new Date(d.startDate + ' ' + d.startTime);
                const end = new Date(d.endDate + ' ' + d.endTime);
                totalHours += (end - start) / (1000 * 60 * 60);
            });

            utilization.push({
                truck: truck,
                deliveryCount: truckDeliveries.length,
                workingDays: uniqueDates.length,
                utilizationRate: utilizationRate.toFixed(1),
                totalHours: totalHours.toFixed(1),
                averageHoursPerDay: uniqueDates.length > 0
                    ? (totalHours / uniqueDates.length).toFixed(1)
                    : 0
            });
        });

        // 稼働率順にソート
        utilization.sort((a, b) => b.utilizationRate - a.utilizationRate);

        return utilization;
    }

    // 顧客別分析
    analyzeCustomerMetrics(period = 90) {
        const customers = db.getAllCustomers();
        const deliveries = db.getAllDeliveries();
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);

        const metrics = [];

        customers.forEach(customer => {
            const customerDeliveries = deliveries.filter(d => {
                const deliveryDate = new Date(d.startDate);
                return d.customerId === customer.id &&
                       deliveryDate >= startDate &&
                       deliveryDate <= endDate;
            });

            if (customerDeliveries.length === 0) return;

            // 完了率
            const completed = customerDeliveries.filter(d => d.status === 'completed');
            const completionRate = (completed.length / customerDeliveries.length) * 100;

            // 平均配送時間
            let totalTime = 0;
            completed.forEach(d => {
                const start = new Date(d.startDate + ' ' + d.startTime);
                const end = new Date(d.endDate + ' ' + d.endTime);
                totalTime += (end - start) / (1000 * 60);
            });
            const averageTime = completed.length > 0 ? totalTime / completed.length : 0;

            // 総コスト
            let totalCost = 0;
            customerDeliveries.forEach(d => {
                const cost = costManagement.calculateDeliveryCost(d);
                totalCost += cost.totalCost;
            });

            // 配送頻度
            const frequency = customerDeliveries.length / (period / 30); // 月平均

            metrics.push({
                customer: customer,
                deliveryCount: customerDeliveries.length,
                completedCount: completed.length,
                completionRate: completionRate.toFixed(1),
                averageDeliveryTime: Math.round(averageTime),
                totalCost: Math.round(totalCost),
                averageCost: Math.round(totalCost / customerDeliveries.length),
                monthlyFrequency: frequency.toFixed(1)
            });
        });

        // 配送回数順にソート
        metrics.sort((a, b) => b.deliveryCount - a.deliveryCount);

        return metrics;
    }

    // 時間帯別配送分析
    analyzeDeliveryByTimeOfDay() {
        const deliveries = db.getAllDeliveries();
        const timeSlots = {
            '早朝 (5-8)': 0,
            '午前 (8-12)': 0,
            '午後 (12-17)': 0,
            '夕方 (17-20)': 0,
            '夜間 (20-24)': 0,
            '深夜 (0-5)': 0
        };

        deliveries.forEach(d => {
            const hour = parseInt(d.startTime.split(':')[0]);

            if (hour >= 5 && hour < 8) timeSlots['早朝 (5-8)']++;
            else if (hour >= 8 && hour < 12) timeSlots['午前 (8-12)']++;
            else if (hour >= 12 && hour < 17) timeSlots['午後 (12-17)']++;
            else if (hour >= 17 && hour < 20) timeSlots['夕方 (17-20)']++;
            else if (hour >= 20 && hour < 24) timeSlots['夜間 (20-24)']++;
            else timeSlots['深夜 (0-5)']++;
        });

        return Object.entries(timeSlots).map(([slot, count]) => ({
            timeSlot: slot,
            count: count,
            percentage: deliveries.length > 0 ? ((count / deliveries.length) * 100).toFixed(1) : 0
        }));
    }

    // 曜日別配送分析
    analyzeDeliveryByDayOfWeek() {
        const deliveries = db.getAllDeliveries();
        const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];

        deliveries.forEach(d => {
            const date = new Date(d.startDate);
            const dayIndex = date.getDay();
            dayCounts[dayIndex]++;
        });

        return dayNames.map((name, index) => ({
            day: name,
            count: dayCounts[index],
            percentage: deliveries.length > 0
                ? ((dayCounts[index] / deliveries.length) * 100).toFixed(1)
                : 0
        }));
    }

    // 配送カテゴリ別分析
    analyzeDeliveryByCategory() {
        const deliveries = db.getAllDeliveries();
        const categories = {};

        deliveries.forEach(d => {
            const category = d.category || '未分類';
            if (!categories[category]) {
                categories[category] = {
                    count: 0,
                    totalDistance: 0,
                    totalCost: 0
                };
            }
            categories[category].count++;
            categories[category].totalDistance += d.distance || 0;

            const cost = costManagement.calculateDeliveryCost(d);
            categories[category].totalCost += cost.totalCost;
        });

        return Object.entries(categories).map(([name, data]) => ({
            category: name,
            count: data.count,
            percentage: deliveries.length > 0
                ? ((data.count / deliveries.length) * 100).toFixed(1)
                : 0,
            totalDistance: Math.round(data.totalDistance),
            averageDistance: Math.round(data.totalDistance / data.count),
            totalCost: Math.round(data.totalCost),
            averageCost: Math.round(data.totalCost / data.count)
        }));
    }

    // トレンド分析（月別推移）
    analyzeTrend(months = 12) {
        const today = new Date();
        const trends = [];

        for (let i = months - 1; i >= 0; i--) {
            const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth() + 1;
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;

            const deliveries = db.getAllDeliveries().filter(d => d.startDate.startsWith(monthKey));
            const completed = deliveries.filter(d => d.status === 'completed');

            let totalDistance = 0;
            let totalCost = 0;
            deliveries.forEach(d => {
                totalDistance += d.distance || 0;
                const cost = costManagement.calculateDeliveryCost(d);
                totalCost += cost.totalCost;
            });

            trends.push({
                month: monthKey,
                deliveryCount: deliveries.length,
                completedCount: completed.length,
                totalDistance: Math.round(totalDistance),
                totalCost: Math.round(totalCost)
            });
        }

        return trends;
    }

    // 予測分析
    predictNextMonth() {
        const trends = this.analyzeTrend(6);

        if (trends.length < 3) {
            return {
                predicted: false,
                message: 'データが不足しています'
            };
        }

        // 単純な移動平均による予測
        const recentTrends = trends.slice(-3);
        const avgDeliveryCount = recentTrends.reduce((sum, t) => sum + t.deliveryCount, 0) / 3;
        const avgCost = recentTrends.reduce((sum, t) => sum + t.totalCost, 0) / 3;
        const avgDistance = recentTrends.reduce((sum, t) => sum + t.totalDistance, 0) / 3;

        // トレンド（増加/減少）
        const firstMonth = recentTrends[0];
        const lastMonth = recentTrends[recentTrends.length - 1];
        const deliveryTrend = lastMonth.deliveryCount - firstMonth.deliveryCount;
        const costTrend = lastMonth.totalCost - firstMonth.totalCost;

        return {
            predicted: true,
            predictedDeliveryCount: Math.round(avgDeliveryCount + deliveryTrend / 2),
            predictedCost: Math.round(avgCost + costTrend / 2),
            predictedDistance: Math.round(avgDistance),
            trend: deliveryTrend > 0 ? 'increasing' : deliveryTrend < 0 ? 'decreasing' : 'stable',
            confidence: 'medium',
            basedOnMonths: 3
        };
    }

    // KPI（重要業績評価指標）計算
    calculateKPIs(period = 30) {
        const deliveries = db.getAllDeliveries();
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);

        const periodDeliveries = deliveries.filter(d => {
            const deliveryDate = new Date(d.startDate);
            return deliveryDate >= startDate && deliveryDate <= endDate;
        });

        const completed = periodDeliveries.filter(d => d.status === 'completed');

        // 完了率
        const completionRate = periodDeliveries.length > 0
            ? (completed.length / periodDeliveries.length) * 100
            : 0;

        // 時刻通り率
        let onTimeCount = 0;
        completed.forEach(d => {
            const scheduledEnd = new Date(d.endDate + ' ' + d.endTime);
            const actualEnd = d.actualEndDateTime ? new Date(d.actualEndDateTime) : scheduledEnd;
            if (actualEnd <= scheduledEnd) onTimeCount++;
        });
        const onTimeRate = completed.length > 0 ? (onTimeCount / completed.length) * 100 : 0;

        // 平均配送時間
        let totalTime = 0;
        completed.forEach(d => {
            const start = new Date(d.startDate + ' ' + d.startTime);
            const end = d.actualEndDateTime ? new Date(d.actualEndDateTime) : new Date(d.endDate + ' ' + d.endTime);
            totalTime += (end - start) / (1000 * 60);
        });
        const averageDeliveryTime = completed.length > 0 ? totalTime / completed.length : 0;

        // トラック稼働率
        const trucks = db.getAllTrucks();
        const workingDays = period;
        let totalUtilization = 0;
        trucks.forEach(truck => {
            const truckDeliveries = periodDeliveries.filter(d => d.truckId === truck.id);
            const uniqueDates = [...new Set(truckDeliveries.map(d => d.startDate))];
            totalUtilization += (uniqueDates.length / workingDays) * 100;
        });
        const averageTruckUtilization = trucks.length > 0 ? totalUtilization / trucks.length : 0;

        // コスト効率
        let totalCost = 0;
        let totalDistance = 0;
        periodDeliveries.forEach(d => {
            const cost = costManagement.calculateDeliveryCost(d);
            totalCost += cost.totalCost;
            totalDistance += d.distance || 0;
        });
        const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;
        const costPerDelivery = periodDeliveries.length > 0 ? totalCost / periodDeliveries.length : 0;

        return {
            completionRate: completionRate.toFixed(1),
            onTimeRate: onTimeRate.toFixed(1),
            averageDeliveryTime: Math.round(averageDeliveryTime),
            averageTruckUtilization: averageTruckUtilization.toFixed(1),
            costPerKm: Math.round(costPerKm),
            costPerDelivery: Math.round(costPerDelivery),
            totalDeliveries: periodDeliveries.length,
            period: period
        };
    }

    // カスタムレポート生成
    generateCustomReport(filters) {
        let deliveries = db.getAllDeliveries();

        // フィルタ適用
        if (filters.startDate) {
            deliveries = deliveries.filter(d => d.startDate >= filters.startDate);
        }
        if (filters.endDate) {
            deliveries = deliveries.filter(d => d.startDate <= filters.endDate);
        }
        if (filters.truckId) {
            deliveries = deliveries.filter(d => d.truckId === filters.truckId);
        }
        if (filters.customerId) {
            deliveries = deliveries.filter(d => d.customerId === filters.customerId);
        }
        if (filters.status) {
            deliveries = deliveries.filter(d => d.status === filters.status);
        }

        // 基本統計
        const completed = deliveries.filter(d => d.status === 'completed');
        let totalDistance = 0;
        let totalCost = 0;

        deliveries.forEach(d => {
            totalDistance += d.distance || 0;
            const cost = costManagement.calculateDeliveryCost(d);
            totalCost += cost.totalCost;
        });

        return {
            filters: filters,
            summary: {
                totalDeliveries: deliveries.length,
                completedDeliveries: completed.length,
                totalDistance: Math.round(totalDistance),
                totalCost: Math.round(totalCost),
                averageDistance: deliveries.length > 0
                    ? Math.round(totalDistance / deliveries.length)
                    : 0,
                averageCost: deliveries.length > 0
                    ? Math.round(totalCost / deliveries.length)
                    : 0
            },
            deliveries: deliveries
        };
    }

    // エクスポート用データ生成
    generateExportData(format = 'summary') {
        const analytics = {
            dashboard: this.getDashboardAnalytics(),
            truckUtilization: this.analyzeTruckUtilization(30),
            customerMetrics: this.analyzeCustomerMetrics(90),
            timeOfDay: this.analyzeDeliveryByTimeOfDay(),
            dayOfWeek: this.analyzeDeliveryByDayOfWeek(),
            category: this.analyzeDeliveryByCategory(),
            trend: this.analyzeTrend(12),
            kpis: this.calculateKPIs(30),
            prediction: this.predictNextMonth()
        };

        if (format === 'summary') {
            return {
                generatedAt: new Date().toISOString(),
                period: '過去30日間',
                analytics: analytics
            };
        } else if (format === 'detailed') {
            return {
                generatedAt: new Date().toISOString(),
                period: '過去30日間',
                analytics: analytics,
                rawData: {
                    deliveries: db.getAllDeliveries(),
                    trucks: db.getAllTrucks(),
                    drivers: db.getAllDrivers(),
                    customers: db.getAllCustomers()
                }
            };
        }
    }
}

// グローバルインスタンス
const advancedAnalytics = new AdvancedAnalytics();
