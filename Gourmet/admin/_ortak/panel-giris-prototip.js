/*
 * PANEL GİRİŞ — MAKET KATMANI
 *
 * 🔴 BU DOSYA DONÖRDE YOK ve donörün davranışını DEĞİŞTİRMEZ.
 * Donörün kendi betiği (`panel-giris.js`) birebir kopyalandı ve şifre
 * gözünü kurar. Bu ayrı dosya yalnız PROTOTİPİN kipini kurar.
 *
 * Donörde form `POST /yonetim/giris`e gider ve gerçekten oturum açar.
 * Bu ağaç statik; oturum servisi YOK. Beyar kararı (2026-09-08): kapı
 * MAKET olarak çalışsın — düğme kullanıcıyı panele geçirsin.
 *
 * ⚠ Bu bir "yalan yüzey" DEĞİL, çünkü kapı ne yaptığını SÖYLÜYOR:
 * sayfa açılır açılmaz donörün kendi `.sa-flash` bileşeni (not kipi)
 * "maket giriş, kimlik doğrulanmaz" diyor. Yalan olan, sessizce panele
 * geçirip doğrulama yapılmış gibi göstermekti; not basılınca kullanıcı
 * tam olarak ne olacağını biliyor.
 *
 * Tarayıcının kendi doğrulaması (`required`, `type=email`) GERÇEKTEN
 * koşar ve engellenmez — maket olan kimlik denetimi, form denetimi değil.
 *
 * 🔴 PANELE ADRES PARAMETRESİ TAŞINMAZ. Public prototipin giriş ekranı
 * hedefe `?auth=1` ekliyor; burada aynısını yapmak kayıtlı tuzağa düşerdi:
 * `admin-kit.js`in `adrestenSuzgec()`i (satır 3515) beyaz listede olmayan
 * HER adres parametresini SÜZGEÇ sayıyor ve tabloyu boşaltabiliyor.
 * Hedef bu yüzden çıplak: `admin-genel-bakis.html`.
 */
(function () {
  'use strict';

  function serit(form, govde, kip) {
    var eski = document.querySelector('.sa-flash[data-prototip]');
    if (eski) eski.remove();

    var s = document.createElement('div');
    s.className = 'sa-flash ' + (kip || 'is-note');
    s.setAttribute('role', 'alert');
    s.setAttribute('data-prototip', '1');
    s.innerHTML =
      '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>' +
      '<span>' + govde + '</span>';
    form.parentNode.insertBefore(s, form);
    s.scrollIntoView({ block: 'nearest' });
  }

  var MAKET =
    '<b>Maket giriş.</b> Bu prototipte kimlik doğrulanmaz — alanları ' +
    'doldurup “Giriş Yap”a bastığında kapı seni doğrudan panele geçirir. ' +
    'Gerçek doğrulama full-stack uygulamada çalışır.';

  /* 🔴 ÇIKIŞ "OTURUMU KAPATTIM" DEMEZ.
     Panelin hesap menüsündeki "Çıkış yap" bu kapıya `?cikis=1` ile gelir.
     Statik ağaçta oturum servisi yok, dolayısıyla KAPATILAN BİR OTURUM DA
     YOK; kullanıcıyı giriş ekranına getirip susmak, çıkış yapılmış gibi
     göstermek olurdu.
     ⚠ Adres parametresi bilerek YALNIZ bu sayfada okunuyor: panelin kit
     süzgeçleri adres parametresi okuyor (kayıtlı tuzak), bu kapı ise kit
     yüklemiyor — çakışacak okuyucu yok. */
  var CIKIS =
    '<b>Oturum kapatılmadı — kapatılacak bir oturum yok.</b> ' +
    'Bu maket kapıda kimlik doğrulanmaz; “Giriş Yap” seni yeniden panele geçirir.';

  var HEDEF = 'admin-genel-bakis.html';

  function bagla() {
    var form = document.querySelector('form.fk-form');
    if (!form || form.dataset.prototipBound) return;
    form.dataset.prototipBound = '1';

    /* kapı ne olduğunu AÇILIŞTA söyler; çıkışla gelindiyse onu söyler */
    var cikisla = /(?:^|[?&])cikis=1(?:&|$)/.test(location.search);
    serit(form, cikisla ? CIKIS : MAKET, 'is-note');

    form.addEventListener('submit', function (e) {
      e.preventDefault();      /* tarayıcı doğrulaması bu noktada GEÇMİŞTİR */
      location.href = HEDEF;   /* çıplak hedef — adres parametresi TAŞINMAZ */
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bagla);
  } else {
    bagla();
  }
})();
