import Parser from 'rss-parser';
import { writeFileSync } from 'fs';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

const feedUrls = [
  'https://www.primecenter.org/prime-blog/feed/',
  'https://www.primecenter.org/prime-news/feed/'
];

const DEFAULT_IMAGE = 'https://www.primecenter.org/wp-content/uploads/2023/04/PRiME-Logo-Full-Color-Square.png';

// Extracts first image src from HTML string
function extractImageFromHTML(html) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^">]+)"/i);
  return match ? match[1] : null;
}

const fetchFeeds = async () => {
  let allItems = [];

  for (const url of feedUrls) {
    const feed = await parser.parseURL(url);
    const items = feed.items.map(item => {
      const htmlImage = extractImageFromHTML(item.contentEncoded);
      const thumbnail =
        htmlImage ||
        item.enclosure?.url ||
        item.mediaThumbnail?.url ||
        item.mediaContent?.url ||
        DEFAULT_IMAGE;

      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        thumbnail,
        description: item.contentSnippet || ''
      };
    });

    allItems.push(...items);
  }

  // Sort and limit to 3 posts
  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const topThree = allItems.slice(0, 3);

  writeFileSync('docs/latest.json', JSON.stringify(topThree, null, 2));
};

fetchFeeds().catch(console.error);
