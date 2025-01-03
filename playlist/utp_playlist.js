
// Replace this with your actual JSON
const films = [];

// Function to list all torrent IDs of remux 1080p
function listRemux1080pTorrentIds(films) {
  return films
    .filter(film => film.remux1080 !== null)
    .map(film => film.remux1080)
    .join('\n');
}

// Function to generate a formatted BBCode table for movies not present in remux1080p
function generateBBCodeTable(films) {
  // Filter movies not present in remux1080p
  const filteredFilms = films.filter(film => film.remux1080 === null);

  // Generate BBCode table rows
  const rows = filteredFilms.map(film => {
    const imdbLink = `[url=https://www.imdb.com/title/${film.id}/]${film.name}[/url]`;
    const remux2160Link = film.remux2160 ? `[url=https://utp.to/torrents/${film.remux2160}]remux2160p[/url]` : 'N/A';
    const encode2160Link = film.encode2160 ? `[url=https://utp.to/torrents/${film.encode2160}]encode2160p[/url]` : 'N/A';
    const encode1080Link = film.encode1080 ? `[url=https://utp.to/torrents/${film.encode1080}]encode1080p[/url]` : 'N/A';
    const webdl2160Link = film.webdl2160 ? `[url=https://utp.to/torrents/${film.webdl2160}]webdl2160p[/url]` : 'N/A';
    const webdl1080Link = film.webdl1080 ? `[url=https://utp.to/torrents/${film.webdl1080}]webdl1080p[/url]` : 'N/A';

    return `[tr][td]${imdbLink}[/td][td]${remux2160Link}[/td][td]${encode2160Link}[/td][td]${encode1080Link}[/td][td]${webdl2160Link}[/td][td]${webdl1080Link}[/td][/tr]`;
  });

  // Combine rows into a BBCode table
  return `[table]\n[tr][td]IMDB[/td][td]Remux 2160p[/td][td]Encode 2160p[/td][td]Encode 1080p[/td][td]WebDL 2160p[/td][td]WebDL 1080p[/td][/tr]\n${rows.join('\n')}\n[/table]`;
}

// Updated BBCode table generation function
function generateFullBBCodeTable(films) {
  // Generate BBCode table rows
  const rows = films.map(film => {
    const imdbLink = `[url=https://www.imdb.com/title/${film.id}/]${film.name}[/url]`;
    const remux1080Link = film.remux1080 ? `[url=https://utp.to/torrents/${film.remux1080}]remux1080p[/url]` : 'N/A';
    const remux2160Link = film.remux2160 ? `[url=https://utp.to/torrents/${film.remux2160}]remux2160p[/url]` : 'N/A';
    const encode2160Link = film.encode2160 ? `[url=https://utp.to/torrents/${film.encode2160}]encode2160p[/url]` : 'N/A';
    const encode1080Link = film.encode1080 ? `[url=https://utp.to/torrents/${film.encode1080}]encode1080p[/url]` : 'N/A';
    const webdl2160Link = film.webdl2160 ? `[url=https://utp.to/torrents/${film.webdl2160}]webdl2160p[/url]` : 'N/A';
    const webdl1080Link = film.webdl1080 ? `[url=https://utp.to/torrents/${film.webdl1080}]webdl1080p[/url]` : 'N/A';

    return `[tr][td]${imdbLink}[/td][td]${remux1080Link}[/td][td]${remux2160Link}[/td][td]${encode2160Link}[/td][td]${encode1080Link}[/td][td]${webdl2160Link}[/td][td]${webdl1080Link}[/td][/tr]`;
  });

  // Combine rows into a BBCode table
  return `[table]\n[tr][td]IMDB[/td][td]Remux 1080p[/td][td]Remux 2160p[/td][td]Encode 2160p[/td][td]Encode 1080p[/td][td]WebDL 2160p[/td][td]WebDL 1080p[/td][/tr]\n${rows.join('\n')}\n[/table]`;
}

// Function to list all torrent IDs by quality order
function listTorrentIdsByQuality(films) {
  return films
    .map(film => {
      if (film.remux1080) return film.remux1080;
      if (film.remux2160) return film.remux2160;
      if (film.encode2160) return film.encode2160;
      if (film.encode1080) return film.encode1080;
      if (film.webdl2160) return film.webdl2160;
      if (film.webdl1080) return film.webdl1080;
      return null;
    })
    .filter(torrentId => torrentId !== null)
    .join('\n');
}

// Function to list movies not present in any quality at all
function listMoviesWithNoQuality(films) {
  return films
    .filter(film => film.notInQuality)
    .map(film => `[url=https://www.imdb.com/title/${film.id}/]${film.name}[/url]`)
    .join('\n');
}


// 1. List of all torrent IDs of remux 1080p
const remux1080pTorrentIds = listRemux1080pTorrentIds(films);
console.log("1. List of all torrent IDs of remux 1080p:");
console.log(remux1080pTorrentIds);

// 2. Formatted BBCode table for movies not present in remux1080p
const bbcodeTable = generateBBCodeTable(films);
console.log("\n2. Formatted BBCode table for movies not present in remux1080p:");
console.log(bbcodeTable);

// 2.1. Formatted BBCode table for movies by quality order
const bbcodeTable = generateFullBBCodeTable(films);
console.log("\n2.1. Formatted BBCode table for movies by quality order:");
console.log(bbcodeTable);

// 3. List of all torrent IDs by quality order
const torrentIdsByQuality = listTorrentIdsByQuality(films);
console.log("\n3. List of all torrent IDs by quality order:");
console.log(torrentIdsByQuality);

// 4. List of movies not present in any quality at all
const noQualityMovies = listMoviesWithNoQuality(films);
console.log("\n4. List of movies not present in any quality at all:");
console.log(noQualityMovies);
