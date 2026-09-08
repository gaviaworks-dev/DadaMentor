/* DadaDiet T5D · "Dökümü aç" penceresi.
   Kalıp: `d-odemelerim.html#fdModal` (fatura belgesi penceresi) — açılışta
   `.show`, ESC · dış tıklama · kapat düğmesi · odağı tetikleyiciye geri verme.

   🔴 NİÇİN MARKUP DEĞİŞTİ: tetikleyiciler `data-ayrinti` taşıyordu ve
      `diet-profil.js` onları `document` üzerinde delegasyonla yakalayıp SATIR
      İÇİNDE açıyordu. İki delegasyon aynı düğümde yarışırsa `stopPropagation`
      çözmez (önce bağlanan önce koşar). Sözleşme değiştirildi:
      `data-bp-dokum` + `aria-haspopup="dialog"` — kaynağın fatura tetikleyicisi
      de bu şekli taşıyor. Kaynak `<tr id="bpDok*" hidden>` satırları SİLİNMEDİ;
      içerik oradan KOPYALANIYOR (taşınsaydı ikinci açılış boş kalırdı).

   🔴 ODAK TUZAĞI: kaynağın `fdModal`ında yok ve şerhi "canlıya geçerken
      kapatılacak" diyor. Görev açıkça istediği için burada kuruldu. */
(function () {
  'use strict';
  function hazir(f){ if(document.readyState!=='loading') f(); else document.addEventListener('DOMContentLoaded',f); }

  hazir(function () {
    var modal = document.getElementById('bpDokModal');
    var perde = document.getElementById('bpDokOverlay');
    var govde = document.getElementById('bpDokGovde');
    var baslik= document.getElementById('bpDokBaslik');
    var alt   = document.getElementById('bpDokAlt');
    var kapatD= document.getElementById('bpDokKapat');
    if (!modal || !perde || !govde || !kapatD) return;

    var sonOdak = null;

    function odaklanabilir(){
      return [].slice.call(modal.querySelectorAll(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
      )).filter(function(e){ return e.offsetParent !== null; });
    }

    function ac(dugme){
      var id = dugme.getAttribute('data-bp-dokum');
      var satir = document.getElementById(id);
      if (!satir) return;
      var hucre = satir.querySelector('td') || satir;

      /* başlık: satırın ilk <b>'si ("Dengeli Beslenme · program dökümü") */
      var b = hucre.querySelector('b');
      baslik.textContent = b ? b.textContent.replace(/\s+/g,' ').trim() : 'Program dökümü';

      /* alt satır: başlığın hemen altındaki özet paragrafı — varsa oradan,
         yoksa markup'taki sabit cümle korunur (uydurulmaz) */
      var p = hucre.querySelector('p');
      if (p && alt) alt.textContent = p.textContent.replace(/\s+/g,' ').trim();

      /* içerik KOPYALANIR — kaynak satır yerinde kalır */
      var kopya = hucre.cloneNode(true);
      var bb = kopya.querySelector('b'); if (bb && bb.parentNode === kopya) bb.remove();
      var pp = kopya.querySelector('p'); if (pp && pp.parentNode === kopya) pp.remove();
      govde.innerHTML = '';
      while (kopya.firstChild) govde.appendChild(kopya.firstChild);

      sonOdak = dugme;
      perde.classList.add('show');
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
      /* 🔴 ODAK İKİ KARE SONRA — `.show` eklendiği anda `visibility` hâlâ
         `hidden` (geçiş henüz uygulanmadı) ve `focus()` SESSİZCE boşa gider.
         Ölçüldü: tıklamadan hemen sonra activeElement=BODY, 300ms sonra
         zorlanınca odak tutuyor. Kaynağın `fdModal`ı da senkron odaklıyor —
         orada da aynı gizli kusur var, bildirildi. */
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        if (modal.classList.contains('show')) kapatD.focus();
      }); });
    }

    function kapa(){
      if (!modal.classList.contains('show')) return;
      modal.classList.remove('show');
      perde.classList.remove('show');
      document.body.style.overflow = '';
      if (sonOdak && sonOdak.focus) sonOdak.focus();
      sonOdak = null;
    }

    document.addEventListener('click', function (e) {
      var d = e.target.closest ? e.target.closest('[data-bp-dokum]') : null;
      if (!d) return;
      e.preventDefault();
      ac(d);
    });

    /* dış tıklama — yalnız kabın KENDİSİ sayılır, panelin içinden gelen geçmez */
    modal.addEventListener('click', function (e) { if (e.target === modal) kapa(); });
    perde.addEventListener('click', kapa);
    kapatD.addEventListener('click', kapa);

    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('show')) return;
      if (e.key === 'Escape') { kapa(); return; }
      if (e.key !== 'Tab') return;
      var o = odaklanabilir();
      if (!o.length) { e.preventDefault(); return; }
      var ilk = o[0], son = o[o.length-1];
      if (e.shiftKey && document.activeElement === ilk) { e.preventDefault(); son.focus(); }
      else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
      else if (!modal.contains(document.activeElement)) { e.preventDefault(); ilk.focus(); }
    });
  });
})();
