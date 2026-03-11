const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto('https://myprettyfamily.com/reseau', {waitUntil: 'networkidle2'});
  // Wait for map to load
  await page.waitForTimeout(3000);
  const mapElement = await page.$('.mapboxgl-map');
  if (mapElement) {
    await mapElement.screenshot({ path: 'map_screenshot.png' });
    console.log('Map screenshot saved to map_screenshot.png');
  } else {
    await page.screenshot({ path: 'map_screenshot.png' });
    console.log('Full page screenshot saved (map not found)');
  }
  await browser.close();
})();
