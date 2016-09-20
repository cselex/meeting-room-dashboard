var DOMElements = {};

document.addEventListener('DOMContentLoaded', function() {
  DOMElements = {
    clock: document.getElementById("clock"),
    roomName: document.getElementById("room_name"),
    nextEvents: document.getElementById("next_events"),
    currentEvent: document.getElementById("current_event"),
    remaining: document.getElementById("remaining"),
    fullscreen: document.getElementById('full-screen'),
    attendees: document.getElementById('attendees')
  };

  pageSetup();
  updateClock();
});

var timeoutLock = false;
function updateEvents(json){
  var now = new Date();
  var events = json.events;
  while (events.length > 0 && parseGoogleDate(events[0].end) < now){
    events.shift();
  }
  if(events.length === 0){
    updateCurrentEvent({"name": "Available", "end": "nil"});
    updateNextEvents([]);
  }else if(parseGoogleDate(events[0].start) < now){
    updateCurrentEvent(events[0]);
    updateNextEvents(events.slice(1, events.length));
  }else{
    updateCurrentEvent({"name": "Available", "end": events[0].start});
    updateNextEvents(events);
  }
  timeoutLock = setTimeout(function() { updateEvents(json); }, 1000);
}

function updateRoomName(roomName){
  DOMElements.roomName.innerText = roomName;
}

function parseGoogleDate(d) {
  return new Date(Date.parse(d));
}

function timeStringFromDateTime(dateTime){
  var hours = dateTime.getHours();
  var minutes = dateTime.getMinutes();
  var seconds = dateTime.getSeconds();

  minutes = (minutes < 10 ? "0" : "") + minutes;
  //seconds = (seconds < 10 ? "0" : "") + seconds;

  return hours + ":" + minutes;// + ":" + seconds;
}

function updateNextEvents(nextEvents){
  var lines = [];
  nextEvents.forEach(function(event) {
    var name = event.name;
    var start = parseGoogleDate(event.start);
    var end = parseGoogleDate(event.end);
    lines.push([
      timeStringFromDateTime(start),
      " - ",
      timeStringFromDateTime(end),
      "<br>",
      name
    ].join(''));
  });
  DOMElements.nextEvents.innerHTML = lines.join('<br />');
}

function updateCurrentEvent(currentEvent){
  if (timeoutLock) {
    clearTimeout(clearTimeout);
    timeoutLock = false;
  }
  DOMElements.currentEvent.innerHTML = currentEvent.name;
  var remainingString = "For";

  if (currentEvent.end == "nil"){
    remainingString = remainingString + " the rest of the day";
  } else{
    var start = new Date();
    var end = parseGoogleDate(currentEvent.end);
    var remaining = end - start;
    var hours = Math.floor(remaining / 3600000);
    var mins = Math.floor((remaining % 3600000) / 60000);

    if (remaining < 60000){
      remainingString = remainingString + " less than a min";
    }
    else {
      if (hours == 1){
        remainingString = remainingString + " 1 hour";
      } else if (hours > 1) {
        remainingString = remainingString + " " + hours + " hours";
      }

      if (mins == 1){
        remainingString = remainingString + " 1 min";
      } else if (mins > 1) {
        remainingString = remainingString + " " + mins + " mins";
      }
    }
  }
  remainingString = remainingString + ".";
  DOMElements.remaining.innerHTML = remainingString;

  DOMElements.attendees.innerHTML = currentEvent.attendees.join('<br />')
}

function webSocketSetup(){
  function onMessage(data){
    json = JSON.parse(data);
    updateRoomName(json.room_name);
    updateEvents(json);
  }

  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';

  var ws       = new WebSocket(protocol + '://' + window.location.host + window.location.pathname);
  ws.onopen    = function(){};
  ws.onclose   = function(){};
  ws.onmessage = function(message){onMessage(message.data);};

  // var sender = function(f){
  //   f.onclick    = function(){
  //     ws.send(f.getAttribute("data-duration"));
  //     return false;
  //   }
  // };
  // sender(document.getElementById('button_1'))
  // sender(document.getElementById('button_2'))
  // sender(document.getElementById('button_3'))
  // sender(document.getElementById('button_4'))

}

function pageSetup(){
  webSocketSetup();

  if (screenfull.enabled) {
    DOMElements.fullscreen.addEventListener('click', function () {
      screenfull.request();
    });

    document.addEventListener(screenfull.raw.fullscreenchange, fullscreenChange);
  }
}

function fullscreenChange() {
  if(screenfull.isFullscreen) {
    DOMElements.fullscreen.style.visibility = 'hidden';
  } else {
    DOMElements.fullscreen.style.visibility = 'visible';
  }
}

function updateClock(){
  DOMElements.clock.innerText = timeStringFromDateTime(new Date());
  setTimeout(updateClock, 1000);
}
