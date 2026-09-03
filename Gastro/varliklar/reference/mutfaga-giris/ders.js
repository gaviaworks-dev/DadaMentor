/* Mutfağa Giriş ders detayı — P1 EKLERİ (mutfaga-giris-plan.md §6 pub-detail):
   §10.11 Mini Test gönderimi (content.lesson.test) + §10.12 Dersi Tamamla
   (content.lesson.tamamla). İkisi de yalnız @auth altında render edildiği
   için (bkz. _quiz.blade.php/_complete.blade.php) burada misafir dallanması
   YOK — csrf-token deseni ui.js bindEngagementToggles() ile AYNI. */

/* MİNİ TEST BLOĞU KALDIRILDI (2026-08-08).
   Ders içi mini test yüzeyi sayfadan kalktı; sorular kurs sonu testinin
   soru havuzuna taşındı (CourseQuizService) ve o test bir SUNUCU-RENDER
   sihirbazıdır — adım değiştirmek için istemci JS'i gerekmez, cevap
   anahtarı da istemciye hiç inmez. Bu yüzden buradaki ~190 satırlık akış
   motorunun karşılığı yok, yorum satırına alınmadı, SİLİNDİ.
   `content.lesson.test` ucu ve `lesson_quiz_attempts` tablosu yerinde
   duruyor (geçmiş denemeler korunur), yalnız bu sayfadan çağıran kalmadı. */

/* §5.4 KURS İÇERİĞİ AKORDEONU (egitim-detay-revizyon.md talimat 4/6, §7
   "Accordion") — B11 turunun müfredat akordeonu mekanizması KORUNDU, yalnız
   seçiciler yeni bölüm/ders ağacına taşındı (.cur-* → .crs-*). Toggle deseni
   hâlâ sss.js'in .qa/.qa-head/.qa-body max-height okuması.

   İKİ toggle seviyesi:
     · .crs-sec       → bölüm (her zaman)
     · .crs-row-locked → Pro satırının satır-içi bilgilendirmesi
   AÇILABİLİR ders satırı bir <a>'dır (doğrudan derse gider) — toggle DEĞİL.

   §7: bölümler ayrı ayrı açılıp kapanır (tek-açık kısıtı YOK), aktif bölüm
   görsel olarak ayırt edilir (.is-current satırı + açık başlar), başlıklar
   gerçek <button> olduğu için klavye/ekran okuyucu erişimi hazır. */
(function () {
  var list = document.getElementById('crsList');
  if (!list) return;

  function openPanel(toggle, panel) {
    toggle.closest('.crs-sec, .crs-row').classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    panel.style.maxHeight = panel.scrollHeight + 'px';
    // Geçiş bitince sınırı KALDIR: içeride bir satır sonradan genişlerse
    // (Pro bilgilendirmesi) sabit max-height onu KIRPIYORDU — butonun yarısı
    // görünmüyordu (Beyar bulgusu 2026-07-31).
    panel.addEventListener('transitionend', function done(e) {
      if (e.propertyName !== 'max-height') return;
      panel.removeEventListener('transitionend', done);
      if (panel.parentElement.classList.contains('open')) panel.style.maxHeight = 'none';
    });
  }
  function closePanel(toggle, panel) {
    toggle.closest('.crs-sec, .crs-row').classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    // max-height 'none' iken doğrudan 0'a geçiş animasyonu çalışmaz —
    // önce ölçülen yüksekliğe sabitlenir, sonra kapatılır.
    panel.style.maxHeight = panel.scrollHeight + 'px';
    void panel.offsetHeight;
    panel.style.maxHeight = '0px';
  }
  // Pro geçiş bloğu açılışta gizli (Beyar 2026-07-31): kullanıcı müfredatla
  // ETKİLEŞİME girdiğinde — yani bir bölümü ilk kez genişlettiğinde — ortaya
  // çıkar. Sayfa açılır açılmaz üst satış göstermemek için.
  var proBlock = document.querySelector('[data-crs-pro]');
  function revealPro() {
    if (!proBlock || !proBlock.hidden) return;
    proBlock.hidden = false;
    // Yumuşak giriş — ani sıçrama olmasın.
    requestAnimationFrame(function () { proBlock.classList.add('is-in'); });
  }

  function bindToggle(head, panel) {
    head.addEventListener('click', function () {
      var host = head.closest('.crs-sec, .crs-row');
      if (host.classList.contains('open')) {
        closePanel(head, panel);
      } else {
        openPanel(head, panel);
        // Pro bloğu yalnız KİLİTLİ bir derse dokunulunca açılır (Beyar
        // 2026-07-31): her bölüm açılışında görünmesi erken ve rahatsızdı.
        if (host.classList.contains('crs-row-locked')) revealPro();
      }
      // NOT: burada eskiden dış .crs-sec-body yeniden ÖLÇÜLÜP sabit px'e
      // yazılıyordu. Bu, açılış geçişi bitince konan max-height:none'ı GERİ
      // EZİYOR ve üstelik satır daha genişlemeden ölçtüğü için Pro
      // bilgilendirmesinin butonunu kırpıyordu (Beyar bulgusu 2026-07-31).
      // Açık panelin sınırı zaten kaldırıldığı için yeniden ölçüme gerek yok.
    });
  }

  list.querySelectorAll('.crs-sec').forEach(function (sec) {
    var head = sec.querySelector(':scope > .crs-sec-head');
    var body = sec.querySelector(':scope > .crs-sec-body');
    if (!head || !body) return;
    bindToggle(head, body);
    // İçinde bulunulan dersin bölümü sunucudan AÇIK gelir (has_current) —
    // max-height'ı ilk boyamada gerçek yüksekliğine kurulmalı.
    if (sec.classList.contains('open')) body.style.maxHeight = body.scrollHeight + 'px';
  });

  list.querySelectorAll('.crs-row-locked').forEach(function (row) {
    var head = row.querySelector('.crs-row-head');
    var panel = row.querySelector('.crs-row-body');
    if (head && panel) bindToggle(head, panel);
  });

  var expandAllBtn = document.getElementById('crsExpandAll');
  if (expandAllBtn) {
    expandAllBtn.addEventListener('click', function () {
      var allOpen = expandAllBtn.getAttribute('aria-pressed') === 'true';
      var label = expandAllBtn.querySelector('span');
      list.querySelectorAll('.crs-sec').forEach(function (sec) {
        var head = sec.querySelector(':scope > .crs-sec-head');
        var body = sec.querySelector(':scope > .crs-sec-body');
        if (!head || !body) return;
        if (allOpen) { closePanel(head, body); } else { openPanel(head, body); }
      });
      expandAllBtn.setAttribute('aria-pressed', allOpen ? 'false' : 'true');
      if (label) {
        label.textContent = allOpen ? label.getAttribute('data-label-collapsed') : label.getAttribute('data-label-expanded');
      }
    });
  }

  // Pencere yeniden boyutlanınca açık panellerin max-height'ı bayatlar
  // (metin sarması değişir) — yeniden ölçülür, yoksa içerik kırpılır.
  var raf;
  window.addEventListener('resize', function () {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      list.querySelectorAll('.crs-sec.open > .crs-sec-body, .crs-row.open > .crs-row-body').forEach(function (p) {
        p.style.maxHeight = p.scrollHeight + 'px';
      });
    });
  });
})();

/* "Bu Derste" panelinde okunan başlığı işaretler (karar: kararlar.md EDR-37).
   Konum kaydırmadan okunur, rAF ile karede bir kez kısılır; eşik başlıkların
   kendi scroll-margin-top'undan gelir (CSS ile tek kaynak). */
(function () {
  var card = document.querySelector('[data-chap-spy]');
  if (!card) return;

  var pairs = [];
  card.querySelectorAll('[data-chap-link]').forEach(function (a) {
    var h = document.getElementById(a.getAttribute('data-chap-link'));
    if (h) pairs.push({ a: a, h: h, id: a.getAttribute('data-chap-link') });
  });
  if (! pairs.length) return;

  // Tıklamadan sonra yumuşak kaydırma sürerken hesap ARA DEĞERLERİ boyamasın;
  // kullanıcı tıkladığı maddeyi ANINDA seçili görür. Süre bitince normal
  // konum hesabı devralır (ve eşik ayarı gereği aynı maddede karar kılar).
  var kilitBitis = 0;

  function esik() {
    var m = parseFloat(getComputedStyle(pairs[0].h).scrollMarginTop);
    return (isNaN(m) ? 108 : m) + 1; // +1px: eşiğe TAM oturan başlık geçmiş sayılsın
  }

  function isaretle(id) {
    pairs.forEach(function (p) { p.a.classList.toggle('is-reading', p.id === id); });
  }

  function hesapla() {
    if (Date.now() < kilitBitis) return;

    var y = esik();
    // Eşiği geçmiş SON başlık okunuyor demektir. Hiçbiri geçmediyse (sayfanın
    // en üstü, henüz gövdeye girilmedi) ilk bölüm "sıradaki" olarak işaretli
    // kalır — panelin hiçbir şey göstermemesi "bozuk" gibi okunuyordu.
    var aktif = pairs[0];
    pairs.forEach(function (p) { if (p.h.getBoundingClientRect().top <= y) aktif = p; });

    // Sayfa dibinde: son başlık eşiğin altında kalabilir (kaydıracak yer
    // bitmiştir), ama kullanıcı gerçekte son bölümdedir.
    var dip = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (dip) aktif = pairs[pairs.length - 1];

    isaretle(aktif.id);
  }

  var bekleyen = false;
  function kisilmisHesap() {
    if (bekleyen) return;
    bekleyen = true;
    window.requestAnimationFrame(function () { bekleyen = false; hesapla(); });
  }

  pairs.forEach(function (p) {
    p.a.addEventListener('click', function () {
      isaretle(p.id);           // anında geri bildirim (eski sürümün eksiği)
      kilitBitis = Date.now() + 800;
    });
  });

  window.addEventListener('scroll', kisilmisHesap, { passive: true });
  window.addEventListener('resize', kisilmisHesap);
  hesapla();                    // açılış durumu (eski sürümde hiç yoktu)
})();

/* §5.6/§5.7 SLIDER SÜRÜCÜSÜ (talimat 11-13) — YENİ KÜTÜPHANE YOK.
   Kaydırma native (`overflow-x:auto` + `scroll-snap`), yani mobil SWIPE
   kendiliğinden çalışır; bu kod yalnız ok butonlarını, uç durumlarını ve
   "gerekmiyorsa kontrolleri gizle" kuralını yönetir.

   KONTROLLERİN GİZLENMESİ (talimat 13 "Kart sayısı görünür sayıdan azsa
   kontroller gizlenir"): karar CSS kırılımından DEĞİL, gerçek taşma
   ölçümünden verilir — scrollWidth > clientWidth. Böylece kırılım
   eklendiğinde/kart genişliği değiştiğinde kural kendiliğinden doğru kalır.

   Otomatik geçiş YOK (§5.6) — kullanıcı kontrolü tek yol. */
(function () {
  var sliders = document.querySelectorAll('[data-sld]');
  if (!sliders.length) return;

  sliders.forEach(function (sld) {
    var track = sld.querySelector('.sld-track');
    var nav = sld.querySelector('[data-sld-nav]');
    if (!track || !nav) return;

    var prev = nav.querySelector('[data-sld-dir="prev"]');
    var next = nav.querySelector('[data-sld-dir="next"]');

    function step() {
      var card = track.firstElementChild;
      if (!card) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
      return card.getBoundingClientRect().width + gap;
    }

    function sync() {
      // Taşma yoksa slider'a gerek yok: kontroller gizlenir (talimat 13).
      var overflows = track.scrollWidth > track.clientWidth + 2;
      nav.hidden = !overflows;
      if (!overflows) return;
      var max = track.scrollWidth - track.clientWidth;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
    }

    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });

    track.addEventListener('scroll', function () { sync(); }, { passive: true });

    // Klavye erişimi (§7 "erişilebilir kontroller"): ray odaklıyken ok tuşları.
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });

    if (window.ResizeObserver) {
      new ResizeObserver(function () { sync(); }).observe(track);
    } else {
      window.addEventListener('resize', sync);
    }

    sync();
  });
})();

/* B9 — Etiket rayı okları + Paylaş popover'ı (gurme-lezzetler/show.blade.php
   satır 203-244 BİREBİR taşındı — "sayfa-JS davranışı da kaynak-transfer
   kapsamındadır" dersi, docs/lessons.md). */
(function () {
  document.querySelectorAll('.ptr .row-nav button').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = document.getElementById(b.getAttribute('data-track'));
      if (t) t.scrollBy({ left: b.getAttribute('data-dir') === 'prev' ? -220 : 220, behavior: 'smooth' });
    });
  });

  var sh = document.getElementById('ptrShare');
  if (sh) {
    var btn = document.getElementById('pshBtn');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var open = sh.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#ptrShare')) {
        sh.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    var cp = document.getElementById('pshCopy');
    if (cp) {
      cp.addEventListener('click', function (e) {
        e.preventDefault();
        var url = cp.getAttribute('data-copy') || location.href;
        try { navigator.clipboard.writeText(url); } catch (err) { /* pano erişimi yok — sessiz */ }
        cp.classList.add('ok');
        var icon = cp.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-check';
        setTimeout(function () {
          cp.classList.remove('ok');
          if (icon) icon.className = 'fa-solid fa-link';
        }, 1500);
      });
    }
  }
})();

/* OTOMATİK DERS TAMAMLAMA (2026-08-08).

   "Dersi Tamamla" butonu kaldırıldı. Uç, kayıt, beceri ve rozet motoru AYNI
   (`content.lesson.tamamla`) — değişen yalnız tetikleyici: kullanıcı ders
   içeriğinin SONUNA ulaştığında ders tamamlanmış sayılır.

   SAHTE TAMAMLAMAYA KARŞI ÜÇ KOŞUL, hepsi birden sağlanmalı:
     1. #lsLessonEnd nişancısı görünüm alanına GİRMİŞ olmalı — içeriğin
        sonuna gerçekten ulaşılmış.
     2. Nişancı KESİNTİSİZ `data-dwell-seconds` (2 sn) görünür kalmalı.
        Hızla dibe kaydırıp geri çıkan biri sayaç dolmadan koşulu kaybeder.
     3. Sayfada GEÇİRİLEN süre `data-min-seconds`'ı (30 sn) aşmalı. Bu sayaç
        sekme arka plandayken DURUR (visibilitychange) — sekmeyi açık unutmak
        dersi bitirmez, ve "sayfayı bir saniyede kaydıran" biri hiçbir zaman
        geçemez.

   Zaten tamamlanmış derste (data-completed="1") hiç kurulmaz: ikinci bir
   POST atılmaz, modal yeniden açılmaz.

   Kutlama modalı KORUNDU — tamamlama ANINDA açılır (sonraki ziyaretlerde
   değil), markup ve lg-gate görsel dili değişmedi. */
(function () {
  var box = document.getElementById('lsCompleteBox');
  if (!box) return;

  // ui.js bindCookmode() emsali — sunucudan/admin'den gelen serbest metni
  // (rozet adı, ders başlığı) innerHTML'e basmadan ÖNCE kaçır.
  var esc = function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; };

  var sentinel = document.getElementById('lsLessonEnd');
  if (!sentinel) return;
  if (box.dataset.completed === '1') return;

  var doneOverlay = document.getElementById('lsDoneOverlay');
  var doneGate = document.getElementById('lsDoneGate');
  var lastFocus = null;

  function closeDoneModal() {
    if (!doneGate) return;
    doneGate.classList.remove('show');
    if (doneOverlay) doneOverlay.classList.remove('show');
    document.body.style.overflow = '';
    // Buton kalktığı için odak ona DÖNEMEZ; modal açılmadan önceki öğeye
    // döner (odağı kaybetmek erişilebilirlik kusurudur).
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function openDoneModal(payload) {
    if (!doneGate) return;
    lastFocus = document.activeElement;

    var badgeBox = document.getElementById('lsDoneBadges');
    if (badgeBox) {
      if (payload.badges.length) {
        badgeBox.innerHTML = payload.badges.map(function (badge) {
          return '<span class="ls-complete-badge"><i class="fa-solid '
            + esc(badge.icon || 'fa-award') + '" aria-hidden="true"></i> '
            + esc(badge.name) + '</span>';
        }).join('');
        badgeBox.hidden = false;
      } else {
        badgeBox.innerHTML = '';
        badgeBox.hidden = true;
      }
    }

    var nextLink = document.getElementById('lsDoneNext');
    if (nextLink) {
      if (payload.nextUrl) {
        nextLink.href = payload.nextUrl;
        nextLink.title = payload.nextTitle || '';
        nextLink.hidden = false;
      } else {
        nextLink.hidden = true;
      }
    }

    doneGate.classList.add('show');
    if (doneOverlay) doneOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';

    var closeBtn = document.getElementById('lsDoneClose');
    if (closeBtn) closeBtn.focus();
  }

  if (doneGate) {
    var doneClose = document.getElementById('lsDoneClose');
    if (doneClose) doneClose.addEventListener('click', closeDoneModal);
    if (doneOverlay) doneOverlay.addEventListener('click', closeDoneModal);
    doneGate.addEventListener('click', function (e) { if (e.target === doneGate) closeDoneModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && doneGate.classList.contains('show')) closeDoneModal();
    });
  }

  var minMs = (parseInt(box.dataset.minSeconds, 10) || 30) * 1000;
  var dwellMs = (parseInt(box.dataset.dwellSeconds, 10) || 2) * 1000;

  // Sayfada GEÇİRİLEN süre — sekme arka plandayken saymaz.
  var activeMs = 0;
  var lastTick = document.visibilityState === 'visible' ? Date.now() : null;

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      lastTick = Date.now();
    } else if (lastTick !== null) {
      activeMs += Date.now() - lastTick;
      lastTick = null;
    }
  });

  function activeElapsed() {
    return activeMs + (lastTick === null ? 0 : Date.now() - lastTick);
  }

  var sent = false;
  var dwellTimer = null;

  function complete() {
    if (sent) return;
    sent = true;
    if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }

    var token = document.querySelector('meta[name="csrf-token"]')?.content;

    fetch(box.dataset.completeUrl, {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': token, Accept: 'application/json' },
    })
      .then(function (res) { return res.ok ? res.json() : Promise.reject(res); })
      .then(function (data) {
        box.dataset.completed = '1';

        var nextUrl = data.nextLesson ? data.nextLesson.url : box.dataset.nextLessonUrl;
        var nextTitle = data.nextLesson ? data.nextLesson.title : box.dataset.nextLessonTitle;

        openDoneModal({
          badges: data.badgesEarned || [],
          nextUrl: nextUrl,
          nextTitle: nextTitle,
        });
      })
      .catch(function () {
        // Ağ hatasında tekrar denenebilsin — kullanıcı hâlâ sayfanın sonunda.
        sent = false;
      });
  }

  // Nişancı görünür kaldığı SÜRECE bekler; görünürden çıkarsa sayaç sıfırlanır.
  function arm() {
    if (dwellTimer) return;
    dwellTimer = setTimeout(function () {
      dwellTimer = null;
      var remaining = minMs - activeElapsed();
      if (remaining <= 0) {
        complete();
      } else {
        // Nişancı hâlâ görünürse kalan asgari süre kadar daha bekle.
        dwellTimer = setTimeout(function () {
          dwellTimer = null;
          if (activeElapsed() >= minMs) complete();
        }, remaining);
      }
    }, dwellMs);
  }

  function disarm() {
    if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
  }

  if (!('IntersectionObserver' in window)) return;

  new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) arm(); else disarm();
    });
  }, { threshold: 0 }).observe(sentinel);
})();

/* Kazanımlar/Hazırlık sekmeleri (Beyar 2026-07-31) — WAI-ARIA tabs deseni.
   Sunucu iki paneli de basar (ikincisi hidden); burada yalnız geçiş ve
   klavye davranışı bağlanır. data-ready işareti CSS'e "JS var" der —
   JS yoksa iki panel de açık kalır, içerik erişilemez olmaz. */
(function () {
  document.querySelectorAll('[data-ls-tabs]').forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    if (tabs.length < 2) { root.setAttribute('data-ready', ''); return; }

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });

    root.setAttribute('data-ready', '');
  });
})();

/* Ders ekranı yan paneli — bölüm akordeonu (Beyar 2026-07-31). 17 ders düz
   listede akıyordu. İçinde bulunulan dersin bölümü açık başlar (sunucudan
   .open geliyor), diğerleri kapalı. Aynı max-height deseni. */
(function () {
  var list = document.querySelector('.lv-aside-list');
  if (!list) return;

  var secs = [].slice.call(list.querySelectorAll('.lv-nav-sec'));

  /* Kaydıran atayı ÇALIŞMA ANINDA bul, sabit isim yazma. Panelin scroll kabı
     tek yer değil: bugün `.lv-aside`, panel-başına-scroll revizyonundan sonra
     `.lv-aside-list`, ≤1024'te hiçbiri (aside akışa döner). Sabit `.lv-aside`
     yazmak, kap değiştiği gün bu bloğu sessizce ölü koda çevirirdi. */
  function scrollerOf(el) {
    for (var n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      var oy = getComputedStyle(n).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) return n;
    }
    return null;
  }

  /* Kapatma, bu dosyadaki #crsList akordeonunun closePanel idiomu (yukarıda):
     max-height ölçülen yüksekliğe SABİTLENİR → reflow zorlanır → 0'a iner.
     Doğrudan 0 yazmak, kaynak değer `none`/otomatikse geçişi atlatır ve panel
     ani zıplar; tek-açık davranışında kardeşler PROGRAMLA kapandığı için bu
     yol artık gerçekten kullanılıyor. */
  function closeSec(sec) {
    var head = sec.querySelector('.lv-nav-sec-title');
    var rows = sec.querySelector('.lv-nav-rows');
    if (!head || !rows || !sec.classList.contains('open')) return;
    sec.classList.remove('open');
    head.setAttribute('aria-expanded', 'false');
    rows.style.maxHeight = rows.scrollHeight + 'px';
    void rows.offsetHeight;
    rows.style.maxHeight = '0px';
  }

  secs.forEach(function (sec) {
    var head = sec.querySelector('.lv-nav-sec-title');
    var rows = sec.querySelector('.lv-nav-rows');
    if (!head || !rows) return;

    if (sec.classList.contains('open')) rows.style.maxHeight = rows.scrollHeight + 'px';

    head.addEventListener('click', function () {
      var willOpen = ! sec.classList.contains('open');

      /* TEK AÇIK (Beyar kararı): bir bölüm açılırken diğerleri kapanır.
         TOGGLE KORUNUR — açık bölüme tekrar tıklamak onu kapatır, "hep biri
         açık kalsın" İSTENMEDİ. Kardeşler açılıştan ÖNCE kapanır ki iki geçiş
         aynı 0.3s penceresinde aksın, yükseklik iki adımda zıplamasın. */
      if (willOpen) {
        secs.forEach(function (other) { if (other !== sec) closeSec(other); });
      }

      sec.classList.toggle('open', willOpen);
      head.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      rows.style.maxHeight = willOpen ? rows.scrollHeight + 'px' : '0px';

      // Panel kendi içinde kayan bir kutu (max-height + overflow-y). Listenin
      // ALTINDAKİ bir bölüm açıldığında genişleyen satırlar görünür alanın
      // dışında kalıyor, kullanıcı "kesiliyor" olarak görüyordu (Beyar
      // 2026-07-31). Geçiş bitince açılan bölüm panel içinde görünür yapılır.
      if (! willOpen) return;
      rows.addEventListener('transitionend', function done(e) {
        if (e.propertyName !== 'max-height') return;
        rows.removeEventListener('transitionend', done);
        var pane = scrollerOf(sec);
        if (! pane) return;
        var secB = sec.getBoundingClientRect(), paneB = pane.getBoundingClientRect();
        // Bölümün altı panelin altını aşıyorsa yukarı kaydır; başlığı da
        // görünür tut (bölüm panelden uzunsa başlığa hizala).
        if (secB.bottom > paneB.bottom) {
          var delta = Math.min(secB.bottom - paneB.bottom, secB.top - paneB.top);
          pane.scrollBy({ top: delta, behavior: 'smooth' });
        }
      });
    });
  });
})();
