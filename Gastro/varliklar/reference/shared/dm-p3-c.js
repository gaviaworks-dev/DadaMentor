/* ═══ AJAN-C-P3-BAS ═══ */
/* AJAN C · PARTİ 3 · video mutfağı — davranış eki.
   İki iş yapar, ikisi de VERİYE bakar (varsayıma değil):
   1) yazar adı boşsa yazar satırını işaretler (CSS gizler),
   2) taşmayan rayın ok düğmelerini devre dışı bırakır (ölü düğme 0).
   Betik sıra VARSAYMAZ: DOM hazır olduğunda ve bir kare sonra koşar. */
(function () {
  'use strict';

  function yazarlar() {
    var n = 0;
    document.querySelectorAll('.r-author').forEach(function (el) {
      var b = el.querySelector('b');
      var bos = !b || !b.textContent.trim();
      if (bos) { el.dataset.c3Bos = '1'; n++; }
      else if (el.dataset.c3Bos === '1') { delete el.dataset.c3Bos; }
    });
    return n;
  }

  function oklar() {
    var n = 0;
    document.querySelectorAll('.row-nav button[data-track]').forEach(function (b) {
      var tr = document.getElementById(b.dataset.track);
      if (!tr) return;
      var tasar = tr.scrollWidth > tr.clientWidth + 1;
      if (b.disabled !== !tasar) { b.disabled = !tasar; }
      if (!tasar) n++;
    });
    return n;
  }

  function kos() { yazarlar(); oklar(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kos);
  else kos();
  requestAnimationFrame(kos);
  addEventListener('load', kos);
  addEventListener('resize', oklar);
  document.addEventListener('c3-tazele', kos);
})();
/* ═══ AJAN-C-P3-SON ═══ */
