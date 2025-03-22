// ==UserScript==
// @name         External Links on UNIT3D
// @namespace    N/A
// @version      0.8
// @description  Add links to other sites on the metadata section of a torrent item
// @match        *://*/torrents/*
// @match        *://*/requests/*
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.registerMenuCommand
// @updateURL    https://raw.githubusercontent.com/maksii/utp-script/main/external-links.user.js
// @downloadURL  https://raw.githubusercontent.com/maksii/utp-script/main/external-links.user.js
// ==/UserScript==

(function () {
    'use strict';

    // Default configuration
    const DEFAULT_CONFIG = {
        ENABLED_SITES: ['Trakt', 'Letterboxd', 'Blutopia', 'Aither', 'Open Subtitles'],
        ICON_FONT_SIZE: '24px',
        ICON_IMAGE_SIZE: '35px',
        CUSTOM_ICON_SIZES: {
            // Define custom sizes for specific sites
            'AniDB': { width: '30px', height: '30px' }
        }
    };

    // Sites configuration
    const MOVIE_ONLY_SITES = ['Letterboxd', 'PassThePopcorn', 'Anthelion'];
    const TV_ONLY_SITES = ['BroadcasTheNet', 'TV Vault'];

    const SITES = [
        {
            name: 'Trakt',
            icon: 'https://trakt.tv/assets/logos/logomark.square.gradient-b644b16c38ff775861b4b1f58c1230f6a097a2466ab33ae00445a505c33fcb91.svg',
            imdbSearchUrl: 'https://trakt.tv/search/imdb/$Id',
            tmdbSearchUrl: 'https://trakt.tv/search/tmdb/$Id',
            nameSearchUrl: 'https://trakt.tv/search?query=$Id'
        },
        {
            name: 'AniList',
            icon: 'https://anilist.co/img/icons/icon.svg',
            imdbSearchUrl: '',
            tmdbSearchUrl: '',
            nameSearchUrl: 'https://anilist.co/search/anime?search=$Id'
        },
        {
            name: 'AniDB',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/AniDB_apple-touch-icon.png',
            imdbSearchUrl: '',
            tmdbSearchUrl: '',
            nameSearchUrl: 'https://anidb.net/search/anime/?adb.search=$Id&do.search=1'
        },
        {
            name: 'Letterboxd',
            icon: 'https://a.ltrbxd.com/logos/letterboxd-decal-dots-pos-rgb.svg',
            imdbSearchUrl: 'https://letterboxd.com/imdb/$Id',
            tmdbSearchUrl: 'https://letterboxd.com/tmdb/$Id',
            nameSearchUrl: 'https://letterboxd.com/search/?q=$Id'
        },
        {
            name: 'Rotten Tomatoes',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Rotten_Tomatoes.svg',
            imdbSearchUrl: '',
            tmdbSearchUrl: '',
            nameSearchUrl: 'https://duckduckgo.com/?q=\\$Id+site%3Arottentomatoes.com'
        },
        {
            name: 'PassThePopcorn',
            icon: 'fa fa-film',
            imdbSearchUrl: 'https://passthepopcorn.me/torrents.php?action=advanced&searchstr=$Id',
            tmdbSearchUrl: '',
            nameSearchUrl: 'https://passthepopcorn.me/torrents.php?action=advanced&searchstr=$Id'
        },
        {
            name: 'BroadcasTheNet',
            icon: 'fa-solid fa-power-off',
            imdbSearchUrl: 'https://broadcasthe.net/torrents.php?action=advanced&imdb=$Id',
            tmdbSearchUrl: '',
            nameSearchUrl: 'https://broadcasthe.net/torrents.php?action=advanced&artistname=$Id'
        },
        {
            name: 'BeyondHD',
            icon: 'fa fa-circle-star',
            imdbSearchUrl: 'https://beyond-hd.me/torrents?search=&doSearch=Search&imdb=$Id',
            tmdbSearchUrl: 'https://beyond-hd.me/torrents?search=&doSearch=Search&tmdb=$Id',
            nameSearchUrl: 'https://beyond-hd.me/torrents?search=$Id&doSearch=Search'
        },
        {
            name: 'Blutopia',
            icon: 'fa fa-rocket',
            imdbSearchUrl: 'https://blutopia.cc/torrents?&imdbId=$Id&sortField=size',
            tmdbSearchUrl: 'https://blutopia.cc/torrents?&tmdbId=$Id&sortField=size',
            nameSearchUrl: 'https://blutopia.cc/torrents?&name=$Id&sortField=size'
        },
        {
            name: 'Aither',
            icon: 'fa-light fa-tv-retro',
            imdbSearchUrl: 'https://aither.cc/torrents?&imdbId=$Id&sortField=size',
            tmdbSearchUrl: 'https://aither.cc/torrents?&imdbId=$Id&sortField=size',
            nameSearchUrl: 'https://aither.cc/torrents?&name=$Id&sortField=size'
        },
        {
            name: 'UTP',
            icon: 'fa-brands fa-galactic-republic',
            imdbSearchUrl: 'https://utp.to/torrents?&imdbId=$Id&sortField=size',
            tmdbSearchUrl: 'https://utp.totorrents?&imdbId=$Id&sortField=size',
            nameSearchUrl: 'https://utp.to/torrents?&name=$Id&sortField=size'
        },
        {
            name: 'Open Subtitles',
            icon: 'fa-solid fa-closed-captioning',
            imdbSearchUrl: 'https://www.opensubtitles.org/en/search/sublanguageid-all/imdbid-$Id',
            tmdbSearchUrl: '',
            nameSearchUrl: 'https://www.opensubtitles.org/en/search2/sublanguageid-all/moviename-$Id'
        }
    ];

    // Utility to save and load configuration
    async function saveConfig(config) {
        await GM.setValue('config', config);
    }

    async function loadConfig() {
        const savedConfig = await GM.getValue('config', DEFAULT_CONFIG);
        // Ensure CUSTOM_ICON_SIZES is properly merged from default config
        return {
            ...DEFAULT_CONFIG,
            ...savedConfig,
            CUSTOM_ICON_SIZES: {
                ...DEFAULT_CONFIG.CUSTOM_ICON_SIZES,
                ...(savedConfig.CUSTOM_ICON_SIZES || {})
            }
        };
    }

    // Create configuration UI
    async function showConfigUI() {
        const config = await loadConfig();
        const enabledSites = config.ENABLED_SITES;

        const siteCheckboxes = SITES.map(site => {
            const isChecked = enabledSites.includes(site.name) ? 'checked' : '';
            return `
                <label>
                    <input type="checkbox" value="${site.name}" ${isChecked}>
                    ${site.name}
                </label><br>
            `;
        }).join('');

        const html = `
            <div>
                <h2>Configure Enabled Sites</h2>
                ${siteCheckboxes}
                <button id="saveConfigBtn">Save</button>
            </div>
        `;

        const configDiv = document.createElement('div');
        configDiv.innerHTML = html;
        configDiv.style.position = 'fixed';
        configDiv.style.top = '10%';
        configDiv.style.left = '50%';
        configDiv.style.transform = 'translateX(-50%)';
        configDiv.style.backgroundColor = '#272323e3';
        configDiv.style.padding = '20px';
        configDiv.style.border = '1px solid black';
        configDiv.style.zIndex = '9999';
        document.body.appendChild(configDiv);

        document.getElementById('saveConfigBtn').addEventListener('click', async () => {
            const checkboxes = configDiv.querySelectorAll('input[type="checkbox"]');
            const newEnabledSites = Array.from(checkboxes)
                .filter(checkbox => checkbox.checked)
                .map(checkbox => checkbox.value);

            config.ENABLED_SITES = newEnabledSites;
            await saveConfig(config);
            alert('Configuration saved!');
            document.body.removeChild(configDiv);
        });
    }

    // Add menu command to open configuration UI
    GM.registerMenuCommand('Configure Script', showConfigUI);

    // Main logic
    (async () => {
        const config = await loadConfig();
        const { ENABLED_SITES, ICON_FONT_SIZE, ICON_IMAGE_SIZE } = config;

        function addLink(site, imdbId, tmdbId, mediaTitle, externalLinksUl) {
            let searchUrl = '';
            if (imdbId != '' && site.imdbSearchUrl != '') {
                searchUrl = site.imdbSearchUrl.replace('$Id', imdbId);
            } else if (tmdbId != '' && site.tmdbSearchUrl != '') {
                searchUrl = site.tmdbSearchUrl.replace('$Id', tmdbId);
            } else if (mediaTitle != '' && site.nameSearchUrl != '') {
                searchUrl = site.nameSearchUrl.replace('$Id', mediaTitle);
            }
            if (searchUrl != '') {
                let newLink = document.createElement('a');
                let iconHtml = '';
                let image = site.icon.endsWith('.svg') || site.icon.endsWith('.png');

                // Get custom size from config if it exists
                const customSize = config.CUSTOM_ICON_SIZES?.[site.name];

                // Set default dimensions based on icon type
                const defaultWidth = ICON_FONT_SIZE;
                const defaultHeight = image ? ICON_IMAGE_SIZE : ICON_FONT_SIZE;

                // Use custom size if available, otherwise fall back to defaults
                const iconWidth = customSize?.width || defaultWidth;
                const iconHeight = customSize?.height || defaultHeight;

                if (site.icon.startsWith('http') && image) {
                    // If the icon is an SVG link
                    iconHtml = `<img src="${site.icon}" alt="${site.name}" style="width:${iconWidth}; height:${iconHeight};">`;
                } else {
                    // If the icon is a Font Awesome class
                    iconHtml = `<i class="${site.icon}" style="font-size:${iconWidth};"></i>`;
                }

                newLink.innerHTML = `<a href="${searchUrl}" title="${site.name}" target="_blank" class="meta-id-tag">${iconHtml}<div></div></a>`;
                externalLinksUl.appendChild(newLink);
            }
        }

        (function () {
            'use strict';
            // I recommend using DecentralEyes so that stylesheets are not loaded from CloudFlare, but locally:
            // Latest Font Awesome version to use Letterboxd's icon
            document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/brands.min.css" integrity="sha512-8RxmFOVaKQe/xtg6lbscU9DU0IRhURWEuiI0tXevv+lXbAHfkpamD4VKFQRto9WgfOJDwOZ74c/s9Yesv3VvIQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />');
            // The IMDB icon of the more recent Font Awesome versions is unreadable
            document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/brands.min.css" integrity="sha512-sVSECYdnRMezwuq5uAjKQJEcu2wybeAPjU4VJQ9pCRcCY4pIpIw4YMHIOQ0CypfwHRvdSPbH++dA3O4Hihm/LQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />');

            //Style changes
            const overriddenStyles = `
        .meta__ids {
            column-gap: 0;
        }

        .meta-id-tag {
            font-size: ${ICON_FONT_SIZE};
            padding: 0 10px;
        }

        .meta__description {
            margin-top: 2px;
        }
    `;
            const stylesheet = new CSSStyleSheet();
            stylesheet.replaceSync(overriddenStyles);
            document.adoptedStyleSheets = [stylesheet];

            let imdbId = '';
            let tmdbId = '';
            //let tvdbId = '';
            let isMovie = '';

            if (document.querySelector('.meta__tmdb') !== null) {
                const tmdbLi = document.querySelector('.meta__tmdb');
                tmdbId = tmdbLi.textContent.trim().split(' ').pop();
                isMovie = tmdbLi.querySelector('a').href.includes('/movie');
            }
            if (document.querySelector('.meta__imdb') !== null) {
                const imdbLi = document.querySelector('.meta__imdb');
                imdbId = imdbLi.children[0].href.split('/').pop();
            }

            if (document.querySelector('.meta__mal') !== null) {
                const malLi = document.querySelector('.meta__mal');
                const malLink = malLi.children[0];
                const malImg = malLink.querySelector('img');

                // Replace the image URL
                if (malImg) {
                    malImg.src = 'https://simpleicons.org/icons/myanimelist.svg';

                    // Apply size and filter styles
                    malImg.style.width = '40px';
                    malImg.style.height = '35px';
                    malImg.style.filter = 'invert(91%) sepia(6%) saturate(0%) hue-rotate(180deg) brightness(94%) contrast(88%)';
                }
            }

            const mediaTitle = document.querySelector('.meta__title').outerText;

            if (isMovie == '') {
                isMovie = document.querySelector('main article').querySelectorAll('ul')[2].children[0].textContent.includes('Movie');
            }

            let sitesToAdd = [];
            if (!isMovie) {
                sitesToAdd = ENABLED_SITES.filter(site => !MOVIE_ONLY_SITES.includes(site));
            } else {
                sitesToAdd = ENABLED_SITES.filter(site => !TV_ONLY_SITES.includes(site));
            }

            const externalLinksUl = document.querySelector('.meta__ids');
            const currentSiteURL = window.location.origin;

            // Function to parse torrent__name and extract the title
            function parseTorrentName(torrentName, isMovie) {
                if (isMovie) {
                    // Extract title until the year (assumes year is a 4-digit number)
                    let match = torrentName.match(/^(.*?)(\s\d{4})/);
                    return match ? match[1].trim() : torrentName;
                } else {
                    // Extract title before the season/series info (e.g., "S01E01", "Season 1", etc.)
                    let match = torrentName.match(/^(.*?)(\s[Ss]\d{1,2}[Ee]\d{1,2}|\s[Ss]eason\s\d+)/);
                    return match ? match[1].trim() : torrentName;
                }
            }

            // Extract torrent__name from the page (example: from a specific element or metadata)
            const torrentNameElement = document.querySelector('.torrent__name'); // Adjust this selector based on the actual structure of the page
            const torrentName = torrentNameElement ? torrentNameElement.textContent.trim() : '';

            // Determine if it's a movie or not
            let extractedTitle = '';
            if (torrentName) {
                extractedTitle = parseTorrentName(torrentName, isMovie);
            }

            // Update AniList and AniDB links to use the parsed title
            const aniListLink = SITES.find(site => site.name === 'AniList');
            const aniDbLink = SITES.find(site => site.name === 'AniDB');

            if (aniListLink && extractedTitle) {
                aniListLink.nameSearchUrl = aniListLink.nameSearchUrl.replace('$Id', encodeURIComponent(extractedTitle));
            }
            if (aniDbLink && extractedTitle) {
                aniDbLink.nameSearchUrl = aniDbLink.nameSearchUrl.replace('$Id', encodeURIComponent(extractedTitle));
            }

            SITES.forEach((site) => {
                //Only add link if site is listed as an enabled site AND the URL doesn't match the site where the script is running
                if (sitesToAdd.includes(site.name) && new URL(site.nameSearchUrl).origin != currentSiteURL) {
                    addLink(site, imdbId, tmdbId, mediaTitle, externalLinksUl);
                }
            });
        })();
    })();
})();
