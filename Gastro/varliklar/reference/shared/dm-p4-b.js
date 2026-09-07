/* =====================================================================
   AJAN B · ŞEF PANELİM — PARTİ 4
   BAĞI lead attı; İÇERİĞİNİ yalnız kendi kulvarı yazar.
   KAYNAK BURASI: scripts/p4-varlik/dm-p4-b.js — ağaca kopyalanır.

   B1 · #icerikler "Abonelere özel içerik" erişim yönetimi — ölçekli
        KİP: sayfanın kendi `.tablo`su (karar b1-alt-b; ölçüm şerhi
        dm-p4-b.css'te). Kaynağın 6 satırının `.as-ikon` ve `.anahtar`
        ELEMANLARI silinmez, hücreye TAŞINIR — `spIc1…spIc6` id'leri,
        `for=` bağları ve `.sr-only` etiketleri ayakta kalır.
   L6 · #planlar  "Abonelik planı oluştur" — taslak akışı

   🔴 İÇERİK LİSTESİ UYDURULMAZ. Satırların TAMAMI sayfanın kendi üç
      listesinden HASAT edilir:
        · #icerikler > .ayar-liste .ayar-satir      (6 · erişim anahtarlı)
        · #icerikler > #spSeriBody tr               (3 · premium bölüm)
        · #icerikist > #spIcerikIstBody tr          (8 · en çok okunan)
      Ad'a göre tekilleştirilir → bugünkü nüfus 11. Sayfanın hapı
      "162 içerik" diyor ama 162 satırın 151'i bu sayfada YOK; ölçekli
      yüzey 11 gerçek satırla kurulur, 151 satır UYDURULMAZ.

   🔴 TARİH yalnız premium bölümlerde var (3/11). Kalan 8'de sayfada
      tarih verisi YOK → "—" yazılır, tarih uydurulmaz.
   🔴 GÖRSEL yok: sayfanın içerik verisinde hiç görsel yok. Kaynağın
      kendi ikonu olan satır onu taşır (`.as-ikon`), premium bölüm
      kartının kendi ikonunu (`fa-clapperboard`) taşır, kaynağında
      ikon OLMAYAN iki satır sayfanın kendi baş-harf avatarına düşer.

   🔴 ÖDEME SAĞLAYICI YOK → "yayına al" düğmesi YOK, plan TASLAK kalır,
      önizlemedeki abone düğmesi `disabled`. Abone sayısı taslakta
      "—" yazılır, 0 bile uydurulmaz sayılmaz — kayıt açılmıyor.
   ===================================================================== */
(function () {
  'use strict';

  var D = window.dmDepo || null;
  function toast(m, se) { if (window.dmToast) window.dmToast(m, se); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function slugla(t) {
    if (D && D.slugla) return D.slugla(t);
    return String(t || '').toLocaleLowerCase('tr')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  /* maket cümlesi — depo kalıcı değilse bunu SÖYLER, "kaydedildi" der geçmez */
  function maketAlt(ek) {
    var t = (D && D.kalici)
      ? 'Bu makette tarayıcına kaydedildi; sunucuya gitmez.'
      : 'Tarayıcı depolaması kapalı — değişiklik yalnız bu sayfa açıkken yaşar.';
    return ek ? ek + ' · ' + t : t;
  }
  function metin(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  /* eksik özne LİSTESİ — hangi öznenin düştüğü de bir ölçüdür */
  function eksikOzne(harita) {
    var y = [];
    for (var k in harita) if (Object.prototype.hasOwnProperty.call(harita, k))
      if (!harita[k]) y.push(k);
    return y;
  }
  window.__dmP4B = { b1:null, l6:null, b2:null, eksik:{} };
  function bayrak(ad, ok, eksik) {
    window.__dmP4B[ad] = !!ok;
    if (eksik && eksik.length) window.__dmP4B.eksik[ad] = eksik;
  }
  /* `.no` hücresinin BAŞLIK metni: <small> alt satırı hariç */
  function basMetin(el) {
    if (!el) return '';
    var s = '';
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3) s += n.nodeValue;
      else if (n.nodeType === 1 && n.tagName.toLowerCase() !== 'small') s += n.textContent;
    }
    return s.replace(/\s+/g, ' ').trim();
  }
  function altMetin(el) { return el ? metin(el.querySelector('small')) : ''; }
  function ozelMi(hucre) { return /abonelere\s+özel/i.test(metin(hucre)); }

  /* ═══════════════════════════════════════════════════════════════════
     B1 · İÇERİK ERİŞİM YÖNETİMİ
     ═══════════════════════════════════════════════════════════════════ */
  var TURLER = ['Tarif', 'Püf noktası', 'Video bölümü'];
  var SAYFA_BOY = 6;
  var DEPO_ANAHTAR = 'sef-icerik-erisim';

  function turBul(kategori) {
    if (/püf\s*nokta/i.test(kategori)) return 'Püf noktası';
    if (/premium\s*seri/i.test(kategori)) return 'Video bölümü';
    return 'Tarif';
  }

  /* ── HASAT — üç listeden, tekilleştirilerek ─────────────────────── */
  function hasat(liste) {
    var kayit = [], indeks = {};
    function kat(k) {
      var v = indeks[k.id];
      if (v) {                       /* tekilleştir: eksik alanı tamamla */
        if (!v.tarih && k.tarih) v.tarih = k.tarih;
        if (!v.ikon && k.ikon) v.ikon = k.ikon;
        if (!v.kategori && k.kategori) v.kategori = k.kategori;
        v.taniklar.push(k.tanik);
        return v;
      }
      k.taniklar = [k.tanik];
      indeks[k.id] = k; kayit.push(k); return k;
    }

    /* 1 · erişim listesi — anahtarı OLAN satırlar; eleman KORUNUR */
    [].forEach.call(liste ? liste.querySelectorAll('.ayar-satir') : [], function (satir) {
      var ad = metin(satir.querySelector('.as-metin b'));
      if (!ad) return;
      var meta = metin(satir.querySelector('.as-metin span'));
      var kategori = meta.split(' · ')[0] || '';
      var kutu = satir.querySelector('.anahtar input[type=checkbox]');
      var ikonEl = satir.querySelector('.as-ikon i');
      kat({
        id: slugla(ad), ad: ad, kategori: kategori, tur: turBul(kategori),
        tarih: '', ikon: ikonEl ? ikonEl.className : '', meta: meta,
        ozel: !!(kutu && kutu.checked), el: satir, kutu: kutu, tanik: 'erisim'
      });
    });

    /* 2 · premium seri tablosu — tarih BURADA var */
    [].forEach.call(document.querySelectorAll('#spSeriBody tr'), function (tr) {
      var ad = basMetin(tr.querySelector('.no'));
      if (!ad) return;
      var alt = altMetin(tr.querySelector('.no'));
      var p = alt.split(' · ');
      var k = kat({
        id: slugla(ad), ad: ad, kategori: 'Premium seri', tur: 'Video bölümü',
        tarih: p.length > 1 ? p[p.length - 1] : '',
        ikon: 'fa-solid fa-clapperboard',
        meta: alt, ozel: ozelMi(tr.cells[3]), el: null, kutu: null, tanik: 'seri'
      });
      k.seriHucre = tr.cells[3];
    });

    /* 3 · en çok okunan tablosu — yalnız YENİ ad getirir */
    [].forEach.call(document.querySelectorAll('#spIcerikIstBody tr'), function (tr) {
      var ad = basMetin(tr.querySelector('.no'));
      if (!ad) return;
      var alt = altMetin(tr.querySelector('.no'));
      var kategori = alt.split(' · ')[0] || '';
      var k = kat({
        id: slugla(ad), ad: ad, kategori: kategori, tur: turBul(kategori),
        tarih: '', ikon: '', meta: alt,
        ozel: ozelMi(tr.cells[4]), el: null, kutu: null, tanik: 'istatistik'
      });
      k.istHucre = tr.cells[4];
    });

    return kayit;
  }

  function b1Kur() {
    var pano = document.querySelector('[data-pane="icerikler"]');
    var liste = document.getElementById('spIcerikListe');       /* .tablo-kap */
    var kaynak = document.getElementById('spIcerikKaynak');     /* .ayar-liste */
    var araclar = document.getElementById('spIcerikAraclar');
    /* 🔴 "ÖZNE YOKSA KAPI SUSAR" — sessiz `return` da bir susturmadır.
       Eksik özne KONSOLA yazılmaz (konsol hatası 0 bir kapı ölçütü),
       ölçülebilir bir BAYRAĞA yazılır; kapı onu ayrı ölçüt olarak okur. */
    var eksik = eksikOzne({ pano:pano, spIcerikListe:liste,
      spIcerikKaynak:kaynak, spIcerikAraclar:araclar });
    if (eksik.length) { bayrak('b1', false, eksik); return null; }

    var kayitlar = hasat(kaynak);
    if (!kayitlar.length) return null;

    /* depo: yalnız DEĞİŞTİRİLMİŞ olanı taşır; kaynak hâli tabandır */
    var kayitli = (D ? D.oku(DEPO_ANAHTAR, null) : null) || {};
    kayitlar.forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(kayitli, k.id)) k.ozel = !!kayitli[k.id];
      k.secili = false;
    });

    var arama = document.getElementById('spIcerikArama');
    var aramaKap = arama ? arama.closest('.ie-arama') : null;
    var aramaSil = document.getElementById('spIcerikAramaSil');
    var turSec = document.getElementById('spIcerikTur');
    var durumSec = document.getElementById('spIcerikDurum');
    var tumu = document.getElementById('spIcerikTumu');
    var topluKap = document.getElementById('spIcerikToplu');
    var topluSay = document.getElementById('spIcerikTopluSay');
    var btnAcik = document.getElementById('spIcerikTopluAcik');
    var btnOzel = document.getElementById('spIcerikTopluOzel');
    var sayac = document.getElementById('spIcerikSay');
    var sonuc = document.getElementById('spIcerikSonuc');
    var pagi = document.getElementById('spIcerikPagi');
    var pagiNot = document.getElementById('spIcerikPagiNot');
    var sayfa = 1;

    /* ── satır çizimi — TABLO ──────────────────────────────────────
       Kaynağın kendi satırı VARSA elemanları TAŞINIR (silinmez,
       klonlanmaz); yoksa aynı yapıda yenisi üretilir. */
    function satirYap(k) {
      var tr = document.createElement('tr');
      tr.className = 'ie-satir';
      tr.innerHTML =
        '<td class="sec"><input type="checkbox" class="ie-sec" aria-label="' +
          esc(k.ad) + ' — toplu işlem için seç"></td>' +
        '<td class="icerik"><div class="ie-ic"><span class="ie-gorsel"></span>' +
          '<div class="ie-govde"><b>' + esc(k.ad) + '</b><small>' + esc(k.meta || k.kategori) + '</small></div>' +
          '</div></td>' +
        '<td class="tur-h"><span class="ie-tur">' + esc(k.tur) + '</span></td>' +
        /* 🔴 TARİH UYDURULMAZ: sayfada yalnız premium bölümlerin tarihi
           var. Kalanı em-dash + ekran okuyucuya açık metin. */
        '<td class="tarih-h"><span class="ie-tarih' + (k.tarih ? '' : ' yok') + '"' +
          (k.tarih ? '' : ' title="Bu içerikte tarih kaydı yok"') + '>' +
          (k.tarih ? esc(k.tarih) : '—<span class="sr-only">tarih kaydı yok</span>') + '</span></td>' +
        '<td class="erisim"></td>';
      var gorselYuva = tr.querySelector('.ie-gorsel');
      var erisimYuva = tr.querySelector('td.erisim');

      /* GÖRSEL — kaynağın kendi ikonu varsa O ELEMAN taşınır */
      var ikonEl = k.el ? k.el.querySelector('.as-ikon') : null;
      if (ikonEl) gorselYuva.parentNode.replaceChild(ikonEl, gorselYuva);
      else if (k.ikon) {
        var i2 = document.createElement('span');
        i2.className = 'as-ikon'; i2.setAttribute('aria-hidden', 'true');
        i2.innerHTML = '<i class="' + esc(k.ikon) + '"></i>';
        gorselYuva.parentNode.replaceChild(i2, gorselYuva);
      } else {
        /* kaynakta ikon YOK — sayfanın kendi baş-harf avatarı
           (KOPYALAMA-KURALI §4 gerekçe 4: kaynakta karşılığı olmayan kip) */
        var a = document.createElement('span');
        a.className = 'avatar harf'; a.setAttribute('aria-hidden', 'true');
        a.textContent = k.ad.charAt(0);
        gorselYuva.parentNode.replaceChild(a, gorselYuva);
      }

      /* ANAHTAR — kaynağın kendi label'ı TAŞINIR (id/for/sr-only korunur) */
      var anahtar = k.el ? k.el.querySelector('.anahtar') : null;
      if (!anahtar) {
        anahtar = document.createElement('label');
        anahtar.className = 'anahtar';
        anahtar.setAttribute('for', 'ieSw-' + k.id);
        anahtar.innerHTML = '<input type="checkbox" id="ieSw-' + esc(k.id) + '">' +
          '<span class="anahtar-ray"></span>' +
          '<span class="sr-only">' + esc(k.ad) + ' abonelere özel</span>';
      }
      erisimYuva.appendChild(anahtar);
      k.kutu = anahtar.querySelector('input[type=checkbox]');
      return tr;
    }

    /* 🔴 kaynak satırı önce OKUNUR, sonra ELEMANLARI taşınır; taşıma
       bitince artık boş kalan `.ayar-satir` sarmalayıcısı DOM'dan
       çıkar. Karşılığı olmadan düşen İÇERİK 0: ikon, anahtar, ad ve
       meta'nın dördünün de hücre karşılığı var. */
    kayitlar.forEach(function (k) {
      var kaynakSatir = k.el;
      k.tr = satirYap(k);
      if (kaynakSatir && kaynakSatir.parentNode) kaynakSatir.parentNode.removeChild(kaynakSatir);
      k.el = k.tr;
      k.secKutu = k.tr.querySelector('.ie-sec');
    });
    var govde = document.getElementById('spIcerikGovde');
    if (!govde) return null;

    /* ── süzme ─────────────────────────────────────────────────────── */
    function suz() {
      var q = (arama && arama.value || '').trim().toLocaleLowerCase('tr');
      var t = turSec ? turSec.value : '';
      var dr = durumSec ? durumSec.value : '';
      return kayitlar.filter(function (k) {
        if (t && k.tur !== t) return false;
        if (dr === 'ozel' && !k.ozel) return false;
        if (dr === 'acik' && k.ozel) return false;
        if (!q) return true;
        return (k.ad + ' ' + k.kategori + ' ' + (k.meta || ''))
          .toLocaleLowerCase('tr').indexOf(q) !== -1;
      });
    }

    /* ── sayaç · süzgeç sayıları · toplu şerit ─────────────────────── */
    function sayimYaz() {
      var ozel = 0;
      kayitlar.forEach(function (k) { if (k.ozel) ozel++; });
      var acik = kayitlar.length - ozel;
      if (sayac) {
        sayac.textContent = acik + ' herkese açık · ' + ozel + ' abonelere özel';
        sayac.classList.toggle('kapali', true);
      }
      if (turSec) [].forEach.call(turSec.options, function (o) {
        var n = o.value ? kayitlar.filter(function (k) { return k.tur === o.value; }).length
                        : kayitlar.length;
        o.textContent = (o.dataset.ad || o.textContent.replace(/\s*\(\d+\)$/, '')) + ' (' + n + ')';
        o.dataset.ad = o.dataset.ad || o.textContent.replace(/\s*\(\d+\)$/, '');
      });
      if (durumSec) [].forEach.call(durumSec.options, function (o) {
        var n = o.value === 'ozel' ? ozel : o.value === 'acik' ? acik : kayitlar.length;
        o.textContent = (o.dataset.ad || o.textContent.replace(/\s*\(\d+\)$/, '')) + ' (' + n + ')';
        o.dataset.ad = o.dataset.ad || o.textContent.replace(/\s*\(\d+\)$/, '');
      });
    }
    /* aynı datum başka listede de görünüyor — TANIK ÇOĞALTMA yok,
       durum değişince kardeş tanıklar da yazılır */
    function taniklariYaz(k) {
      var hap = k.ozel
        ? '<i class="fa-solid fa-lock" aria-hidden="true"></i> Abonelere özel'
        : '<i class="fa-solid fa-globe" aria-hidden="true"></i> Herkese açık';
      [k.seriHucre, k.istHucre].forEach(function (h) {
        if (!h) return;
        var r = h.querySelector('.durum-hapi');
        if (!r) return;
        r.className = 'durum-hapi ' + (k.ozel ? 'bekleyen' : 'cozulen');
        r.innerHTML = hap;
      });
    }
    function depoyaYaz() {
      if (!D) return;
      var o = {};
      kayitlar.forEach(function (k) { o[k.id] = k.ozel; });
      D.yaz(DEPO_ANAHTAR, o);
    }
    function topluYaz() {
      var s = kayitlar.filter(function (k) { return k.secili; });
      if (topluSay) topluSay.textContent = s.length
        ? s.length + ' içerik seçili'
        : 'Toplu işlem için satırları seç';
      if (topluKap) topluKap.classList.toggle('var', s.length > 0);
      if (btnAcik) btnAcik.disabled = !s.length;
      if (btnOzel) btnOzel.disabled = !s.length;
      var g = suz();
      if (tumu) {
        var gs = g.filter(function (k) { return k.secili; }).length;
        tumu.checked = g.length > 0 && gs === g.length;
        tumu.indeterminate = gs > 0 && gs < g.length;
      }
    }

    /* ── çizim ─────────────────────────────────────────────────────── */
    function ciz() {
      var g = suz();
      var sayfaSay = Math.max(1, Math.ceil(g.length / SAYFA_BOY));
      if (sayfa > sayfaSay) sayfa = sayfaSay;
      while (govde.firstChild) govde.removeChild(govde.firstChild);   /* eleman SİLMEZ, ayırır */
      var bosKap = document.getElementById('spIcerikBos');
      if (!g.length) {
        if (bosKap) {
          bosKap.hidden = false;
          bosKap.innerHTML = '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
            '<b>Süzgece uyan içerik yok</b>' +
            '<span>' + kayitlar.length + ' içeriğin hiçbiri bu arama ve süzgeç birleşimine uymuyor. ' +
            'Süzgeci gevşetip yeniden dene.</span>';
        }
        if (liste) liste.hidden = true;
      } else {
        if (bosKap) bosKap.hidden = true;
        if (liste) liste.hidden = false;
        g.slice((sayfa - 1) * SAYFA_BOY, sayfa * SAYFA_BOY).forEach(function (k) {
          k.tr.classList.toggle('secili', !!k.secili);
          if (k.secKutu) k.secKutu.checked = !!k.secili;
          if (k.kutu) k.kutu.checked = !!k.ozel;
          govde.appendChild(k.tr);
        });
      }
      pagiCiz(sayfaSay, g.length);
      topluYaz();
    }
    function pagiCiz(sayfaSay, toplam) {
      if (!pagi) return;
      while (pagi.firstChild) pagi.removeChild(pagi.firstChild);
      if (sayfaSay > 1) {
        var ekle = function (ic, etiket, hedef, durum) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'pg' + (durum === 'aktif' ? ' active' : '') + (etiket ? ' arrow' : '');
          if (durum === 'kapali') b.disabled = true;
          if (durum === 'aktif') b.setAttribute('aria-current', 'page');
          if (etiket) b.setAttribute('aria-label', etiket);
          b.innerHTML = ic;
          b.addEventListener('click', function () { sayfa = hedef; ciz(); if (liste) liste.scrollIntoView({ block: 'nearest' }); });
          pagi.appendChild(b);
        };
        ekle('<i class="fa-solid fa-angles-left" aria-hidden="true"></i>', 'İlk sayfa', 1, sayfa === 1 ? 'kapali' : '');
        ekle('<i class="fa-solid fa-angle-left" aria-hidden="true"></i>', 'Önceki sayfa', sayfa - 1, sayfa === 1 ? 'kapali' : '');
        for (var i = 1; i <= sayfaSay; i++) ekle(String(i), '', i, i === sayfa ? 'aktif' : '');
        ekle('<i class="fa-solid fa-angle-right" aria-hidden="true"></i>', 'Sonraki sayfa', sayfa + 1, sayfa === sayfaSay ? 'kapali' : '');
        ekle('<i class="fa-solid fa-angles-right" aria-hidden="true"></i>', 'Son sayfa', sayfaSay, sayfa === sayfaSay ? 'kapali' : '');
      }
      if (pagiNot) {
        var bas = toplam ? (sayfa - 1) * SAYFA_BOY + 1 : 0;
        var son = Math.min(sayfa * SAYFA_BOY, toplam);
        pagiNot.textContent = toplam
          ? toplam + ' içeriğin ' + bas + '–' + son + ' arası gösteriliyor' +
            (toplam < kayitlar.length ? ' · ' + kayitlar.length + ' içerikten süzüldü' : '')
          : 'Gösterilecek içerik yok';
      }
    }

    /* ── durum değişimi ────────────────────────────────────────────── */
    function durumDegistir(k, ozel, sessiz) {
      if (k.ozel === ozel) return false;
      k.ozel = ozel;
      if (k.kutu) k.kutu.checked = ozel;
      taniklariYaz(k);
      if (!sessiz) {
        var eski = !ozel;
        toast(ozel ? '“' + k.ad + '” artık abonelere özel' : '“' + k.ad + '” artık herkese açık',
          { tip: 'basarili', alt: maketAlt(k.tur), geri: { metin: 'Geri al', cb: function () {
            durumDegistir(k, eski, true); depoyaYaz(); sayimYaz(); ciz(); yankiYaz(k, eski);
          } } });
      }
      return true;
    }
    function yankiYaz(k, ozel) {
      if (!sonuc) return;
      var t = sonuc.querySelector('.od-sonuc-txt');
      if (t) t.textContent = ozel
        ? '“' + k.ad + '” artık yalnız abonelerin görebileceği içerik.'
        : '“' + k.ad + '” artık herkese açık.';
    }

    /* ── olaylar ───────────────────────────────────────────────────── */
    govde.addEventListener('change', function (e) {
      var g = e.target;
      if (!g.matches) return;
      if (g.matches('.ie-sec')) {
        var s = g.closest('tr');
        var k = kayitlar.filter(function (x) { return x.tr === s; })[0];
        if (k) { k.secili = g.checked; k.tr.classList.toggle('secili', g.checked); topluYaz(); }
        return;
      }
      if (g.matches('.anahtar input[type=checkbox]')) {
        var st = g.closest('tr');
        var kk = kayitlar.filter(function (x) { return x.tr === st; })[0];
        if (!kk) return;
        durumDegistir(kk, g.checked);
        yankiYaz(kk, kk.ozel);
        depoyaYaz(); sayimYaz(); ciz();
      }
    });
    if (tumu) tumu.addEventListener('change', function () {
      var g = suz(), v = tumu.checked;
      g.forEach(function (k) { k.secili = v; });
      ciz();
    });
    function topluUygula(ozel) {
      var s = kayitlar.filter(function (k) { return k.secili; });
      if (!s.length) return;
      var onceki = s.map(function (k) { return { k: k, o: k.ozel }; });
      var n = 0;
      s.forEach(function (k) { if (durumDegistir(k, ozel, true)) n++; });
      depoyaYaz(); sayimYaz(); ciz();
      toast(n ? n + ' içerik ' + (ozel ? 'abonelere özel yapıldı' : 'herkese açıldı')
              : 'Seçili içerikler zaten ' + (ozel ? 'abonelere özeldi' : 'herkese açıktı'),
        { tip: n ? 'basarili' : 'bilgi',
          alt: maketAlt(s.length + ' satır seçiliydi'),
          geri: n ? { metin: 'Geri al', cb: function () {
            onceki.forEach(function (x) { durumDegistir(x.k, x.o, true); });
            depoyaYaz(); sayimYaz(); ciz();
          } } : null });
    }
    if (btnAcik) btnAcik.addEventListener('click', function () { topluUygula(false); });
    if (btnOzel) btnOzel.addEventListener('click', function () { topluUygula(true); });

    function suzgecDegisti() { sayfa = 1; ciz(); }
    if (arama) arama.addEventListener('input', function () {
      if (aramaKap) aramaKap.classList.toggle('dolu', !!arama.value);
      suzgecDegisti();
    });
    if (aramaSil) aramaSil.addEventListener('click', function () {
      arama.value = ''; if (aramaKap) aramaKap.classList.remove('dolu');
      arama.focus(); suzgecDegisti();
    });
    if (turSec) turSec.addEventListener('change', suzgecDegisti);
    if (durumSec) durumSec.addEventListener('change', suzgecDegisti);

    kayitlar.forEach(taniklariYaz);
    sayimYaz(); ciz();

    bayrak('b1', true, null);
    return {
      kayitlar: kayitlar,
      ozelSayisi: function () { return kayitlar.filter(function (k) { return k.ozel; }).length; },
      toplam: function () { return kayitlar.length; }
    };
  }

  /* ═══════════════════════════════════════════════════════════════════
     L6 · ABONELİK PLANI — TASLAK AKIŞI
     ═══════════════════════════════════════════════════════════════════ */
  var PLAN_ANAHTAR = 'sef-plan-taslak';

  function paraYaz(n) {
    var s = (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
    return '₺' + s.replace(/\B(?=(\d{3})+(?!\d)(?=,))/g, '.');
  }
  function sayiOku(v) {
    var t = String(v || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    var n = parseFloat(t);
    return isFinite(n) ? n : NaN;
  }

  function l6Kur(b1) {
    var modal = document.getElementById('spPlanModal');
    var ac = document.getElementById('spPlanEkle');
    var form = document.getElementById('spPlanForm');
    var liste = document.getElementById('spPlanList');
    var eksik = eksikOzne({ spPlanModal:modal, spPlanEkle:ac, spPlanForm:form,
      spPlanList:liste, 'window.dmModal':window.dmModal || null });
    if (eksik.length) { bayrak('l6', false, eksik); return null; }

    var alanAd = document.getElementById('spPlanAd');
    var alanAylik = document.getElementById('spPlanAylik');
    var alanYillik = document.getElementById('spPlanYillik');
    var alanAcik = document.getElementById('spPlanAciklama');
    var dahilListe = document.getElementById('spPlanDahil');
    var dahilEkle = document.getElementById('spPlanDahilEkle');
    var otoSay = document.getElementById('spPlanOtoSay');
    var otoNot = document.getElementById('spPlanOtoNot');
    var kaydet = document.getElementById('spPlanKaydet');
    var baslik = document.getElementById('spPlanModalBaslik');
    var duzenlenen = null;

    /* ── K10 · tekrarlayan satır: numara · tutamak · onaylı sil ─────── */
    function dahilSatir(deger) {
      var li = document.createElement('li');
      li.className = 'dahil-satir';
      li.innerHTML =
        '<button class="dahil-tutamak" type="button" aria-label="Sırayı değiştir — yukarı/aşağı ok tuşlarıyla taşı">' +
          '<i class="fa-solid fa-grip-vertical" aria-hidden="true"></i></button>' +
        '<span class="dahil-no" aria-hidden="true">1</span>' +
        '<input class="alan-girdi" type="text" placeholder="Örneğin: Haftada bir abonelere özel tarif">' +
        '<button class="dahil-sil" type="button" aria-label="Bu maddeyi sil">' +
          '<i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>';
      li.querySelector('input').value = deger || '';
      li.querySelector('.dahil-tutamak').draggable = true;
      return li;
    }
    function dahilNumarala() {
      var s = dahilListe.querySelectorAll('.dahil-satir');
      [].forEach.call(s, function (li, i) {
        li.querySelector('.dahil-no').textContent = String(i + 1);
        /* 🔴 SON SATIR SİLİNMEZ — kalıp orada yaşıyor (kanon L10) */
        li.querySelector('.dahil-sil').disabled = (s.length === 1);
      });
    }
    function dahilYaz(maddeler) {
      while (dahilListe.firstChild) dahilListe.removeChild(dahilListe.firstChild);
      var m = (maddeler && maddeler.length) ? maddeler : [''];
      m.forEach(function (x) { dahilListe.appendChild(dahilSatir(x)); });
      dahilNumarala();
    }
    function dahilOku() {
      return [].map.call(dahilListe.querySelectorAll('.dahil-satir input'), function (i) {
        return i.value.trim();
      }).filter(Boolean);
    }
    dahilEkle.addEventListener('click', function () {
      var li = dahilSatir('');
      dahilListe.appendChild(li); dahilNumarala();
      li.querySelector('input').focus();
      onizle();
    });
    dahilListe.addEventListener('input', onizle);
    dahilListe.addEventListener('click', function (e) {
      var evet = e.target.closest('.dahil-onay .evet');
      if (evet) { var o = evet.closest('.dahil-onay'); var h = o.__satir; o.remove(); if (h) h.remove(); dahilNumarala(); onizle(); return; }
      var hayir = e.target.closest('.dahil-onay .hayir');
      if (hayir) { var oo = hayir.closest('.dahil-onay'); if (oo.__satir) oo.__satir.hidden = false; oo.remove(); return; }
      var sil = e.target.closest('.dahil-sil');
      if (!sil) return;
      var li = sil.closest('.dahil-satir');
      var girdi = li.querySelector('input');
      /* 🔴 BOŞ SATIRDA ONAY SORULMAZ (kanon L10) */
      if (!girdi.value.trim()) { li.remove(); dahilNumarala(); onizle(); return; }
      var onay = document.createElement('li');
      onay.className = 'dahil-onay';
      onay.innerHTML = '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' +
        '<span>“' + esc(girdi.value.trim()) + '” maddesi silinsin mi?</span>' +
        '<span class="sag"><button type="button" class="hayir">Vazgeç</button>' +
        '<button type="button" class="evet">Sil</button></span>';
      onay.__satir = li;
      li.hidden = true;
      dahilListe.insertBefore(onay, li);
      onay.querySelector('.evet').focus();
    });
    /* tutamak: sürükle-bırak + ok tuşları (L10 sözleşmesi) */
    var suruklenen = null;
    dahilListe.addEventListener('dragstart', function (e) {
      var t = e.target.closest('.dahil-tutamak'); if (!t) return;
      suruklenen = t.closest('.dahil-satir');
      suruklenen.classList.add('suruklenen');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', ''); } catch (x) {}
    });
    dahilListe.addEventListener('dragover', function (e) {
      if (!suruklenen) return;
      e.preventDefault();
      var li = e.target.closest('.dahil-satir');
      if (!li || li === suruklenen) return;
      var r = li.getBoundingClientRect();
      dahilListe.insertBefore(suruklenen, (e.clientY - r.top) > r.height / 2 ? li.nextSibling : li);
      dahilNumarala();
    });
    dahilListe.addEventListener('dragend', function () {
      if (suruklenen) suruklenen.classList.remove('suruklenen');
      suruklenen = null; dahilNumarala(); onizle();
    });
    dahilListe.addEventListener('keydown', function (e) {
      var t = e.target.closest('.dahil-tutamak'); if (!t) return;
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      var li = t.closest('.dahil-satir');
      if (e.key === 'ArrowUp' && li.previousElementSibling) dahilListe.insertBefore(li, li.previousElementSibling);
      if (e.key === 'ArrowDown' && li.nextElementSibling) dahilListe.insertBefore(li.nextElementSibling, li);
      dahilNumarala(); t.focus(); onizle();
    });

    /* ── otomatik alan: abonelere özel içerik sayısı ─────────────────
       🔴 ELLE GİRİLMEZ. #icerikler'in deposundan okunur. */
    function otoSayi() {
      if (b1) return { ozel: b1.ozelSayisi(), toplam: b1.toplam() };
      var o = (D ? D.oku(DEPO_ANAHTAR, null) : null) || {};
      var n = 0, t = 0;
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) { t++; if (o[k]) n++; }
      return { ozel: n, toplam: t };
    }
    function otoYaz() {
      var s = otoSayi();
      if (otoSay) otoSay.textContent = String(s.ozel);
      if (otoNot) otoNot.textContent = s.toplam
        ? 'Abonelere Özel İçerikler sekmesindeki ' + s.toplam + ' içeriğin ' + s.ozel +
          '’i kilitli. Bu sayı elle girilmez; anahtarı orada çevirdiğinde burada da değişir.'
        : 'İçerik listesi okunamadı — sayı elle girilmez.';
    }

    /* ── canlı önizleme kartı (donör `.uy-plan`) ─────────────────────── */
    var oAd = document.getElementById('spPoAd');
    var oAcik = document.getElementById('spPoAciklama');
    var oFiyat = document.getElementById('spPoFiyat');
    var oYillik = document.getElementById('spPoYillik');
    var oMadde = document.getElementById('spPoMadde');
    function onizle() {
      var ad = (alanAd.value || '').trim();
      var ay = sayiOku(alanAylik.value);
      var yil = sayiOku(alanYillik.value);
      var ack = (alanAcik.value || '').trim();
      if (oAd) oAd.textContent = ad || 'Plan adı';
      if (oAcik) oAcik.textContent = ack || 'Planın kısa açıklaması burada görünür.';
      if (oFiyat) oFiyat.textContent = isFinite(ay) ? paraYaz(ay) : '₺—';
      if (oYillik) oYillik.textContent = isFinite(yil)
        ? 'Yıllık ' + paraYaz(yil) + (isFinite(ay) && ay > 0 && yil < ay * 12
            ? ' · ' + (Math.round((ay * 12 - yil) / ay * 10) / 10).toString().replace('.', ',') + ' ay indirim'
            : '')
        : 'Yıllık ücret girilmedi';
      if (oMadde) {
        var s = otoSayi();
        var h = dahilOku().map(function (m) {
          return '<li><i class="fa-solid fa-check" aria-hidden="true"></i> ' + esc(m) + '</li>';
        }).join('');
        h += '<li class="otomatik"><i class="fa-solid fa-lock" aria-hidden="true"></i> ' +
             s.ozel + ' abonelere özel içeriğe erişim <span class="sr-only">(otomatik)</span></li>';
        oMadde.innerHTML = h;
      }
      otoYaz();
    }
    ['input', 'change'].forEach(function (o) { form.addEventListener(o, onizle); });

    /* ── taslak deposu ve liste satırı ──────────────────────────────── */
    function taslaklar() { return (D ? D.oku(PLAN_ANAHTAR, null) : null) || []; }
    function taslakYaz(l) { if (D) D.yaz(PLAN_ANAHTAR, l); }

    function satirCiz(t) {
      var eski = liste.querySelector('[data-plan-taslak="' + t.id + '"]');
      var d = document.createElement('div');
      var pasif = t.durum === 'pasif';
      d.className = 'paket-satiri taslak';
      d.setAttribute('data-plan-taslak', t.id);
      d.innerHTML =
        '<span class="avatar harf" aria-hidden="true">' + esc((t.ad || '?').charAt(0)) + '</span>' +
        '<div class="bilgi">' +
          '<b>' + esc(t.ad) + ' <span class="durum-hapi ' + (pasif ? 'kapali' : 'bekleyen') + '">' +
            '<i class="fa-solid fa-' + (pasif ? 'circle-pause' : 'pen-ruler') + '" aria-hidden="true"></i> ' +
            (pasif ? 'Pasif' : 'Taslak') + '</span></b>' +
          '<span class="plan">Aylık ' + esc(paraYaz(t.aylik)) + ' · Yıllık ' + esc(paraYaz(t.yillik)) + '</span>' +
          '<span class="not"><i class="fa-solid fa-users" aria-hidden="true"></i> Abone: <b>—</b> ' +
            '(taslak plan yayında değil, abone kaydı açılmaz)</span>' +
          '<span class="not"><i class="fa-solid fa-lock" aria-hidden="true"></i> ' +
            esc(String(t.ozelSayi)) + ' abonelere özel içerik · ' + t.dahil.length + ' madde</span>' +
          '<div class="taslak-not"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> ' +
            '<span>Ödeme altyapısı bağlanınca yayına alınır. Bu makette yayına alma adımı ' +
            'YOKTUR; plan taslak olarak saklanır.</span></div>' +
        '</div>' +
        '<div class="fiyat"><b>' + esc(paraYaz(t.aylik)) + '</b><span>/ ay</span></div>' +
        '<div class="eylemler">' +
          '<button class="satir-dugme" type="button" data-taslak-duzenle="' + esc(t.id) + '">' +
            '<i class="fa-solid fa-pen" aria-hidden="true"></i> Düzenle</button>' +
          '<button class="satir-dugme" type="button" data-taslak-pasif="' + esc(t.id) + '">' +
            '<i class="fa-solid fa-' + (pasif ? 'play' : 'pause') + '" aria-hidden="true"></i> ' +
            (pasif ? 'Taslağa Al' : 'Pasife Al') + '</button>' +
          '<button class="satir-dugme" type="button" data-taslak-sil="' + esc(t.id) + '">' +
            '<i class="fa-regular fa-trash-can" aria-hidden="true"></i> Sil</button>' +
        '</div>';
      if (eski) liste.replaceChild(d, eski); else liste.appendChild(d);
    }
    function listeCiz() {
      [].forEach.call(liste.querySelectorAll('[data-plan-taslak]'), function (x) { x.remove(); });
      taslaklar().forEach(satirCiz);
    }

    liste.addEventListener('click', function (e) {
      var b = e.target.closest('[data-taslak-duzenle],[data-taslak-pasif],[data-taslak-sil]');
      if (!b) return;
      var l = taslaklar();
      var id = b.getAttribute('data-taslak-duzenle') || b.getAttribute('data-taslak-pasif') || b.getAttribute('data-taslak-sil');
      var t = l.filter(function (x) { return x.id === id; })[0];
      if (!t) return;
      if (b.hasAttribute('data-taslak-duzenle')) { modalAc(t); return; }
      if (b.hasAttribute('data-taslak-pasif')) {
        t.durum = t.durum === 'pasif' ? 'taslak' : 'pasif';
        taslakYaz(l); listeCiz();
        toast('“' + t.ad + '” ' + (t.durum === 'pasif' ? 'pasife alındı' : 'taslağa alındı'),
          { tip: 'basarili', alt: maketAlt() });
        return;
      }
      var kalan = l.filter(function (x) { return x.id !== id; });
      taslakYaz(kalan); listeCiz();
      toast('“' + t.ad + '” taslağı silindi', { tip: 'basarili', alt: maketAlt(),
        geri: { metin: 'Geri al', cb: function () { var y = taslaklar(); y.push(t); taslakYaz(y); listeCiz(); } } });
    });

    /* ── modal ───────────────────────────────────────────────────────── */
    /* ── B2 · YAYINDAKİ PLAN — SALT OKUNUR ─────────────────────────────
       🔴 Kaydet düğmesi DISABLED değil, HİÇ BASILMIYOR: olmayan bir
          eylemin düğmesi durmaz. Sebep modalın içinde yazıyor. */
    var yayinKipi = false;
    function yayinKipiYaz(acik, k) {
      yayinKipi = acik;
      var uyari = document.getElementById('spPlanYayinUyari');
      if (uyari) {
        uyari.hidden = !acik;
        if (acik) uyari.querySelector('span').innerHTML =
          '<b>“' + esc(k.ad) + '” YAYINDA ve buradan değiştirilemez.</b> ' +
          'Yayındaki bir planın ücreti, adı ve kontenjanı ödeme sağlayıcısında ' +
          'yaşıyor; o altyapı bağlanmadan yapılan bir kayıt hiçbir yere gitmezdi. ' +
          'Alanlar planın <b>sayfadaki kayıtlı değerleriyle</b> dolu ve salt okunur.';
      }
      [alanAd, alanAylik, alanYillik, alanAcik].forEach(function (el) {
        if (acik) el.setAttribute('readonly', ''); else el.removeAttribute('readonly');
      });
      if (dahilEkle) dahilEkle.hidden = acik;
      [].forEach.call(dahilListe.querySelectorAll('.dahil-sil,.dahil-tutamak'), function (x) { x.hidden = acik; });
      [].forEach.call(dahilListe.querySelectorAll('input'), function (x) {
        if (acik) x.setAttribute('readonly', ''); else x.removeAttribute('readonly');
      });
      if (kaydet) kaydet.hidden = acik;
      var vazgec = modal.querySelector('.dm-modal-ayak .dugme.hayalet');
      if (vazgec) vazgec.textContent = acik ? 'Kapat' : 'Vazgeç';
      var ayakNot = modal.querySelector('.dm-modal-ayak .durum-satir span');
      if (ayakNot) ayakNot.innerHTML = acik
        ? 'Bu plan <b>yayında</b>; kaydetme düğmesi yok çünkü kayıt yapılamıyor.'
        : 'Kayıt <b>taslak</b> kalır; yayına alma düğmesi yoktur.';
    }
    function yayinAc(k) {
      duzenlenen = null;
      if (baslik) baslik.textContent = 'Plan: ' + k.ad;
      alanAd.value = k.ad;
      alanAylik.value = k.aylik;
      alanYillik.value = k.yillik;
      /* 🔴 AÇIKLAMA UYDURULMAZ: sayfada bu planların açıklama metni YOK.
         Satırın kendi not satırları veri olarak gösterilir. */
      alanAcik.value = k.notlar.join('\n');
      dahilYaz(['']);
      /* 🔴 MADDE LİSTESİ DE UYDURULMAZ: sayfada bu planların "dahil
         olanlar" verisi yok; tek satır boş ve salt okunur kalır. */
      var ilk = dahilListe.querySelector('input');
      if (ilk) ilk.placeholder = 'Bu planın madde listesi sayfada kayıtlı değil';
      hatalariTemizle();
      yayinKipiYaz(true, k);
      onizle();
      window.dmModal.ac(modal);
    }
    function modalAc(t) {
      duzenlenen = t || null;
      yayinKipiYaz(false, {});
      if (baslik) baslik.textContent = t ? 'Plan taslağını düzenle' : 'Abonelik planı oluştur';
      if (kaydet && kaydet.lastChild) kaydet.lastChild.nodeValue = t ? ' Taslağı Güncelle' : ' Taslak Olarak Kaydet';
      alanAd.value = t ? t.ad : '';
      alanAylik.value = t ? String(t.aylik).replace('.', ',') : '';
      alanYillik.value = t ? String(t.yillik).replace('.', ',') : '';
      alanAcik.value = t ? t.aciklama : '';
      dahilYaz(t ? t.dahil : ['']);
      hatalariTemizle();
      onizle();
      window.dmModal.ac(modal);
    }
    function hatalariTemizle() {
      [alanAd, alanAylik, alanYillik, alanAcik].forEach(function (el) {
        el.classList.remove('is-err'); el.removeAttribute('aria-invalid');
      });
      [].forEach.call(modal.querySelectorAll('.fk-hata'), function (h) { h.classList.remove('show'); });
    }
    function isaret(el, hataId, gecerli) {
      var h = document.getElementById(hataId);
      el.classList.toggle('is-err', !gecerli);
      el.setAttribute('aria-invalid', gecerli ? 'false' : 'true');
      if (h) h.classList.toggle('show', !gecerli);
      return gecerli;
    }
    ac.addEventListener('click', function () { modalAc(null); });
    /* 🔴 SAYFADA İKİ "Abonelik Planı Oluştur" DÜĞMESİ VAR ve ölçümde
       İKİSİ DE ÖLÜYDÜ: biri #planlar panosunda, biri kimlik kartında.
       Hero düğmesi önce panoyu açar (modal kapanınca kullanıcı doğru
       yerde kalsın), sonra aynı modalı açar. */
    var heroAc = document.getElementById('spPlanEkleHero');
    if (heroAc) heroAc.addEventListener('click', function () {
      var sekme = document.querySelector('.sekme[data-tab="planlar"]');
      if (sekme && sekme.getAttribute('aria-selected') !== 'true') sekme.click();
      modalAc(null);
    });
    [].forEach.call(modal.querySelectorAll('[data-plan-kapat]'), function (b) {
      b.addEventListener('click', function () { window.dmModal.kapat(modal); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      /* 🔴 Kaydet düğmesi yayın kipinde basılmıyor ama form Enter ile de
         gönderilebilir; kayıt yolu ORADA da kapalı. */
      if (yayinKipi) return;
      var ay = sayiOku(alanAylik.value), yil = sayiOku(alanYillik.value);
      var ok = true, ilk = null;
      if (!isaret(alanAd, 'spPlanAdHata', alanAd.value.trim().length >= 3)) { ok = false; ilk = ilk || alanAd; }
      if (!isaret(alanAylik, 'spPlanAylikHata', isFinite(ay) && ay >= 29 && ay <= 999)) { ok = false; ilk = ilk || alanAylik; }
      if (!isaret(alanYillik, 'spPlanYillikHata', isFinite(yil) && isFinite(ay) && yil <= ay * 10)) { ok = false; ilk = ilk || alanYillik; }
      if (!isaret(alanAcik, 'spPlanAciklamaHata', alanAcik.value.trim().length >= 20)) { ok = false; ilk = ilk || alanAcik; }
      if (!ok) { if (ilk) ilk.focus(); return; }

      var l = taslaklar();
      var s = otoSayi();
      var kayit = {
        id: duzenlenen ? duzenlenen.id : ('taslak-' + slugla(alanAd.value) + '-' + Date.now().toString(36)),
        ad: alanAd.value.trim(), aylik: ay, yillik: yil,
        aciklama: alanAcik.value.trim(), dahil: dahilOku(),
        ozelSayi: s.ozel, durum: duzenlenen ? duzenlenen.durum : 'taslak',
        zaman: Date.now()
      };
      if (duzenlenen) {
        for (var i = 0; i < l.length; i++) if (l[i].id === kayit.id) l[i] = kayit;
      } else l.push(kayit);
      taslakYaz(l); listeCiz();
      window.dmModal.kapat(modal);
      toast(duzenlenen ? 'Plan taslağı güncellendi' : 'Plan taslağı kaydedildi',
        { tip: 'basarili',
          alt: maketAlt('Yayına alma adımı yok — ödeme altyapısı bağlanmadı') });
      var yeni = liste.querySelector('[data-plan-taslak="' + kayit.id + '"]');
      if (yeni) yeni.scrollIntoView({ block: 'nearest' });
    });

    /* #icerikler'de anahtar çevrilince otomatik alan ve önizleme tazelenir */
    document.addEventListener('dm-depo', function (e) {
      if (!e.detail || (e.detail.bolum !== DEPO_ANAHTAR && e.detail.bolum !== '*')) return;
      otoYaz();
      if (window.dmModal.acikMi && window.dmModal.acikMi()) onizle();
    });

    listeCiz(); otoYaz();
    bayrak('l6', true, null);
    return { modalAc: modalAc, yayinAc: yayinAc, listeCiz: listeCiz };
  }


  /* ═══════════════════════════════════════════════════════════════════
     B2 · YAYINDAKİ PLANLARIN ÖLÜ DENETİMLERİ
     ---------------------------------------------------------------------
     `#spPlanList`teki üç yayın satırında altı ölü düğme vardı:
       data-plan-duzenle ×3 · data-plan-durdur ×2 · data-plan-kontenjan ×1
     🔴 ARKA UÇ UYDURULMADI. Yapılamayan iş "düğmeyi sustur" ile değil,
        NE OLDUĞUNU SÖYLEYEN bir yüzeyle karşılanıyor:
        · Düzenle → modal SALT OKUNUR açılır, alanlar satırın KENDİ
          değerleriyle dolar, Kaydet düğmesi HİÇ BASILMAZ (disabled bile
          değil — olmayan bir eylemin düğmesi durmaz).
        · Durdur / Kontenjanı Artır → satırın içinde, eylemin ne yapacağını
          ve neden bugün yapılamadığını yazan bir şerit açılır.
     🔴 VERİ SATIRIN KENDİNDEN okunur; hiçbir sayı üretilmez.
     ═══════════════════════════════════════════════════════════════════ */
  function b2Kur(l6) {
    var liste = document.getElementById('spPlanList');
    if (!liste || !l6) { bayrak('b2', false, ['spPlanList / l6']); return null; }

    function satirOku(satir) {
      var b = satir.querySelector('.bilgi > b');
      var ad = '';
      if (b) for (var i = 0; i < b.childNodes.length; i++)
        if (b.childNodes[i].nodeType === 3) ad += b.childNodes[i].nodeValue;
      ad = ad.replace(/\s+/g, ' ').trim();
      var plan = metin(satir.querySelector('.plan'));           /* "Aylık ₺49,00 · Yıllık ₺490,00 (…)" */
      var ay = (plan.match(/Aylık\s*₺([\d.,]+)/) || [])[1] || '';
      var yil = (plan.match(/Yıllık\s*₺([\d.,]+)/) || [])[1] || '';
      var notlar = [].map.call(satir.querySelectorAll('.not'), metin);
      var durum = metin(satir.querySelector('.durum-hapi'));
      return { ad: ad, aylik: ay, yillik: yil, notlar: notlar, durum: durum, el: satir };
    }

    /* satır içi açıklama şeridi — aynı satırda ikinci kez açılmaz */
    function serit(satir, baslik, govde) {
      var eski = satir.querySelector('.plan-serit');
      if (eski) eski.remove();
      var d = document.createElement('div');
      d.className = 'taslak-not plan-serit';
      d.setAttribute('role', 'status');
      d.innerHTML = '<i class="fa-solid fa-circle-info" aria-hidden="true"></i> ' +
        '<span><b>' + esc(baslik) + '</b> ' + govde + '</span>' +
        '<button class="plan-serit-kapat" type="button" aria-label="Bu açıklamayı kapat">' +
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
      d.querySelector('.plan-serit-kapat').addEventListener('click', function () { d.remove(); });
      (satir.querySelector('.bilgi') || satir).appendChild(d);
      return d;
    }

    liste.addEventListener('click', function (e) {
      var b = e.target.closest('[data-plan-duzenle],[data-plan-durdur],[data-plan-kontenjan]');
      if (!b) return;
      var satir = b.closest('.paket-satiri');
      if (!satir || satir.hasAttribute('data-plan-taslak')) return;   /* taslak akışı ayrı */
      var k = satirOku(satir);

      if (b.hasAttribute('data-plan-duzenle')) { l6.yayinAc(k); return; }

      if (b.hasAttribute('data-plan-durdur')) {
        serit(satir, 'Planı durdurmak ne yapar:',
          'yeni abone alımı kapanır, mevcut aboneler dönem sonuna kadar erişimini korur, ' +
          'tahsilat sürer. <b>Bu makette uygulanamaz</b> — abonelik durumu ödeme ' +
          'sağlayıcısında yaşıyor ve o altyapı bağlanmadı. Plan olduğu gibi kaldı.');
        toast('“' + k.ad + '” durdurulmadı', { tip: 'bilgi',
          alt: 'Ödeme altyapısı bağlanmadan durdurma uygulanamaz — satırda açıklandı.' });
        return;
      }

      serit(satir, 'Kontenjanı artırmak ne yapar:',
        'plan yeni abone almaya yeniden açılır ve bekleme listesindekilere sırayla ' +
        'davet gider. <b>Bu makette uygulanamaz</b> — kontenjan ve bekleme listesi ' +
        'ödeme sağlayıcısında tutuluyor. Kontenjan olduğu gibi kaldı.');
      toast('“' + k.ad + '” kontenjanı değişmedi', { tip: 'bilgi',
        alt: 'Ödeme altyapısı bağlanmadan kontenjan artırılamaz — satırda açıklandı.' });
    });

    bayrak('b2', true, null);
    return true;
  }

  function kur() {
    var b1 = null;
    /* 🔴 İSTİSNA KONSOLA YAZILMAZ (konsol hatası 0 kapı ölçütü) ama
       YUTULMAZ da: mesajı bayrağa düşer, kapı orayı okur. */
    try { b1 = b1Kur(); } catch (e) { bayrak('b1', false, ['istisna: ' + (e && e.message)]); }
    var l6 = null;
    try { l6 = l6Kur(b1); } catch (e2) { bayrak('l6', false, ['istisna: ' + (e2 && e2.message)]); }
    try { b2Kur(l6); } catch (e3) { bayrak('b2', false, ['istisna: ' + (e3 && e3.message)]); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
