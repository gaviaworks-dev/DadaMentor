/* Yatay kaydırılan şerit affordance'ı — ORTAK ölçüm+toggle mantığı (kapanış
   turu 2026-08-08). scroll-affordance.css ile BİRLİKTE çalışır. İlk vaka
   (.vd-actbar, mekan-detay.js) ve ikinci vaka (dada-route hızlı-filtre
   şeritleri) TEK bu dosyadan beslenir — ikinci kopya yazılmadı.

   `data-scroll-fade` taşıyan her eleman otomatik kablolanır (DOMContentLoaded'da
   + sayfa dinamik olarak yeni öğe eklerse MutationObserver ile). Elemanın
   `visibility:hidden` olması (görünürlüğü sonradan açılan barlar için) ölçümü
   BOZMAZ — layout hesaplanır, yalnız `display:none` ölçülemez. */
(function () {
    function sync(el) {
        var moreR = (el.scrollWidth - el.clientWidth - el.scrollLeft) > 4;
        var moreL = el.scrollLeft > 4;
        el.classList.toggle('has-scroll-r', moreR);
        el.classList.toggle('has-scroll-l', moreL);
    }
    function wire(el) {
        if (el.dataset.sfWired) return;
        el.dataset.sfWired = '1';
        var handler = function () { sync(el); };
        el.addEventListener('scroll', handler, { passive: true });
        window.addEventListener('resize', handler);
        el.addEventListener('transitionend', handler);
        if (window.MutationObserver) {
            new MutationObserver(handler).observe(el, { childList: true, subtree: true, attributes: true });
        }
        sync(el);
    }
    function init() {
        document.querySelectorAll('[data-scroll-fade]').forEach(wire);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    window.ScrollAffordance = { wire: wire, sync: sync, init: init };
})();
