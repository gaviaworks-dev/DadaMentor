/* =====================================================================
   ANSIKLOPEDI-DETAY — SAYFA JS (kaynak-transfer, AYNEN)
   Kaynak: reference/ansiklopedi/ansiklopedi-detay-v1.html "SAYFA JS —
   ANSİKLOPEDİ DETAY" IIFE'si (satır 1983-1999). r-save kalp toggle'ı burada
   YOK — ilgili tarif kartları tarifler/_card.blade.php'nin gerçek
   data-lg-gate mekanizmasını kullanıyor (siteyi genelinde tek "kaydet"
   davranışı; referansın yerel mock toggle'ı yerine).
   ===================================================================== */
(function(){
  var lb=document.getElementById('lightbox');
  if(!lb) return;
  var img=document.getElementById('lbImg');
  function open(src){ if(!src) return; img.src=src; lb.classList.add('open'); document.body.style.overflow='hidden'; }
  function close(){ lb.classList.remove('open'); document.body.style.overflow=''; }
  var closeBtn=document.getElementById('lbClose');
  if(closeBtn) closeBtn.addEventListener('click', close);
  lb.addEventListener('click', function(e){ if(e.target===lb) close(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && lb.classList.contains('open')) close(); });
  var stage=document.getElementById('rdStage');
  if(stage) stage.addEventListener('click', function(){
    var m=(stage.style.backgroundImage||'').match(/url\(["']?(.*?)["']?\)/);
    if(m) open(m[1]);
  });
})();
