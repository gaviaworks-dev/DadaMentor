/* T5D · GOURMET — kulvar E sürücüsü. Yalnız ajan E yazar.

   MADDE 2 · "Profil alt sekmeleri kanona uymuyor, UI bozuk".

   ── E-2b · SEKME RAYINDA KLAVYE GEZİNMESİ (WAI-ARIA APG "Tabs") ────
   ÖLÇÜLDÜ — rapor/gourmet-t5d/e-2-davranis-once-1440.json / -390.json
   (10 Gourmet + 12 Fit profil sayfası, `?auth=1`, geçişler kapalı):

     Sekme markup'ı ARIA sekme sözleşmesini İLAN EDİYOR: `role=tablist`
     + `role=tab` + `aria-selected` + GEZİCİ `tabindex` (yalnız aktif
     kalem 0, ötekiler -1). Ölçüm: her sayfada `odaklanabilir = 1`.
     Gezici tabindex'in bedeli budur — Tab tuşuyla şeride tek kalem
     girer, ötekilere YALNIZ ok tuşlarıyla ulaşılır. O hâlde ok tuşu
     sürücüsü sözleşmenin parçasıdır, süs değil.

     Gourmet'te sürücü 10 profil sayfasının YALNIZ 5'inde var:
       ✓ ok/Home/End çalışıyor : go-mekanlarim · go-etkinliklerim ·
         go-listelerim · go-kesif-tercihlerim · go-isletmelerim
         (bunlar `dm-profil.js`i yükleyen 5 sayfa)
       ✗ ok/Home/End ÖLÜ       : go-hesabim · go-odemelerim ·
         go-paketlerim · go-rozetlerim · go-cozum-merkezi
         (ok tuşu yalnız kabı yatay kaydırıyor: sl 0→40→80;
          `aria-selected` ilk kalemde donuyor)
     Yani go-hesabim'da 7 sekmenin 6'sına klavyeyle HİÇ erişilemiyor.

     Kök: bu 5 sayfa kanon-kitini SAYFA İÇİ betikte taşıyor ve o kopyada
     kitin §1'i (tıklama + hash + aktif kalemi raya çekme) VAR, §2'si
     (klavye) YOK. `ArrowRight` dizesi ağaçtaki hiçbir .html'de geçmiyor;
     yalnız `dm-profil.js`te var. "Markup taşındı, davranış kalmadı".

   ⚠ Donör Fit'te ok tuşları 12 profil sayfasının HİÇBİRİNDE çalışmıyor.
     Yani bu düzeltme donörden bir SAPMA üretir — ama Gourmet'in kendi
     içindeki tutarsızlığı kapatır ve düzeltilen davranış Gourmet'in
     çalışan 5 sayfasındaki `dm-profil.js` §2 ile BİREBİR aynıdır
     (yeniden yazılmadı, oradan alındı). Raporda böyle bildirildi.

   ÇİFT BAĞLANMA KORUMASI — iki katmanlı:
     1) `dm-profil.js` betiği sayfada varsa hiç bağlanmam. (O dosya
        `defer` DEĞİL, bu dosya `defer`; yani o HER ZAMAN önce koşar.)
     2) Yine de `e.defaultPrevented` bekçisi var: başka bir sürücü
        olayı işlediyse çekilirim. İkisi olmadan iki sürücü arka arkaya
        koşar ve ok tuşu İKİ kalem birden atlar.
   Nüfus seçicisi kitin bayrağına değil, markup'ın kendi sözleşmesine
   bakar: `[role=tablist].sekmeler` + en az 2 doğrudan `[role=tab]`. */
(function () {
  'use strict';
  if (window.__t5dE) return;           /* idempotan: iki kez bağlanmaz */
  window.__t5dE = 1;
  var d = document;

  if (d.querySelector('script[src*="dm-profil.js"]')) return;

  Array.prototype.forEach.call(d.querySelectorAll('[role="tablist"].sekmeler'), function (ray) {
    var kalem = ray.querySelectorAll(':scope > [role="tab"]');
    if (kalem.length < 2) return;
    ray.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      var t = Array.prototype.slice.call(ray.querySelectorAll(':scope > [role="tab"]'));
      var i = t.indexOf(d.activeElement); if (i < 0) return;
      var j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % t.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + t.length) % t.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = t.length - 1;
      else return;
      e.preventDefault();
      t[j].click();   /* seçimi/gezici tabindex'i/panoyu sayfanın KENDİ
                         kanon-kiti kurar — burada yeniden yazılmaz */
      t[j].focus();
    });
  });
})();
