// =================================================
// МОДУЛЬ ФОРМУЛ КАЛЬКУЛЯТОРА «ЭКСПЕРТ» (Версия 13.0 - Конфигурируемая)
// =================================================
// Вся математика теперь использует глобальный объект CALC_CONFIG,
// который передается из PHP. В этом файле больше нет цен.

// -------------------------------------------------
// БЛОК 2: РАСЧЕТ ЦЕНЫ ЗА ЕДИНИЦУ РАБОТЫ
// -------------------------------------------------
function calculatePricePerUnit(workData, quantity) {
    try {
        let basePrice = 0;
        const isCps = workData.itemType.includes('cps');
        const baseItemType = isCps ? workData.itemType.replace('cps', 'gypsum') : workData.itemType;

        // Используем данные из CALC_CONFIG
        const volumeTiers = CALC_CONFIG.volume_prices[workData.workType]?.[baseItemType]?.[workData.workScope]?.[workData.activeTariff];

        if (volumeTiers && quantity > 0) {
            // Infinity в JSON передается как строка, нужно это учесть
            const tier = volumeTiers.find(t => quantity <= (t.upTo === "Infinity" ? Infinity : t.upTo));
            if (tier) basePrice = tier.price;
        } 
        
        if (basePrice === 0) {
            basePrice = CALC_CONFIG.base_prices[workData.workType]?.[baseItemType]?.[workData.workScope]?.[workData.activeTariff] || 0;
        }

        if (basePrice === 0) return 0;
        console.log('Price for ' + workData.workType + ' - ' + workData.itemType + ': ' + basePrice);

        const wallMaterialCoeffs = CALC_CONFIG.coefficients.wall_material;
        let wallMaterialCoefficient = (workData.workType === 'plaster') ? (wallMaterialCoeffs[workData.wallMaterial] || 1.0) : 1.0;

        let finalPrice = (basePrice * wallMaterialCoefficient);

        if (isCps) {
            finalPrice += CALC_CONFIG.coefficients.cps_work_surcharge;
        }

        return Math.round(finalPrice);

    } catch (e) {
        console.error("Ошибка в модуле формул (PricePerUnit):", e);
        return 0;
    }
}


// -------------------------------------------------
// БЛОК 3: РАСЧЕТ ЛОГИСТИКИ И СТОИМОСТИ ДОП. СЛОЯ
// -------------------------------------------------
function calculateLogisticsAndExtraCosts(estimateItems, generalData) {
    try {
        let totalWeightKg = 0;
        let extraLayerCost = 0;
        const standardThicknessCm = 2;
        const actualThicknessCm = generalData.layer_thickness / 10;
        const extraThicknessCm = actualThicknessCm > standardThicknessCm ? actualThicknessCm - standardThicknessCm : 0;

        const mixtureConsumption = CALC_CONFIG.coefficients.mixture_consumption;
        const materialPrices = CALC_CONFIG.material_prices;
        const logisticsPrices = CALC_CONFIG.logistics;

        // 1. Считаем общий вес и стоимость доп. слоя
        estimateItems.forEach(item => {
            if (item.workScope === 'work_and_material' && item.workType === 'plaster') {
                const isCps = item.name.toLowerCase().includes('цпс');
                const materialType = isCps ? 'cps' : 'gypsum';
                const consumption = mixtureConsumption[materialType];
                const materialData = materialPrices[generalData.activeTariff][materialType];
                const pricePerKg = materialData.price / materialData.weight;

                totalWeightKg += item.quantity * standardThicknessCm * consumption;

                if (extraThicknessCm > 0) {
                    const extraWeight = item.quantity * extraThicknessCm * consumption;
                    totalWeightKg += extraWeight;
                    extraLayerCost += extraWeight * pricePerKg;
                }
            } else if (item.workScope === 'work_and_material' && item.workType === 'masonry') {
                 totalWeightKg += item.quantity * CALC_CONFIG.coefficients.masonry_weight_per_sqm;
            }
        });

        if (totalWeightKg === 0) {
            return { delivery: 0, unloading: 0, carry: 0, extraLayerCost: 0 };
        }

        const totalWeightTon = totalWeightKg / 1000;
        let deliveryCost = 0;
        let unloadingCost = 0;
        let carryCost = 0;

        // 2. Расчет стоимости доставки
        const fiveTonTrucks = Math.floor(totalWeightTon / 5);
        deliveryCost += fiveTonTrucks * logisticsPrices.truck_5_ton_price;
        let remainingWeight = totalWeightTon % 5;
        if (remainingWeight > 0) {
            deliveryCost += (remainingWeight <= 2.5) ? logisticsPrices.truck_2_5_ton_price : logisticsPrices.truck_5_ton_price;
        }
        if (generalData.location === 'region' && generalData.km_from_mkad > 0) {
            deliveryCost += logisticsPrices.price_per_ton_per_km_outside_mkad * totalWeightTon * generalData.km_from_mkad;
        }

        // 3. Расчет стоимости разгрузки
        if (generalData.lift !== 'none') {
            unloadingCost = logisticsPrices.unloading_price_per_ton_with_lift * totalWeightTon;
        } else {
            unloadingCost = (logisticsPrices.unloading_price_per_ton_no_lift_base * totalWeightTon) + (logisticsPrices.unloading_price_per_ton_per_floor * (generalData.floor - 1) * totalWeightTon);
        }
        
        // 4. Расчет стоимости проноса
        if (generalData.carry_distance > logisticsPrices.free_carry_distance_m) {
            const paidDistance = generalData.carry_distance - logisticsPrices.free_carry_distance_m;
            const carryIncrements = Math.ceil(paidDistance / 10);
            carryCost = carryIncrements * logisticsPrices.carry_price_per_10m_per_ton * totalWeightTon;
        }

        return {
            delivery: Math.round(deliveryCost),
            unloading: Math.round(unloadingCost),
            carry: Math.round(carryCost),
            extraLayerCost: Math.round(extraLayerCost)
        };
    } catch (e) {
        console.error("Ошибка в модуле формул (Логистика):", e);
        return { delivery: 0, unloading: 0, carry: 0, extraLayerCost: 0 };
    }
}
