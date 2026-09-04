/* =====================================================================
   KARŞILAŞTIRMA TEPSİSİ (tray) — mekan-liste kartındaki "Karşılaştır"
   düğmesine (`[data-compare-add]`, A2'nin markup'u) DELEGE dinleyici bağlar
   + sayfa geçişi yapmadan (AJAX) çalışan yüzen bir seçim çubuğu kurar.

   Neden `<script defer>` ŞART: kabuğun toast'ı (`#keToast`,
   partials/gourmet/toast.blade.php) `@yield('content')`'ten SONRA basılıyor
   (00-ortak.md tuzağı — bu script @section('content') içine defer'siz
   eklenirse getElementById('keToast') null döner, dinleyici HİÇ bağlanmaz,
   konsol hatası VERMEZ — sessiz ölüm).

   Neden özel bir "gate" JS'i YOK: misafir → route zaten `auth` middleware
   arkasında (routes/gourmet.php); bu script Accept/X-Requested-With
   BAŞLIKLARI GÖNDERMEZ ki misafir isteği sunucudan düz 302 (giriş sayfasına)
   dönsün — fetch bunu otomatik TAKİP EDER, `res.redirected` ile yakalanıp
   gerçek bir sayfa geçişine çevrilir ("form POST → login" kanonu, JS modal
   gate'i DEĞİL — portal.js capture-stopPropagation tuzağı burada hiç devreye
   girmez çünkü login kararını sunucu veriyor, istemci JS'i değil).

   Pro kapısı YENİDEN İCAT EDİLMEDİ: mekan-liste.js'in mevcut delege
   dinleyicisi (`[data-pro-gate]`, satır 94-99, #proGate modalını açar)
   programatik olarak TETİKLENİYOR — görünmez bir eleman oluşturup click()
   ile; modal DOM'u zaten index.blade.php'de dahil.
   ===================================================================== */
(function () {
  var csrf = document.querySelector('meta[name="csrf-token"]');
  if (!csrf) return; // kabuk yoksa (beklenmeyen sayfa) sessizce çık

  var CSRF_TOKEN = csrf.getAttribute('content');
  var ADD_URL = '/karsilastir/ekle';
  var REMOVE_URL = '/karsilastir/cikar';
  var STATUS_URL = '/karsilastir';

  function toast(message) {
    var el = document.getElementById('keToast'), msgEl = document.getElementById('keToastMsg');
    if (!el) return;
    if (msgEl) msgEl.textContent = message;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 3600);
  }

  /** #proGate modalını A2'nin KENDİ delege dinleyicisi üzerinden açar — yeni bir açma/kapama mantığı YAZILMADI. */
  function openProGate(title, desc) {
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.setAttribute('data-pro-gate', '');
    trigger.setAttribute('data-pro-title', title || '');
    trigger.setAttribute('data-pro-desc', desc || '');
    trigger.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(trigger);
    trigger.click();
    document.body.removeChild(trigger);
  }

  function post(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': CSRF_TOKEN, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body,
    }).then(function (res) {
      if (res.redirected) { window.location.href = res.url; return null; }
      return res.ok ? res.json() : null;
    });
  }

  // ---- Yüzen tepsi — tek seferlik enjeksiyon (stil dahil, sayfa CSS'ine bağımlı değil) ----
  var tray = null;

  function ensureTray() {
    if (tray) return tray;

    var style = document.createElement('style');
    style.textContent =
      // RV4 I1/I2 (lead düzeltmesi, 2026-07-29 — projenin EV STANDARDI:
      // .actbar/.evd-actbar/.vd-actbar dört detay sayfasında birebir aynı
      // kalıp, puf-noktasi-detay.css:396 + gurme-lezzetler.css:1023 +
      // etkinlik-detay.css:197-206 + mekan-detay.css:778-779). Yeni bir
      // sayı/yarıçap İCAT EDİLMEDİ — bu kalıp aynen kopyalandı:
      // bottom:22px · z-index:88 · border-radius:var(--radius-lg) (--radius-
      // pill tokens.css:67'de "YENİ pill YASAK" şerhli, kullanılmadı).
      // F2/W2.3 (2026-08-21, ölçüldü) — `bottom`a kabuğun KENDİ `--bc-lift`i
      // eklendi (public/reference/shared/bottom-clearance.{js,css}). Ölçüm:
      // çerez bandı (`#cookieBanner`, z 95, `data-bc-bar` ZATEN taşıyor)
      // tepsiyi (z 88) 390 ve 1440'ta 25/25 noktada TAMAMEN örtüyordu; bant
      // gizlenince 0/25. z değeri DEĞİŞTİRİLMEDİ — kabuğun kurulu
      // yerleştirme deseni kullanıldı, boşluk `--sp-3` (12px) yerleştiricinin
      // kendi tokenı. Yeni sayı icat edilmedi: 22px ve 78px aynen duruyor.
      '.cmp-tray{position:fixed;left:50%;bottom:calc(22px + var(--bc-lift, 0px));transform:translateX(-50%);z-index:88;display:none;' +
      'align-items:center;gap:10px;background:var(--paper,#fff);border:1px solid var(--line,#ECECEC);' +
      'border-radius:var(--radius-lg,16px);box-shadow:var(--sh-lg,0 18px 50px rgba(33,30,22,.16));' +
      'padding:8px 8px 8px 14px;max-width:min(560px,92vw);white-space:nowrap}' +
      '.cmp-tray.show{display:flex}' +
      // Mobil offset (calc(78px+safe-area)) + left/right 12px de AYNI dört
      // sayfanın KENDİ mobil kuralı (puf-noktasi-detay.css:463 +
      // gurme-lezzetler.css:1034 + etkinlik-detay.css:236-240) — tepsi tam
      // genişlik bandına iniyor, ortalama transform'u iptal ediliyor.
      '@media (max-width:640px){.cmp-tray{left:12px;right:12px;bottom:calc(78px + env(safe-area-inset-bottom,0px) + var(--bc-lift, 0px));transform:none;max-width:none}}' +
      // Alt gezinme şeridini tepsi görünürken ÇEKME deseni de aynı dört
      // sayfadan (etkinlik-detay.css:227-228, body:has(.evd-actbar.show)
      // .bottom-nav{display:none}) BİREBİR — yeni bir "üstünde dur" offset'i
      // hesaplanmadı, kurulu :has() deseni tekrarlandı.
      'body:has(.cmp-tray.show) .bottom-nav{display:none}' +
      // Toast (#keToast, kabuğun DONMUŞ gourmet.css:966, bottom:28px) tepsi
      // görünürken onun ÜSTÜNE çıkar — dört sayfadaki emsalde bu ihtiyaç
      // yok (onlarda ayrı bir toast çakışması ölçülmemiş), bu yüzden değer
      // ölçülerek bulundu (bkz. docs/screenshots/rv4-tarih-i1-* ekran
      // görüntüleri) — aynı :has() deseniyle, ayrı bir body sınıfı/JS
      // toggle YOK.
      // KARAR 23 (2026-08-21) — TOAST OFFSET KURALLARI KALDIRILDI.
      // Burada `body:has(.cmp-tray.show) .ke-toast{bottom:92px|148px}` iki kuralı
      // ve bunları tazeleyen `MutationObserver` aynalayıcısı vardı. İkisi de
      // artık gereksiz: toast `data-bc-clear`, tepsi `data-bc-bar` taşıyor ve
      // yerleştirici toastu tepsinin üstüne KENDİ koyuyor — tepsiye özel
      // sabit sayı da, aynalama da yok.
      
      // "Karşılaştır (n)" butonu SARMASIN diye nowrap — sarınca 2 satıra
      // uzayıp tepsiyi 90px'e şişiriyordu (390'da ölçüldü, ekran görüntüsüyle
      // yakalandı). Dar viewport'ta sayaç metni (buton zaten sayıyı taşıyor,
      // fazlalık) gizlenir, alan butona kalır.
      // `.btn-sm` kabuğun/mekan-liste'nin CSS'inde TANIMLI DEĞİL (yalnız
      // mekan-detay.css'te var) — ona güvenmek yerine kompakt boyutu kendi
      // enjekte ettiğimiz kuralda EXPLICIT veriyoruz (ölçülerek bulundu: base
      // .btn'nin 14px/26px dolgusuyla buton 50-73px'e şişip 2 satıra sarıyordu).
      '.cmp-tray .btn{white-space:nowrap;flex:none;padding:9px 16px;font-size:13px}' +
      '@media (max-width:480px){.cmp-tray-count{display:none}}' +
      '.cmp-tray-figs{display:flex;flex:none}' +
      '.cmp-tray-fig{width:32px;height:32px;border-radius:50%;background-size:cover;background-position:center;' +
      'background-color:var(--cream,#EFE5D3);border:2px solid var(--paper,#fff);margin-left:-10px}' +
      '.cmp-tray-fig:first-child{margin-left:0}' +
      '.cmp-tray-count{font-size:12.5px;font-weight:700;color:var(--slate,#211E16);white-space:nowrap}' +
      '.cmp-tray-clear{border:none;background:none;color:var(--muted,#7E7E7E);font-size:11px;cursor:pointer;padding:4px}' +
      '.cmp-tray-clear:hover{color:var(--tomato,#742982)}' +
      '.mkl-act-ico[data-compare-add].is-added{color:var(--tomato,#742982);border-color:var(--tomato,#742982)}';
    document.head.appendChild(style);

    tray = document.createElement('div');
    tray.className = 'cmp-tray';
    // F2/W2.3 — yerleştiriciye kaydol: `.to-top`/`.yg-fab` ile AYNI sözleşme
    // (bottom-clearance.js), tepsi engelleri (çerez bandı, aksiyon çubuğu)
    // `--sp-3` boşluk bırakarak aşar.
    tray.setAttribute('data-bc-clear', '');
    // KARAR 23 (2026-08-21) — tepsi ENGEL de: `#keToast` artık sözleşmenin tam
    // katılımcısı (`data-bc-clear`) ve tepsiyi ancak o `data-bc-bar` taşırsa
    // aşabilir. `.to-top` emsali birebir: bir öge hem engel hem kaçan olabilir,
    // iki aşamalı yerleştirici bunu zaten çözüyor (bottom-clearance.js apply()).
    tray.setAttribute('data-bc-bar', '');
    tray.innerHTML =
      '<span class="cmp-tray-figs"></span>' +
      '<span class="cmp-tray-count"></span>' +
      '<a class="btn btn-sm btn-primary" href="' + STATUS_URL + '"></a>' +
      '<button type="button" class="cmp-tray-clear" aria-label="' + 'Karşılaştırmayı temizle' + '">' +
      '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
    document.body.appendChild(tray);

    // F2/W2.4 (2026-08-21, ölçüldü) — `Escape` tepsiyi üç genişlikte de
    // KAPATMIYORDU (klavye yolu hiç yoktu). Kabuğun kendi deseni: document
    // seviyesinde, açıkken guard'lı. Tepsi bir seçim durumu taşıdığı için
    // Escape onu SİLMEZ, yalnız mevcut "temizle" düğmesinin yolunu tetikler.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !tray.classList.contains('show')) return;
      tray.querySelector('.cmp-tray-clear').click();
    });

    tray.querySelector('.cmp-tray-clear').addEventListener('click', function () {
      post('/karsilastir/temizle', '').then(function (data) {
        if (data) render(data.items);
        document.querySelectorAll('[data-compare-add].is-added').forEach(function (b) { b.classList.remove('is-added'); });
      });
    });

    return tray;
  }

  function compareHref() {
    var params = new URLSearchParams(window.location.search);
    var qs = [];
    if (params.get('lat')) qs.push('lat=' + encodeURIComponent(params.get('lat')));
    if (params.get('lng')) qs.push('lng=' + encodeURIComponent(params.get('lng')));
    return STATUS_URL + (qs.length ? '?' + qs.join('&') : '');
  }

  /** @param {Array<{id:number,name:string,cover:?string}>} items */
  function render(items) {
    var el = ensureTray();
    if (!items || items.length === 0) {
      el.classList.remove('show'); // I1 — :has(.cmp-tray.show) kuralları da otomatik geri düşer, ayrı bir JS toggle gerekmez
      window.dispatchEvent(new Event('resize'));
      return;
    }
    var figs = el.querySelector('.cmp-tray-figs');
    figs.innerHTML = '';
    items.forEach(function (item) {
      var fig = document.createElement('span');
      fig.className = 'cmp-tray-fig';
      if (item.cover) fig.style.backgroundImage = "url('" + item.cover + "')";
      figs.appendChild(fig);
    });
    el.querySelector('.cmp-tray-count').textContent = items.length + ' mekân seçildi';
    var link = el.querySelector('.btn');
    link.textContent = 'Karşılaştır (' + items.length + ')';
    link.setAttribute('href', compareHref());
    el.classList.add('show'); // I1 — :has(.cmp-tray.show) kabuğun toast/bottom-nav kurallarını otomatik tetikler
    // F2/W2.3 — tepsi bottom-clearance.js'in init()'inden SONRA doğuyor;
    // yerleştirici zaten `resize`/`scroll`ta yeniden hesaplıyor, mevcut
    // zamanlayıcısı bir `resize` ile dürtülür (yeni API eklenmedi).
    window.dispatchEvent(new Event('resize'));

    // Kartlardaki eklenmiş mekânların düğmesini işaretle (sayfa değişmeden geri döndüğünde de tutarlı).
    var addedIds = items.map(function (i) { return String(i.id); });
    document.querySelectorAll('[data-compare-add]').forEach(function (btn) {
      btn.classList.toggle('is-added', addedIds.indexOf(btn.getAttribute('data-compare-add')) !== -1);
    });
  }

  // ---- Kart butonuna delege dinleyici (bubble faz — portal.js'in [data-lg-gate]
  // capture dinleyicisi bu attribute'e HİÇ bakmıyor, çakışma yok). ----
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-compare-add]');
    if (!btn) return;
    e.preventDefault();

    var id = btn.getAttribute('data-compare-add');
    var name = btn.getAttribute('data-compare-name') || '';

    post(ADD_URL, 'venue_id=' + encodeURIComponent(id)).then(function (data) {
      if (!data) return;

      if (data.pro_gate) {
        openProGate(data.title, data.desc);
        return;
      }

      if (data.limit_reached) {
        toast(data.message);
        render(data.items);
        return;
      }

      render(data.items);
      toast(name ? name + ' karşılaştırmaya eklendi.' : 'Karşılaştırmaya eklendi.');
    });
  });

  // ---- Sayfa yüklendiğinde mevcut seçim durumunu geri getir (yalnız giriş
  // yapmış kullanıcı — misafirin karşılaştırma seçimi olamaz, gereksiz istek
  // atılmaz: body.is-auth kabuğun kendi işareti, layouts/gourmet.blade.php). ----
  if (document.body.classList.contains('is-auth')) {
    fetch(STATUS_URL, { headers: { 'X-Compare-Ajax': '1' } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { if (data) render(data.items); })
      .catch(function () { /* sessiz — tepsi boş görünür, kart butonu yine çalışır */ });
  }
})();
