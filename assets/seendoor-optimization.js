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

(function () {
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return Promise.resolve();
  }

  function showCouponToast() {
    var toast = document.getElementById('copy-toast');
    if (!toast) return;

    toast.classList.add('show');
    window.setTimeout(function () {
      toast.classList.remove('show');
    }, 1500);
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-sd-copy-code]');
    if (!trigger) return;

    var code = trigger.getAttribute('data-sd-copy-code');
    if (!code) return;

    copyText(code).then(function () {
      var original = trigger.textContent;
      trigger.textContent = 'Copied';
      trigger.classList.add('is-copied');
      showCouponToast();

      window.setTimeout(function () {
        trigger.textContent = original;
        trigger.classList.remove('is-copied');
      }, 1500);
    });
  });
})();
