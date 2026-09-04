/* =====================================================================
 DADAFIT — ORTAK KABUK JS (TEK KAYNAK)
 ---------------------------------------------------------------------
 Bu dosya DadaFit public sayfalarının ortak kabuğunu (üst bant, header,
 ana menü, mobil drawer, mobil alt bar, görüş bildir, çerez, giriş kapısı,
 footer, başa dön) TEK YERDEN üretir ve davranışını kurar.

 Menüye kalem eklemek = aşağıdaki NAV / BOTTOM / FOOTER_COLS dizilerinde
 TEK satır. Sayfa dosyalarına kabuk markup'ı KOPYALANMAZ.
 Desen kaynağı: assets/js/sa-shell.js (yönetim paneli bölüm listesi).
 Eşi: assets/css/fit-shell.css

 Sayfa sözleşmesi:
 <body data-brand="fit" data-fit-page="<anahtar>">
 <div id="fitShellTop"></div>
 <main class="page-main" id="pageMain"> … </main>
 <div id="fitShellBottom"></div>
 <script src="assets/js/fit-shell.js"></script>
 <script> … sayfa JS … </script>
 data-fit-page verilmezse dosya adından çözülür.
 ===================================================================== */
(function(){
'use strict';

/* ═══════════════════════════════════════════════════════════════════════
   SOHBET TOHUMU — Beyar kararı 2026-09-03: "maket, panel görünmeli"
   ---------------------------------------------------------------------
   Kanon 13 ekran tohumu derleme anında alır (`fit-kur.py` · `_tohum_kodu`).
   Bu 42 yüzey sayfası o borudan geçmiyor; tohum ARTIK BURADA, tek yerde.
   Önce 42 sayfaya satır içi yazılmıştı — Beyar: "çıktıya değil kabuk
   betiğine yaz." Doğru: tek kaynak, tek düzeltme noktası.

   🔴 `durum:'onaylandi'` — 'onayli' DEĞİL. Ölçüldü (fit-shell.js:3358):
       DURUMLAR = ['onay-bekliyor','onaylandi','tamamlandi','iptal',
                   'ertelendi','gelmedi']
   `randevuAl()` bilinmeyen dizgeyi reddedip 'onay-bekliyor'a düşürür, ama
   tohum depoya DOĞRUDAN yazdığı için o kapıyı atlıyor: 'onayli' ham
   kalıyor, rozet eşleşmiyor, nötr gri basıyordu.
   ⚠ `fit-yorum-veri.js`teki 'onayli' BAŞKA AİLE (yorum moderasyonu ·
     'onayli' → "Yayında"), kendi tablosu var — ona DOKUNULMAZ.

   Değer uydurulmadı: lead'in iki kipi ölçtüğü `lead-sohbet-kip.mjs`
   TOHUM sabitinden alındı; durum anahtarı kabuğun kendi tablosuna
   göre düzeltildi.

   FARK BİLEREK: kanonun tohumu depoyu TAMAMEN yazar (program/arşiv/
   geçmiş); burası YALNIZ randevu ekler ve VAR OLAN depoya dokunmaz —
   public yüzeyin plan verisi yok. */
(function(){try{
  var A='dm_fit', ham=localStorage.getItem(A), d=ham?JSON.parse(ham):null;
  if(!d||typeof d!=='object') d={surum:2,program:null,arsiv:[],bildirimler:[],challenge:null,randevular:[]};
  if(!Array.isArray(d.randevular)) d.randevular=[];
  if(d.randevular.length===0){
    d.randevular.push({antrenor:'Selin Aksoy',slug:'selin-aksoy',hizmet:'Online Koçluk',
                       fiyat:1200,tarih:'2026-09-10',saat:'18:00',durum:'onaylandi'});
    localStorage.setItem(A,JSON.stringify(d));
  }
}catch(e){}})();


/* ============================================================
 1 · TEK MENÜ LİSTESİ
 ============================================================ */
/* ------------------------------------------------------------------
 MENÜ SÖZLEŞMESİ (2026 revizyon · DadaDiet header mantığı)
 · Bir hedefe YALNIZ BİR kalem gider. Aynı sayfaya farklı adla ikinci
 bir kapı açılmaz (ölçüm: eski menüde 5 kalem 2 hedefe gidiyordu,
 buna karşılık 7 gerçek rehber sayfası menüde hiç yoktu).
 · Paneli olan başlık da GERÇEK bağlantıdır: panel hover ile açılır,
 başlığa tıklanınca kendi merkez sayfasına gidilir.
 · Panelsiz başlık chevron TAŞIMAZ (dd yok → düz link).
 ------------------------------------------------------------------ */
/* ============================================================
 EKOSİSTEM ADRESLERİ — belge §14
 ------------------------------------------------------------
 "Doğrudan başka prototiplerin HTML sayfalarına bağımlı bağlantılar
 oluşturma · entegrasyonlar yapılandırılabilir servis adresleri üzerinden
 tasarlanmalıdır." Statik prototipte bunun karşılığı: adresler sayfalara
 ve markup'a gömülmez, TEK yerden okunur. Gerçek servis adresleri
 belirlendiğinde yalnız bu nesne değişir.

 DadaFit'in KENDİ akışları (giriş, hesap, çıkış, Planım) buraya BAKMAZ —
 bağımsız görünmesi gerekiyor (belge §1). Burada yalnız kardeş ürünlere
 giden kontrollü ekosistem kapıları var.
 ============================================================ */
/* Kardeş ürünlerin servis kökü. Gerçek adres belirlendiğinde YALNIZ bu satır
   değişir — sayfalara dokunulmaz (aşağıdaki yeniden yazma katmanı sayesinde). */
var ECO_BASE = 'https://by4r.github.io/dadamutfak-view/v7-6cu356/';
var ECO = {
  base:    ECO_BASE,
  gastro:  ECO_BASE + 'anasayfa-portal-v3a.html',
  diet:    ECO_BASE + 'saglik-hub-v1.html',
  gourmet: ECO_BASE + 'kesfet-v1.html',
  campus:  ECO_BASE + 'akademi-v1.html'
};
/* DadaFit'in kendi çıkış hedefi — eskiden DadaMutfak portalına gidiyordu. */
var FIT_LOGOUT = 'dadafit-hub-v1.html?auth=0';

var NAV = [
  /* 1 · HAREKET — DadaFit Egzersizleri ile Hareket Rehberi bu şemsiye altında (belge §3.1).
 Rehberin yedi alt sayfası artık menüde: eskiden yalnız ?bolge= varyantlarıyla
 kütüphaneye giden dört kopya kalem vardı, gerçek sayfalar erişilemezdi. */
  /* R8 madde 4 — `hareket-merkezi-v1` KALDIRILDI (sayfa silindi).
     Bölümün kök hedefi artık DadaFit Egzersizleri: kalan sayfalar içinde
     bölümün asıl varış noktası o (h1 "DadaFit Egzersizleri"). */
  { key:'hareket', label:'Hareket', href:'egzersiz-kutuphane-v1.html', icon:'fa-solid fa-person-running',
    match:['egzersiz-kutuphane-v1','egzersiz-detay-v1','hareket-rehberi-v1',
           'hareket-yeni-baslayanlar-v1','hareket-dogru-form-v1','hareket-sureye-gore-v1',
           'hareket-hedefe-gore-v1','hareket-bolgeye-gore-v1','hareket-masa-basi-v1',
           'hareket-isinma-soguma-v1','hareket-sozluk-v1',
           /* K34 · "Hareketi Anlamak" grubunun sayfaları — aktif durum bu kalemde
              toplanıyor, üst menüde AYRI bir kalem açılmıyor. */
           'sozluk-v1','sozluk-detay-v1','anatomi-v1','antrenman-olusturucu-v1'],
    /* PANEL ÜÇ KALEM, TEK KOLON (kullanıcı kararı — KARARLAR.md K7).
       Panel önce iki kolonlu 11 kalemdi (belge §2'nin listesi). Yedi "rehber
       konusu" + sözlük panelden çıkarıldı: bunlar zaten Hareket Rehberi
       sayfasının İÇERİĞİ ve o sayfa sekizinin de kartını taşıyor
       (ölçüldü: hareket-rehberi-v1.html sekiz hedefin sekizine de link veriyor).
       Menüde tekrarlanmaları paneli şişiriyordu; erişim kaybı YOK, bir tık
       derinleşti. Panel tek kolona indiği için `wide:true` de kalktı. */
    dd:[
      /* R8 madde 4 — "Hareket Merkezi" kalemi KALDIRILDI (sayfa silindi). */
      {label:'DadaFit Egzersizleri', desc:'Tek tek hareketleri bul ve uygula', href:'egzersiz-kutuphane-v1.html', icon:'fa-solid fa-dumbbell'},
      {label:'Hareket Rehberi', desc:'Nasıl ve neden — yedi rehber konusu ve sözlük', href:'hareket-rehberi-v1.html', icon:'fa-solid fa-book-open'},
      /* ---- K34 · "HAREKETİ ANLAMAK" — ETİKETLİ GRUP, AYRI MENÜ KALEMİ DEĞİL ----
         Karar: üç yeni modül (sözlük · anatomi · antrenman oluşturucu) üst
         menüde kendi başlıklarını ALMAZ; Hareket kaleminin altında tek bir
         etiketli grup olur. Böylece üst menü kalem sayısı beşte kalır ve
         panelin tek kolonlu yapısı (K7) bozulmaz.

         NASIL ÇÖZÜLDÜ: dizi zaten düz kalemi destekliyordu — `navHtml()`
         `d.group` gelirse `<div class="dd-group">` basıyor (fit-shell.js
         satır ~373) ve `.dd-group` biçimi CSS'te hazırdı (fit-shell.css
         satır 466 ve 1054). Yani üreticiye masaüstü tarafında hiçbir ek
         yapılmadı. Tek değişiklik drawer tarafında: `drawerNavHtml()` grubu
         eskiden FİLTRELEYİP atıyordu, artık `.d-sub-group` olarak basıyor
         (biçimi de CSS'te zaten vardı — satır 1055). */
      /* R8 madde 3 — {group:'Hareketi Anlamak'} ayracı KALDIRILDI.
         Altındaki üç kalem (Spor Sözlüğü · Anatomi Haritası · Antrenman
         Oluşturucu) yerinde ve aynı sırada duruyor; panel tek kolon,
         artık kesintisiz altı kalem. `.dd-group` / `.d-sub-group`
         biçimleri CSS'te duruyor — başka kalem kullanabilir, silinmedi. */
      {label:'Spor Sözlüğü', desc:'Salon dilinin tam karşılığı — terim terim', href:'sozluk-v1.html', icon:'fa-solid fa-spell-check'},
      {label:'Anatomi Haritası', desc:'Gövde üzerinden kas kas — ne yapar, nereye tutunur', href:'anatomi-v1.html', icon:'fa-solid fa-person-rays'},
      /* H3 · 7. oturum — kalem AÇILDI. Önceki turda yorumdaydı çünkü sayfa
         henüz yoktu; artık `antrenman-olusturucu-v1.html` diskte. Yorumun
         kendi talimatı uygulandı: slug yukarıdaki NAV `match` dizisine ve
         BOTTOM "Hareket" kalemine de eklendi. */
      {label:'Antrenman Oluşturucu', desc:'Birkaç seçimle gün gün antrenman planı', href:'antrenman-olusturucu-v1.html', icon:'fa-solid fa-wand-magic-sparkles'}
    ] },

  /* 2 · PROGRAMLAR. 🔴 VİDEO SEANSLARI MODÜLÜ KALDIRILDI — Beyar, 2026-08-29.
 Kalem menüden, iki sayfası diskten, ve modülün ürün yüzeylerindeki bütün
 izleri (Pro paket matrisi · reklam envanteri · Kaydettiklerim süzgeci ·
 destek talebi) temizlendi. Panel dört kalem taşır.
 Şartname etkilenmedi: §F4'ün Fit modül listesinde bu modül zaten YOKTU
 (tüm belgede 0 geçiş) — öneri yine de raporlandı. */
  { key:'programlar', label:'Programlar', href:'programlar-merkezi-v1.html', icon:'fa-solid fa-clipboard-list',
    match:['programlar-merkezi-v1','program-liste-v1','program-detay-v1','programini-bul-v1',
           'fit-testleri-v1','fit-testi-detay-v1','fit-testi-sonuc-v1'],
    /* E5 — "Programlar" ile "Tüm Programlar" ayrımı netleşti.
       ÖLÇÜM (değişiklik öncesi, NAV/BOTTOM/FOOTER dizilerinden okundu):
         Programlar (başlık)        → programlar-merkezi-v1.html
         Programlar Merkezi (panel) → programlar-merkezi-v1.html   ← AYNI HEDEF
         Tüm Programlar (panel)     → program-liste-v1.html        ← farklı hedef
         Programlar (alt bar)       → programlar-merkezi-v1.html
         Programlar (footer)        → programlar-merkezi-v1.html
       Yani başlık ile panelin ilk kalemi aynı yere gidiyordu (menü
       sözleşmesinin "bir hedefe yalnız bir kalem" kuralının ihlali);
       "Tüm Programlar" ise gerçekten başka bir sayfa. KARAR: tekrar eden
       kalem silindi, farklı hedefli kalemin etiketi netleştirildi
       (KARARLAR.md K16). */
    dd:[
      {label:'Tüm Programlar', desc:'4 · 8 · 12 haftalık planların filtrelenebilir tam listesi', href:'program-liste-v1.html', icon:'fa-solid fa-clipboard-list'},
      /* R13 — pop-up kalktı: kalem artık kendi tam sayfasına gidiyor */
      {label:'Programını Bul', desc:'Altı soruyla sana uygun üç program', href:'programini-bul-v1.html', icon:'fa-solid fa-wand-magic-sparkles'},
      {label:'Fit Testleri', desc:'Seviyeni kendi ölçümünle belirle', href:'fit-testleri-v1.html', icon:'fa-solid fa-clipboard-check'}
    ] },

  /* 3 · ENERJİ DEFTERİ ÜST MENÜDEN ÇIKTI (G1 · KARARLAR.md K18).
 Beyar: "Enerji defterini profile koyabilirsin."
 Kalem beş alt kalemle üst düzeydeydi; artık Fit Planım / profil bağlamının
 altında. Erişim üç kapıdan sürüyor ve hiçbiri kırılmadı:
   · Fit Planım sekme rayı (PLAN_TABS'ta kendi kalemi)
   · Hesap menüsü (ACCOUNT_ITEMS · "profil" bağlamı)
   · Footer "DadaFit" kolonu
 Alt kalemlerinin hedefleri de kayboldu değil, sahiplerine taşındı:
   Aktivite Günlüğü ve Bağlı Uygulamalar → Planım kabuğu + hesap menüsü,
   #dengele / #su / #haftalik çapaları → G2'de kendi sayfalarına dönüştü. */

  /* 4 · CHALLENGE — PANELSİZ DÜZ BAĞLANTI (kullanıcı kararı, KARARLAR.md K17).
 Panel beş kalemdi: merkez + üç DURUM kalemi (?durum=aktif / yaklasan / gecmis)
 + örnek detay. Beyar: "header'daki challenge'da dropdown'lar var, hepsi aynı
 yere, tek bir buton olsun" ve "aktif / yaklaşan / tamamlanan challenge olarak
 sunmana gerek yok, hepsi tek bir yerde".
 Durum artık YALNIZ kart rozeti ve merkez sayfasının kendi filtre ekseni.
 Erişim kaybı yok: eski ?durum= adresleri aynı sayfaya düşüyor ve sayfa
 parametreyi okuyup çipi işaretlemeye devam ediyor (ölçüldü). */
  { key:'challenge', label:'Challenge', href:'challenge-merkezi-v1.html', icon:'fa-solid fa-trophy',
    match:['challenge-merkezi-v1','challenge-v1'] },

  /* 5 · ANTRENÖRLER — PANELSİZ DÜZ BAĞLANTI (kullanıcı kararı, KARARLAR.md K10).
 Faz 3'te belge §2'ye uyularak dört kalemlik panel verilmişti; kullanıcı
 başlığın tıklanınca doğrudan dizine gitmesini istedi. Alt kalemlerin hepsi
 zaten dizin sayfasından erişilebilir: banner'daki "Sana Uygun Antrenörü Bul"
 ve "Antrenör Ol" düğmeleri, kartlardan antrenör profili, randevu ise
 Planım > Antrenörüm. Yani panel kalkınca erişim kaybı yok. */
  { key:'antrenorler', label:'Antrenörler', href:'antrenorler-v1.html', icon:'fa-solid fa-user-tie',
    match:['antrenorler-v1','antrenor-detay-v1','antrenor-ol-v1'] }
];

/* Mobil alt bar — belge §3.2 / §19: BEŞTEN FAZLA sabit öğe olamaz. */
var BOTTOM = [
  {label:'Ana Sayfa', href:'dadafit-hub-v1.html', icon:'fa-solid fa-house', match:['dadafit-hub-v1','index']},
  /* 🔴 ALT ÇUBUK ROL SIRASI — BEYAR KARARI 2026-09-04, referans GASTRO.
     Ölçülen Gastro dizisi (deploy ağacı, HTTP üstünden):
       Ana Sayfa fa-house · Tarifler fa-bowl-food ·
       Ne Pişirsem fa-wand-magic-sparkles (bn-center ac-orta) ·
       Kaydettiklerim fa-bookmark · Profil fa-user (id=bnAccount)
     FIT karşılıkları markanın KENDİ kaynağından alındı, kardeş markadan
     DEĞİL: "Programını Bul" sihirbazı kaynakta zaten
     `fa-solid fa-wand-magic-sparkles` taşıyor (fit-shell.js · menü kaydı),
     yani orta kalemin glifi iki markada aynı çünkü ROL aynı, kopya değil.
     ⚠ `cls:'bn-plan'` KALDIRILDI: oturuma bağlı gizlenen kalem çubukta
       BOŞ YUVA bırakıyordu (Beyar canlı ekranda gördü; ölçüldü: 44 sayfada
       görünür kalem 4/5). Rol tablosunda boş yuva yok. */
  {label:'Hareketler',     href:'egzersiz-kutuphane-v1.html', icon:'fa-solid fa-person-running', match:['egzersiz-kutuphane-v1','egzersiz-detay-v1','hareket-rehberi-v1','hareket-yeni-baslayanlar-v1','hareket-dogru-form-v1','hareket-sureye-gore-v1','hareket-hedefe-gore-v1','hareket-bolgeye-gore-v1','hareket-masa-basi-v1','hareket-isinma-soguma-v1','hareket-sozluk-v1','sozluk-v1','sozluk-detay-v1','anatomi-v1','antrenman-olusturucu-v1']},
  /* 🔴 ALAN = NAV'IN KENDİ MATCH DİZİLERİNİN BİRLEŞİMİ, uydurma değil.
     poz 3 üst menüde ÜÇ kaleme karşılık geliyor ve üçünün de `match`i
     yukarıda yazılı: `programlar` (7 slug) · `challenge` (2) ·
     `antrenorler` (3). Footer da aynı üçünü TEK kolonda topluyor
     ("Programlar ve Uzman Desteği"). Eksik olan yalnız fit testleri ve
     antrenör sayfalarıydı; ikisi de o kolonun kalemi. */
  {label:'Programını Bul', href:'programini-bul-v1.html', icon:'fa-solid fa-wand-magic-sparkles', center:true, match:['programini-bul-v1','programlar-merkezi-v1','program-liste-v1','program-detay-v1','fit-testleri-v1','fit-testi-detay-v1','fit-testi-sonuc-v1','challenge-merkezi-v1','challenge-v1','antrenorler-v1','antrenor-detay-v1','antrenor-ol-v1']},
  {label:'Programlarım',   href:'fit-programlarim.html', icon:'fa-solid fa-list-check', match:['programlarim-v1','fit-programlarim','fit-egzersizlerim','fit-challengelarim','fit-rozetlerim','bagli-uygulamalar-v1','fit-planim-veri-izin-v1']},
  /* 🔴 poz 5'in `match`i YOKTU — kalem HİÇBİR sayfada yanmıyordu
     (ölçüldü 2026-09-04: 65 sayfada Profil aktif 0). Alan ACCOUNT
     menüsünün kendi GRUPLARINDAN okundu: "Hesabım" grubu (Paketlerim ·
     Ödemelerim · Hesap Ayarları · Çözüm Merkezi) + hesap yüzeyleri.
     ⚠ "Modüllerim" ve "Gelişimim" grupları poz 4'ün alanıdır (§67.2 rol
       tablosu: poz 4 KİŞİSEL, poz 5 HESAP) — ikisi karıştırılmaz.
     ⚠ `bildirimler` ve `mesajlarim-v1` ACCOUNT dizisinde YOK; header
       yüzeyleri oldukları için hesap alanına bağlandılar. Rapora kalem
       olarak yazıldı, karar Beyar'ın. */
  {label:'Profil',         href:'fit-hesabim.html', icon:'fa-solid fa-user', id:'bnAccount', match:['hesabim','profil','paketlerim-v1','odemelerim-v1','destek-v1','destek-talebi-detay','bildirimler','mesajlarim-v1','pro-odeme','pro-odeme-3d-v1']}
];

/* ============================================================
 FOOTER — 9. tur revizyonu · BEŞ ALAN
 ------------------------------------------------------------
 Revizyon dokümanının mimarisi, birebir:
   Marka Alanı | Hareket ve Öğren | Programlar ve Uzman Desteği |
   Enerji ve Denge | Uygulama
 Marka (sol) ve uygulama (sağ) alanları FOOTER_RAW'da sabit durur;
 ARADAKİ ÜÇ MENÜ bu dizidedir. Kalem eklemek = TEK SATIR.

 · Doküman "Dada Fit Egzersizleri" (boşluklu) yazıyor; depo markası
   bitişik ("DadaFit") ve üst menüde de `DadaFit Egzersizleri` geçiyor
   → tutarlılık için bitişik yazıldı.
 · "Planım" kalemi footer'dan KALDIRILDI. Doküman: "Planım ve
   İlerlemem footer'a eklenmeyecek, header'da kalacak."
 · Enerji Defteri günlük kayıt ekranını, Haftalık Özet son yedi günün
   özetini açar — işlevleri hâlâ ayrı, ama R18'den beri AYRI SAYFA değil,
   aynı modülün iki alt sekmesi (`#defter` · `#defter-haftalik`).
 · `enerji-ihtiyaci-v1.html` kalemi R18'de KALKTI; sayfa da silindi.
   Ölçüm: 81 sayfanın hiçbirinden bağlantısı yoktu, tek girişi bu kalemdi
   — Beyar'ın kuralı gereği (ulaşılmıyorsa kalksın) ikisi birden gitti.
 ============================================================ */
var FOOTER_COLS = [
  { key:'hareket', title:'Hareket ve Öğren', links:[
      /* R8 madde 4 — "Hareket Merkezi" kalemi KALDIRILDI (sayfa silindi). */
      {label:'DadaFit Egzersizleri', href:'egzersiz-kutuphane-v1.html'},
      {label:'Hareket Rehberi',      href:'hareket-rehberi-v1.html'},
      {label:'Spor Sözlüğü',         href:'sozluk-v1.html'},
      {label:'Anatomi Haritası',     href:'anatomi-v1.html'},
      {label:'Antrenman Oluşturucu', href:'antrenman-olusturucu-v1.html'}
  ]},
  { key:'programlar', title:'Programlar ve Uzman Desteği', links:[
      {label:'Tüm Programlar', href:'program-liste-v1.html'},
      {label:'Programını Bul', href:'programini-bul-v1.html'},
      {label:'Fit Testleri',   href:'fit-testleri-v1.html'},
      {label:'Challenge',      href:'challenge-merkezi-v1.html'},
      {label:'Antrenörler',    href:'antrenorler-v1.html'},
      {label:'Antrenör Ol',    href:'fit-antrenor-ol.html'}
  ]},
  /* ============================================================
     R18 · "ENERJİ VE DENGE" KOLONU ALTIDAN ÜÇE İNDİ — Beyar, 2026-08-30
     ------------------------------------------------------------
     ÜÇ KALEM KALKTI, ÜÇÜ DE ÖLÇÜLEREK:
       · Enerji Köprüsü  → `dadafit-kopru-v1.html` SİLİNDİ (Beyar kararı,
         madde 3). Kavramın mirasçısı Enerji Defteri'dir; ayrı bir kalem
         tutmuyoruz, çünkü kolonun ilk kalemi zaten oraya iniyor.
       · Günlük Enerji İhtiyacını Hesapla → `enerji-ihtiyaci-v1.html` SİLİNDİ
         (madde 4). Beyar kuralı: "başka yerden ulaşılıyorsa dursun,
         ulaşılmıyorsa kalksın." ÖLÇÜM: 81 sayfanın hiçbirinden bağlantı
         YOK — tek giriş bu footer kalemiydi. Kural gereği sayfa kalktı.
       · Aktivite Günlüğü → sayfa SİLİNDİ, içeriği Egzersizlerim modülünün
         dördüncü sekmesi oldu (`egzersizlerim-v1.html#aktivite`, madde 5).
         Beyar: "Footer bağlantısı kalkacak." Erişim kaybı yok: modül
         şeridinden, hesap menüsünden ve Bağlı Uygulamalar sayfasından
         geçiliyor.
     İKİ KALEM ADRES DEĞİŞTİRDİ (sayfa değil, sekme oldular — madde 2):
       Su Takibi · Haftalık Özet → `egzersizlerim-v1.html#defter-su` ·
       `#defter-haftalik`. Etiket ve sıra aynı; yalnız hedef derin bağlantı.
     ============================================================ */
  { key:'enerji', title:'Enerji ve Denge', links:[
      {label:'Enerji Defteri', href:'fit-enerji-defterim.html'},
      {label:'Su Takibi',      href:'fit-enerji-defterim.html#def-su'},
      {label:'Haftalık Özet',  href:'fit-enerji-defterim.html#def-haftalik'}
  ]}
];

/* ============================================================
 KURUMSAL BANT — sütunların İÇİNDE değil, AYRI YATAY BANT.
 ------------------------------------------------------------
 Doküman: "Çözüm Merkezi ile Öneri ve Şikâyet geri plana
 atılmamalıdır" → ikisi de bandın ortasında (4. ve 5. sıra) ve
 diğer altı kalemle AYNI biçimde (aynı punto, ağırlık, renk).

 Hedefler diskte doğrulandı, hiçbiri uydurulmadı:
   Çözüm Merkezi    → destek-v1.html#cozum                 (SSS tarafı — R8 madde 6+35
     GÜNCELLENDİ, Beyar kararı 2026-08-26; aşağıdaki şerhe bak)
   Öneri ve Şikâyet → iletisim-v1.html#conForm   (ayrı sayfası YOK;
     iletişim formu "Öneri ve şikâyetlerini de bu formdan iletebilirsin"
     diyor ve konu seçimine göre ilgili ekibe yönlendiriyor)
 ============================================================ */
var FOOTER_CORP = [
  {label:'Hakkımızda',                    href:'hakkimizda-v1.html'},
  {label:'Künye',                         href:'hakkimizda-v1.html#kunye'},
  {label:'İletişim',                      href:'iletisim-v1.html'},
  /* R8 madde 6+35 — kalem BANTTA KALIYOR, hedefi İKİ KEZ değişti.
     ESKİ HÂL (R8/6+35): `destek-v1.html#taleplerim` → `destek-v1.html`.
     Gerekçesi: gastro footer'ındaki "Çözüm Merkezi" misafirde `/sss`'ye,
     girişte `/hesabim/destek`'e gidiyor — TALEP LİSTESİNE değil DESTEK
     HUB'INA; o gün `destek-v1.html` h1'i "Destek"ti.

     🔴 GÜNCEL HÂL — BEYAR KARARI, 2026-08-26: hedef `destek-v1.html#cozum`.
     NEDEN DEĞİŞTİ: ad kanonu Beyar kararıyla yeniden bağlandı —
     `destek-v1.html` artık **Destek Merkezi**, "Çözüm Merkezi" adı
     `destek-v1.html#cozum`e (SSS tarafı) geçti. Etiket ile hedef ayrışmıştı:
     "Çözüm Merkezi" yazan bağlantı, o adı TAŞIMAYAN bir sayfaya iniyordu
     ve kullanıcıyı yanıltıyordu. Artık etiket = hedefin h1'i.
     Eski karar SİLİNMEDİ, ÜSTÜNE YAZILDI (bkz. KARARLAR.md K64/2).

     Üç şart hâlâ kapalı:
       · kalem 35 → footer'da `destek-talepleri-v1` geçişi 0
       · 9. tur dokümanı → "Çözüm Merkezi geri plana atılmamalıdır" korunur
         (kalem bantta, 4. sırada, aynı biçimde)
       · `tests/footer-yapi.mjs` → kurumsal bant 8 kalem kalır
     Destek hub'ının footer girişi kaybolmadı: hesap menüsündeki
     "Destek Merkezi" kalemi `destek-v1.html`e iniyor (§7.6). */
  {label:'Çözüm Merkezi',                 href:'fit-cozum-merkezi.html'},
  {label:'Öneri ve Şikâyet',              href:'iletisim-v1.html#conForm'},
  {label:'İş Birliği',                    href:'reklam-ver-v1.html#isbirligi'},
  {label:'Reklam ve Marka İş Birlikleri', href:'reklam-ver-v1.html#reklam'},
  {label:'Sponsorlar ve Partnerler',      href:'hakkimizda-v1.html#partnerler'}
];

/* ============================================================
 YASAL BANT — DOKUNULMAZ
 ------------------------------------------------------------
 Revizyon dokümanının dipnotu: "Dada Fit'in mevcut yasal bandına
 hiçbir şekilde müdahale edilmeyecektir. Yasal bağlantıların
 metinleri, sıralaması, yönlendirmeleri, renkleri ve görsel yapısı
 mevcut haliyle korunacaktır."

 Aşağıdaki altı kalem eski FOOTER_COLS'un "Yasal ve Sağlık"
 kolonundan KARAKTER KARAKTER kopyalandı: metin, sıra ve hedef aynı.
 Punto (14px), ağırlık (500) ve renk (rgba(255,255,255,.92)) de
 CSS'te aynı bırakıldı.

 Kolon yerine yatay bant: mimari beş alana indi (doküman §Mimari) ve
 dokümanın mobil sıralaması yasal bandı 7. — yani EN ALT — sıraya
 koyuyor. @1440'ta altı kalemin toplam genişliği 707 px, wrap içi
 alan 1176 px olduğu için bant TEK SATIR kalıyor (ölçüldü).
 `tests/footer-yapi.mjs` §10 bu altı kalemi nöbette tutuyor.
 ============================================================ */
var FOOTER_LEGAL = { title:'Yasal ve Sağlık', links:[
      {label:'Kullanım Koşulları',      href:'yasal-v1.html?metin=kullanim'},
      {label:'Gizlilik ve KVKK',        href:'yasal-v1.html?metin=kvkk'},
      {label:'Çerez Politikası',        href:'yasal-v1.html?metin=cerez'},
      {label:'Üyelik ve İptal Koşulları',href:'yasal-v1.html?metin=uyelik'},
      {label:'Sağlık Bilgilendirmesi',  href:'saglik-bilgilendirme-v1.html'},
      {label:'Veri ve İzin Politikası', href:'yasal-v1.html?metin=veri-izin'}
  ]};

/* ============================================================
 FİT PLANIM — kişisel alan alt menüsü (belge §9.1, on kalem)
 Kalem eklemek = bu dizide TEK SATIR. Sayfa yalnız
 <div id="fitPlanTop" data-plan-page="…" data-plan-title="…"
 data-plan-sub="…"></div> yazar; başlık, breadcrumb ve
 sekme rayı buradan üretilir.
 ============================================================ */
/* ------------------------------------------------------------------
 PLANIM ALTI SEKMEYE SADELEŞTİ (belge §4)
 ------------------------------------------------------------------
 Ray on bir kalemdi; belge altı ana başlık istiyor:
   Bugün · Plan ve Takvim · Aktivite Kayıtlarım · İlerlemem ·
   Kaydettiklerim · Antrenörüm

 Eşleme (yeni sayfa üretilmedi, mevcut sayfalar yeni başlık altına girdi):
   programim  → Plan ve Takvim        (aktif program + haftalık plan + takvim)
   gecmis     → Aktivite Kayıtlarım   (tamamlanan antrenman + manuel aktivite + set geçmişi)
   ilerleme   → İlerlemem             (rozet ve challenge ilerlemesi de bu başlığın altında)
   kaydett…   → Kaydettiklerim
   randevular → Antrenörüm            (randevu + mesaj + paylaşılan program/belge)

 RAYDAN ÇIKANLAR ve nereye gittikleri:
   defter  → ana menüde kendi başlığı oldu (belge §2: "Enerji Defteri'ni Planım
             alanından çıkararak ana menüde doğrudan erişilebilir hâle getir")
   kopru   → Enerji Defteri içindeki açıklayıcı sistem (belge §5: "Enerji Köprüsü,
             Planım veya Hesabım sekmesi olarak gösterilmemelidir")
   rozetler→ İlerlemem'in içeriği (belge §4.4 rozetleri İlerlemem altında sayıyor)
   saglik  → Hesabım > Sağlık ve Hareket Profilim (belge §5)
   veri    → Hesabım > Veri ve İzinlerim (belge §5)

 İKİ LİSTE, TEK KAYNAK:
 · PLAN_TABS  → sekme rayında görünen ALTI kalem
 · PLAN_PAGES → #fitPlanTop kullanan TÜM sayfalar (ray dışı olanlar dahil)
 Ray dışı sayfalar hâlâ Planım kabuğunu (banner + breadcrumb) kullanıyor;
 anahtarları PLAN_PAGES'te durmazsa başlık/breadcrumb çözümü boşa düşer.
 ------------------------------------------------------------------ */
/* R9 · K66 — RAY ÜÇE İNDİ. Yeni belge §2 Planım rayının içeriğini açılır
   menüye taşıyor; rayda yalnız "Planım" kümesi kalıyor (§3 Bugün · §4 Plan ve
   Takvim · §5 İlerlemem). Aktivite Kayıtlarım · Kaydettiklerim · Antrenörüm ·
   Enerji Defteri raydan İNDİ ama SİLİNMEDİ — PLAN_EXTRA'ya geçtiler, yani
   banner/breadcrumb çözümleri ve data-plan-page anahtarları aynen çalışıyor.
   Erişim kaybı yok: dördü de açılır menüde kendi kalemini aldı. */
/* §F3 · §F4 (Dalga 4, 2026-08-29) — MODÜL ŞERİDİ YEDİ KALEME ÇIKTI.
   Şerit bugüne kadar Planım'ın KENDİ alt gezinmesiydi (Bugün · Plan ve
   Takvim · İlerlemem). Şartname şeridi MODÜL geçişi sayıyor: §F3 "modül
   sekme sayısı markanın kendi modül sayısından doğar — Fit 7", §F4 yedi
   adı tek tek yazıyor. Kalem uydurulmadı; yedisi de PLAN_EXTRA'da
   kayıtlıydı ve sayfaları yayında.
   Adlar §F4'ün dizgileridir. Hesap menüsündeki karşılıkları bilerek daha
   uzun ("Challenge'larım ve Rozetlerim" · "Sağlık ve Hareket Profilim"):
   menü §G14'ten, şerit §F4'ten besleniyor.
   Eski üçlü PLAN_EXTRA'ya indi — rayda görünmez, kabuğu (banner,
   breadcrumb, data-plan-page anahtarı) kullanmaya devam eder. */
var PLAN_TABS = [
  /* R15/2 — ŞERİT MODÜL ŞERİDİ OLDU. Eskiden Planım'ın yedi alt sayfasını
     sayıyordu; o yedi sayfa modüllerin SEKMESİ hâline geldi ve kendi
     adreslerini kaybetti, yani şeritte gösterilecek bir hedefleri kalmadı.
     Şeridi silmek yerine bir üst kademeye çıkardık: Planım kabuğunu hâlâ
     kullanan sayfalar (Veri ve İzinlerim · Aktivite Günlüğü · Bağlı
     Uygulamalar · Enerji Köprüsü) artık modüller arasında geziniyor.
     Kalem uydurulmadı: dördü de menüdeki dört modülün ta kendisi. */
  {key:'m-egzersizlerim', label:'Egzersizlerim',   href:'fit-egzersizlerim.html',  icon:'fa-solid fa-person-running', desc:'Hareketlerin, antrenörün, enerji defterin'},
  {key:'m-programlarim',  label:'Programlarım',    href:'fit-programlarim.html',   icon:'fa-solid fa-dumbbell',       desc:'Programın, planın, testlerin, ilerlemen'},
  {key:'m-challenge',     label:"Challenge'larım", href:'fit-challengelarim.html', icon:'fa-solid fa-trophy',         desc:'Katıldığın challenge ve serin'},
    /* GEÇİCİ HEDEF KALKTI — `rozetlerim-v1.html` doğdu (R15/6) ve
     `fit-planim-rozetler-v1.html` silindi. Kalem gerçek sayfasına bağlandı,
     anahtar da kardeşleriyle aynı `m-` kalıbına geçti. */
  {key:'m-rozetler',      label:'Rozetlerim',      href:'fit-rozetlerim.html',     icon:'fa-solid fa-medal',          desc:'Rozetlerin, puanın, liderlik tablosu'}
];

/* Ray dışında kalan ama Planım kabuğunu kullanan sayfalar. Ray'da GÖRÜNMEZLER;
   yalnız banner/breadcrumb çözümü ve eski data-plan-page anahtarlarının
   kırılmaması için burada dururlar. */
var PLAN_EXTRA = [
  /* R15/2 — eski üçlü (Bugün · Plan ve Takvim · İlerlemem) buradan SİLİNDİ:
     üç sayfa da Programlarım'ın sekmesi oldu, kendi adresleri kalmadı. */
  /* §Ö · destek ekranları da modül kabuğunu kullanır (§Ö2); anahtarları
     burada durur ki banner/breadcrumb çözümü onları da tanısın. */
  {key:'destek-detay',     label:'Destek Talebi',      href:'destek-talebi-detay-v1.html',   icon:'fa-solid fa-comments', desc:'Talep yazışması'},
  /* 🔴 R18 (2026-08-30) — BEŞ ANAHTAR BURADAN DÜŞTÜ, ÇÜNKÜ SAYFALARI YOK.
     G2'de Enerji Defteri dört ayrı SAYFAYA bölünmüştü; Beyar bu turda geri
     aldı (madde 2): üç alt sayfa Egzersizlerim modülünün Enerji Defteri
     sekmesinin ALTINDA alt sekme oldu, dosyaları silindi.
       defter-dengele → egzersizlerim-v1.html#defter-dengele
       defter-su      → egzersizlerim-v1.html#defter-su
       defter-haftalik→ egzersizlerim-v1.html#defter-haftalik
     Kusurun kökü de buydu: ayrı sayfa `#fitPlanTop` kullanıyordu ve o kabuk
     `<h1>`e SAYFA BAŞLIĞINI basıyor; kimlik kartındaki ad yerine "Su Takibi"
     geçiyor, profil yapısı bozuluyordu (Beyar'ın ölçtüğü kusur). Modül
     kabuğunda (`#fitModulTop`) kart sekmeden bağımsız, sorun kökten kalktı.
     Ayrıca `aktivite` (→ #aktivite sekmesi) ve `kopru` (sayfa tamamen
     silindi, madde 3) düştü. */
  {key:'cihazlar',  label:'Bağlı Uygulamalar',          href:'bagli-uygulamalar-v1.html',        icon:'fa-solid fa-plug-circle-check',      desc:'Apple Health · Health Connect · saat'},
  {key:'veri',      label:'Veri ve İzinlerim',          href:'fit-planim-veri-izin-v1.html',     icon:'fa-solid fa-shield-halved',          desc:'Neyi kiminle paylaştığın · uygulama tercihleri'}
];
/* ------------------------------------------------------------------
 🔴 R18 (2026-08-30) — `DEFTER_TABS` SİLİNDİ, ÇÜNKÜ HİÇBİR SAYFA KALMADI
 ------------------------------------------------------------------
 R10 · K29'da Enerji Defteri'nin DÖRT AYRI SAYFASI vardı ve her birinde
 üstteki profil rayı yanlış kalemi işaretliyordu; çözüm "ray bölüme göre
 değişir" olmuştu: Planım sayfalarında PLAN_TABS, defter sayfalarında
 DEFTER_TABS.

 Beyar bu turda bölünmeyi geri aldı (madde 2): üç alt sayfa
 (`enerji-defteri-dengele-v1` · `enerji-defteri-su-v1` ·
 `enerji-defteri-haftalik-v1`) SİLİNDİ, içerikleri `egzersizlerim-v1.html`in
 Enerji Defteri sekmesinin ALTINA alt sekme olarak girdi. Yani bu rayın
 hizmet ettiği dört sayfanın dördü de artık YOK — dizi ölü kaldı ve
 silindi. Yerini alan yapı yeni bir bileşen DEĞİL: kabuğun kendi
 `[data-fit-tabs]` panel kipi, `data-fit-tabs-scope` ile kapsamlanmış
 (emsal: `admin-antrenorler-v1.html` · `admin-hizmetler-v1.html`).

 Kazanç ölçüldü: ayrı sayfa `#fitPlanTop` kullanıyordu, o kabuk `<h1>`e
 SAYFA BAŞLIĞINI basar — Beyar'ın gördüğü "kimlik kartındaki ad yerine
 sayfa başlığı geçiyor" kusuru buradan geliyordu. Modül kabuğunda kart
 sekmeden bağımsızdır, kusur kökten kalktı.
 ------------------------------------------------------------------ */

/* §Ö3 (Dalga 4, 2026-08-29) — DESTEK MERKEZİ BÖLÜM ŞERİDİ, ÜÇ KALEM:
   Destek Taleplerim · Yeni Destek Talebi · Çözüm Merkezi.
   Kit §F2 ile aynı: <a> kalemler, aktif olan aria-current="page".
   ⚠ "Çözüm Merkezi" Fit'te `destek-v1.html#cozum`tir — ad kanonu 2026-08-26'da
   böyle bağlandı ("Destek Merkezi" destek yüzeyinin, "Çözüm Merkezi" SSS
   tarafının adı). Yeni ekran üretilmedi, var olan yüzey şeride bağlandı. */
/* R15/3 — DESTEK ÜÇLÜSÜ TEK ADRESE İNDİ. `destek-talepleri-v1.html` ve
   `sss-v1.html` silindi; üçü de `destek-v1.html`in PANELİ oldu ve şeridini
   modül kabuğundan (#fitModulTop) alıyor. Bu dizi yalnız TALEP DETAYI
   ekranında (destek-talebi-detay-v1) kaldı: o hâlâ ayrı bir sayfa ve
   Planım kabuğunu kullanıyor, şeridi oradan besleniyor. */
var DESTEK_TABS = [
  {key:'destek-talepleri',    label:'Destek Taleplerim',  href:'fit-cozum-merkezi.html#taleplerim', icon:'fa-solid fa-inbox'},
  {key:'destek',              label:'Yeni Destek Talebi', href:'fit-cozum-merkezi.html#yeni',       icon:'fa-solid fa-plus'},
  {key:'sss',                 label:'Çözüm Merkezi',      href:'fit-cozum-merkezi.html',      icon:'fa-solid fa-circle-question'}
];

var PLAN_PAGES = PLAN_TABS.concat(PLAN_EXTRA);
/* geriye dönük ad — kabuk içinde "Planım alanının tamamı" anlamında kullanılıyordu */
var PLAN_NAV = PLAN_PAGES;

/* Hesap menüsü — belge §3.3: Dada Gastro hesap aksiyonları (Mutfak Defterim /
 Tarif Ekle / Alışveriş Listem …) DadaFit hesap menüsünde DURMAZ; onlara
 ekosistem değiştiriciden (üst bant marka barı)
 geçilir. Burada yalnız DadaFit kalemleri var. */
/* ============================================================
 AÇILIR KULLANICI MENÜSÜ — yeni belge §2
 ------------------------------------------------------------
 K66 · KARARIN DEVRİLDİĞİ YER. Eski hâli şunu diyordu:
   "Planım ile Hesabım birbirine karıştırılmamalıdır" (önceki belge §5)
 ve bu yüzden menü = 19 hesap kalemi, ray = 7 sekme idi.

 Yeni belge §2 bunun TERSİNİ istiyor ve Beyar "belge birebir uygulansın"
 dedi. Artık:
   · Planım rayının içeriği (Aktivite Kayıtlarım · Kaydettiklerim ·
     Challenge ve Rozetler · Fit Test Sonuçlarım · Antrenörüm · Enerji
     Defterim) MENÜDE, üç başlıklı grup hâlinde
   · 19 hesap kalemi tek "Hesap ve Ayarlar" kalemine KATLANDI —
     hesabim-v1 içindeki çapa bölümleri (#guvenlik #dil #bildirim #dondur
     #sil) yerinde duruyor, menüden değil sayfadan geziliyor
   · Bildirimler menüden ÇIKTI — §1 "header'da duracak, menüye tekrar
     konmayacak" diyor; zil zaten head-actions'ta
 Toplam 11 kalem (belge §2 birebir).
 ============================================================ */

/* ============================================================
 AÇILIR KULLANICI MENÜSÜ — R15/1 (Beyar kararı, 2026-08-29)
 ------------------------------------------------------------
 Menü artık MODÜL menüsüdür. Dört grup, on kalem, üç grup ayracı:

   Egzersizlerim · Programlarım · Challenge'larım
   ─ Rozetlerim
   ─ Paketlerim · Ödemelerim · Hesap Ayarları · Çözüm Merkezi
   ─ Çıkış

 KALKAN KALEMLER — içerik KAYBOLMADI, sekmeye/bölüme taşındı:
   Enerji Defterim            → Egzersizlerim > Enerji Defteri (sekme)
   Antrenörüm                 → Egzersizlerim > Antrenörüm (sekme)
   Kaydettiklerim             → Egzersizlerim sayfasının BÖLÜMÜ (R15/6)
   Aktivite Kayıtlarım        → sayfa kalkıyor (Beyar, R15/6)
   Fit Test Sonuçlarım        → Programlarım > Fit Test Sonuçlarım (sekme)
   Sağlık ve Hareket Profilim → Programlarım > Sağlık Profilim (sekme)
   Challenge'larım ve Rozetlerim → İKİYE ayrıldı: Challenge'larım · Rozetlerim
   Bildirimlerim              → üst çubuktaki ZİL (§G19 · aynı sayfa)
   Pro'ya Yükselt             → Paketlerim (kendi sayfası, R15/4)
   Hizmetlerim ve Ödemelerim  → Ödemelerim (kendi sayfası, R15/4)
   Destek Merkezi             → Çözüm Merkezi (destek sayfasının 3. sekmesi)

 Beyar'ın R15 soru turundaki üç cevabı da buraya işlendi:
   · İlerlemem              → Programlarım'ın sekmesi
   · Planım (Bugün + Plan ve Takvim) → Programlarım'ın İKİ sekmesi
   · header'daki İlerlemem grafik ikonu KALKTI; mobil alt bardaki
     "Planım" kalemi ad ve hedef olarak "Programlarım"a döndü

 🔴 K6 GERİ ALINDI (Beyar, 2026-08-29). "Fit'te abonelik yoktur" kararı
 kalktı: iki kademe var (Ücretsiz · Pro) ve Paketlerim kendi sayfasıdır.
 Bu yüzden `uyelikKalemi()` SİLİNDİ — kademeye göre ad değiştiren kalem
 yerine sabit adlı "Paketlerim" duruyor; kademeyi okumak artık
 paketlerim-v1.html'in kendi işidir. "Pro Max AI" kademesi de kalktı.

 YER TUTUCU: sayfası henüz üretilmemiş kalem `yerTutucu` taşır ve <a>
 değil <span> basar (accountHtml · drawerAccountHtml). Sayfa yayına
 girince alan silinir — ölü bağlantı hiçbir adımda kalmaz.
 🔴 2026-08-29 · ŞU AN YER TUTUCU TAŞIYAN KALEM YOK. Üçü de (Rozetlerim ·
 Paketlerim · Ödemelerim) sayfalarına kavuştu, alanları silindi; ölçüldü:
 `.acct-soon` 3 → 0, `.d-soon` 3 → 0. Mekanizma DURUYOR — yeni bir kalem
 sayfasından önce menüye girerse aynı yolu kullanır.
 ============================================================ */
var ACCOUNT = [
  {grup:'Modüllerim'},
  {label:'Egzersizlerim',   href:'fit-egzersizlerim.html',  icon:'fa-solid fa-person-running', desc:'Egzersizlerin, antrenörün ve enerji defterin'},
  {label:'Programlarım',    href:'fit-programlarim.html',   icon:'fa-solid fa-dumbbell',       desc:'Programın, planın, testlerin, sağlık profilin'},
  {label:"Challenge'larım", href:'fit-challengelarim.html', icon:'fa-solid fa-trophy',         desc:'Katıldığın challenge, serin ve görevlerin'},
  /* 🔴 DORT KALEM EKLENDI — kanon olcut. deneme/fit-*.html hesap menusu 13
     kalem basiyor, bu kabuk 9 basiyordu (v2'nin kisa listesi kalmisti).
     Sira ve ikonlar kanonun kendi menusunden BIREBIR alindi; aciklamalar
     her ekranin kendi pano adlarindan (data-tab) turetildi, uydurulmadi. */
  {label:'İlerlemem',       href:'fit-ilerlemem.html',      icon:'fa-solid fa-chart-line',     desc:'Ölçümlerin, grafiklerin, hedeflerin ve testlerin'},
  {label:'Enerji Defterim', href:'fit-enerji-defterim.html',icon:'fa-solid fa-fire-flame-simple', desc:'Aldığın, harcadığın, su takibin ve haftalık özet'},
  {label:'Hareket Profilim',href:'fit-hareket-profilim.html',icon:'fa-solid fa-heart-pulse',   desc:'Sağlık, seviye, ekipman, kısıt ve izinlerin'},
  {label:'Antrenörüm',      href:'fit-antrenorum.html',     icon:'fa-solid fa-user-tie',       desc:'Randevuların, seansların, mesajların ve programların'},

  {grup:'Gelişimim'},
  {label:'Rozetlerim',      href:'fit-rozetlerim.html',     icon:'fa-solid fa-medal',          desc:'Rozetlerin, puanın ve liderlik tablosu'},

  {grup:'Hesabım'},
  {label:'Paketlerim',      href:'fit-paketlerim.html',     icon:'fa-solid fa-crown',          desc:'Ücretsiz ve Pro — karşılaştır, yükselt'},
  {label:'Ödemelerim',      href:'fit-odemelerim.html',     icon:'fa-solid fa-receipt',        desc:'Abonelik, antrenör ödemeleri, fatura, kart'},
  {label:'Hesap Ayarları',  href:'fit-hesabim.html',        icon:'fa-solid fa-sliders',        desc:'Profil, güvenlik, dil, birimler, veri'},
  {label:'Çözüm Merkezi',   href:'fit-cozum-merkezi.html',   icon:'fa-solid fa-headset',        desc:'SSS, destek taleplerin ve yeni talep'},

  {grup:'Oturum'},
  {label:'Çıkış', href:FIT_LOGOUT, icon:'fa-solid fa-right-from-bracket', cls:'acct-logout'}
];

/* ============================================================
 2 · AKTİF SAYFA ÇÖZÜMÜ
 ============================================================ */
var FILE = (location.pathname.split('/').pop() || 'dadafit-hub-v1.html').replace(/\.html$/,'');
var PAGE = document.body.getAttribute('data-fit-page') || FILE;
function isActive(item){
  if(!item.match) return false;
  for(var i=0;i<item.match.length;i++){ if(item.match[i]===PAGE) return true; }
  return false;
}
/* Planım alanındaki herhangi bir sayfada mıyız? (header düğmesi + drawer bölümü için) */
var PLAN_ACTIVE = PLAN_NAV.some(function(p){ return p.href.replace(/\.html$/,'') === PAGE; });
/* R15/1 — `ILERLEME_ACTIVE` SİLİNDİ: tek tüketicisi header'daki İlerlemem
   ikonuydu, o ikon kalktı (bkz. accountHtml üstündeki not). */
var AVA = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop&exp=7&gam=6&sat=-9&high=8&vib=5";
/* R15/2 · kimlik kartı ad + kullanıcı adı taşıyor; ikisi de TEK yerde.
   Kabuğun üç yüzeyi (hesap menüsü · çekmece · modül kimlik kartı) buradan okur. */
var FIT_USER = { ad:'Elif Şahin', handle:'@elifsahin' };
/* KARE+SIMSEK DUSTU (Beyar, v3) — isaret artik yalniz favicon:
   kanon/varlik/dadafit-isaret.svg. Kabukta marka blogu = kelime markasi. */
var MARK = '';
/* KELIME MARKASI — kanon/varlik/dadafit-kelime.svg (patron dosyasindan vektor).
   Yazim 'dadafit', TEK renk, renk KAPTAN gelir (currentColor). */
var WORD = '<svg class="fit-word-mark" viewBox="948.855 2308.020 1129.594 288.296" role="img" aria-label="DadaFit" xmlns="http://www.w3.org/2000/svg"><title>DadaFit</title><path fill-rule="nonzero" fill="currentColor" d="M 1695.214844 2455.363281 C 1717.148438 2455.363281 1731.769531 2472.289062 1731.769531 2492.679688 C 1731.769531 2512.683594 1717.148438 2529.609375 1695.214844 2529.609375 C 1673.292969 2529.609375 1658.667969 2512.683594 1658.667969 2492.679688 C 1658.667969 2472.289062 1673.292969 2455.363281 1695.214844 2455.363281 M 1683.675781 2594.625 C 1705.988281 2594.625 1723.304688 2587.316406 1735.613281 2574.621094 L 1735.613281 2588.855469 L 1801.011719 2588.855469 L 1801.011719 2492.292969 C 1801.011719 2433.433594 1756.769531 2390.347656 1695.214844 2390.347656 C 1635.207031 2390.347656 1589.425781 2436.511719 1589.425781 2492.292969 C 1589.425781 2548.460938 1627.507812 2594.625 1683.675781 2594.625 "/><path fill-rule="nonzero" fill="currentColor" d="M 1481.691406 2455.75 C 1503.625 2455.75 1518.242188 2472.671875 1518.242188 2492.679688 C 1518.242188 2513.070312 1503.625 2529.609375 1481.691406 2529.609375 C 1459.765625 2529.609375 1445.148438 2513.070312 1445.148438 2492.679688 C 1445.148438 2472.671875 1459.765625 2455.75 1481.691406 2455.75 M 1481.691406 2594.625 C 1543.246094 2594.625 1587.492188 2551.921875 1587.492188 2493.0625 L 1587.492188 2308.019531 L 1518.242188 2308.019531 L 1518.242188 2401.503906 C 1506.316406 2394.964844 1492.085938 2390.734375 1477.847656 2390.734375 C 1416.679688 2390.734375 1375.902344 2431.511719 1375.902344 2493.0625 C 1375.902344 2548.84375 1421.683594 2594.625 1481.691406 2594.625 "/><path fill-rule="nonzero" fill="currentColor" d="M 1268.167969 2455.363281 C 1290.101562 2455.363281 1304.722656 2472.289062 1304.722656 2492.679688 C 1304.722656 2512.683594 1290.101562 2529.609375 1268.167969 2529.609375 C 1246.242188 2529.609375 1231.625 2512.683594 1231.625 2492.679688 C 1231.625 2472.289062 1246.242188 2455.363281 1268.167969 2455.363281 M 1256.628906 2594.625 C 1278.945312 2594.625 1296.257812 2587.316406 1308.566406 2574.621094 L 1308.566406 2588.855469 L 1373.96875 2588.855469 L 1373.96875 2492.292969 C 1373.96875 2433.433594 1329.726562 2390.347656 1268.167969 2390.347656 C 1208.160156 2390.347656 1162.378906 2436.511719 1162.378906 2492.292969 C 1162.378906 2548.460938 1200.464844 2594.625 1256.628906 2594.625 "/><path fill-rule="nonzero" fill="currentColor" d="M 1054.648438 2455.75 C 1076.578125 2455.75 1091.199219 2472.671875 1091.199219 2492.679688 C 1091.199219 2513.070312 1076.578125 2529.609375 1054.648438 2529.609375 C 1032.722656 2529.609375 1018.101562 2513.070312 1018.101562 2492.679688 C 1018.101562 2472.671875 1032.722656 2455.75 1054.648438 2455.75 M 1054.648438 2594.625 C 1116.203125 2594.625 1160.445312 2551.921875 1160.445312 2493.0625 L 1160.445312 2308.019531 L 1091.199219 2308.019531 L 1091.199219 2401.503906 C 1079.265625 2394.964844 1065.039062 2390.734375 1050.800781 2390.734375 C 989.636719 2390.734375 948.855469 2431.511719 948.855469 2493.0625 C 948.855469 2548.84375 994.636719 2594.625 1054.648438 2594.625 "/><path fill-rule="nonzero" fill="currentColor" d="M 1931.203125 2389.453125 C 1900.496094 2386.917969 1885.617188 2399.582031 1885.617188 2429.96875 L 1885.617188 2436.300781 L 1931.203125 2436.300781 L 1931.203125 2456.558594 L 1885.617188 2456.558594 L 1885.617188 2594.574219 L 1864.726562 2594.574219 L 1864.726562 2456.558594 L 1837.820312 2456.558594 L 1837.820312 2436.300781 L 1864.726562 2436.300781 L 1864.726562 2429.96875 C 1864.726562 2388.503906 1888.46875 2366.34375 1931.203125 2369.191406 Z M 1931.203125 2389.453125 "/><path fill-rule="nonzero" fill="currentColor" d="M 1943.863281 2436.300781 L 1964.757812 2436.300781 L 1964.757812 2594.574219 L 1943.863281 2594.574219 Z M 1941.964844 2409.078125 C 1935.316406 2402.429688 1935.316406 2391.035156 1941.964844 2384.386719 C 1948.613281 2377.738281 1960.007812 2377.738281 1966.65625 2384.386719 C 1973.304688 2391.035156 1973.304688 2402.429688 1966.65625 2409.078125 C 1960.007812 2415.722656 1948.613281 2415.722656 1941.964844 2409.078125 "/><path fill-rule="nonzero" fill="currentColor" d="M 2078.449219 2456.558594 L 2032.867188 2456.558594 L 2032.867188 2552.472656 C 2032.867188 2579.695312 2048.0625 2577.480469 2078.449219 2576.214844 L 2078.449219 2594.574219 C 2034.136719 2601.222656 2011.976562 2589.195312 2011.976562 2552.472656 L 2011.976562 2456.558594 L 1978.738281 2456.558594 L 1978.738281 2436.300781 L 2011.976562 2436.300781 L 2011.976562 2398.316406 L 2032.867188 2391.984375 L 2032.867188 2436.300781 L 2078.449219 2436.300781 Z M 2078.449219 2456.558594 "/></svg>';

/* ============================================================
 3 · KABUK MARKUP ÜRETİMİ
 ============================================================ */
function navHtml(){
  return NAV.map(function(it){
    var act = isActive(it) ? ' class="active"' : '';
    /* panelsiz başlık: chevron YOK, aria-haspopup YOK — düz bağlantı (DadaDiet kuralı) */
    if(!it.dd) return '<div class="nav-item"><a href="'+it.href+'"'+act+'>'+it.label+'</a></div>';
    var items = it.dd.map(function(d){
      if(d.group) return '<div class="dd-group">'+d.group+'</div>';
      return '<a href="'+d.href+'"><i class="'+d.icon+'"></i> <span>'+d.label+(d.desc?'<small>'+d.desc+'</small>':'')+'</span></a>';
    }).join('\n            ');
    return '<div class="nav-item">\n          <a href="'+it.href+'"'+(act||' class=""')+' aria-haspopup="true" aria-expanded="false">'+it.label+' <i class="fa-solid fa-chevron-down"></i></a>\n          <div class="dropdown">\n            '+items+'\n          </div>\n        </div>';
  }).join('\n        ');
}

/* Mobil drawer — masaüstü menüsünün birebir karşılığı.
 ⚠ ESKİ ŞERH GEÇERSİZ (2026-09-05): "Planım burada kendi katlanır bölümünü
 alır; aksi hâlde mobilde plan alt sayfalarına hiçbir kapı kalmazdı."
 O gerekçe hesap bloğu (`.d-acct-block`) çekmeceye girdiğinde ortadan
 kalkmıştı; blok ise kalıp ÇİFT KAPI üretiyordu (ölçüm aşağıda). */
function drawerNavHtml(){
  /* `planActive` KALDIRILDI: tek tüketicisi çekmecedeki `.d-plan`
     bloğuydu, o da 2026-09-05'te kalktı. `PLAN_ACTIVE` duruyor —
     header düğmesi ve Planım kabuğu onu okumaya devam ediyor. */
  var out = NAV.map(function(it){
    var act = isActive(it) ? ' active' : '';
    if(!it.dd) return '<div class="d-item"><a class="d-link'+act+'" href="'+it.href+'"><i class="'+it.icon+'"></i> '+it.label+'</a></div>';
    /* K34 · GRUP BAŞLIĞI DRAWER'DA DA GÖRÜNÜR.
       Eskiden `d.group` filtrelenip atılıyordu; "Hareketi Anlamak" grubu
       mobilde etiketsiz kalıyordu. Artık `.d-sub-group` olarak basılıyor —
       biçimi fit-shell.css satır 1055'te zaten tanımlıydı, CSS'e ekleme
       YAPILMADI. `ddOnly` davranışı aynen korunuyor. */
    var subs = it.dd.filter(function(d){return !d.ddOnly;}).map(function(d){
      if(d.group) return '<div class="d-sub-group">'+d.group+'</div>';
      return '<a href="'+d.href+'"><i class="'+d.icon+'"></i> '+d.label+'</a>';
    }).join('\n        ');
    /* Satırın kendisi GERÇEK BAĞLANTI, chevron ayrı bir aç/kapa düğmesi.
       (Eskiden tüm satır <button> idi; panelden "… Merkezi" kalemi kalkınca
       mobilde merkez sayfaya hiç kapı kalmazdı.) */
    return '<div class="d-item d-has-sub'+(act?' open':'')+'">\n      <div class="d-row">\n        <a class="d-link'+act+'" href="'+it.href+'"><i class="'+it.icon+'"></i> '+it.label+'</a>\n        <button class="d-toggle" type="button" aria-expanded="'+(act?'true':'false')+'" aria-label="'+it.label+' alt menüsü"><i class="fa-solid fa-chevron-down"></i></button>\n      </div>\n      <div class="d-sub">\n        '+subs+'\n      </div>\n    </div>';
  });
  /* slice(1): kök kalem ("Bugün") atlanır — üstteki "Planım" satırı zaten
     aynı sayfaya giden gerçek bağlantı; aynı hedefe iki kapı olmaz. */
  /* slice(1): kök kalem ("Bugün") atlanır — üstteki "Planım" satırı zaten
     aynı sayfaya giden gerçek bağlantı. Ray dışı sayfalar drawer'da da
     görünmez; onlara kendi sahiplerinden gidilir (Enerji Defteri ana menüde,
     rozetler İlerlemem içinde, sağlık/veri Hesabım'da). */
  /* §F3/§F4 sonrası (Dalga 4): ray yedi MODÜLE açıldı ve eski üçlü alt
     gezinme (Bugün · Plan ve Takvim · İlerlemem) PLAN_EXTRA'ya indi.
     Drawer'ın listesi ikisini BİRDEN taşır — yoksa @390'da o üç sayfanın
     tek mobil kapısı kapanırdı. Nöbet bunu ölçtü: "İlerlemem yok,
     header'dan indi, hiçbir kapı kalmadı". §U6 gereği yetenek düşmez.
     "Bugün" listeye girmez: üstteki "Planım" satırı zaten ona giden gerçek
     bağlantıdır ve aynı hedefe iki kapı açılmaz. */
  /* 🔴 "PLANIM" BÖLÜMÜ ÇEKMECEDEN KALKTI — BEYAR KARARI, 2026-09-05.
     Beyar: *"çekmecede çift Egzersizlerim/Programlarım kaldır."*

     ÖLÇÜLDÜ (@390, çekmece açık, oturum açık):
       çekmecedeki bağ                                40
       aynı hedefe giden ikinci/üçüncü/dördüncü kapı   9 hedef
         fit-programlarim  4 kez · fit-egzersizlerim 3 · fit-challengelarim 3
         fit-rozetlerim    3 · fit-paketlerim 2 · fit-odemelerim 2
         fit-hesabim       2 · fit-cozum-merkezi 2 · egzersiz-kutuphane-v1 2
     Kök: bu blok (`.d-plan`, 4 alt kalem) hesap bloğunun
     (`.d-acct-block` · Modüllerim 7 + Gelişimim 1 + Hesabım 4) ALT KÜMESİ.
     Dördü de orada zaten var; başlık satırı ("Planım") da hesap
     bloğundaki "Programlarım" ile AYNI hedefe gidiyordu.

     ERİŞİM KAYBI YOK — ölçüldü:
       · iki blok da OTURUMA BAĞLI (`.d-item.d-plan{display:none}` +
         `body.is-auth`; `.d-acct-block` için aynısı) → misafirde ikisi de
         zaten görünmüyordu, yani "misafire kapı kalmaz" riski yok.
       · oturum açıkken hesap bloğu 12 kalemin 12'sini taşıyor.
       · alt çubuğun 4. kalemi ("Programlarım") ayrı bir kapı.
     Bloğun varlık sebebi şerhte yazılıydı: *"aksi hâlde mobilde plan alt
     sayfalarına hiçbir kapı kalmazdı"* — o gerekçe hesap bloğu çekmeceye
     girdiğinde ortadan kalkmış, blok ise kalmıştı.
     `PLAN_TABS` / `PLAN_EXTRA` SİLİNMEDİ: Planım kabuğunun sekme rayını
     hâlâ onlar üretiyor. */

  /* R9 · K66 — AÇILIR MENÜNÜN MOBİL KARŞILIĞI.
     ÖLÇÜLEN KUSUR: §2 rayın içeriğini açılır menüye taşıdı, ama açılır menü
     @390'da hiç yok (`.acct-wrap` gizli) ve drawer'ın alt şeridi yalnız dört
     ince bağlantı taşıyordu. Sonuç: @390'da hub'dan iki sıçramada
     `fit-planim-gecmis-v1` ve `fit-planim-kaydettiklerim-v1` sayfalarına
     HİÇBİR kapı kalmıyordu (ölçüldü — tabanda drawer'ın Planım bölümü ikisini
     de taşıyordu, K66 ile ray üçe inince düştüler).
     Çözüm: menü mobilde de aynı KAYNAKTAN (ACCOUNT) basılır. Ayrı liste
     tutulmaz — masaüstünde eklenen kalem mobilde kendiliğinden görünür.
     Katlanır DEĞİL, hep açık: kullanıcı kendi alanını bulmak için gizli bir
     ok aramak zorunda kalmasın. Bölüm başlıkları `.d-sub-group` — drawer'ın
     zaten kullandığı dil, yeni görsel dil icat edilmedi. */
  out.push('<div class="d-item d-acct-block">\n      <div class="d-sub d-acct-sub">\n        '+drawerAccountHtml()+'\n      </div>\n    </div>');
  return out.join('\n    ');
}

/* ACCOUNT dizisinin drawer karşılığı. Masaüstündeki `accountHtml()` ile TEK
   KAYNAK, iki biçim: burada `desc` alt satırı basılmaz (drawer satırı dar) ve
   "Çıkış" atlanır — drawer'ın alt şeridinde zaten var, aynı hedefe ikinci kapı
   açılmaz. Yer tutucu kalem burada da <a> DEĞİL: odak sırasına girmez. */
function drawerAccountHtml(){
  return ACCOUNT.filter(function(a){ return !a.sep && a.cls !== 'acct-logout'; }).map(function(a){
    if(a.grup) return '<div class="d-sub-group">'+a.grup+'</div>';
    if(a.yerTutucu) return '<span class="d-soon" data-yer-tutucu="'+a.yerTutucu+
      '" aria-disabled="true" aria-label="'+a.label+' — sayfa henüz yayında değil, yakında">'+
      '<i class="'+a.icon+'"></i> '+a.label+'<em class="acct-soon-tag">Yakında</em></span>';
    return '<a href="'+a.href+'"'+(a.cls?' class="'+a.cls+'"':'')+'><i class="'+a.icon+'"></i> '+a.label+'</a>';
  }).join('\n        ');
}

function bottomNavHtml(){
  return BOTTOM.map(function(b){
    var act = isActive(b) ? ' active' : '';
    var id  = b.id ? ' id="'+b.id+'"' : '';
    /* Kanon adları da basılır (`ac-kalem`/`ac-orta`/`ac-fab`) — §67 kabuk
       sözleşmesi onlara yazılı ve 22 kanon ekranı statik markup'ında zaten
       bunları taşıyor. İkisi aynı diziyi basmazsa 65 sayfada tek DOM olmaz. */
    var ico = b.center ? '<span class="bn-fab ac-fab"><i class="'+b.icon+'" aria-hidden="true"></i></span>' : '<i class="'+b.icon+'" aria-hidden="true"></i>';
    return '<a href="'+b.href+'"'+id+' class="bn-item ac-kalem'+(b.center?' bn-center ac-orta':'')+act+'">'+ico+'<span>'+b.label+'</span></a>';
  }).join('\n  ');
}

/* Üç orta menü. Başlık GERÇEK <button> — mobilde accordion, masaüstünde
   `disabled` (kalem listesi hep açık). aria-expanded/aria-controls ikilisi
   kurulum sırasında (bkz. "FOOTER ACCORDION" IIFE) genişliğe göre boyanır. */
function footerColsHtml(){
  return FOOTER_COLS.map(function(c){
    var links = c.links.map(function(l){
      return '<a href="'+l.href+'">'+l.label+'</a>';
    }).join('\n          ');
    return '<div class="foot-col" data-foot-col="'+c.key+'">\n'+
      '        <h5 class="fc-head"><button type="button" class="fc-toggle" id="fcb-'+c.key+'"'+
      ' aria-expanded="true" aria-controls="fcp-'+c.key+'">'+
      '<span class="fc-title">'+c.title+'</span>'+
      '<i class="fa-solid fa-chevron-down fc-chev" aria-hidden="true"></i></button></h5>\n'+
      '        <div class="fc-links" id="fcp-'+c.key+'" role="region" aria-labelledby="fcb-'+c.key+'">\n          '+
      links+'\n        </div>\n      </div>';
  }).join('\n      ');
}

/* Kurumsal bant — sekiz kalem, aralarında ince dikey ayraç (@1440 tek satır). */
function footerCorpHtml(){
  return FOOTER_CORP.map(function(l){
    return '<a href="'+l.href+'">'+l.label+'</a>';
  }).join('<span class="sep" aria-hidden="true"></span>');
}

/* Yasal bant — DOKUNULMAZ. Metin, sıra, hedef ve renk mevcut haliyle. */
function footerLegalHtml(){
  var links = FOOTER_LEGAL.links.map(function(l){
    return '<a href="'+l.href+'">'+l.label+'</a>';
  }).join('<span class="sep" aria-hidden="true"></span>');
  /* R8 madde 2 — GÖRÜNÜR BAŞLIK KALDIRILDI. Bağlantıların metni, sırası,
     hedefi ve rengi AYNEN duruyor; kalkan yalnız <h5 class="fl-head">.
     Bandın adı `aria-label`'da kalıyor — ekran okuyucu bandı hâlâ
     "Yasal ve Sağlık" diye duyurur, görsel olarak başlık yok. */
  return '<nav class="foot-lawband" aria-label="'+FOOTER_LEGAL.title+'">'+
         links+'</nav>';
}

var TOPBAR = ''+
'<div class="topbar">\n'+
'  <div class="wrap">\n'+
'    <div class="tb-left">\n'+
'      <a href="egzersiz-kutuphane-v1.html"><i class="fa-solid fa-dumbbell" style="color:var(--fit)"></i> 25 hareket</a>\n'+
'      <span class="tb-div"></span>\n'+
'      <div class="tb-soc">\n'+
'        <a href="#"><i class="fa-brands fa-instagram"></i></a>\n'+
'        <a href="#"><i class="fa-brands fa-youtube"></i></a>\n'+
'        <a href="#"><i class="fa-brands fa-pinterest"></i></a>\n'+
'      </div>\n'+
'    </div>\n'+
'    <div class="tb-right">\n'+
'      <nav class="brand-switch" aria-label="Dada dünyaları">\n'+
/* §O1 · §O2 · §O10 — ÜST BANT YEDİ KALEM, SIRA SABİT:
   ① Gastro ② Diet ③ Gourmet ④ Fit AKTİF → ⑤ DadaAkademi ⑥ DadaStore
   ⑦ DadaCampus KİLİTLİ, SONDA. `.is-soon` indeksleri [4,5,6].
   §O6 · pasiflik İKİ mekanizmayı birlikte kullanır: `.is-soon` görünümü,
        `aria-disabled="true"` erişilebilirliği verir.
   §O7 · kilitli kalemde kilit rozeti basılır (rail'in `.sr-lock` deseni).
   §O8 · kilitli kalemde "Yakında" metni ya da `title`'ı YAZILMAZ.
   Kilitli kalemler <a href> DEĞİL <span>: deponun kendi kuralı — ölü
   bağlantı bırakılmaz (bkz. `.acct-soon`, footer mağaza düğmeleri).
   ⚠ DadaCampus'ün eski `ECO.campus` hedefi (akademi-v1.html) PARK EDİLDİ:
   §O13/§Y-1'de Campus ile Akademi'nin aynı marka olup olmadığı AÇIK,
   §U2 gereği burada yakınsama yapılmaz; kalem şartnamenin dediği gibi
   kilitli durur ve karar gelince hedefi geri bağlanır.
   §N5 · Diet'in ikonu `fa-heart-pulse`tır (bugünkü `fa-leaf` sapmaydı). */
'        <a class="bs-item bs-gastro" href="'+ECO.gastro+'" title="DadaGastro"><i class="fa-solid fa-utensils"></i><span class="bs-name"><span class="bd">dada</span><span class="sf">gastro</span></span></a>\n'+
'        <a class="bs-item bs-diet" href="'+ECO.diet+'" title="DadaDiet"><i class="fa-solid fa-heart-pulse"></i><span class="bs-name"><span class="bd">dada</span><span class="sf">diet</span></span></a>\n'+
'        <a class="bs-item bs-gourmet" href="'+ECO.gourmet+'" title="DadaGourmet"><i class="fa-solid fa-map-location-dot"></i><span class="bs-name"><span class="bd">dada</span><span class="sf">gourmet</span></span></a>\n'+
'        <a class="bs-item bs-fit is-active" href="dadafit-hub-v1.html" aria-current="page"><i class="fa-solid fa-dumbbell"></i><span class="bs-name"><span class="bd">dada</span><span class="sf">fit</span></span></a>\n'+
'        <span class="bs-item bs-akademi is-soon" aria-disabled="true" aria-label="DadaAkademi — kilitli"><i class="fa-solid fa-graduation-cap"></i><span class="bs-name"><span class="bd">dada</span><span class="sf">akademi</span></span><i class="fa-solid fa-lock sr-lock" aria-hidden="true"></i></span>\n'+
'        <span class="bs-item bs-store is-soon" aria-disabled="true" aria-label="DadaStore — kilitli"><i class="fa-solid fa-bag-shopping"></i><span class="bs-name"><span class="bd">dada</span><span class="sf">store</span></span><i class="fa-solid fa-lock sr-lock" aria-hidden="true"></i></span>\n'+
/* 🔴 DADACAMPUS KALEMİ KALDIRILDI — Beyar, 2026-08-29 (§W2: eski karar
   silinmez, üstüne yazılır). §O1'in yedi kalemi ALTIYA indi:
     ① Gastro ② Diet ③ Gourmet ④ Fit AKTİF ⑤ DadaAkademi ⑥ DadaStore
   SIRAYA DOKUNULMADI (Beyar: "sıraya dokunma") — Gourmet bugün olduğu
   gibi Fit'ten önce kalıyor. Kalem kilitli bir <span>'di, href taşımıyordu:
   kaldırılması ölü bağlantı DOĞURMAZ (ölçüldü, sonrası 0).
   §O13/§Y-1'deki "Campus ile Akademi aynı marka mı" açık kalemi bu
   kaldırmayla kapanmadı; kalem geri istenirse yukarıdaki iki komşusunun
   kalıbı birebir kopyalanır. */
'      </nav>\n'+
/* §O14 · DİL SEÇİCİ — açılır menü (Beyar kararı, 2026-08-29 · §W2).
   Bir önceki tur kardeş markanın tek-kalem desenindeydi (dadagastro.com:
   <a class="tb-lang-one" href="/en" hreflang="en">, açılır menü yok) ve
   kalem deponun kilit dilinde duruyordu. Beyar: "dil seçimi kilitli
   olmamalı, menü kutu içinde açılsın" — menü geri, KİLİT ROZETİ KALKTI.
   Gastro'nun ASIL kuralı korundu: düğme SEÇİLİ dili değil GEÇİLECEK dili
   gösterir. Site Türkçe → düğme "EN". Menüde işaretli olan gerçek dildir.
   Kalemler <a href="#"> değil <button>: deponun kendi kuralı, ölü
   bağlantı bırakılmaz.
   🔴 Çeviri altyapısı YOK (ölçüldü: i18n sözlüğü 0 · data-i18n 0 · /en
   yüzeyi 0). Menünün dibindeki not bunu söylüyor; "Yakında" yazılmadı. */
'      <div class="tb-lang" id="tbLang">\n'+
'        <button class="tb-lang-btn" id="tbLangBtn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Dil menüsü — site Türkçe">\n'+
/* Beyar, 2026-08-29: "'EN' düğmesinin yanındaki aşağı ok kalkacak;
   yalnız küre ikonu ve dil kodu kalsın." Aşağı ok (.tb-lang-caret)
   söküldü, CSS kuralları da silindi — ölü sınıf bırakılmadı.
   `aria-expanded` DÜĞMEDE DURUYOR: açılırlık bilgisi görsel oka değil
   ona bağlı, ok kalkınca ekran okuyucu bilgisi kaybolmasın. */
'          <i class="fa-solid fa-globe" aria-hidden="true"></i><span lang="en">EN</span>\n'+
'        </button>\n'+
'        <div class="tb-lang-menu" id="tbLangMenu" role="menu">\n'+
'          <button type="button" role="menuitemradio" aria-checked="true" class="active" data-lang="tr">TR <span>Türkçe</span></button>\n'+
'          <button type="button" role="menuitemradio" aria-checked="false" data-lang="en">EN <span>English</span></button>\n'+
'          <p class="tb-lang-note" id="tbLangNote"><i class="fa-solid fa-flask" aria-hidden="true"></i><span>Bu prototip yalnız Türkçe. İngilizce yüzey henüz üretilmedi.</span></p>\n'+
'        </div>\n'+
'      </div>\n'+
'    </div>\n'+
'  </div>\n'+
'</div>';

function accountHtml(){
  /* R11/M15 · Beyar: "Dropdown kısmı section'lı BAŞLIKSIZ olacak — aynı
     Diet'in dropdown'ındaki tab menü yapısını alabilirsin."

     KARDEŞ MARKA (dadadiet.com hesap menüsü) ölçüldü: grup BAŞLIĞI yok,
     kalem AÇIKLAMASI yok. İkon + tek satır etiket; gruplar ince AYRAÇ
     çizgisiyle ayrılıyor; aktif kalem yumuşak hap ile işaretli.

     Burada iki şey değişti, kalemlerin kendisi ve sırası DEĞİŞMEDİ:
     · `{grup:'…'}` kalemi artık başlık değil AYRAÇ basıyor
     · kalemlerin `desc` alt satırı basılmıyor (veri duruyor — mobil
       çekmece `drawerAccountHtml()` onu kullanmaya devam ediyor;
       orada dikey alan bol ve açıklama iş görüyor)
     Sonuç: iki satıra taşan kalem kalmadı, menü kısaldı, kaydırma azaldı. */
  var ilkGrupGorulduMu = false;
  return ACCOUNT.map(function(a){
    if(a.sep) return '<div class="acct-div"></div>';
    if(a.grup){
      /* İlk grup profil başlığının hemen altında; orada zaten bir ayraç
         var, ikincisini basmak çift çizgi yapardı. */
      if(!ilkGrupGorulduMu){ ilkGrupGorulduMu = true; return ''; }
      return '<div class="acct-div"></div>';
    }
    /* YER TUTUCU KALEM — hedef sayfa henüz üretilmedi.
       <a href="#"> DEĞİL <span>: menüde tıklanınca sayfa başına zıplayan ölü
       bağlantı bırakmıyoruz. Mağaza düğmelerinin deseni (footer-yapi §6:
       "yayımlanmadıysa aktif bağlantı gibi çalışmamalı") burada da geçerli —
       odak sırasına girmez, aria-disabled taşır, "Yakında" görünür yazar. */
    if(a.yerTutucu) return '<span class="acct-soon" data-yer-tutucu="'+a.yerTutucu+
      '" aria-disabled="true" aria-label="'+a.label+' — sayfa henüz yayında değil, yakında">'+
      '<i class="'+a.icon+'"></i> <span>'+a.label+'<em class="acct-soon-tag">Yakında</em>'+
      '</span></span>';
    /* desc BASILMIYOR — R11/M15, yukarıdaki gerekçe. */
    return '<a href="'+a.href+'"'+(a.cls?' class="'+a.cls+'"':'')+'><i class="'+a.icon+'"></i> <span>'+a.label+
           '</span></a>';
  }).join('\n            ');
}

/* ============================================================
 §N · SOL DAR RAIL — Ekran I. Taban GASTRO, taşıma BİREBİR (§U7).
 §N1 · rail ALTI ikon taşır.  §N2 · ayraç YOKTUR, tek dizidir.
 §N3 · sıra sabit: ① Gastro fa-utensils ② Diet fa-heart-pulse
       ③ Gourmet fa-map-location-dot ④ Fit fa-dumbbell
       ⑤ DadaAkademi ⑥ DadaStore.
 §N4 · ilk dört aktif/tıklanabilir, son iki KİLİTLİ ve SONDA.
 §N6 · Fit'in ikonu fa-dumbbell.
 §N15 · kilitli markada "Yakında" METNİ yazılmaz — yalnız kilit rozeti.
 Kilitli kalem <a href> DEĞİL <span>: ölü bağlantı bırakılmaz.
 ⚠ §N7 (dizinin `AdminMenu::rail()`tan okunması) Laravel kalemidir ve
 bu depoda karşılığı yoktur — statik prototipte dizi burada yaşar.
 ============================================================ */
var RAIL = [
  {ad:'Gastro',  ikon:'fa-solid fa-utensils',          href:ECO.gastro,  acc:'#E14827', rgb:'225,72,39'},
  {ad:'Diet',    ikon:'fa-solid fa-heart-pulse',       href:ECO.diet,    acc:'#3BB77E', rgb:'59,183,126'},
  {ad:'Gourmet', ikon:'fa-solid fa-map-location-dot',  href:ECO.gourmet, acc:'#b14fc5', rgb:'177,79,197'},
  {ad:'Fit',     ikon:'fa-solid fa-dumbbell',          href:'dadafit-hub-v1.html', acc:'#0093D0', rgb:'0,147,208', aktif:true},
  {ad:'DadaAkademi', ikon:'fa-solid fa-graduation-cap', kilit:true},
  {ad:'DadaStore',   ikon:'fa-solid fa-bag-shopping',   kilit:true}
];

function railHtml(){
  var kalemler = RAIL.map(function(r){
    var stil = ' style="--acc:' + (r.acc||'#e9e2d6') + ';--acc-rgb:' + (r.rgb||'233,226,214') + '"';
    if(r.kilit) return '<span class="sa-brand is-locked" aria-disabled="true" aria-label="' + r.ad +
      ' — kilitli"><i class="' + r.ikon + '" aria-hidden="true"></i>' +
      '<i class="fa-solid fa-lock sr-lock" aria-hidden="true"></i></span>';
    return '<a class="sa-brand' + (r.aktif ? ' is-active' : '') + '" href="' + r.href + '"' + stil +
      (r.aktif ? ' aria-current="page"' : '') + ' aria-label="Dada' + r.ad + '">' +
      '<i class="' + r.ikon + '" aria-hidden="true"></i></a>';
  }).join('\n    ');
  return '<nav class="sa-rail" aria-label="Marka geçişi">\n' +
'  <a class="sa-rail-logo" href="dadafit-hub-v1.html" aria-label="DadaFit">' + WORD + '</a>\n' +
'    ' + kalemler + '\n' +
'  <div class="sa-rail-foot">\n' +
'    <span class="sa-rail-hair" aria-hidden="true"></span>\n' +
'    <a href="dadafit-hub-v1.html" title="Siteyi Görüntüle" aria-label="Siteyi Görüntüle"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>\n' +
'    <a href="https://gaviaworks.com" title="Gaviaworks" aria-label="Gaviaworks"><i class="fa-solid fa-code" aria-hidden="true"></i></a>\n' +
'  </div>\n' +
'</nav>';
}

function headerHtml(){
  return ''+
'<header class="header">\n'+
'  <div class="h-top">\n'+
'    <div class="wrap">\n'+
'      <a class="brand fit-brand" href="dadafit-hub-v1.html" aria-label="DadaFit">'+MARK+WORD+'</a>\n'+
'      <nav class="nav">\n        '+navHtml()+'\n      </nav>\n'+
'      <div class="head-actions">\n'+
'        <button class="icon-btn" aria-label="Ara" onclick="location.href=\'fit-arama.html\'"><i class="fa-solid fa-magnifying-glass"></i></button>\n'+
/* R16 · Beyar, 2026-08-29 — HEAD-ACTIONS SIRASI DEĞİŞTİ.
 Öncesi (oturum kipi, soldan sağa): arama · Planım · zil · avatar
 Sonrası:                           arama · zil · Planım · avatar
 Yani ZİL, Planım'ın SOLUNA geçti; Planım avatarın hemen soluna oturdu.
 Misafir kipinde zil ve avatar `display:none` (fit-shell.css `body.is-auth`),
 o kipte sıra arama · Planım · Giriş Yap olarak KORUNUR — misafir görünümü
 değişmedi. Aralık kabın kendi `gap`inden gelir, kalem başına boşluk yok. */
'        <a class="icon-btn head-bell" href="fit-bildirimler.html" aria-label="Bildirimler"><i class="fa-solid fa-bell"></i><span class="hb-badge">3</span></a>\n'+
/* PLANIM — ana menüye girmez; kişisel buton olarak burada durur ve HER İKİ
 oturum durumunda da görünür. */
/* 🔴 HEADER "PLANIM" DÜĞMESİ SÖKÜLDÜ — Beyar kararı, 2026-09-03.
   "Header'da hiçbir sayfada olmayacak. Çekmece ve alt çubuk kalır."
   Kanon 13 ekranda aynı karar `fit-kur.py` · `planim_sok()` ile
   uygulanmıştı (_PLANIM_RE → class="… btn-plan …"); bu 42 sayfa o
   borudan geçmediği için düğme burada duruyordu — ölçüldü, header'da
   `btn-login btn-plan` basıyordu. Kaynaktan söküldü, çıktıya yama
   yapılmadı. ÇEKMECE (`.d-link`) ve ALT ÇUBUK (§67) DOKUNULMADI. */
/* §1 — İLERLEMEM header'a çıktı. Belge sırası: Arama · Planım · İlerlemem ·
 Bildirimler · Profil. İkon düğme: Planım zaten metinli, ikisi yan yana metinli
 olsa dar ekranda head-actions taşardı (ölçüm: 1440'ta 6 öğe zaten sığıyor). */
/* R15/1 · Beyar kararı — HEADER'DAKİ İLERLEMEM İKONU KALKTI.
    Gerekçe: `fit-planim-ilerleme-v1.html` artık ayrı sayfa değil,
    Programlarım'ın sekmesi (`programlarim-v1.html#ilerleme`). Üst çubukta
    yalnız ZİL kalır (§G19 · bildirim orada). Erişim kaybı yok: kalem hem
    modül şeridinde hem Programlarım sekmesinde duruyor. */
'        <button class="btn-login" onclick="location.href=\'fit-giris.html\'"><i class="fa-regular fa-user"></i> Giriş Yap</button>\n'+
'        <div class="acct-item acct-wrap">\n'+
'          <button class="acct-btn" aria-label="Hesabım" aria-haspopup="true">\n'+
'            <span class="acct-ava" style="background-image:url(\''+AVA+'\')"></span>\n'+
'            <i class="fa-solid fa-chevron-down acct-caret"></i>\n'+
'          </button>\n'+
'          <div class="acct-menu">\n'+
'            <div class="acct-id">\n'+
'              <span class="acct-ava" style="background-image:url(\''+AVA+'\')"></span>\n'+
'              <span class="acct-id-txt"><b>'+FIT_USER.ad+'</b><small>'+FIT_USER.handle+'</small></span>\n'+
'            </div>\n'+
'            <div class="acct-div"></div>\n'+
'            '+accountHtml()+'\n'+
'          </div>\n'+
'        </div>\n'+
'        <button class="icon-btn hamburger" id="hamburger" aria-label="Menü"><i class="fa-solid fa-bars"></i></button>\n'+
'      </div>\n'+
'    </div>\n'+
'  </div>\n'+
'</header>';
}

function drawerHtml(){
  return ''+
'<div class="drawer-overlay" id="drawerOverlay"></div>\n'+
'<aside class="drawer" id="drawer" aria-label="Mobil menü">\n'+
'  <div class="drawer-head">\n'+
'    <a class="drawer-brand" href="dadafit-hub-v1.html" aria-label="DadaFit">'+MARK+WORD+'</a>\n'+
'    <button class="drawer-close" id="drawerClose" aria-label="Menüyü kapat"><i class="fa-solid fa-xmark"></i></button>\n'+
'  </div>\n'+
'  <nav class="drawer-nav">\n    '+drawerNavHtml()+'\n  </nav>\n'+
'  <div class="drawer-foot">\n'+
'    <button class="btn btn-primary drawer-login" style="width:100%" onclick="location.href=\'fit-giris.html\'"><i class="fa-regular fa-user"></i> Giriş Yap</button>\n'+
'    <div class="drawer-acct">\n'+
'      <span class="da-ava" style="background-image:url(\''+AVA+'\')"></span>\n'+
'      <div class="da-info">\n'+
'        <b>'+FIT_USER.ad+'</b>\n'+
'        <div class="da-links">\n'+
/* R9 · K66 — "Planım" ve "Ayarlar" bu şeritten kalktı: ikisi de artık
 drawer'ın kendi gövdesinde gerçek kalem ("Planım" nav satırı · "Hesap ve
 Ayarlar" hesap bölümü). Aynı hedefe farklı adla ikinci kapı açılmaz.
 KALANLAR ikisi de zorunlu: "Bildirimler" §1 gereği menüde YOK ve zil @390'da
 gizli — drawer bu sayfanın tek mobil kapısı. "Çıkış" hesap bölümünde bilerek
 basılmıyor, yeri burası. */
'          <a href="fit-bildirimler.html">Bildirimler</a>\n'+
'          <a href="'+FIT_LOGOUT+'">Çıkış</a>\n'+
'        </div>\n'+
'      </div>\n'+
'    </div>\n'+
/* "Antrenör Bul" kısayolu kaldırıldı: drawer menüsündeki "Antrenörler" ile aynı hedefe
 gidiyordu (aynı hedefe farklı adla ikinci kapı açılmaz kuralı).
 "DadaMutfak'a dön" kısayolu da kaldırıldı (belge §1: DadaFit bir alt sayfa gibi
 görünmemeli, hesap/üyelik yapısı bağımsız olmalı). Ekosistem geçişi üst bandın
 marka barında duruyor; kontrollü bağlantı orada. */
/* çekmece dil satırı — üst banttaki menüyle AYNI karar: kilit yok,
 liste var, seçilen dil değişmez, dürüst not dipte. */
'    <div class="drawer-lang" id="drawerLang">\n'+
'      <button class="drawer-lang-toggle" type="button" aria-haspopup="true" aria-expanded="false">\n'+
'        <span class="drawer-lang-label"><i class="fa-solid fa-globe"></i> Dil</span>\n'+
'        <span class="drawer-lang-cur"><span lang="en">EN</span> <i class="fa-solid fa-chevron-down"></i></span>\n'+
'      </button>\n'+
'      <div class="drawer-lang-list" role="menu">\n'+
'        <button type="button" role="menuitemradio" aria-checked="true" class="active" data-lang="tr"><b>TR</b> Türkçe</button>\n'+
'        <button type="button" role="menuitemradio" aria-checked="false" data-lang="en"><b>EN</b> English</button>\n'+
'        <p class="tb-lang-note"><i class="fa-solid fa-flask" aria-hidden="true"></i><span>Bu prototip yalnız Türkçe. İngilizce yüzey henüz üretilmedi.</span></p>\n'+
'      </div>\n'+
'    </div>\n'+
'  </div>\n'+
'</aside>';
}

var FEEDBACK_HTML = `<span class="fb-rail" aria-hidden="true"></span>
<a class="feedback-tab" href="#" id="fbTab" aria-label="Görüş Bildir — öneri ve şikayet">
  <i class="fa-solid fa-comment-dots"></i> Görüş Bildir
</a>

<!-- ===== GÖRÜŞ BİLDİR MODAL ===== -->
<div class="fb-overlay" id="fbOverlay"></div>
<div class="fb-modal" id="fbModal" role="dialog" aria-modal="true" aria-label="Görüş Bildir">
  <div class="fb-panel">
    <div class="fb-head">
      <div>
        <h3>Görüş Bildir</h3>
        <p>Önerin, şikayetin veya sorun — hepsine kulak veriyoruz.</p>
      </div>
      <button class="fb-close" id="fbClose" type="button" aria-label="Kapat"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="fb-body">
      <form id="fbForm">
        <!-- 🔴 DÜRÜSTLÜK — Beyar, bağlayıcı. Bu depo statik bir prototip:
             sunucu yok, form hiçbir yere POST etmiyor. Şerit deponun kendi
             dürüst maket bileşeni (.hr-note — destek-v1 ve talep detayında
             canlı); yeni bileşen üretilmedi ve "Yakında" yazılmadı.
             Formun İÇİNDE duruyor ki gönderim ekranında tekrar etmesin. -->
        <div class="hr-note">
          <i class="fa-solid fa-flask" aria-hidden="true"></i>
          <p><b>Bu ekran maket: görüş gönderilmez.</b> Form bir arka uca bağlı değil — alanları doldurabilirsin ama yazdıkların iletilmez ve kaydedilmez.</p>
        </div>
        <!-- M17: konu tipine göre alan seti değişir (Onedio referansı, mevcut dil korunarak) -->
        <div class="fb-topics" role="group" aria-label="Konu seç">
          <button class="fb-topic active" type="button" data-topic="oneri"><i class="fa-solid fa-lightbulb"></i> Önerim var</button>
          <button class="fb-topic" type="button" data-topic="soru"><i class="fa-solid fa-circle-question"></i> Bir sorum var</button>
          <button class="fb-topic" type="button" data-topic="sorun"><i class="fa-solid fa-bug"></i> Teknik sorun</button>
          <button class="fb-topic" type="button" data-topic="ihlal"><i class="fa-solid fa-shield-halved"></i> İhlal bildirimi</button>
          <button class="fb-topic" type="button" data-topic="puan"><i class="fa-solid fa-face-smile"></i> Puan ver</button>
        </div>

        <div class="fb-fields active" data-for="oneri">
          <!-- 🔴 R18 (2026-08-30) — ŞERİT GÜNCEL MODÜLLERLE EŞLENDİ.
               "Uygulama" kalemi KALKTI: mobil uygulamamız yok, olmayan bir
               yüzey için görüş toplamak yalandı (Beyar, madde 1).
               Kalan kalemler uydurulmadı, ÖLÇÜLDÜ — dördü üst menünün
               (NAV) dört modülünün ta kendisi, beşincisi Egzersizlerim
               modülünün Enerji Defteri sekmesi:
                 NAV → Hareket · Programlar · Challenge · Antrenörler
                 modül sekmesi → egzersizlerim-v1.html#defter
               "Hareketler" çoğul kalıyor: alt bardaki (BOTTOM) ve
               footer'daki kalem de böyle yazıyor, kullanıcı bu adı görüyor.
               Şerit TEK SATIR ve sığmazsa yatay kaydırılır — biçimi
               fit-shell.css .fb-chiprow kuralında, kitin .fit-tabs
               deseniyle (ters tırnak YOK: bu blok bir template literal). -->
          <div class="fb-chiprow" role="group" aria-label="İlgili alan">
            <button class="chip active" type="button">Hareketler</button>
            <button class="chip" type="button">Programlar</button>
            <button class="chip" type="button">Challenge</button>
            <button class="chip" type="button">Antrenörler</button>
            <button class="chip" type="button">Enerji Defteri</button>
            <button class="chip" type="button">Diğer</button>
          </div>
          <div class="fb-field"><textarea required placeholder="Önerini anlat *"></textarea></div>
          <div class="fb-field"><input type="email" placeholder="E-posta adresin (opsiyonel)" /></div>
        </div>

        <div class="fb-fields" data-for="soru">
          <div class="fb-field">
            <select class="fb-select" required>
              <option value="" selected disabled>Sorunun konusu *</option>
              <option>Üyelik & Hesap</option>
              <option>Hareket & Program</option>
              <option>Antrenör randevusu</option>
              <option>DadaFit Pro & Ödeme</option>
              <option>Diğer</option>
            </select>
          </div>
          <div class="fb-field"><textarea required placeholder="Sorunu yaz *"></textarea></div>
          <div class="fb-field"><input type="email" required placeholder="E-posta adresin (cevap için) *" /></div>
        </div>

        <div class="fb-fields" data-for="sorun">
          <div class="fb-field">
            <select class="fb-select" required>
              <option value="" selected disabled>Sorunu nerede yaşadın? *</option>
              <option>Ana sayfa</option>
              <option>Hareket / Egzersiz sayfası</option>
              <option>Arama</option>
              <option>Üyelik & Giriş</option>
              <!-- R18 · "Mobil uygulama" SİLİNDİ — çip şeridindeki
                   "Uygulama" ile aynı yalan; olmayan bir yüzey.
                   "Planım" da ölü ad: modül R15/2'de "Egzersizlerim" oldu. -->
              <option>Egzersizlerim / Enerji Defteri</option>
              <option>Programlarım / Challenge</option>
            </select>
          </div>
          <div class="fb-field"><textarea required placeholder="Sorunu kısaca anlat — ne yaptın, ne oldu? *"></textarea></div>
          <button class="fb-shot" type="button"><i class="fa-solid fa-image"></i> Ekran görüntüsü ekle <small>(opsiyonel)</small></button>
          <div class="fb-field"><input type="email" placeholder="E-posta adresin (opsiyonel)" /></div>
        </div>

        <div class="fb-fields" data-for="ihlal">
          <div class="fb-field"><input type="url" required placeholder="İhlal içeren sayfanın linki *" /></div>
          <div class="fb-field">
            <select class="fb-select" required>
              <option value="" selected disabled>İhlal türü *</option>
              <option>Telif hakkı</option>
              <option>Uygunsuz içerik</option>
              <option>Spam / yanıltıcı içerik</option>
              <option>Diğer</option>
            </select>
          </div>
          <div class="fb-field"><textarea required placeholder="Açıklama *"></textarea></div>
          <div class="fb-field"><input type="email" required placeholder="E-posta adresin *" /></div>
        </div>

        <div class="fb-fields" data-for="puan">
          <p class="fb-q">DadaFit deneyimini nasıl puanlarsın?</p>
          <div class="fb-emoji" role="group" aria-label="Puan">
            <button type="button" data-val="1" aria-label="Çok kötü">😡</button>
            <button type="button" data-val="2" aria-label="Kötü">🙁</button>
            <button type="button" data-val="3" aria-label="İdare eder">😐</button>
            <button type="button" data-val="4" aria-label="İyi">🙂</button>
            <button type="button" data-val="5" aria-label="Harika">😍</button>
          </div>
          <div class="fb-field"><textarea placeholder="Eklemek istediğin bir şey var mı? (opsiyonel)"></textarea></div>
          <div class="fb-field"><input type="email" placeholder="E-posta adresin (opsiyonel)" /></div>
        </div>

        <label class="fb-kvkk">
          <input type="checkbox" required />
          <span><a href="yasal-v1.html?metin=aydinlatma">Aydınlatma Metni</a>'ni ve <a href="yasal-v1.html?metin=kvkk">KVKK Metni</a>'ni okudum, onaylıyorum.</span>
        </label>
        <button class="btn btn-primary fb-send" type="submit"><i class="fa-solid fa-paper-plane"></i> Gönder</button>
      </form>
      <!-- 🔴 Eski hâl SAHTEYDİ: yeşil onay + "Görüşün bize ulaştı / Ekibimiz
           en kısa sürede inceleyip e-posta ile dönüş yapacak". Hiçbiri
           olmuyor — gönderim yok, e-posta yok, inceleyen yok. Metin de
           işaret de gerçeğe çekildi; onay tiki yerine kitin maket ikonu
           (fa-flask — destek şeridiyle aynı), yeşil "başarı" dairesi
           yerine kit §9 boş-durum dairesi. "Yakında" yazılmadı. -->
      <div class="fb-success" id="fbSuccess" hidden>
        <span class="ok"><i class="fa-solid fa-flask" aria-hidden="true"></i></span>
        <h4>Görüşün gönderilmedi — burası maket</h4>
        <p>Yazdıkların hiçbir yere iletilmedi ve kaydedilmedi. Bu ekran, canlı sürümde gönderimden sonra göreceğin adımın yerini tutuyor.</p>
        <button class="btn btn-ghost fb-again" type="button" id="fbAgain">Forma dön</button>
      </div>
    </div>
  </div>
</div>`;

var COOKIE_HTML = `<div class="cookie-banner" id="cookieBanner" role="dialog" aria-label="Çerez onayı" aria-live="polite">
  <div class="cookie-inner">
    <div class="cookie-text">
      <span class="cookie-ico"><i class="fa-solid fa-cookie-bite"></i></span>
      <p>Sana daha iyi bir deneyim sunmak için çerezler kullanıyoruz. Siteyi kullanmaya devam ederek çerez kullanımını kabul etmiş olursun. <a href="yasal-v1.html?metin=cerez">Çerez Politikası</a> · <a href="yasal-v1.html?metin=aydinlatma">KVKK Aydınlatma Metni</a></p>
    </div>
    <div class="cookie-actions">
      <button type="button" class="btn-cookie-reject" id="cookieReject">Reddet</button>
      <button type="button" class="btn-cookie-accept" id="cookieAccept">Tümünü Kabul Et</button>
    </div>
  </div>
</div>
`;

var LGGATE_HTML = `<div class="lg-overlay" id="lgOverlay"></div>
<div class="lg-gate" id="lgGate" role="dialog" aria-modal="true" aria-label="Giriş gerekli">
  <div class="lg-panel">
    <button class="lg-close" id="lgClose" type="button" aria-label="Kapat"><i class="fa-solid fa-xmark"></i></button>
    <span class="lg-ico"><i class="fa-solid fa-lock"></i></span>
    <h4 id="lgTitle">Bu işlem için giriş yap</h4>
    <p id="lgDesc">Kaydetmek, yorum yapmak ve takip etmek için DadaFit hesabına giriş yapman gerekiyor.</p>
    <div class="lg-acts">
      <a class="btn btn-primary" href="fit-giris.html"><i class="fa-regular fa-user"></i> Giriş Yap</a>
      <a class="btn btn-ghost" href="fit-giris.html#kayit">Üye Ol</a>
    </div>
  </div>
</div>

<!-- ===== PRO-GATE (ücretli premium kilit — pro-v1 F1 dili) ===== -->
<div class="pg-overlay" id="pgOverlay"></div>
<div class="pro-gate" id="proGate" role="dialog" aria-modal="true" aria-label="Pro içerik">
  <div class="pg-panel">
    <button class="pg-close" id="pgClose" type="button" aria-label="Kapat"><i class="fa-solid fa-xmark"></i></button>
    <span class="pg-ico"><i class="fa-solid fa-crown"></i></span>
    <span class="pg-tag"><i class="fa-solid fa-lock"></i> DadaFit Pro</span>
    <h4 id="pgTitle">Bu içerik Pro'da</h4>
    <p id="pgDesc">Derin program ve video içeriği DadaFit Pro üyeliğinle açılır.</p>
    <ul class="pg-feats">
      <li><i class="fa-solid fa-check"></i> İleri çok-haftalık programlar</li>
      <li><i class="fa-solid fa-check"></i> Eğitmen eşliğinde video serileri</li>
      <li><i class="fa-solid fa-check"></i> Diyetisyen + antrenör ortak plan</li>
    </ul>
    <div class="pg-acts">
      <a class="btn btn-ghost" href="pro-v1.html">Pro'yu İncele</a>
      <a class="btn btn-fit" href="pro-odeme-v1.html"><i class="fa-solid fa-crown"></i> Pro'ya Geç</a>
    </div>
  </div>
</div>


`;

var FOOTER_RAW = `<footer class="footer orange">
  <div class="wrap">
    <div class="foot-grid">
      <!-- 1 · MARKA ALANI (sol sabit) -->
      <div class="foot-brand">
        <div class="foot-lockup"><svg class="fit-word-mark" viewBox="948.855 2308.020 1129.594 288.296" role="img" aria-label="DadaFit" xmlns="http://www.w3.org/2000/svg"><title>DadaFit</title><path fill-rule="nonzero" fill="currentColor" d="M 1695.214844 2455.363281 C 1717.148438 2455.363281 1731.769531 2472.289062 1731.769531 2492.679688 C 1731.769531 2512.683594 1717.148438 2529.609375 1695.214844 2529.609375 C 1673.292969 2529.609375 1658.667969 2512.683594 1658.667969 2492.679688 C 1658.667969 2472.289062 1673.292969 2455.363281 1695.214844 2455.363281 M 1683.675781 2594.625 C 1705.988281 2594.625 1723.304688 2587.316406 1735.613281 2574.621094 L 1735.613281 2588.855469 L 1801.011719 2588.855469 L 1801.011719 2492.292969 C 1801.011719 2433.433594 1756.769531 2390.347656 1695.214844 2390.347656 C 1635.207031 2390.347656 1589.425781 2436.511719 1589.425781 2492.292969 C 1589.425781 2548.460938 1627.507812 2594.625 1683.675781 2594.625 "/><path fill-rule="nonzero" fill="currentColor" d="M 1481.691406 2455.75 C 1503.625 2455.75 1518.242188 2472.671875 1518.242188 2492.679688 C 1518.242188 2513.070312 1503.625 2529.609375 1481.691406 2529.609375 C 1459.765625 2529.609375 1445.148438 2513.070312 1445.148438 2492.679688 C 1445.148438 2472.671875 1459.765625 2455.75 1481.691406 2455.75 M 1481.691406 2594.625 C 1543.246094 2594.625 1587.492188 2551.921875 1587.492188 2493.0625 L 1587.492188 2308.019531 L 1518.242188 2308.019531 L 1518.242188 2401.503906 C 1506.316406 2394.964844 1492.085938 2390.734375 1477.847656 2390.734375 C 1416.679688 2390.734375 1375.902344 2431.511719 1375.902344 2493.0625 C 1375.902344 2548.84375 1421.683594 2594.625 1481.691406 2594.625 "/><path fill-rule="nonzero" fill="currentColor" d="M 1268.167969 2455.363281 C 1290.101562 2455.363281 1304.722656 2472.289062 1304.722656 2492.679688 C 1304.722656 2512.683594 1290.101562 2529.609375 1268.167969 2529.609375 C 1246.242188 2529.609375 1231.625 2512.683594 1231.625 2492.679688 C 1231.625 2472.289062 1246.242188 2455.363281 1268.167969 2455.363281 M 1256.628906 2594.625 C 1278.945312 2594.625 1296.257812 2587.316406 1308.566406 2574.621094 L 1308.566406 2588.855469 L 1373.96875 2588.855469 L 1373.96875 2492.292969 C 1373.96875 2433.433594 1329.726562 2390.347656 1268.167969 2390.347656 C 1208.160156 2390.347656 1162.378906 2436.511719 1162.378906 2492.292969 C 1162.378906 2548.460938 1200.464844 2594.625 1256.628906 2594.625 "/><path fill-rule="nonzero" fill="currentColor" d="M 1054.648438 2455.75 C 1076.578125 2455.75 1091.199219 2472.671875 1091.199219 2492.679688 C 1091.199219 2513.070312 1076.578125 2529.609375 1054.648438 2529.609375 C 1032.722656 2529.609375 1018.101562 2513.070312 1018.101562 2492.679688 C 1018.101562 2472.671875 1032.722656 2455.75 1054.648438 2455.75 M 1054.648438 2594.625 C 1116.203125 2594.625 1160.445312 2551.921875 1160.445312 2493.0625 L 1160.445312 2308.019531 L 1091.199219 2308.019531 L 1091.199219 2401.503906 C 1079.265625 2394.964844 1065.039062 2390.734375 1050.800781 2390.734375 C 989.636719 2390.734375 948.855469 2431.511719 948.855469 2493.0625 C 948.855469 2548.84375 994.636719 2594.625 1054.648438 2594.625 "/><path fill-rule="nonzero" fill="currentColor" d="M 1931.203125 2389.453125 C 1900.496094 2386.917969 1885.617188 2399.582031 1885.617188 2429.96875 L 1885.617188 2436.300781 L 1931.203125 2436.300781 L 1931.203125 2456.558594 L 1885.617188 2456.558594 L 1885.617188 2594.574219 L 1864.726562 2594.574219 L 1864.726562 2456.558594 L 1837.820312 2456.558594 L 1837.820312 2436.300781 L 1864.726562 2436.300781 L 1864.726562 2429.96875 C 1864.726562 2388.503906 1888.46875 2366.34375 1931.203125 2369.191406 Z M 1931.203125 2389.453125 "/><path fill-rule="nonzero" fill="currentColor" d="M 1943.863281 2436.300781 L 1964.757812 2436.300781 L 1964.757812 2594.574219 L 1943.863281 2594.574219 Z M 1941.964844 2409.078125 C 1935.316406 2402.429688 1935.316406 2391.035156 1941.964844 2384.386719 C 1948.613281 2377.738281 1960.007812 2377.738281 1966.65625 2384.386719 C 1973.304688 2391.035156 1973.304688 2402.429688 1966.65625 2409.078125 C 1960.007812 2415.722656 1948.613281 2415.722656 1941.964844 2409.078125 "/><path fill-rule="nonzero" fill="currentColor" d="M 2078.449219 2456.558594 L 2032.867188 2456.558594 L 2032.867188 2552.472656 C 2032.867188 2579.695312 2048.0625 2577.480469 2078.449219 2576.214844 L 2078.449219 2594.574219 C 2034.136719 2601.222656 2011.976562 2589.195312 2011.976562 2552.472656 L 2011.976562 2456.558594 L 1978.738281 2456.558594 L 1978.738281 2436.300781 L 2011.976562 2436.300781 L 2011.976562 2398.316406 L 2032.867188 2391.984375 L 2032.867188 2436.300781 L 2078.449219 2436.300781 Z M 2078.449219 2456.558594 "/></svg></div>
        <!-- Marka açıklaması — revizyon dokümanından BİREBİR -->
        <p class="foot-tag">Bilimsel temelli hareket içerikleri, uygulanabilir programlar ve ölçülebilir takip araçlarıyla aktif yaşamı herkes için erişilebilir kılıyoruz.</p>
        <!-- SOSYAL — Beyar kararı: YALNIZ Instagram ve YouTube.
             X · Facebook · LinkedIn footer'dan kaldırıldı, geri eklenmez. -->
        <!-- 🔴 R18 · SOSYAL KUTULAR ARTIK BAĞLANTI DEĞİL (Beyar, madde 6)
             ÖLÇÜLEN KUSUR: ikisi de "<a href="#">" idi — footer denetiminde
             "boş hedef" olarak düştüler; tıklayınca hiçbir yere gitmiyor,
             yalnız sayfanın tepesine sıçrıyorlardı. Gerçek hesap adresi
             henüz yok (docs/icerik-bekleyen.md).
             ÇÖZÜM UYDURULMADI: deponun kendi kararı zaten iki satır aşağıda
             duruyor — mağaza kutuları da bu yüzden "<a href>" DEĞİL,
             "<span aria-disabled="true" title="Yakında">". Aynı desen
             buraya da uygulandı: kutu görünür, durum bilgisi (aria-label +
             title) korunur, odak sırasına girmez, ölü bağlantı bitti.
             Adres gelince "<span>" → "<a href>" olur; "data-yer-tutucu"
             işareti tam bunun için duruyor. -->
        <div class="foot-soc">
          <span class="fs-soc" role="img" data-yer-tutucu="instagram" aria-disabled="true" title="Yakında" aria-label="Instagram — hesap adresi henüz yok, yakında"><i class="fa-brands fa-instagram" aria-hidden="true"></i></span>
          <span class="fs-soc" role="img" data-yer-tutucu="youtube" aria-disabled="true" title="Yakında" aria-label="YouTube — hesap adresi henüz yok, yakında"><i class="fa-brands fa-youtube" aria-hidden="true"></i></span>
        </div>
      </div>
      <!-- 2·3·4 · HAREKET VE ÖĞREN / PROGRAMLAR VE UZMAN DESTEĞİ / ENERJİ VE DENGE -->
      <!--FOOT-COLS-->
      <!-- 5 · UYGULAMA ALANI (sağ sabit)
           R11/M4 · Beyar: "Footer'da sağ altta 'yakında' diye bir şey
           kalmayacak — Gourmet'teki gibi yapabilirsin."

           KARDEŞ MARKALAR ÖLÇÜLDÜ (canlı, aynı gün):
             dadadiet.com   → <span>İndir<b>App Store</b></span>
             dadagourmet.com→ <span class="ab-store">App Store</span> · üstte "İndir"
             dadagastro.com → <a class="store-badge" aria-disabled="true"
                                 title="Yakında"><span>İndir</span><b>App Store</b></a>
           Üçünde de görünen yazı "İndir"; üçünde de ayrı bir
           "uygulama henüz yayımlanmadı" paragrafı YOK.

           Doküman şartı DEVAM EDİYOR: "Uygulama henüz yayımlanmadıysa
           mağaza butonları aktif indirme bağlantısı gibi çalışmamalıdır."
           Bu yüzden kutular hâlâ <a href> DEĞİL, <span aria-disabled="true">:
           tıklanamaz, odak sırasına girmez. Gastro'nun kalıbı izlenerek
           title="Yakında" eklendi — durum bilgisi kayboldu sanılmasın,
           yalnız görsel gürültü kalktı. Ekran okuyucu için aynı bilgi
           aria-label icinde de duruyor.
           QR kod KONMADI — gerçek indirme adresi olmadığı için sahte QR
           üretilmedi. Adres gelince docs/icerik-bekleyen.md'deki kalem
           işlenecek. -->
      <div class="foot-app">
        <h5>DadaFit'i İndir</h5>
        <p class="ap-tag">Antrenmanını yanında taşı. Programların, günlük aktiviten ve enerji takibin tek uygulamada.</p>
        <div class="ap-stores" role="group" aria-label="Mobil uygulama mağazaları — uygulama henüz yayımlanmadı">
          <span class="ap-store" aria-disabled="true" title="Yakında"><i class="fa-brands fa-apple" aria-hidden="true"></i><span class="fs-txt"><small>İndir</small><b>App Store</b></span></span>
          <span class="ap-store" aria-disabled="true" title="Yakında"><i class="fa-brands fa-google-play" aria-hidden="true"></i><span class="fs-txt"><small>İndir</small><b>Google Play</b></span></span>
        </div>
      </div>
    </div>
    <!-- 6 · KURUMSAL BANT — sütunların içinde değil, ayrı yatay bant -->
    <nav class="foot-corp" aria-label="Kurumsal bağlantılar"><!--FOOT-CORP--></nav>
    <!-- 7 · YASAL BANT — DOKUNULMAZ (metin · sıra · hedef · renk aynı) -->
    <!--FOOT-LEGAL-->
    <div class="foot-bottom">
      <span class="fb-left">© 2026 <b><span class="bd">dada</span><span class="sf">fit</span></b> · Tüm hakları saklıdır.</span>
      <a href="https://gaviaworks.com" target="_blank" rel="noopener"><span class="gw-code">&lt;/&gt;</span> GaviaWorks</a>
    </div>
  </div>
</footer>
`;

function footerHtml(){
  return FOOTER_RAW
    .replace('<!--FOOT-COLS-->',  footerColsHtml())
    .replace('<!--FOOT-CORP-->',  footerCorpHtml())
    .replace('<!--FOOT-LEGAL-->', footerLegalHtml());
}

/* ============================================================
 3b · MENÜ VERİSİNİN SALT-OKUNUR UCU                    (R19)
 ------------------------------------------------------------
 NEDEN VAR. Yönetim panelinin "Menü ve Navigasyon" ekranı bu
 dizileri yönetmek zorunda ama hepsi bu IIFE'nin İÇİNDE `var`
 ile tanımlı ve dışarıdan görünmüyorlardı (ölçüldü: dışa açık
 on ucun hiçbiri menü verisi vermiyor). Ekran bu yüzden KENDİ
 46 satırlık KOPYASINI tutuyordu ve dosyanın kendi notu bunu
 borç olarak işaretliyordu; gerçek menü ise on dizide 73 kalem.
 Kopya sessizce ayrışır — bu depoda üç kez temizlenen kusur.

 NİYE FONKSİYON, NİYE NESNE DEĞİL. Dizilerin kendisini `window`a
 asmak, 60 public sayfada kabuğun canlı verisini yazılabilir
 kılardı; bir sayfa scripti kalemi değiştirse header'ı sessizce
 bozardı. `menu()` çağrıldığında DERİN KOPYA döner: panel okur,
 kabuk korunur, çağrılmadıkça hiçbir maliyet doğmaz.

 ⚠ Bu blokta ters tırnak (`) KULLANILMAZ — kabuğun template
 literal sabitlerini erken kapatıp 78 sayfada footer'ı düşüren
 kusur budur (docs/lessons.md §30). Yorum da dahil.
 ============================================================ */
window.FIT_SHELL = window.FIT_SHELL || {};
window.FIT_SHELL.menu = function(){
  var kaynak = {
    NAV: NAV, BOTTOM: BOTTOM, ACCOUNT: ACCOUNT,
    FOOTER_COLS: FOOTER_COLS, FOOTER_CORP: FOOTER_CORP, FOOTER_LEGAL: FOOTER_LEGAL,
    PLAN_TABS: PLAN_TABS, PLAN_EXTRA: PLAN_EXTRA, DESTEK_TABS: DESTEK_TABS, RAIL: RAIL
  };
  try { return JSON.parse(JSON.stringify(kaynak)); }
  catch(e){ return kaynak; }   /* döngüsel referans yoktur; yine de sayfa patlamasin */
};

/* ============================================================
 4 · MOUNT — kabuk markup'i sayfaya basilir
 ============================================================ */
var _top = document.getElementById('fitShellTop');
if(_top){
  /* §N18 · rail YALNIZ `body[data-fit-rail="1"]` taşıyan yüzeye biner —
     Fit'te yönetim kabuğu yok (§M8 · Dalga P), bileşen hazır durur. */
  var RAIL_HTML = document.body.getAttribute('data-fit-rail') === '1' ? railHtml() + '\n' : '';
  _top.outerHTML = RAIL_HTML + TOPBAR + '\n' + headerHtml() + '\n' + drawerHtml() +
    '\n<nav class="bottom-nav alt-cubuk" aria-label="Mobil alt navigasyon">\n  ' + bottomNavHtml() + '\n</nav>\n' +
    FEEDBACK_HTML + '\n' + COOKIE_HTML;
}
var _bot = document.getElementById('fitShellBottom');
if(_bot){
  /* DadaMentor kaldirildi (belge §1 ve §21: yerine baska bir yapay zeka
     asistani da eklenmez). Not: MENTOR_HTML kendi icinde de bir
     <button id="toTop"> tasiyordu, yani sayfada AYNI id'den iki dugme
     olusuyordu — blok kalkinca o cift-id hatasi da kapandi. */
  _bot.outerHTML = LGGATE_HTML + '\n' + footerHtml() +
    '\n<button class="to-top" id="toTop" type="button" aria-label="Basa don"><i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button>';
}

/* =====================================================================
 R15/5 · ANTRENÖR SOHBETİ MODÜLÜ — TEK NOKTADAN YÜKLEME
 ---------------------------------------------------------------------
 `assets/js/fit-mesaj.js` yüzen sohbet düğmesini ve sağdan açılan paneli
 kendi kendine kurar. 62 sayfaya ayrı ayrı `<script>` satırı yazmak yerine
 kabuk tek yerden enjekte ediyor: yeni sayfa açan hiç kimsenin bu satırı
 hatırlaması gerekmiyor.

 · CSS satırı GEREKMİYOR — modül kendi `<link>`ini `document.currentScript.src`
   üzerinden türetip enjekte ediyor ve çift yüklemeyi kendi kontrol ediyor
   (dinamik enjeksiyonda da doğrulandı).
 · `mesajlarim-v1.html` kendi `<script>` satırını taşıyor; modül çift
   yüklemeye karşı korumalı, yine de burada `querySelector` ile bakıyoruz.
 · Kabuğun kendi yolundan türetiliyor ki alt dizinden açılan sayfa da
   doğru adresi bulsun.
 ===================================================================== */
/* R15/6 · ROZET/PUAN MOTORU da kabuktan yükleniyor. Sebep ölçüldü: kimlik
   kartının istatistik şeridi 8 modül sayfasında basılıyor ama `fit-rozet.js`
   yalnız 4 sayfada `<script>` ile çağrılıyordu; kalan 4'te `FIT_ROZET`
   tanımsız kalıyor ve "Kazanılan rozet" ile "Toplam puan" kutuları hep "—"
   gösteriyordu. Modül saf sözleşme modülü — DOM'a ya da CSS'e dokunmuyor,
   yalnız `dm_fit_rozet_v1`i okuyup `window.FIT_ROZET`i açıyor. */
function _modulYukle(dosya){
  if(document.querySelector('script[src*="'+dosya+'"]')) return;
  var kok = '';
  try{
    var kabuk = document.querySelector('script[src*="fit-shell.js"]');
    if(kabuk) kok = (kabuk.getAttribute('src')||'').replace(/fit-shell\.js.*$/,'');
  }catch(e){}
  var sc = document.createElement('script');
  sc.src = (kok || 'assets/js/') + dosya;
  sc.defer = true;
  document.body.appendChild(sc);
}

function _mesajYukle(){
  /* Belge TAMAMEN ayrıştırıldıktan sonra bakılır: kabuk `<script>`i sayfanın
     kendi `fit-mesaj.js` satırından ÖNCE koştuğu için erken bakış onu
     göremiyor ve ikinci bir etiket basılıyordu (ölçüldü: mesajlarim-v1'de
     script sayısı 2). Modül çift yüklemeye karşı zaten korumalı ama iki
     etiket bırakmak yanıltıcı. */
  if(document.querySelector('script[src*="fit-mesaj.js"]')) return;
  var kok = '';
  try{
    var kabuk = document.querySelector('script[src*="fit-shell.js"]');
    if(kabuk) kok = (kabuk.getAttribute('src')||'').replace(/fit-shell\.js.*$/,'');
  }catch(e){}
  var sc = document.createElement('script');
  sc.src = (kok || 'assets/js/') + 'fit-mesaj.js';
  sc.defer = true;
  document.body.appendChild(sc);
}
function _rozetYukle(){ _modulYukle('fit-rozet.js'); }
/* R20/K10 · SU MODÜLÜ DE KABUKTAN. Ölçüldü: `fit-su.js` yalnız 4 sayfada
   script satırı taşıyordu; rozet motorunu kullanan 12 sayfanın 9'unda
   `window.FIT_SU` tanımsız kalıyor ve su rozetleri `simdi:0` görünüyordu.
   Sonuç kendisiyle çelişen bir karttı: rozetlerim-v1'de mühürlenmiş `su-ilk`
   "%100 kazanıldı · şimdi 0" diyordu, egzersizlerim-v1'de aynı rozet 1'di.
   `fit-rozet.js` için AYNI sebeple (R15/6) zaten yapılmış olan şey. */
function _suYukle(){ _modulYukle('fit-su.js'); }
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', _mesajYukle);
  document.addEventListener('DOMContentLoaded', _rozetYukle);
  document.addEventListener('DOMContentLoaded', _suYukle);
} else { _mesajYukle(); _rozetYukle(); _suYukle(); }

/* ---- FİT PLANIM kişisel kabuğu: banner + breadcrumb + sekme rayı ---- */
/* R11/M17 · plan profilinin kapak görseli — tek yerde, 14 sayfa ortak */
var PLAN_KAPAK = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&q=80&auto=format&fit=crop&sat=-12';
var _plan = document.getElementById('fitPlanTop');
if(_plan){
  var pk    = _plan.getAttribute('data-plan-page') || 'bugun';
  var ptit  = _plan.getAttribute('data-plan-title') || 'Fit Planım';
  var psub  = _plan.getAttribute('data-plan-sub') || '';
  var cur   = null;
  /* Başlık/breadcrumb çözümü TÜM plan sayfalarından (ray dışındakiler dahil),
     ray ise YALNIZ altı sekmeden üretilir (belge §4). */
  for(var pi=0;pi<PLAN_PAGES.length;pi++){ if(PLAN_PAGES[pi].key===pk) cur=PLAN_PAGES[pi]; }
  /* G2 — sekme rayı B1'de sabitlenen ORTAK bileşene geçti (.fit-tabs).
     Sayfa geçişi kipi: kalemler <a>, aktif olan aria-selected="true" +
     aria-current="page" taşır; bileşen JS'i bu kipte panel yönetmez,
     yalnız rolleri kurar (bkz. fit-shell.js → [data-fit-tabs]). */
  /* R10 · K29 — RAY BÖLÜME GÖRE SEÇİLİR (yukarıdaki DEFTER_TABS yorumuna bak).
     Eski RAY_UST eşlemesi alt sayfaları 'defter' anahtarına çeviriyordu, ama
     K66'dan beri 'defter' PLAN_TABS'te yok — hiçbir kalem aktif olmuyordu. */
  /* §Ö2/§Ö3 — üçüncü ray kiti: destek modülü. Desen DEFTER_TABS'inkiyle
     aynı, yeni mekanizma kurulmadı. */
  /* R18 — üçüncü kit (DEFTER_TABS) düştü; iki kit kaldı: destek ve Planım. */
  var destekAnahtar = ['destek-talepleri','destek','destek-detay'];
  var rayKit    = (destekAnahtar.indexOf(pk)>-1) ? DESTEK_TABS : PLAN_TABS;
  var rayAdi    = (rayKit===DESTEK_TABS) ? 'destek' : 'planim';
  var rayEtiket = (rayKit===DESTEK_TABS) ? 'Destek merkezi bölümleri' : 'Fit Planım bölümleri';
  /* §Ö3 · aktif kalem TEK olmalı (`[aria-current=page]` sayısı === 1).
     Talep detayı şeridin kendi kalemi DEĞİLDİR; atası "Destek Taleplerim"
     aktif görünür — yoksa detay ekranında hiçbir kalem işaretlenmezdi. */
  var rayAktif = (pk==='destek-detay') ? 'destek-talepleri' : pk;
  var tabs = rayKit.map(function(it){
    var on = it.key===rayAktif;
    return '<a class="fit-tab" href="'+it.href+'" aria-selected="'+(on?'true':'false')+'"'+
           (on?' aria-current="page"':'')+'><i class="'+it.icon+'"></i> '+it.label+'</a>';
  }).join('\n        ');
  /* R11/M17 · Beyar: "enerji-defteri'nin profilini DadaGastro'nun aynısı
     yap — dadagastro.com/sefler/admin, burasının aynısını yapacaksın."

     ÖNCESİ: 544px DÜZ KOYU banner (.lib-top.fp-top); profil altta küçük bir
     avatar+ad satırıydı (.fp-who).
     ŞİMDİ: kardeş markanın şef profili deseni — yuvarlak köşeli kapak
     görseli + üstüne binen beyaz kimlik kartı + sayaç şeridi.
     Biçim kabukta: fit-shell.css → "PLAN PROFİL BAŞLIĞI".

     Desen DadaFit'te zaten vardı (profil-v1 `.pf-top`) ve referansla
     birebirdi (banner 280/24px · avatar 128 · stats 16px) — plan sayfaları
     onu kullanmıyordu. profil-v1'e DOKUNULMADI; rol koşullu 69 kuralı
     taşımak yerine ölçülen değerlerle sade bir sürüm yazıldı.

     Kapak görseli sabit (parallax) — kardeş markada da öyle
     (`.pf-banner px-band`); `data-fit-px` ile kabuğun parallax bileşenine
     bağlanıyor (R11/M2). */
  _plan.outerHTML =
   '<section class="fp-profil">\n'+
   '  <div class="wrap">\n'+
   '    <nav class="lib-crumb pf-crumb" aria-label="Sayfa yolu">\n'+
   '      <a href="dadafit-hub-v1.html" class="crumb-home">'+
   '<i class="fa-solid fa-house" aria-hidden="true"></i>'+
   '<span class="sr-only">DadaFit ana sayfa</span></a>\n'+
   '      <i class="fa-solid fa-chevron-right"></i>\n'+
   '      <a href="fit-programlarim.html">Fit Planım</a>\n'+
   '      <i class="fa-solid fa-chevron-right"></i>\n'+
   '      <span class="cur">'+(cur?cur.label:ptit)+'</span>\n'+
   '    </nav>\n'+
   '    <div class="fp-kapak" data-fit-px style="--px-img:url(\''+PLAN_KAPAK+'\')">\n'+
   '      <span class="fp-kapak-mark"><i class="fa-solid fa-bolt"></i> Fit Planım · kişisel alanın</span>\n'+
   '    </div>\n'+
   '    <div class="fp-kimlik">\n'+
   '      <span class="fp-ava2" style="background-image:url(\''+AVA+'\')"></span>\n'+
   '      <div class="fp-kimlik-id">\n'+
   '        <h1>'+ptit+'</h1>\n'+
   /* R12 EK TUR · R21 — Beyar: "rozetlerim kısmını düzeltmei istiyorum
      bursı saçma olmuş". Ölçüldü: "Rozetlerim" DOM'da zaten bu meta
      satırındaydı (S13 önerisi zaten karşılanmıştı) ama yalnız görünüyordu
      — kök neden komşu `.fp-state`/`.fp-name` sınıfları eski KOYU banner
      kitinden kalmaydı (`.fp-state{color:rgba(255,255,255,.66)}` ·
      `.fp-name{color:#fff}`, fit-shell.css ~line 1678); beyaz karta
      taşınırken de kullanılmaya devam etmişler ve beyaz zeminde
      beyaza-yakın metin bırakmışlar (docs/lessons.md §2 — sonda/göz
      körlüğü, ekran görüntüsüyle doğrulandı). "Elif Şahin" yalnız daha
      özgül bir kural (.fp-kimlik-id .fp-handle2) sayesinde okunur kalmıştı.
      Düzeltme: iki span da hesabim-v1.html'in ZATEN DOĞRU çalışan meta
      satırı kalıbına (düz <span>, .fp-kimlik-meta'dan miras --muted rengi)
      çekildi — yeni sınıf icat edilmedi. `.fp-state`/`.fp-name` ve eski
      `.fp-who`/`.fp-ava`/`.fp-who-txt` kiti bu değişiklikle son canlı
      referanslarını da kaybediyor → ÖLÜ KURAL (fit-shell.css'te işaretli,
      KARARLAR.md K68). */
   '        <span class="fp-handle2">'+FIT_USER.ad+'</span>\n'+
   (psub? '        <p class="fp-lead2">'+psub+'</p>\n' : '')+
   '        <div class="fp-kimlik-meta">\n'+
   '          <span><i class="fa-solid fa-user"></i> Ücretsiz üye · 3 haftadır burada</span>\n'+
   '          <a href="fit-rozetlerim.html"><i class="fa-solid fa-award"></i> Rozetlerim</a>\n'+
   '        </div>\n'+
   '      </div>\n'+
   '    </div>\n'+
   '  </div>\n'+
   '</section>\n'+
   '<div class="pf-tabbar fp-tabbar">\n'+
   '  <div class="wrap">\n'+
   '    <nav class="fit-tabs" data-fit-tabs="'+rayAdi+'" aria-label="'+rayEtiket+'">\n        '+tabs+'\n    </nav>\n'+
   '  </div>\n'+
   '</div>\n'+
   /* R8 madde 36 — PROTOTİP UYARISI ÇIKTI, GİRİŞ KAPISI KALDI.
    Blok 13 sayfada görünüyordu (4 enerji-defteri + 9 fit-planim) ve iki işi
    birden yapıyordu: "bu veriler örnektir" prototip uyarısı + misafirin
    giriş CTA'sı. Beyar: cümle gitsin, düğmeler kalsın.
    Çıkan: `<i class="fa-circle-info">` + "veriler örnektir" paragrafı.
    Kalan: `.fp-gate-acts` (Giriş Yap · Ücretsiz hesap oluştur), `data-lg-only`
    kapısı, `.fp-gate` sarmalayıcısı — yani 13 sayfada giriş CTA'sı korundu.
    Blok artık info kutusu değil CTA bandı; biçimi de ona göre değişti
    (fit-shell.css `.fp-gate-in`). */
   '<div class="wrap fp-gate" data-lg-only>\n'+
   '  <div class="fp-gate-in">\n'+
   '    <span class="fp-gate-acts"><a class="btn btn-primary" href="fit-giris.html"><i class="fa-regular fa-user"></i> Giriş Yap</a><a class="btn btn-ghost" href="fit-giris.html#kayit">Ücretsiz hesap oluştur</a></span>\n'+
   '  </div>\n'+
   '</div>';
}

/* =====================================================================
 MODÜL KABUĞU — #fitModulTop   (R15/2 · Beyar kararı, 2026-08-29)
 ---------------------------------------------------------------------
 Menü modül menüsü olunca (R15/1) modüller kendi ADRESLERİNE taşındı ve
 her modül kendi sekmelerini aldı. Planım kabuğundan (#fitPlanTop) TEK
 farkı var, o fark da şartnamenin kendisi:

   #fitPlanTop  → sekmeler <a>; tıklayınca SAYFA DEĞİŞİR, kimlik kartı
                  baştan kurulur
   #fitModulTop → sekmeler <button>, panel kipi; SAYFA DEĞİŞMEZ →
                  "Kimlik kartı sekme değişince KAYBOLMAZ, sabit kalır"

 Kimlik kartı kiti (.fp-profil / .fp-kapak / .fp-kimlik) BİREBİR Planım
 kabuğundan alındı — yeni görsel dil icat edilmedi. Tek ekleme şartnamenin
 istediği KULLANICI ADI (@handle); Planım kabuğunda yalnız ad vardı.

 Şerit kabuğun ORTAK sekme bileşenine bağlanır ([data-fit-tabs] · panel
 kipi): rol/aria/klavye/roving-tabindex orada kuruludur, burada
 tekrarlanmaz. Bileşen geçişte scroll ÇAĞIRMAZ; kart yerinde kalır.

 KULLANIM
   <div id="fitModulTop"
        data-modul="egzersizlerim"
        data-modul-title="Egzersizlerim"
        data-modul-sub="…"
        data-modul-tabs="anahtar:Etiket:fa-solid fa-x|anahtar2:Etiket2:fa-solid fa-y"
        data-modul-aktif="anahtar"></div>
   <div class="modul-govde">
     <div class="fit-pane" data-pane="anahtar">…</div>
     <div class="fit-pane" data-pane="anahtar2" hidden>…</div>
   </div>

 `data-modul-tabs` BOŞ bırakılırsa şerit HİÇ basılmaz — Challenge'larım
 şartnamede sekmesiz tek ekrandır; boş bir şerit basmak yalan olurdu.

 ⚠ `.modul-govde` OPAK ve tam genişlikte olmalı: yukarıdaki "PLAN KABUĞU ·
 dikişi rayın dibine çek" bloğu rayın altındaki SAYDAM blokları gövdenin
 içine taşır. Gövde opak olduğu için o blok onu hedef sayar ve hiçbir şey
 taşımaz — panel kipi bozulmaz (ölçüldü).
 ===================================================================== */
var _modul = document.getElementById('fitModulTop');
if(_modul){
  var mk    = _modul.getAttribute('data-modul') || 'modul';
  var mtit  = _modul.getAttribute('data-modul-title') || 'Modülüm';
  var msub  = _modul.getAttribute('data-modul-sub') || '';
  var mham  = (_modul.getAttribute('data-modul-tabs') || '').trim();
  var maktif= _modul.getAttribute('data-modul-aktif') || '';

  /* "anahtar:Etiket:ikon|…" → dizi. Ayrıştırma burada, çünkü sayfa
     markup'ında ham HTML tekrar etmesin: 7 modül sayfası tek satır yazar. */
  var mtabs = mham ? mham.split('|').map(function(p){
    var q = p.split(':');
    return { key:(q[0]||'').trim(), label:(q[1]||'').trim(), icon:(q[2]||'fa-solid fa-circle').trim() };
  }).filter(function(t){ return t.key && t.label; }) : [];

  if(mtabs.length && !mtabs.some(function(t){ return t.key===maktif; })) maktif = mtabs[0].key;

  /* DERİN BAĞLANTI — #<sekme>. Modüller kendi adreslerine taşınınca (R15/2)
     eski sayfaların bağlantıları da taşındı: `programlarim-v1.html#takvim`
     yerine `programlarim-v1.html#takvim`. Hash bir SEKME ANAHTARIYSA açılışta
     o sekme seçilir; değilse (bölüm çapası, ör. #kaydettiklerim) dokunulmaz ve
     tarayıcının normal çapa davranışı sürer. */
  var mhash = (location.hash || '').replace('#','');
  if(mhash && mtabs.some(function(t){ return t.key===mhash; })) maktif = mhash;
  /* 🔴 R18 · ALT SEKME VE ÇAPA DERİN BAĞLANTISI (2026-08-30, madde 2)
     Enerji Defteri'nin üç alt sayfası bu turda silinip modülün İÇİNDE alt
     sekme oldu (`#defter-su` · `#defter-dengele` · `#defter-haftalik`).
     Footer, admin menü verisi ve dışarıdan gelen eski bağlantılar bu
     adreslere iniyor — hash bir MODÜL sekmesi değil.

     Kural GENEL yazıldı, `defter-*`e özel değil: hash neyi işaret ediyorsa
     (bir alt panel ya da bir BÖLÜM ÇAPASI, ör. `#yediklerim`), onu taşıyan
     panel zinciri açılır. Ölçülen kusur buydu — `#yediklerim` defterin
     içindeki bir bölümdü ama sayfa "Egzersizlerim" sekmesiyle açılıyor,
     çapa gizli panelde kalıyordu.

     Sekme bileşeni ([data-fit-tabs]) açılış durumunu MARKUP'tan okuduğu için
     burada işaretlemek yetiyor; bileşene özel kanal açılmadı. Bu blok
     bileşenden ÖNCE koşar, yani bileşen doğru başlangıcı görür. */
  else if(mhash && /^[\w-]+$/.test(mhash)){
    var _hedef = document.querySelector('.fit-pane[data-pane="' + mhash + '"]')
              || document.getElementById(mhash);
    var _ic  = _hedef ? _hedef.closest('.fit-pane[data-pane]') : null;   /* hedefi taşıyan en iç panel */
    var _mod = _ic;
    while(_mod && !mtabs.some(function(t){ return t.key === _mod.getAttribute('data-pane'); })){
      _mod = _mod.parentElement ? _mod.parentElement.closest('.fit-pane[data-pane]') : null;
    }
    if(_mod){
      maktif = _mod.getAttribute('data-pane');
      if(_ic && _ic !== _mod){
        var _ikey = _ic.getAttribute('data-pane');
        var _kap  = _ic.closest('[data-fit-tabs-scope]') || _mod;
        Array.prototype.forEach.call(_kap.querySelectorAll('[data-fit-tabs] .fit-tab'), function(t){
          var on = t.getAttribute('data-tab') === _ikey;
          t.classList.toggle('active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        Array.prototype.forEach.call(_kap.querySelectorAll('.fit-pane[data-pane]'), function(pn){
          if((pn.closest('[data-fit-tabs-scope]') || _kap) !== _kap) return;   /* daha derin kapsam bizim işimiz değil */
          pn.hidden = pn.getAttribute('data-pane') !== _ikey;
        });
      }
      /* Hedef bir PANEL değil bir çapaysa, tarayıcının çapa sıçraması
         panel gizliyken kaçmış olur — panel açıldıktan sonra bir kez
         hizalanır. Sekme DEĞİŞİMİNDE scroll YOK (kit §6); bu yalnız
         açılışta ve yalnız açık bir çapa isteği varken koşar. */
      if(_hedef && _hedef !== _ic){
        var _capa = _hedef;
        setTimeout(function(){ try{ _capa.scrollIntoView({block:'start'}); }catch(e){} }, 0);
      }
    }
  }

  var mtabHtml = mtabs.length
    ? '<div class="pf-tabbar fp-tabbar">\n  <div class="wrap">\n' +
      '    <nav class="fit-tabs" data-fit-tabs="' + mk + '" aria-label="' + mtit + ' bölümleri">\n      ' +
      mtabs.map(function(t){
        var on = t.key === maktif;
        return '<button class="fit-tab' + (on?' active':'') + '" type="button" data-tab="' + t.key +
               '" aria-selected="' + (on?'true':'false') + '"><i class="' + t.icon + '"></i> ' + t.label + '</button>';
      }).join('\n      ') +
      '\n    </nav>\n  </div>\n</div>\n'
    : '';

  /* =====================================================================
     R16 · KİMLİK KARTI = PROFİL KARTI  (Beyar kararı, 2026-08-29 · §W2)
     ---------------------------------------------------------------------
     Öncesi: <h1> SAYFA ADINI basıyordu ("Egzersizlerim", "Programlarım",
     "Challenge'larım", "Destek Merkezi", "Mesajlarım"). Beyar: kart bir
     PROFİL kartıdır, sayfa başlığı değil — sayfa adı zaten kartın
     ALTINDAKİ sekme şeridinde duruyor (ve kırıntının son kaleminde).
     Artık kartın içeriği SEKMEDEN BAĞIMSIZ: hangi sekme açık olursa
     olsun aynı beş satır ve aynı beş kutu görünür.

     Emsal: dadagastro.com/sefler/admin (.pf-head + .pf-stats). Yapı ve
     ölçüler oradan, renkler kitten — `--fit` · `--fit-tint` · `--fit-deep`
     · `--line` · `--slate` · `--muted`; yeni renk üretilmedi.
     İstatistik hücresi YENİ DEĞİL: `antrenor-detay-v1.html`in `.cp-stats`
     / `.cps` kiti (emsalin `.pf-stats`/`.pfs`'iyle birebir aynı yapı)
     kabuğa taşındı, sınıf adları aynen korundu.

     🔴 UYDURULMAYAN ALANLAR — kaynak yok, değer "—" bırakıldı:
       · üyelik tarihi   → `dm_user` şeması {auth,roles[],verified,level};
                           kayıt tarihi alanı YOK (ölçüldü)
       · rozet sayısı    → `dm_fit` şemasında rozet alanı YOK
       · toplam puan     → `dm_fit` şemasında puan alanı YOK
     Gerçek kaynağı olan üç kutu VERİDEN okunur (`dm_fit`):
       · tamamlanan antrenman → gecmis.length
       · aktif program        → program.durum === 'devam'
       · challenge            → challenge.durum === 'devam'
     `dm_fit` doğrudan okunuyor çünkü `FIT_SHELL.state` bu bloktan SONRA
     tanımlanıyor (dosya sırası) — aynı anahtar, aynı veri.
     ===================================================================== */
  var mDurum = (function(){
    try{ return JSON.parse(localStorage.getItem('dm_fit')||'null') || {}; }catch(e){ return {}; }
  })();
  var mBiten  = Array.isArray(mDurum.gecmis) ? mDurum.gecmis.length : 0;
  var mProg   = (mDurum.program   && mDurum.program.durum   === 'devam') ? 1 : 0;
  var mChall  = (mDurum.challenge && mDurum.challenge.durum === 'devam') ? 1 : 0;
  var YOK     = '—';

  /* Kademe rozeti. ⚠ ÖLÇÜLDÜ: `dm_user` şemasında `paket` alanı YOK
     ({auth,roles[],verified,level}); depodaki `paket` anahtarı
     uyelik-faturalandirma-v1'in KENDİ yerel durumu ve değerleri t0/t2…
     Alan ileride gelirse burası onu okur; gelene kadar paketsiz hesabın
     doğru kademesi Ücretsiz'dir (K6 geri alındıktan sonra iki kademe var:
     Ücretsiz · Pro). Sayı uydurulmadı, varsayılan durum yazıldı. */
  /* ⚠ ADLANDIRMA DÜZELTİLDİ: bu rozet PAKETİ gösteriyor, kademeyi değil.
     Değişken `mKademe` adını taşıyordu ve yanına gerçek kademe rozeti
     gelince iki ayrı şey aynı adı paylaşacaktı — Beyar'ın açıkça uyardığı
     karışıklık ("paket satın alınır, kademe kazanılır"). */
  var mPaket = (function(){
    try{
      var u = JSON.parse(localStorage.getItem('dm_user')||'null');
      return {pro:'Pro', pro_max:'Pro Max'}[u && u.paket] || 'Ücretsiz';
    }catch(e){ return 'Ücretsiz'; }
  })();

  function mKutu(ikon, etiket, deger, tutucu){
    /* `data-kutu` KALICI tutamak, `data-yer-tutucu` GEÇİCİ damga:
       değer gerçek kaynaktan gelince damga siliniyor ama kutuyu bir daha
       bulabilmek gerekiyor (ölçüldü: damga silinince ikinci boyama kutuyu
       kaybediyordu ve sayı ilk değerinde donuyordu). */
    return '      <div class="cps'+(tutucu?'" data-kutu="'+tutucu+'" data-yer-tutucu="'+tutucu:'')+'">'+
           '<i class="'+ikon+'" aria-hidden="true"></i>'+
           '<div><span>'+etiket+'</span><b>'+deger+'</b></div></div>\n';
  }

  _modul.outerHTML =
   '<section class="fp-profil">\n'+
   '  <div class="wrap">\n'+
   '    <nav class="lib-crumb pf-crumb" aria-label="Sayfa yolu">\n'+
   '      <a href="dadafit-hub-v1.html" class="crumb-home">'+
   '<i class="fa-solid fa-house" aria-hidden="true"></i>'+
   '<span class="sr-only">DadaFit ana sayfa</span></a>\n'+
   '      <i class="fa-solid fa-chevron-right"></i>\n'+
   '      <span class="cur">'+mtit+'</span>\n'+
   '    </nav>\n'+
   '    <div class="fp-kapak" data-fit-px style="--px-img:url(\''+PLAN_KAPAK+'\')">\n'+
   '      <span class="fp-kapak-mark"><i class="fa-solid fa-bolt"></i> DadaFit · kişisel alanın</span>\n'+
   '    </div>\n'+
   '    <div class="fp-kimlik">\n'+
   '      <span class="fp-ava2" style="background-image:url(\''+AVA+'\')"></span>\n'+
   '      <div class="fp-kimlik-id">\n'+
   /* İKİ AYRI ROZET, YAN YANA:
        paket  — satın alınır, `dm_user.paket`ten okunur, ikon fa-crown
        kademe — kazanılır, `FIT_ROZET.kademe()`den gelir, ikon kendi ailesinden
      Kademe burada BOŞ basılıyor ve motor yüklenince aşağıdaki blok
      dolduruyor: `fit-rozet.js` kabuktan SONRA yükleniyor, burada
      okumaya çalışmak her sayfada "Kademesiz" yazdırırdı. */
   '        <h1>'+FIT_USER.ad+
   ' <span class="fp-badge is-paket"><i class="fa-solid fa-crown" aria-hidden="true"></i> '+mPaket+'</span>'+
   ' <span class="fp-badge is-kademe" data-kademe hidden></span></h1>\n'+
   '        <span class="fp-handle2"><span class="fp-uad">'+FIT_USER.handle+'</span></span>\n'+
   '        <div class="fp-kimlik-meta">\n'+
   '          <span><i class="fa-solid fa-calendar-days" aria-hidden="true"></i> Üyelik tarihi '+YOK+'</span>\n'+
   '          <span><i class="fa-solid fa-award" aria-hidden="true"></i> Rozet '+YOK+'</span>\n'+
   '        </div>\n'+
   /* Modülün tanıtım cümlesi kartın İÇİNDE kalır — sekmeye göre değişmeyen
      sayfa düzeyi bir metin, ayrıca kartın dışına alınsaydı istatistik
      şeridinin altında öksüz bir paragraf olurdu (ölçüldü, ekran). */
   (msub? '        <p class="fp-lead2">'+msub+'</p>\n' : '')+
   '      </div>\n'+
   '    </div>\n'+
   '    <div class="cp-stats pf-stats" role="group" aria-label="Fit özetin">\n'+
   mKutu('fa-solid fa-dumbbell',   'Tamamlanan antrenman', mBiten) +
   mKutu('fa-solid fa-list-check', 'Aktif program',        mProg) +
   mKutu('fa-solid fa-award',      'Kazanılan rozet',      YOK, 'fit-rozet-sayisi') +
   mKutu('fa-solid fa-trophy',     'Challenge',            mChall) +
   mKutu('fa-solid fa-star',       'Toplam puan',          YOK, 'fit-toplam-puan') +
   '    </div>\n'+
   '  </div>\n'+
   '</section>\n'+
   mtabHtml;

  /* ---- ROZET VE PUAN KUTULARI — GERÇEK VERİYE BAĞLANIYOR ------------
     Kutular `fit-rozet-sayisi` / `fit-toplam-puan` id'leriyle "—" olarak
     basılıyor (kaynak yokken uydurma sayı yazmamak için). `FIT_ROZET`
     yüklendiğinde ikisi de gerçek değeri alır: `ozet().kazanildi` ve
     `puan()`. Motor kabuktan sonra yüklendiği için olayla bekliyoruz;
     zaten yüklüyse hemen boyuyoruz. */
  (function(){
    function rozetBas(){
      var R = window.FIT_ROZET; if(!R) return;
      /* Kutular id DEĞİL `data-yer-tutucu` taşıyor (mKutu'nun 4. argümanı).
         Değer gerçek kaynaktan gelince yer tutucu damgası da SİLİNİYOR —
         dolu bir kutunun üstünde "kaynağı yok" işareti kalmamalı. */
      var a = document.querySelector('[data-kutu="fit-rozet-sayisi"] b');
      var b = document.querySelector('[data-kutu="fit-toplam-puan"] b');
      function damgaSil(el){ var k = el && el.closest('[data-yer-tutucu]'); if(k) k.removeAttribute('data-yer-tutucu'); }
      try{
        if(a && R.ozet){ a.textContent = String(R.ozet().kazanildi); damgaSil(a); }
        if(b && R.puan){ b.textContent = String(R.puan());           damgaSil(b); }
        /* meta satırındaki "Rozet —" de aynı sayıyı taşır */
        var meta = document.querySelector('.fp-kimlik-meta span:last-child');
        if(meta && R.ozet) meta.innerHTML =
          '<i class="fa-solid fa-award" aria-hidden="true"></i> Rozet ' + R.ozet().kazanildi;

        /* KADEME ROZETİ — paket rozetinin YANINA. Kademesizken (sira 0)
           basılmıyor: olmayan bir kademeyi rozetle göstermek yalan olurdu. */
        var kb = document.querySelector('[data-kademe]');
        if(kb && R.kademe){
          var k = R.kademe();
          if(k && k.sira){
            kb.innerHTML = '<i class="'+(k.ico||'fa-solid fa-ranking-star')+'" aria-hidden="true"></i> '+k.ad;
            kb.setAttribute('title', k.ad+' — '+k.sira+'/'+k.toplam+' kademe');
            kb.hidden = false;
          } else { kb.hidden = true; }
        }
      }catch(e){}
    }
    rozetBas();
    window.addEventListener('fit-rozet-degisti', rozetBas);
    document.addEventListener('fit:state', rozetBas);
    /* motor kabuktan SONRA yükleniyor: ilk boyama için bir tur bekle */
    if(!window.FIT_ROZET) setTimeout(rozetBas, 0);
    window.addEventListener('load', rozetBas);
  })();

  /* ---- AYNI SAYFAYA GİDEN SEKME BAĞLANTILARI --------------------------
     Taşınan içeriğin içinde kardeş sekmeye giden bağlantılar var
     (ör. Bugün ekranındaki "Plan ve Takvim" kısayolu). Bunlar artık
     `programlarim-v1.html#takvim`e işaret ediyor — çalışır ama SAYFAYI
     YENİLER. Şartname "sayfa değişmeden" diyor, o yüzden aynı sayfaya
     giden bağlantı gezinme yerine sekme geçişine çevrilir.
     Başka sayfaya giden bağlantıya DOKUNULMAZ. */
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]');
    if(!a) return;
    var h = a.getAttribute('href') || '';
    var pr = h.split('#'); if(pr.length < 2 || !pr[1]) return;
    var dosya = pr[0].split('?')[0];
    var buSayfa = location.pathname.split('/').pop();
    if(dosya && dosya !== buSayfa) return;              /* başka sayfa */
    var hedef = document.querySelector('.fit-tab[data-tab="'+pr[1]+'"]');
    if(!hedef) return;                                  /* bölüm çapası — dokunma */
    e.preventDefault();
    hedef.click();
  });

  /* Adres çubuğundan gelen hash değişimi de sekmeyi açsın. Sayfa ZATEN
     yüklüyken yalnız hash değişirse tarayıcı yeniden yüklemez; bu dinleyici
     olmadan bağlantı "çalışmıyor" görünürdü (ölçüm sondası bu yüzden bir kez
     yanlış cevap verdi — docs/lessons.md, sonda körlüğü). */
  window.addEventListener('hashchange', function(){
    var h = (location.hash || '').replace('#','');
    if(!h) return;
    var t = document.querySelector('.fit-tab[data-tab="'+h+'"]');
    if(t && t.getAttribute('aria-selected') !== 'true') t.click();
  });
}

/* ---- PLAN KABUĞU · dikişi rayın dibine çek (Beyar · Revize 1) --------
 Ölçülen sorun: kabuk, yapışkan sekme rayı ile beyaz gövde arasına
 `.fp-gate` (Giriş Yap / Ücretsiz hesap oluştur) basıyor; Enerji Defteri
 sayfalarında ayrıca `.wrap.ed-subtabs` ve `.wrap.fp-actions` da araya
 giriyor. Hepsi SAYDAM `.wrap`, yani sayfa zemini üstünde yüzüyorlar.
 Sonuç: gövdenin yuvarlak üst köşesi banner'dan ~340px aşağı düşüyor ve
 "banner'ın altındaki panel" okuması kayboluyor (14 sayfa).

 Beyar kararı: ray DÜZ kalsın, yuvarlaklık panelde olsun. Bunun tutması
 için araya giren saydam blokları panelin İÇİNE alıyoruz — düğmeler
 kaybolmuyor, yerleri değişmiyor; yalnız zeminleri gri yerine panelin
 kendisi oluyor ve panel rayın hemen altından başlıyor.

 Neden burada, neden dikiş işaretleyicisinde değil: taşıma YALNIZ plan
 kabuğuna özgü. Genel kural yapılsaydı dadafit-hub · dadafit-kopru ·
 challenge · program-detay · antrenor-ol sayfalarındaki
 `.wrap.fit-band-panel` (banner kenarına BİLEREK oturtulmuş koyu yüzen
 kart) de gövdenin içine çekilir ve o tasarım bozulurdu.
 Bu blok, dikiş işaretleyicisinden ÖNCE koşmak zorunda (dosya sonundaki
 "BANNER → GÖVDE DİKİŞİ" bloğu taşınmış hâli görsün diye).
 --------------------------------------------------------------------- */
(function(){
  var ray = document.querySelector('.pf-tabbar.fp-tabbar');
  if(!ray) return;
  var ana = ray.parentElement; if(!ana) return;

  var tamEnEsik = ana.clientWidth * 0.94;
  var tasinacak = [], hedef = null, n = ray.nextElementSibling, adim = 0;

  while(n && adim++ < 8){                 /* 8 = kaçak döngü emniyeti */
    var cs = getComputedStyle(n);
    var bg = cs.backgroundColor;
    var saydam = !bg || bg === 'transparent' ||
                 /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)$/.test(bg);
    var tamEn  = n.getBoundingClientRect().width >= tamEnEsik;

    if(!saydam && tamEn){ hedef = n; break; }   /* gövde bandı bulundu */
    tasinacak.push(n);
    n = n.nextElementSibling;
  }

  if(!hedef || !tasinacak.length) return;

  /* sırayı koruyarak gövdenin en başına al */
  for(var i = tasinacak.length - 1; i >= 0; i--){
    hedef.insertBefore(tasinacak[i], hedef.firstChild);
  }
})();

/* hero'lu sayfa: body[data-fit-hero="1"] → header hero uzerinde seffaf baslar */
var HERO_MODE = document.body.getAttribute('data-fit-hero') === '1';

/* ------------------------------------------------------------------
 HEADER ŞEFFAF MODU — hero'ya ek olarak BANNER'lı sayfalar da girer.
 Ölçülen referans (dadadiet.com/diyetisyenler, 1440px):
 · scroll 0  → header.at-top · background rgba(0,0,0,0) · box-shadow none
 · scroll 400 → at-top düşer · background rgba(255,255,255,.94) + gölge
 Yani kardeş ürün at-top'ı tam-ekran hero sayfasına özel KULLANMIYOR;
 koyu banner taşıyan liste sayfalarında da header banner'ın üzerinde
 şeffaf duruyor. DadaFit'te bu mod yalnız data-fit-hero ile açılıyordu,
 16 banner sayfası hep katıydı.

 Karar tek yerde verilir: sayfa koyu banner taşıyor mu?
 · .lib-top  → liste/rehber banner'ı (16 sayfa)
 · #fitPlanTop → Planım kabuğu; .fp-top banner'ı yukarıda ondan üretildi
 Bayrak body'ye yazılır, banner'ın üst boşluğunu CSS oradan çözer
 (bkz. fit-shell.css "BANNER ÜZERİNDE ŞEFFAF HEADER").
 ------------------------------------------------------------------ */
/* .cp-top SONRADAN EKLENDİ: antrenör detayının banner'ı bu sınıfı taşıyor ve
   over-mode'a girmediği için header o sayfada koyu görselin üstünde KATI
   kalıyordu (ölçüldü: scroll=0 → rgb(255,255,255)). Diğer banner sayfalarıyla
   tutarsızdı. Eşlik eden yerleşim kuralları fit-shell.css'te. */
/* TÜM KOYU BANNER SINIFLARI over-mode'a girer. Başlangıçta yalnız .lib-top ve
   .fp-top vardı; kullanıcı antrenör detayında (.cp-top) ve antrenör ol
   sayfasında (.ol-top) header'ın koyu görselin üstünde KATI kaldığını bildirdi.
   Tek tek kovalamak yerine banner sınıflarının tamamı listelendi — her biri
   için eşlik eden yerleşim kuralı fit-shell.css'te (margin → padding çevrimi). */
/* R11/M17 · `.fp-top` LİSTEDEN ÇIKARILDI. Plan sayfalarının banner'ı artık
   koyu değil, BEYAZ profil başlığı (`.fp-profil`). Şeffaf header modu beyaz
   zeminin üstünde marka yazısını da beyaz boyuyor → logo görünmez olurdu.
   (Aynı gerekçeyle `profil-v1` de bu listede hiç olmadı: KARARLAR K23 —
   "beyaz profil kapağı, koyu banner ailesiyle aynı dil değil".)
   `tests/header-banner.mjs` bu sayfalarda artık KATI header bekliyor. */
var OVER_MODE = HERO_MODE || !!document.querySelector(
  '.lib-top, .cp-top, .kp-top, .chl-hero, .pd-hero, .fs-top, .ol-top, .ed-top');
if(OVER_MODE) document.body.setAttribute('data-fit-over','1');

/* ------------------------------------------------------------------
 BANNER AİLESİ — liste mi, detay mı? (Beyar: "liste ve detay sayfalarındaki
 bannerların dikeydeki uzunlukları KENDİ İÇLERİNDE tutarlı olsun, belli bir
 uzunluğa fixle")
 Sınıf adı ayırmıyor: `fit-testi-detay` de `.lib-top` kullanıyor, yani
 `.lib-top` = liste demek değil. (Örnekteki `video-seans-detay` 2026-08-29'da
 modülüyle birlikte kalktı; kural değişmedi.) Ayrım DOSYA ADINDAN
 yapılıyor — repodaki tek istikrarlı işaret bu:
   *-detay-*  ya da bilinen detay sayfaları → detay ailesi
   geri kalan banner'lı sayfalar           → liste ailesi
 CSS iki token okuyor: --hero-h-list / --hero-h-detail. */
var DETAY_PAGES = ['challenge-v1','egzersiz-detay-v1','antrenor-detay-v1','program-detay-v1'];
var IS_DETAY = /-detay(-|$)/.test(PAGE) || DETAY_PAGES.indexOf(PAGE) > -1;
/* 🔴 ÜÇÜNCÜ AİLE · YASAL — BEYAR KARARI 2026-09-04: "YASAL sayfalar
   DETAY tipiyle aynı [yükseklik]". Önce yalnız iki aile vardı ve yasal
   sayfalar `liste` sayılıyordu (544px). Ayrım yine DOSYA ADINDAN — depodaki
   tek istikrarlı işaret. Yükseklik `kanon/hero.css`te
   `--banner-h-yasal:var(--banner-h-detay)` ile detaya bağlı. */
/* ⚠ PAGE DEĞİL FILE — ölçüldü: `data-fit-page` dosya adıyla aynı değil
   (`yasal-v1.html` → "yasal", `veri-islem-kaydi-v1.html` → "hesabim").
   Aile ayrımı DOSYA ADINDAN yapılır; PAGE bir içerik etiketi. */
var YASAL_FILES = ['yasal-v1','saglik-bilgilendirme-v1','veri-islem-kaydi-v1'];
var IS_YASAL = YASAL_FILES.indexOf(FILE) > -1 || YASAL_FILES.indexOf(PAGE) > -1 ||
               /^(gizlilik|cerez|kvkk|kullanim|yasal)(-|$)/.test(FILE);
document.body.setAttribute('data-fit-hero-kind',
  IS_YASAL ? 'yasal' : (IS_DETAY ? 'detay' : 'liste'));

/* ------------------------------------------------------------------
 R6 · MADDE 4 — BANNER İKİ KOLONA AYRILIR: SOL İÇERİK + SAĞ İSTATİSTİK
 ------------------------------------------------------------------
 ÖLÇÜM (Playwright, 8. oturum, kardeş markalar @1440):
   dadadiet.com/diyetisyenler   .lst-stats  flex/COLUMN  gap 16px
   dadagastro.com/tarifler      .lst-stats  flex/COLUMN  gap 16px
   dadagastro.com/mutfak-sozlugu .lst-stats flex/COLUMN  gap 16px
 Üçünde de kolon `.wrap`ın SAĞ kenarına dayanıyor (kolon sağ kenarı 1308 =
 wrap sağ kenarı), sol kolonla arasındaki boşluk **39 px**, kolonun alt
 kenarı sol kolonun alt kenarıyla **birebir** (Δ = 0.0 px, üçünde de).
 ≤1024'te kolon sol kolonun ALTINA düşüyor ve yatay sıraya dönüyor.

 NEDEN JS: iki kolon CSS'te ancak sol kolonun kendi kapsayıcısı varsa
 kurulabiliyor. Referans da aynısını yapıyor (`.lh-main`). `.wrap`ı grid'e
 çevirip istatistiği bütün satırlara yaydırmak denendi: satır sayısı sayfadan
 sayfaya değiştiği için `grid-row:1/-1` çalışmıyor, `span N` ise N−1 tane
 boş satır aralığı (row-gap) üretip banner'ı büyütüyor — sabit yükseklik
 ailesinde kabul edilemez. Bu yüzden sol kolon burada tek bir
 `<div class="lib-main">` içine alınıyor.

 İşaretleme 25 sayfada tek tek değiştirilmiyor; sıralama korunuyor:
 `.lib-stats` dışındaki her çocuk, belge sırasıyla `.lib-main`e giriyor.
 R15'in `order:1` numarası (işaretlemede CTA istatistikten önce geliyordu)
 böylece gereksizleşiyor — istatistik kolondan tamamen çıktı.

 GERİ ALMA: bu IIFE silinir + `fit-shell.css`'teki "R6 · MADDE 4" bloğu
 silinirse eski tek kolonlu düzen geri gelir.
 ------------------------------------------------------------------ */
(function(){
  if(!document.body.hasAttribute('data-fit-hero-kind')) return;
  var stats = document.querySelector('.lib-stats');
  if(!stats) return;
  var wrap = stats.parentElement;
  if(!wrap || !wrap.classList.contains('wrap')) return;   /* beklenmedik yapı: dokunma */
  if(wrap.querySelector(':scope > .lib-row')) return;     /* zaten kurulmuş */

  /* KIRINTI İKİ KOLONUN DIŞINDA KALIR — referansın yapısı bu:
       .wrap > nav.rd-crumb            (tam genişlik, kolonların ÜSTÜNDE)
       .wrap > [ .lh-main | .lst-stats ]
     Kırıntı `.lib-main`in içine alınırsa sağdaki kolon kırıntı satırıyla
     aynı hizada başlıyor ve iri sayı ince kırıntı satırıyla yarışıyor
     (ölçüldü: 6 sayfada ilk sayının üst kenarı kırıntının 0.8 px üstünde).
     Referansta bu olmuyor çünkü kırıntı kolonların üstünde ayrı bir satır. */
  /* 🔴 KIRINTI KONUMA DEĞİL SEÇİCİYE GÖRE BULUNUR — ölçüldü 2026-09-04.
     Eski hâl yalnız `wrap.firstElementChild`e bakıyordu. `hareket-rehberi-v1`
     gibi sayfalarda `.wrap`ın ilk çocuğu fazladan bir kaydet düğmesi
     (`<button class="kyt-btn">`); kırıntı ikinci sıraya düşünce tanınmıyor
     ve `.lib-main`in İÇİNE alınıyordu. Sonuç: kırıntı sol üstte değil,
     107px aşağıda ve tam genişlikte (ölçüm: y 128 → 235, x 132 → 170,
     genişlik 146 → 1044). 31 liste sayfasının 30'u doğru, biri bozuktu —
     tek sayfalık kusur, ama kökü konuma bağlı tanıma.
     Artık ilk `[class*="crumb"]`/`<nav>` çocuğu aranıyor; sıra değişse de
     kırıntı satırın üstünde kalıyor. */
  var krumb = wrap.querySelector(':scope > [class*="crumb"], :scope > nav');
  if(krumb === stats) krumb = null;

  var satir = document.createElement('div');  satir.className = 'lib-row';
  var sol   = document.createElement('div');  sol.className   = 'lib-main';

  var kids = [].slice.call(wrap.childNodes);
  wrap.insertBefore(satir, stats);
  satir.appendChild(sol);
  kids.forEach(function(n){
    if(n === stats || n === satir || n === krumb) return;
    sol.appendChild(n);
  });
  satir.appendChild(stats);
})();

/* ============================================================
 4b · TEK KAYDIRMA KİLİDİ — "layout sağa kayıyor" bug'ının kökü
 ------------------------------------------------------------
 Eskiden altı ayrı yer (drawer, görüş modalı, giriş kapısı, pro kapısı,
 sihirbaz, kabuk dışı sayfa scriptleri) doğrudan
 document.body.style.overflow='hidden' yazıyordu. Dikey kaydırma çubuğu
 kaybolunca clientWidth ~15px büyüyor, ortalanmış .wrap yeniden
 konumlanıyor ve TÜM SAYFA yana sıçrıyordu. Üstelik iki katman üst üste
 açılıp biri kapanınca (dropdown → drawer → link) kilit erken kalkıyordu.

 Çözüm iki parçalı:
 · CSS: html{scrollbar-gutter:stable} → oluk her zaman rezerve, kilit
 açılıp kapansa da genişlik DEĞİŞMEZ.
 · JS: sayaçlı tek kilit. N kez kilitlenip N kez açılmadan serbest kalmaz.
 Ek güvenlik olarak scrollbar-gutter desteklemeyen tarayıcıda
 padding telafisi uygulanır.
 ============================================================ */
var _lockCount = 0, _lockPad = '';
function lockScroll(){
  if(_lockCount++ > 0) return;
  var sbw = window.innerWidth - document.documentElement.clientWidth;
  var gutterOK = window.CSS && CSS.supports && CSS.supports('scrollbar-gutter','stable');
  if(sbw > 0 && !gutterOK){
    _lockPad = document.body.style.paddingRight;
    document.body.style.paddingRight = sbw + 'px';
  }
  document.body.classList.add('scroll-locked');
}
function unlockScroll(){
  if(_lockCount === 0) return;
  if(--_lockCount > 0) return;
  document.body.classList.remove('scroll-locked');
  document.body.style.paddingRight = _lockPad;
  _lockPad = '';
}
/* ============================================================
 EKOSİSTEM BAĞLANTILARININ TEK NOKTADAN YÖNETİMİ — belge §14
 ------------------------------------------------------------
 Belge: "Doğrudan başka prototiplerin HTML sayfalarına bağımlı bağlantılar
 oluşturma. Entegrasyonlar yapılandırılabilir servis adresleri üzerinden
 tasarlanmalıdır."

 Sayfa markup'ında kardeş ürüne giden 37 bağlantı hâlâ eski kökü yazıyor
 (ölçüldü). 35 dosyayı tek tek düzenlemek yerine kök TEK yerden (ECO_BASE)
 okunur ve yükleme anında yeniden yazılır: artık markup'taki eski önek bir
 ADRES değil, "burası ekosistem bağlantısı" işaretidir. Gerçek servis adresi
 belirlendiğinde yalnız ECO_BASE değişir, hiçbir sayfaya dokunulmaz.

 Bağlantılar ayrıca işaretlenir (data-eco="gastro|diet|gourmet|campus|eko")
 ki hangi sistemle veri/gezinme paylaşıldığı ölçülebilir ve raporlanabilir
 olsun — belge §14 "hangi sistemle paylaşıldığı açıkça gösterilmelidir" diyor.
 ============================================================ */
(function(){
  var LEGACY = 'https://by4r.github.io/dadamutfak-view/v7-6cu356/';
  /* hedef sayfadan hangi kardeş ürün olduğunu çıkar */
  function which(path){
    if(/saglik-hub|gunluk-kalori|diyetisyen/.test(path)) return 'diet';
    if(/kesfet/.test(path))   return 'gourmet';
    if(/akademi/.test(path))  return 'campus';
    if(/tarif|anasayfa-portal|ogun|menu/.test(path)) return 'gastro';
    return 'eko';
  }
  var n = 0;
  document.querySelectorAll('a[href^="'+LEGACY+'"]').forEach(function(a){
    var path = a.getAttribute('href').slice(LEGACY.length);
    a.setAttribute('href', ECO_BASE + path);
    a.setAttribute('data-eco', which(path));
    /* dış sisteme çıkıyor: yeni sekme + güvenli rel (kullanıcı DadaFit'ten düşmesin) */
    if(!a.hasAttribute('target')){ a.setAttribute('target','_blank'); a.setAttribute('rel','noopener'); }
    n++;
  });

window.FIT_SHELL = window.FIT_SHELL || {};
  window.FIT_SHELL.ecoLinks = n;      /* ölçüm/rapor için: kaç bağlantı yazıldı */
})();

/* ============================================================
 ODAK TUZAĞI — belge §20
 ------------------------------------------------------------
 Belge üç şey istiyor:
 · "Modal açıldığında focus modal içine taşınmalıdır"
 · "Modal kapandığında focus önceki öğeye dönmelidir"
 · "Escape tuşuyla modal kapatılabilmelidir"
 Escape zaten her katmanda vardı; ilk ikisi HİÇBİR katmanda yoktu — modal
 açıkken Tab'lamak kullanıcıyı arkadaki sayfaya götürüyor, kapanınca odak
 <body>'ye düşüyordu (klavye kullanıcısı yerini kaybediyor).

 Katman başına ayrı kod yazmak yerine tek yardımcı: trapFocus(el) odağı
 içeri alır, Tab/Shift+Tab'ı döngüye sokar ve geri döndürme işini üstlenir;
 döndürdüğü fonksiyon çağrılınca odak açan öğeye geri gider.
 Kaydırma kilidiyle aynı desen: SAYAÇ YOK, çünkü her katman kendi
 release'ini tutuyor ve aç/kapa durum korumalı.
 ============================================================ */
function trapFocus(el){
if(!el) return function(){};
var SEL = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),'+
          'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
var prev = document.activeElement;
function items(){
  return Array.prototype.filter.call(el.querySelectorAll(SEL), function(n){
    /* görünmeyen öğe odak sırasına girmez */
    return n.offsetWidth > 0 || n.offsetHeight > 0 || n === document.activeElement;
  });
}
  /* Odağı içeri al — AMA GERÇEKTEN GÖRÜNÜR OLDUĞUNDA.
     Katmanlar sınıf ekleyerek açılıyor (.show / .open) ve CSS geçişi bitene
     kadar öğe odaklanamaz durumda: `.fb-modal` `visibility:hidden` +
     `transition: … visibility .25s` ile açılıyor, `visibility:hidden` bir
     öğede `.focus()` SESSİZCE NO-OP'tur.

     ÖLÇÜM (görüş modalı, 6 koşu × 12 kare örneklendi):
       kare 0 → visibility:hidden · checkVisibility()=false · activeElement=BODY
       kare 1 → visibility:visible · opacity≈0.09  · odak fbClose'a oturuyor
     Yani odaklanabilirlik ilk karede DEĞİL, ikinci karede geliyor. Eski kod
     tek bir yedek rAF deneme yapıyordu; kare bütçesi bir kare bile kayınca
     (gerçek fare tıklaması, yavaş boyama, GC) ikinci deneme de görünmezliğe
     denk gelip odak açan düğmede kalıyordu → süit 6 koşuda 3 kez düşüyordu.

     Çözüm: tek atış yerine SINIRLI KARE YOKLAMASI. Her karede önce öğenin
     gerçekten görünür olup olmadığına bakılır (checkVisibility varsa o,
     yoksa computed visibility + kutu ölçüsü); görünürse odak denenir.
     Odak içeri girene kadar en fazla MAX_FRAMES kare denenir — .25s'lik geçiş
     60fps'te ~15 kare, 20 kare üst sınır bunu güvenle kapsar ve sonsuz döngü
     riski yoktur. Odak içeri girer girmez yoklama durur, böylece kullanıcı
     modal içinde başka bir öğeye geçtiyse geri çekilmez. */
  var MAX_FRAMES = 20;
  function visible(n){
    if(!n) return false;
    if(typeof n.checkVisibility === 'function'){
      return n.checkVisibility({ visibilityProperty:true, contentVisibilityAuto:true });
    }
    var cs = window.getComputedStyle(n);
    if(cs.visibility === 'hidden' || cs.display === 'none') return false;
    return n.offsetWidth > 0 || n.offsetHeight > 0 || n.getClientRects().length > 0;
  }
  function focusIn(tries){
    if(!document.contains(el)) return;
    if(el.contains(document.activeElement)) return;   /* zaten içeride */
    if(visible(el)){
      var list = items();
      if(list.length){ list[0].focus(); }
      else { el.setAttribute('tabindex','-1'); el.focus(); }
      if(el.contains(document.activeElement)) return; /* oturdu */
    }
    if(tries >= MAX_FRAMES) return;                   /* üst sınır: pes et */
    if(typeof requestAnimationFrame === 'function'){
      requestAnimationFrame(function(){ focusIn(tries + 1); });
    } else {
      setTimeout(function(){ focusIn(tries + 1); }, 16);
    }
  }
  if(typeof requestAnimationFrame === 'function') requestAnimationFrame(function(){ focusIn(0); });
  else setTimeout(function(){ focusIn(0); }, 0);
  /* Sayfa YÜKLENİRKEN açılan katman (ör. ?lg=1 giriş kapısı) için ek deneme:
     kabuk script'i parse edilirken open() çağrılıyor, rAF 'load' tamamlanmadan
     çalışıyor ve tarayıcı load sonrası odağı <body>'ye geri alıyor.
     ÖLÇÜM: ?lg=1 ile açılan kapıda odak "scroll-locked" (yani body) kalıyordu,
     aynı katmana elle trapFocus çağrıldığında lgClose'a oturuyordu. */
  if(document.readyState !== 'complete'){
    window.addEventListener('load', function once(){
      window.removeEventListener('load', once);
      if(document.contains(el) && !el.contains(document.activeElement)) focusIn(0);
    });
  }

function onKey(e){
  if(e.key !== 'Tab') return;
  var cur = items();
  if(!cur.length) return;
  var first = cur[0], last = cur[cur.length - 1];
  if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  else if(!el.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
}
document.addEventListener('keydown', onKey, true);

return function release(){
  document.removeEventListener('keydown', onKey, true);
  /* odak açan öğeye döner — hâlâ DOM'da ve odaklanabilirse */
  if(prev && document.contains(prev) && typeof prev.focus === 'function'){
    try{ prev.focus(); }catch(e){}
  }
};
}

window.FIT_SHELL = window.FIT_SHELL || {};
/* R20/K14 · TARİH ETİKETİ — TEK BİÇİMLEYİCİ.
   `gecmis[].tarih` alanı sabit 'bugün' dizgesiydi ve ekrana basılan alan
   oydu (ölçüldü: 9 gün önce · 3 gün önce · bugün yazılan üç kaydın üçü de
   "bugün" diyordu). Alan söküldü; okuyan üç ekran artık gerçek tarihi,
   `tarihISO`yu buradan biçimliyor. Biçim tek yerde durmalı, yoksa üç ekran
   üç ayrı biçim üretir.
   Dönen değer: bugün → 'Bugün' · dün → 'Dün' · 7 günden yeni → 'N gün önce' ·
   ötesi → '14 Ağustos 2026'. Tarih yoksa uydurulmaz, '—' döner. */
window.FIT_SHELL.tarihEtiket = function(iso){
  if(!iso) return '—';
  var d = new Date(iso);
  if(isNaN(d)) return '—';
  var bugun = new Date(); bugun.setHours(0,0,0,0);
  var o = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var fark = Math.round((bugun - o) / 86400000);
  if(fark === 0) return 'Bugün';
  if(fark === 1) return 'Dün';
  if(fark > 1 && fark < 7) return fark + ' gün önce';
  var AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
               'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  return d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + d.getFullYear();
};
window.FIT_SHELL.eco = ECO;
window.FIT_SHELL.trapFocus = trapFocus;
window.FIT_SHELL.lockScroll = lockScroll;
window.FIT_SHELL.unlockScroll = unlockScroll;

/* ============================================================
 5 · KABUK DAVRANISI
 ============================================================ */
/* ---- ortak chrome davranışı (hub satır içi bloklarından birebir) ---- */
/* ===== ORTAK CHROME JS (v3a'dan, sayfa-bağımsız hale getirildi) =====
 SS paramları: ?dd=1 (mega+dil açık) · ?drawer=1 · ?cc=1 (çerez) · ?fb=1 (görüş modal)
 Header VARSAYILAN KATI. Hero'lu sayfa şeffaf başlangıç isterse aşağıdaki
 heroMode bayrağını kendi kopyasında true yapar (v3a davranışı). */

// SS paramları
// ===== Login-state simülasyonu (mockup) — İA §2.3 sözleşmesi =====
// ?auth=1 → localStorage dm_auth='1' + body.is-auth ; ?auth=0 → temizle (logout)
// param yoksa localStorage'a bakılır. Çıkış linkleri ?auth=0'a yönlendirir (M7).
(function(){
  /* C1 — tek auth/rol token dm_user{auth,roles[],verified,level}. Eski dm_auth/dm_business
 migrate+silinir. Kök kuralı: auth ⟹ roles "kullanici" ile başlar; isletme operatörü
 ["kullanici","isletme"]. Class additive (is-auth/has-business AYNEN) + body[data-roles]. */
  var KEY='dm_user', OK={kullanici:1,antrenor:1,diyetisyen:1,isletme:1};
  function rd(){ try{var r=localStorage.getItem(KEY);return r?JSON.parse(r):null;}catch(e){return null;} }
  function wr(u){ try{localStorage.setItem(KEY,JSON.stringify(u));}catch(e){} }
  var u=rd();
  if(!u){                                   // migrasyon: eski binary flag → dm_user (bir kez)
    var oa=false,ob=false;
    try{oa=localStorage.getItem('dm_auth')==='1';}catch(e){}
    try{ob=localStorage.getItem('dm_business')==='1';}catch(e){}
    if(oa||ob){ u={auth:true,roles:['kullanici'],verified:false,level:0}; if(ob)u.roles.push('isletme'); wr(u); }
  }
  try{localStorage.removeItem('dm_auth');localStorage.removeItem('dm_business');}catch(e){}  // eski anahtar temizliği
  var qs=location.search;                    // URL-param (demo/SS akışı korunur + yeni roller)
  function ens(){ if(!u)u={auth:false,roles:[],verified:false,level:0}; }
  function addR(r){ ens(); if(OK[r]&&u.roles.indexOf(r)<0)u.roles.push(r); }
  if(qs.indexOf('auth=1')>-1){ ens(); u.auth=true; }
  else if(qs.indexOf('auth=0')>-1){ u=null; try{localStorage.removeItem(KEY);}catch(e){} }
  if(qs.indexOf('business=1')>-1){ ens(); u.auth=true; addR('isletme'); }
  else if(qs.indexOf('business=0')>-1){ if(u){var bi=u.roles.indexOf('isletme'); if(bi>-1)u.roles.splice(bi,1);} }
  var rm=/[?&]role=(antrenor|diyetisyen|isletme)/.exec(qs); if(rm){ ens(); u.auth=true; addR(rm[1]); }
  if(u){
    if(qs.indexOf('verified=1')>-1)u.verified=true; else if(qs.indexOf('verified=0')>-1)u.verified=false;
    var lm=/[?&]level=(\d+)/.exec(qs); if(lm)u.level=parseInt(lm[1],10)||0;
    if(u.auth&&u.roles.indexOf('kullanici')<0)u.roles.unshift('kullanici');   // kök her zaman önde
    wr(u);
  }
  var b=document.body, authed=!!(u&&u.auth);   // DOM: eski class kanalı (additive) + data-roles
  if(authed){
    b.classList.add('is-auth');
    if(u.roles.indexOf('isletme')>-1)b.classList.add('has-business');   // C3 köprü sinyali — AYNEN
    b.setAttribute('data-roles',u.roles.join(' '));
    if(u.verified)b.setAttribute('data-verified','1');
    if(u.level)b.setAttribute('data-level',String(u.level));
  }
  /* 🔴 ALT ÇUBUK HESAP HEDEFİ ARTIK OTURUMA GÖRE DEĞİŞMİYOR — 2026-09-04.
     Eskiden `authed ? 'fit-hesabim.html' : 'fit-giris.html'` yazılıyordu ve
     alt çubuğun markup'ı sayfadan sayfaya AYRIŞIYORDU: kapı ölçümü 65 FIT
     sayfasında `#bnAccount`ın href'i yüzünden iki ayrı imza buldu.
     Beyar kararı "alt çubuk TEK KAYNAK" — hedef sabit, oturum kapısı hedef
     sayfanın kendi işi. Referans Gastro da sabit yazıyor (`g-hesabim.html`).
     ⚠ Belge §3.3'ün "hesap kalemi hesaba gider" şartı korunuyor; değişen
       yalnız oturumsuz kullanıcının giriş ekranına ÇUBUKTAN değil HEDEF
       SAYFADAN yönlenmesi. */
})();

if(location.search.indexOf('dd=1')>-1){document.querySelector('.nav-item').classList.add('open');var _l=document.getElementById('tbLang');if(_l)_l.classList.add('open');}
if(location.search.indexOf('drawer=1')>-1){window.addEventListener('DOMContentLoaded',function(){document.getElementById('drawer').classList.add('open');document.getElementById('drawerOverlay').classList.add('open');var _s=document.querySelector('.d-has-sub');if(_s)_s.classList.add('open');});}

// header: VARSAYILAN katı (içerik sayfası). heroMode=true → hero üstünde şeffaf,
// ~60px scroll sonrası katı (v3a davranışı; ?hdr=solid ile yine zorla katı)
(function(){
  var header=document.querySelector('.header');
  /* hero VEYA banner → header üstte şeffaf, ~60px scroll sonrası katı */
  var overMode=OVER_MODE;
  var forceSolid=location.search.indexOf('hdr=solid')>-1;
  if(!overMode||forceSolid){ document.body.removeAttribute('data-fit-over'); return; }  // katı kal — at-top hiç eklenmez
  function onScroll(){ if(window.scrollY<60){header.classList.add('at-top');} else {header.classList.remove('at-top');} }
  onScroll(); window.addEventListener('scroll',onScroll,{passive:true});
})();

// save / favorite toggle (recipes + products) — sayfada varsa çalışır
document.querySelectorAll('.r-save, .p-fav, .feat-save').forEach(function(btn){
  btn.addEventListener('click',function(e){
    e.stopPropagation();
    btn.classList.toggle('saved');
    var i=btn.querySelector('i');
    if(btn.classList.contains('saved')){i.classList.remove('fa-regular');i.classList.add('fa-solid');}
    else{i.classList.remove('fa-solid');i.classList.add('fa-regular');}
  });
});

/* ---- "TÜMÜNÜ GÖR" SLIDER'LARI — data-track / data-dir ile genel ----
 Eskiden ok yalnız sabit 620px kaydırıyordu: uçta basınca hiçbir şey olmuyor,
 ok yine de aktif görünüyordu; ray klavyeyle kullanılamıyor, kaydırılacak
 içerik olmasa bile oklar duruyordu. Şimdi:
 · kaydırma miktarı görünür genişliğe göre hesaplanır (kart hizası bozulmaz)
 · uçlarda oklar disabled olur, hiç taşma yoksa ok grubu tamamen gizlenir
 · ray klavyeyle odaklanabilir; ok tuşları / Home / End çalışır
 · içerik veya boyut değişince durum yeniden ölçülür */
(function(){
  var tracks = {};
  document.querySelectorAll('.row-nav button[data-track]').forEach(function(b){
    var id = b.getAttribute('data-track');
    (tracks[id] = tracks[id] || []).push(b);
  });

  Object.keys(tracks).forEach(function(id){
    var t = document.getElementById(id);
    if(!t) return;
    var btns = tracks[id];
    var nav  = btns[0].closest('.row-nav');

    function step(){
      var first = t.firstElementChild;
      var card  = first ? first.getBoundingClientRect().width : 274;
      var gap   = parseFloat(getComputedStyle(t).columnGap || getComputedStyle(t).gap) || 0;
      var per   = Math.max(1, Math.floor(t.clientWidth / (card + gap)));
      return per * (card + gap);
    }
    function update(){
      var max = t.scrollWidth - t.clientWidth;
      var scrollable = max > 2;
      if(nav) nav.hidden = !scrollable;
      btns.forEach(function(b){
        var prev = b.getAttribute('data-dir') === 'prev';
        b.disabled = !scrollable || (prev ? t.scrollLeft <= 1 : t.scrollLeft >= max - 1);
      });
      /* kaydırılabilir ray klavye ile gezilebilir olsun */
      if(scrollable){
        if(!t.hasAttribute('tabindex')) t.setAttribute('tabindex','0');
        if(!t.hasAttribute('role')){ t.setAttribute('role','group'); }
        if(!t.hasAttribute('aria-label')) t.setAttribute('aria-label','Yatay kaydırılabilir liste');
      }
    }

    btns.forEach(function(b){
      b.addEventListener('click', function(){
        t.scrollBy({left: b.getAttribute('data-dir')==='prev' ? -step() : step(), behavior:'smooth'});
        if(t._pauseAuto) t._pauseAuto();
      });
    });

    t.addEventListener('keydown', function(e){
      if(e.target !== t) return;                    // kart içindeki odak kendi işini görsün
      var d = 0;
      if(e.key==='ArrowRight') d = step();
      else if(e.key==='ArrowLeft') d = -step();
      else if(e.key==='Home') { e.preventDefault(); t.scrollTo({left:0,behavior:'smooth'}); return; }
      else if(e.key==='End')  { e.preventDefault(); t.scrollTo({left:t.scrollWidth,behavior:'smooth'}); return; }
      if(!d) return;
      e.preventDefault();
      t.scrollBy({left:d, behavior:'smooth'});
    });

    t.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    if(window.ResizeObserver) new ResizeObserver(update).observe(t);
    update();
  });
})();

/* ---- NAV PANELİ — DadaDiet kuralı: panel hover ile açılır, BAŞLIK TIKLANINCA
 kendi merkez sayfasına gidilir. Eski davranış her tıklamada preventDefault
 uyguluyordu: başlık ölü bağlantıydı, panel açıkken ikinci bir sekmeye tıklamak
 odak + toggle çakışması üretiyordu. Dokunmatikte hover olmadığı için ilk dokunuş
 paneli açar, ikinci dokunuş bağlantıyı izler. ---- */
(function(){
  var HOVER = window.matchMedia('(hover:hover) and (pointer:fine)');
  function closeAll(except){
    document.querySelectorAll('.nav-item.open').forEach(function(o){
      if(o===except)return;
      o.classList.remove('open');
      var t=o.querySelector(':scope > a'); if(t)t.setAttribute('aria-expanded','false');
    });
  }
  document.querySelectorAll('.nav-item').forEach(function(it){
    var trigger=it.querySelector(':scope > a');
    if(!trigger || !it.querySelector('.dropdown,.mega'))return;

    /* masaüstü: hover — CSS zaten açıyor, aria durumunu JS senkronlar */
    it.addEventListener('mouseenter',function(){
      if(!HOVER.matches)return;
      closeAll(it); trigger.setAttribute('aria-expanded','true');
    });
    it.addEventListener('mouseleave',function(){
      if(!HOVER.matches)return;
      it.classList.remove('open'); trigger.setAttribute('aria-expanded','false');
    });

    trigger.addEventListener('click',function(e){
      if(HOVER.matches) return;                 // fare/klavye: bağlantı normal çalışsın
      if(it.classList.contains('open')) return; // dokunmatikte ikinci dokunuş → git
      e.preventDefault();                       // dokunmatikte ilk dokunuş → paneli aç
      closeAll(it);
      it.classList.add('open');
      trigger.setAttribute('aria-expanded','true');
    });

    /* klavye: panel odakla açılır, Tab ile içine girilir */
    it.addEventListener('focusin',function(){ closeAll(it); it.classList.add('open'); trigger.setAttribute('aria-expanded','true'); });
    it.addEventListener('focusout',function(e){
      if(it.contains(e.relatedTarget))return;
      it.classList.remove('open'); trigger.setAttribute('aria-expanded','false');
    });
  });
  document.addEventListener('click',function(e){ if(!e.target.closest('.nav-item')) closeAll(null); });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    var open=document.querySelector('.nav-item.open');
    if(open){var t=open.querySelector(':scope > a');open.classList.remove('open');if(t){t.setAttribute('aria-expanded','false');t.focus();}}
  });
})();

// ---- HESAP / EKLE dropdown (header sağ blok, login-state) tıkla-aç ----
document.querySelectorAll('.acct-item').forEach(function(it){
  var trigger=it.querySelector('.icon-btn,.acct-btn');
  if(!trigger||!it.querySelector('.acct-menu'))return;
  trigger.addEventListener('click',function(e){
    e.preventDefault();
    var wasOpen=it.classList.contains('open');
    document.querySelectorAll('.acct-item.open').forEach(function(o){o.classList.remove('open')});
    if(!wasOpen)it.classList.add('open');
  });
});
document.addEventListener('click',function(e){
  if(!e.target.closest('.acct-item'))document.querySelectorAll('.acct-item.open').forEach(function(o){o.classList.remove('open')});
});

// ---- LG-GATE (giriş kapısı) — logged-out mikro-aksiyon kapısı ----
(function(){
  var gate=document.getElementById('lgGate');
  var overlay=document.getElementById('lgOverlay');
  if(!gate)return;
  var _lgRelease = null;                         /* §20 odak tuzağı */
  function open(title,desc){
    if(document.body.classList.contains('is-auth'))return false;   // logged-in: kapı yok
    if(gate.classList.contains('show'))return true;                // zaten açık — kilidi ikinci kez sayma
    if(title)document.getElementById('lgTitle').textContent=title;
    if(desc)document.getElementById('lgDesc').textContent=desc;
    gate.classList.add('show');overlay.classList.add('show');lockScroll();
    _lgRelease = trapFocus(gate);                /* §20 */
    return true;
  }
  /* durum korumalı: kapalıyken çağrılan close() başka bir katmanın kilidini düşürmez */
  function close(){
    if(!gate.classList.contains('show'))return;
    gate.classList.remove('show');overlay.classList.remove('show');unlockScroll();
    if(_lgRelease){ _lgRelease(); _lgRelease = null; }   /* §20 */
  }
  window.__lgGate=open;window.__lgGateClose=close;
  document.getElementById('lgClose').addEventListener('click',close);
  overlay.addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&gate.classList.contains('show'))close();});
 // data-lg-gate taşıyan öğeler logged-out'ta kapıyı açar (capture: sayfa toggle'ından önce keser)
  document.addEventListener('click',function(e){
    var t=e.target.closest('[data-lg-gate]');
    if(!t)return;
    if(document.body.classList.contains('is-auth'))return;          // logged-in: normal davranış
    e.preventDefault();e.stopPropagation();
    open(t.getAttribute('data-lg-title'),t.getAttribute('data-lg-desc'));
  },true);
  if(location.search.indexOf('lg=1')>-1){open();}                    // SS paramı
})();

/* ---- DİL SEÇİCİ (üst bant açılır menü) ----
   Eski blok seçilen kalemi düğmeye basıyordu — `btn span.textContent =
   data-lang`. Kardeş markada kural TERSİ: düğme GEÇİLECEK dili gösterir
   (dadagastro.com canlıdan ölçüldü, html[lang=tr] → "EN", /en → "TR").
   Burada gerçek dil TEK: Türkçe. Bu yüzden düğme sabit "EN" gösterir ve
   menüde işaretli kalem TR'dir. "English" seçilince SAHTE bir geçiş
   YAPILMAZ (çeviri altyapısı yok); menü açık kalır ve dipteki dürüst not
   vurgulanır — kullanıcı neden bir şeyin değişmediğini anında görür. */
(function(){
  var lang=document.getElementById('tbLang');
  if(!lang)return;
  var btn=document.getElementById('tbLangBtn');
  var not=document.getElementById('tbLangNote');
  function kapat(){lang.classList.remove('open');btn.setAttribute('aria-expanded','false');}
  btn.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    var acik=lang.classList.toggle('open');
    btn.setAttribute('aria-expanded',acik?'true':'false');
  });
  lang.querySelectorAll('.tb-lang-menu button').forEach(function(b){
    b.addEventListener('click',function(e){
      e.stopPropagation();
      if(b.getAttribute('data-lang')==='tr'){ kapat(); return; }   /* zaten aktif dil */
      /* İngilizce yüzey yok — etiket değiştirilmez, dil değiştirilmez. */
      if(not){ not.classList.add('is-vurgu'); setTimeout(function(){not.classList.remove('is-vurgu');},1600); }
    });
  });
  document.addEventListener('click',function(e){ if(!e.target.closest('#tbLang')) kapat(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') kapat(); });
})();

// ---- MOBİL DRAWER aç/kapa ----
(function(){
  var drawer=document.getElementById('drawer');
  var overlay=document.getElementById('drawerOverlay');
  var burger=document.getElementById('hamburger');
  var closeBtn=document.getElementById('drawerClose');
  /* R16/2 · PUBLIC KABUK YUVASIZ SAYFADA SESSİZCE ÇEKİLİR.
     ÖLÇÜLEN KUSUR: yönetim paneli bu dosyayı YALNIZ ortak filtre bileşeni
     (`.ff`) için yüklüyor; header/footer'ı basmıyor, dolayısıyla `#drawer`
     ailesi yok. Blok onların varlığını varsayıyordu ve `null.addEventListener`
     ile PATLIYORDU — dosyanın geri kalanı hiç koşmuyor, `FIT_SHELL.filtreKur`
     hiç tanımlanmıyordu (ölçüldü: admin sayfasında facet düğmesi 0).
     Bir kabuk, kendi bağlanacağı düğümü bulamadığında hata atmaz; çekilir. */
  if(!drawer || !overlay || !burger || !closeBtn) return;
  /* durum korumalı aç/kapa — kilit sayacı yalnız gerçek geçişte hareket eder */
  var releaseFocus = null;                      /* §20 odak tuzağı bırakma işi */
  function open(){
    if(drawer.classList.contains('open'))return;
    drawer.classList.add('open');overlay.classList.add('open');lockScroll();
    releaseFocus = trapFocus(drawer);            /* odak drawer'ın içine */
  }
  function close(){
    if(!drawer.classList.contains('open'))return;
    drawer.classList.remove('open');overlay.classList.remove('open');unlockScroll();
    if(releaseFocus){ releaseFocus(); releaseFocus = null; }   /* odak hamburgere geri */
  }
  burger.addEventListener('click',open);
  closeBtn.addEventListener('click',close);
  overlay.addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
 // accordion: alt menülü öğeler tıkla-aç
  /* akordeon: yalnız chevron düğmesi açar/kapatır — satırın kendisi bağlantıdır */
  drawer.querySelectorAll('.d-has-sub .d-toggle').forEach(function(tg){
    tg.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      var item=tg.closest('.d-item');
      var wasOpen=item.classList.contains('open');
      drawer.querySelectorAll('.d-item.open').forEach(function(o){
        o.classList.remove('open');
        var t=o.querySelector('.d-toggle'); if(t)t.setAttribute('aria-expanded','false');
      });
      if(!wasOpen){item.classList.add('open');tg.setAttribute('aria-expanded','true');}
    });
  });
 // alt link veya direkt linke tıklayınca drawer kapansın (chevron hariç)
  drawer.querySelectorAll('.d-sub a, a.d-link, .drawer-foot a, .drawer-foot > button').forEach(function(a){
    a.addEventListener('click',close);
  });
 /* çekmece dil listesi — aç/kapa. Üst bantla aynı karar: "English"
    seçilince sahte geçiş yapılmaz, dipteki not vurgulanır. */
  var dl=document.getElementById('drawerLang');
  if(dl){
    var dlToggle=dl.querySelector('.drawer-lang-toggle');
    var dlNot=dl.querySelector('.tb-lang-note');
    dlToggle.addEventListener('click',function(){
      var acik=dl.classList.toggle('open');
      dlToggle.setAttribute('aria-expanded',acik?'true':'false');
    });
    dl.querySelectorAll('.drawer-lang-list button').forEach(function(b){
      b.addEventListener('click',function(){
        if(b.getAttribute('data-lang')==='tr'){
          dl.classList.remove('open');dlToggle.setAttribute('aria-expanded','false');return;
        }
        if(dlNot){ dlNot.classList.add('is-vurgu'); setTimeout(function(){dlNot.classList.remove('is-vurgu');},1600); }
      });
    });
  }
})();

// ---- SÜRÜKLE-KAYDIR (mouse ile yatay slider'lar) ----
// Sayfa kendi track selector'larını alttaki listeye ekler (.row-track hazır gelir)
(function(){
  function enableDrag(el){
    el.classList.add('drag-scroll');
    var down=false,startX=0,startScroll=0,moved=false;
    el.addEventListener('pointerdown',function(e){
      if(e.pointerType==='touch')return;           // touch zaten native kayar
      down=true;moved=false;startX=e.clientX;startScroll=el.scrollLeft;
    });
    el.addEventListener('pointermove',function(e){
      if(!down)return;
      var dx=e.clientX-startX;
      if(Math.abs(dx)>4){moved=true;el.classList.add('dragging');}
      el.scrollLeft=startScroll-dx;
    });
    function up(){down=false;setTimeout(function(){el.classList.remove('dragging');},0);}
    el.addEventListener('pointerup',up);
    el.addEventListener('pointercancel',up);
    el.addEventListener('pointerleave',up);
 // sürükleme sonrası yanlışlıkla tıklamayı engelle
    el.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();moved=false;}},true);
 // dikey wheel'i yatay scroll'a çevir (trackpad/mouse)
    el.addEventListener('wheel',function(e){
      if(el.scrollWidth<=el.clientWidth)return;
      if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
      e.preventDefault();el.scrollLeft+=e.deltaY;
    },{passive:false});
  }
  ['.row-track','.cat-track','.grid-4','.vid-grid','.chips','.chef-row','.disc-grid'].forEach(function(sel){
    document.querySelectorAll(sel).forEach(enableDrag);
  });
})();

// ---- FOOTER REVEAL — footer yüksekliğini ölç, içerik sonuna boşluk aç ----
(function(){
  var main=document.getElementById('pageMain');
  var foot=document.querySelector('.footer');
  if(!main||!foot)return;
  function fit(){
    if(window.matchMedia('(min-width:641px)').matches){
      /* R11 · KESİRLİ yükseklik. `offsetHeight` tam sayıya yuvarlar; footer
         439.5px iken 440 döner ve perde alt kenarı footer'ın üstünden
         0.1–1 px sapar. 60 sayfada "tek değer" istenen ölçümde bu sapma
         11 farklı değer üretiyordu. `getBoundingClientRect()` kesirli
         okur, boşluk tam 0'a oturur. */
      main.style.marginBottom=foot.getBoundingClientRect().height+'px';
    }else{
      main.style.marginBottom='';
    }
  }
  fit();
  window.addEventListener('resize',fit);
  window.addEventListener('load',fit);          // logo/font yüklenince yükseklik oturur
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
  /* R11 · PERDEYİ DIŞARIDAN YENİDEN ÖLÇTÜRME KAPISI.
     Footer yüksekliğini ölçümden SONRA değiştiren tek şey accordion'un
     açılıp kapanması. Ölçüm o an bayatlıyor; aşağıdaki accordion IIFE'si
     her geçişten sonra bunu çağırıyor. Başka hiçbir yerden çağrılmıyor. */
  window.FIT_SHELL = window.FIT_SHELL || {};
  window.FIT_SHELL.perdeyiOlc = fit;
})();

/* ---- FOOTER ACCORDION — YALNIZ ÜÇ ORTA MENÜ, YALNIZ MOBİLDE ----
   Doküman: "Üç orta menü mobilde açılır-kapanır accordion olarak
   çalışmalıdır." Marka alanı, uygulama alanı, kurumsal bant ve yasal
   bant accordion DEĞİL — onlar hep açık.

   Masaüstünde (≥641px) üç sütun AÇIK durur ve başlık düğmesi `disabled`
   olur: odak sırasına girmez, tıklamayla kapanamaz. Mobilde (≤640px)
   üçü de KAPALI başlar, düğme etkinleşir; klavyede Enter/Space gerçek
   <button> olduğu için tarayıcıdan gelir.

   R11: açılış/kapanış footer yüksekliğini değiştirir → geçiş bittiğinde
   perde YENİDEN ÖLÇÜLÜR (FIT_SHELL.perdeyiOlc). */
(function(){
  var kolonlar = [].slice.call(document.querySelectorAll('.foot-col[data-foot-col]'));
  if(!kolonlar.length) return;
  var mq = window.matchMedia('(max-width:640px)');

  function olc(){ if(window.FIT_SHELL && window.FIT_SHELL.perdeyiOlc) window.FIT_SHELL.perdeyiOlc(); }

  function boya(kol, acik){
    var btn = kol.querySelector('.fc-toggle');
    kol.classList.toggle('is-open', acik);
    if(btn) btn.setAttribute('aria-expanded', acik ? 'true' : 'false');
  }

  function kur(){
    var mobil = mq.matches;
    kolonlar.forEach(function(kol){
      var btn = kol.querySelector('.fc-toggle');
      if(!btn) return;
      btn.disabled = !mobil;                    /* masaüstünde etkin değil */
      boya(kol, mobil ? false : true);          /* masaüstü: hep açık */
    });
    olc();
  }

  kolonlar.forEach(function(kol){
    var btn = kol.querySelector('.fc-toggle');
    if(!btn) return;
    btn.addEventListener('click', function(){
      if(btn.disabled) return;
      boya(kol, btn.getAttribute('aria-expanded') !== 'true');
      olc();                                    /* geçiş başlarken */
      setTimeout(olc, 240);                     /* geçiş bittikten sonra */
    });
  });

  kur();
  if(mq.addEventListener) mq.addEventListener('change', kur);
  else if(mq.addListener) mq.addListener(kur);
})();

// ---- GÖRÜŞ BİLDİR (kenar etiketi → modal) ----
(function(){
  var tab=document.getElementById('fbTab');
  var modal=document.getElementById('fbModal');
  var overlay=document.getElementById('fbOverlay');
  if(!tab||!modal)return;
  var form=document.getElementById('fbForm');
  var success=document.getElementById('fbSuccess');
  var releaseFocus = null;                      /* §20 */
  function open(){
    if(modal.classList.contains('show'))return;
    modal.classList.add('show');overlay.classList.add('show');lockScroll();
    releaseFocus = trapFocus(modal);
  }
  function close(){
    if(!modal.classList.contains('show'))return;
    modal.classList.remove('show');overlay.classList.remove('show');unlockScroll();
    if(releaseFocus){ releaseFocus(); releaseFocus = null; }
    setTimeout(function(){form.hidden=false;success.hidden=true;form.reset();},300);
  }
  tab.addEventListener('click',function(e){e.preventDefault();open();});
  document.getElementById('fbClose').addEventListener('click',close);
  overlay.addEventListener('click',close);
  modal.addEventListener('click',function(e){if(e.target===modal)close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
 // M17 — konu tipine göre alan seti: aktif pane görünür, pasif pane'lerin
 // input'ları disable edilir (gizli required alanlar submit'i bloklamasın)
  function syncPanes(){
    var cur=modal.querySelector('.fb-topic.active').getAttribute('data-topic');
    modal.querySelectorAll('.fb-fields').forEach(function(p){
      var on=p.getAttribute('data-for')===cur;
      p.classList.toggle('active',on);
      p.querySelectorAll('input,textarea,select,button').forEach(function(el){el.disabled=!on});
    });
  }
  modal.querySelectorAll('.fb-topic').forEach(function(t){
    t.addEventListener('click',function(){
      modal.querySelectorAll('.fb-topic').forEach(function(x){x.classList.remove('active')});
      t.classList.add('active');
      syncPanes();
    });
  });
  syncPanes();
 // emoji + chip seçimleri (tek seçim)
  modal.querySelectorAll('.fb-emoji button').forEach(function(b){
    b.addEventListener('click',function(){
      modal.querySelectorAll('.fb-emoji button').forEach(function(x){x.classList.remove('active')});
      b.classList.add('active');
    });
  });
  modal.querySelectorAll('.fb-chiprow .chip').forEach(function(c){
    c.addEventListener('click',function(){
      modal.querySelectorAll('.fb-chiprow .chip').forEach(function(x){x.classList.remove('active')});
      c.classList.add('active');
    });
  });
  form.addEventListener('submit',function(e){
    e.preventDefault();
    form.hidden=true;success.hidden=false;
    /* durum değişimini ekran okuyucuya duyur ve odağı yeni içeriğe taşı —
       yoksa odak gizlenen formda kalır (§20 odak tuzağı modal içinde). */
    success.setAttribute('tabindex','-1');
    success.focus();
  });
  var again=document.getElementById('fbAgain');
  if(again) again.addEventListener('click',function(){
    success.hidden=true;form.hidden=false;
    var ilk=form.querySelector('.fb-topic'); if(ilk) ilk.focus();
  });
  if(location.search.indexOf('fb=1')>-1){open();}
})();

// ---- ÇEREZ ONAY BANNER ----
(function(){
  var banner=document.getElementById('cookieBanner');
  if(!banner)return;
  var KEY='dm-cookie-consent';
  var force=location.search.indexOf('cc=1')>-1;   // SS/test için zorla göster
  function stored(){try{return localStorage.getItem(KEY);}catch(e){return null;}}
  function dismiss(val){
    try{localStorage.setItem(KEY,val);}catch(e){}
    banner.classList.remove('show');if(window.__bnUpdate)window.__bnUpdate();
  }
  if(force || !stored()){
    setTimeout(function(){banner.classList.add('show');if(window.__bnUpdate)window.__bnUpdate();},700);
  }
  document.getElementById('cookieAccept').addEventListener('click',function(){dismiss('accepted');});
  document.getElementById('cookieReject').addEventListener('click',function(){dismiss('rejected');});

  /* ---- `--bc-lift` · "başa dön" çerez şeridinin ÜSTÜNE çıkar ----
     Emsal ölçüldü (dadagastro.com, 2026-08-29): kardeş markada kural
     `bottom:calc(92px + var(--bc-lift,0px))` ve ölçülen değerler
       1440 → 92px  (şerit düğmenin soluna bitiyor, yükselme yok)
       1024 → 131px = 24 (şeridin dip payı) + 95 (şerit) + 12 (aralık)
       768  → 171px = 24 + 135 + 12
     Fit'te mekanizma HİÇ YOKTU: üç genişlikte de 92px'te kalıp şeridin
     altına giriyordu. Formül birebir aynı; yükselme YALNIZ ikisi yatayda
     çakışırsa uygulanır (Gastro'da 1440'ta çakışma yok, o yüzden 0). */
  var TT_TABAN = 92, TT_ARALIK = 12;
  function lift(){
    var btn = document.getElementById('toTop');
    var kok = document.documentElement;
    if(!btn){ kok.style.removeProperty('--bc-lift'); return; }
    var acik = banner.classList.contains('show') && banner.getClientRects().length > 0;
    if(!acik){ kok.style.removeProperty('--bc-lift'); return; }
    var b = banner.getBoundingClientRect(), t = btn.getBoundingClientRect();
    var cakisiyor = b.right > t.left && b.left < t.right;
    if(!cakisiyor){ kok.style.removeProperty('--bc-lift'); return; }
    var dip = window.innerHeight - b.bottom;               // şeridin dip payı
    var hedef = dip + b.height + TT_ARALIK;
    kok.style.setProperty('--bc-lift', Math.max(0, Math.round(hedef - TT_TABAN)) + 'px');
  }
  window.addEventListener('resize', lift);
  window.addEventListener('load', lift);
  /* Şerit 700ms sonra açılıyor ve KAYARAK giriyor. Ölçüldü: 800ms'te kutu
     hâlâ ekranın altındaydı (dip negatif → yükselme 0 çıkıyordu). Bitişi
     `transitionend` ile yakalanıyor; zamanlayıcılar yalnız yedek. */
  banner.addEventListener('transitionend', lift);
  setTimeout(lift, 60); setTimeout(lift, 800); setTimeout(lift, 1600);
  document.addEventListener('click', function(){ setTimeout(lift, 60); }, true);
})();


/* ---- mobil alt katman yöneticisi ---- */
/* ===== MOBİL ALT KATMAN YÖNETİCİSİ (revize2/mobil1 — kanonik) =====
 Kural: ekranda en fazla 1 sabit alt şerit. Çerez onayı (geçici, öncelikli)
 ya da sayfanın kendi aksiyon şeridi (window.__bottomStrips) açıkken global
 bottom-nav gizlenir; şerit olan sayfalarda nav ayrıca aşağı kaydırınca gizlenir. */
window.__bottomStrips=window.__bottomStrips||[];
setTimeout(function(){
  var nav=document.querySelector('.bottom-nav');
  if(!nav)return;
  var cookie=document.getElementById('cookieBanner');
  var strips=window.__bottomStrips.map(function(s){return document.querySelector(s);}).filter(Boolean);
  var lastY=window.scrollY||0;
  function stripShown(){for(var i=0;i<strips.length;i++){if(strips[i]&&strips[i].classList.contains('show'))return true;}return false;}
  function update(){
    var y=window.scrollY||0;
    if(stripShown()){nav.classList.add('bn-hidden');lastY=y;return;}
    if(strips.length===0||y<80){nav.classList.remove('bn-hidden');lastY=y;return;}
    if(y-lastY>12){nav.classList.add('bn-hidden');lastY=y;}
    else if(lastY-y>12){nav.classList.remove('bn-hidden');lastY=y;}
  }
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update,{passive:true});
  document.addEventListener('click',function(){setTimeout(update,60);},true);
  window.__bnUpdate=update;update();
},0);

/* ---- aktif nav: aria-current + self-link başa kaydırma ---- */
(function(){
  if(window.__dfActiveNav)return; window.__dfActiveNav=true;
 // mevcut sayfa dosya adı (querystring/hash hariç)
  var here=(location.pathname.split('/').pop()||'').toLowerCase();
 // aktif nav linkleri: desktop nav, mobil drawer, bottom-nav
  var sel='.nav a.active, .d-link.active, .bn-item.active';
  var links=document.querySelectorAll(sel);
  links.forEach(function(a){
    if(a.tagName!=='A')return;                 // drawer'da <button> trigger'lar hariç
    a.setAttribute('aria-current','page');
    var href=(a.getAttribute('href')||'').trim();
    if(!href||href.charAt(0)==='#')return;     // pür anchor → dokunma
    var file=href.split('#')[0].split('?')[0].split('/').pop().toLowerCase();
    if(file && file===here){                   // SELF link → boş-tık yerine başa kaydır
      a.addEventListener('click',function(e){
        e.preventDefault();
        window.scrollTo({top:0,behavior:'smooth'});
      });
    }
  });
})();

/* ---- scroll-reveal + başa dön (DadaMentor paneli kaldırıldı — belge §1/§21) ---- */
// ---- ÖLÇÜLÜ SCROLL-REVEAL (FOUC-güvenli; .reveal hedefi yoksa no-op; class 'in') ----
(function(){
  var els=document.querySelectorAll('.reveal');
  if(!els.length)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(!('IntersectionObserver' in window))return;
  document.documentElement.classList.add('reveal-ready');
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
  },{threshold:.12,rootMargin:'0px 0px -7% 0px'});
  els.forEach(function(el){io.observe(el);});
})();
// ---- SCROLL-TO-TOP (sağ-alt; scrollY eşiği, dipte gizle) ----
(function(){
  var btn=document.getElementById('toTop');
  if(!btn)return;
  var smooth=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function upd(){
    var y=window.scrollY||document.documentElement.scrollTop;
    var max=document.documentElement.scrollHeight-window.innerHeight;
    btn.classList.toggle('show', y>620 && (max-y)>120);
  }
  btn.addEventListener('click',function(){window.scrollTo({top:0,behavior:smooth?'smooth':'auto'});});
  window.addEventListener('scroll',upd,{passive:true});
  window.addEventListener('resize',upd);
  upd();
})();
/* ============================================================
 FİT DURUM MODÜLÜ — program ve challenge yaşam döngüsü (belge §11 · §8.4)
 Tek kayıt: localStorage['dm_fit'] = {
 program:{slug,ad,durum,hafta,gun,toplam,biten,kacan},
 challenge:{slug,ad,durum,gun,toplam,seri,telafi},
 bugun:{dk,kcal,tamam}, gecmis:[…], hafta:[dk…]
 }
 durum ∈ devam · duraklatildi · birakildi · tamamlandi
 Sayfalar bu modülü çağırır; her sayfa kendi state'ini kurmaz.
 ============================================================ */
(function(){
  var KEY='dm_fit';
  /* ============================================================
     ŞEMA v2 — R10 · belge §3.7 · §4.3 · §5.2 · §5.3 · §6
     ------------------------------------------------------------
     Belgenin kapatılamayan sekiz kalemi tek bir sebebe bağlıydı:
     şemada alan yoktu. Eklenenler ve hangi kalemi açtıkları:

       program.baslangic   ISO tarih   → §5.2 tahmini bitiş · §4 aylık görünüm
       program.gunler[]    1=Pzt…7=Paz → §4.3 "haftanın hangi günleri"
       program.saat        'HH:MM'     → §4.3 hatırlatma saati
       bugun.su            bardak      → §6 su takibi (D16: oturumluktu)
       bugun.gunSonu{}     §3.7 alanları (not·zorluk·efor·enerji·agri)
       gecmis[].kaynak     KANIT KADEMESİ — aşağıda
       program.tasimalar{} 1=Pzt kalıbının TEK SEANSLIK istisnası → §4.3/2
       program.dinlenmeler[] belirli tarihi dinlenmeye çevirir → §4.3/3
       arsiv[]             biten/bırakılan programlar → "Geçmiş programların"

     KANIT KADEMESİ (akış denetiminden geldi, belgede yok):
     Bugüne kadar aynı "antrenman tamamlandı" dört ayrı yerde dört farklı
     kalitede kayıt üretiyordu ve uygulama dördünü aynı sayıyordu:
       egzersiz-detay      → çalışan kronometreden ÖLÇÜLDÜ
       video-seans-detay   → videonun nominal süresi  [modül 2026-08-29'da kalktı]
       program-detay       → SABİT dk:25 kcal:280 (uydurma)
       challengeGunTamamla → hiçbir şey
     Artık her kayıt neye dayandığını taşıyor. Rozet/seri buna bakabilir,
     kullanıcı kendi geçmişinin ne kadar sağlam olduğunu görebilir.
     ============================================================ */
  var KAYNAKLAR = ['olculdu','video','cihaz','beyan'];
  var BOS = { surum:2, program:null, arsiv:[], bildirimler:[], challenge:null, randevular:[],
              bugun:{tarih:null,dk:0,kcal:0,tamam:false,su:0,gunSonu:null},
              gecmis:[] };
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  /* R20/K13 · GÜN ANAHTARI — fit-su.js ile AYNI biçim ('YYYY-MM-DD', yerel
     saat). İki modül aynı güne aynı adı vermezse "bugün" iki yerde iki ayrı
     gün olur; bu depoda üç kez temizlenen "aynı soruya iki cevap" kusuru. */
  function bugunAnahtar(d){
    d = d || new Date();
    var ay = String(d.getMonth()+1), gn = String(d.getDate());
    if(ay.length<2) ay='0'+ay;
    if(gn.length<2) gn='0'+gn;
    return d.getFullYear()+'-'+ay+'-'+gn;
  }

  /* GÖÇ — v1 kayıtları KIRILMAZ. Eksik alan varsayılanla tamamlanır, var olan
     hiçbir değer ezilmez. Yazma anında değil OKUMA anında yapılıyor: kullanıcı
     depoyu hiç açmasa bile eski kayıt yeni koda güvenli girer. */
  function goc(v){
    if(!v || typeof v !== 'object') return clone(BOS);
    /* R14-B/#7 — `bildirimler` v2 yayınlandıktan SONRA eklendi; surum===2
       kayıtlar erken dönüyor ve alanı hiç görmüyordu. Sürüm numarasını
       yükseltmek yerine alan bazlı tamamlama: eski kayıt kırılmaz, yeni
       alan her okumada güvenceye alınır. */
    if(!Array.isArray(v.bildirimler)) v.bildirimler = [];

    /* ============================================================
       R20 · HER OKUMADA KOŞAN ÜÇ DÜZELTME — surum===2 erken dönüşünün
       ÜSTÜNDE durmak ZORUNDALAR. Aşağıdaki blok yalnız göç turunda koşar;
       gün dönümü ise her okumada sorulmalı.
       ============================================================ */

    /* K13 · GÜN DÖNÜMÜ. `bugun` nesnesinin tarih alanı YOKTU ve sıfırlayan
       kod da yoktu: ölçüldü, üç ayrı güne yazılan 90 dakikanın tamamı ekranda
       "90 dk bugün hareket" oluyordu. Doğrusu o günün kendi 20 dakikasıydı.
       Sıfırlama YAZMA anında değil OKUMA anında: kullanıcı depoyu gece
       kapatıp sabah açtığında araya girecek bir yazma olayı yok.
       `su` taşınıyor — su artık dm_fit_su_v1'in işi (K20), buradaki alan
       yalnız fit-su.js'in tek seferlik göç okuması için duruyor. */
    v.bugun = v.bugun || {dk:0,kcal:0,tamam:false,su:0,gunSonu:null};
    var _gun = bugunAnahtar();
    if(v.bugun.tarih !== _gun){
      v.bugun = {tarih:_gun, dk:0, kcal:0, tamam:false,
                 su:(typeof v.bugun.su === 'number' ? v.bugun.su : 0),
                 gunSonu:null};
    }

    /* K15 · TOHUM HAFTA DİZİSİ SÖKÜLDÜ. `[62,74,90,96,118,142]` BOŞ depoda
       bile doğuyordu ve yalnız son elemanı artıyordu: hiç antrenman yapmamış
       kullanıcı "bu haftanın ritmi" grafiğinde beş haftalık düzenli bir geçmiş
       görüyordu. Dizi artık SAKLANMIYOR, `haftalik()` ile gecmis[].tarihISO'dan
       TÜRETİLİYOR — veri yoksa grafik boş durumunu basar. */
    if('hafta' in v) delete v.hafta;

    /* K14 · `gecmis[].tarih` sabit 'bugün' dizgesiydi ve ekrana BASILAN alan
       oydu; gerçek tarih `tarihISO`da zaten doğru duruyor (rozet motoru onu
       kullanıyor). Alan siliniyor; okuyan taraf FIT_SHELL.tarihEtiket() ile
       biçimliyor. Bir alanı yanlış tutmaktansa hiç tutmamak. */
    var _tarihTemiz = false;
    (v.gecmis||[]).forEach(function(g){ if(g && 'tarih' in g){ delete g.tarih; _tarihTemiz = true; } });
    if(_tarihTemiz && v.surum === 2){ try{ localStorage.setItem(KEY, JSON.stringify(v)); }catch(e){} }

    if(v.surum === 2) return v;
    v.surum = 2;
    v.bugun = v.bugun || {dk:0,kcal:0,tamam:false};
    if(typeof v.bugun.su !== 'number') v.bugun.su = 0;
    if(!('gunSonu' in v.bugun))        v.bugun.gunSonu = null;
    if(!Array.isArray(v.arsiv)) v.arsiv = [];
    /* R14-B/#7 — bildirim akışı artık VERİDEN. Eski kayıtlarda alan yok. */
    if(!Array.isArray(v.bildirimler)) v.bildirimler = [];
    if(v.program){
      if(!('baslangic' in v.program)) v.program.baslangic = null;
      if(!Array.isArray(v.program.gunler)) v.program.gunler = [];
      if(!('saat' in v.program))      v.program.saat = null;
      /* tasimalar: TEK seansın istisnası. gunler[] haftalık KALIP, istisnayı
         tutamaz. Anahtar seans numarası, değer o seansın yeni tarihi. */
      if(!v.program.tasimalar)  v.program.tasimalar  = {};
      /* dinlenmeler: belirli bir TARİHİ antrenman günü olmaktan çıkarır.
         gunler[]'den gün silmek başka şey — o kalıcı kalıp değişikliği. */
      if(!Array.isArray(v.program.dinlenmeler)) v.program.dinlenmeler = [];
    }
    /* Eski geçmiş kayıtlarının kaynağı BİLİNMİYOR. 'olculdu' demek yalan
       olurdu; en zayıf kademeye değil, dürüst olana yazıyoruz. */
    (v.gecmis||[]).forEach(function(g){ if(!g.kaynak) g.kaynak = 'beyan'; });
    return v;
  }
  function read(){
    /* R20/K13 · BOŞ kayıt da `goc`tan geçer. Eskiden `clone(BOS)` doğrudan
       dönüyordu ve `bugun.tarih` null kalıyordu: ilk antrenman tarihsiz
       yazılıyor, İKİNCİ okuma bunu gün dönümü sanıp sayacı sıfırlıyordu.
       Ölçüldü — üç kaydın ilki (40 dk) sessizce uçuyordu. */
    try{ var r=localStorage.getItem(KEY); return goc(r?JSON.parse(r):clone(BOS)); }
    catch(e){ return goc(clone(BOS)); }
  }
  function write(v){
    try{ localStorage.setItem(KEY,JSON.stringify(v)); }catch(e){}
    document.dispatchEvent(new CustomEvent('fit:state',{detail:v}));
    return v;
  }
  /* R20/K11 · K12 · ARŞİV KAYDI TEK YERDEN ÜRETİLİYOR.
     Üç yer aynı nesneyi ayrı ayrı yazıyordu ve üçü de `dinlenmeler`i
     DÜŞÜRÜYORDU. Ölçüldü: bir dinlenme günü eklenip yeni program başlatılınca
     `dinlenme` ölçüsü 1'den 0'a düşüyordu — `dinlenme-5` rozeti ancak TEK bir
     program içinde 5 dinlenme günü olan kullanıcıya düşebiliyordu, program
     değiştiren kullanıcının sayacı geri gidiyordu. Dinlenme günleri artık
     arşiv kaydıyla birlikte taşınıyor; rozet motoru aktif + arşiv toplar. */
  function _arsivKaydi(p, durum){
    return {
      slug:p.slug, ad:p.ad, durum:durum,
      biten:p.biten||0, kacan:p.kacan||0, toplam:p.toplam||0,
      baslangic:p.baslangic||null, bitis:new Date().toISOString(),
      dinlenmeler:(Array.isArray(p.dinlenmeler) ? p.dinlenmeler.slice() : [])
    };
  }

  /* R20/K15 · HAFTALIK RİTİM TÜRETİLİYOR, SAKLANMIYOR.
     Dönen dizi son `n` haftayı ESKİDEN YENİYE verir; her eleman
     {baslangic:'YYYY-MM-DD', dk:Number, kayit:Number}. Hafta Pazartesi başlar.
     `veriVar` yanlışsa çağıran boş durum basar — sıfır dolu bir grafik
     "hiç antrenman yok" demenin dürüst yoludur, uydurma sayı değil. */
  function haftaBasi(d){
    var t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var g = t.getDay(); if(g === 0) g = 7;          /* Pazar = 7 */
    t.setDate(t.getDate() - (g - 1));
    return t;
  }
  function haftalik(n){
    n = (typeof n === 'number' && n > 0) ? n : 6;
    var s = read(), kova = [], i, b = haftaBasi(new Date());
    for(i = n - 1; i >= 0; i--){
      var t = new Date(b.getFullYear(), b.getMonth(), b.getDate() - i * 7);
      kova.push({baslangic:bugunAnahtar(t), dk:0, kayit:0, _t:t.getTime()});
    }
    var enErken = kova[0]._t;
    (s.gecmis || []).forEach(function(g){
      if(!g || !g.tarihISO) return;
      var d = new Date(g.tarihISO);
      if(isNaN(d)) return;
      var hb = haftaBasi(d).getTime();
      if(hb < enErken) return;
      for(var j = 0; j < kova.length; j++){
        if(kova[j]._t === hb){
          kova[j].kayit++;
          if(typeof g.dk === 'number') kova[j].dk += g.dk;
          break;
        }
      }
    });
    var veriVar = false;
    kova.forEach(function(k){ delete k._t; if(k.kayit) veriVar = true; });
    return {haftalar:kova, veriVar:veriVar};
  }

  var API = {
    read:read, write:write, reset:function(){ return write(clone(BOS)); },
    /* R20/K13 · K15 — ekranların ortak takvim ucu. Gün anahtarı fit-su.js ile
       aynı biçimde üretilir; iki modül aynı güne aynı adı verir. */
    bugunAnahtar:bugunAnahtar,
    haftalik:haftalik,

    /* ---- program yaşam döngüsü (belge §8.3 · §11) ---- */
    /* Aktif program varken yenisine başlamak ESKİSİNİ SİLİYORDU: biten, kacan,
       baslangic sessizce yok oluyordu ve "Geçmiş programların" kartını
       besleyecek veri kalmıyordu (kart bu yüzden sabit HTML'di). Artık eski
       program arşive geçiyor. Sessiz veri kaybı bir kusurdur, özellik değil. */
    programArsivle:function(){
      var s=read();
      if(s.program){
        if(!s.program.arsivlendi) s.arsiv.unshift(_arsivKaydi(s.program, s.program.durum));
        s.program=null;
      }
      return write(s);
    },
    programBasla:function(p){
      var s=read();
      /* Üzerine yazmadan önce arşivle. Çağıran ayrıca uyarmalı — bu yalnız
         veriyi kurtarır, kullanıcıya sormanın yerini tutmaz. */
      /* R20/K11 · bayraklı program ikinci kez arşivlenmez: biten program
         zaten `antrenmanTamamla` anında arşive geçti. Eskiden buradaki
         koşulsuz arşivleme "İlk Program" rozetini GEÇ düşüren tek yoldu. */
      if(s.program && !s.program.arsivlendi){
        s.arsiv.unshift(_arsivKaydi(s.program,
          s.program.durum==='tamamlandi' ? 'tamamlandi' : 'birakildi'));
      }
      s.program={slug:p.slug,ad:p.ad,durum:'devam',hafta:1,gun:1,
                 toplam:p.toplam||12,biten:0,kacan:0,
                 /* v2 — program artık TAKVİME oturuyor. Bunlar olmadan program
                    bir liste; "yarın 07:30, Gün 2" denemez, hatırlatma kurulamaz,
                    aylık görünüm çizilemez, bitiş tarihi hesaplanamaz. */
                 baslangic:(p&&p.baslangic)||null,
                 gunler:(p&&p.gunler)||[],
                 saat:(p&&p.saat)||null,
                 tasimalar:{}, dinlenmeler:[]};
      return write(s);
    },
    /* §4.3 madde 2 — tek seansı başka güne taşı. Kalıbı değiştirmez. */
    seansTasi:function(seansNo, tarih){
      var s=read();
      if(s.program){ if(tarih) s.program.tasimalar[String(seansNo)]=tarih;
                     else delete s.program.tasimalar[String(seansNo)]; }
      return write(s);
    },
    /* §4.3 madde 3 — belirli bir tarihi dinlenme günü yap / geri al. */
    dinlenmeEkle:function(tarih){
      var s=read();
      if(s.program && s.program.dinlenmeler.indexOf(tarih)<0) s.program.dinlenmeler.push(tarih);
      return write(s);
    },
    dinlenmeKaldir:function(tarih){
      var s=read();
      if(s.program) s.program.dinlenmeler=s.program.dinlenmeler.filter(function(t){return t!==tarih;});
      return write(s);
    },
    /* Takvimi sonradan da kurulabilsin: kullanıcı programı başlatırken
       atlayabilir, Plan ve Takvim'den doldurur. */
    programPlanla:function(o){
      var s=read();
      if(s.program){
        if(o&&o.baslangic!==undefined) s.program.baslangic=o.baslangic;
        if(o&&o.gunler)                s.program.gunler=o.gunler;
        if(o&&o.saat!==undefined)      s.program.saat=o.saat;
      }
      return write(s);
    },
    /* §5.2 — tahmini bitiş. Kaçırılan gün CEZA DEĞİL: programı öteler.
       Haftalık antrenman sayısı bilinmiyorsa 3 varsayılır (kataloğun modu). */
    bitisTahmini:function(){
      var s=read(), p=s.program;
      if(!p||!p.baslangic) return null;
      var bas=new Date(p.baslangic);
      if(isNaN(bas)) return null;
      var haftalik=(p.gunler&&p.gunler.length)||3;
      var kalan=Math.max(0,(p.toplam||0)-(p.biten||0))+(p.kacan||0);
      /* KUSUR DÜZELTİLDİ (R10): kalan haftalar BAŞLANGIÇ tarihine ekleniyordu.
         Oysa biten seanslar zaten zaman tüketti — fonksiyon "hiç antrenman
         yapılmamış gibi" hesaplıyordu ve `biten` arttıkça tahmini bitiş GERİYE
         gidiyordu (biten=toplam olduğunda bitiş neredeyse başlangıç oluyordu).
         Ölçülen çelişki: aylık takvim son antrenmanı 18 Eylül'e çizerken çip
         31 Ağustos diyordu.
         Doğrusu: kalan süre BUGÜNE eklenir. Program henüz başlamadıysa
         (başlangıç ileri tarihli) referans başlangıçtır. */
      var bugun=new Date(); bugun.setHours(0,0,0,0);
      var ref=new Date(Math.max(bas.getTime(), bugun.getTime()));
      ref.setDate(ref.getDate()+Math.ceil(kalan/haftalik)*7);
      /* Saat 12:00'ye sabitleniyor. Yerel GECE YARISI kullanınca `toISOString()`
         UTC'ye çevirirken günü geriye atıyordu: TR (UTC+3) için bitmiş bir
         program "dün" bitiyor görünüyordu. Öğlen, ±12 saatlik hiçbir dilimde
         gün sınırını geçmez. */
      ref.setHours(12,0,0,0);
      return ref.toISOString();
    },

    /* §6 — su takibi. D16'da "oturumluk" diye açık kalmıştı; artık kalıcı. */
    /* R20/K20 · `suEkle` ve `suSifirla` SÖKÜLDÜ. Ölçüldü: çağıranları 0'dı
       (tek geçiş bir yorum satırıydı) ve `bugun.su` alanını yazan da 0'dı.
       R18'de su tek kaynağa (`dm_fit_su_v1` · FIT_SU) taşınmış, kabuk tarafı
       geride kalmıştı. İki uç durdukça bir sonraki geliştiricinin onları
       çağırıp İKİNCİ bir su deposu doğurma riski vardı.
       `bugun.su` alanı DURUYOR — fit-su.js'in tek seferlik göç okuması onu
       hâlâ okuyor; yazan artık yok. */

    /* §3.7 — gün sonu. D12'de "şemada yer yok" diye açık kalmıştı.
       Hepsi isteğe bağlı; boş gönderilen alan yazılmaz, silinmez. */
    gunSonuKaydet:function(v){
      var s=read();
      s.bugun.gunSonu = {
        not:(v&&v.not)||'', zorluk:(v&&v.zorluk)||null, efor:(v&&v.efor)||null,
        enerji:(v&&v.enerji)||null, agri:(v&&v.agri)||'',
        tarih:new Date().toISOString()
      };
      s.bugun.tamam = true;
      return write(s);
    },
    programDurakla:function(){ var s=read(); if(s.program)s.program.durum='duraklatildi'; return write(s); },
    programDevam:function(){   var s=read(); if(s.program)s.program.durum='devam';        return write(s); },
    programBirak:function(){   var s=read(); if(s.program)s.program.durum='birakildi';    return write(s); },
    programYenidenBasla:function(){
      var s=read();
      if(s.program){ s.program.durum='devam'; s.program.hafta=1; s.program.gun=1; s.program.biten=0; s.program.kacan=0; }
      return write(s);
    },
    /* kaçırılan gün: kaydır = planı ötele · atla = günü tüket. İkisinde de suçluluk dili yok. */
    gunKaydir:function(){ var s=read(); if(s.program){ s.program.kacan=(s.program.kacan||0)+1; } return write(s); },
    gunAtla:function(){   var s=read(); if(s.program){ s.program.gun++; } return write(s); },

    /* ---- tamamlanan antrenman → Enerji Defteri + ilerleme (belge §19) ---- */
    antrenmanTamamla:function(a){
      var s=read(), ad=(a&&a.ad)||'Antrenman';
      /* R14-B · dk ARTIK ÜÇ DURUMLU — kcal ile simetrik.
         Eskiden `(a&&a.dk)||25` idi: süresi bilinmeyen bir kayıt sessizce
         "25 dk" oluyordu. Plan köprüsü tam bu duruma düşüyor — üretilen
         planda seans süresi YOK (`secimler`de süre alanı yok,
         `hareketler[].sure` null), yalnız set/tekrar/dinlenme var. 25
         yazmak uydurma olurdu; kanıt kademesinin öldürmeye çalıştığı şey
         de bu (programlarim-v1.html#programlarim'de `antrenmanTamamla` bu yüzden hiç
         çağrılmıyordu: "gecmis'e 'Gün sonu · 0 dk' diye sahte bir
         antrenman kaydı düşürür").
           sayı verildi (0 dahil) → o sayı
           açıkça null verildi    → BİLİNMİYOR, sayıya çevrilmez
           hiç verilmedi          → 25 (eski çağrılar kırılmaz) */
      var dk;
      if      (a && typeof a.dk === 'number') dk = a.dk;
      else if (a && 'dk' in a)                dk = null;
      else                                    dk = 25;
      /* kcal ÜÇ DURUM taşır — eskiden ikisi aynıydı ve bu, kanıt kademesinin
         tam da öldürmeye çalıştığı uydurmayı üretiyordu:
           sayı verildi (0 dahil) → o sayı
           açıkça null verildi   → BİLİNMİYOR, sayıya çevrilmez
           hiç verilmedi         → 280 (eski çağrılar kırılmasın)
         Eskiden `(a&&a.kcal)||280` yüzünden `kcal:0` ve `kcal:null` de 280'e
         düşüyordu: çağıran "bilmiyorum" diyemiyor, uydurmak zorunda kalıyordu. */
      var kcal;
      if      (a && typeof a.kcal === 'number') kcal = a.kcal;
      else if (a && 'kcal' in a)                kcal = null;
      else                                      kcal = 280;
      /* KANIT KADEMESİ — çağıran neye dayandığını SÖYLEMEK ZORUNDA.
         Söylemezse 'beyan' yazılır, çünkü söylenmeyen şey ölçülmüş sayılamaz.
         Uydurma bir kademe yazmaktansa zayıf ama doğru olanı yazıyoruz. */
      var kaynak = (a&&a.kaynak && KAYNAKLAR.indexOf(a.kaynak)>=0) ? a.kaynak : 'beyan';
      /* R20/K13 · "BUGÜN" YALNIZ BUGÜNÜ SAYAR. Eskiden sayaç, kaydın TARİHİNE
         bakmadan artıyordu: geriye dönük ya da cihazdan gelen bir kayıt
         (9 gün önce, 40 dk) bugünün rakamına giriyordu. Gün dönümü düzeltmesi
         tek başına yetmez — kaydın kendi tarihi de sorulmak zorunda.
         `tarihISO` verilmemişse kayıt zaten şimdi doğuyor, bugüne yazılır. */
      var _kayitISO = (a && a.tarihISO) || null;
      var _bugunMu = !_kayitISO || bugunAnahtar(new Date(_kayitISO)) === bugunAnahtar();
      if(_bugunMu){
        s.bugun.dk += (dk||0); s.bugun.kcal += (kcal||0); s.bugun.tamam = true;
      }
      /* R15/5 · ÜÇ ALAN EKLENDİ — challenge motorunun tek hunisi.
         Üçü de İSTEĞE BAĞLI; eski kayıtlarda yok ve okuyan taraf yokluğu
         göstermez, uydurmaz (fit-plan-kayit.js v2 şema göçünün deseni).
           tarihISO → süreli hedef penceresi + alışkanlık serisi
           slug     → egzersiz serisi eşleşmesi
           metrik   → sayısal hedef toplamı, ör. {km,tekrar,set,dk,adim}
         `goc()` DEĞİŞMEDİ, yeni olay kanalı da gerekmedi: `write()` zaten
         `fit:state` yayınlıyor ve `fit-challenge.js` ona abone. */
      s.gecmis.unshift({
        /* R20/K14 · `tarih:'bugün'` sabiti KALKTI — yazılan her kaydın tarihi
           harfi harfine "bugün" oluyordu ve ekrana basılan alan oydu. */
        tarihISO:(a && a.tarihISO) || new Date().toISOString(),
        ad:ad,
        slug:(a && a.slug) || null,
        metrik:(a && a.metrik && typeof a.metrik==='object') ? a.metrik : null,
        dk:dk, kcal:kcal, kaynak:kaynak
      });
      /* R20/K15 · haftalık dizinin son elemanını artıran satır KALKTI:
         diğer beş değeri yazan kod hiç yoktu, hafta kaydırması da yoktu.
         Ritim artık `haftalik()` ile gecmis[].tarihISO'dan türetiliyor. */
      if(s.program && s.program.durum==='devam'){
        s.program.biten++;
        if(s.program.biten>=s.program.toplam){
          s.program.durum='tamamlandi';
          /* R20/K11 · PROGRAMI BİTİRMEK ROZETİ VERMİYORDU. Ölçüldü: 3 seanslık
             program 3/3 bitirildi → durum 'tamamlandi', ama `arsiv` boş,
             `bitenProgram` 0, "İlk Program" rozeti "yolda". Rozet ancak
             HAFTALAR SONRA alakasız bir program başlatılınca düşüyordu, çünkü
             arşive yazan tek yol `programBasla`nın içindeki otomatik arşivlemeydi.
             Artık biten program ANINDA arşive geçiyor.
             Program NESNESİ SİLİNMİYOR: kutlama ekranı, bitiş kartı ve
             "Geçmiş programların" aynı anda doğru kalsın diye kayıt hem
             duruyor hem arşivde. Çift sayımı `arsivlendi` bayrağı önler —
             `programBasla` bayraklı programı ikinci kez arşivlemez. */
          if(!s.program.arsivlendi){
            s.arsiv.unshift(_arsivKaydi(s.program, 'tamamlandi'));
            s.program.arsivlendi = true;
          }
        }
        else { s.program.gun++; if(s.program.gun>7){ s.program.gun=1; s.program.hafta++; } }
      }
      return write(s);
    },

    /* ---- R14-B/#5 · PLAN ARŞİVİ -------------------------------------
       Arşiv ekranı (fit-planim-programim → arsivBas) ve şeması hazırdı
       ({durum, biten, toplam, bitis}) ama yalnız PROGRAM tarafından
       besleniyordu; biten bir plan hiçbir yere düşmüyor, ekran "Henüz
       arşivlenmiş program yok" demeye devam ediyordu.

       `kaynak` alanı ekleniyor: bir arşiv satırının programdan mı plandan
       mı geldiği kaydın kendisinden okunmalı. Eski kayıtlarda alan yok —
       okuyan taraf yokluğu 'program' sayar (o güne kadar yalnız program
       yazıyordu, bu bir varsayım değil kayıt altındaki gerçek).
       `biten/toplam` planda GÜN sayısıdır: bir gün bir antrenmandır. */
    planArsivle:function(k){
      var s=read();
      s.arsiv.unshift({
        kaynak:'plan', slug:k.slug, ad:k.ad, durum:'tamamlandi',
        biten:k.biten||0, kacan:0, toplam:k.toplam||0,
        /* `oran` AYRI TAŞINIYOR, biten/toplam'dan türetilmiyor. Planda bu iki
           sayı iki ayrı şeyi ölçer: biten/toplam GÜN sayısıdır (hepsi karar
           aldıysa 3/3), oran ise HAREKET düzeyindedir ve atlananı saymaz.
           Türetseydik arşiv "%100" derken bitiş kartı "%93" diyecekti —
           aynı kayıt için iki farklı yüzde. */
        oran:(typeof k.oran==='number'?k.oran:null),
        baslangic:k.baslangic||null, bitis:k.bitis||new Date().toISOString(),
        tur:k.tur||1
      });
      return write(s);
    },

    /* ---- R14-B/#7 · BİLDİRİM AKIŞI ----------------------------------
       bildirimler-v1 tamamen sabit HTML'di; "3. gün tamamlandı" satırı
       ekranda duruyordu ama hiçbir veriye bağlı değildi. Artık gerçek
       olaylar buraya yazılıyor, sayfa bunları basıyor.
       Aynı olay iki kez yazılmasın diye `anahtar` benzersizdir. */
    bildirimEkle:function(b){
      var s=read();
      if(!Array.isArray(s.bildirimler)) s.bildirimler=[];
      var ah = b && b.anahtar;
      if(ah && s.bildirimler.some(function(x){ return x.anahtar===ah; })) return s;
      s.bildirimler.unshift({
        anahtar: ah || ('b_'+Date.now()),
        tur:     (b&&b.tur)||'sistem',
        baslik:  (b&&b.baslik)||'',
        metin:   (b&&b.metin)||'',
        href:    (b&&b.href)||null,
        tarih:   (b&&b.tarih)||new Date().toISOString(),
        okundu:  false
      });
      if(s.bildirimler.length>50) s.bildirimler.length=50;
      return write(s);
    },
    bildirimOkundu:function(anahtar){
      var s=read();
      (s.bildirimler||[]).forEach(function(x){ if(!anahtar||x.anahtar===anahtar) x.okundu=true; });
      return write(s);
    },
    /* Silme GERİ ALINABİLİR olmalı — sayfada zaten bir "geri al" şeridi var.
       Kaydı diziden çıkarmak geri almayı imkânsız kılardı; işaretleniyor.
       İşaretli kayıt basılmaz. */
    bildirimSil:function(anahtar, geriAl){
      var s=read();
      (s.bildirimler||[]).forEach(function(x){ if(x.anahtar===anahtar) x.silindi = !geriAl; });
      return write(s);
    },

    /* ---- challenge ----
       R16/1 · İKİNCİ KAYIT YERİ SÖKÜLDÜ.
       Burada dört yazma ucu vardı ve `s.challenge` tek nesnesini ELLE
       ARTIRIYORDU: katıl → gun:1/seri:1, günü tamamla → gun++/seri++,
       kaçır → telafi++, bırak → durum. Hiçbiri kanıt almıyordu ve
       `fit-challenge.js` aynı soruya BAŞKA bir cevap veriyordu: o,
       ilerlemeyi `gecmis[]`ten her seferinde YENİDEN HESAPLIYOR.
       Aynı veriye iki yazıcı, biri sayaç biri hesap — bu depoda üç kez
       temizlenen "aynı soruya iki cevap" kusurunun tam kendisi.
       ÖLÇÜLDÜ: dördünün de çağıranı 0'dı (sayfalar R15/5'te motora geçti).
       Yazma artık YALNIZ `FIT_CHALLENGE.katil/birak/isaretle`den geçer.
       `s.challenge` alanı DURUYOR ve okunmaya devam ediyor (programlarim ·
       kabuğun modül rozeti); ona motorun `_yansit()`i yazar — okuyan taraf
       kırılmadı, yazan taraf teke indi. */
    /* ---- randevu yaşam döngüsü (belge §11, 9 adım) ---- */
    randevuAl:function(r){
      var s=read();
      s.randevular = s.randevular || [];
      /* R15 · Ajan 5'in ölçümü: `durum` gelse bile YOK SAYILIYORDU, her
         randevu sabit 'onay-bekliyor' oluyordu. Sonuç: "Onaylandı" ya da
         "Tamamlandı" hiçbir zaman doğal yoldan doğmuyor, ancak
         `randevuDurum(i,d)` ile elle kuruluyordu — yani ekranlar tek bir
         hâli gösterebiliyordu. Çağıran artık söyleyebilir; söylemezse
         varsayılan yine 'onay-bekliyor'. Bilinmeyen bir dizge kabul
         edilmiyor: uydurma bir durum, olmayan bir rozet demek olurdu. */
      var DURUMLAR = ['onay-bekliyor','onaylandi','tamamlandi','iptal','ertelendi','gelmedi'];
      var d = (r && DURUMLAR.indexOf(r.durum) > -1) ? r.durum : 'onay-bekliyor';
      s.randevular.unshift({antrenor:r.antrenor, slug:r.slug, hizmet:r.hizmet, fiyat:r.fiyat,
                            tarih:r.tarih, saat:r.saat, durum:d});
      return write(s);
    },
    randevuDurum:function(i,d){ var s=read(); if(s.randevular&&s.randevular[i])s.randevular[i].durum=d; return write(s); },
    randevuEtiket:function(d){
      return {'onay-bekliyor':'Onay bekliyor','onaylandi':'Onaylandı','tamamlandi':'Tamamlandı',
              'iptal':'İptal edildi','ertelendi':'Ertelendi','gelmedi':'Gelinmedi'}[d]||d;
    },
    randevuRozet:function(d){
      return {'onay-bekliyor':'wait','onaylandi':'ok','tamamlandi':'ok',
              'iptal':'off','ertelendi':'wait','gelmedi':'stop'}[d]||'off';
    },

    /* durum → okunur etiket (renge EK OLARAK metin — belge §14.3) */
    etiket:function(d){
      return {devam:'Devam ediyor', duraklatildi:'Duraklatıldı', birakildi:'Bırakıldı',
              tamamlandi:'Tamamlandı'}[d] || 'Başlanmadı';
    },
    rozet:function(d){
      return {devam:'ok', duraklatildi:'wait', birakildi:'off', tamamlandi:'ok'}[d] || 'off';
    }
  };
  window.FIT_SHELL = window.FIT_SHELL || {};
  window.FIT_SHELL.state = API;

  /* ============================================================
     PLAN → PROGRAM KÖPRÜSÜ  (R14-B · Beyar kararı #4)
     ------------------------------------------------------------
     Ölçülen kopukluk: iki ayrı sistem birbirine hiç dokunmuyordu.
       PLAN    → FIT_PLAN / dm_fit_planlar_v1 · Tam/Yarım/Atlandı
       PROGRAM → bu modül / dm_fit           · biten++ · arşiv · geçmiş
     Plan %100 olduğunda bile `program` null, `bugun.tamam` false,
     `gecmis` ve `arsiv` boş kalıyordu. `antrenmanTamamla()` dört
     sayfadan çağrılıyordu ama Programım sayfası listede yoktu.

     Köprü BURADA duruyor, sayfada değil: `FIT_PLAN.isaretle()` üç ayrı
     sayfadan çağrılıyor (programim · ilerleme · gecmis); köprüyü sayfaya
     yazsaydık ya çoğaltılır ya eksik kalırdı. Kabuk 66 sayfada var.

     KANIT KADEMESİ 'beyan' (Beyar kararı): kullanıcı kendi işaretledi,
     bu bir beyandır — ölçülmüş değil, ama YOK da sayılmaz.
     SÜRE ve KALORİ açıkça null: üretilen planda seans süresi yok, uydurmak
     kanıt kademesini anlamsız kılardı. Okuyan ekranlar "—" basar.

     TEK SEFERLİK: mühür FIT_PLAN.gunDurum[k].kayit. Kullanıcı işareti geri
     alıp günü tekrar tamamlarsa ikinci kayıt yazılmaz.
     ============================================================ */
  window.addEventListener('fit-plan-degisti', function (e) {
    var d = (e && e.detail) || {};
    if (!window.FIT_PLAN) return;
    if (!d.gunTamamlandi && !d.planTamamlandi) return;
    var p = FIT_PLAN.getir(d.id);
    if (!p) return;
    var tur = (typeof p.tur === 'number' ? p.tur : 1);

    /* --- gün bitti: geçmiş kaydı + bildirim --- */
    if (d.gunTamamlandi) {
      var g   = (p.gunler || []).filter(function (x) { return x.no === d.gunTamamlandi; })[0];
      var gAd = (g && g.ad) || ('Gün ' + d.gunTamamlandi);
      API.antrenmanTamamla({
        ad:     gAd,
        dk:     null,          /* BİLİNMİYOR — planda seans süresi yok */
        kcal:   null,          /* BİLİNMİYOR */
        kaynak: 'beyan'
      });
      FIT_PLAN.gunKayitIsaretle(p.id, d.gunTamamlandi);

      /* R14-B/#7 — bildirim metni VERİDEN kuruluyor; sıradaki gün gerçekten
         varsa söylenir, yoksa cümle uydurulmaz. */
      var o       = FIT_PLAN.ozet(p.id) || {};
      var sonraki = (p.gunler || []).filter(function (x) { return x.no > d.gunTamamlandi; })[0];
      API.bildirimEkle({
        anahtar: p.id + '|t' + tur + '|g' + d.gunTamamlandi,
        tur:     'program',
        baslik:  '"' + (p.ad || 'Planın') + '" planında ' + gAd + ' tamamlandı.',
        metin:   sonraki
                   ? 'Sıradaki gün: ' + (sonraki.ad || ('Gün ' + sonraki.no)) + '.'
                   : 'Planın son günüydü.',
        href:    'fit-programlarim.html' + p.id
      });
    }

    /* --- plan bitti: arşiv kaydı + bildirim --- */
    if (d.planTamamlandi) {
      var oz = FIT_PLAN.ozet(p.id) || {};
      API.planArsivle({
        slug:      p.id,
        ad:        p.ad || 'Planım',
        biten:     oz.bitenGun || 0,
        toplam:    oz.gunSayisi || 0,
        oran:      (typeof oz.oran === 'number' ? oz.oran : null),
        baslangic: p.olusturma || null,
        bitis:     p.bitis || null,
        tur:       tur
      });
      FIT_PLAN.planArsivIsaretle(p.id);
      API.bildirimEkle({
        anahtar: p.id + '|t' + tur + '|plan',
        tur:     'program',
        baslik:  '"' + (p.ad || 'Planın') + '" planını bitirdin.',
        metin:   (oz.gunSayisi || 0) + ' gün, ' + (oz.toplam || 0) + ' hareket. ' +
                 'Özet Plan ve Takvim sayfasında, kayıt arşivde.',
        href:    'fit-programlarim.html' + p.id
      });
    }
  });
})();

/* ============================================================
 SİHİRBAZ KABUKTAN ÇIKTI — R13 (5. tur)
 "Bana Uygun Başlangıcı Bul / Programını Bul" sihirbazı 4. turda burada,
 kabuğun içinde duruyordu: modal kipte örtü katmanı + role="dialog" +
 aria-modal üretiyor, satır içi kipte aynı paneli programlar merkezine
 basıyordu. Beyar (5. tur): "Pop-up tamamen kalksın; sihirbaz kendi tam
 sayfası olsun." Referans: dadadiet.com/diyetisyen-bul.

 ARTIK: motorun tamamı `programini-bul-v1.html` içinde, sayfa JS'i olarak.
 Kabukta ne örtü katmanı ne modal ne de `data-fit-wizard` tetikleyicisi
 var; menü kalemi ve sayfalardaki düğmeler düz bağlantı olarak o sayfaya
 gidiyor. `.wz-*` CSS ailesi de fit-shell.css'ten kaldırıldı.
 ============================================================ */

/* ============================================================
 R6 · MADDE 1-2-3 · SAYFA ALTI "SAĞLIK VE GÜVENLİK" SECTION'I KALDIRILDI
 ------------------------------------------------------------
 Eskiden burada bir IIFE vardı: `<section class="fit-health">` üretip
 `#pageMain`'in son çocuğu yapıyordu (B10'un çözümü, R11). Blok 60
 sayfanın hepsine basılıyordu ve Beyar'ın ölçümüyle okunmuyordu.

 NE KAYBOLMADI:
 · **Yasal banda dokunulmadı.** Footer'ın yasal bandındaki
   `saglik-bilgilendirme-v1.html` bağlantısı yerinde — uyarı siteden
   kaybolmuyor, yalnız her sayfanın altına section olarak basılmıyor.
 · **Üç tercih taşındı**, silinmedi: sayaç sesi (`dm_fit_sound`),
   titreşim (`dm_fit_vibe`) ve hareketi azaltma (`dm_fit_motion`)
   `fit-planim-veri-izin-v1.html`'de "Uygulama tercihleri" kartında.
   **localStorage anahtarları değişmedi**, kayıtlı tercih kaybolmadı.
 · `FIT_SHELL.pref(anahtar)` API'si aşağıda **duruyor** —
   `egzersiz-detay-v1.html` sayaç sesi/titreşimi için bunu okuyor.
 · `dm_fit_motion` açıkken `html.reduce-motion` sınıfı **her sayfada**
   uygulanıyor; bunu aşağıdaki "hareket azaltma" IIFE'si yapıyor
   (zaten ayrı bir bloktu, sağlık şeridine bağlı değildi).

 `<body data-fit-nohealth>` işareti artık hiçbir şey yapmıyor; sayfalarda
 kullanılmıyordu, geriye dönük zararsız.
 ============================================================ */
(function(){
  window.FIT_SHELL = window.FIT_SHELL || {};
  window.FIT_SHELL.pref = function(k){ try{ return localStorage.getItem(k)==='1'; }catch(e){ return false; } };
})();

/* ---- erişilebilirlik: "içeriğe atla" bağlantısı + kabuk işaretleri ---- */
(function(){
  if(document.getElementById('fitSkip')) return;
  var a = document.createElement('a');
  a.id = 'fitSkip'; a.className = 'skip-link'; a.href = '#pageMain';
  a.textContent = 'İçeriğe atla';
  document.body.insertBefore(a, document.body.firstChild);
  var m = document.getElementById('pageMain');
  if(m){ m.setAttribute('tabindex','-1'); m.setAttribute('role','main'); }
  var nav = document.querySelector('.nav');
  if(nav) nav.setAttribute('aria-label','DadaFit ana menü');
  /* etiketi olmayan form alanlarına erişilebilir ad ver */
  document.querySelectorAll('input,select,textarea').forEach(function(el){
    if(el.type==='hidden') return;
    if(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return;
    if(el.id && document.querySelector('label[for="'+el.id+'"]')) return;
    if(el.closest('label')) return;
    var ph = el.getAttribute('placeholder');
    if(!ph && el.tagName==='SELECT'){
      var o = el.querySelector('option[disabled], option[value=""]');
      if(o) ph = o.textContent.replace(/\*/g,'').trim();
    }
    if(ph) el.setAttribute('aria-label', ph);
  });
})();

/* ---- hareket azaltma tercihi: sayfa açılışında uygula ---- */
(function(){
  try{ if(localStorage.getItem('dm_fit_motion')==='1') document.documentElement.classList.add('reduce-motion'); }catch(e){}
})();

/* ---- Ziyaretçi ↔ üye görünümü (belge §9.3 · §19) ----
 Giriş yapılmışsa [data-lg-only] şeritleri (ziyaretçiye "bu veriler örnektir"
 diyen bilgilendirme kapısı) kalkar. Her sayfada tekrar yazılmasın diye kabukta.
 NOT: eskiden burada bir de "Örnek görünüm" ROZETİ (.demo-tag/.fp-demo)
 senkronlanıyordu — rozet ailesi bu turda tüm depodan kaldırıldı (D1). */
(function(){
  function sync(){
    var authed = document.body.classList.contains('is-auth');
    document.querySelectorAll('[data-lg-only]').forEach(function(el){ el.style.display = authed ? 'none' : ''; });
    var st = document.querySelector('.fp-state');
    if(st && authed) st.textContent = 'Ücretsiz üye · kendi verin';
  }
  sync();
  window.addEventListener('storage', sync);
  window.FIT_SHELL = window.FIT_SHELL || {};
  window.FIT_SHELL.syncAuthView = sync;
})();


/* ===================================================================
 İKİNCİL PANELİN YERİ — referans kompozisyonu geri getirir
 (2026-08-11 referans kıyaslama turu)

 Sorun: Faz 1'de banner yüksekliği kuralı için iki kolonlu hero'ların
 ikincil paneli (enerji defteri kartı, challenge ilerleme kartı) bandın
 DIŞINA alınmıştı. Ölçüm gösterdi ki bu, referansta olmayan bir
 kompozisyon: 1440'ta bant 489px→255px'e düşüyor, metin kolonu bandın
 sol yarısında kalıyor, sağ yarı boşalıyor ve kart bandın altına
 sarkıyor. Mobilde ise negatif margin paneli hero CTA'sının üstüne
 bindirip düğmeyi tıklanamaz yapıyordu.

 Çözüm — ikisini birlikte sağlar:
 · ≥641px: panel hero ızgarasının ikinci kolonuna GERİ TAŞINIR
 → referans kompozisyonu (metin solda, panel sağda, ikisi de bandın
 içinde). Banner kuralı dikey boşluk daraltmasıyla sağlanır.
 · ≤640px: panel banddan çıkar (referansta da tek kolona iniyordu);
 bant kısalır, hiçbir içerik gizlenmez, hiçbir düğme örtülmez.
 =================================================================== */
(function(){
  var wrap = document.querySelector('.fit-band-panel');
  if(!wrap) return;
  /* Fit Planım akışındaki panel (enerji-defteri) banda geri taşınmaz:
 o sayfa kaynak belgenin §9'u gereği kişisel kabuk banner'ı kullanıyor. */
  if(wrap.classList.contains('fp-inflow')) return;

  var grid = document.querySelector('.df-hero, .chl-grid, .kp-hero');
  if(!grid) return;

  var panel = wrap.firstElementChild;
  if(!panel) return;

  /* Ana sayfa hero'su TAM EKRAN olduğu için (bkz. fit-shell.css "ANA SAYFA HERO'SU
 TAM EKRAN" bloğu) Enerji Defteri kartı HER genişlikte bandın içinde kalır —
 banddan çıkarma yalnız banner kuralına tabi diğer sayfalar için geçerlidir. */
  /* panel taşındığında boşalan sarmalayıcı yer kaplamasın — içinde boşluk metin
 düğümü kaldığı için CSS :empty tutmuyor, JS ile kapatılır. */
  function sarmalayiciyiGuncelle(){
    wrap.style.display = wrap.querySelector('*') ? '' : 'none';
  }

  if(document.body.getAttribute('data-fit-hero') === '1'){
    if(panel.parentNode !== grid) grid.appendChild(panel);
    sarmalayiciyiGuncelle();
    return;
  }

  /* ---- R15 (5. tur) · SABİT AİLE BANNER'INDA PANEL GERİ TAŞINMAZ ----
     Bu mekanizma, banner'ın yüksekliği SERBEST olduğu dönemde yazıldı:
     panel hero ızgarasının ikinci kolonuna geri taşınıyor, referans
     kompozisyonu (metin solda, panel sağda) böyle kuruluyordu.

     R15 ile banner iki aileye ve SABİT yüksekliğe bağlandı
     (liste 544 · detay 560 @1440). Ölçüm: geri taşınan paneller kutuya
     sığmıyor — `dadafit-kopru` enerji kartı tek başına 391.2 px, kutunun
     verdiği içerik alanı 370 px; `challenge-v1` zaman çizelgesi 187.2 px
     ve banner içeriğini 550.1 px'e çıkarıyordu. R15.3 bu durumda paneli
     banner'ın ALTINA almayı söylüyor — yani bandın içinde bırakmayı.

     Bu yüzden geri taşıma artık YALNIZ ana sayfanın tam-ekran hero'sunda
     (`data-fit-hero="1"`, yukarıdaki erken dönüş) çalışıyor. Aileye bağlı
     her banner'da panel bandın içinde kalır. */
  if(document.body.hasAttribute('data-fit-hero-kind')){
    if(panel.parentNode !== wrap) wrap.appendChild(panel);
    sarmalayiciyiGuncelle();
    return;
  }

  var mq = window.matchMedia('(min-width:641px)');
  function place(){
    if(mq.matches){
      if(panel.parentNode !== grid) grid.appendChild(panel);
    }else{
      if(panel.parentNode !== wrap) wrap.appendChild(panel);
    }
    sarmalayiciyiGuncelle();
  }
  place();
  if(mq.addEventListener) mq.addEventListener('change', place);
  else if(mq.addListener) mq.addListener(place);
})();


/* =====================================================================
 ORTAK FİLTRE BİLEŞENİ — .ff (TEK KAYNAK)
 ---------------------------------------------------------------------
 Sayfa sözleşmesi (tek satır):
 <div class="lib-filters ff" data-ff data-ff-label="program" …>
 · İçindeki .fgroup[data-group] kalemleri facet olarak okunur.
 · Facet başlığı .lbl (yoksa aria-label ya da ilk <span>) metnidir.
 · Sonuç sayacı: data-ff-count=".lib-count" (var olan düğüm taşınır).
 · Sıralama: data-ff-sort=".lib-sort" (var olan blok taşınır).
 · Sıfırla: data-ff-clear="#fClear" (var olan düğmeye tıklanır).

 KRİTİK TASARIM KISITI — .fgroup KUTUSU YAŞAMAYA DEVAM EDER
 Sayfa filtre motorları çipleri doğrudan seçmiyor; ÖNCE grup kutusunu
 buluyorlar:
 filters.querySelectorAll('.fgroup') → her grupta .df-fchip'leri bağla
 filters.querySelector('.fgroup[data-group="…"]') → "Tümü"yü aç/kapa
 Bu yüzden .fgroup SİLİNMEZ, İÇİ BOŞALTILMAZ: olduğu gibi popover'ın
 gövdesine TAŞINIR ve panelin altında kalmaya devam eder. Böylece sayfa
 scripti (bu dosyadan SONRA çalışır) her şeyi yerinde bulur; bileşen
 yalnızca kabuğu ve yerleşimi değiştirir, davranışa hiç dokunmaz.
 Aynı nedenle mobil çekmece de panelin İÇİNE basılır (body'ye değil):
 çekmece açıkken bile .fgroup panelin torunu olarak kalır.
 ===================================================================== */
(function(){
  var panels = document.querySelectorAll('[data-ff]');
  if(!panels.length) return;

  var MQ = window.matchMedia('(max-width:900px)');
  var uid = 0;

  function txt(el){ return el ? (el.textContent||'').replace(/\s+/g,' ').trim() : ''; }

  /* çipin "Tümü" (filtresiz) kalemi mi olduğu — sayfa motorlarının ortak sözleşmesi */
  function isAll(chip){ return chip.getAttribute('data-val') === 'all'; }

  function build(panel){
    var groups = Array.prototype.slice.call(panel.querySelectorAll('.fgroup[data-group]'));
    if(!groups.length) return;
    /* R16/1 · İKİ KEZ KURULMAYA KARŞI MÜHÜR. `filtreKur()` açık uç olunca
       aynı panel iki kez gelebilir; ikinci kurulum iskeleti çiftler ve
       facet düğmeleri iki kopya olurdu. */
    if(panel.getAttribute('data-ff-kuruldu') === '1') return;
    panel.setAttribute('data-ff-kuruldu','1');

    panel.classList.add('ff');
    var id = 'ff' + (++uid);

    /* ---- iskelet ---- */
    var bar = document.createElement('div');
    bar.className = 'ff-bar';
    bar.innerHTML = '<span class="ff-bar-lbl" aria-hidden="true"><i class="fa-solid fa-sliders"></i></span>';

    var chipsRow = document.createElement('div');
    chipsRow.className = 'ff-chips';
    chipsRow.setAttribute('aria-label','Aktif filtreler');
    chipsRow.setAttribute('aria-live','polite');

    var res = document.createElement('div');
    res.className = 'ff-res';

    /* ---- mobil çekmece ---- */
    var sheetOv = document.createElement('div');
    sheetOv.className = 'ff-sheet-ov';
    var sheet = document.createElement('div');
    sheet.className = 'ff-sheet';
    sheet.setAttribute('role','dialog');
    sheet.setAttribute('aria-modal','true');
    sheet.setAttribute('aria-label','Filtrele');
    sheet.innerHTML =
      '<div class="ff-sheet-h"><h3><i class="fa-solid fa-sliders"></i> Filtrele</h3>'+
      '<button class="ff-sheet-close" type="button" aria-label="Filtre panelini kapat"><i class="fa-solid fa-xmark"></i></button></div>'+
      '<div class="ff-sheet-body"></div>'+
      '<div class="ff-sheet-foot">'+
      '  <button class="btn btn-ghost ff-sheet-clear" type="button"><i class="fa-solid fa-rotate-left"></i> Sıfırla</button>'+
      '  <button class="btn btn-primary ff-sheet-apply" type="button">Sonuçları gör</button>'+
      '</div>';
    var sheetBody = sheet.querySelector('.ff-sheet-body');

    /* ---- facet'ler ---- */
    var facets = groups.map(function(g, gi){
      var key   = g.getAttribute('data-group');
      var lblEl = g.querySelector('.lbl') || g.querySelector(':scope > span');
      var label = txt(lblEl) || g.getAttribute('aria-label') || key;
      label = label.replace(/\s*(filtresi|seç)$/i,'').trim();
      if(lblEl) lblEl.remove();

      var chips = Array.prototype.slice.call(g.querySelectorAll('.df-fchip'));

      /* grup içine sıkışmış "Filtreyi sıfırla" düğmesi varsa önce dışarı al —
         popover'ın içinde durmasın (sayfa onu id ile bulmaya devam eder) */
      Array.prototype.slice.call(g.querySelectorAll('.fclear')).forEach(function(fc){
        panel.appendChild(fc);
      });

      var facet = document.createElement('div');
      facet.className = 'ff-facet';
      var popId = id+'-p'+gi;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ff-btn';
      btn.setAttribute('aria-haspopup','true');
      btn.setAttribute('aria-expanded','false');
      btn.setAttribute('aria-controls', popId);
      btn.innerHTML = '<span class="ff-btn-t">'+label+'</span><span class="ff-n">0</span><i class="fa-solid fa-chevron-down ff-car" aria-hidden="true"></i>';

      var pop = document.createElement('div');
      pop.className = 'ff-pop';
      pop.id = popId;
      pop.setAttribute('role','group');
      pop.setAttribute('aria-label', label);
      var head = document.createElement('div');
      head.className = 'ff-pop-h';
      head.innerHTML = '<b>'+label+'</b><button class="ff-pop-clear" type="button">Temizle</button>';
      pop.appendChild(head);

      /* ---- ARAMA ALANI — HER EKSENDE (R5, 4. tur) ----
         "Tümü" bir seçenek değil, seçimin yokluğu → sayıma girmez.
         EŞİK TAMAMEN KALKTI. Tarihçe: C3'te eşik 8'di (yalnız Kas Grubu 10 ve
         Ekipman 15 arama alıyordu), sonra 5'e indi. Beyar 4. turda kararı
         netleştirdi: *"Seviye için de bir arama yapalım, çünkü o da tutarlı
         olsun."* Yani ölçüt seçenek sayısı DEĞİL, aynı sayfadaki eksenlerin
         aynı iç düzeni kullanması. Dört seçenekli bir eksende arama kutusu
         işlevsel olarak gereksiz olabilir ama panelin anatomisi tek olur ve
         kullanıcı hangi ekseni açarsa açsın aynı şeyi görür. */
      var realChips = chips.filter(function(c){ return !isAll(c); });
      var search = null, empty = null;
      if(realChips.length > 0){
        search = document.createElement('div');
        search.className = 'ff-search';
        search.innerHTML =
          '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>'+
          '<input type="search" autocomplete="off" spellcheck="false" '+
          'placeholder="'+label+' ara" aria-label="'+label+' seçenekleri içinde ara" '+
          'aria-controls="'+popId+'-list">'+
          '<button class="ff-search-x" type="button" aria-label="Aramayı temizle" hidden>'+
          '<i class="fa-solid fa-xmark"></i></button>';
        pop.appendChild(search);
        empty = document.createElement('p');
        empty.className = 'ff-empty';
        empty.setAttribute('role','status');
        empty.hidden = true;
        empty.textContent = 'Eşleşen seçenek yok.';
      }

      /* .fgroup KUTUSUYLA BİRLİKTE taşınır (yukarıdaki kısıt) — sayfa motoru
         hem grubu hem çipleri eskisi gibi bulur, listener'ları düşmez */
      g.id = g.id || (popId + '-list');
      g.setAttribute('role','listbox');
      g.setAttribute('aria-multiselectable','true');
      g.setAttribute('aria-label', label);
      chips.forEach(function(c){
        c.setAttribute('role','option');
        /* aria-pressed ile aria-selected aynı öğede DURAMAZ (rol çakışır);
           çoklu seçim listesinin doğru sözleşmesi option+aria-selected. */
        c.removeAttribute('aria-pressed');
        c.setAttribute('aria-selected', c.classList.contains('on') ? 'true':'false');
      });
      pop.appendChild(g);
      if(empty) pop.appendChild(empty);

      facet.appendChild(btn);
      facet.appendChild(pop);

      var allChip = chips.filter(isAll)[0] || null;
      return {key:key, label:label, el:facet, btn:btn, pop:pop, chips:chips, allChip:allChip,
              realChips:realChips, group:g, search:search, empty:empty,
              input: search ? search.querySelector('input') : null,
              clearBtn:head.querySelector('.ff-pop-clear')};
    });

    /* ---- bar içeriği ---- */
    facets.forEach(function(f){ bar.appendChild(f.el); });

    var spacer = document.createElement('div'); spacer.className = 'ff-spacer';
    bar.appendChild(spacer);

    var total = document.createElement('span');
    total.className = 'ff-total';
    total.innerHTML = '<b>0</b> filtre';
    bar.appendChild(total);

    var reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'ff-reset';
    reset.innerHTML = '<i class="fa-solid fa-xmark"></i> Temizle';
    bar.appendChild(reset);

    var openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'ff-open';
    openBtn.innerHTML = '<i class="fa-solid fa-sliders"></i> Filtrele <span class="ff-n">0</span>';
    bar.appendChild(openBtn);

    /* ---- sayfadaki mevcut sayaç ve sıralama bloklarını sonuç satırına taşı ---- */
    var countSel = panel.getAttribute('data-ff-count');
    var sortSel  = panel.getAttribute('data-ff-sort');
    var countHost = countSel ? document.querySelector(countSel) : null;
    var sortHost  = sortSel  ? document.querySelector(sortSel)  : null;
    /* YENİ YERLEŞİM: sayaç ve sıralama ayrı bir satırda değil, çubuğun SAĞ
       UCUNDA. Eski kurguda çubuğun sağı boş kalıyor, altına ikinci bir satır
       daha geliyordu; iki satır arasındaki ölü alan bileşeni "yarım" gösteriyordu. */
    if(countHost){ countHost.classList.add('ff-count'); bar.appendChild(countHost); }
    if(sortHost){ sortHost.classList.add('ff-sort'); bar.appendChild(sortHost); }

    /* eski .lib-bar kabuğu boşaldıysa yer kaplamasın */
    document.querySelectorAll('.lib-bar').forEach(function(lb){
      if(!lb.querySelector('*')) lb.remove();
    });

    /* ---- DOM'a yerleştir ---- */
    panel.appendChild(bar);
    panel.appendChild(chipsRow);
    if(res.children.length) panel.appendChild(res);
    /* çekmece body'ye DEĞİL panele basılır: açıkken bile .fgroup panelin
       torunu kalsın (sayfa motorlarının kapsam sorguları çalışmaya devam etsin).
       position:fixed olduğu için görsel olarak yine ekrana yapışır. */
    panel.appendChild(sheetOv);
    panel.appendChild(sheet);
    panel.classList.add('ff-ready');

    /* ---- sayfanın kendi "sıfırla" düğmesi varsa ona bağlan ---- */
    var pageClear = panel.getAttribute('data-ff-clear');
    var pageClearEl = pageClear ? document.querySelector(pageClear) : null;
    /* eski .fclear düğmesi bar'a taşınmışsa gizle — bileşenin kendi reset'i var */
    panel.querySelectorAll('.fclear').forEach(function(b){ b.style.display='none'; });

    /* =============== durum senkronu =============== */
    /* URL yalnız KULLANICI bir şey değiştirdikten sonra yazılır. Açılıştaki
       ilk senkronda yazsaydık ?bolge=ust-vucut gibi alias adresler kullanıcı
       hiçbir şey yapmadan kanonik biçime çevrilir, paylaşılan bağlantı bozulurdu. */
    var dirty = false;
    function selectedOf(f){
      return f.chips.filter(function(c){ return !isAll(c) && c.classList.contains('on'); });
    }
    function sync(){
      var totalSel = 0;
      chipsRow.innerHTML = '';
      var lbl = document.createElement('span');
      lbl.className = 'ff-chips-lbl';
      lbl.textContent = 'Seçili:';
      chipsRow.appendChild(lbl);

      facets.forEach(function(f){
        var sel = selectedOf(f);
        totalSel += sel.length;
        f.btn.classList.toggle('has-sel', sel.length>0);
        f.btn.querySelector('.ff-n').textContent = sel.length;
        sel.forEach(function(c){
          var chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'ff-chip';
          var name = txt(c);
          chip.innerHTML = '<span class="ff-chip-g">'+f.label+':</span> '+name+
                           '<span class="ff-x" aria-hidden="true"><i class="fa-solid fa-xmark"></i></span>';
          chip.setAttribute('aria-label', f.label+' — '+name+' filtresini kaldır');
          chip.addEventListener('click', function(){ c.click(); });
          chipsRow.appendChild(chip);
        });
      });

      /* çiplerin aria-selected'i durumla birlikte yürür.
         aria-pressed HER TURDA yeniden siliniyor: kurulumda bir kez silmek
         yetmiyordu — iki sayfanın kendi boyama fonksiyonu kabuktan SONRA
         çalışıp özniteliği geri koyuyor ve `role="option"` ile çakışıyordu
         (doğrulama ajanı 24 çipte ölçtü: fit-testleri 15, aktivite-gunlugu 9). */
      facets.forEach(function(f){
        f.chips.forEach(function(c){
          c.setAttribute('aria-selected', c.classList.contains('on') ? 'true':'false');
          if(c.hasAttribute('aria-pressed')) c.removeAttribute('aria-pressed');
        });
      });

      panel.classList.toggle('has-sel', totalSel>0);
      total.querySelector('b').textContent = totalSel;
      openBtn.querySelector('.ff-n').textContent = totalSel;
      var applyBtn = sheet.querySelector('.ff-sheet-apply');
      if(applyBtn) applyBtn.textContent = totalSel ? ('Sonuçları gör ('+totalSel+' filtre)') : 'Sonuçları gör';

      if(dirty) writeURL();
    }

    /* =============== TEK DURUM NESNESİ + URL =================
       Tek gerçek kaynak DOM'daki çip durumudur; state onun okunmuş hâli.
       İki motor (sayfa motoru + bu bileşen) aynı çipe bakar, ikinci bir
       kopya durum tutulmaz — kopyalar ayrışır. */
    function readState(){
      var st = {};
      facets.forEach(function(f){
        var v = selectedOf(f).map(function(c){ return c.getAttribute('data-val'); });
        if(v.length) st[f.key] = v;
      });
      return st;
    }
    /* eski/alias parametreler: yazarken düşürülür, yoksa kullanıcının
       kaldırdığı seçim yeniden yüklemede geri gelir (ör. ?bolge=ust-vucut
       egzersiz kütüphanesinde dört kas çipini açıyor) */
    var LEGACY = (panel.getAttribute('data-ff-legacy')||'').split(/[,\s]+/).filter(Boolean);

    function writeURL(){
      var st = readState();
      var q = new URLSearchParams(location.search);
      facets.forEach(function(f){ q.delete(f.key); });
      LEGACY.forEach(function(k){ q.delete(k); });
      Object.keys(st).forEach(function(k){ q.set(k, st[k].join(',')); });
      var qs = q.toString();
      history.replaceState(null, '', location.pathname + (qs? '?'+qs : '') + location.hash);
    }

    /* URL → DOM. Sayfa motorunun kendi derin bağlantı okuması BİTTİKTEN
       sonra çalışır (window load) ve YALNIZ FARKI tıklar; iki kez
       tetiklenip seçimi geri almaz. */
    function restoreFromURL(){
      var q = new URLSearchParams(location.search);
      facets.forEach(function(f){
        var raw = q.get(f.key);
        if(raw === null) return;
        var want = raw.split(',').filter(Boolean);
        f.chips.forEach(function(c){
          if(isAll(c)) return;
          var v = c.getAttribute('data-val');
          var on = c.classList.contains('on');
          if(want.indexOf(v) > -1 && !on) c.click();
          else if(want.indexOf(v) < 0 && on) c.click();
        });
      });
      sync();
    }

    /* çip tıklamaları sayfa motoruna ait; biz yalnız SONRASINDA durumu okuruz */
    facets.forEach(function(f){
      f.chips.forEach(function(c){ c.addEventListener('click', function(){ dirty = true; setTimeout(sync,0); }); });
      f.clearBtn.addEventListener('click', function(){
        dirty = true;
        if(f.allChip){ f.allChip.click(); }
        else { selectedOf(f).forEach(function(c){ c.click(); }); }
        setTimeout(sync,0);
      });

      /* ---- ARAMA (C3): yazdıkça süz, eşleşme yoksa boş durum ---- */
      if(f.input){
        var norm = function(t){ return (t||'').toLocaleLowerCase('tr').replace(/\s+/g,' ').trim(); };
        var xBtn = f.search.querySelector('.ff-search-x');
        var run = function(){
          var q = norm(f.input.value);
          var shown = 0;
          f.chips.forEach(function(c){
            /* "Tümü" aramada gizlenir: seçenek değil, sıfırlama kalemi */
            var hide = isAll(c) ? !!q : (q && norm(c.textContent).indexOf(q) < 0);
            c.hidden = !!hide;
            if(!hide && !isAll(c)) shown++;
          });
          if(f.empty) f.empty.hidden = !(q && shown === 0);
          if(xBtn) xBtn.hidden = !q;
        };
        f.input.addEventListener('input', run);
        f.input.addEventListener('keydown', function(e){
          if(e.key === 'Escape'){ e.stopPropagation(); if(f.input.value){ f.input.value=''; run(); } else closeFacets(null); return; }
          if(e.key === 'ArrowDown'){ e.preventDefault(); focusChip(f, 0); }
        });
        if(xBtn) xBtn.addEventListener('click', function(){ f.input.value=''; run(); f.input.focus(); });
        f.runSearch = run;
      }

      /* ---- KLAVYE: ok tuşlarıyla gezinme ----
         Dinleyici POPOVER'a değil FACET'e bağlı: odak henüz açma düğmesindeyken
         ArrowDown ile panele girilebilsin (arama alanı olmayan eksenlerde
         tek giriş yolu bu). */
      f.el.addEventListener('keydown', function(e){
        if(['ArrowDown','ArrowUp','Home','End'].indexOf(e.key) < 0) return;
        if(!f.el.classList.contains('open')){
          if(e.key !== 'ArrowDown') return;
          e.preventDefault();
          f.btn.click();                                   /* kapalıyken ArrowDown açar */
          return;
        }
        var vis = visibleChips(f);
        if(!vis.length) return;
        e.preventDefault();
        if(document.activeElement === f.btn || (f.input && document.activeElement === f.input)){
          if(e.key === 'ArrowDown'){ focusChip(f, 0); return; }
          if(e.key === 'End'){ focusChip(f, vis.length-1); return; }
          if(e.key === 'Home'){ focusChip(f, 0); return; }
          return;
        }
        var i = vis.indexOf(document.activeElement);
        if(i < 0){ focusChip(f, 0); return; }
        var j = e.key === 'ArrowDown' ? Math.min(i+1, vis.length-1)
              : e.key === 'ArrowUp'   ? (i<=0 ? -1 : i-1)
              : e.key === 'Home'      ? 0 : vis.length-1;
        if(j === -1){ (f.input || f.btn).focus(); return; }
        focusChip(f, j);
      });
    });

    function visibleChips(f){
      return f.chips.filter(function(c){ return !c.hidden && c.offsetParent !== null; });
    }
    function focusChip(f, i){
      var vis = visibleChips(f);
      if(vis[i]) vis[i].focus();
    }

    function resetAll(){
      dirty = true;
      if(pageClearEl){ pageClearEl.click(); }
      else{
        facets.forEach(function(f){
          if(f.allChip) f.allChip.click();
          else selectedOf(f).forEach(function(c){ c.click(); });
        });
      }
      setTimeout(sync,0);
    }
    reset.addEventListener('click', resetAll);
    sheet.querySelector('.ff-sheet-clear').addEventListener('click', resetAll);

    /* =============== popover aç/kapa (masaüstü) =============== */
    function closeFacets(except){
      facets.forEach(function(f){
        if(f===except) return;
        f.el.classList.remove('open');
        f.btn.setAttribute('aria-expanded','false');
        f.pop.style.maxHeight = '';
      });
    }

    /* ---- PANELİ GÖRÜNÜR ALANA KELEPÇELE (R6, 4. tur) ----
       Beyar: "Bazen bu drop yukarıda çıkıyor, arama kısmını aktif hale
       getiremiyorum. Olabildiğince aşağıdan çıkması lazım."

       ESKİ DAVRANIŞ: alt kenar taşınca `above > below` ise DOĞRUDAN yukarı
       çevriliyordu. Filtre çubuğu sayfanın ortasında olduğu için `above`
       çoğu zaman `below`dan büyük çıkıyor ve panel varsayılan olarak yukarı
       açılıyordu (ölçüldü: challenge-merkezi'nin üç ekseninde de yukarı).

       YENİ SIRA — üç kademe:
       1. AŞAĞI AÇ (varsayılan). Yer varsa hiçbir şey yapılmaz.
       2. Yer yoksa SAYFAYI KAYDIRARAK YER AÇ. Filtre çubuğu `sticky top:112`
          olduğu için sayfa aşağı kaydıkça çubuk yukarı gidip altında yer
          açılıyor. Kaydırma anlık (`behavior:auto`) — yumuşak kaydırmada
          ölçüm hareket hâlindeki kutuyu okur.
       3. O da yetmiyorsa YUKARI ÇEVİR (son çare) ya da yükseklikten kırp;
          hangisi daha çok yer veriyorsa. Yukarı açıldığında bile arama alanı
          panelin en üstünde ve yapışkan kaldığı için görünür ve odaklanabilir
          durumda kalır. */
    function placePop(f){
      var pop = f.pop;
      f.el.classList.remove('flip','up');
      pop.style.maxHeight = '';
      var vw = document.documentElement.clientWidth;
      var vh = window.innerHeight;
      var r  = pop.getBoundingClientRect();
      if(r.right > vw - 12) f.el.classList.add('flip');

      /* panelin doğal boyu — CSS tavanı (min(60vh,420px)) zaten uygulanmış */
      var need = Math.min(pop.scrollHeight, r.height || pop.scrollHeight);
      var br = f.btn.getBoundingClientRect();
      var below = vh - br.bottom - 18;

      /* 2. kademe — aşağıda yer yoksa sayfayı kaydırıp yer aç */
      if(below < need){
        var doc = document.documentElement;
        var room = Math.max(0, doc.scrollHeight - (window.scrollY + vh));
        var delta = Math.min(need - below, room);
        if(delta > 1){
          window.scrollTo({top: window.scrollY + delta, behavior: 'auto'});
          br = f.btn.getBoundingClientRect();
          below = vh - br.bottom - 18;
        }
      }

      var above = br.top - 18;
      if(below < need){
        /* 3. kademe — SON ÇARE.
           `above > below` yeterli ölçüt DEĞİL: filtre çubuğu sayfanın
           ortasındayken üstte hep daha çok yer olur ve panel varsayılan
           olarak yukarı açılırdı (ölçüldü: sayfa başındayken 23 eksenin
           11'i yukarı). Beyar'ın kuralı "olabildiğince aşağı".
           Bu yüzden aşağıda KULLANILABİLİR bir yer kaldığı sürece
           (MIN_DOWN) panel aşağı açılır ve yalnız BOYUNDAN kırpılır;
           panel kendi içinde kaydırılır, arama alanı yapışkan olduğu için
           tepede kalır. Yukarı çevirme yalnız aşağısı gerçekten
           kullanılamayacak kadar darsa devreye girer. */
        var MIN_DOWN = 200;   /* başlık 34 + arama 48 + ~3 seçenek + dolgu */
        if(below < MIN_DOWN && above > below){
          f.el.classList.add('up');
          pop.style.maxHeight = Math.floor(Math.min(above, need)) + 'px';
        } else {
          pop.style.maxHeight = Math.max(MIN_DOWN, Math.floor(below)) + 'px';
        }
      }
      /* odak panele: arama alanı varsa oraya, yoksa ilk seçeneğe (C3).
         GECİKMELİ: .ff-pop `visibility:hidden` + `transition:… visibility`
         ile açılıyor; görünmez öğede .focus() SESSİZCE NO-OP'tur (aynı tuzak
         KARARLAR.md K1'de modal katmanları için ölçülmüştü). Sınırlı kare
         yoklamasıyla gerçekten görünür olduğu karede odaklanıyoruz. */
      var target = f.input || visibleChips(f)[0];
      if(target) focusWhenVisible(target, f.el);
      if(f.input && f.runSearch) f.runSearch();
    }

    var MAX_FRAMES = 20;
    function reallyVisible(n){
      if(!n) return false;
      if(typeof n.checkVisibility === 'function') return n.checkVisibility({visibilityProperty:true});
      var cs = getComputedStyle(n);
      if(cs.visibility === 'hidden' || cs.display === 'none') return false;
      return n.offsetWidth > 0 || n.offsetHeight > 0;
    }
    function focusWhenVisible(node, holder, tries){
      tries = tries || 0;
      if(!document.contains(node)) return;
      if(!holder.classList.contains('open')) return;      /* bu arada kapandıysa bırak */
      if(holder.contains(document.activeElement) && document.activeElement !== holder) return;
      if(reallyVisible(node)){ node.focus(); return; }
      if(tries >= MAX_FRAMES) return;
      requestAnimationFrame(function(){ focusWhenVisible(node, holder, tries+1); });
    }
    facets.forEach(function(f){
      f.btn.addEventListener('click', function(e){
        e.stopPropagation();
        var willOpen = !f.el.classList.contains('open');
        closeFacets(f);
        f.el.classList.toggle('open', willOpen);
        f.btn.setAttribute('aria-expanded', willOpen?'true':'false');
        if(willOpen) placePop(f);
      });
    });
    document.addEventListener('click', function(e){
      if(!e.target.closest('.ff-facet')) closeFacets(null);
    });
    document.addEventListener('keydown', function(e){
      if(e.key!=='Escape') return;
      if(sheet.classList.contains('open')){ closeSheet(); return; }
      var open = facets.filter(function(f){ return f.el.classList.contains('open'); })[0];
      closeFacets(null);
      if(open) open.btn.focus();      /* odak kaybolmasın (§20 odak dönüşü) */
    });
    /* panelden Tab ile çıkıldığında panel kapansın — açık kalan panel
       arkadaki karta tıklamayı engelliyordu */
    panel.addEventListener('focusout', function(e){
      var open = facets.filter(function(f){ return f.el.classList.contains('open'); })[0];
      if(!open) return;
      setTimeout(function(){
        if(!open.el.contains(document.activeElement)){
          open.el.classList.remove('open');
          open.btn.setAttribute('aria-expanded','false');
        }
      }, 0);
    });
    /* Çubuk sticky: sayfa kayınca açma düğmesinin ekrandaki yeri değişir,
       panelin yön/kırpma hesabı bayatlar. Kaydırma ve yeniden boyutlandırmada
       yeniden yerleştir (yalnız açık panel için, rAF ile tek kare). */
    var placeQueued = false;
    function replaceOpen(){
      if(placeQueued) return;
      placeQueued = true;
      requestAnimationFrame(function(){
        placeQueued = false;
        facets.forEach(function(f){ if(f.el.classList.contains('open')) placePop(f); });
      });
    }
    window.addEventListener('resize', replaceOpen);
    window.addEventListener('scroll', replaceOpen, {passive:true});

    /* =============== mobil çekmece =============== */
    function openSheet(){
      if(sheet.classList.contains('open')) return;
      facets.forEach(function(f){ sheetBody.appendChild(f.el); f.el.classList.remove('open'); });
      sheet.classList.add('open'); sheetOv.classList.add('open');
      if(window.FIT_SHELL && FIT_SHELL.lockScroll) FIT_SHELL.lockScroll();
      if(window.__bnUpdate) window.__bnUpdate();
      var first = sheetBody.querySelector('.df-fchip');
      if(first) first.focus();
    }
    function closeSheet(){
      if(!sheet.classList.contains('open')) return;
      sheet.classList.remove('open'); sheetOv.classList.remove('open');
      if(window.FIT_SHELL && FIT_SHELL.unlockScroll) FIT_SHELL.unlockScroll();
      if(window.__bnUpdate) window.__bnUpdate();
      /* facet'leri bar'a geri al — masaüstüne dönüşte yerli yerinde olsun */
      facets.forEach(function(f){ bar.insertBefore(f.el, spacer); });
      openBtn.focus();
    }
    openBtn.addEventListener('click', openSheet);
    sheetOv.addEventListener('click', closeSheet);
    sheet.querySelector('.ff-sheet-close').addEventListener('click', closeSheet);
    sheet.querySelector('.ff-sheet-apply').addEventListener('click', closeSheet);
    function onMQ(){ if(!MQ.matches) closeSheet(); }
    if(MQ.addEventListener) MQ.addEventListener('change', onMQ);
    else if(MQ.addListener) MQ.addListener(onMQ);

    /* sayfa motoru derin bağlantıdan çip açmış olabilir → ilk senkron */
    sync();
    /* sayfa scriptleri bu dosyadan SONRA çalışır; bir tur daha oku */
    setTimeout(sync, 0);
    /* URL'den geri yükleme load'da: sayfa motorunun kendi derin bağlantı
       okuması bitmiş olur, biz yalnız farkı tıklarız (idempotent) */
    window.addEventListener('load', function(){ restoreFromURL(); });
  }

  panels.forEach(build);

  /* =================================================================
     R16/1 · VERİDEN DOĞAN PANELLER İÇİN AÇIK UÇ — `FIT_SHELL.filtreKur()`
     -----------------------------------------------------------------
     ÖLÇÜLEN KUSUR: bu bileşen `document.querySelectorAll('[data-ff]')`i
     BİR KEZ, betik yüklenirken okuyor. Çipleri sabit HTML'de duran
     sayfalar (egzersiz-kutuphane · program-liste) bundan yararlanıyor;
     ama süzgecini KENDİ VERİSİNDEN üreten bir sayfa (challenge-merkezi,
     çipleri `FIT_CHALLENGE.KATALOG`tan basıyor) bu tarama bittikten
     sonra doluyor ve bileşen onu hiç görmüyordu. Sonuç: aynı `.fgroup`
     sözleşmesini yazan iki sayfadan biri açılır menü alıyor, öteki çıplak
     çip yığını olarak kalıyordu — kabuk kiti ikiye ayrılmıştı.
     Çözüm bir kural değişikliği değil, eksik olan uç: panelini sonradan
     dolduran sayfa doldurunca haber verir. Bileşenin davranışı aynı;
     yalnız "ne zaman kurulacağı" çağırana açıldı.
     ================================================================= */
  if(window.FIT_SHELL){
    window.FIT_SHELL.filtreKur = function(panel){
      if(typeof panel === 'string') panel = document.querySelector(panel);
      if(!panel) return false;
      build(panel);
      return panel.getAttribute('data-ff-kuruldu') === '1';
    };
  }
})();



/* =====================================================================
 TEK SATIR ETİKET RAYI — [data-tagrow]  (ORTAK YARDIMCI · TEK KAYNAK)
 ---------------------------------------------------------------------
 Sözleşme: <div class="… " data-tagrow><span>…</span><span>…</span></div>
 · Kutuya sığmayan etiketler GİZLENİR (display:none), sona "+N" rozeti gelir.
 · N = gizlenen etiket sayısına BİREBİR eşittir (uydurma sayı yok).
 · Rozet tıklanabilir DEĞİL: <span aria-hidden="true">, tabindex yok,
   pointer-events:none (CSS). Kart bağlantısının içinde durduğu için
   tıklanabilir olsaydı ikinci bir hedef üretirdi.
 · Genişlik değişince yeniden hesaplanır (ResizeObserver varsa o, yoksa resize).
 Ölçüm sözleşmesi: hesap bittiğinde scrollWidth <= clientWidth ve
 scrollHeight == tek satır yüksekliği olur.
 ===================================================================== */
(function(){
  var rows = document.querySelectorAll('[data-tagrow]');
  if(!rows.length) return;

  function layout(row){
    /* 1 · her şeyi geri aç, rozeti kaldır → temiz ölçüm zemini */
    var more = row.querySelector('.tagrow-more');
    if(more) more.remove();
    var items = Array.prototype.filter.call(row.children, function(c){
      return !c.classList.contains('tagrow-more');
    });
    items.forEach(function(c){ c.style.display=''; });
    if(!items.length) return;

    var avail = row.clientWidth;
    if(!avail) return;

    /* gap'i CSS'ten oku — sabit sayı gömmek kart genişliği değişince tutmuyor */
    var cs  = getComputedStyle(row);
    var gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;

    /* 2 · sığanları say */
    var used = 0, fit = 0, i;
    for(i=0;i<items.length;i++){
      var w = items[i].getBoundingClientRect().width;
      var next = used + (fit? gap:0) + w;
      if(next > avail + .5) break;
      used = next; fit++;
    }
    if(fit === items.length) return;           /* hepsi sığdı → rozet yok */

    /* 3 · rozet için yer aç: rozeti bas, sığmayana kadar geri çekil */
    var badge = document.createElement('span');
    badge.className = 'tagrow-more';
    badge.setAttribute('aria-hidden','true');
    row.appendChild(badge);

    while(fit > 0){
      badge.textContent = '+' + (items.length - fit);
      for(i=0;i<items.length;i++) items[i].style.display = (i<fit? '' : 'none');
      if(row.scrollWidth <= row.clientWidth + .5) break;
      fit--;
    }
    if(fit === 0){                              /* tek etiket bile sığmadı */
      badge.textContent = '+' + items.length;
      items.forEach(function(c){ c.style.display='none'; });
    }
    /* ekran okuyucu için gerçek metin kart bağlantısının aria-label'ında değil,
       gizlenen etiketlerde kalıyor; rozet yalnız görsel özet olduğu için
       aria-hidden — bilgi kaybı yok, tekrar yok. */
  }

  function all(){ Array.prototype.forEach.call(rows, layout); }

  all();
  /* yazı tipi geç yüklenirse genişlikler değişir → bir tur daha */
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(all);
  window.addEventListener('load', all);

  if(window.ResizeObserver){
    var ro = new ResizeObserver(function(ents){
      ents.forEach(function(e){ layout(e.target); });
    });
    Array.prototype.forEach.call(rows, function(r){ ro.observe(r); });
  } else {
    var t=null;
    window.addEventListener('resize', function(){ clearTimeout(t); t=setTimeout(all,120); });
  }
})();



/* =====================================================================
 SEKME BİLEŞENİ — [data-fit-tabs]  (ORTAK · TEK KAYNAK · CSS eşi .fit-tabs)
 ---------------------------------------------------------------------
 Sözleşme:
 <div class="fit-tabs" data-fit-tabs="<ad>" aria-label="…">
   <button class="fit-tab" data-tab="hakkinda">Hakkında</button>
   <button class="fit-tab" data-tab="yorumlar">Yorumlar</button>
 </div>
 …
 <div class="fit-pane" data-pane="hakkinda">…</div>
 <div class="fit-pane" data-pane="yorumlar" hidden>…</div>

 · role=tablist / role=tab / role=tabpanel, aria-selected, aria-controls
   ve roving tabindex BURADA kurulur — sayfa markup'ında tekrarlanmaz.
 · Klavye: ← → ile komşu sekme, Home/End ile uç sekme, seçilen odaklanır.
   Tab tuşu sekme şeridinden ÇIKAR (roving tabindex: yalnız aktif olan 0).
 · SAYFA ZIPLAMASI YOK: bileşen scrollTo/scrollIntoView ÇAĞIRMAZ.
   (Eski antrenör detay sekmesi geçişte window.scrollTo yapıyordu; ölçüm
   sözleşmesi "içerik kapsayıcısının boundingBox.top değişmiyor" diyor.)
 · <a href> kipinde JS hiç devreye girmez: sekmeler sayfa geçişidir,
   aktif olan markup'ta aria-selected="true" taşır.
 ===================================================================== */
(function(){
  var bars = document.querySelectorAll('[data-fit-tabs]');
  if(!bars.length) return;

  bars.forEach(function(bar){
    var tabs = Array.prototype.slice.call(bar.querySelectorAll('.fit-tab'));
    if(!tabs.length) return;

    /* ---- sayfa geçişi kipi: <a> sekmeler ---- */
    var linkMode = tabs.every(function(t){ return t.tagName === 'A'; });
    bar.setAttribute('role', linkMode ? 'navigation' : 'tablist');
    if(linkMode){
      tabs.forEach(function(t){
        var on = t.getAttribute('aria-selected') === 'true';
        if(on) t.setAttribute('aria-current','page');
      });
      return;
    }

    /* ---- panel kipi ---- */
    var name  = bar.getAttribute('data-fit-tabs') || 'ft';
    var scope = bar.closest('[data-fit-tabs-scope]') || document;
    var panes = Array.prototype.slice.call(scope.querySelectorAll('.fit-pane[data-pane]'));

    tabs.forEach(function(t, i){
      var key = t.getAttribute('data-tab');
      var pane = panes.filter(function(p){ return p.getAttribute('data-pane') === key; })[0];
      t.setAttribute('role','tab');
      t.id = t.id || (name + '-tab-' + key);
      if(pane){
        pane.id = pane.id || (name + '-pane-' + key);
        pane.setAttribute('role','tabpanel');
        pane.setAttribute('aria-labelledby', t.id);
        t.setAttribute('aria-controls', pane.id);
      }
      /* açılış durumu: markup'ta aria-selected ya da .active varsa o, yoksa ilki */
      var on = t.getAttribute('aria-selected') === 'true' || t.classList.contains('active');
      if(!tabs.some(function(x){ return x.getAttribute('aria-selected')==='true' || x.classList.contains('active'); })) on = (i===0);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.setAttribute('tabindex', on ? '0' : '-1');
      t.classList.toggle('active', on);
      if(pane){
        pane.hidden = !on;
        /* R8 · WAI-ARIA APG: SEÇİLİ PANEL TAB SIRASINA GİRER.
           Kusur (AJAN-G ölçtü, antrenor-detay-v1 "Hakkında" paneli):
           panelin içinde odaklanabilir öğe yoksa Tab paneli tamamen
           atlıyor, klavye kullanıcısı içeriğe hiç uğramadan alttaki
           CTA'ya düşüyordu. APG "Tabs" deseni tam bu durum için
           tabpanel'e tabindex="0" veriyor. Seçili olmayan panel zaten
           `hidden`, odak sırasına girmez. */
        pane.setAttribute('tabindex', on ? '0' : '-1');
      }
    });

    function select(tab, focus){
      tabs.forEach(function(t){
        var on = (t === tab);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
        t.classList.toggle('active', on);
        var key = t.getAttribute('data-tab');
        panes.forEach(function(p){
          if(p.getAttribute('data-pane') !== key) return;
          p.hidden = !on;
          p.setAttribute('tabindex', on ? '0' : '-1');   /* APG — bkz. açılış bloğu */
        });
      });
      if(focus) tab.focus();
      /* mobilde seçilen sekme şeridin dışındaysa YALNIZ şeridi kaydır —
         sayfa scroll'una dokunulmaz (dikey zıplama olmaz) */
      if(bar.scrollWidth > bar.clientWidth){
        var br = bar.getBoundingClientRect(), tr = tab.getBoundingClientRect();
        if(tr.left < br.left)       bar.scrollLeft += (tr.left - br.left) - 8;
        else if(tr.right > br.right) bar.scrollLeft += (tr.right - br.right) + 8;
      }
      if(window.__bnUpdate) window.__bnUpdate();
      /* R15/2 · MODÜL SAYFASINDA adres sekmeyi taşır: sekme değişince URL de
         değişir, paylaşılan bağlantı doğru sekmeyi açar. `replaceState` —
         geçmişe yığın bırakmaz, geri tuşu sekmeler arasında hapsolmaz. */
      if(document.querySelector('.modul-govde')){
        try{ history.replaceState(null,'','#'+tab.getAttribute('data-tab')); }catch(e){}
      }
      bar.dispatchEvent(new CustomEvent('fit:tabchange',{bubbles:true,detail:{key:tab.getAttribute('data-tab')}}));
    }

    tabs.forEach(function(t){
      t.addEventListener('click', function(){ select(t, false); });
    });

    bar.addEventListener('keydown', function(e){
      var i = tabs.indexOf(document.activeElement);
      if(i < 0) return;
      var j = null;
      if(e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i+1) % tabs.length;
      else if(e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i-1+tabs.length) % tabs.length;
      else if(e.key === 'Home') j = 0;
      else if(e.key === 'End')  j = tabs.length-1;
      else return;
      e.preventDefault();
      select(tabs[j], true);
    });
  });
})();


/* =====================================================================
   BANNER → GÖVDE DİKİŞİ  (Beyar · Revize 1)
   ---------------------------------------------------------------------
   Banner'dan sonraki İLK opak, tam-en, yapışkan-olmayan, görünür banda
   `.fit-seam` basar; o bant banner'ın dibine KOMŞUysa `.is-onbanner` da
   ekler (22px binme). Biçimin tamamı CSS'te
   (fit-shell.css → "BANNER → GÖVDE DİKİŞİ").

   Neden JS: 66 sayfada gövdenin sınıf adı 30'dan fazla çeşit; ayrıca
   #fitPlanTop gibi bloklar ÇALIŞMA ANINDA banner+ray üretiyor, yani doğru
   kardeş ancak enjeksiyon bittikten sonra bilinebiliyor. Bu blok bilerek
   plan kabuğu enjeksiyonundan SONRA duruyor.

   ELEME ÖLÇÜTLERİ ve gerekçeleri:
   · getClientRects().length===0 → gizli blok. DENETIM.md §2: görünürlük
     `getClientRects()` ile ölçülür, offsetParent'a güvenilmez.
   · position sticky/fixed → sekme rayı (.pf-tabbar z-index:40 · .fs-tabbar ·
     .chl-tabbar) ve modal perdeleri; bunlar gövde değil.
   · saydam zemin → .wrap.fit-band-panel · .wrap.fp-gate · .chl-pane
   · TAM-EN ŞARTI: dikiş sayfayı boydan boya kesen bir BAND'dır. Bu şart
     `.wrap`ları (max-width 1176) eler. Şartsız iniş yapsaydık
     dadafit-hub / dadafit-kopru / antrenor-ol sayfalarında
     `.fit-band-panel > *` (koyu #1e1b14 yüzen kart, kendi radius'u var)
     dikiş sanılır ve üst köşeleri bozulurdu.

   İNİŞ (descend): saydam ama TAM-EN bir sarmalayıcıya rastlarsak içine
   iner, aynı ölçütleri çocuklarına uygularız. challenge-v1 böyle:
   gövde `.chl-track` main'in torunu, `.chl-pane` (saydam, tam-en) içinde.
   ===================================================================== */
(function(){
  var BAN = '.lib-top,.cp-top,.kp-top,.ol-top,.ed-top,.fs-top,'+
            '.pd-hero,.chl-hero,.df-top,.au-top';
  var main = document.querySelector('main.page-main');
  if(!main) return;

  var kids = Array.prototype.slice.call(main.children);
  var bi = -1;
  for(var i=0;i<kids.length;i++){
    if(kids[i].matches && kids[i].matches(BAN)){ bi = i; break; }
  }
  if(bi < 0) return;                    /* koyu banner yok (ör. profil-v1) */

  /* tam-en = sayfa genişliğinin en az %94'ünü kaplayan band */
  var esik = main.clientWidth * 0.94;
  function tamEn(el){ return el.getBoundingClientRect().width >= esik; }

  var komsu = true;                     /* hâlâ banner'ın dibinde miyiz? */
  var kuyruk = kids.slice(bi+1);
  var basildi = false;

  while(kuyruk.length && !basildi){
    var el = kuyruk.shift();

    /* R11/M22 · SIFIR ALANLI BLOK KOMŞULUĞU KESMEZ.
       `getClientRects().length` 0×0 bir eleman için 1 dönebiliyor; bu
       yüzden ekranda HİÇ YER KAPLAMAYAN bloklar "araya giren blok" sayılıp
       `is-onbanner`ı düşürüyordu. Ölçülen kusur: dadafit-hub'da hero ile
       beyaz gövde arasında `.wrap.fit-band-panel` var ama BOŞ (kabuk
       `.fit-band-panel:empty{display:none}` diyor) — 0×0. Gövde dikişi
       alıyordu ama binme almıyordu, köşe beyaz üstünde beyaz kalıyordu.
       Alanı olmayan blok görünmez sayılır ve komşuluğu bozmaz. */
    var kutu = el.getBoundingClientRect();
    if(el.getClientRects().length === 0 || kutu.width < 1 || kutu.height < 1) continue;

    var cs = getComputedStyle(el);
    if(cs.position === 'sticky' || cs.position === 'fixed'){ komsu = false; continue; }
    if(!tamEn(el)){ komsu = false; continue; }

    var bg = cs.backgroundColor;
    var saydam = !bg || bg === 'transparent' ||
                 /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)$/.test(bg);

    if(saydam){
      /* saydam ama tam-en → içine in, sırayı bozmadan başa ekle */
      kuyruk = Array.prototype.slice.call(el.children).concat(kuyruk);
      komsu = false;
      continue;
    }

    el.classList.add('fit-seam');
    if(komsu) el.classList.add('is-onbanner');
    basildi = true;
  }
})();


/* =====================================================================
   PARALLAX BAND  (Beyar · Revize 11 · M2)
   ---------------------------------------------------------------------
   `data-fit-px` taşıyan banda kardeş markanın sabit-görsel düzeneğini
   kurar (biçim: fit-shell.css → "PARALLAX BAND").

   Band iki özel değer bildirir, JS onları okur:
     --px-img   → sabit duracak GÖRSEL   (zorunlu; yoksa band atlanır)
     --px-veil  → görselin üstündeki perde (isteğe bağlı; genelde gradient)
   Ayrıca --px-x / --px-y ile görselin odak noktası verilebilir.

   `--px-shift` scroll'da GÜNCELLENMEZ. Görsel zaten `position:fixed`;
   parallax'ı yaratan şey bandın onun üstünden kaymasıdır. Shift yalnız
   "bu band ekranın ortasındayken görselin hangi kısmı görünsün" sorusunu
   çözer, o yüzden resize/load yeter — scroll dinleyicisi yok, bedava.
   ===================================================================== */
(function(){
  var bantlar = [];

  function guncelle(b){
    var cs = getComputedStyle(b.band);
    /* köşe yarıçapı banddan alınır: dikişli bir banda da uygulanabilsin */
    b.clip.style.setProperty('--px-r',
      (cs.borderRadius && cs.borderRadius !== '0px') ? cs.borderRadius : '0px');

    var r      = b.band.getBoundingClientRect();
    var vh     = window.innerHeight;
    var merkez = r.top + window.scrollY + r.height / 2;
    var enCok  = Math.max(0, document.documentElement.scrollHeight - vh);
    var hedef  = Math.min(Math.max(merkez - vh / 2, 0), enCok);
    b.clip.style.setProperty('--px-shift', (merkez - hedef - vh / 2).toFixed(1) + 'px');
  }

  var hedefler = document.querySelectorAll('[data-fit-px]');
  for(var i = 0; i < hedefler.length; i++){
    var band = hedefler[i];
    var cs   = getComputedStyle(band);
    var img  = (cs.getPropertyValue('--px-img') || '').trim();
    if(!img || img === 'none') continue;          /* görsel yoksa dokunma */

    if(cs.position === 'static') band.style.position = 'relative';

    var clip  = document.createElement('div');
    clip.className = 'px-clip';
    clip.setAttribute('aria-hidden','true');

    var media = document.createElement('div');
    media.className = 'px-media';
    media.style.backgroundImage = img;
    clip.appendChild(media);

    var perde = (cs.getPropertyValue('--px-veil') || '').trim();
    if(perde && perde !== 'none'){
      var veil = document.createElement('div');
      veil.className = 'px-veil';
      veil.style.backgroundImage = perde;
      clip.appendChild(veil);
    }

    var ox = (cs.getPropertyValue('--px-x') || '').trim();
    var oy = (cs.getPropertyValue('--px-y') || '').trim();
    if(ox) clip.style.setProperty('--px-x', ox);
    if(oy) clip.style.setProperty('--px-y', oy);

    band.classList.add('px-band');
    band.insertBefore(clip, band.firstChild);
    bantlar.push({ band: band, clip: clip });
  }

  if(!bantlar.length) return;

  function hepsi(){ for(var k = 0; k < bantlar.length; k++) guncelle(bantlar[k]); }
  hepsi();
  window.addEventListener('resize', hepsi);
  window.addEventListener('load', hepsi);
})();


/* =====================================================================
   SAYFALAMA MOTORU  (Beyar · Revize 11 · M6)
   ---------------------------------------------------------------------
   Biçim fit-shell.css → "SAYFALAMA". Bu blok yalnız davranışı kurar.

   Kullanım (sayfa tarafından çağrılır):
     var pagi = FIT_PAGI({
       kap:     document.getElementById('libPagi'),   // <nav> kabı
       sayfaBoy:12,
       birim:   'hareket',                            // özet satırındaki ad
       liste:   function(){ return gorunurKartlar },  // O ANKİ süzülmüş dizi
       ciz:     function(gosterilecek, hepsi){ ... }  // sayfayı ekrana bas
     });
     pagi.yenile();     // filtre değişince — 1. sayfaya döner
     pagi.git(3);       // belirli sayfaya

   Neden kabukta: Beyar "liste sayfalarında" dedi, tek sayfa değil.
   Tek kaynak olmazsa her liste kendi sayfalamasını yazar ve ilk/son
   atlama bir yerde unutulur.

   Kalemler:  «  ‹  1 2 3 … N  ›  »
   · ilk/son sayfaya atla  → DadaHaber referansı
   · önceki/sonraki        → Gastro referansı
   · pencere: aktif sayfanın iki yanı; arada boşluk kalırsa "…"
   ===================================================================== */
window.FIT_PAGI = function(cfg){
  var kap = cfg.kap;
  if(!kap) return { yenile:function(){}, git:function(){}, ciz:function(){} };
  var boy   = cfg.sayfaBoy || 12;
  var birim = cfg.birim || 'kayıt';
  var sayfa = 1;

  function toplamSayfa(n){ return Math.max(1, Math.ceil(n / boy)); }

  /* gösterilecek sayfa numaraları — aktifin iki yanı + ilk + son */
  function pencere(aktif, son){
    var set = {}, ekle = function(n){ if(n >= 1 && n <= son) set[n] = 1; };
    ekle(1); ekle(son);
    for(var d = -1; d <= 1; d++) ekle(aktif + d);
    var liste = Object.keys(set).map(Number).sort(function(a,b){ return a - b; });
    var cikti = [];
    for(var i = 0; i < liste.length; i++){
      if(i && liste[i] - liste[i-1] > 1) cikti.push('...');
      cikti.push(liste[i]);
    }
    return cikti;
  }

  function dugme(ic, opt){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pg' + (opt.cls ? ' ' + opt.cls : '');
    b.innerHTML = ic;
    if(opt.label) b.setAttribute('aria-label', opt.label);
    if(opt.aktif){ b.classList.add('active'); b.setAttribute('aria-current','page'); }
    if(opt.kapali) b.disabled = true;
    else if(opt.git) b.addEventListener('click', function(){ git(opt.git); });
    return b;
  }

  function ciz(){
    var hepsi = cfg.liste() || [];
    var son   = toplamSayfa(hepsi.length);
    if(sayfa > son) sayfa = son;

    var bas = (sayfa - 1) * boy;
    cfg.ciz(hepsi.slice(bas, bas + boy), hepsi);

    kap.innerHTML = '';
    /* tek sayfalık sonuçta ray gösterilmez — ama özet satırı KALIR
       (Beyar: "bu pagination'un altında bir ufak boşluk ve yazı olacak") */
    if(son > 1){
      kap.appendChild(dugme('<i class="fa-solid fa-angles-left" aria-hidden="true"></i>',
        { cls:'arrow', label:'İlk sayfa',    kapali: sayfa === 1,   git:1 }));
      kap.appendChild(dugme('<i class="fa-solid fa-chevron-left" aria-hidden="true"></i>',
        { cls:'arrow', label:'Önceki sayfa', kapali: sayfa === 1,   git: sayfa - 1 }));

      pencere(sayfa, son).forEach(function(n){
        if(n === '...'){
          var d = document.createElement('span');
          d.className = 'pg-dots'; d.textContent = '…'; d.setAttribute('aria-hidden','true');
          kap.appendChild(d); return;
        }
        kap.appendChild(dugme(String(n), { aktif: n === sayfa, git: n, label: n + '. sayfa' }));
      });

      kap.appendChild(dugme('<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>',
        { cls:'arrow', label:'Sonraki sayfa', kapali: sayfa === son, git: sayfa + 1 }));
      kap.appendChild(dugme('<i class="fa-solid fa-angles-right" aria-hidden="true"></i>',
        { cls:'arrow', label:'Son sayfa',     kapali: sayfa === son, git: son }));
    }

    var not = document.createElement('span');
    not.className = 'pagi-note';
    not.setAttribute('aria-live','polite');
    if(hepsi.length === 0){
      not.textContent = 'Sonuç yok';
    } else {
      var ilk = bas + 1, sonKayit = Math.min(bas + boy, hepsi.length);
      not.textContent = hepsi.length + ' ' + birim +
        (son > 1 ? ' · ' + ilk + '–' + sonKayit + ' gösteriliyor · sayfa ' + sayfa + ' / ' + son : '');
    }
    kap.appendChild(not);
  }

  function git(n){
    var son = toplamSayfa((cfg.liste() || []).length);
    sayfa = Math.min(Math.max(1, n), son);
    ciz();
    /* sayfa değişince listenin başına dön — kullanıcı ortada kalmasın */
    if(cfg.ust){
      var y = cfg.ust.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }

  return { yenile: function(){ sayfa = 1; ciz(); }, git: git, ciz: ciz };
};


/* =====================================================================
   GÖRÜŞ BİLDİR ŞERİDİNİ BANNER MERKEZİNE HİZALA  (Beyar · R11/M19)
   ---------------------------------------------------------------------
   Beyar: "Görüş Bildir butonu her tarafta yukarı çekilecek, banner'ın
   merkezinin hizasında olacak."

   Öncesi CSS'te `top:50%` — VIEWPORT'un ortası. Banner yüksekliği sayfaya
   göre değişiyor (544 @1440 liste · 560 detay · 607 @1024 · 726 @390) ve
   pencere boyu da değişken; ikisi hiçbir zaman aynı yere denk gelmiyordu.
   Burada banner'ın dikey merkezi ölçülüp `--fb-top` yazılıyor.
   Şerit `position:fixed` kalıyor — kullanıcı kaydırırken yer değiştirmesi
   istenmiyor, bu yüzden ölçü scroll'da yenilenmiyor (yalnız resize/load).
   Banner taşımayan sayfada değer YAZILMAZ, CSS'teki `50%` yedeği kalır.
   ===================================================================== */
(function(){
  /* 🔴 KARAR ÜZERİNE YAZILDI — Beyar, 2026-08-29 (§W2: eski karar silinmez).
     Önceki karar: "şerit banner'ın merkezinin hizasında olacak" — bu yüzden
     burada banner ölçülüp `--fb-top` yazılıyordu. Ölçülen sonuç: konum
     sayfa tipine göre AYRIŞIYORDU çünkü banner yükseklikleri ayrı —
     liste/kurumsal 272 · detay 280 · modül/hesap 323 · ana sayfa 511
     (hero 100dvh olduğu için en aşağıda kalıyordu).

     Yeni karar: HEPSİ AYNI KONUMDA. Taban liste ve detaydaki hâldir;
     272px alındı — dokuz ölçülen sayfanın dördü (liste ×2, kurumsal ×2)
     zaten oradaydı.

     Emsal ölçüldü (canlı, 2026-08-29): dadagastro.com ana sayfa · /tarifler ·
     /hakkimizda — ÜÇÜNDE DE `top:420px`, tek sabit değer, banner'dan
     türetilmiyor. Yani kardeş marka da tek konum kullanıyor; ayrışan Fit'ti.
     Sayı Gastro'nunkiyle aynı DEĞİL, çünkü Beyar tabanı Fit'in kendi
     liste/detay hâli olarak verdi.

     Ölçüm scroll'da yenilenmez (şerit `position:fixed`); yalnız pencere
     boyu değişince taşma koruyucusu yeniden koşar. */
  var TABAN = 272;
  function hizala(){
    /* pencereden taşarsa kırp — yoksa şerit görünmeyen yükseklikte kalır */
    var enCok = Math.max(140, window.innerHeight - 140);
    document.documentElement.style.setProperty('--fb-top',
      Math.min(Math.max(TABAN, 140), enCok).toFixed(0) + 'px');
  }
  hizala();
  window.addEventListener('resize', hizala);
  window.addEventListener('load', hizala);
})();

})();
