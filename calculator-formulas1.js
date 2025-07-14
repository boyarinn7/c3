// =================================================
// МОДУЛЬ ФОРМУЛ КАЛЬКУЛЯТОРА «ЭКСПЕРТ»
// =================================================
// Этот файл содержит всю математическую логику.

// Объект для хранения базовых цен. В будущем его можно будет получать с сервера.
const BASE_PRICES = {
    masonry: {
        gas_block: { work_only: 800, work_and_material: 1600 },
        pgp: { work_only: 750, work_and_material: 1500 },
        ceramic: { work_only: 900, work_and_material: 1800 },
        simple_lintel: { work_only: 500, work_and_material: 1000 },
        reinforced_lintel: { work_only: 700, work_and_material: 1400 },
    },
    plaster: {
        wall_gypsum: { work_only: 600, work_and_material: 1200 },
        wall_cps: { work_only: 650, work_and_material: 1300 },
        slope_gypsum: { work_only: 400, work_and_material: 800 },
        slope_cps: { work_only: 450, work_and_material: 900 },
        ceiling_gypsum: { work_only: 800, work_and_material: 1600 },
        ceiling_cps: { work_only: 850, work_and_material: 1700 },
    },
    extra: {
        mesh_fiberglass: { work_only: 100, work_and_material: 200 },
        mesh_galvanized: { work_only: 150, work_and_material: 300 },
        adhesion_spray: { work_only: 80, work_and_material: 160 },
        pvc_profile: { work_only: 120, work_and_material: 240 },
        plastic_corner: { work_only: 90, work_and_material: 180 },
        galvanized_corner: { work_only: 110, work_and_material: 220 },
        sealant: { work_only: 200, work_and_material: 400 },
        film_protection: { work_only: 50, work_and_material: 100 },
        glossing: { work_only: 250, work_and_material: 250 },
    }
};

// Коэффициенты для тарифов
const TARIFF_COEFFICIENTS = {
    economy: 0.85,  // -15%
    business: 1.0,  // базовая цена
    elite: 1.25    // +25%
};


/**
 * Главная функция расчета цены для одной позиции.
 * @param {object} workData - Объект с данными о работе.
 * @param {string} workData.workType - Тип работы (e.g., 'masonry', 'plaster').
 * @param {string} workData.itemType - Конкретный вид работы (e.g., 'gas_block').
 * @param {string} workData.workScope - Объем работ ('work_only' или 'work_and_material').
 * @param {string} workData.activeTariff - Активный тариф ('economy', 'business', 'elite').
 * @returns {number} - Итоговая цена за единицу.
 */
function calculatePricePerUnit(workData) {
    try {
        // 1. Получаем базовую цену
        const basePrice = BASE_PRICES[workData.workType][workData.itemType][workData.workScope] || 0;

        // 2. Получаем коэффициент тарифа
        const tariffCoefficient = TARIFF_COEFFICIENTS[workData.activeTariff] || 1.0;

        // 3. (ЗАПАС НА БУДУЩЕЕ) Здесь можно добавить логику для других коэффициентов
        // Например, от толщины слоя, материала стен и т.д.
        
        // 4. Считаем итоговую цену
        const finalPrice = basePrice * tariffCoefficient;

        return finalPrice;

    } catch (e) {
        console.error("Ошибка в модуле формул:", e);
        return 0; // Возвращаем 0 в случае ошибки
    }
}
