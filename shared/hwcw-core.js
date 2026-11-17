/* =====================================================================
   HW/CW TRAINING — core protections (1 safe storage, 2 LMS bridge, 4 time adapter)
   Loaded BEFORE the training engine.

   1) STORE: memory + localStorage + sessionStorage, every access in try/catch.
      Reading merges all copies so progress only ever moves forward.
   2) lmsSend('ready'|'progress'|'completed') with source:'kodland-training'.
      Nothing is sent outside an iframe or in developer mode.
   4) window.TD_TIME_ADAPTER so td-time.js can read this engine
      (it has no TRAINING_ID / P / #/moduleId hash of its own).
   ===================================================================== */
(function (w) {
  'use strict';

  var TRAINING = 'hwcw';
  var PROG_KEY = 'kl-hwcw-progress';
  var DEV_ALLOWED = /[?&]dev=1(&|$)/.test(location.search);

  /* ---------- 1) SAFE STORAGE ---------- */
  var MEM = {};
  function areas() {
    var a = [];
    try { if (w.localStorage) a.push(w.localStorage); } catch (e) {}
    try { if (w.sessionStorage) a.push(w.sessionStorage); } catch (e) {}
    return a;
  }
  function rawGet(k) {
    var st = areas(), i, v;
    for (i = 0; i < st.length; i++) {
      try { v = st[i].getItem(k); if (v !== null && v !== undefined) return v; } catch (e) {}
    }
    return Object.prototype.hasOwnProperty.call(MEM, k) ? MEM[k] : null;
  }
  function rawSet(k, v) {
    v = String(v); MEM[k] = v;
    var st = areas(), i;
    for (i = 0; i < st.length; i++) { try { st[i].setItem(k, v); } catch (e) {} }
  }
  function rawDel(k) {
    delete MEM[k];
    var st = areas(), i;
    for (i = 0; i < st.length; i++) { try { st[i].removeItem(k); } catch (e) {} }
  }

  // Progress is merged across every copy: a module stays passed, a score never drops.
  function mergeProgress() {
    var best = {}, st = areas(), blobs = [], i;
    for (i = 0; i < st.length; i++) { try { blobs.push(st[i].getItem(PROG_KEY)); } catch (e) {} }
    if (Object.prototype.hasOwnProperty.call(MEM, PROG_KEY)) blobs.push(MEM[PROG_KEY]);
    blobs.forEach(function (b) {
      if (!b) return;
      var o; try { o = JSON.parse(b); } catch (e) { return; }
      if (!o || typeof o !== 'object') return;
      Object.keys(o).forEach(function (id) {
        var cur = best[id], nw = o[id];
        if (!nw || typeof nw !== 'object') return;
        if (!cur) { best[id] = { pct: nw.pct || 0, passed: !!nw.passed }; return; }
        best[id] = { pct: Math.max(cur.pct || 0, nw.pct || 0), passed: !!(cur.passed || nw.passed) };
      });
    });
    return best;
  }

  var STORE = {
    get: function (k) { return k === PROG_KEY ? JSON.stringify(mergeProgress()) : rawGet(k); },
    set: function (k, v) {
      if (k === PROG_KEY) {
        var incoming = {}; try { incoming = JSON.parse(v) || {}; } catch (e) { incoming = {}; }
        var merged = mergeProgress();
        Object.keys(incoming).forEach(function (id) {
          var nw = incoming[id], cur = merged[id];
          if (!nw || typeof nw !== 'object') return;
          merged[id] = cur
            ? { pct: Math.max(cur.pct || 0, nw.pct || 0), passed: !!(cur.passed || nw.passed) }
            : { pct: nw.pct || 0, passed: !!nw.passed };
        });
        v = JSON.stringify(merged);
      }
      rawSet(k, v);
      return v;
    },
    del: rawDel,
    raw: { get: rawGet, set: rawSet, del: rawDel }
  };
  w.STORE = STORE;
  w.TRAINING_ID = TRAINING;
  w.DEV_ALLOWED = DEV_ALLOWED;

  /* ---------- 2) LMS BRIDGE ---------- */
  function inIframe() { try { return w.parent !== w; } catch (e) { return true; } }
  // ?dev=1 in the URL is developer mode: nothing is ever sent to the LMS from it.
  function devOn() { return DEV_ALLOWED || rawGet('kl-hwcw-devmode') === '1'; }

  function E() { return w.__HWCW || null; }
  function moduleIds() {
    try {
      var e = E(), list = e ? e.mods() : w.MODULES;
      if (Array.isArray(list)) return list.map(function (m) { return m.id; });
    } catch (e2) {}
    return [];
  }
  function curLang() {
    try { var e = E(); return (e ? e.lang() : w.LANG) || 'en'; } catch (e2) { return 'en'; }
  }
  function progressObj() {
    var o = {}; try { o = JSON.parse(STORE.get(PROG_KEY) || '{}') || {}; } catch (e) { o = {}; }
    return o;
  }
  function passedIds() {
    var p = progressObj();
    return moduleIds().filter(function (id) { return p[id] && p[id].passed; });
  }
  function avgScore() {
    var p = progressObj(), ids = moduleIds();
    if (!ids.length) return 0;
    var sum = ids.reduce(function (a, id) { return a + ((p[id] && p[id].pct) || 0); }, 0);
    return Math.round(sum / ids.length);
  }

  var sentCompleted = false;

  function lmsSummary() {
    var ids = moduleIds(), done = passedIds().length;
    return {
      source: 'kodland-training',
      training: TRAINING,
      lang: curLang(),
      progress: ids.length ? Math.round((done / ids.length) * 100) : 0,
      done: done,
      total: ids.length,
      score: avgScore()
    };
  }
  w.lmsSummary = lmsSummary;   // td-time.js hooks this to add its time fields

  function lmsSend(event) {
    try {
      if (!inIframe() || devOn()) return;
      if (event === 'completed') {
        if (sentCompleted) return;       // once per page load
        sentCompleted = true;
      }
      var msg = w.lmsSummary();          // may be wrapped by td-time.js
      msg.event = event;
      msg.source = 'kodland-training';
      w.parent.postMessage(msg, '*');
    } catch (e) {}
  }
  w.lmsSend = lmsSend;

  // Called by the engine whenever progress is saved.
  w.lmsReport = function () {
    var ids = moduleIds();
    lmsSend('progress');
    if (ids.length && passedIds().length === ids.length) lmsSend('completed');
  };

  /* ---------- 4) TIME ADAPTER ---------- */
  w.TD_TIME_ADAPTER = {
    training: function () { return TRAINING; },
    lang: function () { return curLang(); },
    modules: function () { return moduleIds(); },
    current: function () { try { var e = E(); return (e ? e.cur() : w.currentModule) || ''; } catch (e2) { return ''; } },
    done: function () { var ids = moduleIds(); return ids.length > 0 && passedIds().length === ids.length; }
  };

  /* ---------- on load ---------- */
  function boot() {
    lmsSend('ready');
    var ids = moduleIds();
    if (ids.length && passedIds().length === ids.length) lmsSend('completed');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  } else {
    setTimeout(boot, 0);
  }

  // A tutor leaving half-way: let the LMS keep the latest progress.
  addEventListener('pagehide', function () { try { lmsSend('progress'); } catch (e) {} });
})(window);
