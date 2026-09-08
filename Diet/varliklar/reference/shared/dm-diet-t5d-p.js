/* =====================================================================
   DadaDiet · T5D kulvarı · ROL P — DİYETİSYEN SOHBETİ YÜZEN DÜĞMESİ
   ---------------------------------------------------------------------
   Donör: DadaFit `assets/js/fit-mesaj.js` · `kur()`. Deseni birebir:
   düğmeyi kabuk basmaz, modül `document.body`ye ekler; bir kez basar;
   kendi işaretini kendi arar.

   NÜFUS — donörün kuralı ÖLÇÜLDÜ, ama Diet'te AYNEN kullanılamıyor.
   Donör iki koşula bakıyor:
       body[data-fit-page="mesajlarim-v1"]  → basma (zaten oradasın)
       !body.is-auth                        → basma (yalnız üyeye)
   Fit'te `fit-giris.html` ve `fit-oturum-suresi-doldu.html` gerçekten
   `is-auth` TAŞIMIYOR, düğme bu yüzden orada çıkmıyor.
   🔴 Diet'te ölçüldü: `giris.html` · `kayit.html` ·
      `oturum-suresi-doldu.html` ÜÇÜ DE `body.is-auth` taşıyor ve
      `data-fit-page`/`data-sayfa` gibi bir ekran kimliği hiç yok.
      Yani donörün kendi bekçisi burada hiçbir sayfayı elemiyor.
      (Bu Diet kabuğunun ayrı bir kusuru — giriş ekranı oturum açık
      diyor — bildirildi, burada düzeltilmedi.)
   Bu yüzden nüfus AÇIKÇA bildiriliyor. Liste donörün SEBEPLERİNDEN
   türetildi, sayfa adı ezberinden değil; her satırın karşılığı yazılı.

   HEDEF — donör sağdan panel açar, bu sürüm YÜZEYE GÖTÜRÜR.
   Sebep ölçüldü: Diet'in yazışma içeriği `d-diyetisyenim.html` içinde
   STATİK markup (18 balon · "3 kişi · 13 mesaj") ve arkasında Fit'in
   `fit-mesaj.js`i gibi bir veri modülü YOK. Paneli 158 sayfaya açmak
   ya o markup'ı çoğaltmayı ya da Diet için bir depo şeması UYDURMAYI
   gerektirirdi; ikisi de yasak. Düğme bu yüzden mevcut yüzeyin mesaj
   sekmesini açar — az iş yapar ama YALAN SÖYLEMEZ.
   🔴 ÖLÇÜM HATAM VE DÜZELTMESİ: önce "sayfa sekmeyi adresten açmıyor"
      diye ölçtüm ve sekmeyi açan bir kod yazdım. Yanlış hash'leri
      denemişim — `#dy-tab-mesaj` ve `#dy-pane-mesaj`, yani ELEMAN
      ID'leri. Sayfanın kendi sözleşmesi `data-tab` DEĞERİ: `#mesaj`
      ile pane 1052px açılıyor, sürücü zaten çalışıyor. Yazdığım kod
      çalışan bir sürücüyü ikinci kez sürüyordu; SİLİNDİ ve bağ
      sayfanın kendi sözleşmesine çevrildi. Kaynağın kuralı zaten
      bildirilmişse iş kural yazmak değil, ona uymaktır.

   ROZET YOK. Donörün rozeti OKUNMAMIŞ sayısıdır; Diet'te okundu/okunmadı
   durumu tutan bir alan yok. Sayı uydurulmadı, rozet hiç basılmadı.

   İKON donörün FAB ikonudur (`fa-comment-dots`), Diet'in sekme ikonu
   (`fa-comments`) değil — ikon seçimi kanon kararı değil, kaynaktan gelir
   ve buradaki kaynak donörün DÜĞMESİDİR.
   ===================================================================== */
(function () {
  'use strict';

  var HEDEF = 'd-diyetisyenim.html';
  var SEKME = 'mesaj';        /* sayfanın kendi `data-tab` değeri */

  /* Nüfus dışı ekranlar — her biri donörün bir sebebinin Diet karşılığı */
  var DISARIDA = {
    'd-diyetisyenim.html': 'yüzeyin kendisi (donör: mesajlarim-v1)',
    'giris.html': 'oturum açılmamış ekran (donör: fit-giris, is-auth yok)',
    'kayit.html': 'oturum açılmamış ekran (giriş ekranının kardeşi)',
    'oturum-suresi-doldu.html': 'oturum bitmiş ekran (donör: fit-oturum-suresi-doldu)',
    '_ekranlar.html': 'maket ekran dizini, site kabuğu yok',
    'index.html': 'yönlendirme kütüğü, kabuk yok'
  };

  function dosyaAdi() {
    var y = location.pathname.split('/').pop();
    return y || 'index.html';
  }

  function hazir(f) {
    if (document.readyState !== 'loading') f();
    else document.addEventListener('DOMContentLoaded', f);
  }

  /* ── DİĞER SAYFALARDA: düğmeyi bas ─────────────────────────────────── */
  function kur() {
    var b = document.body;
    if (!b) return;
    if (document.getElementById('msjFab')) return;            /* bir kez */
    /* yüzeyin kendisi — ada ek olarak YAPIYA da bakılır, dosya adı
       değişse bile düğme kendi üstünde açmasın */
    if (document.getElementById('dy-pane-mesaj')) return;

    var a = document.createElement('a');
    a.id = 'msjFab';
    a.className = 'msj-fab';
    a.href = HEDEF + '#' + SEKME;
    a.setAttribute('aria-label', 'Diyetisyen sohbeti — mesajlarına git');
    a.innerHTML = '<i class="fa-solid fa-comment-dots" aria-hidden="true"></i>' +
                  '<span class="yalniz-okuyucu">Diyetisyen sohbeti</span>';
    b.appendChild(a);
    return a;
  }

  /* ── ÇEREZ ŞERİDİ NÖBETİ ────────────────────────────────────────────
     Kabuğun kuralı: ekranda en fazla bir sabit alt şerit.
     🔴 İLK SÜRÜM YANLIŞTI VE ÖLÇÜM YAKALADI: yalnız `.show` sınıfına
        bakıp düğmeyi gizliyordu. Diet'in çerez şeridi HER ilk ziyarette
        açık, yani düğme 154 ekranın hepsinde gizlendi — kapı 308 kırmızı
        verdi. Donörün kendi şerhi tam bu kestirmeyi yasaklıyor:
        "ikinci bir sihirli sayı üretilmedi: kural uygulandı. Şerit
        GERÇEKTEN KESİŞİYORSA düğme çekilir."
        Ölçüldü, Diet: @1440 şerit ortada (151..1289) düğme 1364..1418 →
        kesişme YOK; @390 şerit 12..378 · alt 80 → kesişme VAR.
     Kesişme okunur, sınıf okunmaz. Zamanlayıcılar donörün kendi
     ikilisi (60/800ms — şerit gecikmeli açılıyor). */
  function cerezBekcisi(a) {
    var c = document.getElementById('cookieBanner') ||
            document.querySelector('.cookie-banner');
    if (!c) return;
    function guncelle() {
      var acik = c.classList.contains('show') && c.getClientRects().length > 0;
      var kesis = false;
      if (acik && a.getClientRects().length) {
        var s = c.getBoundingClientRect(), f = a.getBoundingClientRect();
        kesis = !(s.right <= f.left || f.right <= s.left ||
                  s.bottom <= f.top || f.bottom <= s.top);
      }
      /* Kesişmeyi ölçmek için düğmenin GÖRÜNÜR olması gerekir; bir kez
         gizlenince şerit kapanana kadar gizli kalır. */
      if (kesis) a.classList.add('msj-cerez');
      else if (!acik) a.classList.remove('msj-cerez');
    }
    try {
      new MutationObserver(guncelle).observe(c, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
    window.addEventListener('resize', guncelle);
    setTimeout(guncelle, 60); setTimeout(guncelle, 800);
    guncelle();
  }

  /* 🔴 ZAMANLAMA — ÖLÇÜMLE BULUNDU. Düğme önce DOMContentLoaded'da
     basılıyordu ve maket oturum bayrağını KAYBEDİYORDU: `maket-auth.js`
     `?auth=1`i sayfa içi bağlara DOMContentLoaded'da taşıyor ve o an
     düğme henüz DOM'da yok. Sonuç ölçüldü — tıklayınca varış sayfası
     `d-diyetisyenim.html#mesaj` (auth'suz) açılıyor, sekme "Mesajlarım"
     görünüyor ama panel `hidden` kalıyordu. Düğme artık betik
     çalışırken (gövde sonunda, DOMContentLoaded'dan ÖNCE) basılıyor;
     yeniden yazıcı onu kendi turunda görüyor. Bağa elle `?auth=1`
     EKLENMEDİ — o kabuğun işi, iki yerde tutulmaz. */
  var ad = dosyaAdi();
  if (!DISARIDA[ad]) {
    var dugme = document.body ? kur() : null;
    if (!dugme) hazir(function () { dugme = kur(); if (dugme) cerezBekcisi(dugme); });
    else hazir(function () { cerezBekcisi(dugme); });
  }
})();
