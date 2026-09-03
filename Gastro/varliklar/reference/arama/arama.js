/* Arama sayfası (F13) — pf-tabs client-side toggle (sefler/mutfak-defteri
 * emsali, tam veri ilk yüklemede zaten geldiği için round-trip yok) +
 * arama-suggest AJAX autocomplete (route('arama.suggest') JSON kontratı:
 * {groups:[{key,label,items:[{label,url}]}]}).
 *
 * Boş/odak hâli (Beyar kararı) — arama-v1.html'in kendi tekniği: veri
 * sayfadaki #srPop bloklarından (tek kaynak) okunur, AJAX'a gitmez (öneri
 * uç noktası min 2 karakter ister, boşken zaten çağrılamaz). "Temizle"
 * mockup'ta yalnız DOM'dan satır siliyordu — burada GERÇEK silme (DELETE
 * /ara/gecmis, yalnız üye — form.dataset.clearUrl misafirde yok). */
(function () {
  var tabbar = document.getElementById('srTabbar');
  if (tabbar) {
    var buttons = tabbar.querySelectorAll('.dt[data-tab]');
    var panes = document.querySelectorAll('.pf-pane[data-pane]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var target = btn.dataset.tab;
        panes.forEach(function (p) { p.hidden = p.dataset.pane !== target; });
        var url = new URL(window.location.href);
        url.searchParams.set('tab', target);
        window.history.replaceState({}, '', url);
      });
    });
  }

  var form = document.getElementById('srchForm');
  var input = document.getElementById('srchInput');
  var acList = document.getElementById('srAcList');
  if (!form || !input || !acList) return;

  var TYPE_META = {
    tarifler: { icon: 'fa-bowl-food', type: 'tarif' },
    videolar: { icon: 'fa-circle-play', type: 'video' },
    sefler: { icon: 'fa-utensils', type: 'sef' },
  };

  var suggestUrl = form.dataset.suggestUrl || '/ara/oneriler';
  var clearUrl = form.dataset.clearUrl || null;
  var pop = document.getElementById('srPop');
  var timer = null;

  function closeAc() { form.classList.remove('ac-open'); acList.innerHTML = ''; }

  function csrfToken() {
    var m = document.querySelector('meta[name="csrf-token"]');
    return m ? m.getAttribute('content') : '';
  }

  function renderGroups(groups) {
    acList.innerHTML = '';
    if (!groups.length) {
      var none = document.createElement('div');
      none.className = 'ac-none';
      none.textContent = 'Eşleşen sonuç yok';
      acList.appendChild(none);
      form.classList.add('ac-open');
      return;
    }
    groups.forEach(function (group) {
      var meta = TYPE_META[group.key] || { icon: 'fa-magnifying-glass', type: group.key };
      var head = document.createElement('div');
      head.className = 'ac-grp';
      head.innerHTML = '<i class="fa-solid ' + meta.icon + '" aria-hidden="true"></i> ' + group.label;
      acList.appendChild(head);
      group.items.forEach(function (item) {
        var opt = document.createElement('a');
        opt.className = 'ac-opt';
        opt.setAttribute('role', 'option');
        opt.dataset.type = meta.type;
        opt.href = item.url;
        opt.innerHTML = '<span class="ac-ico"><i class="fa-solid ' + meta.icon + '" aria-hidden="true"></i></span>' +
          '<span class="ac-main"><span class="ac-ttl"></span></span>';
        opt.querySelector('.ac-ttl').textContent = item.label;
        acList.appendChild(opt);
      });
    });
    form.classList.add('ac-open');
  }

  /* #srPop'tan data-q listesi oku (tek kaynak — arama-v1.html readPopular/
   * readRecent tekniğinin aynısı). #srPop is-off olsa da (sonuçlu sayfada)
   * DOM'da kalır, yalnız CSS'le gizlenir — okuma her zaman çalışır. */
  function readPop(selector) {
    if (!pop) return [];
    return Array.prototype.map.call(pop.querySelectorAll(selector), function (el) {
      return el.getAttribute('data-q');
    });
  }

  function acOption(term, icon) {
    var opt = document.createElement('a');
    opt.className = 'ac-opt';
    opt.setAttribute('role', 'option');
    opt.dataset.type = 'q';
    opt.href = form.action + '?q=' + encodeURIComponent(term);
    opt.innerHTML = '<span class="ac-ico"><i class="fa-solid ' + icon + '" aria-hidden="true"></i></span>' +
      '<span class="ac-main"><span class="ac-ttl"></span></span>';
    opt.querySelector('.ac-ttl').textContent = term;
    return opt;
  }

  /* Boş/odak hâli: son aramalar (varsa "Temizle") + popüler öneriler. */
  function renderDefault() {
    var recent = readPop('.sr-recent .sr-rrow[data-q]');
    var popular = readPop('.chips .chip[data-q]');
    acList.innerHTML = '';
    if (!recent.length && !popular.length) { closeAc(); return; }

    if (recent.length) {
      var rHead = document.createElement('div');
      rHead.className = 'ac-grp';
      rHead.innerHTML = '<i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> Son aramalar';
      if (clearUrl) {
        var clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'ac-clear';
        clearBtn.textContent = 'Temizle';
        clearBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          fetch(clearUrl, {
            method: 'DELETE',
            headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
          }).then(function () {
            if (pop) pop.querySelectorAll('.sr-recent .sr-rrow').forEach(function (r) { r.remove(); });
            renderDefault();
          });
        });
        rHead.appendChild(clearBtn);
      }
      acList.appendChild(rHead);
      recent.forEach(function (term) { acList.appendChild(acOption(term, 'fa-clock-rotate-left')); });
    }

    if (popular.length) {
      var pHead = document.createElement('div');
      pHead.className = 'ac-grp';
      pHead.innerHTML = '<i class="fa-solid fa-fire" aria-hidden="true"></i> Popüler öneriler';
      acList.appendChild(pHead);
      popular.forEach(function (term) { acList.appendChild(acOption(term, 'fa-fire')); });
    }

    form.classList.add('ac-open');
  }

  input.addEventListener('input', function () {
    var q = input.value.trim();
    clearTimeout(timer);
    if (q.length === 0) { renderDefault(); return; }
    if (q.length < 2) { closeAc(); return; }
    timer = setTimeout(function () {
      fetch(suggestUrl + '?q=' + encodeURIComponent(q), { headers: { Accept: 'application/json' } })
        .then(function (res) { return res.ok ? res.json() : { groups: [] }; })
        .then(function (data) { renderGroups(data.groups || []); })
        .catch(function () { closeAc(); });
    }, 220);
  });
  input.addEventListener('focus', function () {
    if (input.value.trim().length === 0) renderDefault();
  });

  document.addEventListener('click', function (e) {
    if (!form.contains(e.target)) closeAc();
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAc();
  });

  /* Popüler/son arama çipleri + satırları (#srPop, #srEmpty .chips) — hepsi
   * data-q taşır, tıklayınca gerçek sorguyla arama sayfasına döner (ref
   * teknik: location.href = ...?q=...). */
  document.querySelectorAll('[data-q]').forEach(function (el) {
    el.addEventListener('click', function () {
      window.location.href = form.action + '?q=' + encodeURIComponent(el.getAttribute('data-q'));
    });
  });
})();

/* Sözlük satırı accordion (arama Yazılar sekmesi, arama._glossary-row) —
 * sozluk-liste.js'teki toggleRow'un BİREBİR aynısı (Beyar kararı: arama
 * sonucundaki sözlük kartları AYNI YERDE expand olur, detay sayfasına gitmez;
 * tekil sayfa linki bu satırda YOK, dolayısıyla ayrım kodu gerekmiyor). */
(function () {
  var rows = document.querySelectorAll('.term-row');
  if (!rows.length) return;

  function toggleRow(row) {
    var item = row.parentElement;
    var was = item.classList.contains('open');
    document.querySelectorAll('.term-item.open').forEach(function (o) {
      o.classList.remove('open');
      var r = o.querySelector('.term-row');
      if (r) r.setAttribute('aria-expanded', 'false');
    });
    if (!was) { item.classList.add('open'); row.setAttribute('aria-expanded', 'true'); }
  }

  rows.forEach(function (row) {
    row.addEventListener('click', function () { toggleRow(row); });
    row.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow(row); }
    });
  });
})();
