/* =====================================================================
   T4 · DIET PUBLIC REVİZE — KULVAR D · JS
   Bu dosyanın İÇİNİ yalnız ajan D yazar. Bağını LEAD attı (L0).
   YALNIZ ajan D'nin on iki sayfasında yüklü (ölçüldü: `grep -l` → 12).

   TEK İŞ: `?tab=` GERİ UYUMU (diyetisyen public profili).
   Madde 8'de bu sayfaların sekme sürücüsü kullanıcı profiliyle aynı
   dosyaya (`diet-profil.js`) devredildi. Kanon sürücüsü derin bağlantıyı
   `#hash` ile çözer; sayfanın SÖKÜLEN eski sürücüsü ise `?tab=` sorgu
   parametresini okuyordu ve pano adları da değişti
   (`hizmetler`→`hizmet`, `yorumlar`→`yorum`).

   ⚠ ÖLÇÜLDÜ: ağaçta `diyetisyen__*.html?tab=` biçiminde GELEN BAĞ YOK
     (`grep -oh 'href="diyetisyen__[^"]*"' *.html | grep tab=` → 0).
     Yani bu köprü bilinen bir kırığı onarmıyor; dışarıda kalmış /
     yer imine alınmış bağlar sessizce yanlış panoya düşmesin diye var.
     Bulunmayan ada tepki VERMEZ — uydurma bir pano açmaz.

   ⚠ SIRA: `diet-profil.js` `defer` ile yükleniyor, bu dosya ise gövde
     sonunda düz `<script>`. Düz betik AYRIŞTIRMA sırasında, `defer`
     olan ondan SONRA koşar. Bu yüzden köprü DOMContentLoaded'ı bekler;
     beklemezse sürücü henüz bağlanmamış olur ve tıklama hiçbir şey
     yapmaz — konsola da bir şey basmadan.
   ⚠ `el.click()` burada bir click işleyicisinin İÇİNDEN çağrılmıyor;
     olsaydı tarayıcı "click in progress" diyip sessizce yutardı.
   ===================================================================== */
(function () {
  'use strict';

  /* Eski pano adı → kanon pano adı. Kanon adları da kabul edilir. */
  var ESKI = { hakkinda:'hakkinda', hizmetler:'hizmet', yorumlar:'yorum',
               profil:'profil', hizmet:'hizmet', yorum:'yorum', icerik:'icerik' };

  function kopru() {
    var ray = document.querySelector('nav[data-sekme-grup="dp"]');
    if (!ray) return;                       // bu sayfa diyetisyen profili değil
    var q;
    try { q = new URLSearchParams(location.search).get('tab'); } catch (_) { return; }
    if (!q) return;
    var ad = ESKI[q];
    if (!ad) return;                        // tanınmayan ad → hiçbir şey yapma
    var d = ray.querySelector('.sekme[data-tab="' + ad + '"]');
    /* Zaten açık sekmeye tıklamak gereksiz iş; `aria-selected` sorulur. */
    if (d && d.getAttribute('aria-selected') !== 'true') d.click();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', kopru);
  } else {
    kopru();
  }
})();
