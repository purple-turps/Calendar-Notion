document.addEventListener("DOMContentLoaded", function () {
  const calendarId = "leahann2458@gmail.com"; // ← replace this
  const apiKey = "AIzaSyAVW2CDU8wb-9Gal-C2lKSRFNC-NLR5PAw"; // ← replace this

  let viewMode = "month";
  let currentDate = new Date();

  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderView();
  });

  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderView();
  });

  function setView(mode) {
    viewMode = mode;
    currentDate = new Date(); // reset to today
    renderView();
  }

  window.setView = setView;

  function renderView() {
    const headerLabel = document.getElementById("monthLabel");
    const view = document.getElementById("calendar-view");
    const details = document.getElementById("event-details");
    view.innerHTML = "";
    details.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    if (viewMode === "day") {
      const start = new Date(today);
      const end = new Date(today);
      end.setHours(23, 59, 59);
      headerLabel.textContent = `Today: ${today.toDateString()}`;
      fetchAndDisplayEvents(start, end, "list");

    } else if (viewMode === "week") {
      const start = new Date(today);
      start.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Adjust for Monday-start week
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      headerLabel.textContent = `Week of ${start.toDateString()} - ${end.toDateString()}`;
      fetchAndDisplayEvents(start, end, "list");

    } else {
      // Month view
      headerLabel.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

      // Add weekday headers (Mon to Sun)
      const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      view.innerHTML = weekdays
        .map(day => `<div class="day-cell" style="font-weight:bold; background:transparent; box-shadow:none; cursor:default;">${day}</div>`)
        .join("");

      let firstDay = new Date(year, month, 1).getDay(); // Sunday = 0
      firstDay = (firstDay + 6) % 7; // Adjust to make Monday = 0, Sunday = 6

      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Add empty cells before day 1
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
            div.onclick = () => showEventDetails(dateStr, events[dateStr]);
          }

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

  function fetchAndDisplayEvents(start, end, type = "list") {
    const startISO = start.toISOString();
    const endISO = end.toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${startISO}&timeMax=${endISO}&singleEvents=true&orderBy=startTime`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById("calendar-view");
        container.innerHTML = "";

        if (!data.items || data.items.length === 0) {
          container.innerHTML = "No events found.";
          return;
        }

        data.items.forEach(event => {
          const start = event.start.dateTime || event.start.date;
          const div = document.createElement("div");
          div.className = "has-event";
          div.innerHTML = `<strong>${event.summary}</strong><br><small>${new Date(start).toLocaleString()}</small>`;
          container.appendChild(div);
        });
      });
  }

  function showEventDetails(dateStr, events) {
    const details = document.getElementById("event-details");
    if (!events || events.length === 0) {
      details.innerHTML = "No events.";
      return;
    }
    details.innerHTML = `<strong>Events on ${dateStr}:</strong><br>` +
      events.map(e => `• ${e.summary}`).join("<br>");
  }

  // Initial render
  renderView();
});