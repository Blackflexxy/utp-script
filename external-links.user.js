// ==UserScript==
// @name         External Links on UNIT3D
// @namespace    N/A
// @version      0.3
// @description  Add links to other sites on the metadata section of a torrent item
// @author       Valie (additions by Audionut)
// @match        *://*/torrents/*
// @match        *://*/requests/*
// ==/UserScript==

//TODO: Grab/parse media title from torrent title, not metadata title

/* CONFIGURATION */
// 'Letterboxd', 'Rotten Tomatoes', 'PassThePopcorn', 'BroadcasTheNet', 'HDBits', 'Cinematik', 'Karagarga', 'BeyondHD', 'Blutopia', 'AsianCinema', 'Cinemaggedon', 'PTerClub', 'MoreThanTV', 'Aither', 'Anthelion', 'Retroflix', 'TV Vault', 'HUNO', 'Open Subtitles'
const ENABLED_SITES = ['Letterboxd', 'Blutopia', 'Aither', 'Open Subtitles'];
const ICON_FONT_SIZE = '24px';
/* ------------- */

const MOVIE_ONLY_SITES = ['Letterboxd', 'PassThePopcorn', 'Anthelion'];
const TV_ONLY_SITES = ['BroadcasTheNet', 'TV Vault'];

const SITES = [{
        name: 'Letterboxd',
        icon: 'fa-brands fa-square-letterboxd',
        imdbSearchUrl: 'https://letterboxd.com/imdb/$Id',
        tmdbSearchUrl: 'https://letterboxd.com/tmdb/$Id',
        nameSearchUrl: 'https://letterboxd.com/search/?q=$Id'
    },
    {
        name: 'Rotten Tomatoes',
        icon: 'fa fa-tomato',
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
        name: 'HDBits',
        icon: 'fa fa-high-definition',
        imdbSearchUrl: 'https://hdbits.org/browse.php?sort=size&d=DESC&search=$Id',
        tmdbSearchUrl: '',
        nameSearchUrl: 'https://hdbits.org/browse.php?search=$Id'
    },
    {
        name: 'Cinematik',
        icon: 'fa-solid fa-clapperboard-play',
        imdbSearchUrl: 'https://cinematik.net/torrents?&imdbId=$Id&sortField=size',
        tmdbSearchUrl: 'https://cinematik.net/torrents?&tmdbId=$Id&sortField=size',
        nameSearchUrl: 'https://cinematik.net/torrents?&name=$Id&sortField=size'
    },
    {
        name: 'Karagarga',
        icon: 'fa fa-crow',
        imdbSearchUrl: 'https://karagarga.in/browse.php?search=$Id&search_type=imdb&sort=size&d=DESC',
        tmdbSearchUrl: '',
        nameSearchUrl: 'https://karagarga.in/browse.php?search=$Id&search_type=torrent'
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
        name: 'AsianCinema',
        icon: 'fa fa-dragon',
        imdbSearchUrl: 'https://asiancinema.me/torrents?imdb=$Id',
        tmdbSearchUrl: 'https://asiancinema.me/torrents?tmdb=$Id', //Not working
        nameSearchUrl: 'https://asiancinema.me/torrents?name=$Id'
    },
    {
        name: 'Cinemaggedon',
        icon: 'fa-solid fa-radiation',
        imdbSearchUrl: 'https://cinemageddon.net/browse.php?search=$Id',
        tmdbSearchUrl: '',
        nameSearchUrl: 'https://cinemageddon.net/browse.php?search=$Id'
    },
    {
        name: 'PTerClub',
        icon: 'fa fa-cat',
        imdbSearchUrl: 'https://pterclub.com/torrents.php?incldead=0&search_area=4&search=$Id&sort=5&type=desc',
        tmdbSearchUrl: '',
        nameSearchUrl: 'https://pterclub.com/torrents.php?incldead=0&search_area=4&search=$Id&sort=5&type=desc'
    },
    {
        name: 'MoreThanTV',
        icon: 'fa-light fa-tv',
        imdbSearchUrl: 'https://www.morethantv.me/torrents/browse?page=1&order_by=time&order_way=desc&=Search&=Reset&=Search&searchtext=$Id',
        tmdbSearchUrl: '',
        nameSearchUrl: 'https://www.morethantv.me/torrents/browse?page=1&order_by=time&order_way=desc&=Search&setdefault=Make Default&=Reset&=Search&searchtext=&action=advanced&title=$Id'
    },
    {
        name: 'Aither',
        icon: 'fa-light fa-tv-retro',
        imdbSearchUrl: 'https://aither.cc/torrents?&imdbId=$Id&sortField=size',
        tmdbSearchUrl: 'https://aither.cc/torrents?&imdbId=$Id&sortField=size',
        nameSearchUrl: 'https://aither.cc/torrents?&name=$Id&sortField=size'
    },
    {
        name: 'Anthelion',
        icon: 'fa-light fa-futbol',
        imdbSearchUrl: 'https://anthelion.me/torrents.php?searchstr=$Id',
        tmdbSearchUrl: '',
        nameSearchUrl: 'https://anthelion.me/torrents.php?searchstr=$Id'
    },
    {
        name: 'Retroflix',
        icon: 'fa-duotone fa-guitar',
        imdbSearchUrl: 'https://retroflix.club/browse?years%5B%5D=1890&years%5B%5D=2024&includingDead=1&promotionType=&bookmarked=&search=$Id&searchIn=4&termMatchKind=0&submit=',
        tmdbSearchUrl: '',
        nameSearchUrl: 'https://retroflix.club/browse?years%5B%5D=1890&years%5B%5D=2024&includingDead=1&promotionType=&bookmarked=&search=$Id&searchIn=0&termMatchKind=0&submit='
    },
    {
        name: 'TV Vault',
        icon: 'fa-light fa-vault',
        imdbSearchUrl: 'https://tv-vault.me/torrents.php?searchstr=&searchtags=&tags_type=1&groupdesc=&imdbid=$Id',
        tmdbSearchUrl: '',
        nameSearchUrl: 'https://tv-vault.me/torrents.php?searchstr=$Id'
    },
    {
        name: 'HUNO',
        icon: 'fa-duotone fa-00',
        imdbSearchUrl: 'https://hawke.uno/torrents?perPage=25&imdbId=$Id',
        tmdbSearchUrl: 'https://hawke.uno/torrents?perPage=25&tmdbId=$Id',
        nameSearchUrl: 'https://hawke.uno/torrents?perPage=25&name=$Id'
    },
    {
        name: 'Open Subtitles',
        icon: 'fa-solid fa-closed-captioning',
        imdbSearchUrl: 'https://www.opensubtitles.org/en/search/sublanguageid-all/imdbid-$Id',
        tmdbSearchUrl: '',
        nameSearchUrl: 'https://www.opensubtitles.org/en/search2/sublanguageid-all/moviename-$Id'
    }
];

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
        newLink.innerHTML = `<a href="${searchUrl}" title="${site.name}" target="_blank" class="meta-id-tag"><i class="${site.icon}"></i><div></div></a>`;
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

    if (document.querySelector('.meta__tmdb') != undefined) {
        const tmdbLi = document.querySelector('.meta__tmdb');
        tmdbId = tmdbLi.textContent.trim().split(' ').pop();
        tmdbLi.children[0].innerHTML = '<i class="fa-solid fa-film-simple"></i>';
        isMovie = tmdbLi.querySelector('a').href.includes('/movie');
    }

    if (document.querySelector('.meta__imdb') != undefined) {
        const imdbLi = document.querySelector('.meta__imdb');
        imdbId = imdbLi.children[0].href.split('/').pop();
        imdbLi.children[0].innerHTML = '<i class="fab fa-imdb"></i>';
    }

    if (document.querySelector('.meta__tvdb') != undefined) {
        const tvdbLi = document.querySelector('.meta__tvdb');
        //tvdbId = tvdbLi.textContent.trim().split(' ').pop();
        tvdbLi.children[0].innerHTML = '<i class="fa-solid fa-tv-retro"></i>';
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
    SITES.forEach((site) => {
        //Only add link if site is listed as an enabled site AND the URL doesn't match the site where the script is running
        if (sitesToAdd.includes(site.name) && new URL(site.nameSearchUrl).origin != currentSiteURL) {
            addLink(site, imdbId, tmdbId, mediaTitle, externalLinksUl);
        }
    });
})();
