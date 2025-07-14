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
        document.getElementById('objectType'),
        document.getElementById('floor'),
        document.getElementById('lift'),
        document.getElementById('location'),
        document.getElementById('km_from_mkad'),
        document.getElementById('carry_distance')
    ];
  
    // --- ЛОГИКА ИНТЕРФЕЙСА КАЛЬКУЛЯТОРА ---
    titleFrame.addEventListener('click', () => {
        calculatorContainer.classList.toggle('is-open');
        estimateOutputContainer.classList.toggle('is-open');
        setTimeout(() => {
            setPosterHeight();
            renderEstimate(); // Добавляем рендер сметы после анимации
        }, 500);
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
      const masonryType = document.getElementById('masonry_type').value;
      const masonryLabel = document.getElementById('masonry_quantity_label');
      const plasterType = document.getElementById('plaster_type').value;
      const plasterLabel = document.getElementById('plaster_quantity_label');
      const extraWorkType = document.getElementById('extra_work_type').value;
      const extraWorkLabel = document.getElementById('extra_work_quantity_label');
  
      masonryLabel.textContent = ['simple_lintel', 'reinforced_lintel'].includes(masonryType) ? 'Погонаж, п.м.' : 'Площадь, м²';
      plasterLabel.textContent = ['slope_gypsum', 'slope_cps'].includes(plasterType) ? 'Погонаж, п.м.' : 'Площадь, м²';
      const extraWorkIsLinear = ['pvc_profile', 'plastic_corner', 'galvanized_corner', 'sealant'];
      extraWorkLabel.textContent = extraWorkIsLinear.includes(extraWorkType) ? 'Погонаж, п.м.' : 'Площадь, м²';
    }
  
    function updateDisable() {
      const obj = document.getElementById('objectType').value;
      const floor = Number(document.getElementById('floor').value);
      const loc = document.getElementById('location').value;
      
      const isHouseOrApartment = ['apartment', 'house'].includes(obj);
      document.getElementById('floor').disabled = !isHouseOrApartment || isFormLocked;
      document.getElementById('lift').disabled = !(isHouseOrApartment && floor > 1) || isFormLocked;
  
      document.getElementById('km_from_mkad').disabled = loc !== 'region' || isFormLocked;
  
      if (document.getElementById('floor').disabled && !isFormLocked) document.getElementById('floor').value = '';
      if (document.getElementById('lift').disabled && !isFormLocked) document.getElementById('lift').value = 'freight';
      if (document.getElementById('km_from_mkad').disabled && !isFormLocked) document.getElementById('km_from_mkad').value = '';
  
      validateTopFields();
    }

    function updateSliderState() {
        const plasterWorkType = document.getElementById('plaster_work_type').value;
        const plasterQuantity = Number(document.getElementById('plaster_quantity').value);

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
          floor: Number(document.getElementById('floor').value) || 1,
          lift: document.getElementById('lift').value,
          layer_thickness: Number(document.getElementById('layer_thickness').value) || 20,
          wallMaterial: document.getElementById('wall_material').value
      };
  
      estimateCheckboxes.forEach(checkbox => {
          if (checkbox.classList.contains('active')) {
              const workType = checkbox.dataset.workType;
              try {
                const typeField = workType === 'extra' ? 'extra_work_type' : `${workType}_type`;

                const typeSelect = document.getElementById(typeField);
                if (!typeSelect) {
                    console.error('Missing select for ' + typeField);
                    return;
                }
                const itemType = typeSelect.value;
                
                let workScope;
                if (workType === 'extra') {
                    const scopeSelect = document.getElementById('extra_work_scope');
                    if (!scopeSelect) {
                        console.error('Missing scope for extra');
                        return;
                    }
                    workScope = scopeSelect.value;
                } else {
                    workScope = document.getElementById(`${workType}_work_type`).value;
                }
    
                const quantity = Number(document.getElementById(workType === 'extra' ? 'extra_work_quantity' : `${workType}_quantity`).value) || 0;
                
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
              } catch (e) {
                console.error(`Error for workType ${workType}:`, e);
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
          floor: Number(document.getElementById('floor').value) || 1,
          lift: document.getElementById('lift').value,
          layer_thickness: Number(document.getElementById('layer_thickness').value) || 20,
          wallMaterial: document.getElementById('wall_material').value
        };
  
        estimateCheckboxes.forEach(checkbox => {
            if (checkbox.classList.contains('active')) {
                const workType = checkbox.dataset.workType;
                
                const quantityInput = document.getElementById(workType === 'extra' ? 'extra_work_quantity' : `${workType}_quantity`);
                if (!quantityInput) {
                    console.error('Missing element: ' + (workType === 'extra' ? 'extra_work_quantity' : `${workType}_quantity`));
                    return;
                }
                const quantity = Number(quantityInput.value) || 0;
  
                if (quantity === 0) return;
  
                const typeField = workType === 'extra' ? 'extra_work_type' : `${workType}_type`;
                const typeSelect = document.getElementById(typeField);
                if (!typeSelect) {
                    console.error('Missing element: ' + typeField);
                    return;
                }
                const itemType = typeSelect.value;
                const itemName = typeSelect.options[typeSelect.selectedIndex].text;
                
                let workScope;
                if (workType === 'extra') {
                    const scopeSelect = document.getElementById('extra_work_scope');
                    if (!scopeSelect) {
                        console.error('Missing element: extra_work_scope');
                        return;
                    }
                    workScope = scopeSelect.value;
                } else {
                    const scopeSelect = document.getElementById(`${workType}_work_type`);
                    if (!scopeSelect) {
                        console.error('Missing element: ' + `${workType}_work_type`);
                        return;
                    }
                    workScope = scopeSelect.value;
                }
                
                const unitLabel = document.getElementById(workType === 'extra' ? 'extra_work_quantity_label' : `${workType}_quantity_label`);
                if (!unitLabel) {
                    console.error('Missing element: ' + (workType === 'extra' ? 'extra_work_quantity_label' : `${workType}_quantity_label`));
                    return;
                }
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
        const objectTypeEl = document.getElementById('objectType');
        const locationEl = document.getElementById('location');
        const km = document.getElementById('km_from_mkad').value;
        
        const objectType = objectTypeEl.value ? objectTypeEl.options[objectTypeEl.selectedIndex].text : '...';
        const location = locationEl.value ? locationEl.options[locationEl.selectedIndex].text : '...';
        
        let locationDisplay = location;
        if (document.getElementById('location').value === 'region' && km > 0) {
          locationDisplay += `, ${km} км от МКАД`;
        }
    
        let introHTML =
          `<span class="intro-item">
          <strong>Вид объекта:</strong> ${objectType}
          </span>
          <span class="intro-item">
          <strong>Локация:</strong> ${locationDisplay}
          </span>`;
    
        let grandTotal = 0;
        
        const mainWorks = estimateItems.filter(item => item.workType === 'masonry' || item.workType === 'plaster');
        const extraWorks = estimateItems.filter(item => item.workType === 'extra');
    
        const createItemsHTML = (items, title) => {
            let html = `<h4 class="column-title">${title}</h4><div class="estimate-list">`;
            if (items.length === 0) {
                html += `<li class="empty-state">Список работ пуст.</li>`;
            } else {
                html += items.map((item) => {
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
            }
            html += '</div>';
            return html;
        };
    
        const mainWorksHTML = createItemsHTML(mainWorks, "Основные работы");
        const extraWorksHTML = createItemsHTML(extraWorks, "Доп работы");
    
        let logisticsBlockHTML = '';
        if (estimateItems.length > 0) {
            let logisticsLinesHTML = '';
            const hasMaterial = estimateItems.some(item => item.workScope === 'work_and_material');
            if (hasMaterial && typeof calculateLogisticsAndExtraCosts === 'function') {
                const logisticsData = {
                    activeTariff: activeTariff,
                    objectType: document.getElementById('objectType').value,
                    location: document.getElementById('location').value,
                    km_from_mkad: Number(document.getElementById('km_from_mkad').value) || 0,
                    lift: document.getElementById('lift').value,
                    floor: Number(document.getElementById('floor').value) || 1,
                    layer_thickness: Number(document.getElementById('layer_thickness').value) || 20,
                    carry_distance: Number(document.getElementById('carry_distance').value) || 0
                };
                
                const extraCosts = calculateLogisticsAndExtraCosts(estimateItems, logisticsData);
                grandTotal += extraCosts.extraLayerCost + extraCosts.carry + extraCosts.delivery + extraCosts.unloading;
    
                if (extraCosts.extraLayerCost > 0) logisticsLinesHTML += `<div class="item-main-line"><span>Доплата за доп. слой материала</span><span>${new Intl.NumberFormat('ru-RU').format(extraCosts.extraLayerCost)} ₽</span></div>`;
                if (extraCosts.carry > 0) logisticsLinesHTML += `<div class="item-main-line"><span>Пронос материала</span><span>${new Intl.NumberFormat('ru-RU').format(extraCosts.carry)} ₽</span></div>`;
                if (extraCosts.delivery > 0) logisticsLinesHTML += `<div class="item-main-line"><span>Доставка материала</span><span>${new Intl.NumberFormat('ru-RU').format(extraCosts.delivery)} ₽</span></div>`;
                if (extraCosts.unloading > 0) logisticsLinesHTML += `<div class="item-main-line"><span>Разгрузка и подъем</span><span>${new Intl.NumberFormat('ru-RU').format(extraCosts.unloading)} ₽</span></div>`;
            }
    
            logisticsBlockHTML = `
                <div class="estimate-block">
                    <div class="estimate-item">
                        <div class="logistics-inner">
                            ${logisticsLinesHTML}
                        </div>
                    </div>
                    <div class="item-main-line estimate-total-row" style="font-size: 1.25rem; font-weight: 400;">
                        <span class="column-title">Стоимость всех работ:</span>
                        <span class="column-title">${new Intl.NumberFormat('ru-RU').format(grandTotal)} ₽</span>
                    </div>
                </div>
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
                    ${mainWorksHTML}
                </div>
                <div class="estimate-column estimate-block">
                    ${extraWorksHTML}
                </div>
            </div>
            ${logisticsBlockHTML}
            <div class="estimate-block">
                <form id="quick-order-form" class="quick-order-form">
                  <input type="text" name="customerName" placeholder="Ваше имя" required>
                  <input type="tel" name="customerPhone" placeholder="Ваш телефон" required>
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
        if (clearBtn && !clearBtn.dataset.listenerAdded) {
            clearBtn.addEventListener('click', clearEstimate);
            clearBtn.dataset.listenerAdded = 'true';
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
            activeTariff = state.activeTariff || 'business';
            posters.forEach(p => {
                p.classList.remove('active');
                if (p.dataset.tariff === activeTariff) {
                    p.classList.add('active');
                }
            });
            estimateCheckboxes.forEach((cb, index) => {
                cb.classList.remove('active');
                if (state.activeCheckboxes && state.activeCheckboxes.includes(index)) {
                    cb.classList.add('active');
                }
            });
        } else {
            activeTariff = 'business';
            posters.forEach(p => {
                if (p.dataset.tariff === 'business') {
                    p.classList.add('active');
                } else {
                    p.classList.remove('active');
                }
            });
            estimateCheckboxes.forEach(cb => {
                if (cb.dataset.workType === 'plaster') {
                    cb.classList.add('active');
                } else {
                    cb.classList.remove('active');
                }
            });
        }
    }
    
    function validateTopFields() {
        if (isFormLocked) {
            addToEstimateBtn.classList.remove('disabled');
            return;
        }
        let isValid = true;
        const fieldsToValidate = [
            document.getElementById('objectType'),
            document.getElementById('floor'),
            document.getElementById('lift'),
            document.getElementById('location'),
            document.getElementById('km_from_mkad')
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
        const clearCheckbox = document.querySelector('.clear-estimate-checkbox');
        if (clearCheckbox) clearCheckbox.classList.add('active'); 
        
        setTimeout(() => {
          estimateItems = [];
          isFormLocked = false;
          estimateHasBeenShown = false; 
          topRowFields.forEach(field => {
              field.disabled = false;
          });
          updateDisable(); 
          renderEstimate();
          setTimeout(() => {
              document.querySelectorAll('.estimate-list li.empty-state').forEach(li => {
                  li.style.animation = 'fadeIn 0.5s ease-in';
              });
          }, 100);
          if (clearCheckbox) clearCheckbox.classList.remove('active'); 
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
