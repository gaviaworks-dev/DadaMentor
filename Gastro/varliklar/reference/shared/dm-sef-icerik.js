/* =====================================================================
   ŞEF PANELİM · ABONELERE ÖZEL İÇERİK ANAHTARI
   ---------------------------------------------------------------------
   PDF `Profil- detayları.pdf §1.4` sayfa içi işlem: "İçeriği ücretsiz
   veya abonelere özel yapma". Anahtar zaten vardı; SAYACI ve SONUÇ
   SATIRI ölüydü (ölçüldü: açık 3 → 2 olurken hap "38 / 162 kilitli"de
   donuyor, #spIcerikSonuc boş).

   🔴 DEĞER UYDURULMADI: toplam ve başlangıç kilitli sayısı hapın KENDİ
      metninden ayrıştırılıyor; delta kullanıcının kendi tıklamasından.
   ===================================================================== */
(function () {
  var hap = document.getElementById('spIcerikSay');
  var sonuc = document.getElementById('spIcerikSonuc');
  var pano = document.querySelector('[data-pane="icerikler"]');
  if (!hap || !pano) return;

  var m = (hap.textContent || '').match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return;
  var kilitli = parseInt(m[1], 10), toplam = parseInt(m[2], 10);

  /* listede GÖRÜNEN satırlar toplamın bir örneği; kilitli sayısı
     görünen anahtarların değişimiyle birlikte hareket eder */
  function yaz(ad, ozel) {
    hap.textContent = kilitli + ' / ' + toplam + ' kilitli';
    hap.classList.toggle('kapali', kilitli > 0);
    if (!sonuc) return;
    var t = sonuc.querySelector('.od-sonuc-txt');
    if (t) t.textContent = ad
      ? (ozel ? '“' + ad + '” artık yalnız abonelerin görebileceği içerik.'
              : '“' + ad + '” artık herkese açık.')
      : '';
  }

  pano.addEventListener('change', function (e) {
    var g = e.target;
    if (!g.matches || !g.matches('.anahtar input[type="checkbox"]')) return;
    var satir = g.closest('.ayar-satir');
    var ad = satir ? (satir.querySelector('.as-metin b') || {}).textContent : '';
    kilitli += g.checked ? 1 : -1;
    if (kilitli < 0) kilitli = 0;
    if (kilitli > toplam) kilitli = toplam;
    yaz((ad || '').trim(), g.checked);
  });
})();
