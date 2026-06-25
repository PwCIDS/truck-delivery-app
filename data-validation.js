// データ検証・整合性チェック機能

class DataValidation {
    constructor() {
        this.validationRules = {
            truck: {
                number: { required: true, pattern: /^T-\d{3}$/, message: 'トラックNoは T-001 形式で入力してください' },
                vehicleNumber: { required: true, minLength: 5, message: '車両番号は5文字以上で入力してください' },
                type: { required: true, enum: ['配達', '保冷', '活魚'], message: '有効な種類を選択してください' },
                capacity: { required: true, min: 0, max: 20000, message: '最大積載量は0-20000kgの範囲で入力してください' }
            },
            driver: {
                code: { required: true, pattern: /^D-\d{3}$/, message: 'ドライバーコードは D-001 形式で入力してください' },
                name: { required: true, minLength: 2, message: '氏名は2文字以上で入力してください' },
                age: { required: true, min: 18, max: 70, message: '年齢は18-70歳の範囲で入力してください' },
                license: { required: true, enum: ['大型', '中型', '準中型'], message: '有効な免許種類を選択してください' },
                phone: { pattern: /^0\d{9,10}$/, message: '有効な電話番号を入力してください' }
            },
            customer: {
                code: { required: true, pattern: /^C-\d{3}$/, message: '顧客コードは C-001 形式で入力してください' },
                name: { required: true, minLength: 2, message: '顧客名は2文字以上で入力してください' },
                address: { required: true, minLength: 5, message: '住所は5文字以上で入力してください' },
                phone: { pattern: /^0\d{9,10}$/, message: '有効な電話番号を入力してください' }
            },
            delivery: {
                truckId: { required: true, message: 'トラックを選択してください' },
                driverId: { required: true, message: 'ドライバーを選択してください' },
                customerId: { required: true, message: '顧客を選択してください' },
                startDate: { required: true, message: '出発日を入力してください' },
                startTime: { required: true, message: '出発時刻を入力してください' },
                endDate: { required: true, message: '到着日を入力してください' },
                endTime: { required: true, message: '到着時刻を入力してください' },
                cargo: { required: true, minLength: 2, message: '積載内容は2文字以上で入力してください' }
            }
        };
    }

    // 単一フィールド検証
    validateField(entityType, fieldName, value) {
        const rules = this.validationRules[entityType]?.[fieldName];
        if (!rules) return { valid: true };

        const errors = [];

        // 必須チェック
        if (rules.required && (value === null || value === undefined || value === '')) {
            errors.push(rules.message || `${fieldName}は必須です`);
            return { valid: false, errors: errors };
        }

        // 値がある場合のみ以下のチェックを実施
        if (value !== null && value !== undefined && value !== '') {
            // パターンマッチ
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(rules.message || `${fieldName}の形式が正しくありません`);
            }

            // 最小値
            if (rules.min !== undefined && Number(value) < rules.min) {
                errors.push(rules.message || `${fieldName}は${rules.min}以上である必要があります`);
            }

            // 最大値
            if (rules.max !== undefined && Number(value) > rules.max) {
                errors.push(rules.message || `${fieldName}は${rules.max}以下である必要があります`);
            }

            // 最小長
            if (rules.minLength && String(value).length < rules.minLength) {
                errors.push(rules.message || `${fieldName}は${rules.minLength}文字以上である必要があります`);
            }

            // 列挙値
            if (rules.enum && !rules.enum.includes(value)) {
                errors.push(rules.message || `${fieldName}は有効な値ではありません`);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // エンティティ全体の検証
    validateEntity(entityType, data) {
        const rules = this.validationRules[entityType];
        if (!rules) return { valid: true, errors: {} };

        const errors = {};
        let isValid = true;

        Object.keys(rules).forEach(fieldName => {
            const result = this.validateField(entityType, fieldName, data[fieldName]);
            if (!result.valid) {
                errors[fieldName] = result.errors;
                isValid = false;
            }
        });

        return {
            valid: isValid,
            errors: errors
        };
    }

    // カスタムビジネスルール検証
    validateBusinessRules(entityType, data) {
        const errors = [];

        if (entityType === 'delivery') {
            // 配送時間の整合性チェック
            if (data.startDate && data.startTime && data.endDate && data.endTime) {
                const start = new Date(data.startDate + ' ' + data.startTime);
                const end = new Date(data.endDate + ' ' + data.endTime);

                if (end <= start) {
                    errors.push('到着日時は出発日時より後である必要があります');
                }

                // 配送時間が24時間を超える場合は警告
                const hours = (end - start) / (1000 * 60 * 60);
                if (hours > 24) {
                    errors.push('配送時間が24時間を超えています。確認してください。');
                }
            }

            // トラックの稼働チェック
            if (data.truckId && data.startDate && data.endDate) {
                const conflicts = this.checkTruckAvailability(data.truckId, data.startDate, data.startTime, data.endDate, data.endTime, data.id);
                if (conflicts.length > 0) {
                    errors.push(`選択したトラックは既に配送予定があります（配送ID: ${conflicts.join(', ')}）`);
                }
            }

            // ドライバーの稼働チェック
            if (data.driverId && data.startDate && data.endDate) {
                const conflicts = this.checkDriverAvailability(data.driverId, data.startDate, data.startTime, data.endDate, data.endTime, data.id);
                if (conflicts.length > 0) {
                    errors.push(`選択したドライバーは既に配送予定があります（配送ID: ${conflicts.join(', ')}）`);
                }
            }

            // 積載量チェック
            if (data.truckId && data.weight) {
                const truck = db.getTruckById(data.truckId);
                if (truck && data.weight > truck.capacity) {
                    errors.push(`積載重量(${data.weight}kg)がトラックの最大積載量(${truck.capacity}kg)を超えています`);
                }
            }
        }

        if (entityType === 'truck') {
            // 車両番号の重複チェック
            if (data.vehicleNumber) {
                const duplicate = this.checkDuplicateTruckVehicleNumber(data.vehicleNumber, data.id);
                if (duplicate) {
                    errors.push('この車両番号は既に登録されています');
                }
            }
        }

        if (entityType === 'driver') {
            // ドライバーコードの重複チェック
            if (data.code) {
                const duplicate = this.checkDuplicateDriverCode(data.code, data.id);
                if (duplicate) {
                    errors.push('このドライバーコードは既に登録されています');
                }
            }

            // 免許有効期限チェック
            if (data.licenseExpiry) {
                const expiryDate = new Date(data.licenseExpiry);
                const today = new Date();
                if (expiryDate < today) {
                    errors.push('免許の有効期限が切れています');
                }
            }
        }

        if (entityType === 'customer') {
            // 顧客コードの重複チェック
            if (data.code) {
                const duplicate = this.checkDuplicateCustomerCode(data.code, data.id);
                if (duplicate) {
                    errors.push('この顧客コードは既に登録されています');
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // トラック稼働チェック
    checkTruckAvailability(truckId, startDate, startTime, endDate, endTime, excludeDeliveryId = null) {
        const deliveries = db.getAllDeliveries();
        const conflicts = [];

        const targetStart = new Date(startDate + ' ' + startTime);
        const targetEnd = new Date(endDate + ' ' + endTime);

        deliveries.forEach(d => {
            if (d.id === excludeDeliveryId) return;
            if (d.truckId !== truckId) return;
            if (d.status === 'completed') return;

            const deliveryStart = new Date(d.startDate + ' ' + d.startTime);
            const deliveryEnd = new Date(d.endDate + ' ' + d.endTime);

            // 時間の重複チェック
            if (
                (targetStart >= deliveryStart && targetStart < deliveryEnd) ||
                (targetEnd > deliveryStart && targetEnd <= deliveryEnd) ||
                (targetStart <= deliveryStart && targetEnd >= deliveryEnd)
            ) {
                conflicts.push(d.id);
            }
        });

        return conflicts;
    }

    // ドライバー稼働チェック
    checkDriverAvailability(driverId, startDate, startTime, endDate, endTime, excludeDeliveryId = null) {
        const deliveries = db.getAllDeliveries();
        const conflicts = [];

        const targetStart = new Date(startDate + ' ' + startTime);
        const targetEnd = new Date(endDate + ' ' + endTime);

        deliveries.forEach(d => {
            if (d.id === excludeDeliveryId) return;
            if (d.driverId !== driverId) return;
            if (d.status === 'completed') return;

            const deliveryStart = new Date(d.startDate + ' ' + d.startTime);
            const deliveryEnd = new Date(d.endDate + ' ' + d.endTime);

            if (
                (targetStart >= deliveryStart && targetStart < deliveryEnd) ||
                (targetEnd > deliveryStart && targetEnd <= deliveryEnd) ||
                (targetStart <= deliveryStart && targetEnd >= deliveryEnd)
            ) {
                conflicts.push(d.id);
            }
        });

        return conflicts;
    }

    // 車両番号重複チェック
    checkDuplicateTruckVehicleNumber(vehicleNumber, excludeTruckId = null) {
        const trucks = db.getAllTrucks();
        return trucks.some(t => t.id !== excludeTruckId && t.vehicleNumber === vehicleNumber);
    }

    // ドライバーコード重複チェック
    checkDuplicateDriverCode(code, excludeDriverId = null) {
        const drivers = db.getAllDrivers();
        return drivers.some(d => d.id !== excludeDriverId && d.code === code);
    }

    // 顧客コード重複チェック
    checkDuplicateCustomerCode(code, excludeCustomerId = null) {
        const customers = db.getAllCustomers();
        return customers.some(c => c.id !== excludeCustomerId && c.code === code);
    }

    // データ整合性チェック（全体）
    checkDataIntegrity() {
        const issues = [];

        // 孤立した配送レコード（存在しないトラック/ドライバー/顧客を参照）
        const deliveries = db.getAllDeliveries();
        const trucks = db.getAllTrucks();
        const drivers = db.getAllDrivers();
        const customers = db.getAllCustomers();

        deliveries.forEach(delivery => {
            if (!trucks.find(t => t.id === delivery.truckId)) {
                issues.push({
                    type: 'orphaned_reference',
                    entity: 'delivery',
                    id: delivery.id,
                    message: `配送ID ${delivery.id}: 存在しないトラックID ${delivery.truckId} を参照しています`
                });
            }

            if (!drivers.find(d => d.id === delivery.driverId)) {
                issues.push({
                    type: 'orphaned_reference',
                    entity: 'delivery',
                    id: delivery.id,
                    message: `配送ID ${delivery.id}: 存在しないドライバーID ${delivery.driverId} を参照しています`
                });
            }

            if (!customers.find(c => c.id === delivery.customerId)) {
                issues.push({
                    type: 'orphaned_reference',
                    entity: 'delivery',
                    id: delivery.id,
                    message: `配送ID ${delivery.id}: 存在しない顧客ID ${delivery.customerId} を参照しています`
                });
            }
        });

        // トラック番号の重複
        const truckNumbers = {};
        trucks.forEach(truck => {
            if (truckNumbers[truck.number]) {
                issues.push({
                    type: 'duplicate',
                    entity: 'truck',
                    id: truck.id,
                    message: `トラックNo ${truck.number} が重複しています`
                });
            }
            truckNumbers[truck.number] = true;
        });

        // ドライバーコードの重複
        const driverCodes = {};
        drivers.forEach(driver => {
            if (driverCodes[driver.code]) {
                issues.push({
                    type: 'duplicate',
                    entity: 'driver',
                    id: driver.id,
                    message: `ドライバーコード ${driver.code} が重複しています`
                });
            }
            driverCodes[driver.code] = true;
        });

        // 顧客コードの重複
        const customerCodes = {};
        customers.forEach(customer => {
            if (customerCodes[customer.code]) {
                issues.push({
                    type: 'duplicate',
                    entity: 'customer',
                    id: customer.id,
                    message: `顧客コード ${customer.code} が重複しています`
                });
            }
            customerCodes[customer.code] = true;
        });

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    // データクリーンアップ提案
    suggestDataCleanup() {
        const suggestions = [];

        // 古い完了配送の削除提案（1年以上前）
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const oldDeliveries = db.getAllDeliveries().filter(d => {
            const deliveryDate = new Date(d.startDate);
            return d.status === 'completed' && deliveryDate < oneYearAgo;
        });

        if (oldDeliveries.length > 0) {
            suggestions.push({
                type: 'old_records',
                count: oldDeliveries.length,
                message: `1年以上前の完了配送が${oldDeliveries.length}件あります`,
                action: 'アーカイブまたは削除を検討してください'
            });
        }

        // 未使用のトラック
        const deliveries = db.getAllDeliveries();
        const usedTruckIds = new Set(deliveries.map(d => d.truckId));
        const unusedTrucks = db.getAllTrucks().filter(t => !usedTruckIds.has(t.id));

        if (unusedTrucks.length > 0) {
            suggestions.push({
                type: 'unused_trucks',
                count: unusedTrucks.length,
                trucks: unusedTrucks,
                message: `一度も使用されていないトラックが${unusedTrucks.length}台あります`
            });
        }

        // 未使用のドライバー
        const usedDriverIds = new Set(deliveries.map(d => d.driverId));
        const unusedDrivers = db.getAllDrivers().filter(d => !usedDriverIds.has(d.id));

        if (unusedDrivers.length > 0) {
            suggestions.push({
                type: 'unused_drivers',
                count: unusedDrivers.length,
                drivers: unusedDrivers,
                message: `一度も配送を担当していないドライバーが${unusedDrivers.length}名います`
            });
        }

        return suggestions;
    }

    // エラーメッセージのフォーマット
    formatErrorMessages(validationResult) {
        if (validationResult.valid) {
            return [];
        }

        const messages = [];

        if (Array.isArray(validationResult.errors)) {
            messages.push(...validationResult.errors);
        } else if (typeof validationResult.errors === 'object') {
            Object.entries(validationResult.errors).forEach(([field, errors]) => {
                if (Array.isArray(errors)) {
                    messages.push(...errors);
                }
            });
        }

        return messages;
    }
}

// グローバルインスタンス
const dataValidation = new DataValidation();
