import { APP_STATE, saveState, showToast, $, $$, formatMoney, getCurrentCurrency, getCurrentNiche, navigateToScreen } from './app.js';
import { GLOSSARY, HELP_FAQS } from './glossary.js';
import { ALL_NICHES, NICHE_CATEGORIES } from './niches.js';
import { SOUND } from './sound.js';

// ============================================================
// COREMAX AI — UNIVERSAL TOOLS REGISTRY
// ============================================================

export const TOOLS_REGISTRY = {
  // 1. Скидки и акции
  discount: {
    id: 'discount',
    name: 'Скидки и акции',
    icon: '🏷️',
    group: 'calculations',
    calc: (p = 100, c = 60, d = 10) => {
      const price = Number(p) || 0;
      const cost = Number(c) || 0;
      const discountPct = Number(d) || 0;
      
      const newPrice = price * (1 - discountPct / 100);
      const baseUnitMargin = price - cost;
      const newUnitMargin = newPrice - cost;
      
      const isProfitable = newUnitMargin > 0;
      const multiplier = isProfitable ? (baseUnitMargin / newUnitMargin) : 0;
      const growthPct = isProfitable ? (multiplier - 1) * 100 : 0;
      
      return {
        price,
        cost,
        discountPct,
        newPrice: Number(newPrice.toFixed(2)),
        baseUnitMargin: Number(baseUnitMargin.toFixed(2)),
        newUnitMargin: Number(newUnitMargin.toFixed(2)),
        isProfitable,
        multiplier: Number(multiplier.toFixed(2)),
        growthPct: Number(growthPct.toFixed(1))
      };
    },
    render: () => renderDiscountTool()
  },

  // 2. Счета и сметы
  invoice: {
    id: 'invoice',
    name: 'Счета и сметы',
    icon: '🧾',
    group: 'calculations',
    calc: (items = [{ name: 'Услуга', qty: 1, price: 10000 }], discountPct = 0, vatPct = 0) => {
      const subtotal = items.reduce((acc, item) => acc + (Number(item.qty) || 0) * (Number(item.price) || 0), 0);
      const discountAmt = subtotal * (Number(discountPct || 0) / 100);
      const afterDiscount = subtotal - discountAmt;
      const vatAmt = afterDiscount * (Number(vatPct || 0) / 100);
      const total = afterDiscount + vatAmt;
      
      return {
        items,
        subtotal: Math.round(subtotal),
        discountAmt: Math.round(discountAmt),
        vatAmt: Math.round(vatAmt),
        total: Math.round(total)
      };
    },
    render: () => renderInvoiceTool()
  },

  // 3. Налоги и взносы
  taxes: {
    id: 'taxes',
    name: 'Налоги и взносы',
    icon: '📑',
    group: 'calculations',
    calc: (system = 'usn6', income = 500000, expense = 350000) => {
      const inc = Number(income) || 0;
      const exp = Number(expense) || 0;
      let tax = 0;
      let rateDesc = '';
      if (system === 'usn6') {
        tax = inc * 0.06;
        rateDesc = 'УСН Доходы (6%)';
      } else if (system === 'usn15') {
        const base = Math.max(0, inc - exp);
        tax = Math.max(inc * 0.01, base * 0.15); // мин. 1%
        rateDesc = 'УСН Доходы минус расходы (15%)';
      } else if (system === 'self') {
        tax = inc * 0.04;
        rateDesc = 'НПД (Самозанятый 4-6%)';
      } else if (system === 'patent') {
        tax = 35000;
        rateDesc = 'Патент (ориентировочно)';
      }
      return { system, income: inc, expense: exp, tax: Math.round(tax), rateDesc };
    },
    render: () => renderTaxesTool()
  },

  // 4. Зарплаты и бонусы
  salaries: {
    id: 'salaries',
    name: 'Зарплаты и бонусы',
    icon: '👥',
    group: 'calculations',
    calc: (base = 80000, kpi = 20000) => {
      const gross = (Number(base) || 0) + (Number(kpi) || 0);
      const ndfl = gross * 0.13;
      const net = gross - ndfl;
      const insurance = gross * 0.30;
      const totalCost = gross + insurance;
      return {
        base,
        kpi,
        gross: Math.round(gross),
        ndfl: Math.round(ndfl),
        net: Math.round(net),
        insurance: Math.round(insurance),
        totalCost: Math.round(totalCost)
      };
    },
    render: () => renderSalariesTool()
  },

  // 5. Учёт долгов
  debts: {
    id: 'debts',
    name: 'Учёт долгов и займов',
    icon: '🤝',
    group: 'management',
    calc: (debtsList = []) => {
      const weOwe = debtsList.filter(d => d.type === 'we_owe').reduce((acc, d) => acc + (Number(d.amt) || 0), 0);
      const theyOwe = debtsList.filter(d => d.type === 'they_owe').reduce((acc, d) => acc + (Number(d.amt) || 0), 0);
      return { weOwe: Math.round(weOwe), theyOwe: Math.round(theyOwe), balance: Math.round(theyOwe - weOwe) };
    },
    render: () => renderDebtsTool()
  },

  // 6. Мини-CRM клиенты
  crm: {
    id: 'crm',
    name: 'Мини-CRM клиенты',
    icon: '👤',
    group: 'management',
    calc: (clients = []) => {
      const totalLtv = clients.reduce((acc, c) => acc + (Number(c.ltv) || 0), 0);
      const avgLtv = clients.length ? Math.round(totalLtv / clients.length) : 0;
      return { totalClients: clients.length, totalLtv: Math.round(totalLtv), avgLtv };
    },
    render: () => renderCrmTool()
  },

  // 7. Конкуренты
  competitors: {
    id: 'competitors',
    name: 'Анализ конкурентов',
    icon: '🎯',
    group: 'calculations',
    calc: (myPrice = 1500, competitors = [{ name: 'Конкурент А', price: 1400 }, { name: 'Конкурент Б', price: 1800 }]) => {
      const myP = Number(myPrice) || 0;
      const prices = competitors.map(c => Number(c.price) || 0).filter(p => p > 0);
      const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : myP;
      const minPrice = prices.length ? Math.min(...prices) : myP;
      const maxPrice = prices.length ? Math.max(...prices) : myP;
      const diffVsAvg = avgPrice > 0 ? ((myP - avgPrice) / avgPrice) * 100 : 0;
      
      return {
        myPrice: myP,
        avgPrice: Math.round(avgPrice),
        minPrice: Math.round(minPrice),
        maxPrice: Math.round(maxPrice),
        diffVsAvg: Number(diffVsAvg.toFixed(1))
      };
    },
    render: () => renderCompetitorsTool()
  },

  // 4. Импорт выписки CSV
  csv_import: {
    id: 'csv_import',
    name: 'Импорт выписки CSV',
    icon: '📥',
    group: 'calculations',
    calc: (csvText = '') => parseBankCsv(csvText),
    render: () => renderCsvImportTool()
  },

  // 5. Цели и привычки
  goals: {
    id: 'goals',
    name: 'Цели и привычки',
    icon: '🏆',
    group: 'management',
    calc: (targetProfit = 300000, currentProfit = 150000) => {
      const t = Number(targetProfit) || 1;
      const c = Number(currentProfit) || 0;
      const progressPct = Math.min(100, Math.max(0, (c / t) * 100));
      const remaining = Math.max(0, t - c);
      return {
        targetProfit: t,
        currentProfit: c,
        progressPct: Number(progressPct.toFixed(1)),
        remaining: Math.round(remaining)
      };
    },
    render: () => renderGoalsTool()
  },

  // 6. Калькуляторы (5 вкладок)
  calculators: {
    id: 'calculators',
    name: 'Бизнес-калькуляторы',
    icon: '🧮',
    group: 'calculations',
    calc: (type = 'bep', p1 = 3000, p2 = 50, p3 = 20) => {
      if (type === 'bep') {
        const fixed = Number(p1) || 0;
        const price = Number(p2) || 0;
        const varCost = Number(p3) || 0;
        const unitMargin = price - varCost;
        const units = unitMargin > 0 ? Math.ceil(fixed / unitMargin) : 0;
        const revenue = units * price;
        return { units, revenue, unitMargin };
      }
      if (type === 'markup') {
        const price = Number(p1) || 0;
        const cost = Number(p2) || 0;
        const markupPct = cost > 0 ? ((price - cost) / cost) * 100 : 0;
        return { markupPct: Number(markupPct.toFixed(1)) };
      }
      if (type === 'runway') {
        const balance = Number(p1) || 0;
        const dailyExp = Number(p2) || 1;
        const days = dailyExp > 0 ? Math.floor(balance / dailyExp) : 0;
        return { days };
      }
      if (type === 'ads') {
        const rev = Number(p1) || 0;
        const adSpend = Number(p2) || 1;
        const clients = Number(p3) || 1;
        const roas = adSpend > 0 ? (rev / adSpend) : 0;
        const cac = clients > 0 ? (adSpend / clients) : 0;
        return { roas: Number(roas.toFixed(2)), cac: Math.round(cac) };
      }
      if (type === 'tax') {
        const base = Number(p1) || 0;
        const rate = Number(p2) || 6;
        const tax = base * (rate / 100);
        return { tax: Math.round(tax) };
      }
      return {};
    },
    render: () => renderCalculatorsTool()
  },

  // 7. Деньги и кассовые разрывы (+ Кредиты)
  cashflow: {
    id: 'cashflow',
    name: 'Деньги и разрывы (Кредиты)',
    icon: '💸',
    group: 'calculations',
    calc: (loanAmt = 10000, annualRate = 12, months = 12) => {
      const P = Number(loanAmt) || 0;
      const r = (Number(annualRate) || 0) / 12 / 100;
      const n = Number(months) || 1;
      
      let monthlyPayment = 0;
      if (r > 0) {
        monthlyPayment = P * (r / (1 - Math.pow(1 + r, -n)));
      } else {
        monthlyPayment = P / n;
      }
      
      const totalPaid = monthlyPayment * n;
      const overpayment = totalPaid - P;
      
      return {
        loanAmt: P,
        annualRate,
        months: n,
        monthlyPayment: Number(monthlyPayment.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        overpayment: Number(overpayment.toFixed(2))
      };
    },
    render: () => renderCashflowTool()
  },

  // 8. Клиенты, кадры, склад
  crm_hr_stock: {
    id: 'crm_hr_stock',
    name: 'Клиенты, кадры, склад',
    icon: '👥',
    group: 'management',
    calc: (rev = 500000, staff = 4, totalClients = 200, repeatClients = 70) => {
      const productivity = staff > 0 ? Math.round(rev / staff) : 0;
      const repeatPct = totalClients > 0 ? Number(((repeatClients / totalClients) * 100).toFixed(1)) : 0;
      return { productivity, repeatPct };
    },
    render: () => renderCrmHrStockTool()
  },

  // 9. Юнит-экономика и ABC-анализ
  unit_abc: {
    id: 'unit_abc',
    name: 'Юнит-экономика & ABC',
    icon: '📊',
    group: 'calculations',
    calc: (aov = 2000, ordersPerYear = 4, years = 2, marginPct = 30, cac = 800) => {
      const ltv = aov * ordersPerYear * years * (marginPct / 100);
      const ratio = cac > 0 ? (ltv / cac) : 0;
      const monthlyMargin = (aov * ordersPerYear * (marginPct / 100)) / 12;
      const paybackMonths = monthlyMargin > 0 ? (cac / monthlyMargin) : 0;
      
      return {
        ltv: Math.round(ltv),
        cac,
        ratio: Number(ratio.toFixed(2)),
        paybackMonths: Number(paybackMonths.toFixed(1))
      };
    },
    render: () => renderUnitAbcTool()
  },

  // 10. Генератор текстов (AI)
  copywriter: {
    id: 'copywriter',
    name: 'Генератор текстов',
    icon: '✍️',
    group: 'ai',
    calc: () => ({ status: 'ai_ready' }),
    render: () => renderCopywriterTool()
  },

  // 11. Названия & Слоганы (AI)
  slogans: {
    id: 'slogans',
    name: 'Названия & Слоганы',
    icon: '✨',
    group: 'ai',
    calc: () => ({ status: 'ai_ready' }),
    render: () => renderSlogansTool()
  },

  // 12. Генератор Бизнес-плана (AI)
  business_plan: {
    id: 'business_plan',
    name: 'Генератор Бизнес-плана',
    icon: '📋',
    group: 'ai',
    calc: () => ({ status: 'ai_ready' }),
    render: () => renderBusinessPlanTool()
  },

  // 13. Бизнес-модель Canvas
  canvas: {
    id: 'canvas',
    name: 'Бизнес-модель Canvas',
    icon: '🗺️',
    group: 'ai',
    calc: () => ({ blocks: 9 }),
    render: () => renderCanvasTool()
  },

  // 11. Контент-план на 4 недели
  content_plan: {
    id: 'content_plan',
    name: 'Контент-план 4 недели',
    icon: '📅',
    group: 'ai',
    calc: () => ({ days: 28 }),
    render: () => renderContentPlanTool()
  },

  // 12. Разговоры с клиентами (Скрипты)
  sales_scripts: {
    id: 'sales_scripts',
    name: 'Скрипты продаж & Возражения',
    icon: '💬',
    group: 'ai',
    calc: () => ({ score: 95 }),
    render: () => renderSalesScriptsTool()
  },

  // 13. Сбор отзывов (NPS)
  reviews_nps: {
    id: 'reviews_nps',
    name: 'Сбор отзывов & NPS',
    icon: '⭐',
    group: 'ai',
    calc: (promoters = 70, passives = 20, detractors = 10) => {
      const total = promoters + passives + detractors;
      const nps = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;
      return { nps, total };
    },
    render: () => renderReviewsNpsTool()
  },

  // 14. Режим просмотра (PIN)
  security_pin: {
    id: 'security_pin',
    name: 'Безопасность & PIN',
    icon: '🔒',
    group: 'settings',
    calc: () => ({ isLocked: Boolean(APP_STATE.pin) }),
    render: () => renderSecurityPinTool()
  },

  // 15. Бизнесы (Мульти-профиль)
  multi_business: {
    id: 'multi_business',
    name: 'Профили бизнесов',
    icon: '🏢',
    group: 'settings',
    calc: () => ({ count: (APP_STATE.businesses || []).length + 1 }),
    render: () => renderMultiBusinessTool()
  },

  // 16. Резервная копия
  backup: {
    id: 'backup',
    name: 'Резервная копия',
    icon: '💾',
    group: 'settings',
    calc: () => ({ bytes: JSON.stringify(APP_STATE).length }),
    render: () => renderBackupTool()
  },

  // 17. Напоминания (.ics)
  reminders: {
    id: 'reminders',
    name: 'Напоминания & Календарь',
    icon: '⏰',
    group: 'management',
    calc: () => ({ activeCount: (APP_STATE.reminders || []).length }),
    render: () => renderRemindersTool()
  },

  // 18. Словарик терминов
  glossary: {
    id: 'glossary',
    name: 'Словарик терминов',
    icon: '📖',
    group: 'education',
    calc: () => ({ termsCount: GLOSSARY.length }),
    render: () => renderGlossaryTool()
  },

  // 19. Оформление и сброс
  settings_reset: {
    id: 'settings_reset',
    name: 'Оформление & Сброс',
    icon: '⚙️',
    group: 'settings',
    calc: () => ({ theme: APP_STATE.theme }),
    render: () => renderSettingsResetTool()
  },

  // 20. Валюта по умолчанию
  currency_default: {
    id: 'currency_default',
    name: 'Валюта по умолчанию',
    icon: '💱',
    group: 'settings',
    calc: () => ({ currency: APP_STATE.currency }),
    render: () => {
      window.APP.openCurrencyPicker();
    }
  },

  // 21. Язык приложения (36 языков)
  language_picker: {
    id: 'language_picker',
    name: 'Язык приложения (36 языков)',
    icon: '🌐',
    group: 'settings',
    calc: () => ({ lang: APP_STATE.lang || 'ru' }),
    render: () => {
      window.APP.openLanguagePicker();
    }
  },

  // 22. Помощь и обучение
  help_faq: {
    id: 'help_faq',
    name: 'Помощь и обучение',
    icon: '❓',
    group: 'education',
    calc: () => ({ faqsCount: HELP_FAQS.length }),
    render: () => renderHelpFaqTool()
  },

  // 22. Достижения
  achievements: {
    id: 'achievements',
    name: 'Награды и достижения',
    icon: '👑',
    group: 'education',
    calc: () => ({ unlocked: Boolean(APP_STATE.achievementTriggered) }),
    render: () => renderAchievementsTool()
  },

  // 23. О приложении
  about_app: {
    id: 'about_app',
    name: 'О CoreMaX AI & @tojprogs',
    icon: 'ℹ️',
    group: 'education',
    calc: () => ({ version: '3.5.0' }),
    render: () => renderAboutAppTool()
  }
};

// ============================================================
// UNIVERSAL TOOL OPENER WITH TRY/CATCH & RETRY
// ============================================================
export function openToolModal(toolId) {
  try {
    SOUND.play('click');
    window.APP.closeDrawer();
    
    const tool = TOOLS_REGISTRY[toolId];
    if (!tool) {
      throw new Error(`Инструмент с ID "${toolId}" не найден в реестре.`);
    }

    const modal = $('#modal-tool-runner');
    const title = $('#tool-runner-title');
    const body = $('#tool-runner-body');
    
    if (!modal || !title || !body) return;

    title.innerHTML = `<span>${tool.icon}</span> <span>${tool.name}</span>`;
    
    // Execute tool's individual render function
    tool.render();
    modal.classList.add('open');
  } catch (err) {
    console.error('Tool Runner Error:', err);
    renderToolError(toolId, err.message);
  }
}

export function renderToolError(toolId, errMsg) {
  const modal = $('#modal-tool-runner');
  const title = $('#tool-runner-title');
  const body = $('#tool-runner-body');
  if (!modal || !title || !body) return;

  title.textContent = '⚠️ Ошибка модуля';
  body.innerHTML = `
    <div style="text-align:center; padding:20px; display:flex; flex-direction:column; gap:12px;">
      <div style="font-size:2.5rem;">⚠️</div>
      <div style="font-weight:800; font-size:1rem; color:var(--rose-primary);">Не удалось загрузить: ${toolId}</div>
      <div style="font-size:0.8rem; color:var(--text-secondary); background:var(--bg-input); padding:10px; border-radius:var(--radius-sm);">${errMsg}</div>
      <button type="button" class="btn btn-gold" onclick="window.APP.openToolModal('${toolId}')" style="width:100%;">
        🔄 Повторить попытку
      </button>
    </div>
  `;
  modal.classList.add('open');
}

// Universal copy / PDF / save helpers for any tool
export function copyResultText(text) {
  navigator.clipboard?.writeText(text).then(() => {
    SOUND.play('click');
    showToast('📋 Результат скопирован в буфер ✓');
  }).catch(() => {
    showToast('Не удалось скопировать');
  });
}

export function saveResultToHistory(toolName, resultSummary) {
  const cur = getCurrentCurrency();
  APP_STATE.incomesExpenses.unshift({
    id: 'ie_' + Date.now(),
    type: 'inc',
    amt: 0,
    desc: `📊 ${toolName}: ${resultSummary}`,
    date: 'Сегодня'
  });
  saveState();
  SOUND.play('coins');
  showToast('💾 Сохранено в историю ✓');
}

export function printOrPdfResult(title, contentHtml) {
  const cur = getCurrentCurrency();
  const niche = getCurrentNiche();
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Разрешите всплывающие окна для печати PDF');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} — CoreMaX AI</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #111; max-width: 700px; margin: 0 auto; }
        h1 { color: #d97706; font-size: 22px; border-bottom: 2px solid #d97706; padding-bottom: 8px; }
        .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
        .highlight { font-size: 20px; font-weight: bold; color: #059669; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
        th { background: #f1f5f9; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">Бизнес-аналитика: <b>${niche.name}</b> | Валюта: <b>${cur.code} (${cur.sym})</b> | Дата: ${new Date().toLocaleDateString('ru-RU')}</div>
      ${contentHtml}
      <div style="margin-top:30px; font-size:11px; color:#888; text-align:center;">Сгенерировано в CoreMaX AI • Инструменты предпринимателя</div>
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// ============================================================
// 1. TOOL: СКИДКИ И АКЦИИ
// ============================================================
function renderDiscountTool() {
  const body = $('#tool-runner-body');
  const cur = getCurrentCurrency();
  const res = TOOLS_REGISTRY.discount.calc(100, 60, 10);

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase;">Калькулятор безопасных скидок</div>
        <div style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;">Рассчитайте, на сколько должны вырасти продажи, чтобы скидка не увела бизнес в убыток.</div>
      </div>

      <div class="card">
        <div class="field-group">
          <label class="field-label">Исходная цена продажи (${cur.sym})</label>
          <input type="number" id="disc-inp-price" class="input-control" value="100" min="1" oninput="window.APP.recalcDiscountTool()">
        </div>
        <div class="field-group">
          <label class="field-label">Себестоимость товара / COGS (${cur.sym})</label>
          <input type="number" id="disc-inp-cost" class="input-control" value="60" min="0" oninput="window.APP.recalcDiscountTool()">
        </div>
        <div class="field-group">
          <label class="field-label">Размер скидки (%)</label>
          <input type="number" id="disc-inp-pct" class="input-control" value="10" min="1" max="99" oninput="window.APP.recalcDiscountTool()">
        </div>
      </div>

      <div class="card card-gold" id="disc-result-card">
        <!-- Injected via recalcDiscountTool -->
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">
        <button type="button" class="btn btn-secondary" onclick="window.APP.saveDiscountResult()">💾 Сохранить</button>
        <button type="button" class="btn btn-secondary" onclick="window.APP.copyDiscountResult()">📋 Копировать</button>
        <button type="button" class="btn btn-gold" onclick="window.APP.printDiscountResult()">📄 PDF</button>
      </div>
    </div>
  `;

  recalcDiscountTool();
}

export function recalcDiscountTool() {
  const p = Number($('#disc-inp-price')?.value) || 0;
  const c = Number($('#disc-inp-cost')?.value) || 0;
  const d = Number($('#disc-inp-pct')?.value) || 0;
  const cur = getCurrentCurrency();

  const card = $('#disc-result-card');
  if (!card) return;

  if (p <= 0 || c < 0 || d <= 0 || d >= 100) {
    card.innerHTML = `<div style="color:var(--rose-primary); font-size:0.82rem; text-align:center;">Пожалуйста, введите корректные положительные числа.</div>`;
    return;
  }

  const res = TOOLS_REGISTRY.discount.calc(p, c, d);

  if (!res.isProfitable) {
    card.innerHTML = `
      <div style="color:var(--rose-primary); font-weight:800; font-size:1.1rem; text-align:center;">⚠️ Скидка невыгодна!</div>
      <div style="font-size:0.8rem; color:var(--text-secondary); text-align:center; margin-top:4px;">
        Новая цена (<b>${formatMoney(res.newPrice)} ${cur.sym}</b>) ниже или равна себестоимости (<b>${formatMoney(res.cost)} ${cur.sym}</b>). Каждая продажа генерирует прямой убыток.
      </div>
    `;
    return;
  }

  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">Новая цена со скидкой</span>
      <span class="badge badge-profit">Маржа: ${res.newUnitMargin} ${cur.sym}/шт</span>
    </div>
    <div style="font-size:1.8rem; font-weight:800; font-family:var(--font-display); color:var(--gold-primary); margin:4px 0;">
      ${formatMoney(res.newPrice)} ${cur.sym}
    </div>
    <div style="font-size:0.85rem; color:var(--text-primary); border-top:1px solid var(--border-subtle); padding-top:8px; margin-top:6px; line-height:1.5;">
      💡 Чтобы сохранить прежний доход, продажи должны вырасти в <b>${res.multiplier} раза</b> (на <b style="color:var(--emerald-primary);">+${res.growthPct}%</b>).
    </div>
  `;
}

// ============================================================
// 2. TOOL: СЧЕТА И СМЕТЫ
// ============================================================
let INVOICE_ITEMS = [
  { name: 'Консультация по оптимизации процессов', qty: 1, price: 25000 },
  { name: 'Настройка автоматизации CoreMaX AI', qty: 1, price: 40000 }
];

function renderInvoiceTool() {
  const body = $('#tool-runner-body');
  const cur = getCurrentCurrency();

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:800; font-size:1rem; color:var(--text-primary);">Счёт № СЧ-${Math.floor(Date.now() / 1000).toString().slice(-4)}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${new Date().toLocaleDateString('ru-RU')}</div>
          </div>
          <button type="button" class="btn-chip" onclick="window.APP.addInvoiceRow()">+ Позиция</button>
        </div>
      </div>

      <div class="card">
        <div style="font-size:0.8rem; font-weight:700; margin-bottom:8px;">Позиции счёта:</div>
        <div id="invoice-items-table" style="display:flex; flex-direction:column; gap:6px;"></div>
      </div>

      <div class="card">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div class="field-group">
            <label class="field-label">Скидка на весь счёт (%)</label>
            <input type="number" id="inv-discount-pct" class="input-control" value="0" min="0" max="90" oninput="window.APP.recalcInvoiceTotal()">
          </div>
          <div class="field-group">
            <label class="field-label">НДС (%)</label>
            <input type="number" id="inv-vat-pct" class="input-control" value="0" min="0" max="30" oninput="window.APP.recalcInvoiceTotal()">
          </div>
        </div>
        <div style="background:var(--bg-input); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-gold); text-align:center; margin-top:8px;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">Итого к оплате</div>
          <div id="inv-final-total" style="font-size:2rem; font-weight:800; font-family:var(--font-display); color:var(--gold-primary);">0 ${cur.sym}</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">
        <button type="button" class="btn btn-secondary" onclick="window.APP.saveInvoiceToHistory()">💾 Сохранить</button>
        <button type="button" class="btn btn-secondary" onclick="window.APP.copyInvoiceText()">📋 Копировать</button>
        <button type="button" class="btn btn-gold" onclick="window.APP.printInvoicePdf()">📄 PDF</button>
      </div>
    </div>
  `;

  renderInvoiceRows();
}

function renderInvoiceRows() {
  const container = $('#invoice-items-table');
  const cur = getCurrentCurrency();
  if (!container) return;

  container.innerHTML = INVOICE_ITEMS.map((it, idx) => `
    <div style="display:grid; grid-template-columns:1.8fr 0.8fr 1fr 32px; gap:4px; align-items:center; background:var(--bg-input); padding:6px 8px; border-radius:var(--radius-sm);">
      <input type="text" class="input-control" value="${it.name}" placeholder="Наименование" style="height:36px; font-size:0.75rem;" oninput="window.APP.updateInvoiceItem(${idx}, 'name', this.value)">
      <input type="number" class="input-control" value="${it.qty}" placeholder="Кол-во" style="height:36px; font-size:0.75rem;" oninput="window.APP.updateInvoiceItem(${idx}, 'qty', this.value)">
      <input type="number" class="input-control" value="${it.price}" placeholder="Цена" style="height:36px; font-size:0.75rem;" oninput="window.APP.updateInvoiceItem(${idx}, 'price', this.value)">
      <button type="button" class="btn-chip" onclick="window.APP.deleteInvoiceRow(${idx})" style="height:36px; padding:0; color:var(--rose-primary);">✕</button>
    </div>
  `).join('');

  recalcInvoiceTotal();
}

export function recalcInvoiceTotal() {
  const dPct = Number($('#inv-discount-pct')?.value) || 0;
  const vPct = Number($('#inv-vat-pct')?.value) || 0;
  const cur = getCurrentCurrency();

  const res = TOOLS_REGISTRY.invoice.calc(INVOICE_ITEMS, dPct, vPct);
  const totalEl = $('#inv-final-total');
  if (totalEl) {
    totalEl.textContent = `${formatMoney(res.total)} ${cur.sym}`;
  }
}

// ============================================================
// 3. TOOL: НАЛОГИ И ВЗНОСЫ
// ============================================================
function renderTaxesTool() {
  const body = $('#tool-runner-body');
  const cur = getCurrentCurrency();
  const d = APP_STATE.monthData;

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase;">Калькулятор налоговой нагрузки</div>
        <div style="font-size:1.8rem; font-weight:800; font-family:var(--font-display); color:var(--rose-primary); margin:4px 0;" id="tax-tool-result">
          <!-- Recalculated -->
        </div>
        <div id="tax-tool-desc" style="font-size:0.8rem; color:var(--text-muted);">УСН Доходы (6%)</div>
      </div>

      <div class="card">
        <div class="field-group">
          <label class="field-label">Система налогообложения</label>
          <select id="tax-tool-system" class="input-control" onchange="window.APP.recalcTaxesTool()">
            <option value="usn6">УСН Доходы (6%)</option>
            <option value="usn15">УСН Доходы минус Расходы (15%)</option>
            <option value="self">Самозанятый / НПД (4-6%)</option>
            <option value="patent">Патент (Фиксированный)</option>
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Доход / Выручка (${cur.sym})</label>
          <input type="number" id="tax-tool-inc" class="input-control" value="${d.revenue || 500000}" oninput="window.APP.recalcTaxesTool()">
        </div>
        <div class="field-group" id="tax-tool-exp-wrap">
          <label class="field-label">Подтвержденные расходы (${cur.sym})</label>
          <input type="number" id="tax-tool-exp" class="input-control" value="${(Number(d.rent)||0) + (Number(d.salary)||0) + (Number(d.ads)||0)}" oninput="window.APP.recalcTaxesTool()">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
        <button type="button" class="btn btn-secondary" onclick="window.APP.copyTaxResult()">📋 Копировать</button>
        <button type="button" class="btn btn-gold" onclick="window.APP.printTaxReport()">📄 PDF расчет</button>
      </div>
    </div>
  `;

  recalcTaxesTool();
}

export function recalcTaxesTool() {
  const sys = $('#tax-tool-system')?.value || 'usn6';
  const inc = Number($('#tax-tool-inc')?.value) || 0;
  const exp = Number($('#tax-tool-exp')?.value) || 0;
  const cur = getCurrentCurrency();

  const res = TOOLS_REGISTRY.taxes.calc(sys, inc, exp);
  const resEl = $('#tax-tool-result');
  const descEl = $('#tax-tool-desc');
  if (resEl) resEl.textContent = `${formatMoney(res.tax)} ${cur.sym}`;
  if (descEl) descEl.textContent = `${res.rateDesc} • Эффективная ставка: ${(inc > 0 ? (res.tax / inc) * 100 : 0).toFixed(1)}%`;
}

// ============================================================
// 4. TOOL: ЗАРПЛАТЫ И БОНУСЫ (ФОТ)
// ============================================================
function renderSalariesTool() {
  const body = $('#tool-runner-body');
  const cur = getCurrentCurrency();

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">Полные затраты бизнеса на сотрудника</div>
        <div style="font-size:1.9rem; font-weight:800; font-family:var(--font-display); color:var(--gold-primary); margin:4px 0;" id="sal-res-total">
          <!-- Recalculated -->
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-secondary); border-top:1px solid var(--border-subtle); padding-top:6px; margin-top:4px;">
          <span>На руки (Net): <b id="sal-res-net" style="color:var(--emerald-primary);">0 ${cur.sym}</b></span>
          <span>НДФЛ 13%: <b id="sal-res-ndfl">0 ${cur.sym}</b></span>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
          Взносы в фонды (30%): <b id="sal-res-ins">0 ${cur.sym}</b>
        </div>
      </div>

      <div class="card">
        <div class="field-group">
          <label class="field-label">Оклад (до вычета налогов, Gross, ${cur.sym})</label>
          <input type="number" id="sal-inp-base" class="input-control" value="80000" oninput="window.APP.recalcSalariesTool()">
        </div>
        <div class="field-group">
          <label class="field-label">KPI / Премия / Бонус (${cur.sym})</label>
          <input type="number" id="sal-inp-kpi" class="input-control" value="20000" oninput="window.APP.recalcSalariesTool()">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
        <button type="button" class="btn btn-secondary" onclick="window.APP.copySalaryResult()">📋 Копировать</button>
        <button type="button" class="btn btn-gold" onclick="window.APP.printSalaryPdf()">📄 PDF расчёт</button>
      </div>
    </div>
  `;

  recalcSalariesTool();
}

export function recalcSalariesTool() {
  const base = Number($('#sal-inp-base')?.value) || 0;
  const kpi = Number($('#sal-inp-kpi')?.value) || 0;
  const cur = getCurrentCurrency();

  const res = TOOLS_REGISTRY.salaries.calc(base, kpi);
  if ($('#sal-res-total')) $('#sal-res-total').textContent = `${formatMoney(res.totalCost)} ${cur.sym}`;
  if ($('#sal-res-net')) $('#sal-res-net').textContent = `${formatMoney(res.net)} ${cur.sym}`;
  if ($('#sal-res-ndfl')) $('#sal-res-ndfl').textContent = `${formatMoney(res.ndfl)} ${cur.sym}`;
  if ($('#sal-res-ins')) $('#sal-res-ins').textContent = `${formatMoney(res.insurance)} ${cur.sym}`;
}

// ============================================================
// 5. TOOL: УЧЁТ ДОЛГОВ
// ============================================================
let DEBTS_LIST = [
  { id: 'd1', name: 'ООО "Поставщик Зерна"', amt: 45000, type: 'we_owe', date: 'до 15 числа' },
  { id: 'd2', name: 'ИП Смирнов (Кейтеринг)', amt: 30000, type: 'they_owe', date: 'до конца месяца' }
];

function renderDebtsTool() {
  const body = $('#tool-runner-body');
  const cur = getCurrentCurrency();
  const res = TOOLS_REGISTRY.debts.calc(DEBTS_LIST);

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div>
            <div style="font-size:0.72rem; text-transform:uppercase; color:var(--text-secondary);">Нам должны</div>
            <div style="font-size:1.3rem; font-weight:800; color:var(--emerald-primary);" id="debts-they-owe">${formatMoney(res.theyOwe)} ${cur.sym}</div>
          </div>
          <div>
            <div style="font-size:0.72rem; text-transform:uppercase; color:var(--text-secondary);">Мы должны</div>
            <div style="font-size:1.3rem; font-weight:800; color:var(--rose-primary);" id="debts-we-owe">${formatMoney(res.weOwe)} ${cur.sym}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:0.8rem; font-weight:700;">Список задолженностей:</span>
          <button type="button" class="btn-chip" onclick="window.APP.addDebtItemModal()">+ Добавить</button>
        </div>
        <div id="debts-items-box" style="display:flex; flex-direction:column; gap:6px;">
          ${DEBTS_LIST.map((d, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
              <div>
                <div style="font-weight:700; font-size:0.85rem;">${d.name}</div>
                <div style="font-size:0.7rem; color:var(--text-muted);">${d.date} • <span style="color:${d.type === 'they_owe' ? 'var(--emerald-primary)' : 'var(--rose-primary)'};">${d.type === 'they_owe' ? 'Нам должны' : 'Мы должны'}</span></div>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <b style="font-size:0.9rem; color:${d.type === 'they_owe' ? 'var(--emerald-primary)' : 'var(--rose-primary)'};">${formatMoney(d.amt)} ${cur.sym}</b>
                <button type="button" class="btn-chip" onclick="window.APP.deleteDebtItem(${idx})" style="padding:0 4px; color:var(--rose-primary);">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 6. TOOL: МИНИ-CRM КЛИЕНТЫ
// ============================================================
let CRM_CLIENTS = [
  { name: 'Алексей (Корпоративный)', phone: '+7 (999) 123-45-67', status: 'VIP', ltv: 120000, note: 'Заказывает кофе и ланчи в офис' },
  { name: 'Мария В.', phone: '+7 (911) 987-65-43', status: 'Постоянный', ltv: 45000, note: 'Любит матча-латте' }
];

function renderCrmTool() {
  const body = $('#tool-runner-body');
  const cur = getCurrentCurrency();
  const res = TOOLS_REGISTRY.crm.calc(CRM_CLIENTS);

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div>
            <div style="font-size:0.72rem; text-transform:uppercase; color:var(--text-secondary);">Всего клиентов</div>
            <div style="font-size:1.3rem; font-weight:800; color:var(--gold-primary);">${res.totalClients} чел.</div>
          </div>
          <div>
            <div style="font-size:0.72rem; text-transform:uppercase; color:var(--text-secondary);">Средний LTV</div>
            <div style="font-size:1.3rem; font-weight:800; color:var(--emerald-primary);">${formatMoney(res.avgLtv)} ${cur.sym}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:0.8rem; font-weight:700;">База клиентов:</span>
          <button type="button" class="btn-chip" onclick="window.APP.addCrmClientModal()">+ Клиент</button>
        </div>
        <div id="crm-clients-box" style="display:flex; flex-direction:column; gap:6px;">
          ${CRM_CLIENTS.map((c, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
              <div>
                <div style="font-weight:700; font-size:0.85rem; display:flex; align-items:center; gap:6px;">
                  ${c.name} <span class="badge badge-profit" style="font-size:0.65rem;">${c.status}</span>
                </div>
                <div style="font-size:0.7rem; color:var(--text-muted);">${c.phone} • ${c.note}</div>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <b style="font-size:0.9rem; color:var(--gold-primary);">${formatMoney(c.ltv)} ${cur.sym}</b>
                <button type="button" class="btn-chip" onclick="window.APP.deleteCrmClient(${idx})" style="padding:0 4px; color:var(--rose-primary);">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 3. TOOL: КОНКУРЕНТЫ
// ============================================================
let COMPETITORS_LIST = [
  { name: 'Лидер рынка «А»', price: 1800, strengths: 'Сильный бренд, сеть' },
  { name: 'Дискаунтер «Б»', price: 1200, strengths: 'Низкая цена, поток' },
  { name: 'Крафтовый конкурент «В»', price: 1600, strengths: 'Качественный сервис' }
];

function renderCompetitorsTool() {
  const body = $('#tool-runner-body');
  const cur = getCurrentCurrency();

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div class="field-group" style="margin:0;">
          <label class="field-label">Ваша цена (${cur.sym})</label>
          <input type="number" id="comp-my-price" class="input-control" value="1500" oninput="window.APP.recalcCompetitorsTool()">
        </div>
      </div>

      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:0.8rem; font-weight:700;">Цены конкурентов:</span>
          <button type="button" class="btn-chip" onclick="window.APP.addCompetitorRow()">+ Добавить</button>
        </div>
        <div id="comp-items-box" style="display:flex; flex-direction:column; gap:6px;"></div>
      </div>

      <div class="card card-gold" id="comp-analytics-box">
        <!-- Recalculated -->
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
        <button type="button" class="btn btn-secondary" onclick="window.APP.copyCompetitorsResult()">📋 Копировать</button>
        <button type="button" class="btn btn-gold" onclick="window.APP.printCompetitorsResult()">📄 PDF отчет</button>
      </div>
    </div>
  `;

  renderCompetitorRows();
}

function renderCompetitorRows() {
  const box = $('#comp-items-box');
  if (!box) return;

  box.innerHTML = COMPETITORS_LIST.map((c, idx) => `
    <div style="display:grid; grid-template-columns:1.8fr 1fr 32px; gap:4px; align-items:center; background:var(--bg-input); padding:6px 8px; border-radius:var(--radius-sm);">
      <input type="text" class="input-control" value="${c.name}" style="height:36px; font-size:0.75rem;" oninput="window.APP.updateCompetitor(${idx}, 'name', this.value)">
      <input type="number" class="input-control" value="${c.price}" style="height:36px; font-size:0.75rem;" oninput="window.APP.updateCompetitor(${idx}, 'price', this.value)">
      <button type="button" class="btn-chip" onclick="window.APP.deleteCompetitor(${idx})" style="height:36px; padding:0; color:var(--rose-primary);">✕</button>
    </div>
  `).join('');

  recalcCompetitorsTool();
}

export function recalcCompetitorsTool() {
  const myP = Number($('#comp-my-price')?.value) || 0;
  const cur = getCurrentCurrency();
  const res = TOOLS_REGISTRY.competitors.calc(myP, COMPETITORS_LIST);

  const box = $('#comp-analytics-box');
  if (!box) return;

  const isHigher = res.diffVsAvg > 0;
  box.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">Среднерыночная цена</span>
      <b style="font-size:1.1rem; color:var(--text-primary);">${formatMoney(res.avgPrice)} ${cur.sym}</b>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-muted); margin-top:4px;">
      <span>Мин: ${formatMoney(res.minPrice)} ${cur.sym}</span>
      <span>Макс: ${formatMoney(res.maxPrice)} ${cur.sym}</span>
    </div>
    <div style="border-top:1px solid var(--border-subtle); padding-top:8px; margin-top:8px; font-size:0.82rem; line-height:1.45;">
      Ваша цена <b>${isHigher ? 'выше' : 'ниже'}</b> средней по рынку на <b style="color:${isHigher ? 'var(--rose-primary)' : 'var(--emerald-primary)'};">${Math.abs(res.diffVsAvg)}%</b>.
      <div style="margin-top:4px; font-size:0.75rem; color:var(--gold-primary);">
        💡 ${isHigher ? 'Обоснуйте более высокую цену безупречным сервисом, гарантией или подарками к заказу.' : 'У вас ценовое преимущество. Сделайте акцент на выгоде в рекламе для захвата доли рынка.'}
      </div>
    </div>
  `;
}

// ============================================================
// 4. TOOL: ИМПОРТ ВЫПИСКИ CSV
// ============================================================
function parseBankCsv(text) {
  if (!text || !text.trim()) return { items: [], categories: {}, totalInc: 0, totalExp: 0 };
  const lines = text.trim().split(/\r?\n/);
  const niche = getCurrentNiche();
  const keywords = niche.keywords || ['кофе', 'аренда', 'реклама', 'налог', 'зарплата'];

  const items = [];
  let totalInc = 0;
  let totalExp = 0;
  const categories = {};

  for (const line of lines) {
    if (!line.trim()) continue;
    // support semicolon, comma, tab
    const parts = line.split(/[;\t,]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length >= 2) {
      const date = parts[0] || 'Сегодня';
      const amtStr = parts[1] || '0';
      const desc = parts[2] || parts[0] || 'Операция';
      const amt = Number(amtStr.replace(/\s+/g, '').replace(',', '.')) || 0;

      if (amt !== 0) {
        let cat = 'Прочее';
        const lowerDesc = (desc + ' ' + date).toLowerCase();
        
        if (lowerDesc.includes('аренд')) cat = 'Аренда';
        else if (lowerDesc.includes('зарплат') || lowerDesc.includes('фот') || lowerDesc.includes('перевод сотр')) cat = 'Зарплаты (ФОТ)';
        else if (lowerDesc.includes('яндекс') || lowerDesc.includes('реклам') || lowerDesc.includes('таргет') || lowerDesc.includes('вк')) cat = 'Реклама и Маркетинг';
        else if (lowerDesc.includes('налог') || lowerDesc.includes('усн') || lowerDesc.includes('енс') || lowerDesc.includes('фнс')) cat = 'Налоги';
        else if (lowerDesc.includes('закуп') || lowerDesc.includes('поставщ') || keywords.some(k => lowerDesc.includes(k))) cat = 'Закупка и Сырье';
        else if (amt > 0) cat = 'Выручка / Поступления';

        if (amt > 0) totalInc += amt;
        else totalExp += Math.abs(amt);

        categories[cat] = (categories[cat] || 0) + Math.abs(amt);

        items.push({ date, amt, desc, cat, type: amt > 0 ? 'inc' : 'exp' });
      }
    }
  }

  return { items, categories, totalInc: Math.round(totalInc), totalExp: Math.round(totalExp) };
}

function renderCsvImportTool() {
  const body = $('#tool-runner-body');
  const cur = getCurrentCurrency();

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase;">Автоматический разбор банковской выписки</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">Вставьте строки из банковской выписки (формат: <i>дата; сумма; описание</i>) или загрузите .csv файл.</div>
      </div>

      <div class="card">
        <textarea id="csv-raw-textarea" class="input-control" style="height:90px; padding:10px; font-family:var(--font-mono); font-size:0.75rem;" placeholder="01.10.2026; 150000; Выручка по эквайрингу&#10;02.10.2026; -45000; Оплата аренды за октябрь&#10;03.10.2026; -30000; Закупка зерен кофе и сиропов"></textarea>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button type="button" class="btn btn-gold" onclick="window.APP.parseCsvData()" style="flex:1;">📊 Разобрать операции</button>
          <label class="btn btn-secondary" style="cursor:pointer; margin:0;">
            <span>📁 Файл .csv</span>
            <input type="file" accept=".csv,.txt" onchange="window.APP.handleCsvFileUpload(event)" style="display:none;">
          </label>
        </div>
      </div>

      <div id="csv-analysis-results"></div>
    </div>
  `;
}

// ============================================================
// 5. TOOL: ЦЕЛИ И ПРИВЫЧКИ
// ============================================================
function renderGoalsTool() {
  const body = $('#tool-runner-body');
  const cur = getCurrentCurrency();
  const res = TOOLS_REGISTRY.goals.calc(APP_STATE.monthData.revenue || 500000, 350000);

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">Цель по чистой прибыли на месяц</div>
        <div style="font-size:2rem; font-weight:800; font-family:var(--font-display); color:var(--gold-primary); margin:4px 0;" id="goal-target-display">
          ${formatMoney(res.targetProfit)} ${cur.sym}
        </div>
        <div class="progress-bar" style="margin:8px 0;">
          <div class="progress-fill" style="width:${res.progressPct}%;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
          <span>Факт: <b>${formatMoney(res.currentProfit)} ${cur.sym}</b></span>
          <span style="color:var(--emerald-primary); font-weight:700;">${res.progressPct}% выполнено</span>
        </div>
      </div>

      <div class="card">
        <div class="field-group">
          <label class="field-label">Изменить цель (${cur.sym})</label>
          <input type="number" id="goal-inp-target" class="input-control" value="${res.targetProfit}">
        </div>
        <div class="field-group">
          <label class="field-label">Текущая заработанная прибыль (${cur.sym})</label>
          <input type="number" id="goal-inp-current" class="input-control" value="${res.currentProfit}">
        </div>
        <button type="button" class="btn btn-gold" onclick="window.APP.saveGoals()" style="width:100%; margin-top:6px;">Обновить прогресс цели</button>
      </div>
    </div>
  `;
}

// ============================================================
// 6. TOOL: КАЛЬКУЛЯТОРЫ (5 ВКЛАДОК)
// ============================================================
let ACTIVE_CALC_TAB = 'bep';

function renderCalculatorsTool() {
  const body = $('#tool-runner-body');
  const cur = getCurrentCurrency();

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div style="display:flex; gap:4px; overflow-x:auto; padding-bottom:4px; -webkit-overflow-scrolling:touch;">
        <button type="button" class="btn-chip ${ACTIVE_CALC_TAB === 'bep' ? 'active' : ''}" onclick="window.APP.setCalcTab('bep')">⚖️ Безубыточность</button>
        <button type="button" class="btn-chip ${ACTIVE_CALC_TAB === 'markup' ? 'active' : ''}" onclick="window.APP.setCalcTab('markup')">🏷️ Наценка</button>
        <button type="button" class="btn-chip ${ACTIVE_CALC_TAB === 'runway' ? 'active' : ''}" onclick="window.APP.setCalcTab('runway')">🛡️ Запас денег</button>
        <button type="button" class="btn-chip ${ACTIVE_CALC_TAB === 'ads' ? 'active' : ''}" onclick="window.APP.setCalcTab('ads')">📢 Реклама ROAS</button>
        <button type="button" class="btn-chip ${ACTIVE_CALC_TAB === 'tax' ? 'active' : ''}" onclick="window.APP.setCalcTab('tax')">📑 Налоги</button>
      </div>

      <div id="calc-tab-content"></div>
    </div>
  `;

  renderActiveCalcTabContent();
}

function renderActiveCalcTabContent() {
  const container = $('#calc-tab-content');
  const cur = getCurrentCurrency();
  if (!container) return;

  if (ACTIVE_CALC_TAB === 'bep') {
    const res = TOOLS_REGISTRY.calculators.calc('bep', 3000, 50, 20);
    container.innerHTML = `
      <div class="card card-gold" style="margin-bottom:10px;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">Точка безубыточности в штуках и деньгах</div>
        <div style="font-size:1.8rem; font-weight:800; color:var(--gold-primary); margin:4px 0;" id="bep-res-units">${res.units} шт.</div>
        <div style="font-size:0.85rem; color:var(--text-primary);" id="bep-res-rev">Выручка безубыточности: <b>${formatMoney(res.revenue)} ${cur.sym}</b></div>
      </div>
      <div class="card">
        <div class="field-group">
          <label class="field-label">Постоянные расходы за месяц (${cur.sym})</label>
          <input type="number" id="bep-inp-fixed" class="input-control" value="3000" oninput="window.APP.recalcActiveCalc()">
        </div>
        <div class="field-group">
          <label class="field-label">Цена продажи 1 шт. (${cur.sym})</label>
          <input type="number" id="bep-inp-price" class="input-control" value="50" oninput="window.APP.recalcActiveCalc()">
        </div>
        <div class="field-group">
          <label class="field-label">Переменные затраты на 1 шт. (${cur.sym})</label>
          <input type="number" id="bep-inp-var" class="input-control" value="20" oninput="window.APP.recalcActiveCalc()">
        </div>
      </div>
    `;
  } else if (ACTIVE_CALC_TAB === 'markup') {
    const res = TOOLS_REGISTRY.calculators.calc('markup', 1500, 1000);
    container.innerHTML = `
      <div class="card card-gold" style="margin-bottom:10px;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">Процент наценки</div>
        <div style="font-size:2rem; font-weight:800; color:var(--emerald-primary); margin:4px 0;" id="markup-res-val">${res.markupPct}%</div>
      </div>
      <div class="card">
        <div class="field-group">
          <label class="field-label">Цена продажи (${cur.sym})</label>
          <input type="number" id="markup-inp-price" class="input-control" value="1500" oninput="window.APP.recalcActiveCalc()">
        </div>
        <div class="field-group">
          <label class="field-label">Себестоимость закупки (${cur.sym})</label>
          <input type="number" id="markup-inp-cost" class="input-control" value="1000" oninput="window.APP.recalcActiveCalc()">
        </div>
      </div>
    `;
  } else if (ACTIVE_CALC_TAB === 'runway') {
    const res = TOOLS_REGISTRY.calculators.calc('runway', 300000, 10000);
    container.innerHTML = `
      <div class="card card-gold" style="margin-bottom:10px;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">Запас автономности (Runway)</div>
        <div style="font-size:2rem; font-weight:800; color:var(--cyan-primary); margin:4px 0;" id="runway-res-days">${res.days} дней</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">Без поступления новых платежей</div>
      </div>
      <div class="card">
        <div class="field-group">
          <label class="field-label">Остаток денег на всех счетах (${cur.sym})</label>
          <input type="number" id="runway-inp-balance" class="input-control" value="300000" oninput="window.APP.recalcActiveCalc()">
        </div>
        <div class="field-group">
          <label class="field-label">Среднесуточные расходы (${cur.sym}/день)</label>
          <input type="number" id="runway-inp-daily" class="input-control" value="10000" oninput="window.APP.recalcActiveCalc()">
        </div>
      </div>
    `;
  } else if (ACTIVE_CALC_TAB === 'ads') {
    const res = TOOLS_REGISTRY.calculators.calc('ads', 250000, 50000, 25);
    container.innerHTML = `
      <div class="card card-gold" style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between;">
          <div>
            <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">ROAS (Окупаемость)</div>
            <div style="font-size:1.6rem; font-weight:800; color:var(--gold-primary);" id="ads-res-roas">${res.roas}x</div>
          </div>
          <div>
            <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">CAC (Цена клиента)</div>
            <div style="font-size:1.6rem; font-weight:800; color:var(--cyan-primary);" id="ads-res-cac">${formatMoney(res.cac)} ${cur.sym}</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="field-group">
          <label class="field-label">Выручка с рекламного канала (${cur.sym})</label>
          <input type="number" id="ads-inp-rev" class="input-control" value="250000" oninput="window.APP.recalcActiveCalc()">
        </div>
        <div class="field-group">
          <label class="field-label">Затраты на рекламу (${cur.sym})</label>
          <input type="number" id="ads-inp-spend" class="input-control" value="50000" oninput="window.APP.recalcActiveCalc()">
        </div>
        <div class="field-group">
          <label class="field-label">Число привлеченных клиентов (шт)</label>
          <input type="number" id="ads-inp-clients" class="input-control" value="25" oninput="window.APP.recalcActiveCalc()">
        </div>
      </div>
    `;
  } else if (ACTIVE_CALC_TAB === 'tax') {
    const res = TOOLS_REGISTRY.calculators.calc('tax', 500000, 6);
    container.innerHTML = `
      <div class="card card-gold" style="margin-bottom:10px;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">Сумма налога к уплате</div>
        <div style="font-size:2rem; font-weight:800; color:var(--rose-primary); margin:4px 0;" id="tax-res-val">${formatMoney(res.tax)} ${cur.sym}</div>
      </div>
      <div class="card">
        <div class="field-group">
          <label class="field-label">Налоговая база / Доход (${cur.sym})</label>
          <input type="number" id="tax-inp-base" class="input-control" value="500000" oninput="window.APP.recalcActiveCalc()">
        </div>
        <div class="field-group">
          <label class="field-label">Налоговая ставка (%) — УСН 6%, 15% и др.</label>
          <input type="number" id="tax-inp-rate" class="input-control" value="6" oninput="window.APP.recalcActiveCalc()">
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">💡 Всегда сверяйте точные вычеты и страховые взносы с бухгалтером.</div>
      </div>
    `;
  }
}

// ============================================================
// 7. TOOL: ДЕНЬГИ И КАССОВЫЕ РАЗРЫВЫ (+ КРЕДИТЫ)
// ============================================================
function renderCashflowTool() {
  const body = $('#tool-runner-body');
  const cur = getCurrentCurrency();
  const res = TOOLS_REGISTRY.cashflow.calc(10000, 12, 12);

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">Калькулятор аннуитетного кредита</div>
        <div style="font-size:2rem; font-weight:800; color:var(--gold-primary); margin:4px 0;" id="loan-res-payment">
          ${formatMoney(res.monthlyPayment)} ${cur.sym}/мес
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-secondary); border-top:1px solid var(--border-subtle); padding-top:6px; margin-top:4px;">
          <span>Всего выплат: <b id="loan-res-total">${formatMoney(res.totalPaid)} ${cur.sym}</b></span>
          <span>Переплата: <b id="loan-res-overpay" style="color:var(--rose-primary);">${formatMoney(res.overpayment)} ${cur.sym}</b></span>
        </div>
      </div>

      <div class="card">
        <div class="field-group">
          <label class="field-label">Сумма кредита / лизинга (${cur.sym})</label>
          <input type="number" id="loan-inp-amt" class="input-control" value="10000" oninput="window.APP.recalcLoan()">
        </div>
        <div class="field-group">
          <label class="field-label">Годовая процентная ставка (%)</label>
          <input type="number" id="loan-inp-rate" class="input-control" value="12" step="0.1" oninput="window.APP.recalcLoan()">
        </div>
        <div class="field-group">
          <label class="field-label">Срок кредита (месяцев)</label>
          <input type="number" id="loan-inp-months" class="input-control" value="12" min="1" max="360" oninput="window.APP.recalcLoan()">
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 8. TOOL: КЛИЕНТЫ, КАДРЫ, СКЛАД
// ============================================================
function renderCrmHrStockTool() {
  const body = $('#tool-runner-body');
  const cur = getCurrentCurrency();
  const res = TOOLS_REGISTRY.crm_hr_stock.calc(500000, 4, 200, 70);

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div>
            <div style="font-size:0.72rem; text-transform:uppercase; color:var(--text-secondary);">Выработка на сотрудника</div>
            <div style="font-size:1.3rem; font-weight:800; color:var(--cyan-primary); margin-top:2px;">${formatMoney(res.productivity)} ${cur.sym}</div>
          </div>
          <div>
            <div style="font-size:0.72rem; text-transform:uppercase; color:var(--text-secondary);">Повторные клиенты</div>
            <div style="font-size:1.3rem; font-weight:800; color:var(--emerald-primary); margin-top:2px;">${res.repeatPct}%</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:8px;">Складской учёт остатков</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm);">
            <div>
              <div style="font-weight:700; font-size:0.85rem;">Зёрна кофе Арабика (1 кг)</div>
              <div style="font-size:0.7rem; color:var(--text-muted);">Мин. порог: 5 шт.</div>
            </div>
            <span class="badge badge-profit">В наличии: 18 шт.</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm);">
            <div>
              <div style="font-weight:700; font-size:0.85rem;">Стаканчики крафт 350 мл</div>
              <div style="font-size:0.7rem; color:var(--text-muted);">Мин. порог: 200 шт.</div>
            </div>
            <span class="badge badge-loss">Заканчивается: 50 шт.</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 9. TOOL: ЮНИТ-ЭКОНОМИКА И ABC
// ============================================================
function renderUnitAbcTool() {
  const body = $('#tool-runner-body');
  const cur = getCurrentCurrency();
  const res = TOOLS_REGISTRY.unit_abc.calc(2000, 4, 2, 30, 800);

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div>
            <div style="font-size:0.72rem; color:var(--text-secondary); text-transform:uppercase;">LTV (Ценность клиента)</div>
            <div style="font-size:1.4rem; font-weight:800; color:var(--gold-primary); margin-top:2px;">${formatMoney(res.ltv)} ${cur.sym}</div>
          </div>
          <div>
            <div style="font-size:0.72rem; color:var(--text-secondary); text-transform:uppercase;">Соотношение LTV / CAC</div>
            <div style="font-size:1.4rem; font-weight:800; color:var(--emerald-primary); margin-top:2px;">${res.ratio}x</div>
          </div>
        </div>
        <div style="font-size:0.78rem; color:var(--text-muted); border-top:1px solid var(--border-subtle); padding-top:6px; margin-top:8px;">
          Окупаемость привлечения клиента: <b>${res.paybackMonths} мес.</b> (Норма ≤ 12 мес.)
        </div>
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:8px;">ABC-анализ ассортимента</div>
        <div style="display:flex; flex-direction:column; gap:4px; font-size:0.78rem;">
          <div style="display:flex; justify-content:space-between; padding:6px; background:rgba(52,211,153,0.1); border-radius:4px;">
            <span>🟢 <b>Группа A</b> (80% выручки)</span>
            <span style="font-weight:700;">Капучино, Латте, Чизкейк</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:6px; background:rgba(245,158,11,0.1); border-radius:4px;">
            <span>🟡 <b>Группа B</b> (15% выручки)</span>
            <span style="font-weight:700;">Круассаны, Раф</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:6px; background:rgba(251,113,133,0.1); border-radius:4px;">
            <span>🔴 <b>Группа C</b> (5% выручки)</span>
            <span style="font-weight:700;">Смузи экзотик (неликвид)</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 10-23. OTHER SPECIALIZED TOOLS
// ============================================================
function renderCopywriterTool() {
  const body = $('#tool-runner-body');
  const niche = getCurrentNiche();

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-size:0.85rem; font-weight:800; color:var(--gold-primary);">✍️ Готовые продающие тексты для «${niche.name}»</div>
        <div style="font-size:0.8rem; line-height:1.5; color:var(--text-primary); margin-top:6px; background:var(--bg-input); padding:10px; border-radius:var(--radius-sm);">
          🔥 <b>Специальное предложение недели:</b><br>
          Только до конца недели дарим скидку 15% на всё меню в «${niche.name}»! Наслаждайтесь безупречным качеством и атмосферой. Напишите нам в Direct или бронируйте прямо сейчас! 📍 Ждём вас!
        </div>
      </div>
      <button type="button" class="btn btn-gold" onclick="window.APP.copyAdvisorText(0); window.APP.showToast('Текст скопирован! ✓');" style="width:100%;">
        📋 Скопировать пост для соцсетей
      </button>
      <button type="button" class="btn btn-secondary" onclick="window.APP.navigateToScreen('screen-advisor')" style="width:100%;">
        🧠 Попросить ИИ написать другой текст ➔
      </button>
    </div>
  `;
}

function renderSlogansTool() {
  const body = $('#tool-runner-body');
  const niche = getCurrentNiche();

  const slogans = [
    `«${niche.name} — вкус, к которому возвращаются каждый день.»`,
    `«Безупречное качество и забота в каждой детали для наших гостей.»`,
    `«Ваше любимое место отдыха и вдохновения в самом центре города.»`,
    `«Мастерство, традиции и современные стандарты сервиса.»`
  ];

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-weight:800; font-size:0.9rem; color:var(--gold-primary);">✨ Генератор названий &amp; слоганов</div>
        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Адаптировано под нишу: <b>${niche.name}</b></div>
      </div>

      <div class="card">
        <div style="font-size:0.8rem; font-weight:700; margin-bottom:8px;">Варианты слоганов и позиционирования:</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${slogans.map((s, idx) => `
            <div style="background:var(--bg-input); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <div style="font-size:0.82rem; color:var(--text-primary); font-style:italic;">${s}</div>
              <button type="button" class="btn-chip" onclick="window.APP.copyResultText('${s.replace(/'/g, "\\'")}');" style="flex-shrink:0;">📋</button>
            </div>
          `).join('')}
        </div>
      </div>

      <button type="button" class="btn btn-gold" onclick="window.APP.copyResultText('${slogans.join('\\n')}');" style="width:100%;">📋 Скопировать все слоганы</button>
    </div>
  `;
}

function renderBusinessPlanTool() {
  const body = $('#tool-runner-body');
  const niche = getCurrentNiche();
  const cur = getCurrentCurrency();
  const d = APP_STATE.monthData;
  const rev = d.revenue || 500000;

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-weight:800; font-size:0.95rem; color:var(--gold-primary);">📋 Экспресс-бизнес-план: ${niche.name}</div>
        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Целевой оборот: <b>${formatMoney(rev)} ${cur.sym}/мес</b></div>
      </div>

      <div class="card">
        <div style="display:flex; flex-direction:column; gap:8px; font-size:0.8rem; line-height:1.45;">
          <div style="background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm);">
            <b style="color:var(--gold-primary);">1. Резюме проекта:</b>
            <div>Запуск и масштабирование бизнеса в сегменте «${niche.name}». Средний чек ~1 500 ${cur.sym}, целевая маржинальность ${niche.margin || 25}%.</div>
          </div>
          <div style="background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm);">
            <b style="color:var(--cyan-primary);">2. Финансовый план:</b>
            <div>Плановая выручка: ${formatMoney(rev)} ${cur.sym}. Точка безубыточности: ~${formatMoney(rev * 0.55)} ${cur.sym}. Срок выхода на самоокупаемость: 2-3 месяца.</div>
          </div>
          <div style="background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm);">
            <b style="color:var(--emerald-primary);">3. Маркетинг и каналы сбыта:</b>
            <div>Локальный гео-маркетинг (карты, 2ГИС), таргетированная реклама, программа лояльности и рекомендации постоянных клиентов.</div>
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
        <button type="button" class="btn btn-secondary" onclick="window.APP.copyResultText('Бизнес-план для ' + '${niche.name}');">📋 Копировать</button>
        <button type="button" class="btn btn-gold" onclick="window.APP.printBusinessPlanPdf();">📄 PDF план</button>
      </div>
    </div>
  `;
}

function renderCanvasTool() {
  const body = $('#tool-runner-body');
  const niche = getCurrentNiche();

  const blocks = [
    { title: '1. Ценностное предложение', val: 'Высокое качество, быстрый сервис, комфортная атмосфера и честная цена.' },
    { title: '2. Сегменты клиентов', val: 'Жители и офисные работники района (20-45 лет), ценители качественного сервиса.' },
    { title: '3. Каналы сбыта', val: 'Оффлайн точка, самовывоз, доставка через агрегаторы, соцсети.' },
    { title: '4. Отношения с клиентами', val: 'Персональная забота, бонусная система лояльности, учет предпочтений.' },
    { title: '5. Потоки доходов', val: 'Прямые продажи основного ассортимента, сопутствующие товары, сезонные новинки.' },
    { title: '6. Ключевые ресурсы', val: 'Оборудование, опытный персонал, локация с высоким пешеходным трафиком.' },
    { title: '7. Ключевые процессы', val: 'Контроль стандартов качества, закупки свежего сырья, маркетинг и сервис.' },
    { title: '8. Ключевые партнеры', val: 'Проверенные поставщики сырья и упаковки, сервисы доставки, арендодатель.' },
    { title: '9. Структура затрат', val: 'Аренда, фонд оплаты труда (ФОТ), закупка сырья (COGS), реклама и налоги.' }
  ];

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-weight:800; font-size:0.95rem; color:var(--gold-primary);">🗺️ Бизнес-модель Canvas (9 блоков)</div>
        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Шаблон Остервальдера для: <b>${niche.name}</b></div>
      </div>

      <div style="display:flex; flex-direction:column; gap:6px; max-height:55vh; overflow-y:auto;">
        ${blocks.map(b => `
          <div style="background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
            <div style="font-weight:700; font-size:0.8rem; color:var(--gold-primary); margin-bottom:2px;">${b.title}</div>
            <div style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4;">${b.val}</div>
          </div>
        `).join('')}
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
        <button type="button" class="btn btn-secondary" onclick="window.APP.copyResultText('Canvas модель для ' + '${niche.name}');">📋 Копировать</button>
        <button type="button" class="btn btn-gold" onclick="window.APP.printCanvasPdf();">📄 PDF модель</button>
      </div>
    </div>
  `;
}

function renderContentPlanTool() {
  const body = $('#tool-runner-body');
  const niche = getCurrentNiche();

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-weight:800; font-size:0.9rem; color:var(--gold-primary);">📅 4-недельный контент-план («${niche.name}»)</div>
        <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px; font-size:0.78rem;">
          <div style="background:var(--bg-input); padding:8px; border-radius:var(--radius-sm);"><b>Неделя 1:</b> Знакомство с командой, процесс приготовления изнутри.</div>
          <div style="background:var(--bg-input); padding:8px; border-radius:var(--radius-sm);"><b>Неделя 2:</b> Видео-отзывы клиентов и разбор частых вопросов.</div>
          <div style="background:var(--bg-input); padding:8px; border-radius:var(--radius-sm);"><b>Неделя 3:</b> Интерактив и опрос «Какой ваш любимый вкус?».</div>
          <div style="background:var(--bg-input); padding:8px; border-radius:var(--radius-sm);"><b>Неделя 4:</b> Акция месяца и анонс новинок следующего сезона.</div>
        </div>
      </div>
      <button type="button" class="btn btn-gold" onclick="window.APP.copyResultText('Контент-план на 4 недели для ' + '${niche.name}');" style="width:100%;">📋 Скопировать контент-план</button>
    </div>
  `;
}

function renderSalesScriptsTool() {
  const body = $('#tool-runner-body');

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:10px;">
      <div class="card card-gold">
        <div style="font-weight:800; font-size:0.85rem; color:var(--rose-primary);">Возражение: «У вас дорого»</div>
        <div style="font-size:0.8rem; margin-top:4px; line-height:1.45; background:var(--bg-input); padding:8px; border-radius:var(--radius-sm);">
          <i>«Понимаю ваше желание сэкономить. При этом в нашу цену уже включены гарантия 12 месяцев, бесплатная доставка и премиум-сырье, что сэкономит вам до 30% в долгосрочной перспективе. Давайте сравним комплектацию?»</i>
        </div>
      </div>
      <div class="card">
        <div style="font-weight:800; font-size:0.85rem; color:var(--cyan-primary);">Возражение: «Я подумаю»</div>
        <div style="font-size:0.8rem; margin-top:4px; line-height:1.45; background:var(--bg-input); padding:8px; border-radius:var(--radius-sm);">
          <i>«Конечно, взвесить решение важно. Скажите, что именно вызывает сомнения: цена, сроки или условия оплаты? Давайте снимем этот вопрос прямо сейчас.»</i>
        </div>
      </div>
    </div>
  `;
}

function renderReviewsNpsTool() {
  const body = $('#tool-runner-body');
  const res = TOOLS_REGISTRY.reviews_nps.calc(70, 20, 10);

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold" style="text-align:center;">
        <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-secondary);">Индекс лояльности NPS</div>
        <div style="font-size:2.2rem; font-weight:800; color:var(--emerald-primary); margin:4px 0;">+${res.nps}%</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">Отличный уровень приверженности клиентов</div>
      </div>
      <div class="card">
        <div style="font-weight:700; font-size:0.85rem; margin-bottom:6px;">Шаблон запроса отзыва в WhatsApp:</div>
        <div style="font-size:0.8rem; background:var(--bg-input); padding:8px; border-radius:var(--radius-sm); line-height:1.4;">
          <i>«Здравствуйте! Спасибо, что выбрали нас. Оцените, пожалуйста, наш сервис от 1 до 10, и получите скидку 10% на следующий заказ!»</i>
        </div>
      </div>
    </div>
  `;
}

function renderSecurityPinTool() {
  const body = $('#tool-runner-body');
  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-weight:800; font-size:0.9rem; color:var(--gold-primary);">🔒 Защита данных PIN-кодом</div>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">Установите 4-значный код для блокировки финансовых экранов.</p>
      </div>
      <div class="card">
        <input type="password" maxlength="4" id="sec-pin-input" class="input-control" placeholder="••••" style="text-align:center; font-size:1.5rem; letter-spacing:8px;">
        <button type="button" class="btn btn-gold" onclick="window.APP.saveSecurityPin()" style="width:100%; margin-top:8px;">Сохранить PIN-код</button>
      </div>
    </div>
  `;
}

function renderMultiBusinessTool() {
  const body = $('#tool-runner-body');
  const curNiche = getCurrentNiche();

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-weight:800; font-size:0.9rem; color:var(--gold-primary);">🏢 Профили ваших бизнесов</div>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">Переключайтесь между проектами с изолированными базами расчетов.</p>
      </div>
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--gold-primary);">
          <div>
            <div style="font-weight:800; font-size:0.9rem;">Основной: ${curNiche.name}</div>
            <div style="font-size:0.7rem; color:var(--emerald-primary);">● Активен сейчас</div>
          </div>
          <button type="button" class="btn-chip" onclick="window.APP.openNichePicker()">Сменить ➔</button>
        </div>
      </div>
    </div>
  `;
}

function renderBackupTool() {
  const body = $('#tool-runner-body');
  const jsonStr = JSON.stringify(APP_STATE, null, 2);

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-weight:800; font-size:0.9rem; color:var(--gold-primary);">💾 Экспорт и импорт базы данных</div>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">Сохраните копию всех расчетов или восстановите данные на новом устройстве.</p>
      </div>
      <div class="card">
        <button type="button" class="btn btn-gold" onclick="window.APP.downloadBackupJson()" style="width:100%; margin-bottom:8px;">📥 Скачать JSON файл бэкапа</button>
        <button type="button" class="btn btn-secondary" onclick="window.APP.copyBackupJson()" style="width:100%;">📋 Скопировать в буфер</button>
      </div>
    </div>
  `;
}

function renderRemindersTool() {
  const body = $('#tool-runner-body');

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-weight:800; font-size:0.9rem; color:var(--gold-primary);">⏰ Бизнес-напоминания & Календарь</div>
        <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm);">
            <div>
              <div style="font-weight:700; font-size:0.85rem;">Уплата налога УСН</div>
              <div style="font-size:0.7rem; color:var(--rose-primary);">28 числа каждого квартала</div>
            </div>
            <button type="button" class="btn-chip" onclick="window.APP.exportIcsEvent('Уплата налога УСН', 'Оплатить квартальный налог УСН в ФНС')">📅 В календарь</button>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm);">
            <div>
              <div style="font-weight:700; font-size:0.85rem;">Оплата аренды помещения</div>
              <div style="font-size:0.7rem; color:var(--gold-primary);">1 числа каждого месяца</div>
            </div>
            <button type="button" class="btn-chip" onclick="window.APP.exportIcsEvent('Оплата аренды', 'Перевести оплату арендодателю')">📅 В календарь</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderGlossaryTool() {
  const body = $('#tool-runner-body');
  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px;">
      <input type="text" class="input-control" placeholder="Поиск термина..." oninput="window.APP.filterGlossary(this.value)">
      <div id="glossary-items-list" style="display:flex; flex-direction:column; gap:6px; max-height:55vh; overflow-y:auto;">
        ${GLOSSARY.map(g => `
          <div style="background:var(--bg-input); padding:10px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <b style="color:var(--gold-primary); font-size:0.85rem;">${g.term}</b>
              <span style="font-size:0.7rem; color:var(--text-muted);">${g.en}</span>
            </div>
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:4px; line-height:1.4;">${g.desc}</div>
            <div style="font-size:0.72rem; color:var(--gold-primary); margin-top:4px; font-weight:600;">💡 ${g.example}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderSettingsResetTool() {
  const body = $('#tool-runner-body');
  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-weight:800; font-size:0.9rem; color:var(--gold-primary);">⚙️ Оформление и безопасность</div>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">Настройте тему и очистите временные данные при необходимости.</p>
      </div>
      <div class="card">
        <button type="button" class="btn btn-secondary" onclick="window.APP.confirmDataReset()" style="width:100%; border-color:var(--rose-primary); color:var(--rose-primary);">
          🗑️ Полный сброс всех данных приложения
        </button>
      </div>
    </div>
  `;
}

function renderHelpFaqTool() {
  const body = $('#tool-runner-body');
  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px; max-height:60vh; overflow-y:auto;">
      ${HELP_FAQS.map(f => `
        <div style="background:var(--bg-input); padding:10px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <div style="font-weight:700; font-size:0.85rem; color:var(--gold-primary); margin-bottom:4px;">${f.q}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.45;">${f.a}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAchievementsTool() {
  const body = $('#tool-runner-body');
  body.innerHTML = `
    <div style="text-align:center; padding:12px; display:flex; flex-direction:column; align-items:center; gap:8px;">
      <div style="font-size:3.5rem;">👑</div>
      <div style="font-family:var(--font-display); font-weight:800; font-size:1.25rem; color:var(--gold-primary);">Гранд-Аналитик CoreMaX</div>
      <p style="font-size:0.82rem; color:var(--text-secondary); line-height:1.45;">
        Вы используете полную версию системы бизнес-аналитики CoreMaX AI с доступом к 20+ инструментам и 160 отраслевым шаблонам.
      </p>
    </div>
  `;
}

function renderAboutAppTool() {
  const body = $('#tool-runner-body');
  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px; text-align:center; padding:10px;">
      <div style="font-family:var(--font-display); font-weight:800; font-size:1.4rem; color:var(--text-primary);">CoreMaX AI v3.5.0</div>
      <p style="font-size:0.82rem; color:var(--text-secondary); line-height:1.5;">
        Профессиональная система финансового аудита, симуляции сценариев и ИИ-консалтинга для малого и среднего бизнеса.
      </p>
      <a href="https://www.instagram.com/tojprogs/" target="_blank" rel="noopener noreferrer" class="btn btn-gold" style="text-decoration:none; margin-top:8px;">
        📷 Instagram @tojprogs (Сайт и поддержка)
      </a>
    </div>
  `;
}

// Niche picker modal logic
export function updateNicheUI() {
  const niche = getCurrentNiche();
  const shortName = niche.name.split('/')[0].trim();
  const cat = NICHE_CATEGORIES.find(c => c.niches.some(n => n.id === niche.id));
  const icon = cat ? cat.icon : '🏢';

  // 1. Update header niche pill
  const pill = document.getElementById('header-niche-pill');
  if (pill) {
    pill.innerHTML = `<span>${icon} ${shortName}</span> ▾`;
  }

  // 2. Update drawer niche card
  const drawerName = document.getElementById('drawer-niche-name');
  if (drawerName) {
    drawerName.innerHTML = `${icon} ${niche.name}`;
  }

  // 3. Update advisor niche badge
  const advBadge = document.getElementById('advisor-niche-badge');
  if (advBadge) {
    advBadge.innerHTML = `${icon} ${shortName}`;
  }
}

let CURRENT_NICHE_CATEGORY = 'all';

export function openNichePicker() {
  SOUND.play('click');
  const modal = $('#modal-niche-picker') || $('#modal-tool-runner');
  const title = $('#niche-picker-title') || $('#tool-runner-title');
  const body = $('#niche-picker-body') || $('#tool-runner-body');
  if (!modal) return;

  if (title) title.textContent = '🏢 Выбор ниши бизнеса (160+)';
  
  if (body) {
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <input type="text" id="niche-search-input" class="input-control" placeholder="Поиск ниши (кафе, одежда, авто, IT, салон...)" oninput="window.APP.filterNiches(this.value)">
        
        <!-- CATEGORY CHIPS -->
        <div id="niche-cat-chips" style="display:flex; gap:6px; overflow-x:auto; padding:4px 0; -webkit-overflow-scrolling:touch;">
          <button type="button" class="btn-chip ${CURRENT_NICHE_CATEGORY === 'all' ? 'active' : ''}" onclick="window.APP.setNicheCategory('all')">🏢 Все (160+)</button>
          ${NICHE_CATEGORIES.map(c => `
            <button type="button" class="btn-chip ${CURRENT_NICHE_CATEGORY === c.name ? 'active' : ''}" onclick="window.APP.setNicheCategory('${c.name.replace(/'/g, "\\'")}')">${c.icon} ${c.name.split('(')[0].trim()}</button>
          `).join('')}
        </div>

        <div id="niches-list-box" style="display:flex; flex-direction:column; gap:6px; max-height:55vh; overflow-y:auto; padding-right:2px;">
          <!-- Injected via renderNichesList -->
        </div>
      </div>
    `;
  }
  
  modal.classList.add('open');
  renderNichesList();
}

export function closeNichePicker() {
  $('#modal-niche-picker')?.classList.remove('open');
  $('#modal-tool-runner')?.classList.remove('open');
}

export function setNicheCategory(catName) {
  CURRENT_NICHE_CATEGORY = catName;
  SOUND.play('click');
  const chips = $$('#niche-cat-chips .btn-chip');
  chips.forEach(b => {
    b.classList.toggle('active', b.textContent.includes(catName.split('(')[0].trim()) || (catName === 'all' && b.textContent.includes('Все')));
  });
  renderNichesList($('#niche-search-input')?.value || '');
}

export function renderNichesList(query = '') {
  const box = $('#niches-list-box');
  if (!box) return;

  const q = query.toLowerCase().trim();
  let categories = NICHE_CATEGORIES;

  if (CURRENT_NICHE_CATEGORY !== 'all') {
    categories = categories.filter(c => c.name === CURRENT_NICHE_CATEGORY);
  }

  let html = '';

  for (const cat of categories) {
    let niches = cat.niches;
    if (q) {
      niches = niches.filter(n => n.name.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q));
    }
    if (!niches.length) continue;

    html += `<div style="font-size:0.75rem; font-weight:800; color:var(--gold-primary); margin-top:8px; display:flex; align-items:center; gap:6px;">${cat.icon} ${cat.name}</div>`;

    for (const n of niches) {
      const isSelected = n.id === APP_STATE.activeNicheId;
      html += `
        <button type="button" class="btn btn-secondary" onclick="window.APP.selectNiche('${n.id}')" style="justify-content:space-between; height:44px; font-size:0.82rem; padding:0 12px; ${isSelected ? 'border-color:var(--gold-primary); background:rgba(245,158,11,0.12); font-weight:800;' : ''}">
          <div style="display:flex; align-items:center; gap:8px; text-align:left;">
            <span>${n.name}</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:0.7rem; color:var(--text-muted);">Норма: ${n.margin}%</span>
            ${isSelected ? '<span style="color:var(--gold-primary); font-weight:800; font-size:1rem;">✓</span>' : ''}
          </div>
        </button>
      `;
    }
  }

  if (!html) {
    html = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.82rem;">Ничего не найдено по запросу «${query}». Попробуйте другое слово.</div>`;
  }

  box.innerHTML = html;
}

export function selectNiche(id) {
  const niche = ALL_NICHES.find(n => n.id === id) || ALL_NICHES[0];
  APP_STATE.activeNicheId = niche.id;
  APP_STATE.checklist.nicheSet = true;

  // Calculate realistic benchmark numbers for the selected niche
  const baseRev = niche.margin > 25 ? 500000 : 750000;
  const sal = Math.round(baseRev * ((niche.sal || 25) / 100));
  const rent = Math.round(baseRev * ((niche.rent || 18) / 100));
  const ads = Math.round(baseRev * ((niche.ads || 10) / 100));
  const cogs = Math.round(baseRev * ((niche.cogs || 20) / 100));

  APP_STATE.monthData = {
    revenue: baseRev,
    cogs: cogs,
    rent: rent,
    salary: sal,
    ads: ads,
    other: 0,
    taxes: Math.round(baseRev * 0.06),
    isSample: true
  };

  APP_STATE.whatIfData = {
    price: Math.round(baseRev / 1000),
    volume: 1000,
    varCost: Math.round(cogs / 1000),
    fixedCost: rent + sal + ads,
    priceDelta: 0,
    volDelta: 0,
    costDelta: 0
  };

  saveState();
  SOUND.play('ding');
  updateNicheUI();

  // Update input elements if on analyst screen
  const inpRev = document.getElementById('inp-revenue');
  if (inpRev) inpRev.value = formatMoney(baseRev);
  const inpRent = document.getElementById('inp-rent');
  if (inpRent) inpRent.value = formatMoney(rent);
  const inpSal = document.getElementById('inp-salary');
  if (inpSal) inpSal.value = formatMoney(sal);
  const inpAds = document.getElementById('inp-ads');
  if (inpAds) inpAds.value = formatMoney(ads);
  const inpOther = document.getElementById('inp-other');
  if (inpOther) inpOther.value = '0';

  closeNichePicker();
  
  // Re-render all core screens to update immediately with the selected niche
  window.APP.renderAnalyst?.();
  window.APP.renderWhatIf?.();
  window.APP.renderAdvisor?.();

  showToast(`Ниша обновлена: ${niche.name} ✓`);
}

export function filterNiches(query) {
  renderNichesList(query);
}

export function openHelpModal(screenKey = 'analyst') {
  openToolModal('help_faq');
}

export function openGlossaryModal() {
  openToolModal('glossary');
}

// Tool Action Handlers & Modals
export function copyTaxResult() {
  const inc = Number($('#tax-tool-inc')?.value) || 0;
  const exp = Number($('#tax-tool-exp')?.value) || 0;
  const sys = $('#tax-tool-system')?.value || 'usn6';
  const res = TOOLS_REGISTRY.taxes.calc(sys, inc, exp);
  const cur = getCurrentCurrency();
  copyResultText(`Налоговый расчёт: ${res.rateDesc}\nДоход: ${formatMoney(inc)} ${cur.sym}\nНалог к уплате: ${formatMoney(res.tax)} ${cur.sym}`);
}

export function printTaxReport() {
  const inc = Number($('#tax-tool-inc')?.value) || 0;
  const exp = Number($('#tax-tool-exp')?.value) || 0;
  const sys = $('#tax-tool-system')?.value || 'usn6';
  const res = TOOLS_REGISTRY.taxes.calc(sys, inc, exp);
  const cur = getCurrentCurrency();
  printOrPdfResult('Налоговый расчёт и взносы', `
    <div class="card">
      <div class="highlight">${res.rateDesc}</div>
      <p>Сумма налога к уплате: <b>${formatMoney(res.tax)} ${cur.sym}</b></p>
      <p>Налогооблагаемый доход: <b>${formatMoney(inc)} ${cur.sym}</b></p>
      <p>Учтенные расходы: <b>${formatMoney(exp)} ${cur.sym}</b></p>
    </div>
  `);
}

export function copySalaryResult() {
  const base = Number($('#sal-inp-base')?.value) || 0;
  const kpi = Number($('#sal-inp-kpi')?.value) || 0;
  const res = TOOLS_REGISTRY.salaries.calc(base, kpi);
  const cur = getCurrentCurrency();
  copyResultText(`Расчёт ФОТ сотрудника:\nОклад + KPI: ${formatMoney(res.gross)} ${cur.sym}\nНа руки (Net): ${formatMoney(res.net)} ${cur.sym}\nНДФЛ (13%): ${formatMoney(res.ndfl)} ${cur.sym}\nВзносы (30%): ${formatMoney(res.insurance)} ${cur.sym}\nПолные затраты бизнеса: ${formatMoney(res.totalCost)} ${cur.sym}`);
}

export function printSalaryPdf() {
  const base = Number($('#sal-inp-base')?.value) || 0;
  const kpi = Number($('#sal-inp-kpi')?.value) || 0;
  const res = TOOLS_REGISTRY.salaries.calc(base, kpi);
  const cur = getCurrentCurrency();
  printOrPdfResult('Расчёт затрат на персонал (ФОТ)', `
    <div class="card">
      <div class="highlight">Полные затраты: ${formatMoney(res.totalCost)} ${cur.sym}</div>
      <table>
        <tr><th>Статья</th><th>Сумма (${cur.sym})</th></tr>
        <tr><td>Оклад (Gross)</td><td>${formatMoney(res.base)}</td></tr>
        <tr><td>KPI и Бонусы</td><td>${formatMoney(res.kpi)}</td></tr>
        <tr><td>НДФЛ 13%</td><td>${formatMoney(res.ndfl)}</td></tr>
        <tr><td>Выплата на руки (Net)</td><td><b>${formatMoney(res.net)}</b></td></tr>
        <tr><td>Страховые взносы (30%)</td><td>${formatMoney(res.insurance)}</td></tr>
      </table>
    </div>
  `);
}

export function addDebtItemModal() {
  const name = prompt('Введите имя должника / кредитора:');
  if (!name) return;
  const amtStr = prompt('Введите сумму долга:');
  const amt = Number(amtStr?.replace(/\s+/g, '')) || 0;
  if (amt <= 0) return;
  const isWeOwe = confirm('Нажмите "ОК", если МЫ должны, или "Отмена", если НАМ должны:');
  DEBTS_LIST.unshift({ id: 'd_' + Date.now(), name, amt, type: isWeOwe ? 'we_owe' : 'they_owe', date: 'Срок уточняется' });
  SOUND.play('coins');
  renderDebtsTool();
  showToast('Долг добавлен ✓');
}

export function deleteDebtItem(idx) {
  DEBTS_LIST.splice(idx, 1);
  SOUND.play('click');
  renderDebtsTool();
}

export function addCrmClientModal() {
  const name = prompt('Имя клиента:');
  if (!name) return;
  const phone = prompt('Телефон или контакт:', '+7 ') || '';
  const ltvStr = prompt('Сумма покупок / чек (LTV):', '10000');
  const ltv = Number(ltvStr?.replace(/\s+/g, '')) || 0;
  CRM_CLIENTS.unshift({ name, phone, status: 'Новый', ltv, note: 'Добавлен вручную' });
  SOUND.play('ding');
  renderCrmTool();
  showToast('Клиент добавлен в CRM ✓');
}

export function deleteCrmClient(idx) {
  CRM_CLIENTS.splice(idx, 1);
  SOUND.play('click');
  renderCrmTool();
}

export function printBusinessPlanPdf() {
  const niche = getCurrentNiche();
  printOrPdfResult(`Бизнес-план — ${niche.name}`, `
    <div class="card">
      <div class="highlight">План запуска и развития: ${niche.name}</div>
      <p>1. <b>Резюме проекта:</b> Целевой рынок малого бизнеса с фокусом на высокий сервис и удержание клиентов.</p>
      <p>2. <b>Финансы:</b> Средняя маржинальность ${niche.margin}%. Точка окупаемости достигается за 2-3 месяца при соблюдении планового чека.</p>
      <p>3. <b>Каналы продаж:</b> Локальный маркетинг, гео-сервисы, таргетированная реклама и реферальная программа.</p>
    </div>
  `);
}

export function printCanvasPdf() {
  const niche = getCurrentNiche();
  printOrPdfResult(`Бизнес-модель Canvas — ${niche.name}`, `
    <div class="card">
      <div class="highlight">9 блоков Остервальдера: ${niche.name}</div>
      <p>• <b>Ценность:</b> Сервис, скорость, качество и честная цена.</p>
      <p>• <b>Сегменты:</b> Локальная аудитория, постоянные клиенты и корпоративные заказы.</p>
      <p>• <b>Каналы:</b> Оффлайн точка, агрегаторы, сайт и соцсети.</p>
      <p>• <b>Структура затрат:</b> Аренда, закупки (COGS), ФОТ, маркетинг.</p>
    </div>
  `);
}

export function saveDiscountResult() {
  const p = Number($('#disc-inp-price')?.value) || 0;
  const d = Number($('#disc-inp-pct')?.value) || 0;
  saveResultToHistory('Скидки и акции', `Скидка ${d}% на товар ценой ${p}`);
}

export function copyDiscountResult() {
  const p = Number($('#disc-inp-price')?.value) || 0;
  const c = Number($('#disc-inp-cost')?.value) || 0;
  const d = Number($('#disc-inp-pct')?.value) || 0;
  const res = TOOLS_REGISTRY.discount.calc(p, c, d);
  const cur = getCurrentCurrency();
  copyResultText(`Расчёт скидки:\nЦена: ${p} ${cur.sym} -> Со скидкой: ${res.newPrice} ${cur.sym}\nМаржа: ${res.newUnitMargin} ${cur.sym}/шт\nНеобходимый рост продаж: +${res.growthPct}%`);
}

export function printDiscountResult() {
  const p = Number($('#disc-inp-price')?.value) || 0;
  const c = Number($('#disc-inp-cost')?.value) || 0;
  const d = Number($('#disc-inp-pct')?.value) || 0;
  const res = TOOLS_REGISTRY.discount.calc(p, c, d);
  const cur = getCurrentCurrency();
  printOrPdfResult('Анализ выгодности скидки', `
    <div class="card">
      <div class="highlight">Новая цена: ${formatMoney(res.newPrice)} ${cur.sym} (-${d}%)</div>
      <p>Маржа с единицы товара: <b>${formatMoney(res.newUnitMargin)} ${cur.sym}</b></p>
      <p>Чтобы сохранить прибыль, продажи должны вырасти на: <b>+${res.growthPct}%</b> (в ${res.multiplier} раза)</p>
    </div>
  `);
}

export function addInvoiceRow() {
  INVOICE_ITEMS.push({ name: 'Новая услуга / товар', qty: 1, price: 5000 });
  SOUND.play('click');
  renderInvoiceRows();
}

export function updateInvoiceItem(idx, field, val) {
  if (INVOICE_ITEMS[idx]) {
    INVOICE_ITEMS[idx][field] = field === 'name' ? val : (Number(val) || 0);
    recalcInvoiceTotal();
  }
}

export function deleteInvoiceRow(idx) {
  INVOICE_ITEMS.splice(idx, 1);
  SOUND.play('click');
  renderInvoiceRows();
}

export function saveInvoiceToHistory() {
  const dPct = Number($('#inv-discount-pct')?.value) || 0;
  const vPct = Number($('#inv-vat-pct')?.value) || 0;
  const res = TOOLS_REGISTRY.invoice.calc(INVOICE_ITEMS, dPct, vPct);
  const cur = getCurrentCurrency();
  APP_STATE.checklist.invoiceDone = true;
  saveState();
  checkAllChecklistCompleted();
  saveResultToHistory('Счёт на оплату', `Сумма ${formatMoney(res.total)} ${cur.sym} (${INVOICE_ITEMS.length} поз.)`);
}

export function copyInvoiceText() {
  const dPct = Number($('#inv-discount-pct')?.value) || 0;
  const vPct = Number($('#inv-vat-pct')?.value) || 0;
  const res = TOOLS_REGISTRY.invoice.calc(INVOICE_ITEMS, dPct, vPct);
  const cur = getCurrentCurrency();
  const text = `СЧЁТ НА ОПЛАТУ\n` +
    INVOICE_ITEMS.map((it, i) => `${i + 1}. ${it.name} — ${it.qty} шт. x ${formatMoney(it.price)} = ${formatMoney(it.qty * it.price)} ${cur.sym}`).join('\n') +
    `\n\nСкидка: ${dPct}%\nНДС: ${vPct}%\nИТОГО К ОПЛАТЕ: ${formatMoney(res.total)} ${cur.sym}`;
  copyResultText(text);
}

export function printInvoicePdf() {
  const dPct = Number($('#inv-discount-pct')?.value) || 0;
  const vPct = Number($('#inv-vat-pct')?.value) || 0;
  const res = TOOLS_REGISTRY.invoice.calc(INVOICE_ITEMS, dPct, vPct);
  const cur = getCurrentCurrency();
  printOrPdfResult('Счёт на оплату', `
    <div class="card">
      <table>
        <tr><th>№</th><th>Наименование</th><th>Кол-во</th><th>Цена (${cur.sym})</th><th>Сумма (${cur.sym})</th></tr>
        ${INVOICE_ITEMS.map((it, i) => `
          <tr><td>${i + 1}</td><td>${it.name}</td><td>${it.qty}</td><td>${formatMoney(it.price)}</td><td>${formatMoney(it.qty * it.price)}</td></tr>
        `).join('')}
      </table>
      <div style="margin-top:16px; text-align:right;">
        <div style="font-size:14px;">Подытог: ${formatMoney(res.subtotal)} ${cur.sym}</div>
        ${dPct > 0 ? `<div style="font-size:14px; color:#d97706;">Скидка ${dPct}%: -${formatMoney(res.discountAmt)} ${cur.sym}</div>` : ''}
        ${vPct > 0 ? `<div style="font-size:14px;">НДС ${vPct}%: +${formatMoney(res.vatAmt)} ${cur.sym}</div>` : ''}
        <div class="highlight" style="margin-top:8px;">ИТОГО: ${formatMoney(res.total)} ${cur.sym}</div>
      </div>
    </div>
  `);
}

export function addCompetitorRow() {
  COMPETITORS_LIST.push({ name: 'Новый конкурент', price: 1500 });
  SOUND.play('click');
  renderCompetitorRows();
}

export function updateCompetitor(idx, field, val) {
  if (COMPETITORS_LIST[idx]) {
    COMPETITORS_LIST[idx][field] = field === 'name' ? val : (Number(val) || 0);
    recalcCompetitorsTool();
  }
}

export function deleteCompetitor(idx) {
  COMPETITORS_LIST.splice(idx, 1);
  SOUND.play('click');
  renderCompetitorRows();
}

export function copyCompetitorsResult() {
  const myP = Number($('#comp-my-price')?.value) || 0;
  const res = TOOLS_REGISTRY.competitors.calc(myP, COMPETITORS_LIST);
  const cur = getCurrentCurrency();
  copyResultText(`Анализ цен конкурентов:\nМоя цена: ${formatMoney(myP)} ${cur.sym}\nСредняя по рынку: ${formatMoney(res.avgPrice)} ${cur.sym}\nРазница: ${res.diffVsAvg}%`);
}

export function printCompetitorsResult() {
  const myP = Number($('#comp-my-price')?.value) || 0;
  const res = TOOLS_REGISTRY.competitors.calc(myP, COMPETITORS_LIST);
  const cur = getCurrentCurrency();
  printOrPdfResult('Анализ конкурентной среды', `
    <div class="card">
      <div class="highlight">Ваша цена: ${formatMoney(myP)} ${cur.sym} (Средняя: ${formatMoney(res.avgPrice)} ${cur.sym})</div>
      <table>
        <tr><th>Компания</th><th>Цена (${cur.sym})</th></tr>
        ${COMPETITORS_LIST.map(c => `<tr><td>${c.name}</td><td>${formatMoney(c.price)}</td></tr>`).join('')}
      </table>
    </div>
  `);
}

let LAST_PARSED_CSV_ITEMS = [];

export function parseCsvData() {
  const text = $('#csv-raw-textarea')?.value || '';
  const parsed = parseBankCsv(text);
  LAST_PARSED_CSV_ITEMS = parsed.items || [];
  const resBox = $('#csv-analysis-results');
  const cur = getCurrentCurrency();
  if (!resBox) return;

  if (!parsed.items.length) {
    resBox.innerHTML = `<div style="color:var(--rose-primary); font-size:0.8rem; text-align:center;">Не удалось обнаружить операции. Проверьте формат строк.</div>`;
    return;
  }

  resBox.innerHTML = `
    <div class="card card-gold">
      <div style="font-weight:800; font-size:0.85rem; color:var(--text-primary); margin-bottom:6px;">Итоги импорта выписки:</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.8rem;">
        <div>Поступления: <b style="color:var(--emerald-primary);">+${formatMoney(parsed.totalInc)} ${cur.sym}</b></div>
        <div>Расходы: <b style="color:var(--rose-primary);">-${formatMoney(parsed.totalExp)} ${cur.sym}</b></div>
      </div>
      <button type="button" class="btn btn-gold" onclick="window.APP.applyCsvToOperations();" style="width:100%; margin-top:8px;">Записать ${parsed.items.length} операций в учет</button>
    </div>
  `;
  SOUND.play('coins');
}

export function applyCsvToOperations() {
  if (!LAST_PARSED_CSV_ITEMS.length) {
    showToast('Нет данных для записи');
    return;
  }
  for (const it of LAST_PARSED_CSV_ITEMS) {
    APP_STATE.incomesExpenses.unshift({
      id: 'ie_' + Math.random().toString(36).slice(2, 9),
      type: it.type,
      amt: Math.abs(it.amt),
      desc: it.desc,
      cat: it.cat,
      date: it.date
    });
  }
  saveState();
  SOUND.play('coins');
  showToast(`Записано ${LAST_PARSED_CSV_ITEMS.length} операций в учёт ✓`);
  $('#modal-tool-runner')?.classList.remove('open');
  navigateToScreen('screen-history');
}

export function handleCsvFileUpload(event) {
  const file = event.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result || '';
    const area = $('#csv-raw-textarea');
    if (area) area.value = text;
    parseCsvData();
  };
  reader.readAsText(file);
}

export function saveGoals() {
  const t = Number($('#goal-inp-target')?.value) || 300000;
  const c = Number($('#goal-inp-current')?.value) || 150000;
  SOUND.play('coins');
  showToast('Цель обновлена ✓');
  renderGoalsTool();
}

export function setCalcTab(tab) {
  ACTIVE_CALC_TAB = tab;
  SOUND.play('click');
  renderCalculatorsTool();
}

export function recalcActiveCalc() {
  renderActiveCalcTabContent();
}

export function recalcLoan() {
  const P = Number($('#loan-inp-amt')?.value) || 0;
  const r = Number($('#loan-inp-rate')?.value) || 0;
  const n = Number($('#loan-inp-months')?.value) || 1;
  const cur = getCurrentCurrency();

  const res = TOOLS_REGISTRY.cashflow.calc(P, r, n);
  if ($('#loan-res-payment')) $('#loan-res-payment').textContent = `${formatMoney(res.monthlyPayment)} ${cur.sym}/мес`;
  if ($('#loan-res-total')) $('#loan-res-total').textContent = `${formatMoney(res.totalPaid)} ${cur.sym}`;
  if ($('#loan-res-overpay')) $('#loan-res-overpay').textContent = `${formatMoney(res.overpayment)} ${cur.sym}`;
}

export function saveSecurityPin() {
  const pin = $('#sec-pin-input')?.value || '';
  if (pin.length === 4) {
    APP_STATE.pin = pin;
    saveState();
    SOUND.play('coins');
    showToast('PIN-код сохранен ✓');
    $('#modal-tool-runner')?.classList.remove('open');
  } else {
    showToast('Введите 4 цифры');
  }
}

export function downloadBackupJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(APP_STATE, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `coremax_backup_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  SOUND.play('ding');
  showToast('Резервная копия сохранена ✓');
}

export function copyBackupJson() {
  copyResultText(JSON.stringify(APP_STATE, null, 2));
}

export function exportIcsEvent(title, desc) {
  const icsData = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CoreMaX AI//RU\nBEGIN:VEVENT\nSUMMARY:${title}\nDESCRIPTION:${desc}\nDTSTART:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\nDURATION:PT1H\nEND:VEVENT\nEND:VCALENDAR`;
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${title}.ics`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  SOUND.play('ding');
  showToast('Событие добавлено в календарь (.ics) ✓');
}

export function confirmDataReset() {
  if (confirm('Вы действительно хотите полностью очистить данные приложения и вернуть начальные настройки?')) {
    localStorage.clear();
    SOUND.play('click');
    showToast('Данные сброшены. Перезагрузка...');
    setTimeout(() => window.location.reload(), 1000);
  }
}

export function filterGlossary(query) {
  const box = $('#glossary-items-list');
  if (!box) return;
  const q = query.toLowerCase().trim();
  const filtered = GLOSSARY.filter(g => g.term.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q) || g.en.toLowerCase().includes(q));
  box.innerHTML = filtered.map(g => `
    <div style="background:var(--bg-input); padding:10px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
      <div style="display:flex; justify-content:space-between; align-items:baseline;">
        <b style="color:var(--gold-primary); font-size:0.85rem;">${g.term}</b>
        <span style="font-size:0.7rem; color:var(--text-muted);">${g.en}</span>
      </div>
      <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:4px; line-height:1.4;">${g.desc}</div>
      <div style="font-size:0.72rem; color:var(--gold-primary); margin-top:4px; font-weight:600;">💡 ${g.example}</div>
    </div>
  `).join('');
}
