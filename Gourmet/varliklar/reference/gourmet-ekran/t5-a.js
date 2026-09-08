/* =====================================================================
   T5 · GOURMET — kulvar A sürücüsü. Yalnız ajan A yazar.
   Sayfa motorlarının ÜSTÜNE yeni davranış eklenir; sayfa <script>lerine
   yeni iş yazılmaz (kulvar kuralı 4).
   ===================================================================== */
(function () {
  'use strict';

  /* -------------------------------------------------------------------
     §1 · "Tamamını Gör" — karma panonun blok başlığındaki bağ
     -------------------------------------------------------------------
     `go-arama.html` motorunun ürettiği `.sonuc-blok-basi a[data-git]`
     bağı, canlı arama sayfasının `.srb-head a` kaleminin karşılığıdır.
     Canlıda o bağ bir SAYFAYA gider (tür dizini); kopyada karşılığı
     aynı sayfadaki TÜR SEKMESİDİR — sekmeyi tıklamak ne yapıyorsa o.
     ⚠ Delegasyon `#fsResults` üzerinden: bloklar her sorguda yeniden
       üretiliyor, doğrudan bağlanan dinleyici ikinci render'da ölürdü.
     ------------------------------------------------------------------- */
  var sonuclar = document.getElementById('fsResults');
  if (sonuclar) {
    sonuclar.addEventListener('click', function (e) {
      var bag = e.target.closest ? e.target.closest('.sonuc-blok-basi a[data-git]') : null;
      if (!bag) return;
      e.preventDefault();
      var tur = bag.getAttribute('data-git');
      var sekme = document.querySelector('#fsTabbar .sekme[data-tab="' + tur + '"]');
      if (!sekme) return;
      sekme.click();                                   /* sayaç · pano · adres: sekmenin kendi işi */
      var bar = document.getElementById('fsTabbar');
      if (bar) bar.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }
})();
