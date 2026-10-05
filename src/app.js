import { ALL_CURRENCIES, REGIONS_META } from './currencies.js';
import { ALL_NICHES, NICHE_CATEGORIES } from './niches.js';
import { GLOSSARY, HELP_FAQS } from './glossary.js';
import { ALL_LANGUAGES, getLanguage, t } from './i18n.js';
import { SOUND } from './sound.js';
import { TOOLS_REGISTRY, copyResultText, saveResultToHistory, printOrPdfResult } from './tools.js';

// ============================================================
// APP STATE WITH MULTI-PROFILE & LOCAL STORAGE
// ============================================================
export const APP_STATE = {
  theme: 'dark', // 'system' | 'light' | 'dark' | 'bw'
  lang: 'ru', // 'ru', 'en', 'tg', 'uz', 'kk', etc. (36 languages)
  soundEnabled: true,
  vibeEnabled: true,
  hideAmounts: false,
  batterySaver: false,
  achievementTriggered: false,
  pin: '',
  currency: 'RUB',
  userLevel: 'starter',
  activeNicheId: 'n_cafe',
  activeScreen: 'screen-analyst',
  activeHistoryTab: 'history', // 'history' | 'operations'
  tourCompleted: false,
  checklist: {
    nicheSet: true,
    calcDone: false,
    fxDone: false,
    invoiceDone: false,
    advisorDone: false
  },
  favoritesCurrencies: ['USD', 'EUR', 'RUB', 'TJS', 'KZT', 'BTC', 'USDT'],
  recentCurrencies: ['RUB', 'USD', 'EUR'],
  recentSections: ['screen-analyst', 'screen-whatif', 'screen-advisor'],
  monthData: {
    revenue: 10000,
    cogs: 4000,
    rent: 1500,
    salary: 1000,
    ads: 500,
    other: 0,
    taxes: 500,
    isSample: true
  },
  whatIfData: {
    price: 100,
    volume: 500,
    varCost: 40,
    fixedCost: 15000,
    priceDelta: 0,
    volDelta: 0,
    costDelta: 0
  },
  incomesExpenses: [
    { id: 'ie_1', type: 'inc', desc: 'Дневная выручка', amt: 15000, date: 'Сегодня', cat: 'Выручка' },
    { id: 'ie_2', type: 'exp', desc: 'Закупка зерен кофе и сиропов', amt: 6000, date: 'Сегодня', cat: 'Закупка и Сырье' },
    { id: 'ie_3', type: 'exp', desc: 'Аренда помещения за месяц', amt: 45000, date: 'Вчера', cat: 'Аренда' }
  ],
  savedCalculations: [
    { id: 'calc_1', date: 'Сегодня', section: 'Анализ', title: 'Экспресс-аудит (Выручка: 10 000)', metric: '+2 500 ₽ (Маржа: 25%)', data: {} }
  ],
  reminders: [
    { id: 'rem_1', text: 'Уплата налога УСН за квартал', date: '28.10.2026', done: false }
  ],
  businesses: [],
  chatHistory: [
    { sender: 'ai', text: 'Здравствуйте! Я ваш бизнес-аналитик CoreMaX AI. Задайте любой вопрос по расчету прибыли, налогам, рекламе или оптимизации расходов в вашей нише.' }
  ]
};

// Load state with fallback
try {
  const saved = localStorage.getItem('coremax_state_v4');
  if (saved) {
    Object.assign(APP_STATE, JSON.parse(saved));
  }
} catch (_) {}

export function saveState() {
  try {
    localStorage.setItem('coremax_state_v4', JSON.stringify(APP_STATE));
  } catch (_) {}
}

// Selectors
export function $(sel) { return document.querySelector(sel); }
export function $$(sel) { return document.querySelectorAll(sel); }

export function getCurrentNiche() {
  return ALL_NICHES.find(n => n.id === APP_STATE.activeNicheId) || ALL_NICHES[0];
}

export function getCurrentCurrency() {
  return ALL_CURRENCIES.find(c => c.code === APP_STATE.currency) || ALL_CURRENCIES[0];
}

export function formatMoney(num) {
  if (APP_STATE.hideAmounts) return '••••••';
  const val = Math.round(Number(num) || 0);
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function showToast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

// ============================================================
// NUMBER COUNTER ANIMATOR (60 FPS REQUEST ANIMATION FRAME)
// ============================================================
const activeAnimations = new Map();

export function animateValue(el, start, end, duration = 350, prefix = '', suffix = '') {
  if (!el) return;
  
  if (activeAnimations.has(el)) {
    cancelAnimationFrame(activeAnimations.get(el));
    activeAnimations.delete(el);
  }

  if (duration <= 0 || APP_STATE.hideAmounts) {
    let formatted = Math.round(end).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    if (APP_STATE.hideAmounts) formatted = '••••••';
    el.innerHTML = `${prefix}${formatted}${suffix}`;
    return;
  }

  const startTime = performance.now();
  
  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(ease * (end - start) + start);
    
    let formatted = current.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    el.innerHTML = `${prefix}${formatted}${suffix}`;
    
    if (progress < 1) {
      const frameId = requestAnimationFrame(step);
      activeAnimations.set(el, frameId);
    } else {
      let finalFormatted = Math.round(end).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      el.innerHTML = `${prefix}${finalFormatted}${suffix}`;
      activeAnimations.delete(el);
    }
  };
  
  const frameId = requestAnimationFrame(step);
  activeAnimations.set(el, frameId);
}

// Dynamic tab indicator matching offsets
export function updateNavIndicator() {
  const activeTab = document.querySelector('.nav-tab.active');
  const indicator = document.getElementById('nav-indicator');
  if (activeTab && indicator) {
    const left = activeTab.offsetLeft;
    const width = activeTab.offsetWidth;
    indicator.style.left = `${left + (width - 24) / 2}px`;
    indicator.style.width = `24px`;
  }
}

// Skeletons with safe max 200ms timeout
export function showScreenSkeleton(screenId, callback) {
  try {
    callback();
  } catch (err) {
    console.error('Render Screen Error:', err);
    renderScreenError(screenId, err.message);
  }
}

export function renderScreenError(screenId, message) {
  const screen = document.getElementById(screenId);
  if (!screen) return;
  screen.innerHTML = `
    <div style="text-align:center; padding:30px; display:flex; flex-direction:column; gap:12px;">
      <div style="font-size:2.5rem;">⚠️</div>
      <div style="font-weight:800; font-size:1.1rem; color:var(--rose-primary);">Не удалось загрузить раздел</div>
      <div style="font-size:0.8rem; color:var(--text-secondary);">${message}</div>
      <button type="button" class="btn btn-gold" onclick="window.APP.navigateToScreen('${screenId}')" style="margin-top:8px;">
        🔄 Повторить
      </button>
    </div>
  `;
}

// Checklist achievement
export function checkAllChecklistCompleted() {
  const cl = APP_STATE.checklist;
  const keys = ['nicheSet', 'calcDone', 'fxDone', 'invoiceDone', 'advisorDone'];
  const allDone = keys.every(k => cl[k]);
  if (allDone && !APP_STATE.achievementTriggered) {
    APP_STATE.achievementTriggered = true;
    saveState();
    SOUND.play('coins');
    TOOLS_REGISTRY.achievements.render();
    $('#modal-tool-runner')?.classList.add('open');
  }
}

// ============================================================
// ROUTING (5 MAIN SCREENS)
// ============================================================
export function navigateToScreen(screenId) {
  try {
    SOUND.play('click');
    SOUND.vibrate([20]);

    $$('.screen').forEach(s => s.hidden = s.id !== screenId);
    $$('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.screen === screenId);
    });

    updateNavIndicator();

    APP_STATE.activeScreen = screenId;
    saveState();

    if (screenId === 'screen-analyst') renderAnalyst();
    else if (screenId === 'screen-whatif') renderWhatIf();
    else if (screenId === 'screen-advisor') renderAdvisor();
    else if (screenId === 'screen-currencies') renderCurrencies();
    else if (screenId === 'screen-history') renderHistory();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error('Navigate Error:', err);
    renderScreenError(screenId, err.message);
  }
}

// ============================================================
// 1. SCREEN: АНАЛИЗ (FINANCIAL AUDIT)
// ============================================================
export function renderAnalyst() {
  const niche = getCurrentNiche();
  const cur = getCurrentCurrency();
  const l = APP_STATE.lang || 'ru';
  
  const pill = $('#header-niche-pill');
  if (pill) pill.innerHTML = `<span>${niche.name.split('/')[0].trim()}</span> ▾`;

  renderChecklist();

  const d = APP_STATE.monthData;
  const rev = Number(d.revenue) || 0;
  const cogs = Number(d.cogs) || 0;
  const rent = Number(d.rent) || 0;
  const sal = Number(d.salary) || 0;
  const ads = Number(d.ads) || 0;
  const other = Number(d.other) || 0;
  const taxes = Number(d.taxes) || 0;

  const totalExp = rent + sal + ads + other;
  const grossProfit = rev - cogs;
  const netProfit = grossProfit - totalExp - taxes;
  const marginPct = rev > 0 ? (netProfit / rev) * 100 : 0;
  const markupPct = cogs > 0 ? ((rev - cogs) / cogs) * 100 : 0;

  const cogsPct = rev > 0 ? Math.max(0, (cogs / rev) * 100) : 0;
  const expPct = rev > 0 ? Math.max(0, (totalExp / rev) * 100) : 0;
  const taxPct = rev > 0 ? Math.max(0, (taxes / rev) * 100) : 0;
  const profitPct = rev > 0 ? Math.max(0, (netProfit / rev) * 100) : 0;

  // Health index 0-100
  let healthScore = 50;
  if (netProfit > 0) {
    healthScore = Math.min(100, Math.round(50 + (marginPct / (niche.margin || 20)) * 35));
  } else {
    healthScore = Math.max(5, Math.round(50 + (marginPct * 1.5)));
  }

  // Loss causes diagnosis
  const lossCauses = [];
  if (cogsPct > 45) lossCauses.push(`Высокая себестоимость (${cogsPct.toFixed(0)}% от выручки).`);
  if (expPct > 50) lossCauses.push(`Избыточные операционные расходы (${expPct.toFixed(0)}%).`);
  if (netProfit < 0) lossCauses.push(`Бизнес находится в зоне кассового убытка.`);

  const resBox = $('#analyst-results-box');
  if (resBox) {
    resBox.innerHTML = `
      ${d.isSample ? `
        <div style="background:rgba(245,158,11,0.12); border:1px solid var(--border-gold); padding:6px 10px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center; font-size:0.75rem;">
          <span style="color:var(--gold-primary); font-weight:700;">⚡ ${t('sample_btn', l, 'Пример')}: 500 000 ${cur.sym}</span>
          <span class="badge badge-gold" style="font-size:0.65rem;">Demo</span>
        </div>
      ` : ''}

      <div class="card card-gold">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:0.75rem; text-transform:uppercase; font-weight:800; color:var(--text-secondary);">${t('net_profit', l, 'Чистая прибыль')}</div>
          <span class="badge ${netProfit >= 0 ? 'badge-profit' : 'badge-loss'}">${netProfit >= 0 ? '✓ +' : '⚠️ -'}</span>
        </div>
        <div class="metric-hero ${netProfit >= 0 ? 'metric-profit' : 'metric-loss'}" id="analyst-profit-display" style="font-size:2.2rem; font-family:var(--font-display); font-weight:800; margin:4px 0; color:${netProfit >= 0 ? 'var(--emerald-primary)' : 'var(--rose-primary)'};">
          ${netProfit >= 0 ? '+' : ''}${formatMoney(netProfit)} ${cur.sym}
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; border-top:1px solid var(--border-subtle); padding-top:8px; margin-top:6px; font-size:0.8rem;">
          <div>${t('margin', l, 'Маржа')}: <b style="color:var(--text-primary);">${marginPct.toFixed(1)}%</b> <span style="font-size:0.7rem; color:var(--text-muted);">(norm: ${niche.margin}%)</span></div>
          <div>${t('markup', l, 'Наценка')}: <b style="color:var(--gold-primary);">${markupPct.toFixed(1)}%</b></div>
        </div>
        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">
          ${t('gross_profit', l, 'Валовая прибыль')}: <b>${formatMoney(grossProfit)} ${cur.sym}</b>
        </div>
      </div>

      <!-- HEALTH SCORE & LOSS REASONS -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:0.8rem; font-weight:800;">🩺 ${t('health_index', l, 'Индекс финансового здоровья')}</span>
          <b style="color:${healthScore >= 70 ? 'var(--emerald-primary)' : healthScore >= 40 ? 'var(--gold-primary)' : 'var(--rose-primary)'}; font-size:0.95rem;">${healthScore} / 100</b>
        </div>
        <div class="progress-bar" style="margin-bottom:8px;">
          <div class="progress-fill" style="width:${healthScore}%; background:${healthScore >= 70 ? 'var(--emerald-primary)' : healthScore >= 40 ? 'var(--gold-grad)' : 'var(--rose-primary)'};"></div>
        </div>

        ${lossCauses.length ? `
          <div style="background:rgba(251,113,133,0.1); border:1px solid rgba(251,113,133,0.25); padding:8px 10px; border-radius:var(--radius-sm); font-size:0.75rem; color:var(--rose-primary); margin-top:6px; display:flex; flex-direction:column; gap:3px;">
            ${lossCauses.map(c => `<div>• ${c}</div>`).join('')}
          </div>
        ` : `
          <div style="font-size:0.75rem; color:var(--emerald-primary); font-weight:600;">✓ Healthy financial performance</div>
        `}
      </div>

      <!-- REVENUE STRUCTURE BARS -->
      <div class="card" style="padding:12px;">
        <div style="font-size:0.8rem; font-weight:800; color:var(--text-primary); margin-bottom:8px;">📊 ${t('rev_structure', l, 'Структура выручки (100%)')}</div>
        <div class="chart-bars-wrap">
          <div class="chart-bar-row">
            <span class="chart-bar-label">${t('cogs_label', l, 'Себестоимость')}</span>
            <div class="chart-bar-track" onclick="window.APP.showChartTooltip(this, 'COGS', '${formatMoney(cogs)} ${cur.sym}', '${cogsPct.toFixed(1)}%')">
              <div class="chart-bar-fill" style="width:${cogsPct}%; background:var(--gold-primary);"></div>
              <div class="chart-tooltip-bubble">${formatMoney(cogs)} ${cur.sym} (${cogsPct.toFixed(1)}%)</div>
            </div>
            <span class="chart-bar-value">${cogsPct.toFixed(0)}%</span>
          </div>

          <div class="chart-bar-row">
            <span class="chart-bar-label">${t('expenses_label', l, 'Расходы')}</span>
            <div class="chart-bar-track" onclick="window.APP.showChartTooltip(this, 'Expenses', '${formatMoney(totalExp)} ${cur.sym}', '${expPct.toFixed(1)}%')">
              <div class="chart-bar-fill" style="width:${expPct}%; background:var(--rose-primary);"></div>
              <div class="chart-tooltip-bubble">${formatMoney(totalExp)} ${cur.sym} (${expPct.toFixed(1)}%)</div>
            </div>
            <span class="chart-bar-value">${expPct.toFixed(0)}%</span>
          </div>

          <div class="chart-bar-row">
            <span class="chart-bar-label">${t('taxes_label', l, 'Налоги')}</span>
            <div class="chart-bar-track" onclick="window.APP.showChartTooltip(this, 'Taxes', '${formatMoney(taxes)} ${cur.sym}', '${taxPct.toFixed(1)}%')">
              <div class="chart-bar-fill" style="width:${taxPct}%; background:var(--purple-primary);"></div>
              <div class="chart-tooltip-bubble">${formatMoney(taxes)} ${cur.sym} (${taxPct.toFixed(1)}%)</div>
            </div>
            <span class="chart-bar-value">${taxPct.toFixed(0)}%</span>
          </div>

          <div class="chart-bar-row">
            <span class="chart-bar-label">${t('net_profit', l, 'Прибыль')}</span>
            <div class="chart-bar-track" onclick="window.APP.showChartTooltip(this, 'Profit', '${formatMoney(netProfit)} ${cur.sym}', '${profitPct.toFixed(1)}%')">
              <div class="chart-bar-fill" style="width:${profitPct}%; background:var(--emerald-primary);"></div>
              <div class="chart-tooltip-bubble">${formatMoney(netProfit)} ${cur.sym} (${profitPct.toFixed(1)}%)</div>
            </div>
            <span class="chart-bar-value">${profitPct.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <!-- ACTION BUTTONS: SAVE / COPY / PDF -->
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">
        <button type="button" class="btn btn-secondary" onclick="window.APP.saveAnalystCalculation()">${t('save_btn', l, '💾 Сохранить')}</button>
        <button type="button" class="btn btn-secondary" onclick="window.APP.copyAnalystSummary()">${t('copy_btn', l, '📋 Копировать')}</button>
        <button type="button" class="btn btn-gold" onclick="window.APP.printAnalystReport()">${t('pdf_btn', l, '📄 PDF')}</button>
      </div>
    `;
  }
}

function renderChecklist() {
  const box = $('#first-steps-card');
  if (!box) return;
  const cl = APP_STATE.checklist;
  const items = [
    { key: 'nicheSet', label: '1. Выбрать нишу и валюту' },
    { key: 'calcDone', label: '2. Сделать первый расчёт прибыли' },
    { key: 'fxDone', label: '3. Конвертировать сумму в валютах' },
    { key: 'invoiceDone', label: '4. Создать счёт клиенту' },
    { key: 'advisorDone', label: '5. Задать вопрос Советнику' }
  ];
  const doneCount = items.filter(i => cl[i.key]).length;
  if (doneCount === items.length) {
    box.style.display = 'none';
    return;
  }
  box.style.display = 'block';
  box.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
      <div style="font-size:0.8rem; font-weight:800; color:var(--gold-primary);">🚀 Чек-лист «Первые шаги»</div>
      <span style="font-size:0.75rem; font-weight:700; color:var(--text-secondary);">${doneCount} из ${items.length}</span>
    </div>
    <div class="progress-bar" style="margin-bottom:8px;">
      <div class="progress-fill" style="width:${(doneCount / items.length) * 100}%;"></div>
    </div>
    <div style="display:flex; flex-direction:column; gap:4px; font-size:0.75rem;">
      ${items.map(it => `
        <div style="display:flex; align-items:center; gap:6px; color:${cl[it.key] ? 'var(--emerald-primary)' : 'var(--text-secondary)'};">
          <span>${cl[it.key] ? '✅' : '⚪'}</span>
          <span style="text-decoration:${cl[it.key] ? 'line-through' : 'none'};">${it.label}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ============================================================
// 2. SCREEN: ЧТО ЕСЛИ (WHAT-IF SIMULATOR)
// ============================================================
export function renderWhatIf(isSliderInput = false) {
  const cur = getCurrentCurrency();
  const d = APP_STATE.whatIfData;

  const p = Number(d.price) || 100;
  const v = Number(d.volume) || 500;
  const varC = Number(d.varCost) || 40;
  const fixed = Number(d.fixedCost) || 15000;

  const pDelta = Number($('#wi-price-slider')?.value || d.priceDelta || 0);
  const vDelta = Number($('#wi-vol-slider')?.value || d.volDelta || 0);
  const cDelta = Number($('#wi-cost-slider')?.value || d.costDelta || 0);

  d.priceDelta = pDelta;
  d.volDelta = vDelta;
  d.costDelta = cDelta;

  const baseRev = p * v;
  const baseVar = varC * v;
  const baseProf = baseRev - baseVar - fixed;

  const simP = p * (1 + pDelta / 100);
  const simV = v * (1 + vDelta / 100);
  const simVar = varC * (1 + cDelta / 100) * simV;
  const simFixed = fixed * (1 + cDelta / 100);
  const simRev = simP * simV;
  const simProf = simRev - simVar - simFixed;
  const diff = simProf - baseProf;
  const diffPct = baseProf !== 0 ? (diff / Math.abs(baseProf)) * 100 : 0;

  // 3 Scenarios table
  const calcScenario = (pPct, vPct) => {
    const scP = p * (1 + pPct / 100);
    const scV = v * (1 + vPct / 100);
    const scRev = scP * scV;
    const scVar = varC * scV;
    return Math.round(scRev - scVar - fixed);
  };

  const scPessimistic = calcScenario(-20, -20);
  const scRealistic = Math.round(baseProf);
  const scOptimistic = calcScenario(20, 20);

  if ($('#wi-price-val')) $('#wi-price-val').textContent = (pDelta > 0 ? '+' : '') + pDelta + '%';
  if ($('#wi-vol-val')) $('#wi-vol-val').textContent = (vDelta > 0 ? '+' : '') + vDelta + '%';
  if ($('#wi-cost-val')) $('#wi-cost-val').textContent = (cDelta > 0 ? '+' : '') + cDelta + '%';

  const resProfitEl = $('#wi-result-profit');
  if (resProfitEl) {
    resProfitEl.textContent = `${simProf >= 0 ? '+' : ''}${formatMoney(simProf)} ${cur.sym}`;
    resProfitEl.style.color = simProf >= 0 ? 'var(--emerald-primary)' : 'var(--rose-primary)';
  }

  const resDiffEl = $('#wi-result-diff');
  if (resDiffEl) {
    resDiffEl.innerHTML = `Изменение: <b>${diff >= 0 ? '+' : ''}${formatMoney(diff)} ${cur.sym}</b> (${(diffPct >= 0 ? '+' : '') + diffPct.toFixed(1)}%)`;
    resDiffEl.style.color = diff >= 0 ? 'var(--emerald-primary)' : 'var(--rose-primary)';
  }

  // Update comparison table
  const tableEl = $('#wi-scenarios-table');
  if (tableEl) {
    tableEl.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; text-align:center; font-size:0.75rem;">
        <div style="background:rgba(251,113,133,0.1); padding:8px 4px; border-radius:var(--radius-sm); border:1px solid rgba(251,113,133,0.3);">
          <div style="color:var(--rose-primary); font-weight:700;">Пессимист (-20%)</div>
          <div style="font-weight:800; font-size:0.9rem; margin-top:2px;">${formatMoney(scPessimistic)} ${cur.sym}</div>
        </div>
        <div style="background:var(--bg-input); padding:8px 4px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
          <div style="color:var(--text-secondary); font-weight:700;">Базовый (0%)</div>
          <div style="font-weight:800; font-size:0.9rem; margin-top:2px;">${formatMoney(scRealistic)} ${cur.sym}</div>
        </div>
        <div style="background:rgba(52,211,153,0.1); padding:8px 4px; border-radius:var(--radius-sm); border:1px solid rgba(52,211,153,0.3);">
          <div style="color:var(--emerald-primary); font-weight:700;">Оптимист (+20%)</div>
          <div style="font-weight:800; font-size:0.9rem; margin-top:2px;">${formatMoney(scOptimistic)} ${cur.sym}</div>
        </div>
      </div>
    `;
  }
}

// ============================================================
// 3. SCREEN: ИИ-СОВЕТНИК (GEMINI STREAMING + NETLIFY + LOCAL)
// ============================================================
let currentAdvisorAbortController = null;

export function renderAdvisorPromptChips() {
  const chipsBox = $('#advisor-prompt-chips');
  if (!chipsBox) return;

  const niche = getCurrentNiche();
  const nicheName = niche.name.split('/')[0].trim();
  const l = APP_STATE.lang || 'ru';

  let prompts = [];
  if (l === 'en') {
    prompts = [
      `How to increase revenue in ${nicheName}?`,
      `Difference between margin and markup?`,
      `How to prevent cash gap / deficit?`,
      `Write a high-converting Instagram post`,
      `How to cut operational costs effectively?`
    ];
  } else if (l === 'tg') {
    prompts = [
      `Чӣ тавр даромадро дар «${nicheName}» зиёд кунам?`,
      `Марҷа чист ва фарқи он аз иловапулӣ?`,
      `Чӣ тавр касри хазинаро пешгирӣ кунам?`,
      `Барои Инстаграм матни таблиғотӣ навис`,
      `Чӣ тавр хароҷотро кам кунам?`
    ];
  } else if (l === 'uz') {
    prompts = [
      `«${nicheName}» sohasida daromadni oshirish sirlari?`,
      `Marja nima va ustamadan qanday farq qiladi?`,
      `Kassa uzilishini qanday oldini olish mumkin?`,
      `Instagram uchun sotuvchi post yozib ber`,
      `Xarajatlarni qanday qisqartirish mumkin?`
    ];
  } else if (l === 'kk') {
    prompts = [
      `«${nicheName}» саласында кірісті қалай көбейтуге болады?`,
      `Маржа мен үстеменің айырмашылығы қандай?`,
      `Кассалық үзілістен қалай сақтану керек?`,
      `Инстаграмға арналған жарнамалық пост жаз`,
      `Шығындарды қалай азайтуға болады?`
    ];
  } else if (l === 'tr') {
    prompts = [
      `«${nicheName}» sektöründe ciro nasıl artırılır?`,
      `Kâr marjı ile fiyat artışı farkı nedir?`,
      `Nakit açığı nasıl önlenir?`,
      `Satış odaklı Instagram gönderisi yaz`,
      `Maliyetleri kaliteden ödün vermeden düşürme yolları?`
    ];
  } else if (l === 'es') {
    prompts = [
      `¿Cómo aumentar los ingresos en ${nicheName}?`,
      `¿Diferencia entre margen y recargo comercial?`,
      `¿Cómo evitar problemas de flujo de caja?`,
      `Escribe una publicación de venta para Instagram`,
      `¿Cómo reducir costes sin perder calidad?`
    ];
  } else if (l === 'ar') {
    prompts = [
      `كيف أزيد الإيرادات في نشاط «${nicheName}»؟`,
      `ما الفرق بين هامش الربح ونسبة الإضافة؟`,
      `كيف أتجنب عجز السيولة النقدية؟`,
      `اكتب منشوراً تسويقياً للإنستغرام`,
      `كيف أخفض المصاريف دون التأثير على الجودة؟`
    ];
  } else if (l === 'zh') {
    prompts = [
      `如何在«${nicheName}»行业提高营业额？`,
      `毛利率与加价率有什么区别？`,
      `如何防止企业发生资金链断裂？`,
      `写一篇吸引顾客的营销推广文案`,
      `如何在保证品质的前提下降低成本？`
    ];
  } else {
    prompts = [
      `Как повысить выручку в нише «${nicheName}»?`,
      `Что такое маржа и чем отличается от наценки?`,
      `Как предотвратить кассовый разрыв?`,
      `Напиши продающий пост для Инстаграм со скидкой 15%`,
      `Как снизить себестоимость без потери качества?`
    ];
  }

  chipsBox.innerHTML = prompts.map(p => `
    <button type="button" class="btn-chip" onclick="window.APP.sendAdvisorMessage('${p.replace(/'/g, "\\'")}')" style="white-space:nowrap; height:30px; padding:0 10px; font-size:0.75rem; border-color:var(--border-gold); color:var(--gold-primary);">
      💡 ${p}
    </button>
  `).join('');
}

function formatChatMessage(text) {
  if (!text) return '';
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1); padding:2px 4px; border-radius:4px; font-family:var(--font-mono); font-size:0.85em;">$1</code>')
    .replace(/\n/g, '<br>');
  return formatted;
}

export function renderAdvisor() {
  const box = $('#advisor-chat-stream');
  if (!box) return;

  const niche = getCurrentNiche();
  const badge = $('#advisor-niche-badge');
  if (badge) badge.textContent = `${niche.name.split('/')[0].trim()}`;

  const stopBtn = $('#btn-stop-advisor');
  if (stopBtn) stopBtn.style.display = currentAdvisorAbortController ? 'inline-flex' : 'none';

  box.innerHTML = APP_STATE.chatHistory.map((m, idx) => `
    <div style="display:flex; flex-direction:column; gap:4px; max-width:88%; ${m.sender === 'user' ? 'margin-left:auto;' : ''}">
      <div class="chat-bubble ${m.sender}">
        ${m.text ? formatChatMessage(m.text) : '<div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>'}
      </div>
      ${m.sender === 'ai' && m.text ? `
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.68rem; color:var(--text-muted); padding:0 4px; flex-wrap:wrap; gap:4px;">
          <span>Уверенность: <b style="color:var(--emerald-primary);">${m.confidence || 'высокая'} ✓</b></span>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            <button type="button" class="btn-chip" onclick="window.APP.copyAdvisorText(${idx})" style="height:22px; padding:0 6px; font-size:0.65rem;">📋 Копировать</button>
            <button type="button" class="btn-chip" onclick="window.APP.saveAdvisorToHistory(${idx})" style="height:22px; padding:0 6px; font-size:0.65rem;">💾 Сохранить</button>
            <button type="button" class="btn-chip" onclick="window.APP.explainAdvisorSimpler(${idx})" style="height:22px; padding:0 6px; font-size:0.65rem; color:var(--gold-primary);">💡 Проще</button>
          </div>
        </div>
      ` : ''}
    </div>
  `).join('');

  box.scrollTop = box.scrollHeight;
  renderAdvisorPromptChips();
}

export function stopAdvisorGeneration() {
  if (currentAdvisorAbortController) {
    currentAdvisorAbortController.abort();
    currentAdvisorAbortController = null;
    showToast('Генерация остановлена');
    SOUND.play('click');
    renderAdvisor();
  }
}

export function toggleUseMyData(enabled) {
  APP_STATE.useMyData = enabled;
  saveState();
  showToast(enabled ? 'Данные расчётов передаются ИИ' : 'ИИ отвечает без ваших цифр');
}

export async function sendAdvisorMessage(overridePrompt = null, simplify = false) {
  const inp = $('#advisor-input');
  const q = overridePrompt || (inp ? inp.value.trim() : '');
  if (!q) return;

  if (inp) inp.value = '';

  const niche = getCurrentNiche();
  const cur = getCurrentCurrency();

  // Add user prompt
  APP_STATE.chatHistory.push({ sender: 'user', text: q });
  APP_STATE.checklist.advisorDone = true;
  saveState();
  checkAllChecklistCompleted();
  renderAdvisor();

  // Model placeholder
  const aiMsg = { sender: 'ai', text: '', streaming: true, confidence: 'высокая' };
  APP_STATE.chatHistory.push(aiMsg);
  renderAdvisor();

  currentAdvisorAbortController = new AbortController();

  const contextData = {
    useMyData: APP_STATE.useMyData !== false,
    niche: niche.name,
    currency: { code: cur.code, symbol: cur.sym },
    metrics: {
      revenue: APP_STATE.monthData.revenue,
      cogs: APP_STATE.monthData.cogs,
      rent: APP_STATE.monthData.rent,
      salary: APP_STATE.monthData.salary,
      ads: APP_STATE.monthData.ads,
      taxes: APP_STATE.monthData.taxes
    }
  };

  try {
    // Dual endpoint support: local express or Netlify functions
    const endpoints = ['/api/advisor', '/.netlify/functions/advisor'];
    let res = null;

    for (const url of endpoints) {
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: q,
            history: APP_STATE.chatHistory.slice(0, -2).map(m => ({
              role: m.sender === 'user' ? 'user' : 'model',
              content: m.text
            })),
            context: contextData,
            language: APP_STATE.lang || 'ru',
            simplify: simplify
          }),
          signal: currentAdvisorAbortController.signal
        });
        if (res.ok) break;
      } catch (_) {}
    }

    if (!res || !res.ok) {
      throw new Error('Функция ИИ-Советника временно недоступна');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = '';

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                aiMsg.text += parsed.text;
                renderAdvisor();
              }
            } catch (_) {}
          }
        }
      }
    }

    aiMsg.streaming = false;
    currentAdvisorAbortController = null;
    SOUND.play('ding');
    saveState();
    renderAdvisor();

  } catch (err) {
    currentAdvisorAbortController = null;
    aiMsg.streaming = false;
    
    // Offline / Network fallback with helpful knowledge base advice
    aiMsg.text = `⚠️ Нет связи с сервером ИИ. Вот рекомендации из базы знаний для ниши «${niche.name}»:\n\n• ${niche.tip || 'Контролируйте маржинальность и средний чек.'}\n• Рекомендуемая норма маржи в вашей нише: ${niche.margin}%\n• Точка безубыточности рассчитывается как Постоянные расходы / Валовую маржу.\n\nВы можете нажать кнопку ниже, чтобы повторить запрос при появлении сети.`;
    aiMsg.confidence = 'локальная база';

    renderAdvisor();
    saveState();
  }
}

export function clearAdvisorChat() {
  if (currentAdvisorAbortController) currentAdvisorAbortController.abort();
  currentAdvisorAbortController = null;
  APP_STATE.chatHistory = [
    { sender: 'ai', text: 'Новый чат начат. Задайте любой вопрос по бизнесу, финансам или работе с приложением!' }
  ];
  saveState();
  renderAdvisor();
  showToast('Новый чат начат ✓');
}

export function copyAdvisorText(idx) {
  const msg = APP_STATE.chatHistory[idx];
  if (msg && msg.text) {
    copyResultText(msg.text);
  }
}

export function saveAdvisorToHistory(idx) {
  const msg = APP_STATE.chatHistory[idx];
  if (msg && msg.text) {
    saveResultToHistory('ИИ-Советник', msg.text.slice(0, 60) + '...');
  }
}

export function explainAdvisorSimpler(idx) {
  const lastUserMsg = APP_STATE.chatHistory.filter(m => m.sender === 'user').pop();
  const q = lastUserMsg ? lastUserMsg.text : 'Поясни предыдущий ответ проще';
  sendAdvisorMessage(`Поясни максимально простым языком для новичка: ${q}`, true);
}

export function reportAdvisorFeedback(idx) {
  showToast('Спасибо за отзыв! Мы учтём это в следующих ответах ✓');
}

// ============================================================
// 4. SCREEN: ВАЛЮТЫ (CONVERTER & 256+ RATES)
// ============================================================
export function renderCurrencies() {
  const fromSel = $('#fx-from-select');
  const toSel = $('#fx-to-select');
  if (!fromSel || !toSel) return;

  if (fromSel.children.length === 0) {
    ALL_CURRENCIES.filter(c => !c.isObsolete).slice(0, 50).forEach(c => {
      const o1 = document.createElement('option');
      o1.value = c.code;
      o1.textContent = `${c.flag} ${c.code} — ${c.name}`;
      if (c.code === APP_STATE.currency) o1.selected = true;
      fromSel.appendChild(o1);

      const o2 = document.createElement('option');
      o2.value = c.code;
      o2.textContent = `${c.flag} ${c.code} — ${c.name}`;
      if (c.code === (APP_STATE.currency === 'USD' ? 'EUR' : 'USD')) o2.selected = true;
      toSel.appendChild(o2);
    });
  }

  recalcConverter();
}

export function recalcConverter() {
  const amt = Number($('#fx-amount-input')?.value.replace(/\s+/g, '')) || 100000;
  const fromCode = $('#fx-from-select')?.value || APP_STATE.currency;
  const toCode = $('#fx-to-select')?.value || 'USD';

  const cFrom = ALL_CURRENCIES.find(c => c.code === fromCode) || ALL_CURRENCIES[0];
  const cTo = ALL_CURRENCIES.find(c => c.code === toCode) || ALL_CURRENCIES[1];

  const rate = cTo.rate / (cFrom.rate || 1);
  const result = amt * rate;

  const resEl = $('#fx-converted-result');
  if (resEl) {
    animateValue(resEl, 0, result, 300, '', ` ${cTo.sym}`);
  }
  
  if ($('#fx-rate-subtitle')) {
    $('#fx-rate-subtitle').textContent = `1 ${cFrom.code} = ${rate < 0.01 ? rate.toFixed(6) : rate.toFixed(4)} ${cTo.code}`;
  }

  APP_STATE.checklist.fxDone = true;
  saveState();
  checkAllChecklistCompleted();
}

export function setQuickFxAmount(amt) {
  const inp = $('#fx-amount-input');
  if (inp) {
    inp.value = formatMoney(amt);
    recalcConverter();
    SOUND.play('click');
  }
}

// ============================================================
// 5. SCREEN: ИСТОРИЯ И ОПЕРАЦИИ
// ============================================================
export function renderHistory() {
  const cur = getCurrentCurrency();
  const subTab = APP_STATE.activeHistoryTab;
  
  $$('.history-subtab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === subTab);
  });

  const histPane = $('#history-pane-logs');
  const opsPane = $('#history-pane-ops');
  if (histPane) histPane.hidden = subTab !== 'history';
  if (opsPane) opsPane.hidden = subTab !== 'operations';

  // Render History Logs
  const histList = $('#history-items-container');
  if (histList) {
    const list = APP_STATE.savedCalculations || [];
    if (!list.length) {
      histList.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.85rem;">Сохраненных расчетов пока нет. Нажмите «💾 Сохранить» на любом экране.</div>`;
    } else {
      histList.innerHTML = list.map((item, idx) => `
        <div style="background:var(--bg-input); padding:10px 12px; border-radius:var(--radius-md); border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; font-size:0.85rem; color:var(--text-primary);">${item.title}</div>
            <div style="font-size:0.75rem; color:var(--emerald-primary); margin-top:2px;">${item.metric}</div>
            <div style="font-size:0.68rem; color:var(--text-muted); margin-top:2px;">${item.section} • ${item.date}</div>
          </div>
          <button type="button" class="btn-chip" onclick="window.APP.deleteSavedCalc(${idx})" style="color:var(--rose-primary);">✕</button>
        </div>
      `).join('');
    }
  }

  // Render Operations
  const opsList = $('#ops-list-container');
  if (opsList) {
    const list = APP_STATE.incomesExpenses || [];
    if (!list.length) {
      opsList.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.85rem;">Операций нет. Добавьте доход или расход.</div>`;
    } else {
      opsList.innerHTML = list.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:10px 12px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <div>
            <div style="font-weight:700; font-size:0.85rem; color:var(--text-primary);">${item.desc}</div>
            <div style="font-size:0.7rem; color:var(--text-muted);">${item.cat || 'Прочее'} • ${item.date}</div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <b style="color:${item.type === 'inc' ? 'var(--emerald-primary)' : 'var(--rose-primary)'}; font-size:0.95rem;">
              ${item.type === 'inc' ? '+' : '−'}${formatMoney(item.amt)} ${cur.sym}
            </b>
            <button type="button" class="btn-chip" onclick="window.APP.deleteOperation(${idx})" style="padding:0 6px; color:var(--rose-primary);">✕</button>
          </div>
        </div>
      `).join('');
    }
  }
}

// Currency Picker
export function openCurrencyPicker() {
  SOUND.play('click');
  const modal = $('#modal-currency-picker');
  if (modal) {
    modal.classList.add('open');
    renderCurrencyPickerList('all', '');
  }
}

export function closeCurrencyPicker() {
  $('#modal-currency-picker')?.classList.remove('open');
}

export function renderCurrencyPickerList(region = 'all', query = '') {
  const listEl = $('#currency-picker-items');
  if (!listEl) return;

  const q = query.toLowerCase().trim();
  let filtered = ALL_CURRENCIES;

  if (region === 'popular') filtered = filtered.filter(c => c.popular);
  else if (region === 'favorites') filtered = filtered.filter(c => APP_STATE.favoritesCurrencies.includes(c.code));
  else if (region === 'crypto') filtered = filtered.filter(c => c.type === 'crypto');
  else if (region === 'metals') filtered = filtered.filter(c => c.type === 'metal' || c.type === 'imf');
  else if (region === 'obsolete') filtered = filtered.filter(c => c.isObsolete);
  else if (region !== 'all') filtered = filtered.filter(c => c.region === region);

  if (q) {
    filtered = filtered.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.sym.toLowerCase().includes(q)
    );
  }

  listEl.innerHTML = filtered.map(c => {
    const isSelected = c.code === APP_STATE.currency;
    const isFav = APP_STATE.favoritesCurrencies.includes(c.code);
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-radius:var(--radius-md); background:var(--bg-input); border:1px solid ${isSelected ? 'var(--gold-primary)' : 'var(--border-subtle)'}; cursor:pointer;" onclick="window.APP.selectCurrency('${c.code}', ${Boolean(c.isObsolete)})">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.4rem;">${c.flag}</span>
          <div>
            <div style="font-weight:800; font-size:0.9rem; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
              ${c.code} <span style="color:var(--gold-primary); font-size:0.8rem;">(${c.sym})</span>
              ${c.isObsolete ? '<span class="badge badge-loss" style="font-size:0.6rem;">Устаревшая</span>' : ''}
            </div>
            <div style="font-size:0.75rem; color:var(--text-secondary);">${c.name}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" class="btn-chip" onclick="event.stopPropagation(); window.APP.toggleFavCurrency('${c.code}')" style="padding:0 8px; font-size:0.85rem; color:${isFav ? 'var(--gold-primary)' : 'var(--text-muted)'};">
            ${isFav ? '★' : '☆'}
          </button>
          ${isSelected ? '<span style="color:var(--gold-primary); font-weight:800;">✓</span>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

export function selectCurrency(code, isObsolete) {
  APP_STATE.currency = code;
  saveState();
  SOUND.play('ding');
  showToast(`Валюта по умолчанию: ${code}`);
  closeCurrencyPicker();
  renderAnalyst();
  renderWhatIf();
  updateDrawerCurrencyCard();
}

export function toggleFavCurrency(code) {
  if (APP_STATE.favoritesCurrencies.includes(code)) {
    APP_STATE.favoritesCurrencies = APP_STATE.favoritesCurrencies.filter(c => c !== code);
  } else {
    APP_STATE.favoritesCurrencies.push(code);
  }
  saveState();
  renderCurrencyPickerList($('#currency-picker-tabs .btn-chip.active')?.dataset.region || 'all', $('#currency-search-input')?.value || '');
}

export function updateDrawerCurrencyCard() {
  const c = getCurrentCurrency();
  const card = $('#drawer-currency-card');
  if (card) {
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.4rem;">${c.flag}</span>
          <div>
            <div style="font-weight:800; font-size:0.88rem; color:var(--text-primary);">${c.code} — ${c.name}</div>
            <div style="font-size:0.75rem; color:var(--gold-primary);">Пример: 1 234,56 ${c.sym}</div>
          </div>
        </div>
        <span style="color:var(--text-muted); font-size:0.8rem;">Изменить ➔</span>
      </div>
    `;
  }
}

// ============================================================
// 6. LANGUAGE PICKER & LOCALIZATION (36 LANGUAGES)
// ============================================================
export function openLanguagePicker() {
  SOUND.play('click');
  const modal = $('#modal-language-picker');
  if (modal) {
    modal.classList.add('open');
    renderLanguagePickerList('');
  }
}

export function closeLanguagePicker() {
  $('#modal-language-picker')?.classList.remove('open');
}

export function renderLanguagePickerList(query = '') {
  const listEl = $('#language-picker-items');
  if (!listEl) return;

  const q = query.toLowerCase().trim();
  let filtered = ALL_LANGUAGES;

  if (q) {
    filtered = filtered.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  }

  listEl.innerHTML = filtered.map(l => {
    const isSelected = l.code === (APP_STATE.lang || 'ru');
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-radius:var(--radius-md); background:var(--bg-input); border:1px solid ${isSelected ? 'var(--gold-primary)' : 'var(--border-subtle)'}; cursor:pointer;" onclick="window.APP.selectLanguage('${l.code}')">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.4rem;">${l.flag}</span>
          <div>
            <div style="font-weight:800; font-size:0.9rem; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
              ${l.nativeName}
              <span style="color:var(--gold-primary); font-size:0.75rem;">(${l.code.toUpperCase()})</span>
            </div>
            <div style="font-size:0.75rem; color:var(--text-secondary);">${l.name}</div>
          </div>
        </div>
        ${isSelected ? '<span style="color:var(--gold-primary); font-weight:800; font-size:1.1rem;">✓</span>' : ''}
      </div>
    `;
  }).join('');
}

export function selectLanguage(code) {
  APP_STATE.lang = code;
  saveState();
  SOUND.play('ding');
  const curLang = getLanguage(code);
  showToast(`${t('lang_updated_toast', code, 'Язык изменен: ')}${curLang.nativeName} (${curLang.flag})`);
  closeLanguagePicker();
  applyLanguageToUI();
  updateDrawerLanguageCard();
  renderAdvisorPromptChips();
}

export function updateDrawerLanguageCard() {
  const lang = getLanguage(APP_STATE.lang || 'ru');
  const card = $('#drawer-language-card');
  if (card) {
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.4rem;">${lang.flag}</span>
          <div>
            <div style="font-weight:800; font-size:0.88rem; color:var(--text-primary);">${lang.nativeName} (${lang.code.toUpperCase()})</div>
            <div style="font-size:0.75rem; color:var(--gold-primary);">${lang.name} • 30 языков</div>
          </div>
        </div>
        <span style="color:var(--text-muted); font-size:0.8rem;">Изменить ➔</span>
      </div>
    `;
  }
}

export function applyLanguageToUI() {
  const l = APP_STATE.lang || 'ru';
  
  // Set text direction if RTL (Arabic, Hebrew, Persian)
  const curLang = getLanguage(l);
  document.documentElement.dir = curLang.dir || 'ltr';

  // 1. Header Title
  const title = $('.header-title');
  if (title) title.textContent = t('app_title', l, 'Бизнес-аналитик');

  // 2. Bottom Nav Tabs
  const tabAnalyst = $('[data-screen="screen-analyst"] span');
  if (tabAnalyst) tabAnalyst.textContent = t('tab_analyst', l, 'Анализ');

  const tabWhatif = $('[data-screen="screen-whatif"] span');
  if (tabWhatif) tabWhatif.textContent = t('tab_whatif', l, 'Что если');

  const tabAdvisor = $('[data-screen="screen-advisor"] span');
  if (tabAdvisor) tabAdvisor.textContent = t('tab_advisor', l, 'Советник');

  const tabCurrencies = $('[data-screen="screen-currencies"] span');
  if (tabCurrencies) tabCurrencies.textContent = t('tab_currencies', l, 'Валюты');

  const tabHistory = $('[data-screen="screen-history"] span');
  if (tabHistory) tabHistory.textContent = t('tab_history', l, 'История');

  // 3. Screen Headings
  const hAnalyst = $('#screen-analyst .screen-heading');
  if (hAnalyst) hAnalyst.textContent = t('analyst_heading', l);

  const hWhatIf = $('#screen-whatif .screen-heading');
  if (hWhatIf) hWhatIf.textContent = t('whatif_heading', l);

  const hAdv = $('#screen-advisor .screen-heading');
  if (hAdv) hAdv.textContent = t('advisor_heading', l);

  const hCur = $('#screen-currencies .screen-heading');
  if (hCur) hCur.textContent = t('currencies_heading', l);

  const hHist = $('#screen-history .screen-heading');
  if (hHist) hHist.textContent = t('history_heading', l);

  // 4. Analyst Screen Inputs & Labels
  const fTitle = $('#screen-analyst .card-title');
  if (fTitle) fTitle.textContent = t('figures_of_month', l);

  const fSample = $('#screen-analyst .card-header .btn-chip');
  if (fSample) fSample.textContent = t('sample_btn', l);

  const revLbl = $('#field-label-revenue');
  if (revLbl) revLbl.innerHTML = `<span>${t('revenue_label', l)}</span> <span style="color:var(--gold-primary);">*</span>`;

  const rentLbl = $('#field-label-rent');
  if (rentLbl) rentLbl.textContent = t('rent_label', l);

  const salLbl = $('#field-label-salary');
  if (salLbl) salLbl.textContent = t('salary_label', l);

  const adsLbl = $('#field-label-ads');
  if (adsLbl) adsLbl.textContent = t('ads_label', l);

  const othLbl = $('#field-label-other');
  if (othLbl) othLbl.textContent = t('other_label', l);

  const btnCalc = $('#btn-calc-analyst');
  if (btnCalc) btnCalc.innerHTML = `<span>${t('calc_btn', l)}</span>`;

  // 5. What-If Screen Labels
  const wiPriceLbl = $('#wi-price-label-text');
  if (wiPriceLbl) wiPriceLbl.textContent = `🏷️ ${t('wi_price_label', l)}`;

  const wiVolLbl = $('#wi-vol-label-text');
  if (wiVolLbl) wiVolLbl.textContent = `📦 ${t('wi_vol_label', l)}`;

  const wiCostLbl = $('#wi-cost-label-text');
  if (wiCostLbl) wiCostLbl.textContent = `📉 ${t('wi_cost_label', l)}`;

  // 6. Advisor Screen
  const advOnline = $('#adv-online-status');
  if (advOnline) advOnline.textContent = t('ai_online', l);

  const advNewChat = $('#adv-btn-new-chat');
  if (advNewChat) advNewChat.textContent = t('new_chat', l);

  const advInp = $('#advisor-input');
  if (advInp) advInp.placeholder = t('ask_advisor_placeholder', l);

  // 7. Currencies Screen
  const fxAmtLbl = $('#fx-amount-label');
  if (fxAmtLbl) fxAmtLbl.textContent = t('fx_amount_label', l);

  const fxFromLbl = $('#fx-from-label');
  if (fxFromLbl) fxFromLbl.textContent = t('fx_from_label', l);

  const fxToLbl = $('#fx-to-label');
  if (fxToLbl) fxToLbl.textContent = t('fx_to_label', l);

  const fxResLbl = $('#fx-res-label');
  if (fxResLbl) fxResLbl.textContent = t('fx_result_label', l);

  const fxCatBtn = $('#fx-catalog-btn');
  if (fxCatBtn) fxCatBtn.innerHTML = `<span>${t('fx_catalog_btn', l)}</span>`;

  // 8. History Screen
  const histTabH = $('[data-tab="history"]');
  if (histTabH) histTabH.textContent = t('hist_tab_history', l);

  const histTabO = $('[data-tab="operations"]');
  if (histTabO) histTabO.textContent = t('hist_tab_ops', l);

  const addOpB = $('#btn-add-op-main');
  if (addOpB) addOpB.innerHTML = `<span>${t('add_op_btn', l)}</span>`;

  const voiceB = $('#btn-voice-input-main');
  if (voiceB) voiceB.innerHTML = `<span>${t('voice_input_btn', l)}</span>`;

  // 9. Floating Help Button
  const floatB = $('.floating-ai-btn span');
  if (floatB) floatB.textContent = t('floating_help', l);

  // 10. Drawer Menu
  const menuTitle = $('#drawer-menu-title');
  if (menuTitle) menuTitle.textContent = t('menu_title', l);

  const dNicheLbl = $('#drawer-niche-label');
  if (dNicheLbl) dNicheLbl.textContent = t('current_business', l);

  const dLangBtn = $('#drawer-change-lang-btn span');
  if (dLangBtn) dLangBtn.textContent = t('change_lang_btn', l);

  const acc1 = $('#acc-calc-title');
  if (acc1) acc1.textContent = t('acc_calculations', l);

  const acc2 = $('#acc-crm-title');
  if (acc2) acc2.textContent = t('acc_crm', l);

  const acc3 = $('#acc-ai-title');
  if (acc3) acc3.textContent = t('acc_ai', l);

  const acc4 = $('#acc-edu-title');
  if (acc4) acc4.textContent = t('acc_education', l);

  // Re-render active screens with translations
  renderAnalyst();
  renderWhatIf();
}

