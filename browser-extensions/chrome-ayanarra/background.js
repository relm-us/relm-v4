var manifest = chrome.runtime.getManifest();

console.log("[background] manifest", {
  name: manifest.name,
  version: manifest.version,
  statebus: manifest.statebus
});

function sendToSandbox(command) {
  console.log("[background] forwarding command to sandbox", command);
  var sandbox = document.getElementById("sandbox");
  sandbox.contentWindow.postMessage(command, "*");
}

function broadcastToContentWindows(message) {
  console.log("[background] forwarding message to all content windows", message);
  // Broadcast to each browser tab / content script
  ports.forEach(port => { port.postMessage(message) });
}

function initSandbox() {
  sendToSandbox({
    "command": "init",
    "args": {
      "portal": manifest.statebus.id
    }
  });
}

// Send initial command to Sandbox, including statebus.id, 
// e.g. "vnc2" to identify this terminal
setTimeout(initSandbox, 1000);

var ports = [];

chrome.runtime.onConnect.addListener(port => {
  console.log("[background] port connected", port);
  console.assert(port.name === "content-background");
  ports.push(port);

  port.onMessage.addListener(sendToSandbox);

  port.onDisconnect.addListener(port => {
    console.log("[background] port disconnected", port);
    const index = ports.indexOf(port);
    ports.splice(index, 1);
  });
});


chrome.runtime.getBackgroundPage(function (backgroundPage) {
  backgroundPage.addEventListener("message", event => {
    var messageForContentWindows = event.data.windows;
    if (messageForContentWindows) {
      broadcastToContentWindows(messageForContentWindows);
    }
  });
});
