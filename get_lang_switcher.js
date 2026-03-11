const https = require('https');
https.get('https://myprettyfamily.com/', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const match = data.match(/<div[^>]*class=["'][^"']*lang[^"']*["'][^>]*>[\s\S]*?<\/div>/gi);
    if (match) {
      console.log("FOUND LANG SWITCHER:");
      console.log(match.join('\n\n'));
    } else {
      console.log("Not found with class lang. Searching for typical switcher structure...");
      const match2 = data.match(/<[^>]+data-i18n-lang[^>]+>.*?<\/[^>]+>/gi);
      if (match2) {
         console.log(match2.join('\n'));
      }
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
