/* =====================================================================
 DADAFIT · SPOR SÖZLÜĞÜ — TEK VERİ KAYNAĞI  (H1 · 5. tur)
 ---------------------------------------------------------------------
 Bu dosya sözlüğün TEK kaynağıdır. Hem `sozluk-v1.html` (liste) hem
 `sozluk-detay-v1.html` (terim detayı) aynı diziyi okur; hiçbir terim
 iki yere kopyalanmaz. Sayfalardaki bütün sayılar (terim sayısı,
 kategori sayısı, harf dizini, kategori başına adet) buradan HESAPLANIR,
 elle yazılmaz.

 KAYIT ŞEMASI — brief §H1
   terim            TR ad
   ingilizce        İngilizce karşılık
   kategori         KATEGORILER[].id
   harf             İLK HARF — elle yazılmaz, aşağıda türetilir
   slug             adres anahtarı — elle yazılmaz, aşağıda türetilir
   tanim            2-3 cümle, düz anlatım, ansiklopedik ton
   ornek            1 cümle örnek kullanım
   hareket          (ops.) egzersiz kütüphanesindeki GERÇEK slug
   kas              (ops.) anatomi modülündeki GERÇEK kas slug'ı
   karistirilanlar  (ops.) {slug, not} — sık karıştırılan terim + farkı

 KÖPRÜ KURALI — uydurma slug yok.
 · hareket → egzersiz-detay-v1.html?slug=…  · yalnız şu 25'i kullanılır (7. oturum: katalog 12 → 25):
   goblet-squat · plank · dambil-kurek · sinav · hamle · dead-bug ·
   kettlebell-swing · kopru · bant-cekme · bant-yana-acma ·
   dambil-biceps · dambil-omuz-press
 · kas → anatomi-v1.html?kas=…  · H2 oturumunun sayfası. Bu branch'te o
   dosya YOK; köprüler birleştirmeden sonra karşılık bulacak. Slug
   sözlüğü koordinatör tarafından sabitlendi, genişletilmedi.

 TÜRKÇE HARF NOTU: ilk harf Türkçe kurallarına göre büyütülür
 ("ısınma" → I, "izometrik" → İ). JS'in toUpperCase()'i bunu yanlış
 yapar, bu yüzden eşleme tablosu var.
 ===================================================================== */
(function (global) {
  'use strict';

  /* ---------- Türkçe büyük harf + slug türetici ---------- */
  var BUYUK = { 'i': 'İ', 'ı': 'I', 'ğ': 'Ğ', 'ü': 'Ü', 'ş': 'Ş', 'ö': 'Ö', 'ç': 'Ç' };
  function buyuk(ch) { return BUYUK[ch] || ch.toUpperCase(); }

  var ALFABE = ['A','B','C','Ç','D','E','F','G','Ğ','H','I','İ','J','K','L','M',
                'N','O','Ö','P','R','S','Ş','T','U','Ü','V','Y','Z'];

  var CEVIR = { 'ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u',
                'Ç':'c','Ğ':'g','I':'i','İ':'i','Ö':'o','Ş':'s','Ü':'u' };
  function slugla(s) {
    return s.split('').map(function (c) { return CEVIR[c] !== undefined ? CEVIR[c] : c; })
      .join('').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /* ---------- KATEGORİLER ----------
     `giris` her detay sayfasında "bu terim hangi ailede" bloğunu besler;
     kategori seçicideki sayılar TERIMLER'den sayılır, burada yazmaz. */
  var KATEGORILER = [
    { id:'hareket-teknik', ad:'Hareket ve teknik', ikon:'fa-solid fa-dumbbell',
      giris:'Bir hareketin nasıl yapıldığını tarif eden dil bu ailede toplanır: tekrar ve set sayımı, hareketin hangi evrede olduğu, hızın nasıl yazıldığı ve zorluğun nasıl ölçüldüğü. Antrenman programlarındaki kısaltmaların çoğu buradan gelir.' },
    { id:'ekipman', ad:'Ekipman', ikon:'fa-solid fa-weight-hanging',
      giris:'Salonda ya da evde kullanılan araçların adları, ne işe yaradıkları ve hangi hareketle birlikte anıldıkları. Aynı araç Türkçede birden çok adla geçtiği için karşılıklar burada birlikte verilir.' },
    { id:'anatomi', ad:'Kas grupları ve anatomi', ikon:'fa-solid fa-person',
      giris:'Antrenman metinlerinde geçen kas adları ve gövde bölgeleri. Tanımlar kısa tutulur; kasın konumu, ne yaptığı ve hangi hareketle çalıştığı tek bakışta okunacak biçimde verilir.' },
    { id:'metodoloji', ad:'Antrenman kültürü ve metodoloji', ikon:'fa-solid fa-diagram-project',
      giris:'Antrenmanın nasıl planlandığına dair kavramlar ve salon kültürünün kendi sözleri. Bölünme tipleri, dönemleme, yüklenme mantığı ve CrossFit gibi alt kültürlerin kısaltmaları bu ailede.' },
    { id:'fizyoloji', ad:'Kondisyon ve fizyoloji', ikon:'fa-solid fa-heart-pulse',
      giris:'Vücudun antrenmana nasıl yanıt verdiğini anlatan terimler: enerji sistemleri, kalp ve solunum ölçütleri, yorgunluk ve uyum süreçleri. Sayıyla ölçülen kavramların çoğu buradadır.' },
    { id:'dovus', ad:'Dövüş sanatları', ikon:'fa-solid fa-hand-fist',
      giris:'Boks, güreş, Brezilya jiu-jitsu, karate ve MMA salonlarında ortak kullanılan pozisyon, teknik ve ortam adları. Terimlerin çoğu özgün dilinde kaldığı için Türkçe karşılıklar birlikte verilir.' },
    { id:'kosu', ad:'Koşu ve dayanıklılık', ikon:'fa-solid fa-person-running',
      giris:'Koşu, bisiklet ve yüzme gibi süreklilik gerektiren sporların planlama ve yarış dili. Tempo, bölüm süresi, adım sıklığı ve yarış öncesi hazırlık kavramları bu ailede.' },
    { id:'mobilite', ad:'Esneklik ve mobilite', ikon:'fa-solid fa-child-reaching',
      giris:'Eklem hareket açıklığı, germe biçimleri ve hareket kalitesini ölçen kavramlar. Esneklik ile mobilite arasındaki fark bu ailenin en sık karıştırılan başlığıdır.' },
    { id:'beslenme', ad:'Beslenme ve toparlanma', ikon:'fa-solid fa-utensils',
      giris:'Antrenmanın etrafındaki beslenme ve dinlenme kavramları. Buradaki tanımlar bilgilendirme amaçlıdır; kişiye özel beslenme planı için bir uzmana danışmak gerekir.' },
    { id:'guvenlik', ad:'Yaralanma ve güvenlik', ikon:'fa-solid fa-shield-heart',
      giris:'Sık karşılaşılan sakatlıkların adları, uyarı işaretleri ve salonda güvenliği ilgilendiren kavramlar. Tanımlar tanı koymaz; ağrı sürüyorsa bir hekime ya da fizyoterapiste başvurmak gerekir.' }
  ];

  /* =====================================================================
     KÜNYE TABLOLARI  (referans ölçümünden geldi — dadagastro "KÜNYE" bloğu)
     ---------------------------------------------------------------------
     KAYNAK DİL: terimin **Türkçe spor diline girdiği dil**. Sözcüğün kökeni
     daha eskiye gidebilir (ör. "halter" Fransızca üzerinden gelmiştir ama
     kökü Yunancadır); burada yazan, terimi bugün hangi dilden aldığımızdır.
     Listede olmayan her terim Türkçedir — Türkçe betimleyici adlar (uyluk ön
     kası, yük artış kuralı…) tabloya yazılmaz.

     Bilimsel adlandırma için tek etiket kullanılır: anatomi ve tıp
     terimlerinde Latince ile Yunanca iç içe geçtiğinden ayrı ayrı iddia
     edilmez.

     OKUNUŞ: yalnız yazılışından okunuşu çıkmayan yabancı terimlerde var.
     Türkçe okunduğu gibi yazılan terimlerde satır hiç basılmaz.
     ===================================================================== */
  var SCI = 'Latince / Yunanca (bilimsel ad)';
  var KAYNAK_DIL = {
    /* hareket ve teknik */
    'drop-set':'İngilizce', 'set':'İngilizce', 'superset':'İngilizce',
    'form':'İngilizce', 'tempo':'İtalyanca',
    'plank':'İngilizce', 'dead-bug':'İngilizce', 'kettlebell-swing':'İngilizce',
    'biceps-curl':'İngilizce', 'omuz-press':'İngilizce', 'bench-press':'İngilizce',
    'burpee':'İngilizce', 'barfiks':'Fransızca',
    /* ekipman */
    'dambil':'İngilizce', 'foam-roller':'İngilizce', 'kettlebell':'İngilizce',
    'olimpik-bar':'İngilizce', 'plyo-kutu':'İngilizce', 'smith-makinesi':'İngilizce',
    'halter':'Fransızca', 'barfiks-bari':'Fransızca', 'sehpa':'Farsça',
    'ergometre':SCI, 'magnezyum':SCI,
    /* anatomi — yalnız terimin KENDİSİ bilimsel ad olanlar */
    'biceps':SCI, 'triceps':SCI, 'deltoid':SCI, 'soleus':SCI,
    'romboid-kaslar':SCI, 'rotator-manset':SCI,
    /* metodoloji */
    'amrap':'İngilizce', 'box':'İngilizce', 'chipper':'İngilizce', 'crossfit':'İngilizce',
    'deload':'İngilizce', 'emom':'İngilizce', 'hero-wod':'İngilizce', 'hiit':'İngilizce',
    'metcon':'İngilizce', 'spotcu':'İngilizce', 'periyodizasyon':'İngilizce',
    'tabata':'Japonca',
    /* fizyoloji */
    'aerobik':'İngilizce', 'anaerobik':'İngilizce', 'kardiyo':'İngilizce',
    'vo2max':'İngilizce', 'superkompanzasyon':'İngilizce', 'kondisyon':'Fransızca',
    'laktat':SCI, 'laktik-esik':SCI, 'glikojen':SCI, 'hipertrofi':SCI,
    /* dövüş sanatları */
    'kata':'Japonca', 'kumite':'Japonca', 'kimura':'Japonca', 'tatami':'Japonca',
    'armbar':'İngilizce', 'guard':'İngilizce', 'mount':'İngilizce', 'sweep':'İngilizce',
    'submission':'İngilizce', 'takedown':'İngilizce', 'sparring':'İngilizce',
    'ring':'İngilizce', 'jab':'İngilizce', 'klinc':'İngilizce', 'aparkat':'İngilizce',
    'krose':'Fransızca', 'direkt':'Fransızca',
    /* koşu ve dayanıklılık */
    'fartlek':'İsveççe', 'pace':'İngilizce', 'split':'İngilizce',
    'negatif-split':'İngilizce', 'taper':'İngilizce', 'kadans':'Fransızca',
    'maraton':'Fransızca', 'yari-maraton':'Fransızca', 'ultra-maraton':'Fransızca',
    /* esneklik ve mobilite */
    'mobilite':'İngilizce', 'pnf-germe':'İngilizce', 'aktivasyon':'Fransızca',
    'miyofasyal-gevsetme':SCI, 'torasik-hareketlilik':SCI,
    /* beslenme */
    'protein':SCI, 'karbonhidrat':SCI, 'elektrolit':SCI, 'kreatin':SCI, 'kafein':SCI,
    /* yaralanma ve güvenlik */
    'tendinopati':SCI, 'asil-tendinopatisi':SCI, 'plantar-fasiit':SCI,
    'rehabilitasyon':SCI, 'fizyoterapi':SCI, 'kramp':'Fransızca',
    'rice-ilkesi':'İngilizce'
  };

  var OKUNUS = {
    'foam-roller':'fom ro-lır', 'kettlebell':'ket-l-bel', 'plyo-kutu':'pli-yo kutu',
    'smith-makinesi':'smis makinesi', 'crossfit':'kros-fit', 'box':'boks',
    'chipper':'çi-pır', 'deload':'di-lod', 'hero-wod':'hi-ro vod', 'metcon':'met-kon',
    'tabata':'ta-ba-ta', 'amrap':'am-rap', 'emom':'i-mom', 'hiit':'hiit',
    'vo2max':'ve-o-iki maks', 'pace':'peys', 'taper':'tey-pır', 'fartlek':'fart-lek',
    'guard':'gard', 'mount':'ma-unt', 'sweep':'sviip', 'submission':'sab-mi-şın',
    'takedown':'teyk-da-un', 'armbar':'arm-bar', 'jab':'cab', 'sparring':'spa-ring',
    'kimura':'ki-mu-ra', 'kata':'ka-ta', 'kumite':'ku-mi-te', 'tatami':'ta-ta-mi',
    'rice-ilkesi':'ra-yıs ilkesi', 'pnf-germe':'pe-ne-fe germe',
    'biceps':'bi-seps', 'triceps':'tri-seps', 'soleus':'so-le-us',
    'plantar-fasiit':'plan-tar fa-si-it', 'drop-set':'drop set',
    'plank':'plenk', 'dead-bug':'ded bag', 'kettlebell-swing':'ket-l-bel sving',
    'biceps-curl':'bi-seps körl', 'omuz-press':'omuz pres', 'bench-press':'benç pres',
    'burpee':'bör-pi'
  };

  /* SIK ARANAN SORULAR — referanstaki "Püf Noktası Aramaları" bloğunun
     karşılığı; brief H1'i SEO hedefli tanımlıyor, bu blok o işi yapıyor.
     Kalıplar kategoriye göre seçiliyor ki "DOMS nasıl yapılır" gibi anlamsız
     ifadeler üretilmesin. {t} terimin adıyla değişir. */
  var ARAMA_KALIP = {
    /* İlk iki kalıp her terim için geçerli; son iki kalıp kategoriye özel ve
       o kategorinin HER ÜYESİ için anlamlı olacak şekilde seçildi. Örneğin
       fizyolojide "nasıl geliştirilir" denmiyor — "gecikmiş kas ağrısı nasıl
       geliştirilir" saçma bir ifade olurdu. */
    'hareket-teknik':['{t} nedir','{t} ne demek','{t} programda ne anlama gelir','{t} yeni başlayanlar için'],
    'ekipman':       ['{t} nedir','{t} ne demek','{t} ne işe yarar','{t} evde kullanılır mı'],
    'anatomi':       ['{t} nedir','{t} nerede bulunur','{t} ne işe yarar','{t} hangi hareketle çalışır'],
    'metodoloji':    ['{t} nedir','{t} ne demek','{t} antrenmanda ne anlama gelir','{t} kimlere uygun'],
    'fizyoloji':     ['{t} nedir','{t} ne demek','{t} antrenmanı nasıl etkiler','{t} nasıl takip edilir'],
    'dovus':         ['{t} nedir','{t} ne demek','{t} hangi sporda kullanılır','{t} yeni başlayanlar için'],
    'kosu':          ['{t} nedir','{t} ne demek','{t} koşuda ne anlama gelir','{t} yeni başlayanlar için'],
    'mobilite':      ['{t} nedir','{t} ne demek','{t} neden önemli','{t} egzersizleri'],
    'beslenme':      ['{t} nedir','{t} ne demek','{t} antrenmanı nasıl etkiler','{t} hakkında bilinmesi gerekenler'],
    'guvenlik':      ['{t} nedir','{t} ne demek','{t} spor yaparken ne anlama gelir','{t} hakkında bilinmesi gerekenler']
  };

  /* ---------- TERİMLER ---------- */
  var TERIMLER = [];
  function ekle(liste) { liste.forEach(function (t) { TERIMLER.push(t); }); }

  /* ===== 1 · HAREKET VE TEKNİK ===== */
  ekle([
  { terim:'Tekrar', ingilizce:'Repetition (rep)', kategori:'hareket-teknik',
    tanim:'Bir hareketin baştan sona bir kez yapılmasına tekrar denir. Programlarda çoğunlukla "rep" kısaltmasıyla yazılır ve set içindeki adet olarak verilir. Tekrar sayısı, kullanılan yükle birlikte antrenmanın hangi amaca hizmet ettiğini belirleyen iki değişkenden biridir.',
    ornek:'Goblet squat için 3 set 12 tekrar yaz, aradaki dinlenmeyi 60 saniyede tut.',
    hareket:'goblet-squat',
    karistirilanlar:{ slug:'set', not:'Tekrar tek bir hareketi, set ise arka arkaya yapılan tekrarların bütününü anlatır.' } },

  { terim:'Set', ingilizce:'Set', kategori:'hareket-teknik',
    tanim:'Arka arkaya, dinlenmeden yapılan tekrarların oluşturduğu bloğa set denir. Setler arasında verilen dinlenme süresi, o setin hangi enerji sistemini zorladığını doğrudan değiştirir. Antrenman hacmi genelde set sayısı üzerinden takip edilir.',
    ornek:'Bugünkü çalışmada sırt için toplam on iki set yaptım.',
    karistirilanlar:{ slug:'tekrar', not:'Set tekrarların bütünüdür; tekrar ise o bütünün tek bir parçasıdır.' } },

  { terim:'Tempo', ingilizce:'Tempo', kategori:'hareket-teknik',
    tanim:'Bir tekrarın evrelerinin kaç saniyede yapılacağını belirten yazım biçimidir. Dört haneli olarak yazılır: eksantrik, alt duraklama, konsantrik ve üst duraklama süreleri sırayla verilir. Aynı yük ve aynı tekrar sayısı, tempo değiştiğinde tamamen farklı bir uyaran hâline gelir.',
    ornek:'3-1-1-0 temposuyla çalış: üç saniyede in, bir saniye bekle, bir saniyede kalk.' },

  { terim:'Hareket açıklığı', ingilizce:'Range of motion (ROM)', kategori:'hareket-teknik',
    tanim:'Bir eklemin ya da hareketin katettiği yolun tamamına hareket açıklığı denir. Tam açıklıkta çalışmak kası bütün boylarında yüklerken, kısaltılmış açıklık yalnız belirli bir aralığı zorlar. Programlarda çoğunlukla ROM kısaltmasıyla geçer.',
    ornek:'Çömelmede dizin ağrımıyorsa hareket açıklığını kısaltma, kalçayı diz hizasının altına indir.',
    hareket:'goblet-squat',
    karistirilanlar:{ slug:'mobilite', not:'Hareket açıklığı ölçülen mesafedir; mobilite o mesafeyi kontrollü kullanabilme becerisidir.' } },

  { terim:'Konsantrik evre', ingilizce:'Concentric phase', kategori:'hareket-teknik',
    tanim:'Kasın kısalarak yükü yendiği evredir. Biceps curl\'de dirseği bükerken, çömelmede yukarı kalkarken bu evre çalışır. Hareketin "zor" tarafı olarak anılsa da üretilen kuvvet eksantrik evreden düşüktür.',
    ornek:'Konsantrik evreyi hızlandır ama yükü savurma, kontrolü elden bırakma.',
    hareket:'dambil-biceps', kas:'biceps',
    karistirilanlar:{ slug:'eksantrik-evre', not:'Konsantrikte kas kısalır, eksantrikte uzayarak yükü yavaşlatır.' } },

  { terim:'Eksantrik evre', ingilizce:'Eccentric phase', kategori:'hareket-teknik',
    tanim:'Kasın gerilim altında uzadığı, yani yükü indirirken frenlediği evredir. Kas bu evrede konsantrik evreye göre daha fazla kuvvet üretebilir ve kas liflerindeki mikro hasarın büyük bölümü burada oluşur. Antrenman sonrası gecikmiş kas ağrısının başlıca kaynağı da bu evredir.',
    ornek:'Dambılı üç saniyede indirerek eksantrik evreyi uzat.',
    hareket:'dambil-biceps',
    karistirilanlar:{ slug:'negatif-tekrar', not:'Eksantrik evre her tekrarın bir parçasıdır; negatif tekrar ise yalnız bu evrenin çalışıldığı özel bir yöntemdir.' } },

  { terim:'İzometrik kasılma', ingilizce:'Isometric contraction', kategori:'hareket-teknik',
    tanim:'Kasın boyu değişmeden gerilim ürettiği kasılma biçimidir. Eklem açısı sabit kaldığı için dışarıdan bakıldığında hareket görünmez, oysa kas yük altındadır. Plank, duvar oturuşu ve askıda kalma bu ailenin bilinen örnekleridir.',
    ornek:'Plank pozisyonunda otuz saniye kalarak izometrik kasılma çalış.',
    hareket:'plank', kas:'karin-duz' },

  { terim:'Süperset', ingilizce:'Superset', kategori:'hareket-teknik',
    tanim:'İki hareketin arada dinlenmeden art arda yapılmasıdır. Karşıt kas gruplarıyla kurulduğunda toplam antrenman süresini kısaltır, aynı kas grubunda kurulduğunda yerel yorgunluğu artırır. Süre kısıtlı antrenmanlarda hacmi korumanın yaygın yoludur.',
    ornek:'Dambıl kürek ile şınavı süperset yap, ikisi bitince doksan saniye dinlen.',
    hareket:'dambil-kurek',
    karistirilanlar:{ slug:'drop-set', not:'Süperset iki farklı hareketi birleştirir; drop set aynı harekette yükü düşürerek devam eder.' } },

  { terim:'Drop set', ingilizce:'Drop set', kategori:'hareket-teknik',
    tanim:'Sete devam edilemeyecek noktaya gelindiğinde yükün hızla azaltılıp aynı harekete devam edilmesidir. Amaç, kası tek bir set içinde daha uzun süre gerilim altında tutmaktır. Yoğunluğu yüksek olduğu için her harekette ve her antrenmanda kullanılmaz.',
    ornek:'Son sette dambılı bir kademe düşürüp drop set uygula.' },

  { terim:'Algılanan zorluk ölçeği', ingilizce:'Rate of perceived exertion (RPE)', kategori:'hareket-teknik',
    tanim:'Bir setin ne kadar zorlandığını 1 ile 10 arasında bir sayıyla anlatan öznel ölçektir. RPE 8, "iki tekrar daha yapabilirdim" anlamına gelir. Günlük performans dalgalandığı için sabit yük yerine RPE ile programlamak yaygınlaşmıştır.',
    ornek:'Bu seti RPE 7 civarında bırak, sonuna kadar zorlanma.' },

  { terim:'Tek tekrar maksimumu', ingilizce:'One-rep max (1RM)', kategori:'hareket-teknik',
    tanim:'Bir harekette tekniği bozmadan yalnız bir kez kaldırılabilen en yüksek yüktür. Kuvvet programlarında antrenman ağırlıkları çoğunlukla bu değerin yüzdesi olarak yazılır. Doğrudan denemek yerine düşük tekrarlı setlerden hesaplanarak tahmin edilmesi daha güvenlidir.',
    ornek:'Programdaki yükleri tek tekrar maksimumunun yüzde yetmişine göre ayarla.' },

  { terim:'Negatif tekrar', ingilizce:'Negative rep', kategori:'hareket-teknik',
    tanim:'Yalnız eksantrik evrenin çalışıldığı tekrar biçimidir. Yük kaldırılırken destek alınır, indirilirken olabildiğince yavaş frenlenir. Barfiks gibi henüz yapılamayan hareketlere geçişte sık kullanılır.',
    ornek:'Barfikste yukarı sıçra, aşağı beş saniyede in; bu bir negatif tekrardır.' },

  { terim:'Duraklamalı tekrar', ingilizce:'Paused rep', kategori:'hareket-teknik',
    tanim:'Hareketin en zor noktasında birkaç saniye beklenerek yapılan tekrardır. Bekleme, biriken esneme enerjisini ortadan kaldırdığı için kası o açıda daha çok zorlar. Teknik oturtmak ve takılınan noktayı güçlendirmek için kullanılır.',
    ornek:'Çömelmenin dibinde iki saniye bekleyip kalk, duraklamalı tekrar böyle olur.',
    hareket:'goblet-squat' },

  { terim:'Tek taraflı çalışma', ingilizce:'Unilateral training', kategori:'hareket-teknik',
    tanim:'Hareketin tek kol ya da tek bacakla yapılmasıdır. İki taraf arasındaki kuvvet farkını görünür kılar ve gövdenin denge görevini artırır. Sakatlık sonrası dönüşte zayıf tarafı ayrı çalıştırmak için tercih edilir.',
    ornek:'Hamle tek taraflı bir harekettir; iki bacak arasındaki farkı hemen gösterir.',
    hareket:'hamle', kas:'gluteus-medius' },

  { terim:'Bileşik hareket', ingilizce:'Compound movement', kategori:'hareket-teknik',
    tanim:'Birden fazla eklemin birlikte çalıştığı ve büyük kas gruplarını aynı anda yükleyen hareketlerdir. Çömelme, kürek çekme ve şınav bu ailededir. Zaman verimliliği yüksek olduğu için antrenmanın başına konur.',
    ornek:'Antrenmana bileşik hareketle başla, izolasyonu sona bırak.',
    hareket:'goblet-squat',
    karistirilanlar:{ slug:'izolasyon-hareketi', not:'Bileşik harekette birden çok eklem, izolasyonda tek eklem çalışır.' } },

  { terim:'İzolasyon hareketi', ingilizce:'Isolation exercise', kategori:'hareket-teknik',
    tanim:'Tek bir eklemin hareket ettiği ve yükün belirli bir kasa yoğunlaştığı hareketlerdir. Biceps curl ve yana açma bu gruba girer. Zayıf kalan bir bölgeyi hedeflemek ya da antrenmanın sonunda hacim tamamlamak için kullanılır.',
    ornek:'Kol gününün sonuna iki izolasyon hareketi ekle.',
    hareket:'dambil-biceps', kas:'biceps' },

  { terim:'Yetersizliğe kadar çalışma', ingilizce:'Training to failure', kategori:'hareket-teknik',
    tanim:'Setin, tekniği koruyarak bir tekrar daha yapılamayacak noktaya kadar sürdürülmesidir. Kas gelişimi için güçlü bir uyaran sağlar ama toparlanma yükünü belirgin biçimde artırır. Her sette değil, seçilmiş setlerde kullanılması önerilir.',
    ornek:'Son seti yetersizliğe kadar götür, öncekileri bir iki tekrar payla bırak.' },

  { terim:'Kısmi tekrar', ingilizce:'Partial rep', kategori:'hareket-teknik',
    tanim:'Hareketin tam açıklığı yerine yalnız bir bölümünün çalışıldığı tekrardır. Takılınan açıyı güçlendirmek ya da yorgunluk sonrası sete devam etmek için kullanılır. Tam açıklığın yerini almaz, onun yanında bir araçtır.',
    ornek:'Tam tekrarlar bittiğinde birkaç kısmi tekrarla seti kapat.' },

  { terim:'Isınma seti', ingilizce:'Warm-up set', kategori:'hareket-teknik',
    tanim:'Asıl çalışma yükünden önce hafif ağırlıkla yapılan hazırlık setleridir. Eklem sıvısını hareketlendirir, sinir sistemini hareketin desenine alıştırır ve teknik kontrolü yükselen yükle birlikte test eder. Sayılan hacme dahil edilmezler.',
    ornek:'Boş barla iki ısınma seti yap, sonra çalışma yüküne geç.' },

  { terim:'Şınav', ingilizce:'Push-up', kategori:'hareket-teknik',
    tanim:'Gövde düz bir çizgi hâlinde tutulurken kolların büküldüğü, vücut ağırlığıyla yapılan itiş hareketidir. Göğüs, ön deltoid ve triceps birlikte çalışır. Hareketin adım adım anlatımı kütüphanedeki Şınav kartındadır.',
    ornek:'Tam şınav zorsa elleri bir sehpaya koyup açıyı azalt.',
    hareket:'sinav', kas:'gogus' },

  { terim:'Zirve kasılma', ingilizce:'Peak contraction', kategori:'hareket-teknik',
    tanim:'Kasın en kısa olduğu noktada bir an sıkılarak beklenmesidir. Hareketin tepesinde gerilimi kaybetmemeyi ve yükü savurarak taşımamayı öğretir. Özellikle izolasyon hareketlerinde tercih edilir.',
    ornek:'Kürek çekişin tepesinde kürek kemiklerini birbirine yaklaştırıp zirve kasılmayı hisset.',
    hareket:'dambil-kurek', kas:'romboid' },

  { terim:'Form', ingilizce:'Form (technique)', kategori:'hareket-teknik',
    tanim:'Bir hareketin amaçlanan kasları hedefleyecek ve eklemleri gereksiz yere zorlamayacak biçimde yapılmasına form denir. Form bozulduğunda yük hedef kastan kaçar ve risk artar. Yükü artırmadan önce formun sabitlenmiş olması beklenir.',
    ornek:'Ağırlığı artırmadan önce formun beş sette de aynı kaldığından emin ol.' },

  { terim:'Nefes kilidi', ingilizce:'Valsalva maneuver', kategori:'hareket-teknik',
    tanim:'Ağır kaldırışlarda nefesin tutularak karın içi basıncın artırılması ve omurganın bu basınçla desteklenmesidir. Kısa süreli kullanıldığında gövde sağlamlığını belirgin biçimde artırır. Tansiyon ve kalp-damar sorunu olanlarda uygun olmayabileceği için hekime danışmayı gerektirir.',
    ornek:'Ağır çömelmede nefesi tepede al, dipte tut, kalkarken bırak.' },

  { terim:'Çekiş hareketi', ingilizce:'Pulling movement', kategori:'hareket-teknik',
    tanim:'Yükün gövdeye doğru yaklaştırıldığı hareket ailesidir. Sırt, kol bükücüleri ve kürek kemiği çevresindeki kaslar birlikte çalışır. Programlarda itiş hareketleriyle dengelenmesi, omuz sağlığı açısından önemli kabul edilir.',
    ornek:'Haftalık planında itiş ve çekiş hareketlerinin sayısını birbirine yakın tut.',
    hareket:'dambil-kurek', kas:'latissimus' },

  /* --- KATALOG HAREKETLERİ ---------------------------------------------
     Aşağıdaki kayıtlar egzersiz kütüphanesindeki GERÇEK kartlarla aynı
     hareketi adlandırıyor. Bu yüzden tanımları BİLEREK kısa: terimin ne
     olduğunu söyleyip okuyucuyu kartın kendisine gönderiyorlar, "nasıl
     yapılır" anlatmıyorlar — o iş kütüphanenin. Sınama bu kayıtların
     tanımını 260 karakterle sınırlar (tests/sozluk-kapalilik.mjs). */

  { terim:'Çömelme', ingilizce:'Squat', kategori:'hareket-teknik',
    tanim:'Kalçanın ve dizlerin birlikte bükülüp gövdenin dik tutularak alçaltıldığı temel alt vücut hareketidir. Uyluk ön kası, kalça ve gövde merkezi birlikte çalışır. Adım adım anlatımı kütüphanedeki Hava Squat (Bodyweight Squat) kartındadır.',
    ornek:'Isınmadan sonra ağırlıksız çömelme yaparak kalıbı oturt.',
    hareket:'hava-squat', kas:'quadriceps',
    karistirilanlar:{ slug:'comelme-kalibi', not:'Çömelme yapılan hareketin adıdır; çömelme kalıbı o hareketin altında yatan genel desendir.' } },

  { terim:'Hamle', ingilizce:'Lunge', kategori:'hareket-teknik',
    tanim:'Bir adım öne ya da geriye atılıp arka dizin yere yaklaştırıldığı, tek bacağın öne çıktığı alt vücut hareketidir. İki taraf sırayla yüklendiği için denge de sınanır. Hareketin anlatımı kütüphanedeki Hamle kartındadır.',
    ornek:'Bacak gününe her tarafta on hamle ekle.',
    hareket:'hamle', kas:'gluteus-medius' },

  { terim:'Köprü', ingilizce:'Glute bridge', kategori:'hareket-teknik',
    tanim:'Sırt üstü yatarken kalçanın yerden yukarı itildiği hareketin adıdır. Kalça büyük kası ve arka uyluk çalışır, bel yerine kalçadan güç üretmek öğrenilir. Anlatımı kütüphanedeki Köprü kartındadır.',
    ornek:'Isınmaya on beş tekrar köprü koy, kalçayı tepede bir saniye sık.',
    hareket:'kopru', kas:'gluteus-maximus' },

  { terim:'Plank', ingilizce:'Plank', kategori:'hareket-teknik',
    tanim:'Dirsek ya da el üstünde, gövde düz bir çizgi hâlinde tutularak beklenen duruştur. Kas boyu değişmeden gövde merkezi sürekli gerilim altında kalır. Duruşun ayrıntısı kütüphanedeki Plank kartındadır.',
    ornek:'Plankta bel çukurlaşmaya başladığı anda seti bitir.',
    hareket:'plank', kas:'karin-duz',
    karistirilanlar:{ slug:'izometrik-kasilma', not:'Plank tek bir hareketin adıdır; izometrik kasılma o hareketin ait olduğu kasılma biçimidir.' } },

  { terim:'Kürek çekme', ingilizce:'Row', kategori:'hareket-teknik',
    tanim:'Yükün gövdeye doğru çekildiği sırt hareketinin genel adıdır. Geniş sırt kası ve kürek kemiği çevresindeki kaslar birlikte çalışır. Dambılla yapılan biçimi kütüphanedeki Dambıl Kürek Çekme kartındadır.',
    ornek:'Kürek çekerken dirseği gövdeye yakın tut, omzu öne düşürme.',
    hareket:'dambil-kurek', kas:'latissimus',
    karistirilanlar:{ slug:'ergometre', not:'Kürek çekme bir sırt hareketidir; ergometredeki kürek ise dayanıklılık çalışmasıdır.' } },

  { terim:'Omuz press', ingilizce:'Shoulder press', kategori:'hareket-teknik',
    tanim:'Yükün omuz hizasından baş üstüne doğru itildiği hareketin adıdır. Deltoid ve triceps birlikte çalışır, gövde merkezi omurgayı sabit tutar. Kütüphanedeki Dambıl Omuz Press kartı hareketi gösterir.',
    ornek:'Omuz press sırasında kaburgaları öne çıkarma, karnını sık.',
    hareket:'dambil-omuz-press', kas:'deltoid-on' },

  { terim:'Biceps curl', ingilizce:'Biceps curl', kategori:'hareket-teknik',
    tanim:'Dirseğin bükülerek yükün omuza doğru getirildiği izolasyon hareketidir. Yükü kolun ön yüzündeki biceps taşır. Dambılla yapılan biçimi kütüphanedeki Dambıl Biceps Curl kartındadır.',
    ornek:'Biceps curl\'de gövdeyi sallamadan yalnız dirseği çalıştır.',
    hareket:'dambil-biceps', kas:'biceps' },

  { terim:'Yana açma', ingilizce:'Lateral raise', kategori:'hareket-teknik',
    tanim:'Kolların gövdenin yanından yukarı doğru açıldığı izolasyon hareketidir. Yükü büyük ölçüde yan deltoid taşır. Bantla yapılan biçimi kütüphanedeki Bant Yana Açma kartındadır.',
    ornek:'Omuz gününün sonuna iki set yana açma ekle.',
    hareket:'bant-yana-acma', kas:'deltoid-yan' },

  { terim:'Dead bug', ingilizce:'Dead bug', kategori:'hareket-teknik',
    tanim:'Sırt üstü yatarken karşı kol ile karşı bacağın kontrollü biçimde uzatıldığı gövde merkezi hareketidir. Bel yere yapışık kaldığı sürece karın kasları sabitleme görevini sürdürür. Anlatımı kütüphanedeki Dead Bug kartındadır.',
    ornek:'Dead bug yaparken bel yerden kalkıyorsa hareketin genliğini azalt.',
    hareket:'dead-bug', kas:'karin-duz' },

  { terim:'Kettlebell swing', ingilizce:'Kettlebell swing', kategori:'hareket-teknik',
    tanim:'Kettlebell\'in kalça menteşesiyle iki bacak arasından öne savrulduğu hareketin adıdır. Gücü kollar değil kalça üretir. Adım adım anlatım kütüphanedeki Kettlebell Swing kartındadır.',
    ornek:'Kettlebell swing\'de kolu çekiştirme, gücü kalçadan al.',
    hareket:'kettlebell-swing', kas:'gluteus-maximus' },

  /* --- KÜTÜPHANEDE KARŞILIĞI OLMAYAN HAREKETLER ------------------------
     Bunlar sözlüğün kendi metinlerinde geçtiği (ya da alanın temel kalemi
     olduğu) için tanımlı; egzersiz kütüphanesinde kartları YOK, bu yüzden
     "hareket" alanı bilerek boş — uydurma slug yazılmadı. */

  { terim:'Ölü kaldırış', ingilizce:'Deadlift', kategori:'hareket-teknik',
    tanim:'Yerde duran yükün kalça ve diz açılarak ayakta doğrulur biçimde kaldırılmasıdır. Arka zincirin tamamını, özellikle kalçayı ve omurga dikleştiricilerini yükler. Yük ağırlaştıkça omurganın nötr kalması ve barın gövdeye yakın seyretmesi tekniğin iki ölçütüdür.',
    ornek:'Ölü kaldırışta bar bacaktan uzaklaşıyorsa yükü düşür ve mesafeyi kapat.',
    hareket:'dambil-romanya', kas:'erector-spinae',
    karistirilanlar:{ slug:'kalca-mentesesi', not:'Kalça menteşesi hareketin desenidir; ölü kaldırış o desenle yapılan kaldırışın adıdır.' } },

  { terim:'Barfiks', ingilizce:'Pull-up', kategori:'hareket-teknik',
    tanim:'Bir bara asılıp gövdenin kol gücüyle yukarı çekildiği vücut ağırlığı hareketidir. Geniş sırt kası ve kol bükücüleri birlikte çalışır; tutuş genişliği ile avuç yönü yükün dağılımını değiştirir. Henüz yapılamıyorsa bantla destek ya da negatif tekrarla ilerlenir.',
    ornek:'Tam barfiks çıkamıyorsan bara asılıp beş saniyede inerek başla.',
    hareket:'barfiks', kas:'latissimus',
    karistirilanlar:{ slug:'barfiks-bari', not:'Barfiks hareketin adıdır; barfiks barı o hareketin yapıldığı ekipmandır.' } },

  { terim:'Bench press', ingilizce:'Bench press', kategori:'hareket-teknik',
    tanim:'Sehpada sırt üstü yatarken yükün göğüs hizasından yukarı itilmesidir. Göğüs, ön deltoid ve triceps birlikte çalışır. Ağır setlerde barın göğse düşme ihtimali olduğu için spotçuyla çalışılması önerilir.',
    ornek:'Ağır bench press setine tek başına girme, spotçu iste.',
    kas:'gogus' },

  { terim:'Burpee', ingilizce:'Burpee', kategori:'hareket-teknik',
    tanim:'Ayakta başlayıp yere şınav pozisyonuna inilen, sonra ayağa kalkılıp sıçranarak tamamlanan tam vücut hareketidir. Tek tekrarda itiş, çömelme ve sıçrama birleştiği için nabzı hızla yükseltir. CrossFit ve kondisyon devrelerinin en çok kullanılan kalemlerinden biridir.',
    ornek:'On dakikalık AMRAP\'a on burpee koy, nabzın nereye çıktığını gör.',
    hareket:'burpee',
    karistirilanlar:{ slug:'metcon', not:'Burpee tek bir harekettir; metcon o hareketin içine yerleştiği kondisyon çalışmasının adıdır.' } },

  { terim:'Mekik', ingilizce:'Sit-up', kategori:'hareket-teknik',
    tanim:'Sırt üstü yatarken gövdenin karın kaslarıyla dizlere doğru kaldırılmasıdır. Düz karın kası ve kalça bükücüleri birlikte çalışır. Bel şikâyeti olanlarda kalça bükücülerinin baskın çalışması sorun yaratabildiği için çoğu programda yerini sabit gövde duruşları almıştır.',
    ornek:'Mekik yaparken boynu elle çekiştirme, hareketi karından başlat.',
    kas:'karin-duz' }
  ]);

  /* ===== 2 · EKİPMAN ===== */
  ekle([
  { terim:'Halter', ingilizce:'Barbell', kategori:'ekipman',
    tanim:'İki ucuna disk takılan uzun çubuğa halter denir. Yükün iki elle ve simetrik taşınmasını sağladığı için kuvvet antrenmanının temel aracı sayılır. Ağırlık kademeli olarak artırılabildiğinden ilerlemenin en kolay takip edildiği ekipmandır.',
    ornek:'Halterle çalışırken diskleri mandalla sabitlemeyi unutma.' },

  { terim:'Olimpik bar', ingilizce:'Olympic barbell', kategori:'ekipman',
    tanim:'Uçları dönebilen, standart uzunluk ve ağırlıkta üretilen halter tipidir. Erkek barı 20 kg, kadın barı 15 kg gelir ve uçlardaki dönme, koparma gibi hızlı kaldırışlarda bileği korur. Salonlardaki ağırlık hesapları çoğunlukla barın kendi ağırlığı dahil edilerek yapılır.',
    ornek:'Barın kendi ağırlığını da say: iki yirmilik diskle toplam altmış kilo eder.' },

  { terim:'Ağırlık plakası', ingilizce:'Weight plate', kategori:'ekipman',
    tanim:'Halterin ya da makinenin ucuna takılan yuvarlak ağırlıklara plaka veya disk denir. Kauçuk kaplı bumper plakalar yere bırakılabilecek şekilde üretilir, dökme demir plakalar ise daha incedir. Renk kodları uluslararası standartta ağırlığı belirtir.',
    ornek:'Her tarafa birer beşlik plaka ekleyip on kilo artır.' },

  { terim:'Dambıl', ingilizce:'Dumbbell', kategori:'ekipman',
    tanim:'Tek elle tutulan kısa ağırlıklara dambıl denir. İki tarafın bağımsız çalışması sayesinde kuvvet farklarını ortaya çıkarır ve hareket yolunu halterden daha serbest bırakır. Ev antrenmanlarında en çok kullanılan ekipmandır.',
    ornek:'Bir çift orta ağırlıkta dambıl, ev programının büyük bölümünü karşılar.',
    hareket:'dambil-kurek' },

  { terim:'Kettlebell', ingilizce:'Kettlebell', kategori:'ekipman',
    tanim:'Gövdesi küre, sapı kulp biçiminde olan ağırlıktır. Ağırlık merkezi elin dışında kaldığı için salınım ve savurma hareketlerinde kalçayı güçlü biçimde çalıştırır. Tek bir kettlebell ile hem kuvvet hem kondisyon çalışması kurulabilir.',
    ornek:'Kettlebell swing\'de yükü kollarınla değil kalçanla fırlat.',
    hareket:'kettlebell-swing', kas:'gluteus-maximus' },

  { terim:'Askı bandı', ingilizce:'Suspension trainer (TRX)', kategori:'ekipman',
    tanim:'Sabit bir noktaya asılan iki kayıştan oluşan, vücut ağırlığıyla çalışılan ekipmandır. Zorluk yalnız ayakların pozisyonu değiştirilerek ayarlanır, bu yüzden aynı hareket her seviyeye uyarlanabilir. Katlanıp taşınabildiği için seyahatte tercih edilir.',
    ornek:'Askı bandında ayaklarını öne aldıkça çekiş hareketi zorlaşır.' },

  { terim:'Jimnastik halkası', ingilizce:'Gymnastic rings', kategori:'ekipman',
    tanim:'İki askıya bağlı, serbest dönebilen halkalardır. Sabit bir bar yerine hareketli bir tutamak sunduğu için omuz çevresindeki dengeleyici kasları yoğun biçimde çalıştırır. Kontrol gerektirdiğinden ileri seviye vücut ağırlığı çalışmalarında kullanılır.',
    ornek:'Halkada şınav, aynı hareketi yerde yapmaktan belirgin biçimde zordur.',
    kas:'rotator-manset' },

  { terim:'Plyo kutu', ingilizce:'Plyo box', kategori:'ekipman',
    tanim:'Üzerine sıçramak ya da adım almak için kullanılan sağlam kutudur. Yüksekliği değiştirilerek aynı hareketin zorluğu ayarlanır. Sıçrama çalışmalarının yanında step-up ve destekli şınav gibi hareketlerde de kullanılır.',
    ornek:'Kutu yüksekliğini, inişte dizini rahat kontrol edebileceğin seviyede tut.' },

  { terim:'Direnç bandı', ingilizce:'Resistance band', kategori:'ekipman',
    tanim:'Gerildikçe direnci artan elastik banttır. Yük hareketin sonuna doğru büyüdüğü için serbest ağırlıktan farklı bir gerilim eğrisi verir. Hafif ve taşınabilir olduğundan ısınmada ve ev antrenmanında yaygın kullanılır.',
    ornek:'Isınmada bantla yana açma yaparak omuz çevresini hazırla.',
    hareket:'bant-yana-acma', kas:'deltoid-yan' },

  { terim:'Smith makinesi', ingilizce:'Smith machine', kategori:'ekipman',
    tanim:'Barın sabit raylar üzerinde yalnız dikey eksende hareket ettiği makinedir. Hareket yolu kılavuzlandığı için denge ihtiyacı azalır, buna karşılık gövdenin dengeleme görevi de ortadan kalkar. Tek başına çalışanlar için güvenlik açısından tercih edilir.',
    ornek:'Spotçun yoksa son setleri Smith makinesinde yap.' },

  { terim:'Foam roller', ingilizce:'Foam roller', kategori:'ekipman',
    tanim:'Üzerine ağırlık verilerek yuvarlanan silindir biçimli köpük ekipmandır. Kas ve bağ dokusuna basınç uygulayarak antrenman öncesi hareket açıklığını geçici olarak artırmak amacıyla kullanılır. Germe ya da tedavi yerine geçmez.',
    ornek:'Antrenman öncesi uyluk ön yüzünü foam roller ile bir dakika çalış.',
    kas:'quadriceps' },

  { terim:'Ağırlık kemeri', ingilizce:'Lifting belt', kategori:'ekipman',
    tanim:'Bel çevresine takılan, karın içi basıncı artırmaya yardımcı olan kalın kemerdir. Basınca karşı itilecek bir yüzey sağladığı için ağır kaldırışlarda gövde sağlamlığını destekler. Zayıf gövdeyi güçlendirmez, yalnız var olan tekniği destekler.',
    ornek:'Kemeri sadece en ağır setlerde tak, ısınma setlerinde gerek yok.',
    kas:'karin-yan' },

  { terim:'Magnezyum', ingilizce:'Chalk', kategori:'ekipman',
    tanim:'Avuç içindeki teri emerek kavrama gücünü artıran toz ya da sıvı maddedir. Barfiks, ölü kaldırış ve tırmanma gibi kavramanın sınır olduğu hareketlerde kullanılır. Birçok salon toz yerine sıvı biçimini tercih eder.',
    ornek:'Ellerin kayıyorsa bara geçmeden önce biraz magnezyum sür.',
    kas:'on-kol-fleksor' },

  { terim:'Kızak', ingilizce:'Sled', kategori:'ekipman',
    tanim:'Üzerine ağırlık konup itilen ya da çekilen kızak biçimli ekipmandır. Hareketin eksantrik evresi neredeyse yok denecek kadar az olduğu için kas ağrısı bırakmadan yüksek yüklenme sağlar. Kondisyon ve toparlanma çalışmalarında birlikte kullanılır.',
    ornek:'Antrenman sonuna iki tur kızak itişi ekleyerek bacakları yorabilirsin.',
    kas:'quadriceps' },

  { terim:'Kablo makinesi', ingilizce:'Cable machine', kategori:'ekipman',
    tanim:'Makara üzerinden geçen bir kabloyla ağırlık yığınına bağlanan istasyondur. Gerilim hareketin her noktasında sabit kaldığı için serbest ağırlığın zayıf kaldığı açılarda avantaj sağlar. Tutamak değiştirilerek çok sayıda hareket kurulabilir.',
    ornek:'Kablo makinesinde yüksek makaradan çekiş yaparak sırtı farklı bir açıdan çalıştır.',
    kas:'latissimus' },

  { terim:'Barfiks barı', ingilizce:'Pull-up bar', kategori:'ekipman',
    tanim:'Vücut ağırlığıyla asılıp çekiş yapmak için kullanılan sabit çubuktur. Kapı arasına takılan ev modelleri ile duvara ya da kafese sabitlenen salon modelleri vardır. Sırt ve kol çalışmasının yanında omuz sağlığı için askıda kalma çalışmalarında da kullanılır.',
    ornek:'Barfiks henüz gelmiyorsa bantla destek alarak başlayabilirsin.',
    kas:'latissimus' },

  { terim:'Sehpa', ingilizce:'Bench', kategori:'ekipman',
    tanim:'Üzerine uzanarak ya da oturarak çalışılan ayarlı bankaya sehpa denir. Sırt açısı değiştirildiğinde aynı hareketin hedeflediği bölge de değişir. Göğüs, omuz ve kol çalışmalarının çoğu sehpa üzerinde kurulur.',
    ornek:'Sehpayı otuz dereceye ayarlayıp dambıl press yap.',
    hareket:'dambil-omuz-press', kas:'gogus' },

  { terim:'Atlama ipi', ingilizce:'Jump rope', kategori:'ekipman',
    tanim:'Zıplayarak çevrilen, kısa sürede yüksek nabız veren basit bir kondisyon aracıdır. Ayak bileği ve baldır kaslarını sürekli çalıştırır, ritim ve koordinasyon gerektirir. Boks ve dövüş sporlarında ısınmanın standart parçasıdır.',
    ornek:'Isınmaya üç dakikalık atlama ipiyle başla.',
    kas:'gastrocnemius' },

  { terim:'Sağlık topu', ingilizce:'Medicine ball', kategori:'ekipman',
    tanim:'Ağırlıklandırılmış, fırlatılabilen toptur. Duvara ya da yere atma hareketlerinde gücün hızlı biçimde aktarılmasını çalıştırır. Ağırlığı kavranabilir olduğu için gövde dönüş hareketlerinde de kullanılır.',
    ornek:'Duvara sağlık topu atışıyla gövde dönüşünü hızlı çalıştırabilirsin.',
    kas:'karin-yan' },

  { terim:'Ergometre', ingilizce:'Ergometer', kategori:'ekipman',
    tanim:'Yapılan işi ölçen kondisyon makinelerinin genel adıdır. Kürek, bisiklet ve ski ergometreleri mesafeyi, gücü ve tempoyu sayısal olarak gösterir. Ölçüm verdiği için antrenmanın tekrarlanabilir biçimde planlanmasına imkân tanır.',
    ornek:'Kürek ergometresinde beş yüz metreyi kaç dakikada bitirdiğini not al.' },

  { terim:'Bilek sargısı', ingilizce:'Wrist wrap', kategori:'ekipman',
    tanim:'Bileği saran ve itiş hareketlerinde eklemin geriye bükülmesini sınırlayan elastik banttır. Ağır bench press ve omuz üstü itişlerde bileği desteklemek için kullanılır. Kavrama gücünü artıran bilek kayışıyla karıştırılmamalıdır.',
    ornek:'Ağır omuz press setlerinde bilek sargısı takmak eklemi rahatlatır.',
    kas:'on-kol-ekstansor' }
  ]);

  /* ===== 3 · KAS GRUPLARI VE ANATOMİ ===== */
  ekle([
  { terim:'Gövde merkezi', ingilizce:'Core', kategori:'anatomi',
    tanim:'Karın, bel ve kalça çevresindeki kasların oluşturduğu bütüne gövde merkezi denir. Görevi kolu ve bacağı hareket ettirmek değil, hareket sırasında omurgayı istenen konumda tutmaktır. Bu yüzden en iyi, hareketi engelleyen çalışmalarla değil, hareketi durduran çalışmalarla geliştirilir.',
    ornek:'Gövde merkezini plank ve dead bug gibi duruş koruyan hareketlerle çalış.',
    hareket:'plank', kas:'karin-duz',
    karistirilanlar:{ slug:'duz-karin-kasi', not:'Düz karın kası tek bir kastır; gövde merkezi ise bel, karın ve kalçayı birlikte anlatır.' } },

  { terim:'Düz karın kası', ingilizce:'Rectus abdominis', kategori:'anatomi',
    tanim:'Göğüs kafesinin altından leğen kemiğine uzanan, karnın ön yüzeyindeki uzun kastır. Gövdeyi öne büker ve kaburgayı leğene yaklaştırır. Görünürdeki bölmeli yapısı bağ dokusundan gelir, ayrı çalıştırılabilir parçalar değildir.',
    ornek:'Dead bug sırasında belini yere yapıştırarak düz karın kasını devrede tut.',
    hareket:'dead-bug', kas:'karin-duz' },

  { terim:'Yan karın kasları', ingilizce:'Obliques', kategori:'anatomi',
    tanim:'Karnın yan yüzeyinde çapraz uzanan iç ve dış eğik kaslardır. Gövdenin dönmesini ve yana eğilmesini sağlar, aynı zamanda istenmeyen dönüşü frenler. Odun kesme benzeri dönüş hareketlerinde ve tek taraflı yük taşımada baskın çalışırlar.',
    ornek:'Tek elde ağırlık taşıyarak yürümek yan karın kaslarını dönüşe karşı çalıştırır.',
    kas:'karin-yan' },

  { terim:'Omurga dikleştirici kaslar', ingilizce:'Erector spinae', kategori:'anatomi',
    tanim:'Omurganın iki yanında boyundan leğene uzanan kas şerididir. Gövdeyi dik tutar, öne eğilirken omurganın çökmesini engeller. Ölü kaldırış ve kalça menteşesi hareketlerinde yoğun biçimde çalışır.',
    ornek:'Ölü kaldırışta sırtın yuvarlanıyorsa omurga dikleştiriciler yükü taşıyamıyor demektir.',
    kas:'erector-spinae' },

  { terim:'Geniş sırt kası', ingilizce:'Latissimus dorsi', kategori:'anatomi',
    tanim:'Sırtın alt bölümünden koltuk altına uzanan geniş yelpaze biçimli kastır. Kolu gövdeye doğru ve aşağı çeker, bu yüzden barfiks ve kürek çekme hareketlerinde ana kastır. Sırtın genişlik izlenimini veren yapı büyük ölçüde bu kastan gelir.',
    ornek:'Kürek çekerken dirseği gövdene yakın tutarsan geniş sırt kası daha çok çalışır.',
    hareket:'dambil-kurek', kas:'latissimus' },

  { terim:'Romboid kaslar', ingilizce:'Rhomboids', kategori:'anatomi',
    tanim:'Kürek kemiğini omurgaya bağlayan, iki kürek arasında yer alan kaslardır. Kürek kemiklerini birbirine yaklaştırır ve omuz kuşağını geride tutar. Masa başında uzun süre kalanlarda zayıf kaldığı için postür çalışmalarında hedeflenir.',
    ornek:'Bantla çekiş yaparken kürek kemiklerini birbirine yaklaştırıp romboidleri devreye sok.',
    hareket:'bant-cekme', kas:'romboid' },

  { terim:'Trapez kası', ingilizce:'Trapezius', kategori:'anatomi',
    tanim:'Ense ile orta sırt arasında uzanan üçgen biçimli büyük kastır. Üst, orta ve alt olmak üzere üç bölümü vardır ve her bölüm kürek kemiğini farklı yöne hareket ettirir. Yalnız üst bölümün çalıştırılması omuz kuşağında dengesizlik yaratabilir.',
    ornek:'Omuz silkme yalnız üst trapezi çalıştırır; orta ve alt bölüm için çekiş hareketleri gerekir.',
    kas:'trapez-ust' },

  { terim:'Rotator manşet', ingilizce:'Rotator cuff', kategori:'anatomi',
    tanim:'Omuz eklemini saran dört küçük kastan oluşan gruptur. Kol kemiği başını yuvasında merkezde tutar ve omzun döndürülmesini sağlar. Büyük kaslar kadar güç üretmez ama omuz sağlığının büyük bölümü bu gruba bağlıdır.',
    ornek:'Ağır itiş gününden önce bantla dış rotasyon yapıp rotator manşeti ısıt.',
    hareket:'bant-yana-acma', kas:'rotator-manset' },

  { terim:'Deltoid', ingilizce:'Deltoid', kategori:'anatomi',
    tanim:'Omzu dıştan saran, üç bölümlü üçgen kastır. Ön bölüm kolu öne, yan bölüm yana, arka bölüm ise geriye götürür. Omzun yuvarlak görünümünü veren ve omuz üstü itişte ana rolü üstlenen kastır.',
    ornek:'Dambıl omuz press ön ve yan deltoidi birlikte çalıştırır.',
    hareket:'dambil-omuz-press', kas:'deltoid-yan' },

  { terim:'Göğüs kası', ingilizce:'Pectoralis major', kategori:'anatomi',
    tanim:'Göğüs kafesinin ön yüzünü kaplayan geniş yelpaze biçimli kastır. Kolu gövdenin önüne ve içe doğru getirir, bu yüzden bütün itiş hareketlerinde ana kastır. Üst ve alt lifleri farklı açılarda daha çok çalışır.',
    ornek:'Şınav sırasında omuz başını geride tutarsan yük göğüs kasında kalır.',
    hareket:'sinav', kas:'gogus' },

  { terim:'Ön testere kası', ingilizce:'Serratus anterior', kategori:'anatomi',
    tanim:'Kaburgaların yan yüzünden kürek kemiğinin iç kenarına uzanan, dişli görünümlü kastır. Kürek kemiğini göğüs kafesine yapıştırır ve kolu baş üstüne kaldırırken küreğin dönmesini sağlar. Zayıf kaldığında kürek kemiği sırttan kanat gibi ayrılır.',
    ornek:'Şınavın tepesinde birkaç santim daha itmek ön testere kasını çalıştırır.',
    hareket:'sinav', kas:'serratus' },

  { terim:'Biceps', ingilizce:'Biceps brachii', kategori:'anatomi',
    tanim:'Kolun ön yüzündeki iki başlı kastır. Dirseği büker ve ön kolu dışa döndürür; omuz eklemini de bir miktar etkiler. Çekiş hareketlerinde sırtla birlikte çalıştığı için ayrıca çalıştırılmasa da yük alır.',
    ornek:'Biceps curl sırasında dirseği gövdenin yanında sabit tut.',
    hareket:'dambil-biceps', kas:'biceps' },

  { terim:'Triceps', ingilizce:'Triceps brachii', kategori:'anatomi',
    tanim:'Kolun arka yüzündeki üç başlı kastır. Dirseği açar ve uzun başı omuz hareketine de katılır. Kolun hacminin büyük bölümünü oluşturduğu için itiş hareketlerinde birlikte gelişir.',
    ornek:'Dar tutuşlu şınav triceps üzerindeki yükü artırır.',
    hareket:'sinav', kas:'triceps' },

  { terim:'Ön kol kasları', ingilizce:'Forearm muscles', kategori:'anatomi',
    tanim:'Dirsek ile bilek arasında yer alan, parmakları ve bileği hareket ettiren kas grubudur. Bükücü bölüm avucu kapatır, açıcı bölüm bileği yukarı kaldırır. Kavrama gücü doğrudan bu grubun dayanıklılığıyla ilgilidir.',
    ornek:'Ağır kürek setlerinde önce ön kol kasların yorulursa kavrama çalışması ekle.',
    kas:'on-kol-fleksor' },

  { terim:'Boyun kasları', ingilizce:'Neck muscles', kategori:'anatomi',
    tanim:'Başı taşıyan ve döndüren, ense ile boyun ön yüzündeki kas grubudur. Ekran karşısında geçen uzun saatlerde sürekli gerilim altında kalırlar. Dövüş sporlarında ise doğrudan güvenlikle ilgili oldukları için ayrıca çalıştırılırlar.',
    ornek:'Güreş çalışan sporcularda boyun kasları haftada iki kez ayrı çalıştırılır.',
    kas:'boyun' },

  { terim:'Kalça büyük kası', ingilizce:'Gluteus maximus', kategori:'anatomi',
    tanim:'Vücudun en büyük kasıdır ve kalçayı geriye doğru açar. Çömelmeden kalkarken, merdiven çıkarken ve sprint sırasında ana itici güçtür. Uzun süre oturmak bu kasın devreye girme alışkanlığını zayıflatabilir.',
    ornek:'Köprü hareketinde tepede kalçayı sıkarak kalça büyük kasını hisset.',
    hareket:'kopru', kas:'gluteus-maximus' },

  { terim:'Kalça orta kası', ingilizce:'Gluteus medius', kategori:'anatomi',
    tanim:'Kalçanın yan tarafında yer alan, bacağı yana açan kastır. Tek ayak üzerindeyken leğenin bir tarafa düşmesini engeller. Zayıf kaldığında koşuda ve hamlede diz içeri doğru kayabilir.',
    ornek:'Hamlede dizin içeri düşüyorsa kalça orta kasını ayrıca çalıştırman gerekir.',
    hareket:'hamle', kas:'gluteus-medius' },

  { terim:'Kalça bükücüleri', ingilizce:'Hip flexors', kategori:'anatomi',
    tanim:'Uyluğu gövdeye doğru yaklaştıran, leğen ve bel omurlarından uyluk kemiğine uzanan kas grubudur. Yürüyüşte ve koşuda dizin öne getirilmesini sağlar. Uzun süre oturmak bu grubu kısalttığı için hareketlilik çalışmalarında sık hedeflenir.',
    ornek:'Gün boyu masada oturduysan antrenman öncesi kalça bükücülerini aç.',
    kas:'kalca-fleksor' },

  { terim:'Uyluk ön kası', ingilizce:'Quadriceps', kategori:'anatomi',
    tanim:'Uyluğun ön yüzündeki dört başlı kas grubudur. Dizi açar, bir başı ise kalçanın bükülmesine de katılır. Çömelme, hamle ve merdiven çıkma gibi hareketlerin ana kasıdır.',
    ornek:'Goblet squat\'ta dizi ayak ucu hizasında ileri götürmek uyluk ön kasını daha çok çalıştırır.',
    hareket:'goblet-squat', kas:'quadriceps' },

  { terim:'Arka uyluk kası', ingilizce:'Hamstrings', kategori:'anatomi',
    tanim:'Uyluğun arka yüzünde yer alan üç kastan oluşan gruptur. Dizi büker ve kalçayı geriye açar. Sprint sırasında bacağı frenleme görevi üstlendiği için koşucularda sık zorlanan bölgedir.',
    ornek:'Köprü hareketinde topuklara basınca arka uyluk kasları da devreye girer.',
    hareket:'kopru', kas:'hamstring' },

  { terim:'İç bacak kasları', ingilizce:'Adductors', kategori:'anatomi',
    tanim:'Uyluğun iç yüzünde yer alan ve bacağı gövdenin orta hattına doğru çeken kas grubudur. Yön değiştirme ve yana adım hareketlerinde denge sağlar. Futbol ve dövüş sporlarında sık zorlanan bölgelerdendir.',
    ornek:'Geniş duruşlu çömelme iç bacak kaslarını da yükler.',
    kas:'adduktor' },

  { terim:'Baldır ikiz kası', ingilizce:'Gastrocnemius', kategori:'anatomi',
    tanim:'Baldırın yüzeyinde yer alan, iki başlı ve diz ekleminin üzerinden geçen kastır. Ayak bileğini aşağı bastırır ve sıçramada güç üretir. Diz düz haldeyken daha baskın çalışır.',
    ornek:'Ayakta yapılan baldır kaldırış baldır ikiz kasını hedefler.',
    kas:'gastrocnemius' },

  { terim:'Soleus', ingilizce:'Soleus', kategori:'anatomi',
    tanim:'Baldır ikiz kasının altında yer alan, dizin üzerinden geçmeyen derin baldır kasıdır. Ayakta durma ve yürüme sırasında sürekli çalışır, bu yüzden dayanıklılık lifleri baskındır. Diz bükülü çalışıldığında daha çok yük alır.',
    ornek:'Oturarak yapılan baldır kaldırış soleusu öne çıkarır.',
    kas:'soleus' },

  { terim:'Ön bacak kası', ingilizce:'Tibialis anterior', kategori:'anatomi',
    tanim:'Kaval kemiğinin dış yanında uzanan, ayak ucunu yukarı kaldıran kastır. Yürürken ayağın yere sürtmesini engeller ve iniş sırasında ayağı kontrol eder. Koşu hacmi hızlı artırıldığında bu bölgede zorlanma görülebilir.',
    ornek:'Koşu sonrası kaval önünde yanma varsa ön bacak kası aşırı yüklenmiş olabilir.',
    kas:'tibialis-on' },

  { terim:'Arka zincir', ingilizce:'Posterior chain', kategori:'anatomi',
    tanim:'Vücudun arka yüzündeki kasların ortak adıdır: baldır, arka uyluk, kalça ve sırt kasları. Bu kaslar sıçrama, sprint ve kaldırma hareketlerinde birlikte çalışır. Oturarak geçen bir günün ardından en çok ihmal edilen zincir budur.',
    ornek:'Ölü kaldırış ve köprü, arka zinciri baştan sona yükleyen iki harekettir.',
    hareket:'kopru', kas:'hamstring' },

  { terim:'Karşıt kas', ingilizce:'Antagonist muscle', kategori:'anatomi',
    tanim:'Bir harekette çalışan kasın tersi yönde iş gören kasa karşıt kas denir. Biceps dirseği bükerken triceps karşıt kastır. Program yazarken karşıt çiftlerin dengeli yüklenmesi eklem sağlığı açısından önemlidir.',
    ornek:'Göğüs çalıştığın gün sırt için de en az aynı sayıda set ayır.',
    kas:'triceps' },

  { terim:'Sabitleyici kas', ingilizce:'Stabilizer muscle', kategori:'anatomi',
    tanim:'Hareketi kendisi üretmeyen ama eklemi ya da gövdeyi sabit tutan kaslara sabitleyici denir. Ayakta yapılan tek kol press sırasında karın ve kalça kasları bu görevi üstlenir. Serbest ağırlığın makineye üstünlüğü büyük ölçüde bu kasların devreye girmesinden gelir.',
    ornek:'Tek kol dambıl press yaparken gövdenin yana kaçmaması sabitleyici kasların işidir.',
    kas:'karin-yan' },

  { terim:'Kürek kemiği', ingilizce:'Scapula', kategori:'anatomi',
    tanim:'Sırtın üst kısmında, kaburga kafesinin üzerinde kayan üçgen kemiktir. Omuz ekleminin çukurunu taşıdığı için kolun her hareketinde birlikte döner ve kayar. Trapez, romboid ve ön testere kasları bu kemiğin konumunu yönetir.',
    ornek:'Barfikste önce kürek kemiklerini aşağı çek, sonra kolları büküp yukarı çık.',
    kas:'romboid' },

  { terim:'Omurga', ingilizce:'Vertebral column', kategori:'anatomi',
    tanim:'Boyundan kuyruk sokumuna kadar uzanan, omurlardan oluşan kemik sütundur. Boyun, sırt ve bel bölümleri farklı yönlerde eğrilik taşır ve bu eğrilikler yükü yayar. Antrenmanda amaç omurgayı hareketsiz kılmak değil, yük altında nötr aralıkta tutmaktır.',
    ornek:'Ağır kaldırışta omurgayı nötr tut, bel ne çukurlaşsın ne yuvarlaklaşsın.',
    kas:'erector-spinae',
    karistirilanlar:{ slug:'notr-omurga', not:'Omurga yapının kendisidir; nötr omurga o yapının yük altında korunan doğal duruşudur.' } },

  { terim:'Bağ dokusu', ingilizce:'Connective tissue', kategori:'anatomi',
    tanim:'Tendonları, bağları ve fasyayı kapsayan destek dokusunun genel adıdır. Kuvvet üretmez ama üretilen kuvveti aktarır ve eklemleri bir arada tutar. Kasa göre daha yavaş uyum sağladığı için yük artışının kademeli olması büyük ölçüde bu doku yüzünden önemlidir.',
    ornek:'Yükü hızlı artırdığında ilk zorlanan çoğunlukla kas değil bağ dokusudur.' }
  ]);

  /* ===== 4 · ANTRENMAN KÜLTÜRÜ VE METODOLOJİ ===== */
  ekle([
  { terim:'CrossFit', ingilizce:'CrossFit', kategori:'metodoloji',
    tanim:'Halter kaldırışlarını, jimnastik hareketlerini ve kondisyon çalışmalarını aynı seansta birleştiren antrenman yaklaşımıdır. Antrenmanlar süreye ya da tur sayısına göre ölçülür ve sonuç yazılarak takip edilir. Grup dinamiği ve ölçülebilir sonuç, yöntemin en belirgin iki özelliğidir.',
    ornek:'CrossFit salonunda günün antrenmanı tahtaya yazılır, herkes aynı işi yapar.' },

  { terim:'Günün antrenmanı', ingilizce:'Workout of the day (WOD)', kategori:'metodoloji',
    tanim:'CrossFit salonlarında o gün herkesin yaptığı ortak antrenmana verilen addır. Genellikle kısa bir hareket listesi ve bir bitirme koşulundan oluşur. Sonuçlar süre ya da tekrar sayısı olarak kaydedilir.',
    ornek:'Bugünkü günün antrenmanı yirmi dakikalık bir AMRAP.' },

  { terim:'AMRAP', ingilizce:'As many rounds as possible', kategori:'metodoloji',
    tanim:'Belirli bir süre içinde olabildiğince çok tur ya da tekrar yapmayı hedefleyen antrenman biçimidir. Süre sabittir, iş miktarı değişkendir. Tempoyu sporcunun kendisi ayarladığı için aynı antrenman farklı seviyelerde birlikte yapılabilir.',
    ornek:'On iki dakikalık AMRAP\'te toplam yedi tur çıkardım.' },

  { terim:'EMOM', ingilizce:'Every minute on the minute', kategori:'metodoloji',
    tanim:'Her dakikanın başında belirlenen işin yapıldığı, kalan sürenin dinlenme sayıldığı çalışma biçimidir. İş ne kadar hızlı bitirilirse dinlenme o kadar uzar. Tempoyu dışarıdan sabitlediği için teknik çalışmalarında da kullanılır.',
    ornek:'On dakikalık EMOM: her dakika beş tekrar, kalan süre dinlenme.' },

  { terim:'Metcon', ingilizce:'Metabolic conditioning', kategori:'metodoloji',
    tanim:'Nefes ve nabzı yüksek tutan, kısa dinlenmelerle yapılan yoğun kondisyon çalışmasının genel adıdır. Kuvvet ve kardiyo hareketleri iç içe kullanılır. Süresi genelde beş ile yirmi dakika arasındadır.',
    ornek:'Kuvvet bölümünden sonra sekiz dakikalık kısa bir metcon yaptık.' },

  { terim:'Box', ingilizce:'Box (CrossFit gym)', kategori:'metodoloji',
    tanim:'CrossFit salonlarına verilen addır. Aynalı klasik salonlardan farklı olarak açık alan, halter platformu ve asılma barları etrafında kurulur. Aynı saatte gelen grubun birlikte çalışması bu düzenin ayırt edici yanıdır.',
    ornek:'Yeni taşındığım mahallede bir box bulup deneme dersine gittim.' },

  { terim:'Chipper', ingilizce:'Chipper', kategori:'metodoloji',
    tanim:'Uzun bir hareket listesinin baştan sona, her hareket bitirilerek yapıldığı antrenman biçimidir. Tur yoktur; liste bir kez yontularak tamamlanır. Genellikle uzun sürer ve tempo yönetimi gerektirir.',
    ornek:'Chipper\'da ilk hareketi hızlı bitirirsen sona doğru ödeme yaparsın.' },

  { terim:'Hero WOD', ingilizce:'Hero WOD', kategori:'metodoloji',
    tanim:'Görev sırasında hayatını kaybeden asker, itfaiyeci ya da polis memurlarının anısına adlandırılmış, alışılmıştan uzun ve zorlu antrenmanlardır. Her birinin sabit bir hareket şeması ve adı vardır. Yılın belirli günlerinde topluca yapılırlar.',
    ornek:'Hero WOD\'lar uzun olduğu için hareketleri ölçeklendirmek olağandır.' },

  { terim:'HIIT', ingilizce:'High-intensity interval training', kategori:'metodoloji',
    tanim:'Kısa süreli yüksek şiddetli çalışma bölümlerinin dinlenme ya da düşük şiddetli bölümlerle sıralandığı antrenman biçimidir. Toplam süresi kısadır ama yorgunluk yükü yüksektir. Haftada iki üç seanstan fazlası çoğu kişide toparlanmayı zorlar.',
    ornek:'Yirmi saniye tam tempo, kırk saniye yürüyüş: sekiz tur HIIT eder.',
    karistirilanlar:{ slug:'devre-antrenmani', not:'HIIT şiddet üzerine kuruludur; devre antrenmanı ise hareketlerin sırayla dolaşılmasıdır ve şiddeti değişebilir.' } },

  { terim:'Tabata', ingilizce:'Tabata', kategori:'metodoloji',
    tanim:'Yirmi saniye çalışma ve on saniye dinlenmenin sekiz kez tekrarlandığı, dört dakika süren aralıklı çalışma protokolüdür. Adını protokolü inceleyen araştırmacıdan alır. Kısa olması onu kolay yapmaz; şiddet çok yüksek tutulduğunda anlamlıdır.',
    ornek:'Antrenmanın sonuna bisiklette dört dakikalık bir tabata koydum.' },

  { terim:'Devre antrenmanı', ingilizce:'Circuit training', kategori:'metodoloji',
    tanim:'Birkaç istasyonun sırayla, aralarında kısa dinlenmeyle dolaşıldığı çalışma düzenidir. Kuvvet ve kondisyon hedefleri aynı seansta birleştirilebilir. Kalabalık salonlarda ve grup derslerinde sık kullanılır.',
    ornek:'Altı istasyonluk devre antrenmanını üç tur dolaştık.' },

  { terim:'Fonksiyonel antrenman', ingilizce:'Functional training', kategori:'metodoloji',
    tanim:'Günlük hayatta ya da bir sporda kullanılan hareket desenlerini taklit eden çalışma yaklaşımıdır. Taşıma, itme, çekme, çömelme ve dönme gibi kalıplar tek tek kaslardan çok hareketin bütününü hedefler. Sınırı bulanık bir başlıktır; asıl ölçüt hareketin kişinin ihtiyacına karşılık gelmesidir.',
    ornek:'Market poşetini rahat taşımak istiyorsan tek elde ağırlık taşıma fonksiyonel bir çalışmadır.',
    hareket:'kettlebell-swing', kas:'karin-yan' },

  { terim:'Periyodizasyon', ingilizce:'Periodization', kategori:'metodoloji',
    tanim:'Antrenman değişkenlerinin haftalara ve aylara planlı biçimde dağıtılmasıdır. Hacim, yoğunluk ve hareket seçimi dönemlere göre değişir, böylece ilerleme sürerken toparlanma da korunur. Uzun süre aynı programı tekrarlamanın yerini bu yaklaşım almıştır.',
    ornek:'Periyodizasyon sayesinde her hafta biraz daha ağır kaldırmak zorunda kalmazsın.' },

  { terim:'Mikro döngü', ingilizce:'Microcycle', kategori:'metodoloji',
    tanim:'Antrenman planının en küçük tekrarlanan birimidir ve çoğunlukla bir haftaya karşılık gelir. İçinde ağır, orta ve hafif günler dengelenir. Birkaç mikro döngü birleşerek daha büyük bir dönem oluşturur.',
    ornek:'Bu mikro döngüde iki ağır, iki hafif gün var.' },

  { terim:'Makro döngü', ingilizce:'Macrocycle', kategori:'metodoloji',
    tanim:'Genellikle birkaç ay ile bir yıl arasında süren en geniş planlama birimidir. İçinde hazırlık, yüklenme ve yarışma dönemleri sıralanır. Hedef bir yarış ya da ölçüm tarihiyse plan geriye doğru bu birimden kurulur.',
    ornek:'Maraton için altı aylık bir makro döngü kurduk.' },

  { terim:'Deload', ingilizce:'Deload week', kategori:'metodoloji',
    tanim:'Yükün ve hacmin bilinçli olarak azaltıldığı hafif antrenman haftasıdır. Amaç antrenmanı bırakmak değil, biriken yorgunluğu boşaltıp bir sonraki döneme hazır girmektir. Genelde üç ile altı haftalık yüklenmelerin ardından planlanır.',
    ornek:'Dördüncü haftayı deload yap: aynı hareketler, yarı hacim.',
    karistirilanlar:{ slug:'ara-verme', not:'Deload planlı ve hafif bir haftadır; ara verme antrenmanın tamamen durmasıdır.' } },

  { terim:'Ara verme', ingilizce:'Training break', kategori:'metodoloji',
    tanim:'Antrenmana bir süre tamamen ara verilmesidir. Kısa aralar performansı belirgin biçimde düşürmez ve çoğu zaman biriken eklem yorgunluğunu azaltır. Uzun aralardan sonra yüke kademeli dönmek gerekir.',
    ornek:'Tatilden sonra ilk hafta yükü yüzde yirmi düşürerek geri dön.' },

  { terim:'Kişisel rekor', ingilizce:'Personal record (PR)', kategori:'metodoloji',
    tanim:'Bir harekette ya da testte kişinin kendi en iyi sonucudur. Ağırlık, tekrar sayısı ya da süre üzerinden ölçülebilir. Salon kültüründe ilerlemenin en görünür işareti kabul edilir.',
    ornek:'Bugün çömelmede beş kilo kişisel rekor kırdım.' },

  { terim:'Progresif aşırı yükleme', ingilizce:'Progressive overload', kategori:'metodoloji',
    tanim:'Vücudun uyum sağlaması için antrenman yükünün zaman içinde kademeli olarak artırılması ilkesidir. Artış yalnız ağırlıkla değil; tekrar, set, hareket açıklığı ya da tempo ile de sağlanabilir. Kuvvet ve kas gelişiminin arkasındaki temel kuraldır.',
    ornek:'Ağırlık artmıyorsa tekrar sayısını artırarak progresif aşırı yüklemeyi sürdür.' },

  { terim:'Bölünme', ingilizce:'Training split', kategori:'metodoloji',
    tanim:'Haftalık antrenmanın kas gruplarına ya da hareket desenlerine göre günlere dağıtılmasıdır. Gün sayısı ve toparlanma kapasitesi hangi bölünmenin uygun olduğunu belirler. Doğru bölünme, en iyi bölünme değil sürdürülebilen bölünmedir.',
    ornek:'Haftada üç gün çalışacaksan tüm vücut bölünmesi genelde daha verimlidir.' },

  { terim:'İtiş-çekiş-bacak bölünmesi', ingilizce:'Push/pull/legs split', kategori:'metodoloji',
    tanim:'Antrenmanın itiş, çekiş ve bacak günleri olarak üçe ayrıldığı bölünme biçimidir. Aynı hareket deseni bir arada çalıştığı için kaslar üst üste yüklenmez. Haftada beş ya da altı gün çalışabilenler için uygundur.',
    ornek:'İtiş-çekiş-bacak bölünmesinde her deseni haftada iki kez çalışırsın.' },

  { terim:'Üst-alt bölünmesi', ingilizce:'Upper/lower split', kategori:'metodoloji',
    tanim:'Antrenmanın üst vücut ve alt vücut günleri olarak ikiye ayrılmasıdır. Haftada dört gün çalışanlar için sık tercih edilir çünkü her bölge haftada iki kez yüklenir. Tüm vücut ile bölgesel bölünmeler arasında bir orta yol sunar.',
    ornek:'Dört günlük planda üst-alt bölünmesi kurmak toparlanmayı kolaylaştırır.' },

  { terim:'Tüm vücut antrenmanı', ingilizce:'Full body workout', kategori:'metodoloji',
    tanim:'Her seansta bütün büyük kas gruplarının çalıştırıldığı antrenman düzenidir. Haftada iki ya da üç gün çalışabilenlerde her bölgeyi düzenli olarak uyarır. Yeni başlayanlar için en sık önerilen düzendir.',
    ornek:'Haftada iki gün vaktin varsa tüm vücut antrenmanı en verimli seçenek.' },

  { terim:'Hacim', ingilizce:'Training volume', kategori:'metodoloji',
    tanim:'Bir antrenmanda ya da haftada yapılan toplam iş miktarıdır. Genellikle set sayısıyla, bazen set × tekrar × ağırlık çarpımıyla ölçülür. Kas gelişimini en çok belirleyen değişkenlerden biridir.',
    ornek:'Sırt hacmini haftada on setten on dörde çıkardım.',
    karistirilanlar:{ slug:'yogunluk', not:'Hacim yapılan toplam işi, yoğunluk ise o işin ne kadar ağır olduğunu anlatır.' } },

  { terim:'Yoğunluk', ingilizce:'Training intensity', kategori:'metodoloji',
    tanim:'Kullanılan yükün tek tekrar maksimumuna oranına yoğunluk denir. Kondisyon çalışmalarında ise nabzın ya da tempo yüzdesinin karşılığıdır. Hacimle birlikte artırıldığında toparlanma hızla zorlaşır.',
    ornek:'Bu blokta hacmi sabit tutup yoğunluğu kademeli artıracağız.' },

  { terim:'Sıklık', ingilizce:'Training frequency', kategori:'metodoloji',
    tanim:'Bir kas grubunun ya da hareket deseninin haftada kaç kez çalışıldığını anlatır. Aynı haftalık hacim daha sık dağıtıldığında her seans daha taze yapılabilir. Program tasarımında hacim ve yoğunlukla birlikte ayarlanır.',
    ornek:'Göğüs sıklığını haftada bire değil ikiye çıkarınca ilerleme hızlandı.' },

  { terim:'Spotçu', ingilizce:'Spotter', kategori:'metodoloji',
    tanim:'Ağır bir sette kaldırışı gözleyen ve gerektiğinde yükü destekleyen kişidir. Bench press gibi barın gövde üzerine düşebileceği hareketlerde güvenlik açısından önemlidir. Görevi seti yaptırmak değil, kazayı önlemektir.',
    ornek:'Ağır bench setinden önce salondan bir spotçu iste.' },

  { terim:'Antrenman günlüğü', ingilizce:'Training log', kategori:'metodoloji',
    tanim:'Yapılan hareketlerin, yüklerin ve tekrarların kaydedildiği defter ya da uygulamadır. Kayıt tutmak ilerlemeyi görünür kılar ve bir sonraki seansın hedefini belirler. Hafızaya güvenmek yerine yazmak, uzun vadede en basit ilerleme aracıdır.',
    ornek:'Her setten sonra ağırlığı ve tekrarı antrenman günlüğüne yaz.' }
  ]);

  /* ===== 5 · KONDİSYON VE FİZYOLOJİ ===== */
  ekle([
  { terim:'VO2max', ingilizce:'Maximal oxygen uptake', kategori:'fizyoloji',
    tanim:'Vücudun bir dakikada kullanabildiği en yüksek oksijen miktarıdır. Dayanıklılık kapasitesinin laboratuvar ölçütü kabul edilir ve kilogram başına mililitre olarak yazılır. Antrenmanla artar ama genetik bir üst sınırı vardır.',
    ornek:'VO2max\'ı yükseltmek için haftada bir uzun aralıklı koşu koy.' },

  { terim:'Laktik eşik', ingilizce:'Lactate threshold', kategori:'fizyoloji',
    tanim:'Kanda biriken laktatın temizlenme hızını aştığı şiddet noktasıdır. Bu noktanın üzerinde tempo hızla sürdürülemez hâle gelir. Dayanıklılık sporlarında yarış temposunun büyük ölçüde bu eşiğe göre belirlenmesinin nedeni budur.',
    ornek:'Tempo koşusu laktik eşiğin hemen altında koşulur.' },

  { terim:'Laktat', ingilizce:'Lactate', kategori:'fizyoloji',
    tanim:'Şiddetli çalışma sırasında enerji üretiminin bir ürünü olarak kanda biriken maddedir. Uzun süre yorgunluğun sebebi sanılmıştır; bugün ise bir yakıt ve sinyal molekülü olarak da değerlendirilir. Birikim hızı, çalışılan şiddetin göstergesidir.',
    ornek:'Yüksek şiddetli tekrarlarda laktat birikimi bacakta yanma hissi bırakır.' },

  { terim:'Aerobik', ingilizce:'Aerobic', kategori:'fizyoloji',
    tanim:'Enerjinin oksijen kullanılarak üretildiği çalışma alanıdır. Uzun süre sürdürülebilen, konuşma temposundaki koşu ve yürüyüş bu alandadır. Dayanıklılığın temelini oluşturan hacmin çoğu bu şiddette yapılır.',
    ornek:'Aerobik koşuda yanındakiyle cümle kurabiliyor olman gerekir.',
    karistirilanlar:{ slug:'anaerobik', not:'Aerobik çalışmada enerji oksijenle üretilir ve uzun sürer; anaerobik çalışma oksijensiz yolu kullanır ve kısa sürelidir.' } },

  { terim:'Anaerobik', ingilizce:'Anaerobic', kategori:'fizyoloji',
    tanim:'Enerjinin oksijen kullanılmadan üretildiği çalışma alanıdır. Sprint ve ağır setler gibi kısa süreli, yüksek şiddetli işlerde baskındır. Sürdürülebilir süresi saniyelerle ölçülür.',
    ornek:'Otuz saniyelik tam tempo bir sprint tamamen anaerobik bir iştir.' },

  { terim:'Enerji sistemleri', ingilizce:'Energy systems', kategori:'fizyoloji',
    tanim:'Vücudun kas kasılması için gerekli enerjiyi ürettiği üç yoldur: fosfojen, glikolitik ve oksidatif sistemler. Sistemler sırayla değil, aynı anda ama farklı ağırlıklarla çalışır. Hangisinin baskın olduğunu işin şiddeti ve süresi belirler.',
    ornek:'Antrenmanın hangi enerji sistemini hedeflediğini süre ve dinlenme belirler.' },

  { terim:'Gecikmiş kas ağrısı', ingilizce:'Delayed onset muscle soreness (DOMS)', kategori:'fizyoloji',
    tanim:'Alışılmadık ya da eksantrik ağırlıklı bir çalışmadan yirmi dört ile yetmiş iki saat sonra ortaya çıkan kas ağrısıdır. Kas liflerindeki mikro hasar ve buna eşlik eden iltihabi yanıtla ilişkilidir. Antrenmanın işe yarayıp yaramadığının ölçüsü değildir.',
    ornek:'İlk bacak gününden iki gün sonra gelen ağrı gecikmiş kas ağrısıdır.',
    karistirilanlar:{ slug:'yorgunluk', not:'Gecikmiş kas ağrısı yerel ve gecikmeli bir ağrıdır; yorgunluk ise antrenman sırasında ve hemen sonrasında hissedilen performans düşüşüdür.' } },

  { terim:'Toparlanma', ingilizce:'Recovery', kategori:'fizyoloji',
    tanim:'Antrenmanın yarattığı yorgunluğun giderilip vücudun bir sonraki yüklenmeye hazır hâle gelmesidir. Uyku, beslenme ve antrenman dışı yaşam yükü toparlanmanın hızını belirler. Gelişme antrenmanda değil, toparlanma sırasında olur.',
    ornek:'Uyku altı saate düştüğünde toparlanma da düşer, yükü buna göre ayarla.' },

  { terim:'Süperkompanzasyon', ingilizce:'Supercompensation', kategori:'fizyoloji',
    tanim:'Yeterli dinlenmenin ardından performansın antrenman öncesindeki düzeyin bir miktar üstüne çıkmasıdır. Yeni yüklenme bu pencerede yapılırsa ilerleme birikir. Çok erken ya da çok geç gelen yüklenme bu kazancı boşa çıkarır.',
    ornek:'Süperkompanzasyon penceresini kaçırmamak için dinlenme günlerini plana yaz.' },

  { terim:'Kalp atım hızı değişkenliği', ingilizce:'Heart rate variability (HRV)', kategori:'fizyoloji',
    tanim:'Ardışık kalp atımları arasındaki süre farklılığının ölçüsüdür. Yüksek değerler genellikle dinlenmiş bir sinir sistemine işaret eder. Tek bir günün ölçümü yerine kişinin kendi eğilimiyle karşılaştırıldığında anlamlıdır.',
    ornek:'Bu hafta kalp atım hızı değişkenliğim düştü, yükü biraz azaltacağım.' },

  { terim:'Dinlenme nabzı', ingilizce:'Resting heart rate', kategori:'fizyoloji',
    tanim:'Tam dinlenme durumunda, çoğunlukla sabah uyanır uyanmaz ölçülen kalp atım sayısıdır. Düzenli dayanıklılık çalışması zamanla bu değeri düşürür. Beklenmedik yükselmeler yorgunluk ya da hastalık işareti olabilir.',
    ornek:'Dinlenme nabzım bir haftada beş atım yükseldi, bugün hafif çalışacağım.' },

  { terim:'Maksimum kalp atım hızı', ingilizce:'Maximum heart rate', kategori:'fizyoloji',
    tanim:'Kalbin dakikada çıkabildiği en yüksek atım sayısıdır. Yaşa göre yapılan formüller kaba bir tahmin verir; gerçek değer sahada yapılan bir testle belirlenir. Nabız bölgeleri bu değerin yüzdesi olarak hesaplanır.',
    ornek:'Nabız bölgelerini formülle değil, saha testinden çıkan gerçek değerle kur.' },

  { terim:'Hedef nabız aralığı', ingilizce:'Target heart rate zone', kategori:'fizyoloji',
    tanim:'Bir antrenmanın amaçlandığı şiddete karşılık gelen nabız bandıdır. Düşük bölgeler dayanıklılık temeli için, yüksek bölgeler eşik ve maksimum çalışmaları için kullanılır. Bölge çalışması, tempoyu duyguya bırakmadan kontrol etmenin yoludur.',
    ornek:'Uzun koşuyu hedef nabız aralığının alt ucunda tut, hızlanma isteğine direnç göster.' },

  { terim:'Oksijen borcu', ingilizce:'Excess post-exercise oxygen consumption (EPOC)', kategori:'fizyoloji',
    tanim:'Antrenman bittikten sonra vücudun normale dönmek için harcadığı ek oksijen miktarıdır. Şiddet arttıkça bu dönem uzar ve dinlenme hâlindeki enerji tüketimi bir süre yüksek kalır. Etkisi gerçektir ama günlük toplam içindeki payı sınırlıdır.',
    ornek:'Yüksek şiddetli seanslardan sonra oksijen borcu nedeniyle nabız bir süre yüksek kalır.' },

  { terim:'Glikojen', ingilizce:'Glycogen', kategori:'fizyoloji',
    tanim:'Karbonhidratın kaslarda ve karaciğerde depolandığı biçimdir. Orta ve yüksek şiddetli çalışmanın ana yakıtıdır. Depolar boşaldığında tempoyu korumak belirgin biçimde zorlaşır.',
    ornek:'Uzun koşudan önceki akşam karbonhidratı artırmak glikojen depolarını doldurur.' },

  { terim:'Hipertrofi', ingilizce:'Hypertrophy', kategori:'fizyoloji',
    tanim:'Kas liflerinin kesit alanının büyümesine hipertrofi denir. Yeterli hacim, kademeli artan yük ve toparlanma birlikte olduğunda ortaya çıkar. Kas sayısının artması değil, var olan liflerin kalınlaşması söz konusudur.',
    ornek:'Hipertrofi için haftalık set sayısını kas grubu başına on ile yirmi arasında tut.' },

  { terim:'Kas lifi tipleri', ingilizce:'Muscle fiber types', kategori:'fizyoloji',
    tanim:'Kas lifleri kasılma hızlarına göre yavaş ve hızlı kasılan tipler olarak ayrılır. Yavaş lifler dayanıklılıkta, hızlı lifler kısa ve güçlü işlerde öne çıkar. Her kasta iki tip birlikte bulunur ve oran kişiden kişiye değişir.',
    ornek:'Sprinterlerde hızlı kasılan lif oranı genellikle daha yüksektir.' },

  { terim:'Nöral uyum', ingilizce:'Neural adaptation', kategori:'fizyoloji',
    tanim:'Sinir sisteminin kasları daha verimli çağırmayı öğrenmesidir. Yeni başlayanlarda ilk haftalardaki kuvvet artışının büyük bölümü kas büyümesinden değil bu uyumdan gelir. Teknik çalışmasının kuvveti artırmasının nedeni de budur.',
    ornek:'İlk ayda kaslar büyümeden kuvvetin artması nöral uyumun sonucudur.' },

  { terim:'Bazal metabolizma hızı', ingilizce:'Basal metabolic rate (BMR)', kategori:'fizyoloji',
    tanim:'Vücudun tam dinlenme hâlinde yaşamsal işlevleri sürdürmek için harcadığı günlük enerji miktarıdır. Günlük toplam harcamanın en büyük parçasıdır. Kas kütlesi, yaş ve vücut ölçüleriyle değişir.',
    ornek:'Günlük enerji hesabına bazal metabolizma hızından başlanır.' },

  { terim:'Aşırı antrenman sendromu', ingilizce:'Overtraining syndrome', kategori:'fizyoloji',
    tanim:'Yüklenmenin toparlanmayı uzun süre aşması sonucu performansın düşmesi ve genel yorgunluk hâlinin yerleşmesidir. Uyku bozulması, isteksizlik ve sık hastalanma eşlik edebilir. Toparlanması haftalar sürebildiği için önlenmesi tedavi edilmesinden kolaydır.',
    ornek:'Performans üç haftadır düşüyorsa aşırı antrenman sendromundan şüphelen ve bir uzmana danış.' },

  { terim:'Isı uyumu', ingilizce:'Heat acclimatization', kategori:'fizyoloji',
    tanim:'Sıcak ortamda düzenli çalışıldığında vücudun terleme ve ısı dağıtma kapasitesinin artmasıdır. Genellikle bir ile iki haftalık kademeli maruz kalma ile gelişir. Uyum sağlanmadan sıcakta yapılan yoğun antrenman risklidir.',
    ornek:'Yaz yarışına gireceksen ısı uyumu için iki hafta önceden sıcakta koşmaya başla.' },

  { terim:'Uyum', ingilizce:'Adaptation', kategori:'fizyoloji',
    tanim:'Vücudun tekrarlanan bir uyarana karşı yapı ve işlevini değiştirmesidir. Antrenmanın bütün kazanımları bu sürecin sonucudur. Uyaran değişmediğinde uyum durur; ilerlemenin durmasının en yaygın nedeni budur.',
    ornek:'Aynı programı üç aydır yapıyorsan uyum tamamlanmış olabilir.' },

  { terim:'Yorgunluk', ingilizce:'Fatigue', kategori:'fizyoloji',
    tanim:'Kasın ya da sinir sisteminin belirli bir işi sürdürme kapasitesindeki geçici düşüştür. Yerel kas yorgunluğu ile merkezi yorgunluk farklı kaynaklardan gelir ve farklı hızda geçer. Antrenman planı yorgunluğu ortadan kaldırmaya değil, yönetmeye çalışır.',
    ornek:'Set aralarını uzatmak yerel yorgunluğun etkisini azaltır.' },

  { terim:'Kondisyon', ingilizce:'Conditioning', kategori:'fizyoloji',
    tanim:'Bir işi belirli bir şiddette sürdürebilme kapasitesinin genel adıdır. Yalnız uzun süre koşabilmek değil; toparlanma hızı, tekrar eden yüklenmelere dayanabilme ve nabzın düşme süresi de bu başlığın içindedir. Spora göre kondisyonun tanımı değişir.',
    ornek:'Maç temposunu koruyabilmek için kondisyon çalışmasını sporun ritmine benzet.' },

  { terim:'Kardiyo', ingilizce:'Cardio', kategori:'fizyoloji',
    tanim:'Kalbi ve solunumu bir süre boyunca yükselmiş tempoda çalıştıran hareketlerin genel adıdır. Yürüyüş, koşu, bisiklet ve yüzme gibi süreklilik içeren aktiviteler bu başlığa girer. Şiddeti ve süresi değiştikçe hangi enerji sistemini zorladığı da değişir.',
    ornek:'Kuvvet çalışmasının ardından yirmi dakikalık rahat bir kardiyo ekleyebilirsin.',
    karistirilanlar:{ slug:'kondisyon', not:'Kardiyo bir çalışma biçimidir; kondisyon ise o çalışmayla gelişen kapasitedir.' } },

  { terim:'Kuvvet', ingilizce:'Strength', kategori:'fizyoloji',
    tanim:'Kasın bir dirence karşı üretebildiği en yüksek gerilimdir. Kaldırılan yükle ölçülür ve hareketin hızından bağımsızdır. Kuvvet arttıkça aynı işi yapmak için harcanan göreli çaba düşer.',
    ornek:'Kuvvet gelişimi için düşük tekrarlı ve yüksek yüklü setler kullanılır.',
    karistirilanlar:{ slug:'guc', not:'Kuvvet ne kadar yük kaldırıldığını, güç ise o yükün ne kadar hızlı hareket ettirildiğini anlatır.' } },

  { terim:'Güç', ingilizce:'Power', kategori:'fizyoloji',
    tanim:'Kuvvetin birim zamanda ortaya konmasıdır; hem yükün büyüklüğünü hem hareketin hızını birlikte içerir. Sıçrama, atış ve sprint çıkışı gibi kısa süreli işlerin belirleyicisidir. Aynı yükü daha hızlı hareket ettiren sporcu daha çok güç üretmiş olur.',
    ornek:'Güç çalışmasında yükü orta tut ama her tekrarı olabildiğince hızlı yap.',
    karistirilanlar:{ slug:'kuvvet', not:'Güç hıza bağlıdır; kuvvet ise hızdan bağımsız olarak kaldırılabilen en yüksek yüktür.' } }
  ]);

  /* ===== 6 · DÖVÜŞ SANATLARI ===== */
  ekle([
  { terim:'Guard', ingilizce:'Guard', kategori:'dovus',
    tanim:'Yer mücadelesinde sırt üstü olan sporcunun bacaklarını kullanarak rakibi kontrol ettiği pozisyondur. Altta olmasına rağmen hücum ve süpürme imkânı verdiği için savunmadan sayılmaz. Kapalı, açık ve yarım gibi çok sayıda çeşidi vardır.',
    ornek:'Rakip üstüne gelince guard\'a geç ve mesafeyi bacaklarınla yönet.',
    kas:'kalca-fleksor' },

  { terim:'Mount', ingilizce:'Mount', kategori:'dovus',
    tanim:'Sporcunun rakibin gövdesi üzerine oturarak üstte kontrol kurduğu pozisyondur. Yer mücadelesinde en avantajlı pozisyonlardan biri sayılır. Puanlamada yüksek değer taşır ve bitiriş tekniklerine geçiş kolaydır.',
    ornek:'Mount pozisyonuna geçtikten sonra ağırlığını kalçandan ver, ellerinden değil.' },

  { terim:'Sırt pozisyonu', ingilizce:'Back control', kategori:'dovus',
    tanim:'Rakibin arkasına geçilip bacaklarla gövdesinin kancalandığı kontrol pozisyonudur. Rakip savunma için arkasını göremediğinden en avantajlı pozisyon kabul edilir. Boğma teknikleri buradan yüksek başarıyla uygulanır.',
    ornek:'Sırt pozisyonunda topuklarını rakibin uyluk içine yerleştir.' },

  { terim:'Klinç', ingilizce:'Clinch', kategori:'dovus',
    tanim:'İki sporcunun yakın mesafede birbirini kavradığı ayakta mücadele pozisyonudur. Vuruş mesafesini kapatır ve diz, dirsek ya da yere indirme girişlerine zemin hazırlar. Boyun ve kavrama gücü bu pozisyonda belirleyicidir.',
    ornek:'Klinçte başını rakibin omzuna yasla ve dirseklerini içeride tut.',
    kas:'boyun' },

  { terim:'Takedown', ingilizce:'Takedown', kategori:'dovus',
    tanim:'Ayakta duran rakibin kontrollü biçimde yere indirilmesidir. Güreş, judo ve karma dövüş sanatlarının ortak temel becerisidir. Başarılı bir girişte hız kadar seviye düşürme ve zamanlama belirleyicidir.',
    ornek:'Takedown girişinden önce seviyeni dizlerinden düşür, belinden eğilme.',
    kas:'quadriceps' },

  { terim:'Çift dalma', ingilizce:'Double leg takedown', kategori:'dovus',
    tanim:'Rakibin iki bacağının birden kavranarak yere indirildiği güreş tekniğidir. Giriş sırasında seviye düşürme, adım ve gövde açısı birlikte çalışır. Karma dövüş sanatlarında en sık kullanılan yere indirme yöntemlerinden biridir.',
    ornek:'Çift dalmada başını dik tut, sırtını yuvarlama.',
    hareket:'hamle', kas:'quadriceps' },

  { terim:'Sweep', ingilizce:'Sweep', kategori:'dovus',
    tanim:'Alttaki sporcunun rakibi dengesinden çıkarıp pozisyonu tersine çevirmesidir. Kuvvetten çok denge noktalarının ve açının kullanılmasıyla yapılır. Başarılı bir süpürme, altta olmayı üstte olmaya çevirdiği için puan getirir.',
    ornek:'Guard\'dan sweep atmak için önce rakibin ağırlığını bir tarafa çek.',
    kas:'karin-yan' },

  { terim:'Submission', ingilizce:'Submission', kategori:'dovus',
    tanim:'Rakibi eklem kilidi ya da boğma yoluyla teslim olmaya zorlayan bitiriş tekniğidir. Amaç zarar vermek değil, rakibin devam edemeyeceği bir konum kurmaktır. Rakip teslim işareti verdiğinde teknik anında bırakılır.',
    ornek:'Submission uygulanırken rakip elini yere iki kez vurursa hemen bırak.' },

  { terim:'Kimura', ingilizce:'Kimura', kategori:'dovus',
    tanim:'Kolun arkaya doğru döndürülerek omuz eklemine baskı uygulandığı çift el kilididir. Adını tekniği ünlü bir müsabakada uygulayan Japon judocudan alır. Hem ayakta hem yerde uygulanabilen az sayıdaki tekniklerden biridir.',
    ornek:'Kimura kurarken rakibin dirseğini gövdene yakın tut.',
    kas:'rotator-manset' },

  { terim:'Armbar', ingilizce:'Armbar', kategori:'dovus',
    tanim:'Rakibin kolunun bacaklar arasına alınıp dirsek ekleminin gerdirildiği kilit tekniğidir. Kalçanın yukarı itilmesiyle baskı oluşur, kol gücüyle değil. Yer mücadelesinin en temel bitiriş tekniklerinden biridir.',
    ornek:'Armbar\'da dizlerini kapalı tut, yoksa rakip kolunu çeker.',
    kas:'triceps' },

  { terim:'Boğma tekniği', ingilizce:'Choke', kategori:'dovus',
    tanim:'Boyun bölgesine kontrollü baskı uygulayarak rakibi teslim olmaya zorlayan tekniklerin genel adıdır. Kan dolaşımını ya da hava yolunu hedefleyen çeşitleri vardır. Yalnız eğitmen gözetiminde ve teslim işaretine kesin uyularak çalışılır.',
    ornek:'Boğma tekniğini asla eğitmen olmadan çalışma.',
    kas:'boyun' },

  { terim:'Jab', ingilizce:'Jab', kategori:'dovus',
    tanim:'Öndeki elle atılan düz ve hızlı yumruktur. Mesafe ölçmek, ritmi bozmak ve arkadan gelecek vuruşa yol açmak için kullanılır. Boksun en çok atılan ve en az yorulan vuruşudur.',
    ornek:'Jab\'i çektikten sonra eli çeneye geri getirmeyi unutma.',
    kas:'deltoid-on' },

  { terim:'Direkt', ingilizce:'Cross', kategori:'dovus',
    tanim:'Arkadaki elle, gövdenin dönüşünden güç alarak atılan düz yumruktur. Kuvveti ayaktan başlayıp kalça ve gövde dönüşüyle aktarılan zincirden gelir. Genellikle jab ile ikili bir seri hâlinde kullanılır.',
    ornek:'Direkt atarken arka topuğu döndür, gücü yerden al.',
    kas:'karin-yan' },

  { terim:'Kroşe', ingilizce:'Hook', kategori:'dovus',
    tanim:'Kol dirsekten bükülü hâlde yandan atılan kavisli yumruktur. Yakın mesafede etkilidir ve gövde dönüşüyle güç kazanır. Baş ya da gövde hedefli olarak iki farklı yükseklikte atılır.',
    ornek:'Kroşede dirseğini doksan derecede sabit tut, kolu savurma.',
    kas:'karin-yan' },

  { terim:'Aparkat', ingilizce:'Uppercut', kategori:'dovus',
    tanim:'Aşağıdan yukarı doğru atılan kısa mesafeli yumruktur. Rakip öne eğildiğinde ya da klinç mesafesinde kullanılır. Gücü bacakların itişinden ve gövdenin yukarı doğru açılmasından gelir.',
    ornek:'Aparkatta dizlerini biraz bük, itişi bacaklardan başlat.',
    kas:'quadriceps' },

  { terim:'Kata', ingilizce:'Kata', kategori:'dovus',
    tanim:'Karate ve benzeri geleneksel sanatlarda önceden belirlenmiş hareket dizisinin tek başına uygulanmasıdır. Teknik, denge ve zamanlamanın rakipsiz çalışıldığı biçimdir. Kuşak sınavlarının değerlendirme ölçütlerinden biridir.',
    ornek:'Kuşak sınavında önce kata, sonra kumite değerlendirilir.' },

  { terim:'Kumite', ingilizce:'Kumite', kategori:'dovus',
    tanim:'Karatede iki sporcunun karşılıklı çalıştığı bölümdür. Kurallı ve kontrollü biçimlerinden serbest müsabakaya kadar farklı düzeyleri vardır. Katada öğrenilen tekniğin canlı rakiple sınandığı aşamadır.',
    ornek:'Kumiteye geçmeden önce mesafe hissini kata ile oturt.' },

  { terim:'Tatami', ingilizce:'Tatami', kategori:'dovus',
    tanim:'Judo, jiu-jitsu ve benzeri sporlarda kullanılan yer minderidir. Düşüşün etkisini azaltacak sertlikte üretilir; fazla yumuşak olması ayak bileği için risk oluşturur. Salon içindeki davranış kuralları çoğunlukla tatami sınırıyla tanımlanır.',
    ornek:'Tatamiye çıkmadan önce ayakkabılarını çıkar ve tırnaklarını kontrol et.' },

  { terim:'Kuşak', ingilizce:'Belt rank', kategori:'dovus',
    tanim:'Sporcunun teknik düzeyini gösteren renk sistemidir. Renk sırası ve terfi ölçütleri spora ve federasyona göre değişir. Kuşak yalnız teknik bilgiyi değil, tatamide geçirilen süreyi ve tutumu da yansıtır.',
    ornek:'Mavi kuşak sınavı için en az iki yıl düzenli çalışma bekleniyor.' },

  { terim:'Sparring', ingilizce:'Sparring', kategori:'dovus',
    tanim:'Kontrollü şiddette yapılan serbest çalışmadır. Öğrenilen tekniklerin canlı bir rakiple, yaralanma riski düşürülerek sınandığı bölümdür. Şiddeti eğitmen belirler ve maç ile karıştırılmamalıdır.',
    ornek:'Sparring maç değildir; amacı kazanmak değil öğrenmektir.' },

  { terim:'Kafes', ingilizce:'Cage', kategori:'dovus',
    tanim:'Karma dövüş sanatları müsabakalarının yapıldığı, tel örgüyle çevrili sekizgen ya da yuvarlak alandır. Kenar, sporcunun dışarı düşmesini engellemesinin yanında mücadelenin bir parçası olarak da kullanılır. Kafese sıkıştırma başlı başına bir taktiktir.',
    ornek:'Rakibi kafese sıkıştırıp klinçte çalışmak bilinçli bir tercih olabilir.' },

  { terim:'Ring', ingilizce:'Ring', kategori:'dovus',
    tanim:'Boks ve kick boks müsabakalarının yapıldığı, köşeleri direkli ve kenarları halatlı kare alandır. Halatlar sporcunun dışarı çıkmasını engeller ve köşeler mola alanı olarak kullanılır. Ring içindeki hareket alanı kafesten farklı bir taktik dil doğurur.',
    ornek:'Ringde köşeye sıkışmamak için yanlara doğru adım al.' },

  { terim:'Teslim işareti', ingilizce:'Tap out', kategori:'dovus',
    tanim:'Sporcunun devam edemeyeceğini bildirmek için rakibe ya da mindere elle vurmasıdır. Sesli olarak da verilebilir. Verildiği anda teknik derhal bırakılır; bu kural dövüş salonlarının en katı güvenlik kuralıdır.',
    ornek:'Teslim işaretini geç vermek yerine erken vermek her zaman daha güvenlidir.' },

  { terim:'Karma dövüş sanatları', ingilizce:'Mixed martial arts (MMA)', kategori:'dovus',
    tanim:'Boks, güreş, jiu-jitsu ve tekme temelli stilleri tek kural setinde birleştiren dövüş sporudur. Ayakta vuruş, klinç ve yer mücadelesi aynı müsabakada geçerlidir. Türkçede de çoğunlukla İngilizce kısaltmasıyla, MMA olarak anılır.',
    ornek:'Karma dövüş sanatlarında yalnız tek bir alanda iyi olmak yetmez.',
    karistirilanlar:{ slug:'kafes', not:'Karma dövüş sanatları sporun adıdır; kafes o sporun yapıldığı alandır.' } }
  ]);

  /* ===== 7 · KOŞU VE DAYANIKLILIK ===== */
  ekle([
  { terim:'Split', ingilizce:'Split time', kategori:'kosu',
    tanim:'Bir yarışın ya da antrenmanın belirli bir bölümünün süresidir. Genellikle her kilometre ya da her tur için ayrı tutulur. Bölüm süreleri, tempo yönetiminin yarış sırasında nasıl gittiğini gösteren en pratik veridir.',
    ornek:'İlk beş kilometrenin split\'i planladığımdan on saniye hızlıydı.' },

  { terim:'Negatif split', ingilizce:'Negative split', kategori:'kosu',
    tanim:'Yarışın ikinci yarısının birinci yarısından daha hızlı koşulmasıdır. Enerjinin başta israf edilmediğini gösterdiği için genellikle iyi tempo yönetiminin işareti sayılır. Uzun mesafelerde hedeflenen yarış stratejilerinden biridir.',
    ornek:'Maratonu negatif split ile bitirmek için ilk yarıda kendini tutman gerekir.',
    karistirilanlar:{ slug:'split', not:'Split tek bir bölümün süresidir; negatif split ise ikinci yarının birinciden hızlı olması durumunu anlatır.' } },

  { terim:'Kadans', ingilizce:'Cadence', kategori:'kosu',
    tanim:'Bir dakikada atılan adım sayısıdır. Düşük kadans genellikle uzun ve frenleyici adımlara işaret eder. Kadansı bir miktar artırmak, aynı hızda daha az sarsıntılı koşmayı sağlayabilir.',
    ornek:'Kadansımı yüz altmıştan yüz yetmiş beşe çıkarınca diz ağrım azaldı.',
    kas:'gastrocnemius' },

  { terim:'Fartlek', ingilizce:'Fartlek', kategori:'kosu',
    tanim:'Hız değişimlerinin serbestçe, saat ya da mesafeye bağlı kalmadan yapıldığı koşu biçimidir. İsveççede "hız oyunu" anlamına gelir. Yapılandırılmış aralıklı koşuya göre daha esnek ve daha az yorucudur.',
    ornek:'Bugün fartlek yaptım: her elektrik direğinde hızlanıp bir sonrakinde yavaşladım.' },

  { terim:'Taper', ingilizce:'Taper', kategori:'kosu',
    tanim:'Yarıştan önceki haftalarda antrenman hacminin kademeli olarak azaltılmasıdır. Yoğunluk büyük ölçüde korunur, azalan şey toplam iştir. Amaç biriken yorgunluğu boşaltıp yarış gününe dinlenmiş girmektir.',
    ornek:'Maratondan üç hafta önce taper başlar, hacim yavaş yavaş düşer.' },

  { terim:'Tempo koşusu', ingilizce:'Tempo run', kategori:'kosu',
    tanim:'Laktik eşiğin hemen altında, yirmi ile kırk dakika arasında sürdürülen koşudur. Konuşmanın zorlaştığı ama nefesin kontrolden çıkmadığı bir şiddettir. Yarış temposunu uzun süre koruma kapasitesini geliştirir.',
    ornek:'Haftada bir tempo koşusu, yarım maraton hazırlığının belkemiğidir.' },

  { terim:'Aralıklı koşu', ingilizce:'Interval training', kategori:'kosu',
    tanim:'Yüksek şiddetli koşu bölümlerinin belirli dinlenmelerle sıralandığı çalışmadır. Bölüm uzunluğu ve dinlenme süresi, hangi kapasitenin hedeflendiğini belirler. Hacimden çok kaliteye yönelik bir antrenman biçimidir.',
    ornek:'Bugün aralıklı koşu var: altı kez dört yüz metre, arada iki dakika yürüyüş.' },

  { terim:'Uzun yavaş koşu', ingilizce:'Long slow distance (LSD)', kategori:'kosu',
    tanim:'Rahat tempoda, uzun süre yapılan koşudur. Dayanıklılık temelini kuran ve haftalık hacmin en büyük parçasını oluşturan çalışmadır. Hızlanma isteğine direnmek bu koşunun en zor tarafıdır.',
    ornek:'Uzun yavaş koşuda tempoyu yarış hızının belirgin altında tut.' },

  { terim:'Duvara toslama', ingilizce:'Hitting the wall', kategori:'kosu',
    tanim:'Uzun mesafe koşularında glikojen depolarının tükenmesiyle temponun ani biçimde düşmesidir. Genellikle maratonun otuzuncu kilometresi civarında görülür. Yarış sırasında düzenli karbonhidrat alımı bu riski azaltır.',
    ornek:'Otuz beşinci kilometrede duvara tosladım, son yedi kilometreyi yürüyerek bitirdim.' },

  { terim:'Pace', ingilizce:'Pace', kategori:'kosu',
    tanim:'Bir kilometrenin ya da milin kaç dakikada koşulduğunu gösteren tempo ölçüsüdür. Hızın koşuda en yaygın ifade biçimidir. Antrenman planları hedef tempo aralıkları üzerinden yazılır.',
    ornek:'Hedef pace\'im kilometre başına beş dakika otuz saniye.' },

  { terim:'Eğim çalışması', ingilizce:'Hill training', kategori:'kosu',
    tanim:'Yokuş yukarı ya da yokuş aşağı koşularak yapılan özel antrenmandır. Yukarı koşu kuvvet ve itiş gücünü, aşağı koşu ise iniş kontrolünü ve eksantrik dayanıklılığı geliştirir. Aşağı koşu kas ağrısı bıraktığı için kademeli artırılır.',
    ornek:'Haftada bir eğim çalışması, düz zeminde de temponu yükseltir.',
    kas:'quadriceps' },

  { terim:'Ultra maraton', ingilizce:'Ultramarathon', kategori:'kosu',
    tanim:'Klasik maraton mesafesinden, yani kırk iki kilometre yüz doksan beş metreden uzun her yarışa verilen addır. Elli ve yüz kilometre ile yirmi dört saatlik formatlar yaygındır. Hızdan çok beslenme, ekipman ve tempo yönetimi belirleyicidir.',
    ornek:'Ultra maratonda yürüme molaları stratejinin parçasıdır.' },

  { terim:'Maraton', ingilizce:'Marathon', kategori:'kosu',
    tanim:'Kırk iki kilometre yüz doksan beş metrelik klasik uzun mesafe yarışıdır. Hazırlığı genellikle on altı ile yirmi hafta sürer ve haftalık hacmin kademeli artırılmasına dayanır. Tempo yönetimi ile yarış içi beslenme sonucu belirleyen iki unsurdur.',
    ornek:'İlk maratonunda hedefin süre değil, bitirmek olsun.' },

  { terim:'Yarı maraton', ingilizce:'Half marathon', kategori:'kosu',
    tanim:'Yirmi bir kilometre doksan yedi metrelik yarış mesafesidir. On kilometre ile maraton arasında bir köprü kabul edilir. Hazırlığı daha kısa sürdüğü için uzun mesafeye ilk adım olarak sık seçilir.',
    ornek:'Yarı maratona sekiz haftalık bir planla hazırlanabilirsin.' },

  { terim:'Ritim koşusu', ingilizce:'Strides', kategori:'kosu',
    tanim:'Yüz metre civarında, hızlanıp yavaşlayarak yapılan kısa ve rahat hızlanmalardır. Amaç yorulmak değil, koşu formunu ve bacak hızını canlı tutmaktır. Genellikle rahat koşuların sonuna eklenir.',
    ornek:'Kolay koşunun sonuna dört ritim koşusu ekle.' },

  { terim:'Adım uzunluğu', ingilizce:'Stride length', kategori:'kosu',
    tanim:'İki ardışık ayak temasının arasındaki mesafedir. Hız, adım uzunluğu ile kadansın çarpımıdır. Adımı bilinçli olarak uzatmak genellikle frenleme yaratır; uzunluk hız arttıkça kendiliğinden büyür.',
    ornek:'Hızlanmak için adım uzunluğunu zorlama, önce kadansa bak.' },

  { terim:'Ayak vuruşu', ingilizce:'Foot strike', kategori:'kosu',
    tanim:'Ayağın yere ilk temas ettiği bölgeyi tanımlar: topuk, orta ayak ya da ön ayak. Tek bir doğru biçim yoktur; sporcuya, hıza ve zemine göre değişir. Ani biçimde değiştirmek yeni bölgelerde zorlanmaya yol açabilir.',
    ornek:'Ayak vuruşunu değiştireceksen haftalar sürecek kademeli bir geçiş planla.',
    kas:'tibialis-on' },

  { terim:'Koşu ekonomisi', ingilizce:'Running economy', kategori:'kosu',
    tanim:'Belirli bir tempoda koşarken harcanan oksijen miktarıdır. Aynı hızda daha az enerji harcayan koşucu daha ekonomiktir. Kuvvet çalışması ve teknik iyileştirmeler bu ölçütü geliştirebilir.',
    ornek:'Haftada iki gün kuvvet çalışması koşu ekonomisini iyileştirir.' },

  { terim:'İkinci bölge çalışması', ingilizce:'Zone 2 training', kategori:'kosu',
    tanim:'Nabzın düşük ve konuşmanın rahat olduğu aerobik bandda yapılan uzun süreli çalışmadır. Dayanıklılık temelini kuran ve toparlanmayı fazla zorlamayan şiddettir. Haftalık hacmin büyük bölümünün burada yapılması yaygın bir yaklaşımdır.',
    ornek:'İkinci bölge çalışmasında burnundan nefes alabiliyor olman iyi bir işarettir.' },

  { terim:'Sürat çalışması', ingilizce:'Sprint training', kategori:'kosu',
    tanim:'Kısa mesafelerin tam ya da tama yakın şiddette koşulduğu çalışmadır. Dinlenmeler uzun tutulur çünkü hedef yorulmak değil hızı geliştirmektir. İyi bir ısınma olmadan yapılması arka uyluk zorlanması riskini artırır.',
    ornek:'Sürat çalışmasından önce en az on beş dakika ısın.',
    kas:'hamstring' },

  { terim:'Çapraz antrenman', ingilizce:'Cross-training', kategori:'kosu',
    tanim:'Ana spor dalının dışında, onu destekleyen başka bir aktiviteyle yapılan çalışmadır. Koşucuların bisiklet ya da yüzmeye yönelmesi bunun tipik örneğidir. Darbe yükünü azaltırken dayanıklılık uyaranını sürdürmeyi sağlar.',
    ornek:'Sakatlık döneminde çapraz antrenmanla kondisyonunu koruyabilirsin.' },

  { terim:'Dayanıklılık', ingilizce:'Endurance', kategori:'kosu',
    tanim:'Bir işi uzun süre sürdürebilme kapasitesidir. Kalp ve dolaşım sistemine dayanan genel dayanıklılık ile belirli bir kasın tekrarlı çalışmayı sürdürmesini anlatan kas dayanıklılığı olarak ikiye ayrılır. İkisi farklı çalışmalarla geliştirilir.',
    ornek:'Uzun koşu genel dayanıklılığı, yüksek tekrarlı setler kas dayanıklılığını çalıştırır.' }
  ]);

  /* ===== 8 · ESNEKLİK VE MOBİLİTE ===== */
  ekle([
  { terim:'Mobilite', ingilizce:'Mobility', kategori:'mobilite',
    tanim:'Bir eklemin hareket açıklığını kontrollü biçimde kullanabilme becerisidir. Yalnız uzayabilmeyi değil, o açıklıkta kuvvet üretebilmeyi de içerir. Bu yüzden germe kadar kuvvet çalışmasıyla da geliştirilir.',
    ornek:'Kalça mobilitesi arttıkça çömelmenin dibinde belin daha az yuvarlanır.',
    karistirilanlar:{ slug:'esneklik', not:'Esneklik dokunun uzayabilmesidir; mobilite o uzunluğu kontrollü kullanabilmektir.' } },

  { terim:'Esneklik', ingilizce:'Flexibility', kategori:'mobilite',
    tanim:'Kas ve bağ dokusunun uzayabilme kapasitesidir. Pasif olarak ölçülür; yani dışarıdan uygulanan bir kuvvetle eklemin ne kadar açıldığına bakılır. Tek başına esneklik, o açıklığı hareket sırasında kullanabilmeyi garanti etmez.',
    ornek:'Öne eğilip yere değebilmen esnekliği gösterir, kontrolü değil.' },

  { terim:'Dinamik germe', ingilizce:'Dynamic stretching', kategori:'mobilite',
    tanim:'Hareket hâlinde, kontrollü savurmalarla yapılan germe biçimidir. Kas sıcaklığını ve eklem hareket açıklığını antrenman öncesinde artırır. Isınmanın performansı düşürmeyen germe biçimi olarak tercih edilir.',
    ornek:'Koşudan önce bacak savurma gibi dinamik germe hareketleri yap.' },

  { terim:'Statik germe', ingilizce:'Static stretching', kategori:'mobilite',
    tanim:'Bir pozisyonda kalınarak, genellikle otuz saniye ile iki dakika arasında sürdürülen germe biçimidir. Antrenman sonrasında ya da ayrı bir seansta yapıldığında hareket açıklığını kalıcı biçimde artırabilir. Ağır kuvvet çalışmasının hemen öncesinde uzun süre uygulanması performansı geçici olarak düşürebilir.',
    ornek:'Statik germeyi antrenmanın sonuna bırak, hemen öncesine değil.' },

  { terim:'PNF germe', ingilizce:'Proprioceptive neuromuscular facilitation', kategori:'mobilite',
    tanim:'Kasın önce gerdirilip ardından birkaç saniye kasılması, sonra yeniden gerdirilmesi esasına dayanan germe yöntemidir. Kasılma sonrası gevşeme sayesinde açıklık geçici olarak daha çok artar. Genellikle bir partner ya da sabit destek gerektirir.',
    ornek:'PNF germede altı saniye kasıl, sonra nefes verirken derinleş.' },

  { terim:'Miyofasyal gevşetme', ingilizce:'Myofascial release', kategori:'mobilite',
    tanim:'Kas ve onu saran bağ dokusuna basınç uygulanarak yapılan çalışmadır. Foam roller, top ya da elle uygulanabilir. Etkisi çoğunlukla kısa sürelidir ve germe ile kuvvet çalışmasının yerini almaz.',
    ornek:'Antrenman öncesi kısa bir miyofasyal gevşetme, hareket açıklığını geçici olarak açar.' },

  { terim:'Aktif hareket açıklığı', ingilizce:'Active range of motion', kategori:'mobilite',
    tanim:'Kişinin kendi kas gücüyle ulaşabildiği hareket açıklığıdır. Kontrol ve kuvvetin birlikte ölçüldüğü değerdir. Antrenmanda kullanılabilen gerçek açıklık budur.',
    ornek:'Bacağını kendin ne kadar kaldırabiliyorsan aktif hareket açıklığın odur.' },

  { terim:'Pasif hareket açıklığı', ingilizce:'Passive range of motion', kategori:'mobilite',
    tanim:'Dışarıdan uygulanan bir kuvvetle ulaşılan hareket açıklığıdır. Genellikle aktif açıklıktan daha geniştir. İki değer arasındaki fark, o açıklıkta ne kadar kontrol eksiği olduğunu gösterir.',
    ornek:'Pasif ile aktif açıklık arasındaki fark büyükse kuvvet çalışması gerekir.' },

  { terim:'Kalça menteşesi', ingilizce:'Hip hinge', kategori:'mobilite',
    tanim:'Gövdenin belden değil kalçadan öne eğildiği temel hareket kalıbıdır. Diz hafif bükülür, sırt nötr kalır ve hareket kalçanın geriye gitmesiyle olur. Ölü kaldırış ve kettlebell salınımının temeli bu kalıptır.',
    ornek:'Kalça menteşesini duvara kalçanı dokundurarak öğrenebilirsin.',
    hareket:'kettlebell-swing', kas:'hamstring' },

  { terim:'Çömelme kalıbı', ingilizce:'Squat pattern', kategori:'mobilite',
    tanim:'Kalça ve dizin birlikte bükülerek gövdenin dikeye yakın kaldığı temel hareket kalıbıdır. Ayak bileği ve kalça hareketliliği bu kalıbın derinliğini belirler. Günlük hayatta oturup kalkmanın karşılığıdır.',
    ornek:'Çömelme kalıbında topuğun yerden kalkıyorsa ayak bileği hareketliliğine bak.',
    hareket:'goblet-squat', kas:'quadriceps' },

  { terim:'Torasik hareketlilik', ingilizce:'Thoracic mobility', kategori:'mobilite',
    tanim:'Sırt omurgasının orta bölümünün dönme ve geriye açılma kapasitesidir. Baş üstü hareketlerde ve dönüş gerektiren sporlarda belirleyicidir. Bu bölge sertleştiğinde yük çoğunlukla bel ve omuza kayar.',
    ornek:'Omuz press sırasında bel çöküyorsa torasik hareketliliğe bakmak gerekir.',
    kas:'erector-spinae' },

  { terim:'Ayak bileği hareketliliği', ingilizce:'Ankle mobility', kategori:'mobilite',
    tanim:'Kaval kemiğinin ayak üzerinden öne doğru ilerleyebilme kapasitesidir. Çömelmenin derinliğini ve dizin ayak ucunu geçebilme miktarını doğrudan belirler. Kısıtlıysa gövde öne eğilir ya da topuk yerden kalkar.',
    ornek:'Duvara diz değdirme testiyle ayak bileği hareketliliğini ölçebilirsin.',
    kas:'soleus' },

  { terim:'Isınma', ingilizce:'Warm-up', kategori:'mobilite',
    tanim:'Antrenman öncesinde vücut sıcaklığını, kalp atımını ve eklem hareketliliğini kademeli olarak yükselten hazırlık bölümüdür. Genel bir kondisyon bölümü ile harekete özel hazırlık bölümünden oluşur. On ile on beş dakika çoğu antrenman için yeterlidir.',
    ornek:'Isınmayı genelden özele götür: önce hafif kardiyo, sonra o günün hareketleri.' },

  { terim:'Soğuma', ingilizce:'Cool-down', kategori:'mobilite',
    tanim:'Antrenmanın sonunda şiddetin kademeli olarak düşürüldüğü bölümdür. Nabzın yavaşça normale dönmesini sağlar ve seansı bilinçli bir kapanışla bitirir. Kas ağrısını tamamen önlediğine dair güçlü bir kanıt yoktur.',
    ornek:'Yoğun bir seanstan sonra beş dakika yürüyerek soğu.' },

  { terim:'Duruş', ingilizce:'Posture', kategori:'mobilite',
    tanim:'Vücut bölümlerinin birbirine göre hizalanma biçimidir. Tek bir doğru duruş yoktur; asıl sorun aynı pozisyonda uzun süre kalmaktır. Hareket çeşitliliği, duruş düzeltmeye çalışmaktan çoğu zaman daha etkilidir.',
    ornek:'Duruşunu düzeltmenin en basit yolu her yarım saatte bir pozisyon değiştirmek.',
    kas:'trapez-orta-alt' },

  { terim:'Denge', ingilizce:'Balance', kategori:'mobilite',
    tanim:'Vücudun ağırlık merkezini destek yüzeyi üzerinde tutabilme becerisidir. Görme, iç kulak ve derin duyu birlikte çalışır. Tek ayak üzerindeki çalışmalar bu beceriyi doğrudan geliştirir.',
    ornek:'Diş fırçalarken tek ayak üzerinde durmak basit bir denge çalışmasıdır.',
    hareket:'hamle', kas:'gluteus-medius' },

  { terim:'Koordinasyon', ingilizce:'Coordination', kategori:'mobilite',
    tanim:'Farklı kas gruplarının doğru sırayla ve doğru zamanlamayla birlikte çalışabilmesidir. Yeni bir harekette ilk zorlanmanın kaynağı çoğunlukla kuvvet eksikliği değil koordinasyondur. Tekrarla ve yavaş çalışmayla gelişir.',
    ornek:'Yeni bir harekete hafif yükle başlamak koordinasyonu daha hızlı oturtur.' },

  { terim:'Çeviklik', ingilizce:'Agility', kategori:'mobilite',
    tanim:'Bir uyarana yanıt olarak hızlı yön değiştirebilme becerisidir. Hız, denge ve karar verme birlikte çalışır. Sabit desenli koni çalışmaları hızı geliştirir ama gerçek çevikliğin karar bileşenini eksik bırakır.',
    ornek:'Çeviklik çalışmasına eğitmenin işaretine göre yön değiştirmeyi ekle.' },

  { terim:'Nefes çalışması', ingilizce:'Breathing drills', kategori:'mobilite',
    tanim:'Nefesin ritmini ve derinliğini bilinçli olarak düzenleyen çalışmalardır. Kaburga hareketini ve karın basıncını yönetmeyi öğretir. Hem toparlanmayı hızlandırmak hem gövde sağlamlığını kurmak için kullanılır.',
    ornek:'Setler arasında burnundan derin nefes alarak nabzını düşür.' },

  { terim:'Eklem stabilitesi', ingilizce:'Joint stability', kategori:'mobilite',
    tanim:'Eklemin yük altında istenen konumu koruyabilme kapasitesidir. Çevredeki kasların zamanında ve doğru şiddette kasılmasıyla sağlanır. Hareketliliği artırırken stabiliteyi ihmal etmek yaralanma riskini artırabilir.',
    ornek:'Omuz hareketliliğini açtıktan sonra bantla stabilite çalışması ekle.',
    hareket:'bant-yana-acma', kas:'rotator-manset' },

  { terim:'Aktivasyon', ingilizce:'Muscle activation', kategori:'mobilite',
    tanim:'Asıl çalışmadan önce hedef kasın hafif hareketlerle devreye sokulmasıdır. Amaç yormak değil, sinir sistemine o kasın görevini hatırlatmaktır. Kalça orta kası ve kürek kemiği çevresi gibi uykuda kalmaya eğilimli bölgelerde sık kullanılır.',
    ornek:'Bacak gününden önce iki set köprü ile kalça aktivasyonu yap.',
    hareket:'kopru', kas:'gluteus-medius',
    karistirilanlar:{ slug:'isinma', not:'Isınma bütün vücudu hazırlar; aktivasyon o hazırlığın tek bir kası hedefleyen parçasıdır.' } }
  ]);

  /* ===== 9 · BESLENME VE TOPARLANMA ===== */
  ekle([
  { terim:'Makro besinler', ingilizce:'Macronutrients', kategori:'beslenme',
    tanim:'Vücudun enerji ve yapı taşı olarak gram düzeyinde ihtiyaç duyduğu üç besin öğesidir: protein, karbonhidrat ve yağ. Günlük enerjinin tamamı bu üçünden gelir. Dağılımın kişiye göre ayarlanması bir uzmanın işidir.',
    ornek:'Makro besinlerin dağılımını hedefe ve antrenman yüküne göre bir uzmanla belirle.' },

  { terim:'Protein', ingilizce:'Protein', kategori:'beslenme',
    tanim:'Kas dokusunun onarımı ve yapımı için gereken amino asitleri sağlayan besin öğesidir. Gramı yaklaşık dört kilokalori enerji taşır. Antrenman yapanlarda ihtiyacın hareketsiz kişilere göre daha yüksek olduğu genel kabul görür.',
    ornek:'Günlük proteini öğünlere yayarak almak tek öğünde toplamaktan daha pratiktir.' },

  { terim:'Karbonhidrat', ingilizce:'Carbohydrate', kategori:'beslenme',
    tanim:'Orta ve yüksek şiddetli çalışmanın ana yakıtını sağlayan besin öğesidir. Vücutta glikojen olarak depolanır. Antrenman hacmi arttıkça ihtiyaç da artar.',
    ornek:'Uzun antrenman günlerinde karbonhidratı artırmak tempoyu korumana yardım eder.' },

  { terim:'Yağ', ingilizce:'Dietary fat', kategori:'beslenme',
    tanim:'Hormon üretimi ve yağda çözünen vitaminlerin emilimi için gerekli besin öğesidir. Gramı yaklaşık dokuz kilokalori taşıdığı için enerji yoğunluğu yüksektir. Çok düşük tutulması uzun vadede sorun yaratabilir.',
    ornek:'Yağı tamamen kesmek yerine kaynağını ve miktarını düzenlemek daha sürdürülebilir.' },

  { terim:'Enerji dengesi', ingilizce:'Energy balance', kategori:'beslenme',
    tanim:'Alınan enerji ile harcanan enerji arasındaki ilişkidir. Denge pozitifse vücut ağırlığı zamanla artar, negatifse azalır. Kilo değişiminin arkasındaki temel çerçeve budur.',
    ornek:'Antrenman arttığında harcama da artar; enerji dengesini buna göre gözden geçir.' },

  { terim:'Kalori açığı', ingilizce:'Caloric deficit', kategori:'beslenme',
    tanim:'Harcanan enerjinin alınandan fazla olduğu durumdur. Kilo verme sürecinin temel koşuludur. Açığın çok büyük tutulması kas kaybını ve performans düşüşünü hızlandırabilir.',
    ornek:'Kalori açığını makul tut; hızlı kayıp çoğunlukla kalıcı olmuyor.' },

  { terim:'Kalori fazlası', ingilizce:'Caloric surplus', kategori:'beslenme',
    tanim:'Alınan enerjinin harcanandan fazla olduğu durumdur. Kas kütlesi kazanmayı hedefleyen dönemlerde kullanılır. Fazlanın büyüklüğü arttıkça kazanılan ağırlıkta yağ oranı da artar.',
    ornek:'Kas kazanmak için küçük bir kalori fazlası çoğunlukla yeterlidir.' },

  { terim:'Bakım kalorisi', ingilizce:'Maintenance calories', kategori:'beslenme',
    tanim:'Vücut ağırlığının sabit kaldığı günlük enerji miktarıdır. Açık ve fazla hesapları bu değerin etrafında kurulur. Aktivite düzeyi değiştikçe bu değer de değişir.',
    ornek:'Bakım kalorini bulmak için iki hafta boyunca alımını ve kilonu birlikte takip et.' },

  { terim:'Öğün zamanlaması', ingilizce:'Meal timing', kategori:'beslenme',
    tanim:'Öğünlerin gün içinde ve antrenmana göre nasıl dağıtıldığını anlatır. Toplam alım sabitken zamanlamanın etkisi sınırlıdır; asıl fark antrenman etrafındaki öğünlerde görülür. Sindirim rahatlığı çoğu kişi için belirleyici ölçüttür.',
    ornek:'Antrenmandan hemen önce ağır bir öğün yeme, iki saat pay bırak.' },

  { terim:'Antrenman sonrası beslenme', ingilizce:'Post-workout nutrition', kategori:'beslenme',
    tanim:'Antrenmandan sonraki saatlerde protein ve karbonhidrat alımını konu alan başlıktır. Bir zamanlar sanıldığı kadar dar bir zaman penceresi olmadığı bugün genel kabul görür. Günlük toplam alım, zamanlamadan daha belirleyicidir.',
    ornek:'Antrenman sonrası öğünü yetiştiremiyorsan panik yapma, günlük toplama bak.' },

  { terim:'Karbonhidrat yükleme', ingilizce:'Carb loading', kategori:'beslenme',
    tanim:'Uzun mesafe yarışlarından önceki günlerde karbonhidrat alımının artırılarak glikojen depolarının doldurulmasıdır. Doksan dakikadan uzun süren yarışlarda anlamlı kabul edilir. Yarış günü denenmemiş bir uygulamayı ilk kez yapmak risklidir.',
    ornek:'Karbonhidrat yüklemeyi yarıştan önce bir antrenmanda dene.' },

  { terim:'Hidrasyon', ingilizce:'Hydration', kategori:'beslenme',
    tanim:'Vücuttaki sıvı dengesinin korunmasıdır. Terleme yoluyla kaybedilen sıvı yerine konmadığında performans ve ısı dengesi olumsuz etkilenir. Susama hissi tek başına yeterli bir gösterge değildir.',
    ornek:'Uzun antrenmanlarda hidrasyonu düzenli yudumlarla sürdür, sonuna bırakma.' },

  { terim:'Elektrolit', ingilizce:'Electrolytes', kategori:'beslenme',
    tanim:'Sodyum, potasyum ve magnezyum gibi, sinir iletimi ve kas kasılmasında görev alan minerallerdir. Uzun ve terli antrenmanlarda kayıpları artar. Sıcakta yapılan uzun çalışmalarda yalnız su almak yeterli olmayabilir.',
    ornek:'Yaz aylarında uzun koşularda suya elektrolit eklemek işini kolaylaştırır.' },

  { terim:'Kreatin', ingilizce:'Creatine', kategori:'beslenme',
    tanim:'Kaslarda kısa süreli yüksek şiddetli iş için enerji sağlayan doğal bir bileşiktir. Takviye olarak en çok araştırılmış maddelerden biridir. Kullanmadan önce bir hekime ya da diyetisyene danışmak gerekir.',
    ornek:'Kreatin kullanmayı düşünüyorsan önce bir uzmana danış.' },

  { terim:'Kafein', ingilizce:'Caffeine', kategori:'beslenme',
    tanim:'Uyanıklığı artıran ve algılanan zorluğu düşürebilen uyarıcıdır. Etkisi kişiden kişiye belirgin biçimde değişir. Geç saatte alındığında uykuyu bozarak toparlanmayı olumsuz etkileyebilir.',
    ornek:'Akşam antrenmanından önce kafein alırsan uykun bölünebilir.' },

  { terim:'Takviye', ingilizce:'Supplement', kategori:'beslenme',
    tanim:'Beslenmeyi tamamlamak amacıyla kullanılan ürünlerin genel adıdır. Temel beslenme, uyku ve antrenman düzeni oturmadan takviyenin katkısı sınırlıdır. Kullanım kararı bir hekime ya da diyetisyene danışılarak verilmelidir.',
    ornek:'Takviye listeni uzatmadan önce uykunu ve öğün düzenini gözden geçir.' },

  { terim:'Uyku', ingilizce:'Sleep', kategori:'beslenme',
    tanim:'Toparlanmanın en belirleyici tek değişkenidir. Hormon salınımı, doku onarımı ve öğrenmenin pekişmesi büyük ölçüde uyku sırasında gerçekleşir. Süre kadar düzenli saatlerde uyunması da önemlidir.',
    ornek:'Antrenman planından önce uyku saatlerini düzene sok.' },

  { terim:'Aktif toparlanma', ingilizce:'Active recovery', kategori:'beslenme',
    tanim:'Çok düşük şiddette yapılan hareketle geçirilen dinlenme biçimidir. Yürüyüş, hafif bisiklet ve kolay yüzme bu kapsamdadır. Tam durmaya göre kan akışını sürdürerek kendini daha iyi hissettirebilir.',
    ornek:'Ağır bacak gününün ertesinde yirmi dakikalık yürüyüş aktif toparlanmadır.' },

  { terim:'Dinlenme günü', ingilizce:'Rest day', kategori:'beslenme',
    tanim:'Planlı antrenmanın yapılmadığı gündür. Gelişimin ortaya çıktığı süreç bu günlerde tamamlanır. Programın atlanabilir bir parçası değil, tasarlanmış bir parçasıdır.',
    ornek:'Dinlenme gününü de takvime yaz, boş bırakma.' },

  { terim:'Vücut kompozisyonu', ingilizce:'Body composition', kategori:'beslenme',
    tanim:'Vücut ağırlığının yağ ve yağsız doku olarak dağılımıdır. Tartıdaki tek sayının anlatmadığı değişimi gösterir. Ölçüm yöntemlerinin hata payı yüksek olduğu için eğilim tek ölçümden daha anlamlıdır.',
    ornek:'Kilon sabit kalsa da vücut kompozisyonun değişmiş olabilir.' },

  { terim:'Yağsız kütle', ingilizce:'Lean body mass', kategori:'beslenme',
    tanim:'Vücut ağırlığının yağ dışında kalan bölümüdür: kas, kemik, organlar ve su. Kuvvet antrenmanı ve yeterli protein bu bölümün korunmasına yardım eder. Kilo verme dönemlerinde korunması hedeflenen değer budur.',
    ornek:'Kalori açığındayken yağsız kütleyi korumak için kuvvet çalışmasını bırakma.' }
  ]);

  /* ===== 10 · YARALANMA VE GÜVENLİK =====
     Tanımlar bilgilendirme amaçlıdır, tanı koymaz. Ağrı sürüyorsa
     hekime ya da fizyoterapiste başvurmak gerekir. */
  ekle([
  { terim:'Burkulma', ingilizce:'Sprain', kategori:'guvenlik',
    tanim:'Eklemi bağlayan bağ dokusunun aşırı gerilmesi ya da yırtılmasıdır. En sık ayak bileğinde görülür ve şişlik ile hareket kısıtlılığı eşlik edebilir. Şiddeti değişken olduğundan değerlendirmeyi bir sağlık uzmanının yapması gerekir.',
    ornek:'Ayak bileğin burkulduysa yüklenmeden önce bir uzmana görün.',
    karistirilanlar:{ slug:'zorlanma', not:'Burkulma bağ dokusunu, zorlanma ise kas ya da kirişi ilgilendirir.' } },

  { terim:'Zorlanma', ingilizce:'Strain', kategori:'guvenlik',
    tanim:'Kas ya da kirişin kapasitesinin üzerinde gerilmesi sonucu ortaya çıkan yaralanmadır. Sprint sırasında arka uylukta ve ani kaldırışlarda bel bölgesinde sık görülür. Ani başlayan keskin ağrı tipik belirtisidir.',
    ornek:'Isınmadan sprint atmak arka uylukta zorlanma riskini artırır.',
    kas:'hamstring' },

  { terim:'Tendinopati', ingilizce:'Tendinopathy', kategori:'guvenlik',
    tanim:'Kirişte tekrarlayan yüklenme sonucu gelişen ağrı ve işlev kaybı durumudur. Genellikle sinsi başlar ve önce yalnız aktivite sonrasında hissedilir. Tedavisinde kademeli yükleme öne çıkar; tam istirahat çoğunlukla önerilmez.',
    ornek:'Kirişte üç haftadır süren ağrı için bir fizyoterapistten değerlendirme al.' },

  { terim:'Aşil tendinopatisi', ingilizce:'Achilles tendinopathy', kategori:'guvenlik',
    tanim:'Topuk ile baldır kaslarını bağlayan aşil kirişinde ağrı ve tutukluk ile seyreden durumdur. Sabah ilk adımlarda belirginleşmesi tipiktir. Koşu hacminin hızlı artırılması bilinen risk etkenlerindendir.',
    ornek:'Haftalık koşu mesafeni yüzde on kuralının üzerinde artırma.',
    kas:'gastrocnemius' },

  { terim:'Tenisçi dirseği', ingilizce:'Lateral epicondylitis', kategori:'guvenlik',
    tanim:'Dirseğin dış yüzünde, bileği yukarı kaldıran kasların kirişinde gelişen ağrılı durumdur. Tenisle sınırlı değildir; kavrama ve bilek kullanımı yoğun her işte görülebilir. Kavrama gerektiren hareketlerde ağrının artması tipiktir.',
    ornek:'Dirsek dışında ağrı varsa kavrama biçimini ve yükü gözden geçir.',
    kas:'on-kol-ekstansor' },

  { terim:'Plantar fasiit', ingilizce:'Plantar fasciitis', kategori:'guvenlik',
    tanim:'Ayak tabanındaki bağ dokusunun topuğa yapıştığı bölgede ağrıyla seyreden durumdur. Sabah yataktan kalkarken atılan ilk adımlarda belirginleşir. Koşu yüzeyi, ayakkabı ve hacim artışı sık sorgulanan etkenlerdir.',
    ornek:'Sabah ilk adımda topuk ağrısı varsa koşu hacmini ve ayakkabını gözden geçir.',
    kas:'soleus' },

  { terim:'Kaval kemiği ağrısı', ingilizce:'Shin splints', kategori:'guvenlik',
    tanim:'Kaval kemiğinin iç ya da ön yüzü boyunca hissedilen, koşuyla artan ağrıdır. Genellikle hacmin ya da zemin sertliğinin hızla değişmesiyle ilişkilendirilir. Süren ağrıda stres kırığı ayrımı için hekime başvurmak gerekir.',
    ornek:'Kaval ağrısı başladığında koşu hacmini azalt ve zemini yumuşat.',
    kas:'tibialis-on' },

  { terim:'Omuz sıkışması', ingilizce:'Shoulder impingement', kategori:'guvenlik',
    tanim:'Kolu yana ve yukarı kaldırırken omuz içindeki dokuların sıkışması sonucu ağrı hissedilmesidir. Belirli bir açı aralığında ortaya çıkması tipiktir. Kürek kemiği kontrolü ve rotator manşet çalışması değerlendirmenin parçasıdır.',
    ornek:'Yana açma sırasında belirli bir açıda ağrı varsa hareketi zorlama, değerlendirme al.',
    kas:'rotator-manset' },

  { terim:'Ön çapraz bağ yaralanması', ingilizce:'ACL injury', kategori:'guvenlik',
    tanim:'Diz içindeki ön çapraz bağın zorlanması ya da yırtılmasıdır. Ani yön değiştirme, iniş ve temassız burkulmalarda görülür. Dönüş süreci uzundur ve mutlaka bir hekim ile fizyoterapistin yönetiminde yürütülür.',
    ornek:'İnişte dizin içeri kaymasını azaltan çalışmalar önleyici programların parçasıdır.',
    kas:'quadriceps' },

  { terim:'Bel ağrısı', ingilizce:'Low back pain', kategori:'guvenlik',
    tanim:'Bel bölgesinde hissedilen, çok sayıda farklı nedeni olabilen yaygın bir şikâyettir. Çoğu durumda ciddi bir yapısal hasara işaret etmez ve hareketle iyileşir. Bacağa yayılan uyuşma ya da güç kaybı varsa gecikmeden hekime başvurulmalıdır.',
    ornek:'Bel ağrısında tamamen hareketsiz kalmak çoğunlukla iyileşmeyi geciktirir.',
    kas:'erector-spinae' },

  { terim:'Kramp', ingilizce:'Muscle cramp', kategori:'guvenlik',
    tanim:'Kasın istem dışı ve ağrılı biçimde kasılı kalmasıdır. Yorgunluk, sıvı ve elektrolit kaybı ile ilişkilendirilir ama tek bir nedeni kesin biçimde gösterilmiş değildir. Kasın nazikçe gerilmesi çoğunlukla rahatlama sağlar.',
    ornek:'Baldırda kramp girdiğinde ayak ucunu kendine doğru çekerek nazikçe ger.',
    kas:'gastrocnemius' },

  { terim:'Şişlik', ingilizce:'Swelling', kategori:'guvenlik',
    tanim:'Yaralanan bölgede sıvı birikmesiyle ortaya çıkan hacim artışıdır. İyileşme sürecinin doğal bir parçasıdır ama aşırısı hareketi kısıtlar. Ani başlayan, hızlı büyüyen ya da geçmeyen şişlik hekim değerlendirmesi gerektirir.',
    ornek:'Burkulmadan sonraki ilk saatlerde şişliği kontrol altında tutmak konforu artırır.' },

  { terim:'Aşırı kullanım yaralanması', ingilizce:'Overuse injury', kategori:'guvenlik',
    tanim:'Tek bir kaza yerine tekrarlayan yüklenmenin birikmesiyle ortaya çıkan yaralanmadır. Genellikle yavaş başlar ve önce yalnız antrenman sonrasında hissedilir. Hacim artışının kademeli olması en etkili önleyici yaklaşımdır.',
    ornek:'Aşırı kullanım yaralanmaları çoğunlukla programın kendisinden değil, artış hızından gelir.' },

  { terim:'Akut yaralanma', ingilizce:'Acute injury', kategori:'guvenlik',
    tanim:'Belirli bir anda, tek bir olayla ortaya çıkan yaralanmadır. Burkulma, zorlanma ve düşmeye bağlı travmalar bu gruptadır. Başlangıcı net olduğu için genellikle hatırlanan bir "an" vardır.',
    ornek:'Akut bir yaralanmadan sonra ağrıyı bastırıp devam etmek yerine değerlendirme al.' },

  { terim:'RICE ilkesi', ingilizce:'RICE protocol', kategori:'guvenlik',
    tanim:'Akut yaralanmanın ilk saatlerinde dinlenme, soğuk uygulama, baskı ve yükseltmeyi öneren klasik yaklaşımdır. Günümüzde erken ve kontrollü harekete daha çok yer veren yaklaşımlar öne çıkmıştır. Yine de ilk müdahale çerçevesi olarak yaygın biçimde anılır.',
    ornek:'İlk saatlerde RICE ilkesini uygula, sonrasında bir uzmanın planına geç.' },

  { terim:'Rehabilitasyon', ingilizce:'Rehabilitation', kategori:'guvenlik',
    tanim:'Yaralanma sonrasında işlevin kademeli olarak geri kazanılması sürecidir. Ağrının geçmesi sürecin bittiği anlamına gelmez; yükün eski düzeye çıkması gerekir. Plan bir fizyoterapist tarafından kişiye göre yazılır.',
    ornek:'Rehabilitasyonda ağrı kesildi diye eski yüke bir anda dönme.' },

  { terim:'Fizyoterapi', ingilizce:'Physiotherapy', kategori:'guvenlik',
    tanim:'Hareket ve egzersiz temelli değerlendirme ve tedavi alanıdır. Yaralanma sonrası dönüşün yanında ağrının yönetiminde ve önleyici programlarda da rol alır. Değerlendirme kişiye özel yapıldığı için genel tarifler onun yerini tutmaz.',
    ornek:'Süren bir ağrın varsa internetteki genel programlar yerine fizyoterapi değerlendirmesi al.' },

  { terim:'Uyarı işaretleri', ingilizce:'Red flags', kategori:'guvenlik',
    tanim:'Kendi başına yönetilmemesi gereken, hekime başvurmayı gerektiren belirtilerdir. Gece artan ağrı, açıklanamayan kilo kaybı, ateş, güç kaybı ve his kaybı bu kapsamdadır. Bu belirtilerde antrenmanı sürdürmek yerine değerlendirme almak gerekir.',
    ornek:'Bacakta güç kaybı ya da uyuşma varsa antrenmanı durdur ve hekime başvur.' },

  { terim:'Nötr omurga', ingilizce:'Neutral spine', kategori:'guvenlik',
    tanim:'Omurganın doğal eğriliklerinin korunduğu, aşırı yuvarlanma ya da aşırı çukurlaşma olmayan konumdur. Ağır kaldırışlarda yükün omurga boyunca daha dengeli dağılmasına yardım eder. Tek bir milimetrik konum değil, kişiye göre bir aralıktır.',
    ornek:'Ölü kaldırışta nötr omurgayı koruyamıyorsan yükü düşür.',
    kas:'erector-spinae' },

  { terim:'Yük artış kuralı', ingilizce:'Load progression rule', kategori:'guvenlik',
    tanim:'Antrenman yükünün haftadan haftaya makul bir oranda artırılmasını öneren pratik yaklaşımdır. Koşuda sık anılan yüzde on kuralı bunun bilinen örneğidir. Kesin bir eşik olmasa da ani sıçramaların riski artırdığı genel kabul görür.',
    ornek:'Haftalık hacmi bir anda ikiye katlamak yerine yük artış kuralına sadık kal.' },

  { terim:'Eklem sesi', ingilizce:'Crepitus', kategori:'guvenlik',
    tanim:'Eklem hareket ederken duyulan çıtırtı ya da sürtünme sesidir. Ağrı, şişlik ya da kilitlenme eşlik etmiyorsa çoğunlukla önemsiz kabul edilir. Sesle birlikte ağrı varsa değerlendirme gerekir.',
    ornek:'Çömelirken dizden ses geliyor ama ağrı yoksa genellikle sorun değildir.' }
  ]);

  /* =====================================================================
     TÜRETİLEN ALANLAR VE DİZİNLER
     `harf` ve `slug` elle yazılmaz: ikisi de `terim`den üretilir. Böylece
     "karşılıksız harf" ile "kırık slug" ihtimali veri girişinden değil,
     tek bir fonksiyondan çıkar. Slug çakışması olursa sonuna sayı eklenir
     ve konsola uyarı düşer (sessizce ezmez).
     ===================================================================== */
  var gorulen = {};
  TERIMLER.forEach(function (t) {
    t.harf = buyuk(t.terim.charAt(0));
    /* künye — kaynak dil tabloda yoksa terim Türkçedir; okunuş yalnız
       tabloda yazanlarda basılır. Elle kayıt başına yazılmaz. */
    t.kunye = { dil: KAYNAK_DIL[slugla(t.terim)] || 'Türkçe',
                okunus: OKUNUS[slugla(t.terim)] || '' };
    var s = slugla(t.terim), n = 1;
    while (gorulen[s]) { n++; s = slugla(t.terim) + '-' + n; }
    gorulen[s] = true;
    t.slug = s;
  });

  /* Türkçe sıralama — "Ç" C'den sonra, "İ" I'dan sonra gelsin diye
     tarayıcının tr harmanlaması kullanılır. */
  function karsilastir(a, b) { return String(a).localeCompare(String(b), 'tr'); }
  TERIMLER.sort(function (a, b) { return karsilastir(a.terim, b.terim); });

  /* kategori başına adet — kategori seçicideki sayılar buradan okunur */
  var katSayi = {};
  TERIMLER.forEach(function (t) { katSayi[t.kategori] = (katSayi[t.kategori] || 0) + 1; });
  KATEGORILER.forEach(function (k) { k.adet = katSayi[k.id] || 0; });

  /* harf başına adet — harf rayındaki "karşılıksız harf" buradan anlaşılır */
  var harfSayi = {};
  TERIMLER.forEach(function (t) { harfSayi[t.harf] = (harfSayi[t.harf] || 0) + 1; });

  var slugDizin = {};
  TERIMLER.forEach(function (t) { slugDizin[t.slug] = t; });

  /* Hareket adları — egzersiz-kutuphane-v1.html'deki kartların `data-name`
     değerlerinden BİREBİR alındı, uydurulmadı. Köprü kartında "Kütüphanede
     aç" yerine hareketin gerçek adı yazsın diye var. */
  var HAREKET_ADI = {
    'goblet-squat':'Goblet Squat',
    'plank':'Plank (Şınav Duruşu)',
    'dambil-kurek':'Dambıl Kürek Çekme',
    'sinav':'Şınav (Push-up)',
    'hamle':'Hamle (Lunge)',
    'dead-bug':'Dead Bug (Ölü Böcek)',
    'kettlebell-swing':'Kettlebell Swing',
    'kopru':'Köprü (Glute Bridge)',
    'bant-cekme':'Bant Çekme (Band Row)',
    'bant-yana-acma':'Bant Yana Açma',
    'dambil-biceps':'Dambıl Biceps Curl',
    'dambil-omuz-press':'Dambıl Omuz Press'
  };

  /* Kas adları — SÖZLÜĞÜN KENDİ anatomi terimlerinden türetiliyor, yeni ad
     uydurulmuyor. H2'nin anatomi sayfası kendi adlandırmasını getirene kadar
     köprü etiketi buradan okunuyor; karşılığı olmayan slug'da boş döner ve
     genel metin kullanılır. */
  /* Kas köprüsü etiketleri — H2'nin sabitlediği 27 slug'ın Türkçe karşılığı.
     Adların çoğu bu sözlüğün kendi `anatomi` başlıklarıyla birebir aynı;
     kendi başlığı olmayan alt bölgeler (ön deltoid, orta-alt trapez, ön kol
     açıcıları) slug'ın düz Türkçe okunuşudur. Yeni bir veri üretilmiyor,
     yalnız köprü kartında "Kas haritasında aç" yerine kasın adı yazıyor.
     H2 kendi adlandırmasını getirdiğinde bu tablo onunla hizalanmalı. */
  var kasAdlari = {
    /* KAYNAK: assets/js/anatomi-veri.js — kanonik ad oradaki panel
       başlığıdır (H2, Muscle.pdf'ten çıkarıldı). Burada o başlığın
       parantez öncesi ANA ADI kullanılıyor: köprü etiketi ile
       vardığı panelin başlığı aynı şeyi söylesin diye. Anatomi
       verisi değişirse burası da güncellenir. */
    'boyun':'Boyun',
    'trapez-ust':'Üst Trapez',
    'trapez-orta-alt':'Orta ve Alt Trapez',
    'deltoid-on':'Ön Deltoid',
    'deltoid-yan':'Yan Deltoid',
    'deltoid-arka':'Arka Deltoid',
    'gogus':'Göğüs',
    'serratus':'Ön Dişli Kas',
    'latissimus':'Geniş Sırt Kası',
    'romboid':'Romboid Kaslar',
    'rotator-manset':'Rotator Manşet',
    'biceps':'Biceps',
    'triceps':'Triceps',
    'on-kol-fleksor':'Ön Kol Bükücüleri',
    'on-kol-ekstansor':'Ön Kol Açıcıları',
    'karin-duz':'Düz Karın Kası',
    'karin-yan':'Yan Karın Kasları',
    'erector-spinae':'Bel ve Sırt Dikleştiricileri',
    'kalca-fleksor':'Kalça Bükücü',
    'gluteus-maximus':'Büyük Kalça Kası',
    'gluteus-medius':'Orta Kalça Kası',
    'adduktor':'İç Uyluk Kasları',
    'quadriceps':'Dört Başlı Uyluk Kası',
    'hamstring':'Arka Uyluk Kasları',
    'gastrocnemius':'İkiz Baldır Kası',
    'soleus':'Nalımsı Kas',
    'tibialis-on':'Ön Baldır Kası'
  };

  /* arama için sadeleştirilmiş metin — büyük/küçük ve Türkçe harf farkını
     yok sayar ki "izometrik" araması "İzometrik"i bulsun */
  function sadele(s) {
    return String(s).split('').map(function (c) { return CEVIR[c] !== undefined ? CEVIR[c] : c; })
      .join('').toLowerCase();
  }
  TERIMLER.forEach(function (t) {
    t._ara = sadele([t.terim, t.ingilizce, t.tanim, t.ornek].join(' '));
  });

  global.SOZLUK = {
    TERIMLER: TERIMLER,
    KATEGORILER: KATEGORILER,
    ALFABE: ALFABE,
    harfSayi: harfSayi,
    slugla: slugla,
    sadele: sadele,
    karsilastir: karsilastir,
    bul: function (slug) { return slugDizin[slug] || null; },
    kategori: function (id) {
      for (var i = 0; i < KATEGORILER.length; i++) if (KATEGORILER[i].id === id) return KATEGORILER[i];
      return null;
    },
    /* aynı kategoriden, kendisi hariç, en fazla n terim */
    aile: function (t, n) {
      return TERIMLER.filter(function (x) { return x.kategori === t.kategori && x.slug !== t.slug; }).slice(0, n || 6);
    },
    /* alfabetik komşular — detay sayfasının önceki/sonraki gezinmesi */
    komsu: function (t) {
      var i = TERIMLER.indexOf(t);
      return {
        onceki: i > 0 ? TERIMLER[i - 1] : TERIMLER[TERIMLER.length - 1],
        sonraki: i < TERIMLER.length - 1 ? TERIMLER[i + 1] : TERIMLER[0]
      };
    },
    /* köprü adresleri tek yerde kurulur ki iki sayfa aynı yere gitsin */
    /* Sık aranan sorular — kategori kalıbı terimin adıyla doldurulur */
    aramalar: function (t) {
      var k = ARAMA_KALIP[t.kategori] || ARAMA_KALIP['metodoloji'];
      var ad = t.terim.toLocaleLowerCase('tr');
      return k.map(function (x) { return x.replace('{t}', ad); });
    },
    /* Künye satırları — boş alan hiç basılmaz.
       Anatomi kategorisinde `ingilizce` alanı zaten bilimsel/anatomik ad
       olduğu için satırın etiketi ona göre değişiyor. */
    kunyeSatirlari: function (t) {
      var k = this.kategori(t.kategori);
      var r = [
        { k:'Kategori',  v: k ? k.ad : '' },
        { k:'Harf',      v: t.harf },
        { k:'Kaynak dil', v: t.kunye.dil },
        { k: t.kategori === 'anatomi' ? 'Anatomik ad' : 'İngilizce karşılık', v: t.ingilizce }
      ];
      if (t.kunye.okunus) r.push({ k:'Okunuş', v: t.kunye.okunus });
      return r.filter(function (x) { return x.v; });
    },
    hareketAdres: function (slug) { return 'egzersiz-detay-v1.html?slug=' + slug; },
    hareketAdi:   function (slug) { return HAREKET_ADI[slug] || ''; },
    kasAdres: function (slug) { return 'anatomi-v1.html?kas=' + slug; },
    kasAdi:   function (slug) { return kasAdlari[slug] || ''; },
    terimAdres: function (slug) { return 'sozluk-detay-v1.html?slug=' + slug; }
  };
})(window);
