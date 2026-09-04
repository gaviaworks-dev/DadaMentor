/* ═══════════════════════════════════════════════════════════════════════
   DM PROFİL — profil modülü davranış katmanı · TEK KAYNAK
   -----------------------------------------------------------------------
   Neden ayrı dosya (2026-09-05, AJAN B ölçtü):
   Gourmet yayın ağacında profil modülünün NE CSS'i NE DE BETİĞİ vardı
   (`pf-tabbar`·`sekmeler`·`fit-pane` → build/assets + shared içinde 0
   eşleşme). Donör FIT sayfası davranışı 99 KB'lık SAYFA İÇİ betikte
   taşıyor; gövde taşınıp betik taşınmazsa sekmeler ölür ve sayım kapısı
   yine yeşil verir ("kapı sorduğu soruyu ölçer").
   `dm-kabuk.css`in kabuk için yaptığını bu ikili gövde için yapar.

   🔴 SEKME SÜRÜCÜSÜ DONÖRDEN BİREBİR TAŞINDI — yeniden yazılmadı.
      kaynak: deneme/fit-egzersizlerim.html → satır içi kanon-kiti
              ("sekme rayı — [data-tab] ↔ [data-pane]")
   Taşınırken DEĞİŞEN tek şey: `.modul-govde` hash yazımı korundu,
   FIT'e özel `window.__bnUpdate` çağrısı DÜŞÜRÜLMEDİ, varsa çağrılır.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var d = document;
  var qa = function (s, k) { return Array.prototype.slice.call((k || d).querySelectorAll(s)); };

  /* ── 1 · SEKME RAYI ─────────────────────────────────────────────────
     Kaynağın kipi: pano `hidden` ile gizlenir, aktif sekme
     `aria-selected="true"` + `aria-current="page"` + gezici tabindex. */
  qa('[data-tab]').forEach(function (t) {
    t.addEventListener('click', function (e) {
      var k = t.getAttribute('data-tab'); if (!k) return;
      var kap = t.closest('[data-fit-tabs-scope]') || d;
      var gr = kap.querySelectorAll('[data-tab]'), pn = kap.querySelectorAll('[data-pane]');
      if (!pn.length) return; e.preventDefault();
      gr.forEach(function (x) {
        var a = x.getAttribute('data-tab') === k;
        x.classList.toggle('is-active', a); x.classList.toggle('aktif', a);
        if (x.getAttribute('role') === 'tab') {
          x.setAttribute('aria-selected', a ? 'true' : 'false');
          x.tabIndex = a ? 0 : -1;
        }
        if (a) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current');
      });
      pn.forEach(function (x) { x.hidden = x.getAttribute('data-pane') !== k; });
      /* aktif sekme rayın görünür penceresine çekilir — SAYFA KAYDIRILMAZ */
      (function () {
        var akt = null;
        gr.forEach(function (x) { if (x.getAttribute('data-tab') === k) akt = x; });
        if (!akt) return; var ray = akt.parentElement;
        if (!ray || ray.scrollWidth <= ray.clientWidth + 1) return;
        var xb = akt.getBoundingClientRect(), rb = ray.getBoundingClientRect();
        if (xb.left < rb.left) ray.scrollLeft -= (rb.left - xb.left) + 8;
        else if (xb.right > rb.right) ray.scrollLeft += (xb.right - rb.right) + 8;
      })();
      if (location.hash.slice(1) !== k) { try { history.replaceState(null, '', '#' + k); } catch (err) {} }
    });
  });
  if (location.hash) {
    var h = d.querySelector('[data-tab="' + location.hash.slice(1) + '"]');
    if (h) h.click();
  }

  /* ── 2 · KLAVYE · WAI-ARIA APG "Tabs" ─────────────────────────────── */
  qa('[role="tablist"]').forEach(function (ray) {
    ray.addEventListener('keydown', function (e) {
      var tabs = qa('[role="tab"]', ray);
      var i = tabs.indexOf(d.activeElement); if (i < 0) return;
      var j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      else return;
      e.preventDefault(); tabs[j].click(); tabs[j].focus();
    });
  });

  /* ── 3 · ÇİPLER · `data-tip="tek"` tek seçim, yoksa çoklu ───────────
     Donörün markup'ı bu kancaları İLAN EDİYOR ama sürücüsü YOK
     (ölçüldü: çipe tıklamak DOM'da hiçbir şey değiştirmiyor —
      raporda "kaynakta kusur" olarak bildirildi). Sözleşme donörün. */
  qa('.cipler[data-alan], .cipler[data-group]').forEach(function (grup) {
    var tek = grup.getAttribute('data-tip') === 'tek';
    qa('.cip', grup).forEach(function (c) {
      c.addEventListener('click', function () {
        if (tek) {
          qa('.cip', grup).forEach(function (x) {
            var a = x === c;
            x.classList.toggle('aktif', a); x.classList.toggle('on', a);
            x.setAttribute('aria-pressed', a ? 'true' : 'false');
          });
        } else {
          var a = c.getAttribute('aria-pressed') !== 'true';
          c.classList.toggle('aktif', a); c.classList.toggle('on', a);
          c.setAttribute('aria-pressed', a ? 'true' : 'false');
        }
        ozet(grup);
      });
    });
    ozet(grup);
  });
  function ozet(grup) {
    var secili = qa('.cip[aria-pressed="true"]', grup).map(function (x) {
      return (x.getAttribute('data-val') || x.textContent).trim();
    });
    var kart = grup.closest('[data-alan-kart]'); if (!kart) return;
    var s = kart.querySelector('[data-alan-ozet]');
    if (s) s.textContent = secili.length ? secili.join(' · ') : 'Seçim yok';
    var r = kart.querySelector('[data-alan-rozet]');
    if (r) { r.textContent = secili.length ? secili.length + ' seçili' : 'Boş'; r.classList.toggle('olumlu', !!secili.length); r.classList.toggle('pasif', !secili.length); }
  }

  /* ── 4 · ALAN KAYDET / TEMİZLE ───────────────────────────────────── */
  qa('[data-alan-kaydet]').forEach(function (b) {
    b.addEventListener('click', function () {
      var kart = b.closest('[data-alan-kart]'); if (!kart) return;
      var grup = kart.querySelector('.cipler');
      var secili = grup ? qa('.cip[aria-pressed="true"]', grup).map(function (x) { return (x.getAttribute('data-val') || x.textContent).trim(); }) : [];
      var sat = kart.querySelector('.ayar-satir .as-metin span');
      if (sat) sat.textContent = secili.length ? secili.join(' · ') : 'Henüz yanıtlamadın';
      var rz = kart.querySelector('.as-eylem .rozet');
      if (rz) { rz.textContent = secili.length ? 'Dolu' : 'Boş'; rz.classList.toggle('olumlu', !!secili.length); rz.classList.toggle('pasif', !secili.length); }
      duyur(kart, secili.length ? 'Yanıtın kaydedildi: ' + secili.join(' · ') : 'Yanıtın boş kaydedildi.');
    });
  });
  qa('[data-alan-temizle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var kart = b.closest('[data-alan-kart]'); if (!kart) return;
      qa('.cip', kart).forEach(function (x) { x.classList.remove('aktif', 'on'); x.setAttribute('aria-pressed', 'false'); });
      var grup = kart.querySelector('.cipler'); if (grup) ozet(grup);
      var sat = kart.querySelector('.ayar-satir .as-metin span'); if (sat) sat.textContent = 'Henüz yanıtlamadın';
      var rz = kart.querySelector('.as-eylem .rozet'); if (rz) { rz.textContent = 'Boş'; rz.classList.remove('olumlu'); rz.classList.add('pasif'); }
      duyur(kart, 'Yanıt temizlendi.');
    });
  });

  /* ── 5 · ANAHTAR / ROLE=SWITCH ───────────────────────────────────── */
  qa('[role="switch"]').forEach(function (s) {
    s.addEventListener('click', function () {
      var a = s.getAttribute('aria-checked') !== 'true';
      s.setAttribute('aria-checked', a ? 'true' : 'false');
      var lbl = s.parentElement.querySelector('.fp-sw-lbl');
      if (lbl) lbl.textContent = a ? 'Açık' : 'Kapalı';
      duyur(s, (s.getAttribute('aria-label') || 'Tercih') + (a ? ' açıldı.' : ' kapatıldı.'));
    });
  });

  /* ── 6 · AKORDEON · BİR GRUPTA TEK AÇIK KALEM (kanon kuralı) ─────── */
  qa('.akordeon-bas').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.closest('.akordeon-kalem'); if (!k) return;
      var grup = k.parentElement, ac = !k.classList.contains('acik');
      qa('.akordeon-kalem.acik', grup).forEach(function (o) {
        if (o === k) return;
        o.classList.remove('acik');
        var oh = o.querySelector('.akordeon-bas'); if (oh) oh.setAttribute('aria-expanded', 'false');
        var og = o.querySelector('.akordeon-govde'); if (og) og.style.maxHeight = '0px';
      });
      k.classList.toggle('acik', ac);
      b.setAttribute('aria-expanded', ac ? 'true' : 'false');
      var g = k.querySelector('.akordeon-govde');
      if (g) g.style.maxHeight = ac ? (g.scrollHeight + 'px') : '0px';
    });
  });

  /* ── 7 · PANEL (dialog) AÇ / KAPAT ───────────────────────────────── */
  /* 🔴 YENİ BİLEŞEN İCAT EDİLMEDİ — maketin KENDİ modal gramerini kullanır:
     `.fb-modal` + `.show` (+ `.fb-overlay#fbOverlay`). İkisi de Gourmet
     build CSS'inde tanımlı; profil paneli için tek satır CSS yazılmadı. */
  function ortu(a) { var o = d.getElementById('fbOverlay'); if (o) o.classList.toggle('show', a); }
  function panelAc(p) {
    if (!p) return;
    p.classList.add('show'); ortu(true);
    var ilk = p.querySelector('input,select,textarea,button');
    if (ilk) ilk.focus();
  }
  function panelKapa(p) { if (!p) return; p.classList.remove('show'); ortu(false); }
  qa('[data-dm-panel]').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = d.getElementById(b.getAttribute('data-dm-panel'));
      panelAc(p);
      if (p) b.setAttribute('aria-expanded', 'true');
    });
  });
  qa('[data-dm-kapat]').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = b.closest('.fb-modal'); panelKapa(p);
      if (p) qa('[data-dm-panel="' + p.id + '"]').forEach(function (t) { t.setAttribute('aria-expanded', 'false'); t.focus(); });
    });
  });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    qa('.fb-modal.show[data-dm-govde]').forEach(function (p) { panelKapa(p); });
  });

  /* maketin KENDİ akışına köprü — footer'ın `onclick` ile yaptığı şeyi
     satır içi JS olmadan yapar (Beyar kuralı: satır içi JS yok). */
  qa('[data-dm-tikla]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = d.getElementById(b.getAttribute('data-dm-tikla'));
      if (t) t.click();
    });
  });

  /* ── 8 · FORM → SATIR · listeye GERÇEK kalem ekler ───────────────── */
  qa('form[data-dm-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var hedef = d.getElementById(f.getAttribute('data-dm-form'));
      if (!hedef) return;
      var alanlar = qa('[data-dm-alan]', f);
      var bos = alanlar.filter(function (x) { return x.required && !String(x.value).trim(); });
      if (bos.length) { bos[0].focus(); duyur(f, 'Zorunlu alanları doldur.'); return; }
      var deger = {};
      alanlar.forEach(function (x) { deger[x.getAttribute('data-dm-alan')] = String(x.value).trim(); });
      var kal = document.createElement('div');
      kal.className = 'kalem-satiri dm-yeni';
      kal.innerHTML =
        '<span class="ks-ikon"><i class="' + (f.getAttribute('data-dm-ikon') || 'fa-solid fa-location-dot') + '" aria-hidden="true"></i></span>' +
        '<span class="ks-metin"><b></b><small></small></span>' +
        '<span class="ks-eylem"><span class="rozet pasif"></span>' +
        '<button class="dugme hayalet dm-mini" type="button" data-dm-durum>Durumu gör</button>' +
        '<button class="dugme hayalet dm-mini" type="button" data-dm-sil>Kaldır</button></span>' +
        '<div class="dm-durum-govde" hidden></div>';
      kal.querySelector('b').textContent = deger.ad || 'Adsız kayıt';
      kal.querySelector('small').textContent = [deger.tur, deger.yer, deger.tarih, deger.not].filter(Boolean).join(' · ');
      kal.querySelector('.rozet').textContent = f.getAttribute('data-dm-rozet') || 'İnceleniyor';
      var zaman = new Date();
      kal.querySelector('.dm-durum-govde').textContent =
        'Gönderildi: ' + zaman.toLocaleString('tr-TR') + ' · Durum: ' +
        (f.getAttribute('data-dm-rozet') || 'İnceleniyor') + ' · Kayıt yalnız bu tarayıcı oturumunda tutulur.';
      var bosd = hedef.querySelector('.bos-durum'); if (bosd) bosd.hidden = true;
      hedef.insertBefore(kal, hedef.firstChild);
      bagla(kal);
      sayacTazele(hedef);
      duyur(hedef, (deger.ad || 'Kayıt') + ' listeye eklendi.');
      f.reset();
      var p = f.closest('.fb-modal'); if (p) panelKapa(p);
    });
  });

  /* ── 9 · SATIR EYLEMLERİ (var olan + sonradan eklenen) ───────────── */
  function bagla(kok) {
    qa('[data-dm-durum]', kok).forEach(function (b) {
      if (b.__bagli) return; b.__bagli = 1;
      b.addEventListener('click', function () {
        var g = b.closest('.kalem-satiri').querySelector('.dm-durum-govde');
        if (!g) return; g.hidden = !g.hidden;
        b.textContent = g.hidden ? 'Durumu gör' : 'Durumu gizle';
      });
    });
    qa('[data-dm-sil]', kok).forEach(function (b) {
      if (b.__bagli) return; b.__bagli = 1;
      b.addEventListener('click', function () {
        var s = b.closest('.kalem-satiri'), l = s.parentElement;
        var ad = (s.querySelector('b') || {}).textContent || 'Kayıt';
        s.remove(); sayacTazele(l);
        var kalan = qa('.kalem-satiri', l).length;
        var bosd = l.querySelector('.bos-durum'); if (bosd && !kalan) bosd.hidden = false;
        duyur(l, ad + ' listeden kaldırıldı.');
      });
    });
    qa('[data-dm-degistir]', kok).forEach(function (b) {
      if (b.__bagli) return; b.__bagli = 1;
      b.addEventListener('click', function () {
        var a = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', a ? 'true' : 'false');
        b.classList.toggle('aktif', a);
        var ac = b.getAttribute('data-dm-acik'), kp = b.getAttribute('data-dm-kapali');
        var et = b.querySelector('.dm-et'); if (et && ac && kp) et.textContent = a ? ac : kp;
        duyur(b, (a ? ac : kp) || 'Durum değişti');
      });
    });
  }
  bagla(d);

  function sayacTazele(liste) {
    var kap = liste.closest('[data-dm-kap]') || liste.parentElement;
    var s = kap ? kap.querySelector('[data-dm-sayac]') : null;
    if (!s) return;
    var n = qa('.kalem-satiri', liste).length;
    s.textContent = n + ' ' + (s.getAttribute('data-dm-sayac') || 'kayıt');
  }

  function duyur(yakin, metin) {
    var kap = yakin.closest ? (yakin.closest('.fit-pane') || d) : d;
    var s = kap.querySelector('[data-dm-bildirim]');
    if (s) s.textContent = metin;
  }
})();
