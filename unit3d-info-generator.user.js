// ==UserScript==
// @name         MediaInfo Parser for Release
// @version      1.6
// @description  Parse MediaInfo and generate a table on /torrents/create and /torrents/*
// @match        *://*/torrents/create
// @match        *://*/torrents/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/maksii/utp-script/main/unit3d-info-generator.user.js
// @downloadURL  https://raw.githubusercontent.com/maksii/utp-script/main/unit3d-info-generator.user.js
// ==/UserScript==

class Config {
    constructor() {
        this.DOM_SELECTORS = {
            MEDIAINFO_TEXTAREA: '#upload-form-mediainfo',
            MEDIAINFO_GROUP: '.form__group',
            OUTPUT_DIV_CREATE: '#output',
            OUTPUT_DIV_VIEW: '#mediainfo-parser-output',
            VIEW_MEDIAINFO: 'code[x-ref="mediainfo"]'
        };

        this.UI_CONFIG = {
            FILE_INPUT_ID: 'fileInput',
            FILE_INPUT_ACCEPT: '.txt',
            FILE_INPUT_STYLE: {
                marginRight: '10px'
            },
            UPLOAD_WRAPPER_STYLE: {
                display: 'flex',
                alignItems: 'center'
            }
        };

        this.LANGUAGE_FLAGS = {
            Chinese: "cn",
            Spanish: "es",
            English: "us",
            Hindi: "in",
            Arabic: "sa",
            Bengali: "bd",
            Portuguese: "pt",
            Russian: "ru",
            Japanese: "jp",
            Punjabi: "in",
            German: "de",
            Javanese: "id",
            Korean: "kr",
            French: "fr",
            Telugu: "in",
            Marathi: "in",
            Turkish: "tr",
            Tamil: "in",
            Vietnamese: "vn",
            Italian: "it",
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
            Persian: "ir",
            Indonesian: "id",
            Malay: "my",
            Urdu: "pk",
            Cantonese: "hk",
            Unknown: "unknown"
        };

        this.CODEC_FORMATTING = {
            "AAC LC": "AAC",
            "MLP FBA": "TrueHD",
            "MLP FBA 16-ch": "TrueHD Atmos",
            "DTS XLL": "DTS-HD MA"
        };

        this.TYPE_ICONS = {
            'Video': '🎬',
            'Audio': '🔊',
            'Subtitles': '💬'
        };
    }
}

class DataValidator {
    constructor() {
        this.requiredFields = {
            video: ['Format', 'Language'],
            audio: ['Format', 'Language', 'Channel(s)', 'Bit rate'],
            text: ['Format', 'Language']
        };

        // Define base part count for each type
        this.basePartCounts = {
            Video: 1,  // title
            Audio: 4,  // language | codec | channels | bitrate
            Subtitles: 2  // language | type (Full/Forced/SDH)
        };
    }

    validateFormat(info) {
        return this.validateRow(info.title, info.format, info.type);
    }

    validateRow(title, format, type = "Audio") {
        if (!title || !format) {
            return false;
        }

        const titleParts = title.split(" | ").map(part => part.trim());
        const formatParts = format.split(" | ").map(part => part.trim());

        // Get the base parts count for this type
        const basePartCount = this.basePartCounts[type] || 4;

        // Get the base parts
        const baseFormatParts = formatParts.slice(0, basePartCount);
        const baseTitleParts = titleParts.slice(0, basePartCount);

        // Check if title follows our standard format by comparing base parts
        const isStandardFormat = baseTitleParts.length === basePartCount && 
            baseTitleParts.every((part, index) => part === baseFormatParts[index]);

        if (isStandardFormat) {
            // For standard format, compare all parts
            return formatParts.every((part, index) => part === titleParts[index]);
        } else {
            // For non-standard format, we know it won't match
            return false;
        }
    }

    validateMediaInfo(text) {
        if (!text || typeof text !== 'string') {
            return false;
        }

        const sections = text.split("\n\n");
        if (sections.length === 0) {
            return false;
        }

        return true;
    }

    validateSection(section, type) {
        const required = this.requiredFields[type.toLowerCase()];
        if (!required) {
            return false;
        }

        const lines = section.split("\n");
        return required.every(field => 
            lines.some(line => line.trim().startsWith(field))
        );
    }

    validateAudioInfo(info) {
        return info.channels && info.bitrate;
    }

    validateSubtitleInfo(info) {
        return info.language && info.format;
    }
}

class MediaInfoParser {
    constructor(dataValidator, utils, config) {
        this.dataValidator = dataValidator;
        this.utils = utils;
        this.config = config;
    }

    parseMediaInfo(text) {
        try {
            if (!this.dataValidator.validateMediaInfo(text)) {
                this.utils.error('Invalid MediaInfo text');
                return [];
            }

            const sections = text.split("\n\n");
            const rows = [];

            sections.forEach((section) => {
                try {
                    const lines = section.split("\n").filter(line => line.trim() !== "");
                    const typeLine = lines.find(line => 
                        line.startsWith("General") || 
                        line.startsWith("Video") || 
                        line.startsWith("Audio") || 
                        line.startsWith("Text") || 
                        line.startsWith("Chapters")
                    );

                    if (!typeLine) return;

                    const type = typeLine.split(" ")[0].toLowerCase();
                    
                    if (!this.dataValidator.validateSection(section, type)) {
                        this.utils.error(`Invalid ${type} section`);
                        return;
                    }

                    switch (type) {
                        case "video":
                            const videoInfo = this.parseVideoInfo(lines);
                            if (videoInfo) rows.push(videoInfo);
                            break;
                        case "audio":
                            const audioInfo = this.parseAudioInfo(lines);
                            if (audioInfo) rows.push(audioInfo);
                            break;
                        case "text":
                            const subtitleInfo = this.parseSubtitleInfo(lines);
                            if (subtitleInfo) rows.push(subtitleInfo);
                            break;
                    }
                } catch (error) {
                    this.utils.error('Error parsing section:', error);
                }
            });

            return rows;
        } catch (error) {
            this.utils.error('Error parsing MediaInfo:', error);
            return [];
        }
    }

    parseVideoInfo(lines) {
        const info = this.extractCommonInfo(lines);
        info.type = "Video";
        return info;
    }

    parseAudioInfo(lines) {
        const info = this.extractCommonInfo(lines);
        info.type = "Audio";

        const channels = this.utils.getField(lines, "Channel(s)");
        const bitrate = this.utils.getField(lines, "Bit rate");

        info.channels = this.utils.formatChannels(channels);
        info.bitrate = this.utils.formatBitrate(bitrate);

        if (!this.dataValidator.validateAudioInfo(info)) {
            this.utils.error('Invalid audio info');
            return null;
        }

        // Format codec name
        const codec = this.utils.formatCodec(info.format, this.config);

        // Build the base format string (this is our validation format)
        const baseFormat = `${info.language} | ${codec} | ${info.channels} | ${info.bitrate || "Unknown"}`;
        
        // Check if title follows our standard format
        const isStandardFormat = info.title && info.title.startsWith(info.language + " |");
        
        if (isStandardFormat) {
            // For standard format, extract additional info after bitrate from title
            const titleParts = info.title.split(" | ");
            const additionalInfo = titleParts.slice(4).join(" | ");
            info.format = additionalInfo ? `${baseFormat} | ${additionalInfo}` : baseFormat;
        } else {
            // For non-standard format, append the entire title
            info.format = info.title ? `${baseFormat} | ${info.title}` : baseFormat;
        }

        return info;
    }

    parseSubtitleInfo(lines) {
        const info = this.extractCommonInfo(lines);
        info.type = "Subtitles";

        if (!this.dataValidator.validateSubtitleInfo(info)) {
            this.utils.error('Invalid subtitle info');
            return null;
        }

        // Build the base format string (this is our validation format)
        let baseFormat;
        if (info.title && info.title.includes('SDH')) {
            baseFormat = `${info.language} | SDH`;
        } else {
            baseFormat = info.forced === "Yes" ?
                `${info.language} | Forced` :
                `${info.language} | Full`;
        }

        // Check if title follows our standard format
        const isStandardFormat = info.title && info.title.startsWith(info.language + " |");
        
        if (isStandardFormat) {
            // For standard format, extract additional info after base format
            const titleParts = info.title.split(" | ");
            const basePartCount = baseFormat.split(" | ").length;
            const additionalInfo = titleParts.slice(basePartCount).join(" | ");
            info.format = additionalInfo ? `${baseFormat} | ${additionalInfo}` : baseFormat;
        } else {
            // For non-standard format, append the entire title
            info.format = info.title ? `${baseFormat} | ${info.title}` : baseFormat;
        }

        return info;
    }

    extractCommonInfo(lines) {
        const language = this.utils.formatLanguage(this.utils.getField(lines, "Language"));
        
        return {
            type: "",
            language: language || "Unknown",
            default: this.utils.getField(lines, "Default") === "Yes" ? "Yes" : "No",
            forced: this.utils.getField(lines, "Forced") === "Yes" ? "Yes" : "No",
            enabled: this.utils.getField(lines, "Enabled") === "Yes" ? "Yes" : "No",
            title: this.utils.getField(lines, "Title") || "",
            format: this.utils.getField(lines, "Format") || "Unknown"
        };
    }
}

class UIHandler {
    constructor(mediaInfoParser, utils, config, dataValidator) {
        this.mediaInfoParser = mediaInfoParser;
        this.utils = utils;
        this.config = config;
        this.dataValidator = dataValidator;
        this.mediaInfoTextarea = null;
        this.outputDiv = null;
        this.fileInput = null;
        this.isCreatePage = false;
    }

    initialize() {
        this.utils.log('Initializing UI Handler');
        
        // Check if we're on create or view page
        this.isCreatePage = window.location.pathname.endsWith('/create');
        
        if (this.isCreatePage) {
            this.initializeCreatePage();
        } else {
            this.initializeViewPage();
        }
    }

    initializeCreatePage() {
        // Use setInterval to wait for the DOM to be ready
        const interval = setInterval(() => {
            this.mediaInfoTextarea = document.querySelector(this.config.DOM_SELECTORS.MEDIAINFO_TEXTAREA);
            if (this.mediaInfoTextarea) {
                clearInterval(interval);
                this.setupCreatePageUI();
            }
        }, 500);
    }

    initializeViewPage() {
        // Use setInterval to wait for the DOM to be ready
        const interval = setInterval(() => {
            const mediainfoElement = document.querySelector('code[x-ref="mediainfo"]');
            const subtitlesElement = document.querySelector('.mediainfo__subtitles');
            
            if (mediainfoElement && subtitlesElement) {
                clearInterval(interval);
                this.setupViewPageUI(mediainfoElement, subtitlesElement);
            }
        }, 500);
    }

    setupCreatePageUI() {
        try {
            this.createFileInput();
            this.createOutputDiv();
            this.setupEventListeners();
            this.utils.log('Create page UI setup completed');
        } catch (error) {
            this.utils.error('Error setting up create page UI:', error);
        }
    }

    setupViewPageUI(mediainfoElement, subtitlesElement) {
        try {
            this.createOutputDiv();
            this.outputDiv.style.marginTop = '20px';
            subtitlesElement.parentNode.insertBefore(this.outputDiv, subtitlesElement.nextSibling);
            
            // Parse and render the MediaInfo
            const mediainfoText = mediainfoElement.textContent;
            const parsedData = this.mediaInfoParser.parseMediaInfo(mediainfoText);
            this.renderData(parsedData);
            
            this.utils.log('View page UI setup completed');
        } catch (error) {
            this.utils.error('Error setting up view page UI:', error);
        }
    }

    createFileInput() {
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.id = this.config.UI_CONFIG.FILE_INPUT_ID;
        this.fileInput.accept = this.config.UI_CONFIG.FILE_INPUT_ACCEPT;
        Object.assign(this.fileInput.style, this.config.UI_CONFIG.FILE_INPUT_STYLE);

        const uploadWrapper = document.createElement('div');
        Object.assign(uploadWrapper.style, this.config.UI_CONFIG.UPLOAD_WRAPPER_STYLE);
        uploadWrapper.appendChild(this.fileInput);

        const mediaInfoGroup = this.mediaInfoTextarea.closest(this.config.DOM_SELECTORS.MEDIAINFO_GROUP);
        if (!mediaInfoGroup) {
            throw new Error('Parent form group for MediaInfo textarea not found');
        }

        mediaInfoGroup.parentNode.insertBefore(uploadWrapper, mediaInfoGroup);
    }

    createOutputDiv() {
        this.outputDiv = document.createElement('div');
        this.outputDiv.id = this.isCreatePage ? 
            this.config.DOM_SELECTORS.OUTPUT_DIV_CREATE.slice(1) : 
            this.config.DOM_SELECTORS.OUTPUT_DIV_VIEW.slice(1);
        
        if (this.isCreatePage) {
            const mediaInfoGroup = this.mediaInfoTextarea.closest(this.config.DOM_SELECTORS.MEDIAINFO_GROUP);
            mediaInfoGroup.parentNode.insertBefore(this.outputDiv, mediaInfoGroup);
        }
    }

    setupEventListeners() {
        this.fileInput.addEventListener('change', this.handleFileInputChange.bind(this));
        this.mediaInfoTextarea.addEventListener('input', this.handleTextareaInput.bind(this));
    }

    handleFileInputChange(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.mediaInfoTextarea.value = e.target.result;
                this.utils.log('File content loaded into textarea');
            };
            reader.readAsText(file);
        }
    }

    handleTextareaInput() {
        const text = this.mediaInfoTextarea.value;
        if (text.trim()) {
            this.utils.log('Generating table for provided MediaInfo text');
            const parsedData = this.mediaInfoParser.parseMediaInfo(text);
            this.renderData(parsedData);
        } else {
            this.outputDiv.innerHTML = '';
        }
    }

    renderData(rows) {
        if (!rows || rows.length === 0) {
            this.outputDiv.innerHTML = '<p>No data found.</p>';
            return;
        }

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
                    <th>Validation</th>
                </tr>
            </thead>
            <tbody>
        `;

        rows.forEach((row) => {
            if (!row) return;

            const isValid = this.dataValidator.validateFormat(row);
            table += `
                <tr>
                    <td>${this.utils.getTypeIcon(row.type || '', this.config)}</td>
                    <td>${this.utils.getCountryFlag(row.language || 'Unknown', this.config)} ${row.language || 'Unknown'}</td>
                    <td>${this.utils.renderYesNoIcon(row.default || 'No')}</td>
                    <td>${this.utils.renderYesNoIcon(row.forced || 'No')}</td>
                    <td>${row.title || ''}</td>
                    <td>${row.format || ''}</td>
                    <td>${this.utils.renderValidationIcon(isValid)}</td>
                </tr>
            `;
        });

        table += '</tbody></table>';
        this.outputDiv.innerHTML = table;

        // Enable copy on click for all table cells
        const cells = this.outputDiv.querySelectorAll('td');
        cells.forEach(cell => this.utils.enableCopyOnClick(cell));
    }
}

class Utils {
    constructor() {
        this.DEBUG = true;
    }

    log(message, data = null) {
        if (this.DEBUG) {
            console.log(`[MediaInfo Parser] ${message}`, data || '');
        }
    }

    error(message, error = null) {
        console.error(`[MediaInfo Parser] ${message}`, error || '');
    }

    getField(lines, field) {
        // Escape special regex characters in the field name
        const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match field at start of line, followed by spaces and colon
        const fieldRegex = new RegExp(`^${escapedField}\\s*:\\s*(.+)`);
        const line = lines.find(line => fieldRegex.test(line));
        return line ? line.match(fieldRegex)[1].trim() : "";
    }

    formatChannels(channels) {
        // Extract the number from "X channels" format
        const numChannels = channels.replace(/\s*channels?/i, "");
        
        switch (numChannels) {
            case "6":
                return "5.1";
            case "8":
                return "7.1";
            default:
                return numChannels + ".0";
        }
    }

    formatBitrate(bitrate) {
        return bitrate.replace(" kb/s", " kbps").replace(/\s(?=\d)/g, "");
    }

    formatLanguage(language) {
        return language.replace(/\s*\([^)]*\)/g, '').trim();
    }

    getCountryFlag(language, config) {
        const countryCode = config.LANGUAGE_FLAGS[language] || "unknown";
        
        if (countryCode === "unknown") {
            return `<img src="/vendor/joypixels/png/64/1f6a8.png" alt="?" style="width: 20px; height: 14px; margin-right: 5px; vertical-align: middle;">`;
        }

        return `<img src="/img/flags/${countryCode}.png" alt="${language}" style="width: 20px; height: 14px; margin-right: 5px; vertical-align: middle;">`;
    }

    formatCodec(codec, config) {
        return config.CODEC_FORMATTING[codec] || codec;
    }

    getTypeIcon(type, config) {
        return config.TYPE_ICONS[type] || type;
    }

    renderYesNoIcon(value) {
        return value === "Yes" ? "✅" : "❌";
    }

    renderValidationIcon(isValid) {
        return isValid ? "✅" : "❌";
    }

    enableCopyOnClick(element) {
        element.style.cursor = 'pointer';
        element.title = 'Click to copy';
        element.addEventListener('click', () => {
            navigator.clipboard.writeText(element.textContent).then(() => {
                this.log(`Copied: ${element.textContent}`);
            }).catch(err => {
                this.error('Failed to copy text: ', err);
            });
        });
    }
}


(function () {
    'use strict';

    console.log('MediaInfo Parser script loaded');

    // Initialize modules
    const config = new Config();
    const utils = new Utils();
    const dataValidator = new DataValidator();
    const mediaInfoParser = new MediaInfoParser(dataValidator, utils, config);
    const uiHandler = new UIHandler(mediaInfoParser, utils, config, dataValidator);

    // Start the application
    uiHandler.initialize();
})();
