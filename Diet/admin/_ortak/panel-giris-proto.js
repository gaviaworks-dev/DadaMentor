/*
 * PANEL GİRİŞ — MAKET DAVRANIŞI
 *
 * 🔴 BU DOSYA DONÖRÜN DEĞİL, BİZİM. Donörde (`panel-giris.js`) yalnız şifre
 * gözü var; orada form gerçekten çalışıyor çünkü arkasında Laravel oturumu
 * duruyor. Bu ağaç statik bir maket: sunucu yok, oturum yok.
 *
 * Kapı: "Giriş Yap" panele SOKAR. Maket bir kapının işi budur; panelin
 * kendisi de maket. Yasak olan şey giriş yapılmadan "giriş yapıldı" DEMEK —
 * sahte başarı mesajı, sahte hoş geldin, sahte oturum bildirimi. Onların
 * hiçbiri basılmıyor: form gönderilmiyor, hiçbir bilgi hiçbir yere
 * gitmiyor, sayfa yalnızca panele geçiyor.
 *
 * ⚠ İLK YAZIM YANLIŞTI ve geri alındı: gönderimde "bu maket kimlik
 * doğrulaması yapmıyor" şeridi basıp kullanıcıyı kapıda tutuyordu. Doğru
 * olan cümleyi söylüyordu ama KAPIYI KİLİTLİYORDU — maket kapısının tek işi
 * panele açılmak.
 *
 * Zorunlu alan denetimi tarayıcının kendi doğrulamasıyla çalışır: `required`
 * alanlar boşken `submit` olayı hiç doğmaz, dolayısıyla boş formla panele
 * geçilmez.
 */
(function () {
  'use strict';

  function kur() {
    var form = document.querySelector('.fk-form');
    if (!form || form.dataset.protoBound) return;
    form.dataset.protoBound = '1';

    form.addEventListener('submit', function (olay) {
      olay.preventDefault();          // maket: hiçbir yere GÖNDERİLMEZ
      window.location.href = 'admin-genel-bakis.html';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', kur);
  } else {
    kur();
  }
})();
