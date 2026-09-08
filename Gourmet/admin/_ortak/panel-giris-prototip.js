/*
 * PANEL GİRİŞ — PROTOTİP KATMANI
 *
 * 🔴 BU DOSYA DONÖRDE YOK ve donörün davranışını DEĞİŞTİRMEZ.
 * Donörün kendi betiği (`panel-giris.js`) birebir kopyalandı ve şifre
 * gözünü kurar. Bu ayrı dosya yalnız PROTOTİPİN gerçeğini söyler.
 *
 * Sorun: donörde form `POST /yonetim/giris`e gider ve gerçekten oturum
 * açar. Bu ağaç statik bir prototip; oturum servisi YOK.
 *
 * Üç yol vardı, ikisi elendi:
 *   1 · Düğmeyi olduğu gibi bırak → statik sunucuda POST 405, GET ise
 *       sayfayı yazdıklarıyla birlikte yeniden yükler. Ölü düğme.
 *   2 · Panele yönlendir (`admin-genel-bakis.html`) → public prototipin
 *       giriş ekranı bunu yapıyor (`go-giris.html`, `?auth=1`), ama bu
 *       kimlik doğrulandı demektir. Doğrulanmadı: YALAN YÜZEY.
 *   3 · DOĞRUNUN kendisini söyle. Seçilen bu.
 *
 * Kullanılan yüzey UYDURULMADI: donörün kendi `.sa-flash.is-error`
 * bileşeni (panel-giris.css § ŞERİT). Tarayıcının kendi doğrulaması
 * (`required`, `type=email`) ÖNCE koşar — o gerçek davranıştır ve
 * engellenmez; şerit yalnız geçerli bir gönderimden sonra basılır.
 *
 * Şerit sayfada gizli DURMUYOR, tıklamada KURULUYOR: `.sa-flash`
 * `display:flex` taşıyor ve yazar kuralı `[hidden]`in tarayıcı
 * varsayılanını ezerdi — kayıtlı tuzak ("gizli sanılan şerit görünür
 * kalır"). Kurulmayan bir düğüm yanlış görünemez.
 */
(function () {
  'use strict';

  function serit(form) {
    var eski = document.querySelector('.sa-flash.is-error[data-prototip]');
    if (eski) eski.remove();

    var s = document.createElement('div');
    s.className = 'sa-flash is-error';
    s.setAttribute('role', 'alert');
    s.setAttribute('data-prototip', '1');
    s.innerHTML =
      '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>' +
      '<span><b>Bu prototipte oturum servisi yok.</b> ' +
      'Giriş ekranı donörün yapısıyla kuruldu; kimlik doğrulama ' +
      'full-stack uygulamada çalışır. Buradan gönderilen form bir oturum ' +
      'açmaz ve panele geçirmez.</span>';
    form.parentNode.insertBefore(s, form);
    s.scrollIntoView({ block: 'nearest' });
  }

  function bagla() {
    var form = document.querySelector('form.fk-form');
    if (!form || form.dataset.prototipBound) return;
    form.dataset.prototipBound = '1';
    form.addEventListener('submit', function (e) {
      e.preventDefault();          /* tarayıcı doğrulaması bu noktada GEÇMİŞTİR */
      serit(form);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bagla);
  } else {
    bagla();
  }
})();
