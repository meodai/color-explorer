// src/lib/api-optimized.js
// Optimized version of API
import * as cache from './cache.js';

export const unwantedProps = ['dir', 'revision', 'tid', 'timestamp', 'pageid', 'namespace', 'titles', 'api_urls'];

// Timeout wrapper for fetch operations to prevent hanging on slow API responses
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn(`Request timed out for: ${url.toString()}`);
    }
    throw error;
  }
}

// Main lookup function for Wikipedia articles
export async function lookup(query, locale = 'en') {
  // Check cache first
  const cacheKey = `${locale}:${query}`;
  const cachedItem = cache.getCached('lookups', cacheKey);
  if (cachedItem && cache.isValid(cachedItem)) {
    return cachedItem.value;
  }

  const url = new URL(`https://${locale}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/ /g, '_'))}?redirect=1`);
  let body;
  try {
    console.time(`Wikipedia lookup: ${query}`);
    const res = await fetchWithTimeout(url, {}, 8000); // Use a longer timeout for main article
    if (!res.ok) return null;
    body = await res.json();
    console.timeEnd(`Wikipedia lookup: ${query}`);
  } catch (error) {
    // Log the error but still return null so the app doesn't break
    console.error(`Error during Wikipedia lookup for ${query}:`, error);
    return null;
  }
  unwantedProps.forEach(prop => delete body[prop]);
  let result;
  if (body.type === 'disambiguation') {
    result = { ...body, query, isDisambiguation: true };
  } else {
    if (body.text) body.text = body.text.trim().replace(/\[\d+\]/g, '');
    result = { query, ...body };
  }

  // Cache the result
  cache.setCached('lookups', cacheKey, result);
  return result;
}

// Dictionary API lookup
export async function fetchDefinition(word) {
  // Check cache first
  const cacheKey = word;
  const cachedItem = cache.getCached('definitions', cacheKey);
  if (cachedItem && cache.isValid(cachedItem)) {
    return cachedItem.value;
  }

  const url = `https://api.dictionaryapi.dev/api/v2/entries/en_US/${encodeURIComponent(word)}`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const result = await res.json();
    
    // Cache the result
    cache.setCached('definitions', cacheKey, result);
    return result;
  } catch (err) {
    console.error('Definition error:', err);
    return null;
  }
}

// Wikiquote lookup
export async function fetchWikiquote(query) {
  // Check cache first
  const cacheKey = query;
  const cachedItem = cache.getCached('quotes', cacheKey);
  if (cachedItem && cache.isValid(cachedItem)) {
    return cachedItem.value;
  }
  
  const url = new URL('https://en.wikiquote.org/w/api.php');
  const params = new URLSearchParams({
    action: 'query',
    titles: query,
    prop: 'extracts|info',
    exintro: 0,
    explaintext: 0,
    inprop: 'url',
    redirects: '',
    format: 'json',
    origin: '*'
  });
  url.search = params.toString();
  try {
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    const pages = Object.values(data.query.pages || {});
    const result = pages.find(p => !p.missing) || null;
    
    // Cache the result
    cache.setCached('quotes', cacheKey, result);
    return result;
  } catch (err) {
    console.error('Wikiquote error:', err);
    return null;
  }
}

// Fetch disambiguation entries with parallel processing
export async function fetchDisambiguationEntries(title, limit = 5, locale = 'en') {
  // Check cache first
  const cacheKey = `${locale}:${title}`;
  const cachedItem = cache.getCached('disambiguations', cacheKey);
  if (cachedItem && cache.isValid(cachedItem)) {
    return cachedItem.value;
  }
  
  try {
    const url = new URL(`https://${locale}.wikipedia.org/w/api.php`);
    const params = new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'links',
      pllimit: '500',
      format: 'json',
      origin: '*'
    });
    url.search = params.toString();
    
    console.time(`Disambiguation fetch: ${title}`);
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    console.timeEnd(`Disambiguation fetch: ${title}`);
    
    const page = Object.values(data.query.pages)[0];
    if (!page.links) return [];
    
    // Filter article links
    const articleLinks = page.links
      .filter(l => !l.title.includes(':'))
      .map(l => l.title.replace(/ /g, '_'));
      
    // Shuffle with Fisher-Yates
    for (let i = articleLinks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [articleLinks[i], articleLinks[j]] = [articleLinks[j], articleLinks[i]];
    }
    
    const selected = articleLinks.slice(0, limit);
    
    // Fetch summaries in parallel
    console.time(`Disambiguation summaries: ${title}`);
    const summaryPromises = selected.map(p => lookup(p, locale));
    const summaryResults = await Promise.all(summaryPromises);
    console.timeEnd(`Disambiguation summaries: ${title}`);
    
    const result = summaryResults.filter(sum => sum && sum.title);
    
    // Cache the result
    cache.setCached('disambiguations', cacheKey, result);
    return result;
  } catch (err) {
    console.error('Disambiguation entries error:', err);
    return [];
  }
}

// Fetch article images in parallel with optimized performance
export async function fetchArticleImages(title, locale = 'en', limit = 20) {
  // Check cache first
  const cacheKey = `${locale}:${title}`;
  const cachedItem = cache.getCached('images', cacheKey);
  if (cachedItem && cache.isValid(cachedItem)) {
    return cachedItem.value;
  }
  
  try {
    // Step 1: get image file names from article
    const query1 = new URL(`https://${locale}.wikipedia.org/w/api.php`);
    query1.search = new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'images',
      format: 'json',
      origin: '*'
    }).toString();
    
    console.time(`Image list fetch: ${title}`);
    const res1 = await fetchWithTimeout(query1);
    const data1 = await res1.json();
    console.timeEnd(`Image list fetch: ${title}`);
    
    const pages = Object.values(data1.query.pages || {});
    if (!pages.length || !pages[0].images) return [];
    
    const filenames = pages[0].images
      .map(img => img.title)
      .filter(name => !name.includes('.svg') && !name.includes('.ogg') && !name.includes('.mid'))
      .slice(0, limit); // Limit the number of images

    // Early exit if no valid images
    if (filenames.length === 0) return [];

    // Step 2: fetch URL for each image in parallel
    console.time(`Image details fetch: ${title}`);
    const imagePromises = filenames.map(async (file) => {
      const query2 = new URL(`https://${locale}.wikipedia.org/w/api.php`);
      query2.search = new URLSearchParams({
        action: 'query',
        titles: file,
        prop: 'imageinfo',
        iiprop: 'url',
        format: 'json',
        origin: '*'
      }).toString();
      try {
        const res2 = await fetchWithTimeout(query2);
        const data2 = await res2.json();
        const page = Object.values(data2.query.pages || {})[0];
        if (page && page.imageinfo && page.imageinfo[0].url) {
          return { url: page.imageinfo[0].url, title: file };
        }
      } catch (err) {
        console.error(`Error fetching image info for ${file}:`, err);
      }
      return null;
    });
    
    const results = await Promise.all(imagePromises);
    console.timeEnd(`Image details fetch: ${title}`);
    
    const filteredResults = results.filter(img => img !== null);
    
    // Cache the result
    cache.setCached('images', cacheKey, filteredResults);
    return filteredResults;
  } catch (err) {
    console.error('Error fetching article images:', err);
    return [];
  }
}
