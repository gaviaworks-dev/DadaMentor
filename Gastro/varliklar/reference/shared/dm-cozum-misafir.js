/* =====================================================================
   ÇÖZÜM MERKEZİ · MİSAFİR KAPISI
   ---------------------------------------------------------------------
   Beyar kararı (parti 2 · L3): misafir için GİRİŞ DUVARI YOK.
     · "Sıkça Sorulan Sorular" ve "Öneri ve Şikâyet" panoları AÇIK
     · "Destek Taleplerim" ve "Yeni Destek Talebi" GİRİŞTE

   🔴 YENİ MODAL İCAT EDİLMEDİ — sayfanın kendi `#lgGate` sözleşmesi
      kullanılıyor (id=lgGate + .show, [data-lg-title]/[data-lg-desc],
      #lgOverlay.show). Aynı sözleşme bugun-ne-pisirsem.js'te de yazılı.

   🔴 YAKALAMA EVRESİ: sekme rayının kendi dinleyicisi ELEMANA bağlı;
      bu dinleyici BELGEYE ve capture=true ile bağlı, bu yüzden ondan
      ÖNCE koşar ve `stopPropagation` ile sekme değişimini durdurur.
   ===================================================================== */
(function () {
  var KAPILI = ['taleplerim', 'yeni'];
  var d = document;

  function uye() { return d.body.classList.contains('is-auth'); }

  function gateAc(baslik, aciklama) {
    var g = d.getElementById('lgGate');
    if (!g) { location.href = 'g-giris.html'; return; }
    var o = d.getElementById('lgOverlay');
    var b = g.querySelector('[data-lg-title]'), a = g.querySelector('[data-lg-desc]');
    if (b) b.textContent = baslik;
    if (a) a.textContent = aciklama;
    g.classList.add('show');
    if (o) o.classList.add('show');
    d.body.style.overflow = 'hidden';
  }

  /* Misafirde H1 üyenin adını taşıyamaz; sayfanın KENDİ adı yazılır.
     Metin UYDURULMADI — kırıntının geçerli sayfa kalemi (.cur)
     zaten "Çözüm Merkezi" diyor, sayfa başlığı da öyle. */
  function baslikDuzelt() {
    var h = d.querySelector('.kimlik-bant h1');
    var cur = d.querySelector('.kimlik-bant .kirinti .cur, .kimlik-bant .pf-crumb .cur');
    if (!h || !cur) return;
    if (uye()) {
      if (h.dataset.uyeMetni) { h.textContent = h.dataset.uyeMetni; delete h.dataset.uyeMetni; }
      return;
    }
    if (h.dataset.uyeMetni) return;                 /* zaten çevrildi */
    h.dataset.uyeMetni = h.innerHTML;
    h.textContent = cur.textContent.trim();
  }

  function isaretle() {
    baslikDuzelt();
    var misafir = !uye();
    d.querySelectorAll('[data-fit-tabs="destek"] [data-tab]').forEach(function (t) {
      var k = t.getAttribute('data-tab');
      var kapili = misafir && KAPILI.indexOf(k) > -1;
      t.classList.toggle('sekme-kilitli', kapili);
      if (kapili) t.setAttribute('data-lg-gate', '');
      else t.removeAttribute('data-lg-gate');
    });
    if (!misafir) return;
    /* misafirde açık pano kapılı ise SSS'ye düş */
    var acik = d.querySelector('[data-pane]:not([hidden])');
    var k = acik && acik.getAttribute('data-pane');
    if (!k || KAPILI.indexOf(k) > -1) {
      var sss = d.querySelector('[data-fit-tabs="destek"] [data-tab="cozum"]');
      if (sss) sss.click();
    }
  }

  d.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-fit-tabs="destek"] [data-tab]');
    if (!t) return;
    if (uye()) return;
    if (KAPILI.indexOf(t.getAttribute('data-tab')) < 0) return;
    e.preventDefault();
    e.stopPropagation();
    gateAc('Destek talebi için giriş yap',
           'Destek taleplerini görmek ve yeni talep açmak için DadaGastro hesabına giriş yapman gerekiyor. Sıkça sorulan sorular ve öneri formu girişsiz açıktır.');
  }, true);

  /* 🔴 YÜKLEME SIRASINA BAĞLI OLMA — ölçülmüş kusur: bu betik
     maket-auth.js'ten ÖNCE bağlanmıştı; isaretle() gövde henüz
     is-auth almadan koştu ve ÜYEDE de kilit işareti bıraktı. Kapı
     "misafir doğru" diye yeşil basıyordu. Betik artık sırayı VARSAYMIYOR:
     gövde sınıfı değişince kendini yeniden çalıştırır. */
  new MutationObserver(isaretle).observe(d.documentElement, {
    attributes: true, attributeFilter: ['class'], subtree: true });
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', isaretle);
  else isaretle();
  addEventListener('load', isaretle);
})();
