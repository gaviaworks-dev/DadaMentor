/* =====================================================================
   DADAFIT — ANATOMİ / KAS HARİTASI VERİSİ                (H2 · 6. oturum)
   ---------------------------------------------------------------------
   KAYNAK — TEK KAYNAK, UYDURMA YOK
   Frédéric Delavier, "Krachttraining — Een anatomische benadering"
   (özgün adı: Guide des mouvements de musculation, © 1998 Éditions Vigot;
   Hollandaca baskı © 2001 Forte Uitgevers, ISBN 90 5877 061 3).
   Yerel dosya: ~/Desktop/Dada Fit Sources/Muscle.pdf — 136 sayfa, metin
   katmanı YOK (Acrobat Image Conversion ile taranmış), bu yüzden veri
   sayfa rasterleri GÖZLE okunarak çıkarıldı.

   Gözle incelenen sayfalar (PDF sayfa no · kitap sayfa no):
     s.1   kapak
     s.4   TAM ARKA PLATE — Latince etiketli yüzeysel arka anatomi
     s.5   TAM ÖN PLATE  — Latince etiketli yüzeysel ön anatomi
     s.6   künye · s.7 içindekiler (III) · s.8 önsöz (IV)
     s.9   (kitap 1)  bölüm 1 açılışı — kol plate'i
     s.11  (kitap 3)  concentration curl — M. BRACHIALIS iskelet ineti
     s.31  (kitap 23) bölüm 2 açılışı — omuz ön/arka derin plate
     s.46  (kitap 38) upright row — trapezius superior/medialis/inferior +
                      deltoideus anterior/medialis/posterior ayrımı
     s.49  (kitap 41) bölüm 3 açılışı — göğüs
     s.63  (kitap 55) dumbell pullover — SEROTUS/scapula fiksatörleri ineti
                      (levator scapulae · rhomboideus minor/major ·
                       pectoralis minor · serratus anterior)
     s.65  (kitap 57) bölüm 4 açılışı — sırt derin plate
     s.79  (kitap 71) deadlift — yüzeysel + DERİN arka plate (rotator
                      manşet: supraspinatus · infraspinatus · teres minor ·
                      subscapularis; erector spinae: iliocostalis ·
                      spinalis) — ayrıca kadın figür referansı
     s.86  (kitap 78) bölüm 5 açılışı — bacak ön/arka derin plate
     s.106 (kitap 98) bölüm 6 açılışı — kalça yan + arka plate
     s.116 (kitap 108) bölüm 7 açılışı — karın
     s.117 (kitap 109) OPPERVLAKKIGE / DIEPE BUIKSPIEREN — yüzeysel ve
                      derin karın plate'leri
     s.120 (kitap 112) crunches — ön gövde plate'i + karın enine kesiti
                      (erector spinae · quadratus lumborum · transversus)
     s.126 (kitap 118) reverse crunches — kalça/bacak arka zincir

   TELİF SINIRI: PDF'in ANATOMİK VERİSİ kullanıldı. Kitabın çizimleri,
   düzeni ve metni kopyalanmadı; `assets/svg/govde-*.svg` DadaFit'in kendi
   çizimidir. MuscleWiki'nin görseli/videosu/metni kullanılmadı.

   DÜRÜSTLÜK NOTU: plate'ler kökeni/yapışmayı KEMİK ETİKETİYLE gösteriyor
   (ör. "Radius", "Tuberositas tibiae", "Symphysis pubica"). Plate'in
   adlandırmadığı bir tutunma noktası varsa alanda açıkça
   "PDF plate'i … adlandırmıyor" yazıyor — sahte veri yazılmadı.
   ===================================================================== */
(function (global) {
  'use strict';

  /* Ekipman etiketleri H1'in sözlük LİSTE sayfasına bağlanır.
     `sozluk-detay-v1.html?slug=` UYDURULMAZ — terim slug'ları H1'in
     branch'inde, birleştirmeden önce bilinmiyor. */
  var SOZLUK = 'sozluk-v1.html';

  var KASLAR = {

    /* ==================== ÖN GÖRÜNÜM ==================== */

    'boyun': {
      ad: 'Boyun (Baş çevirici)',
      latin: 'Musculus sternocleidomastoideus · Mm. scaleni',
      gorunum: 'on',
      bolge: 'Boyun ve baş',
      fonksiyon: 'Sternocleidomastoideus boynun iki yanında köprücük kemiğinden kulak arkasına uzanan çift karınlı yüzeysel kastır. Tek taraflı kasıldığında başı karşı tarafa döndürür ve aynı tarafa yatırır; iki taraflı kasıldığında başı öne eğer, sırtüstü yatarken başı yerden kaldırır. Yanında yer alan scalenus grubu ilk iki kaburgayı yukarı çekerek derin nefes almaya katılır ve boyun omurgasını yandan sabitler.',
      koken: 'Sternum (manubrium) ve clavicula\'nın iç ucu — her iki kemik de ön plate\'te adıyla etiketli (PDF s. 5).',
      yapisma: 'Processus mastoideus, yani kulak arkasındaki çıkıntı — arka plate\'te "Mastoideus" olarak etiketli (PDF s. 65).',
      komsu: ['trapez-ust', 'deltoid-on', 'romboid'],
      hareketler: ['dambil-kurek', 'plank'],
      ekipman: ['Dambıl', 'Mat', 'Ekipmansız'],
      guvenlik: 'Boyun kasları yük kaldırmak için değil, başı taşımak için tasarlanmıştır. Kürek çekerken ya da plank\'ta çeneyi öne uzatıp boynu geriye kırma; kulak–omuz hizasını koru. Ağırlıkla doğrudan boyun çalıştırmak prototip kapsamı dışıdır.',
      kaynak: 'PDF s. 5 · 31 · 46 · 65'
    },

    'trapez-ust': {
      ad: 'Üst Trapez (Kukuleta kası, üst lif)',
      latin: 'Musculus trapezius, pars descendens (superior)',
      gorunum: 'arka',
      bolge: 'Omuz kuşağı',
      fonksiyon: 'Trapez, ense çukurundan bel omurlarına inen ve iki yanda kürek kemiğine tutunan büyük eşkenar dörtgen kastır. Delavier plate\'i onu üç lif takımına ayırıyor: superior, medialis, inferior. Üst lifler omzu yukarı çeker (silkme hareketi), kolu baş üstüne kaldırırken kürek kemiğini yukarı döndürür ve baş yana eğilirken boyun omurgasını dengeler.',
      koken: 'Kafatası arkasındaki occipital kemik ve boyun omurlarının dikensi çıkıntıları — plate\'te "Vertebra cervicalis VII (processus spinosus)" olarak işaretli (PDF s. 4).',
      yapisma: 'Clavicula\'nın dış üçte biri ve acromion — ikisi de omuz plate\'inde adıyla etiketli (PDF s. 31 · 46).',
      komsu: ['boyun', 'deltoid-yan', 'romboid', 'trapez-orta-alt'],
      hareketler: ['dambil-omuz-press', 'dambil-kurek', 'bant-cekme'],
      ekipman: ['Dambıl', 'Direnç bandı'],
      guvenlik: 'Masa başı hayatında üst trapez zaten kısalmış ve aşırı çalışıyor olur. Omuz pres ve kürek çekmede omuzları kulağa doğru kaldırıp asma; kürek kemiklerini önce aşağı-geri yerleştir, sonra çek.',
      kaynak: 'PDF s. 4 · 31 · 46 · 65'
    },

    'deltoid-on': {
      ad: 'Ön Deltoid (Omuz ön lifi)',
      latin: 'Musculus deltoideus, pars clavicularis (anterior)',
      gorunum: 'on',
      bolge: 'Omuz kuşağı',
      fonksiyon: 'Deltoid omuz eklemini üç yönden saran kapak biçimli kastır; Delavier plate\'i anterior, medialis ve posterior olarak üç lif takımı gösteriyor. Ön lif kolu öne ve yukarı kaldırır (fleksiyon), kolu gövdeye doğru içe döndürür ve göğüs kası ile birlikte itme hareketlerine katılır. Şınav ve omuz presinde yükün ilk yönlendiricisidir.',
      koken: 'Clavicula\'nın dış üçte biri — omuz plate\'inde "Clavicula" etiketiyle deltoideus anterior\'un hemen üstünde (PDF s. 31 · 46).',
      yapisma: 'Humerus\'un dış yüzündeki deltoid çıkıntısı — plate humerus\'u adlandırıyor, çıkıntının kendi adını vermiyor (PDF s. 31).',
      komsu: ['deltoid-yan', 'gogus', 'biceps', 'trapez-ust'],
      hareketler: ['dambil-omuz-press', 'sinav', 'plank'],
      ekipman: ['Dambıl', 'Direnç bandı', 'Ekipmansız'],
      guvenlik: 'Ön deltoid itme hareketlerinde zaten çok iş alır; arka lif ihmal edilirse omuz öne yuvarlanır. Presi ense arkasına indirme, dirseği gövdeden 90°\'den fazla açma.',
      kaynak: 'PDF s. 5 · 31 · 46'
    },

    'deltoid-yan': {
      ad: 'Yan Deltoid (Omuz orta lifi)',
      latin: 'Musculus deltoideus, pars acromialis (medialis)',
      gorunum: 'on',
      bolge: 'Omuz kuşağı',
      fonksiyon: 'Deltoidin orta lifi kolu gövdeden yana açar (abdüksiyon) ve omuza yuvarlak genişliğini veren liftir. Kolu yatay düzleme kadar taşıyan asıl kas budur; ilk 15°\'de supraspinatus ile, 90° üzerinde trapez ve serratus\'un kürek kemiğini döndürmesiyle birlikte çalışır.',
      koken: 'Acromion, yani kürek kemiğinin omuz ucu — omuz plate\'inde "Acromion" olarak etiketli (PDF s. 31 · 46).',
      yapisma: 'Humerus\'un dış yüzü, ön ve arka liflerle ortak tutunma alanı (PDF s. 31).',
      komsu: ['deltoid-on', 'deltoid-arka', 'trapez-ust', 'rotator-manset'],
      hareketler: ['dambil-omuz-press', 'bant-yana-acma'],
      ekipman: ['Dambıl', 'Direnç bandı'],
      guvenlik: 'Yana açarken kolu omuz hizasının belirgin üstüne çıkarmak ve baş parmağı aşağı çevirmek sıkışma yaratır. Hafif yükle, dirsek hafif bükülü, başparmak yukarı bakacak şekilde çalış.',
      kaynak: 'PDF s. 5 · 31 · 46'
    },

    'gogus': {
      ad: 'Göğüs (Büyük göğüs kası)',
      latin: 'Musculus pectoralis major',
      gorunum: 'on',
      bolge: 'Göğüs',
      fonksiyon: 'Göğüs kafesinin ön yüzünü yelpaze gibi kaplayan, köprücük kemiği ve göğüs kemiğinden başlayıp kol kemiğine tek bir tendonla toplanan büyük kastır. Kolu gövdeye doğru içeri toplar (addüksiyon), öne iter ve içe döndürür. Delavier ön plate\'i onu iki lif takımıyla gösteriyor: clavicular (üst) ve sternocostal/abdominal (alt) — plate\'te "Pectoralis major (pars abdominalis)" ayrıca etiketli.',
      koken: 'Clavicula\'nın iç yarısı, sternum ve üst kaburga kıkırdakları — ön karın plate\'inde "Sternum", "Costa", "Ribkraakbeen" (kaburga kıkırdağı) etiketleriyle (PDF s. 5 · 117 · 120).',
      yapisma: 'Humerus\'un üst dış kenarı, deltoid tutunmasının hemen içinde (PDF s. 31).',
      komsu: ['gogus-ust', 'deltoid-on', 'serratus', 'karin-duz'],
      hareketler: ['sinav', 'dambil-omuz-press'],
      ekipman: ['Ekipmansız', 'Dambıl', 'Mat'],
      guvenlik: 'Şınavda göğsü çok derine indirip omuz başını öne kaydırmak kapsül ve rotator manşeti zorlar. Kürek kemiklerini geride tut, dirsekleri gövdeye 45° civarında yaklaştır — 90°\'lik "T" duruşu omuza yüklenir.',
      kaynak: 'PDF s. 5 · 31 · 49 · 63 · 120'
    },

    'gogus-ust': {
      ad: 'Üst Göğüs (Büyük göğüs kası, köprücük başı)',
      latin: 'Musculus pectoralis major, pars clavicularis',
      gorunum: 'on',
      bolge: 'Göğüs',
      fonksiyon: 'Büyük göğüs kasının köprücük kemiğinden başlayan üst lif takımıdır. Delavier ön plate\'i pectoralis major\'u tek bir kütle olarak değil, farklı yönde seyreden lif takımlarıyla çiziyor; plate\'te alt takım "Pectoralis major (pars abdominalis)" olarak ayrıca etiketlenmiş, üst takım ise clavicula boyunca yukarı doğru uzanıyor. Üst lifler kolu öne ve YUKARI iter — alt lifler kolu öne ve aşağı çekerken üst lifler omuz hizasının üstündeki itişi üstlenir. Bu yüzden eğik (incline) itiş hareketlerinde payı düz itişe göre belirgin biçimde artar.',
      koken: 'Clavicula\'nın iç (sternuma bakan) yarısı — ön plate\'te "Clavicula" adıyla etiketli (PDF s. 5).',
      yapisma: 'Humerus\'un üst dış kenarında, göğüs kasının ortak tendonunun üst şeridi olarak (PDF s. 31).',
      komsu: ['gogus', 'deltoid-on', 'boyun', 'trapez-ust'],
      hareketler: ['sinav', 'dambil-omuz-press'],
      ekipman: ['Ekipmansız', 'Dambıl', 'Mat'],
      guvenlik: 'Üst göğsü hedefleyen eğik itişlerde eğim açısını abartma; 45°\'nin üstünde yük göğüsten çıkıp ön deltoide geçer ve omuz önü zorlanır. Şınavda ayakları yükseltip aynı etkiyi ararken belin çökmesine izin verme.',
      kaynak: 'PDF s. 5 · 31'
    },

    'serratus': {
      ad: 'Ön Dişli Kas (Kaburga tarağı)',
      latin: 'Musculus serratus anterior',
      gorunum: 'on',
      bolge: 'Göğüs kafesi yan duvarı',
      fonksiyon: 'Kaburgaların yan yüzünden testere dişi gibi çıkıp göğüs kafesini sarar ve kürek kemiğinin iç kenarına, kafesin arkasından tutunur. Kürek kemiğini kaburgaya YAPIŞIK tutar ve öne-yukarı döndürür; bu yüzden kolu baş üstüne kaldırmanın son 60°\'si serratus olmadan tamamlanamaz. Delavier plate\'i serratus\'u levator scapulae, rhomboideus ve pectoralis minor ile birlikte "kürek kemiği fiksatörleri" başlığı altında topluyor.',
      koken: 'İlk sekiz-dokuz kaburganın dış yüzü — fiksatör inetinde "Costa" ve "Ribkraakbeen" etiketleriyle (PDF s. 63).',
      yapisma: 'Scapula\'nın iç (omurgaya bakan) kenarı, kafesin arka yüzünde — inette "Scapula / Serratus anterior" olarak işaretli (PDF s. 63).',
      komsu: ['gogus', 'karin-yan', 'romboid', 'latissimus'],
      hareketler: ['sinav', 'plank'],
      ekipman: ['Ekipmansız', 'Mat'],
      guvenlik: 'Plank ve şınavda kürek kemiklerinin sırtta "kanat" gibi kalkması serratus\'un devrede olmadığını gösterir. Kolları yere itip göğsü hafif yukarı ittir; bel çökmesin.',
      kaynak: 'PDF s. 5 · 55 (PDF s. 63) · 79 · 120'
    },

    'biceps': {
      ad: 'Biceps (İki başlı kol kası)',
      latin: 'Musculus biceps brachii',
      gorunum: 'on',
      bolge: 'Kol',
      fonksiyon: 'Kolun ön yüzündeki iki başlı kas: uzun baş (caput longum) omuz ekleminin üstünden, kısa baş (caput breve) kürek kemiğinin gaga çıkıntısından gelir. Dirseği büker ve — çoğu kişinin gözden kaçırdığı asıl işi — ön kolu dışa döndürür (supinasyon), yani avuç içini yukarı çevirir. Altında yatan brachialis dirsek bükmede biceps\'ten daha güçlüdür ve avuç yönünden bağımsız çalışır; Delavier concentration curl plate\'inde ikisini birlikte gösteriyor.',
      koken: 'Scapula: uzun baş eklem çukurunun üstünden, kısa baş processus coracoideus\'tan — inette "Processus coracoideus", "Scapula", "Acromion" etiketli (PDF s. 11).',
      yapisma: 'Radius\'un üst uç çıkıntısı; inette "Pees van de biceps brachii" (biceps tendonu) → "Radius" olarak izleniyor (PDF s. 11).',
      komsu: ['deltoid-on', 'on-kol-fleksor', 'triceps', 'gogus'],
      hareketler: ['dambil-biceps', 'dambil-kurek', 'bant-cekme'],
      ekipman: ['Dambıl', 'Direnç bandı'],
      guvenlik: 'Curl\'de gövdeyi sallayıp beli hiperekstansiyona sokmak biceps\'ten yükü alır, bele verir. Dirseği gövde yanında sabitle, yükü indirirken tam gerilmeye zorlanmadan kontrollü bırak.',
      kaynak: 'PDF s. 1 (kitap 1) · 3 (PDF s. 11) · 5 · 55 (PDF s. 63)'
    },

    'brachioradialis': {
      ad: 'Brachioradialis (Dirsek altı bükücü)',
      latin: 'Musculus brachioradialis',
      gorunum: 'on',
      bolge: 'Ön kol',
      fonksiyon: 'Kol kemiğinin dış alt ucundan başlayıp ön kolun dış kenarı boyunca bileğe kadar inen, dirseğin hemen altında belirgin bir kabartı yapan uzun kastır. Delavier hem ön hem arka plate\'te adıyla etiketliyor — yani ön koldan bakıldığında da, arkadan bakıldığında da yüzeysel görünür. Dirseği büker; en güçlü olduğu yer avuç içi ne yukarı ne aşağı bakan NÖTR duruştur (çekiç tutuşu). Biceps\'ten farkı budur: biceps avuç yukarıyken, brachioradialis nötr tutuşta baskındır.',
      koken: 'Humerus\'un dış alt kenarı (crista supracondylaris lateralis) — ön plate\'te "Epicondylis lateralis" komşuluğunda etiketli (PDF s. 5).',
      yapisma: 'Radius\'un alt ucu, bileğin başparmak tarafı — arka plate\'te "Radius" ve "Brachioradialis" olarak işaretli (PDF s. 4).',
      komsu: ['biceps', 'on-kol-fleksor', 'on-kol-ekstansor', 'triceps'],
      hareketler: ['ters-sinav', 'bant-cekme'],
      ekipman: ['Direnç bandı', 'Ekipmansız'],
      guvenlik: 'Ön kol kasları küçük ve hızlı yorulur; ağır tutuş gerektiren hareketlerde bileği geriye kırmadan nötr tut. Dirsek dış tarafında yanıcı ağrı (tenisçi dirseği) varsa tutuş çalışmasını artırma, dinlendir ve uzmana danış.',
      kaynak: 'PDF s. 4 · 5'
    },

    'on-kol-fleksor': {
      ad: 'Ön Kol Bükücüleri (İç ön kol)',
      latin: 'Mm. flexor carpi radialis · flexor carpi ulnaris · palmaris longus · flexor digitorum superficialis',
      gorunum: 'on',
      bolge: 'Ön kol',
      fonksiyon: 'Ön kolun avuç tarafındaki kas takımı: bileği avuç yönüne büker, parmakları kapatır ve kavrama gücünü üretir. Kütle olarak küçük olsalar da kürek çekme, kettlebell salınımı ve taşıma hareketlerinde limit çoğu zaman bu kasların dayanıklılığıdır. Delavier bu grubu ön plate\'te tek tek adlandırıyor.',
      koken: 'Humerus\'un iç dirsek çıkıntısı (epicondylus medialis) — arka plate\'te "Epicondylus medialis" olarak etiketli, grubun ortak başlangıç noktası (PDF s. 4).',
      yapisma: 'El bilek kemikleri ve tarak kemikleri — inette "Carpus (handwortelbeentjes)", "Metacarpus", "1e/2e/3e Phalanx" etiketleriyle (PDF s. 11).',
      komsu: ['biceps', 'on-kol-ekstansor'],
      hareketler: ['dambil-biceps', 'kettlebell-swing', 'dambil-kurek'],
      ekipman: ['Dambıl', 'Kettlebell', 'Direnç bandı'],
      guvenlik: 'Bileği aşırı bükerek ağırlık taşımak iç dirsek tendonunu zorlar. Bileği ön kolla aynı hizada nötr tut; kavrama tükendiğinde seti uzatma.',
      kaynak: 'PDF s. 4 · 5 · 3 (PDF s. 11)'
    },

    'karin-duz': {
      ad: 'Düz Karın Kası (Six-pack)',
      latin: 'Musculus rectus abdominis',
      gorunum: 'on',
      bolge: 'Karın ve gövde merkezi',
      fonksiyon: 'Göğüs kemiğinden kasık kemiğine inen, ortada linea alba ile ikiye ayrılan ve enine bağ şeritleriyle bölmelere ayrılmış uzun kas. Gövdeyi öne büker (göğüs kafesini leğen kemiğine yaklaştırır), leğen kemiğini arkaya yatırır ve karın içi basıncını üreterek omurgayı önden destekler. Delavier "yüzeysel karın kasları" plate\'inde onu obliquus externus/internus ve pyramidalis ile birlikte gösteriyor.',
      koken: 'Kasık kemiği birleşimi (symphysis pubica) ve kasık kemiği tepesi — yüzeysel karın plate\'inde "Symphysis pubica" etiketli (PDF s. 117 · 120).',
      yapisma: 'Beşinci–yedinci kaburga kıkırdakları ve göğüs kemiğinin kılıç çıkıntısı — derin karın plate\'inde "Processus xyphoideus", "Costa", "Ribkraakbeen" etiketli (PDF s. 117).',
      komsu: ['karin-yan', 'kalca-fleksor', 'gogus', 'erector-spinae'],
      hareketler: ['plank', 'dead-bug', 'kopru'],
      ekipman: ['Mat', 'Ekipmansız'],
      guvenlik: 'Delavier bu bölümü bir UYARI kutusuyla açıyor (PDF s. 117): bel şikâyeti olanlarda karın çalışırken kalçanın sabitlenmesi şart, çünkü bel kası (psoas) beli içe çukurlaştırıp omur sorunlarına yol açabilir. Karnı gererek değil, kısa mesafede kontrollü çalış; boyun elle çekilmez.',
      kaynak: 'PDF s. 5 · 108 (PDF s. 116) · 109 (PDF s. 117) · 112 (PDF s. 120)'
    },

    'karin-yan': {
      ad: 'Yan Karın Kasları (Oblikler)',
      latin: 'Musculus obliquus externus abdominis · Musculus obliquus internus abdominis',
      gorunum: 'on',
      bolge: 'Karın ve gövde merkezi',
      fonksiyon: 'Karnın yan duvarını iki çapraz katman oluşturur: dış oblik lifleri yukarıdan aşağı-öne, iç oblik lifleri ters yönde uzanır. Birlikte gövdeyi döndürür (dış oblik karşı tarafa, iç oblik aynı tarafa), gövdeyi yana eğer ve karın içi basıncını üretir. Delavier\'in enine kesit çizimi (PDF s. 120) katman sırasını netleştiriyor: dıştan içe obliquus externus → obliquus internus → transversus abdominis.',
      koken: 'Dış oblik alt sekiz kaburganın dış yüzünden; iç oblik leğen kemiği tepesi (cresta iliaca) ve kasık bağından — plate\'lerde "Costa", "Cresta iliaca", "Ligamentum inguinale" etiketli (PDF s. 4 · 117).',
      yapisma: 'Orta hattaki linea alba, leğen kemiği tepesi ve kasık bağı; aponevroz denen geniş bağ yaprağıyla — "Linea alba" ve "Aponeurosis" plate\'te adıyla işaretli (PDF s. 117).',
      komsu: ['karin-duz', 'serratus', 'latissimus', 'erector-spinae'],
      hareketler: ['plank', 'dead-bug', 'kettlebell-swing'],
      ekipman: ['Mat', 'Kettlebell', 'Ekipmansız'],
      guvenlik: 'Elde ağırlıkla yana eğilme hareketleri beli sıkıştırabilir. Dönme hareketlerini bel omurundan değil, göğüs omurundan üret; leğen kemiği sabit kalsın.',
      kaynak: 'PDF s. 4 · 109 (PDF s. 117) · 112 (PDF s. 120)'
    },

    'kalca-fleksor': {
      ad: 'Kalça Bükücü (Bel-uyluk kası)',
      latin: 'Musculus iliopsoas (m. psoas major + m. iliacus)',
      gorunum: 'on',
      bolge: 'Kalça ve leğen',
      fonksiyon: 'Bel omurlarından ve leğen kemiğinin iç çukurundan başlayıp ortak bir tendonla uyluk kemiğine tutunan derin kas çifti. Uyluğu gövdeye doğru kaldırır (kalça fleksiyonu) ve ayak sabitken gövdeyi öne çeker — mekik hareketinin ikinci yarısını asıl yapan kas budur. Delavier bacak plate\'i psoas major, psoas minor ve iliacus\'u ayrı ayrı adlandırıyor.',
      koken: 'Bel omurlarının gövde ve enine çıkıntıları (psoas) ile leğen kemiğinin iç çukuru (iliacus) — plate\'te "Vertebra", "Os coxae" etiketleriyle (PDF s. 86 · 117).',
      yapisma: 'Uyluk kemiğinin iç üst çıkıntısı (trochanter minor); plate femur\'u adlandırıyor, çıkıntının kendi adını vermiyor (PDF s. 86).',
      komsu: ['quadriceps', 'karin-duz', 'adduktor', 'tensor-fasya-lata'],
      hareketler: ['dead-bug', 'hamle', 'plank'],
      ekipman: ['Mat', 'Ekipmansız'],
      guvenlik: 'Delavier\'in karın bölümü uyarısı doğrudan bu kası hedef alıyor (PDF s. 117): bel ağrısı olanlarda psoas beli içe çukurlaştırır. Uzun oturan biri için kısalmış olması beklenir — mekik yerine dead bug gibi bel nötr kalan hareketleri tercih et.',
      kaynak: 'PDF s. 78 (PDF s. 86) · 109 (PDF s. 117) · 118 (PDF s. 126)'
    },

    'quadriceps': {
      ad: 'Dört Başlı Uyluk Kası (Ön bacak)',
      latin: 'Musculus quadriceps femoris (rectus femoris · vastus lateralis · vastus medialis · vastus intermedius)',
      gorunum: 'on',
      bolge: 'Uyluk',
      fonksiyon: 'Uyluğun ön yüzünü kaplayan dört başlı kas kütlesi. Dördü de dizi düzleştirir; yalnız rectus femoris leğen kemiğinden başladığı için ayrıca kalçayı bükebilir. Çömelme, hamle ve merdiven çıkma gibi her diz açma hareketinin motorudur. Delavier bacak plate\'i dört başı tek tek adlandırıyor ve ortak tendonun diz kapağını sararak baldır kemiğine indiğini gösteriyor.',
      koken: 'Rectus femoris leğen kemiğinin ön çıkıntısından; üç vastus uyluk kemiğinin gövdesinden — plate\'te "Os coxae", "Femur" etiketli (PDF s. 86).',
      yapisma: 'Diz kapağı üzerinden ortak tendonla baldır kemiği tepesine — ön plate\'te "Patella", "Ligamentum patellae", "Tuberositas tibiae" ardışık olarak etiketli (PDF s. 5).',
      komsu: ['adduktor', 'kalca-fleksor', 'tensor-fasya-lata', 'hamstring'],
      hareketler: ['goblet-squat', 'hamle'],
      ekipman: ['Dambıl', 'Kettlebell', 'Ekipmansız'],
      guvenlik: 'Çömelmede dizin içe düşmesi (valgus) diz kapağı hizasını bozar. Ayak tabanının üç noktasına bas, dizi ayak orta parmağı yönünde tut; topuğu yerden kesme.',
      kaynak: 'PDF s. 5 · 78 (PDF s. 86) · 98 (PDF s. 106) · 112 (PDF s. 120)'
    },

    'adduktor': {
      ad: 'İç Uyluk Kasları (Toplayıcılar)',
      latin: 'Mm. adductor longus · adductor brevis · adductor magnus · pectineus · gracilis',
      gorunum: 'on',
      bolge: 'Uyluk',
      fonksiyon: 'Kasık kemiğinden uyluk kemiğinin iç kenarına inen kas yelpazesi. Bacağı gövde orta hattına doğru toplar (addüksiyon), yürüyüşte leğen kemiğini yatay tutar ve adductor magnus\'un arka lifleri kalça açmaya da katılır. Gracilis grubun tek iki eklemli üyesidir: uyluğu geçip baldır kemiğine tutunduğu için dizi de bükebilir.',
      koken: 'Kasık kemiğinin alt kolu ve oturak kemiği — plate\'te "Symphysis pubica", "Os coxae" etiketleriyle (PDF s. 86 · 117).',
      yapisma: 'Uyluk kemiğinin iç arka çizgisi boyunca; gracilis ise baldır kemiğinin iç üst yüzüne — plate femur ve tibia\'yı adlandırıyor, tutunma çizgisinin (linea aspera) adını vermiyor (PDF s. 86).',
      komsu: ['quadriceps', 'kalca-fleksor', 'hamstring', 'gluteus-medius'],
      hareketler: ['goblet-squat', 'hamle', 'kopru'],
      ekipman: ['Dambıl', 'Kettlebell', 'Mat'],
      guvenlik: 'Soğuk kasla geniş açıklıkta yana açılma iç uyluk zorlanmasının en sık nedenidir. Geniş duruşlu çömelmede açıklığı kalçanın izin verdiği kadar tut; ısınmadan derin esnetme yapma.',
      kaynak: 'PDF s. 5 · 78 (PDF s. 86) · 98 (PDF s. 106)'
    },

    'tibialis-on': {
      ad: 'Ön Baldır Kası',
      latin: 'Musculus tibialis anterior',
      gorunum: 'on',
      bolge: 'Baldır',
      fonksiyon: 'Baldır kemiğinin dış ön yüzünde, kemiğin hemen yanında uzanan şerit kas. Ayak bileğini yukarı çeker (dorsifleksiyon) ve ayak tabanının iç kenarını kaldırır. Yürürken adımın topuk temasından sonra ayağın yere "düşmesini" frenleyen kas budur; bu yüzden uzun yürüyüşte ilk yanan yer burasıdır. Ayakta dururken vücudun öne devrilmesini de dengeler.',
      koken: 'Baldır kemiğinin (tibia) dış ön yüzü — ön plate\'te "Tibia (facies medialis)" etiketi kasın hemen yanında (PDF s. 5).',
      yapisma: 'Ayağın iç kenarındaki tarak ve bilek kemikleri. PDF plate\'i bu bölgede yalnız komşu kasları (extensor hallucis brevis, abductor hallucis) adlandırıyor; tibialis anterior\'un yapıştığı kemiğin adını VERMİYOR (PDF s. 5 · 112).',
      komsu: ['quadriceps', 'gastrocnemius', 'soleus'],
      hareketler: ['hamle', 'goblet-squat'],
      ekipman: ['Ekipmansız', 'Dambıl'],
      guvenlik: 'Ön baldır ağrısı ("shin splint") çoğunlukla ani mesafe artışından gelir. Yürüyüş/koşu hacmini haftada belirgin sıçramalarla değil kademeli artır; çömelmede topuk yükseltmeye ihtiyaç duyuyorsan bilek hareketliliğini ayrıca çalış.',
      kaynak: 'PDF s. 5 · 78 (PDF s. 86) · 112 (PDF s. 120) · 118 (PDF s. 126)'
    },

    'tensor-fasya-lata': {
      ad: 'Fasya Lata Gerici (Kalça yan gerici)',
      latin: 'Musculus tensor fasciae latae',
      gorunum: 'on',
      bolge: 'Kalça ve leğen',
      fonksiyon: 'Leğen kemiğinin ön dış çıkıntısından başlayan kısa kas; uyluğun dış yüzünde aşağı inen kalın bağ şeridine (tractus iliotibialis) tutunur ve onu gerer. Uyluğu yana açar, hafifçe öne kaldırır ve içe döndürür; tek ayak üzerinde dururken leğen kemiğinin karşı tarafa düşmesini gluteus medius ile birlikte engeller.',
      koken: 'Leğen kemiği tepesinin ön ucu (spina iliaca anterior superior) — ön plate\'te "Cresta iliaca (anterior et superior)" olarak etiketli (PDF s. 5 · 120).',
      yapisma: 'Uyluğun dış yüzündeki iliotibial bağ şeridi, oradan baldır kemiğinin dış tepesine — plate\'te "Tractus iliotibialis (fascia lata)" olarak adıyla etiketli (PDF s. 5 · 106).',
      komsu: ['gluteus-medius', 'quadriceps', 'kalca-fleksor', 'gluteus-maximus'],
      hareketler: ['hamle', 'goblet-squat', 'kopru'],
      ekipman: ['Dambıl', 'Mat', 'Ekipmansız'],
      guvenlik: 'Kısalmış TFL, dizin dış yanında iliotibial bant ağrısına katkı verir. Kalça yan çalışmasını yalnız bu kasa bırakma — gluteus medius\'u da hedefleyen tek bacak hareketleri dengeyi kurar.',
      kaynak: 'PDF s. 5 · 78 (PDF s. 86) · 98 (PDF s. 106) · 118 (PDF s. 126)'
    },

    /* ==================== ARKA GÖRÜNÜM ==================== */

    'trapez-orta-alt': {
      ad: 'Orta ve Alt Trapez',
      latin: 'Musculus trapezius, pars transversa (medialis) et pars ascendens (inferior)',
      gorunum: 'arka',
      bolge: 'Sırt üstü',
      fonksiyon: 'Trapezin sırt ortasını kaplayan iki lif takımı. Orta lifler kürek kemiklerini omurgaya doğru geri çeker (retraksiyon); alt lifler kürek kemiğini aşağı çeker ve kol baş üstüne kalkarken onu yukarı döndürür. Masa başı postüründe zayıflayan ve omuzların öne yuvarlanmasına izin veren asıl kas takımı budur. Delavier upright row plate\'i trapezi superior/medialis/inferior olarak açıkça üçe ayırıyor.',
      koken: 'Sırt omurlarının dikensi çıkıntıları — arka plate\'te "Vertebra thoracica (processus spinosus)" olarak etiketli (PDF s. 4).',
      yapisma: 'Kürek kemiği çıkıntısı (spina scapulae) ve acromion — plate\'te "Spina scapulae", "Acromion" etiketli (PDF s. 4 · 46).',
      komsu: ['romboid', 'trapez-ust', 'latissimus', 'deltoid-arka'],
      hareketler: ['dambil-kurek', 'bant-cekme', 'bant-yana-acma'],
      ekipman: ['Dambıl', 'Direnç bandı'],
      guvenlik: 'Kürek çekerken hareketi yalnız kolla yapıp kürek kemiklerini hareketsiz bırakmak orta trapezi devre dışı bırakır. Çekişi kürek kemiklerini geri-aşağı kaydırarak başlat, omuzları kulağa doğru kaldırma.',
      kaynak: 'PDF s. 4 · 23 (PDF s. 31) · 38 (PDF s. 46) · 57 (PDF s. 65)'
    },

    'latissimus': {
      ad: 'Geniş Sırt Kası',
      latin: 'Musculus latissimus dorsi',
      gorunum: 'arka',
      bolge: 'Sırt',
      fonksiyon: 'Vücudun en geniş yüzeyli kası: bel ve leğen bölgesinden başlayıp yelpaze gibi yukarı-dışa toplanır ve koltuk altından dolanarak kol kemiğine tutunur. Kolu yukarıdan aşağı çeker (adduksiyon), arkaya çeker (ekstansiyon) ve içe döndürür — barfiks ve her türlü çekme hareketinin ana kası. Sırtın "V" görünümünü veren kastır.',
      koken: 'Bel-sırt bağ yaprağı, alt sırt omurlarının dikensi çıkıntıları, leğen kemiği tepesi ve alt kaburgalar — arka plate\'te "Fascia thoracolumbalis", "Trigonum lumbocostale", "Cresta iliaca", "Vertebra thoracica (processus spinosus)" etiketleriyle (PDF s. 4).',
      yapisma: 'Kol kemiğinin ön iç oluğu, koltuk altında; plate humerus\'u adlandırıyor, oluğun kendi adını vermiyor (PDF s. 31).',
      komsu: ['trapez-orta-alt', 'teres-major', 'erector-spinae', 'karin-yan'],
      hareketler: ['dambil-kurek', 'bant-cekme'],
      ekipman: ['Dambıl', 'Direnç bandı'],
      guvenlik: 'Tek kol kürek çekerken gövdeyi çekiş yönünde döndürmek beli burar. Gövdeyi sabit tut, hareketi omuz ekleminden üret; ağırlığı sırt yerine bel ile kaldırma.',
      kaynak: 'PDF s. 4 · 23 (PDF s. 31) · 55 (PDF s. 63) · 57 (PDF s. 65) · 71 (PDF s. 79)'
    },

    'romboid': {
      ad: 'Romboid Kaslar (Elmas kaslar)',
      latin: 'Musculus rhomboideus major · Musculus rhomboideus minor',
      gorunum: 'arka',
      bolge: 'Sırt üstü',
      fonksiyon: 'Trapezin altında gizli kalan, boyun ve üst sırt omurlarından kürek kemiğinin iç kenarına çapraz inen iki kas. Kürek kemiklerini birbirine doğru çeker ve hafifçe yukarı-içe döndürür; serratus anterior\'un tam karşıt oyuncusudur. Delavier bunları "kürek kemiği fiksatörleri" inetinde levator scapulae ve serratus ile birlikte gösteriyor.',
      koken: 'Yedinci boyun omuru ile ilk dört-beş sırt omurunun dikensi çıkıntıları — inette "Vertebra" ve "Spina scapulae" komşuluğunda etiketli (PDF s. 63).',
      yapisma: 'Kürek kemiğinin iç kenarı, kemik çıkıntısının altı — inette "Rhomboideus minor / Rhomboideus major → Scapula" olarak izleniyor (PDF s. 63).',
      komsu: ['trapez-orta-alt', 'serratus', 'trapez-ust', 'rotator-manset'],
      hareketler: ['bant-cekme', 'dambil-kurek', 'bant-yana-acma'],
      ekipman: ['Direnç bandı', 'Dambıl'],
      guvenlik: 'Romboidler yorulduğunda üst trapez işi devralır ve omuzlar kulağa yaklaşır. Yükü hafifletip kürek kemiklerini AŞAĞI-geri kaydırmayı koru; iki kürek arasını "sıkma" hissi hedefin.',
      kaynak: 'PDF s. 23 (PDF s. 31) · 38 (PDF s. 46) · 55 (PDF s. 63) · 71 (PDF s. 79)'
    },

    'deltoid-arka': {
      ad: 'Arka Deltoid (Omuz arka lifi)',
      latin: 'Musculus deltoideus, pars spinalis (posterior)',
      gorunum: 'arka',
      bolge: 'Omuz kuşağı',
      fonksiyon: 'Deltoidin kürek kemiği çıkıntısından başlayan arka lif takımı. Kolu geriye çeker (ekstansiyon), yatay düzlemde dışa açar (horizontal abdüksiyon) ve dışa döndürür. Günlük hayatta ve itme ağırlıklı programlarda en az çalışan omuz lifi budur; zayıf kalırsa omuz başı öne kayar.',
      koken: 'Kürek kemiği çıkıntısının alt kenarı — omuz plate\'inde "Spina scapulae" etiketi deltoideus posterior\'un hemen üstünde (PDF s. 4 · 31).',
      yapisma: 'Kol kemiğinin dış yüzü, ön ve orta liflerle aynı ortak tutunma alanı (PDF s. 31).',
      komsu: ['deltoid-yan', 'rotator-manset', 'trapez-orta-alt', 'triceps'],
      hareketler: ['bant-yana-acma', 'bant-cekme', 'dambil-kurek'],
      ekipman: ['Direnç bandı', 'Dambıl'],
      guvenlik: 'Öne eğilip yana açma hareketlerinde beli yuvarlamak yükü bele taşır. Kalçadan menteşe yap, sırtı düz tut; hafif yükle çalış, hız yerine kontrol.',
      kaynak: 'PDF s. 4 · 23 (PDF s. 31) · 38 (PDF s. 46)'
    },

    'rotator-manset': {
      ad: 'Rotator Manşet (Omuz sarmalı)',
      latin: 'Mm. supraspinatus · infraspinatus · teres minor · subscapularis',
      gorunum: 'arka',
      bolge: 'Omuz kuşağı — derin katman',
      fonksiyon: 'Kürek kemiğinden çıkıp kol kemiğinin başını dört yandan saran ve tek bir kılıf gibi kaynaşan dört küçük derin kas. Görevleri kol kaldırmak değil, kol kemiği başını eklem çukurunda MERKEZDE tutmaktır: supraspinatus kolu ilk 15° yana açar, infraspinatus ve teres minor dışa döndürür, subscapularis içe döndürür. Delavier bunları ancak deadlift plate\'inin derin katman çiziminde açıyor — yüzeysel plate\'te trapez ve deltoidin altında kalırlar.',
      koken: 'Kürek kemiğinin arka çukurları (supraspinatus ve infraspinatus çukuru) ile ön yüzü (subscapularis) — derin plate\'te "Supraspinosus", "Infraspinatus", "Teres minor", "Subscapularis" ve "Scapula" birlikte etiketli (PDF s. 79).',
      yapisma: 'Kol kemiği başının iki çıkıntısı; plate humerus\'u adlandırıyor, çıkıntıların (tuberculum majus/minus) kendi adını vermiyor (PDF s. 31 · 79).',
      komsu: ['deltoid-arka', 'deltoid-yan', 'teres-major', 'romboid'],
      hareketler: ['bant-yana-acma', 'bant-cekme', 'plank'],
      ekipman: ['Direnç bandı', 'Mat'],
      guvenlik: 'Bu kaslar ağır yükle değil, düşük yük–yüksek kontrolle çalışır. Omuz ağrısı varken baş üstü itme ve ense arkası hareketlerden kaçın; bant ile dışa döndürme çalışmasını ısınmaya koy.',
      kaynak: 'PDF s. 4 · 23 (PDF s. 31) · 38 (PDF s. 46) · 71 (PDF s. 79)'
    },

    'teres-major': {
      ad: 'Büyük Yuvarlak Kas',
      latin: 'Musculus teres major',
      gorunum: 'arka',
      bolge: 'Sırt üstü',
      fonksiyon: 'Kürek kemiğinin alt dış köşesinden çıkıp koltuk altından dolanan kalın yuvarlak kas. Latissimus dorsi ile aynı yöne çalışır — kolu aşağı çeker, arkaya götürür ve içe döndürür — bu yüzden "latissimus\'un küçük yardımcısı" diye anılır. Rotator manşetin bir parçası DEĞİLDİR: kol kemiği başını merkezleme görevi yoktur.',
      koken: 'Kürek kemiğinin alt dış köşesi ve dış kenarı — arka plate\'te "Teres major" doğrudan "Scapula / Spina scapulae" komşuluğunda etiketli (PDF s. 4 · 65).',
      yapisma: 'Kol kemiğinin ön iç oluğu, latissimus tutunmasının hemen yanında (PDF s. 31 · 63).',
      komsu: ['latissimus', 'rotator-manset', 'deltoid-arka', 'trapez-orta-alt'],
      hareketler: ['dambil-kurek', 'bant-cekme'],
      ekipman: ['Dambıl', 'Direnç bandı'],
      guvenlik: 'Koltuk altı bölgesi çekme hareketlerinde kolayca gerilir. Çekişte omzu kulaktan uzak tut; hareketin sonunda kolu aşırı arkaya zorlayıp omuz ön kapsülünü açma.',
      kaynak: 'PDF s. 4 · 23 (PDF s. 31) · 38 (PDF s. 46) · 55 (PDF s. 63) · 57 (PDF s. 65)'
    },

    'triceps': {
      ad: 'Triceps (Üç başlı kol kası)',
      latin: 'Musculus triceps brachii',
      gorunum: 'arka',
      bolge: 'Kol',
      fonksiyon: 'Kolun arka yüzünü tümüyle kaplayan üç başlı kas ve üst kolun kütlece büyük bölümü. Dirseği düzleştirir; yalnız uzun baş (caput longum) kürek kemiğinden başladığı için kolu gövdeye doğru geriye de çeker. Delavier arka plate\'i üç başı ayrı ayrı adlandırıyor: caput longum, caput laterale, caput mediale.',
      koken: 'Uzun baş kürek kemiğinin eklem çukuru altından; dış ve iç baş kol kemiğinin arka yüzünden — plate\'te "Scapula" ve "Humerus" etiketleriyle (PDF s. 4 · 31).',
      yapisma: 'Dirsek çıkıntısı (olecranon), ortak bir tendonla — arka plate\'te "Olecranon" ve "Triceps brachial tendo" ardışık etiketli (PDF s. 4 · 65).',
      komsu: ['deltoid-arka', 'on-kol-ekstansor', 'biceps', 'teres-major'],
      hareketler: ['sinav', 'dambil-omuz-press'],
      ekipman: ['Ekipmansız', 'Dambıl', 'Mat'],
      guvenlik: 'Dirseği kilitlenene kadar zorla itmek eklem yüzeyine yükler. Şınavda dirsekleri gövdeye yakın tut; ağırlığı başın arkasına indiren hareketlerde dirseği sabitle, omzu sallama.',
      kaynak: 'PDF s. 1 (kitap 1) · 4 · 23 (PDF s. 31) · 38 (PDF s. 46) · 57 (PDF s. 65)'
    },

    'on-kol-ekstansor': {
      ad: 'Ön Kol Açıcıları (Dış ön kol)',
      latin: 'Mm. extensor carpi radialis longus/brevis · extensor carpi ulnaris · extensor digitorum · brachioradialis',
      gorunum: 'arka',
      bolge: 'Ön kol',
      fonksiyon: 'Ön kolun el sırtı tarafındaki kas takımı: bileği geriye açar, parmakları düzleştirir. Aralarındaki brachioradialis bir istisnadır — bileği değil dirseği büker ve avuç içi karşıya bakarken en güçlü çalışan dirsek bükücüsüdür. Bu grup kavrama sırasında bileği nötr tutarak fleksörlerin güç üretmesini mümkün kılar.',
      koken: 'Kol kemiğinin dış dirsek çıkıntısı (epicondylus lateralis) ve üstündeki kemik kenarı — ön plate\'te "Epicondylis lateralis", arka plate\'te "Olecranon" komşuluğunda etiketli (PDF s. 4 · 5).',
      yapisma: 'El tarak kemikleri ve parmak kemikleri — inette "Metacarpus", "Phalanx distalis" etiketleriyle (PDF s. 4 · 11).',
      komsu: ['triceps', 'on-kol-fleksor'],
      hareketler: ['dambil-kurek', 'kettlebell-swing', 'bant-cekme'],
      ekipman: ['Dambıl', 'Kettlebell', 'Direnç bandı'],
      guvenlik: 'Dış dirsek ağrısı ("tenisçi dirseği") bu grubun ortak başlangıç tendonundan gelir. Ağırlığı kavrarken bileği geriye kırma; ağrı varsa ters kavrama (avuç içi yukarı) çalışmalarını azalt.',
      kaynak: 'PDF s. 4 · 5 · 3 (PDF s. 11) · 55 (PDF s. 63)'
    },

    'erector-spinae': {
      ad: 'Bel ve Sırt Dikleştiricileri',
      latin: 'Mm. erector spinae (iliocostalis · longissimus · spinalis)',
      gorunum: 'arka',
      bolge: 'Sırt — derin katman',
      fonksiyon: 'Omurganın iki yanında, leğen kemiğinden kafatası tabanına kadar uzanan üç sütunluk derin kas kolonu. Omurgayı dik tutar ve geriye açar (ekstansiyon), tek taraflı çalışınca gövdeyi yana eğer. Öne eğilirken asıl işi gövdeyi kaldırmak değil, düşüşü FRENLEMEKTİR. Delavier bu kolonu ancak derin plate\'te açıyor; enine kesit çiziminde omurga gövdesinin hemen arkasındaki konumu net görülüyor.',
      koken: 'Kuyruk sokumu, leğen kemiği tepesi ve bel omurlarının dikensi çıkıntıları — plate\'te "Sacrum (facies dorsalis)", "Cresta iliaca" etiketleriyle (PDF s. 4).',
      yapisma: 'Kaburgaların arka açıları, sırt ve boyun omurlarının çıkıntıları, en üstte kulak arkası çıkıntısı — derin plate\'te "Iliocostalis", "Iliocostalis cervicis", "Spinalis thoracis", "Costa", "Vertebra" olarak izleniyor (PDF s. 65 · 79).',
      komsu: ['gluteus-maximus', 'latissimus', 'karin-duz', 'karin-yan'],
      hareketler: ['kettlebell-swing', 'kopru', 'plank', 'dead-bug'],
      ekipman: ['Kettlebell', 'Mat', 'Ekipmansız'],
      guvenlik: 'Delavier deadlift sayfasında üç maddelik açık uyarı veriyor (PDF s. 79): ağır yükte nefesi göğüste tut, karnı ger, bel bölgesindeki kasları kasarak omurgayı düzleştir — bu üçü bel fıtığı riskini azaltır. Yuvarlak belle ağırlık kaldırma; salınım hareketlerini kalçadan üret, belden değil.',
      kaynak: 'PDF s. 4 · 57 (PDF s. 65) · 71 (PDF s. 79) · 112 (PDF s. 120)'
    },

    'gluteus-maximus': {
      ad: 'Büyük Kalça Kası',
      latin: 'Musculus gluteus maximus',
      gorunum: 'arka',
      bolge: 'Kalça ve leğen',
      fonksiyon: 'Vücudun kütlece en büyük tek kası. Kalçayı açar (uyluğu geriye götürür), dışa döndürür ve üst lifleriyle yana açmaya katılır. Ayakta dururken gövdenin öne devrilmesini engeller; çömelmeden kalkışın, merdiven çıkışın ve kalça itişinin ana motorudur. Delavier kalça bölümünün açılış plate\'i onu yan ve arka görünümde ayrı ayrı gösteriyor.',
      koken: 'Leğen kemiğinin arka dış yüzü, kuyruk sokumu ve kalça bağı — kalça plate\'inde "Os coxae", "Sacrum" komşuluğunda etiketli (PDF s. 4 · 106).',
      yapisma: 'Liflerin büyük bölümü uyluğun dış bağ şeridine (fascia lata / tractus iliotibialis), derin lifler uyluk kemiğinin arka üst yüzüne — plate\'te "Fascia lata", "Trochanter major" etiketli (PDF s. 106).',
      komsu: ['gluteus-medius', 'hamstring', 'erector-spinae', 'tensor-fasya-lata'],
      hareketler: ['kopru', 'goblet-squat', 'hamle', 'kettlebell-swing'],
      ekipman: ['Mat', 'Dambıl', 'Kettlebell'],
      guvenlik: 'Köprü ve kalça itişinde hareketi belden hiperekstansiyonla bitirmek yaygın hatadır. Kaburgaları aşağıda tut, karnı hafif ger, hareketi kalçayı sıkarak bitir — bel değil kalça yükselsin.',
      kaynak: 'PDF s. 4 · 71 (PDF s. 79) · 98 (PDF s. 106) · 118 (PDF s. 126)'
    },

    'gluteus-medius': {
      ad: 'Orta Kalça Kası (Yan kalça)',
      latin: 'Musculus gluteus medius',
      gorunum: 'arka',
      bolge: 'Kalça ve leğen',
      fonksiyon: 'Büyük kalça kasının üst-dışında, kısmen onun altında kalan yelpaze biçimli kas. Uyluğu yana açar; asıl kritik görevi ise tek ayak üzerindeyken leğen kemiğinin karşı tarafa DÜŞMESİNİ engellemektir. Yürüyüşün her adımı bu kasın tek taraflı kasılmasıyla dengelenir; zayıflığı dizin içe düşmesi olarak görünür.',
      koken: 'Leğen kemiğinin dış yüzü, kemik tepesinin (cresta iliaca) hemen altı — kalça ve bacak plate\'lerinde "Gluteus medius" doğrudan "Cresta iliaca / Os coxae" komşuluğunda (PDF s. 4 · 86 · 106).',
      yapisma: 'Uyluk kemiğinin büyük dış çıkıntısı — plate\'te "Trochanter major" olarak adıyla etiketli (PDF s. 106).',
      komsu: ['gluteus-maximus', 'tensor-fasya-lata', 'adduktor', 'erector-spinae'],
      hareketler: ['hamle', 'kopru', 'goblet-squat'],
      ekipman: ['Mat', 'Direnç bandı', 'Dambıl'],
      guvenlik: 'Tek bacak hareketlerinde kalçanın yana açılıp gövdenin karşı tarafa yatması bu kasın yetişemediğini gösterir. Hamlede leğen kemiğini yere paralel tut; adımı kısaltıp kontrolü koru.',
      kaynak: 'PDF s. 4 · 78 (PDF s. 86) · 98 (PDF s. 106) · 118 (PDF s. 126)'
    },

    'hamstring': {
      ad: 'Arka Uyluk Kasları (Hamstring)',
      latin: 'Mm. biceps femoris · semitendinosus · semimembranosus',
      gorunum: 'arka',
      bolge: 'Uyluk',
      fonksiyon: 'Uyluğun arka yüzündeki üç kas: dışta biceps femoris, içte semitendinosus ve semimembranosus. Dizi büker ve kalçayı açar — biceps femoris\'in kısa başı dışında hepsi iki eklemi birden geçtiği için ikisini aynı anda yapabilirler. Öne eğilirken gövdenin düşüşünü kalça tarafından frenleyen kas takımıdır; sprint ve salınım hareketlerinin arka zincir motorudur.',
      koken: 'Oturak kemiği çıkıntısı (leğen kemiğinin alt arkası); biceps femoris\'in kısa başı ise uyluk kemiğinin arka yüzünden — plate\'te "Os coxae" ve "Femur (facies poplitea)" etiketleriyle (PDF s. 4 · 86).',
      yapisma: 'Biceps femoris kaval kemiğinin dış tepesine, diğer ikisi baldır kemiğinin iç üst yüzüne — arka plate\'te "Fibula (kop)" etiketi biceps femoris tendonunun ucunda (PDF s. 4 · 86).',
      komsu: ['gluteus-maximus', 'quadriceps', 'gastrocnemius', 'adduktor'],
      hareketler: ['kettlebell-swing', 'kopru', 'hamle'],
      ekipman: ['Kettlebell', 'Mat', 'Ekipmansız'],
      guvenlik: 'Hamstring zorlanması en sık, kas soğukken veya yorgunken hızlı gerilme anında olur. Salınım hareketlerinde dizi kilitleme, hafif bükülü tut; ısınmadan maksimum açıklıkta öne eğilme yapma.',
      kaynak: 'PDF s. 4 · 78 (PDF s. 86) · 71 (PDF s. 79) · 118 (PDF s. 126)'
    },

    'gastrocnemius': {
      ad: 'İkiz Baldır Kası (Dış baldır)',
      latin: 'Musculus gastrocnemius',
      gorunum: 'arka',
      bolge: 'Baldır',
      fonksiyon: 'Baldırın görünen çift karınlı yüzeysel kası. Uyluk kemiğinin diz üstündeki iki çıkıntısından başladığı için hem ayak bileğini uzatır (parmak ucuna kalkma) hem dizi büker — bu yüzden diz bükülüyken zayıf, diz düzken güçlüdür. Yürüyüşte adımın itiş fazını üretir. Delavier plate\'i iki başı ayrı ayrı adlandırıyor: caput mediale ve caput laterale.',
      koken: 'Uyluk kemiğinin diz üstündeki iki arka çıkıntısı — arka plate\'te iki baş "Gastrocnemius (caput mediale)" ve "(caput laterale)" olarak, "Femur (facies poplitea)" komşuluğunda etiketli (PDF s. 4 · 86).',
      yapisma: 'Aşil tendonu üzerinden topuk kemiğine — arka plate\'te "Tendo calcaneus (achilles)" ve "Tuber calcanei" ardışık etiketli (PDF s. 4).',
      komsu: ['soleus', 'hamstring', 'tibialis-on'],
      hareketler: ['hamle', 'goblet-squat'],
      ekipman: ['Ekipmansız', 'Dambıl'],
      guvenlik: 'Aşil tendonu ani hızlanma ve zıplamalarda risk altındadır. Baldır çalışmasında son noktada zıplayarak sekme; hareketi kontrollü indir, tam açıklıkta zorlamadan çalış.',
      kaynak: 'PDF s. 4 · 5 · 78 (PDF s. 86) · 118 (PDF s. 126)'
    },

    'soleus': {
      ad: 'Nalımsı Kas (Derin baldır)',
      latin: 'Musculus soleus',
      gorunum: 'arka',
      bolge: 'Baldır',
      fonksiyon: 'İkiz baldır kasının ALTINDA yatan geniş, yassı kas. Yalnız ayak bileğini uzatır — dizi geçmediği için diz bükülüyken de tam güçle çalışır; oturarak yapılan baldır hareketlerinin hedefi budur. Ayakta dururken vücudu öne devrilmekten alıkoyan sürekli düşük seviyeli kasılmayı üretir, bu yüzden yorulmaya çok dirençlidir.',
      koken: 'Baldır ve kaval kemiklerinin arka üst yüzü — arka plate\'te "Soleus" doğrudan "Fibula" ve "Tibia" komşuluğunda etiketli (PDF s. 4 · 5 · 86).',
      yapisma: 'İkiz baldır kasıyla ortak aşil tendonu üzerinden topuk kemiğine — "Tendo calcaneus (achilles)" etiketli (PDF s. 4).',
      komsu: ['gastrocnemius', 'tibialis-on', 'hamstring'],
      hareketler: ['hamle', 'goblet-squat'],
      ekipman: ['Ekipmansız', 'Dambıl'],
      guvenlik: 'Soleus kısalığı bilek hareketliliğini kısıtlar ve çömelmede topuğun yerden kalkmasına yol açar. Dizi bükerek yapılan baldır esnetmesini rutine ekle; ağrı varsa açıklığı zorlama.',
      kaynak: 'PDF s. 4 · 5 · 78 (PDF s. 86) · 118 (PDF s. 126)'
    }
  };

  /* ---- hareket sözlüğü: kart başlıkları egzersiz kütüphanesinden ---- */
  var HAREKETLER = {
    'goblet-squat':     { ad:'Goblet Squat',           alt:'Alt vücut · Kuvvet',        ekipman:'Dambıl / Kettlebell', sure:'~8 dk', ikon:'fa-solid fa-dumbbell' },
    'plank':            { ad:'Plank (Şınav Duruşu)',   alt:'Core · İzometrik',          ekipman:'Ekipmansız',          sure:'~5 dk', ikon:'fa-solid fa-person' },
    'dambil-kurek':     { ad:'Dambıl Kürek Çekme',     alt:'Üst vücut · Kuvvet',        ekipman:'Dambıl',              sure:'~8 dk', ikon:'fa-solid fa-dumbbell' },
    'sinav':            { ad:'Şınav (Push-up)',        alt:'Üst vücut · Kuvvet',        ekipman:'Ekipmansız',          sure:'~6 dk', ikon:'fa-solid fa-person-falling' },
    'hamle':            { ad:'Hamle (Lunge)',          alt:'Alt vücut · Denge',         ekipman:'Ekipmansız',          sure:'~7 dk', ikon:'fa-solid fa-person-walking' },
    'dead-bug':         { ad:'Dead Bug (Ölü Böcek)',   alt:'Core · Kontrol',            ekipman:'Ekipmansız',          sure:'~5 dk', ikon:'fa-solid fa-bug' },
    'kettlebell-swing': { ad:'Kettlebell Swing',       alt:'Tüm vücut · Güç',           ekipman:'Kettlebell',          sure:'~9 dk', ikon:'fa-solid fa-kitchen-set' },
    'kopru':            { ad:'Köprü (Glute Bridge)',   alt:'Alt vücut · Aktivasyon',    ekipman:'Ekipmansız',          sure:'~5 dk', ikon:'fa-solid fa-bridge' },
    /* HAREKET ADLARI · 7. oturum hizalaması — KANONİK KAYNAK
       `egzersiz-kutuphane-v1.html`'in kart `data-name` değerleridir: kartların
       kataloğu 12 hareketin hepsini kapsar ve kullanıcının gezdiği yer orasıdır.
       Bu tabloda "Bant ile Çekme" / "Bant ile Yana Açma" yazıyordu; kütüphane
       "Bant Çekme (Band Row)" / "Bant Yana Açma" diyor — köprü etiketi vardığı
       kartla aynı şeyi söylesin diye kütüphaneye çekildi. Aynı ilke K40'ın
       kas adları için kurduğu ilkedir.
       BİLİNEN AÇIK (bu turdan DEĞİL): `goblet-squat` kütüphane kartında
       "Squat (Çömelme)", `egzersiz-detay-v1.html`'in VERI tablosunda
       "Goblet Squat". İki kaynak birbirini tutmuyor; burada varış sayfasının
       adı korundu. Ayrıca 12 slug'ın 4'ü (bant-cekme · bant-yana-acma ·
       dambil-biceps · dambil-omuz-press) detay VERI'sinde yok, o sayfa
       goblet-squat'a düşüyor. İkisi de devir notunda açık kalem. */
    'bant-cekme':       { ad:'Bant Çekme (Band Row)',         alt:'Sırt · Direnç',             ekipman:'Direnç bandı',        sure:'~6 dk', ikon:'fa-solid fa-grip-lines' },
    'bant-yana-acma':   { ad:'Bant Yana Açma',     alt:'Omuz · Direnç',             ekipman:'Direnç bandı',        sure:'~5 dk', ikon:'fa-solid fa-arrows-left-right' },
    'dambil-biceps':    { ad:'Dambıl Biceps Curl',     alt:'Kol · Kuvvet',              ekipman:'Dambıl',              sure:'~6 dk', ikon:'fa-solid fa-dumbbell' },
    'dambil-omuz-press':{ ad:'Dambıl Omuz Press',      alt:'Omuz · Kuvvet',             ekipman:'Dambıl',              sure:'~7 dk', ikon:'fa-solid fa-dumbbell' }
  };

  /* ---- görünüm dosyaları: cinsiyet × ön/arka ---- */
  var HARITALAR = {
    'erkek-on':   'assets/svg/govde-erkek-on.svg',
    'erkek-arka': 'assets/svg/govde-erkek-arka.svg',
    'kadin-on':   'assets/svg/govde-kadin-on.svg',
    'kadin-arka': 'assets/svg/govde-kadin-arka.svg'
  };

  global.ANATOMI_VERI = {
    kaslar: KASLAR,
    hareketler: HAREKETLER,
    haritalar: HARITALAR,
    sozlukHref: SOZLUK,
    /* stat şeridi ve testler bu sayımı kullanır — elle yazılmaz */
    sayim: function () {
      var slug, on = 0, arka = 0, n = 0;
      for (slug in KASLAR) {
        if (!Object.prototype.hasOwnProperty.call(KASLAR, slug)) continue;
        n++;
        if (KASLAR[slug].gorunum === 'on') on++; else arka++;
      }
      return { toplam: n, on: on, arka: arka };
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
