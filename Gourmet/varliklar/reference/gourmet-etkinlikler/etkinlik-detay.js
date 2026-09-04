/* Etkinlik Detay — sayfa-yerel JS (public/reference/gourmet-etkinlikler/).
 * Backend yok: tüm aksiyonlar ya gerçek istemci-taraflı iş (ICS indirme,
 * Web Share API) ya da visual-only toggle (kaydet/katılacağım/katıldım —
 * persist YOK, guest-gate önce çalışır).
 */

// ---- RV3 madde 11: ALT STICKY PILL görünürlüğü — tarif-detay.js'in
// rdActbar mantığı BİREBİR: hero bandı geçilince görünür, sayfa sonuna
// yaklaşınca (footer/diğer etkinlikler bölgesinde) çekilir. ----
(function () {
  var bar = document.getElementById('evdActbar');
  if (!bar) return;
  var head = document.getElementById('evdHead');
  if (!head) return;
  function onScroll() {
    var past = head.getBoundingClientRect().bottom < 0;
    var nearEnd = (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 220;
    bar.classList.toggle('show', past && !nearEnd);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// ---- Katılacağım / Katıldım — visual-only toggle.
//
// 🔴 `[data-save-toggle]` BU SEÇİCİDEN ÇIKTI (Dalga 3, 2026-08-29). Kaydet
// artık gerçekten kaydediyor ve gerçek handler dosyanın sonundadır; ikisi
// aynı seçicide kalsaydı görsel-only olan `preventDefault` ile POST'u yutardı
// (ölçülen kusur: kalp doluyor, tabloda 0 satır).
//
// ⚠ `[data-attend-toggle]` BİLEREK BURADA KALDI: arkasında uç yok ve bu tur
// onu kurmadı. Kaydet'ten ayrı bir yetenektir; §U6 gereği kendi kaleminde
// karara sunulur, sessizce gerçekmiş gibi gösterilmez. ----
(function () {
  document.querySelectorAll('[data-attend-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      btn.classList.toggle('saved');
      var icon = btn.querySelector('i');
      if (icon) { icon.classList.toggle('fa-solid'); icon.classList.toggle('fa-regular'); }
    });
  });
})();

// ---- Takvime Ekle — GERÇEK .ics üretimi (statik demo veri zaten elde,
// harici servis/route gerekmez). Çok günlü/tarihsiz festivaller için tüm-gün
// tek günlük etkinlik olarak eklenir (docx: "tahmini saatler kesin program
// gibi gösterilmez" — .ics'te de saat UYDURULMAZ, yalnız tarih var). ----
(function () {
  var btn = document.getElementById('evdIcsBtn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var d = btn.dataset;
    function icsDate(v) { return v.replace(/-/g, ''); }
    var lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DadaGourmet//Etkinlikler//TR',
      'BEGIN:VEVENT',
      'UID:' + d.slug + '@dadagourmet',
      'DTSTAMP:' + icsDate(new Date().toISOString().slice(0, 10)) + 'T000000Z',
      'DTSTART;VALUE=DATE:' + icsDate(d.dateStart),
      'DTEND;VALUE=DATE:' + icsDate(d.dateEnd),
      'SUMMARY:' + d.name,
      'LOCATION:' + d.location,
      'END:VEVENT', 'END:VCALENDAR',
    ];
    var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = d.slug + '.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
})();

// ---- Paylaş — Web Share API varsa gerçek paylaşım, yoksa linki panoya
// kopyala (sessiz-fail yok, kısa toast). ----
(function () {
  var btn = document.getElementById('evdShareBtn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var url = btn.getAttribute('data-share-url');
    var title = btn.getAttribute('data-share-title');
    if (navigator.share) {
      navigator.share({ title: title, url: url }).catch(function () { /* kullanıcı iptal etti — sessiz */ });
      return;
    }
    navigator.clipboard.writeText(url).then(function () {
      var toast = document.getElementById('keToast'), msg = document.getElementById('keToastMsg');
      if (toast && msg) { msg.textContent = 'Bağlantı kopyalandı'; toast.classList.add('show'); setTimeout(function () { toast.classList.remove('show'); }, 2200); }
    });
  });
})();

// ---- Hatırlatma paneli aç/kapa (§10 — visual only, form yok) ----
(function () {
  var wrap = document.getElementById('evdReminder');
  if (!wrap) return;
  var toggle = document.getElementById('evdReminderToggle');
  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    wrap.classList.toggle('open');
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#evdReminder')) wrap.classList.remove('open');
  });
  var confirmBtn = document.getElementById('evdReminderConfirm');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', function () {
      wrap.classList.remove('open');
      var toast = document.getElementById('keToast'), msg = document.getElementById('keToastMsg');
      if (toast && msg) { msg.textContent = 'Hatırlatma tercihleri kaydedildi'; toast.classList.add('show'); setTimeout(function () { toast.classList.remove('show'); }, 2200); }
    });
  }
})();

// ---- Kaydet (data-save-toggle) — GERÇEK persist.
//
// 🔴 GÖRSEL-ONLY TOGGLE KALDIRILDI (Dalga 3, 2026-08-29). Eski hâli
// `e.preventDefault()` yapıp yalnız ikonu değiştiriyordu; ölçüldü
// (uçtan uca, gerçek tarayıcı): kalp doluyordu ama `saved_events` tablosunda
// **0 satır** vardı ve "Etkinlik Takvimim" boş kalıyordu. Yani düğme
// kullanıcıya yalan söylüyordu — form artık ayakta olduğu hâlde bu handler
// POST'u yutuyordu.
//
// 🔴 DESEN İCAT EDİLMEDİ — bu deponun kendi kanonik kaydet handler'ı
// (`gourmet-mekan-liste/mekan-liste.js:329-369`) birebir taşındı. Onun
// taşıdığı iki ölçülmüş ders de birlikte geldi:
//   · `{ok, data}` İKİLİSİ ZORUNLU: `res.ok` false iken (ör. doğrulanmamış
//     e-postada 403) `null` dönmek Kaydet'i SESSİZCE yutuyordu (T9, 2026-08-08).
//   · DOCUMENT SEVİYESİNDE DELEGE: kart ızgarası görünüm swap'inde yeniden
//     basılıyor; tek tek bağlanan dinleyiciler taze kartlarda yok olurdu.
// ----
(function () {
  function csrfToken() {
    var m = document.querySelector('meta[name="csrf-token"]');
    return m ? m.getAttribute('content') : '';
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-save-toggle]');
    if (!btn || !document.body.classList.contains('is-auth') || btn.disabled) return;
    var form = btn.closest('form');
    var action = form ? form.getAttribute('action') : null;
    if (!action) return;
    e.preventDefault();
    btn.disabled = true;
    fetch(action, {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': csrfToken(), Accept: 'application/json' },
    })
      .then(function (res) {
        return res.json().catch(function () { return null; }).then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          window.alert((result.data && result.data.message) || 'İşlem tamamlanamadı. Sayfayı yenileyip tekrar dene.');
          return;
        }
        var data = result.data;
        if (!data) return;
        var active = !!data.active;
        btn.classList.toggle('saved', active);
        var icon = btn.querySelector('i');
        if (icon) { icon.classList.toggle('fa-solid', active); icon.classList.toggle('fa-regular', !active); }
      })
      .catch(function () { /* mevcut state korunur — kullanıcı tekrar dener */ })
      .finally(function () { btn.disabled = false; });
  });
})();
