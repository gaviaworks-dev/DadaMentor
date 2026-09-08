/* DadaDiet T5D · kategori çip sayaçları — GERÇEK kart verisinden türetilir.
   Sabit sayı yazmak yalan sayaçtır (Gastro donörü `.fct-body` gerçek sayı basar). */
(function(){
  'use strict';
  function hazir(f){ if(document.readyState!=='loading') f(); else document.addEventListener('DOMContentLoaded',f); }
  hazir(function(){
    var bar=document.querySelector('.dl-fbar');
    var grid=document.querySelector('.prog-grid');
    if(!bar||!grid) return;
    var kartlar=[].slice.call(grid.querySelectorAll('.prog-card'));
    if(!kartlar.length) return;
    /* her kartın kategori etiketi: kartın ilk küçük etiketi */
    function kat(k){
      var e=k.querySelector('.prog-kat,.kat,[class*="etiket"],small,span');
      return e?e.textContent.replace(/\s+/g,' ').trim().toLowerCase():'';
    }
    var sayim={}; kartlar.forEach(function(k){ var c=kat(k); if(c) sayim[c]=(sayim[c]||0)+1; });
    [].slice.call(bar.querySelectorAll('.dl-fchip')).forEach(function(cip){
      if(cip.querySelector('.dl-fsay')) return;                 /* idempotent */
      var et=cip.textContent.replace(/\s+/g,' ').trim().toLowerCase();
      var n = /^tümü$/.test(et) ? kartlar.length : (sayim[et]||0);
      if(!n) return;                                            /* sayısı olmayana sayaç basma */
      var s=document.createElement('span');
      s.className='dl-fsay'; s.textContent=String(n);
      s.setAttribute('aria-label',n+' program');
      cip.appendChild(s);
    });
  });
})();
