/* F-SSS — kategori sekmeleri + akordeon + canlı arama.
   Kaynak: sss-v1.html satır 1930-2015 (kaynak-transfer + veri-bağlama).
   Ref'in KATS={...} sabit 5-kategori etiket haritası SAHTE VERİ olduğu için
   taşınmadı; etiketler artık DOM'daki gerçek .faq-tab[data-label] değerinden
   okunur (Faq::category — kaç kategori olursa olsun çalışır). Mekanizma
   (akordeon smooth max-height, tek-kart-açık, ?kat= derin link, canlı arama)
   ref ile birebir. */
(function () {
  var tabs = document.querySelectorAll('#faqTabs .faq-tab');
  var items = Array.prototype.slice.call(document.querySelectorAll('#faqList .qa'));
  var note = document.getElementById('faqNote');
  var none = document.getElementById('faqNone');
  var search = document.getElementById('faqSearch');
  var clearBtn = document.getElementById('faqClear');
  var tabsBox = document.getElementById('faqTabs');
  var cur = tabs.length ? tabs[0].getAttribute('data-kat') : null;

  function openQa(qa) {
    qa.classList.add('open');
    qa.querySelector('.qa-head').setAttribute('aria-expanded', 'true');
    var b = qa.querySelector('.qa-body');
    b.style.maxHeight = b.scrollHeight + 'px';
  }
  function closeQa(qa) {
    qa.classList.remove('open');
    qa.querySelector('.qa-head').setAttribute('aria-expanded', 'false');
    qa.querySelector('.qa-body').style.maxHeight = '0px';
  }
  items.forEach(function (qa) {
    qa.querySelector('.qa-head').addEventListener('click', function () {
      var was = qa.classList.contains('open');
      items.forEach(closeQa);
      if (!was) openQa(qa);
    });
  });

  function tabLabel(kat) {
    var btn = document.querySelector('#faqTabs .faq-tab[data-kat="' + kat + '"]');
    return btn ? (btn.getAttribute('data-label') || btn.textContent.trim()) : kat;
  }

  function showKat(kat, openFirst) {
    if (!kat) return;
    cur = kat;
    tabs.forEach(function (t) { t.classList.toggle('is-active', t.getAttribute('data-kat') === kat); });
    var first = true;
    items.forEach(function (qa) {
      var on = qa.getAttribute('data-kat') === kat;
      qa.hidden = !on;
      closeQa(qa);
      if (on && first && openFirst) { openQa(qa); first = false; }
    });
    var cnt = items.filter(function (q) { return q.getAttribute('data-kat') === kat; }).length;
    if (note) note.innerHTML = '<b>' + tabLabel(kat) + '</b> — ' + cnt + ' soru';
    if (none) none.classList.remove('show');
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      if (search && search.value) { search.value = ''; clearBtn.classList.remove('show'); tabsBox.classList.remove('searching'); }
      showKat(t.getAttribute('data-kat'), true);
      var u = new URLSearchParams(location.search);
      u.set('kat', t.getAttribute('data-kat'));
      history.replaceState(null, '', location.pathname + '?' + u.toString());
    });
  });

  function trLower(s) { return s.toLocaleLowerCase('tr'); }
  function doSearch() {
    var v = trLower(search.value.trim());
    clearBtn.classList.toggle('show', !!v);
    if (!v) {
      tabsBox.classList.remove('searching');
      showKat(cur, true);
      return;
    }
    tabsBox.classList.add('searching');
    var hits = 0;
    items.forEach(function (qa) {
      var txt = trLower(qa.textContent);
      var on = txt.indexOf(v) > -1;
      qa.hidden = !on;
      if (on) { hits++; openQa(qa); } else { closeQa(qa); }
    });
    if (note) note.innerHTML = '<b>&ldquo;' + search.value.trim().replace(/</g, '&lt;') + '&rdquo;</b> için ' + hits + ' soru bulundu (tüm kategoriler)';
    if (none) none.classList.toggle('show', hits === 0);
  }
  if (search && clearBtn) {
    search.addEventListener('input', doSearch);
    clearBtn.addEventListener('click', function () { search.value = ''; doSearch(); search.focus(); });
  }

  if (tabs.length) {
    var p = new URLSearchParams(location.search);
    var k = p.get('kat');
    var hasKat = k && document.querySelector('#faqTabs .faq-tab[data-kat="' + k + '"]');
    showKat(hasKat ? k : cur, true);
  }
})();
