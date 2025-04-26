// ==UserScript==
// @name         MediaInfo Parser for Release
// @version      1.6
// @description  Parse MediaInfo and generate a table on /torrents/create
// @match        *://*/torrents/create
// @grant        none
// @updateURL    https://raw.githubusercontent.com/maksii/utp-script/main/unit3d-info-generator.user.js
// @downloadURL  https://raw.githubusercontent.com/maksii/utp-script/main/unit3d-info-generator.user.js
// ==/UserScript==

import { MediaInfoParser } from './modules/MediaInfoParser.js';
import { UIHandler } from './modules/UIHandler.js';
import { DataValidator } from './modules/DataValidator.js';
import { Config } from './modules/Config.js';
import { Utils } from './modules/Utils.js';

(function () {
    'use strict';

    console.log('MediaInfo Parser script loaded');

    // Initialize modules
    const config = new Config();
    const utils = new Utils();
    const dataValidator = new DataValidator();
    const mediaInfoParser = new MediaInfoParser(dataValidator, utils);
    const uiHandler = new UIHandler(mediaInfoParser, utils, config);

    // Start the application
    uiHandler.initialize();
})(); 