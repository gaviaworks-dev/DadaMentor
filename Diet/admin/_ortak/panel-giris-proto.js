/*
 * PANEL GİRİŞ — PROTOTİP DÜRÜSTLÜĞÜ
 *
 * 🔴 BU DOSYA DONÖRÜN DEĞİL, BİZİM. Donörde (`panel-giris.js`) yalnız şifre
 * gözü var; orada form GERÇEKTEN çalışıyor çünkü arkasında Laravel oturumu
 * duruyor. Bu ağaç statik bir maket: `deneme/admin-diet/` altında sunucu yok,
 * kimlik doğrulama yok, oturum yok.
 *
 * Bu yüzden düğmenin iki yanlış davranışı olabilirdi ve ikisi de yasak:
 *   1) SAHTE BAŞARI — "Giriş yapıldı" basmak. Hiçbir şey doğrulanmadan
 *      doğrulanmış demek; bu kulvarın m1 maddesinde 33 ekranda kapatılan
 *      yalanın aynısı olurdu.
 *   2) ÖLÜ DÜĞME — hiçbir şey yapmamak. Tıklanır, sayfa kıpırdamaz,
 *      kullanıcı neyin olmadığını anlamaz.
 *
 * Üçüncü yol: DOĞRUYU SÖYLEMEK. Gönderim engellenir ve donörün KENDİ
 * `.sa-flash` bileşeniyle (yeni bileşen uydurulmadı) durumun kendisi
 * yazılır. Panele giden bağ gerçek bir bağdır ve gerçekten panele gider —
 * ama "giriş yapıldı" demez.
 */
(function () {
  'use strict';

  function kur() {
    var form = document.querySelector('.fk-form');
    if (!form || form.dataset.protoBound) return;
    form.dataset.protoBound = '1';

    form.addEventListener('submit', function (olay) {
      olay.preventDefault();

      /* Aynı şerit iki kez basılmaz. */
      var eski = document.querySelector('[data-proto-serit]');
      if (eski) { eski.focus(); return; }

      var serit = document.createElement('div');
      serit.className = 'sa-flash is-error';
      serit.setAttribute('role', 'alert');
      serit.setAttribute('tabindex', '-1');
      serit.setAttribute('data-proto-serit', '1');
      serit.innerHTML =
        '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>' +
        '<span><b>Bu maket kimlik doğrulaması yapmıyor.</b> Giriş sunucu ' +
        'tarafında çalışır; burada oturum açılmadı ve hiçbir bilgi ' +
        'gönderilmedi. Panel ekranlarını görmek için ' +
        '<a href="admin-genel-bakis.html">Genel Bakış</a>\'a gidebilirsin.</span>';

      form.parentNode.insertBefore(serit, form);
      serit.focus();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', kur);
  } else {
    kur();
  }
})();
