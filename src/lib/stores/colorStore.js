import { writable } from 'svelte/store';
import { lookup, fetchDefinition, fetchWikiquote, fetchDisambiguationEntries, fetchArticleImages, fetchArenaBlocks } from '../api-optimized.js';
import { timeoutPromise } from '../timeout.js';
import ColorDescription from "color-description";

const SIMILAR_COLORS = 40;

function nahWordsInExtremities(Word) {
  const nahWords = ['the','a','in','of','an','on'];
  const word = Word.toLowerCase();
  return nahWords.some(nw => word.startsWith(nw+' ') || word.endsWith(' '+nw));
}
function splitWords(str) {
  const nahWords = ['the','a','in','of','an','on','and','or','for','to','is','are','was','were','be','by','with'];
  const arr = str.split(' ');
  const result = new Set();
  
  // Add complete string first
  result.add(str);
  
  // Add individual words that are meaningful
  arr.forEach(item => {
    if (item.length > 2 && !nahWords.includes(item.toLowerCase())) {
      result.add(item);
    }
  });
  
  // Add meaningful two-word combinations if there are more than 2 words
  if (arr.length > 2) {
    for (let i = 0; i < arr.length - 1; i++) {
      const combo = arr[i] + ' ' + arr[i+1];
      if (!nahWordsInExtremities(combo)) {
        result.add(combo);
      }
    }
  }
  
  return [...result];
}

function createColorStore() {
  const { subscribe, set, update } = writable({
    name: '',
    hex: '',
    similarColors: [],
    description: '',
    descriptionList: [],
    meanings: [],
    bestContrast: '',
    wikiArticles: [],
    definitions: [],
    quotes: [],
    disambiguations: [],
    arenaBlocks: [] // Are.na search results
  });

  async function fetchColorData(requestedHex = '') {
    console.time('Total color data fetch');
    const genHex =
      requestedHex ||
      "#" +
        Array(6)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("");
    const returnedColors = (
      await fetch(
        `https://api.color.pizza/v1/?values=${new Array(SIMILAR_COLORS)
          .fill(genHex.slice(1))
          .join(",")}&list=default&noduplicates=true`
      ).then((r) => r.json())
    ).colors;

    const { name, hex, bestContrast } = returnedColors[0];

    const cd = new ColorDescription(hex);

    set({
      name,
      hex,
      similarColors: returnedColors.filter(c => c.hex !== hex),
      description: cd.description[0] || '',
      descriptionList: cd.getDescriptiveList(),
      meanings: cd.meanings,
      bestContrast,
      wikiArticles: [], 
      definitions: [], 
      quotes: [], 
      disambiguations: [],
      arenaBlocks: []
  });

    const parts = [...new Set([name, ...splitWords(name)])];
    console.log('Search terms:', parts);

    // Parallel lookups with timeouts
    console.time('Wikipedia lookups');
    const lookupPromises = parts.map(part => {
      try {
        return timeoutPromise(5000, lookup(part), `Wikipedia lookup for ${part}`).catch(err => {
          console.warn(`Timed out or error for ${part}:`, err.message);
          return null;
        });
      } catch (e) {
        console.error(`Error looking up ${part}:`, e);
        return Promise.resolve(null);
      }
    });
    const lookupResults = await Promise.all(lookupPromises);
    console.timeEnd('Wikipedia lookups');

    // Process Wikipedia summaries
    let disambiguations = [];
    const wikiArticles = lookupResults
      .filter(r => r && !r.isDisambiguation)
      .map(r => ({ ...r }));
    const disambResults = lookupResults.filter(r => r && r.isDisambiguation);
    if (disambResults.length) {
      // fetch random entries for the first disambiguation found
      console.time('Disambiguation fetch');
      disambiguations = await fetchDisambiguationEntries(disambResults[0].title);
      console.timeEnd('Disambiguation fetch');
    }

    // Parallel definitions fetch
    console.time('Definitions fetch');
    const defResults = await Promise.all(parts.map(p => fetchDefinition(p)));
    const definitions = defResults.filter(d => d).flat();
    console.timeEnd('Definitions fetch');

    // Parallel wikiquote fetch
    console.time('Wikiquote fetch');
    const quoteResults = await Promise.all(parts.map(p => fetchWikiquote(p)));
    const quotes = quoteResults.filter(q => q);
    console.timeEnd('Wikiquote fetch');

    // fetch images for each non-disambiguation article with timeouts
    console.time('Image fetch');
    const imagesPromises = wikiArticles.map(a => {
      try {
        return timeoutPromise(4000, fetchArticleImages(a.title), `Images for ${a.title}`).catch(err => {
          console.warn(`Image fetch timed out for ${a.title}:`, err.message);
          return [];
        });
      } catch (e) {
        console.error(`Error fetching images for ${a.title}:`, e);
        return Promise.resolve([]);
      }
    });
    const imagesArrays = await Promise.all(imagesPromises);
    const articlesWithImages = wikiArticles.map((art, i) => ({ ...art, images: imagesArrays[i] }));
    console.timeEnd('Image fetch');

    // fetch Are.na blocks for the color name
    console.time('Arena fetch');
    let arenaBlocks = [];
    try {
      // Use the same parts array as Wikipedia lookups
      const arenaPromises = parts.map(part => {
        return timeoutPromise(
          5000,
          fetchArenaBlocks(part),
          `Are.na blocks for ${part}`
        ).catch(err => {
          console.warn(`Are.na fetch error for ${part}:`, err.message);
          return [];
        });
      });
      const arenaResults = await Promise.all(arenaPromises);
      
      // Combine all blocks from different search terms, removing duplicates by ID
      const blockMap = new Map();
      arenaResults.forEach(blocks => {
        blocks.forEach(block => {
          if (!blockMap.has(block.id)) {
            blockMap.set(block.id, block);
          }
        });
      });
      
      arenaBlocks = Array.from(blockMap.values());
    } catch (err) {
      console.warn(`Are.na fetch error:`, err.message);
    }
    console.timeEnd('Arena fetch');

    arenaBlocks = arenaBlocks.filter((b) => {
      return (
        b.class === "Image" || b.class === "Media"
      );
    });

    // remove duplicates from arenaBlocks
    const uniqueBlocks = new Map();
    arenaBlocks.forEach(block => {
      if (!uniqueBlocks.has(block.title || block.id)) {
        uniqueBlocks.set(block.title || block.id, block);
      }
    });
    arenaBlocks = Array.from(uniqueBlocks.values());
    // remove duplicates from wikiArticles

    set({
      name,
      hex,
      similarColors: returnedColors.filter(c => c.hex !== hex),
      description: cd.description[0] || '',
      descriptionList: cd.getDescriptiveList(),
      meanings: cd.meanings,
      bestContrast,
      wikiArticles: articlesWithImages,
      definitions,
      quotes,
      disambiguations,
      arenaBlocks
    });
    console.timeEnd('Total color data fetch');
  }

  return {
    subscribe,
    set,
    update,
    fetchColorData
  };
}

export const colorStore = createColorStore();
