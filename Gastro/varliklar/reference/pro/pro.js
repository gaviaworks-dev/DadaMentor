/* ===== Pro planları — SSS akordeonu + kart "Tüm özellikler" senkron aç/kapa =====
   ref pro-v1.html satır 1983-2013 ("SSS akordeon" + "PRO-CARD EXPAND" IIFE'leri) —
   literal transfer, davranış DEĞİŞMEDİ.

   PRO-GATE (FB9-b, Beyar 2026-07-14): pro-demo bölümü GERİ KONDU, GERÇEK
   pro-gate mekanizmasıyla (video-mutfagi.js'teki AYNI altyapı — #proGate/
   .pg-overlay/[data-pro-gate], CSS artık tokens.css'te paylaşılan bileşen).
   CREATOR-SUB (ref'in [data-abone-takip] JS toggle'ı) BİLEREK taşınmadı —
   gerçek takip artık follow.toggle route'una POST eden bir <form> (video
   modülünün .creator-sub deseniyle aynı), sayfa yeniden render eder; ayrıca
   client-side toggle JS'ine gerek yok. */
(function(){
  document.querySelectorAll('.faq-q').forEach(function(q){
    q.addEventListener('click',function(){
      var item=q.closest('.faq-item');
      var open=item.classList.toggle('open');
      var a=item.querySelector('.faq-a');
      a.style.maxHeight=open ? a.scrollHeight+'px' : '';
    });
  });
})();

// ---- PRO-GATE — [data-pro-gate] açar (video-mutfagi.js ile birebir aynı davranış) ----
(function () {
  var gate = document.getElementById('proGate'); if (!gate) return;
  var overlay = document.getElementById('pgOverlay'),
    closeBtn = document.getElementById('pgClose'),
    later = document.getElementById('pgLater'),
    title = document.getElementById('pgTitle'),
    desc = document.getElementById('pgDesc');
  function open(t, d) { if (t) title.textContent = t; if (d) desc.textContent = d; overlay.classList.add('show'); gate.classList.add('show'); }
  function close() { overlay.classList.remove('show'); gate.classList.remove('show'); }
  closeBtn.addEventListener('click', close);
  if (later) later.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && gate.classList.contains('show')) close(); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-pro-gate]'); if (!t) return;
    e.preventDefault(); e.stopPropagation();
    open(t.getAttribute('data-pro-title'), t.getAttribute('data-pro-desc'));
  }, true);
})();

(function(){
  var allCards=document.querySelectorAll('.pro-card');
  var allBtns=document.querySelectorAll('.pro-expand-btn');
  if(!allBtns.length)return;
  var globalExpanded=false;
  function setExpanded(open){
    globalExpanded=open;
    allCards.forEach(function(c){ c.classList.toggle('expanded',open); });
    allBtns.forEach(function(b){
      b.innerHTML=open
        ? '<i class="fa-solid fa-chevron-up" aria-hidden="true"></i> Daha az göster'
        : '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i> Tüm özellikler';
    });
  }
  allBtns.forEach(function(btn){
    btn.addEventListener('click',function(){ setExpanded(!globalExpanded); });
  });
})();
