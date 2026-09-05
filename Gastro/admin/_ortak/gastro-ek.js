/* GASTRO MARKA EKİ — kit'e (kanon/admin-kit.js) TAŞINACAK.
   ŞERH: Bu dosya Gastro'ya özel davranış içindir. Kit SALT OKUMA olduğu için
   burada yaşıyor; her kural docs/admin-kit-oneri-gastro-2.md'de "K-öneri"
   olarak kayıtlıdır. Kit'e taşındığında bu dosyadaki karşılığı SİLİNİR.
   Yükleme sırası: kanon/admin-kit.js'ten SONRA. */

/* ═══ L2 · KOLON SIRALAMA ÜÇ DURUMLU — KİTE TAŞINDI, BURADAN SÖKÜLDÜ ═══
   Kural artık `kanon/admin-kit.js` §K13 (kit hazır 2 · c169c8b6a555).
   Gastro bu kuralı KÖ-L2 olarak PİLOTLADI; kit onu dört markanın ortağı
   yaptı ve pilot kopya burada durmaya devam ederse İKİ SÜRÜCÜ aynı işi
   yapar. Ölçüldü: iki sürücü açıkken görünür davranış bozulmuyordu
   (üçüncü tıkta taban iki kez geri kuruluyor, ikincisi etkisiz) — ama
   "bugün zararsız" bir çift denetim yarın kitin kuralı değişince sessizce
   ayrışır. Pilot, kural kite indiği an sökülür.
   ═══════════════════════════════════════════════════════════════════ */

/* ⟦MEDYA-KUTUPHANE:basla⟧ */
/* ÜRETİLEN BLOK — elle düzenleme. Kaynak: deneme/admin-gastro/admin-medya.html
   Üretici: scripts/gastro-p3-medya-kutuphane.mjs
   Kaynak özeti: 55bdcc54dd95 · kayıt: 5
   🔴 Bayatlık ölçümü kaynağın özetini karşılaştırır; "blok var" yeşil değildir. */
window.DM_MEDYA_KUTUPHANE = {
  kaynak: 'admin-medya.html',
  ozet: '55bdcc54dd95',
  kayitlar: [
    {
      "ad": "sponsor-kapak.webp",
      "not": "Kapak görseli · alt metin yazılmış",
      "boyut": "284 KB",
      "olcu": "1600×900"
    },
    {
      "ad": "sef-selin-portre.jpg",
      "not": "Şef profili · alt metin YOK",
      "boyut": "196 KB",
      "olcu": "800×800"
    },
    {
      "ad": "sonbahar-kampanya-og.png",
      "not": "Paylaşım görseli",
      "boyut": "148 KB",
      "olcu": "1200×630"
    },
    {
      "ad": "hub-hero-eski.jpg",
      "not": "Hiçbir kayıtta kullanılmıyor",
      "boyut": "1,2 MB",
      "olcu": "2400×1200"
    },
    {
      "ad": "favicon-kaynak.svg",
      "not": "Marka varlığı",
      "boyut": "12 KB",
      "olcu": "vektör"
    }
  ]
};
/* ⟦MEDYA-KUTUPHANE:bitis⟧ */

/* ═══ L4 · ZAMANLANMIŞ YAYIN — ÖNİZLEME GERÇEKTEN HESAPLANIR ═══════════
   K-ÖNERİ: KÖ-L4 (tüm markalar). Kit'e taşınınca SİL.

   Beyar: "kuyruktaki içerikleri modül seçerek tarih-saat + adet ile yayına
   alma (örn. Cuma 108, Cumartesi 93), tekrar kuralı, önizleme listesi, durum."

   🔴 ÖNİZLEME BİR RESİM DEĞİL, BİR HESAPTIR. Statik bir tablo basmak
      §11'in ölü yüzeyi olurdu: kullanıcı adedi değiştirir, liste durur.
      Burada tarih listesi ve gün başına adet formun kendi değerlerinden
      türetilir; kuyruk sayısı ekranda BİLDİRİLEN tek ölçülmüş sayıdır
      (İçerik Onayları · "Onaylanan").
   ⚠ Kuyruğun MODÜL KIRILIMI ölçülemediği için sayı bölüştürülmüyor —
     ekran bunu yazıyor. Bilinmeyen bir kırılımı uydurmak, yöneticinin
     göremeyeceği bir yalan olurdu.
   ⚠ L7: sonuç alanı `readonly` ve kaynağı `data-hesaplanan`da yazılı. */
(function () {
  'use strict';
  var form = document.querySelector('form[data-zamanli-yayin]');
  if (!form) return;

  var AY = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  var GUNAD = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];

  function q(s) { return form.querySelector(s) || document.querySelector(s); }
  function sayi(el, varsayilan) {
    var n = parseInt((el && el.value || '').replace(/\D/g, ''), 10);
    return isFinite(n) && n > 0 ? n : varsayilan;
  }
  /* Tarihi "GG.AA.YYYY SS:DD" ya da flatpickr'ın bıraktığı biçimden okur.
     Okunamıyorsa BUGÜN değil, null döner — uydurulmuş bir başlangıç
     önizlemeyi sessizce yanlış yapardı. */
  function tarihOku(m) {
    if (!m) return null;
    var g = m.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})(?:[ ,]+(\d{1,2}):(\d{2}))?/);
    if (g) return new Date(+g[3], +g[2] - 1, +g[1], +(g[4] || 0), +(g[5] || 0));
    var d = new Date(m);
    return isNaN(d) ? null : d;
  }
  function bicim(d) {
    return ('0' + d.getDate()).slice(-2) + ' ' + AY[d.getMonth()] + ' ' + d.getFullYear()
      + ' · ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function secilenGunler() {
    var c = form.querySelectorAll('#gfGunler .cip[aria-pressed="true"]');
    return Array.prototype.map.call(c, function (b) { return +b.getAttribute('data-gun'); });
  }

  function tazele() {
    var govde = q('#gfOnizleme'); if (!govde) return;
    var kuyrukEl = q('#gfKuyruk');
    var kuyruk = kuyrukEl ? parseInt((kuyrukEl.textContent || '0').replace(/\D/g, ''), 10) : 0;
    var adet = sayi(q('#gfAdet'), 0);
    var bas = tarihOku(q('#gfBaslangic') && q('#gfBaslangic').value);
    var tekrar = (q('#gfTekrar') || {}).value || 'gunluk';
    var gunler = secilenGunler();
    var sonuc = q('#gfSonuc'), sonraki = q('#gfSonraki');

    function bos(mesaj) {
      govde.innerHTML = '<tr><td colspan="4" class="bos-hucre">' + mesaj + '</td></tr>';
      if (sonuc) sonuc.value = '—';
      if (sonraki) sonraki.textContent = '—';
    }
    if (!bas) return bos('İlk yayın tarihini gir — liste ondan başlar.');
    if (!adet) return bos('Gün başına adet gir.');
    if (tekrar === 'haftalik' && !gunler.length) return bos('En az bir gün seç.');

    var kalan = kuyruk, satir = [], d = new Date(bas.getTime()), koruma = 0;
    while (kalan > 0 && satir.length < 60 && koruma++ < 400) {
      var uygun = tekrar === 'bir' ? satir.length === 0
                : tekrar === 'gunluk' ? true
                : gunler.indexOf(d.getDay()) >= 0;
      if (uygun) {
        var bu = Math.min(adet, kalan);
        kalan -= bu;
        satir.push({ t: new Date(d.getTime()), n: bu, kalan: kalan });
        if (tekrar === 'bir') break;
      }
      d.setDate(d.getDate() + 1);
    }
    govde.innerHTML = satir.map(function (r) {
      return '<tr><td><b>' + bicim(r.t) + '</b></td><td>' + GUNAD[r.t.getDay()] + '</td>'
        + '<td class="num">' + r.n + '</td><td class="num">' + r.kalan + '</td></tr>';
    }).join('') || '<tr><td colspan="4" class="bos-hucre">Bu kuralla yayın günü doğmuyor.</td></tr>';
    if (sonuc) sonuc.value = satir.length
      ? satir.length + ' yayın günü · ' + (kalan > 0 ? 'kuyruk bitmiyor, kalan ' + kalan : 'kuyruk biter')
      : '—';
    if (sonraki && satir.length) sonraki.textContent = bicim(satir[0].t);
  }

  /* Tür değişince o türe ait alanlar açılır/kapanır (ölü alan bırakmaz).
     🔴 GİZLEMEK YETMEZ — ÖLÇÜLDÜ. Kitin `alanDenetle`si zorunluluğu iki
        yerden okuyor: `required` niteliği VE alanın etiketindeki
        `.zorunlu` işareti. Cron alanı "sistem görevi" türüne aitti ve
        gizliyken bile zorunlu sayılıyordu: form eksiksiz doldurulduğu
        hâlde "Kaydet" hep «doldurulması gereken alanlar var» diyordu ve
        hatalı alan EKRANDA GÖRÜNMÜYORDU — kullanıcının çözemeyeceği bir
        kapı. Uygulanmayan alan `disabled` olur (form gönderiminden düşer,
        L7'nin kuralı) ve zorunluluk işareti askıya alınır. */
  function turTazele() {
    var secili = form.querySelector('[data-gorev-turu]:checked');
    var tur = secili ? secili.getAttribute('data-gorev-turu') : 'yayin';
    Array.prototype.forEach.call(form.querySelectorAll('[data-tur-alani]'), function (el) {
      var kapali = el.getAttribute('data-tur-alani') !== tur;
      el.hidden = kapali;
      Array.prototype.forEach.call(el.querySelectorAll('input, select, textarea'), function (g) {
        g.disabled = kapali;
      });
      Array.prototype.forEach.call(el.querySelectorAll('.zorunlu, .zorunlu-pasif'), function (z) {
        z.className = kapali ? 'zorunlu-pasif' : 'zorunlu';
      });
      if (kapali) { var a = el.querySelector('.alan-hata'); if (a) a.remove(); el.classList.remove('hata'); }
    });
    var sekmeler = form.querySelectorAll('.form-sekme');
    if (sekmeler[2]) sekmeler[2].hidden = tur !== 'yayin';   /* önizleme yalnız yayında anlamlı */
  }
  function gunTazele() {
    var a = q('#gfGunAlani'); if (!a) return;
    a.hidden = ((q('#gfTekrar') || {}).value !== 'haftalik');
  }

  form.addEventListener('input', function () { tazele(); });
  form.addEventListener('change', function () { turTazele(); gunTazele(); tazele(); });
  form.addEventListener('click', function (e) {
    if (e.target.closest('#gfGunler .cip, #gfModuller .cip')) setTimeout(tazele, 0);
  });
  turTazele(); gunTazele(); tazele();
})();

/* ═══ L5c · ŞEF PLANI — "EN AZ YILLIK ÜCRET" HESAPLANIR VE DOĞRULAR ═════
   K-ÖNERİ: KÖ-L5c. Kit'e taşınınca SİL.

   Kural public'ten ÖLÇÜLDÜ (g-sef-panelim · "Aylık ve yıllık ücret"):
     "Yıllık ücret aylığın on katından düşük olamaz; site kuralı gereği
      yıllık abonelikte en az iki ay indirim uygulanır."

   🔴 KURALI YAZMAK YETMEZ, KOŞMALI. Yardım rayına cümleyi yazıp alanı
      serbest bırakmak, yöneticinin göremeyeceği bir kural bırakır:
      ₺49 aylık + ₺100 yıllık kaydedilir ve public'te iki ay indirim sözü
      yalan olur. L7'nin hesaplanan alanı burada bir DOĞRULAMA da yapıyor. */
(function () {
  'use strict';
  var form = document.getElementById('spForm');
  if (!form) return;
  var aylik = document.getElementById('spAylik');
  var yillik = document.getElementById('spYillik');
  var enAz = document.getElementById('spEnAz');
  if (!aylik || !yillik || !enAz) return;

  function tazele() {
    var a = parseFloat(aylik.value);
    if (!isFinite(a) || a <= 0) { enAz.value = '—'; yillik.removeAttribute('min'); uyar(''); return; }
    var esik = a * 10;
    enAz.value = '₺' + esik.toLocaleString('tr-TR');
    yillik.setAttribute('min', String(esik));
    var y = parseFloat(yillik.value);
    uyar(isFinite(y) && y > 0 && y < esik
      ? 'Yıllık ücret aylığın on katından düşük olamaz — en az ₺' + esik.toLocaleString('tr-TR') + '.'
      : '');
  }
  function uyar(metin) {
    var alan = yillik.closest('.alan'); if (!alan) return;
    var e = alan.querySelector('[data-gastro-hata]');
    if (!metin) { if (e) e.remove(); alan.classList.remove('hata'); yillik.removeAttribute('aria-invalid'); return; }
    if (!e) {
      e = document.createElement('span');
      e.className = 'alan-hata'; e.setAttribute('data-gastro-hata', '1'); e.setAttribute('role', 'alert');
      alan.appendChild(e);
    }
    e.textContent = metin;
    alan.classList.add('hata');
    yillik.setAttribute('aria-invalid', 'true');
  }
  form.addEventListener('input', tazele);
  form.addEventListener('change', tazele);
  tazele();
})();

/* ═══ P3-1 · GÖRSEL ALANI BİR METİN GİRDİSİ DEĞİLDİR ═══════════════════
   K-ÖNERİ: KÖ-P1 (dört marka). Kit'e taşınınca SİL.

   Beyar'ın kuralı: bir görsel ASLA URL/metin girdisiyle istenmez. Her
   görsel alanı kitin görsel yükleme bileşenidir — sürükle-bırak / seç +
   "Kütüphaneden seç" + ÖNİZLEME + SİL. Çoklu ise galeri kalıbı (KÖ-A1).

   Ölçüldü (81 ekran · render DOM):
     · metin/URL ile istenen görsel alanı ......... 4
     · `.birak-alani` taşıyan bileşen ............ 31
     · bunların `.form-gorsel` kabı OLMAYAN ...... 26   → kit K11 hiç kurulmuyor
     · kit önizlemesi (`.gorsel-onizleme`) olan ....  1
     · SİL düğmesi olan ..........................  0
     · "Kütüphaneden seç"ü ÖLÜ ya da yok olan .... 27

   🔴 EN SESSİZ KUSUR "KÜTÜPHANEDEN SEÇ"TİR. Yüzeyde bir düğme duruyor,
      `pointer-events:none` ile tıklanamaz yapılmış (`.g-tikgecmez` /
      `.sozde-dugme`) ve tık ALTINDAKİ bırakma alanına düşüyor — yani
      düğme YEREL DOSYA SEÇİCİYİ açıyor. Ölü buton taraması bunu göremez
      (bir şey oluyor), hedef doğruluğu kapısı da göremez (bağ yok).
      Görünen tek şey: düğme adının vaat ettiği iş ile yaptığı iş ayrı.
      *Ölü buton değil, YALANCI buton.*

   🔴 ÖNİZLEME UYDURULMAZ. Kütüphaneden seçilen beş kaydın dosyası bu
      prototipte YOK (arandı, hiçbiri diskte değil). Bozuk bir `<img>`
      basmak ya da rastgele bir görsel koymak yalan olurdu. Önizleme
      kaydın KENDİ ölçüsünden (1600×900 · 800×800 …) gerçek en-boy
      oranıyla çizilir ve üstünde dosyanın adı ile "maket" şerhi durur.
      Yerelden seçilen dosya gerçektir; orada gerçek görsel gösterilir.

   ⚠ Kit K11 sahneyi KURMAZ, yalnız DOLDURUR (`kirpmaKur` `.kirpma-sahne`
     yoksa sessizce döner). İskele burada üretilir ki kitin kendi kuralı
     çalışsın; kite taşınırken iskele kitin markup sözleşmesine yazılır.
   ⚠ Kurulum idempotent: ikinci koşum 0 yazar (`data-gorsel-kuruldu`).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var toast = function (m) { if (window.DM_TOAST) window.DM_TOAST(m); };

  /* ── kap · kitin `.form-gorsel`i yoksa en yakın gerçek kap ────────── */
  function gorselKap(birak) {
    return birak.closest('.form-gorsel')
        || birak.closest('.alan, .form-bolum, .kart-govde')
        || birak.parentElement;
  }

  var ORANLAR = [['1:1', '1:1'], ['16:9', '16:9'], ['4:3', '4:3'], ['serbest', 'Serbest']];

  function iskele(kap) {
    if (kap.querySelector('.gorsel-onizleme')) return;
    var o = document.createElement('div');
    o.className = 'gorsel-onizleme';
    var oranHtml = ORANLAR.map(function (x) {
      return '<button class="dugme hayalet kucuk" type="button" data-oran="' + x[0] + '"' +
             (x[0] === '16:9' ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + x[1] + '</button>';
    }).join('');
    o.innerHTML =
      '<div class="kirpma-sahne">' +
        '<img alt="" data-rol="gorsel-onizleme-resim">' +
        '<div class="gorsel-maket" data-rol="gorsel-maket" hidden>' +
          '<b data-rol="maket-ad"></b><small data-rol="maket-olcu"></small>' +
          '<em>maket — dosyanın kendisi bu prototipte yok</em>' +
        '</div>' +
        '<div class="kirpma-cerceve"></div>' +
      '</div>' +
      '<div class="kirpma-arac">' +
        '<div class="oran-grubu" role="group" aria-label="Kırpma oranı">' + oranHtml + '</div>' +
        '<span class="gorsel-secili" data-rol="gorsel-ad"></span>' +
        '<button class="dugme hayalet kucuk" type="button" data-gorsel="uygula">Kırpmayı uygula</button>' +
        '<button class="dugme hayalet kucuk yikici-dugme" type="button" data-gorsel="vazgec">' +
          '<i class="fa-solid fa-trash-can" aria-hidden="true"></i> Görseli kaldır</button>' +
      '</div>';
    /* 🔴 YARDIM RAYI EN ALTTA KALIR. `appendChild` iskeleyi
       `.alan-yardim`ın ALTINA koyuyordu; ekranda önizleme ile açıklaması
       yer değiştiriyordu (ölçüldü: yardım @1233, önizleme @876). */
    var yardim = kap.querySelector(':scope > .alan-yardim');
    if (yardim) kap.insertBefore(o, yardim); else kap.appendChild(o);
  }

  /* ── "Kütüphaneden seç" · yalancı yüzeyden gerçek düğmeye ─────────── */
  function kutuphaneDugmesi(kap) {
    var aday = [].slice.call(kap.querySelectorAll('.dugme, button, a, span'))
      .filter(function (e) { return /kütüphaneden seç/i.test((e.textContent || '').trim()); })[0];
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'dugme hayalet kucuk';
    d.setAttribute('data-gorsel', 'kutuphane');
    d.textContent = 'Kütüphaneden seç';
    if (aday) {
      /* 🔴 DEĞİŞTİRİLEN YÜZEY BAŞKA BİR ŞEYİ TAŞIYOR OLABİLİR.
         `admin-duyuru-form`da "Kütüphaneden seç" bir `<label>`dı ve DOSYA
         GİRDİSİNİ İÇİNDE taşıyordu; düğmeyi yerine koymak girdiyi de
         sildi — bileşen kapısı bunu "eksik: dosya" diye yakaladı.
         Değiştirmeden önce içerideki dosya girdisi kaba TAŞINIR. */
      [].forEach.call(aday.querySelectorAll('input[type="file"]'), function (g) {
        g.hidden = true;
        kap.appendChild(g);
      });
      aday.parentNode.replaceChild(d, aday);
    }
    else {
      var b = kap.querySelector('.birak-alani');
      if (b) b.appendChild(d); else kap.appendChild(d);
    }
    return d;
  }

  function kur(birak) {
    var kap = gorselKap(birak);
    if (!kap || kap.getAttribute('data-gorsel-kuruldu') === '1') return false;
    if (birak.closest('[data-galeri]')) return false;   /* çoklu → KÖ-A1 galerisi */
    kap.setAttribute('data-gorsel-kuruldu', '1');
    kap.classList.add('form-gorsel');
    if (!kap.id) kap.id = 'fg' + Math.random().toString(36).slice(2, 8);

    /* Dosya girdisi — beş kapta hiç yoktu; bırakma alanı boşa tıklanıyordu. */
    if (!kap.querySelector('input[type="file"]')) {
      var g = document.createElement('input');
      g.type = 'file'; g.accept = 'image/*'; g.hidden = true;
      kap.appendChild(g);
    }
    iskele(kap);
    kutuphaneDugmesi(kap);

    /* 🔴 KAYITLI DEĞER YÜZEYE ÇIKAR. `admin-ayarlar`da e-posta logosu ve
       paylaşım görseli DEVRALINDI (`logo-mail.png` · `og-dadagastro.png`);
       bileşen bunları göstermezse yönetici "alan boş" sanır ve kaydederken
       var olan görseli sessizce siler. Ölçü, kütüphane kaydından okunur —
       adı kütüphanede geçmiyorsa ölçü YAZILMAZ, uydurulmaz. */
    var gizliIlk = kap.querySelector('input[type="hidden"][name]');
    if (gizliIlk && gizliIlk.value) {
      var kayit = (window.DM_MEDYA_KUTUPHANE && window.DM_MEDYA_KUTUPHANE.kayitlar || [])
        .filter(function (m) { return m.ad === gizliIlk.value; })[0];
      secildi(kap, gizliIlk.value, kayit ? kayit.olcu : '', '');
    }
    return true;
  }

  /* ── seçim · tek yüzey, iki kaynak (yerel dosya · kütüphane) ──────── */
  function secildi(kap, ad, olcu, url) {
    kap.classList.add('dolu');
    var img = kap.querySelector('[data-rol="gorsel-onizleme-resim"]');
    var maket = kap.querySelector('[data-rol="gorsel-maket"]');
    var sahne = kap.querySelector('.kirpma-sahne');
    if (url) {
      if (maket) maket.hidden = true;
      if (img) { img.hidden = false; img.src = url; }
      if (sahne) sahne.style.removeProperty('aspect-ratio');
    } else {
      /* Kütüphane kaydı: dosya yok, ÖLÇÜ var → gerçek oranla maket. */
      if (img) { img.hidden = true; img.removeAttribute('src'); }
      if (maket) {
        maket.hidden = false;
        maket.querySelector('[data-rol="maket-ad"]').textContent = ad;
        maket.querySelector('[data-rol="maket-olcu"]').textContent = olcu || '';
      }
      var m = /^(\d+)\s*[×x]\s*(\d+)$/.exec(String(olcu || '').trim());
      if (sahne) sahne.style.aspectRatio = m ? (m[1] + ' / ' + m[2]) : '16 / 9';
    }
    /* Ad, maket kutusunda zaten yazılı; araç satırı onu TEKRARLAMAZ.
       Yerel dosyada maket yok (gerçek görsel var) — orada ad tek burada
       görünür, o yüzden yazılır. */
    var etiket = kap.querySelector('[data-rol="gorsel-ad"]');
    if (etiket) etiket.textContent = url ? ad : '';

    /* Değer taşıyıcısı — form gönderiminin gördüğü tek yer. */
    var gizli = kap.querySelector('input[type="hidden"][name]');
    if (gizli) gizli.value = ad;
    /* 🔴 AYNI AD ÜÇ KEZ YAZILMAZ. Önizleme kutusu adı zaten taşıyor ve
       araç satırındaki `.gorsel-secili` de yazıyor; üstüne bir de dolu
       renkli çip basmak alanı üç kez aynı şeyi söyleyen bir yığın yapmıştı
       (ölçüldü: çip 54px + 131px boşluk). Çip YALNIZ önizlemesi olmayan
       kaplarda kalır — orada tek geri bildirim odur. */
    var cip = kap.querySelector('.cipler');
    if (cip) {
      cip.innerHTML = '';
      if (!kap.querySelector('.gorsel-onizleme')) {
        var c = document.createElement('span');
        c.className = 'cip aktif';
        c.setAttribute('data-deger', ad);
        c.textContent = ad;
        cip.appendChild(c);
      }
    }
    /* 🔴 KİTİN `oranUygula`SI DIŞARI VERİLMİYOR (arandı: `window.DM_*`
       arasında yok). Uydurma bir `DM_ORAN_UYGULA` çağrısı sessizce
       hiçbir şey yapardı — çerçeve boyutsuz kalır, kusur görünmezdi.
       Kitin KENDİ düğmesi tıklanır: kural kitte kalır, biz tetikleriz.
       rAF, sahnenin ölçü kazanmasını bekler (`clientWidth` 0 iken kit
       erken döner). */
    requestAnimationFrame(function () {
      var oran = kap.getAttribute('data-oran') || '16:9';
      var d = kap.querySelector('.oran-grubu [data-oran="' + oran + '"]')
           || kap.querySelector('.oran-grubu [data-oran]');
      if (d) d.click();
    });
  }

  function temizle(kap) {
    kap.classList.remove('dolu');
    var g = kap.querySelector('input[type="file"]'); if (g) g.value = '';
    var img = kap.querySelector('[data-rol="gorsel-onizleme-resim"]');
    if (img) { img.removeAttribute('src'); img.hidden = false; }
    var maket = kap.querySelector('[data-rol="gorsel-maket"]'); if (maket) maket.hidden = true;
    var sahne = kap.querySelector('.kirpma-sahne'); if (sahne) sahne.style.removeProperty('aspect-ratio');
    var etiket = kap.querySelector('[data-rol="gorsel-ad"]'); if (etiket) etiket.textContent = '';
    var gizli = kap.querySelector('input[type="hidden"][name]'); if (gizli) gizli.value = '';
    var cip = kap.querySelector('.cipler'); if (cip) cip.innerHTML = '';
  }
  window.DM_GORSEL_TEMIZLE = temizle;

  /* ── kütüphane kipi · veri `admin-medya.html`ten türetilmiştir ─────── */
  var acikKap = null, kipEl = null;

  function kipKur() {
    if (kipEl) return kipEl;
    kipEl = document.createElement('div');
    kipEl.className = 'onay-ortu medya-ortu';
    kipEl.hidden = true;
    kipEl.innerHTML =
      '<div class="onay-kapi medya-kapi" role="dialog" aria-modal="true" aria-labelledby="mkBaslik">' +
        '<h2 id="mkBaslik">Kütüphaneden seç</h2>' +
        '<p data-rol="mk-not"></p>' +
        '<div class="medya-izgara" data-rol="mk-izgara" role="listbox" aria-label="Medya kütüphanesindeki görseller"></div>' +
        '<div class="eylem-satiri">' +
          '<a class="dugme hayalet" href="admin-medya.html">Medya kütüphanesini aç</a>' +
          '<button class="dugme hayalet" type="button" data-gorsel="kip-kapat">Vazgeç</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(kipEl);
    return kipEl;
  }

  function kipAc(kap) {
    var k = kipKur();
    acikKap = kap;
    var veri = window.DM_MEDYA_KUTUPHANE;
    var iz = k.querySelector('[data-rol="mk-izgara"]');
    var not = k.querySelector('[data-rol="mk-not"]');
    iz.innerHTML = '';
    /* 🔴 SAYI UYDURULMAZ: kayıt yoksa liste boş kalmaz, SEBEBİ yazılır. */
    if (!veri || !veri.kayitlar || !veri.kayitlar.length) {
      not.textContent = 'Medya kütüphanesi bildirilmedi — bu ekranda gösterilecek kayıt yok.';
    } else {
      not.textContent = veri.kayitlar.length + ' görsel · kaynak: ' + veri.kaynak +
        ' · dosyaların kendisi bu prototipte yok, kayıtlar gerçek.';
      veri.kayitlar.forEach(function (m) {
        var t = document.createElement('button');
        t.type = 'button';
        t.className = 'medya-kart';
        t.setAttribute('role', 'option');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('data-medya-ad', m.ad);
        t.setAttribute('data-medya-olcu', m.olcu || '');
        t.innerHTML = '<span class="medya-onizleme"><i class="fa-solid fa-image" aria-hidden="true"></i></span>' +
          '<b>' + m.ad + '</b><small>' + (m.olcu || '') + ' · ' + (m.boyut || '') + '</small>' +
          '<em>' + (m.not || '') + '</em>';
        iz.appendChild(t);
      });
    }
    k.hidden = false;
    var ilk = k.querySelector('.medya-kart') || k.querySelector('[data-gorsel="kip-kapat"]');
    if (ilk) ilk.focus();
  }

  function kipKapat() { if (kipEl) kipEl.hidden = true; acikKap = null; }

  document.addEventListener('click', function (e) {
    var t = e.target;
    var kt = t.closest && t.closest('[data-gorsel="kutuphane"]');
    if (kt) {
      /* 🔴 Tık BIRAKMA ALANINA sızmamalı: sızarsa düğme kütüphane yerine
         yerel dosya seçiciyi açar — düzeltilen kusurun ta kendisi. */
      e.preventDefault(); e.stopPropagation();
      kipAc(kt.closest('[data-galeri]') || gorselKap(kt));
      return;
    }
    if (t.closest && t.closest('[data-gorsel="kip-kapat"]')) { e.preventDefault(); kipKapat(); return; }
    if (kipEl && t === kipEl) { kipKapat(); return; }
    var kart = t.closest && t.closest('.medya-kart');
    if (kart && acikKap) {
      e.preventDefault();
      var kap = acikKap, ad = kart.getAttribute('data-medya-ad');
      kipKapat();
      if (kap.hasAttribute('data-galeri')) {
        /* Çoklu alan: seçim DEĞİŞTİRMEZ, EKLER. */
        if (window.DM_GALERI_EKLE) window.DM_GALERI_EKLE(kap, ad, '');
        else { toast('Galeri bileşeni yüklenmedi — kart eklenemedi.'); return; }
      } else {
        secildi(kap, ad, kart.getAttribute('data-medya-olcu'), '');
      }
      toast('“' + ad + '” kütüphaneden seçildi.');
      return;
    }
    var sil = t.closest && t.closest('[data-gorsel="vazgec"]');
    if (sil) {
      var ks = sil.closest('.form-gorsel');
      if (ks) { e.preventDefault(); e.stopPropagation(); temizle(ks); toast('Görsel kaldırıldı.'); }
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && kipEl && !kipEl.hidden) { e.preventDefault(); kipKapat(); }
  });

  /* Yerel dosya — gerçek önizleme. Kit K11 de dinliyor; buradaki iş
     ADIN, çipin ve gizli değerin yazılması (kit yalnız sahneyi doldurur). */
  document.addEventListener('change', function (e) {
    var g = e.target;
    if (!g.matches || !g.matches('input[type="file"]')) return;
    var kap = g.closest('.form-gorsel');
    if (!kap || !g.files || !g.files[0]) return;
    secildi(kap, g.files[0].name, '', URL.createObjectURL(g.files[0]));
  });

  /* ── 🔴 KLON, ÖNCEKİ KAYDIN GÖRSELİNİ TAŞIYOR ────────────────────────
     Kitin satır klonlaması (`admin-kit.js` · "satir-ekle") denetimleri
     boşaltıyor ve `.coklu-secim .cipler`i siliyor — ama `.form-gorsel`in
     `dolu` sınıfını, çipini ve gizli değerini BİLMİYOR. Tekrarlanan
     satırda görsel alanı olunca yeni satır öncekinin görselini taşır ve
     SAYIM KAPISI BUNU GÖREMEZ (satır sayısı iki hâlde de artıyor).
     Klonu gözleyip temizliyoruz. */
  function klonTemizle(kok) {
    kok.querySelectorAll('.form-gorsel').forEach(function (k) {
      k.removeAttribute('data-gorsel-kuruldu');
      temizle(k);
      k.querySelectorAll('.gorsel-onizleme').forEach(function (o) { o.remove(); });
      kur(k.querySelector('.birak-alani') || k);
    });
  }

  /* ── galeri (KÖ-A1) · kütüphane düğmesi orada da YALANCIYDI ────────
     Çoklu alanın kalıbı galeridir ve KÖ-A1 onu tam kuruyor (sürükle-sırala,
     sağ üst sil, kapak rozeti) — eksik olan tek parça kütüphaneydi:
     `.g-tikgecmez` düğmeyi tıklanamaz yapıyor, tık bırakma alanına düşüyor,
     yani "Kütüphaneden seç" yerel dosya seçiciyi açıyordu. Aynı kip açılır;
     seçim kartı KÖ-A1'in KENDİ üreticisiyle eklenir. */
  function galeriKur2(kap) {
    if (kap.getAttribute('data-galeri-kutuphane') === '1') return false;
    kap.setAttribute('data-galeri-kutuphane', '1');
    var d = kutuphaneDugmesi(kap);
    d.setAttribute('data-gorsel-galeri', '1');
    return true;
  }

  function tumKur() {
    var n = 0;
    document.querySelectorAll('[data-galeri]').forEach(function (g) { if (galeriKur2(g)) n++; });
    document.querySelectorAll('.birak-alani').forEach(function (b) { if (kur(b)) n++; });
    /* Bırakma alanı OLMAYAN ama görsel alanı olan kaplar da bileşendir. */
    document.querySelectorAll('.form-gorsel:not([data-gorsel-kuruldu])').forEach(function (k) {
      if (kur(k)) n++;
    });
    return n;
  }
  window.DM_GORSEL_KUR = tumKur;

  function baslat() {
    tumKur();
    if (window.MutationObserver) {
      new MutationObserver(function (kayitlar) {
        kayitlar.forEach(function (k) {
          [].forEach.call(k.addedNodes, function (n) {
            if (n.nodeType !== 1) return;
            if (n.matches && n.matches('.form-gorsel, .birak-alani')) klonTemizle(n.parentElement || n);
            else if (n.querySelector && n.querySelector('.form-gorsel, .birak-alani')) klonTemizle(n);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat);
  else baslat();
})();
