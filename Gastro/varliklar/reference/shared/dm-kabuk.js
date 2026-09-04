/* DadaGastro kabuk davranışı — KAYNAK: FIT kabuk betiği (/Fit/fit-giris.html).
   ÜRETİLİR, ELLE DÜZENLENMEZ: scripts/gastro-public-revize.mjs --adim d6 */
(function(){
  if (window.__dmKabuk) return; window.__dmKabuk = true;
  var header = document.querySelector('.header');
  if (!header) return;
  if (location.search.indexOf('hdr=solid') > -1) { header.classList.remove('at-top','tepede'); return; }
  function onScroll(){
    if (window.scrollY < 60) { header.classList.add('at-top'); header.classList.add('tepede'); }
    else { header.classList.remove('at-top'); header.classList.remove('tepede'); }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });
})();
