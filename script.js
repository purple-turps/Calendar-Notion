document.addEventListener("DOMContentLoaded", function () {
    const calendarId = "leahann2458@gmail.com"; // Replace with your calendar
    const apiKey = "YOUR_API_KEY_HERE"; // Replace with your API key

    let viewMode = "month";
    let currentDate = new Date();

    // ---- Controls ----
    function setView(mode) {
        viewMode = mode;
        currentDate = new Date();
        renderView();
    }

    document.getElementById("dayBtn").addEventListener("click", () => setView("day"));
    document.getElementById("weekBtn").addEventListener("click", () => setView("week"));
    document.getElementById("monthBtn").addEventListener("click", () => setView("month"));

    document.getElementById("prevBtn").addEventListener("click", () => {
        shiftView(-1);
        renderView();
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
        shiftView(1);
        renderView();
    });

    function shiftView(dir) {
        if (viewMode === "day") currentDate.setDate(currentDate.getDate() + dir);
        else if (viewMode === "week") currentDate.setDate(currentDate.getDate() + dir * 7);
        else currentDate.setMonth(currentDate.getMonth() + dir);
    }

    function renderView() {
        const view = document.getElementById("calendar-view");
        view.innerHTML = "";
        view.style.display = "grid";
        view.style.gridTemplateColumns = "";

        if (viewMode === "month") renderMonthView();
        else if (viewMode === "week") renderWeekView();
        else renderDayView();
    }

    // ---- Month View ----
    function renderMonthView() {
        const view = document.getElementById("calendar-view");
        const year = currentDate.getFullYear(), month = currentDate.getMonth();
        const today = new Date();
        view.style.gridTemplateColumns = "repeat(7,1fr)";

        const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        weekdays.forEach(d => {
            const btn = document.createElement("div");
            btn.className = "weekday-btn";
            btn.innerText = d;
            view.appendChild(btn);
        });

        let firstDay = new Date(year, month, 1).getDay();
        firstDay = (firstDay + 6) % 7;

        for (let i = 0; i < firstDay; i++) {
            const pad = document.createElement("div");
            pad.className = "day-cell empty";
            pad.style.visibility = "hidden";
            view.appendChild(pad);
        }

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        fetchEventsForMonth(year, month).then(events => {
            for (let d = 1; d <= daysInMonth; d++) {
                const div = document.createElement("div");
                div.className = "day-cell";
                if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) div.classList.add("today");

                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                if (events[dateStr]) div.classList.add("has-event");
                div.title = events[dateStr] ? events[dateStr].map(e => e.summary).join(", ") : "";

                div.addEventListener("click", () => {
                    currentDate = new Date(year, month, d);
                    setView("day");
                });

                div.innerText = d;
                view.appendChild(div);
            }
        });

        document.getElementById("monthLabel").innerText =
            currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    // ---- Day View ----
    function renderDayView() {
        const view = document.getElementById("calendar-view");
        view.style.gridTemplateColumns = "60px 1fr";

        document.getElementById("monthLabel").innerText =
            currentDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

        const start = new Date(currentDate);
        const end = new Date(currentDate);
        end.setHours(23, 59, 59);

        fetchAndDisplayEvents(start, end).then(events => {
            for (let h = 0; h < 24; h++) {
                const hour = document.createElement("div");
                hour.className = "schedule-hour";
                hour.innerText = h.toString().padStart(2, "0") + ":00";
                view.appendChild(hour);

                const cell = document.createElement("div");
                cell.className = "schedule-cell";

                const hourEvents = events.filter(e => {
                    const s = new Date(e.start.dateTime || e.start.date);
                    const eEnd = new Date(e.end?.dateTime || e.end?.date || s);

                    if (e.start.date && h === 0) return true;
                    return s.getHours() <= h && eEnd.getHours() > h &&
                           s.toDateString() === currentDate.toDateString();
                });

                hourEvents.forEach(e => {
                    const div = document.createElement("div");
                    const s = new Date(e.start.dateTime || e.start.date);
                    const eEnd = new Date(e.end?.dateTime || e.end?.date || s);
                    const timeLabel = e.start.date
                        ? "All Day"
                        : `${s.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} – ${eEnd.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
                    div.innerText = `${timeLabel} | ${e.summary}`;
                    cell.appendChild(div);
                });

                view.appendChild(cell);
            }
        });
    }

    // ---- Week View ----
    function renderWeekView() {
        const view = document.getElementById("calendar-view");
        view.style.gridTemplateColumns = "60px repeat(7,1fr)";

        const start = new Date(currentDate);
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        document.getElementById("monthLabel").innerText =
            `${start.toLocaleDateString([], {month: 'short', day: 'numeric'})} – ${end.toLocaleDateString([], {month: 'short', day: 'numeric'})}`;

        const emptyHeader = document.createElement("div");
        view.appendChild(emptyHeader);

        const weekdays = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            weekdays.push(d);
            const btn = document.createElement("div");
            btn.className = "weekday-btn";
            btn.innerText = d.toLocaleDateString([], {weekday: 'short'});
            view.appendChild(btn);
        }

        fetchAndDisplayEvents(start, end).then(events => {
            for (let h = 0; h < 24; h++) {
                const hour = document.createElement("div");
                hour.className = "schedule-hour";
                hour.innerText = h.toString().padStart(2, "0") + ":00";
                view.appendChild(hour);

                weekdays.forEach(day => {
                    const cell = document.createElement("div");
                    cell.className = "schedule-cell";

                    const hourEvents = events.filter(e => {
                        const s = new Date(e.start.dateTime || e.start.date);
                        const eEnd = new Date(e.end?.dateTime || e.end?.date || s);

                        if (e.start.date && h === 0 && s.toDateString() === day.toDateString()) return true;
                        return s.getHours() <= h && eEnd.getHours() > h &&
                               s.toDateString() === day.toDateString();
                    });

                    hourEvents.forEach(e => {
                        const div = document.createElement("div");
                        const s = new Date(e.start.dateTime || e.start.date);
                        const eEnd = new Date(e.end?.dateTime || e.end?.date || s);
                        const timeLabel = e.start.date
                            ? "All Day"
                            : `${s.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} – ${eEnd.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
                        div.innerText = `${timeLabel} | ${e.summary}`;
                        cell.appendChild(div);
                    });

                    view.appendChild(cell);
                });
            }
        });
    }

    // ---- Fetch Functions ----
    function fetchEventsForMonth(year, month) {
        const startISO = new Date(year, month, 1).toISOString();
        const endISO = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
        const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${startISO}&timeMax=${endISO}&singleEvents=true&orderBy=startTime`;

        return fetch(url)
            .then(res => res.json())
            .then(data => {
                const events = {};
                (data.items || []).forEach(event => {
                    const date = (event.start.date || event.start.dateTime).split("T")[0];
                    if (!events[date]) events[date] = [];
                    events[date].push(event);
                });
                return events;
            });
    }

    function fetchAndDisplayEvents(start, end) {
        const startISO = start.toISOString();
        const endISO = end.toISOString();
        const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${startISO}&timeMax=${endISO}&singleEvents=true&orderBy=startTime`;
        return fetch(url)
            .then(res => res.json())
            .then(data => data.items || []);
    }

    // ---- Initial render ----
    renderView();
});
