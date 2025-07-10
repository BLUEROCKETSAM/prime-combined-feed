import Parser from 'rss-parser';
import fs from 'fs';

const parser = new Parser();
const urls = [
  'https://www.primecenter.org/prime-blog?format=rss',
  'https://www.primecenter.org/prime-in-the-news?format=rss'
];

let all = [];

for (const u of urls) {
  try {
    const feed = await parser.parseURL(u);
    const items = feed.items.map(i => ({
      title: i.title,
      link: i.link,
      pubDate: new Date(i.pubDate).toISOString(),
      thumbnail: i.enclosure?.url || '',
      description: i.contentSnippet || ''
    }));
    all = all.concat(items);
  } catch (e) {
    console.warn(`Failed to fetch ${u}:`, e.message);
  }
}

all.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
const latest = all.slice(0, 3);
fs.writeFileSync('latest.json', JSON.stringify(latest, null, 2));

