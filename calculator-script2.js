document.addEventListener('DOMContentLoaded', () => {
    // --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И ДАННЫЕ ---
    let activeTariff = 'business';
    let estimateItems = []; // Хранилище для позиций сметы
    let isFormLocked = false; // Флаг блокировки верхней части формы
    let estimateHasBeenShown = false; // Флаг, показывающий, была ли смета уже отображена
  
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
        estimateOutputContainer.classList.toggle('is-open');
        setTimeout(setPosterHeight, 500);
    });
  
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
      
      const isHouseOrApartment = ['apartment', 'house'].includes(obj);
      form.elements['floor'].disabled = !isHouseOrApartment || isFormLocked;
      form.elements['lift'].disabled = !(isHouseOrApartment && floor > 1) || isFormLocked;
  
      form.elements['km_from_mkad'].disabled = loc !== 'region' || isFormLocked;
  
      const plasterWorkTypeSelect = form.elements['plaster_work_type'];
      const extraWorkScopeSelect = form.elements['extra_work_scope'];
      extraWorkScopeSelect.value = plasterWorkTypeSelect.value;
      extraWorkScopeSelect.disabled = true;

      const masonryWorkTypeSelect = form.elements['masonry_work_type'];
      masonryWorkTypeSelect.value = 'work_only'; 
      masonryWorkTypeSelect.disabled = true; 
  
      if (form.elements['floor'].disabled && !isFormLocked) form.elements['floor'].value = '';
      if (form.elements['lift'].disabled && !isFormLocked) form.elements['lift'].value = 'freight';
      if (form.elements['km_from_mkad'].disabled && !isFormLocked) form.elements['km_from_mkad'].value = '';
  
      validateTopFields();
    }

    function updateSliderState() {
        const plasterWorkType = form.elements['plaster_work_type'].value;
        const plasterQuantity = Number(form.elements['plaster_quantity'].value);

        const isSliderEnabled = plasterWorkType === 'work_and_material' && plasterQuantity > 0;

        thicknessSlider.disabled = !isSliderEnabled;

        const sliderContainer = thicknessSlider.closest('.calc-field');
        if (sliderContainer) {
            sliderContainer.style.opacity = isSliderEnabled ? '1' : '0.5';
        }
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
    function getPrice(workData, quantity) {
        if (typeof calculatePricePerUnit === 'function') {
            return calculatePricePerUnit(workData, quantity);
        } else {
            console.error('Функция calculatePricePerUnit не найдена. Убедитесь, что calculator-formulas.js подключен правильно.');
            return 0;
        }
    }
  
    function recalc() {
      updateSliderFill();
      let total = 0;
      
      const commonData = {
          activeTariff: activeTariff,
          floor: Number(form.elements['floor'].value) || 1,
          lift: form.elements['lift'].value,
          layer_thickness: Number(form.elements['layer_thickness'].value) || 20,
          wallMaterial: form.elements['wall_material'].value
      };
  
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
              
              if (quantity > 0) {
                const workData = {
                    ...commonData,
                    workType: workType,
                    itemType: itemType,
                    workScope: workScope,
                };
    
                const price = getPrice(workData, quantity);
                total += price * quantity;
              }
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
  
        const commonData = {
          activeTariff: activeTariff,
          floor: Number(form.elements['floor'].value) || 1,
          lift: form.elements['lift'].value,
          layer_thickness: Number(form.elements['layer_thickness'].value) || 20,
          wallMaterial: form.elements['wall_material'].value
        };
  
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
                const labelParts = unitLabel.textContent.split(', ');
                const unit = labelParts.length > 1 ? labelParts[1] : 'п.м.';
  
                const workData = {
                    ...commonData,
                    workType: workType,
                    itemType: itemType,
                    workScope: workScope,
                };
  
                const price = getPrice(workData, quantity);
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
        
        let locationDisplay = location;
        if (form.elements['location'].value === 'region' && km > 0) {
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
        
        const mainWorks = estimateItems.filter(item => item.workType === 'masonry' || item.workType === 'plaster');
        const extraWorks = estimateItems.filter(item => item.workType === 'extra');
  
        const createItemsHTML = (items) => {
            // ИСПРАВЛЕНИЕ: Даже если работ нет, возвращаем пустой контейнер, а не надпись
            if (items.length === 0) return '';
            return items.map((item) => {
                grandTotal += item.total;
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
        
        let extraLayerHTML = '';
        let carryHTML = '';
        let deliveryHTML = '';
        let unloadingHTML = '';
        
        const hasMaterial = estimateItems.some(item => item.workScope === 'work_and_material');
  
        if (hasMaterial) {
            const logisticsData = {
                activeTariff: activeTariff,
                objectType: form.elements['objectType'].value,
                location: form.elements['location'].value,
                km_from_mkad: Number(form.elements['km_from_mkad'].value) || 0,
                lift: form.elements['lift'].value,
                floor: Number(form.elements['floor'].value) || 1,
                layer_thickness: Number(form.elements['layer_thickness'].value) || 20,
                carry_distance: Number(form.elements['carry_distance'].value) || 0
            };
            
            if (typeof calculateLogisticsAndExtraCosts === 'function') {
                const extraCosts = calculateLogisticsAndExtraCosts(estimateItems, logisticsData);
                
                grandTotal += extraCosts.extraLayerCost;
                grandTotal += extraCosts.carry;
                grandTotal += extraCosts.delivery;
                grandTotal += extraCosts.unloading;
                
                if (extraCosts.extraLayerCost > 0) {
                  extraLayerHTML = `
                      <div class="delivery-item">
                          <span>Доплата за доп. слой материала</span>
                          <span>${new Intl.NumberFormat('ru-RU').format(extraCosts.extraLayerCost)} ₽</span>
                      </div>
                  `;
                }
                if (extraCosts.carry > 0) {
                  carryHTML = `
                      <div class="delivery-item">
                          <span>Пронос материала</span>
                          <span>${new Intl.NumberFormat('ru-RU').format(extraCosts.carry)} ₽</span>
                      </div>
                  `;
                }
                if (extraCosts.delivery > 0) {
                  deliveryHTML = `
                      <div class="delivery-item">
                          <span>Доставка материала</span>
                          <span>${new Intl.NumberFormat('ru-RU').format(extraCosts.delivery)} ₽</span>
                      </div>
                  `;
                }
                if (extraCosts.unloading > 0) {
                  unloadingHTML = `
                      <div class="delivery-item">
                          <span>Разгрузка и подъем</span>
                          <span>${new Intl.NumberFormat('ru-RU').format(extraCosts.unloading)} ₽</span>
                      </div>
                  `;
                }
  
            } else {
                console.error('Функция calculateLogisticsAndExtraCosts не найдена!');
            }
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
              ${extraLayerHTML}
              ${carryHTML}
              ${deliveryHTML}
              ${unloadingHTML}
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
          </div>
        `;
      estimateOutputContainer.innerHTML = outputHTML;
      attachActionListeners();
    }
    
    function attachActionListeners() {
        document.querySelectorAll('.delete-item-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const idToDelete = parseFloat(e.currentTarget.dataset.id);
                estimateItems = estimateItems.filter(item => item.id !== idToDelete);
                renderEstimate();
            });
        });
        const clearBtn = document.querySelector('.clear-estimate-wrapper');
        if(clearBtn) {
            clearBtn.addEventListener('click', clearEstimate);
        }
    }
  
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
        validateTopFields();
    }
  
    function clearEstimate() {
        const clearCheckbox = document.querySelector('.clear-estimate-wrapper');
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
      updateSliderState();
    });
    form.addEventListener('input',  () => { 
      updateDisable();
      recalc(); 
      updateSliderState();
    });
    
    loadState();
    updateDisable();
    updateFieldLabels();
    recalc();
    updateSliderState();
    
    setTimeout(() => {
        setPosterHeight();
        window.addEventListener('resize', setPosterHeight);
    }, 100);
  
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', e => {
            const target = e.target;
            const originalValue = target.value;
            const originalPos = target.selectionStart;

            let sanitizedValue = originalValue.replace(/,/g, '.'); 
            
            const firstDotIndex = sanitizedValue.indexOf('.');
            let cleanPart = sanitizedValue.replace(/\./g, ''); 
            
            if (firstDotIndex !== -1) {
                cleanPart = cleanPart.slice(0, firstDotIndex) + '.' + cleanPart.slice(firstDotIndex);
            }
            
            sanitizedValue = cleanPart.replace(/[^\d.]/g, '');

            const parts = sanitizedValue.split('.');
            if (parts.length > 1 && parts[1].length > 1) {
                sanitizedValue = (Math.round(parseFloat(sanitizedValue) * 10) / 10).toString();
            }
            
            if (sanitizedValue !== originalValue) {
                target.value = sanitizedValue;
                
                const diff = originalValue.length - sanitizedValue.length;
                const newPos = Math.max(0, originalPos - diff);
                target.setSelectionRange(newPos, newPos);
            }
        });
    });
  
    // ИСПРАВЛЕНИЕ: Вызываем renderEstimate при загрузке, чтобы структура сметы была всегда
    renderEstimate();
  });
