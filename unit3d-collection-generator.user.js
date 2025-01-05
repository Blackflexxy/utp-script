// ==UserScript==
// @name         UNIT3D Playlist Assistant
// @version      2.3
// @description  Generate and process movie JSON from IMDb and UNIT3D
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

  // Default Priority List
  const defaultPriorities = [
    { type: 'Remux', resolution: '1080p', key: 'remux1080' },
    { type: 'Remux', resolution: '2160p', key: 'remux2160' },
    { type: 'Encode', resolution: '2160p', key: 'encode2160' },
    { type: 'WEB-DL', resolution: '2160p', key: 'webdl2160' },
    { type: 'Encode', resolution: '1080p', key: 'encode1080' },
    { type: 'WEB-DL', resolution: '1080p', key: 'webdl1080' },
  ];

  // Persistent API key storage
  let apiKey = GM_getValue('utpto_api_key', ''); // Load stored API key or default to an empty string
  // Load saved type and quality
  const savedType = GM_getValue('selected_type', 'Remux'); // Default to 'Remux'
  const savedQuality = GM_getValue('selected_quality', '1080p'); // Default to '1080p'
  // Load saved priorities or use default
  const savedPriorities = GM_getValue('priorities', defaultPriorities); // Load saved priorities or default
  const priorities = [...savedPriorities]; // Clone the saved priorities to avoid modifying the original

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
    generateButton.id = 'generate-json-btn';
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
    downloadButton.id = 'download-json-btn'
    downloadButton.style.width = '100%';
    downloadButton.style.padding = '10px';
    downloadButton.style.backgroundColor = '#4caf50';
    downloadButton.style.color = '#fff';
    downloadButton.style.border = 'none';
    downloadButton.style.borderRadius = '5px';
    downloadButton.style.cursor = 'pointer';
    downloadButton.disabled = true;
    downloadButton.addEventListener('click', () => downloadJSON(jsonOutput.value));
    container.appendChild(downloadButton);

    // Store references for later use
    container.jsonOutput = jsonOutput;
    container.status = status;
  };

  // utp.to-specific UI
  const createUtpToUI = (container) => {
    const title = document.createElement('h3');
    title.textContent = 'UNIT3D Playlist Assistant';
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
          const fetchButton = document.getElementById('fetch-movie-info-btn')
          try {
            jsonData = JSON.parse(e.target.result);
            status.textContent = `Status: Loaded ${jsonData.length} movies`;

            if (jsonData.length > 0) {
              fetchButton.disabled = false;
            } else {
              fetchButton.disabled = true;
            }
          } catch (err) {
            status.textContent = 'Status: Invalid JSON file';
            fetchButton.disabled = true;
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
    fetchButton.id = 'fetch-movie-info-btn';
    fetchButton.style.width = '100%';
    fetchButton.style.padding = '10px';
    fetchButton.style.marginBottom = '10px';
    fetchButton.style.backgroundColor = '#2196f3';
    fetchButton.style.color = '#fff';
    fetchButton.style.border = 'none';
    fetchButton.style.borderRadius = '5px';
    fetchButton.style.cursor = 'pointer';
    fetchButton.disabled = true;
    fetchButton.addEventListener('click', fetchMovieInfo);
    container.appendChild(fetchButton);

    const generateReportButton = document.createElement('button');
    generateReportButton.textContent = 'Generate Report';
    generateReportButton.id = 'generate-report-btn';
    generateReportButton.style.width = '100%';
    generateReportButton.style.padding = '10px';
    generateReportButton.style.marginBottom = '10px';
    generateReportButton.style.backgroundColor = '#4caf50';
    generateReportButton.style.color = '#fff';
    generateReportButton.style.border = 'none';
    generateReportButton.style.borderRadius = '5px';
    generateReportButton.style.cursor = 'pointer';
    generateReportButton.disabled = true;
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

    // Main Type Dropdown
    const typeDropdown = document.createElement('select');
    typeDropdown.style.width = '100%';
    typeDropdown.style.marginBottom = '10px';
    typeDropdown.style.padding = '10px';
    typeDropdown.style.border = '1px solid #ccc';
    typeDropdown.style.borderRadius = '5px';
    ['Remux', 'WEB-DL', 'Encode'].forEach((type) => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      if (type === savedType) option.selected = true; // Set saved value as selected
      typeDropdown.appendChild(option);
    });
    typeDropdown.addEventListener('change', () => {
      GM_setValue('selected_type', typeDropdown.value); // Save selected type
    });
    container.appendChild(typeDropdown);

    // Quality Dropdown
    const qualityDropdown = document.createElement('select');
    qualityDropdown.style.width = '100%';
    qualityDropdown.style.marginBottom = '10px';
    qualityDropdown.style.padding = '10px';
    qualityDropdown.style.border = '1px solid #ccc';
    qualityDropdown.style.borderRadius = '5px';
    ['1080p', '2160p'].forEach((quality) => {
      const option = document.createElement('option');
      option.value = quality;
      option.textContent = quality;
      if (quality === savedQuality) option.selected = true;
      qualityDropdown.appendChild(option);
    });
    qualityDropdown.addEventListener('change', () => {
      GM_setValue('selected_quality', qualityDropdown.value); // Save selected quality
    });
    container.appendChild(qualityDropdown);
    // Priority Reordering Section
    const priorityContainer = document.createElement('div');
    priorityContainer.style.marginBottom = '10px';

    // Priority Title
    const priorityTitle = document.createElement('h4');
    priorityTitle.textContent = 'Reorder Quality Priorities';
    priorityTitle.style.margin = '10px 0';
    priorityContainer.appendChild(priorityTitle);

    // Priority List
    const priorityList = document.createElement('ul');
    priorityList.style.listStyle = 'none';
    priorityList.style.padding = '0';
    priorityList.style.border = '1px solid #ccc';
    priorityList.style.borderRadius = '5px';
    priorityList.style.maxHeight = '200px';
    priorityList.style.overflowY = 'auto';



    // Helper function to render priorities
    const renderPriorities = () => {
      priorityList.innerHTML = '';
      defaultPriorities.forEach((priority, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${priority.type} - ${priority.resolution}`;
        listItem.style.padding = '10px';
        listItem.style.borderBottom = '1px solid #ccc';
        listItem.style.cursor = 'move';
        listItem.draggable = true;

        // Drag-and-Drop Handlers
        listItem.addEventListener('dragstart', (event) => {
          event.dataTransfer.setData('text/plain', index);
        });

        listItem.addEventListener('dragover', (event) => {
          event.preventDefault();
        });

        listItem.addEventListener('drop', (event) => {
          event.preventDefault();
          const fromIndex = event.dataTransfer.getData('text/plain');
          const toIndex = index;

          // Reorder priorities
          const [movedItem] = defaultPriorities.splice(fromIndex, 1);
          defaultPriorities.splice(toIndex, 0, movedItem);
          // Save reordered priorities
          GM_setValue('priorities', priorities);
          // Re-render priorities
          renderPriorities();
        });

        priorityList.appendChild(listItem);
      });
    };

    // Initial Render
    renderPriorities();
    priorityContainer.appendChild(priorityList);
    container.appendChild(priorityContainer);

    // Store reference for later use
    container.defaultPriorities = defaultPriorities;
    // Store references for later use
    container.typeDropdown = typeDropdown;
    container.qualityDropdown = qualityDropdown;
    container.status = status;
    container.reportOutput = reportOutput;
  };
  // Prevent tab closure or navigation during fetch or when report is displayed
  window.addEventListener('beforeunload', (event) => {
    if (isFetching || (uiContainer && uiContainer.reportOutput && uiContainer.reportOutput.value.trim())) {
      event.preventDefault();
      event.returnValue = 'You have unsaved progress. Are you sure you want to leave?';
    }
  });
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
    } else if (url.includes('/search/title/')) {
      // Actor's page
      const movieListItems = document.querySelectorAll('li.ipc-metadata-list-summary-item');
      movies = extractMovies(movieListItems, 'h3.ipc-title__text', 'a.ipc-lockup-overlay');
    } else {
      status.textContent = 'Status: Unsupported page type';
      return;
    }

    const json = JSON.stringify(movies, null, 2);
    jsonOutput.value = json;
    status.textContent = `Status: Found ${movies.length} movies`;
    const downloadButton = document.getElementById('download-json-btn')
    if (jsonOutput.value.trim()) {
      downloadButton.disabled = false;
    } else {
      downloadButton.disabled = true;
    }
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

        // Get user-selected type and quality
        const selectedType = uiContainer.typeDropdown.value;
        const selectedQuality = uiContainer.qualityDropdown.value;

        // Use user-reordered priorities
        const priorities = uiContainer.defaultPriorities.map((priority) => ({
          type: priority.type,
          resolution: priority.resolution,
          key: priority.key,
        }));

        // Ensure the selected type and quality are always first
        priorities.unshift({
          type: selectedType,
          resolution: selectedQuality,
          key: `${selectedType.toLowerCase()}${selectedQuality}`,
        });

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
    document.getElementById('generate-report-btn').disabled = false;

  };

  const generateReport = () => {
    const { reportOutput, status, typeDropdown, qualityDropdown, defaultPriorities } = uiContainer;
    if (!jsonData.length) {
      status.textContent = 'Status: No data to generate report';
      return;
    }
    const selectedType = typeDropdown.value;
    const selectedQuality = qualityDropdown.value;
    // Use user-reordered priorities
    const priorities = defaultPriorities.map((priority) => ({
      type: priority.type,
      resolution: priority.resolution,
      key: priority.key,
    }));

    // Ensure the selected type and quality are always first
    priorities.unshift({
      type: selectedType,
      resolution: selectedQuality,
      key: `${selectedType.toLowerCase()}${selectedQuality}`,
    });

    const listTorrentIdsBySelectedQuality = (films, selectedType, selectedQuality) => {
      const key = `${selectedType.toLowerCase()}${selectedQuality}`; // Construct the key dynamically
      return films
        .filter((film) => film[key] !== null) // Filter films that have a torrent for the selected quality
        .map((film) => film[key]) // Extract the torrent IDs
        .join('\n'); // Join the IDs into a newline-separated string
    };

    const listTorrentIdsByQuality = (films, priorities) => {
      return films
        .map((film) => {
          for (const priority of priorities) {
            const key = priority.key; // Example: "remux1080", "webdl2160", etc.
            if (film[key]) {
              return film[key]; // Return the first available torrent ID based on priority
            }
          }
          return null; // If no torrent matches any priority, return null
        })
        .filter((torrentId) => torrentId !== null) // Remove any null values
        .join('\n'); // Join the IDs into a newline-separated string
    };

    const generateBBCodeTable = (films, selectedType, selectedQuality, priorities, showAll = false) => {
      const selectedKey = `${selectedType.toLowerCase()}${selectedQuality}`; // Construct the key for the selected quality

      // Filter movies based on the `showAll` flag
      const filteredFilms = showAll
        ? films // If `showAll` is true, include all movies
        : films.filter((film) => film[selectedKey] === null); // Otherwise, include only movies where the selected quality is missing

      // Generate rows for the BBCode table
      const rows = filteredFilms.map((film) => {
        const imdbLink = `[url=https://www.imdb.com/title/${film.id}/]${film.name}[/url]`;

        // For each priority, generate links for available qualities (except the selected one)
        const qualityLinks = priorities
          .filter((priority) => priority.key !== selectedKey) // Exclude the selected quality
          .map((priority) => {
            const key = priority.key;
            return film[key]
              ? `[url=https://utp.to/torrents/${film[key]}]${priority.type} ${priority.resolution}[/url]`
              : 'N/A'; // Show "N/A" if the quality is not available
          });

        // Combine IMDb link and all quality links into a table row
        return `[tr][td]${imdbLink}[/td]${qualityLinks.map((link) => `[td]${link}[/td]`).join('')}`;
      });

      // Generate the table header
      const headers = [
        '[td]IMDB[/td]',
        ...priorities
          .filter((priority) => priority.key !== selectedKey) // Exclude the selected quality
          .map((priority) => `[td]${priority.type} ${priority.resolution}[/td]`),
      ].join('');

      // Combine everything into a BBCode table
      return `[table]\n[tr]${headers}[/tr]\n${rows.join('\n')}\n[/table]`;
    };

    // Generate the report
    const selectedTorrentIds = listTorrentIdsBySelectedQuality(jsonData, selectedType, selectedQuality);
    const anyTorrentIds = listTorrentIdsByQuality(jsonData, priorities);
    const bbcodeTable = generateBBCodeTable(jsonData, selectedType, selectedQuality, priorities);
    const fullBbcodeTable = generateBBCodeTable(jsonData, selectedType, selectedQuality, priorities, true);

    // Combine the report content
    const report = `
    List of all torrent IDs of selected quality:\n${selectedTorrentIds}\n\n
    List of all torrent IDs of any:\n${anyTorrentIds}\n\n
    ------------------------------------------------\n\n
    Formatted BBCode table for movies not present in selected:\n${bbcodeTable}\n\n
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
    a.download = `${document.title}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Register menu command to open the tool
  GM_registerMenuCommand('Open Movie Tool', createUI);
})();
