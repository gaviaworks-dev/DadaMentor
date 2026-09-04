/* =====================================================================
 FIT_ULKE — ÜLKE KODU SEÇİCİSİNİN TEK KAYNAĞI
 ---------------------------------------------------------------------
 199 ülke: ISO2 · alan kodu · Türkçe ad. Bayrak GÖRSEL DEĞİL, ISO2'den
 üretilen bölgesel gösterge harfleri — 199 bayrak dosyası taşınmıyor,
 veri 3 KB'de kalıyor.

 🔴 NEDEN AYRI DOSYA: bileşen `giris-v1.html`de kuruldu ve `odemelerim-v1`
 fatura bilgileri formunda da gerekti. Veriyi ikinci bir HTML'e KOPYALAMAK
 3 KB'lik ikinci bir gerçek kaynak üretirdi; bir ülke adı düzeltilince
 ikisinden biri geride kalırdı. Bu yüzden veri de davranış da buraya
 taşındı — `fit-paket.js` ile aynı ilke.
 ⚠ `giris-v1.html` hâlâ kendi satır içi kopyasını taşıyor (o dosya bu
 ajanın değil). Bu dosyayı yükleyip kopyayı silmesi gerekiyor — raporlandı.

 KULLANIM
   <div class="fk-tel" data-cc-kok>
     <button class="fk-cc" type="button" aria-haspopup="listbox" aria-expanded="false">
       <span class="fk-cc-flag"></span><span class="fk-cc-dial"></span><i class="fa-solid fa-chevron-down"></i>
     </button>
     <input class="fk-input" type="tel" />
     <input type="hidden" name="ulke" value="TR" />
     <div class="fk-cc-pop" role="dialog" hidden>
       <div class="fk-cc-search"><i class="fa-solid fa-magnifying-glass"></i><input type="text" placeholder="Ülke ara" /></div>
       <ul class="fk-cc-list" role="listbox" tabindex="-1"></ul>
       <p class="fk-cc-bos" hidden>Eşleşen ülke yok.</p>
     </div>
   </div>
   FIT_ULKE.kur();          // sayfadaki tüm [data-cc-kok] kaplarını sürer

 Klavye sözleşmesi (giris-v1 ile birebir): ↑ ↓ gezinir · Enter seçer ·
 Esc kapatır ve odak düğmeye döner · yazmak süzer · dışarı tıklayınca
 kapanır. Seçim gizli input'a ISO2 yazar.
 ===================================================================== */
window.FIT_ULKE = (function () {
  'use strict';

  var HAM = 'TR|90|Türkiye,DE|49|Almanya,US|1|Amerika Birleşik Devletleri,GB|44|Birleşik Krallık,AZ|994|Azerbaycan,NL|31|Hollanda,FR|33|Fransa,AT|43|Avusturya,BE|32|Belçika,CH|41|İsviçre,SE|46|İsveç,NO|47|Norveç,DK|45|Danimarka,FI|358|Finlandiya,IT|39|İtalya,ES|34|İspanya,PT|351|Portekiz,GR|30|Yunanistan,BG|359|Bulgaristan,RO|40|Romanya,RS|381|Sırbistan,HR|385|Hırvatistan,SI|386|Slovenya,BA|387|Bosna-Hersek,MK|389|Kuzey Makedonya,AL|355|Arnavutluk,ME|382|Karadağ,XK|383|Kosova,HU|36|Macaristan,PL|48|Polonya,CZ|420|Çekya,SK|421|Slovakya,UA|380|Ukrayna,RU|7|Rusya,BY|375|Belarus,MD|373|Moldova,GE|995|Gürcistan,AM|374|Ermenistan,KZ|7|Kazakistan,UZ|998|Özbekistan,TM|993|Türkmenistan,KG|996|Kırgızistan,TJ|992|Tacikistan,CY|357|Kıbrıs,IE|353|İrlanda,IS|354|İzlanda,LU|352|Lüksemburg,MT|356|Malta,EE|372|Estonya,LV|371|Letonya,LT|370|Litvanya,QA|974|Katar,AE|971|Birleşik Arap Emirlikleri,SA|966|Suudi Arabistan,KW|965|Kuveyt,BH|973|Bahreyn,OM|968|Umman,JO|962|Ürdün,LB|961|Lübnan,SY|963|Suriye,IQ|964|Irak,IR|98|İran,IL|972|İsrail,PS|970|Filistin,YE|967|Yemen,EG|20|Mısır,LY|218|Libya,TN|216|Tunus,DZ|213|Cezayir,MA|212|Fas,SD|249|Sudan,SS|211|Güney Sudan,ET|251|Etiyopya,SO|252|Somali,KE|254|Kenya,TZ|255|Tanzanya,UG|256|Uganda,RW|250|Ruanda,NG|234|Nijerya,GH|233|Gana,CI|225|Fildişi Sahili,SN|221|Senegal,CM|237|Kamerun,ZA|27|Güney Afrika,ZW|263|Zimbabve,ZM|260|Zambiya,MZ|258|Mozambik,AO|244|Angola,NA|264|Namibya,BW|267|Botsvana,MG|261|Madagaskar,MU|230|Mauritius,CN|86|Çin,JP|81|Japonya,KR|82|Güney Kore,KP|850|Kuzey Kore,IN|91|Hindistan,PK|92|Pakistan,BD|880|Bangladeş,LK|94|Sri Lanka,NP|977|Nepal,AF|93|Afganistan,TH|66|Tayland,VN|84|Vietnam,MY|60|Malezya,SG|65|Singapur,ID|62|Endonezya,PH|63|Filipinler,MM|95|Myanmar,KH|855|Kamboçya,LA|856|Laos,MN|976|Moğolistan,HK|852|Hong Kong,TW|886|Tayvan,MO|853|Makao,AU|61|Avustralya,NZ|64|Yeni Zelanda,FJ|679|Fiji,PG|675|Papua Yeni Gine,CA|1|Kanada,MX|52|Meksika,BR|55|Brezilya,AR|54|Arjantin,CL|56|Şili,CO|57|Kolombiya,PE|51|Peru,VE|58|Venezuela,EC|593|Ekvador,BO|591|Bolivya,PY|595|Paraguay,UY|598|Uruguay,CR|506|Kosta Rika,PA|507|Panama,GT|502|Guatemala,HN|504|Honduras,SV|503|El Salvador,NI|505|Nikaragua,CU|53|Küba,DO|1|Dominik Cumhuriyeti,JM|1|Jamaika,TT|1|Trinidad ve Tobago,PR|1|Porto Riko,BS|1|Bahamalar,BB|1|Barbados,HT|509|Haiti,BZ|501|Belize,GY|592|Guyana,SR|597|Surinam,AD|376|Andorra,MC|377|Monako,SM|378|San Marino,VA|379|Vatikan,LI|423|Liechtenstein,FO|298|Faroe Adaları,GL|299|Grönland,GI|350|Cebelitarık,BN|673|Brunei,BT|975|Bhutan,MV|960|Maldivler,TL|670|Doğu Timor,NC|687|Yeni Kaledonya,PF|689|Fransız Polinezyası,VU|678|Vanuatu,SB|677|Solomon Adaları,TO|676|Tonga,WS|685|Samoa,KI|686|Kiribati,NR|674|Nauru,TV|688|Tuvalu,FM|691|Mikronezya,MH|692|Marshall Adaları,PW|680|Palau,CV|238|Yeşil Burun,GM|220|Gambiya,GN|224|Gine,GW|245|Gine-Bissau,SL|232|Sierra Leone,LR|231|Liberya,TG|228|Togo,BJ|229|Benin,NE|227|Nijer,BF|226|Burkina Faso,ML|223|Mali,MR|222|Moritanya,TD|235|Çad,CF|236|Orta Afrika Cumhuriyeti,CG|242|Kongo,CD|243|Demokratik Kongo,GA|241|Gabon,GQ|240|Ekvator Ginesi,ST|239|Sao Tome ve Principe,BI|257|Burundi,DJ|253|Cibuti,ER|291|Eritre,MW|265|Malavi,LS|266|Lesotho,SZ|268|Esvatini,KM|269|Komorlar,SC|248|Seyşeller';

  var ULKELER = HAM.split(',').map(function (x) {
    var p = x.split('|');
    return { iso: p[0], dial: p[1], ad: p[2] };
  });

  function bayrak(iso) {
    return String.fromCodePoint.apply(null, iso.toUpperCase().split('')
      .map(function (c) { return 0x1F1E6 + c.charCodeAt(0) - 65; }));
  }
  function kucuk(x) { return String(x).toLocaleLowerCase('tr'); }
  function bul(iso) {
    for (var i = 0; i < ULKELER.length; i++) if (ULKELER[i].iso === iso) return ULKELER[i];
    return null;
  }

  function kurBir(kok) {
    if (kok.__ccKuruldu) return;          /* iki kez sürülmesin */
    kok.__ccKuruldu = true;

    var btn   = kok.querySelector('.fk-cc');
    var pop   = kok.querySelector('.fk-cc-pop');
    var ara   = kok.querySelector('.fk-cc-search input');
    var liste = kok.querySelector('.fk-cc-list');
    var bos   = kok.querySelector('.fk-cc-bos');
    var gizli = kok.querySelector('input[type="hidden"]');
    var tel   = kok.querySelector('.fk-input');
    if (!btn || !pop || !liste) return;

    var secili = (gizli && gizli.value) || 'TR', imlec = 0, suzulmus = ULKELER;

    function bas(q) {
      q = kucuk((q || '').trim()).replace(/^\+/, '');
      suzulmus = !q ? ULKELER : ULKELER.filter(function (u) {
        return kucuk(u.ad).indexOf(q) > -1 || u.dial.indexOf(q) === 0 || kucuk(u.iso) === q;
      });
      liste.innerHTML = suzulmus.map(function (u, i) {
        return '<li role="option" data-iso="' + u.iso + '" data-dial="' + u.dial + '"' +
               ' aria-selected="' + (u.iso === secili ? 'true' : 'false') + '"' +
               (i === imlec ? ' class="on"' : '') + '>' +
               '<span class="bay" aria-hidden="true">' + bayrak(u.iso) + '</span>' +
               '<span class="ad">' + u.ad + '</span>' +
               '<span class="kod">+' + u.dial + '</span></li>';
      }).join('');
      if (bos) bos.hidden = suzulmus.length > 0;
      liste.hidden = suzulmus.length === 0;
    }

    function imlecTasi(n) {
      if (!suzulmus.length) return;
      imlec = Math.max(0, Math.min(suzulmus.length - 1, n));
      var oge = liste.children[imlec];
      Array.prototype.forEach.call(liste.children, function (x, i) { x.classList.toggle('on', i === imlec); });
      if (oge) oge.scrollIntoView({ block: 'nearest' });
    }

    function sec(iso, dial, ad) {
      secili = iso;
      btn.querySelector('.fk-cc-flag').textContent = bayrak(iso);
      btn.querySelector('.fk-cc-dial').textContent = '+' + dial;
      btn.setAttribute('aria-label', 'Ülke kodu — şu an ' + ad + ' +' + dial);
      if (gizli) gizli.value = iso;
      kapat(true);
      if (tel) tel.focus();
    }

    function ac() {
      pop.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      if (ara) ara.value = '';
      imlec = Math.max(0, ULKELER.findIndex(function (u) { return u.iso === secili; }));
      bas('');
      imlecTasi(imlec);
      if (ara) ara.focus();
    }
    function kapat(odak) {
      pop.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (odak) btn.focus();
    }

    btn.addEventListener('click', function () { pop.hidden ? ac() : kapat(true); });
    if (ara) ara.addEventListener('input', function () { imlec = 0; bas(ara.value); imlecTasi(0); });

    liste.addEventListener('click', function (e) {
      var li = e.target.closest('li'); if (!li) return;
      sec(li.getAttribute('data-iso'), li.getAttribute('data-dial'), li.querySelector('.ad').textContent);
    });

    pop.addEventListener('keydown', function (e) {
      if (e.key === 'Escape')    { e.preventDefault(); kapat(true); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); imlecTasi(imlec + 1); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); imlecTasi(imlec - 1); return; }
      if (e.key === 'Enter') {
        e.preventDefault();
        var u = suzulmus[imlec]; if (!u) return;
        sec(u.iso, u.dial, u.ad);
      }
    });

    document.addEventListener('click', function (e) {
      if (!pop.hidden && !kok.contains(e.target)) kapat(false);
    });

    /* açılış görünümü — gizli input'taki ISO neyse o basılır */
    var b = bul(secili) || ULKELER[0];
    btn.querySelector('.fk-cc-flag').textContent = bayrak(b.iso);
    btn.querySelector('.fk-cc-dial').textContent = '+' + b.dial;
    btn.setAttribute('aria-label', 'Ülke kodu — şu an ' + b.ad + ' +' + b.dial);
    bas('');
  }

  function kur(kapsam) {
    (kapsam || document).querySelectorAll('[data-cc-kok]').forEach(kurBir);
  }

  return { ulkeler: ULKELER, bayrak: bayrak, bul: bul, kur: kur };
})();
