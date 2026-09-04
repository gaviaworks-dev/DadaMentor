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
    if (!b.getAttribute('data-roles')) b.setAttribute('data-roles', 'kullanici hizmet');

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
