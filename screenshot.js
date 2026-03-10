const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1440, height: 1800 });
  
  await page.goto('http://127.0.0.1:8080');
  
  // Wait for the responsive section to load
  await page.waitForSelector('h2.section-title');
  
  // Scroll down
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight - 2000);
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'screenshot_test.png' });
  
  await browser.close();
  console.log('Screenshot taken!');
})();
