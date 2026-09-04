/* =====================================================================
   DadaGourmet MAKET — üye görünümü bayrağı
   ---------------------------------------------------------------------
   Bu bir ARAYÜZ PROTOTİPİ parçasıdır. Arka uç yok; oturum yok; hiçbir
   kimlik doğrulaması yapılmaz ve yapılıyormuş gibi de davranılmaz.
   Tek işi: URL'de ?auth=1 varsa gövdeye `is-auth` sınıfını basmak.
   Sitenin KENDİ kabuk CSS'i o sınıfı zaten tanıyor (5 kural) — giriş
   düğmesi gizlenir, hesap menüsü açılır.

   Yöntem deneme/fit-giris.html'den alındı: FIT'in giriş maketi de
   submit'i keser ve hedefe ?auth=1 ile gider.

   Gezinti: bayrak URL'de taşındığı için, sayfa içi bağlantılara da
   eklenir — yoksa ilk tıklamada üye görünümü düşerdi. (FIT'te bunun
   karşılığı, üretilen sayfalara is-auth'un markup'a donmasıydı.)
   ===================================================================== */
(function () {
  var qs = new URLSearchParams(location.search);
  if (qs.get('auth') !== '1') return;

  function uygula() {
    var b = document.body;
    if (!b) return;
    b.classList.add('is-auth');

    /* [gourmet-revize d4] rol desteği */
    /* FIT'in sözcük dağarcığı (fit-shell.js): ?business=1 · ?role=<rol>.
       Kök kuralı da FIT'in: auth ⟹ roller "kullanici" ile BAŞLAR. */
    var roller = ['kullanici'];
    if (qs.get('business') === '1') roller.push('isletme');
    var rp = qs.get('role');
    if (rp && ['isletme', 'antrenor', 'diyetisyen'].indexOf(rp) > -1 && roller.indexOf(rp) < 0)
      roller.push(rp);
    b.setAttribute('data-roles', roller.join(' '));
    if (roller.indexOf('isletme') > -1) b.classList.add('has-business');  /* FIT'in köprü sinyali */

    /* Avatar — canlının misafir render'ında BOŞ geliyor (fotoğraf yok).
       Sitenin kendi geleneği uygulanır: fotoğrafsız avatar BAŞ HARF
       gösterir. Yeni tasarım uydurulmadı; ölçü ve biçim .acct-ava'nın
       kendi CSS'inden gelir. Demo kimliği demo@dadagourmet.test → 'D'. */
    document.querySelectorAll('.acct-ava').forEach(function (a) {
      if (a.textContent.trim() || a.style.backgroundImage) return;
      a.textContent = 'D';                       /* demo@dadagourmet.test */
      a.style.display = 'grid';
      a.style.placeItems = 'center';
      a.style.background = 'var(--tomato)';
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
      a.setAttribute('href', s + (s.indexOf('?') < 0 ? '?' : '&') + 'auth=1' + (qs.get('business') === '1' ? '&business=1' : '') + (rp ? '&role=' + rp : '') + hash);
    });
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', uygula);
  else uygula();
})();
