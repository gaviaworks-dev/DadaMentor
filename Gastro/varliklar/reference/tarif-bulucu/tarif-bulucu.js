/* Tarif Bulucu — "görselli iki-mod dolap" (FB37-a) + REVİZYON 2026-07-19
 * (Dolapta ne var.docx ailesi, patron içeriği). YAPI:
 *   - ANA TAB: Dolaptakiler (have) / Hariç Tuttuklarım (exclude)
 *   - Hariç Tuttuklarım İÇİNDE 4 ALT-MOD: Sevmiyorum (esnek, ortak havuz) /
 *     Tüketmiyorum (kesin, preset+serbest) / Alerjim Var (tavizsiz,
 *     preset+serbest) / Hassasiyetim Var (kesin-ya-da-uyar, preset+serbest).
 * Kartlar kanonik Ingredient id'leriyle çalışır (serbest metin YOK). Sonuçlar
 * GERÇEK AJAX (RecipeFinderController::search) — softNote/sensitivityWarnings
 * gerçek filtre motorundan gelir.
 */
(function () {
  'use strict';
  var dolap = document.getElementById('dolap');
  if (!dolap) return;

  var searchUrl = dolap.dataset.searchUrl;
  var selStrip = document.getElementById('selStrip');
  var grpHave = document.getElementById('grpHave');
  var grpExclude = document.getElementById('grpExclude');
  var clearBtns = Array.prototype.slice.call(dolap.querySelectorAll('[data-clearall]'));

  var panes = {
    have: document.getElementById('paneHave'),
    sevmiyorum: document.getElementById('paneSevmiyorum'),
    tuketmiyorum: document.getElementById('paneTuketmiyorum'),
    alerjim: document.getElementById('paneAlerjim'),
    hassasiyet: document.getElementById('paneHassasiyet'),
  };
  var EX_MODES = ['sevmiyorum', 'tuketmiyorum', 'alerjim', 'hassasiyet'];
  var EX_REASON = { sevmiyorum: 'Sevmiyorum', tuketmiyorum: 'Tüketmiyorum', alerjim: 'Alerjim var', hassasiyet: 'Hassasiyetim var' };
  var EX_ICON = { sevmiyorum: 'fa-face-frown', tuketmiyorum: 'fa-ban', alerjim: 'fa-triangle-exclamation', hassasiyet: 'fa-shield-heart' };

  var grid = document.getElementById('tbGrid');
  var emptyBox = document.getElementById('tbEmpty');
  var emptyIco = emptyBox ? emptyBox.querySelector('.te-ico i') : null;
  var emptyTitle = emptyBox ? emptyBox.querySelector('h3') : null;
  var emptyText = emptyBox ? emptyBox.querySelector('p') : null;
  var EMPTY_DEFAULT = {
    icon: emptyIco ? emptyIco.className : 'fa-solid fa-kitchen-set',
    title: emptyTitle ? emptyTitle.textContent : '',
    text: emptyText ? emptyText.textContent : '',
  };
  var resQ = document.getElementById('resQ');
  var qEmpty = document.getElementById('qEmpty');
  var lastResults = [];

  // Beyar direktifi (2026-07-19): preset chip'leri artık asla disabled
  // değil. Taxonomy-pozitif ama henüz etiketsiz bir Tüketmiyorum preset'i
  // (ör. Pesketaryen) seçilip 0 sonuç çıkarsa, boş-durum kutusu genel
  // "Dolabın boş görünüyor" yerine bu preset'e özel kısa bir "yakında"
  // notu gösterir — sayfanın kendi tonuyla (soru/jargon yok).
  function setEmptyBox(icon, title, text) {
    if (emptyIco) emptyIco.className = icon;
    if (emptyTitle) emptyTitle.textContent = title;
    if (emptyText) emptyText.textContent = text;
  }
  function resetEmptyBox() { setEmptyBox(EMPTY_DEFAULT.icon, EMPTY_DEFAULT.title, EMPTY_DEFAULT.text); }
  function showPendingPresetNote(labels) {
    var list = labels.join(', ');
    setEmptyBox(
      'fa-solid fa-hourglass-half',
      labels.length === 1 ? (list + ' tarifleri yakında') : 'Bu tercihler için tarif yakında',
      list + ' tercihine uyan tarif şu an yok — bu tercihi kaldırıp diğer sonuçları görebilirsin.'
    );
  }

  function setTxt(el, v) { if (el) el.textContent = v; }
  function nameOf(card) { var n = card && card.querySelector('.mz-name'); return n ? n.textContent : ''; }
  function pop(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }

  // ---- kart id -> ad çözümü (herhangi bir pane'deki ilk kart yeterli, aynı havuz) ----
  var allCards = Array.prototype.slice.call(dolap.querySelectorAll('.mz[data-ing]'));
  function nameForIng(id) {
    var c = allCards.filter(function (x) { return x.dataset.ing === String(id); })[0];
    return c ? nameOf(c) : '';
  }

  // ==================================================================
  // SEÇİM OKUMA — DOM class taraması (ayrı JS state kopyası TUTULMAZ,
  // referansın haveList()/noList() desenine sadık kalınır).
  // ==================================================================
  function selIngIdsIn(container) {
    if (!container) return [];
    return Array.prototype.slice.call(container.querySelectorAll('.mz.sel[data-ing]')).map(function (c) { return +c.dataset.ing; });
  }
  function haveIds() { return selIngIdsIn(panes.have); }
  function sevmiyorumIds() { return selIngIdsIn(panes.sevmiyorum); }
  function customIdsFor(mode) { return selIngIdsIn(dolap.querySelector('[data-ex-custom="' + mode + '"]')); }
  function presetChips(mode) { return Array.prototype.slice.call(dolap.querySelectorAll('.nq-chip[data-preset-mode="' + mode + '"].sel')); }

  function tuketmiyorumPresetIds() { return presetChips('tuketmiyorum').map(function (c) { return +c.dataset.presetId; }); }
  function alerjimPresetIds() { return presetChips('alerjim').map(function (c) { return +c.dataset.presetId; }); }
  function hassasiyetSelections() {
    return presetChips('hassasiyet').map(function (c) {
      var pref = dolap.querySelector('.nq-pref[data-pref-for="' + c.dataset.presetId + '"] .pref-btn.active');
      return { presetId: +c.dataset.presetId, pref: pref ? pref.dataset.pref : 'uyar', label: c.dataset.presetLabel || nameOf(c) };
    });
  }
  // "Diğer" hassasiyet malzemeleri — kart-bazlı pref UI'sı yok (v1 kapsam
  // kararı), varsayılan UYARARAK GÖSTER (tarif sessizce kaybolmasın).
  function hassasiyetCustomSelections() {
    return customIdsFor('hassasiyet').map(function (id) { return { ingredientId: id, pref: 'uyar', label: nameForIng(id) }; });
  }

  function excludeCount() {
    return sevmiyorumIds().length + tuketmiyorumPresetIds().length + customIdsFor('tuketmiyorum').length +
      alerjimPresetIds().length + customIdsFor('alerjim').length +
      hassasiyetSelections().length + hassasiyetCustomSelections().length;
  }

  // ==================================================================
  // SEÇİLENLER ŞERİDİ — "İsim — Neden" (Dolapta ne var yapısı.docx madde 16)
  // ==================================================================
  function chip(label, reason, cls, onX) {
    var c = document.createElement('span');
    c.className = 'pan-chip ' + cls;
    var icon = cls === 'have' ? 'fa-check' : (EX_ICON[reason.key] || 'fa-ban');
    c.innerHTML = '<i class="fa-solid ' + icon + ' lead" aria-hidden="true"></i> ' +
      '<span>' + label + (reason.text ? ' <span class="pan-chip-reason">— ' + reason.text + '</span>' : '') + '</span>' +
      ' <button class="x" type="button" aria-label="Kaldır"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
    c.querySelector('.x').addEventListener('click', function (e) { e.stopPropagation(); onX(); });
    return c;
  }

  function renderStrip() {
    grpHave.querySelectorAll('.pan-chip').forEach(function (x) { x.remove(); });
    grpExclude.querySelectorAll('.pan-chip').forEach(function (x) { x.remove(); });

    var hv = haveIds();
    hv.forEach(function (id) {
      grpHave.appendChild(chip(nameForIng(id), {}, 'have', function () { toggleIng('have', id); }));
    });

    sevmiyorumIds().forEach(function (id) {
      grpExclude.appendChild(chip(nameForIng(id), { key: 'sevmiyorum', text: EX_REASON.sevmiyorum }, 'no', function () { toggleIng('sevmiyorum', id); }));
    });
    tuketmiyorumPresetIds().forEach(function (pid) {
      var c = presetChips('tuketmiyorum').filter(function (x) { return +x.dataset.presetId === pid; })[0];
      grpExclude.appendChild(chip(c ? nameOf2(c) : '', { key: 'tuketmiyorum', text: EX_REASON.tuketmiyorum }, 'no', function () { togglePreset('tuketmiyorum', pid); }));
    });
    customIdsFor('tuketmiyorum').forEach(function (id) {
      grpExclude.appendChild(chip(nameForIng(id), { key: 'tuketmiyorum', text: EX_REASON.tuketmiyorum }, 'no', function () { toggleIng('tuketmiyorum', id); }));
    });
    alerjimPresetIds().forEach(function (pid) {
      var c = presetChips('alerjim').filter(function (x) { return +x.dataset.presetId === pid; })[0];
      grpExclude.appendChild(chip(c ? nameOf2(c) : '', { key: 'alerjim', text: EX_REASON.alerjim }, 'no', function () { togglePreset('alerjim', pid); }));
    });
    customIdsFor('alerjim').forEach(function (id) {
      grpExclude.appendChild(chip(nameForIng(id), { key: 'alerjim', text: EX_REASON.alerjim }, 'no', function () { toggleIng('alerjim', id); }));
    });
    hassasiyetSelections().forEach(function (s) {
      var prefTxt = s.pref === 'kesin' ? ' · kesin' : ' · uyararak';
      grpExclude.appendChild(chip(s.label, { key: 'hassasiyet', text: EX_REASON.hassasiyet + prefTxt }, 'no', function () { togglePreset('hassasiyet', s.presetId); }));
    });
    hassasiyetCustomSelections().forEach(function (s) {
      grpExclude.appendChild(chip(s.label, { key: 'hassasiyet', text: EX_REASON.hassasiyet + ' · uyararak' }, 'no', function () { toggleIng('hassasiyet', s.ingredientId); }));
    });

    var hn = hv.length, en = excludeCount();
    grpHave.hidden = hn === 0;
    grpExclude.hidden = en === 0;
    selStrip.classList.toggle('has-any', (hn + en) > 0);
  }
  function nameOf2(chipEl) { var t = chipEl.textContent || ''; return t.trim(); }

  // ==================================================================
  // KART / PRESET SEÇİMİ
  // ==================================================================
  function paneContainerFor(mode) {
    if (mode === 'have') return panes.have;
    if (mode === 'sevmiyorum') return panes.sevmiyorum;
    return dolap.querySelector('[data-ex-custom="' + mode + '"]');
  }
  function toggleIng(mode, id, force) {
    var container = paneContainerFor(mode);
    if (!container) return;
    var c = container.querySelector('.mz[data-ing="' + id + '"]');
    if (c) c.classList.toggle('sel', force === undefined ? !c.classList.contains('sel') : force);
    refresh();
  }
  function togglePreset(mode, presetId, force) {
    var c = dolap.querySelector('.nq-chip[data-preset-mode="' + mode + '"][data-preset-id="' + presetId + '"]');
    if (!c || c.disabled) return;
    var on = force === undefined ? !c.classList.contains('sel') : force;
    c.classList.toggle('sel', on);
    var prefRow = dolap.querySelector('.nq-pref[data-pref-for="' + presetId + '"]');
    if (prefRow) prefRow.hidden = !on;
    refresh();
  }

  function updCatSel() {
    dolap.querySelectorAll('.mz-cat').forEach(function (blk) {
      var n = blk.querySelectorAll('.mz.sel').length;
      var hs = blk.querySelector('.mh-sel');
      if (hs) { hs.textContent = n; hs.classList.toggle('show', n > 0); }
    });
  }

  // ---- kart tıklama (tüm .mz-grid'ler ortak delege) ----
  dolap.addEventListener('click', function (e) {
    var c = e.target.closest('.mz[data-ing]');
    if (!c) return;
    c.classList.toggle('sel');
    pop(c);
    refresh();
  });

  // ---- preset chip tıklama ----
  dolap.addEventListener('click', function (e) {
    var c = e.target.closest('.nq-chip[data-preset-id]');
    if (!c || c.disabled) return;
    togglePreset(c.dataset.presetMode, +c.dataset.presetId);
  });

  // ---- Tüketmiyorum "hızlı seçim" tıklama (R3, 2026-07-22 — Vegan/Vejetaryen/
  // Pesketaryen kimlik çipleri kalktı, Beyar madde S2). Kendi preset'i YOK —
  // ana ürün/grup listesindeki AYNI preset'i (data-preset-key eşleşmesiyle)
  // 1:1 toggle'lar; görünür "sel" durumu refresh() içinde hedefe göre senkronlanır.
  dolap.addEventListener('click', function (e) {
    var c = e.target.closest('.nq-chip[data-quick-target-key]');
    if (!c || c.disabled) return;
    var target = dolap.querySelector('.nq-chip[data-preset-mode="tuketmiyorum"][data-preset-key="' + c.dataset.quickTargetKey + '"]');
    if (target) togglePreset('tuketmiyorum', +target.dataset.presetId);
  });

  // ---- hassasiyet pref toggle ----
  dolap.addEventListener('click', function (e) {
    var b = e.target.closest('.pref-btn');
    if (!b) return;
    var row = b.closest('.nq-pref');
    row.querySelectorAll('.pref-btn').forEach(function (x) { x.classList.remove('active'); });
    b.classList.add('active');
    refresh();
  });

  // ---- "Diğer — tek tek malzeme ekle" disclosure ----
  dolap.addEventListener('click', function (e) {
    var b = e.target.closest('.ex-more');
    if (!b) return;
    var mode = b.dataset.exMore;
    var block = dolap.querySelector('[data-ex-custom="' + mode + '"]');
    var open = block.hidden;
    block.hidden = !open;
    b.classList.toggle('open', open);
    b.innerHTML = '<i class="fa-solid ' + (open ? 'fa-minus' : 'fa-plus') + '" aria-hidden="true"></i> ' + (open ? 'Malzeme listesini kapat' : b.textContent.replace(/^\s*[-+]?\s*/, '').trim());
  });

  // ---- ACCORDION — satır eşi senkron aç/kapa (mevcut cat-cols davranışı) ----
  dolap.addEventListener('click', function (e) {
    var h = e.target.closest('.mz-cat-h');
    if (!h) return;
    var sec = h.closest('.mz-cat');
    var open = sec.classList.toggle('open');
    h.setAttribute('aria-expanded', open ? 'true' : 'false');
    var cols = sec.closest('.cat-cols');
    if (cols) {
      var all = Array.prototype.slice.call(cols.querySelectorAll('.mz-cat'));
      var idx = all.indexOf(sec);
      var pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
      var pair = (pairIdx >= 0 && pairIdx < all.length) ? all[pairIdx] : null;
      if (pair) {
        pair.classList.toggle('open', open);
        var ph = pair.querySelector('.mz-cat-h');
        if (ph) ph.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
    }
  });

  // ==================================================================
  // TAB GEÇİŞİ — ana tab (Dolaptakiler/Hariç Tuttuklarım) + alt-mod
  // ==================================================================
  var mainNote = document.getElementById('mainNote');
  var exModeTabs = document.getElementById('exModeTabs');
  var panSearchInput = document.getElementById('panSearch');

  function activePaneMode() { return dolap.dataset.main === 'have' ? 'have' : dolap.dataset.exmode; }

  function showPane(mode) {
    Object.keys(panes).forEach(function (k) { if (panes[k]) panes[k].classList.toggle('active', k === mode); });
  }

  function setMain(m) {
    dolap.setAttribute('data-main', m);
    document.querySelectorAll('#mainTabs .mode-tab').forEach(function (t) {
      var on = t.getAttribute('data-main') === m;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    exModeTabs.hidden = m !== 'exclude';
    if (m === 'have') {
      showPane('have');
      mainNote.innerHTML = '<span class="mn-ic"><i class="fa-solid fa-basket-shopping" aria-hidden="true"></i></span> <span><b>Dolabında bulunan malzemeleri seç,</b> sana uygun tarifleri gösterelim.</span>';
      if (panSearchInput) panSearchInput.placeholder = 'Elindeki malzeme — örn. yumurta, tavuk, peynir…';
    } else {
      showPane(dolap.dataset.exmode || 'sevmiyorum');
      mainNote.innerHTML = '<span class="mn-ic"><i class="fa-solid fa-ban" aria-hidden="true"></i></span> <span><b>Tariflerde bulunmasını istemediğin veya tüketemediğin</b> malzemeleri belirt.</span>';
      if (panSearchInput) panSearchInput.placeholder = 'Hariç tutmak istediğin malzeme — örn. mantar, süt…';
    }
    refresh();
  }
  function setExMode(m) {
    dolap.setAttribute('data-exmode', m);
    document.querySelectorAll('#exModeTabs .ex-tab').forEach(function (t) {
      var on = t.getAttribute('data-exmode') === m;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    showPane(m);
    refresh();
  }
  document.querySelectorAll('#mainTabs .mode-tab').forEach(function (t) {
    t.addEventListener('click', function () { setMain(t.getAttribute('data-main')); });
  });
  document.querySelectorAll('#exModeTabs .ex-tab').forEach(function (t) {
    t.addEventListener('click', function () { setExMode(t.getAttribute('data-exmode')); });
  });

  // ---- canlı malzeme filtresi — o an görünen pane'in kartlarını daraltır ----
  if (panSearchInput) {
    panSearchInput.addEventListener('input', function () {
      var q = panSearchInput.value.trim().toLocaleLowerCase('tr');
      var mode = activePaneMode();
      var container = paneContainerFor(mode);
      if (!container) return;
      if (q && mode !== 'have' && mode !== 'sevmiyorum') {
        // Tüketmiyorum/Alerjim/Hassasiyet: yazmaya başlayınca "Diğer" otomatik açılır.
        container.hidden = false;
        var moreBtn = dolap.querySelector('.ex-more[data-ex-more="' + mode + '"]');
        if (moreBtn) moreBtn.classList.add('open');
      }
      container.querySelectorAll('.mz-cat').forEach(function (sec) {
        var anyMatch = false;
        sec.querySelectorAll('.mz').forEach(function (c) {
          var name = nameOf(c).toLocaleLowerCase('tr');
          var match = !q || name.indexOf(q) > -1;
          c.style.display = match ? '' : 'none';
          if (match) anyMatch = true;
        });
        sec.style.display = (q && !anyMatch) ? 'none' : '';
        if (q && anyMatch) sec.classList.add('open');
      });
    });
  }

  // ==================================================================
  // FİLTRE PAYLOAD + AJAX
  // ==================================================================
  function activeFilters() {
    var sure = document.querySelector('[data-name="sure"] .chip.active');
    var protein = document.querySelector('[data-name="protein"] .chip.active');
    var zorluk = document.querySelector('[data-name="zorluk"] .chip.active');
    var lo = document.getElementById('krLo'), hi = document.getElementById('krHi');
    var payload = {
      have: haveIds(),
      exclude: {
        sevmiyorum: sevmiyorumIds(),
        // Tüketmiyorum — hibrit (lead direktifi madde 3): presets backend'de
        // preset başına taxonomy-pozitif YA DA ingredient-pivot hard-exclude
        // olarak çözülür; custom = "tek tek malzeme ekle" (her zaman KESİN
        // hard-exclude, presetlerden BAĞIMSIZ kendi alanında gönderilir).
        tuketmiyorum: { presets: tuketmiyorumPresetIds(), custom: customIdsFor('tuketmiyorum') },
        alerjim: { presets: alerjimPresetIds(), custom: customIdsFor('alerjim') },
        hassasiyet: hassasiyetSelections().map(function (s) { return { presetId: s.presetId, pref: s.pref }; })
          .concat(hassasiyetCustomSelections().map(function (s) { return { ingredientId: s.ingredientId, pref: s.pref }; })),
      },
      sure: sure ? sure.dataset.val : null,
      protein_min: protein ? protein.dataset.val : null,
      difficulty: zorluk ? zorluk.dataset.val : null,
    };
    if (lo && hi && (+lo.value !== 0 || +hi.value !== 1200)) {
      payload.calorie_min = lo.value;
      payload.calorie_max = hi.value;
    }
    return payload;
  }

  function cardHtml(row) {
    var matchBadge = row.isFullMatch
      ? '<span class="r-match full"><i class="fa-solid fa-check-double" aria-hidden="true"></i> Tam eşleşme</span>'
      : '<span class="r-match miss"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> ' + row.missingCount + ' eksik</span>';
    var ingChips = (row.haveIngredientNames || []).map(function (n) {
      return '<span class="ing have"><i class="fa-solid fa-check" aria-hidden="true"></i> ' + n + '</span>';
    }).concat((row.missingIngredientNames || []).map(function (n) {
      return '<span class="ing miss"><i class="fa-solid fa-plus" aria-hidden="true"></i> ' + n + '</span>';
    })).join('');
    var notes = '';
    if (row.softNote) notes += '<div class="r-note soft"><i class="fa-solid fa-face-smile" aria-hidden="true"></i> ' + row.softNote + '</div>';
    (row.sensitivityWarnings || []).forEach(function (w) {
      notes += '<div class="r-note warn"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> ' + w + '</div>';
    });
    var catChip = row.category ? '<span class="r-chip">' + row.category + '</span>' : '';
    return '<article class="r-card">' +
      '<div class="r-media-wrap"><div class="r-media" style="background-image:url(\'' + (row.cover || '') + '\')">' +
      catChip +
      '<a class="r-save" href="' + row.url + '" aria-label="Aç"><i class="fa-regular fa-bookmark" aria-hidden="true"></i></a>' +
      matchBadge +
      '</div></div>' +
      '<div class="r-body">' +
      '<h4><a href="' + row.url + '">' + row.title + '</a></h4>' +
      '<div class="r-ing">' + ingChips + '</div>' +
      notes +
      '<div class="r-foot"><div class="r-author"><span><b>' + (row.author || '') + '</b></span></div>' +
      (row.difficulty ? '<div class="r-stats"><span>' + row.difficulty + '</span></div>' : '') +
      '</div></div></article>';
  }

  function applyResultSearch() {
    var q = resQ ? resQ.value.trim().toLowerCase() : '';
    var visible = 0;
    Array.prototype.forEach.call(grid.querySelectorAll('.r-card'), function (card) {
      var h = card.querySelector('h4');
      var hidden = !!q && (!h || h.textContent.toLowerCase().indexOf(q) < 0);
      card.classList.toggle('q-hidden', hidden);
      if (!hidden) visible++;
    });
    if (qEmpty) qEmpty.hidden = !(q && lastResults.length > 0 && visible === 0);
  }

  function csrfToken() {
    var m = document.querySelector('meta[name="csrf-token"]');
    return m ? m.getAttribute('content') : '';
  }

  var fetchTimer = null;
  function refresh() {
    var hv = haveIds(), en = excludeCount();
    setTxt(document.getElementById('haveCount'), hv.length);
    setTxt(document.getElementById('sumMalz'), hv.length);
    var exNote = document.getElementById('exNote'), exNoteN = document.getElementById('exNoteN');
    if (exNote) { exNote.hidden = en === 0; if (exNoteN) exNoteN.textContent = en; }

    var dh = document.getElementById('dotHave'), de = document.getElementById('dotExclude');
    if (dh) { dh.textContent = hv.length; dh.parentElement.classList.toggle('has', hv.length > 0); }
    if (de) { de.textContent = en; de.parentElement.classList.toggle('has', en > 0); }
    var subCounts = {
      sevmiyorum: sevmiyorumIds().length,
      tuketmiyorum: tuketmiyorumPresetIds().length + customIdsFor('tuketmiyorum').length,
      alerjim: alerjimPresetIds().length + customIdsFor('alerjim').length,
      hassasiyet: hassasiyetSelections().length + hassasiyetCustomSelections().length,
    };
    EX_MODES.forEach(function (m) {
      var dot = document.getElementById('dot' + m.charAt(0).toUpperCase() + m.slice(1));
      if (dot) { dot.textContent = subCounts[m]; dot.parentElement.classList.toggle('has', subCounts[m] > 0); }
    });

    var ico = document.getElementById('dcIco'), t = document.getElementById('dcTitle');
    if (dolap.dataset.main === 'exclude') {
      if (ico) ico.innerHTML = '<i class="fa-solid fa-ban" aria-hidden="true"></i>';
      if (t) t.innerHTML = '<span class="n" id="haveCount">' + en + '</span> malzeme hariç tutuldu';
    } else {
      if (ico) ico.innerHTML = '<i class="fa-solid fa-basket-shopping" aria-hidden="true"></i>';
      if (t) t.innerHTML = 'Elinde <span class="n" id="haveCount">' + hv.length + '</span> malzeme';
    }

    renderStrip();
    updCatSel();
    // "Hızlı seçim" kısayol çipleri kendi 'sel' durumunu taşımaz — ana
    // ürün/grup listesindeki hedef preset'in durumunu her refresh'te yansıtır.
    dolap.querySelectorAll('.nq-chip[data-quick-target-key]').forEach(function (c) {
      var target = dolap.querySelector('.nq-chip[data-preset-mode="tuketmiyorum"][data-preset-key="' + c.dataset.quickTargetKey + '"]');
      c.classList.toggle('sel', !!(target && target.classList.contains('sel')));
    });
    clearBtns.forEach(function (b) { b.hidden = (hv.length + en) === 0; });

    if (hv.length === 0) {
      resetEmptyBox();
      emptyBox.classList.remove('hide');
      grid.innerHTML = '';
      grid.style.display = 'none';
      var rc0 = document.getElementById('recipeCount');
      setTxt(rc0, '0');
      if (rc0) rc0.classList.add('zero');
      var countLabel0 = document.getElementById('tbCountLabel');
      var fallbackNote0 = document.getElementById('tbFallbackNote');
      if (countLabel0) countLabel0.textContent = countLabel0.dataset.default;
      if (fallbackNote0) fallbackNote0.hidden = true;
      return;
    }

    grid.style.display = '';
    clearTimeout(fetchTimer);
    fetchTimer = setTimeout(runSearch, 280);
  }

  function showSearchErrorNote() {
    // 2026-07-24 (M16): sessiz-fail YASAK — HTTP hatası/ağ hatasında kullanıcıya
    // dürüst bir durum gösterilir (CLAUDE.md); mevcut boş-durum kutusu yeniden
    // kullanılır (showPendingPresetNote ile AYNI mekanizma).
    lastResults = [];
    var rc = document.getElementById('recipeCount');
    setTxt(rc, '0');
    if (rc) rc.classList.add('zero');
    setEmptyBox(
      'fa-solid fa-triangle-exclamation',
      'Sonuçlar yüklenemedi',
      'Bir şeyler ters gitti — birkaç saniye sonra tekrar dene ya da seçimini değiştir.'
    );
    emptyBox.classList.remove('hide');
    grid.innerHTML = '';
    var countLabelErr = document.getElementById('tbCountLabel');
    var fallbackNoteErr = document.getElementById('tbFallbackNote');
    if (countLabelErr) countLabelErr.textContent = countLabelErr.dataset.default;
    if (fallbackNoteErr) fallbackNoteErr.hidden = true;
  }

  function runSearch() {
    var payload = activeFilters();
    fetch(searchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) { throw new Error('tarif-bulucu-search-http-' + res.status); }
        return res.json();
      })
      .then(function (data) {
        lastResults = data.results || [];
        var rc = document.getElementById('recipeCount');
        setTxt(rc, data.total);
        if (rc) rc.classList.toggle('zero', data.total === 0);
        if (data.total === 0 && data.pendingPresetLabels && data.pendingPresetLabels.length) {
          showPendingPresetNote(data.pendingPresetLabels);
        } else {
          resetEmptyBox();
        }
        emptyBox.classList.toggle('hide', data.total > 0);
        // M16 REVİZE (2026-07-24/2, Beyar) — "en yakınlar" boş-kesişim
        // fallback'i: sıkı AND 0 verince backend en-yakın sonuçlara düşer,
        // isFallback bayrağıyla işaretler; JS burada görünür başlığı değiştirir.
        var countLabel = document.getElementById('tbCountLabel');
        var fallbackNote = document.getElementById('tbFallbackNote');
        if (countLabel) countLabel.textContent = data.isFallback ? countLabel.dataset.fallback : countLabel.dataset.default;
        if (fallbackNote) fallbackNote.hidden = !data.isFallback;
        grid.innerHTML = lastResults.map(cardHtml).join('');
        applyResultSearch();
      })
      .catch(function () { showSearchErrorNote(); });
  }

  // ---- sonuç-içi arama ----
  if (resQ) resQ.addEventListener('input', applyResultSearch);

  // ---- temizle ----
  clearBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      allCards.forEach(function (c) { c.classList.remove('sel'); });
      dolap.querySelectorAll('.nq-chip.sel').forEach(function (c) { c.classList.remove('sel'); });
      dolap.querySelectorAll('.nq-pref').forEach(function (p) { p.hidden = true; });
      refresh();
    });
  });

  // ---- FİLTRELER: tek-seçim chip grupları + sıfırla sayacı ----
  var fltReset = document.getElementById('fltReset');
  function activeFltCount() {
    var n = document.querySelectorAll('[data-name="sure"] .chip.active, [data-name="protein"] .chip.active, [data-name="zorluk"] .chip.active').length;
    var lo2 = document.getElementById('krLo'), hi2 = document.getElementById('krHi');
    if (lo2 && hi2 && (+lo2.value !== 0 || +hi2.value !== 1200)) n++;
    return n;
  }
  function updFltCount() { if (fltReset) fltReset.hidden = activeFltCount() === 0; }
  document.querySelectorAll('[data-name="sure"] .chip, [data-name="protein"] .chip, [data-name="zorluk"] .chip').forEach(function (c) {
    c.addEventListener('click', function () {
      var was = c.classList.contains('active');
      c.parentElement.querySelectorAll('.chip').forEach(function (s) { s.classList.remove('active'); });
      if (!was) c.classList.add('active');
      updFltCount();
      refresh();
    });
  });
  if (fltReset) {
    fltReset.addEventListener('click', function () {
      document.querySelectorAll('[data-name="sure"] .chip.active, [data-name="protein"] .chip.active, [data-name="zorluk"] .chip.active').forEach(function (s) { s.classList.remove('active'); });
      var lo3 = document.getElementById('krLo'), hi3 = document.getElementById('krHi');
      if (lo3 && hi3) { lo3.value = 120; hi3.value = 650; krSync(); }
      updFltCount();
      refresh();
    });
  }

  // ---- KALORİ DUAL RANGE ----
  var lo = document.getElementById('krLo'), hi = document.getElementById('krHi'), fill = document.getElementById('krFill'),
    minL = document.getElementById('krMin'), maxL = document.getElementById('krMax');
  function krSync(ev) {
    var a = +lo.value, b = +hi.value, max = +lo.max;
    if (a > b - 50) {
      if (ev && ev.target === lo) { a = b - 50; lo.value = a; } else { b = a + 50; hi.value = b; }
    }
    minL.textContent = a; maxL.textContent = b;
    fill.style.left = (a / max * 100) + '%';
    fill.style.width = ((b - a) / max * 100) + '%';
  }
  if (lo && hi) {
    lo.addEventListener('input', function (e) { krSync(e); updFltCount(); refresh(); });
    hi.addEventListener('input', function (e) { krSync(e); updFltCount(); refresh(); });
    krSync();
  }
  updFltCount();

  // ---- başlangıç ----
  setMain('have');
})();

// ---- UI/UX revize turu (2026-07-19) — kaydırma kenar durumu (.has-overflow/
// .at-start/.at-end). REDUCED-MOTION'DAN BAĞIMSIZ (hareket değil, statik görsel
// durum) — otomatik kayan animasyon erişilebilirlik nedeniyle kapatılsa bile
// mask-image ipucu çalışmaya devam etmeli, aksi halde o kullanıcı grubu eski
// "sert kesik kart" görünümüne geri düşerdi.
(function(){
  function syncEdges(g){
    var max=g.scrollWidth-g.clientWidth;
    var overflow=max>2;
    g.classList.toggle('has-overflow',overflow);
    g.classList.toggle('at-start',!overflow||g.scrollLeft<=2);
    g.classList.toggle('at-end',!overflow||g.scrollLeft>=max-2);
  }
  function syncAll(){ document.querySelectorAll('.mz-grid').forEach(syncEdges); }
  document.querySelectorAll('.mz-grid').forEach(function(g){
    syncEdges(g);
    g.addEventListener('scroll',function(){syncEdges(g);},{passive:true});
  });
  window.addEventListener('resize',syncAll);
  // Accordion aç/kapa + "Diğer" disclosure yeni .mz-grid'leri görünür kılar
  // (display:none → block, scrollWidth/clientWidth ancak o an ölçülebilir).
  document.addEventListener('click',function(e){
    if(e.target.closest('.mz-cat-h,.ex-more,.mode-tab,.ex-tab')) setTimeout(syncAll,30);
  });
})();

// ---- REVİZE A: malzeme kategorisi slider'ları otomatik kaydır (yavaş sürekli akış; hover/dokunuş/sürüklemede dur, elle de kaydırılır) ----
(function(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;  // erişilebilirlik
  function tick(){
    document.querySelectorAll('.mz-grid').forEach(function(g){
      if(!g._auto){                                                          // ilk görülüşte init (geç/yeniden render'a dayanıklı)
        g._auto=1; g._dir=1; g._hold=false; g._pos=null;
        g.addEventListener('mouseenter',function(){g._hold=true;});
        g.addEventListener('mouseleave',function(){g._hold=false;});
        g.addEventListener('touchstart',function(){g._hold=true;},{passive:true});
        g.addEventListener('touchend',function(){setTimeout(function(){g._hold=false;},1500);});
        g.addEventListener('focusin',function(){g._hold=true;});
        g.addEventListener('focusout',function(){g._hold=false;});
      }
      if(!g.offsetParent)return;                                             // gizli kategori
      var max=g.scrollWidth-g.clientWidth;
      if(max<=2)return;                                                       // taşma yoksa atla
      if(g._hold||g.classList.contains('dragging')){ g._pos=g.scrollLeft; return; }  // etkileşimde dur + resync
      if(g._pos==null||Math.abs(g._pos-g.scrollLeft)>40) g._pos=g.scrollLeft;        // manuel kayma sonrası resync
      g._pos+=g._dir*0.4;                                                     // float accumulator (scrollLeft tam sayıya yuvarlandığı için)
      if(g._pos>=max){g._pos=max;g._dir=-1;} else if(g._pos<=0){g._pos=0;g._dir=1;}  // uçlarda yön çevir (ping-pong)
      g.scrollLeft=g._pos;
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
