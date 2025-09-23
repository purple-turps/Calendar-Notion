document.addEventListener("DOMContentLoaded", function () {
  const calendarId = "leahann2458@gmail.com"; // ← replace with your calendar ID
  const apiKey = "AIzaSyAVW2CDU8wb-9Gal-C2lKSRFNC-NLR5PAw"; // ← replace with your API key

  let viewMode = "month";
  let currentDate = new Date();

  // Navigation buttons (← →) — behave differently depending on view mode
  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    if (viewMode === "month") {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else if (viewMode === "week") {
      currentDate.setDate(currentDate.getDate() - 7);
    } else if (viewMode === "day") {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    renderView();
  });

  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    if (viewMode === "month") {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (viewMode === "week") {
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (viewMode === "day") {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    renderView();
  });

  // View toggle (Day / Week / Month)
  function setView(mode) {
    viewMode = mode;
    renderView();
  }
  window.setView = setView;

  // Render view based on mode
  function renderView() {
    const headerLabel = document.getElementById("monthLabel");
    const view = document.getElementById("calendar-view");
    const details = document.getElementById("event-details");
    view.innerHTML = "";
    details.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === "day") {
      const start = new Date(currentDate);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59);
      headerLabel.textContent = `Day: ${start.toDateString()}`;
      fetchAndDisplayEvents(start, end, "list");

    } else if (viewMode === "week") {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7)); // Monday-start
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      headerLabel.textContent = `Week of ${start.toDateString()} - ${end.toDateString()}`;
      fetchAndDisplayEvents(start, end, "list");

    } else {
      // Month view
      headerLabel.textContent = `${currentDate.toLocaleString("default", { month: "long" })} ${year}`;

      // Weekday headers (Mon → Sun)
      const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      view.innerHTML = weekdays
        .map(day => `<div class="day-cell" style="font-weight:bold; background:transparent; box-shadow:none; cursor:default;">${day}</div>`)
        .join("");

      // First day of month (adjust to Monday-start)
      let firstDay = new Date(year, month, 1).getDay(); // Sunday=0
      firstDay = (firstDay + 6) % 7; // Shift to Monday=0

      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Empty padding cells
      for (let i = 0; i < firstDay; i++) {
        const pad = document.createElement("div");
        pad.className = "day-cell empty";
        pad.style.opacity = "0"; // keeps grid spacing
        view.appendChild(pad);
      }

      // Load events
      fetchEventsForMonth(year, month).then(events => {
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const div = document.createElement("div");
          div.className = "day-cell";

          // Show event marker + click-through
          if (events[dateStr]) {
            div.classList.add("has-event");
            div.innerHTML = `<div>${day}</div><span style="font-size:0.7rem; color:var(--accent)">•</span>`;
            div.onclick = () => {
              viewMode = "day";
              currentDate = new Date(year, month, day);
              renderView();
            };
          } else {
            div.innerHTML = `<div>${day}</div>`;
            div.onclick = () => {
              viewMode = "day";
              currentDate = new Date(year, month, day);
              renderView();
            };
          }

          // Highlight today
          const today = new Date();
          if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
          ) {
            div.classList.add("today");
          }

          view.appendChild(div);
        }
      });
    }
  }

  // Fetch events for entire month
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

  // Fetch & display events (day/week list)
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
          const startTime = event.start.dateTime || event.start.date;
          const div = document.createElement("div");
          div.className = "has-event";
          div.innerHTML = `<strong>${event.summary}</strong><br><small>${new Date(startTime).toLocaleString()}</small>`;
          container.appendChild(div);
        });
      });
  }

  // Show event details in month view
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
