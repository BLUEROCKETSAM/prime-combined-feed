import Parser from 'rss-parser';
import { writeFileSync } from 'fs';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail']
    ]
  }
});

const feedUrls = [
  'https://www.primecenter.org/prime-blog/feed/',
  'https://www.primecenter.org/prime-news/feed/'
];

const DEFAULT_IMAGE = 'https://www.primecenter.org/wp-content/uploads/2023/04/PRiME-Logo-Full-Color-Square.png';

const fetchFeeds = async () => {
  let allItems = [];

  for (const url of feedUrls) {
    const feed = await parser.parseURL(url);
    const items = feed.items.map(item => {
      const thumbnail =
        item.enclosure?.url ||
        item.mediaThumbnail?.url ||
        item.mediaContent?.url ||
        DEFAULT_IMAGE;

      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        thumbnail: thumbnail,
        description: item.contentSnippet || ''
      };
    });

    allItems.push(...items);
  }

  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  writeFileSync('docs/latest.json', JSON.stringify(allItems, null, 2));
};

fetchFeeds().catch(console.error);
