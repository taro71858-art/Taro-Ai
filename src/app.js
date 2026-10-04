import { ALL_CURRENCIES, REGIONS_META } from './currencies.js';
import { ALL_NICHES, NICHE_CATEGORIES } from './niches.js';
import { GLOSSARY, HELP_FAQS } from './glossary.js';
import { SOUND } from './sound.js';

// Global App State
export const APP_STATE = {
  theme: 'dark', // 'system' | 'light' | 'dark' | 'bw'
  soundEnabled: true,
  vibeEnabled: true,
  hideAmounts: false,
  batterySaver: false,
  achievementTriggered: false,
  currency: 'RUB',
  userLevel: 'starter', // 'starter' | 'intermediate' | 'pro'
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
    revenue: 500000,
    rent: 100000,
    salary: 200000,
    ads: 50000,
    other: 0
  },
  incomesExpenses: [
    { id: 'ie_1', type: 'inc', desc: 'Дневная касса', amt: 35000, date: 'Сегодня' },
    { id: 'ie_2', type: 'exp', desc: 'Закупка зёрен кофе', amt: 12000, date: 'Сегодня' },
    { id: 'ie_3', type: 'exp', desc: 'Аренда помещения', amt: 100000, date: 'Вчера' }
  ],
  invoice: {
    items: [
      { id: 'i_1', name: 'Консультация по оптимизации', qty: 1, price: 25000 },
      { id: 'i_2', name: 'Настройка ИИ-бота', qty: 1, price: 40000 }
    ],
    discountPct: 5,
    vatPct: 0
  },
  chatHistory: [
    { sender: 'ai', text: 'Здравствуйте! Я ваш ИИ-советник CoreMaX AI. Могу помочь оптимизировать расходы, поднять выручку, рассчитать маржинальность или составить план продвижения. Спросите меня о чём угодно!' }
  ]
};

// Load saved state
try {
  const saved = localStorage.getItem('coremax_state_v3');
  if (saved) {
    Object.assign(APP_STATE, JSON.parse(saved));
  }
} catch (_) {}

export function saveState() {
  try {
    localStorage.setItem('coremax_state_v3', JSON.stringify(APP_STATE));
  } catch (_) {}
}

// Helpers
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
// ANIMATIONS & RIPPLE TRANSITIONS (PART A)
// ============================================================
const activeAnimations = new Map();

export function animateValue(el, start, end, duration = 400, prefix = '', suffix = '') {
  if (!el) return;
  
  if (activeAnimations.has(el)) {
    cancelAnimationFrame(activeAnimations.get(el));
    activeAnimations.delete(el);
  }

  if (duration <= 0 || APP_STATE.hideAmounts) {
    let formatted = end.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    if (APP_STATE.hideAmounts) formatted = '••••••';
    el.innerHTML = `${prefix}${formatted}${suffix}`;
    return;
  }

  const startTime = performance.now();
  
  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // cubic ease out
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(ease * (end - start) + start);
    
    let formatted = current.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    el.innerHTML = `${prefix}${formatted}${suffix}`;
    
    if (progress < 1) {
      const frameId = requestAnimationFrame(step);
      activeAnimations.set(el, frameId);
    } else {
      let finalFormatted = end.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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
    // Position exactly centered underneath the icon/title
    indicator.style.left = `${left + (width - 24) / 2}px`;
    indicator.style.width = `24px`;
  }
}

// Show loading skeletons for smooth interactive loading (A2 skeleton)
export function showScreenSkeleton(screenId, callback) {
  const screen = document.getElementById(screenId);
  if (!screen) return;
  
  screen.innerHTML = `
    <div class="screen-header-row">
      <div class="skeleton" style="width: 140px; height: 24px;"></div>
      <div class="skeleton" style="width: 32px; height: 32px; border-radius: 50%;"></div>
    </div>
    <div class="skeleton skeleton-card" style="height: 110px; margin-bottom: 12px;"></div>
    <div class="skeleton skeleton-card" style="height: 180px; margin-bottom: 12px;"></div>
    <div class="skeleton skeleton-card" style="height: 90px;"></div>
  `;
  
  setTimeout(() => {
    callback();
  }, 250);
}

// Gamified rewardpopup when checklist is finished
export function triggerAchievement() {
  if (APP_STATE.achievementTriggered) return;
  APP_STATE.achievementTriggered = true;
  saveState();
  
  SOUND.play('coins');
  
  const modal = $('#modal-tool-runner');
  if (modal) {
    $('#tool-runner-title').textContent = '🏆 Достижение получено!';
    $('#tool-runner-body').innerHTML = `
      <div style="text-align:center; padding:16px; display:flex; flex-direction:column; align-items:center; gap:12px;">
        <div class="achievement-crown" style="font-size:4rem; animation: floatPulse 2.4s infinite ease-in-out;">👑</div>
        <div style="font-family:var(--font-display); font-weight:800; font-size:1.35rem; color:var(--gold-primary);">Супер-Аналитик CoreMaX!</div>
        <p style="font-size:0.82rem; color:var(--text-secondary); line-height:1.5;">
          Поздравляем! Вы завершили все шаги адаптации: выбрали нишу, сделали анализ, рассчитали валюты, выставили первый счёт и проконсультировались у ИИ-Советника.
        </p>
        <div class="card card-gold" style="font-size:0.75rem; font-weight:700; color:var(--emerald-primary); padding:8px 12px; width:100%;">
          🎉 Получен безлимитный доступ ко всем бизнес-моделям и ИИ!
        </div>
        
        <div class="confetti-container">
          <div class="confetti" style="background:#f59e0b; left:10%; animation-delay:0.1s;"></div>
          <div class="confetti" style="background:#38bdf8; left:30%; animation-delay:0.4s;"></div>
          <div class="confetti" style="background:#34d399; left:50%; animation-delay:0.2s;"></div>
          <div class="confetti" style="background:#fb7185; left:70%; animation-delay:0.6s;"></div>
          <div class="confetti" style="background:#c084fc; left:90%; animation-delay:0.3s;"></div>
        </div>
        
        <button type="button" class="btn btn-gold" onclick="$('#modal-tool-runner').classList.remove('open');" style="width:100%; margin-top:8px;">Забрать награду ⭐</button>
      </div>
    `;
    modal.classList.add('open');
    
    document.body.classList.add('achievement-flash');
    setTimeout(() => {
      document.body.classList.remove('achievement-flash');
    }, 1500);
  }
}

export function checkAllChecklistCompleted() {
  const cl = APP_STATE.checklist;
  const keys = ['nicheSet', 'calcDone', 'fxDone', 'invoiceDone', 'advisorDone'];
  const allDone = keys.every(k => cl[k]);
  if (allDone && !APP_STATE.achievementTriggered) {
    triggerAchievement();
  }
}

// Global previous values tracker to animate numbers cleanly from old state
const PREV_VALUES = {
  profit: 0,
  bep: 0,
  dailyTarget: 0,
  wiProfit: 0,
  wiDiff: 0
};

// ============================================================
// ROUTING (5 MAIN SCREENS)
// ============================================================
export function navigateToScreen(screenId) {
  SOUND.play('click');
  SOUND.vibrate([20]);

  $$('.screen').forEach(s => s.hidden = s.id !== screenId);
  $$('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.screen === screenId);
  });

  updateNavIndicator();

  APP_STATE.activeScreen = screenId;
  
  if (!APP_STATE.recentSections.includes(screenId)) {
    APP_STATE.recentSections.unshift(screenId);
    if (APP_STATE.recentSections.length > 5) APP_STATE.recentSections.pop();
  }
  saveState();

  const renderMap = {
    'screen-analyst': renderAnalyst,
    'screen-whatif': renderWhatIf,
    'screen-advisor': renderAdvisor,
    'screen-currencies': renderCurrencies,
    'screen-history': renderHistory
  };

  const renderFn = renderMap[screenId];
  if (renderFn) {
    showScreenSkeleton(screenId, renderFn);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// ANALYST SCREEN & FIRST STEPS CHECKLIST
// ============================================================
export function renderAnalyst() {
  const niche = getCurrentNiche();
  const cur = getCurrentCurrency();
  
  // Update header niche pill
  const pill = $('#header-niche-pill');
  if (pill) pill.innerHTML = `<span>${niche.name.split('/')[0].trim()}</span> ▾`;

  renderChecklist();

  const rev = Number(APP_STATE.monthData.revenue) || 0;
  const rent = Number(APP_STATE.monthData.rent) || 0;
  const sal = Number(APP_STATE.monthData.salary) || 0;
  const ads = Number(APP_STATE.monthData.ads) || 0;
  const other = Number(APP_STATE.monthData.other) || 0;
  const totalExp = rent + sal + ads + other;
  const profit = rev - totalExp;
  const margin = rev > 0 ? (profit / rev) * 100 : 0;
  const bep = totalExp;
  const dailyTarget = Math.round(totalExp / 30);

  const rentPct = rev > 0 ? (rent / rev) * 100 : 0;
  const salaryPct = rev > 0 ? (sal / rev) * 100 : 0;
  const adsPct = rev > 0 ? (ads / rev) * 100 : 0;
  const otherPct = rev > 0 ? (other / rev) * 100 : 0;
  const profitPct = rev > 0 ? (profit / rev) * 100 : 0;

  const resBox = $('#analyst-results-box');
  if (resBox) {
    resBox.innerHTML = `
      <div class="card card-gold">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:0.75rem; text-transform:uppercase; font-weight:800; color:var(--text-secondary);">Чистая прибыль за месяц</div>
          <span class="badge ${profit >= 0 ? 'badge-profit' : 'badge-loss'}">${profit >= 0 ? '✓ В плюсе' : '⚠️ Убыток'}</span>
        </div>
        <div class="metric-hero ${profit >= 0 ? 'metric-profit' : 'metric-loss'}" id="analyst-profit-value" style="font-size:2.1rem; font-family:var(--font-display); font-weight:800; margin:6px 0; color:${profit >= 0 ? 'var(--emerald-primary)' : 'var(--rose-primary)'};">
          ${profit >= 0 ? '+' : ''}${formatMoney(profit)} ${cur.sym}
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.82rem; color:var(--text-secondary); border-top:1px solid var(--border-subtle); padding-top:8px; margin-top:6px;">
          <span>Фактическая маржа: <b style="color:var(--text-primary);">${margin.toFixed(1)}%</b></span>
          <span>Норма ниши «${niche.name.split('/')[0]}»: <b style="color:var(--gold-primary);">${niche.margin}%</b></span>
        </div>
      </div>

      <!-- SEQUENTIALLY DRAWING COST STRUCTURE INTERACTIVE DIAGRAM -->
      <div class="card" style="padding:12px;">
        <div style="font-size:0.8rem; font-weight:800; color:var(--text-primary); margin-bottom:8px;">📊 Структура затрат и прибыли</div>
        <div class="chart-bars-wrap">
          <div class="chart-bar-row">
            <span class="chart-bar-label">Аренда</span>
            <div class="chart-bar-track" onclick="window.APP.showChartTooltip(this, 'Аренда', '${formatMoney(rent)} ${cur.sym}', '${rentPct.toFixed(1)}%')">
              <div class="chart-bar-fill" style="width: 0%; background: var(--rose-primary);" data-width="${Math.min(100, Math.max(0, rentPct))}%"></div>
              <div class="chart-tooltip-bubble">Аренда: ${formatMoney(rent)} ${cur.sym} (${rentPct.toFixed(1)}%)</div>
            </div>
            <span class="chart-bar-value">${rentPct.toFixed(0)}%</span>
          </div>

          <div class="chart-bar-row">
            <span class="chart-bar-label">ФОТ (ЗП)</span>
            <div class="chart-bar-track" onclick="window.APP.showChartTooltip(this, 'ФОТ', '${formatMoney(sal)} ${cur.sym}', '${salaryPct.toFixed(1)}%')">
              <div class="chart-bar-fill" style="width: 0%; background: var(--cyan-primary);" data-width="${Math.min(100, Math.max(0, salaryPct))}%"></div>
              <div class="chart-tooltip-bubble">ФОТ: ${formatMoney(sal)} ${cur.sym} (${salaryPct.toFixed(1)}%)</div>
            </div>
            <span class="chart-bar-value">${salaryPct.toFixed(0)}%</span>
          </div>

          <div class="chart-bar-row">
            <span class="chart-bar-label">Реклама</span>
            <div class="chart-bar-track" onclick="window.APP.showChartTooltip(this, 'Реклама', '${formatMoney(ads)} ${cur.sym}', '${adsPct.toFixed(1)}%')">
              <div class="chart-bar-fill" style="width: 0%; background: var(--purple-primary);" data-width="${Math.min(100, Math.max(0, adsPct))}%"></div>
              <div class="chart-tooltip-bubble">Реклама: ${formatMoney(ads)} ${cur.sym} (${adsPct.toFixed(1)}%)</div>
            </div>
            <span class="chart-bar-value">${adsPct.toFixed(0)}%</span>
          </div>

          <div class="chart-bar-row">
            <span class="chart-bar-label">Прочее</span>
            <div class="chart-bar-track" onclick="window.APP.showChartTooltip(this, 'Прочее', '${formatMoney(other)} ${cur.sym}', '${otherPct.toFixed(1)}%')">
              <div class="chart-bar-fill" style="width: 0%; background: var(--text-muted);" data-width="${Math.min(100, Math.max(0, otherPct))}%"></div>
              <div class="chart-tooltip-bubble">Прочее: ${formatMoney(other)} ${cur.sym} (${otherPct.toFixed(1)}%)</div>
            </div>
            <span class="chart-bar-value">${otherPct.toFixed(0)}%</span>
          </div>

          <div class="chart-bar-row">
            <span class="chart-bar-label">Прибыль</span>
            <div class="chart-bar-track" onclick="window.APP.showChartTooltip(this, 'Прибыль', '${formatMoney(profit)} ${cur.sym}', '${profitPct.toFixed(1)}%')">
              <div class="chart-bar-fill" style="width: 0%; background: var(--emerald-primary);" data-width="${Math.min(100, Math.max(0, profitPct))}%"></div>
              <div class="chart-tooltip-bubble">Прибыль: ${formatMoney(profit)} ${cur.sym} (${profitPct.toFixed(1)}%)</div>
            </div>
            <span class="chart-bar-value">${profitPct.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div class="card">
          <div style="font-size:0.72rem; color:var(--text-secondary);">Точка безубыточности</div>
          <div style="font-size:1.15rem; font-weight:800; color:var(--gold-primary); margin-top:2px;" id="analyst-bep-value">
            ${formatMoney(bep)} ${cur.sym}
          </div>
          <div style="font-size:0.68rem; color:var(--text-muted); margin-top:2px;">Порог выживаемости</div>
        </div>
        <div class="card">
          <div style="font-size:0.72rem; color:var(--text-secondary);">Мин. выручка в день</div>
          <div style="font-size:1.15rem; font-weight:800; color:var(--cyan-primary); margin-top:2px;" id="analyst-daily-value">
            ${formatMoney(dailyTarget)} ${cur.sym}/д
          </div>
          <div style="font-size:0.68rem; color:var(--text-muted); margin-top:2px;">Чтобы покрыть затраты</div>
        </div>
      </div>

      <button type="button" class="btn btn-secondary" id="btn-ask-ai-result" style="width:100%;">
        <span>🧠 Спросить ИИ-Советника об этом результате ➔</span>
      </button>
    `;

    // Dynamic color indicator flashes & count-up animations (A4)
    const profitEl = $('#analyst-profit-value');
    if (profitEl) {
      const diff = profit - PREV_VALUES.profit;
      if (diff > 0) {
        profitEl.classList.remove('flash-green', 'flash-red');
        void profitEl.offsetWidth; // Force CSS reflow
        profitEl.classList.add('flash-green');
      } else if (diff < 0) {
        profitEl.classList.remove('flash-green', 'flash-red');
        void profitEl.offsetWidth;
        profitEl.classList.add('flash-red');
      }
      animateValue(profitEl, PREV_VALUES.profit, profit, 450, profit >= 0 ? '+' : '', ` ${cur.sym}`);
      PREV_VALUES.profit = profit;
    }

    const bepEl = $('#analyst-bep-value');
    if (bepEl) {
      animateValue(bepEl, PREV_VALUES.bep, bep, 450, '', ` ${cur.sym}`);
      PREV_VALUES.bep = bep;
    }

    const dailyEl = $('#analyst-daily-value');
    if (dailyEl) {
      animateValue(dailyEl, PREV_VALUES.dailyTarget, dailyTarget, 450, '', ` ${cur.sym}/д`);
      PREV_VALUES.dailyTarget = dailyTarget;
    }

    // Staggered growing bar diagram animation (A4)
    setTimeout(() => {
      const bars = resBox.querySelectorAll('.chart-bar-fill');
      bars.forEach((bar, idx) => {
        setTimeout(() => {
          const tW = bar.getAttribute('data-width') || '0%';
          bar.style.width = tW;
        }, idx * 100);
      });
    }, 50);

    $('#btn-ask-ai-result')?.addEventListener('click', () => {
      const q = `Проанализируй мои показатели в нише «${niche.name}»:\nВыручка: ${formatMoney(rev)} ${cur.sym}, Расходы: ${formatMoney(totalExp)} ${cur.sym}, Чистая прибыль: ${formatMoney(profit)} ${cur.sym} (Маржа: ${margin.toFixed(1)}%). Какие 3 главных шага для роста прибыли?`;
      APP_STATE.chatHistory.push({ sender: 'user', text: q });
      navigateToScreen('screen-advisor');
    });
  }
}

// Interactive tooltip popup toggling on click/tap
window.APP = window.APP || {};
window.APP.showChartTooltip = (trackEl, name, amtStr, pctStr) => {
  SOUND.play('click');
  const tracks = document.querySelectorAll('.chart-bar-track');
  const alreadyActive = trackEl.classList.contains('active');
  tracks.forEach(t => t.classList.remove('active'));
  if (!alreadyActive) {
    trackEl.classList.add('active');
  }
};

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
// WHAT IF SIMULATOR
// ============================================================
export function renderWhatIf(isSliderInput = false) {
  const cur = getCurrentCurrency();
  const rev = Number(APP_STATE.monthData.revenue) || 500000;
  const exp = (Number(APP_STATE.monthData.rent) || 100000) + (Number(APP_STATE.monthData.salary) || 200000) + (Number(APP_STATE.monthData.ads) || 50000);
  const baseProf = rev - exp;

  const dPrice = Number($('#wi-price-slider')?.value || 0);
  const dVol = Number($('#wi-vol-slider')?.value || 0);
  const dCost = Number($('#wi-cost-slider')?.value || 0);

  const newRev = rev * (1 + dPrice / 100) * (1 + dVol / 100);
  const newExp = exp * (1 + dCost / 100);
  const newProf = newRev - newExp;
  const diff = newProf - baseProf;
  const diffPct = baseProf !== 0 ? (diff / Math.abs(baseProf)) * 100 : 0;

  if ($('#wi-price-val')) $('#wi-price-val').textContent = (dPrice > 0 ? '+' : '') + dPrice + '%';
  if ($('#wi-vol-val')) $('#wi-vol-val').textContent = (dVol > 0 ? '+' : '') + dVol + '%';
  if ($('#wi-cost-val')) $('#wi-cost-val').textContent = (dCost > 0 ? '+' : '') + dCost + '%';

  const duration = isSliderInput ? 0 : 450; // zero-lag instant values on drag, count up on open

  const profitEl = $('#wi-result-profit');
  if (profitEl) {
    profitEl.style.color = newProf >= 0 ? 'var(--emerald-primary)' : 'var(--rose-primary)';
    animateValue(profitEl, isSliderInput ? newProf : PREV_VALUES.wiProfit, newProf, duration, newProf >= 0 ? '+' : '', ` ${cur.sym}`);
    PREV_VALUES.wiProfit = newProf;
  }

  const diffEl = $('#wi-result-diff');
  if (diffEl) {
    diffEl.style.color = diff >= 0 ? 'var(--emerald-primary)' : 'var(--rose-primary)';
    animateValue(diffEl, isSliderInput ? diff : PREV_VALUES.wiDiff, diff, duration, `Изменение: <b>${diff >= 0 ? '+' : ''}`, ` ${cur.sym}</b> (${(diffPct >= 0 ? '+' : '') + diffPct.toFixed(1)}%)`);
    PREV_VALUES.wiDiff = diff;
  }
}

// ============================================================
// CURRENCIES CONVERTER SCREEN
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
    animateValue(resEl, 0, result, 350, '', ` ${cTo.sym}`);
  }
  
  if ($('#fx-rate-subtitle')) {
    $('#fx-rate-subtitle').textContent = `1 ${cFrom.code} = ${rate < 0.01 ? rate.toFixed(6) : rate.toFixed(4)} ${cTo.code}`;
  }

  APP_STATE.checklist.fxDone = true;
  saveState();
  checkAllChecklistCompleted();
}

// ============================================================
// HISTORY & OPERATIONS SCREEN
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

  // Render Operations
  const opsList = $('#ops-list-container');
  if (opsList) {
    const list = APP_STATE.incomesExpenses || [];
    if (list.length === 0) {
      opsList.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.85rem;">Пока нет операций. Нажмите «+ Добавить операцию»</div>`;
    } else {
      opsList.innerHTML = list.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:10px 12px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <div>
            <div style="font-weight:700; font-size:0.85rem; color:var(--text-primary);">${item.desc}</div>
            <div style="font-size:0.7rem; color:var(--text-muted);">${item.date}</div>
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

// ============================================================
// ADVISOR CHAT SCREEN & REAL GEMINI STREAMING ENGINE
// ============================================================
let currentAdvisorAbortController = null;

export function renderAdvisorPromptChips() {
  const chipsBox = $('#advisor-prompt-chips');
  if (!chipsBox) return;

  const niche = getCurrentNiche();
  const nicheName = niche.name.split('/')[0].trim();

  const prompts = [
    `Как повысить выручку в нише «${nicheName}»?`,
    `Что такое маржа и чем отличается от наценки?`,
    `Как снизить постоянные расходы?`,
    `Напиши продающий пост для Инстаграм о скидках`,
    `Как предотвратить кассовый разрыв?`
  ];

  chipsBox.innerHTML = prompts.map(p => `
    <button type="button" class="btn-chip" onclick="window.APP.sendAdvisorMessage('${p.replace(/'/g, "\\'")}')" style="white-space:nowrap; height:30px; padding:0 10px; font-size:0.75rem; border-color:var(--border-gold); color:var(--gold-primary);">
      💡 ${p}
    </button>
  `).join('');
}

export function renderAdvisor() {
  const box = $('#advisor-chat-stream');
  if (!box) return;

  const niche = getCurrentNiche();
  const badge = $('#advisor-niche-badge');
  if (badge) badge.textContent = `☕ ${niche.name.split('/')[0].trim()}`;

  const stopBtn = $('#btn-stop-advisor');
  if (stopBtn) stopBtn.style.display = currentAdvisorAbortController ? 'inline-flex' : 'none';

  box.innerHTML = APP_STATE.chatHistory.map((m, idx) => `
    <div style="display:flex; flex-direction:column; gap:4px; max-width:88%; ${m.sender === 'user' ? 'margin-left:auto;' : ''}">
      <div class="chat-bubble ${m.sender}">
        ${m.text ? m.text.replace(/\n/g, '<br>') : '<div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>'}
      </div>
      ${m.sender === 'ai' && m.text ? `
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.68rem; color:var(--text-muted); padding:0 4px; flex-wrap:wrap; gap:4px;">
          <span>Уверенность: <b style="color:var(--emerald-primary);">${m.confidence || 'высокая'} ✓</b></span>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            <button type="button" class="btn-chip" onclick="window.APP.copyAdvisorText(${idx})" style="height:22px; padding:0 6px; font-size:0.65rem;">📋 Копировать</button>
            <button type="button" class="btn-chip" onclick="window.APP.saveAdvisorToHistory(${idx})" style="height:22px; padding:0 6px; font-size:0.65rem;">💾 Сохранить</button>
            <button type="button" class="btn-chip" onclick="window.APP.reportAdvisorFeedback(${idx})" style="height:22px; padding:0 6px; font-size:0.65rem; color:var(--rose-primary);">👎 Ответ неверный</button>
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

  if (!navigator.onLine) {
    showToast('⚠️ Нужен интернет для ответа');
    APP_STATE.chatHistory.push({
      sender: 'ai',
      text: '⚠️ Нужен интернет для ответа. Ваш вопрос сохранён и будет отправлен при появлении сети.'
    });
    renderAdvisor();
    return;
  }

  // Add user prompt
  APP_STATE.chatHistory.push({ sender: 'user', text: q });
  APP_STATE.checklist.advisorDone = true;
  saveState();
  checkAllChecklistCompleted();
  renderAdvisor();

  // Create model placeholder
  const aiMsg = { sender: 'ai', text: '', streaming: true, confidence: 'высокая' };
  APP_STATE.chatHistory.push(aiMsg);
  renderAdvisor();

  // Context gather
  const niche = getCurrentNiche();
  const cur = getCurrentCurrency();
  const rev = Number(APP_STATE.monthData.revenue) || 0;
  const rent = Number(APP_STATE.monthData.rent) || 0;
  const sal = Number(APP_STATE.monthData.salary) || 0;
  const ads = Number(APP_STATE.monthData.ads) || 0;
  const other = Number(APP_STATE.monthData.other) || 0;
  const totalExp = rent + sal + ads + other;
  const profit = rev - totalExp;
  const margin = rev > 0 ? (profit / rev) * 100 : 0;

  const contextData = {
    useMyData: APP_STATE.useMyData !== false,
    niche: niche.name,
    currency: { code: cur.code, symbol: cur.sym },
    metrics: {
      revenue: rev,
      rent,
      salary: sal,
      ads,
      other,
      profit,
      margin: margin.toFixed(1),
      breakEven: totalExp
    }
  };

  currentAdvisorAbortController = new AbortController();
  renderAdvisor();

  try {
    const res = await fetch('/api/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: q,
        history: APP_STATE.chatHistory.slice(0, -2).map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          content: m.text
        })),
        context: contextData,
        language: 'ru',
        simplify: simplify
      }),
      signal: currentAdvisorAbortController.signal
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Ошибка сервера (${res.status})`);
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
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (_) {}
          }
        }
      }
    }

    aiMsg.streaming = false;
    currentAdvisorAbortController = null;
    SOUND.play('ding');
    SOUND.vibrate([25]);
    saveState();
    renderAdvisor();

  } catch (err) {
    currentAdvisorAbortController = null;
    if (err.name === 'AbortError') {
      aiMsg.streaming = false;
      aiMsg.text += ' [Остановлено]';
    } else {
      aiMsg.streaming = false;
      aiMsg.text = `⚠️ Не получилось ответить (${err.message || 'Сбой сети'}). Вы можете попробовать снова.`;
      aiMsg.confidence = 'средняя';
    }
    renderAdvisor();
    saveState();
  }
}

export function clearAdvisorChat() {
  if (currentAdvisorAbortController) currentAdvisorAbortController.abort();
  currentAdvisorAbortController = null;
  APP_STATE.chatHistory = [
    { sender: 'ai', text: 'Новый чат начат. Задайте любой вопрос по бизнесу, финансам, ИИ или работе с приложением!', confidence: 'высокая' }
  ];
  saveState();
  renderAdvisor();
  showToast('Новый чат начат ✓');
}

export function copyAdvisorText(idx) {
  const msg = APP_STATE.chatHistory[idx];
  if (msg && msg.text) {
    navigator.clipboard?.writeText(msg.text);
    SOUND.play('click');
    showToast('Текст скопирован в буфер ✓');
  }
}

export function saveAdvisorToHistory(idx) {
  const msg = APP_STATE.chatHistory[idx];
  if (msg && msg.text) {
    APP_STATE.incomesExpenses.unshift({
      id: 'ie_' + Date.now(),
      type: 'inc',
      amt: 0,
      desc: `💡 ИИ-совет: ${msg.text.slice(0, 40)}...`,
      date: 'Сегодня'
    });
    saveState();
    SOUND.play('coins');
    showToast('Сохранено в журнал истории ✓');
  }
}

export function reportAdvisorFeedback(idx) {
  const promptText = prompt('Пожалуйста, уточните, в чём ошибка (или что уточнить):');
  if (promptText) {
    showToast('Спасибо за отзыв! Отправляем уточняющий запрос...');
    sendAdvisorMessage(`Уточнение к предыдущему ответу: ${promptText}`);
  }
}

export function explainAdvisorSimpler(idx) {
  const lastUserMsg = APP_STATE.chatHistory.filter(m => m.sender === 'user').pop();
  const q = lastUserMsg ? lastUserMsg.text : 'Поясни предыдущий ответ проще';
  sendAdvisorMessage(`Поясни максимальном простым языком для начинающего: ${q}`, true);
}

// ============================================================
// 256+ CURRENCY PICKER BOTTOM SHEET
// ============================================================
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

  if (region === 'popular') {
    filtered = filtered.filter(c => c.popular);
  } else if (region === 'favorites') {
    filtered = filtered.filter(c => APP_STATE.favoritesCurrencies.includes(c.code));
  } else if (region === 'crypto') {
    filtered = filtered.filter(c => c.type === 'crypto');
  } else if (region === 'metals') {
    filtered = filtered.filter(c => c.type === 'metal' || c.type === 'imf');
  } else if (region === 'obsolete') {
    filtered = filtered.filter(c => c.isObsolete);
  } else if (region !== 'all') {
    filtered = filtered.filter(c => c.region === region);
  }

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
              ${c.isApprox ? '<span style="font-size:0.65rem; color:var(--text-muted);">~ориентир</span>' : ''}
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
  if (isObsolete) {
    if (!confirm(`Курс для ${code} устарел. Вы уверены, что хотите выбрать эту валюту?`)) return;
  }

  const oldCode = APP_STATE.currency;
  if (oldCode !== code) {
    const shouldRecalc = confirm(`Пересчитать существующие финансовые данные из ${oldCode} в ${code}?`);
    if (shouldRecalc) {
      const cOld = ALL_CURRENCIES.find(c => c.code === oldCode) || { rate: 1 };
      const cNew = ALL_CURRENCIES.find(c => c.code === code) || { rate: 1 };
      const factor = (cNew.rate || 1) / (cOld.rate || 1);
      APP_STATE.monthData.revenue = Math.round(APP_STATE.monthData.revenue * factor);
      APP_STATE.monthData.rent = Math.round(APP_STATE.monthData.rent * factor);
      APP_STATE.monthData.salary = Math.round(APP_STATE.monthData.salary * factor);
      APP_STATE.monthData.ads = Math.round(APP_STATE.monthData.ads * factor);
    }
    APP_STATE.currency = code;
    saveState();
    SOUND.play('ding');
    showToast(`Валюта по умолчанию: ${code}`);
  }

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
