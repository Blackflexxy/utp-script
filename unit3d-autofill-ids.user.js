// ==UserScript==
// @name         BLU Autofill IDs and Keywords
// @version      1.2.4
// @description  Fetch and autofill TMDB, IMDb, TVDB, and MAL IDs, along with relevant keywords, on torrent and request pages. copypasted with changed match, as the author use pastbin only
// @author       Aesther
// @match        https://utp.to/torrents/create*
// @match        https://utp.to/requests/create*
// @grant        GM.xmlHttpRequest
// @grant        GM.addStyle
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.registerMenuCommand
// @updateURL    https://raw.githubusercontent.com/maksii/utp-script/main/unit3d-autofill-ids.user.js
// @downloadURL  https://raw.githubusercontent.com/maksii/utp-script/main/unit3d-autofill-ids.user.js
// ==/UserScript==

(function () {
    "use strict";

    // Function to prompt user to input their API key and save it using GM_setValue
    async function setTmdbApiKey() {
        const newKey = prompt("Please enter your TMDB API key:");
        if (newKey) {
            await GM.setValue("tmdb_key", newKey); // Save the API key
            alert("TMDB API key saved successfully!");
        } else {
            alert("No API key entered. Please try again.");
        }
    }

    // Function to change the API key
    async function changeTmdbApiKey() {
        const currentKey = await GM.getValue("tmdb_key", "");
        if (currentKey) {
            const newKey = prompt(`Current TMDB API key: ${currentKey}\nEnter a new TMDB API key:`);
            if (newKey) {
                await GM.setValue("tmdb_key", newKey);
                alert("TMDB API key updated successfully!");
            } else {
                alert("No new API key entered.");
            }
        } else {
            alert("No API key found. Please set the API key first.");
        }
    }

    // Function to delete the API key
    async function deleteTmdbApiKey() {
        const currentKey = await GM.getValue("tmdb_key", "");
        if (currentKey) {
            const confirmDelete = confirm("Are you sure you want to delete the TMDB API key?");
            if (confirmDelete) {
                await GM.setValue("tmdb_key", "");
                alert("TMDB API key deleted successfully.");
            }
        } else {
            alert("No API key found to delete.");
        }
    }

    // Register menu commands to allow setting, changing, and deleting the TMDB API key
    GM.registerMenuCommand("Set TMDB API Key", setTmdbApiKey);
    GM.registerMenuCommand("Change TMDB API Key", changeTmdbApiKey);
    GM.registerMenuCommand("Delete TMDB API Key", deleteTmdbApiKey);

    // Function to fetch the saved TMDB API key
    async function getTmdbApiKey() {
        const key = await GM.getValue("tmdb_key", ""); // Fetch the stored key (default is an empty string)
        return key;
    }

    (async function init() {
        const tmdb_key = await getTmdbApiKey(); // Get the API key

        if (!tmdb_key) {
            alert("Please set your TMDB API key using the Tampermonkey menu.");
            return;
        }

        function GM_xmlHttpRequest_promise(details) {
            return new Promise((resolve, reject) => {
                GM.xmlHttpRequest({
                    ...details,
                    onload: resolve,
                    onerror: reject,
                });
            });
        }

        // Function to build the search URL for TMDb
        function buildSearchURL(type, name, year) {
            let url = `https://api.themoviedb.org/3/search/${type}?api_key=${tmdb_key}&language=en-US&query=${encodeURIComponent(name)}&page=1&include_adult=false`;
            if (year) {
                url += `&year=${year}`;
            }
            return url;
        }

        // Function to display a popup when multiple search results are found
        function showSelectionPopup(results, type) {
            return new Promise((resolve) => {
                let selection;

                if (type === "tv") {
                    selection = prompt("Multiple results found. Please choose one:\n" +
                        results.map((result, index) => `${index + 1}: ${result.name} (${result.first_air_date ? result.first_air_date.split("-")[0] : 'No date available'})`).join("\n"));
                } else {
                    selection = prompt("Multiple results found. Please choose one:\n" +
                        results.map((result, index) => `${index + 1}: ${result.title} (${result.release_date ? result.release_date.split("-")[0] : 'No date available'})`).join("\n"));
                }

                const index = parseInt(selection, 10) - 1;
                if (index >= 0 && index < results.length) {
                    resolve(index);
                } else {
                    resolve(-1);
                }
            });
        }

        // Function to fetch data from an API
        async function fetchData(url) {
            try {
                const response = await GM_xmlHttpRequest_promise({
                    method: "GET",
                    url: url,
                });
                return JSON.parse(response.responseText);
            } catch (error) {
                console.error("Error fetching data:", error.message);
                alert("There was an error fetching data. Please try again.");
                return null;
            }
        }

        // Function to clear form fields
        function clearFields() {
            ["autotmdb", "autoimdb", "autotvdb", "automal", "autokeywords"].forEach(id => {
                const field = document.getElementById(id);
                if (field) field.value = '';
            });
        }

        // Function to set form field values
        function setFieldValue(fieldId, value) {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = value || 0;
            }
        }

        // Function to fetch MAL ID
        async function fetchMalId(searchTitle) {
            const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchTitle)}&limit=10`;
            const data = await fetchData(url);
            if (data && data.data && data.data.length > 0) {
                const mal_data = data.data.find(anime =>
                    anime.titles.some(t => t.title.toLowerCase() === searchTitle.toLowerCase())
                );
                return mal_data ? mal_data.mal_id : 0;
            }
            return 0;
        }

        // Function to fetch genres from TMDb
        async function fetchGenres(type) {
            const url = type === 'movie'
                ? `https://api.themoviedb.org/3/genre/movie/list?api_key=${tmdb_key}&language=en-US`
                : `https://api.themoviedb.org/3/genre/tv/list?api_key=${tmdb_key}&language=en-US`;

            const data = await fetchData(url);
            if (data && data.genres) {
                const genreMap = {};
                data.genres.forEach(genre => {
                    genreMap[genre.id] = genre.name;
                });
                return genreMap;
            }
            return {};
        }

        // Function to get genre names
        async function getGenreNames(genreIds, type) {
            if (!window.genreCache) {
                window.genreCache = {};
            }

            if (!window.genreCache[type]) {
                window.genreCache[type] = await fetchGenres(type);
            }

            return genreIds.map(genreId => window.genreCache[type][genreId] || "Unknown");
        }

        // Function to fetch IDs and external information
        async function fetchIds(type, url, title, year) {
            const data = await fetchData(url);
            if (!data || !data.results || data.results.length === 0) {
                alert(`No results found for "${title}" (${year ? year : 'no year specified'}).`);
                return null;
            }

            const results = data.results;
            let selectedIndex = 0; // Default to first result if only one result

            if (results.length > 1) {
                selectedIndex = await showSelectionPopup(results, type);
                if (selectedIndex === -1) {
                    alert("Selection canceled or invalid.");
                    return null;
                }
            }

            const selectedResult = results[selectedIndex];
            const tmdb_id = selectedResult.id;
            const genreNames = await getGenreNames(selectedResult.genre_ids, type);

            const externalIdsUrl = `https://api.themoviedb.org/3/${type}/${tmdb_id}/external_ids?api_key=${tmdb_key}`;
            const externalIds = await fetchData(externalIdsUrl);

            return {
                tmdb_id,
                imdb_id: externalIds ? externalIds.imdb_id.replace("tt", "").trim() : null,
                tvdb_id: externalIds ? externalIds.tvdb_id : null,
                mal_id: genreNames.includes("Animation") ? await fetchMalId(selectedResult.title || selectedResult.name) : null,
                keywords: genreNames,
            };
        }

        // Function to populate form fields with fetched data
        function populateFields(data) {
            if (!data) return;

            setFieldValue("autotmdb", data.tmdb_id);
            setFieldValue("autoimdb", data.imdb_id);
            setFieldValue("autotvdb", data.tvdb_id);
            setFieldValue("automal", data.mal_id);
            setFieldValue("autokeywords", data.keywords.join(', '));
        }

        // Function to clear existing external links before inserting new ones
        function clearExternalLinks() {
            const panelBody = document.querySelector("aside .panelV2 .panel__body");
            const existingContainer = panelBody.querySelector(".external-links-container");
            if (existingContainer) {
                existingContainer.remove(); // Clear previous links container
            }
        }

        // Function to insert external links into the form
        function insertExternalLinks(data, type) {
            const panelBody = document.querySelector("aside .panelV2 .panel__body");
            if (!panelBody || !data) return;

            clearExternalLinks(); // Clear old links

            const externalLinksContainer = document.createElement("div");
            externalLinksContainer.className = "external-links-container";

            if (data.tmdb_id) {
                externalLinksContainer.innerHTML += `<a href="https://www.themoviedb.org/${type}/${data.tmdb_id}" target="_blank"><img src="https://www.google.com/s2/favicons?sz=64&domain=themoviedb.org" alt="TMDB" style="width:16px; vertical-align:middle; margin-right:5px;"> TMDB</a><br>`;
            }
            if (data.imdb_id) {
                externalLinksContainer.innerHTML += `<a href="https://www.imdb.com/title/tt${data.imdb_id}" target="_blank"><img src="https://www.google.com/s2/favicons?sz=64&domain=imdb.com" alt="IMDb" style="width:16px; vertical-align:middle; margin-right:5px;"> IMDb</a><br>`;
            }
            if (data.tvdb_id) {
                externalLinksContainer.innerHTML += `<a href="https://thetvdb.com/?tab=series&id=${data.tvdb_id}" target="_blank"><img src="https://www.google.com/s2/favicons?sz=64&domain=thetvdb.com" alt="TVDB" style="width:16px; vertical-align:middle; margin-right:5px;"> TVDB</a><br>`;
            }
            if (data.mal_id) {
                externalLinksContainer.innerHTML += `<a href="https://myanimelist.net/anime/${data.mal_id}" target="_blank"><img src="https://www.google.com/s2/favicons?sz=64&domain=myanimelist.net" alt="MAL" style="width:16px; vertical-align:middle; margin-right:5px;"> MAL</a><br>`;
            }

            panelBody.appendChild(externalLinksContainer);
        }

        // Function to handle "Fetch IDs" button click
        async function onFetchClick(e) {
            e.preventDefault();

            const titleElement = document.getElementById("title");
            if (!titleElement) {
                alert('Title element not found.');
                return;
            }

            let title = titleElement.value.trim();
            if (!title) {
                alert('Please enter a title.');
                return;
            }

            const isRequestPage = window.location.href.includes("/requests/create");
            const categoryElement = isRequestPage ? document.getElementById("category_id") : document.getElementById("autocat");

            if (!categoryElement) {
                alert('Category element not found.');
                return;
            }

            const categoryValue = categoryElement.value;
            const type = getTypeFromCategory(categoryValue);
            if (!type) {
                alert('Invalid category selected.');
                return;
            }

            const yearMatch = title.match(/\((\d{4})\)|\b(\d{4})\b/);
            const year = yearMatch ? yearMatch[1] || yearMatch[2] : null;
            title = year ? title.replace(year, "").trim() : title;

            const url = buildSearchURL(type, title, year);
            clearFields(); // Clear fields before fetching new data

            const fetchedData = await fetchIds(type, url, title, year);
            if (fetchedData) {
                populateFields(fetchedData);
                insertExternalLinks(fetchedData, type);
            }
        }

        // Create "Fetch IDs" button and event handler with style
        function createFetchButton() {
            const form = document.querySelector("#upload-form") || document.querySelector(".panelV2 form");
            if (!form) {
                console.error("Upload form not found. Exiting script.");
                return;
            }

            const fetchContainer = document.createElement("div");
            fetchContainer.id = "fetch-container";

            const fetchButton = document.createElement("button");
            fetchButton.textContent = "Fetch IDs";
            fetchButton.addEventListener("click", onFetchClick);
            fetchButton.id = "fetch";
            fetchButton.className = "fetch";

            const fetchInfo = document.createElement("p");
            fetchInfo.textContent = "Add a title (Title + Year). Select a category and then click fetch.";
            fetchInfo.id = "fetch-info";

            fetchContainer.append(fetchButton);
            fetchContainer.append(fetchInfo);
            form.prepend(fetchContainer);

            // Add styles for the fetch button and external links
            GM.addStyle(`
                #fetch-container {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: flex-start;
                    width: 100%;
                }

                #fetch-info {
                    margin-left: 10px;
                    color: #f39c12;
                }

                #fetch.fetch {
                    padding: 8px 12px;
                    font-size: 13px;
                    display: inline-flex;
                    font-weight: 600;
                    color: hsl(0, 0%, 100%);
                    border-radius: 9999px;
                    background-color: hsl(120, 20%, 40%);
                    border: none;
                    text-decoration: none;
                    cursor: pointer;
                }

                .external-links-container {
                    margin-top: 15px;
                    padding: 10px;
                    border-top: 1px solid #ccc;
                }

                .external-links-container a {
                    color: #3498db;
                    text-decoration: none;
                }

                .external-links-container a:hover {
                    text-decoration: underline;
                }
            `);
        }

        // Helper function to get type based on category selection
        function getTypeFromCategory(categoryValue) {
            switch (categoryValue) {
                case "1":
                    return "movie";
                case "2":
                    return "tv";
                case "3":
                    return "fanres";
                case "5":
                    return "trailer";
                default:
                    return null;
            }
        }

        createFetchButton();

    })();

})();
