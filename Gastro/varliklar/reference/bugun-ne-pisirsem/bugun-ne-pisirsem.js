/* Bugün Ne Pişirsem — sayfa-özel JS. Genel ui.js/portal.js'e dokunmaz.
 * FB37-b (2026-07-15): (1) üst bnp-tabwrap sekme geçişi (Tarif Ara/Yemek
 * Modu) (2) mod rayı kaydırma (VERBATIM, önceki dalga) (3) mod-chip toggle +
 * açıklama + Hazır Menüler filtresi + sub-badge sayacı (4) bnp-subtabs
 * (Sıfırdan Kur/Hazır Menüler) geçişi (5) Tab A 4-adımlı sihirbaz (stepper +
 * pick-grid seçim + AJAX bnp.search + res-grid sonuç render) (6) Sıfırdan Kur
 * araç çubuğu (sc-cats kategori filtresi + sc-search canlı arama, İSTEMCİ
 * TARAFI — round-trip yok, tarif-bulucu pan-search emsali) (7) GERÇEK Menü
 * Tepsisi (sc-side): sepete ekle/çıkar + "Menüyü Kur" çok-adımlı POST zinciri
 * (menus.store → her tarif için menus.recipes.attach → mutfak-defterim'e
 * yönlendirme).
 *
 * FB39-a/FB42 (2026-07-15, görev #88) — EKLENDİ: (8) "Menü Çıktısı"
 * (initMenuDetail): hm-card tıklanınca bnp.menu.fromCuratedSet ile
 * düzenlenebilir UserMenu'ye çevrilir; kap ekle/değiştir/çıkar/yeniden-
 * adlandır GERÇEK AJAX (MenuDetailController). (9) "Menüyü Pişir"
 * (initCookmode): cooking.start/advance ile GERÇEK cooking-session — plan
 * ekranı → adım adım gerçek RecipeStep içeriği (is_passive'e göre kap
 * rayında el değişimi) → zamanlayıcı (istemci, gerçek duration_min'den) →
 * tamamla. Sıfırdan Kur'un "Menüyü Kur" zinciri BİLİNÇLİ DEĞİŞMEDİ (hâlâ
 * mutfak-defterim'e yönlendirir, FB37-b davranışı korunur — course_key
 * pivot'u boş kalan bu menüler CookingSessionService'te kategori-türevli
 * fallback'le kap türü kazanır, final raporda not edilmiştir). */
(function () {
  'use strict';

  /**
   * Veritabanından gelen serbest metni HTML'e gömmeden önce kaçırır.
   * DOSYA kapsamında durur, BİLİNÇLİ: hem sihirbaz sonuç kartı (initWizard)
   * hem menü paneli kartları (initMenuDetail) kullanıyor. Önce initWizard'ın
   * içindeydi ve menü paneli onu çağırdığında ReferenceError atıyordu —
   * openMenuFromQueryParam'ın `.catch(function(){})`'i hatayı sessizce
   * yuttuğu için panel hiç açılmıyordu (Playwright ile yakalandı, 2026-08-23).
   */
  function bnpEsc(v) {
    var d = document.createElement('div');
    d.textContent = v == null ? '' : String(v);
    return d.innerHTML;
  }

  function csrfToken() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.content : '';
  }
  /**
   * Kullanıcıya kısa bildirim — layouts/app.blade.php'nin PAYLAŞIMLI
   * `#keToast`'ını kullanır (portal.js:362 ile aynı mekanizma). Yeni bir
   * bildirim deseni İCAT EDİLMEDİ.
   */
  function bnpBildir(mesaj) {
    var toast = document.getElementById('keToast');
    var govde = document.getElementById('keToastMsg');
    if (!toast || !govde) { return; }
    govde.textContent = mesaj;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show', 'soft'); }, 3600);
  }


  function isAuth() {
    return document.body.classList.contains('is-auth');
  }

  // ui.js'teki private showLoginGate ile AYNI DOM sözleşmesi (id="lgGate",
  // .show class) — modül farklı dosyada olduğu için burada tekrar açılıyor,
  // yeni bir modal İCAT EDİLMEDİ.
  function openLoginGate(title, desc) {
    var gate = document.getElementById('lgGate');
    if (!gate) {
      window.location.href = '/giris?return=' + encodeURIComponent(window.location.pathname + window.location.search);
      return;
    }
    var overlay = document.getElementById('lgOverlay');
    var titleEl = gate.querySelector('[data-lg-title]');
    var descEl = gate.querySelector('[data-lg-desc]');
    if (titleEl && title) titleEl.textContent = title;
    if (descEl && desc) descEl.textContent = desc;
    gate.classList.add('show');
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  /* ===================== SEKME DURUMU (üç grup, tek kaynak) =====================
     Bu sayfada ÜÇ ayrı `.dt` grubu var: üst sekmeler (data-tab), alt sekmeler
     (data-sub) ve kap kategorisi rayı (data-cat). Üçü de birbirinden bağımsız
     seçim taşır.

     NEDEN BÖYLE BİR DURUM NESNESİ VAR: portal.js ana sayfanın "Keşfet"
     sekmeleri için yazılmış GENEL bir dinleyiciyi sayfadaki HER `.dt`
     düğmesine bağlar ve tıklamada BELGE GENELİNDEKİ tüm `.dt`'lerden `active`
     sınıfını siler, sonra yalnız tıklanana geri koyar (resources/js/portal.js,
     "keşfet sekmeleri" bloğu). Yani "Yemek Modu"na tıklamak alt sekmelerin ve
     kategori rayının seçimini de siliyordu — Blade `active` basmasına rağmen
     hiçbir alt sekme seçili görünmüyordu (ÖLÇÜLDÜ: tıklama sonrası
     kur=off/hazir=off, buna karşılık aria-selected="true" kur üzerinde
     KALIYORDU; portal aria'ya dokunmadığı için imza buydu).

     Portal ortak dosya ve başka sayfaları da besliyor — orayı daraltmak bu
     turun kapsamı dışı (Beyar kararı).

     NEDEN DİNLEYİCİ DEĞİL DE MutationObserver: "ortak script siler, sayfa
     geri koyar" kurgusunun tıklama dinleyicisiyle yazılmış hâli bir YARIŞ
     DURUMUDUR — hangi dinleyicinin önce koştuğu dosya yükleme sırasına bağlı
     olur, sıra bir gün değişince çözüm sessizce bozulur. Bu yüzden burada
     olaylara hiç bakılmıyor; DOM'un kendisine bir DEĞİŞMEZ konuyor:
     "bu üç grubun görünen seçimi daima tabState'i yansıtır."

     Deterministik olmasının sebebi: MutationObserver geri çağrısı, o an
     koşan görevin TÜM dinleyicileri bittikten sonraki mikro-görev
     denetiminde koşar. Yani tek bir tıklamanın portal/sayfa dinleyicileri
     hangi sırayla koşarsa koşsun, nöbetçi hepsinden SONRA ve DOM'un nihai
     hâli üzerinde bir kez çalışır. Sıradan bağımsızdır; sınıfı kimin, kaç
     kez, hangi olayla sildiği de önemsizdir (kapıda sentetik silmeyle
     kanıtlanıyor: hiçbir olay göndermeden sınıflar sıyrılıyor ve durum yine
     kendini onarıyor).

     Sonsuz döngü yok: yazmalar yalnız DEĞER GERÇEKTEN YANLIŞSA yapılır,
     doğruyken hiç mutasyon üretilmez, nöbetçi bir tur sonra susar.
     Sınıf ve aria HER ZAMAN birlikte çevrilir — ikisinin ayrışması bu
     kusurun imzasıydı, düzeltme onları tek yerden yönetir. */
  var tabState = { tab: null, sub: null, cat: null };

  var TAB_GROUPS = [
    { box: '.bnp-tabwrap', sel: '.bnp-tabwrap .dt[data-tab]', key: 'tab' },
    { box: '#bnpSubtabs', sel: '#bnpSubtabs .dt[data-sub]', key: 'sub' },
    { box: '#scTabs', sel: '#scTabs .dt[data-cat]', key: 'cat' },
  ];

  function syncTabState() {
    TAB_GROUPS.forEach(function (g) {
      if (tabState[g.key] === null) return; // grup sayfada yok
      document.querySelectorAll(g.sel).forEach(function (btn) {
        var on = btn.dataset[g.key] === tabState[g.key];
        // Yazmadan önce karşılaştır: doğruyken yazmak boş mutasyon üretir ve
        // nöbetçiyi kendi kendini besleyen bir döngüye sokardı.
        if (btn.classList.contains('active') !== on) btn.classList.toggle('active', on);
        if (btn.hasAttribute('aria-selected') && (btn.getAttribute('aria-selected') === 'true') !== on) {
          btn.setAttribute('aria-selected', on ? 'true' : 'false');
        }
      });
    });
  }

  function initTabStateGuard() {
    // Sunucudan gelen (Blade'in bastığı) seçim başlangıç durumudur.
    TAB_GROUPS.forEach(function (g) {
      var on = document.querySelector(g.sel + '.active') || document.querySelector(g.sel);
      tabState[g.key] = on ? (on.dataset[g.key] || '') : null;
    });

    var observer = new MutationObserver(syncTabState);
    TAB_GROUPS.forEach(function (g) {
      var box = document.querySelector(g.box);
      if (!box) return;
      observer.observe(box, { subtree: true, attributes: true, attributeFilter: ['class', 'aria-selected'] });
    });
  }

  function initTopTabs() {
    var wrap = document.querySelector('.bnp-tabwrap');
    if (!wrap) return;
    var buttons = wrap.querySelectorAll('.dt[data-tab]');
    var panes = document.querySelectorAll('.bnp-pane[data-pane]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabState.tab = btn.dataset.tab;
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        panes.forEach(function (p) { p.hidden = p.dataset.pane !== btn.dataset.tab; });
      });
    });
  }

  function initModeRail() {
    var rail = document.getElementById('modeRail');
    var bar = document.getElementById('modeBar');
    var prev = document.getElementById('modeRailPrev');
    var next = document.getElementById('modeRailNext');
    if (!rail || !bar) return;

    var update = function () {
      var max = bar.scrollWidth - bar.clientWidth;
      rail.classList.toggle('at-start', bar.scrollLeft <= 4);
      rail.classList.toggle('at-end', bar.scrollLeft >= max - 4);
      if (bar.scrollLeft > 4) rail.classList.add('scrolled');
    };
    bar.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    if (prev) prev.addEventListener('click', function () { bar.scrollBy({ left: -240, behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { bar.scrollBy({ left: 240, behavior: 'smooth' }); });
    update();
  }

  function updateSubBadge(mode) {
    var badge = document.getElementById('subBadge');
    var panel = document.querySelector('[data-ready-mode="' + mode + '"]');
    if (!badge || !panel) return;
    badge.textContent = String(panel.querySelectorAll('.hm-card').length);
  }

  function initModeSelect() {
    var chips = document.querySelectorAll('.mode-chip[data-mode]');
    if (!chips.length) return;
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var mode = chip.dataset.mode;
        chips.forEach(function (c) { c.classList.toggle('active', c === chip); });
        document.querySelectorAll('[data-mode-desc]').forEach(function (d) {
          d.classList.toggle('show', d.dataset.modeDesc === mode);
        });
        document.querySelectorAll('[data-ready-mode]').forEach(function (p) {
          p.hidden = p.dataset.readyMode !== mode;
        });
        updateSubBadge(mode);
        setDefaultTrayName(mode);
        // Mod değişince "Sıfırdan Kur" havuzu da değişir: kategori rayı,
        // ızgara ve sayaç seçili modun tariflerinden yeniden kurulur. Eskiden
        // mod YALNIZ "Hazır Menüler" tarafına uygulanıyordu (ölçülmüştü: rozet
        // değişiyor, kategori/sayaç/ızgara sabit kalıyordu).
        reloadScratchForMode(mode);
      });
    });
  }

  function initSubtabs() {
    var wrap = document.getElementById('bnpSubtabs');
    if (!wrap) return;
    var buttons = wrap.querySelectorAll('.dt[data-sub]');
    var panes = document.querySelectorAll('.bnp-subpane[data-sub]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabState.sub = btn.dataset.sub;
        buttons.forEach(function (b) {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
        });
        panes.forEach(function (p) { p.hidden = p.dataset.sub !== btn.dataset.sub; });
      });
    });
  }

  /* ===================== TAB A — SİHİRBAZ ===================== */
  var wz = { step: 0, answers: { ogun: null, sure: null, zorluk: null, damak: [] } };

  function wzLabelFor(group, val) {
    var el = document.querySelector('.pick-grid[data-q="' + group + '"] .pick[data-val="' + val + '"] .pk-txt b');
    return el ? el.textContent : val;
  }

  function initWizard() {
    var stepper = document.getElementById('wzStepper');
    var card = document.getElementById('wzCard');
    if (!stepper || !card) return;

    var stpEls = stepper.querySelectorAll('.stp[data-step]');
    var lineEls = stepper.querySelectorAll('.stp-line');
    var wsteps = card.querySelectorAll('.wstep[data-step]');
    var prevBtn = document.getElementById('wzPrev');
    var nextBtn = document.getElementById('wzNext');
    var results = document.getElementById('wzResults');
    var hint = document.getElementById('wzHint'); // M5: ön-seçim nazik mesajı
    var resBar = document.getElementById('wzResBar');
    // 2026-07-24 (M16): #wzEmpty metni hata durumunda geçici olarak
    // değiştirilir (bkz. runWizardSearch .catch) — orijinal metin burada
    // yakalanır ki başarılı bir yeniden-aramada eski haline dönebilsin.
    var wzEmptyEl = document.getElementById('wzEmpty');
    var wzEmptyDefault = wzEmptyEl ? {
      title: (wzEmptyEl.querySelector('h3') || {}).textContent || '',
      text: (wzEmptyEl.querySelector('p') || {}).textContent || '',
    } : null;

    function renderStepUI() {
      stpEls.forEach(function (el) {
        var s = Number(el.dataset.step);
        el.classList.toggle('active', s === wz.step);
        el.classList.toggle('done', s < wz.step);
      });
      lineEls.forEach(function (el, i) { el.classList.toggle('done', i < wz.step); });
      wsteps.forEach(function (el) { el.classList.toggle('active', Number(el.dataset.step) === wz.step); });
      prevBtn.disabled = wz.step === 0;
      updateNextState();
    }

    function hasSelection() {
      if (wz.step === 0) return !!wz.answers.ogun;
      if (wz.step === 1) return !!wz.answers.sure;
      if (wz.step === 2) return !!wz.answers.zorluk;
      return true; // damak boş bırakılabilir
    }

    function updateNextState() {
      nextBtn.disabled = !hasSelection();
    }

    card.querySelectorAll('.pick-grid[data-q]').forEach(function (grid) {
      var q = grid.dataset.q;
      var multi = grid.dataset.multi === '1';
      grid.querySelectorAll('.pick[data-val]').forEach(function (tile) {
        tile.addEventListener('click', function () {
          var val = tile.dataset.val;
          if (multi) {
            var idx = wz.answers.damak.indexOf(val);
            if (idx === -1) { wz.answers.damak.push(val); tile.classList.add('sel'); }
            else { wz.answers.damak.splice(idx, 1); tile.classList.remove('sel'); }
          } else {
            grid.querySelectorAll('.pick').forEach(function (t) { t.classList.remove('sel'); });
            tile.classList.add('sel');
            wz.answers[q] = q === 'sure' ? Number(val) : val;
          }
          updateNextState();

          /* Tek seçimli adımda OTOMATİK İLERLEME (Beyar 2026-08-23).
             Öğün/Süre/Zorluk adımlarında seçim zaten kesindir — kullanıcıyı
             ayrıca "Devam"a bastırmak fazladan bir tık. Çok seçimli damak
             adımı (data-multi="1") DIŞARIDA: orada seçim bitmiş sayılmaz,
             karar "Devam" ile verilir.

             Gecikme bilinçli: seçilen kutunun .sel durumu (kenarlık + tik
             rozeti) bir an görünsün, ekran tıklamanın altından kaymasın.
             Gecikme içinde kullanıcı stepper'dan/Geri'den başka adıma
             geçtiyse atlama İPTAL edilir — o yüzden adım numarası kapanışta
             yakalanıp yeniden doğrulanır. */
          if (!multi && wz.step < 3) {
            var stepAtClick = wz.step;
            window.setTimeout(function () {
              if (wz.step !== stepAtClick || wz.step >= 3) return;
              wz.step += 1;
              renderStepUI();
            }, 220);
          }
        });
      });
    });

    stpEls.forEach(function (el) {
      el.addEventListener('click', function () {
        var s = Number(el.dataset.step);
        if (s <= wz.step) { wz.step = s; renderStepUI(); }
      });
    });

    prevBtn.addEventListener('click', function () {
      if (wz.step > 0) { wz.step -= 1; renderStepUI(); }
    });

    nextBtn.addEventListener('click', function () {
      if (wz.step < 3) { wz.step += 1; renderStepUI(); return; }
      runWizardSearch();
    });

    var retryBtn = document.getElementById('wzRetry');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        wz.step = 0;
        wz.answers = { ogun: null, sure: null, zorluk: null, damak: [] };
        card.querySelectorAll('.pick').forEach(function (t) { t.classList.remove('sel'); });
        card.hidden = false;
        results.hidden = true;
        if (hint) hint.classList.add('show'); // M5: sihirbaza dönünce ön-seçim mesajı geri gelir
        renderStepUI();
      });
    }

    /* Sihirbaz sonuç kartı — /tarifler kartının (tarifler/_card.blade.php)
       anatomisi BİREBİR (Beyar 2026-08-23). Değişen üç şey:
       (a) Dört olgu: süre · zorluk · porsiyon · bütçe. Eskiden yalnız ilk
           ikisi vardı, kart listedeki eşinden eksik görünüyordu. Metin
           .rf-txt kutusunda — ellipsis flex kapsayıcıda NO-OP'tur (bkz.
           portal.css M15 notu), düz kutu şart.
       (b) Yazar satırı: ad+SOYAD, avatarsızda krem zeminli baş harf, ve
           tıklanınca profile giden anchor (kartın gövdesi tarife gitmeye
           devam eder — üste çıkma kart.css'teki a.r-author{z-index:2}).
       (c) Başlık/yazar artık kaçırılıyor: bu iki alan veritabanından gelen
           serbest metin, doğrudan HTML'e gömülüyordu. */
    function wzCardHtml(row) {
      var avatar = row.authorAvatar || '';
      var cost = '';
      if (row.costTier) {
        cost = '<span class="r-cost" title="' + bnpEsc(row.costLabel || '') + '">';
        for (var c = 1; c <= 3; c++) {
          cost += '<b class="' + (c <= row.costTier ? 'rc-on' : 'rc-off') + '">₺</b>';
        }
        cost += '</span>';
      }

      var avInner = avatar
        ? ''
        : '<span>' + bnpEsc(row.authorInitial || '?') + '</span>';
      var authorInner = '<div class="av"' + (avatar ? ' style="background-image:url(\'' + avatar + '\')"' : '') + '>' + avInner + '</div>' +
        '<span><b>' + bnpEsc(row.author || '') + '</b></span>';
      var author = row.authorUrl
        ? '<a class="r-author" href="' + row.authorUrl + '">' + authorInner + '</a>'
        : '<div class="r-author">' + authorInner + '</div>';

      return '' +
        '<article class="r-card">' +
        '<div class="r-media-wrap"><div class="r-media" style="background-image:url(\'' + (row.cover || '') + '\')">' +
        '<a class="r-save" href="' + row.url + '" aria-label="Aç"><i class="fa-regular fa-heart" aria-hidden="true"></i></a>' +
        '<span class="r-match"><i class="fa-solid fa-check" aria-hidden="true"></i> %' + row.matchPercent + ' uygun</span>' +
        (row.totalTimeMin ? '<div class="m-types"><span class="mt"><i class="fa-solid fa-clock" aria-hidden="true"></i> ' + row.totalTimeMin + ' dk</span></div>' : '') +
        '</div></div>' +
        '<div class="r-body"><h4><a href="' + row.url + '">' + bnpEsc(row.title) + '</a></h4>' +
        '<div class="r-facts">' +
        (row.totalTimeMin ? '<span><i class="fa-solid fa-clock" aria-hidden="true"></i> <span class="rf-txt">' + row.totalTimeMin + ' dk</span></span>' : '') +
        (row.difficulty ? '<span><i class="fa-solid fa-gauge-simple" aria-hidden="true"></i> <span class="rf-txt">' + bnpEsc(row.difficulty) + '</span></span>' : '') +
        (row.servingsLabel ? '<span class="f-serv"><i class="fa-solid fa-utensils" aria-hidden="true"></i> <span class="rf-txt">' + bnpEsc(row.servingsLabel) + '</span></span>' : '') +
        cost +
        '</div>' +
        '<div class="r-foot">' + author +
        '<div class="r-stats"><span class="r-rate"><i class="fa-solid fa-star" aria-hidden="true"></i> ' + (row.ratingAvg || 0).toFixed(1) + '</span>' +
        '<span class="r-views"><i class="fa-solid fa-eye" aria-hidden="true"></i> ' + (row.viewCount || 0) + '</span></div></div>' +
        '</div></article>';
    }

    function summaryChips() {
      var chips = [];
      if (wz.answers.ogun) chips.push(wzLabelFor('ogun', wz.answers.ogun));
      if (wz.answers.sure) chips.push(wzLabelFor('sure', wz.answers.sure));
      if (wz.answers.zorluk) chips.push(wzLabelFor('zorluk', wz.answers.zorluk));
      wz.answers.damak.forEach(function (d) { chips.push(wzLabelFor('damak', d)); });
      var html = '<span class="rs-lbl"><i class="fa-solid fa-sliders" aria-hidden="true"></i> Seçimlerin:</span>';
      chips.forEach(function (c) { html += '<span class="res-chip"><i class="fa-solid fa-check" aria-hidden="true"></i> ' + c + '</span>'; });
      html += '<button class="res-edit" type="button" id="wzEditBtn">Seçimleri Düzenle</button>';
      return html;
    }

    function runWizardSearch() {
      var body = {
        ogun: wz.answers.ogun,
        sure: wz.answers.sure,
        zorluk: wz.answers.zorluk,
        damak: wz.answers.damak,
      };
      fetch(window.bnpConfig.searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify(body),
      })
        .then(function (res) {
          if (!res.ok) { throw new Error('bnp-search-http-' + res.status); }
          return res.json();
        })
        .then(function (data) {
          card.hidden = true;
          results.hidden = false;
          if (hint) hint.classList.remove('show'); // M5: gerçek sonuç geldi, ön-seçim mesajı iner
          document.getElementById('wzSummary').innerHTML = summaryChips();
          document.getElementById('wzResCount').textContent = String(data.total);
          var grid = document.getElementById('wzGrid');
          grid.innerHTML = data.results.map(wzCardHtml).join('');
          var empty = document.getElementById('wzEmpty');
          if (empty && wzEmptyDefault) {
            var t = empty.querySelector('h3');
            var p = empty.querySelector('p');
            if (t) t.textContent = wzEmptyDefault.title;
            if (p) p.textContent = wzEmptyDefault.text;
          }
          empty.classList.toggle('show', data.total === 0);
          // M5: 0 sonuçta "0 tarif sana uygun" başlığını bastır — yalnız #wzEmpty'nin
          // nazik metni görünsün (Beyar onaylı additive iyileştirme).
          if (resBar) resBar.style.display = data.total === 0 ? 'none' : '';
          var editBtn = document.getElementById('wzEditBtn');
          if (editBtn) {
            editBtn.addEventListener('click', function () {
              card.hidden = false;
              results.hidden = true;
              if (hint) hint.classList.add('show');
            });
          }
        })
        .catch(function () {
          // 2026-07-24 (M16): sessiz-fail YASAK — HTTP hatası/ağ hatasında
          // kullanıcıya dürüst bir durum gösterilir (CLAUDE.md); mevcut
          // #wzEmpty kutusu geçici bir hata metniyle yeniden kullanılır.
          card.hidden = true;
          results.hidden = false;
          if (hint) hint.classList.remove('show');
          document.getElementById('wzSummary').innerHTML = summaryChips();
          document.getElementById('wzResCount').textContent = '0';
          document.getElementById('wzGrid').innerHTML = '';
          var empty = document.getElementById('wzEmpty');
          if (empty) {
            var t = empty.querySelector('h3');
            var p = empty.querySelector('p');
            if (t) t.textContent = 'Sonuçlar yüklenemedi';
            if (p) p.textContent = 'Bir şeyler ters gitti — "Baştan dene" ile tekrar deneyebilirsin.';
            empty.classList.add('show');
          }
          if (resBar) resBar.style.display = 'none';
        });
    }

    renderStepUI();
  }

  /* ===================== SIFIRDAN KUR — kategori/arama filtresi ===================== */
  /* ===== SIFIRDAN KUR HAVUZU — seçim SUNUCUYA gider (2026-08-08) =====

     ÖNCEKİ HÂL VE NEDEN DEĞİŞTİ: ızgara sunucudan SABİT 24 tarifle basılıyor,
     kategori filtresi o 24 kartı `style.display='none'` ile İSTEMCİDE
     gizliyordu. Ölçülen sonuç: 33 kategori sekmesinin 16'sı boş ekran
     veriyordu — o kategorinin tarifi ilk 24'e girmediği için. Kategori artık
     sunucuya gider; ızgara, sayaç ve kategori rayı seçili MODUN havuzundan
     kurulur.

     KART ŞABLONU İSTEMCİDE TUTULMAZ: sunucu `_rp-card` partial'ını render
     edip HTML döner, burada yalnız `innerHTML` ile yerine konur. İkinci bir
     kart şablonu kopyası olsaydı iki yerden biri sessizce eskirdi.

     innerHTML DEĞİŞİMİ DİNLEYİCİ KOPARMIYOR ve bu bir tesadüf değil: tepsi
     dinleyicisi `#scGrid`in KENDİSİNE bağlı (delege), kartlara değil. Kart
     düğmelerinin `.added` işareti ise DOM'da değil `tray.items` içinde
     tutulduğu için her değişimden sonra yeniden basılır — yoksa tepsideki
     tarif, ızgara tazelenince "eklenmemiş" görünürdü.

     RAY YALNIZ MOD DEĞİŞİNCE YENİDEN KURULUR: kategoriye tıklandığında ray
     olduğu gibi kalır, yoksa tıklanan sekme ayağının altından kayardı. */
  var scratch = { mode: null, cat: '', q: '', page: 1, seq: 0 };

  function scratchGrid() { return document.getElementById('scGrid'); }

  function syncAddedButtons() {
    var grid = scratchGrid();
    if (!grid) return;
    grid.querySelectorAll('.rp-card[data-recipe-id]').forEach(function (card) {
      var btn = card.querySelector('[data-rp-add]');
      if (!btn) return;
      var inTray = tray.items.some(function (i) { return i.id === Number(card.dataset.recipeId); });
      btn.classList.toggle('added', inTray);
    });
  }

  function renderCategoryRail(categories) {
    var tabs = document.getElementById('scTabs');
    if (!tabs || !categories) return;
    var html = '<button class="dt active" type="button" data-cat="">'
      + (tabs.dataset.allLabel || 'Tümü') + '</button>';
    categories.forEach(function (c) {
      var b = document.createElement('button');
      b.textContent = c.name;
      html += '<button class="dt" type="button" data-cat="' + String(c.slug).replace(/"/g, '&quot;') + '">'
        + b.innerHTML + '</button>';
    });
    tabs.innerHTML = html;
  }

  function loadScratchPool(opts) {
    var grid = scratchGrid();
    if (!grid || !window.bnpConfig || !window.bnpConfig.scratchPoolUrl) return;

    opts = opts || {};
    var withRail = !!opts.withRail;
    var url = new URL(window.bnpConfig.scratchPoolUrl, window.location.origin);
    if (scratch.mode) url.searchParams.set('mod', scratch.mode);
    if (scratch.cat) url.searchParams.set('kategori', scratch.cat);
    if (scratch.q) url.searchParams.set('q', scratch.q);

    // Yarış koruması: yavaş bir istek, sonradan atılan hızlı bir isteğin
    // sonucunu EZMEZ. Sırasız gelen yanıt sessizce atılır.
    var ticket = ++scratch.seq;
    grid.setAttribute('aria-busy', 'true');

    fetch(url.toString(), { headers: { Accept: 'application/json' } })
      .then(function (res) { if (!res.ok) throw new Error('bnp-pool-http-' + res.status); return res.json(); })
      .then(function (data) {
        if (ticket !== scratch.seq) return;

        grid.innerHTML = data.html || ('<div class="rp-empty"><i class="fa-solid fa-bowl-rice" aria-hidden="true"></i><p>'
          + (data.emptyText || '') + '</p></div>');
        syncAddedButtons();

        var count = document.getElementById('scCount');
        if (count && data.countLabel) count.textContent = data.countLabel;

        if (withRail) {
          renderCategoryRail(data.categories);
          scratch.cat = '';
          tabState.cat = '';
        }
      })
      .catch(function () {
        if (ticket !== scratch.seq) return;
        // Sessiz başarısızlık YOK: kullanıcı ızgaranın neden değişmediğini
        // görebilmeli, ve yeniden denemek tek tıklama uzakta olmalı.
        grid.innerHTML = '<div class="rp-empty"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><p>'
          + (grid.dataset.errorText || '') + '</p></div>';
      })
      .finally(function () { grid.removeAttribute('aria-busy'); });
  }

  function initScratchFilter() {
    var tabs = document.getElementById('scTabs');
    var search = document.getElementById('scSearch');
    var grid = scratchGrid();
    if (!grid) return;

    scratch.mode = (window.bnpConfig && window.bnpConfig.activeMode) || null;

    // Ray DEĞİŞTİRİLEBİLİR olduğu için dinleyici tek tek düğmelere değil
    // rayın KENDİSİNE bağlanır — yeniden kurulan sekmeler dinleyicisiz kalmaz
    // (innerHTML değişimi tek tek bağlanmış dinleyicileri koparırdı).
    if (tabs) {
      tabs.addEventListener('click', function (e) {
        var btn = e.target.closest('.dt[data-cat]');
        if (!btn || !tabs.contains(btn)) return;
        tabs.querySelectorAll('.dt').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        scratch.cat = btn.dataset.cat || '';
        tabState.cat = scratch.cat;
        loadScratchPool();
      });
    }

    if (search) {
      var timer;
      search.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          scratch.q = search.value.trim();
          loadScratchPool();
        }, 250);
      });
    }
  }

  /** Mod değişince havuz VE kategori rayı birlikte tazelenir. */
  function reloadScratchForMode(mode) {
    scratch.mode = mode;
    scratch.q = '';
    var search = document.getElementById('scSearch');
    if (search) search.value = '';
    loadScratchPool({ withRail: true });
  }

  /* ===================== MENÜ TEPSİSİ (sepetim) ===================== */
  var tray = { items: [], nameDirty: false };

  function setDefaultTrayName(mode) {
    var input = document.getElementById('scName');
    if (!input || tray.nameDirty || input.value) return;
    var chip = document.querySelector('.mode-chip[data-mode="' + mode + '"] .mc-lbl');
    input.value = chip ? chip.textContent : '';
  }

  function renderTray() {
    var list = document.getElementById('scList');
    var empty = document.getElementById('scEmpty');
    var count = document.getElementById('scTrayCount');
    var fabB = document.getElementById('scFabB');
    var meta = document.getElementById('scMeta');
    var build = document.getElementById('scBuild');
    var side = document.getElementById('scSide');
    if (!list) return;

    var n = tray.items.length;
    count.textContent = n + (n === 1 ? ' tarif tepside' : ' tarif tepside');
    fabB.textContent = String(n);
    build.disabled = n === 0;
    empty.hidden = n > 0;
    list.hidden = n === 0;
    meta.innerHTML = n > 0 ? '<span><i class="fa-solid fa-utensils" aria-hidden="true"></i> ' + n + ' tarif</span>' : '';

    list.innerHTML = tray.items.map(function (item) {
      return '' +
        '<div class="scp-item" data-tray-id="' + item.id + '">' +
        '<div class="si-th" style="background-image:url(\'' + (item.cover || '') + '\')"></div>' +
        '<div class="si-info"><span class="si-name">' + item.title + '</span>' +
        (item.cat ? '<span class="si-cat">' + item.cat + '</span>' : '') +
        '</div>' +
        '<button class="si-del" type="button" data-tray-remove="' + item.id + '" aria-label="Çıkar"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        '</div>';
    }).join('');

    list.querySelectorAll('[data-tray-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeFromTray(Number(btn.dataset.trayRemove));
      });
    });

    if (n > 0) side.classList.add('show');
  }

  function findAddButton(id) {
    return document.querySelector('.rp-card[data-recipe-id="' + id + '"] [data-rp-add]');
  }

  function addToTray(item, btn) {
    if (tray.items.some(function (i) { return i.id === item.id; })) return;
    tray.items.push(item);
    if (btn) {
      btn.classList.add('added');
      btn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Eklendi';
    }
    renderTray();
  }

  function removeFromTray(id) {
    tray.items = tray.items.filter(function (i) { return i.id !== id; });
    var btn = findAddButton(id);
    if (btn) {
      btn.classList.remove('added');
      btn.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i> Menüye Ekle';
    }
    renderTray();
  }

  function initTray() {
    var grid = document.getElementById('scGrid');
    var side = document.getElementById('scSide');
    if (!grid || !side) return;

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-rp-add]');
      if (!btn) return;
      e.preventDefault();
      if (!isAuth()) {
        openLoginGate(btn.dataset.lgTitle, btn.dataset.lgDesc);
        return;
      }
      var card = btn.closest('.rp-card[data-recipe-id]');
      if (!card) return;
      var id = Number(card.dataset.recipeId);
      if (btn.classList.contains('added')) {
        removeFromTray(id);
      } else {
        addToTray({ id: id, slug: card.dataset.recipeSlug, title: card.dataset.recipeTitle, cat: card.dataset.recipeCat, cover: card.dataset.recipeCover }, btn);
      }
    });

    var minBtn = document.getElementById('scMin');
    var fab = document.getElementById('scFab');
    if (minBtn) minBtn.addEventListener('click', function () { side.classList.add('mini'); });
    if (fab) fab.addEventListener('click', function () { side.classList.remove('mini'); });

    var clearBtn = document.getElementById('scClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        tray.items.slice().forEach(function (i) { removeFromTray(i.id); });
      });
    }

    var nameInput = document.getElementById('scName');
    if (nameInput) {
      nameInput.addEventListener('input', function () { tray.nameDirty = true; });
    }

    var buildBtn = document.getElementById('scBuild');
    if (buildBtn) {
      buildBtn.addEventListener('click', function () {
        // 🔴 ÖNCEDEN SESSİZDİ (2026-08-22 düzeltmesi). Bu dal `return`
        // ediyordu: giriş yapmamış kullanıcı "Menüyü Kur"a basınca HİÇBİR
        // ŞEY olmuyordu — ne mesaj, ne yönlendirme. Kullanıcı açısından
        // düğme bozuk görünüyor.
        if (!isAuth()) {
          bnpBildir('Menü kurmak için giriş yapman gerekiyor.');
          return;
        }
        if (tray.items.length === 0) {
          bnpBildir('Önce tepsiye en az bir tarif ekle.');
          return;
        }
        buildMenu(buildBtn);
      });
    }

    renderTray();
  }

  function buildMenu(buildBtn) {
    var nameInput = document.getElementById('scName');
    var name = (nameInput && nameInput.value.trim()) || 'Menüm';
    var originalLabel = buildBtn.innerHTML;
    buildBtn.disabled = true;
    buildBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Kuruluyor…';

    var token = csrfToken();
    fetch(window.bnpConfig.menuStoreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': token },
      body: JSON.stringify({ name: name, subtitle: null }),
    })
      .then(function (res) {
        // 401/419 = oturum/CSRF düşmüş; kullanıcıya "tekrar dene" demek
        // yanlış yönlendirir, sayfayı yenilemesi gerekiyor.
        if (res.status === 401 || res.status === 419) throw new Error('oturum');
        if (!res.ok) throw new Error('store');
        return res.json();
      })
      .then(function (menu) {
        var chain = tray.items.reduce(function (p, item) {
          return p.then(function () {
            var url = window.bnpConfig.menuAttachUrlTemplate
              .replace('__MENU__', menu.id)
              .replace('__RECIPE__', item.slug);
            return fetch(url, { method: 'POST', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': token } });
          });
        }, Promise.resolve());

        // Kurulan menü "Menü Çıktısı" ekranında açılır — kap sıralarının
        // düzenlendiği ve "Menüyü Pişir"e geçilen ekran bu (FB39-a, görev #88).
        // ÖNCEDEN `profileMenusUrl`e (çıplak `/mutfak-defterim`) gidiliyordu;
        // `SeflerController::own()` orayı `/sefler/{username}`e 302'liyor, yani
        // kullanıcı kurduğu menü yerine herkese açık şef profiline düşüyordu
        // (canlı erişim log'unda 2026-08-09 19:13–19:14 UTC arası üç kez birebir
        // tekrar etti). Hazır-menü yolu zaten bu ekrana gidiyor — iki yol birleşti.
        return chain.then(function () {
          // 🔴 ÖNCEDEN JSON UCUNA GİDİYORDU (2026-08-22 düzeltmesi).
          // `menuShowUrlTemplate` = bnp.menu.show, JsonResponse döndüren bir
          // AJAX ucu; tarayıcıyı oraya sürünce kullanıcı Menü Çıktısı ekranı
          // yerine ham JSON görüyordu (canlı şikâyet: /bugun-ne-pisirsem/menu/13).
          // Ekranın gezilebilir adresi `?menu=ID` — openMenuFromQueryParam onu
          // okuyup aynı paneli açıyor, Mutfak Defteri kartlarının yolu da bu.
          window.location.href = window.bnpConfig.menuDeepLinkTemplate.replace('__MENU__', menu.id);
        });
      })
      .catch(function (err) {
        // 🔴 ÖNCEDEN SESSİZDİ (2026-08-22 düzeltmesi). Hata yutuluyor,
        // düğme eski hâline dönüyordu: kullanıcı "Kuruluyor…" görüp sonra
        // hiçbir şey olmadığını görüyordu — sunucuda hata OLMASA bile
        // (ör. oturum düşmüş, ağ kesilmiş) bu "patladı" gibi okunuyor.
        buildBtn.disabled = false;
        buildBtn.innerHTML = originalLabel;
        bnpBildir(
          String(err && err.message) === 'oturum'
            ? 'Oturumun sona ermiş görünüyor. Sayfayı yenileyip tekrar dene.'
            : 'Menü kurulamadı. Lütfen tekrar dene.'
        );
      });
  }

  /* ===================== MENÜ ÇIKTISI (course-slot düzenleme) ===================== */
  function initMenuDetail() {
    var detail = document.getElementById('menuDetail');
    if (!detail) return;

    var mdSet = document.getElementById('mdSet');
    var mdMeta = document.getElementById('mdMeta');
    var mdTitleText = document.getElementById('mdTitleText');
    var browsePanes = ['bnpSubtabs', 'subKur', 'subHazir'];
    var current = null; // son fetch edilen menü JSON'u

    /* Menü paneli açıkken ARAMA/KURMA yüzeyleri gizlenir. Beyar 2026-08-23:
       liste eskiden yalnız alt sekmelerdi — mod rayı, "20 yemek modu" ipucu ve
       seçili modun açıklaması menünün ÜSTÜNDE durmaya devam ediyordu; menü
       kurulduktan sonra tekrar mod seçtirmenin anlamı yok.
       `hidden` yerine kapsayıcıya sınıf: .mode-desc görünürlüğünü `.show`
       sınıfıyla (display) yönetiyor, `hidden` özniteliğini ezerdi. Sınıflı
       kural (0,3,0) o `.show`u (0,2,0) yener. */
    var browseScope = detail.parentElement;

    function browseEls(show) {
      browsePanes.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.hidden = !show;
      });
      if (browseScope) browseScope.classList.toggle('menu-detail-open', !show);
    }

    function courseIcon(key) {
      var map = current && current.course_options ? current.course_options[key] : null;
      return map ? map.icon : 'fa-utensils';
    }

    /* Dört olgulu şerit (Beyar 2026-08-23) — /tarifler kartının .r-facts
       kalemleri: süre · zorluk · porsiyon · bütçe. Menü panelindeki üç kart
       yüzeyi (kap kartı, havuz kartı, sihirbaz kartı) artık aynı şeyi söyler.
       Metin .rf-txt kutusunda: ellipsis flex kapsayıcıda NO-OP'tur. */
    function factsHtml(row) {
      var html = '';
      if (row.total_time_min) {
        html += '<span><i class="fa-solid fa-clock" aria-hidden="true"></i> <span class="rf-txt">' + row.total_time_min + ' dk</span></span>';
      }
      if (row.difficulty) {
        html += '<span><i class="fa-solid fa-gauge-simple" aria-hidden="true"></i> <span class="rf-txt">' + bnpEsc(row.difficulty) + '</span></span>';
      }
      if (row.servings_label) {
        html += '<span><i class="fa-solid fa-utensils" aria-hidden="true"></i> <span class="rf-txt">' + bnpEsc(row.servings_label) + '</span></span>';
      }
      if (row.cost_tier) {
        html += '<span class="r-cost" title="' + bnpEsc(row.cost_label || '') + '">';
        for (var c = 1; c <= 3; c++) {
          html += '<b class="' + (c <= row.cost_tier ? 'rc-on' : 'rc-off') + '">₺</b>';
        }
        html += '</span>';
      }
      return html;
    }

    function courseCardHtml(course, i, total) {
      /* Yazar satırı (.mc-foot) BİLİNÇLİ kaldırıldı — menü düzenleme ekranında
         soru "bu kap ne", "kim yazmış" değil; sunucu da artık 'author'
         göndermiyor (MenuDetailController::present). */
      return '' +
        '<article class="menu-card" data-recipe-id="' + course.recipe_id + '">' +
        '<div class="mc-course"><i class="fa-solid ' + courseIcon(course.course_key) + '" aria-hidden="true"></i> ' + course.course_label +
        ' <span class="mc-step">' + (i + 1) + ' / ' + total + '</span></div>' +
        '<div class="mc-media-wrap"><div class="mc-media" style="background-image:url(\'' + (course.cover || '') + '\')"></div></div>' +
        '<div class="mc-body"><h3><a href="' + course.url + '">' + bnpEsc(course.title) + '</a></h3>' +
        '<div class="mc-facts">' + factsHtml(course) + '</div>' +
        '</div>' +
        /* data-swap/data-remove DEĞERİ recipe SLUG'ı taşır — bnp.menu.courses.
         * swap/remove route'ları {recipe:slug} bağlı (menus.recipes.attach/
         * detach emsali), sayısal id GEÇERSİZ olurdu. */
        '<div class="mc-actions"><button class="mc-act swap" type="button" data-swap="' + course.recipe_slug + '" data-course="' + course.course_key + '"><i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i> Değiştir</button>' +
        '<button class="mc-act remove" type="button" data-remove="' + course.recipe_slug + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i> Çıkar</button></div>' +
        '</article>';
    }

    function render(data) {
      current = data;
      mdTitleText.textContent = data.name;
      mdSet.innerHTML = '';
      var total = data.courses.length;
      data.courses.forEach(function (c, i) { mdSet.insertAdjacentHTML('beforeend', courseCardHtml(c, i, total)); });

      var add = document.createElement('div');
      add.className = 'mc-add';
      add.setAttribute('role', 'button');
      add.setAttribute('tabindex', '0');
      var pickBtns = Object.keys(data.course_options || {}).map(function (key) {
        return '<button type="button" data-add="' + key + '">' + data.course_options[key].label + '</button>';
      }).join('');
      add.innerHTML = '<div class="mca-ico"><i class="fa-solid fa-plus" aria-hidden="true"></i></div><div>Kap Ekle</div><small>tarif havuzundan bir tarif seç</small><div class="mc-add-pick">' + pickBtns + '</div>';
      mdSet.appendChild(add);

      mdMeta.innerHTML = '<div class="mbm"><i class="fa-solid fa-utensils" aria-hidden="true"></i><span><b>' + total + ' kap</b><span>' +
        data.courses.map(function (c) { return c.course_label; }).join(' · ') + '</span></span></div>' +
        '<div class="mbm"><i class="fa-solid fa-clock" aria-hidden="true"></i><span><b>~' + data.total_minutes + ' dk</b><span>Toplam hazırlık</span></span></div>';

      mdSet.querySelectorAll('[data-swap]').forEach(function (b) {
        b.addEventListener('click', function () { openPicker('swap', b.getAttribute('data-course'), b.getAttribute('data-swap')); });
      });
      mdSet.querySelectorAll('[data-remove]').forEach(function (b) {
        b.addEventListener('click', function () { removeCourse(b.getAttribute('data-remove')); });
      });
      add.querySelectorAll('[data-add]').forEach(function (b) {
        b.addEventListener('click', function (e) { e.stopPropagation(); openPicker('add', b.getAttribute('data-add'), null); });
      });

      var mdCook = document.getElementById('mdCook');
      if (mdCook) mdCook.setAttribute('data-menu-id', data.id);
    }

    function showDetail(data) {
      render(data);
      browseEls(false);
      detail.hidden = false;
      detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function closeDetail() {
      detail.hidden = true;
      browseEls(true);
    }

    function refresh(menuId) {
      return fetch(window.bnpConfig.menuShowUrlTemplate.replace('__MENU__', menuId), {
        headers: { Accept: 'application/json' },
      }).then(function (r) { return r.json(); }).then(function (data) { render(data); return data; });
    }

    /* "Menülere dön" düğmesi kaldırıldı (Beyar 2026-08-23) — geri dönüş
       zaten üst sekmeler/menü çubuğu üzerinden var. closeDetail KORUNUYOR:
       başka akışlar (menü silme/yeniden kurma) hâlâ çağırıyor. */
    var mdBack = document.getElementById('mdBack');
    if (mdBack) mdBack.addEventListener('click', closeDetail);

    document.querySelectorAll('.hm-card[data-hm-set]').forEach(function (card) {
      card.addEventListener('click', function () {
        if (!isAuth()) { openLoginGate(card.dataset.lgTitle, card.dataset.lgDesc); return; }
        var setId = card.getAttribute('data-hm-set');
        fetch(window.bnpConfig.menuFromCuratedSetUrlTemplate.replace('__SET__', setId), {
          method: 'POST',
          headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
        })
          .then(function (r) { return r.json(); })
          .then(function (data) { showDetail(data); })
          .catch(function () {});
      });
    });

    function removeCourse(recipeId) {
      if (!current) return;
      fetch(window.bnpConfig.menuCourseRemoveUrlTemplate.replace('__MENU__', current.id).replace('__RECIPE__', recipeId), {
        method: 'DELETE',
        headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      })
        .then(function (r) { return r.json(); })
        .then(function (data) { render(data); })
        .catch(function () {});
    }

    /* ---- TARİF HAVUZU (kap ekle/değiştir popup) ---- */
    var rpOverlay = document.getElementById('rpOverlay');
    var rpModal = document.getElementById('rpModal');
    var rpClose = document.getElementById('rpClose');
    var rpSearch = document.getElementById('rpSearch');
    var rpGrid = document.getElementById('rpGrid');
    var rpState = { action: 'add', courseKey: null, oldRecipeId: null, q: '' };

    function openPicker(action, courseKey, oldRecipeId) {
      rpState.action = action;
      rpState.courseKey = courseKey;
      rpState.oldRecipeId = oldRecipeId;
      rpState.q = '';
      if (rpSearch) rpSearch.value = '';
      rpOverlay.classList.add('show');
      rpModal.classList.add('show');
      document.body.style.overflow = 'hidden';
      renderPool();
    }

    function closePicker() {
      rpOverlay.classList.remove('show');
      rpModal.classList.remove('show');
      document.body.style.overflow = '';
    }

    function poolCardHtml(recipe) {
      return '' +
        '<article class="rp-card" data-recipe-id="' + recipe.id + '">' +
        '<div class="rp-fig" style="background-image:url(\'' + (recipe.cover || '') + '\')"></div>' +
        '<div class="rp-info"><h4>' + bnpEsc(recipe.title) + '</h4>' +
        '<div class="rp-meta">' + factsHtml(recipe) + '</div>' +
        '<button class="rp-add-btn" type="button" data-pick="' + recipe.id + '"><i class="fa-solid fa-plus" aria-hidden="true"></i> Ekle</button>' +
        '</div></article>';
    }

    function renderPool() {
      if (!current) return;
      var url = window.bnpConfig.menuPoolUrlTemplate.replace('__MENU__', current.id) + '?course_key=' + encodeURIComponent(rpState.courseKey) + (rpState.q ? '&q=' + encodeURIComponent(rpState.q) : '');
      fetch(url, { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.results.length) {
            rpGrid.innerHTML = '<div class="rp-empty"><i class="fa-solid fa-bowl-rice" aria-hidden="true"></i><p>Bu kap türünde uygun tarif bulunamadı.</p></div>';
            return;
          }
          rpGrid.innerHTML = data.results.map(poolCardHtml).join('');
          rpGrid.querySelectorAll('[data-pick]').forEach(function (btn) {
            btn.addEventListener('click', function () { pick(btn.getAttribute('data-pick'), btn); });
          });
        });
    }

    function pick(recipeId, btn) {
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>'; }
      var token = csrfToken();
      var request = rpState.action === 'swap'
        ? fetch(window.bnpConfig.menuCourseSwapUrlTemplate.replace('__MENU__', current.id).replace('__RECIPE__', rpState.oldRecipeId), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': token },
          body: JSON.stringify({ recipe_id: recipeId }),
        })
        : fetch(window.bnpConfig.menuCourseAddUrlTemplate.replace('__MENU__', current.id), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': token },
          body: JSON.stringify({ course_key: rpState.courseKey, recipe_id: recipeId }),
        });

      request.then(function (r) { return r.json(); }).then(function (data) { render(data); closePicker(); }).catch(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i> Ekle'; }
      });
    }

    if (rpClose) rpClose.addEventListener('click', closePicker);
    if (rpOverlay) rpOverlay.addEventListener('click', closePicker);
    if (rpSearch) {
      var searchTimer;
      rpSearch.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () { rpState.q = rpSearch.value.trim(); renderPool(); }, 250);
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && rpModal.classList.contains('show')) closePicker();
    });

    /* ---- YENİDEN ADLANDIR ---- */
    var mdHead = document.getElementById('mdHead');
    var mdRenameBox = document.getElementById('mdRenameBox');
    var mdRenameInput = document.getElementById('mdRenameInput');

    function openRename() {
      mdRenameInput.value = current ? current.name : '';
      mdHead.classList.add('editing');
      mdRenameBox.classList.add('show');
      mdRenameInput.focus();
    }
    function closeRename() {
      mdHead.classList.remove('editing');
      mdRenameBox.classList.remove('show');
    }
    function saveRename() {
      var name = mdRenameInput.value.trim();
      if (!name || !current) return;
      fetch(window.bnpConfig.menuUpdateUrlTemplate.replace('__MENU__', current.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
        body: JSON.stringify({ name: name }),
      })
        .then(function () { return refresh(current.id); })
        .then(closeRename)
        .catch(function () {});
    }

    var mdTitlePen = document.getElementById('mdTitlePen');
    if (mdTitlePen) mdTitlePen.addEventListener('click', openRename);
    var mdRenameSave = document.getElementById('mdRenameSave');
    if (mdRenameSave) mdRenameSave.addEventListener('click', saveRename);
    var mdRenameCancel = document.getElementById('mdRenameCancel');
    if (mdRenameCancel) mdRenameCancel.addEventListener('click', closeRename);

    var mdSave = document.getElementById('mdSave');
    if (mdSave) mdSave.addEventListener('click', function () {
      mdSave.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Kaydedildi';
      setTimeout(function () { mdSave.innerHTML = '<i class="fa-regular fa-bookmark" aria-hidden="true"></i> Deftere Kaydet'; }, 1600);
    });

    window.__bnpOpenMenuDetail = showDetail;
    window.__bnpCurrentMenu = function () { return current; };

    /* Revize-5 madde 7: Mutfak Defteri "Menüleri" kartı gerçek <a href="?menu=ID">
     * olarak buraya yönlendiriyor (bkz. sefler/_menu-card.blade.php). Sayfa
     * açılışında ?menu= okunur, bnp.menu.show'dan gerçek veri çekilir ve panel
     * showDetail ile açılır — Beyar kararı: Seçenek 1 (JS query param okusun),
     * MenuBuilderController'a DOKUNULMADI. Sahiplik kontrolü sunucu tarafında
     * (MenuDetailController::authorizeOwner) zaten var; 403/401/302 burada
     * SESSİZCE yutulur — kullanıcı normal BNP sayfasını görmeye devam eder.
     * #menuDetail, varsayılan sekme "Tarif Ara" olduğu için gizli
     * .bnp-pane[data-pane="modlar"] içinde yaşıyor (initTopTabs) — yalnız
     * showDetail çağırmak paneli GÖRÜNMEZ bırakır (üst sekme hâlâ kapalı);
     * önce "Yemek Modu" sekmesi gerçek tıklamayla açılır (initTopTabs'in
     * kendi mantığı tekrar edilmez, mevcut buton tıklanır). */
    function openMenuFromQueryParam() {
      var menuId = new URLSearchParams(window.location.search).get('menu');
      if (!menuId || !/^\d+$/.test(menuId)) return;
      fetch(window.bnpConfig.menuShowUrlTemplate.replace('__MENU__', menuId), {
        headers: { Accept: 'application/json' },
      })
        .then(function (res) {
          if (!res.ok) throw new Error('bnp-menu-show-http-' + res.status);
          return res.json();
        })
        .then(function (data) {
          var modeTabBtn = document.querySelector('.bnp-tabwrap .dt[data-tab="modlar"]');
          if (modeTabBtn) modeTabBtn.click();
          showDetail(data);
        })
        .catch(function () {});
    }

    openMenuFromQueryParam();
  }

  /* ===================== MENÜYÜ PİŞİR (cooking-session, FB39-a/FB42) ===================== */
  function initCookmode() {
    var cm = document.getElementById('cookmode');
    if (!cm) return;

    var cmInner = document.getElementById('cmInner');
    var cmCount = document.getElementById('cmCount');
    var cmBar = document.getElementById('cmBar');
    var cmRail = document.getElementById('cmRail');
    var cmPrev = document.getElementById('cmPrev');
    var cmNext = document.getElementById('cmNext');
    var cmName = document.getElementById('cmMenuName');
    var cmTimer = document.getElementById('cmTimer');
    var ctTime = document.getElementById('ctTime');
    var ctStartBtn = document.getElementById('ctStart');

    var session = null;
    var tLeft = 0, tInt = null, tRun = false;

    function ctFmt(s) { var m = Math.floor(s / 60), x = s % 60; return (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; }
    function ctRender() { ctTime.textContent = ctFmt(Math.max(0, tLeft)); }
    function ctStop() { tRun = false; clearInterval(tInt); tInt = null; ctStartBtn.querySelector('i').className = 'fa-solid fa-play'; cmTimer.classList.remove('running'); }
    function ctLoad(min) { ctStop(); tLeft = (min || 0) * 60; ctRender(); }
    ctStartBtn.addEventListener('click', function () {
      if (tRun) { ctStop(); return; }
      if (tLeft <= 0) return;
      tRun = true; cmTimer.classList.add('running');
      ctStartBtn.querySelector('i').className = 'fa-solid fa-pause';
      tInt = setInterval(function () { tLeft--; ctRender(); if (tLeft <= 0) ctStop(); }, 1000);
    });

    function dishesFromPlan() { return session ? session.dish_plan : []; }

    function renderRail() {
      var dishes = dishesFromPlan();
      cmRail.innerHTML = dishes.map(function (d, i) {
        return '<button type="button" class="cm-chip" data-di="' + i + '"><span class="cc-n"><span>' + (i + 1) + '</span><i class="fa-solid fa-check" aria-hidden="true"></i></span>' + d.name + '</button>';
      }).join('');
    }

    /* Not: örgüde (buildWeave) bir kap pasif adımında araya girilip sonra
     * geri dönülebildiği için "index < aktif" tam bitmiş anlamına gelmez —
     * yanıltıcı "done" işaretlemesi YAPILMAZ, yalnız aktif kap vurgulanır. */
    function updateRailState() {
      var step = session.current_step;
      var activeDish = step ? step.dish_index : -1;
      [].forEach.call(cmRail.children, function (chip, i) {
        chip.className = 'cm-chip' + (i === activeDish ? ' on' : '');
      });
    }

    function reorder(body) {
      return fetch(window.bnpConfig.cookingReorderUrlTemplate.replace('__SESSION__', session.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
        body: JSON.stringify(body),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) { session = data; renderPlan(); })
        .catch(function () {});
    }

    function renderPlan() {
      var dishes = dishesFromPlan();
      var orderCustom = dishes.length > 0 && !!dishes[0].order_custom;
      var span = dishes.reduce(function (m, d) { return Math.max(m, d.start_minutes + d.lead_minutes); }, 0) || 1;
      // M1b: dakika işaretleri — en fazla ~6 tick verecek akıllı adım seç (reference VERBATIM).
      var tickStep = [10, 15, 20, 30, 60].filter(function (s) { return span / s <= 6; })[0] || 60;
      var ticks = [];
      for (var tt = tickStep; tt < span * 0.94; tt += tickStep) ticks.push(tt);
      var tickHtml = ticks.map(function (t) { return '<i class="cp-tick" style="left:' + (t / span * 100).toFixed(1) + '%"></i>'; }).join('');
      var ruler = '<div class="cp-ruler">' + ticks.map(function (t) { return '<span style="left:' + (t / span * 100).toFixed(1) + '%">' + t + ' dk</span>'; }).join('') + '</div>';

      var rows = dishes.map(function (d, i) {
        var l = Math.round(d.start_minutes / span * 100);
        var wCook = Math.max(Math.round(d.minutes / span * 100), 4);
        var wRest = d.rest_minutes ? Math.max(Math.round(d.rest_minutes / span * 100), 0) : 0;
        var badge = orderCustom
          ? '<span class="cp-badge">' + (i + 1) + '. sıra</span>'
          : (i === 0 ? '<span class="cp-badge first">İlk başlar</span>' : (i === dishes.length - 1 ? '<span class="cp-badge last">En son</span>' : '<span class="cp-badge">' + (i + 1) + '. sırada</span>'));
        var mv = '<span class="cp-mv">' +
          '<button type="button" data-mv="up" data-i="' + i + '" aria-label="' + d.name + ' bir üst sıraya taşı"' + (i === 0 ? ' disabled' : '') + '><i class="fa-solid fa-chevron-up" aria-hidden="true"></i></button>' +
          '<button type="button" data-mv="down" data-i="' + i + '" aria-label="' + d.name + ' bir alt sıraya taşı"' + (i === dishes.length - 1 ? ' disabled' : '') + '><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button></span>';
        return '<div class="cp-row"><div class="cp-lbl">' + mv + '<b>' + (i + 1) + '. ' + d.name + ' ' + badge + '</b><small>' + d.course_label + ' · ~' + d.minutes + ' dk' + (d.rest_minutes ? ' + ~' + d.rest_minutes + ' dk bekleme' : '') + '</small><small class="cp-why">' + d.why + '</small></div>' +
          '<div class="cp-track">' + tickHtml + '<span class="cp-seg cook" style="left:' + l + '%;width:' + wCook + '%">' + (wCook >= 12 ? '<em>' + d.minutes + ' dk</em>' : '') + '</span>' +
          (wRest ? '<span class="cp-seg rest" style="left:' + Math.min(l + wCook, 97) + '%;width:' + wRest + '%">' + (wRest >= 12 ? '<em>' + d.rest_minutes + ' dk</em>' : '') + '</span>' : '') + '</div></div>';
      }).join('');
      cmInner.innerHTML = '<div class="cm-plan">' +
        '<div class="cm-dishhead"><span class="cdh-tag"><i class="fa-solid fa-chess-board" aria-hidden="true"></i> Pişirme Planı</span><span class="cdh-meta">' + dishes.length + ' kap · ' + (orderCustom ? 'özel sıra' : 'tek servis anı') + '</span>' +
        (orderCustom ? '<button type="button" class="cp-reset" id="cpReset"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Önerilen sıraya dön</button>' : '') + '</div>' +
        '<h2>' + (orderCustom ? 'Sıra sende — planı senin dizilişine kurduk' : 'Sofra tek seferde kurulacak şekilde sıraladık') + '</h2>' +
        '<p class="cp-lead">' + (orderCustom
          ? 'Kaplar senin dizilişinle yola çıkar, fırın/kaynama beklemelerinde diğer kapların adımları yine araya girer.'
          : 'Uzun pişen ve soğuması gereken kaplar önce başlar; tazeliği önemli kaplar en sona kalır. Toplam ~' + span + ' dakikalık bir akış.') + '</p>' +
        '<div class="cp-list">' + rows + '</div>' +
        ruler +
        '<div class="cp-axis"><span>İlk tencere ocakta · 0 dk</span><span>Servis · ~' + span + ' dk</span></div>' +
        '<div class="cp-legend"><span><i class="lg-cook"></i> Aktif pişirme</span><span><i class="lg-rest"></i> Bekleme / soğuma / dinlenme</span></div>' +
        '</div>';
      cmInner.querySelectorAll('.cp-mv button').forEach(function (b) {
        b.addEventListener('click', function () {
          reorder({ action: 'move', dish_index: Number(b.getAttribute('data-i')), direction: b.getAttribute('data-mv') });
        });
      });
      var resetBtn = document.getElementById('cpReset');
      if (resetBtn) resetBtn.addEventListener('click', function () { reorder({ action: 'reset' }); });
      cmCount.textContent = 'Plan';
      cmBar.style.width = '0%';
      [].forEach.call(cmRail.children, function (c) { c.className = 'cm-chip'; });
      cmPrev.disabled = true;
      cmNext.innerHTML = 'Pişirmeye Başla <i class="fa-solid fa-fire-burner" aria-hidden="true"></i>';
      cmTimer.style.display = 'none';
    }

    function renderStep() {
      var step = session.current_step;
      var dishes = dishesFromPlan();
      if (!step) return;
      var tipText = step.is_passive
        ? 'Bu adım kendiliğinden ilerliyor — sayacı kur, beklerken sıradaki kabın işine geçebilirsin.'
        : 'Adımı tamamlayınca sayacı durdurup sıradaki adıma geç.';
      cmInner.innerHTML =
        '<div class="cm-dishhead">' +
        '<span class="cdh-tag"><i class="fa-solid fa-fire-burner" aria-hidden="true"></i> ' + (step.dish_index + 1) + '. Kap / ' + dishes.length + '</span>' +
        '<span class="cdh-name">' + step.dish_name + '</span>' +
        '<span class="cdh-meta">' + step.course_label + (step.is_passive ? ' · <i class="fa-regular fa-hourglass-half" aria-hidden="true"></i> beklemeli adım' : '') + '</span>' +
        '</div>' +
        (step.note ? '<p class="cm-ranknote">' + step.note + '</p>' : '') +
        '<div class="cm-stepbar"><span class="csb-lbl">Adım ' + step.step_number + ' / ' + step.step_count + '</span>' +
        '<span class="csb-dots">' + Array.apply(null, { length: step.step_count }).map(function (_, si) {
          return '<i class="' + (si === step.step_number - 1 ? 'on' : (si < step.step_number - 1 ? 'done' : '')) + '"></i>';
        }).join('') + '</span></div>' +
        '<div class="cm-num"><span class="cm-num__n">' + step.step_number + '</span>' + (step.duration_min ? '<span class="cm-num__time">~' + step.duration_min + ' dk</span>' : '') + '</div>' +
        '<h2>' + (step.title || '') + '</h2>' +
        '<p class="cm-text">' + step.body + '</p>' +
        '<div class="cm-tip"><i class="fa-solid fa-lightbulb" aria-hidden="true"></i> <span>' + tipText + '</span></div>';
      cmCount.textContent = 'Yemek ' + (step.dish_index + 1) + ' / ' + dishes.length;
      cmBar.style.width = session.progress_percent + '%';
      updateRailState();
      var onChip = cmRail.children[step.dish_index];
      if (onChip && onChip.scrollIntoView) onChip.scrollIntoView({ block: 'nearest', inline: 'center' });
      cmPrev.disabled = false;
      cmNext.innerHTML = (session.current_index >= session.total_steps) ? 'Menüyü Bitir <i class="fa-solid fa-flag-checkered" aria-hidden="true"></i>' : 'Sonraki Adım <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>';
      cmTimer.style.display = '';
      ctLoad(step.duration_min);
    }

    function renderDone() {
      ctStop();
      var dishes = dishesFromPlan();
      cmInner.innerHTML = '<div class="cm-done"><div class="cd-ico"><i class="fa-solid fa-champagne-glasses" aria-hidden="true"></i></div>' +
        '<h2>Menü tamamlandı, afiyet olsun!</h2>' +
        '<p>“' + session.menu_name + '” menüsündeki ' + dishes.length + ' kabı adım adım pişirdin. Sofranı kur, keyfini çıkar.</p>' +
        '<div class="cd-list">' + dishes.map(function (d) { return '<div class="cd-row"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> ' + d.name + '</div>'; }).join('') + '</div>' +
        '<div class="cd-acts"><a class="btn btn-primary" href="' + window.bnpConfig.profileMenusUrl + '?tab=menuler"><i class="fa-regular fa-bookmark" aria-hidden="true"></i> Menülerime Git</a>' +
        '<button class="btn btn-ghost" type="button" id="cmDoneClose"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Kapat</button></div></div>';
      cmCount.textContent = 'Tamamlandı';
      cmBar.style.width = '100%';
      [].forEach.call(cmRail.children, function (c) { c.className = 'cm-chip done'; });
      cmTimer.style.display = 'none';
      cmNext.style.display = 'none';
      document.getElementById('cmDoneClose').addEventListener('click', close);
    }

    function renderPhase() {
      cmNext.style.display = '';
      if (session.phase === 'done') { renderDone(); return; }
      if (session.phase === 'plan') { renderPlan(); return; }
      renderStep();
    }

    function advance(direction) {
      fetch(window.bnpConfig.cookingAdvanceUrlTemplate.replace('__SESSION__', session.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
        body: JSON.stringify({ direction: direction }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) { session = data; renderPhase(); })
        .catch(function () {});
    }

    function open(menuId) {
      fetch(window.bnpConfig.cookingStartUrlTemplate.replace('__MENU__', menuId), {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          session = data;
          cmName.textContent = session.menu_name;
          renderRail();
          // tokens.css'teki .cookmode[hidden] kuralı GÖRÜNÜRLÜĞÜ hidden
          // ATTRIBUTE'una bağlıyor (referansın .open class + opacity/
          // visibility geçişi DEĞİL) — kapalıyken hidden olmazsa fixed
          // overlay tüm sayfanın tıklamalarını yutar (FB39-a QA click-
          // through bulgusu, kritik bug, düzeltildi).
          cm.hidden = false;
          cm.classList.add('open');
          document.body.style.overflow = 'hidden';
          renderPhase();
        })
        .catch(function () {});
    }

    function close() {
      cm.hidden = true;
      cm.classList.remove('open');
      document.body.style.overflow = '';
      ctStop();
    }

    var cookBtn = document.getElementById('mdCook');
    if (cookBtn) cookBtn.addEventListener('click', function () {
      var menuId = cookBtn.getAttribute('data-menu-id');
      if (menuId) open(menuId);
    });
    document.getElementById('cmClose').addEventListener('click', close);
    cmPrev.addEventListener('click', function () { advance('prev'); });
    cmNext.addEventListener('click', function () { advance('next'); });
    document.addEventListener('keydown', function (e) {
      if (!cm.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') advance('next');
      if (e.key === 'ArrowLeft') advance('prev');
    });
  }

  initTabStateGuard();
  initTopTabs();
  initModeRail();
  initModeSelect();
  initSubtabs();
  initWizard();
  initScratchFilter();
  initTray();
  initMenuDetail();
  initCookmode();
})();
