/* =====================================================================
   T4 · DadaDiet — KANON KİMLİK EKRANI SÜRÜCÜSÜ (`d-giris.html`)
   ---------------------------------------------------------------------
   🔴 ÖLÇÜLEN KUSUR (2026-09-07, canlıda Beyar bildirdi, ölçümle doğrulandı)
      `d-giris.html`de `formGiris` / `formKayit` / `formSifre` üçünün de
      submit DİNLEYİCİSİ HİÇ YOKTU. Sayfanın kendi betiği yalnız sekme
      değiştiriyor. Sonuç: "Giriş Yap"a basınca tarayıcı VARSAYILAN GET
      submit'i yapıyor ve sayfa kendine dönüyor —
        d-giris.html?giEmail=…&giPass=Demo12345%21&giRemember=on
      yani üye görünümü açılmıyor (is-auth false · rol "misafir" ·
      avatar 0) ve ŞİFRE ADRES ÇUBUĞUNA DÜŞÜYOR.
      Bu, bu deponun kayıtlı kusur sınıfı: "markup taşındı, davranış
      kalmadı" — sürücü donör sayfada kaldı.

   DONÖR · `Gastro/g-giris.html` (Beyar'ın verdiği donör). Ölçüldü:
      submit → `anasayfa.html?auth=1` · is-auth true · rol
      "kullanici sef" · avatar 2. Buradaki `validate` / `returnDest` /
      `withAuth` üçlüsü ORADAN alındı, yeniden yorumlanmadı.

   DONÖRDEN AYRILAN İKİ NOKTA — ölçüldü, uydurulmadı:
   1 · Gastro'nun `#giAsSeg` hesap türü segmenti (ROLE_DEST dalı) Diet'te
       YOK (ölçüldü: `giAsSeg` 0 geçiş). Öznesi olmayan dal PORT EDİLMEDİ;
       giriş her zaman `returnDest()`e gider. Rol uydurulmadı.
   2 · KAYIT hedefi: Gastro kendi şerhinde yöntemi yazıyor —
       *"Hedef sağlık/hareket profili — eski başarı kutusundaki CTA'nın
       gittiği yerin aynısı."* Aynı yöntem Diet'e uygulandı: Diet'in
       KENDİ `#kayitOk` başarı kutusunun birincil CTA'sı
       `d-saglik-dosyam.html`e gidiyor → kayıt oraya yönlenir.

   MOCK: gerçek kimlik doğrulama yok. `?auth=1` kabuğun üye görünümünü
   açar (`dd-shell.js` `dm_user`ı yazar, `maket-auth.js` bayrağı
   gezinmeye taşır ve rolü birleştirir).
   ===================================================================== */
(function () {
  'use strict';
  var fGiris = document.getElementById('formGiris');
  var fKayit = document.getElementById('formKayit');
  var fSifre = document.getElementById('formSifre');
  if (!fGiris && !fKayit && !fSifre) return;
  /* çift bağlanma koruması — sayfa iki kez yüklerse ya da betik iki kez
     bağlanırsa dinleyici çiftlenmesin (kayıtlı ders: render DOM'una
     donmuş "zaten kuruldum" bayrağı; burada bayrak CANLI DOM'a yazılır) */
  if (document.documentElement.getAttribute('data-t4-giris')) return;
  document.documentElement.setAttribute('data-t4-giris', '1');

  /* ── DOĞRULAMA · donörden birebir ─────────────────────────────────
     Hata görsel olarak `.alan.has-error` ile anlatılır; kural
     `kanon/bilesenler.css`te ve `d-giris.html` onu YÜKLÜYOR (ölçüldü). */
  function clearError(alan) {
    if (!alan) return;
    alan.classList.remove('has-error');
    alan.querySelectorAll('.alan-girdi').forEach(function (i) { i.removeAttribute('aria-invalid'); });
  }
  function markError(alan, bad) {
    if (!alan) return;
    alan.classList.toggle('has-error', bad);
    alan.querySelectorAll('.alan-girdi').forEach(function (i) {
      if (bad) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid');
    });
  }
  function isBad(inp) {
    var v = (inp.value || '').trim();
    if (!v) return true;
    if (inp.type === 'email') return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (inp.type === 'tel') return v.replace(/\D/g, '').length < 10;
    if (inp.id === 'kaPass') return v.length < 8;
    return false;
  }
  function validate(form) {
    var ilk = null;
    form.querySelectorAll('.alan-girdi[required]').forEach(function (inp) {
      var alan = inp.closest('.alan');
      if (alan && alan.hidden) return;                 // gizli alanı atla
      var bad = isBad(inp);
      markError(alan, bad);
      if (bad && !ilk) ilk = inp;
    });
    /* onay kutuları: kutunun kendisi kırmızıya boyanamaz → ortak hata
       satırı yazılır. ⚠ KAYNAKTA KUSUR (raporda bildirildi, DÜZELTİLMEDİ):
       donörün aradığı `.form` hata kutusu Gastro'da da Diet'te de
       markup'ta YOK, yani eksik onay mesajı iki markada da basılmıyor.
       Donörün hâli basıldı; odak yine eksik kutuya taşınıyor. */
    var eksik = [];
    form.querySelectorAll('.onay-kutusu input[type="checkbox"][required]').forEach(function (c) {
      if (!c.checked) eksik.push(c);
    });
    var kutu = form.querySelector('.form');
    if (kutu) {
      var t = kutu.querySelector('span');
      if (eksik.length) {
        if (t) t.textContent = eksik.length > 1
          ? 'Devam etmek için zorunlu onayları işaretle (' + eksik.length + ' onay eksik).'
          : 'Devam etmek için zorunlu onayı işaretle.';
        kutu.classList.add('acik');
      } else { if (t) t.textContent = ''; kutu.classList.remove('acik'); }
    }
    if (!ilk && eksik.length) ilk = eksik[0];
    if (ilk) { try { ilk.focus(); } catch (e) {} return false; }
    return true;
  }
  // kullanıcı düzeltmeye başlayınca hata izi düşsün
  document.querySelectorAll('.giris-kart .alan-girdi').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var alan = inp.closest('.alan');
      if (alan && alan.classList.contains('has-error') && !isBad(inp)) clearError(alan);
    });
  });

  /* ── YÖNLENDİRME · donörden birebir ───────────────────────────────
     Dönüş adresi yalnız bu klasördeki bir .html adı olabilir —
     AÇIK YÖNLENDİRME KAPALI (donörün `returnDest()` kuralı). */
  function donusHedefi() {
    var r = new URLSearchParams(location.search).get('return');
    return (r && /^[a-z0-9_.-]+\.html$/i.test(r)) ? r : 'anasayfa.html';
  }
  function authli(hedef) {
    var h = hedef.split('#'), yol = h[0], parca = h[1] ? '#' + h[1] : '';
    return yol + (yol.indexOf('?') < 0 ? '?' : '&') + 'auth=1' + parca;
  }

  if (fGiris) fGiris.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(fGiris)) return;
    var err = document.getElementById('loginErr');
    if (err) { err.classList.remove('acik'); err.hidden = true; }
    location.href = authli(donusHedefi());
  });

  if (fKayit) fKayit.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(fKayit)) return;
    location.href = authli('d-saglik-dosyam.html');   // sayfanın KENDİ #kayitOk CTA hedefi
  });

  if (fSifre) fSifre.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(fSifre)) return;
    fSifre.hidden = true;
    var ok = document.getElementById('sifreOk');
    if (ok) { ok.hidden = false; var h = ok.querySelector('h4'); if (h) { h.setAttribute('tabindex', '-1'); try { h.focus(); } catch (e2) {} } }
  });

  // ?err=1 → giriş reddedildi şeridi (donörün ekran-görüntüsü sözleşmesi)
  var qs = new URLSearchParams(location.search);
  if (qs.get('err') === '1') {
    var e2 = document.getElementById('loginErr');
    if (e2) { e2.hidden = false; e2.classList.add('acik'); }
  }
})();
