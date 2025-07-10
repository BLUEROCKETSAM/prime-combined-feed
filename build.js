import Parser from 'rss-parser';
import fetch from 'node-fetch';
import { load } from 'cheerio';
import { writeFileSync } from 'fs';

const parser = new Parser();
const DEFAULT_IMAGE = 'https://www.primecenter.org/wp-content/uploads/2023/04/PRiME-Logo-Full-Color-Square.png';

const feedUrls = [
  'https://www.primecenter.org/prime-blog?format=rss',
  'https://www.primecenter.org/prime-in-the-news?format=rss'
];

async function fetchThumbnailFromPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const html = await res.text();
    const $ = load(html);

    let image = $('meta[property="og:image"]').attr('content') || $('img').first().attr('src');

    if (!image || image.trim() === '') return null;
    if (image.startsWith('//')) image = 'https:' + image;
    else if (image.startsWith('/')) image = new URL(url).origin + image;

    return image;
  } catch (err) {
    console.error(`⚠️ Failed to fetch image for ${url}:`, err.message);
    return null;
  }
}

async function generateFeed() {
  const allItems = [];

  for (const feedUrl of feedUrls) {
    const feed = await parser.parseURL(feedUrl);
    for (const item of feed.items) {
      const thumbnail = await fetchThumbnailFromPage(item.link);

      if (!thumbnail) continue; // ⛔️ Skip if image could not be fetched

      allItems.push({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        description: item.contentSnippet || item.content || '',
        thumbnail
      });
    }
  }

  // Remove duplicates by link
  const seen = new Set();
  const uniqueItems = allItems.filter(item => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  // Sort by latest date and take top 4
  const latest = uniqueItems
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, 4);

  writeFileSync('docs/latest.json', JSON.stringify(latest, null, 2));
  console.log('✅ latest.json updated with', latest.length, 'valid posts');
}

generateFeed();
