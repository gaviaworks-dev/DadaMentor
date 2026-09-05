/* GASTRO MARKA EKİ · kulvar d — kit'e (kanon/admin-kit.js) TAŞINACAK.
   ŞERH: Bu dosya Gastro'ya özel davranış içindir. Kit SALT OKUMA olduğu için
   burada yaşıyor; her kural docs/admin-kit-oneri-gastro-2-d.md'de "KÖ-D<n>"
   olarak kayıtlıdır. Kit'e taşındığında bu dosyadaki karşılığı SİLİNİR.
   Yükleme sırası: kanon/admin-kit.js'ten SONRA. */
(function () {
  'use strict';

  var toast = function (m) { if (window.DM_TOAST) window.DM_TOAST(m); };
  var $$ = function (s, k) { return [].slice.call((k || document).querySelectorAll(s)); };

  /* ═══════════════════════════════════════════════════════════════════
     KÖ-D1 · L7 HESAPLANAN ALAN CANLI OLMALI — KAYNAĞINI SAYAR
     ───────────────────────────────────────────────────────────────────
     Kit L7'yi YARIM uyguluyor (`kanon/admin-kit.js` · `hesaplananKur`):
     alanı `readonly` yapıyor, kaynağı yardım rayına yazıyor — ama DEĞERİ
     hiç hesaplamıyor. Ölçüldü: `data-hesaplanan` taşıyan alana markup ne
     yazdıysa o kalıyor, kaynak listeye satır eklense de değişmiyor.

     🔴 HESAPLANMAYAN "HESAPLANAN ALAN", ELLE YAZILAN SAYIDAN KÖTÜDÜR:
        yardım rayı "Sistemden hesaplanır" diye söz veriyor, alan o sözü
        tutmuyor. §9-7'nin kökü tam buydu — admin satırındaki ipucu sayısı
        ile public'teki liste uzunluğu AYRI İKİ GERÇEK olmuştu (7/11
        kategoride tutmuyordu, ikisi de 61'e toplanıyordu).

     Bildirim markup'ta:
         <input data-hesaplanan="İpuçları listesindeki dolu satır"
                data-hesaplanan-kaynak="#chIpuclari"
                data-hesaplanan-birim="ipucu">

     ⚠ SAYILAN ŞEY "DOLU" SATIRDIR, satır değil. Boş bir satır hiçbir şey
       yayımlamaz; onu saymak sayıyı yine yalancı yapardı. Doluluk ölçütü
       kitin KENDİ ölçütüdür (`DM_TEKRAR_KORUMA.dolu`) — ikinci bir tanım
       doğmaz (`<select>`in varsayılan seçimi veri sayılmaz).
     ⚠ Boş satır varsa yardım rayı bunu YAZAR; sessiz fark, kullanıcının
       "neden artmadı" sorusunu cevapsız bırakırdı.
     ═══════════════════════════════════════════════════════════════ */
  function hesapKaynagi(g) {
    var s = g.getAttribute('data-hesaplanan-kaynak');
    return s ? document.querySelector(s) : null;
  }

  function doluMu(satir) {
    if (window.DM_TEKRAR_KORUMA && window.DM_TEKRAR_KORUMA.dolu) return window.DM_TEKRAR_KORUMA.dolu(satir);
    return !!satir.querySelector('input[type="text"], textarea');
  }

  function hesapla(g) {
    var liste = hesapKaynagi(g);
    if (!liste) return;
    var satirlar = [].filter.call(liste.children, function (c) { return c.nodeType === 1; });
    var dolu = satirlar.filter(doluMu).length;
    var bos = satirlar.length - dolu;
    var birim = g.getAttribute('data-hesaplanan-birim') || '';
    var yeni = String(dolu);
    if (g.value !== yeni) {
      g.value = yeni;
      g.dispatchEvent(new Event('input', { bubbles: true }));
    }
    /* Sayının kaynağı ve BOŞ SATIR farkı yardım rayında yazılı kalır. */
    var alan = g.closest('.alan');
    var not = alan && alan.querySelector('[data-rol="hesaplanan-not"]');
    if (not) {
      var s = not.querySelector('[data-rol="hesaplanan-fark"]');
      if (!s) {
        s = document.createElement('span');
        s.setAttribute('data-rol', 'hesaplanan-fark');
        not.appendChild(s);
      }
      s.textContent = bos
        ? ' · şu an ' + dolu + ' ' + birim + ', ' + bos + ' boş satır sayılmadı'
        : ' · şu an ' + dolu + ' ' + birim;
    }
  }

  function tumHesaplar() { $$('[data-hesaplanan][data-hesaplanan-kaynak]').forEach(hesapla); }

  /* ═══════════════════════════════════════════════════════════════════
     KÖ-D2 · BIRAKMA ALANI GERÇEKTEN DOSYA SEÇİCİYİ AÇAR
     ───────────────────────────────────────────────────────────────────
     Kit §10 `.birak-alani`yı markup sözleşmesine yazıyor ama HİÇBİR YERDE
     dinlemiyor — ölçüldü: `kanon/admin-kit.js` içinde "birak" geçen tek
     satır `data-radyo-birak` (L5). Sonuç: `role="button"` taşıyan, imleci
     değişen, "seçmek için tıkla" yazan bir yüzey TIKLANINCA HİÇBİR ŞEY
     YAPMIYOR. §11'in ölü butonunun ta kendisi — ve düğme gibi görünmediği
     için ölü buton kapısının nüfusuna da girmiyor (kapı `<button>` ve
     `<a>` sayıyor). *Ölü yüzey, ölü butondan daha sessiz kaybolur.*

     ⚠ Yükleme YOK — panel bir makettir; toast bunu YAZAR (§10).
     ⚠ Klavye: `role="button"` Enter ve Space vaat eder; ikisi de bağlanır.
     ⚠ Sürükle-bırak da bağlanır, çünkü yüzeyin adı "birak-alani" ve metni
       "Görseli sürükle" diyor. Vaat eden yüzey vaadi tutar.
     ═══════════════════════════════════════════════════════════════ */
  function birakKap(el) { return el.closest('.form-gorsel, .alan, .form-bolum') || el.parentElement; }
  function dosyaGirdisi(el) {
    var k = birakKap(el);
    return k ? k.querySelector('input[type="file"]') : null;
  }
  function gorselBildir(kap, dosya) {
    var cipler = kap.querySelector('.cipler');
    if (cipler) {
      cipler.innerHTML = '';
      var cip = document.createElement('span');
      cip.className = 'cip aktif';
      cip.setAttribute('data-deger', dosya.name);
      cip.textContent = dosya.name;
      cipler.appendChild(cip);
    }
    var gizli = kap.querySelector('input[type="hidden"][name]');
    if (gizli) gizli.value = dosya.name;
    toast('“' + dosya.name + '” seçildi — bu bir makettir, sunucuya hiçbir şey gönderilmedi.');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('.birak-alani');
    if (!b) return;
    var g = dosyaGirdisi(b);
    if (!g) { toast('Bu bırakma alanına bağlı bir dosya girdisi yok — markup eksik.'); return; }
    e.preventDefault();
    g.click();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var b = e.target.closest && e.target.closest('.birak-alani');
    if (!b) return;
    e.preventDefault();
    var g = dosyaGirdisi(b); if (g) g.click();
  });
  ['dragenter', 'dragover'].forEach(function (t) {
    document.addEventListener(t, function (e) {
      var b = e.target.closest && e.target.closest('.birak-alani');
      if (!b) return;
      e.preventDefault(); b.classList.add('birak-uzerinde');
    });
  });
  document.addEventListener('dragleave', function (e) {
    var b = e.target.closest && e.target.closest('.birak-alani');
    if (b) b.classList.remove('birak-uzerinde');
  });
  document.addEventListener('drop', function (e) {
    var b = e.target.closest && e.target.closest('.birak-alani');
    if (!b) return;
    e.preventDefault(); b.classList.remove('birak-uzerinde');
    var d = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (d) gorselBildir(birakKap(b), d);
  });
  document.addEventListener('change', function (e) {
    var g = e.target;
    if (!g.matches || !g.matches('input[type="file"]')) return;
    if (!g.files || !g.files[0]) return;
    var kap = g.closest('.form-gorsel, .alan, .form-bolum');
    if (kap && kap.querySelector('.birak-alani')) gorselBildir(kap, g.files[0]);
  });

  /* ═══════════════════════════════════════════════════════════════════
     KÖ-D3 · EŞLEŞME MOTORU — KATEGORİ SEÇİMİ SAYIYI DARALTIR
     ───────────────────────────────────────────────────────────────────
     Donörden ÇIKARILDI (`dump/gastro/bugun-ne-pisirsem.html` +
     `varliklar/reference/bugun-ne-pisirsem/bugun-ne-pisirsem.js`):

       GET /bugun-ne-pisirsem/havuz?mod=&kategori=&q=
           → { html, countLabel, categories }
       · üç süzgeç VE ile birleşir
       · kategori rayı MODA GÖRE yeniden kurulur (`renderCategoryRail`)
       · mod değişince kategori seçimi SIFIRLANIR (`scratch.cat = ''`)
       · donörde kategori seçimi TEKLİ ("Tümü" dışlayıcı, `.dt` rayı)

     🔴 KARAR — ADMİN'DE ÇOKLU: donör üye yüzüdür ve orada tek kategori
        bir gezinme kararıdır. Admin bir MODU tanımlar; bir mod ("Fırın
        Yemekleri") birden çok kap kategorisini kapsar. Tekli seçim,
        yöneticiyi modu tanımlayamaz hâle getirirdi. Fark rapora ve
        yüzeydeki yardım rayına YAZILI (donör tekli, admin çoklu).

     🔴 SAYI UYDURULMAZ. Kategori başına tarif sayısı sayfanın kendi
        bildiriminden okunur (`<script data-kap-kategori-sayi>`); o
        bildirim `dump/gastro/tarifler.html` kategori kartlarından
        HASAT EDİLMİŞTİR. 30 kap kategorisinin 14'ünde sayı yayımlanıyor;
        kalan 16'sı **0 katkı** verir ve yüzey bunu SAYIYLA BİRLİKTE
        yazar. Sessizce eksik toplamak, "839 tarif" gibi kaynaksız bir
        sayı üretmenin ta kendisiydi.
     ⚠ Toplam bir ÜST SINIRDIR: 14 kategorinin toplamı 2.817, sitedeki
       5.099 tarifin altında; kesişim (bir tarifin birden çok kategoride
       olması) ölçülemedi. Yüzey "en çok" der, "tam" demez.
     ═══════════════════════════════════════════════════════════════ */
  var kapSayi = null;
  function kapSayilari() {
    if (kapSayi) return kapSayi;
    kapSayi = {};
    var d = document.querySelector('[data-kap-kategori-sayi]');
    if (d) { try { kapSayi = JSON.parse(d.textContent || '{}'); } catch (h) { kapSayi = {}; } }
    return kapSayi;
  }

  function secilenKategoriler(kap) {
    return $$('.cipler [data-deger]', kap).map(function (c) { return c.getAttribute('data-deger'); });
  }

  function eslesmeHesapla() {
    var kap = document.querySelector('[data-kap-kategori]');
    var hedef = document.querySelector('[data-eslesme-hedef]');
    if (!kap || !hedef) return;
    var sayilar = kapSayilari();
    var secilen = secilenKategoriler(kap);
    /* Modun kendi havuzu bir KAYIT ALANIdır (`name="mod_toplam"`), kabın
       özniteliği değil: §5b'nin doldurduğu yer alanlardır, öznitelik değil.
       İlk yazım `data-mod-toplam`ı okuyordu ve kayıt yüklense bile hep 0
       kalıyordu — bildirim indi, okuyan yanlış yere baktı. */
    var havuzAlan = document.querySelector('[name="mod_toplam"]');
    var modToplam = havuzAlan ? Number(havuzAlan.value || 0) : 0;

    /* Anahtar ÇİPİN GÖRÜNEN ADIdır: kit çipe yalnız `data-deger` yazıyor,
       slug taşımıyor. İkinci bir anahtar uydurmak yerine bildirim de adla
       anahtarlanıyor — tek ad, tek gerçek. */
    var olculen = [], olculmeyen = [];
    secilen.forEach(function (ad) {
      var n = (sayilar[ad] !== undefined) ? sayilar[ad] : null;
      if (n === null) olculmeyen.push(ad); else olculen.push({ ad: ad, n: n });
    });

    var toplam = secilen.length
      ? olculen.reduce(function (a, x) { return a + x.n; }, 0)
      : modToplam;

    hedef.value = secilen.length
      ? (toplam ? 'en çok ' + toplam.toLocaleString('tr-TR') + ' tarif' : 'ölçülemedi')
      : (modToplam ? modToplam.toLocaleString('tr-TR') + ' tarif' : '—');

    var not = document.querySelector('[data-eslesme-not]');
    if (not) {
      if (!secilen.length) {
        not.textContent = modToplam
          ? 'Kategori seçilmedi — sayı modun kendi havuzudur (' + modToplam.toLocaleString('tr-TR')
            + ' tarif). Kategori seçtikçe daralır.'
          : 'Kategori seçilmedi ve bu modun havuz sayısı ÖLÇÜLMEDİ (donör yalnız aktif modunkini yayımlıyor). '
            + 'Kategori seçince sayı ölçülen kategori toplamlarından hesaplanır.';
      } else {
        var p = olculen.map(function (x) { return x.ad + ' ' + x.n; }).join(' + ');
        not.textContent = 'Seçilen ' + secilen.length + ' kategori · ' + (p || '—')
          + (olculmeyen.length ? ' · ölçülen sayısı OLMAYAN ' + olculmeyen.length
            + ' kategori (' + olculmeyen.join(', ') + ') 0 katkı verdi' : '')
          + ' · kesişim ölçülemediği için toplam ÜST SINIRDIR.';
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     KÖ-D4 · SIRALAMA ÖLÇÜTÜ — TEK KALIP, KAYNAĞI YAZILI
     ───────────────────────────────────────────────────────────────────
     Ölçüldü — panelde "sıralama ölçütü" DÖRT ayrı şekilde yazılmış:
       admin-onur-listesi-form  3 radyo (.onay-satirlari)      ölçüt
       admin-rozet-form         <select>, seçenek KAYNAĞINI taşıyor
       admin-arama-yonetimi     çıplak <select>, kaynak yok
       admin-sayfa/tarifler/video/yemek-modu  sayı "ağırlık 0–100"
     Dördü de aynı soruyu soruyor: "bu liste neye göre sıralanacak?" —
     ve dördü ayrı cevap veriyor. En güçlüsü rozet formunun kalıbı:
     seçeneğin kendisi NEREDEN geldiğini yazıyor.

     Tek kalıp:
         <div class="alan" data-siralama-olcutu>
           <select name="siralama_olcutu">
             <option value="takipci" data-kaynak="…" data-yon="azalan">…</option>
           …
           <select name="siralama_yonu">…</select>

     Ölçüt değişince KAYNAK SATIRI ve varsayılan YÖN güncellenir; ikinci
     bir metin kaynağı doğmaz (kaynak `data-kaynak`ta, bir yerde).
     ═══════════════════════════════════════════════════════════════ */
  function olcutYaz(kap) {
    var sec = kap.querySelector('select[name="siralama_olcutu"]');
    var yon = kap.querySelector('select[name="siralama_yonu"]');
    var not = kap.querySelector('[data-rol="olcut-kaynak"]');
    if (!sec) return;
    var o = sec.options[sec.selectedIndex];
    if (not) {
      not.textContent = o && o.getAttribute('data-kaynak')
        ? 'Kaynak: ' + o.getAttribute('data-kaynak')
        : 'Bu ölçütün ölçülmüş bir kaynağı YOK — seçilirse sıralama üretilemez.';
      not.classList.toggle('olcut-kaynaksiz', !(o && o.getAttribute('data-kaynak')));
    }
    if (yon && o && o.getAttribute('data-yon')) yon.value = o.getAttribute('data-yon');
  }

  /* ═══════════════════════════════════════════════════════════════════
     KÖ-D6 · SÜZGEÇ ÇİPİ SATIRLARI GERÇEKTEN SÜZER
     ───────────────────────────────────────────────────────────────────
     ÖLÇÜLDÜ — panelde süzgeç çipi hiçbir şeyi süzmüyor. `_ortak/panel.js`
     satır 158'deki tek dinleyici `.aktif` sınıfını çeviriyor ve tetikteki
     sayacı güncelliyor; `tbody` satırlarına DOKUNMUYOR. Kit tarafında da
     satır süzen bir dal yok (`admin-kit.js`te `tbody tr` yalnız dışa
     aktarma ve kolon seçiminde geçiyor).

     🔴 Bu §11'in ölü butonu — ama düğme gibi görünmediği için ölü buton
        kapısının nüfusuna da tam girmiyor: çip tıklanınca RENK DEĞİŞİYOR
        (sınıf ekleniyor), yani "bir şey oldu" ölçütü YEŞİL veriyor.
        Görünüm değişiyor, iş yapılmıyor. *Kapı sorduğu soruyu ölçer.*

     Kural: çip metni satırın metninde geçiyorsa satır kalır. İlk çip
     ("Tümü") DIŞLAYICIDIR (kit §4) — seçilince öbürleri düşer, ve hiç
     seçim yoksa bütün satırlar görünür. Sayaç (`.suzgec-sayac b`) ve
     boş durum (`[data-durum="bos"]`) birlikte güncellenir; sessizce boş
     kalan bir tablo "sonuç yok" ile "süzgeç bozuk"u aynı gösterirdi.
     ⚠ Kap AYNI kart: bir sayfada iki tablo varsa (yemek modu) her süzgeç
       yalnız KENDİ kartının tablosunu süzer.
     ═══════════════════════════════════════════════════════════════ */
  function suzgecUygula(yuzey) {
    var kart = yuzey.closest('.kart') || document;
    var tablo = kart.querySelector('.tablo, table');
    if (!tablo) return;
    var govde = tablo.tBodies[0];
    if (!govde) return;

    var cipler = $$('.cip.suzgec', yuzey);
    if (!cipler.length) return;
    var tumu = cipler[0];
    var secili = cipler.slice(1).filter(function (c) { return c.classList.contains('aktif'); });

    tumu.classList.toggle('aktif', secili.length === 0);
    cipler.forEach(function (c) { c.setAttribute('aria-selected', String(c.classList.contains('aktif'))); });

    /* Aynı kartın BÜTÜN süzgeçleri VE ile birleşir. */
    var yuzeyler = $$('.acilir-yuzey.suzgec', kart);
    var kume = yuzeyler.map(function (y) {
      return $$('.cip.suzgec', y).slice(1)
        .filter(function (c) { return c.classList.contains('aktif'); })
        .map(function (c) { return (c.textContent || '').trim().toLocaleLowerCase('tr'); });
    }).filter(function (k) { return k.length; });

    var gorunur = 0;
    [].forEach.call(govde.rows, function (tr) {
      var t = (tr.textContent || '').toLocaleLowerCase('tr');
      var kal = kume.every(function (k) {
        return k.some(function (v) { return t.indexOf(v) !== -1; });
      });
      tr.hidden = !kal;
      if (kal) gorunur++;
    });

    var sayac = kart.querySelector('.suzgec-sayac b');
    if (sayac) sayac.textContent = String(gorunur);
    /* KÖ-D6b · §4'ün YAZILI AMA UYGULANMAMIŞ yarısı: "Temizle düğmesi
       YALNIZ süzgeç açıkken görünür". Uygulanmadığı için düğme her zaman
       oradaydı ve temizlenecek bir şey yokken tıklanınca hiçbir şey
       olmuyordu — ölü buton kapısı onu haklı olarak sayıyordu. Kuralı
       uygulamak hem kusuru hem de kapının kırmızısını kapatır. */
    var acik = kume.reduce(function (a, k) { return a + k.length; }, 0);
    /* ⚠ YALNIZ SÜZGEÇ yüzeylerinin "Temizle"si — kolon seçicideki
       "Sıfırla" da aynı `data-eylem`i taşıyor ama işi BAŞKA (kolonları
       geri getirir) ve süzgeç açık olmasa da anlamlıdır. İlk yazımda
       ikisini birden gizledim ve kolon sıfırlama sessizce kayboldu:
       *aynı ada bakan kanca, iki ayrı işi tek iş sanar.* */
    kart.querySelectorAll('.suzgec-cubuk [data-eylem="suzgec-temizle"], .acilir-yuzey.suzgec [data-eylem="suzgec-temizle"]')
      .forEach(function (t) { t.hidden = acik === 0; });
    var sayi = document.querySelector('[data-rol="suzgec-sayisi"]');
    if (sayi) sayi.textContent = acik ? acik + ' süzgeç açık' : '';
    var bos = kart.querySelector('[data-durum="bos"]');
    if (bos) bos.hidden = gorunur !== 0;
    var kap = tablo.closest('.tablo-kap');
    if (kap) kap.hidden = gorunur === 0;
  }

  document.addEventListener('click', function (e) {
    var c = e.target.closest('.acilir-yuzey.suzgec .cip.suzgec');
    if (c) {
      var y = c.closest('.acilir-yuzey');
      /* "Tümü" DIŞLAYICIDIR — öbürlerini düşürür. */
      if (c === $$('.cip.suzgec', y)[0]) {
        $$('.cip.suzgec', y).slice(1).forEach(function (x) { x.classList.remove('aktif'); });
      }
      setTimeout(function () { suzgecUygula(y); }, 0);
      return;
    }
    var t = e.target.closest('[data-eylem="suzgec-temizle"]');
    if (!t) return;
    var kart = t.closest('.kart') || document;
    /* KÖ-D6c · KOLON SEÇİCİDEKİ "Sıfırla" GERÇEKTEN SIFIRLASIN.
       Markup ona da `data-eylem="suzgec-temizle"` yazmıştı; kit o eylemi
       süzgeç için tanıyor ve kolon listesine hiç dokunmuyordu — tıklanınca
       hiçbir şey olmuyordu (§11). İş adına değil, DURDUĞU YERE göre
       belirlenir: kolon seçicinin içindeyse kolonları geri getirir. */
    var yuzey = t.closest('.acilir-yuzey');
    /* ⚠ `.kolon-secim` sınıfı YÜZEYİN KENDİSİNDE olabiliyor (markup:
       `<div class="acilir-yuzey saga kolon-secim" id="kol-0">`), kit
       sonradan kurduğunda ise İÇİNDE bir kap olarak doğuyor. İlk yazım
       yalnız içeriye baktı ve kolon "Sıfırla"sı yine ölü kaldı —
       *kancanın iki biçimden yalnız birini tanıması.* */
    if (yuzey && (yuzey.classList.contains('kolon-secim')
        || yuzey.querySelector('.kolon-secim, [data-kolon-anahtar]'))) {
      var acildi = 0;
      yuzey.querySelectorAll('input[type="checkbox"]').forEach(function (k) {
        if (!k.disabled && !k.checked) { k.checked = true; k.dispatchEvent(new Event('change', { bubbles: true })); acildi++; }
      });
      toast(acildi ? acildi + ' kolon geri getirildi.' : 'Bütün kolonlar zaten görünür.');
      return;
    }
    $$('.acilir-yuzey.suzgec', kart).forEach(function (y) {
      $$('.cip.suzgec', y).slice(1).forEach(function (x) { x.classList.remove('aktif'); });
      suzgecUygula(y);
    });
  });

  /* ═══════════════════════════════════════════════════════════════════
     BAĞLAMA — kit'ten SONRA, ve kit satır ekleyince YENİDEN
     ⚠ Kit `formDoldur` ile satır SAYISINI kayda göre değiştiriyor ve bu
       `Lkur`dan sonra olabiliyor. Sabit bir "kurulum anı" yok; bu yüzden
       hem olayla hem MutationObserver'la dinlenir. Tek koşumluk kurulum,
       "kaydı yükledikten sonra sayı eski kalır" kusurunu doğururdu.
     ═══════════════════════════════════════════════════════════════ */
  function bagla() {
    tumHesaplar();
    eslesmeHesapla();
    $$('[data-siralama-olcutu]').forEach(olcutYaz);
    /* Süzgeç yüzeyleri açılışta bir kez hizalanır: "Temizle" düğmesi
       §4 gereği kapalı başlar, sayaç sıfırlanır. */
    $$('.acilir-yuzey.suzgec').forEach(suzgecUygula);
  }

  document.addEventListener('input', function (e) {
    if (e.target.closest('.adim-liste, .kalem-listesi')) tumHesaplar();
    if (e.target.closest('[data-kap-kategori]')) eslesmeHesapla();
  });
  document.addEventListener('change', function (e) {
    if (e.target.closest('.adim-liste, .kalem-listesi')) tumHesaplar();
    var o = e.target.closest && e.target.closest('[data-siralama-olcutu]');
    if (o) olcutYaz(o);
    if (e.target.closest('[data-kap-kategori]')) eslesmeHesapla();
  });
  /* Satır ekle / sil / sırala — kit kendi işini bitirdikten SONRA. */
  document.addEventListener('click', function () { setTimeout(bagla, 0); });

  var gozcu = new MutationObserver(function () { bagla(); });
  function gozle() {
    $$('.adim-liste, .kalem-listesi, [data-kap-kategori] .cipler').forEach(function (l) {
      gozcu.observe(l, { childList: true, subtree: true });
    });
  }

  function baslat() { gozle(); bagla(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(baslat, 0); });
  else setTimeout(baslat, 0);

  window.GEK_D = { hesapla: tumHesaplar, eslesme: eslesmeHesapla, bagla: bagla };
})();
