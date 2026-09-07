/* =====================================================================
   DadaDiet MAKET — üye görünümü bayrağı
   ---------------------------------------------------------------------
   Arayüz prototipi parçası. Arka uç yok, oturum yok. Tek işi: URL'de
   ?auth=1 varsa gövdeye `is-auth` sınıfını basmak. Sitenin KENDİ kabuk
   CSS'i o sınıfı zaten tanıyor (14 kural) — giriş düğmesi gizlenir,
   hesap menüsü ve çekmecenin hesap bloğu açılır.

   Yöntem: gastro-maket-giris.mjs → deneme/fit-giris.html.

   Kanon 16 ekranı bu dosyaya İHTİYAÇ DUYMAZ: kendi gömülü betikleri
   zaten is-auth basıyor. Shim yine de onlara da iner çünkü bayrağı
   sayfa içi bağlantılara TAŞIMA işi ortak — kanon ekranından canlı
   sayfaya geçerken üye görünümü düşmesin.
   ===================================================================== */
(function () {
  var qs = new URLSearchParams(location.search);
  var acik = qs.get('auth') === '1' || document.documentElement.classList.contains('is-auth');

  function uygula() {
    var b = document.body;
    if (!b) return;
    var uyeGorunum = acik || b.classList.contains('is-auth');
    if (!uyeGorunum) return;

    b.classList.add('is-auth');

    /* ── ROL — T4 · 2026-09-07 · ÖLÇÜLMÜŞ PARİTE DÜZELTMESİ ─────────
       ÖNCE: `if (!b.getAttribute('data-roles'))` — YALNIZ boşsa yazıyordu.
       Diet'in 138 maket sayfasında bu doğru sonucu veriyordu, çünkü o
       sayfalar `window.DD_AUTH` taşıyor ve `dd-shell.js` erken dönüyor:
       `data-roles` boş kalıyor, bu betik "kullanici hizmet" yazıyordu.
       19 `d-*` kanon ekranında DD_AUTH YOK; `dd-shell.js` C1 dalına
       düşüp AYRIŞTIRMA ANINDA `data-roles="kullanici"` basıyor. Bu betik
       DOMContentLoaded'da koştuğu için niteliği DOLU buluyor ve `hizmet`
       hiç doğmuyordu — `d-diyetisyenim`in rol kapısı (`data-rol-gerek=
       "hizmet"`, sürücü `diet-profil.js`) sekiz sekmeyi `hidden`
       bırakıyor, sayfa `?auth=1` ile bile AÇILMIYORDU. (ölçüldü:
       rapor/t4/lead-t2-once.json · `sekme-ray` display:none, kazanan
       kural CDP ile `[hidden]{display:none!important}`.)

       DONÖR: Gastro. Ölçüldü — `g-hesabim` · `g-sef-panelim` ·
       `anasayfa` üçünde de `data-roles="kullanici sef"`; orada
       `maket-auth.js` üye görünümünün TEK YETKİLİSİ, onu ezen ikinci
       bir kabuk betiği yok. Parite bu: rol EZİLMEZ, BİRLEŞTİRİLİR.
       `dd-shell.js`in C1 dalı olduğu gibi kalır (17 `d-*` sayfası
       `data-verified` okuyor; erken dönüş onu düşürürdü).
       ⚠ Yeni rol UYDURULMADI: "hizmet" bu dosyanın kendi bildirdiği
         Diet varsayılanıydı, yalnız yazılamıyordu.                 */
    var roller = (b.getAttribute('data-roles') || '').split(/\s+/).filter(Boolean);
    ['kullanici', 'hizmet'].forEach(function (r) {
      if (roller.indexOf(r) < 0) roller.push(r);
    });
    b.setAttribute('data-roles', roller.join(' '));

    /* Avatar — canlının misafir render'ında BOŞ. Sitenin kendi geleneği:
       fotoğrafsız avatar baş harf gösterir (kanon ekranında da "D").
       Ölçü ve biçim .acct-ava'nın kendi CSS'inden gelir; yalnız boş
       olanlara ve yalnız harf yazılır. */
    document.querySelectorAll('.acct-ava').forEach(function (a) {
      if (a.textContent.trim() || a.style.backgroundImage) return;
      a.textContent = 'D';                         /* demo@dadadiet.test */
      a.style.display = 'grid';
      a.style.placeItems = 'center';
      a.style.background = 'var(--green)';
      a.style.color = '#fff';
      a.style.fontWeight = '700';
      a.style.fontSize = '14px';
      a.style.lineHeight = '1';
    });

    /* bayrağı sayfa içi bağlantılara taşı — üye görünümü gezilebilsin */
    document.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (!h || /^(https?:|mailto:|tel:|#|javascript:)/i.test(h)) return;
      if (!/\.html(\?|#|$)/.test(h)) return;
      if (/[?&]auth=/.test(h)) return;
      var hash = '', s = h;
      var hi2 = s.indexOf('#'); if (hi2 > -1) { hash = s.slice(hi2); s = s.slice(0, hi2); }
      a.setAttribute('href', s + (s.indexOf('?') < 0 ? '?' : '&') + 'auth=1' + hash);
    });
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', uygula);
  else uygula();
})();
