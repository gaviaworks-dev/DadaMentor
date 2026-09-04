/* DadaDiet kabuk davranışı — KAYNAK: FIT kabuk betiği (/Fit/fit-giris.html).
   ÜRETİLİR, ELLE DÜZENLENMEZ: scripts/diet-public-revize.mjs --adim d6 */

/* ── ÇEKMECE AKORDEONU · DONÖRDEN BİREBİR ─────────────────────────
   🔴 ÖLÇÜLDÜ 2026-09-05, @390: çekmecedeki dört kalemin üçü akordeon
      ama BASINCA AÇILMIYORDU (`.d-item.open .d-sub a` = 0).
      KÖK — markup FIT'in, sürücü Diet'in:
        FIT markup   .d-has-sub > .d-row > (.d-link + .d-toggle)
        dd-shell.js  querySelectorAll('.d-has-sub > .d-link')   ← eşleşmiyor
        FIT sürücü   querySelectorAll('.d-toggle')              ← eşleşiyor
      Diet'in kendi çekmecesinde bağ DOĞRUDAN çocuktu; FIT'inkinde bir
      `.d-row` sarmalayıcısı var. Yani kaybolan şey bir eleman değil,
      SEÇİCİNİN EŞLEŞMESİYDİ — bellekteki *markup taşındı, davranış
      kalmadı* kaydının bu hattaki hâli. Yapı kapısı gördüğü için değil,
      TIKLAMA ölçüldüğü için yakalandı.
   Kod DONÖRÜN kendi satırlarıdır (fit-giris.html kabuk IIFE'si);
   yeniden yazılmadı, kopyalandı. dd-shell.js'in kendi kancasıyla
   çakışmaz: onun seçicisi bu markup'ta hiçbir şeye eşleşmiyor. */
(function(){
  if (window.__ddCekmeceAkordeon) return; window.__ddCekmeceAkordeon = true;
  document.querySelectorAll('.d-toggle').forEach(function(t){
    t.addEventListener('click', function(){
      var r = t.closest('.d-item') || t.parentNode;
      var a = !r.classList.contains('open');
      r.classList.toggle('open', a); r.classList.toggle('acik', a);
      t.setAttribute('aria-expanded', a ? 'true' : 'false');
    });
  });
})();

(function(){
  if (window.__ddKabuk) return; window.__ddKabuk = true;
  var header = document.querySelector('.header');
  if (!header) return;
  var hero = header.getAttribute('data-hero') === '1';
  if (!hero || location.search.indexOf('hdr=solid') > -1) {
    header.classList.remove('at-top','tepede'); return;
  }
  function onScroll(){
    if (window.scrollY < 60) { header.classList.add('at-top'); header.classList.add('tepede'); }
    else { header.classList.remove('at-top'); header.classList.remove('tepede'); }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });
})();
