/* Püf Noktaları liste — sayfa-özel JS (QA punch 2026-07-15). Kategori
 * filtresi/sıralama GERÇEK sunucu-taraflı linkler (index.blade.php, ayrıca
 * JS gerekmiyor) — burada yalnız #pufFilter'ın yatay sürükle-kaydır + taşma
 * ipucu (kf-more maske) davranışı (referans satır 1988-2021, portal.js'in
 * paylaşılan .cat-track/.chips/.grid-4/... whitelist'inde #pufFilter YOK —
 * paylaşılan dosyaya dokunmadan buraya, aynı mantıkla, yerel kuruldu). */
(function () {
  var el = document.getElementById('pufFilter');
  if (!el) return;

  // Sürükle-kaydır (portal.js enableDrag ile aynı davranış, yerel kopya).
  el.classList.add('drag-scroll');
  var down = false, startX = 0, startScroll = 0, moved = false;
  el.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') return;
    down = true; moved = false; startX = e.clientX; startScroll = el.scrollLeft;
  });
  el.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - startX;
    if (Math.abs(dx) > 4) { moved = true; el.classList.add('dragging'); }
    el.scrollLeft = startScroll - dx;
  });
  function up() { down = false; setTimeout(function () { el.classList.remove('dragging'); }, 0); }
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', up);
  el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  el.addEventListener('wheel', function (e) {
    if (el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault(); el.scrollLeft += e.deltaY;
  }, { passive: false });

  // Taşma ipucu (kf-more) — sağda daha fazla chip olduğunu maske-fade ile gösterir.
  function updateFade() {
    el.classList.toggle('kf-more', el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }
  el.addEventListener('scroll', updateFade, { passive: true });
  window.addEventListener('resize', updateFade);
  updateFade();
})();
