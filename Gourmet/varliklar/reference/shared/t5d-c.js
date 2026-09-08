/* T5D · GOURMET — kulvar C sürücüsü. Yalnız ajan C yazar.
   =====================================================================
   MADDE 1 · KONUM POP-UP'I HER ZİYARETTE ÇIKIYOR — BİR KEZ CEVAPLANINCA
              BİR DAHA ÇIKMAMALI
   ---------------------------------------------------------------------
   ÖLÇÜLEN DAVRANIŞ (rapor/gourmet-t5d/c-m1-once.json · gerçek tıklama,
   1440 ve 390, çerez bandı gerçekten kapatılarak):
     (a) ilk ziyaret → bant kapanınca modal açılır            ✓ zaten doğru
     (b) «Atla» → modal kapanır                               ✓ zaten doğru
     (c) aynı sekmede başka sayfa → modal YİNE AÇILIYOR       ✗
     (d) sayfa yeniden yüklenir → modal YİNE AÇILIYOR         ✗
     (e) depo temizlenince yeniden açılır                     ✓
     (f) ülke satırı seçilir → modal HİÇ KAPANMIYOR           ✗
     (f2) ülke seçimi hatırlanmıyor                           ✗

   KÖK: `gourmet-konum.js` her kararı `postJson()` ile sunucuya bildirir
   (`/konum/atla` · `/konum/sec`). Maket ağaçta sunucu YOK, istek
   reddediliyor. `dismissAndClose()` bunu `.then(close, close)` ile
   yutuyor (modal kapanır ama HİÇBİR YERDE HATIRLANMAZ), `selectRow()`
   ise yalnız `.then(success)` yazıyor — reddedilen istekte o geri çağrı
   hiç koşmaz, yani ülke seçilince modal AÇIK KALIYOR.

   ── ÇÖZÜM: TEK KANCA NOKTASI, EKLEMELİ ───────────────────────────────
   `gourmet-konum.js`e DOKUNULMADI. Kararı veren her yol — «Atla» · X ·
   ESC · dış tıklama · ülke satırı · «Konumumu Kullan» — istisnasız
   `postJson()`dan, yani `window.fetch`ten geçiyor (kaynak okundu, altı
   yolun altısı da). O yüzden ayrı ayrı tıklama dinleyicisi bağlanmadı:
   tek bir `fetch` sarmalayıcısı hem kararı DEPOYA yazıyor hem sürücünün
   kendi `close()`/`showToast()` akışının tamamlanmasını sağlıyor.
   Böylece kapanış davranışı benim taklidim değil, SÜRÜCÜNÜN KENDİSİ.
   Bu ayrıca `stopPropagation` tuzağından da bağışık: form ya da panel
   tıklamayı yutsa bile karar yolu değişmez.

   ── KAYIT SIRASI ÖLÇÜLDÜ, VARSAYILMADI ───────────────────────────────
   `t5d-c.js` `<head>`de (satır ~50) `defer`, `gourmet-konum.js` gövdede
   (satır ~802) `defer`. `defer` betikleri BELGE SIRASINA göre koşar,
   yani bu dosya ÖNCE koşar ve `data-should-open`ı sürücü okumadan önce
   düşürebilir. Ölçüldü (rapor/gourmet-t5d/c-m1-sira.json), varsayılmadı.

   ── DEPO DESENİ DONÖRDEN ─────────────────────────────────────────────
   Fit maketleri hatırlamayı `localStorage`da JSON değerle yapıyor
   (`dm_fit`, `dm_fit_fatura_v1`, `dm_fit_planlar_v1` … ölçülen okuma
   deseni: `try{JSON.parse(localStorage.getItem(K)||'null')}catch{}`).
   Gourmet'in kendi maket anahtarları aynı desende (`dm_gourmet_destek_v1`
   · `dm_gourmet_fatura_v1` · `dm_gourmet_paket_hakki_v1`). Bu yüzden
   anahtar `dm_gourmet_konum_v1`, değer JSON.
   ⚠ `localStorage` bazı bağlamlarda FIRLATIR — her okuma/yazma
     `try/catch` içinde, ve depo boşken sayfa eskisi gibi çizer.
   ===================================================================== */
(function () {
  'use strict';

  var ANAHTAR = 'dm_gourmet_konum_v1';

  function oku() {
    try {
      var ham = localStorage.getItem(ANAHTAR);
      if (!ham) return null;
      var v = JSON.parse(ham);
      return (v && typeof v === 'object' && v.karar) ? v : null;
    } catch (e) { return null; }
  }

  function yaz(karar, ulke) {
    try {
      localStorage.setItem(ANAHTAR, JSON.stringify({
        surum: 1,
        karar: karar,              /* 'atla' | 'secildi' */
        ulke: ulke || null,        /* yalnız 'secildi' yolunda dolu */
        zaman: new Date().toISOString()
      }));
    } catch (e) { /* depo kapalı: hatırlama olmaz, sayfa yine doğru çizer */ }
  }

  var modal = document.getElementById('lkModal');
  if (!modal) return;

  /* ---- 1 · CEVAP VERİLMİŞSE MODAL HİÇ AÇILMAZ ------------------------
     Sürücü açılışı `data-should-open === '1'` koşuluna bağlı ve o koşulu
     kendi koşumunun EN SONUNDA okuyor. Değeri burada düşürmek, sürücünün
     `dm:cookie-banner-resolved` dinleyicisini bile kurmamasını sağlıyor —
     yani yarış diye bir şey kalmıyor. Öznitelik siliniyor DEĞİL, '0'a
     çekiliyor: sunucu bir gün gerçekten cevap verirse aynı yuva okunur. */
  var kayit = oku();
  if (kayit) modal.setAttribute('data-should-open', '0');

  /* ---- 2 · KARARI YAKALA · MAKET UÇ ----------------------------------
     Yalnız bu modalın kendi iki adresi yakalanır; başka her istek
     dokunulmadan geçer. Adresler modalın `data-*` yuvalarından okunur,
     sabit yazılmaz. */
  var setUrl = modal.getAttribute('data-set-url') || '';
  var dismissUrl = modal.getAttribute('data-dismiss-url') || '';

  function ulkeAdi(kod) {
    /* Etiket UYDURULMAZ: listedeki satırın kendi adı okunur. Satır yoksa
       etiket yok — sürücü `data.ok && data.label` koşuluyla çalıştığı
       için toast o durumda hiç basılmaz, yani yalan bir ad görünmez. */
    if (!kod) return null;
    var satir = modal.querySelector('.lk-row[data-country="' + String(kod).replace(/"/g, '') + '"]');
    var ad = satir ? satir.querySelector('.lk-name') : null;
    return ad ? ad.textContent.trim() : null;
  }

  if (typeof window.fetch === 'function' && (setUrl || dismissUrl)) {
    var asilFetch = window.fetch.bind(window);
    window.fetch = function (girdi, secenek) {
      var url = '';
      try { url = (typeof girdi === 'string') ? girdi : (girdi && girdi.url) || ''; } catch (e) { url = ''; }

      if (dismissUrl && url === dismissUrl) {
        yaz('atla', null);
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        }));
      }

      if (setUrl && url === setUrl) {
        var kod = null;
        try {
          var g = secenek && secenek.body ? JSON.parse(secenek.body) : null;
          kod = g && g.country ? g.country : null;
        } catch (e) { kod = null; }
        yaz('secildi', kod);
        var etiket = ulkeAdi(kod);
        var govde = etiket ? { ok: true, label: etiket } : { ok: true };
        return Promise.resolve(new Response(JSON.stringify(govde), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        }));
      }

      return asilFetch(girdi, secenek);
    };
  }

  /* ---- 3 · SEÇİLİ ÜLKE ────────────────────────────────────────────────
     Kayıtlı ülke DEPOYA yazılıyor ama DOM'a HİÇBİR İŞARET BASILMIYOR.
     Gerekçe ölçüldü: listede tek satır var (`#lkRow-tr` · Türkiye) ve o
     satır markup'ta ZATEN `is-selected` + `aria-selected="true"` taşıyor.
     Kayda dayanıp ikinci bir işaret basmak, kaydın markup'la çeliştiği
     bir gün YALAN üretirdi; hatırlanan bilgi hiçbir yüzeyde iddiaya
     dönüşmesin diye burada bilerek durduruldu. Liste büyürse bu blok
     satırı kayda göre işaretlemenin doğru yeri olur. */
})();
