const urls = [
  'https://lapiramide.net/feed',
  'https://lapiramide.net/feed/',
  'https://www.lapiramide.net/feed',
  'https://03442.com.ar/feed/'
];

async function check() {
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(url, res.status, res.statusText);
    } catch (e) {
      console.log(url, 'error', e.message);
    }
  }
}
check();
