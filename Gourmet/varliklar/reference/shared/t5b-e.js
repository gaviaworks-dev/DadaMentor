/* T5B · GOURMET — kulvar E sürücüsü. Yalnız ajan E yazar.
   TEK İŞ: mekanlar.html'e bu turda basılan mekân kartlarındaki "Kaydet"
   düğmesini GERÇEKTEN çalıştırmak. Kartın markup'ı donörün kalıbı, ama
   donörde düğme bir <form method=POST> içinde sunucuya gidiyordu; makette
   backend yok, o yüzden düğme `type=button` ve durumu ekranda tutuyor.
   ⚠ Bağlanmamış düğme = YALAN DÜĞME. Ölçüt: tıklayınca DOM değişecek.
   ⚠ `classList.toggle(ad, undefined)` tuzağı: ikinci argüman HER ZAMAN
     boolean — yoksa her tıklama takas eder ve ölçüt yine yeşil basar.     */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-t5be-kaydet]') : null;
    if (!b) return;
    e.preventDefault();
    var on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.classList.toggle('saved', on === true);
    b.setAttribute('aria-label', on ? 'Kaydedildi' : 'Kaydet');
    b.setAttribute('title', on ? 'Kaydedildi' : 'Kaydet');
    var i = b.querySelector('i');
    if (i) i.className = (on ? 'fa-solid' : 'fa-regular') + ' fa-heart';
  });
})();
