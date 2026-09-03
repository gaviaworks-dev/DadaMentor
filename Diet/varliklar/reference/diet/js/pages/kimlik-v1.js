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
     · e-posta/telefon segmenti → Beyar: telefonla giriş KURULMAYACAK.
     · rol segmenti alan açma  → rol-özel alanlar bu projeye alınmadı.
     · sahte gönderim/başarı akışı → gerçek sunucu var.
     · sosyal buton yönlendirmesi → gerçek `<a href>`; anahtar yoksa buton
       zaten `disabled` basılır ve tıklanamaz.

   ⚠ Bu dosya kabuk JS'i (`dd-shell.js`) DEĞİLDİR ve ona dokunmaz; sayfa
   `@push('diet-scripts')` ile yükler.
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
