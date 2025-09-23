document.addEventListener("DOMContentLoaded", function () {
  const calendarId = "leahann2458@gmail.com"; // ← replace this
  const apiKey = "AIzaSyAVW2CDU8wb-9Gal-C2lKSRFNC-NLR5PAw"; // ← replace this

  let viewMode = "month";
  let currentDate = new Date();

  // Expose setView globally for HTML buttons
  function setView(mode) {
    viewMode = mode;
    currentDate = new Date(); // reset to today
    renderView();
  }
  window.setView = setView;

  // Arrow buttons
  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    shiftView(-1);
    renderView();
  });

  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    shiftView(1);
    renderView();
  });

  function shiftView(direction) {
    if (viewMode === "day") {
      currentDate.setDate(currentDate.getDate() + direction);
    } else if (viewMode === "week") {
      currentDate.setDate(currentDate.getDate() + direction * 7);
    } else if (viewMode === "month") {
      currentDate.setMonth(currentDate.getMonth() + direction);
    }
  }

  function renderView() {
    const headerLabel = document.getElementById("monthLabel");
    const view = document.getElementById("calendar-view");

    view.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === "day") {
      const start = new Date(currentDate);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59);
      headerLabel.textContent = currentDate.toDateString();
      fetchAndDisplayEvents(start, end);

    } else if (viewMode === "week") {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday-start
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      headerLabel.textContent = `Week of ${start.toDateString()} - ${end.toDateString()}`;
      fetchAndDisplayEvents(start, end);

    } else {
      // Month view
      headerLabel.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

      // Weekday headers (Mon–Sun)
      const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      view.innerHTML = weekdays
        .map(day => `<div class="day-cell" style="font-weight:bold; background:transparent; box-shadow:none; cursor:default;">${day}</div>`)
        .join("");

      let firstDay = new Date(year, month, 1).getDay(); // Sunday = 0
      firstDay = (firstDay + 6) % 7; // Make Monday = 0
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Padding before day 1
      for (let i = 0; i < firstDay; i++) {
        const pad = document.createElement("div");
        pad.className = "day-cell empty";
        pad.style.visibility = "hidden";
        view.appendChild(pad);
      }

      fetchEventsForMonth(year, month).then(events => {
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const div = document.createElement("div");
          div.className = "day-cell";

          if (events[dateStr]) {
            div.classList.add("has-event");
            // Removed onclick since bottom details div is gone
          }

          const today = new Date();
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

          if (isToday && viewMode === "month") {
            div.classList.add("today");
          }

          div.innerHTML = `<div>${day}</div>`;
          view.appendChild(div);
        }
      });
    }
  }

  function fetchEventsForMonth(year, month) {
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${startDate}&timeMax=${endDate}&singleEvents=true&orderBy=startTime`;

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

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById("calendar-view");
        container.innerHTML = ""; // clear previous

        if (!data.items || data.items.length === 0) {
          container.innerHTML = "No events found.";
          return;
        }

        if (viewMode === "day") {
          // Sort events by time
          const dayEvents = data.items.sort((a, b) => {
            const aTime = new Date(a.start.dateTime || a.start.date).getTime();
            const bTime = new Date(b.start.dateTime || b.start.date).getTime();
            return aTime - bTime;
          });

          dayEvents.forEach(event => {
            const start = event.start.dateTime || event.start.date;
            const div = document.createElement("div");
            div.className = "has-event";
            div.innerHTML = `<strong>${event.summary}</strong><br><small>${new Date(start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>`;
            container.appendChild(div);
          });

        } else if (viewMode === "week") {
          // Group events by date
          const eventsByDate = {};
          data.items.forEach(event => {
            const date = (event.start.date || event.start.dateTime).split("T")[0];
            if (!eventsByDate[date]) eventsByDate[date] = [];
            eventsByDate[date].push(event);
          });

          // Sort dates Mon → Sun
          const sortedDates = Object.keys(eventsByDate).sort((a, b) => new Date(a) - new Date(b));

          sortedDates.forEach(dateStr => {
            const dayEvents = eventsByDate[dateStr];
            const dayDiv = document.createElement("div");
            dayDiv.style.marginBottom = "0.75rem";
            dayDiv.innerHTML = `<strong>${new Date(dateStr).toDateString()}</strong>`;
            dayEvents.sort((a, b) => {
              const aTime = new Date(a.start.dateTime || a.start.date).getTime();
              const bTime = new Date(b.start.dateTime || b.start.date).getTime();
              return aTime - bTime;
            }).forEach(event => {
              const start = event.start.dateTime || event.start.date;
              dayDiv.innerHTML += `<br>• ${event.summary} <small>${event.start.dateTime ? new Date(start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</small>`;
            });
            container.appendChild(dayDiv);
          });

        } else {
          // Month view: grid events
          data.items.forEach(event => {
            const start = event.start.dateTime || event.start.date;
            const div = document.createElement("div");
            div.className = "has-event";
            div.innerHTML = `<strong>${event.summary}</strong><br><small>${new Date(start).toLocaleString()}</small>`;
            container.appendChild(div);
          });
        }
      });
  }

  // Initial render
  renderView();
});