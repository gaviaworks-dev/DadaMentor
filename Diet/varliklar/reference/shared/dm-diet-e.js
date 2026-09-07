/* =====================================================================
   T4 · DIET PUBLIC REVİZE — KULVAR E · JS   (MADDE 7 · SAYFALAMA)
   Bu dosyanın İÇİNİ yalnız ajan E yazar. Bağını LEAD atar (L0).

   ── NE YAPAR ────────────────────────────────────────────────────────
   Sayfalanması gereken ama sayfalaması OLMAYAN uzun kart listelerine
   KANON sayfalama bileşenini (`nav.sayfalama` + `.sayfa-dugme` +
   `.sayfalama-not`) çalışma anında kurar. HTML'e dokunulamadığı için
   bileşen DOM'a burada doğar; çizimi `dm-diet-e.css` (§8 ikizi) yapar.

   ── NEDEN GEREKLİ · ÖLÇÜLDÜ 2026-09-07 ──────────────────────────────
   157 Diet kabuk sayfası tarandı (rapor/t4/e-uzun-liste.json):
     testler.html  `.hub-grid` · 60 görünür `.hub-card` · sayfalama YOK
   Diet'in KENDİ `.hub-grid` yüzeyleri 12/sayfa sayfalıyor
   (beslenme-ipuclari__* · beslenme.html — ölçüldü, hepsi 12).
   Donör de aynı büyüklükte: Fit `lib-grid` 4 kolon → 12/sayfa
   (egzersiz-kutuphane-v1), Gastro `pufl-grid` 2 kolon → 12/sayfa
   (puf-noktalari). Bu yüzden SAYFA_BOY = 12 ve SABİT.

   Diğer beş aday (`besin-degerleri` · `kalori-cetveli` ·
   `makro-rehberi__{karbonhidrat,protein,yag}-rehberi`) 14 satırlık
   <tbody> — başvuru TABLOSU, gezilen liste değil. Ne Fit'te ne
   Gastro'da sayfalanan bir `.tablo` var; ölçüme sokulmadı.
   Kaynak kusuru sanıp sayfalamak "denetimin öznesi kayar" olurdu.

   ── ÇÖZÜLEMEYEN · HTML GEREKTİRİR (rapora yazıldı) ──────────────────
   20 `.pagi` sayfasında sayı/ok düğmeleri KENDİ SAYFASINA link veriyor
   (`<a class="pg" href="programlar.html">2</a>`) ve DOM'da yalnız 1.
   sayfanın kartları var (12 kart · not "40 yazı · sayfa 1 / 4").
   Tıklama listeyi değiştiremez — ölü düğme. Bu bir BİLEŞEN kusuru
   değil, dump'ın veri/URL kusuru: 2..N. sayfanın verisi kopyada yok.
   Betikle "düzeltmek" ancak notu "sayfa 1 / 1"e indirip maketin
   anlattığı 399 kayıtlık kütüphaneyi silmekle olurdu — veri uydurmanın
   aynası. Yapılmadı, ölçüldü ve bildirildi.
   ===================================================================== */
(function(){
  'use strict';

  var SAYFA_BOY = 12;            /* SABİT · yukarıdaki donör ölçümü */
  var PENCERE   = 2;             /* aktif sayfanın iki yanı, sonra … */

  /* ⚠ Kurulum bayrağı YALNIZ window'da. DOM'a yazılsaydı kaydedilmiş bir
     render kopyası "zaten kuruldum" sandırır ve bileşen HİÇ doğmazdı —
     bu depoda ölçülmüş bir tuzak. window her yüklemede temiz doğar. */
  if (window.__DM_DIET_E_SAYFALAMA__) return;
  window.__DM_DIET_E_SAYFALAMA__ = 1;

  /* Not metnindeki isim UYDURULMAZ; sayfa başına açık tablo.
     testler.html sekme çubuğu kendi sayısını "Tümü 60" diye yazıyor,
     kalemin adı "test". Tabloda olmayan sayfa için nötr "kayıt". */
  var ISIM = { 'testler.html': 'test' };

  function gorunur(e){
    var r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  }
  function sinifi(e){ return (typeof e.className === 'string' ? e.className : '').trim(); }

  var VAR_OLAN = '.pagi,.sayfalama,.dm-pagi';
  var DISARI   = 'nav,header,footer,.dip,.ust-bant,.topbar,.cekmece,.drawer';
  var DUZYAZI  = '.okuma-kolonu,article,.reh-article,.faq-col,.prose';
  var KARTCA   = /(kart|card|row|satir|item|tile)/i;

  function adaylar(){
    var bulunan = [];
    var kaplar = document.querySelectorAll('div,ul,ol,section');
    for (var i = 0; i < kaplar.length; i++){
      var k = kaplar[i];
      if (k.__dmESayfalama) continue;                       /* idempotanlık */
      if (k.closest(DISARI) || k.closest(DUZYAZI)) continue;
      if (k.querySelector(VAR_OLAN)) continue;              /* zaten var */

      var ch = [], c;
      for (var j = 0; j < k.children.length; j++){
        c = k.children[j];
        if (c.tagName === 'SCRIPT' || c.tagName === 'STYLE') continue;
        if (c.matches(VAR_OLAN)) continue;
        if (!gorunur(c)) continue;
        ch.push(c);
      }
      /* en az İKİ dolu sayfa — tek sayfalık listeye sayfalama kurulmaz */
      if (ch.length < SAYFA_BOY * 2) continue;

      /* homojenlik: kartların ≥%85'i aynı sınıftan */
      var imza = {}, enCok = null;
      for (j = 0; j < ch.length; j++){
        var s = sinifi(ch[j]).split(/\s+/)[0] || ch[j].tagName;
        imza[s] = (imza[s] || 0) + 1;
        if (!enCok || imza[s] > imza[enCok]) enCok = s;
      }
      if (imza[enCok] < ch.length * 0.85) continue;

      /* kart benzeri mi: adı kartça ya da ızgara/esnek kap */
      var cs = getComputedStyle(k);
      if (!(KARTCA.test(enCok) || KARTCA.test(sinifi(k)) || cs.display === 'grid')) continue;

      /* aynı bölümde başka bir sayfalama varsa bu listenin işi değildir */
      var bolum = k.closest('section,.kart,main') || document.body;
      if (bolum.querySelector(VAR_OLAN)) continue;

      bulunan.push({ kap:k, kartlar:ch });
    }
    /* İç içe adaylardan yalnız EN İÇTEKİ kalır: dış kap sayfalanırsa
       gerçek ızgara değil sarmalayıcı gizlenir, ızgara hizası bozulur. */
    return bulunan.filter(function(a){
      return !bulunan.some(function(b){ return b !== a && a.kap.contains(b.kap); });
    });
  }

  function dugmeYap(metin, ikon, kapali, aktif, git, etiket, git_fn){
    var b = document.createElement('button');
    b.type = 'button';                                   /* form göndermez */
    b.className = 'sayfa-dugme' + (ikon ? ' ok' : '') + (aktif ? ' aktif' : '');
    if (ikon){
      var i = document.createElement('i');
      i.className = 'fa-solid ' + ikon;
      i.setAttribute('aria-hidden','true');
      b.appendChild(i);
    } else {
      b.appendChild(document.createTextNode(metin));
    }
    b.setAttribute('aria-label', etiket);
    if (aktif) b.setAttribute('aria-current','page');
    if (kapali){ b.disabled = true; }
    else { b.addEventListener('click', function(ev){ ev.preventDefault(); git_fn(git); }); }
    return b;
  }

  function kur(aday){
    var kap = aday.kap, kartlar = aday.kartlar;
    var sayfa = 1;
    var son = Math.max(1, Math.ceil(kartlar.length / SAYFA_BOY));
    var dosya = (location.pathname.split('/').pop() || '');
    var isim = ISIM[dosya] || 'kayıt';

    var nav = document.createElement('nav');
    nav.className = 'sayfalama';
    nav.setAttribute('aria-label','Sayfalama');
    nav.setAttribute('data-dm-e-kaynak','kulvar-e');

    var not = document.createElement('span');
    not.className = 'sayfalama-not';
    not.setAttribute('aria-live','polite');

    /* DOM SIRASI: kap'tan HEMEN SONRA — son karttan sonra gelmesi
       ekran konumunun da altta çıkmasını akışla garanti eder. */
    kap.parentNode.insertBefore(nav, kap.nextSibling);
    kap.__dmESayfalama = nav;

    function git(n){
      sayfa = Math.min(son, Math.max(1, n));
      ciz();
      /* ⚠ Kaydırma YAPILMAZ: ölçüm aracı ölçtüğünü değiştirir; ayrıca
         kullanıcı zaten sayfalamanın yanında duruyor. */
    }

    function ciz(){
      var bas = (sayfa - 1) * SAYFA_BOY, bit = bas + SAYFA_BOY;
      for (var i = 0; i < kartlar.length; i++){
        if (i >= bas && i < bit) kartlar[i].removeAttribute('data-dm-e');
        else                     kartlar[i].setAttribute('data-dm-e','gizli');
      }

      while (nav.firstChild) nav.removeChild(nav.firstChild);

      /* Donör kuralı (kanon §21, Fit): TEK SAYFADA RAY GİZLENİR,
         özet satırı kalır. */
      if (son > 1){
        nav.appendChild(dugmeYap('', 'fa-angles-left',  sayfa === 1,   false, 1,         'İlk sayfa',      git));
        nav.appendChild(dugmeYap('', 'fa-chevron-left', sayfa === 1,   false, sayfa - 1, 'Önceki sayfa',   git));

        var goster = [];
        for (var s = 1; s <= son; s++){
          if (s === 1 || s === son || Math.abs(s - sayfa) <= PENCERE) goster.push(s);
        }
        var oncekiS = 0;
        for (var g = 0; g < goster.length; g++){
          var n = goster[g];
          if (oncekiS && n - oncekiS > 1){
            var nokta = document.createElement('span');
            nokta.className = 'sayfa-nokta';
            nokta.setAttribute('aria-hidden','true');
            nokta.appendChild(document.createTextNode('…'));
            nav.appendChild(nokta);
          }
          nav.appendChild(dugmeYap(String(n), null, false, n === sayfa, n, n + '. sayfa', git));
          oncekiS = n;
        }

        nav.appendChild(dugmeYap('', 'fa-chevron-right', sayfa === son, false, sayfa + 1, 'Sonraki sayfa', git));
        nav.appendChild(dugmeYap('', 'fa-angles-right',  sayfa === son, false, son,       'Son sayfa',     git));
      }

      /* Not biçimi Diet'in KENDİ `.pagi-note` grameri:
         "40 yazı · sayfa 1 / 4"  (beslenme-ipuclari__kategori__alisveris) */
      while (not.firstChild) not.removeChild(not.firstChild);
      not.appendChild(document.createTextNode(
        kartlar.length + ' ' + isim + ' · sayfa ' + sayfa + ' / ' + son));
      nav.appendChild(not);
    }

    ciz();
    return nav;
  }

  function calis(){
    var liste = adaylar();
    for (var i = 0; i < liste.length; i++) kur(liste[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', calis);
  else calis();
})();
