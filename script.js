document.addEventListener("DOMContentLoaded", function () {

    const calendarId = "leahann2458@gmail.com"; // Replace with your calendar
    const apiKey = "AIzaSyAVW2CDU8wb-9Gal-C2lKSRFNC-NLR5PAw"; // Replace with your API key

    // Global
    window.setView = function(mode){
        viewMode = mode;
        currentDate = new Date();
        renderView();
    };

    let viewMode = "month";
    let currentDate = new Date();

    document.getElementById("prevMonthBtn").addEventListener("click", ()=>{ shiftView(-1); renderView(); });
    document.getElementById("nextMonthBtn").addEventListener("click", ()=>{ shiftView(1); renderView(); });

    function shiftView(dir){
        if(viewMode==="day") currentDate.setDate(currentDate.getDate()+dir);
        else if(viewMode==="week") currentDate.setDate(currentDate.getDate()+dir*7);
        else currentDate.setMonth(currentDate.getMonth()+dir);
    }

    function renderView(){
        const view = document.getElementById("calendar-view");
        view.innerHTML="";
        view.style.display="grid"; 
        view.style.gridTemplateColumns="";

        if(viewMode==="month") renderMonthView();
        else if(viewMode==="week") renderWeekView();
        else renderDayView();
    }

    // ---------------- Month View ----------------
    function renderMonthView(){
        const view = document.getElementById("calendar-view");
        const year=currentDate.getFullYear(), month=currentDate.getMonth();
        const today=new Date();
        view.style.gridTemplateColumns="repeat(7,1fr)";

        const weekdays=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
        weekdays.forEach(d=>{
            const btn=document.createElement("div"); 
            btn.className="weekday-btn"; 
            btn.innerText=d; 
            view.appendChild(btn);
        });

        let firstDay=new Date(year, month, 1).getDay(); 
        firstDay=(firstDay+6)%7;

        for(let i=0;i<firstDay;i++){
            const pad=document.createElement("div"); 
            pad.className="day-cell empty"; 
            pad.style.visibility="hidden"; 
            view.appendChild(pad);
        }

        const daysInMonth=new Date(year,month+1,0).getDate();
        fetchEventsForMonth(year, month).then(events=>{
            for(let d=1;d<=daysInMonth;d++){
                const div=document.createElement("div"); 
                div.className="day-cell";
                if(d===today.getDate() && month===today.getMonth() && year===today.getFullYear()) div.classList.add("today");

                const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                if(events[dateStr]) div.classList.add("has-event");
                div.title = events[dateStr] ? events[dateStr].map(e=>e.summary).join(", ") : "";

                // NEW: Click to go to Day view
                div.addEventListener("click", ()=>{
                    currentDate = new Date(year, month, d);
                    setView("day");
                });

                div.innerText=d;
                view.appendChild(div);
            }
        });

        document.getElementById("monthLabel").innerText=currentDate.toLocaleString('default',{month:'long',year:'numeric'});
    }

    // ---------------- Day View ----------------
    function renderDayView(){
        const view=document.getElementById("calendar-view");
        view.style.gridTemplateColumns="60px 1fr";
        document.getElementById("monthLabel").innerText=currentDate.toDateString();

        const start=new Date(currentDate); 
        const end=new Date(currentDate); 
        end.setHours(23,59,59);

        fetchAndDisplayEvents(start,end).then(events=>{
            for(let h=0;h<24;h++){
                const hour=document.createElement("div"); 
                hour.className="schedule-hour"; 
                hour.innerText=h.toString().padStart(2,"0")+":00"; 
                view.appendChild(hour);

                const cell=document.createElement("div"); 
                cell.className="schedule-cell"; 

                const hourEvents = events.filter(e=>{
                    const eDate=new Date(e.start.dateTime||e.start.date);
                    return eDate.getHours()===h;
                });

                hourEvents.forEach(e=>{
                    const div=document.createElement("div"); div.innerText=e.summary; cell.appendChild(div);
                });

                view.appendChild(cell);
            }
        });
    }

    // ---------------- Week View ----------------
    function renderWeekView(){
        const view=document.getElementById("calendar-view");
        view.style.gridTemplateColumns="60px repeat(7,1fr)";
        const start=new Date(currentDate); start.setDate(start.getDate()-((start.getDay()+6)%7));
        const end=new Date(start); end.setDate(end.getDate()+6);
        document.getElementById("monthLabel").innerText=`Week of ${start.toDateString()}`;

        const emptyHeader=document.createElement("div"); view.appendChild(emptyHeader);
        const weekdays=[];
        for(let i=0;i<7;i++){
            const d=new Date(start); d.setDate(start.getDate()+i);
            weekdays.push(d);
            const btn=document.createElement("div"); btn.className="weekday-btn"; btn.innerText=d.toLocaleDateString([], {weekday:'short'}); view.appendChild(btn);
        }

        fetchAndDisplayEvents(start,end).then(events=>{
            for(let h=0;h<24;h++){
                const hour=document.createElement("div"); hour.className="schedule-hour"; hour.innerText=h.toString().padStart(2,"0")+":00"; view.appendChild(hour);
                weekdays.forEach(day=>{
                    const cell=document.createElement("div"); cell.className="schedule-cell";
                    const hourEvents = events.filter(e=>{
                        const eDate = new Date(e.start.dateTime||e.start.date);
                        return eDate.getHours()===h && eDate.toDateString()===day.toDateString();
                    });
                    hourEvents.forEach(e=>{
                        const div=document.createElement("div"); div.innerText=e.summary; cell.appendChild(div);
                    });
                    view.appendChild(cell);
                });
            }
        });
    }

    // ---------------- Fetch Functions ----------------
    function fetchEventsForMonth(year, month){
        const startISO = new Date(year, month,1).toISOString();
        const endISO = new Date(year,month+1,0,23,59,59).toISOString();
        const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${startISO}&timeMax=${endISO}&singleEvents=true&orderBy=startTime`;

        return fetch(url)
            .then(res=>res.json())
            .then(data=>{
                const events={};
                (data.items||[]).forEach(event=>{
                    const date=(event.start.date||event.start.dateTime).split("T")[0];
                    if(!events[date]) events[date]=[];
                    events[date].push(event);
                });
                return events;
            });
    }

    function fetchAndDisplayEvents(start,end){
        const startISO=start.toISOString();
        const endISO=end.toISOString();
        const url=`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${startISO}&timeMax=${endISO}&singleEvents=true&orderBy=startTime`;
        return fetch(url)
            .then(res=>res.json())
            .then(data=>data.items||[]);
    }

    // ---------------- Initial render ----------------
    renderView();

});