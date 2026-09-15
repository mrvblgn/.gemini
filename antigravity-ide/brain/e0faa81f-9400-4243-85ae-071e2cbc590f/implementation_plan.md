# Model-Viewer 3D Ürün ve AR Demosu Uygulama Planı

Bu plan, Mac ortamında tamamen bağımsız çalışan, Google `<model-viewer>` kütüphanesi ile hazırlanmış 360 derece 3D ürün inceleme ve Artırılmış Gerçeklik (AR) web demosu oluşturmayı amaçlamaktadır.

## User Review Required

> [!IMPORTANT]
> - Canlı PHP sitesine ve mevcut proje dosyalarına **kesinlikle dokunulmayacak**, tüm geliştirme `/Users/mervebilgin/.gemini/antigravity-ide/scratch/model-viewer-demo/` klasörü içinde yapılacaktır.
> - `.max` dosyaları doğrudan tarayıcıda çalışmadığı için örnek olarak güvenilir bir GLB model URL'si kullanılacak ve `models/product.glb` dosyanız hazır olduğunda kolayca değiştirilebilecek yorum satırı eklenecektir.

## Proposed Changes

### Proje Dizini Yapısı

`model-viewer-demo/` altında aşağıdaki klasör ve dosyalar oluşturulacaktır:

```text
model-viewer-demo/
├── index.html
├── css/style.css
├── js/app.js
├── models/
├── images/
└── README.md
```

---

### [Component Name] Model-Viewer Web Demo

#### [NEW] [index.html](file:///Users/mervebilgin/.gemini/antigravity-ide/scratch/model-viewer-demo/index.html)
- Google `<model-viewer>` resmi ES module CDN bağlantısı (`https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js`).
- `camera-controls`, `touch-action="pan-y"`, `shadow-intensity="1"`, `exposure="1"`, `alt`, `loading="lazy"`, `auto-rotate`, `ar`, `ar-modes="webxr scene-viewer quick-look"`, `ar-scale="fixed"`, `ar-placement="floor"`.
- Kolayca bulunabilir Türkçe yorum satırı:
  `<!-- Kendi modelin hazır olduğunda src değerini models/product.glb olarak değiştir. -->`
- Özel Türkçe AR Butonu (`Banyonuzda Gör`).
- İki adet örnek Hotspot / Annotation ("Seramik lavabo" ve "Frenli çekmece") - Koordinatların örnek olduğu belirten Türkçe yorum ile.
- Türkçe Yüklenme göstergesi (`slot="progress-bar"` ve özel stil).
- Türkçe Hata Mesajı alanı (`slot="error"` ve JS hata yakalama).
- AR desteklenmeyen cihazlar için bilgilendirme mesajı.
- Sayfa altı küçük Test Paneli (Model dosya adı, yüklenme durumu, AR desteği göstergesi).

#### [NEW] [style.css](file:///Users/mervebilgin/.gemini/antigravity-ide/scratch/model-viewer-demo/css/style.css)
- Modern, şık ve responsive tasarım (Google Fonts Inter/Outfit typography, cam efekti (glassmorphism), nötr gölge ve ışık alanları).
- Hotspot pin ve kartlarının (popover) responsive CSS animasyonları.
- Özel AR butonunun şık konumlandırması ve hover/active durumları.
- Yükleme barı (progress bar) ve hata mesajı stilleri.
- Alt test panelinin responsive stili.

#### [NEW] [app.js](file:///Users/mervebilgin/.gemini/antigravity-ide/scratch/model-viewer-demo/js/app.js)
- Yüklenme sürecini takip edip yüzdeyi Türkçe göstergeye aktarma (`progress` olayı).
- Etkileşim gerçekleştiğinde otomatik dönüşün durması/yönetilmesi.
- Hata durumunda Türkçe hata toast/banner mekanizması.
- AR desteği kontrolü (`model-viewer.canActivateAR`) ve desteklenmeyen cihazlar için Türkçe bilgilendirme.
- Alt test panelinin dinamik güncellenmesi (Dosya adı, durum, AR desteği).

#### [NEW] [README.md](file:///Users/mervebilgin/.gemini/antigravity-ide/scratch/model-viewer-demo/README.md)
- Mac Terminal çalıştırma komutları:
  ```bash
  cd model-viewer-demo
  python3 -m http.server 8000
  ```
  Tarayıcı erişimi: `http://localhost:8000`
- `.max` dosyasının tarayıcıda çalışmama nedeni ve GLB dönüşüm gereksinimi açıklaması.
- iOS cihazlar için USDZ formatı bilgisi.
- Kendi GLB dosyasını `models/product.glb` dizinine ekleme ve `index.html` içinde model yolunu değiştirme rehberi.
- model-viewer Editor (`https://modelviewer.dev/editor/`) kullanarak hotspot (annotation) koordinatı tespiti anlatımı.
- Masaüstü 3D testi ile mobil WebXR/AR HTTPS gereksinimleri farkı.
- Localhost demosunun mevcut PHP canlı sitesine henüz bağlı olmadığı uyarısı.

---

## Verification Plan

### Automated / Browser Verification
- Mac üzerinde `python3 -m http.server 8000` yerel sunucusu başlatılacak.
- Browser subagent ile `http://localhost:8000` adresine gidilecek.
- 3D modelin yüklendiği, döndürülebildiği, hotspot'ların görüntülendiği, Türkçe yüklenme ve alt test panelinin sorunsuz çalıştığı doğrulanacak.
- Tarayıcı konsolu (console) kontrol edilip herhangi bir hata veya uyarı kalmadığı doğrulanacak.

### Manual Verification
- Test panelindeki durum bilgilerinin (Model adı, Yükleme %, AR Desteği) doğru güncellendiği teyit edilecek.
