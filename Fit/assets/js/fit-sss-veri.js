/* =====================================================================
   FIT_SSS_VERI — S.S.S. ve Hızlı Çözüm Konuları'nın ANLIK GÖRÜNTÜSÜ
   ---------------------------------------------------------------------
   Bu depo buildless: bir HTML dosyası bir başkasının satır-içi
   <script>'indeki değişkeni okuyamaz. `admin-sss-v1.html` (liste),
   `admin-sss-form-v1.html` (soru formu) ve `admin-sss-konu-form-v1.html`
   (hızlı çözüm konusu formu) AYNI 24 soru + 5 konuyu üç ayrı dosyada
   göstermek zorunda — bu yüzden veri buraya, tek yere alındı; üçü de
   bunu okuyor, hiçbiri kendi kopyasını taşımıyor.

   VERİ GERÇEK, KAYNAĞI KOPYA: 24 S.S.S. kaydı ve 5 hızlı çözüm konusu
   `destek-v1.html`in akordiyon markup'ından 2026-08-30'da mekanik
   olarak çıkarıldı — soru, cevap HTML'i, kategori ve ikon dahil.
   Buildless prototipte sayfa kardeş dosyasını okuyamadığı için bu bir
   ANLIK GÖRÜNTÜdür, canlı bağ değil; `destek-v1.html` değişirse bu
   dosya elle güncellenir.
   ===================================================================== */
window.FIT_SSS_VERI = (function () {
  'use strict';

  /* Kategori künyeleri — `destek-v1.html` kategori şeridinden okundu. */
  var KAT = [
    { kod:'uyelik',   ad:'Üyelik & Hesap',         ico:'fa-regular fa-user' },
    { kod:'hareket',  ad:'Hareket & Egzersiz',     ico:'fa-solid fa-person-running' },
    { kod:'program',  ad:'Programlar & Challenge', ico:'fa-solid fa-list-check' },
    { kod:'antrenor', ad:'Antrenörler',            ico:'fa-solid fa-user-tie' },
    { kod:'pro',      ad:'Pro & Ödeme',            ico:'fa-solid fa-crown' },
    { kod:'diger',    ad:'Sağlık, Veri & Diğer',   ico:'fa-solid fa-shield-heart' }
  ];

  /* 24 kayıt — destek-v1.html'den çıkarıldı (2026-08-30). */
  var SSS = [
  { kat:"uyelik", ico:"fa-regular fa-user",
    soru:"DadaFit'e üye olmak ücretli mi?",
    cevap:"<p>Hayır — üyelik ücretsiz. <a href=\"egzersiz-kutuphane-v1.html\">DadaFit Egzersizleri</a>, <a href=\"hareket-rehberi-v1.html\">hareket rehberi</a>, <a href=\"fit-enerji-defterim.html\">Enerji Defteri</a> ve <a href=\"challenge-merkezi-v1.html\">challenge</a> katılımı ücretsiz planla kullanılır. Kişiye özel program kurgusu, video seansları ve ayrıntılı ilerleme raporları <a href=\"pro-v1.html\">DadaFit Pro</a>'ya dahildir; antrenör görüşmeleri ayrıca ücretlendirilir. <a href=\"fit-giris.html\">Hemen üye ol</a> ve ilk hareketini seç.</p>" },
  { kat:"uyelik", ico:"fa-solid fa-key",
    soru:"Şifremi unuttum, ne yapmalıyım?",
    cevap:"<p><a href=\"fit-giris.html\">Giriş sayfasındaki</a> \"Şifremi Unuttum\" bağlantısına tıkla, kayıtlı e-posta adresini gir. Sıfırlama bağlantısı birkaç dakika içinde gelir; gelmezse spam klasörünü kontrol et. Bağlantı güvenlik için 30 dakika geçerlidir.</p>" },
  { kat:"uyelik", ico:"fa-solid fa-id-card",
    soru:"Profil ve hareket bilgilerimi nasıl güncellerim?",
    cevap:"<p>Ad, kullanıcı adı, avatar ve kapak görselini <a href=\"fit-hesabim.html\">Hesabım</a> sayfasındaki \"Profil\" sekmesinden düzenlersin. Boy, kilo, hareket düzeyi, hedef ve dikkat edilmesi gereken durumlar gibi antrenman kurgusunu etkileyen alanlar ise <a href=\"fit-hareket-profilim.html\">Sağlık ve Hareket Profilim</a> ekranında tutulur — program ve hareket önerileri bu bilgilere göre değişir. Kullanıcı adı 30 günde bir kez değiştirilebilir.</p>" },
  { kat:"uyelik", ico:"fa-solid fa-user-slash",
    soru:"Hesabımı silersem antrenman kayıtlarıma ne olur?",
    cevap:"<p><a href=\"fit-hesabim.html\">Hesabım</a> &gt; Ayarlar &gt; \"Hesabı Sil\" adımından kalıcı silme talebi oluşturabilirsin; talep sonrası 14 günlük geri dönüş süresi tanınır. Silmeden önce antrenman geçmişini, ölçümlerini ve <a href=\"fit-rozetlerim.html\">rozetlerini</a> <a href=\"fit-planim-veri-izin-v1.html\">Veri ve İzinlerim</a> ekranından dışa aktarabilirsin. Kişisel verilerin KVKK kapsamında kaldırılır — ayrıntılar <a href=\"yasal-v1.html?metin=kvkk\">KVKK Aydınlatma Metni</a>'nde.</p>" },
  { kat:"hareket", ico:"fa-solid fa-shoe-prints",
    soru:"Hiç deneyimim yok, nereden başlamalıyım?",
    cevap:"<p><a href=\"hareket-yeni-baslayanlar-v1.html\">Yeni Başlayanlar</a> sayfası tam olarak bunun için var: ekipmansız, kısa ve düşük yoğunluklu bir başlangıç seti. Ne yapmak istediğinden emin değilsen <a href=\"hareket-rehberi-v1.html\">Hareket Rehberi</a>'nden başla — nasıl ve neden sorularının cevabı orada. Belirli bir hareketi arıyorsan doğrudan <a href=\"egzersiz-kutuphane-v1.html\">DadaFit Egzersizleri</a>'nde bölge, süre ve ekipmana göre süzebilirsin.</p>" },
  { kat:"hareket", ico:"fa-solid fa-crosshairs",
    soru:"Hareketi doğru yaptığımı nasıl anlarım?",
    cevap:"<p>Her hareketin detay sayfasında adım adım anlatım, sık yapılan hatalar ve \"nerede zorlanmalısın\" notu bulunur. Genel form kuralları için <a href=\"hareket-dogru-form-v1.html\">Doğru Form</a> rehberine, bilmediğin terimler için <a href=\"hareket-sozluk-v1.html\">Hareket Sözlüğü</a>'ne bakabilirsin. Ağrı hissediyorsan hareketi bırak — zorlanma ile ağrı aynı şey değil; <a href=\"saglik-bilgilendirme-v1.html\">Sağlık Bilgilendirmesi</a>'ni oku.</p>" },
  { kat:"hareket", ico:"fa-solid fa-chair",
    soru:"Ekipmanım yok ve gün boyu masa başındayım, ne yapabilirim?",
    cevap:"<p>DadaFit Egzersizleri'ndeki hareketlerin büyük kısmı ekipmansız çalışır; filtrede \"ekipman yok\" seçeneğini işaretle. Masa başında kısa molalar için <a href=\"hareket-masa-basi-v1.html\">Masa Başı Hareketleri</a>, elindeki zamana göre seçim yapmak için <a href=\"hareket-sureye-gore-v1.html\">Süreye Göre</a> sayfası hazır — 5 dakikalık bir set de kayda geçer.</p>" },
  { kat:"hareket", ico:"fa-solid fa-temperature-arrow-up",
    soru:"Isınma ve soğuma gerçekten gerekli mi?",
    cevap:"<p>Evet — kısa bir ısınma hareket aralığını açar, soğuma ise toparlanmayı kolaylaştırır. <a href=\"hareket-isinma-soguma-v1.html\">Isınma ve Soğuma</a> sayfasında 5–8 dakikalık hazır setler var; programlarda bu bölümler antrenmanın parçası olarak sunulur ve ayrı ayrı işaretlenebilir.</p>" },
  { kat:"hareket", ico:"fa-solid fa-list-ol",
    soru:"Setlerimi ve tekrarlarımı nerede kaydediyorum?",
    cevap:"<p>Hareket detay sayfasında set takibi açık: her seti işaretlersin, dinlenme sayacı kendiliğinden başlar, istersen ağırlık, tekrar, zorlanma derecesi (RPE) ve not eklersin. Antrenmanı bitirdiğinde özet çıkar ve önceki antrenmanla kıyaslanır. Kayıtların <a href=\"fit-egzersizlerim.html\">Aktivite Kayıtlarım</a>'da, günlük toplam ise <a href=\"fit-enerji-defterim.html\">Enerji Defteri</a>'nde birikir.</p>" },
  { kat:"program", ico:"fa-solid fa-compass",
    soru:"Bana uygun programı nasıl bulurum?",
    cevap:"<p><a href=\"programini-bul-v1.html\">Programını Bul</a> sihirbazı hedefini, haftada kaç gün ayırabildiğini, deneyim düzeyini ve ekipmanını sorup sana uyan programları listeler. Kendin süzmek istersen <a href=\"program-liste-v1.html\">Tüm Programlar</a> sayfasında hedef, süre, düzey ve ekipman filtreleri var.</p>" },
  { kat:"program", ico:"fa-solid fa-arrow-rotate-right",
    soru:"Programı yarıda bıraktım, kaldığım yerden devam edebilir miyim?",
    cevap:"<p>Evet. Program takvimi tarihe değil <b>senin ilerlemene</b> bağlı çalışır: ara verdiğin gün silinmez, program kaldığın günden devam eder. <a href=\"fit-programlarim.html\">Programım</a> ekranından günleri erteleyebilir, sırayı değiştirebilir ya da programı baştan başlatabilirsin. Uzun bir aradan sonra bir düzey aşağı inmek de bir seçenek — geri adım değil, ayarlama.</p>" },
  { kat:"program", ico:"fa-solid fa-flag-checkered",
    soru:"Challenge'a nasıl katılırım, kaçırdığım gün ne olur?",
    cevap:"<p><a href=\"challenge-merkezi-v1.html\">Challenge Merkezi</a>'nden aktif ya da yaklaşan bir challenge seçip \"Katıl\" dersin; günlük görevler <a href=\"fit-programlarim.html\">Bugün</a> ekranına düşer. Kaçırdığın gün seriyi sıfırlamaz ve borç yazmaz — challenge kaldığın günden ilerler. Tamamladığın challenge'lar <a href=\"fit-rozetlerim.html\">Rozetlerim</a> bölümünde rozet olarak birikir.</p>" },
  { kat:"program", ico:"fa-solid fa-layer-group",
    soru:"Aynı anda birden fazla program yürütebilir miyim?",
    cevap:"<p>Bir dönemde tek bir ana program aktif olur; ikinci bir programı başlatırsan birincisi \"duraklatıldı\" durumuna geçer ve ilerlemesi korunur. Ana programın yanına esneklik, ısınma ya da masa başı gibi kısa setleri serbest antrenman olarak ekleyebilirsin. Aktif ve duraklatılmış programlarını <a href=\"fit-programlarim.html\">Programım</a> ekranında görürsün.</p>" },
  { kat:"antrenor", ico:"fa-solid fa-calendar-check",
    soru:"Antrenör randevusu nasıl alırım?",
    cevap:"<p><a href=\"antrenorler-v1.html\">Antrenörler</a> sayfasından uzmanlık alanı, çalışma biçimi, puan ve ücrete göre süzüp antrenörün profilinden uygun saati seçersin. Randevu, ödeme tamamlanınca kesinleşir; görüşmeden önce hatırlatma bildirimi gelir. Tüm randevularını <a href=\"fit-antrenorum.html\">Antrenörüm</a> ekranından izleyebilirsin.</p>" },
  { kat:"antrenor", ico:"fa-solid fa-video",
    soru:"Görüşmeler online mı, yüz yüze mi?",
    cevap:"<p>Her ikisi de mümkün — antrenörün hangi görüşme tiplerini sunduğu <a href=\"antrenorler-v1.html\">profil kartında</a> rozetle belirtilir. Online görüşmeler platform içindeki güvenli video odasında yapılır; bağlantı randevu saatinden 15 dakika önce açılır. Yüz yüze çalışan antrenörlerde salon ya da bölge bilgisi profilde yazar.</p>" },
  { kat:"antrenor", ico:"fa-solid fa-calendar-xmark",
    soru:"Randevumu iptal edersem ücret iadesi alır mıyım?",
    cevap:"<p>Randevu saatine 24 saatten fazla varsa ücretsiz iptal ve erteleme yapabilirsin; bedel aynı ödeme yöntemiyle iade edilir. Son 24 saat içindeki iptallerde antrenörün kendi politikası geçerlidir ve profil sayfasında açıkça yazar. Genel kurallar <a href=\"yasal-v1.html?metin=iade\">İptal, İade ve Değişim Koşulları</a>'nda.</p>" },
  { kat:"antrenor", ico:"fa-solid fa-certificate",
    soru:"\"DadaFit Onaylı Antrenör\" rozeti ne anlama geliyor?",
    cevap:"<p>Rozet, antrenörün diploma ya da sertifikasının ve varsa meslek kaydının DadaFit ekibi tarafından görülüp doğrulandığını gösterir. Belge geçerlilik süresi doldurursa rozet düşer — yani rozet taşımayan bir antrenör \"kötü\" değil, o an belgesi doğrulanmamış demektir. Antrenör olarak katılmak istiyorsan <a href=\"fit-antrenor-ol.html\">Antrenör Ol</a> sayfasındaki başvuru formunu doldurabilirsin.</p>" },
  { kat:"pro", ico:"fa-solid fa-crown",
    soru:"DadaFit Pro'da ne var, ücretsiz planla farkı ne?",
    cevap:"<p>Ücretsiz plan DadaFit Egzersizleri'ni, rehberleri, Enerji Defteri'ni, hazır programları ve challenge'ları kapsar. <a href=\"pro-v1.html\">DadaFit Pro</a> bunlara kişiye özel program kurgusu, video seansları, ayrıntılı ilerleme raporları ve gelişmiş filtreleri ekler. Güncel paket içerikleri ve karşılaştırma tablosu Pro sayfasında; hangi içeriğin Pro olduğu kart üzerinde altın \"PRO\" işaretiyle gösterilir.</p>" },
  { kat:"pro", ico:"fa-regular fa-credit-card",
    soru:"Hangi ödeme yöntemlerini kullanabilirim?",
    cevap:"<p>Kredi ve banka kartı (tek çekim ya da taksit) ile havale/EFT kullanılabilir. Tüm kart işlemleri 3D Secure ile doğrulanır ve kart bilgilerin DadaFit'te saklanmaz. Ödeme adımını <a href=\"pro-odeme-v1.html\">Pro Ödeme</a> sayfasında görebilirsin; sözleşme metni <a href=\"yasal-v1.html?metin=mesafeli\">Mesafeli Satış Sözleşmesi</a>'nde.</p>" },
  { kat:"pro", ico:"fa-solid fa-receipt",
    soru:"Pro üyeliğimi nasıl iptal ederim, iade alabilir miyim?",
    cevap:"<p>İptal tek adımdır: <a href=\"fit-hesabim.html\">Hesabım</a> &gt; \"Üyelik ve Paketim\" &gt; \"Yenilemeyi kapat\". Üyelik dönem sonuna kadar açık kalır, sonrasında ücretsiz plana döner ve kayıtların silinmez. Yeni bir dönemin ücreti çekildikten sonraki 14 gün içinde, Pro içeriğini hiç kullanmadıysan iade talep edebilirsin. Koşullar <a href=\"yasal-v1.html?metin=uyelik\">Üyelik ve İptal Koşulları</a> ile <a href=\"yasal-v1.html?metin=iade\">İade Koşulları</a>'nda.</p>" },
  { kat:"diger", ico:"fa-solid fa-heart-pulse",
    soru:"Başlamadan önce doktora sormam gerekir mi?",
    cevap:"<p>DadaFit tıbbi tavsiye vermez ve teşhis koymaz. Kalp-damar rahatsızlığı, kronik bir hastalık, hamilelik, yeni bir ameliyat ya da devam eden bir sakatlık gibi durumlarda önce hekimine danışman gerekir. <a href=\"fit-hareket-profilim.html\">Sağlık ve Hareket Profilim</a>'de bildirdiğin durumlar riskli hareketleri önerilerden çıkarır. Ayrıntılı sınırlar <a href=\"saglik-bilgilendirme-v1.html\">Sağlık Bilgilendirmesi</a>'nde.</p>" },
  { kat:"diger", ico:"fa-solid fa-bolt",
    soru:"Enerji değerleri neden \"yaklaşık\"? Kalori görmek istemiyorum.",
    cevap:"<p>Harcanan enerji kişiye, güne ve ölçüm yöntemine göre değişir; bu yüzden DadaFit rakamları kesin değer olarak değil \"yaklaşık\" olarak gösterir ve bir hareketi bir yemeğin karşılığı gibi sunmaz. Rakamları hiç görmek istemiyorsan <a href=\"fit-enerji-defterim.html\">Enerji Defteri</a>'ndeki gösterim tercihinden kalori değerlerini kapatabilirsin; ilerlemen süre, aktif gün, kuvvet günü, çeşitlilik ve dinlenme üzerinden de takip edilir.</p>" },
  { kat:"diger", ico:"fa-solid fa-shield-halved",
    soru:"Verilerim kimlerle paylaşılıyor? Enerji Köprüsü ne yapıyor?",
    cevap:"<p>Hiçbir veri senin açık iznin olmadan başka bir sisteme gitmez. <a href=\"fit-enerji-defterim.html\">Enerji Defteri</a>, hareket tarafındaki günlük özetini beslenme tarafıyla eşlemek istediğinde kullanılır ve paylaşımdan önce <b>hangi veri</b>, <b>hangi sistem</b>, <b>hangi amaç</b> ve <b>nasıl geri alınır</b> bilgisini ekranda gösterir. Verdiğin izinleri tek tek <a href=\"fit-planim-veri-izin-v1.html\">Veri ve İzinlerim</a>'den kapatabilirsin; hukuki çerçeve <a href=\"yasal-v1.html?metin=kvkk\">KVKK Aydınlatma Metni</a>'nde.</p>" },
  { kat:"diger", ico:"fa-solid fa-rectangle-ad",
    soru:"Reklam ve iş birliği için kiminle iletişime geçmeliyim?",
    cevap:"<p>Marka iş birlikleri, sponsorluk ve reklam talepleri için <a href=\"reklam-ver-v1.html\">Reklam Vermek İçin</a> sayfasındaki formu doldurabilirsin; medya kiti ve fiyatlandırma aynı sayfada. Uygunsuz içerik ya da ihlal bildirmek istiyorsan sayfanın sağ kenarındaki \"Görüş Bildir\" etiketinden \"İhlal bildirimi\" konusunu seçebilirsin.</p>" }
  ];

  /* ---- HIZLI ÇÖZÜM KONULARI — destek-v1.html #dsList (2026-08-30) ----
     Bunlar S.S.S. DEĞİL: soru-cevap değil, üyeyi önce doğru ekrana sonra
     doğru talep konusuna yönlendiren yönerge blokları. Ayrı bir varlık
     oldukları için ayrı kart, ayrı form; aynı public sayfanın içeriği
     oldukları için ayrı sidebar kalemi değil. */
  var KONU = [
    { kod:"konu-uyelik", ico:"fa-solid fa-crown",
      baslik:"Üyelik, DadaFit Pro ve ödeme",
      hedef:"DadaFit Pro ve ödeme",
      govde:"<p>Paketini, yenileme tarihini ve ödeme kayıtlarını <a href=\"fit-paketlerim.html\">Üyelik ve Faturalandırma</a> ekranından görürsün; geçmiş tahsilatlar <a href=\"fit-odemelerim.html#abonelik\">Ödeme Geçmişi</a> sekmesinde tarih ve tutarla listelenir. Pro'nun neyi açtığını karşılaştırmak istersen <a href=\"pro-v1.html\">DadaFit Pro</a> sayfasındaki kademe tablosuna bakabilirsin.</p> <p>Pro'ya geçtiğin hâlde kilitli görünen bir bölüm varsa önce çıkış yapıp tekrar gir — üyelik durumu girişte tazelenir. Kilit sürüyorsa talebi <b>DadaFit Pro ve ödeme</b> konusuyla aç, hangi ekranda kilit gördüğünü yaz.</p>" },
    { kod:"konu-program", ico:"fa-solid fa-list-check",
      baslik:"Programlar, planım ve ilerleme",
      hedef:"Programlar ve planım",
      govde:"<p>Sana atanmış program <a href=\"fit-programlarim.html\">Planım → Programım</a>'da durur; tamamladığın seanslar <a href=\"fit-ilerlemem.html\">İlerleme</a> ekranına işlenir. Henüz bir programın yoksa <a href=\"programini-bul-v1.html\">Programını Bul</a> birkaç soruyla seni uygun programa yönlendirir.</p> <p>Seçtiğin program planına düşmediyse, programın kendi sayfasındaki <b>Planıma ekle</b> düğmesini kullandığından emin ol. Eklendiği hâlde görünmüyorsa talebi <b>Programlar ve planım</b> konusuyla aç, programın adını yaz.</p>" },
    { kod:"konu-aktivite", ico:"fa-solid fa-plug-circle-check",
      baslik:"Bağlı uygulamalar ve aktivite verisi",
      hedef:"Aktivite ve cihaz bağlantıları",
      govde:"<p>Adım, nabız ve süre verisi <a href=\"bagli-uygulamalar-v1.html\">Bağlı Uygulamalar</a>'daki izinlerle gelir; gelen kayıtları <a href=\"fit-enerji-defterim.html#def-aktivite\">Aktivite Günlüğü</a>'nde kaynağıyla birlikte görürsün. İzni kapattığında aktarım o an durur, geçmiş kayıtlar silinmez.</p> <p>Veri iki günden uzun süredir gelmiyorsa önce bağlantı ekranından izni kapatıp yeniden aç, bir gün bekle ve son senkronizasyon zamanına bak. Değişmediyse talebi <b>Aktivite ve cihaz bağlantıları</b> konusuyla aç.</p>" },
    { kod:"konu-hesap", ico:"fa-regular fa-user",
      baslik:"Hesap, giriş ve bildirimler",
      hedef:"Hesap ve giriş",
      govde:"<p>Ad, e-posta ve şifre <a href=\"fit-hesabim.html\">Hesap Ayarları</a>'nda; hangi bildirimi hangi kanaldan alacağın <a href=\"fit-bildirimler.html\">Bildirimler</a> ekranında seçilir. Şifreni hatırlamıyorsan <a href=\"fit-giris.html\">giriş sayfasındaki</a> sıfırlama bağlantısını kullan.</p> <p>Bildirim tercihlerin her girişte eski hâline dönüyorsa tarayıcının site verilerini temizlemesi sebep olabilir. Temizlemeyi kapattığın hâlde sürerse talebi <b>Hesap ve giriş</b> konusuyla aç.</p>" },
    { kod:"konu-saglik", ico:"fa-solid fa-shield-heart",
      baslik:"Sağlık, veri ve izinler",
      hedef:"Diğer",
      govde:"<p>Hangi veriyi kiminle paylaştığını <a href=\"fit-planim-veri-izin-v1.html\">Veri ve İzinlerim</a>'de tek listede görür, her satırı tek tek geri alırsın. Hukuki çerçeve <a href=\"yasal-v1.html?metin=kvkk\">KVKK Aydınlatma Metni</a>'nde, hareket içeriklerinin sınırları <a href=\"saglik-bilgilendirme-v1.html\">Sağlık Bilgilendirmesi</a>'nde yazılı.</p> <p>Bir hareketin sende ağrı yapması, mevcut bir rahatsızlıkla çakışması ya da içerikte hatalı bilgi görmen durumunda talebi <b>Diğer</b> konusuyla aç; ayrıca <a href=\"antrenorler-v1.html\">antrenör dizininden</a> bire bir destek alabilirsin.</p>" }
  ];

  /* Talep formunun konu seçenekleri — destek-v1.html #tkKategori
     alanından okundu; uydurulmadı. */
  var KONU_SEC = [
    "DadaFit Pro ve ödeme", "Üyelik ve fatura", "Aktivite ve cihaz bağlantıları", "Programlar ve planım", "Antrenör ve randevu", "Hesap ve giriş", "Uygulama hatası", "Diğer"
  ];

  /* Çapa bağlantısı sayısı — ölçüldü:
       grep -ohE 'destek-v1\.html#[a-z-]+' *.html assets/js/*.js | sort | uniq -c */
  var KONU_BAG = { 'konu-uyelik':2, 'konu-program':1, 'konu-aktivite':1,
                   'konu-hesap':1, 'konu-saglik':1 };

  function katBul(kod) {
    for (var i = 0; i < KAT.length; i++) if (KAT[i].kod === kod) return KAT[i];
    return null;
  }

  /* ikon havuzu — kayıtların KENDİ ikonlarından, uydurulmadı. */
  function ikonHavuzu() {
    var s = {};
    SSS.forEach(function (x) { s[x.ico] = 1; });
    KAT.forEach(function (x) { s[x.ico] = 1; });
    KONU.forEach(function (x) { s[x.ico] = 1; });
    return Object.keys(s).sort();
  }

  return {
    KAT: KAT, SSS: SSS, KONU: KONU, KONU_SEC: KONU_SEC, KONU_BAG: KONU_BAG,
    katBul: katBul, ikonHavuzu: ikonHavuzu
  };
})();
