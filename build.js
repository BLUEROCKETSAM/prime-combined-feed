import Parser from 'rss-parser';
import fetch from 'node-fetch';
import { load } from 'cheerio'; // ✅ FIXED: ESM-compatible import
import { writeFileSync } from 'fs';

const parser = new Parser();

const feedUrls = [
  'https://www.primecenter.org/prime-blog?format=rss',
  'https://www.primecenter.org/prime-in-the-news?format=rss'
];

const DEFAULT_IMAGE = 'https://www.primecenter.org/wp-content/uploads/2023/04/PRiME-Logo-Full-Color-Square.png';

async function fetchThumbnailFromPage(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = load(html); // ✅ FIXED: use 'load' instead of 'cheerio.load'

    let image = $('meta[property="og:image"]').attr('content');
    if (!image) {
      image = $('img').first().attr('src');
    }

    return image || DEFAULT_IMAGE;
  } catch (err) {
    console.error(`Error fetching thumbnail from ${url}:`, err.message);
    return DEFAULT_IMAGE;
  }
}

async function generateFeed() {
  let allItems = [];

  for (const feedUrl of feedUrls) {
    const feed = await parser.parseURL(feedUrl);
    for (const item of feed.items) {
      const thumbnail = await fetchThumbnailFromPage(item.link);
      allItems.push({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        thumbnail: thumbnail,
        description: item.contentSnippet || item.content || ''
      });
    }
  }

  // Sort and take latest 3
  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const latest = allItems.slice(0, 3);

  writeFileSync('docs/latest.json', JSON.stringify(latest, null, 2));
}

generateFeed();
