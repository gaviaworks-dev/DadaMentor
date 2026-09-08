/* ═══════════════════════════════════════════════════════════════════════
   T5B · GOURMET — KULVAR D SÜRÜCÜSÜ. Yalnız ajan D yazar.

   🔴 KAPSAM: bu dosya 148 Gourmet sayfasına bağlı. Her blok kendi
      ÖZNESİNİ arar ve bulamazsa hiç dinleyici bağlamaz — kardeş
      kulvarların ekranlarında sıfır etki.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var d = document;
  var qa = function (s, k) { return [].slice.call((k || d).querySelectorAll(s)); };

  /* ── 1 · ROZET İPUCU · DOKUNMATİKTE TEK DOKUNUŞ ────────────────────
     DONÖR: `Diet/d-rozetlerim.html` sayfa içi 4. betik — BİREBİR taşındı.
     Diet'in kendi şerhi: balon masaüstünde `:hover`/`:focus-within` ile
     açılıyor; dokunmatikte hover yok, kart bir <button> ve tek dokunuşla
     açılıp kapanıyor. Kaynağın kipi `.badge-card.tip-open`, kanon
     karşılığı `.ipucu-acik`. Diet gibi DİĞERLERİNİ KAPATMIYOR —
     akordeonun "tek açık kalem" kuralı balonlara yazılmadı, kip farklı.

     Gourmet'te ölçülen kusur (2026-09-08): 50 `.rozet-karti` gerçek
     <button>, `data-rozet` 50 geçiş, JS referansı 0 → 12/12 ölü düğme.
     Yeni davranış YAZILMADI; Diet'in delegasyonu olduğu gibi alındı.
     🔴 Delegasyon `document`te: donör de öyle. Kartın kendisine bağlansa
        50 dinleyici olurdu ve kip donörden ayrışırdı.                 */
  if (d.querySelector('.rozet-karti')) {
    d.addEventListener('click', function (e) {
      var k = e.target.closest && e.target.closest('.rozet-karti');
      if (k) k.classList.toggle('ipucu-acik');
    });
  }

  /* ── 2 · MADDE 14 · AÇILIR SÜZGEÇ (`go-kesif-tercihlerim`) ─────────
     Uzun çip listesi olan iki panoya (`mekan` 28 · `sehir` 20) kanon
     `.alan-secim` bileşeni. Süzgeç bir GÖRÜNÜM işlemidir: seçimi
     BOZMAZ — gizlenen çipin `aria-pressed` durumu korunur, seçili
     sayacı (`[data-alan-rozet]`, dm-profil'in sürücüsü) değişmez.
     Bu yüzden iki ayrı sayaç var ve ikisi ayrı şey sayar:
       `[data-alan-rozet]`   → SEÇİLİ kaç çip (dm-profil.js)
       `[data-suzgec-sayac]` → LİSTEDE GÖRÜNEN kaç çip (bu blok)      */
  qa('select[data-cip-suzgec]').forEach(function (sec) {
    var kart = sec.closest('[data-alan-kart]'); if (!kart) return;
    var grup = kart.querySelector('.cipler'); if (!grup) return;
    var cipler = qa('.cip', grup);
    var sayac = kart.querySelector('[data-suzgec-sayac]');

    function suz() {
      var g = sec.value, gorunen = 0;
      cipler.forEach(function (c) {
        /* 🔴 üçüncü argüman ASLA undefined olmayacak — `toggle(ad, undefined)`
           takas eder ve her çip aktif kalır (kayıtlı ders). Burada
           `hidden` bir ÖZNİTELİK, boolean atanıyor: takas riski yok. */
        var gizle = !!g && c.getAttribute('data-grup') !== g;
        c.hidden = gizle;
        if (!gizle) gorunen++;
      });
      if (sayac) sayac.textContent = gorunen + ' / ' + cipler.length;
    }
    sec.addEventListener('change', suz);
    /* sıfırlama: donörün KENDİ temizle düğmesi süzgeci de açar */
    var tmz = kart.querySelector('[data-alan-temizle]');
    if (tmz) tmz.addEventListener('click', function () { sec.value = ''; suz(); });
    suz();
  });

  /* ── 3 · MADDE 14 · ARALIK KAYDIRICISI (`kt-fiyat`) ────────────────
     "Fiyat Aralığım" panosu sıralı üç kademe (₺ · ₺₺ · ₺₺₺) ve
     `data-tip="tek"`. Kaydırıcı ile çipler İKİ YÖNLÜ eşlenir.

     🔴 SEÇİM MANTIĞI YENİDEN YAZILMADI: kaydırıcı çipi `click()` eder,
     seçimi ve seçili sayacını dm-profil.js'in kendi `ozet()`i günceller.
     "Seçim yok" (0) konumunda da kartın KENDİ temizle düğmesi tıklanır —
     çipi elle temizleyip sayacı ayrıca yazmak, donörün sözleşmesini
     ikinci kez uygulamak olurdu ve ayrışırdı.                          */
  qa('input[data-cip-aralik]').forEach(function (ar) {
    var kart = ar.closest('[data-alan-kart]'); if (!kart) return;
    var grup = kart.querySelector('.cipler'); if (!grup) return;
    var cipler = qa('.cip', grup);
    var etiket = kart.querySelector('[data-aralik-etiket]');
    var tmz = kart.querySelector('[data-alan-temizle]');
    var kilit = false;                       /* iki yönlü eşlemede tur koruması */

    function ad(i) {
      return i > 0 && cipler[i - 1]
        ? (cipler[i - 1].getAttribute('data-val') || cipler[i - 1].textContent).trim()
        : 'Seçim yok';
    }
    function yaz(i) {
      var m = ad(i);
      if (etiket) etiket.textContent = m;
      ar.setAttribute('aria-valuetext', m);
    }

    ar.addEventListener('input', function () {
      if (kilit) return;
      var i = parseInt(ar.value, 10) || 0;
      kilit = true;
      if (i > 0 && cipler[i - 1]) cipler[i - 1].click();
      else if (tmz) tmz.click();
      kilit = false;
      yaz(i);
    });

    /* çip → kaydırıcı (olay YAYMADAN; `input` tetiklenseydi tur olurdu) */
    cipler.forEach(function (c, j) {
      c.addEventListener('click', function () {
        if (kilit) return;
        var i = c.getAttribute('aria-pressed') === 'true' ? j + 1 : 0;
        ar.value = String(i); yaz(i);
      });
    });
    if (tmz) tmz.addEventListener('click', function () {
      if (kilit) return;
      ar.value = '0'; yaz(0);
    });

    /* açılış hâli — sayfa yüklendiğinde seçili çip varsa ona hizala */
    var s = cipler.findIndex ? cipler.findIndex(function (c) {
      return c.getAttribute('aria-pressed') === 'true';
    }) : -1;
    ar.value = String(s + 1); yaz(s + 1);
  });
})();
