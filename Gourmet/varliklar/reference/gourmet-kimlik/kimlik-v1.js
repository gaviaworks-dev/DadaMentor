/* =====================================================================
   T5.0b — KİMLİK EKRANLARININ SAYFA JS'İ (giriş · kayıt)
   Kaynak: Beyar'ın tasarım kaynağı `giris-v1.html`, SAYFA JS bloğu
   =====================================================================

   TEK İŞ: şifre göster/gizle (`.fk-eye`). Gövdesi mockup'ın kendi
   handler'ından satır satır alındı (`giris-v1.html:2117-2126`).

   🔴 MOCKUP'IN DİĞER HANDLER'LARI ALINMADI, ÇÜNKÜ KARŞILIKLARI YOK:
     · sekme/pane geçişi  → mockup tek sayfada `?tab=` ile pane gizler; bu
       projede giriş ve kayıt AYRI ROTALARDIR ve sekmeler `<a>` bağlantısıdır.
       Sunucu hangi sekmenin aktif olduğunu kendisi basar; JS gerekmez ve
       JS'siz de çalışır.
     · e-posta/telefon segmenti → ⚠ BU SATIR ARTIK GEÇERSİZ. Beyar kararı
       (2026-08-31) segmenti GERİ ALDI; davranışı bu dosyanın sonundaki
       "GİRİŞ YÖNTEMİ SEGMENTİ" bloğunda.
     · rol segmenti alan açma  → rol-özel alanlar bu projeye alınmadı.
     · sahte gönderim/başarı akışı → gerçek sunucu var.
     · sosyal buton yönlendirmesi → gerçek `<a href>`; anahtar yoksa buton
       zaten `disabled` basılır ve tıklanamaz.

   ⚠ Bu dosya kabuk JS'i (`dd-shell.js`) DEĞİLDİR ve ona dokunmaz; sayfa
   kabuğun `@push('styles')` kancasıyla yükler.
   ===================================================================== */
(function () {
  document.querySelectorAll('.fk-eye').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var inp = document.getElementById(btn.getAttribute('data-eye'));
      if (!inp) return;
      var i = btn.querySelector('i');
      var showing = inp.type === 'text';
      inp.type = showing ? 'password' : 'text';
      if (i) {
        i.classList.toggle('fa-eye', showing);
        i.classList.toggle('fa-eye-slash', !showing);
      }
      btn.setAttribute('aria-label', showing ? 'Şifreyi göster' : 'Şifreyi gizle');
      btn.setAttribute('aria-pressed', showing ? 'false' : 'true');
    });
  });
})();

/* =====================================================================
   T5.0d — ŞİFRE KURALI CANLI KONTROL LİSTESİ (`fk-pwrules`)
   =====================================================================
   Kaynak: kaynak sistemin kayıt formu (`ul.fk-pwrules[data-pw-rules]`) ve
   davranışı `dada-panel-ui/js/sa-form-kit.js` `bindPasswordRules()`.

   🔴 NEDEN KOPYA DEĞİL DE PORT: panel form kiti bu ekranlarda YÜKLENMEZ.
   T5.0 §6.1'de ölçüldü — kapı ekranına fazladan bir kit binince `.btn`
   1.5px küçülmüştü ve sınıf listesi bunu göstermemişti. Gövde satır satır
   aynı, yalnız IIFE'ye alındı ve `document` üzerinde koşar.

   Kural seti `App\Actions\Fortify\PasswordValidationRules` ile birebir
   olmalıdır (min 8 + büyük/küçük + rakam + özel karakter); ayrışırsa ekran
   kullanıcıya sunucunun kabul etmeyeceği bir parolayı "geçerli" gösterir.
   Kapı: `KayitTest::test_sifre_kural_listesi_sunucu_kuraliyla_ayni`.

   ⚠ JS'siz hâlde tüm satırlar nötr (boş daire) kalır — kurallar YİNE
   okunur, yalnız canlı işaretleme olmaz. Sunucu doğrulaması değişmez.
   ===================================================================== */
(function () {
  var RULES = {
    len: function (v) { return v.length >= 8; },
    case: function (v) { return /[a-z]/.test(v) && /[A-Z]/.test(v); },
    num: function (v) { return /[0-9]/.test(v); },
    sym: function (v) { return /[^a-zA-Z0-9]/.test(v); }
  };

  document.querySelectorAll('[data-pw-rules]').forEach(function (list) {
    var field = list.closest('.fk-field');
    var input = field && field.querySelector('.fk-pass input');
    if (!input || input.dataset.pwBound) return;
    input.dataset.pwBound = '1';

    var items = list.querySelectorAll('[data-pw-rule]');

    var render = function () {
      var v = input.value;
      items.forEach(function (li) {
        var ok = RULES[li.dataset.pwRule] ? RULES[li.dataset.pwRule](v) : false;
        li.classList.toggle('is-ok', ok);
        var icon = li.querySelector('i');
        if (icon) icon.className = ok ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle';
      });
    };

    input.addEventListener('input', render);
    render();
  });
})();

/* =====================================================================
   GİRİŞ YÖNTEMİ SEGMENTİ — E-POSTA ↔ TELEFON
   Kaynak: Beyar'ın tasarım kaynağı, `#giSeg` handler'ı
   =====================================================================

   🔴 BU BLOK ÖNCEDEN BİLEREK YOKTU. Bu dosyanın kendi "ALINMADI" listesi
   şunu yazıyordu: *"e-posta/telefon segmenti → Beyar: telefonla giriş
   KURULMAYACAK."* O satır Beyar kararıyla (2026-08-31) GEÇERSİZ kılındı;
   liste bu turda güncellendi.

   🔴 NEDEN JS — `hesap-turu` segmenti JS'siz çalışırken bu ÇALIŞAMAZ.
   Gizlenen alan `required` taşıyor. Tarayıcı, `display:none` bir zorunlu
   alanı doğrulamaya çalışınca formu HİÇ göndermez ve konsola *"An invalid
   form control is not focusable"* yazıp sessizce durur. Yani saf CSS
   (`:has()`) çözümü formu KIRARDI.

   🔴 ÜÇ NİTELİK BİRLİKTE SÜRÜLÜR — `hidden` · `required` · `disabled`.
   `disabled` ŞART VE EN KRİTİĞİ: iki kutu da `name="email"` taşıyor (gerekçe
   `giris.blade.php`te — Fortify kimlik alanını o adla ve `required` doğruluyor).
   Aynı adı taşıyan iki alan birlikte gönderilirse SONRAKİ öncekini EZER; yani
   e-postasını yazan kullanıcının değerini, gizli ama hâlâ gönderilen BOŞ
   telefon kutusu silerdi. `hidden` bir alanı gönderimden ÇIKARMAZ, `disabled`
   çıkarır. Üçü ayrışırsa giriş sessizce bozulur.

   ⚠ JS'SİZ HÂL BOZULMAZ: e-posta alanı `hidden` DEĞİL doğar, telefon alanı
   `hidden` doğar. JS gelmezse ekran bugünkü (yalnız e-posta) hâliyle
   çalışır — segment düğmeleri işlevsiz kalır ama form gönderilir.
   ===================================================================== */
(function () {
  document.querySelectorAll('[data-giris-yontem]').forEach(function (seg) {
    var kap = seg.closest('form');
    if (!kap) return;

    var alanlar = kap.querySelectorAll('[data-yontem]');
    if (!alanlar.length) return;

    var uygula = function (secim) {
      alanlar.forEach(function (alan) {
        var acik = alan.getAttribute('data-yontem') === secim;
        alan.hidden = !acik;
        alan.querySelectorAll('input').forEach(function (inp) {
          /* `required`i geri koyabilmek için ilk hâli işarette tutulur:
             niteliği bir kez kaldırınca "zorunlu muydu" bilgisi kaybolur.
             ⚠ İlk hâl markup'tan okunur, `disabled` alanlar dahil — `required`
             ve `disabled` aynı anda duran telefon kutusunun zorunluluğu böyle
             korunuyor. */
          if (inp.dataset.zorunluydu === undefined) {
            inp.dataset.zorunluydu = inp.required ? '1' : '0';
          }
          inp.required = acik && inp.dataset.zorunluydu === '1';
          /* Gönderimden çıkarma — yukarıdaki blokta gerekçesi yazılı. */
          inp.disabled = !acik;
        });
      });
    };

    seg.querySelectorAll('input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', function () { uygula(r.value); });
      if (r.checked) uygula(r.value);
    });
  });
})();

/* =====================================================================
   TR TELEFON MASKESİ (5xx xxx xx xx) — `[data-tel-mask]`
   Kaynak: Beyar'ın tasarım kaynağı, `fmtTel()`
   =====================================================================

   ⚠ KAYNAKTAN TEK SAPMA — VE GEREKÇESİ: kaynak maskeyi ÜLKEDEN BAĞIMSIZ
   uyguluyor. Orada zararsızdı (prototip hiçbir şey saklamıyor); burada
   DEĞİL — numara artık `users.phone` kolonuna yazılıyor. TR maskesi bir
   Fransız numarasını baştaki hanesini atıp 10 haneye kırparak BOZARDI.
   Bu yüzden maske yalnız ülke TR iken koşar; başka ülkede alan serbest
   kalır. Görünen davranış varsayılan durumda (TR) kaynağınkiyle AYNIDIR.
   ===================================================================== */
(function () {
  function fmtTel(v) {
    var d = v.replace(/\D/g, '');
    if (d.length && d[0] === '0') d = d.slice(1);        /* bastaki 0 — +90 oneki var */
    if (d.length && d.slice(0, 2) === '90') d = d.slice(2);
    d = d.slice(0, 10);
    var out = d.slice(0, 3);
    if (d.length > 3) out += ' ' + d.slice(3, 6);
    if (d.length > 6) out += ' ' + d.slice(6, 8);
    if (d.length > 8) out += ' ' + d.slice(8, 10);
    return out;
  }

  document.querySelectorAll('[data-tel-mask]').forEach(function (inp) {
    var kok = inp.closest('[data-cc-kok]');
    var gizli = kok && kok.querySelector('input[type="hidden"]');
    var trMi = function () { return !gizli || gizli.value === 'TR'; };

    if (trMi()) inp.value = fmtTel(inp.value);

    inp.addEventListener('input', function () {
      if (!trMi()) return;
      inp.value = fmtTel(inp.value);
      try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) { /* eski tarayici */ }
    });
  });
})();
