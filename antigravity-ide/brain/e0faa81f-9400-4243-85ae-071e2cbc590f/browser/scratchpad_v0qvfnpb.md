# Test Plan for Model Viewer Demo - FAILED

- [x] Navigate to http://localhost:8000 (Failed due to Playwright initialization error)
- [ ] Check if page loaded successfully (HTTP 200 equivalent)
- [ ] Wait for `<model-viewer>` to load
- [ ] Verify GLB model is loaded (Status panel: 'Yüklendi (Başarılı)')
- [ ] Check console errors
- [ ] Verify Hotspots exist:
  - [ ] 'Seramik Lavabo'
  - [ ] 'Frenli Çekmece'
- [ ] Check responsive layout:
  - [ ] Desktop viewport verification
  - [ ] Mobile viewport verification (check for overflows, layout)
- [ ] Check interactive features (dobby, rotate, zoom - simulated or via state checks)
- [ ] Verify test panel displays correct AR support status

## Error Details
The browser environment failed to initialize because Playwright could not download the macOS arm64 driver:
`failed to create browser context: failed to run playwright manager: failed to install playwright: could not install driver: could not install driver: error: got non 200 status code: 404 (404 Not Found) from https://playwright.azureedge.net/builds/driver/playwright-1.57.0-mac-arm64.zip`

