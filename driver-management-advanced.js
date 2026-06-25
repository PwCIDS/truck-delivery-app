// 高度なドライバー管理機能

class DriverManagementAdvanced {
    constructor() {
        this.init();
    }

    init() {
        this.loadSettings();
    }

    // ドライバーのパフォーマンス評価
    evaluateDriverPerformance(driverId, period = 30) {
        const driver = db.getDriverById(driverId);
        if (!driver) return null;

        const deliveries = db.getAllDeliveries();
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);

        // 期間内のドライバーの配送を抽出
        const driverDeliveries = deliveries.filter(d => {
            const deliveryDate = new Date(d.startDate);
            return d.driverId === driverId &&
                   deliveryDate >= startDate &&
                   deliveryDate <= endDate;
        });

        if (driverDeliveries.length === 0) {
            return {
                totalDeliveries: 0,
                completedDeliveries: 0,
                completionRate: 0,
                onTimeRate: 0,
                averageDeliveryTime: 0,
                totalDistance: 0,
                rating: 0
            };
        }

        const completed = driverDeliveries.filter(d => d.status === 'completed');
        let onTimeCount = 0;
        let totalDeliveryTime = 0;
        let totalDistance = 0;

        completed.forEach(delivery => {
            // 時刻通りに完了したかチェック
            const scheduledEnd = new Date(delivery.endDate + ' ' + delivery.endTime);
            const actualEnd = delivery.actualEndDateTime ? new Date(delivery.actualEndDateTime) : scheduledEnd;

            if (actualEnd <= scheduledEnd) {
                onTimeCount++;
            }

            // 配送時間
            const start = new Date(delivery.startDate + ' ' + delivery.startTime);
            const end = actualEnd;
            const deliveryTime = (end - start) / (1000 * 60); // 分
            totalDeliveryTime += deliveryTime;

            // 距離
            if (delivery.distance) {
                totalDistance += delivery.distance;
            }
        });

        const completionRate = (completed.length / driverDeliveries.length) * 100;
        const onTimeRate = completed.length > 0 ? (onTimeCount / completed.length) * 100 : 0;
        const averageDeliveryTime = completed.length > 0 ? totalDeliveryTime / completed.length : 0;

        // 総合評価スコア（0-100）
        const rating = (
            completionRate * 0.3 +
            onTimeRate * 0.4 +
            Math.min(100, (driverDeliveries.length / period) * 10) * 0.3
        );

        return {
            totalDeliveries: driverDeliveries.length,
            completedDeliveries: completed.length,
            completionRate: completionRate.toFixed(1),
            onTimeRate: onTimeRate.toFixed(1),
            averageDeliveryTime: Math.round(averageDeliveryTime),
            totalDistance: Math.round(totalDistance),
            rating: Math.round(rating),
            period: period
        };
    }

    // ドライバーの稼働状況
    getDriverAvailability(driverId, date) {
        const deliveries = db.getAllDeliveries();
        const targetDate = new Date(date);

        const driverDeliveries = deliveries.filter(d => {
            const deliveryDate = new Date(d.startDate);
            return d.driverId === driverId &&
                   deliveryDate.toDateString() === targetDate.toDateString() &&
                   d.status !== 'completed';
        });

        if (driverDeliveries.length === 0) {
            return {
                available: true,
                conflicts: []
            };
        }

        return {
            available: false,
            conflicts: driverDeliveries.map(d => ({
                deliveryId: d.id,
                startTime: d.startTime,
                endTime: d.endTime,
                truck: db.getTruckById(d.truckId)?.number
            }))
        };
    }

    // ドライバーの勤務時間管理
    calculateWorkingHours(driverId, startDate, endDate) {
        const deliveries = db.getAllDeliveries();
        const start = new Date(startDate);
        const end = new Date(endDate);

        const driverDeliveries = deliveries.filter(d => {
            const deliveryDate = new Date(d.startDate);
            return d.driverId === driverId &&
                   deliveryDate >= start &&
                   deliveryDate <= end;
        });

        let totalMinutes = 0;
        const dailyHours = {};

        driverDeliveries.forEach(delivery => {
            const startDateTime = new Date(delivery.startDate + ' ' + delivery.startTime);
            const endDateTime = new Date(delivery.endDate + ' ' + delivery.endTime);
            const minutes = (endDateTime - startDateTime) / (1000 * 60);
            totalMinutes += minutes;

            const dateKey = delivery.startDate;
            if (!dailyHours[dateKey]) {
                dailyHours[dateKey] = 0;
            }
            dailyHours[dateKey] += minutes;
        });

        // 法定労働時間超過チェック（1日8時間、週40時間）
        const violations = [];
        Object.entries(dailyHours).forEach(([date, minutes]) => {
            if (minutes > 480) { // 8時間 = 480分
                violations.push({
                    date: date,
                    hours: (minutes / 60).toFixed(1),
                    type: 'daily',
                    message: `1日の労働時間が8時間を超えています (${(minutes / 60).toFixed(1)}時間)`
                });
            }
        });

        return {
            totalHours: (totalMinutes / 60).toFixed(1),
            totalMinutes: Math.round(totalMinutes),
            averageDailyHours: (totalMinutes / Object.keys(dailyHours).length / 60).toFixed(1),
            workingDays: Object.keys(dailyHours).length,
            violations: violations
        };
    }

    // ドライバーのスキルマッチング
    matchDriverToDelivery(deliveryRequirements) {
        const drivers = db.getAllDrivers();
        const matches = [];

        drivers.forEach(driver => {
            let matchScore = 0;
            const reasons = [];

            // 免許種類
            if (deliveryRequirements.license) {
                const licenseLevel = { '大型': 3, '中型': 2, '準中型': 1 };
                const driverLevel = licenseLevel[driver.license] || 0;
                const requiredLevel = licenseLevel[deliveryRequirements.license] || 0;

                if (driverLevel >= requiredLevel) {
                    matchScore += 30;
                    reasons.push('必要な免許を保有');
                } else {
                    reasons.push('免許が不足');
                }
            }

            // 特殊スキル
            if (deliveryRequirements.specialSkills && driver.specialSkills) {
                const driverSkills = driver.specialSkills.split(',').map(s => s.trim());
                const requiredSkills = deliveryRequirements.specialSkills;

                const hasAllSkills = requiredSkills.every(skill =>
                    driverSkills.some(ds => ds.includes(skill))
                );

                if (hasAllSkills) {
                    matchScore += 30;
                    reasons.push('必要なスキルを保有');
                } else {
                    reasons.push('一部スキルが不足');
                }
            }

            // 経験年数
            if (driver.experience) {
                if (driver.experience >= 5) {
                    matchScore += 20;
                    reasons.push('経験豊富');
                } else if (driver.experience >= 2) {
                    matchScore += 10;
                    reasons.push('経験あり');
                }
            }

            // パフォーマンス評価
            const performance = this.evaluateDriverPerformance(driver.id, 30);
            if (performance && performance.rating >= 80) {
                matchScore += 20;
                reasons.push('高評価ドライバー');
            } else if (performance && performance.rating >= 60) {
                matchScore += 10;
            }

            matches.push({
                driver: driver,
                matchScore: matchScore,
                reasons: reasons,
                performance: performance
            });
        });

        // スコア順にソート
        matches.sort((a, b) => b.matchScore - a.matchScore);

        return matches;
    }

    // ドライバーの健康状態・休息管理
    checkDriverHealth(driverId) {
        const driver = db.getDriverById(driverId);
        if (!driver) return null;

        const alerts = [];

        // 免許有効期限チェック
        if (driver.licenseExpiry) {
            const expiryDate = new Date(driver.licenseExpiry);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry <= 0) {
                alerts.push({
                    type: 'critical',
                    message: '免許が期限切れです',
                    daysUntilExpiry: daysUntilExpiry
                });
            } else if (daysUntilExpiry <= 30) {
                alerts.push({
                    type: 'warning',
                    message: `免許の有効期限が近づいています（残り${daysUntilExpiry}日）`,
                    daysUntilExpiry: daysUntilExpiry
                });
            }
        }

        // 健康診断期限チェック
        if (driver.healthCheckDate) {
            const lastCheck = new Date(driver.healthCheckDate);
            const today = new Date();
            const daysSinceCheck = Math.ceil((today - lastCheck) / (1000 * 60 * 60 * 24));

            if (daysSinceCheck > 365) {
                alerts.push({
                    type: 'warning',
                    message: '健康診断の受診が必要です（1年以上経過）',
                    daysSinceCheck: daysSinceCheck
                });
            }
        }

        // 連続勤務日数チェック（最近7日間）
        const recentDeliveries = db.getAllDeliveries().filter(d => {
            const deliveryDate = new Date(d.startDate);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return d.driverId === driverId && deliveryDate >= weekAgo;
        });

        const uniqueDates = [...new Set(recentDeliveries.map(d => d.startDate))];
        if (uniqueDates.length >= 6) {
            alerts.push({
                type: 'warning',
                message: `連続勤務日数が多くなっています（直近7日で${uniqueDates.length}日）`,
                workingDays: uniqueDates.length
            });
        }

        return {
            healthy: alerts.length === 0,
            alerts: alerts
        };
    }

    // ドライバートレーニング記録
    recordTraining(driverId, trainingData) {
        const driver = db.getDriverById(driverId);
        if (!driver) return false;

        if (!driver.trainings) {
            driver.trainings = [];
        }

        driver.trainings.push({
            id: Date.now(),
            date: trainingData.date || new Date().toISOString().split('T')[0],
            type: trainingData.type,
            title: trainingData.title,
            duration: trainingData.duration,
            instructor: trainingData.instructor,
            result: trainingData.result,
            notes: trainingData.notes
        });

        db.updateDriver(driverId, driver);
        return true;
    }

    // ドライバー推奨システム
    recommendDriverForRoute(routeData) {
        const requirements = {
            license: routeData.requiredLicense || '中型',
            specialSkills: routeData.specialSkills || [],
            date: routeData.date
        };

        // マッチングスコアで候補を取得
        const matches = this.matchDriverToDelivery(requirements);

        // 稼働状況でフィルタリング
        const available = matches.filter(match => {
            const availability = this.getDriverAvailability(match.driver.id, requirements.date);
            return availability.available;
        });

        // 健康状態でフィルタリング
        const healthy = available.filter(match => {
            const health = this.checkDriverHealth(match.driver.id);
            return health && health.healthy;
        });

        return {
            recommended: healthy.slice(0, 3), // トップ3を推奨
            alternatives: healthy.slice(3, 6), // 代替候補
            unavailable: matches.filter(m => !available.find(a => a.driver.id === m.driver.id))
        };
    }

    // ドライバーランキング
    getDriverRankings(period = 30) {
        const drivers = db.getAllDrivers();
        const rankings = [];

        drivers.forEach(driver => {
            const performance = this.evaluateDriverPerformance(driver.id, period);
            if (performance && performance.totalDeliveries > 0) {
                rankings.push({
                    driver: driver,
                    performance: performance
                });
            }
        });

        // 評価スコア順にソート
        rankings.sort((a, b) => b.performance.rating - a.performance.rating);

        return rankings;
    }

    // 設定読み込み
    loadSettings() {
        const saved = localStorage.getItem('driver_management_settings');
        if (saved) {
            this.settings = JSON.parse(saved);
        } else {
            this.settings = {
                maxDailyHours: 8,
                maxWeeklyHours: 40,
                licenseExpiryAlertDays: 30,
                healthCheckIntervalDays: 365
            };
        }
    }

    // 設定保存
    saveSettings() {
        localStorage.setItem('driver_management_settings', JSON.stringify(this.settings));
    }
}

// グローバルインスタンス
const driverManagementAdvanced = new DriverManagementAdvanced();
