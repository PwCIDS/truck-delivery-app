// 拡張機能の統合UI

// ページ読み込み時に拡張機能を初期化
window.addEventListener('load', () => {
    initializeEnhancedFeatures();
});

function initializeEnhancedFeatures() {
    // レポート画面の拡張
    if (document.getElementById('kpi-metrics')) {
        loadKPIMetrics();
    }

    // 定期的な更新（5分ごと）
    setInterval(() => {
        if (window.currentView === 'reports') {
            refreshReportsView();
        }
    }, 5 * 60 * 1000);
}

// KPI読み込み
function loadKPIMetrics() {
    const kpis = advancedAnalytics.calculateKPIs(30);
    const container = document.getElementById('kpi-metrics');

    if (!container) return;

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
            <div style="padding: 15px; background-color: #e3f2fd; border-radius: 8px;">
                <div style="font-size: 12px; color: #666;">完了率</div>
                <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${kpis.completionRate}%</div>
            </div>
            <div style="padding: 15px; background-color: #e8f5e9; border-radius: 8px;">
                <div style="font-size: 12px; color: #666;">時刻通り率</div>
                <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${kpis.onTimeRate}%</div>
            </div>
            <div style="padding: 15px; background-color: #fff3e0; border-radius: 8px;">
                <div style="font-size: 12px; color: #666;">平均配送時間</div>
                <div style="font-size: 24px; font-weight: bold; color: #FF9800;">${kpis.averageDeliveryTime}分</div>
            </div>
            <div style="padding: 15px; background-color: #f3e5f5; border-radius: 8px;">
                <div style="font-size: 12px; color: #666;">トラック稼働率</div>
                <div style="font-size: 24px; font-weight: bold; color: #9C27B0;">${kpis.averageTruckUtilization}%</div>
            </div>
            <div style="padding: 15px; background-color: #fce4ec; border-radius: 8px;">
                <div style="font-size: 12px; color: #666;">配送単価</div>
                <div style="font-size: 24px; font-weight: bold; color: #E91E63;">¥${kpis.costPerDelivery.toLocaleString()}</div>
            </div>
            <div style="padding: 15px; background-color: #e0f2f1; border-radius: 8px;">
                <div style="font-size: 12px; color: #666;">km単価</div>
                <div style="font-size: 24px; font-weight: bold; color: #009688;">¥${kpis.costPerKm.toLocaleString()}/km</div>
            </div>
        </div>
        <div style="margin-top: 10px; text-align: center; color: #999; font-size: 12px;">
            過去${kpis.period}日間のデータ（配送数: ${kpis.totalDeliveries}件）
        </div>
    `;
}

// コスト削減提案読み込み
function loadCostReductionSuggestions() {
    const suggestions = costManagement.getCostReductionSuggestions();
    const container = document.getElementById('cost-reduction-suggestions');

    if (!container) return;

    if (suggestions.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">現時点で提案はありません</p>';
        return;
    }

    let html = '<div style="margin-top: 15px;">';

    suggestions.forEach(suggestion => {
        const priorityColor = {
            high: '#f44336',
            medium: '#ff9800',
            low: '#4caf50'
        }[suggestion.priority];

        html += `
            <div style="padding: 15px; margin-bottom: 10px; border-left: 4px solid ${priorityColor}; background-color: #f5f5f5; border-radius: 5px;">
                <div style="display: flex; justify-content: between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: ${priorityColor}; margin-bottom: 5px;">
                            ${suggestion.priority === 'high' ? '🔴' : suggestion.priority === 'medium' ? '🟡' : '🟢'}
                            優先度: ${suggestion.priority === 'high' ? '高' : suggestion.priority === 'medium' ? '中' : '低'}
                        </div>
                        <div style="color: #333; margin-bottom: 5px;">${suggestion.message}</div>
                        <div style="color: #666; font-size: 14px;">${suggestion.suggestion}</div>
                    </div>
                    <div style="text-align: right; padding-left: 15px;">
                        <div style="font-size: 12px; color: #999;">削減見込み</div>
                        <div style="font-size: 18px; font-weight: bold; color: #4CAF50;">
                            ¥${suggestion.potentialSaving.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// 時間帯別分析読み込み
function loadTimeOfDayAnalysis() {
    const analysis = advancedAnalytics.analyzeDeliveryByTimeOfDay();
    const container = document.getElementById('time-of-day-analysis');

    if (!container) return;

    let html = '<div style="margin-top: 15px;">';

    analysis.forEach(slot => {
        const barWidth = Math.min(100, parseFloat(slot.percentage));

        html += `
            <div style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-weight: bold;">${slot.timeSlot}</span>
                    <span>${slot.count}件 (${slot.percentage}%)</span>
                </div>
                <div style="width: 100%; height: 20px; background-color: #e0e0e0; border-radius: 10px; overflow: hidden;">
                    <div style="width: ${barWidth}%; height: 100%; background: linear-gradient(90deg, #2196F3, #64B5F6); transition: width 0.3s;"></div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// 曜日別分析読み込み
function loadDayOfWeekAnalysis() {
    const analysis = advancedAnalytics.analyzeDeliveryByDayOfWeek();
    const container = document.getElementById('day-of-week-analysis');

    if (!container) return;

    let html = '<div style="margin-top: 15px;">';

    analysis.forEach(dayData => {
        const barWidth = Math.min(100, parseFloat(dayData.percentage));

        html += `
            <div style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-weight: bold;">${dayData.day}</span>
                    <span>${dayData.count}件 (${dayData.percentage}%)</span>
                </div>
                <div style="width: 100%; height: 20px; background-color: #e0e0e0; border-radius: 10px; overflow: hidden;">
                    <div style="width: ${barWidth}%; height: 100%; background: linear-gradient(90deg, #4CAF50, #81C784); transition: width 0.3s;"></div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// データ整合性チェック実行
function runDataIntegrityCheck() {
    const result = dataValidation.checkDataIntegrity();
    const container = document.getElementById('integrity-check-results');

    if (!container) return;

    if (result.valid) {
        container.innerHTML = `
            <div style="padding: 15px; background-color: #e8f5e9; border-radius: 8px; border-left: 4px solid #4CAF50; margin-top: 15px;">
                <div style="font-weight: bold; color: #4CAF50; margin-bottom: 5px;">✅ データ整合性チェック完了</div>
                <div style="color: #666;">問題は見つかりませんでした。データは正常です。</div>
            </div>
        `;
    } else {
        let html = `
            <div style="padding: 15px; background-color: #ffebee; border-radius: 8px; border-left: 4px solid #f44336; margin-top: 15px;">
                <div style="font-weight: bold; color: #f44336; margin-bottom: 10px;">⚠️ ${result.issues.length}件の問題が見つかりました</div>
                <div style="max-height: 300px; overflow-y: auto;">
        `;

        result.issues.forEach(issue => {
            html += `
                <div style="padding: 10px; margin-bottom: 5px; background-color: white; border-radius: 5px;">
                    <div style="font-weight: bold; color: #333;">${issue.type === 'orphaned_reference' ? '🔗 孤立参照' : '🔄 重複'}</div>
                    <div style="color: #666; font-size: 14px; margin-top: 5px;">${issue.message}</div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
    }
}

// データクリーンアップ提案表示
function showDataCleanupSuggestions() {
    const suggestions = dataValidation.suggestDataCleanup();

    if (suggestions.length === 0) {
        showNotification('クリーンアップの必要はありません', 'success');
        return;
    }

    let html = `
        <div style="padding: 20px;">
            <h3>🧹 データクリーンアップ提案</h3>
            <p style="color: #666; margin-bottom: 20px;">以下のデータのクリーンアップを検討してください。</p>
    `;

    suggestions.forEach(suggestion => {
        html += `
            <div style="padding: 15px; margin-bottom: 15px; border: 2px solid #ff9800; border-radius: 8px; background-color: #fff3e0;">
                <div style="font-weight: bold; color: #f57c00; margin-bottom: 10px;">
                    ${suggestion.type === 'old_records' ? '📅' : suggestion.type === 'unused_trucks' ? '🚚' : '👤'}
                    ${suggestion.message}
                </div>
                ${suggestion.action ? `<div style="color: #666; font-size: 14px;">推奨: ${suggestion.action}</div>` : ''}
            </div>
        `;
    });

    html += `
            <div style="margin-top: 20px; text-align: right;">
                <button onclick="closeModal()" class="btn-secondary">閉じる</button>
            </div>
        </div>
    `;

    showModal('データクリーンアップ提案', html);
}

// レポート画面のリフレッシュ
function refreshReportsView() {
    loadKPIMetrics();
    loadCostReductionSuggestions();
    loadTimeOfDayAnalysis();
    loadDayOfWeekAnalysis();
}

// レポート画面読み込み時の拡張
const originalLoadReportsView = window.loadReportsView;
window.loadReportsView = function() {
    if (originalLoadReportsView) {
        originalLoadReportsView();
    }

    // 拡張機能の読み込み
    setTimeout(() => {
        loadKPIMetrics();
        loadCostReductionSuggestions();
        loadTimeOfDayAnalysis();
        loadDayOfWeekAnalysis();
    }, 100);
};

// 配送登録・編集時のデータ検証統合
function validateDeliveryForm(data) {
    // 基本検証
    const basicValidation = dataValidation.validateEntity('delivery', data);
    if (!basicValidation.valid) {
        const messages = dataValidation.formatErrorMessages(basicValidation);
        showNotification(messages.join('\n'), 'error');
        return false;
    }

    // ビジネスルール検証
    const businessValidation = dataValidation.validateBusinessRules('delivery', data);
    if (!businessValidation.valid) {
        const messages = businessValidation.errors;
        showNotification(messages.join('\n'), 'error');
        return false;
    }

    return true;
}

// トラック登録・編集時のデータ検証統合
function validateTruckForm(data) {
    const basicValidation = dataValidation.validateEntity('truck', data);
    if (!basicValidation.valid) {
        const messages = dataValidation.formatErrorMessages(basicValidation);
        showNotification(messages.join('\n'), 'error');
        return false;
    }

    const businessValidation = dataValidation.validateBusinessRules('truck', data);
    if (!businessValidation.valid) {
        const messages = businessValidation.errors;
        showNotification(messages.join('\n'), 'error');
        return false;
    }

    return true;
}

// ドライバー登録・編集時のデータ検証統合
function validateDriverForm(data) {
    const basicValidation = dataValidation.validateEntity('driver', data);
    if (!basicValidation.valid) {
        const messages = dataValidation.formatErrorMessages(basicValidation);
        showNotification(messages.join('\n'), 'error');
        return false;
    }

    const businessValidation = dataValidation.validateBusinessRules('driver', data);
    if (!businessValidation.valid) {
        const messages = businessValidation.errors;
        showNotification(messages.join('\n'), 'error');
        return false;
    }

    return true;
}

// ドライバーパフォーマンス表示
function showDriverPerformance(driverId) {
    const performance = driverManagementAdvanced.evaluateDriverPerformance(driverId, 30);
    const driver = db.getDriverById(driverId);

    if (!driver || !performance) {
        showNotification('ドライバー情報が取得できません', 'error');
        return;
    }

    const html = `
        <div style="padding: 20px;">
            <h3>📊 ドライバーパフォーマンス: ${driver.name}</h3>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
                <div style="padding: 15px; background-color: #e3f2fd; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666;">総合評価</div>
                    <div style="font-size: 32px; font-weight: bold; color: #2196F3;">${performance.rating}/100</div>
                </div>
                <div style="padding: 15px; background-color: #e8f5e9; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666;">配送回数</div>
                    <div style="font-size: 32px; font-weight: bold; color: #4CAF50;">${performance.totalDeliveries}件</div>
                </div>
                <div style="padding: 15px; background-color: #fff3e0; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666;">完了率</div>
                    <div style="font-size: 32px; font-weight: bold; color: #FF9800;">${performance.completionRate}%</div>
                </div>
                <div style="padding: 15px; background-color: #f3e5f5; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666;">時刻通り率</div>
                    <div style="font-size: 32px; font-weight: bold; color: #9C27B0;">${performance.onTimeRate}%</div>
                </div>
            </div>

            <div style="padding: 15px; background-color: #f5f5f5; border-radius: 8px;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <div>
                        <div style="font-size: 12px; color: #666;">平均配送時間</div>
                        <div style="font-size: 18px; font-weight: bold;">${performance.averageDeliveryTime}分</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666;">総走行距離</div>
                        <div style="font-size: 18px; font-weight: bold;">${performance.totalDistance} km</div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 10px; text-align: center; color: #999; font-size: 12px;">
                過去${performance.period}日間のデータ
            </div>

            <div style="margin-top: 20px; text-align: right;">
                <button onclick="closeModal()" class="btn-secondary">閉じる</button>
            </div>
        </div>
    `;

    showModal('ドライバーパフォーマンス', html);
}

// 配送コスト詳細表示
function showDeliveryCost(deliveryId) {
    const delivery = db.getDeliveryById(deliveryId);
    if (!delivery) {
        showNotification('配送が見つかりません', 'error');
        return;
    }

    const cost = costManagement.calculateDeliveryCost(delivery);
    const truck = db.getTruckById(delivery.truckId);

    const html = `
        <div style="padding: 20px;">
            <h3>💰 配送コスト詳細: #${deliveryId}</h3>

            <div style="margin: 20px 0; padding: 20px; background-color: #e8f5e9; border-radius: 8px; text-align: center;">
                <div style="font-size: 14px; color: #666; margin-bottom: 10px;">総コスト</div>
                <div style="font-size: 48px; font-weight: bold; color: #4CAF50;">¥${cost.totalCost.toLocaleString()}</div>
            </div>

            <div style="padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
                <h4 style="margin-top: 0;">コスト内訳</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">燃料費</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">¥${cost.fuelCost.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">人件費</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">¥${cost.laborCost.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">高速道路料金</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">¥${cost.tollCost.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">メンテナンス費</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">¥${cost.maintenanceCost.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">固定費（日割り）</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">¥${cost.fixedCost.toLocaleString()}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-top: 20px; padding: 15px; background-color: #e3f2fd; border-radius: 8px;">
                <h4 style="margin-top: 0;">計算基準</h4>
                <div style="font-size: 14px; color: #666;">
                    <div>走行距離: ${cost.breakdown.distance} km</div>
                    <div>配送時間: ${cost.breakdown.hours} 時間</div>
                    <div>燃費: ${cost.breakdown.fuelEfficiency} km/L</div>
                    <div>燃料単価: ¥${cost.breakdown.fuelPrice}/L</div>
                    ${truck ? `<div>トラック: ${truck.number}</div>` : ''}
                </div>
            </div>

            <div style="margin-top: 20px; text-align: right;">
                <button onclick="closeModal()" class="btn-secondary">閉じる</button>
            </div>
        </div>
    `;

    showModal('配送コスト詳細', html);
}
