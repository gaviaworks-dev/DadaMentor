// kesfet.js — kesfet-v1.html kaynak-transfer (Dalga 1 / B4).
// Kaynak: reference/gourmet-kesfet/kesfet-v1.html satır 2848-2881, BİREBİR.
// Kabuk JS'i (mentor/to-top/drawer/acct/lg-gate/header at-top) ZATEN
// resources/js/gourmet.js'te (Dalga 0, DONDU) — burada TEKRAR edilmedi.
// Bu iki blok yalnız bu sayfaya özel: hero video lazy-load + [data-bg] lazy
// arkaplan yükleme (below-fold hafiflik). Diğer chrome JS'i (nav dropdown,
// acct menu vb.) kabukta zaten var, page-local dosyada tekrar edilmedi.

/* ===== HERO VIDEO SLOT — SÖKÜLDÜ (Beyar kararı, 2026-08-12) =====
   Burada `.gm-hero-vid` için lazy bir yükleyici vardı. Yuva hiç kullanılmadı:
   `video/gourmet-hero.{webm,mp4}` dosyaları repoya HİÇ eklenmemişti (git
   geçmişi tüm dallarda boş) ve `data-ready="0"` yüzünden bu blok ilk satırda
   dönüyordu — yani tarayıcı o URL'leri hiç istemiyordu, görünen zaten
   poster'dı. Üç genişlikte ölçüldü: `gourmet-hero.*` isteği 0, 4xx/5xx 0.
   Hero artık `.gm-hero-img` div'iyle basılıyor (kesfet.css).
   Ölçüm: tasks/hat-a-hero/_HERO-VIDEO-OLCUMU.md */

/* ===== LAZY BG — [data-bg] görselleri viewport'a yaklaşınca yükle (below-fold; sayfa hafif) ===== */
(function () {
  var els = [].slice.call(document.querySelectorAll('[data-bg]'));
  if (!els.length) return;
  function load(el) { var u = el.getAttribute('data-bg'); if (!u) return; el.style.backgroundImage = "url('" + u + "')"; el.removeAttribute('data-bg'); }
  if (!('IntersectionObserver' in window)) { els.forEach(load); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { load(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '300px 0px' });
  els.forEach(function (el) { io.observe(el); });
})();

/* ===== RAY NAVİGASYONU — RV4 A1/A2/A3/A5 (konsept şeridi / modül kartları /
   yaklaşan etkinlikler / gurme lezzetler önizlemesi) — portal.js catTrack
   prev/next bloğu (satır 102-109) BİREBİR, dört ray için genelleştirildi.
   Ray'ın kendisi native overflow-x:auto olduğu için dokunmatik kaydırma ve
   klavye/focus erişimi (Tab ile focus edilen kart tarayıcı tarafından
   otomatik view'a getirilir) ekstra kod GEREKTİRMEZ — burada yalnız ok
   butonları bağlanır. ===== */
(function () {
  function wireTrackNav(trackId, prevId, nextId, step) {
    var track = document.getElementById(trackId);
    if (!track) return;
    var prev = document.getElementById(prevId);
    var next = document.getElementById(nextId);
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step, behavior: 'smooth' }); });
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step, behavior: 'smooth' }); });
  }
  wireTrackNav('conceptTrack', 'conceptPrev', 'conceptNext', 500);
  wireTrackNav('gmModTrack', 'modPrev', 'modNext', 460);
  // C (2026-08-11) — mekânlar preview rayı; komşularıyla AYNI kanca, adım
  // etkinlik rayıyla aynı (400) çünkü kart genişliği de aynı (.disc-card
  // flex:0 0 min(380px,84vw)). `wireTrackNav` yokluk-güvenli: bölüm veri
  // olmadığında hiç basılmaz, kanca sessizce atlanır.
  wireTrackNav('vnTrack', 'vnPrev', 'vnNext', 400);
  wireTrackNav('evTrack', 'evPrev', 'evNext', 400);
  wireTrackNav('glTrack', 'glPrev', 'glNext', 380);
})();
