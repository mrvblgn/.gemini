# 3D Ürün & AR Görselleştirici Demosu (`model-viewer-demo`)

Bu proje, Google `<model-viewer>` v4.1.0 kütüphanesi kullanılarak hazırlanmış, bağımsız çalışan responsive bir 3D ürün ve Artırılmış Gerçeklik (AR) web demosudur.

---

## 🚀 Mac Üzerinde Çalıştırma Talimatları

Projeyi tarayıcıda çalıştırmak için doğrudan `file://` ile açmak yerine yerel bir HTTP sunucusu kullanılmalıdır.

1. **Terminal** uygulamasını açın.
2. Proje dizinine geçin:
   ```bash
   cd model-viewer-demo
   ```
3. Python 3 ile yerel sunucuyu başlatın:
   ```bash
   python3 -m http.server 8000
   ```
4. Tarayıcınızda şu adrese gidin:
   ```text
   http://localhost:8000
   ```

---

## 📐 3D Model Formatları ve Dönüştürme Rehberi

### 1. `.max` Dosyası Neden Doğrudan Kullanılamaz?
- `.max` dosyaları **Autodesk 3ds Max** yazılımının özel çalışma (proje) formatıdır.
- Tarayıcılar `.max` dosyalarını okuyamaz ve 3D sahne olarak render edemez.
- 3ds Max macOS üzerinde çalışmadığı ve Blender `.max` dosyalarını doğrudan açamadığı için, 3ds Max olan bir bilgisayardan veya model sağlayıcınızdan modeli **GLB (`.glb`)** formatında ihraç (export) etmesini istemeniz gerekir.

### 2. Gerekli Web Formatı: `.glb`
- Web standartlarında 3D modeller için **GLB** (`.glb` - Binary glTF) formatı kullanılır. Tüm kaplamaları (textures), malzemeleri (materials) ve geometriyi tek bir optimize dosyada toplar.

### 3. iPhone / iOS İçin `.usdz` Formatı
- iOS cihazlarda varsayılan AR Quick Look deneyimi için isteğe bağlı olarak `.usdz` formatı eklenebilir.
- Modelinizi `.glb` olarak yükledikten sonra, `<model-viewer>` iOS cihazlarda da WebXR veya fallback mekanizmalarıyla çalışabilmektedir. İstenirse `ios-src="models/product.usdz"` niteliği eklenerek native iOS AR desteği güçlendirilebilir.

---

## 🛠️ Kendi Ürün Modelinizi (`product.glb`) Ekleme Adımları

1. İhraç edilen GLB dosyanızı bu projedeki `models/` klasörüne kopyalayın ve adını **`product.glb`** yapın:
   ```text
   model-viewer-demo/models/product.glb
   ```
2. `index.html` dosyasını açın.
3. İçerisindeki şu yorum satırını bulun:
   `<!-- Kendi modelin hazır olduğunda src değerini models/product.glb olarak değiştir. -->`
4. `<model-viewer>` etiketi üzerindeki `src` değerini değiştirin:
   ```html
   <model-viewer
     id="product-viewer"
     src="models/product.glb"
     ...
   >
   ```

---

## 📍 Hotspot (Annotation) Koordinatlarını Belirleme Rehberi

Projedeki "Seramik lavabo" ve "Frenli çekmece" hotspot koordinatları örnek modele (`Chair.glb`) göre ayarlanmıştır. Kendi `product.glb` dosyanızı eklediğinizde koordinatları güncellemek için:

1. Tarayıcınızda [Google model-viewer Editor](https://modelviewer.dev/editor/) adresine gidin.
2. `product.glb` dosyanızı editör üzerine sürükleyip bırakın.
3. Üst menüden **Hotspots** sekmesine geçin.
4. Model üzerinde görünmesini istediğiniz noktaya tıklayarak yeni bir hotspot ekleyin.
5. Editörün ürettiği `data-position` ve `data-normal` değerlerini kopyalayın.
6. `index.html` dosyasındaki ilgili `<button class="hotspot" ...>` etiketlerinin `data-position` ve `data-normal` özniteliklerine yapıştırın.

---

## 📱 AR (Artırılmış Gerçeklik) ve HTTPS Gereksinimleri

- **Masaüstü Testi**: Masaüstü tarayıcılarda 3D modeli 360° döndürebilir, yakınlaştırabilir, ışık/gölge ve hotspot'ları test edebilirsiniz. Masaüstünde AR butonunun gösterilmemesi bir hata değil, beklenen davranıştır.
- **Gerçek Telefon Testi**: Telefon kamerası ile banyoda AR görünümü elde etmek için:
  - **Android**: WebXR veya Scene Viewer destekler.
  - **iOS**: AR Quick Look destekler.
  - **HTTPS Gereksinimi**: Mobil cihazlarda WebXR / AR özelliklerinin çalışabilmesi için sayfanın **HTTPS** protokolü üzerinden sunulması gerekmektedir (`http://localhost:8000` üzerinden telefon erişiminde AR güvenlik politikaları gereği engellenebilir).

---

## 🔗 Canlı PHP Sitesi Entegrasyonu Hakkında Not

- Bu demo klasörü (`model-viewer-demo`), canlı web sitenizden ve PHP altyapınızdan **tamamen bağımsız** olarak oluşturulmuştur.
- Canlı sitedeki hiçbir dosyaya veya veritabanına dokunulmamıştır.
- Demoyu yerel ortamda doğruladıktan sonra, `index.html`, `css/style.css`, `js/app.js` içerisindeki `<model-viewer>` yapısını ve script kodlarını PHP ürün detay sayfa şablonunuza (`product-detail.php` vb.) kolayca kopyalayabilirsiniz.
