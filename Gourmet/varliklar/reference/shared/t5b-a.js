/* T5B · GOURMET — kulvar A sürücüsü. Yalnız ajan A yazar. */
(function(){
  'use strict';
  var kok = document.documentElement;
  /* idempotent: iki kez yüklenirse ikinci dinleyici bağlanmaz.
     Bayrak SÖKÜLÜNCE sürücü yeniden kurulur — koruma sabotajı maskelemez. */
  if (kok.dataset.t5bAFooter === '1') return;
  kok.dataset.t5bAFooter = '1';

  /* ═══════════════════════════════════════════════════════════════
     MADDE 1 · FOOTER PAYI — "açılan footer" rezervi
     ───────────────────────────────────────────────────────────────
     Donörün KENDİ ölçülmüş sürücüsü (Diet/d-arama.html §FOOTER REVEAL,
     Fit/fit-arama.html satır 19748) birebir aynı deseni taşıyor ve iki
     şerhi de kendisi yazmış:
       ⚠ ResizeObserver `border-box` İZLER — footer'ın DOLGUSU değişince
         içerik kutusu aynı kalır, varsayılan content-box gözlemcisi HİÇ
         tetiklenmez ve pay bayat kalır.
       ⚠ Mobilde footer sabit değildir; pay temizlenir.

     Gourmet'in yerleşik sürücüsü (gourmet-BB1JjHfF.js) aynı deseni
     taşıyor ama İKİ parçası eksik — ÖLÇÜLDÜ:
       (a) ResizeObserver YOK. Yalnız resize + load + fonts.ready var.
           Footer dolgusu sonradan değişirse pay bayat kalır.
       (b) İlk koşumu `load` ÖNCESİ yapıyor; o anda footer nihai boyunda
           değil. Statik markup'ta donmuş pay ile o anki footer boyu
           arasındaki fark ölçüldü: kayit.html pay 547 · footer 666.3 →
           −119.3. `load` gelene kadar footer son ekranı örtüyor.
     Kırılım SAYIYLA değil ÖLÇÜLEREK sorulur: pay ancak footer gerçekten
     `position:fixed` iken açılır. Böylece kırılım (Gourmet 1025 · donör
     641) nereye taşınırsa taşınsın sürücü peşinden gelir; 641–1024
     arasında Gourmet footer'ı `static` olduğu için pay AÇILMAZ ve
     yerleşik sürücüyle çelişmez (ikisi de aynı değere yakınsar). */
  var kur = function(){
    var ana  = document.getElementById('pageMain');
    var ayak = document.querySelector('.footer');
    if (!ana || !ayak) return;

    function pay(){
      var sabit = getComputedStyle(ayak).position === 'fixed';
      ana.style.marginBottom = sabit ? (ayak.offsetHeight + 'px') : '';
    }
    pay();
    addEventListener('resize', pay);
    addEventListener('load', pay);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(pay);
    if (window.ResizeObserver) new ResizeObserver(pay).observe(ayak, { box: 'border-box' });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
