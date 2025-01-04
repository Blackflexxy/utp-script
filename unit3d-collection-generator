// ==UserScript==
// @name         IMDb and utp.to Movie JSON Tool
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Generate and process movie JSON from IMDb and utp.to
// @author       Your Name
// @match        https://www.imdb.com/*
// @match        https://utp.to/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @updateURL    https://raw.githubusercontent.com/maksii/utp-script/main/unit3d-collection-generator.user.js
// @downloadURL  https://raw.githubusercontent.com/maksii/utp-script/main/unit3d-collection-generator.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Global variables
  let uiContainer = null;
  let jsonData = [];
  let isFetching = false;

  // Persistent API key storage
  let apiKey = GM_getValue('utpto_api_key', ''); // Load stored API key or default to an empty string

  // Helper function to create UI
  const createUI = () => {
    if (uiContainer) return; // Prevent multiple UIs

    // Create container
    uiContainer = document.createElement('div');
    uiContainer.style.position = 'fixed';
    uiContainer.style.bottom = '10px';
    uiContainer.style.right = '10px';
    uiContainer.style.width = '400px';
    uiContainer.style.backgroundColor = 'white';
    uiContainer.style.border = '1px solid #ccc';
    uiContainer.style.borderRadius = '5px';
    uiContainer.style.padding = '10px';
    uiContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    uiContainer.style.zIndex = '9999';
    uiContainer.style.fontFamily = 'Arial, sans-serif';

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.backgroundColor = '#f44336';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '50%';
    closeButton.style.width = '25px';
    closeButton.style.height = '25px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => {
      uiContainer.remove();
      uiContainer = null;
    });
    uiContainer.appendChild(closeButton);

    // Add dynamic content based on site
    if (window.location.hostname.includes('imdb.com')) {
      createIMDbUI(uiContainer);
    } else if (window.location.hostname.includes('utp.to')) {
      createUtpToUI(uiContainer);
    }

    document.body.appendChild(uiContainer);
  };

  // IMDb-specific UI
  const createIMDbUI = (container) => {
    const title = document.createElement('h3');
    title.textContent = 'IMDb JSON Generator';
    title.style.margin = '0 0 10px 0';
    title.style.fontSize = '16px';
    title.style.textAlign = 'center';
    container.appendChild(title);

    const generateButton = document.createElement('button');
    generateButton.textContent = 'Generate JSON';
    generateButton.style.width = '100%';
    generateButton.style.padding = '10px';
    generateButton.style.marginBottom = '10px';
    generateButton.style.backgroundColor = '#f5c518';
    generateButton.style.color = '#000';
    generateButton.style.border = 'none';
    generateButton.style.borderRadius = '5px';
    generateButton.style.cursor = 'pointer';
    generateButton.addEventListener('click', generateIMDbJSON);
    container.appendChild(generateButton);

    const jsonOutput = document.createElement('textarea');
    jsonOutput.style.width = '100%';
    jsonOutput.style.height = '150px';
    jsonOutput.style.marginBottom = '10px';
    jsonOutput.style.padding = '10px';
    jsonOutput.style.border = '1px solid #ccc';
    jsonOutput.style.borderRadius = '5px';
    jsonOutput.setAttribute('readonly', 'readonly');
    container.appendChild(jsonOutput);

    const status = document.createElement('div');
    status.textContent = 'Status: Ready';
    status.style.marginBottom = '10px';
    status.style.fontSize = '14px';
    status.style.color = '#333';
    container.appendChild(status);

    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download JSON';
    downloadButton.style.width = '100%';
    downloadButton.style.padding = '10px';
    downloadButton.style.backgroundColor = '#4caf50';
    downloadButton.style.color = '#fff';
    downloadButton.style.border = 'none';
    downloadButton.style.borderRadius = '5px';
    downloadButton.style.cursor = 'pointer';
    downloadButton.addEventListener('click', () => downloadJSON(jsonOutput.value));
    container.appendChild(downloadButton);

    // Store references for later use
    container.jsonOutput = jsonOutput;
    container.status = status;
  };

  // utp.to-specific UI
  const createUtpToUI = (container) => {
    const title = document.createElement('h3');
    title.textContent = 'utp.to Movie Processor';
    title.style.margin = '0 0 10px 0';
    title.style.fontSize = '16px';
    title.style.textAlign = 'center';
    container.appendChild(title);

    // API Key Input
    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'text';
    apiKeyInput.placeholder = 'Enter API Key';
    apiKeyInput.value = apiKey;
    apiKeyInput.style.width = '100%';
    apiKeyInput.style.marginBottom = '10px';
    apiKeyInput.style.padding = '10px';
    apiKeyInput.style.border = '1px solid #ccc';
    apiKeyInput.style.borderRadius = '5px';
    apiKeyInput.addEventListener('input', (event) => {
      apiKey = event.target.value;
      GM_setValue('utpto_api_key', apiKey); // Save the API key persistently
    });
    container.appendChild(apiKeyInput);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.marginBottom = '10px';
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            jsonData = JSON.parse(e.target.result);
            status.textContent = `Status: Loaded ${jsonData.length} movies`;
          } catch (err) {
            status.textContent = 'Status: Invalid JSON file';
          }
        };
        reader.readAsText(file);
      }
    });
    container.appendChild(fileInput);

    const status = document.createElement('div');
    status.textContent = 'Status: Ready';
    status.style.marginBottom = '10px';
    status.style.fontSize = '14px';
    status.style.color = '#333';
    container.appendChild(status);

    const fetchButton = document.createElement('button');
    fetchButton.textContent = 'Fetch Movie Info';
    fetchButton.style.width = '100%';
    fetchButton.style.padding = '10px';
    fetchButton.style.marginBottom = '10px';
    fetchButton.style.backgroundColor = '#2196f3';
    fetchButton.style.color = '#fff';
    fetchButton.style.border = 'none';
    fetchButton.style.borderRadius = '5px';
    fetchButton.style.cursor = 'pointer';
    fetchButton.addEventListener('click', fetchMovieInfo);
    container.appendChild(fetchButton);

    const generateReportButton = document.createElement('button');
    generateReportButton.textContent = 'Generate Report';
    generateReportButton.style.width = '100%';
    generateReportButton.style.padding = '10px';
    generateReportButton.style.marginBottom = '10px';
    generateReportButton.style.backgroundColor = '#4caf50';
    generateReportButton.style.color = '#fff';
    generateReportButton.style.border = 'none';
    generateReportButton.style.borderRadius = '5px';
    generateReportButton.style.cursor = 'pointer';
    generateReportButton.addEventListener('click', generateReport);
    container.appendChild(generateReportButton);

    const reportOutput = document.createElement('textarea');
    reportOutput.style.width = '100%';
    reportOutput.style.height = '150px';
    reportOutput.style.marginBottom = '10px';
    reportOutput.style.padding = '10px';
    reportOutput.style.border = '1px solid #ccc';
    reportOutput.style.borderRadius = '5px';
    reportOutput.setAttribute('readonly', 'readonly');
    container.appendChild(reportOutput);

    // Store references for later use
    container.status = status;
    container.reportOutput = reportOutput;
  };

  // IMDb JSON generation logic
  const generateIMDbJSON = () => {
    const url = window.location.href;
    const container = uiContainer;
    const { jsonOutput, status } = container;
    let movies = [];
    status.textContent = 'Status: Fetching movies...';

    if (url.includes('/chart/top/')) {
      // Top 250 page
      const movieListItems = document.querySelectorAll('li.ipc-metadata-list-summary-item');
      movies = extractMovies(movieListItems, 'h3.ipc-title__text', 'a.ipc-lockup-overlay');
    } else if (url.includes('/name/')) {
      // Actor's page
      const movieListItems = document.querySelectorAll('li.ipc-metadata-list-summary-item');
      movies = extractMovies(movieListItems, 'a.ipc-metadata-list-summary-item__t', 'a.ipc-metadata-list-summary-item__t');
    } else {
      status.textContent = 'Status: Unsupported page type';
      return;
    }

    const json = JSON.stringify(movies, null, 2);
    jsonOutput.value = json;
    status.textContent = `Status: Found ${movies.length} movies`;
  };

  const fetchMovieInfo = async () => {
    if (isFetching || jsonData.length === 0) return;
    isFetching = true;
    const { status } = uiContainer;

    if (!apiKey) {
      status.textContent = 'Status: API key is missing';
      isFetching = false;
      return;
    }

    const delay = 5000; // Wait time between requests in milliseconds
    const baseUrl = "https://utp.to/api/torrents/filter";
    const totalMovies = jsonData.length;

    // Helper function to wait for a specified amount of time
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    status.textContent = `Status: Fetching data for ${totalMovies} movies...`;

    for (let index = 0; index < totalMovies; index++) {
      const movie = jsonData[index];
      const imdbId = movie.id.replace("tt", ""); // Convert IMDb ID to numeric format
      const url = `${baseUrl}?api_token=${apiKey}&imdbId=${imdbId}`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        // Define the priority order for matching torrents
        const priorities = [
          { type: "Remux", resolution: "1080p", key: "remux1080" },
          { type: "Remux", resolution: "2160p", key: "remux2160" },
          { type: "WEB-DL", resolution: "2160p", key: "webdl2160" },
          { type: "WEB-DL", resolution: "1080p", key: "webdl1080" },
          { type: "WEB-DL", resolution: "any", key: "webdlany" },
          { type: "Encode", resolution: "2160p", key: "encode2160" },
          { type: "Encode", resolution: "1080p", key: "encode1080" },
        ];

        // Initialize fields for the movie
        movie.torrentId = null;
        movie.notInQuality = false;

        // Loop through the priorities to find the first matching torrent
        for (const priority of priorities) {
          const matchingTorrent = data.data.find((torrent) => {
            const matchesType = torrent.attributes.type === priority.type;
            const matchesResolution =
              priority.resolution === "any" ||
              torrent.attributes.resolution === priority.resolution;
            return matchesType && matchesResolution;
          });

          if (matchingTorrent) {
            movie[priority.key] = matchingTorrent.id;
            if (!movie.torrentId) {
              movie.torrentId = matchingTorrent.id; // Populate torrentId with the first match
            }
          } else {
            movie[priority.key] = null;
          }
        }

        // If no matches were found for any combination, set notInQuality to true
        if (!movie.torrentId) {
          movie.notInQuality = true;
        }
      } catch (error) {
        console.error(`Error fetching data for IMDb ID ${imdbId}:`, error);
        movie.torrentId = null; // Handle error by setting torrentId to null
        movie.notInQuality = true;
      }

      // Update status
      status.textContent = `Status: Processed ${index + 1} of ${totalMovies} movies (${(
        ((index + 1) / totalMovies) *
        100
      ).toFixed(2)}%)`;

      // Wait for 5 seconds before making the next request
      await wait(delay);
    }

    isFetching = false;
    status.textContent = 'Status: Fetching complete';
  };

  const generateReport = () => {
    const { reportOutput, status } = uiContainer;

    if (!jsonData.length) {
      status.textContent = 'Status: No data to generate report';
      return;
    }

    // Function to list all torrent IDs of remux 1080p
    const listRemux1080pTorrentIds = (films) =>
      films
        .filter((film) => film.remux1080 !== null)
        .map((film) => film.remux1080)
        .join('\n');

    const listTorrentIdsByQuality = (films) =>
      films
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


    // Function to generate a formatted BBCode table for movies not present in remux1080p
    const generateBBCodeTable = (films) => {
      const filteredFilms = films.filter((film) => film.remux1080 === null);

      const rows = filteredFilms.map((film) => {
        const imdbLink = `[url=https://www.imdb.com/title/${film.id}/]${film.name}[/url]`;
        const remux2160Link = film.remux2160
          ? `[url=https://utp.to/torrents/${film.remux2160}]remux2160p[/url]`
          : 'N/A';
        const encode2160Link = film.encode2160
          ? `[url=https://utp.to/torrents/${film.encode2160}]encode2160p[/url]`
          : 'N/A';
        const encode1080Link = film.encode1080
          ? `[url=https://utp.to/torrents/${film.encode1080}]encode1080p[/url]`
          : 'N/A';
        const webdl2160Link = film.webdl2160
          ? `[url=https://utp.to/torrents/${film.webdl2160}]webdl2160p[/url]`
          : 'N/A';
        const webdl1080Link = film.webdl1080
          ? `[url=https://utp.to/torrents/${film.webdl1080}]webdl1080p[/url]`
          : 'N/A';

        return `[tr][td]${imdbLink}[/td][td]${remux2160Link}[/td][td]${encode2160Link}[/td][td]${encode1080Link}[/td][td]${webdl2160Link}[/td][td]${webdl1080Link}[/td][/tr]`;
      });

      return `[table]\n[tr][td]IMDB[/td][td]Remux 2160p[/td][td]Encode 2160p[/td][td]Encode 1080p[/td][td]WebDL 2160p[/td][td]WebDL 1080p[/td][/tr]\n${rows.join(
        '\n'
      )}\n[/table]`;
    };

    // Function to generate a formatted BBCode table for movies not present in remux1080p
    const generateFullBBCodeTable = (films) => {
      const rows = films.map((film) => {
        const imdbLink = `[url=https://www.imdb.com/title/${film.id}/]${film.name}[/url]`;
        const remux1080Link = film.remux1080 ? `[url=https://utp.to/torrents/${film.remux1080}]remux1080p[/url]` : 'N/A';
        const remux2160Link = film.remux2160
          ? `[url=https://utp.to/torrents/${film.remux2160}]remux2160p[/url]`
          : 'N/A';
        const encode2160Link = film.encode2160
          ? `[url=https://utp.to/torrents/${film.encode2160}]encode2160p[/url]`
          : 'N/A';
        const encode1080Link = film.encode1080
          ? `[url=https://utp.to/torrents/${film.encode1080}]encode1080p[/url]`
          : 'N/A';
        const webdl2160Link = film.webdl2160
          ? `[url=https://utp.to/torrents/${film.webdl2160}]webdl2160p[/url]`
          : 'N/A';
        const webdl1080Link = film.webdl1080
          ? `[url=https://utp.to/torrents/${film.webdl1080}]webdl1080p[/url]`
          : 'N/A';

        return `[tr][td]${imdbLink}[/td][td]${remux1080Link}[/td][td]${remux2160Link}[/td][td]${encode2160Link}[/td][td]${encode1080Link}[/td][td]${webdl2160Link}[/td][td]${webdl1080Link}[/td][/tr]`;
      });

      // Combine rows into a BBCode table
      return `[table]\n[tr][td]IMDB[/td][td]Remux 1080p[/td][td]Remux 2160p[/td][td]Encode 2160p[/td][td]Encode 1080p[/td][td]WebDL 2160p[/td][td]WebDL 1080p[/td][/tr]\n${rows.join('\n')}\n[/table]`;
    };

    // Generate the report
    const remux1080pTorrentIds = listRemux1080pTorrentIds(jsonData);
    const anyTorrentIds = listTorrentIdsByQuality(jsonData);
    const bbcodeTable = generateBBCodeTable(jsonData);
    const fullBbcodeTable = generateFullBBCodeTable(jsonData);

    // Combine the report content
    const report = `
    List of all torrent IDs of remux 1080p:\n${remux1080pTorrentIds}\n\n
    List of all torrent IDs of any:\n${anyTorrentIds}\n\n  
    
    Formatted BBCode table for movies not present in remux1080p:\n${bbcodeTable}\n\n 
    ------------------------------------------------\n\n   

    Formatted BBCode table for all:\n${fullBbcodeTable}\n\n  `;

    // Output the report
    reportOutput.value = report;
    status.textContent = 'Status: Report generated';
  };

  // Utility to extract movie data
  const extractMovies = (listItems, titleSelector, linkSelector) => {
    const movies = [];
    listItems.forEach((item) => {
      const titleElement = item.querySelector(titleSelector);
      const linkElement = item.querySelector(linkSelector);
      if (titleElement && linkElement) {
        const movieTitle = titleElement.textContent.trim();
        const movieHref = linkElement.getAttribute('href');
        const movieIdMatch = movieHref.match(/\/title\/(tt\d+)\//);
        if (movieIdMatch) {
          movies.push({ name: movieTitle, id: movieIdMatch[1] });
        }
      }
    });
    return movies;
  };

  // Utility to download JSON
  const downloadJSON = (json) => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'movies.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Register menu command to open the tool
  GM_registerMenuCommand('Open Movie Tool', createUI);
})();
