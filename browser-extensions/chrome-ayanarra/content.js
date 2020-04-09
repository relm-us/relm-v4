console.log("Ayanarra Extension Loaded");

// port connection between content.js and background.js
var port = chrome.runtime.connect({name: "content-background"});
var highlightMode = false;

// Object to be exported
// - html: the outerHTML to be exported
// - uuid: the UUID of the object
var exportObj = {};

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function setHighlightMode(value) {
  console.log("[content window] set highlight mode", value);
  highlightMode = value;
  if (!value) {
    var allElements = document.getElementsByTagName("*");
    for (var i = 0; i < allElements.length; i++) {
      removeOutline(allElements[i]);
    }
  }
}

function manuallyEndDragEvent() {
  console.log("Manually ending drag");
  var dragend = new CustomEvent('dragend');
  document.body.dispatchEvent(dragend);
}

function sendMessage(message) {
  console.log("[content window] send message", message);
  port.postMessage(message);
}

function sendViaSandbox(message) {
  sendMessage({
    "command": "send",
    "args": message
  });
}

function triggerInitialFetch() {
  port.postMessage({ "command": "fetch" });
}

function addOutline(el) {
  if (!el || !el.dataset) return;
  if (!("ayanarra_outline" in el.dataset)) {
    el.dataset.ayanarra_outline = el.style.outline;
    el.style.outline = "4px solid #f55";
    el.dataset.ayanarra_draggable = el.draggable;
    el.draggable = true;
  }
}

function removeOutline(el) {
  if (!el || !el.dataset) return;
  if ("ayanarra_outline" in el.dataset) {
    el.style.outline = el.dataset.ayanarra_outline;
    delete el.dataset["ayanarra_outline"];
    el.draggable = el.dataset.ayanarra_outline;
    delete el.dataset["ayanarra_draggable"];
  }
}


window.addEventListener("load", event => {
  console.log("[content window] loaded");
  triggerInitialFetch();
});

document.addEventListener("mouseenter", event => {
  if (highlightMode) {
    addOutline(event.target);

    var parent = event.target.parentElement;
    while (parent) {
      if ("ayanarra_outline" in parent.dataset) {
        parent.style.outline = parent.dataset.ayanarra_outline;
      }
      parent = parent.parentElement;
    }
  }
}, true);

document.addEventListener("mouseleave", event => {
  if (highlightMode) {
    removeOutline(event.target);
  }
}, true);

window.addEventListener("click", (event) => {
  if (highlightMode) {
    removeOutline(event.target);

    Object.assign(exportObj, {
      "html": event.target.outerHTML,
      "uuid": uuidv4()
    });

    console.log("[content window] posting export", exportObj);
    sendViaSandbox({
      "export": exportObj
    });

    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);

/*
window.addEventListener("dragstart", event => {
  if (highlightMode) {
    console.log("[content window] drag start");
    Object.assign(exportObj, {
      "html": event.target.outerHTML,
      "uuid": uuidv4()
    });

    console.log("[content window] posting export", exportObj);
    sendViaSandbox({
      "export": exportObj
    });

    removeOutline(event.target);
      // var blank = document.createElement("canvas");
      // event.dataTransfer.setDragImage(blank, 0, 0);
    event.stopImmediatePropagation();
  }
}, true);

window.addEventListener("drag", event => {
  if (highlightMode) {
    if (event.clientX === 0 && event.clientY === 0) {
      // TODO: can we hide the dataTransfer.setDragImage?
    }
    event.stopImmediatePropagation();
  }
});

window.addEventListener("dragend", event => {
  if (highlightMode) {
    var dropAt = {
      x: event.clientX,
      y: event.clientY
    };

    var rect = {
      w: window.innerWidth,
      h: window.innerHeight
    };

    if (dropAt.x >= 0 && dropAt.y <= rect.w &&
        dropAt.y >= 0 && dropAt.y <= rect.h) {
          console.log("[content window] drag end -- ignoring drop event", dropAt, rect);
    } else {
      removeOutline(event.target);
      var dropObj = {
        "dropAt": dropAt,
        "rect": rect,
        "uuid": exportObj.uuid
      };
      console.log("[content window] drag end -- sending drop event", dropObj);
      sendViaSandbox({
        "drop": dropObj
      });
    }
  } else {
    console.log("[content window] drag end -- no highlight mode", dropAt, rect);
  }

}, true);
*/

// Control aspects of each page, such as highlight state
port.onMessage.addListener(contentWindowMessage => {
  console.log("[content window] received message", contentWindowMessage);

  if ("highlight" in contentWindowMessage) {
    setHighlightMode(contentWindowMessage["highlight"]);
  }
  // If we get a message to release our current object, then treat it as the end of a "drag and drop"
  if ("release" in contentWindowMessage &&
      contentWindowMessage["release"] === exportObj.uuid) {
    // TODO: why doesn't this actually drop?
    manuallyEndDragEvent();
  }
});