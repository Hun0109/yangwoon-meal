/**
 * Busan Yangwoon High School Meal Assistant & AI Meal Bot Script
 * Enhanced with Supabase Realtime Shared Reactions & Intelligent Meal Bot
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Supabase Module
  SupabaseModule.init();

  // State Variables (with migration from legacy storage keys if present)
  let currentDate = new Date();
  let selectedAllergies = JSON.parse(
    localStorage.getItem('yangwoon_allergies') || localStorage.getItem('daeyang_allergies') || '[]'
  );
  let userReactionsChoice = JSON.parse(
    localStorage.getItem('yangwoon_user_choices') || localStorage.getItem('daeyang_user_choices') || '{}'
  );

  // DOM Elements
  const liveTimeEl = document.getElementById('liveTime');
  const themeToggleBtn = document.getElementById('themeToggle');
  const datePicker = document.getElementById('datePicker');
  const allergyChipsContainer = document.getElementById('allergyChips');
  const mealContainer = document.getElementById('mealContainer');
  const weeklyGrid = document.getElementById('weeklyGrid');
  const countdownText = document.getElementById('countdownText');
  const countdownSub = document.getElementById('countdownSub');
  const mealStatusChip = document.getElementById('mealStatusChip');
  const bannerEmoji = document.getElementById('bannerEmoji');

  // Chatbot Elements
  const openBotBtn = document.getElementById('openBotBtn');
  const botLauncher = document.getElementById('botLauncher');
  const botModalOverlay = document.getElementById('botModalOverlay');
  const botChatWindow = document.getElementById('botChatWindow');
  const closeBotBtn = document.getElementById('closeBotBtn');
  const botMessagesArea = document.getElementById('botMessagesArea');
  const botInputForm = document.getElementById('botInputForm');
  const botTextInput = document.getElementById('botTextInput');

  // Initial Theme Setup
  const savedTheme = localStorage.getItem('yangwoon_theme') || localStorage.getItem('daeyang_theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.setAttribute('data-theme', 'light');
    themeToggleBtn.textContent = '☀️';
  } else {
    document.body.removeAttribute('data-theme');
    themeToggleBtn.textContent = '🌙';
  }

  // Theme Toggle Event
  themeToggleBtn.addEventListener('click', () => {
    const isLight = document.body.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('yangwoon_theme', 'dark');
      themeToggleBtn.textContent = '🌙';
    } else {
      document.body.setAttribute('data-theme', 'light');
      localStorage.setItem('yangwoon_theme', 'light');
      themeToggleBtn.textContent = '☀️';
    }
  });

  // Listen to Realtime Reactions Updates across clients
  SupabaseModule.onRealtimeUpdate((mealId, counts) => {
    const cardEl = document.querySelector(`[data-meal-id="${mealId}"]`);
    if (cardEl) {
      const likeSpan = cardEl.querySelector('.count-like');
      const neutralSpan = cardEl.querySelector('.count-neutral');
      const dislikeSpan = cardEl.querySelector('.count-dislike');
      if (likeSpan) likeSpan.textContent = counts.like || 0;
      if (neutralSpan) neutralSpan.textContent = counts.neutral || 0;
      if (dislikeSpan) dislikeSpan.textContent = counts.dislike || 0;
    }
  });

  // Live Clock & Countdown Loop
  function updateClock() {
    const now = new Date();
    liveTimeEl.textContent = now.toLocaleTimeString('ko-KR', { hour12: false });
    updateCountdown(now);
  }

  function updateCountdown(now) {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinTotal = hours * 60 + minutes;

    // Yangwoon High School Meal Times (Lunch: 12:40 = 760m, Dinner: 18:10 = 1090m)
    const lunchMin = 12 * 60 + 40;
    const dinnerMin = 18 * 60 + 10;

    if (currentMinTotal < lunchMin) {
      const diff = lunchMin - currentMinTotal;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      mealStatusChip.textContent = '🍚 점심시간 카운트다운';
      countdownText.textContent = h > 0 ? `점심까지 ${h}시간 ${m}분 남음!` : `점심까지 ${m}분 남았어요!`;
      countdownSub.textContent = '양운고의 맛있는 점심이 준비되고 있어요!';
      bannerEmoji.textContent = '🍱';
    } else if (currentMinTotal >= lunchMin && currentMinTotal < lunchMin + 50) {
      mealStatusChip.textContent = '🔥 현재 점심시간 중!';
      countdownText.textContent = '지금은 즐거운 점심시간! 😋';
      countdownSub.textContent = '친구들과 함께 맛있게 식사하세요!';
      bannerEmoji.textContent = '🍖';
    } else if (currentMinTotal < dinnerMin) {
      const diff = dinnerMin - currentMinTotal;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      mealStatusChip.textContent = '🌙 저녁시간 카운트다운';
      countdownText.textContent = h > 0 ? `저녁까지 ${h}시간 ${m}분 남음!` : `저녁까지 ${m}분 남았어요!`;
      countdownSub.textContent = '오늘 석식 메뉴를 확인해보세요!';
      bannerEmoji.textContent = '🌙';
    } else {
      mealStatusChip.textContent = '✨ 오늘 급식 완료';
      countdownText.textContent = '오늘 하루도 수고 많으셨습니다! 🎉';
      countdownSub.textContent = '내일 양운고의 맛있는 급식으로 찾아올게요!';
      bannerEmoji.textContent = '😴';
    }
  }

  setInterval(updateClock, 1000);
  updateClock();

  // Format Date to YYYYMMDD and YYYY-MM-DD
  function formatDateYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }

  function formatDateISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Allergy Chips Generator
  function renderAllergyChips() {
    allergyChipsContainer.innerHTML = '';
    Object.entries(NEIS.ALLERGY_MAP).forEach(([code, name]) => {
      const chip = document.createElement('button');
      chip.className = `allergy-chip ${selectedAllergies.includes(parseInt(code)) ? 'selected' : ''}`;
      chip.textContent = name;
      chip.addEventListener('click', () => {
        const numCode = parseInt(code);
        if (selectedAllergies.includes(numCode)) {
          selectedAllergies = selectedAllergies.filter(c => c !== numCode);
        } else {
          selectedAllergies.push(numCode);
        }
        localStorage.setItem('yangwoon_allergies', JSON.stringify(selectedAllergies));
        renderAllergyChips();
        loadMealsForDate(currentDate);
      });
      allergyChipsContainer.appendChild(chip);
    });
  }

  // Load and Render Meal Cards
  async function loadMealsForDate(dateObj) {
    const ymd = formatDateYMD(dateObj);
    datePicker.value = formatDateISO(dateObj);

    mealContainer.innerHTML = `
      <div class="meal-card skeleton-card">
        <div class="skeleton-line title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
    `;

    const meals = await NEIS.getMealData(ymd);

    if (meals.length === 0) {
      const dayName = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

      mealContainer.innerHTML = `
        <div class="no-meal-box">
          <div class="no-meal-icon">🏖️</div>
          <div class="no-meal-text">${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일 (${dayName})에는 등록된 급식 정보가 없습니다.</div>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 6px;">(주말, 공휴일 또는 방학기간일 수 있습니다)</p>
          ${isWeekend ? `<button id="jumpMondayBtn" class="no-meal-action-btn">👉 다음 주 월요일 급식 보기</button>` : ''}
        </div>
      `;

      const jumpBtn = document.getElementById('jumpMondayBtn');
      if (jumpBtn) {
        jumpBtn.addEventListener('click', () => {
          const nextMon = new Date(dateObj);
          const currentDay = dateObj.getDay();
          const daysUntilMonday = currentDay === 0 ? 1 : 2; // Sunday -> +1, Saturday -> +2
          nextMon.setDate(nextMon.getDate() + daysUntilMonday);
          currentDate = nextMon;
          loadMealsForDate(currentDate);
          renderWeeklyGrid();
        });
      }
      return;
    }

    mealContainer.innerHTML = '';
    for (const meal of meals) {
      const card = await createMealCard(meal, ymd);
      mealContainer.appendChild(card);
    }
  }

  // Create Single Meal Card Element with Supabase Shared Reaction Sync
  async function createMealCard(meal, ymdKey) {
    const card = document.createElement('div');
    card.className = 'meal-card';

    const reactionKey = `yangwoon_${ymdKey}_${meal.mealCode}`;
    card.setAttribute('data-meal-id', reactionKey);

    // Fetch Shared Counts from Supabase / Shared DB
    const sharedCounts = await SupabaseModule.getReactions(reactionKey);
    const myChoice = userReactionsChoice[reactionKey] || null;

    // Header
    let mealTypeName = '🍱 중식 (점심)';
    if (meal.mealCode === '1') mealTypeName = '🍳 조식 (아침)';
    else if (meal.mealCode === '3') mealTypeName = '🌙 석식 (저녁)';

    let html = `
      <div class="meal-card-header">
        <div class="meal-type-title">${mealTypeName}</div>
        ${meal.calorie ? `<div class="calorie-badge">🔥 ${meal.calorie}</div>` : ''}
      </div>
      <ul class="menu-list">
    `;

    // Menu Items
    meal.dishes.forEach(dish => {
      const warningAllergies = dish.allergyCodes.filter(c => selectedAllergies.includes(c));
      const hasWarning = warningAllergies.length > 0;
      const warningNames = warningAllergies.map(c => NEIS.ALLERGY_MAP[c]).join(', ');

      html += `
        <li class="menu-item ${hasWarning ? 'has-allergy' : ''}">
          <span class="menu-item-name">
            ${dish.name}
            ${dish.isSpecial ? '<span class="special-badge">🔥 특식</span>' : ''}
          </span>
          ${hasWarning ? `<span class="allergy-warn-tag">⚠️ ${warningNames} 함유</span>` : ''}
        </li>
      `;
    });

    html += `</ul>`;

    // Nutrition Progress Bar
    const ntr = meal.nutrition;
    if (ntr && (ntr.carbs > 0 || ntr.protein > 0 || ntr.fat > 0)) {
      const total = ntr.carbs + ntr.protein + ntr.fat || 1;
      const carbsPct = Math.round((ntr.carbs / total) * 100);
      const proteinPct = Math.round((ntr.protein / total) * 100);
      const fatPct = Math.round((ntr.fat / total) * 100);

      html += `
        <div class="nutrition-card">
          <span class="nutrition-title">📊 영양 성분 비율 (탄 / 단 / 지)</span>
          <div class="nutrition-bars">
            <div class="nutri-item">
              <span class="nutri-label"><span>탄수화물</span> <span>${ntr.carbs}g (${carbsPct}%)</span></span>
              <div class="progress-track"><div class="progress-fill fill-carbs" style="width: ${carbsPct}%;"></div></div>
            </div>
            <div class="nutri-item">
              <span class="nutri-label"><span>단백질</span> <span>${ntr.protein}g (${proteinPct}%)</span></span>
              <div class="progress-track"><div class="progress-fill fill-protein" style="width: ${proteinPct}%;"></div></div>
            </div>
            <div class="nutri-item">
              <span class="nutri-label"><span>지방</span> <span>${ntr.fat}g (${fatPct}%)</span></span>
              <div class="progress-track"><div class="progress-fill fill-fat" style="width: ${fatPct}%;"></div></div>
            </div>
          </div>
        </div>
      `;
    }

    // Reaction Bar (Realtime Shared Counts)
    html += `
      <div class="reaction-bar">
        <button class="reaction-btn ${myChoice === 'like' ? 'active' : ''}" data-type="like">
          👍 존맛 <span class="count-like">${sharedCounts.like}</span>
        </button>
        <button class="reaction-btn ${myChoice === 'neutral' ? 'active' : ''}" data-type="neutral">
          😐 보통 <span class="count-neutral">${sharedCounts.neutral}</span>
        </button>
        <button class="reaction-btn ${myChoice === 'dislike' ? 'active' : ''}" data-type="dislike">
          👎 별로 <span class="count-dislike">${sharedCounts.dislike}</span>
        </button>
      </div>
    `;

    card.innerHTML = html;

    // Attach reaction click handlers
    card.querySelectorAll('.reaction-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const type = btn.getAttribute('data-type');
        const prevChoice = userReactionsChoice[reactionKey] || null;

        if (prevChoice === type) {
          // Toggle off
          userReactionsChoice[reactionKey] = null;
          await SupabaseModule.voteReaction(reactionKey, type, -1);
        } else {
          // Switch or new vote
          if (prevChoice) {
            await SupabaseModule.voteReaction(reactionKey, prevChoice, -1);
          }
          userReactionsChoice[reactionKey] = type;
          await SupabaseModule.voteReaction(reactionKey, type, 1);
        }

        localStorage.setItem('yangwoon_user_choices', JSON.stringify(userReactionsChoice));

        // Refresh Card Counts immediately
        const newCounts = await SupabaseModule.getReactions(reactionKey);
        const likeSpan = card.querySelector('.count-like');
        const neutralSpan = card.querySelector('.count-neutral');
        const dislikeSpan = card.querySelector('.count-dislike');
        if (likeSpan) likeSpan.textContent = newCounts.like;
        if (neutralSpan) neutralSpan.textContent = newCounts.neutral;
        if (dislikeSpan) dislikeSpan.textContent = newCounts.dislike;

        // Toggle Active styles
        card.querySelectorAll('.reaction-btn').forEach(b => {
          if (b.getAttribute('data-type') === userReactionsChoice[reactionKey]) {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });
      });
    });

    return card;
  }

  // Render Weekly Grid View
  async function renderWeeklyGrid() {
    weeklyGrid.innerHTML = '';

    // Get current Monday
    const temp = new Date(currentDate);
    const day = temp.getDay();
    const diff = temp.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(temp.setDate(diff));

    const dayLabels = ['월', '화', '수', '목', '금'];
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    // Pre-fetch week data in single range call for maximum speed
    const fromYmd = formatDateYMD(monday);
    const toYmd = formatDateYMD(friday);
    await NEIS.getMealRange(fromYmd, toYmd);

    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const ymd = formatDateYMD(d);
      const isSelected = formatDateYMD(currentDate) === ymd;

      const miniCard = document.createElement('div');
      miniCard.className = `weekly-mini-card ${isSelected ? 'active' : ''}`;
      miniCard.innerHTML = `
        <div class="weekly-day">${dayLabels[i]}요일</div>
        <div class="weekly-date">${d.getMonth() + 1}/${d.getDate()}</div>
        <div class="weekly-menu-summary" id="week-sum-${ymd}">로딩 중...</div>
      `;

      miniCard.addEventListener('click', () => {
        currentDate = new Date(d);
        loadMealsForDate(currentDate);
        renderWeeklyGrid();
      });

      weeklyGrid.appendChild(miniCard);

      // Async fetch summary for weekly grid
      NEIS.getMealData(ymd).then(meals => {
        const sumEl = document.getElementById(`week-sum-${ymd}`);
        if (sumEl) {
          if (meals.length > 0 && meals[0].dishes.length > 0) {
            const summary = meals[0].dishes.slice(0, 3).map(dish => dish.name).join(', ');
            sumEl.textContent = summary;
          } else {
            sumEl.textContent = '급식 없음';
          }
        }
      });
    }
  }

  // Quick Date Navigation Buttons
  document.querySelectorAll('.date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const offset = parseInt(btn.getAttribute('data-offset'));
      currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + offset);

      document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      loadMealsForDate(currentDate);
      renderWeeklyGrid();
    });
  });

  // Custom Date Picker Event
  datePicker.addEventListener('change', (e) => {
    if (e.target.value) {
      currentDate = new Date(e.target.value);
      document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
      loadMealsForDate(currentDate);
      renderWeeklyGrid();
    }
  });

  // ==========================================================================
  // YANGWOON MEAL BOT (AI CHATBOT) IMPLEMENTATION
  // ==========================================================================

  function toggleBot(open) {
    if (open) {
      botModalOverlay.classList.add('open');
      botChatWindow.classList.add('open');
      botTextInput.focus();
    } else {
      botModalOverlay.classList.remove('open');
      botChatWindow.classList.remove('open');
    }
  }

  if (openBotBtn) openBotBtn.addEventListener('click', () => toggleBot(true));
  if (botLauncher) botLauncher.addEventListener('click', () => toggleBot(true));
  if (closeBotBtn) closeBotBtn.addEventListener('click', () => toggleBot(false));
  if (botModalOverlay) botModalOverlay.addEventListener('click', () => toggleBot(false));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && botChatWindow.classList.contains('open')) {
      toggleBot(false);
    }
  });

  // Render Bot Message Bubble
  function appendMessage(sender, textHtml, showChips = false) {
    const msgEl = document.createElement('div');
    msgEl.className = `bot-msg ${sender}`;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    let innerHtml = '';
    if (sender === 'bot') {
      innerHtml = `
        <div class="bot-msg-avatar">🤖</div>
        <div class="bot-msg-content">
          <div class="bot-msg-bubble">${textHtml}</div>
          ${showChips ? renderBotQuickChipsHtml() : ''}
        </div>
        <div class="bot-msg-time">${timeStr}</div>
      `;
    } else {
      innerHtml = `
        <div class="bot-msg-bubble">${textHtml}</div>
        <div class="bot-msg-time">${timeStr}</div>
      `;
    }

    msgEl.innerHTML = innerHtml;
    botMessagesArea.appendChild(msgEl);
    botMessagesArea.scrollTop = botMessagesArea.scrollHeight;

    // Attach click listeners to chips if rendered
    if (showChips) {
      msgEl.querySelectorAll('.bot-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const query = chip.getAttribute('data-query');
          handleBotUserQuery(query);
        });
      });
    }
  }

  function renderBotQuickChipsHtml() {
    return `
      <div class="bot-quick-chips">
        <button type="button" class="bot-chip" data-query="오늘 점심 뭐야?">🍱 오늘 점심</button>
        <button type="button" class="bot-chip" data-query="내일 급식 알려줘">📅 내일 급식</button>
        <button type="button" class="bot-chip" data-query="이번 주 특식 모아보기">🔥 이번 주 특식</button>
        <button type="button" class="bot-chip" data-query="오늘 칼로리 & 영양">📊 영양 & 칼로리</button>
        <button type="button" class="bot-chip" data-query="알레르기 안내">⚠️ 알레르기 안내</button>
      </div>
    `;
  }

  // Smart Query Handler for Yangwoon Meal Bot
  async function handleBotUserQuery(rawText) {
    const text = rawText.trim();
    if (!text) return;

    appendMessage('user', text);
    botTextInput.value = '';

    // Show typing/thinking state
    const thinkingId = 'thinking_' + Date.now();
    const thinkingEl = document.createElement('div');
    thinkingEl.className = 'bot-msg bot';
    thinkingEl.id = thinkingId;
    thinkingEl.innerHTML = `
      <div class="bot-msg-avatar">🤖</div>
      <div class="bot-msg-bubble" style="color: var(--text-muted); font-style: italic;">
        양운고 나이스 API에서 급식 정보를 조회하고 있어요... 💭
      </div>
    `;
    botMessagesArea.appendChild(thinkingEl);
    botMessagesArea.scrollTop = botMessagesArea.scrollHeight;

    try {
      const responseHtml = await processQuery(text);
      const thinking = document.getElementById(thinkingId);
      if (thinking) thinking.remove();
      appendMessage('bot', responseHtml, true);
    } catch (err) {
      console.error('Bot Error:', err);
      const thinking = document.getElementById(thinkingId);
      if (thinking) thinking.remove();
      appendMessage('bot', '급식 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요!', true);
    }
  }

  async function processQuery(query) {
    const q = query.toLowerCase();
    const now = new Date();

    // 1. 이번 주 특식 질문
    if (q.includes('특식') || q.includes('치킨') || q.includes('돈까스') || q.includes('피자') || q.includes('스파게티')) {
      return await getWeeklySpecialMenuResponse();
    }

    // 2. 알레르기 질문
    if (q.includes('알레르기') || q.includes('알러지')) {
      return getAllergyGuideResponse();
    }

    // 3. 영양 & 칼로리 질문
    if (q.includes('칼로리') || q.includes('영양') || q.includes('단백질') || q.includes('다이어트')) {
      return await getNutritionQueryResponse();
    }

    // 4. 내일 급식
    if (q.includes('내일')) {
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      return await getDayMealResponse(tomorrow, '내일');
    }

    // 5. 특정 요일 질문 (월/화/수/목/금)
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    for (let i = 1; i <= 5; i++) {
      if (q.includes(`${dayNames[i]}요일`) || q.includes(`${dayNames[i]}요`)) {
        const monday = getMonday(now);
        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + (i - 1));
        return await getDayMealResponse(targetDate, `${dayNames[i]}요일`);
      }
    }

    // 6. 석식 (저녁) 질문
    if (q.includes('석식') || q.includes('저녁')) {
      return await getDinnerResponse(now);
    }

    // 7. 기본 오늘 급식 (점심) 질문
    if (q.includes('오늘') || q.includes('점심') || q.includes('급식') || q.includes('메뉴') || q.includes('뭐 나와')) {
      return await getDayMealResponse(now, '오늘');
    }

    // 8. 인사 / 정체성 질문
    if (q.includes('안녕') || q.includes('하이') || q.includes('누구')) {
      return `
        안녕하세요! 부산 <b>양운고등학교 급식봇</b>입니다 🏫🍱<br><br>
        나이스(NEIS) 교육정보개방포털 공식 실시간 데이터를 기반으로 양운고 학생들에게 최신 중식/석식, 칼로리, 특식 정보 및 알레르기 안심 체크를 안내해 드려요!
      `;
    }

    // Default: 오늘 급식 + 추천
    return await getDayMealResponse(now, '오늘');
  }

  function getMonday(d) {
    const temp = new Date(d);
    const day = temp.getDay();
    const diff = temp.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(temp.setDate(diff));
  }

  async function getDayMealResponse(targetDate, label) {
    const ymd = formatDateYMD(targetDate);
    const dayName = ['일', '월', '화', '수', '목', '금', '토'][targetDate.getDay()];
    const dateFormatted = `${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일 (${dayName})`;

    const meals = await NEIS.getMealData(ymd);

    if (!meals || meals.length === 0) {
      if (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
        // Weekend: Suggest next Monday
        const nextMon = new Date(targetDate);
        const daysToAdd = targetDate.getDay() === 0 ? 1 : 2;
        nextMon.setDate(nextMon.getDate() + daysToAdd);
        const monYmd = formatDateYMD(nextMon);
        const monMeals = await NEIS.getMealData(monYmd);

        let extra = '';
        if (monMeals && monMeals.length > 0) {
          const dishNames = monMeals[0].dishes.map(d => d.isSpecial ? `🔥 <b>${d.name}</b>` : d.name).join(', ');
          extra = `<br><br>💡 <b>돌아오는 월요일(${nextMon.getMonth() + 1}/${nextMon.getDate()}) 점심 메뉴</b>:<br>${dishNames}`;
        }

        return `🏖️ <b>${label} (${dateFormatted})</b>은 주말이라 급식이 없습니다! 주말 푹 쉬세요!${extra}`;
      }
      return `🏖️ <b>${label} (${dateFormatted})</b>에는 등록된 양운고 급식 정보가 없습니다. (공휴일 또는 방학기간일 수 있습니다)`;
    }

    let res = `🍱 <b>양운고등학교 ${label} (${dateFormatted}) 식단</b><br><br>`;
    meals.forEach(m => {
      const type = m.mealCode === '2' ? '🍚 중식 (점심)' : (m.mealCode === '3' ? '🌙 석식 (저녁)' : '🍳 조식');
      res += `<b>[${type}]</b> ${m.calorie ? `(🔥 ${m.calorie})` : ''}<br>`;
      m.dishes.forEach(d => {
        const specialBadge = d.isSpecial ? ' <span style="color:#f97316; font-weight:bold;">[특식]</span>' : '';
        res += `• ${d.name}${specialBadge}<br>`;
      });
      res += '<br>';
    });

    return res;
  }

  async function getDinnerResponse(targetDate) {
    const ymd = formatDateYMD(targetDate);
    const dayName = ['일', '월', '화', '수', '목', '금', '토'][targetDate.getDay()];
    const meals = await NEIS.getMealData(ymd);

    const dinner = meals.find(m => m.mealCode === '3');
    if (!dinner) {
      return `🌙 ${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일 (${dayName})에는 등록된 석식(저녁) 메뉴가 없습니다.`;
    }

    let res = `🌙 <b>양운고 오늘 석식 메뉴 (${targetDate.getMonth() + 1}/${targetDate.getDate()})</b><br>`;
    if (dinner.calorie) res += `열량: 🔥 ${dinner.calorie}<br><br>`;
    dinner.dishes.forEach(d => {
      res += `• ${d.name} ${d.isSpecial ? '🔥 [특식]' : ''}<br>`;
    });
    return res;
  }

  async function getWeeklySpecialMenuResponse() {
    const monday = getMonday(new Date());
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const fromYmd = formatDateYMD(monday);
    const toYmd = formatDateYMD(friday);
    await NEIS.getMealRange(fromYmd, toYmd);

    const dayLabels = ['월', '화', '수', '목', '금'];
    const specialList = [];

    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ymd = formatDateYMD(d);
      const meals = await NEIS.getMealData(ymd);

      meals.forEach(m => {
        const specials = m.dishes.filter(dish => dish.isSpecial);
        if (specials.length > 0) {
          specialList.push({
            day: `${dayLabels[i]}요일 (${d.getMonth() + 1}/${d.getDate()})`,
            type: m.mealType,
            dishes: specials.map(s => s.name)
          });
        }
      });
    }

    if (specialList.length === 0) {
      return `이번 주 양운고 급식표에는 특별 키워드(치킨, 돈까스 등) 특식이 감지되지 않았지만, 매일 정성 가득한 식단이 준비되어 있어요!`;
    }

    let res = `🔥 <b>이번 주 양운고 특식 모아보기!</b><br><br>`;
    specialList.forEach(item => {
      res += `📅 <b>${item.day} [${item.type}]</b><br>`;
      res += `👉 <span style="color:#f97316; font-weight:bold;">${item.dishes.join(', ')}</span><br><br>`;
    });

    return res;
  }

  async function getNutritionQueryResponse() {
    const ymd = formatDateYMD(currentDate);
    const meals = await NEIS.getMealData(ymd);

    if (!meals || meals.length === 0) {
      return `현재 선택된 날짜(${currentDate.getMonth() + 1}/${currentDate.getDate()})의 영양 정보가 없습니다.`;
    }

    let res = `📊 <b>양운고 급식 영양 & 열량 분석</b><br><br>`;
    meals.forEach(m => {
      const ntr = m.nutrition;
      res += `<b>[${m.mealType}]</b> ${m.calorie ? `열량: 🔥 ${m.calorie}` : ''}<br>`;
      if (ntr && (ntr.carbs > 0 || ntr.protein > 0 || ntr.fat > 0)) {
        res += `• 탄수화물: ${ntr.carbs}g<br>`;
        res += `• 단백질: ${ntr.protein}g<br>`;
        res += `• 지방: ${ntr.fat}g<br>`;
      }
      res += '<br>';
    });

    return res;
  }

  function getAllergyGuideResponse() {
    let selectedText = '현재 선택된 알레르기가 없습니다. 화면 상단 <b>알레르기 안심 필터</b>에서 자신에게 해당하는 식재료를 선택해보세요!';
    if (selectedAllergies.length > 0) {
      const names = selectedAllergies.map(c => NEIS.ALLERGY_MAP[c]).join(', ');
      selectedText = `현재 필터링 중인 알레르기 항목: <b>${names}</b><br>해당 식재료가 포함된 메뉴는 자동으로 노란색 경고 라벨이 부착됩니다.`;
    }

    return `
      🛡️ <b>나이스(NEIS) 공식 알레르기 유발 식품 19종</b><br><br>
      1: 난류(계란), 2: 우유, 3: 메밀, 4: 땅콩, 5: 대두(콩), 6: 밀, 7: 고등어, 8: 게, 9: 새우, 10: 돼지고기, 11: 복숭아, 12: 토마토, 13: 아황산류, 14: 호두, 15: 닭고기, 16: 쇠고기, 17: 오징어, 18: 조개류, 19: 잣<br><br>
      ${selectedText}
    `;
  }

  // Form Submit Event
  if (botInputForm) {
    botInputForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = botTextInput.value.trim();
      if (val) {
        handleBotUserQuery(val);
      }
    });
  }

  // Initial Welcome Message in Bot
  appendMessage('bot', `
    안녕! 나는 <b>부산 양운고등학교 급식봇</b>이야 🤖🍱<br>
    양운고 실시간 급식 메뉴부터 이번 주 특식, 칼로리, 알레르기까지 무엇이든 물어봐!
  `, true);

  // Initial Page Load
  renderAllergyChips();
  await loadMealsForDate(currentDate);
  renderWeeklyGrid();
});
