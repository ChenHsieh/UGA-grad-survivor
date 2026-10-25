/* playlab-zoomguard.js (kit 19, P1ZM00): the page never zooms by accident on a phone. Games here are played with fast taps and
 * drags, so a double tap or a stray pinch must not zoom or shrink the page.
 *  - viewport meta gets maximum-scale=1, user-scalable=no (browsers that honour it); the page's own meta should already say so.
 *  - html, body: touch-action manipulation (no double-tap zoom, no 300 ms click delay), no text-size jump on rotate.
 *  - iOS Safari ignores user-scalable: gesturestart / gesturechange (pinch) are cancelled, and so is a second touchend inside
 *    300 ms on something that is not a control. Buttons, links, fields, canvases, svg, anything with tabindex / onclick / cursor: pointer and anything marked data-zg-keep keep their taps.
 * System accessibility zoom is not touched. Idempotent: loading it twice does nothing the second time. */
(function () {
  'use strict';
  if (window.__playlabZoomGuard) return;
  window.__playlabZoomGuard = 1;
  var head = document.head || document.documentElement;
  var m = document.querySelector('meta[name="viewport"]');
  var want = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
  if (!m) { m = document.createElement('meta'); m.name = 'viewport'; m.content = want; head.appendChild(m); }
  else if (!/user-scalable\s*=\s*(no|0)/i.test(m.content) || !/maximum-scale\s*=\s*1(\.0)?\s*(,|$)/i.test(m.content)) {
    var c = m.content.replace(/\s*,?\s*(maximum-scale|minimum-scale|user-scalable)\s*=\s*[^,]*/gi, '').replace(/^[\s,]+|[\s,]+$/g, '');
    m.content = (c ? c + ', ' : '') + 'maximum-scale=1, user-scalable=no';
  }
  var st = document.createElement('style');
  st.id = 'playlab-zoomguard';
  st.textContent = 'html,body{touch-action:manipulation;-webkit-text-size-adjust:100%;text-size-adjust:100%}';
  head.appendChild(st);
  var block = function (e) { if (e.cancelable) e.preventDefault(); };
  ['gesturestart', 'gesturechange'].forEach(function (n) { document.addEventListener(n, block, { passive: false }); });
  var last = 0;
  var KEEP = 'button,a,input,select,textarea,label,summary,canvas,svg,[role="button"],[role="slider"],[role="link"],[data-zg-keep]';
  document.addEventListener('touchend', function (e) {
    var now = e.timeStamp || Date.now();
    var el = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
    var t = el && el.closest ? el.closest(KEEP + ',[tabindex],[onclick]') : null;
    // a div that looks tappable (cursor: pointer) is a control too: a fast second tap on it is play, not a zoom
    if (!t && el && getComputedStyle(el).cursor === 'pointer') t = el;
    if (!t && now - last < 300 && e.cancelable) e.preventDefault();
    last = now;
  }, { passive: false });
})();
