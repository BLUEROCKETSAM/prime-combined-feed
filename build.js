const Parser = require("rss-parser");
const fs = require("fs");
const parser = new Parser();

(async () => {
  const feeds = [
    "https://www.primecenter.org/prime-blog?format=rss",
    "https://www.primecenter.org/prime-in-the-news?format=rss"
  ];

  let allItems = [];

  for (const feedUrl of feeds) {
    const feed = await parser.parseURL(feedUrl);
    const items = feed.items.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      description: item.contentSnippet || "",
      thumbnail: item.enclosure?.url || "" // fallback if there's a media image
    }));
    allItems = allItems.concat(items);
  }

  // Sort items by date descending
  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  fs.writeFileSync("docs/latest.json", JSON.stringify(allItems, null, 2));
})();
