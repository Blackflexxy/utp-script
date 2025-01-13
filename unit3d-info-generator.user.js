// ==UserScript==
// @name         MediaInfo Parser for Release
// @version      1.5
// @description  Parse MediaInfo and generate a table on /torrents/create
// @match        *://*/torrents/create
// @grant        none
// @updateURL    https://raw.githubusercontent.com/maksii/utp-script/main/unit3d-info-generator.user.js
// @downloadURL  https://raw.githubusercontent.com/maksii/utp-script/main/unit3d-info-generator.user.js
// ==/UserScript==

(function () {
    'use strict';

    console.log('MediaInfo Parser script loaded'); // Debugging log to confirm script runs

    // Use setInterval to repeatedly check for the target element
    const interval = setInterval(() => {
        const mediaInfoTextarea = document.querySelector('#upload-form-mediainfo');
        if (mediaInfoTextarea) {
            console.log('MediaInfo textarea found:', mediaInfoTextarea);

            // Once the element is found, clear the interval
            clearInterval(interval);

            // Locate the parent `.form__group` container
            const mediaInfoGroup = mediaInfoTextarea.closest('.form__group');
            if (!mediaInfoGroup) {
                console.error('Parent form group for MediaInfo textarea not found! Check the DOM structure.');
                return;
            }
            console.log('Parent form group found:', mediaInfoGroup);

            // Create the file upload input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'fileInput';
            fileInput.accept = '.txt';
            fileInput.style.marginRight = '10px';

            // Create a container for the table output
            const outputDiv = document.createElement('div');
            outputDiv.id = 'output';

            // Insert the file input before the textarea
            const uploadWrapper = document.createElement('div');
            uploadWrapper.style.display = 'flex';
            uploadWrapper.style.alignItems = 'center';
            uploadWrapper.appendChild(fileInput);

            try {
                mediaInfoGroup.parentNode.insertBefore(uploadWrapper, mediaInfoGroup);
                mediaInfoGroup.parentNode.insertBefore(outputDiv, mediaInfoGroup);
                console.log('UI elements added successfully');
            } catch (error) {
                console.error('Error adding UI elements:', error);
                return;
            }

            // Add event listener for file input
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        mediaInfoTextarea.value = e.target.result;
                        console.log('File content loaded into textarea');
                    };
                    reader.readAsText(file);
                } else {
                    console.warn('No file selected');
                }
            });

            // Add event listener for textarea changes
            mediaInfoTextarea.addEventListener('input', () => {
                const text = mediaInfoTextarea.value;
                if (text.trim()) {
                    console.log('Generating table for provided MediaInfo text');
                    const parsedData = parseMediaInfo(text);
                    renderData(parsedData);
                } else {
                    outputDiv.innerHTML = ''; // Clear the table if textarea is empty
                }
            });

            // Utility function to parse MediaInfo text
            function parseMediaInfo(text) {
                const sections = text.split("\n\n"); // Split sections by double newlines
                const rows = []; // Array to hold parsed data rows

                sections.forEach((section) => {
                    const lines = section.split("\n").filter((line) => line.trim() !== "");
                    const typeLine = lines.find((line) => line.startsWith("General") || line.startsWith("Video") || line.startsWith("Audio") || line.startsWith("Text") || line.startsWith("Chapters"));
                    if (!typeLine) return;

                    const type = typeLine.split(" ")[0].toLowerCase();

                    if (type === "video") {
                        const videoInfo = extractCommonInfo(lines);
                        videoInfo.type = "Video";
                        rows.push(videoInfo);
                    } else if (type === "audio") {
                        const audioInfo = extractAudioInfo(lines);
                        audioInfo.type = "Audio";
                        rows.push(audioInfo);
                    } else if (type === "text") {
                        const subtitleInfo = extractSubtitleInfo(lines);
                        subtitleInfo.type = "Subtitles";
                        rows.push(subtitleInfo);
                    }
                });

                return rows;
            }

            // Extract common information for Video, Audio, and Subtitles
            function extractCommonInfo(lines) {
                const getField = (field) => {
                    const line = lines.find((line) => line.startsWith(field));
                    return line ? line.split(":")[1].trim() : "";
                };

                // Extract language and remove dialect in parentheses
                let language = getField("Language") || "Unknown";
                language = language.replace(/\s*\([^)]*\)/g, '').trim();

                return {
                    type: "", // Will be set later
                    language: language,
                    default: getField("Default") === "Yes" ? "Yes" : "No",
                    forced: getField("Forced") === "Yes" ? "Yes" : "No",
                    enabled: getField("Enabled") === "Yes" ? "Yes" : "No",
                    title: getField("Title") || "",
                    format: getField("Format") || "Unknown",
                };
            }

            // Extract additional information for Audio
            function extractAudioInfo(lines) {
                const commonInfo = extractCommonInfo(lines);
                const getField = (field) => {
                    const line = lines.find((line) => line.trim().startsWith(field) && !line.trim().startsWith(field + " mode"));
                    return line ? line.split(":")[1].trim() : "";
                };

                // Format channels
                const channels = getField("Channel(s)").replace(" channels", "").replace(" channel", "");
                let formattedChannels;
                if (channels === "6") {
                    formattedChannels = "5.1";
                } else if (channels === "8") {
                    formattedChannels = "7.1";
                } else {
                    formattedChannels = channels + ".0";
                }

                // Convert bitrate to kbps
                const bitrate = getField("Bit rate").replace(" kb/s", " kbps").replace(/\s(?=\d)/g, "");

                // Format codec name (e.g., "AAC LC" -> "AAC")
                let codec = commonInfo.format;
                codec = formatCodecName(codec);

                // Build the format string
                commonInfo.format = `${commonInfo.language} | ${codec} | ${formattedChannels} | ${bitrate || "Unknown"}`;

                // Append Title to Format if Title doesn't start with "Country |"
                if (commonInfo.title && !commonInfo.title.startsWith(`${commonInfo.language} |`)) {
                    commonInfo.format += ` | ${commonInfo.title}`;
                }

                return commonInfo;
            }

            // Extract additional information for Subtitles
            function extractSubtitleInfo(lines) {
                const commonInfo = extractCommonInfo(lines);

                // Check for SDH in title
                if (commonInfo.title && commonInfo.title.includes('SDH')) {
                    commonInfo.format = `${commonInfo.language} | SDH`;
                } else {
                    commonInfo.format = commonInfo.forced === "Yes" ?
                        `${commonInfo.language} | Forced` :
                        `${commonInfo.language} | Full`;
                }

                // Append Title to Format if Title doesn't start with "Country |"
                if (commonInfo.title && !commonInfo.title.startsWith(`${commonInfo.language} |`)) {
                    commonInfo.format += ` | ${commonInfo.title}`;
                }

                return commonInfo;
            }

            // Format codec names (e.g., "AAC LC" -> "AAC")
            function formatCodecName(codec) {
                if (codec === "AAC LC") {
                    return "AAC";
                }
                if (codec === "MLP FBA") {
                    return "TrueHD Atmos";
                }
                if (codec === "MLP FBA 16-ch") {
                    return "TrueHD Atmos";
                }
                if (codec === "DTS XLL") {
                    return "DTS-HD MA";
                }

                return codec; // Return unmodified if no specific formatting is needed
            }

            function getCountryFlag(language) {
                const langToCodeMap = {
                    // Most spoken languages globally
                    Chinese: "cn",     // Mandarin Chinese
                    Spanish: "es",     // Spanish
                    English: "us",     // English
                    Hindi: "in",       // Hindi
                    Arabic: "sa",      // Arabic (using Saudi Arabia flag)
                    Bengali: "bd",     // Bengali (Bangladesh)
                    Portuguese: "pt",   // Portuguese
                    Russian: "ru",     // Russian
                    Japanese: "jp",     // Japanese
                    Punjabi: "in",     // Punjabi (using India flag)
                    German: "de",      // German
                    Javanese: "id",    // Javanese (using Indonesia flag)
                    Korean: "kr",      // Korean
                    French: "fr",      // French
                    Telugu: "in",      // Telugu (using India flag)
                    Marathi: "in",     // Marathi (using India flag)
                    Turkish: "tr",     // Turkish
                    Tamil: "in",       // Tamil (using India flag)
                    Vietnamese: "vn",   // Vietnamese
                    Italian: "it",     // Italian

                    // Additional languages
                    Thai: "th",
                    Greek: "gr",
                    Dutch: "nl",
                    Polish: "pl",
                    Romanian: "ro",
                    Hungarian: "hu",
                    Czech: "cz",
                    Swedish: "se",
                    Bulgarian: "bg",
                    Danish: "dk",
                    Finnish: "fi",
                    Norwegian: "no",
                    Hebrew: "il",
                    Ukrainian: "ua",
                    Persian: "ir",      // Iran
                    Indonesian: "id",
                    Malay: "my",       // Malaysia
                    Urdu: "pk",        // Pakistan
                    Cantonese: "hk",   // Hong Kong
                    Unknown: "unknown"  // Default flag for unknown languages
                };

                const countryCode = langToCodeMap[language] || "unknown";

                // Use HDInnovations logo for unknown languages
                if (countryCode === "unknown") {
                    return `<img src="/vendor/joypixels/png/64/1f6a8.png" alt="?" style="width: 20px; height: 14px; margin-right: 5px; vertical-align: middle;">`;
                }

                return `<img src="/img/flags/${countryCode}.png" alt="${language}" style="width: 20px; height: 14px; margin-right: 5px; vertical-align: middle;">`;
            }
            function enableCopyOnClick() {
                const cells = document.querySelectorAll('#output table td');
                cells.forEach(cell => {
                    cell.style.cursor = 'pointer';
                    cell.title = 'Click to copy';
                    cell.addEventListener('click', () => {
                        navigator.clipboard.writeText(cell.textContent).then(() => {
                            console.log(`Copied: ${cell.textContent}`);
                        }).catch(err => {
                            console.error('Failed to copy text: ', err);
                        });
                    });
                });
            }
            // Render the parsed data
            function renderData(rows) {
                outputDiv.innerHTML = ''; // Clear previous output

                if (rows.length === 0) {
                    outputDiv.innerHTML = '<p>No data found.</p>';
                    console.warn('No data parsed to render');
                    return;
                }

                // Generate table
                let table = '<table border="1" style="width: 100%; border-collapse: collapse;">';
                table += `
    <thead>
      <tr>
        <th>Type</th>
        <th>Language</th>
        <th>Default</th>
        <th>Forced</th>
        <th>Title</th>
        <th>Format</th>
        <th>Validation</th> <!-- New Validation column -->
      </tr>
    </thead>
    <tbody>
  `;

                function renderYesNoIcon(value) {
                    return value === "Yes" ? "✅" : "❌";
                }

                function renderValidationIcon(isValid) {
                    return isValid ? "✅" : "❌";
                }

                function validateRow(title, format) {
                    // Split "Title" and "Format" into components for comparison
                    const titleParts = title.split(" | ").map(part => part.trim());
                    const formatParts = format.split(" | ").map(part => part.trim());

                    // Compare each part of the "Format" with the corresponding part of the "Title"
                    for (let i = 0; i < formatParts.length; i++) {
                        if (formatParts[i] !== titleParts[i]) {
                            return false; // Mismatch found
                        }
                    }
                    return true; // All parts match
                }

                // Add this function to convert types to icons
                function getTypeIcon(type) {
                    const typeIcons = {
                        'Video': '🎬',
                        'Audio': '🔊',
                        'Subtitles': '💬'
                    };
                    return typeIcons[type] || type;
                }

                rows.forEach((row) => {
                    const isValid = validateRow(row.title, row.format);
                    table += `
      <tr>
        <td>${getTypeIcon(row.type)}</td>
        <td>${getCountryFlag(row.language)} ${row.language}</td>
        <td>${renderYesNoIcon(row.default)}</td>
        <td>${renderYesNoIcon(row.forced)}</td>
        <td>${row.title}</td>
        <td>${row.format}</td>
        <td>${renderValidationIcon(isValid)}</td>
      </tr>
    `;
                });

                table += '</tbody></table>';
                outputDiv.innerHTML = table;
                console.log('Table rendered successfully');
                enableCopyOnClick();
            }
        }
    }, 500); // Check every 500ms
})();
