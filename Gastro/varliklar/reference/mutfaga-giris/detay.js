/* Mutfağa Giriş ders detayı — lightbox (ansiklopedi-detay.js BİREBİR emsal,
   FB18 bağlayıcı 2026-07-15: rd-stage/lightbox aynı sözleşme) + actbar
   scroll-show (puf-noktasi-detay.js deseni — Kaydet ui.js'e ait, burada
   yalnız görünürlük + Yorumlar/Paylaş kısayolları). */
window.__bottomStrips = (window.__bottomStrips || []).concat(['#actbar']);

(function(){
  var bar=document.getElementById('actbar');
  if(!bar) return;
  function onScroll(){
    if((window.scrollY||0)>460) bar.classList.add('show');
    else bar.classList.remove('show');
    if(window.__bnUpdate) window.__bnUpdate();
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
  bar.querySelectorAll('.ab-act').forEach(function(b){
    var act=b.getAttribute('data-act');
    if(act==='save') return; // data-engagement-toggle zaten bağlı
    if(!act) return;         // Yorumlar artık gerçek <a> çapası — JS'e iş düşmüyor
    b.addEventListener('click', function(){
      if(act==='share'){
        /* GERİ BİLDİRİM ŞART (2026-08-03 tarayıcı turu bulgusu): eskiden
           panoya sessizce yazıyordu — tıklayan kullanıcı bir şey olup
           olmadığını ANLAYAMIYORDU (ölçüldü: DOM/URL/ağ üçü de sessiz).
           Buton etiketi 1.8 sn "Bağlantı kopyalandı" olur, sonra geri
           döner. Yeni CSS/class YOK; yalnız metin ve ikon değişir.
           navigator.clipboard yalnız güvenli bağlamda (https/localhost)
           çalışır — HTTP üzerinden gezen kullanıcı için execCommand
           yedeği bırakıldı, o da olmazsa etiket "Kopyalanamadı" der. */
        var ico = b.querySelector('i');
        var eski = b.getAttribute('data-label-eski');
        if (eski === null) { b.setAttribute('data-label-eski', b.textContent.trim()); eski = b.textContent.trim(); }
        var eskiIco = ico ? ico.className : '';

        function bildir(ok){
          if (ico) ico.className = ok ? 'fa-solid fa-check' : 'fa-solid fa-triangle-exclamation';
          b.lastChild.nodeValue = ' ' + (ok ? 'Bağlantı kopyalandı' : 'Kopyalanamadı');
          setTimeout(function(){
            if (ico) ico.className = eskiIco;
            b.lastChild.nodeValue = ' ' + eski;
          }, 1800);
        }

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(location.href).then(function(){ bildir(true); }, function(){ bildir(false); });
        } else {
          var ta = document.createElement('textarea');
          ta.value = location.href;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
          document.body.appendChild(ta);
          ta.select();
          var ok = false;
          try { ok = document.execCommand('copy'); } catch(e){ ok = false; }
          document.body.removeChild(ta);
          bildir(ok);
        }
      }
    });
  });
})();

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

/* ===== YORUMLAR — tarif-detay.js'ten PORTU (fotoğraf yükleme hariç, bu
   sayfanın rev-form'unda rf-photo/rfChips YOK — FB18 bağlayıcı 2026-07-15). ===== */
(function () {
  var rform = document.getElementById('revForm');
  if (rform) {
    rform.addEventListener('click', function () { rform.classList.add('open'); });
    rform.addEventListener('focusin', function () { rform.classList.add('open'); });
  }

  document.querySelectorAll('[data-reply-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.closest('.c-main').querySelector('.c-reply-form');
      if (!f) return;
      f.hidden = !f.hidden;
      if (!f.hidden) { var ta = f.querySelector('textarea'); if (ta) ta.focus(); }
    });
  });
  document.querySelectorAll('[data-reply-cancel]').forEach(function (b) {
    b.addEventListener('click', function () { b.closest('.c-reply-form').hidden = true; });
  });

  (function () {
    var form = document.getElementById('revForm');
    if (!form) return;
    var starsWrap = document.getElementById('rfStars');
    var hint = document.getElementById('rfHint');
    var ratingInput = document.getElementById('rfRatingInput');
    var textarea = form.querySelector('.rf-text');
    var rating = parseInt(ratingInput.value, 10) || 0;
    var btns = [].slice.call(starsWrap.querySelectorAll('button'));

    function paint(n) { btns.forEach(function (b, i) { b.classList.toggle('on', i < n); }); }

    btns.forEach(function (b, i) {
      b.addEventListener('mouseenter', function () { paint(i + 1); });
      b.addEventListener('click', function () {
        rating = i + 1; ratingInput.value = rating; paint(rating);
        hint.textContent = 'Puanın: ' + rating + '/5';
        hint.classList.remove('err'); hint.classList.add('ok');
      });
    });
    starsWrap.addEventListener('mouseleave', function () { paint(rating); });

    form.addEventListener('submit', function (e) {
      if (!rating) {
        e.preventDefault();
        hint.textContent = 'Puan vermeden yorum gönderilemez';
        hint.classList.remove('ok'); hint.classList.add('err');
        starsWrap.classList.add('shake');
        setTimeout(function () { starsWrap.classList.remove('shake'); }, 450);
      }
    });

    document.querySelectorAll('[data-review-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        rating = parseInt(btn.getAttribute('data-rating'), 10) || 0;
        ratingInput.value = rating; paint(rating);
        textarea.value = btn.getAttribute('data-body') || '';
        form.action = btn.getAttribute('data-update-url');
        var methodInput = form.querySelector('input[name="_method"]');
        if (!methodInput) {
          methodInput = document.createElement('input');
          methodInput.type = 'hidden';
          methodInput.name = '_method';
          form.appendChild(methodInput);
        }
        methodInput.value = 'PATCH';
        form.classList.add('open');
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        textarea.focus();
      });
    });
  })();

  (function () {
    var chips = document.querySelectorAll('#revFilter .chip');
    if (!chips.length) return;
    var items = document.querySelectorAll('#revList > .c-item');
    var empty = document.getElementById('revEmpty');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
        var k = c.getAttribute('data-f'), visible = 0;
        items.forEach(function (it) {
          var s = it.getAttribute('data-stars');
          var show = k === 'all' || k === s || (k === 'low' && parseInt(s, 10) <= 3);
          it.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        if (empty) empty.hidden = visible > 0;
      });
    });
  })();
})();
