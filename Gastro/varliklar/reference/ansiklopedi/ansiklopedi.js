/* =====================================================================
   ANSIKLOPEDI — SAYFA JS (kaynak-transfer, AYNEN)
   Kaynak: reference/ansiklopedi/ansiklopedi-v1.html "SAYFA JS — ANSİKLOPEDİ
   LİSTE" IIFE'si (satır 2706-2810). İki katmanlı mimari (KATMAN 1 kategori
   grid'i, KATMAN 2 kategori drill) AYNEN; yalnız "toplam 480 madde" sabiti
   #ancGrid[data-total]'dan okunan gerçek sayıyla değiştirildi.
   ===================================================================== */
(function(){
  var cards=[].slice.call(document.querySelectorAll('.anc-card'));
  var items=[].slice.call(document.querySelectorAll('.ans-item'));
  var secs=[].slice.call(document.querySelectorAll('.ans-catsec'));
  var azs=[].slice.call(document.querySelectorAll('#azBar .az'));
  var search=document.getElementById('ansSearch');
  var count=document.getElementById('ansCount');
  var grid=document.getElementById('ancGrid');
  var drill=document.getElementById('ansDrill');
  var emptyLetter=document.getElementById('ansEmptyLetter');
  var aelLtr=document.getElementById('aelLtr'), aelLtr2=document.getElementById('aelLtr2');
  var catEmpty=document.getElementById('ansCatEmpty');
  var aceTitle=document.getElementById('aceTitle');
  var ansEmpty=document.getElementById('ansEmpty');
  var back=document.getElementById('ansBack'); // Beyar 2026-08-23: DOM'dan kalktı, geçitli bağlanır
  var total=grid?grid.getAttribute('data-total'):'0';
  var curLtr='*';
  function hide(el,h){ if(el){ if(h) el.setAttribute('hidden',''); else el.removeAttribute('hidden'); } }
  function label(c){ return c.querySelector('.anc-h').textContent; }

  // Katman 2 madde satırı akordeon aç/kapa — TEK-AÇIK (Beyar'ın açık talebi,
  // kaynak-transferden onaylı sapma): bir satır açılırken aynı .ans-catsec
  // içindeki diğer açık satırlar kapatılır.
  items.forEach(function(it){
    var row=it.querySelector('.ans-row');
    row.addEventListener('click',function(){
      var open=it.classList.toggle('open');
      row.setAttribute('aria-expanded',open?'true':'false');
      if(open){
        var sec=it.closest('.ans-catsec');
        if(sec){
          sec.querySelectorAll('.ans-item.open').forEach(function(other){
            if(other!==it){
              other.classList.remove('open');
              var otherRow=other.querySelector('.ans-row');
              if(otherRow) otherRow.setAttribute('aria-expanded','false');
            }
          });
        }
      }
    });
  });

  // KATMAN 1 — kategori grid (harf çubuğu süzer)
  function showGrid(ltr){
    curLtr=ltr||'*';
    if(search.value) search.value='';
    azs.forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-ltr')===curLtr); });
    var n=0;
    cards.forEach(function(c){
      var ok=curLtr==='*'||c.getAttribute('data-ltr')===curLtr;
      c.classList.toggle('is-hidden',!ok); if(ok) n++;
    });
    hide(drill,true); hide(catEmpty,true); hide(ansEmpty,true); hide(count,false);
    if(n===0 && curLtr!=='*'){
      hide(grid,true); hide(emptyLetter,false);
      if(aelLtr) aelLtr.textContent=curLtr; if(aelLtr2) aelLtr2.textContent=curLtr;
      count.innerHTML='<b>0</b> kategori <span class="muted">· '+curLtr+' harfi</span>';
    } else {
      hide(grid,false); hide(emptyLetter,true);
      count.innerHTML='<b>'+n+'</b> kategori gösteriliyor <span class="muted">· toplam '+total+' madde</span>';
    }
  }

  // KATMAN 2 — kategori drill (kart tıklanınca maddeler)
  function openCat(key,lbl){
    // Özet satırı kategori görünümünde bastırılır (Beyar 2026-08-23) — madde
    // sayısı kategori başlığının yanında (.cc) zaten yazıyor. innerHTML yine
    // güncellenir: arama/ızgaraya dönünce satır olduğu gibi geri gelir.
    hide(grid,true); hide(emptyLetter,true); hide(ansEmpty,true); hide(drill,false); hide(count,true);
    var found=null;
    secs.forEach(function(sec){
      var match=sec.getAttribute('data-cat')===key;
      sec.classList.toggle('is-hidden',!match);
      if(match){ found=sec; sec.querySelectorAll('.ans-item').forEach(function(it){it.classList.remove('is-hidden');it.classList.remove('open');}); }
    });
    if(found){
      hide(catEmpty,true);
      var m=found.querySelectorAll('.ans-item').length;
      count.innerHTML='<b>'+m+'</b> madde · '+lbl+' <span class="muted">· toplam '+total+' madde</span>';
    } else {
      hide(catEmpty,false);
      if(aceTitle) aceTitle.textContent=lbl+' — madde bulunamadı';
      count.innerHTML=lbl+' <span class="muted">· bu kategoride madde yok</span>';
    }
    if(drill.scrollIntoView) drill.scrollIntoView({behavior:'smooth',block:'start'});
  }

  // arama — madde adıyla düz sonuç
  function runSearch(q){
    hide(grid,true); hide(emptyLetter,true); hide(catEmpty,true); hide(drill,false); hide(count,false);
    azs.forEach(function(b){ b.classList.remove('active'); });
    var n=0,cn=0;
    secs.forEach(function(sec){
      var vis=0;
      sec.querySelectorAll('.ans-item').forEach(function(it){
        var ok=it.getAttribute('data-name').indexOf(q)>-1;
        it.classList.toggle('is-hidden',!ok); if(ok){vis++;n++;}
      });
      sec.classList.toggle('is-hidden',vis===0); if(vis>0)cn++;
    });
    hide(ansEmpty, n!==0);
    count.innerHTML='<b>'+n+'</b> madde · <b>'+cn+'</b> kategori <span class="muted">· "'+q+'" araması</span>';
  }

  cards.forEach(function(c){ c.addEventListener('click',function(){ openCat(c.getAttribute('data-cat'), label(c)); }); });
  azs.forEach(function(b){ if(b.disabled) return; b.addEventListener('click',function(){ showGrid(b.getAttribute('data-ltr')); }); });
  search.addEventListener('input',function(){
    var q=search.value.trim().toLocaleLowerCase('tr');
    if(!q) showGrid(curLtr); else runSearch(q);
  });
  if(back) back.addEventListener('click',function(){ showGrid(curLtr); });
  var aelBack=document.getElementById('aelBack'); if(aelBack) aelBack.addEventListener('click',function(){ showGrid('*'); });
  var aceBack=document.getElementById('aceBack'); if(aceBack) aceBack.addEventListener('click',function(){ showGrid(curLtr); });
  var ansClear=document.getElementById('ansClear'); if(ansClear) ansClear.addEventListener('click',function(){ search.value=''; showGrid('*'); });

  // derin link: ?kat=<key> · ?harf=<L>
  var qs2=new URLSearchParams(location.search);
  if(qs2.get('kat')){ var k=qs2.get('kat'); var card=cards.filter(function(c){return c.getAttribute('data-cat')===k;})[0]; if(card) openCat(k,label(card)); else showGrid('*'); }
  else if(qs2.get('harf')){ showGrid(qs2.get('harf').toLocaleUpperCase('tr')); }
  else showGrid('*');
})();
