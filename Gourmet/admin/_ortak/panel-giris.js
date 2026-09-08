/*
 * PANEL GİRİŞ KAPISI — ŞİFRE GÖZÜ
 *
 * Kaynak: https://dadagastro.com/build/assets/app-Dsop9IcY.js
 *         (ölçüm anı 2026-09-07T07:23:50Z · minify edilmiş `Xr` işlevi)
 * Donörün davranışı BİREBİR çözülüp okunur hâle getirildi; yeni bir
 * davranış eklenmedi:
 *   · `.fk-pass` kabının içindeki girdinin `type`ını çevirir
 *   · düğmenin `aria-pressed`ini yazar
 *   · ikonu `fa-eye` ↔ `fa-eye-slash` arasında değiştirir
 *   · `data-bound` ile iki kez bağlanmayı engeller (muhafız donörün kendisi
 *     de taşıyor — tuzak #1'in aynı sınıfı)
 *
 * ⚠ Düğme markup'ta VAR ve donörden geliyor; betik olmasa ölü bir düğme
 * olurdu. Ölü düğme bırakılmaz — bu dosya onun karşılığıdır.
 */
(function () {
  'use strict';

  function bagla(kok) {
    (kok || document).querySelectorAll('[data-pass-toggle]').forEach(function (dugme) {
      if (dugme.dataset.bound) return;
      dugme.dataset.bound = '1';

      dugme.addEventListener('click', function () {
        var kap = dugme.closest('.fk-pass');
        var girdi = kap && kap.querySelector('input');
        if (!girdi) return;

        var gizli = girdi.type === 'password';
        girdi.type = gizli ? 'text' : 'password';
        dugme.setAttribute('aria-pressed', String(gizli));

        var ikon = dugme.querySelector('i');
        if (ikon) ikon.className = gizli ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { bagla(document); });
  } else {
    bagla(document);
  }
})();
