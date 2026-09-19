/**
 * Model Viewer Demo - JavaScript Mantığı
 * Türkçe açıklamalı kod yapısı.
 */

document.addEventListener('DOMContentLoaded', () => {
  const viewer = document.getElementById('product-viewer');
  const arButton = document.getElementById('ar-button');
  const progressBarContainer = document.getElementById('progress-bar-container');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressText = document.getElementById('progress-text');
  const errorMessage = document.getElementById('error-message');

  // Test paneli elemanları
  const panelModelName = document.getElementById('panel-model-name');
  const panelLoadStatus = document.getElementById('panel-load-status');
  const panelArStatus = document.getElementById('panel-ar-status');

  // Bilgilendirme kartı elemanları
  const arNoticeDesc = document.getElementById('ar-notice-desc');

  if (!viewer) {
    console.error('model-viewer elemanı DOM içerisinde bulunamadı.');
    return;
  }

  // Model dosya adını test paneline yazdır
  const currentSrc = viewer.getAttribute('src') || '';
  const fileName = currentSrc.split('/').pop() || currentSrc;
  if (panelModelName) panelModelName.textContent = fileName;

  // ==========================================
  // 1. YÜKLENME DURUMU (PROGRESS & LOAD)
  // ==========================================
  const handleLoadSuccess = () => {
    console.log('3D Model başarıyla yüklendi:', currentSrc);

    // Yükleme göstergesini gizle
    if (progressBarContainer) progressBarContainer.classList.add('hidden');

    // Test paneli yüklenme durumunu güncelle
    if (panelLoadStatus) {
      panelLoadStatus.textContent = 'Yüklendi (Başarılı)';
      panelLoadStatus.className = 'value badge badge-success';
    }

    // AR Desteğini kontrol et
    checkARSupport();
  };

  viewer.addEventListener('progress', (event) => {
    const progress = Math.round(event.detail.totalProgress * 100);
    if (progressBarFill) progressBarFill.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `Model yükleniyor... %${progress}`;
    
    if (panelLoadStatus) {
      if (progress >= 100 || viewer.loaded) {
        handleLoadSuccess();
      } else {
        panelLoadStatus.textContent = `Yükleniyor (%${progress})`;
        panelLoadStatus.className = 'value badge badge-pending';
      }
    }
  });

  // Model zaten yüklenmişse (örneğin önbellekten hızlı yüklendiğinde load eventi kaçırıldıysa)
  if (viewer.loaded) {
    handleLoadSuccess();
  } else {
    viewer.addEventListener('load', handleLoadSuccess);
  }

  // ==========================================
  // 2. HATA YÖNETİMİ (ERROR EVENT)
  // ==========================================
  viewer.addEventListener('error', (event) => {
    console.error('Model yüklenirken bir hata oluştu:', event.detail);

    // Yükleme barını gizle, hata mesajını göster (Düzeltme #6)
    if (progressBarContainer) progressBarContainer.classList.add('hidden');
    if (errorMessage) errorMessage.classList.remove('hidden');

    // Test panelini güncelle
    if (panelLoadStatus) {
      panelLoadStatus.textContent = 'Yükleme Hatası!';
      panelLoadStatus.className = 'value badge badge-error';
    }
  });

  // ==========================================
  // 3. ETKİLEŞİM İLE OTOMATİK DÖNÜŞÜ DURDURMA
  // ==========================================
  // Kullanıcı modelle etkileşime girdiğinde (pointer, touch, wheel) auto-rotate durdurulur (Düzeltme #7)
  const stopAutoRotate = () => {
    if (viewer.autoRotate) {
      viewer.autoRotate = false;
      console.log('Kullanıcı etkileşimi algılandı. Otomatik dönüş durduruldu.');
    }
  };

  viewer.addEventListener('pointerdown', stopAutoRotate, { passive: true });
  viewer.addEventListener('touchstart', stopAutoRotate, { passive: true });
  viewer.addEventListener('wheel', stopAutoRotate, { passive: true });

  // ==========================================
  // 4. AR DESTEĞİ KONTROLÜ
  // ==========================================
  function checkARSupport() {
    // model-viewer.canActivateAR değerini kontrol et (Düzeltme #4 & #5)
    const canActivateAR = Boolean(viewer.canActivateAR);

    if (canActivateAR) {
      // AR destekleniyorsa butonu göster (Düzeltme #5)
      if (arButton) arButton.classList.remove('hidden');
      
      if (panelArStatus) {
        panelArStatus.textContent = 'Destekleniyor (Aktif)';
        panelArStatus.className = 'value badge badge-success';
      }

      if (arNoticeDesc) {
        arNoticeDesc.textContent = 'Cihazınız AR modunu destekliyor! "Banyonuzda Gör" butonuna tıklayarak modeli gerçek ortamınıza yerleştirebilirsiniz.';
      }
    } else {
      // AR desteklenmiyorsa (Örn: Masaüstü tarayıcı)
      if (arButton) arButton.classList.add('hidden');

      if (panelArStatus) {
        panelArStatus.textContent = 'Masaüstü / AR Desteklenmiyor';
        panelArStatus.className = 'value badge badge-pending';
      }

      if (arNoticeDesc) {
        arNoticeDesc.textContent = 'Masaüstü tarayıcılarda veya AR desteklemeyen cihazlarda AR butonu gösterilmez. Bu durum bir hata değildir. Gerçek ortamda AR denemesi için iOS (Safari) veya Android (Chrome) mobil cihaz kullanınız.';
      }
    }
  }
});
