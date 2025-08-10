document.addEventListener('DOMContentLoaded', async () => {
    const passcodeScreen = document.getElementById('passcode-screen');
    const appScreen = document.getElementById('app-screen');
    const chatbotScreen = document.getElementById('chatbot-screen');

    const passcodePrompt = document.getElementById('passcode-prompt');
    const passcodeError = document.getElementById('passcode-error');
    const passcode_input = document.getElementById('passcode-input');

    let currentPasscode = await getPasscode();
    if (currentPasscode) {
        passcodePrompt.textContent = 'Enter your 4-digit passcode.';
    } else {
        passcodePrompt.textContent = 'Set a 4-digit passcode.';
    }

    passcode_input.addEventListener('input', async (e) => {
        const input = e.target.value;
        if (input.length === 4) {
            if (currentPasscode) {
                if (input === currentPasscode) {
                    showApp();
                } else {
                    passcodeError.textContent = 'Incorrect passcode.';
                    e.target.value = '';
                }
            } else {
                await setPasscode(input);
                currentPasscode = input;
                showApp();
            }
        }
    });

    function showApp() {
        passcodeScreen.classList.remove('active');
        appScreen.classList.add('active');
        renderCalendar();
    }

    // Calendar Logic
    const monthYearEl = document.getElementById('month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    // Cycle Info Elements
    const lastPeriodStartEl = document.getElementById('last-period-start');
    const avgCycleLengthEl = document.getElementById('avg-cycle-length');
    const nextPeriodDateEl = document.getElementById('next-period-date');

    let currentDate = new Date();

    async function updateApp() {
        await renderCalendar();
        await updateCycleInfo();
    }

    async function renderCalendar() {
        calendarGrid.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        monthYearEl.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const periodDays = await getPeriodDays();

        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            calendarGrid.appendChild(emptyCell);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('calendar-day');
            dayCell.textContent = i;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            if (periodDays.includes(dateStr)) {
                dayCell.classList.add('period');
            }

            if (i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                dayCell.classList.add('today');
            }

            dayCell.addEventListener('click', () => handleDateClick(dateStr));
            calendarGrid.appendChild(dayCell);
        }
    }

    async function handleDateClick(dateStr) {
        const periodDays = await getPeriodDays();
        if (periodDays.includes(dateStr)) {
            await removePeriodDay(dateStr);
        } else {
            await logPeriodDay(dateStr);
        }
        updateApp();
    }

    async function updateCycleInfo() {
        const periodDays = await getPeriodDays();
        periodDays.sort();

        if (periodDays.length === 0) {
            lastPeriodStartEl.textContent = '--';
            avgCycleLengthEl.textContent = '--';
            nextPeriodDateEl.textContent = '--';
            return;
        }

        const cycles = [];
        let currentCycleStart = new Date(periodDays[0]);

        for (let i = 1; i < periodDays.length; i++) {
            const day = new Date(periodDays[i]);
            const prevDay = new Date(periodDays[i - 1]);
            const diff = (day - prevDay) / (1000 * 60 * 60 * 24);
            if (diff > 1) { // New cycle
                cycles.push({ start: currentCycleStart, end: prevDay });
                currentCycleStart = day;
            }
        }
        cycles.push({ start: currentCycleStart, end: new Date(periodDays[periodDays.length - 1]) });

        const lastCycle = cycles[cycles.length - 1];
        lastPeriodStartEl.textContent = lastCycle.start.toLocaleDateString();

        if (cycles.length > 1) {
            const cycleLengths = [];
            for (let i = 1; i < cycles.length; i++) {
                const length = (cycles[i].start - cycles[i - 1].start) / (1000 * 60 * 60 * 24);
                cycleLengths.push(length);
            }
            const avgLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
            avgCycleLengthEl.textContent = `${avgLength} days`;

            const nextDate = new Date(lastCycle.start);
            nextDate.setDate(nextDate.getDate() + avgLength);
            nextPeriodDateEl.textContent = nextDate.toLocaleDateString();
        } else {
            avgCycleLengthEl.textContent = '--';
            nextPeriodDateEl.textContent = '--';
        }
    }

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Initial Load
    showApp = () => {
        passcodeScreen.classList.remove('active');
        appScreen.classList.add('active');
        updateApp();
    };

    // Chatbot Logic
    const openChatbotBtn = document.getElementById('open-chatbot-btn');
    const closeChatbotBtn = document.getElementById('close-chatbot-btn');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSendBtn = document.getElementById('chatbot-send-btn');

    openChatbotBtn.addEventListener('click', () => {
        appScreen.classList.remove('active');
        chatbotScreen.style.display = 'flex';
    });

    closeChatbotBtn.addEventListener('click', () => {
        chatbotScreen.style.display = 'none';
        appScreen.classList.add('active');
    });

    chatbotSendBtn.addEventListener('click', async () => {
        const message = chatbotInput.value.trim();
        if (message) {
            appendMessage('user', message);
            chatbotInput.value = '';

            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message }),
                });

                if (response.ok) {
                    const data = await response.json();
                    appendMessage('bot', data.reply);
                } else {
                    appendMessage('bot', 'Sorry, something went wrong.');
                }
            } catch (error) {
                console.error('Chatbot error:', error);
                appendMessage('bot', 'Sorry, I can\'t connect to the chatbot right now.');
            }
        }
    });

    function appendMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = text;
        chatbotMessages.appendChild(messageElement);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
});
