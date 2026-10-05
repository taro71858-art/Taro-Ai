import {
  APP_STATE, saveState, showToast, $, $$, formatMoney, getCurrentCurrency, getCurrentNiche,
  navigateToScreen, renderAnalyst, renderWhatIf, renderCurrencies, renderHistory, renderAdvisor,
  sendAdvisorMessage, stopAdvisorGeneration, toggleUseMyData, clearAdvisorChat, copyAdvisorText,
  saveAdvisorToHistory, reportAdvisorFeedback, explainAdvisorSimpler, openCurrencyPicker,
  closeCurrencyPicker, renderCurrencyPickerList, selectCurrency, toggleFavCurrency,
  updateDrawerCurrencyCard, recalcConverter, checkAllChecklistCompleted, updateNavIndicator, showScreenSkeleton,
  openLanguagePicker, closeLanguagePicker, renderLanguagePickerList, selectLanguage, updateDrawerLanguageCard, applyLanguageToUI
} from './app.js';

import {
  openNichePicker, closeNichePicker, selectNiche, setNicheCategory, renderNichesList, filterNiches,
  openHelpModal, openGlossaryModal, openToolModal, TOOLS_REGISTRY, updateNicheUI,
  recalcDiscountTool, saveDiscountResult, copyDiscountResult, printDiscountResult,
  addInvoiceRow, updateInvoiceItem, deleteInvoiceRow, recalcInvoiceTotal, saveInvoiceToHistory, copyInvoiceText, printInvoicePdf,
  recalcTaxesTool, copyTaxResult, printTaxReport,
  recalcSalariesTool, copySalaryResult, printSalaryPdf,
  addDebtItemModal, deleteDebtItem,
  addCrmClientModal, deleteCrmClient,
  printBusinessPlanPdf, printCanvasPdf,
  addCompetitorRow, updateCompetitor, deleteCompetitor, copyCompetitorsResult, printCompetitorsResult,
  parseCsvData, handleCsvFileUpload, applyCsvToOperations, saveGoals, setCalcTab, recalcActiveCalc, recalcLoan,
  saveSecurityPin, downloadBackupJson, copyBackupJson, exportIcsEvent, confirmDataReset, filterGlossary, copyResultText
} from './tools.js';

import { SOUND } from './sound.js';

// Expose $ and $$ globally for inline event handlers and console debugging
window.$ = $;
window.$$ = $$;

// Global Window APP Object for clean event delegation
window.APP = {
  navigateToScreen,
  openNichePicker,
  closeNichePicker,
  selectNiche,
  setNicheCategory,
  renderNichesList,
  filterNiches,
  openHelpModal,
  openGlossaryModal,
  openToolModal,
  openCurrencyPicker,
  closeCurrencyPicker,
  renderCurrencyPickerList,
  selectCurrency,
  toggleFavCurrency,
  openLanguagePicker,
  closeLanguagePicker,
  renderLanguagePickerList,
  selectLanguage,
  updateDrawerLanguageCard,
  applyLanguageToUI,
  recalcConverter,
  sendAdvisorMessage,
  stopAdvisorGeneration,
  toggleUseMyData,
  clearAdvisorChat,
  copyAdvisorText,
  saveAdvisorToHistory,
  reportAdvisorFeedback,
  explainAdvisorSimpler,
  renderAnalyst,
  renderWhatIf,
  renderAdvisor,
  checkAllChecklistCompleted,

  // Tool Handlers
  recalcDiscountTool, saveDiscountResult, copyDiscountResult, printDiscountResult,
  addInvoiceRow, updateInvoiceItem, deleteInvoiceRow, recalcInvoiceTotal, saveInvoiceToHistory, copyInvoiceText, printInvoicePdf,
  recalcTaxesTool, copyTaxResult, printTaxReport,
  recalcSalariesTool, copySalaryResult, printSalaryPdf,
  addDebtItemModal, deleteDebtItem,
  addCrmClientModal, deleteCrmClient,
  printBusinessPlanPdf, printCanvasPdf,
  addCompetitorRow, updateCompetitor, deleteCompetitor, copyCompetitorsResult, printCompetitorsResult,
  parseCsvData, handleCsvFileUpload, applyCsvToOperations, saveGoals, setCalcTab, recalcActiveCalc, recalcLoan,
  saveSecurityPin, downloadBackupJson, copyBackupJson, exportIcsEvent, confirmDataReset, filterGlossary, copyResultText,

  closeToolRunnerModal() {
    $('#modal-tool-runner')?.classList.remove('open');
  },

  toggleEye() {
    APP_STATE.hideAmounts = !APP_STATE.hideAmounts;
    saveState();
    SOUND.play('ding');
    const icon = $('#eye-icon');
    if (icon) {
      icon.textContent = APP_STATE.hideAmounts ? '🙈' : '👁️';
      icon.classList.remove('eye-blink');
      void icon.offsetWidth;
      icon.classList.add('eye-blink');
    }
    renderAnalyst();
    renderWhatIf();
    renderHistory();
    showToast(APP_STATE.hideAmounts ? 'Суммы скрыты' : 'Суммы видны');
  },

  fillSampleData() {
    APP_STATE.monthData = { revenue: 500000, rent: 100000, salary: 200000, ads: 50000, other: 0 };
    if ($('#inp-revenue')) $('#inp-revenue').value = '500 000';
    if ($('#inp-rent')) $('#inp-rent').value = '100 000';
    if ($('#inp-salary')) $('#inp-salary').value = '200 000';
    if ($('#inp-ads')) $('#inp-ads').value = '50 000';
    if ($('#inp-other')) $('#inp-other').value = '0';
    APP_STATE.checklist.calcDone = true;
    saveState();
    renderAnalyst();
    SOUND.play('ding');
  },

  calculateAnalyst() {
    APP_STATE.monthData.revenue = Number($('#inp-revenue')?.value.replace(/\s+/g, '')) || 0;
    APP_STATE.monthData.rent = Number($('#inp-rent')?.value.replace(/\s+/g, '')) || 0;
    APP_STATE.monthData.salary = Number($('#inp-salary')?.value.replace(/\s+/g, '')) || 0;
    APP_STATE.monthData.ads = Number($('#inp-ads')?.value.replace(/\s+/g, '')) || 0;
    APP_STATE.monthData.other = Number($('#inp-other')?.value.replace(/\s+/g, '')) || 0;
    APP_STATE.checklist.calcDone = true;
    saveState();
    SOUND.play('coins');
    renderAnalyst();
    showToast('Расчёт выполнен ✓');
  },

  swapFx() {
    const fromSel = $('#fx-from-select');
    const toSel = $('#fx-to-select');
    if (!fromSel || !toSel) return;
    const temp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = temp;
    recalcConverter();
    SOUND.play('click');
  },

  setHistoryTab(tab) {
    APP_STATE.activeHistoryTab = tab;
    saveState();
    SOUND.play('click');
    renderHistory();
  },

  deleteOperation(idx) {
    if (APP_STATE.incomesExpenses) {
      APP_STATE.incomesExpenses.splice(idx, 1);
      saveState();
      SOUND.play('click');
      renderHistory();
    }
  },

  simulateVoiceInput() {
    if (confirm('CoreMaX AI запрашивает доступ к микрофону для распознавания голосовых команд (например: «потратил 1500 на закупку продуктов»). Разрешить?')) {
      SOUND.play('ding');
      showToast('🎙️ Слушаем... Произнесите сумму и назначение');
      setTimeout(() => {
        APP_STATE.incomesExpenses.unshift({ id: 'ie_' + Date.now(), type: 'exp', amt: 1500, desc: 'Закупка продуктов (голосовой ввод)', date: 'Сегодня' });
        saveState();
        SOUND.play('coins');
        renderHistory();
        showToast('✓ Распознано: расход 1 500 ₽ (продукты)');
      }, 1500);
    }
  },

  openAddOpModal() {
    const modal = $('#modal-tool-runner');
    if (!$('#tool-runner-title') || !$('#tool-runner-body') || !modal) return;
    $('#tool-runner-title').textContent = '➕ Добавить операцию';
    $('#tool-runner-body').innerHTML = `
      <div class="field-group">
        <label class="field-label">Тип</label>
        <select id="op-new-type" class="input-control">
          <option value="inc">🟢 Доход (Выручка)</option>
          <option value="exp">🔴 Расход (Затраты)</option>
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">Сумма</label>
        <input type="text" inputmode="decimal" id="op-new-amt" class="input-control" placeholder="10 000">
      </div>
      <div class="field-group">
        <label class="field-label">Описание</label>
        <input type="text" id="op-new-desc" class="input-control" placeholder="Напр. Оплата поставщику">
      </div>
      <button type="button" class="btn btn-gold" onclick="window.APP.saveNewOperation()" style="width:100%; margin-top:8px;">Записать</button>
    `;
    modal.classList.add('open');
  },

  saveNewOperation() {
    const type = $('#op-new-type')?.value || 'inc';
    const amt = Number($('#op-new-amt')?.value.replace(/\s+/g, '')) || 0;
    const desc = ($('#op-new-desc')?.value || '').trim() || (type === 'inc' ? 'Доход' : 'Расход');
    if (amt <= 0) { showToast('Введите сумму'); return; }
    APP_STATE.incomesExpenses.unshift({ id: 'ie_' + Date.now(), type, amt, desc, date: 'Сегодня' });
    saveState();
    SOUND.play(type === 'inc' ? 'coins' : 'ding');
    $('#modal-tool-runner')?.classList.remove('open');
    renderHistory();
    showToast('Операция добавлена ✓');
  },

  openFloatingHelpChat() {
    navigateToScreen('screen-advisor');
  },

  openDrawer() {
    SOUND.play('click');
    $('#app-drawer')?.classList.add('open');
    updateDrawerCurrencyCard();
  },

  closeDrawer() {
    $('#app-drawer')?.classList.remove('open');
  },

  setTheme(t, event) {
    APP_STATE.theme = t;
    saveState();
    
    const wave = $('#theme-transition-wave');
    if (wave && event) {
      const x = event.clientX || window.innerWidth / 2;
      const y = event.clientY || window.innerHeight / 2;
      
      wave.style.left = `${x - 20}px`;
      wave.style.top = `${y - 20}px`;
      wave.style.width = '40px';
      wave.style.height = '40px';
      
      let targetBg = '#07090e';
      if (t === 'light') targetBg = '#f1f5f9';
      else if (t === 'bw') targetBg = '#000000';
      else if (t === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        targetBg = isDark ? '#07090e' : '#f1f5f9';
      }
      wave.style.background = targetBg;
      wave.classList.add('active');
      
      setTimeout(() => {
        if (t === 'system') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } else {
          document.documentElement.setAttribute('data-theme', t);
        }
      }, 250);
      
      setTimeout(() => {
        wave.classList.remove('active');
      }, 600);
    } else {
      if (t === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', t);
      }
    }
  },

  toggleBatterySaver() {
    APP_STATE.batterySaver = !APP_STATE.batterySaver;
    saveState();
    SOUND.play('ding');
    const isB = APP_STATE.batterySaver;
    document.documentElement.classList.toggle('battery-save', isB);
    const lbl = $('#drawer-battery-label');
    if (lbl) {
      lbl.textContent = isB ? '🔋 Энергосбережение: Вкл' : '🔋 Энергосбережение: Выкл';
    }
    showToast(isB ? 'Энергосбережение включено (без эффектов)' : 'Энергосбережение выключено');
  },

  toggleSound() {
    APP_STATE.soundEnabled = !APP_STATE.soundEnabled;
    saveState();
    const lbl = $('#drawer-sound-label');
    if (lbl) lbl.textContent = APP_STATE.soundEnabled ? '🔊 Звук: Вкл' : '🔇 Звук: Выкл';
    if (APP_STATE.soundEnabled) SOUND.play('ding');
  },

  setCurrencyRegionTab(btn) {
    $$('#currency-picker-tabs .btn-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCurrencyPickerList(btn.dataset.region, $('#currency-search-input')?.value || '');
  },

  startOnboardingTour() {
    window.APP.closeDrawer();
    SOUND.play('ding');
    const modal = $('#modal-tool-runner');
    if (!modal) return;

    $('#tool-runner-title').textContent = '🎬 Быстрый старт с CoreMaX AI';
    $('#tool-runner-body').innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px; font-size:0.82rem;">
        <div class="card card-gold">
          <div style="font-weight:800; font-size:0.9rem; color:var(--gold-primary); margin-bottom:4px;">Шаг 1: Выберите свою нишу</div>
          <p style="color:var(--text-secondary); margin-bottom:8px;">Сверху в шапке нажмите на текущую нишу (например, "Кафе ▾"), чтобы настроить под себя одну из 160 отраслей бизнеса.</p>
          <button type="button" class="btn btn-gold" onclick="window.APP.openNichePicker();" style="height:36px; font-size:0.75rem;">Выбрать нишу сейчас ➔</button>
        </div>

        <div class="card">
          <div style="font-weight:800; font-size:0.9rem; color:var(--cyan-primary); margin-bottom:4px;">Шаг 2: Экспресс-анализ за 2 минуты</div>
          <p style="color:var(--text-secondary);">Вводите показатели выручки и расходов на вкладке <b>«Анализ»</b>. ИИ мгновенно рассчитает маржу, прибыль и покажет рекомендации.</p>
        </div>

        <div class="card">
          <div style="font-weight:800; font-size:0.9rem; color:var(--emerald-primary); margin-bottom:4px;">Шаг 3: Моделируйте будущее</div>
          <p style="color:var(--text-secondary);">Перейдите на вкладку <b>«Что если»</b> и подвигайте слайдеры цены или объёма продаж. Вы увидите прогноз прибыли в реальном времени.</p>
        </div>

        <button type="button" class="btn btn-secondary" onclick="window.APP.closeToolRunnerModal(); SOUND.play('click');" style="width:100%; margin-top:6px;">Понятно, начать работу ✓</button>
      </div>
    `;
    modal.classList.add('open');
  },

  showToast
};

// DOM Ready initialization
document.addEventListener('DOMContentLoaded', () => {
  $('#btn-open-drawer')?.addEventListener('click', window.APP.openDrawer);
  window.APP.setTheme(APP_STATE.theme || 'dark');
  applyLanguageToUI();
  updateDrawerLanguageCard();
  updateNicheUI();
  navigateToScreen(APP_STATE.activeScreen || 'screen-analyst');
  updateDrawerCurrencyCard();

  // Initialize battery saver
  if (APP_STATE.batterySaver) {
    document.documentElement.classList.add('battery-save');
    const lbl = $('#drawer-battery-label');
    if (lbl) lbl.textContent = '🔋 Энергосбережение: Вкл';
  }

  // Update nav indicator
  setTimeout(() => {
    updateNavIndicator();
  }, 50);

  // Dismiss Splash Loader smoothly
  setTimeout(() => {
    const splash = $('#app-splash');
    if (splash) splash.classList.add('hidden');
  }, 750);

  // Register PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});
