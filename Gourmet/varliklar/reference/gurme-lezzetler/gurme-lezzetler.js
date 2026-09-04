/* Gurme Lezzetler (liste) — sayfa-yerel JS (public/reference/gurme-lezzetler/).
 * RV5 — kategori çipleri (.ke-filter .chip) ve sıralama toggle'ı (.ke-filter-bar
 * .dt) daha önce GERÇEK <a href> ile TAM SAYFA navigasyonu yapıyordu (bug
 * raporu: kategori seçilince tüm sayfa yenileniyordu). Bu dosya
 * mekan-liste.js'in #mklViewSeg swapTo deseninin BİREBİR portu — yeni mimari
 * icat edilmedi. Linkler hâlâ GERÇEK href taşır (JS kapalıysa/başarısızsa
 * normal navigasyona düşer, dürüst aşama-aşama iyileştirme); sunucu tarafı
 * GurmeLezzetlerController@index DEĞİŞMEDİ — hem doğrudan istek hem paylaşılan
 * bağlantı hâlâ AYNI tam sayfayı döndürür (controller'a XHR dalı EKLENMEDİ,
 * mekan-liste'nin `.lst-main` fragment'i gibi fetch edilen tam HTML'den
 * ilgili parça alınıyor).
 */
(function () {
  var main = document.getElementById('keListMain');
  if (!main) return;

  // ---- #mostReadTabs sekme geçişi (index.blade.php'deki inline script ile
  // AYNI mantık) — #keListMain İÇİNDE olduğu için her swap'ta TAZE basılıyor,
  // ilk yüklemede zaten index.blade.php'nin kendi inline script'i bağlıyor
  // (çift-bağlama olmasın diye BURADA yalnız swap SONRASI çağrılır). ----
  function initMostReadTabs(scope) {
    var bar = scope.querySelector('#mostReadTabs');
    if (!bar) return;
    bar.querySelectorAll('.dt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        bar.querySelectorAll('.dt').forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        var target = btn.getAttribute('data-tab');
        scope.querySelectorAll('.disc-pane[data-pane]').forEach(function (pane) {
          pane.hidden = pane.getAttribute('data-pane') !== target;
        });
      });
    });
  }

  // ---- .ke-filter (kategori çipleri) yatay slider kenar-fade + tekerlek→yatay
  // (index.blade.php'deki inline script ile AYNI mantık) — .ke-filter-bar
  // #keListMain İÇİNDE olduğu için her swap'ta TAZE basılıyor, dinleyicileri
  // yeniden kurmak gerekiyor (ilk yükleme yine index.blade.php'nin kendi
  // inline script'i tarafından bağlanıyor, çift-bağlama YOK). ----
  function initFilterFade(scope) {
    scope.querySelectorAll('.ke-filter').forEach(function (track) {
      function update() {
        var max = track.scrollWidth - track.clientWidth;
        track.classList.toggle('can-scroll-left', track.scrollLeft > 4);
        track.classList.toggle('can-scroll-right', track.scrollLeft < max - 4);
      }
      update();
      track.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      track.addEventListener('wheel', function (e) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          track.scrollLeft += e.deltaY;
          e.preventDefault();
        }
      }, { passive: false });
    });
  }

  function afterSwap(scope) {
    initMostReadTabs(scope);
    initFilterFade(scope);
  }

  function swapTo(url, push) {
    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (res) {
        if (!res.ok) throw new Error('http ' + res.status);
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var newMain = doc.getElementById('keListMain');
        if (!newMain) { window.location.href = url; return; } // dürüst tam-sayfa fallback

        main.innerHTML = newMain.innerHTML;
        afterSwap(main);

        if (push) window.history.pushState({ keSpa: true }, '', url);
        document.title = doc.title || document.title;
      })
      .catch(function () { window.location.href = url; }); // ağ hatası -> dürüst tam-sayfa fallback
  }

  // Dinleyici `main`e (#keListMain, asla yeniden basılmayan üst kapsayıcı,
  // yalnız innerHTML'i değişir) delege edilir — mekan-liste.js/etkinlikler.js
  // ile AYNI kök-neden fix'i (RV4'te ölçülen bulgu: doğrudan yeniden-basılan
  // öğeye bağlı dinleyici ilk swap'ta ölür). `a.chip`/`a.dt` seçici
  // #mostReadTabs'ın <button class="dt"> öğelerini DOĞAL olarak dışarıda
  // bırakır (farklı etiket, farklı davranış — o sekmeler client-only pane
  // toggle'ı, sayfa/URL değiştirmez).
  main.addEventListener('click', function (e) {
    var link = e.target.closest('a.chip[href], a.dt[href]');
    if (!link) return;
    e.preventDefault();
    if (link.classList.contains('active')) return; // zaten bu durumdayız
    swapTo(link.getAttribute('href'), true);
  });

  window.addEventListener('popstate', function () {
    swapTo(window.location.href, false);
  });
})();
