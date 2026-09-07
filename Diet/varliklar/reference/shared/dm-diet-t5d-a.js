/* DadaDiet T5D · ajan A yüzeyi — mesajlaşma sürücüsü.
   Donör: Fit `#ant-mesaj` (`Fit/assets/js/fit-mesaj.js` kipinde).
   🔴 Markup taşınırsa SÜRÜCÜ de taşınır: arama gerçekten süzer, sayaç ve
      önizleme GERÇEK akıştan türer. Sabit metin yazmak yalan sayaçtır.
   🔴 Mevcut `diet-profil.js` sohbet sürücüsüne dokunulmaz; bu dosya yalnız
      onun basmadığı kalemleri doldurur ve kişi değişimini dinler. */
(function () {
  'use strict';
  function hazir(f){ if(document.readyState!=='loading') f(); else document.addEventListener('DOMContentLoaded',f); }

  hazir(function () {
    var pano = document.querySelector('[data-sohbet]');
    if (!pano) return;                                  // özne yok — sessizce çıkma, ama iş de yapma
    var kisiler = [].slice.call(pano.querySelectorAll('.sohbet-kisi'));
    var akislar = [].slice.call(pano.querySelectorAll('[data-sohbet-akis]'));
    if (!kisiler.length || !akislar.length) return;

    function akisBul(slug){
      for (var i=0;i<akislar.length;i++) if (akislar[i].getAttribute('data-sohbet-akis')===slug) return akislar[i];
      return null;
    }
    function balonlar(a){ return a ? [].slice.call(a.querySelectorAll('.sohbet-balon')) : []; }
    function metin(el){ var p=el.querySelector('p'); return (p?p.textContent:el.textContent).replace(/\s+/g,' ').trim(); }

    /* ---- 1 · ÖNİZLEME + OKUNMAMIŞ ROZETİ — gerçek akıştan türetilir ---- */
    var toplamMesaj = 0;
    kisiler.forEach(function (k) {
      var slug = k.getAttribute('data-kisi');
      var akis = akisBul(slug);
      var bl = balonlar(akis);
      toplamMesaj += bl.length;

      var onizleme = k.querySelector('[data-sohbet-onizleme]');
      if (onizleme && bl.length) {
        var son = bl[bl.length-1];
        var benim = son.classList.contains('uye');
        onizleme.textContent = (benim ? 'Sen: ' : '') + metin(son);
      }

      /* okunmamış: Diet'in KENDİ bayrağı (.sohbet-nokta gizli değilse) doğrudur;
         sayı, kullanıcının son kendi mesajından SONRA gelen karşı mesajlardır.
         Bayrak yoksa rozet de basılmaz — okunmamış UYDURULMAZ. */
      var benek = k.querySelector('.sohbet-nokta');
      var rozet = k.querySelector('[data-sohbet-okunmamis]');
      var okunmamis = 0;
      if (benek && !benek.hidden) {
        for (var i = bl.length - 1; i >= 0; i--) {
          if (bl[i].classList.contains('uye')) break;
          okunmamis++;
        }
      }
      if (rozet) {
        if (okunmamis > 0) { rozet.textContent = String(okunmamis); rozet.hidden = false;
          rozet.setAttribute('aria-label', okunmamis + ' okunmamış mesaj'); }
        else rozet.hidden = true;
      }
      /* avatar durumu — donörde ok/wait ayrımı var; okunmamışı olan bekliyor */
      var mono = k.querySelector('.sohbet-mono');
      if (mono) { mono.classList.toggle('wait', okunmamis > 0); mono.classList.toggle('ok', okunmamis === 0); }
    });

    /* ---- 2 · SAYAÇ — listeden türer, sabit metin değil ---- */
    var sayacEl = pano.querySelector('[data-sohbet-sayi]') || document.getElementById('sohbetSayi');
    function sayaciYaz(){
      if (!sayacEl) return;
      var n = pano.querySelectorAll('.sohbet-kisi').length;
      var m = 0;
      [].slice.call(pano.querySelectorAll('[data-sohbet-akis]')).forEach(function(a){ m += balonlar(a).length; });
      sayacEl.textContent = n + ' kişi · ' + m + ' mesaj';
    }
    sayaciYaz();

    /* ---- 3 · ARAMA — en az 2 harf, bütün yazışmalarda ---- */
    var girdi = document.getElementById('sohbetAra');
    var sil   = document.getElementById('sohbetAraSil');
    var sonuc = document.getElementById('sohbetSonuc');
    if (!girdi || !sonuc) return;

    function kacir(s){ return String(s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }

    function adBul(slug){
      for (var i=0;i<kisiler.length;i++) if (kisiler[i].getAttribute('data-kisi')===slug)
        return kisiler[i].getAttribute('data-kisi-ad') || slug;
      return slug;
    }

    function ara(q){
      var t = q.trim().toLowerCase();
      if (t.length < 2) { sonuc.hidden = true; sonuc.textContent = ''; if (sil) sil.hidden = !q; return; }
      if (sil) sil.hidden = false;
      var bulunan = [];
      akislar.forEach(function (a) {
        var slug = a.getAttribute('data-sohbet-akis');
        balonlar(a).forEach(function (b) {
          var m = metin(b);
          if (m.toLowerCase().indexOf(t) !== -1) bulunan.push({ slug: slug, metin: m });
        });
      });
      var h = '<p class="sohbet-sonuc-not">' + bulunan.length + ' sonuç · “' + kacir(q.trim()) + '”</p>';
      bulunan.slice(0, 12).forEach(function (s) {
        var m = kacir(s.metin);
        var yer = s.metin.toLowerCase().indexOf(t);
        m = kacir(s.metin.slice(0, yer)) + '<mark class="sohbet-vurgu">' +
            kacir(s.metin.substr(yer, t.length)) + '</mark>' + kacir(s.metin.slice(yer + t.length));
        h += '<button class="sohbet-sonuc-oge" type="button" data-git="' + kacir(s.slug) + '">' +
             '<b>' + kacir(adBul(s.slug)) + '</b><span>' + m + '</span></button>';
      });
      if (!bulunan.length) h += '<p class="sohbet-sonuc-bos">Bu aramayla eşleşen mesaj yok.</p>';
      sonuc.innerHTML = h;
      sonuc.hidden = false;
    }

    girdi.addEventListener('input', function () { ara(girdi.value); });
    if (sil) sil.addEventListener('click', function () {
      girdi.value = ''; ara(''); sil.hidden = true; girdi.focus();
    });
    /* sonuca tıklayınca o sohbet açılır — mevcut sürücünün kişi düğmesi tetiklenir */
    sonuc.addEventListener('click', function (e) {
      var d = e.target.closest ? e.target.closest('[data-git]') : null;
      if (!d) return;
      var slug = d.getAttribute('data-git');
      for (var i=0;i<kisiler.length;i++) if (kisiler[i].getAttribute('data-kisi')===slug) { kisiler[i].click(); break; }
    });
  });
})();
