// ==UserScript==
// @name         UNIT3D chatbox - messages
// @version      v1.2
// @description  Chat functionalities: Reply, Message and Gift buttons. AutoScroll, Filter SysteBot.
// @match        https://utp.to/
// @updateURL    https://raw.githubusercontent.com/maksii/utp-script/main/unit3d-chatbox-messages.user.js
// @downloadURL  https://raw.githubusercontent.com/maksii/utp-script/main/unit3d-chatbox-messages.user.js
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    const selectors = {
        chatbox: '#chatbox__messages-create',
        chatMessages: '.chatroom__messages',
        settingsPanel: '#settingsPanel',
        settingsButton: '#settingsButton',
    };

    let settings = {
        messageActions: false,
        autoScroll: false,
        systemBot: false,
        systemBotRelease: false
    };

    const templates = {
        settingsPanel: `
            <div id="settingsPanel" style="display: none; position: absolute; top: 20px; right: 0; background: rgba(0,0,0,0.9); border-radius: 8px; padding: 10px; color: white; z-index: 10001;">
                <label><input type="checkbox" id="messageActions" checked> Show Message/Gift/Reply Buttons</label><br>
                <label><input type="checkbox" id="autoScroll" checked> Auto Scroll to last message</label><br>
                <label><input type="checkbox" id="systemBot" checked> Hide SystemBot</label><br>
                <label><input type="checkbox" id="systemBotRelease" checked> Hide SystemBot Torrents</label><br>
            </div>
        `,
        toggleButton: `<div class="panel__action"><button id="settingsButton" title="Toggle Script Settings" class="form__button form__standard-icon-button"><i class="fas fa-gear"></i></button></div>`
    };

    const styleContent = `
        .reply-icon, .message-icon, .gift-icon { cursor: pointer; padding-right: 10px; }
        .panel__actions { position: relative; }
    `;

    const toggleElementVisibility = (selector, isVisible) => {
        document.querySelector(selector).style.display = isVisible ? 'flex' : 'none';
    };
    const readSetting = (key) => localStorage.getItem(key) === 'true';
    const writeSetting = (key, value) => localStorage.setItem(key, value.toString());

    const setupStyles = () => {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.textContent = styleContent;
        document.head.appendChild(style);
    };

    // Apply settings to the checkboxes in the UI
    function applySettings() {
        console.log(`debug applySettings in`);
        Object.keys(settings).forEach(key => {
            const checkbox = document.getElementById(key);
            if (checkbox) {
                let value = readSetting(key)
                checkbox.checked = value;
                runSettingLogic(key, value)
            }
        });
    }

    // Run logic related to the settings
    function runSettingLogic(settingKey, value) {
        const actions = {
            messageActions: () => messageActions(value),
            autoScroll: () => autoScroll(value),
            systemBot: () => systemBot(value),
            systemBotRelease: () => systemBotRelease(value)
        };

        if (actions[settingKey]) {
            actions[settingKey]();
        } else {
            console.log(`Unknown setting: ${settingKey}`);
        }
    }

    function messageActions(setting) {
        console.log(`Message Actions ${setting ? 'enabled' : 'disabled'}`)

        if (setting) {
            console.log(`Message Actions addAllIcons`)
            addAllIcons();
        }
        else {
            console.log(`Message Actions removeAllIcons`)
            removeAllIcons()
        }
        //setupReplyFeatures(setting);

    }
    function autoScroll(setting) {
        console.log(`Auto Scroll ${setting ? 'enabled' : 'disabled'}`)
        //no additional logic, just console log
    }
    function systemBot(setting) {
        console.log(`System Bot ${setting ? 'enabled' : 'disabled'}`)
        allSystemBot();
    }
    function systemBotRelease(setting) {
        console.log(`System Bot Release ${setting ? 'enabled' : 'disabled'}`)
        allSystemBot();
    }

    const renderOptions = function () {
        setupSettingsPanel();
        applySettings();
    };

    const setupSettingsPanel = () => {
        console.log(`debug setupSettingsPanel in`);
        const chatboxHeaderActions = document.querySelector('#chatbox_header .panel__actions');
        if (!chatboxHeaderActions) {
            console.error("Settings button placement failed: '#chatbox_header .panel__actions' not found.");
            return;
        }
        chatboxHeaderActions.insertAdjacentHTML('beforeend', templates.toggleButton + templates.settingsPanel);
        const settingsButton = document.querySelector(selectors.settingsButton);
        const settingsPanel = document.querySelector(selectors.settingsPanel);

        settingsButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent event propagation
            if (settingsPanel.style.display !== 'block') {
                settingsPanel.style.display = 'block';
            }
        });
        document.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent event propagation
            if (!settingsPanel.contains(event.target) && !settingsButton.contains(event.target)) {
                if (settingsPanel.style.display !== 'none') {
                    settingsPanel.style.display = 'none';
                }
            }
        });
        document.querySelectorAll('#settingsPanel input[type="checkbox"]').forEach(input => {
            input.addEventListener('change', (event) => {
                event.stopPropagation(); // Prevent event propagation
                writeSetting(input.id, input.checked);
                runSettingLogic(input.id, input.checked);
            });
        });
    };

    const init = () => {
        if (!document.querySelector(selectors.chatbox) || !document.querySelector(selectors.chatMessages)) {
            console.error('Chatbox or chat messages not found. Retrying in 1 second...');
            setTimeout(init, 1000); // Retry after 1 second
            return;
        }
        setupStyles();
        renderOptions();
        //allMessages();
        newMessages();

        scrollToLastMessage();

    };

    init();

    function scrollToLastMessage() {
        const scroll = () => {
            const wrapper = document.querySelector('.chatroom__messages--wrapper');
            const messages = document.querySelector('.chatroom__messages');
            let setting = readSetting('autoScroll');
            if (!setting) return;
            if (wrapper && messages) {
                // Scroll to the bottom of the messages
                wrapper.scrollTop = messages.scrollHeight;
            }
        }

        const chatMessages = document.querySelector(selectors.chatMessages);
        const observer = new MutationObserver(() => scroll());
        observer.observe(chatMessages, { childList: true });
    }

    const systemBotMessages = (message) => {
        const addressLink = message.querySelector('address a[href*="/System"]');
        if (addressLink) {
            const nextDiv = message.querySelector('div');
            if (nextDiv) {
                const hideSystemBot = readSetting('systemBot');
                const hideSystemBotTorrents = readSetting('systemBotRelease');

                if (!nextDiv.querySelector('a[href*="/users/"]')) {
                    let shouldHide = hideSystemBot ? 'none' : 'block';
                    if (message.parentElement.style.display !== shouldHide) {
                        message.parentElement.style.display = shouldHide;
                    }
                }

                if (nextDiv.querySelector('a[href*="/torrents/"]')) {
                    let shouldHide = hideSystemBotTorrents ? 'none' : 'block';
                    if (message.parentElement.style.display !== shouldHide) {
                        message.parentElement.style.display = shouldHide;
                    }
                }
            }
        }
    };

    const createIcon = (iconClass, clickHandler) => {
        const icon = document.createElement("i");
        icon.classList.add("fa", "solid");
        iconClass.split(' ').forEach(cls => icon.classList.add(cls));
        icon.addEventListener("click", clickHandler);
        return icon;
    };

    const quoteMessage = (username, message) => {
        const newMessageTextArea = document.querySelector(selectors.chatbox);
        const quote = `[b]${username}[/b]: [color=#999999]"[i]${message}[/i]"[/color]\n\n`;
        newMessageTextArea.value += quote;
        newMessageTextArea.focus();
        newMessageTextArea.setSelectionRange(newMessageTextArea.value.length, newMessageTextArea.value.length);
    };

    const addIconsToMessage = (message) => {
        let setting = readSetting('messageActions');
        if (!setting) return;

        const newMessageTextArea = document.querySelector(selectors.chatbox);
        const content = message.querySelector(".chatbox-message__content, .message-content")?.innerText;
        const username = message.querySelector(".chatbox-message__address.user-tag span, .message-username span")?.innerText;
        const header = message.querySelector(".chatbox-message__header, .message-header");

        if (!content || !username || !header) return;

        // Remove existing icons to prevent duplication
        header.querySelectorAll(".reply-icon, .message-icon, .gift-icon").forEach(icon => icon.remove());

        const replyIcon = createIcon("fa-reply reply-icon", () => quoteMessage(username, content));
        const messageIcon = createIcon("fa-envelope message-icon", () => {
            newMessageTextArea.value += `/msg ${username} `;
            newMessageTextArea.focus();
        });
        const giftIcon = createIcon("fa-gift gift-icon", () => {
            newMessageTextArea.value += `/gift ${username} `;
            newMessageTextArea.focus();
        });

        header.append(replyIcon, messageIcon, giftIcon);
    };

    function allSystemBot() {
        document.querySelectorAll(".chatbox-message, .message").forEach(message => {
            systemBotMessages(message);
        });
    }

    function removeAllIcons() {
        document.querySelectorAll(".reply-icon, .message-icon, .gift-icon").forEach(icon => icon.remove());
    }

    function addAllIcons() {
        document.querySelectorAll(".chatbox-message, .message").forEach(message => {
            addIconsToMessage(message);
        });
    }

    const newMessages = () => {
        const chatMessages = document.querySelector(selectors.chatMessages);
        const updateLastMessages = () => {
            const messages = Array.from(document.querySelectorAll(".chatbox-message, .message"));
            const lastMessages = messages.slice(-20);

            lastMessages.forEach(message => {
                addIconsToMessage(message);
                systemBotMessages(message);
            });
        };

        const observer = new MutationObserver(() => {
            // Debounce logic
            clearTimeout(observer.debounceTimeout);
            observer.debounceTimeout = setTimeout(updateLastMessages, 100);
        });
        observer.observe(chatMessages, { childList: true });
    };
})();
