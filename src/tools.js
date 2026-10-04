import { APP_STATE, saveState, showToast, $, formatMoney, getCurrentCurrency, getCurrentNiche, navigateToScreen } from './app.js';
import { GLOSSARY, HELP_FAQS } from './glossary.js';
import { ALL_NICHES, NICHE_CATEGORIES } from './niches.js';
import { SOUND } from './sound.js';

export function openNichePicker() {
  SOUND.play('click');
  const modal = $('#modal-tool-runner');
  const title = $('#tool-runner-title');
  const body = $('#tool-runner-body');
  if (!modal || !title || !body) return;

  title.textContent = '🏢 Выбор ниши бизнеса';
  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px;">
      <input type="text" id="niche-search-input" class="input-control" placeholder="Поиск ниши..." oninput="window.APP.filterNiches(this.value)">
      <div id="niches-list-box" style="display:flex; flex-direction:column; gap:6px; max-height:60vh; overflow-y:auto;">
        ${NICHE_CATEGORIES.map(cat => `
          <div style="font-size:0.75rem; font-weight:800; color:var(--gold-primary); margin-top:8px;">${cat.icon} ${cat.name}</div>
          ${cat.niches.map(n => `
            <button type="button" class="btn btn-secondary" onclick="window.APP.selectNiche('${n.id}')" style="justify-content:flex-start; height:42px; font-size:0.8rem; padding:0 10px; ${n.id === APP_STATE.activeNicheId ? 'border-color:var(--gold-primary); background:rgba(245,158,11,0.1);' : ''}">
              <span>${n.name}</span>
            </button>
          `).join('')}
        `).join('')}
      </div>
    </div>
  `;
  modal.classList.add('open');
}

export function selectNiche(id) {
  APP_STATE.activeNicheId = id;
  APP_STATE.checklist.nicheSet = true;
  saveState();
  SOUND.play('ding');
  $('#modal-tool-runner')?.classList.remove('open');
  navigateToScreen(APP_STATE.activeScreen);
  showToast('Ниша обновлена ✓');
}

export function filterNiches(query) {
  const box = $('#niches-list-box');
  if (!box) return;
  const q = query.toLowerCase().trim();
  const matched = ALL_NICHES.filter(n => n.name.toLowerCase().includes(q));
  box.innerHTML = matched.map(n => `
    <button type="button" class="btn btn-secondary" onclick="window.APP.selectNiche('${n.id}')" style="justify-content:flex-start; height:42px; font-size:0.8rem; padding:0 10px;">
      <span>${n.name}</span>
    </button>
  `).join('');
}

export function openHelpModal(screenKey = 'analyst') {
  SOUND.play('ding');
  const modal = $('#modal-tool-runner');
  const title = $('#tool-runner-title');
  const body = $('#tool-runner-body');
  if (!modal || !title || !body) return;

  title.textContent = '❓ Помощь и Обучение';
  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="card card-gold">
        <div style="font-size:0.85rem; font-weight:800; color:var(--gold-primary); margin-bottom:4px;">🎯 Как устроен раздел</div>
        <div style="font-size:0.8rem; line-height:1.5; color:var(--text-primary);">
          Вводите свои ключевые цифры (выручку, аренду, ФОТ, маркетинг) и моментально получайте аудит: маржинальность, точку безубыточности и рекомендации ИИ.
        </div>
      </div>

      <div style="font-size:0.82rem; font-weight:800; margin-top:6px;">Часто задаваемые вопросы:</div>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${HELP_FAQS.map(f => `
          <div style="background:var(--bg-input); padding:10px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
            <div style="font-weight:700; font-size:0.8rem; color:var(--gold-primary); margin-bottom:2px;">${f.q}</div>
            <div style="font-size:0.75rem; color:var(--text-secondary); line-height:1.45;">${f.a}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  modal.classList.add('open');
}

export function openGlossaryModal() {
  SOUND.play('click');
  const modal = $('#modal-tool-runner');
  const title = $('#tool-runner-title');
  const body = $('#tool-runner-body');
  if (!modal || !title || !body) return;

  title.textContent = '📖 Словарик терминов';
  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${GLOSSARY.map(g => `
        <div style="background:var(--bg-input); padding:10px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <div style="display:flex; justify-content:space-between; align-items:baseline;">
            <b style="color:var(--gold-primary); font-size:0.85rem;">${g.term}</b>
            <span style="font-size:0.7rem; color:var(--text-muted);">${g.en}</span>
          </div>
          <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:4px; line-height:1.4;">${g.def}</div>
          <div style="font-size:0.72rem; color:var(--gold-primary); margin-top:4px; font-weight:600;">💡 ${g.ex}</div>
        </div>
      `).join('')}
    </div>
  `;
  modal.classList.add('open');
}

export function openToolModal(toolKey) {
  SOUND.play('click');
  const modal = $('#modal-tool-runner');
  const title = $('#tool-runner-title');
  const body = $('#tool-runner-body');
  if (!modal || !title || !body) return;

  const cur = getCurrentCurrency();
  const niche = getCurrentNiche();

  if (toolKey === 'invoice') {
    title.textContent = '🧾 Счета и сметы';
    body.innerHTML = `
      <div class="card card-gold">
        <div style="font-weight:700; font-size:0.9rem;">Счёт № СЧ-101</div>
        <div style="font-size:0.8rem; color:var(--text-secondary); margin:6px 0;">Клиент: ООО «Партнёр»</div>
        <div style="font-size:1.3rem; font-weight:800; color:var(--gold-primary);">65 000 ${cur.sym}</div>
        <button type="button" class="btn btn-gold" onclick="navigator.clipboard?.writeText('Счёт №101 на 65 000 ${cur.sym}'); window.APP.showToast('Скопировано в буфер ✓');" style="width:100%; margin-top:10px;">📋 Скопировать текст счёта</button>
      </div>
    `;
  } else if (toolKey === 'discount') {
    title.textContent = '🏷️ Калькулятор скидок';
    body.innerHTML = `
      <div class="card">
        <div class="field-group">
          <label class="field-label">Исходная цена (${cur.sym})</label>
          <input type="number" id="calc-disc-price" class="input-control" value="1000">
        </div>
        <div class="field-group">
          <label class="field-label">Скидка (%)</label>
          <input type="number" id="calc-disc-pct" class="input-control" value="15">
        </div>
        <button type="button" class="btn btn-gold" onclick="
          const p = Number($('#calc-disc-price').value) || 0;
          const d = Number($('#calc-disc-pct').value) || 0;
          const finalP = p * (1 - d / 100);
          $('#disc-res').textContent = formatMoney(finalP) + ' ${cur.sym}';
          SOUND.play('coins');
        " style="width:100%; margin-top:6px;">Рассчитать</button>
        <div style="margin-top:10px; text-align:center; font-size:1.1rem; font-weight:800; color:var(--gold-primary);" id="disc-res">850 ${cur.sym}</div>
      </div>
    `;
  } else if (toolKey === 'taxes') {
    title.textContent = '📑 Налоги и взносы';
    body.innerHTML = `
      <div class="card">
        <div class="field-group">
          <label class="field-label">Валовая выручка (${cur.sym})</label>
          <input type="number" id="tax-rev-input" class="input-control" value="500000">
        </div>
        <div class="field-group">
          <label class="field-label">Ставка УСН Доходы (%)</label>
          <input type="number" id="tax-rate-input" class="input-control" value="6">
        </div>
        <button type="button" class="btn btn-gold" onclick="
          const r = Number($('#tax-rev-input').value) || 0;
          const st = Number($('#tax-rate-input').value) || 6;
          const tax = r * (st / 100);
          $('#tax-res-val').textContent = formatMoney(tax) + ' ${cur.sym}';
          SOUND.play('coins');
        " style="width:100%; margin-top:6px;">Рассчитать налог</button>
        <div style="margin-top:10px; text-align:center; font-weight:800; font-size:1.1rem; color:var(--rose-primary);" id="tax-res-val">30 000 ${cur.sym}</div>
      </div>
    `;
  } else if (toolKey === 'salaries') {
    title.textContent = '👥 Зарплаты и бонусы';
    body.innerHTML = `
      <div class="card">
        <div style="font-weight:700; font-size:0.85rem;">ФОТ команды: 200 000 ${cur.sym}</div>
        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">Доля ФОТ в выручке соответствует норме вашей ниши.</div>
      </div>
    `;
  } else if (toolKey === 'debts') {
    title.textContent = '🤝 Учёт долгов';
    body.innerHTML = `
      <div class="card">
        <div style="font-weight:700; font-size:0.85rem;">Долгов к получению: 0 ${cur.sym}</div>
        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">Все расчёты с клиентами закрыты.</div>
      </div>
    `;
  } else if (toolKey === 'crm') {
    title.textContent = '👤 Мини-CRM клиенты';
    body.innerHTML = `
      <div class="card">
        <div style="font-weight:700; font-size:0.85rem;">База клиентов активна</div>
        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">История покупок и теги синхронизированы.</div>
      </div>
    `;
  } else if (toolKey === 'copywriter') {
    title.textContent = '✍️ Генератор текстов';
    body.innerHTML = `
      <div class="card card-gold">
        <div style="font-weight:700; font-size:0.85rem; color:var(--gold-primary);">Пост для ниши «${niche.name}»:</div>
        <div style="font-size:0.8rem; line-height:1.5; margin-top:6px; background:var(--bg-input); padding:10px; border-radius:var(--radius-sm);">
          🔥 Специальное предложение недели в ${niche.name}! Попробуйте безупречное качество. Ждём вас!
        </div>
      </div>
    `;
  } else if (toolKey === 'slogans') {
    title.textContent = '✨ Названия & Слоганы';
    body.innerHTML = `
      <div class="card">
        <div style="font-weight:700; font-size:0.85rem; color:var(--gold-primary);">Слоган для вашего бренда:</div>
        <div style="font-size:0.9rem; margin-top:6px; font-weight:700;">«Ваш надежный партнер для уверенного роста»</div>
      </div>
    `;
  } else if (toolKey === 'business_plan') {
    title.textContent = '📋 Генератор Бизнес-плана';
    body.innerHTML = `
      <div class="card" style="font-family:var(--font-mono); font-size:0.75rem; line-height:1.6;">
        <b>Бизнес-план: ${niche.name}</b><br>
        • Целевая маржа: ${niche.margin}%<br>
        • Окупаемость: 6-9 месяцев<br>
        • Стратегия: автоматизация и контроль затрат.
      </div>
    `;
  } else if (toolKey === 'canvas') {
    title.textContent = '🗺️ Бизнес-модель Canvas';
    body.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.75rem;">
        <div class="card" style="padding:10px;"><b style="color:var(--gold-primary);">Партнеры:</b> Поставщики</div>
        <div class="card" style="padding:10px;"><b style="color:var(--gold-primary);">Процессы:</b> Продажи</div>
        <div class="card" style="padding:10px;"><b style="color:var(--gold-primary);">Ценность:</b> Сервис</div>
        <div class="card" style="padding:10px;"><b style="color:var(--gold-primary);">Клиенты:</b> B2C</div>
      </div>
    `;
  } else {
    title.textContent = '⚡ Бизнес-инструмент';
    body.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-secondary);">Инструмент активирован и настроен для вашей ниши.</div>`;
  }

  modal.classList.add('open');
}
