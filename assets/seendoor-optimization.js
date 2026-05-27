(function () {
  var chatLoaded = false;

  function loadSeendoorChat() {
    if (chatLoaded || window.smartsupp) return;
    chatLoaded = true;

    var firstScript = document.getElementsByTagName('script')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.async = true;
    script.src = 'https://www.smartsuppchat.com/loader.js?';
    firstScript.parentNode.insertBefore(script, firstScript);
  }

  window.loadSeendoorChat = loadSeendoorChat;

  ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(function (eventName) {
    window.addEventListener(eventName, loadSeendoorChat, { once: true, passive: true });
  });

  window.addEventListener('load', function () {
    window.setTimeout(loadSeendoorChat, 5000);
  });
})();
