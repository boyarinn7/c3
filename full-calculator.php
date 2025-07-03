<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Калькулятор «Эксперт»</title>
<style>
  :root {
    --calc-width: 400px;
    --poster-width: 400px; 
    --calc-column-gap: 8px;
    --calc-row-gap: 8px;
    --calc-vertical-padding: 16px;
    --calc-horizontal-padding: 12px;
    --calc-font-size: 0.8rem;
    --poster-active-color: #50C878; /* Зеленый цвет для плакатов */
    --estimate-active-color: #007bff; /* Синий цвет для сметы */
    --clear-color: #dc3545; /* Красный цвет для очистки */
    --track-color: #ddd;
    --light-gray-bg: #f9f9f9; /* Светло-серый фон */
    font-family: sans-serif;
  }

  body {
    background-color: #f0f2f5;
  }

  /* Внешний контейнер */
  .calculator-container {
    width: -moz-fit-content;
    width: fit-content;
    margin: 2em auto;
    background: #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-radius: 4px;
  }
  
  /* Рамка заголовка */
  .title-frame {
    border: 1px solid #e0e0e0;
    border-bottom: none;
    border-radius: 4px 4px 0 0; 
    background: var(--light-gray-bg);
    padding: 8px 24px 4px;
    cursor: pointer; 
    position: relative;
    transition: border-radius 0.4s ease-in-out, border-color 0.4s ease-in-out; 
  }

  /* Стрелка-индикатор */
  .title-frame::after {
    content: '▲';
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%) rotate(0deg);
    transition: transform 0.4s ease-in-out;
    font-size: 1.2em;
    color: #888;
  }
  
  /* Основная рамка */
  .calculator-frame {
    border: 1px solid #e0e0e0;
    border-top: none; 
    border-radius: 0 0 4px 4px; 
    padding: var(--calc-vertical-padding) var(--calc-horizontal-padding);
    background: var(--light-gray-bg);
    overflow: hidden;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-width: 0 1px 1px;
    opacity: 0;
    transition: max-height 0.5s ease-out, padding 0.4s ease-out, opacity 0.3s ease-out;
  }
  
  /* Открытое состояние */
  .calculator-container.is-open .title-frame {
    border-radius: 4px 4px 0 0; 
    border-bottom-color: transparent; /* Прячем границу */
  }
  .calculator-container.is-open .title-frame::after {
     transform: translateY(-50%) rotate(180deg); 
  }
  .calculator-container.is-open .calculator-frame {
    max-height: 1500px; 
    padding-top: var(--calc-vertical-padding);
    padding-bottom: var(--calc-vertical-padding);
    border-width: 0 1px 1px 1px;
    opacity: 1;
  }
  
  .calculator-wrapper {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--calc-column-gap);
    align-items: center; 
  }
  
  #full-calculator {
    display: grid;
    grid-template-columns: 24px 1fr 1fr 1fr 1fr; 
    column-gap: var(--calc-column-gap);
    row-gap: var(--calc-row-gap);
    width: var(--calc-width);
    min-width: 320px;
    padding: 0; 
    box-sizing: border-box;
    align-items: center; 
  }

  .calc-field {
    display: flex;
    flex-direction: column;
  }
  
  .calc-field.calc-col-1 { grid-column: span 1; }
  .calc-field.calc-col-2 { grid-column: span 2; }
  .calc-field.calc-col-3 { grid-column: span 3; }
  
  .calc-field label,
  .calc-field input,
  .calc-field select,
  #calcResult {
    font-size: var(--calc-font-size);
    width: 100%;
    box-sizing: border-box;
  }

  .calc-field > label {
      margin-bottom: -1px;
      position: relative;
      z-index: 1;
  }

  .calc-field input, .calc-field select {
      padding: 6px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: #ffffff;
  }
  
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: var(--track-color);
    border-radius: 0.5rem;
    cursor: pointer;
    padding: 0;
    border: none;
    height: 0.5rem;
  }
  
  input[type="range"]:focus {
    outline: none;
  }
  
  input[type="range"]::-webkit-slider-runnable-track {
    height: 0.5rem;
    border-radius: 0.5rem;
    background: transparent;
  }

  input[type="range"]::-moz-range-track {
    height: 0.5rem;
    border-radius: 0.5rem;
    background: transparent;
    border: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    margin-top: -4px;
    background-color: #fff;
    height: 1.25rem;
    width: 1.25rem;
    border-radius: 50%;
    border: 2px solid var(--poster-active-color);
  }
   input[type="range"]::-moz-range-thumb {
    background-color: #fff;
    height: 1rem;
    width: 1rem;
    border-radius: 50%;
    border: 2px solid var(--poster-active-color);
  }
  
  .range-labels {
    display: flex;
    justify-content: space-between;
    font-size: var(--calc-font-size);
    padding: 0 5px;
  }
  
  .posters-wrapper {
    display: grid;
    grid-template-columns: 1fr 24px;
    gap: var(--calc-column-gap);
    width: var(--poster-width);
    margin-top: -12px;
  }
  
  .tariff-posters {
    display: flex;
    flex-direction: column;
    row-gap: var(--calc-row-gap);
    width: 100%;
    height: 100%; 
  }
  .tariff-posters .poster {
    position: relative;
    padding: 1rem;
    border: 1px solid #ccc;
    background: #ffffff;
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tariff-posters .poster:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  .tariff-posters .poster.active {
      border-color: var(--poster-active-color);
      box-shadow: 0 0 10px rgba(80, 200, 120, 0.5);
  }
  .tariff-posters .poster.active::before {
    content: '✔';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    width: 1.2rem;
    height: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    background: var(--poster-active-color);
    border-radius: 50%;
  }

  .tooltip-icon {
    display: inline-block;
    position: relative;
    width: 1em;
    height: 1em;
    line-height: 1em;
    border-radius: 50%;
    background: #ccc;
    color: #fff;
    text-align: center;
    margin-left: 4px;
    cursor: help;
  }
  .tooltip-icon .tooltip-text {
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.3s;
    width: 220px;
    background: #333;
    color: #fff;
    text-align: left;
    border-radius: 4px;
    padding: 0.5em;
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
  }
  .tooltip-icon:hover .tooltip-text {
    visibility: visible;
    opacity: 1;
  }

  .calc-total-row {
    grid-column: 1 / -1; 
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  #calcResult {
      font-size: 1.5rem;
      font-weight: bold;
      color: #333;
  }
  
  .calc-header {
      margin-top: 8px; 
      text-align: center;
  }

  .estimate-checkbox {
    width: 1.2rem;
    height: 1.2rem;
    border: 1px solid #ccc;
    background-color: #fff;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.2s;
    position: relative;
    justify-self: center; 
    margin-top: 20px; 
  }
  .estimate-checkbox.active {
    background-color: var(--estimate-active-color);
    border-color: var(--estimate-active-color);
  }
  .estimate-checkbox.active::before {
    content: '✔';
    position: absolute;
    color: white;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.8rem;
  }

  .add-to-estimate {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  .add-to-estimate.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  .add-to-estimate .icon {
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 50%;
    position: relative;
    background-color: var(--estimate-active-color);
  }
  .add-to-estimate .icon::before {
    content: '✔';
    position: absolute;
    color: white;
    font-size: 0.8rem;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .add-to-estimate .text {
    color: #0056b3;
    text-decoration: underline;
    font-size: 16px; 
  }

  /* --- СТИЛИ ДЛЯ СМЕТЫ --- */
  .estimate-container {
    width: calc(var(--calc-width) + var(--poster-width) + var(--calc-column-gap) + (var(--calc-horizontal-padding) * 2));
    margin: 2em auto;
    padding: 0;
    background: transparent;
    box-shadow: none;
    display: flex; 
    flex-direction: column;
    gap: var(--calc-row-gap);
  }

  .estimate-block {
    background: var(--light-gray-bg);
    border-radius: 4px;
    padding: 16px;
    border: 1px solid #e0e0e0;
  }
  .estimate-intro-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
  }
  .estimate-intro-data {
      display: flex;
      justify-content: space-around;
      margin-top: 16px;
      font-size: var(--calc-font-size);
  }
  .estimate-title {
      font-size: 1.1rem;
      font-weight: bold;
      text-align: center;
      margin: 0;
      flex-grow: 1; /* Позволяет заголовку занять место */
  }
  .estimate-columns-wrapper {
      display: flex;
      gap: var(--calc-row-gap);
  }
  .estimate-column {
      flex: 1;
  }
  .column-title {
      font-weight: bold;
      margin: 0 0 12px 0;
      text-align: center;
  }
  .estimate-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .estimate-item {
    background-color: #fff;
    padding: 12px;
    border-radius: 4px;
  }
  .item-main-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
  }
  .item-sub-line {
    font-size: 0.75rem;
    color: #6c757d;
    margin-top: 4px;
  }
  .delivery-item {
    padding: 8px 0;
    font-size: 0.9rem;
    color: #343a40;
  }
  .estimate-total-row {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    font-size: 1.1rem;
  }
  .delete-item-btn {
    cursor: pointer;
    color: var(--clear-color);
    background: none;
    border: none;
    font-size: 1.2rem;
    padding: 0;
    margin-left: 10px;
  }
  .clear-estimate-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
  }
  .clear-estimate-checkbox {
    width: 1.2rem;
    height: 1.2rem;
    border: 1px solid var(--clear-color);
    background-color: #fff;
    border-radius: 50%;
    position: relative;
    transition: background-color 0.2s;
  }
  .clear-estimate-checkbox.active {
      background-color: var(--clear-color);
  }
  .clear-estimate-checkbox.active::before {
    content: '✔';
    position: absolute;
    color: white;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.8rem;
  }
  .clear-estimate-label {
      color: var(--clear-color);
      font-size: var(--calc-font-size);
  }
</style>
</head>
<body>

<div class="calculator-container">
  <div class="title-frame">
    <h2 class="calc-header">Калькулятор «Эксперт»</h2>
  </div>
  <div class="calculator-frame">
    <div class="calculator-wrapper">
      <form id="full-calculator" class="calc-grid">
        
        <div></div>
        <!-- Строка 1 -->
        <div class="calc-field calc-col-2">
          <label for="objectType">Вид объекта</label>
          <select id="objectType" name="objectType">
            <option value="apartment">Квартира</option>
            <option value="cottage">Коттедж</option>
            <option value="non-residential">Нежилое помещение</option>
            <option value="other">Другое</option>
          </select>
        </div>
        <div class="calc-field calc-col-1">
          <label for="floor">Этаж</label>
          <input id="floor" name="floor" type="number" min="1" max="150" value="1">
        </div>
        <div class="calc-field calc-col-1">
          <label for="lift">Лифт</label>
          <select id="lift" name="lift">
            <option value="freight">Есть (грузовой)</option>
            <option value="passenger">Есть (пассажирский)</option>
            <option value="none">Нет</option>
          </select>
        </div>
        
        <div></div> 
        <!-- Строка 2 -->
        <div class="calc-field calc-col-2">
          <label for="location">Локация</label>
          <select id="location" name="location">
            <option value="inside">Москва, вн. ТТК</option>
            <option value="outside">Москва, за ТТК</option>
            <option value="region">МО</option>
          </select>
        </div>
        <div class="calc-field calc-col-1">
          <label for="km_from_mkad">Км от МКАД</label>
          <input id="km_from_mkad" name="km_from_mkad" type="number" min="1">
        </div>
        <div class="calc-field calc-col-1">
          <label for="carry_distance">Пронос, м</label>
          <input id="carry_distance" name="carry_distance" type="number" min="0">
        </div>

        <!-- Строка 3: Кладка -->
        <div class="estimate-checkbox" data-work-type="masonry"></div>
        <div class="calc-field calc-col-2">
          <label for="masonry_type">Кладка</label>
          <select id="masonry_type" name="masonry_type">
            <option value="gas_block">Блок (газоблок, пеноблок)</option>
            <option value="pgp">ПГП (пазогребневая плита)</option>
            <option value="ceramic">Керамика (теплая)</option>
            <option value="brick" disabled>Кирпич</option>
            <option value="simple_lintel">Перемычка простая</option>
            <option value="reinforced_lintel">Перемычка усиленная</option>
          </select>
        </div>
        <div class="calc-field calc-col-1">
          <label for="masonry_work_type">Тип работ</label>
          <select id="masonry_work_type" name="masonry_work_type">
            <option value="work_only">Работа</option>
            <option value="work_and_material">С материалом</option>
          </select>
        </div>
        <div class="calc-field calc-col-1">
          <label id="masonry_quantity_label" for="masonry_quantity">Площадь, м²</label>
          <input id="masonry_quantity" name="masonry_quantity" type="number" min="1">
        </div>

        <!-- Строка 4: Штукатурка -->
        <div class="estimate-checkbox" data-work-type="plaster"></div>
        <div class="calc-field calc-col-2">
          <label for="plaster_type">Штукатурка</label>
          <select id="plaster_type" name="plaster_type">
            <option value="wall_gypsum">Штукатурка стен (гипс)</option>
            <option value="wall_cps">Штукатурка стен (цпс)</option>
            <option value="slope_gypsum">Штукатурка откосов (гипс)</option>
            <option value="slope_cps">Штукатурка откосов (цпс)</option>
            <option value="ceiling_gypsum">Штукатурка потолков (гипс)</option>
            <option value="ceiling_cps">Штукатурка потолков (цпс)</option>
          </select>
        </div>
        <div class="calc-field calc-col-1">
          <label for="plaster_work_type">Тип работ</label>
          <select id="plaster_work_type" name="plaster_work_type">
            <option value="work_only">Работа</option>
            <option value="work_and_material">С материалом</option>
          </select>
        </div>
        <div class="calc-field calc-col-1">
          <label id="plaster_quantity_label" for="plaster_quantity">Погонаж, п.м.</label>
          <input id="plaster_quantity" name="plaster_quantity" type="number" min="1">
        </div>
        
        <!-- Строка 5: Доп работы -->
        <div class="estimate-checkbox" data-work-type="extra"></div>
        <div class="calc-field calc-col-2">
          <label for="extra_work_type">Доп работы</label>
          <select id="extra_work_type" name="extra_work_type">
            <option value="mesh_fiberglass">Сетка Стеклотканевая</option>
            <option value="mesh_galvanized">Сетка Оцинкованная</option>
            <option value="adhesion_spray">Набрызг – повышение адгезии</option>
            <option value="pvc_profile">ПВХ профиль на откосы</option>
            <option value="plastic_corner">Уголок штукатурный внешний пластиковый на откосы</option>
            <option value="galvanized_corner">Уголок внешний оцинкованный на откосы</option>
            <option value="sealant">Герметик на откосы – Стиз Б</option>
            <option value="film_protection">Укрытия окон плёнкой</option>
            <option value="glossing">Глянцевание</option>
          </select>
        </div>
        <div class="calc-field calc-col-1">
          <label for="extra_work_scope">Тип работ</label>
          <select id="extra_work_scope" name="extra_work_scope">
            <option value="work_only">Работа</option>
            <option value="work_and_material">С материалом</option>
          </select>
        </div>
        <div class="calc-field calc-col-1">
          <label id="extra_work_quantity_label" for="extra_work_quantity">Площадь, м²</label>
          <input id="extra_work_quantity" name="extra_work_quantity" type="number" min="1">
        </div>
        
        <div></div>
        <!-- Строка 6 -->
        <div class="calc-field calc-col-3" style="grid-column: 2 / span 3;">
          <label for="layer_thickness">Толщина слоя, мм (стандарт - 20 мм)</label>
          <input id="layer_thickness" name="layer_thickness" type="range" min="20" max="50" step="10" value="20">
          <div class="range-labels"><span>20</span><span>30</span><span>40</span><span>50</span></div>
        </div>
        <div class="calc-field calc-col-1">
          <label for="wall_material">Материал стен</label>
          <select id="wall_material" name="wall_material">
            <option value="block">Блок (газоблок, пеноблок)</option>
            <option value="pgp">ПГП (пазогребневая плита)</option>
            <option value="ceramic">Керамика (теплый блок)</option>
            <option value="brick">Кирпич</option>
            <option value="monolith">Монолит (бетон)</option>
          </select>
        </div>
        
        <!-- Строка 7 -->
        <div class="calc-total-row">
            <div>
                <label>Предварительная стоимость работ</label>
                <div id="calcResult">0 ₽</div>
            </div>
            <div id="add-to-estimate-btn" class="add-to-estimate">
                <div class="icon"></div>
                <div class="text">Внести в смету</div>
            </div>
        </div>
      </form>
    
      <div class="posters-wrapper">
        <div class="tariff-posters">
          <div class="poster" data-tariff="economy"><span>Эконом</span></div>
          <div class="poster" data-tariff="business"><span>Бизнес</span></div>
          <div class="poster" data-tariff="elite"><span>Элит</span></div>
        </div>
        <div></div>
      </div>
    </div>
  </div>
</div>

<!-- Блок для вывода сметы -->
<div id="estimate-output-container" class="estimate-container"></div>


<script>
document.addEventListener('DOMContentLoaded', () => {
  // --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И ДАННЫЕ ---
  let activeTariff = 'business';
  let estimateItems = []; // Хранилище для позиций сметы
  let isFormLocked = false; // Флаг блокировки верхней части формы
  let estimateHasBeenShown = false; // Флаг, показывающий, была ли смета уже отображена

  // Условная база цен. 
  const PRICES = {
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

  // --- ОСНОВНЫЕ ЭЛЕМЕНТЫ DOM ---
  const calculatorContainer = document.querySelector('.calculator-container');
  const titleFrame = document.querySelector('.title-frame');
  const form = document.getElementById('full-calculator');
  const posters = document.querySelectorAll('.tariff-posters .poster');
  const thicknessSlider = document.getElementById('layer_thickness');
  const estimateCheckboxes = document.querySelectorAll('.estimate-checkbox');
  const addToEstimateBtn = document.getElementById('add-to-estimate-btn');
  const estimateOutputContainer = document.getElementById('estimate-output-container');
  const topRowFields = [
      form.elements['objectType'],
      form.elements['floor'],
      form.elements['lift'],
      form.elements['location'],
      form.elements['km_from_mkad'],
      form.elements['carry_distance']
  ];

  // --- ЛОГИКА ИНТЕРФЕЙСА КАЛЬКУЛЯТОРА ---
  titleFrame.addEventListener('click', () => {
      calculatorContainer.classList.toggle('is-open');
      setTimeout(setPosterHeight, 500);
  });
  calculatorContainer.classList.add('is-open');

  estimateCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('click', () => {
      checkbox.classList.toggle('active');
      saveState();
      recalc(); 
    });
  });

  posters.forEach(p => p.addEventListener('click', () => {
    posters.forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    activeTariff = p.dataset.tariff;
    saveState();
    recalc();
  }));
  
  function setPosterHeight() {
    const formHeight = form.clientHeight;
    const postersWrapper = document.querySelector('.posters-wrapper');
    if (postersWrapper) {
        postersWrapper.style.height = `${formHeight}px`;
    }
  }

  // --- ДИНАМИЧЕСКИЕ ИЗМЕНЕНИЯ В ФОРМЕ ---
  function updateFieldLabels() {
    const masonryType = form.elements['masonry_type'].value;
    const masonryLabel = document.getElementById('masonry_quantity_label');
    const plasterType = form.elements['plaster_type'].value;
    const plasterLabel = document.getElementById('plaster_quantity_label');
    const extraWorkType = form.elements['extra_work_type'].value;
    const extraWorkLabel = document.getElementById('extra_work_quantity_label');

    masonryLabel.textContent = ['simple_lintel', 'reinforced_lintel'].includes(masonryType) ? 'Погонаж, п.м.' : 'Площадь, м²';
    plasterLabel.textContent = ['slope_gypsum', 'slope_cps'].includes(plasterType) ? 'Погонаж, п.м.' : 'Площадь, м²';
    const extraWorkIsLinear = ['pvc_profile', 'plastic_corner', 'galvanized_corner', 'sealant'];
    extraWorkLabel.textContent = extraWorkIsLinear.includes(extraWorkType) ? 'Погонаж, п.м.' : 'Площадь, м²';
  }

  function updateDisable() {
    const obj = form.elements['objectType'].value;
    const floor = Number(form.elements['floor'].value);
    const loc = form.elements['location'].value;
    form.elements['floor'].disabled = obj !== 'apartment' || isFormLocked;
    form.elements['lift'].disabled = (!(obj === 'apartment' && floor > 1)) || isFormLocked;
    form.elements['km_from_mkad'].disabled = loc !== 'region' || isFormLocked;

    const plasterWorkTypeSelect = form.elements['plaster_work_type'];
    const extraWorkScopeSelect = form.elements['extra_work_scope'];
    extraWorkScopeSelect.value = plasterWorkTypeSelect.value;
    extraWorkScopeSelect.disabled = true;

    if (form.elements['floor'].disabled && !isFormLocked) form.elements['floor'].value = '';
    if (form.elements['lift'].disabled && !isFormLocked) form.elements['lift'].value = 'freight';
    if (form.elements['km_from_mkad'].disabled && !isFormLocked) form.elements['km_from_mkad'].value = '';

    validateTopFields();
  }
  
  function updateSliderFill() {
      const slider = thicknessSlider;
      const min = slider.min;
      const max = slider.max;
      const value = slider.value;
      const percentage = (value - min) / (max - min) * 100;
      const style = getComputedStyle(document.documentElement);
      const activeColor = style.getPropertyValue('--poster-active-color').trim();
      const trackColor = style.getPropertyValue('--track-color').trim();
      slider.style.background = `linear-gradient(to right, ${activeColor} ${percentage}%, ${trackColor} ${percentage}%)`;
  }

  // --- ЛОГИКА РАСЧЕТОВ ---
  function getPrice(workType, itemType, workScope) {
      try {
          return PRICES[workType][itemType][workScope] || 0;
      } catch (e) {
          return 0;
      }
  }

  function recalc() {
    updateSliderFill();
    let total = 0;
    estimateCheckboxes.forEach(checkbox => {
        if (checkbox.classList.contains('active')) {
            const workType = checkbox.dataset.workType;
            const itemType = form.elements[`${workType}_type`].value;
            
            let workScope;
            if (workType === 'extra') {
                workScope = form.elements['plaster_work_type'].value;
            } else {
                workScope = form.elements[`${workType}_work_type`].value;
            }

            const quantity = Number(form.elements[`${workType}_quantity`].value) || 0;
            const price = getPrice(workType, itemType, workScope);
            total += price * quantity;
        }
    });
    
    const formattedResult = new Intl.NumberFormat('ru-RU').format(total);
    document.getElementById('calcResult').textContent = formattedResult + ' ₽';
  }

  // --- ЛОГИКА СМЕТЫ ---
  function addToEstimate() {
      if (!isFormLocked) {
        isFormLocked = true;
        lockTopFields();
      }
      estimateHasBeenShown = true;

      estimateCheckboxes.forEach(checkbox => {
          if (checkbox.classList.contains('active')) {
              const workType = checkbox.dataset.workType;
              const quantityInput = form.elements[`${workType}_quantity`];
              const quantity = Number(quantityInput.value) || 0;

              if (quantity === 0) return;

              const typeSelect = form.elements[`${workType}_type`];
              const itemType = typeSelect.value;
              const itemName = typeSelect.options[typeSelect.selectedIndex].text;
              
              let workScope;
              if (workType === 'extra') {
                  workScope = form.elements['extra_work_scope'].value;
              } else {
                  workScope = form.elements[`${workType}_work_type`].value;
              }
              
              const unitLabel = document.getElementById(`${workType}_quantity_label`);
              // ИСПРАВЛЕНИЕ: Более надежный способ получить единицу измерения
              const labelParts = unitLabel.textContent.split(', ');
              const unit = labelParts.length > 1 ? labelParts[1] : 'п.м.';

              const price = getPrice(workType, itemType, workScope);
              const total = price * quantity;

              estimateItems.push({
                  id: Date.now() + Math.random(),
                  name: itemName,
                  unit: unit,
                  quantity: quantity,
                  price: price,
                  total: total,
                  workScope: workScope,
                  workType: workType 
              });
          }
      });
      renderEstimate();
  }

  function renderEstimate() {
      const objectTypeEl = form.elements['objectType'];
      const locationEl = form.elements['location'];
      const km = form.elements['km_from_mkad'].value;
      
      const objectType = objectTypeEl.value ? objectTypeEl.options[objectTypeEl.selectedIndex].text : '...';
      const location = locationEl.value ? locationEl.options[locationEl.selectedIndex].text : '...';
      
      let introHTML = `<strong>Вид объекта:</strong> ${objectType} | <strong>Локация:</strong> ${location}`;
      if (km > 0) {
          introHTML += ` | <strong>Удаленность:</strong> ${km} км от МКАД`;
      }

      let grandTotal = 0;
      let hasMaterial = false;

      const mainWorks = estimateItems.filter(item => item.workType === 'masonry' || item.workType === 'plaster');
      const extraWorks = estimateItems.filter(item => item.workType === 'extra');

      const createItemsHTML = (items) => {
          if (items.length === 0) return '<div style="padding: 12px; text-align: center; color: #6c757d;">Нет работ</div>';
          return items.map((item, index) => {
              grandTotal += item.total;
              if (item.workScope === 'work_and_material') {
                  hasMaterial = true;
              }
              return `
                  <div class="estimate-item">
                      <div class="item-main-line">
                          <span>${item.name}</span>
                          <span>
                              ${new Intl.NumberFormat('ru-RU').format(item.total)} ₽
                              <button class="delete-item-btn" data-id="${item.id}">🗑️</button>
                          </span>
                      </div>
                      <div class="item-sub-line">
                          Тариф: ${activeTariff}, ${item.quantity} ${item.unit || ''}
                      </div>
                  </div>
              `;
          }).join('');
      };

      const mainWorksHTML = createItemsHTML(mainWorks);
      const extraWorksHTML = createItemsHTML(extraWorks);

      let deliveryHTML = '';
      if (hasMaterial) {
          deliveryHTML = `
              <div class="delivery-item">Доставка материала</div>
              <div class="delivery-item">Разгрузка материала</div>
          `;
      }

      const outputHTML = `
          <div class="estimate-block">
              <div class="estimate-intro-header">
                  <div class="clear-estimate-wrapper">
                      <div class="clear-estimate-checkbox"></div>
                      <span class="clear-estimate-label">Очистить смету</span>
                  </div>
                  <h3 class="estimate-title">Смета по кладке, штукатурке</h3>
              </div>
              <div class="estimate-intro-data">${introHTML}</div>
          </div>
          <div class="estimate-columns-wrapper">
              <div class="estimate-column estimate-block">
                  <h4 class="column-title">Основные работы</h4>
                  <div class="estimate-list">${mainWorksHTML}</div>
              </div>
              <div class="estimate-column estimate-block">
                  <h4 class="column-title">Доп работы</h4>
                  <div class="estimate-list">${extraWorksHTML}</div>
              </div>
          </div>
          <div class="estimate-block">
              ${deliveryHTML}
              <div class="estimate-total-row">
                  <span>Стоимость всех работ:</span>
                  <span>${new Intl.NumberFormat('ru-RU').format(grandTotal)} ₽</span>
              </div>
          </div>
      `;

      estimateOutputContainer.innerHTML = outputHTML;
      attachActionListeners();
  }
  
  function attachActionListeners() {
      // Удаление отдельного элемента
      document.querySelectorAll('.delete-item-btn').forEach(button => {
          button.addEventListener('click', (e) => {
              e.stopPropagation();
              const idToDelete = parseFloat(e.currentTarget.dataset.id);
              estimateItems = estimateItems.filter(item => item.id !== idToDelete);
              renderEstimate();
          });
      });
      // Очистка всей сметы
      const clearBtn = document.querySelector('.clear-estimate-wrapper');
      if(clearBtn) {
          clearBtn.addEventListener('click', clearEstimate);
      }
  }

  // --- ЛОГИКА СОХРАНЕНИЯ И БЛОКИРОВКИ ---
  function saveState() {
      const activeCheckboxes = [];
      estimateCheckboxes.forEach((cb, index) => {
          if (cb.classList.contains('active')) {
              activeCheckboxes.push(index);
          }
      });
      const state = {
          activeTariff: activeTariff,
          activeCheckboxes: activeCheckboxes
      };
      localStorage.setItem('calculatorState', JSON.stringify(state));
  }

  function loadState() {
      const savedState = localStorage.getItem('calculatorState');
      if (savedState) {
          const state = JSON.parse(savedState);
          posters.forEach(p => {
              p.classList.remove('active');
              if (p.dataset.tariff === state.activeTariff) {
                  p.classList.add('active');
                  activeTariff = state.activeTariff;
              }
          });
          estimateCheckboxes.forEach((cb, index) => {
              cb.classList.remove('active');
              if (state.activeCheckboxes.includes(index)) {
                  cb.classList.add('active');
              }
          });
      } else {
          const businessPoster = document.querySelector('.poster[data-tariff="business"]');
          if (businessPoster) businessPoster.click();
          const firstCheckbox = document.querySelector('.estimate-checkbox');
          if(firstCheckbox) firstCheckbox.classList.add('active');
      }
  }
  
  function validateTopFields() {
      if (isFormLocked) {
          addToEstimateBtn.classList.remove('disabled');
          return;
      }
      let isValid = true;
      const fieldsToValidate = [
          form.elements['objectType'],
          form.elements['floor'],
          form.elements['lift'],
          form.elements['location'],
          form.elements['km_from_mkad']
      ];

      for (const field of fieldsToValidate) {
          if (!field.disabled && !field.value) {
              isValid = false;
              break; 
          }
      }

      if (isValid) {
          addToEstimateBtn.classList.remove('disabled');
      } else {
          addToEstimateBtn.classList.add('disabled');
      }
  }

  function lockTopFields() {
      topRowFields.forEach(field => {
          field.disabled = true;
      });
      validateTopFields(); // Перепроверяем состояние кнопки
  }

  function clearEstimate() {
      const clearCheckbox = document.querySelector('.clear-estimate-checkbox');
      clearCheckbox.classList.add('active'); 
      
      setTimeout(() => {
        estimateItems = [];
        isFormLocked = false;
        estimateHasBeenShown = false; 
        topRowFields.forEach(field => {
            field.disabled = false;
        });
        updateDisable(); 
        renderEstimate();
        clearCheckbox.classList.remove('active'); 
      }, 300); 
  }

  // --- ИНИЦИАЛИЗАЦИЯ И СЛУШАТЕЛИ ---
  addToEstimateBtn.addEventListener('click', addToEstimate);

  form.addEventListener('change', () => { 
    updateDisable(); 
    updateFieldLabels(); 
    recalc(); 
  });
  form.addEventListener('input',  () => { 
    updateDisable();
    recalc(); 
  });
  
  loadState();
  updateDisable();
  updateFieldLabels();
  recalc();
  
  setTimeout(() => {
      setPosterHeight();
      window.addEventListener('resize', setPosterHeight);
  }, 100);

  document.querySelectorAll('input[type="number"]').forEach(input => {
      input.addEventListener('keydown', (e) => {
          if (['.', ',', 'e', '-', '+'].includes(e.key)) {
              e.preventDefault();
          }
      });
      input.addEventListener('input', () => {
          const value = parseInt(input.value, 10);
          const minValue = parseInt(input.min, 10);
          if (isNaN(value) || (!isNaN(minValue) && value < minValue)) {
              input.value = '';
          } else {
              input.value = value;
          }
          validateTopFields();
      });
  });

  renderEstimate();
});
</script>
</body>
</html>
