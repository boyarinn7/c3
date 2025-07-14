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
      estimateOutputContainer.classList.toggle('is-open'); // добавили
      setTimeout(setPosterHeight, 500);
  });
  //calculatorContainer.classList.add('is-open');

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
      
      // собираем строку для локации
      let locationDisplay = location;
      if (form.elements['location'].value === 'region' && km > 0) {
      // если выбрано "МО", добавляем сразу после названия
      locationDisplay += `, ${km} км от МКАД`;
      }

      let introHTML =
        `<span class="intro-item">
        <strong>Вид объекта:</strong>&nbsp;${objectType}
        </span>
        <span class="intro-item">
        <strong>Локация:</strong>&nbsp;${locationDisplay}
        </span>`;


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
      <form id="quick-order-form" class="quick-order-form">
    <input type="text" name="customerName"  placeholder="Ваше имя"    required>
    <input type="tel"  name="customerPhone" placeholder="Ваш телефон" required>
    <button type="submit" class="btn btn-order">Заказать</button>
    <button type="button" class="btn btn-download">Скачать смету</button>
  </form>
  <p class="order-note order-note--combined">
    <span class="order-engineer-text">
      Наш инженер свяжется с Вами в ближайшее время.
    </span>
    <span class="order-legal-inline">
      Отправляя заявку Вы даёте
      <a href="/privacy-policy" class="order-legal-link">
        согласие на обработку персональных данных
      </a>.
    </span>
  </p>

      </form>
    </div>
    <!-- ---- конец order-block ---- -->

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
