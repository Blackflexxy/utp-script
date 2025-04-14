// ==UserScript==
// @name         External Links on UNIT3D
// @namespace    N/A
// @version      0.9.9
// @description  Add links to other sites on the metadata section of a torrent item
// @match        *://*/torrents/*
// @match        *://*/requests/*
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.registerMenuCommand
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/maksii/utp-script/main/external-links.user.js
// @downloadURL  https://raw.githubusercontent.com/maksii/utp-script/main/external-links.user.js
// ==/UserScript==

(function () {
  "use strict";

  // Default configuration
  const DEFAULT_CONFIG = {
    ENABLED_SITES: [
      "KinoBaza",
      "Trakt",
      "Letterboxd",
      "Blutopia",
      "Aither",
      "Open Subtitles",
    ],
    ICON_FONT_SIZE: "24px",
    ICON_IMAGE_SIZE: "35px",
    CUSTOM_ICON_SIZES: {
      // Define custom sizes for specific sites
      AniDB: { width: "30px", height: "30px" },
    },
    API_KEYS: {
      // Store API keys for sites by type
      // "Blutopia": "your-api-key",
      // "Aither": "your-api-key",
    },
    INDEXER_BASE_URLS: {
      // Store base URLs for indexer sites
      "jackett_base_url": "http://localhost:9117",
      "prowlarr_base_url": "http://localhost:9696",
    },
    SHOW_RELEASE_COUNT: true, // Toggle to show/hide release count badges
    ENABLE_API_SUPPORT: false, // Toggle to enable/disable API calls
    SHOW_ICONS_WITHOUT_RELEASES: true, // Toggle to show icons even when no releases are found
    API_CACHE_EXPIRY: 30 * 60 * 1000, // Cache expiry time in milliseconds (30 minutes)
  };

  // Site Types
  const SITE_TYPES = {
    UNIT3D: "UNIT3D",
    STANDARD: "standard",
    TRACKER: "tracker",
    INDEXER: "indexer",
    // Can add more types here in the future
  };

  // Sites configuration
  const MOVIE_ONLY_SITES = ["Letterboxd", "PassThePopcorn", "Anthelion", "ReelFlix"];
  const TV_ONLY_SITES = ["BroadcasTheNet", "TV Vault"];

  const SITES = [
    {
      name: "KinoBaza",
      icon: "https://kinobaza.com.ua/assets/img/kinobazav4.svg",
      imdbSearchUrl:
        "https://kinobaza.com.ua/api/external?q=https://www.imdb.com/title/$Id",
      tmdbSearchUrl:
        "https://kinobaza.com.ua/api/external?q=https://www.themoviedb.org/tv/$Id",
      nameSearchUrl: "",
      type: SITE_TYPES.STANDARD,
    },
    {
      name: "Trakt",
      icon: "https://trakt.tv/assets/logos/logomark.square.gradient-b644b16c38ff775861b4b1f58c1230f6a097a2466ab33ae00445a505c33fcb91.svg",
      imdbSearchUrl: "https://trakt.tv/search/imdb/$Id",
      tmdbSearchUrl: "https://trakt.tv/search/tmdb/$Id",
      nameSearchUrl: "https://trakt.tv/search?query=$Id",
      type: SITE_TYPES.STANDARD,
    },
    {
      name: "Letterboxd",
      icon: "https://a.ltrbxd.com/logos/letterboxd-decal-dots-pos-rgb.svg",
      imdbSearchUrl: "https://letterboxd.com/imdb/$Id",
      tmdbSearchUrl: "https://letterboxd.com/tmdb/$Id",
      nameSearchUrl: "https://letterboxd.com/search/?q=$Id",
      type: SITE_TYPES.STANDARD,
    },
    {
        name: 'Serializd',
        icon: 'circle-s',
        imdbSearchUrl: '',
        tmdbSearchUrl: 'https://serializd.com/show/$Id',
        nameSearchUrl: 'https://www.serializd.com/search?searchQuery=$Id',
        type: SITE_TYPES.STANDARD,
    },
    {
      name: "AniList",
      icon: "https://anilist.co/img/icons/icon.svg",
      imdbSearchUrl: "",
      tmdbSearchUrl: "",
      nameSearchUrl: "https://anilist.co/search/anime?search=$Id",
      type: SITE_TYPES.STANDARD,
    },
    {
      name: "AniDB",
      icon: "https://upload.wikimedia.org/wikipedia/commons/e/ec/AniDB_apple-touch-icon.png",
      imdbSearchUrl: "",
      tmdbSearchUrl: "",
      nameSearchUrl:
        "https://anidb.net/search/anime/?adb.search=$Id&do.search=1",
      type: SITE_TYPES.STANDARD,
    },
    {
      name: "Open Subtitles",
      icon: "fa-solid fa-closed-captioning",
      imdbSearchUrl:
        "https://www.opensubtitles.org/en/search/sublanguageid-all/imdbid-$Id",
      tmdbSearchUrl: "",
      nameSearchUrl:
        "https://www.opensubtitles.org/en/search2/sublanguageid-all/moviename-$Id",
      type: SITE_TYPES.STANDARD,
    },
    {
      name: "UTP",
      icon: "fa-brands fa-galactic-republic",
      imdbSearchUrl: "https://utp.to/torrents?&imdbId=$Id&sortField=size",
      tmdbSearchUrl: "https://utp.totorrents?&tmdbId=$Id&sortField=size",
      nameSearchUrl: "https://utp.to/torrents?&name=$Id&sortField=size",
      type: SITE_TYPES.UNIT3D,
    },
    {
      name: "Aither",
      icon: "fa-light fa-tv-retro",
      imdbSearchUrl: "https://aither.cc/torrents?&imdbId=$Id&sortField=size",
      tmdbSearchUrl: "https://aither.cc/torrents?&tmdbId=$Id&sortField=size",
      nameSearchUrl: "https://aither.cc/torrents?&name=$Id&sortField=size",
      type: SITE_TYPES.UNIT3D,
    },
    {
      name: "Blutopia",
      icon: "fa fa-rocket",
      imdbSearchUrl: "https://blutopia.cc/torrents?&imdbId=$Id&sortField=size",
      tmdbSearchUrl: "https://blutopia.cc/torrents?&tmdbId=$Id&sortField=size",
      nameSearchUrl: "https://blutopia.cc/torrents?&name=$Id&sortField=size",
      type: SITE_TYPES.UNIT3D,
    },
    {
      name: "PassThePopcorn",
      icon: "fa fa-film",
      imdbSearchUrl:
        "https://passthepopcorn.me/torrents.php?action=advanced&searchstr=$Id",
      tmdbSearchUrl: "",
      nameSearchUrl:
        "https://passthepopcorn.me/torrents.php?action=advanced&searchstr=$Id",
      type: SITE_TYPES.TRACKER,
    },
    {
      name: "BroadcasTheNet",
      icon: "fa-solid fa-power-off",
      imdbSearchUrl:
        "https://broadcasthe.net/torrents.php?action=advanced&imdb=$Id",
      tmdbSearchUrl: "",
      nameSearchUrl:
        "https://broadcasthe.net/torrents.php?action=advanced&artistname=$Id",
      type: SITE_TYPES.TRACKER,
    },
    {
      name: "BeyondHD",
      icon: "fa fa-circle-star",
      imdbSearchUrl:
        "https://beyond-hd.me/torrents?search=&doSearch=Search&imdb=$Id",
      tmdbSearchUrl:
        "https://beyond-hd.me/torrents?search=&doSearch=Search&tmdb=$Id",
      nameSearchUrl: "https://beyond-hd.me/torrents?search=$Id&doSearch=Search",
      type: SITE_TYPES.TRACKER,
    },
    {
      name: "Upload.cx",
      icon: "fa fa-upload",
      imdbSearchUrl: "https://upload.cx/torrents?imdbId=$Id",
      tmdbSearchUrl: "https://upload.cx/torrents?tmdbId=$Id",
      nameSearchUrl: "https://upload.cx/torrents?name=$Id",
      type: SITE_TYPES.UNIT3D,
    },
    {
      name: "LST.gg",
      icon: "fa fa-duck",
      imdbSearchUrl: "https://lst.gg/torrents?imdbId=$Id",
      tmdbSearchUrl: "https://lst.gg/torrents?tmdbId=$Id",
      nameSearchUrl: "https://lst.gg/torrents?name=$Id",
      type: SITE_TYPES.UNIT3D,
    },
    {
      name: "FearNoPeer",
      icon: "fa fa-teddy-bear",
      imdbSearchUrl: "https://fearnopeer.com/torrents?imdbId=$Id",
      tmdbSearchUrl: "https://fearnopeer.com/torrents?tmdbId=$Id",
      nameSearchUrl: "https://fearnopeer.com/torrents?name=$Id",
      type: SITE_TYPES.UNIT3D,
    },
    {
      name: "OldToons",
      icon: "fa fa-cat",
      imdbSearchUrl: "https://oldtoons.world/torrents?imdbId=$Id",
      tmdbSearchUrl: "https://oldtoons.world/torrents?tmdbId=$Id",
      nameSearchUrl: "https://oldtoons.world/torrents?name=$Id",
      type: SITE_TYPES.UNIT3D,
    },
    {
      name: "OnlyEncodes",
      icon: "fa fa-bolt",
      imdbSearchUrl: "https://onlyencodes.cc/torrents?imdbId=$Id",
      tmdbSearchUrl: "https://onlyencodes.cc/torrents?tmdbId=$Id",
      nameSearchUrl: "https://onlyencodes.cc/torrents?name=$Id",
      type: SITE_TYPES.UNIT3D,
    },
    {
      name: "ReelFlix",
      icon: "fa fa-video",
      imdbSearchUrl: "https://reelflix.xyz/torrents?imdbId=$Id",
      tmdbSearchUrl: "https://reelflix.xyz/torrents?tmdbId=$Id",
      nameSearchUrl: "https://reelflix.xyz/torrents?name=$Id",
      type: SITE_TYPES.UNIT3D,
    },
    {
      name: "UNO",
      icon: "fa fa-infinity",
      imdbSearchUrl: "https://hawke.uno/torrents?imdbId=$Id",
      tmdbSearchUrl: "https://hawke.uno/torrents?tmdbId=$Id",
      nameSearchUrl: "https://hawke.uno/torrents?name=$Id",
      type: SITE_TYPES.UNIT3D,
    },
    {
        name: 'AsianCinema',
        icon: 'dragon',
        imdbSearchUrl: 'https://eiga.moi/torrents?imdb=$Id',
        tmdbSearchUrl: 'https://eiga.moi/torrents?tmdb=$Id', //Not working
        nameSearchUrl: 'https://eiga.moi/torrents?name=$Id',
        type: SITE_TYPES.TRACKER,
    },
    {
        name: 'Cinemaggedon',
        icon: 'radiation',
        imdbSearchUrl: 'https://cinemageddon.net/browse.php?search=$Id',
        tmdbSearchUrl: '',
        nameSearchUrl: 'https://cinemageddon.net/browse.php?search=$Id',
        type: SITE_TYPES.TRACKER,
    },
    {
        name: 'PTerClub',
        icon: 'cat',
        imdbSearchUrl: 'https://pterclub.com/torrents.php?incldead=0&search_area=4&search=$Id&sort=5&type=desc',
        tmdbSearchUrl: '',
        nameSearchUrl: 'https://pterclub.com/torrents.php?incldead=0&search_area=4&search=$Id&sort=5&type=desc',
        type: SITE_TYPES.TRACKER,
    },
    {
        name: 'Cinematik',
        icon: 'clapperboard-play',
        imdbSearchUrl: 'https://cinematik.net/torrents?&imdbId=$Id&sortField=size',
        tmdbSearchUrl: 'https://cinematik.net/torrents?&tmdbId=$Id&sortField=size',
        nameSearchUrl: 'https://cinematik.net/torrents?&name=$Id&sortField=size',
        type: SITE_TYPES.TRACKER,
    },
    {
        name: 'HDBits',
        icon: 'high-definition',
        imdbSearchUrl: 'https://hdbits.org/browse.php?sort=size&d=DESC&search=$Id',
        tmdbSearchUrl: '',
        nameSearchUrl: 'https://hdbits.org/browse.php?search=$Id',
        type: SITE_TYPES.TRACKER,
    },
    {
      name: "Jackett",
      icon: "fa fa-shirt",
      imdbSearchUrl: "",
      tmdbSearchUrl: "",
      nameSearchUrl: "$BASE_URL/UI/Dashboard#search=$Id",
      type: SITE_TYPES.INDEXER,
      baseUrlConfigKey: "jackett_base_url",
    },
    {
      name: "Prowlarr",
      icon: "fa fa-search",
      imdbSearchUrl: "",
      tmdbSearchUrl: "",
      nameSearchUrl: "$BASE_URL/search?query=$Id",
      type: SITE_TYPES.INDEXER,
      baseUrlConfigKey: "prowlarr_base_url",
    },
  ];

  // Utility to save and load configuration
  async function saveConfig(config) {
    await GM.setValue("config", config);
  }

  async function loadConfig() {
    const savedConfig = await GM.getValue("config", DEFAULT_CONFIG);
    // Ensure CUSTOM_ICON_SIZES and API_KEYS are properly merged from default config
    return {
      ...DEFAULT_CONFIG,
      ...savedConfig,
      CUSTOM_ICON_SIZES: {
        ...DEFAULT_CONFIG.CUSTOM_ICON_SIZES,
        ...(savedConfig.CUSTOM_ICON_SIZES || {}),
      },
      API_KEYS: {
        ...DEFAULT_CONFIG.API_KEYS,
        ...(savedConfig.API_KEYS || {}),
      },
    };
  }

  // Create configuration UI
  async function showConfigUI() {
    const config = await loadConfig();
    const { ENABLED_SITES, ICON_FONT_SIZE, ICON_IMAGE_SIZE, API_KEYS, SHOW_RELEASE_COUNT, ENABLE_API_SUPPORT, API_CACHE_EXPIRY } = config;

    // Group sites by type for better organization
    const sitesByType = SITES.reduce((acc, site) => {
      const type = site.type || SITE_TYPES.STANDARD;
      if (!acc[type]) acc[type] = [];
      acc[type].push(site);
      return acc;
    }, {});

    // Add toggle for showing release count badges
    const showReleaseCount = config.SHOW_RELEASE_COUNT !== false ? "checked" : "";
    const enableApiSupport = config.ENABLE_API_SUPPORT === true ? "checked" : "";
    const showIconsWithoutReleases = config.SHOW_ICONS_WITHOUT_RELEASES !== false ? "checked" : "";

    const html = `
      <div>
        <h2>Configure External Links</h2>
        <button id="saveConfigBtn" style="margin-bottom: 20px;">Save</button>
        
        <!-- First row: Settings checkboxes -->
        <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
          <h3 style="margin-top: 0;">Settings</h3>
          <div style="margin-bottom: 10px;">
            <label>
              <input type="checkbox" id="showReleaseCount" ${showReleaseCount}>
              Show release count badges
            </label>
          </div>
          <div style="margin-bottom: 10px;">
            <label>
              <input type="checkbox" id="enableApiSupport" ${enableApiSupport}>
              Enable API support
            </label>
          </div>
          <div style="margin-bottom: 10px;">
            <label>
              <input type="checkbox" id="showIconsWithoutReleases" ${showIconsWithoutReleases}>
              Show icons even when no releases are found
            </label>
          </div>
        </div>
        
        <!-- Second row: STANDARD and INDEXER sites -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <!-- STANDARD sites -->
          <div style="flex: 1; margin-right: 10px; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
            <h3 style="margin-top: 0;">STANDARD</h3>
            ${sitesByType[SITE_TYPES.STANDARD] ? sitesByType[SITE_TYPES.STANDARD].map(site => `
              <div>
                <label>
                  <input type="checkbox" value="${site.name}" ${ENABLED_SITES.includes(site.name) ? "checked" : ""}>
                  ${site.name}
                </label>
              </div>
            `).join("") : "No standard sites"}
          </div>
          
          <!-- INDEXER sites -->
          <div style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
            <h3 style="margin-top: 0;">INDEXER</h3>
            ${sitesByType[SITE_TYPES.INDEXER] ? sitesByType[SITE_TYPES.INDEXER].map(site => `
              <div>
                <label>
                  <input type="checkbox" value="${site.name}" ${ENABLED_SITES.includes(site.name) ? "checked" : ""}>
                  ${site.name}
                </label>
                <br>
                <input type="text" placeholder="Base URL" value="${config.INDEXER_BASE_URLS[site.baseUrlConfigKey] || ''}" class="indexerBaseUrl" data-site="${site.name}" data-config-key="${site.baseUrlConfigKey}">
              </div>
            `).join("") : "No indexer sites"}
          </div>
        </div>
        
        <!-- Third row: TRACKER and UNIT3D sites -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <!-- TRACKER sites -->
          <div style="flex: 1; margin-right: 10px; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
            <h3 style="margin-top: 0;">TRACKER</h3>
            ${sitesByType[SITE_TYPES.TRACKER] ? sitesByType[SITE_TYPES.TRACKER].map(site => `
              <div>
                <label>
                  <input type="checkbox" value="${site.name}" ${ENABLED_SITES.includes(site.name) ? "checked" : ""}>
                  ${site.name}
                </label>
              </div>
            `).join("") : "No tracker sites"}
          </div>
          
          <!-- UNIT3D sites -->
          <div style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
            <h3 style="margin-top: 0;">UNIT3D</h3>
            ${sitesByType[SITE_TYPES.UNIT3D] ? sitesByType[SITE_TYPES.UNIT3D].map(site => `
              <div>
                <label style="min-width: 120px;display: inline-block;">
                  <input type="checkbox" value="${site.name}" ${ENABLED_SITES.includes(site.name) ? "checked" : ""}>
                  ${site.name}
                </label>
                <input type="text" placeholder="API Key" value="${API_KEYS[site.name] || ''}" class="apiKey" data-site="${site.name}">
              </div>
            `).join("") : "No UNIT3D sites"}
          </div>
        </div>
      </div>
    `;

    const configDiv = document.createElement("div");
    configDiv.innerHTML = html;
    configDiv.style.position = "fixed";
    configDiv.style.top = "10%";
    configDiv.style.left = "50%";
    configDiv.style.transform = "translateX(-50%)";
    configDiv.style.backgroundColor = "#272323e3";
    configDiv.style.padding = "20px";
    configDiv.style.border = "1px solid black";
    configDiv.style.zIndex = "9999";
    configDiv.style.maxHeight = "85wh";
    configDiv.style.overflowY = "auto";
    configDiv.style.minWidth = "85vw"; // Make the settings wider (960px)
    document.body.appendChild(configDiv);

    document
      .getElementById("saveConfigBtn")
      .addEventListener("click", async () => {
        const checkboxes = configDiv.querySelectorAll('input[type="checkbox"]:not(#showReleaseCount):not(#enableApiSupport):not(#showIconsWithoutReleases)');
        const newEnabledSites = Array.from(checkboxes)
          .filter((checkbox) => checkbox.checked)
          .map((checkbox) => checkbox.value);

        // Collect API keys
        const apiKeyInputs = configDiv.querySelectorAll('input.apiKey');
        const newApiKeys = {};

        apiKeyInputs.forEach(input => {
          const site = input.getAttribute('data-site');
          const value = input.value.trim();

          if (value) {
            newApiKeys[site] = value;
          }
        });

        // Collect indexer base URLs
        const indexerBaseUrlInputs = configDiv.querySelectorAll('input.indexerBaseUrl');
        const newIndexerBaseUrls = {};

        indexerBaseUrlInputs.forEach(input => {
          const configKey = input.getAttribute('data-config-key');
          const value = input.value.trim();

          if (value) {
            newIndexerBaseUrls[configKey] = value;
          }
        });

        // Get show release count setting
        const showReleaseCount = document.getElementById('showReleaseCount').checked;
        const enableApiSupport = document.getElementById('enableApiSupport').checked;
        const showIconsWithoutReleases = document.getElementById('showIconsWithoutReleases').checked;

        config.ENABLED_SITES = newEnabledSites;
        config.API_KEYS = newApiKeys;
        config.INDEXER_BASE_URLS = newIndexerBaseUrls;
        config.SHOW_RELEASE_COUNT = showReleaseCount;
        config.ENABLE_API_SUPPORT = enableApiSupport;
        config.SHOW_ICONS_WITHOUT_RELEASES = showIconsWithoutReleases;

        await saveConfig(config);
        alert("Configuration saved! The page will now reload.");
        document.body.removeChild(configDiv);
        window.location.reload();
      });
  }

  // Add menu command to open configuration UI
  GM.registerMenuCommand("Configure Script", showConfigUI);

  // Main logic
  (async () => {
    const config = await loadConfig();
    const { ENABLED_SITES, ICON_FONT_SIZE, ICON_IMAGE_SIZE, API_KEYS, SHOW_RELEASE_COUNT, ENABLE_API_SUPPORT, API_CACHE_EXPIRY } = config;

    // Cache management functions
    async function getCachedApiResponse(cacheKey) {
      try {
        const cachedData = await GM.getValue(cacheKey);
        if (!cachedData) return null;
        
        // Check if cache is expired
        if (Date.now() - cachedData.timestamp > API_CACHE_EXPIRY) {
          console.log(`Cache expired for ${cacheKey}`);
          return null;
        }
        
        console.log(`Using cached data for ${cacheKey}`);
        return cachedData.data;
      } catch (error) {
        console.error(`Error retrieving cache for ${cacheKey}:`, error);
        return null;
      }
    }

    async function setCachedApiResponse(cacheKey, data) {
      try {
        await GM.setValue(cacheKey, {
          timestamp: Date.now(),
          data: data
        });
        console.log(`Cached data for ${cacheKey}`);
      } catch (error) {
        console.error(`Error caching data for ${cacheKey}:`, error);
      }
    }

    // Check for releases via API based on site type
    async function checkReleasesViaApi(site, imdbId, tmdbId) {
      return new Promise((resolve) => {
        // Skip API calls if API support is disabled
        if (!ENABLE_API_SUPPORT) {
          resolve({ hasReleases: true, count: 0 });
          return;
        }
        
        // Handle different site types
        if (site.type === SITE_TYPES.UNIT3D) {
          return checkUnit3dReleases(site, imdbId, tmdbId, resolve);
        }
        
        // For STANDARD and TRACKER types, use the same behavior
        if (site.type === SITE_TYPES.STANDARD || site.type === SITE_TYPES.TRACKER) {
          resolve({ hasReleases: true, count: 0 });
          return;
        }

        // Default behavior for unknown site types or those without API implementation
        resolve({ hasReleases: true, count: 0 });
      });
    }

    // Check specifically for UNIT3D releases
    async function checkUnit3dReleases(site, imdbId, tmdbId, resolve) {
      // Skip the check if no API key is available
      if (!API_KEYS[site.name]) {
        resolve({ hasReleases: true, count: 0, error: false }); // Default to showing the link if no API key
        return;
      }

      const baseUrl = new URL(site.imdbSearchUrl.replace('$Id', '')).origin;
      let apiUrl = `${baseUrl}/api/torrents/filter?`;

      // Add appropriate parameter based on available IDs
      if (tmdbId) {
        apiUrl += `tmdbId=${tmdbId}`;
      } else if (imdbId) {
        apiUrl += `imdbId=${imdbId}`;
      } else {
        resolve({ hasReleases: true, count: 0, error: false }); // Default to showing if no IDs available
        return;
      }

      // Create a cache key based on the site and ID
      const cacheKey = `api_cache_${site.name}_${tmdbId || imdbId}`;
      
      // Try to get cached response first
      getCachedApiResponse(cacheKey).then(cachedResponse => {
        if (cachedResponse) {
          // Use cached data
          resolve(cachedResponse);
          return;
        }
        
        // If no cached data or expired, make the API request
        GM.xmlHttpRequest({
          method: "GET",
          url: apiUrl,
          headers: {
            'Authorization': `Bearer ${API_KEYS[site.name]}`,
            'Accept': 'application/json',
          },
          responseType: "json",
          onload: function (response) {
            if (response.status === 200 && response.response) {
              const data = response.response;
              // Check if any torrents are found and get the count
              const releaseCount = data.data ? data.data.length : 0;
              const result = {
                hasReleases: releaseCount > 0,
                count: releaseCount,
                error: false
              };
              
              // Cache the successful response
              setCachedApiResponse(cacheKey, result);
              
              resolve(result);
            } else {
              console.error(`API request failed for ${site.name}:`, response);
              resolve({ hasReleases: true, count: 0, error: true }); // Indicate error
            }
          },
          onerror: function (err) {
            console.error(`API request error for ${site.name}:`, err);
            resolve({ hasReleases: true, count: 0, error: true }); // Indicate error
          }
        });
      });
    }

    // Function to create an external link element
    function createExternalLink(url, site, releaseCount, hasError = false) {
      let linkElement = document.createElement("a");
      let iconHtml = "";
      let image = site.icon.endsWith(".svg") || site.icon.endsWith(".png");

      const customSize = config.CUSTOM_ICON_SIZES?.[site.name];
      const iconWidth = customSize?.width || config.ICON_FONT_SIZE;
      const iconHeight =
        customSize?.height ||
        (image ? config.ICON_IMAGE_SIZE : config.ICON_FONT_SIZE);

      let badgeHtml = "";
      // Only show badges for UNIT3D sites
      if (site.type === SITE_TYPES.UNIT3D && SHOW_RELEASE_COUNT) {
        if (hasError) {
          // Show error indicator
          badgeHtml = `<span class="release-count-badge error-badge">!</span>`;
        } else if (releaseCount > 0 || config.SHOW_ICONS_WITHOUT_RELEASES) {
          // Show count (0 in red if no releases)
          const badgeClass = releaseCount > 0 ? "release-count-badge" : "release-count-badge zero-badge";
          badgeHtml = `<span class="${badgeClass}">${releaseCount}</span>`;
        }
      }

      if (site.icon.startsWith("http") && image) {
        iconHtml = `
          <div class="icon-container">
            <img src="${site.icon}" alt="${site.name}" style="width:${iconWidth}; height:${iconHeight};">
            ${badgeHtml}
          </div>`;
      } else {
        iconHtml = `
          <div class="icon-container">
            <i class="${site.icon}" style="font-size:${iconWidth};"></i>
            ${badgeHtml}
          </div>`;
      }

      linkElement.innerHTML = `<a href="${url}" title="${site.name}" target="_blank" class="meta-id-tag">${iconHtml}<div></div></a>`;
      return linkElement;
    }

    // New function to handle link preparation and collection
    async function prepareLink(site, imdbId, tmdbId, mediaTitle) {
      let searchUrl = "";
      if (imdbId != "" && site.imdbSearchUrl != "") {
        searchUrl = site.imdbSearchUrl.replace("$Id", imdbId);
      } else if (tmdbId != "" && site.tmdbSearchUrl != "") {
        searchUrl = site.tmdbSearchUrl.replace("$Id", tmdbId);
      } else if (mediaTitle != "" && site.nameSearchUrl != "") {
        searchUrl = site.nameSearchUrl.replace("$Id", mediaTitle);
      }

      if (searchUrl === "") {
        return null; // No valid URL, skip this site
      }

      // Handle INDEXER type sites
      if (site.type === SITE_TYPES.INDEXER) {
        const baseUrl = config.INDEXER_BASE_URLS[site.baseUrlConfigKey];
        if (!baseUrl) {
          console.log(`No base URL configured for ${site.name}, skipping`);
          return null;
        }
        searchUrl = searchUrl.replace("$BASE_URL", baseUrl);
      }

      // Special handling for KinoBaza
      if (site.name === "KinoBaza") {
        try {
          const response = await new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
              method: "GET",
              url: searchUrl,
              responseType: "json",
              onload: resolve,
              onerror: reject
            });
          });
          
          if (response.response && response.response.url) {
            return {
              site: site,
              url: response.response.url,
              count: 0,
              error: false
            };
          }
          return null;
        } catch (err) {
          console.error("KinoBaza fetch failed:", err);
          return {
            site: site,
            url: searchUrl,
            count: 0,
            error: true
          };
        }
      }

      // Check for releases on sites with API support if API key is available
      if (site.type !== SITE_TYPES.STANDARD && site.type !== SITE_TYPES.TRACKER && site.type !== SITE_TYPES.INDEXER && API_KEYS[site.name]) {
        const result = await checkReleasesViaApi(site, imdbId, tmdbId);
        if (result.hasReleases || config.SHOW_ICONS_WITHOUT_RELEASES) {
          return {
            site: site,
            url: searchUrl,
            count: result.count,
            error: result.error
          };
        } else {
          console.log(`No releases found on ${site.name}, hiding link`);
          return null;
        }
      } else {
        // For sites without API support or without API keys, include link as usual
        return {
          site: site,
          url: searchUrl,
          count: 0,
          error: false
        };
      }
    }

    (function () {
      "use strict";
      // I recommend using DecentralEyes so that stylesheets are not loaded from CloudFlare, but locally:
      // Latest Font Awesome version to use Letterboxd's icon
      document.head.insertAdjacentHTML(
        "beforeend",
        '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/brands.min.css" integrity="sha512-8RxmFOVaKQe/xtg6lbscU9DU0IRhURWEuiI0tXevv+lXbAHfkpamD4VKFQRto9WgfOJDwOZ74c/s9Yesv3VvIQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />'
      );
      // The IMDB icon of the more recent Font Awesome versions is unreadable
      document.head.insertAdjacentHTML(
        "beforeend",
        '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/brands.min.css" integrity="sha512-sVSECYdnRMezwuq5uAjKQJEcu2wybeAPjU4VJQ9pCRcCY4pIpIw4YMHIOQ0CypfwHRvdSPbH++dA3O4Hihm/LQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />'
      );

      //Style changes
      const overriddenStyles = `
        .meta__ids {
            column-gap: 0;
            flex-direction: row;
            flex-wrap: wrap;
        }

        .meta-id-tag {
            font-size: ${ICON_FONT_SIZE};
            padding: 0 10px;
        }

        .meta__description {
            margin-top: 2px;
        }

        .icon-container {
            position: relative;
            display: inline-block;
        }

        .release-count-badge {
            position: absolute;
            top: -10px;
            right: -10px;
            background-color: #28a745;
            color: white;
            border-radius: 50%;
            font-size: 12px;
            min-width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            padding: 0 4px;
            box-shadow: 0 0 3px rgba(0,0,0,0.3);
        }
        
        .release-count-badge.zero-badge {
            background-color: #dc3545;
        }
        
        .release-count-badge.error-badge {
            background-color: #ffc107;
            color: #212529;
        }
    `;
      const stylesheet = new CSSStyleSheet();
      stylesheet.replaceSync(overriddenStyles);
      document.adoptedStyleSheets = [stylesheet];

      let imdbId = "";
      let tmdbId = "";
      //let tvdbId = '';
      let isMovie = "";

      if (document.querySelector(".meta__tmdb") !== null) {
        const tmdbLi = document.querySelector(".meta__tmdb");
        const url = tmdbLi.querySelector("a").href;
        const id = url.match(/\/(\d+)$/)[1];
        tmdbId = id;
        isMovie = url.includes("/movie");
      }
      if (document.querySelector(".meta__imdb") !== null) {
        const imdbLi = document.querySelector(".meta__imdb");
        imdbId = imdbLi.children[0].href.split("/").pop();
      }

      if (document.querySelector(".meta__mal") !== null) {
        const malLi = document.querySelector(".meta__mal");
        const malLink = malLi.children[0];
        const malImg = malLink.querySelector("img");

        // Replace the image URL
        if (malImg) {
          malImg.src = "https://simpleicons.org/icons/myanimelist.svg";

          // Apply size and filter styles
          malImg.style.width = "40px";
          malImg.style.height = "35px";
          malImg.style.filter =
            "invert(91%) sepia(6%) saturate(0%) hue-rotate(180deg) brightness(94%) contrast(88%)";
        }
      }

      const mediaTitle = document.querySelector(".meta__title")
        ? document.querySelector(".meta__title").outerText
        : document.querySelector(".movie-heading a").outerText;

      if (isMovie === "") {
        isMovie = document
          .querySelector("main article")
          .querySelectorAll("ul")[2]
          .children[0].textContent.includes("Movie");
      }

      // Function to parse torrent__name and extract the title
      function parseTorrentName(torrentName, isMovie) {
        if (isMovie) {
          // Extract title until the year (assumes year is a 4-digit number)
          let match = torrentName.match(/^(.*?)(\s\d{4})/);
          return match ? match[1].trim() : torrentName;
        } else {
          // Extract title before the season/series info (e.g., "S01E01", "Season 1", etc.)
          let match = torrentName.match(
            /^(.*?)(\s[Ss]\d{1,2}[Ee]\d{1,2}|\s[Ss]eason\s\d+)/
          );
          return match ? match[1].trim() : torrentName;
        }
      }

      // Extract torrent__name from the page
      const torrentNameElement = document.querySelector(".torrent__name"); // Adjust this selector based on the actual structure of the page
      const torrentName = torrentNameElement
        ? torrentNameElement.textContent.trim()
        : "";

      // Determine if it's a movie or not
      let extractedTitle = "";
      if (torrentName) {
        extractedTitle = parseTorrentName(torrentName, isMovie);
      }

      // Update AniList and AniDB links to use the parsed title
      const aniListLink = SITES.find((site) => site.name === "AniList");
      const aniDbLink = SITES.find((site) => site.name === "AniDB");

      if (aniListLink && extractedTitle) {
        aniListLink.nameSearchUrl = aniListLink.nameSearchUrl.replace(
          "$Id",
          encodeURIComponent(extractedTitle)
        );
      }
      if (aniDbLink && extractedTitle) {
        aniDbLink.nameSearchUrl = aniDbLink.nameSearchUrl.replace(
          "$Id",
          encodeURIComponent(extractedTitle)
        );
      }

      // Filter sites based on media type (movie or TV)
      let filteredSites = [];
      if (!isMovie) {
        filteredSites = SITES.filter(
          (site) => !MOVIE_ONLY_SITES.includes(site.name)
        );
      } else {
        filteredSites = SITES.filter(
          (site) => !TV_ONLY_SITES.includes(site.name)
        );
      }

      // Get the current site URL to avoid adding links to the same site
      const currentSiteURL = window.location.origin;
      const externalLinksUl = document.querySelector(".meta__ids");

      // Collect all enabled sites that should be displayed
      const enabledSitesMap = {};
      ENABLED_SITES.forEach((siteName, index) => {
        enabledSitesMap[siteName] = index;
      });

      // Filter the sites that should be added
      const sitesToProcess = filteredSites.filter(site => {
        // First check if the site is enabled
        if (!ENABLED_SITES.includes(site.name)) {
          return false;
        }
        
        // For INDEXER type sites, we need to check if the base URL is configured
        if (site.type === SITE_TYPES.INDEXER) {
          const baseUrl = config.INDEXER_BASE_URLS[site.baseUrlConfigKey];
          if (!baseUrl) {
            return false;
          }
          // For INDEXER sites, we don't need to check against currentSiteURL
          return true;
        }
        
        // For other site types, check if the site is not the current site
        return !site.nameSearchUrl || new URL(site.nameSearchUrl.replace('$Id', '')).origin !== currentSiteURL;
      });

      // Sort sites to match order in ENABLED_SITES
      sitesToProcess.sort((a, b) => {
        const indexA = enabledSitesMap[a.name] !== undefined ? enabledSitesMap[a.name] : Infinity;
        const indexB = enabledSitesMap[b.name] !== undefined ? enabledSitesMap[b.name] : Infinity;
        return indexA - indexB;
      });

      // Process all sites in order and add links
      (async () => {
        // Prepare all links (this creates an array of promises)
        const linkPromises = sitesToProcess.map(site => 
          prepareLink(site, imdbId, tmdbId, mediaTitle)
        );

        // Wait for all link preparations to complete
        const preparedLinks = await Promise.all(linkPromises);
        
        // Filter out null results (sites that don't have valid links or no releases)
        const validLinks = preparedLinks.filter(link => link !== null);
        
        // Sort links according to the original order in ENABLED_SITES
        validLinks.sort((a, b) => {
          const indexA = enabledSitesMap[a.site.name] !== undefined ? enabledSitesMap[a.site.name] : Infinity;
          const indexB = enabledSitesMap[b.site.name] !== undefined ? enabledSitesMap[b.site.name] : Infinity;
          return indexA - indexB;
        });

        // Create and append links in the correct order
        validLinks.forEach(link => {
          const linkElement = createExternalLink(link.url, link.site, link.count, link.error);
          externalLinksUl.appendChild(linkElement);
        });
      })();
    })();
  })();
})();
