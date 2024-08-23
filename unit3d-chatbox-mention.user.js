// ==UserScript==
// @name         UNIT3D chatbox - mentions
// @version      v1.1
// @description  mention user
// @match        https://utp.to/
// @updateURL    https://raw.githubusercontent.com/maksii/utp-script/main/unit3d-chatbox-mention.js
// @downloadURL  https://raw.githubusercontent.com/maksii/utp-script/main/unit3d-chatbox-mention.js
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    const selectors = {
        chatbox: '#chatbox__messages-create',
        chatMessages: '.chatroom__messages',
        onlineUsers: '.blocks__online .panel__body ul .user-tag__link',
        additionalUsers: '.chatroom-users__list .user-tag__link'
    };

    const styleContent = `
        .mention-dropdown { position: absolute; background: #333333e6; border: 1px solid #ccc; max-height: 220px; min-width: 350px; overflow-y: auto; display: none; z-index: 10000; color: #ccc; }
        .mention-dropdown span { display: block; padding: 5px; cursor: pointer; color: #ccc; }
        .mention-dropdown span:hover { background: #555; }
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

    const init = () => {
        if (!document.querySelector(selectors.chatbox) || !document.querySelector(selectors.chatMessages)) {
            console.error('Chatbox or chat messages not found. Retrying in 1 second...');
            setTimeout(init, 1000); // Retry after 1 second
            return;
        }
        setupStyles();
        setupMentionFeature();

    };

    init();



    //mention
    function getOnlineUsernames() {
        const userElements = Array.from(document.querySelectorAll(selectors.onlineUsers));
        const additionalUserElements = Array.from(document.querySelectorAll(selectors.additionalUsers));
        const userSet = new Set([...userElements, ...additionalUserElements].map(el => el.textContent.trim()));
        return Array.from(userSet);
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function setupMentionFeature() {
        console.log(`debug setupMentionFeature in`);
        const chatbox = document.querySelector(selectors.chatbox);
        const mentionDropdown = document.createElement('div');
        mentionDropdown.classList.add('mention-dropdown');
        document.body.appendChild(mentionDropdown);

        const updateMentionDropdown = debounce((event) => {
            const cursorPosition = chatbox.selectionStart;
            const text = chatbox.value.substring(0, cursorPosition);
            const mentionMatch = text.match(/@(\w*)$/);

            if (mentionMatch) {
                const usernamePrefix = mentionMatch[1].toLowerCase();
                const users = getOnlineUsernames().filter(user => user.toLowerCase().startsWith(usernamePrefix));
                mentionDropdown.innerHTML = '';

                const fragment = document.createDocumentFragment();
                users.forEach(user => {
                    const userElement = document.createElement('span');
                    userElement.textContent = user;
                    userElement.addEventListener('click', () => {
                        chatbox.value = chatbox.value.substring(0, cursorPosition - usernamePrefix.length - 1) + '@' + user + ' ' + chatbox.value.substring(cursorPosition);
                        chatbox.focus();
                        mentionDropdown.style.display = 'none';
                    });
                    fragment.appendChild(userElement);
                });
                mentionDropdown.appendChild(fragment);

                const rect = chatbox.getBoundingClientRect();
                mentionDropdown.style.left = `${rect.left}px`;
                mentionDropdown.style.top = `${rect.bottom}px`;
                mentionDropdown.style.display = 'block';
            } else {
                mentionDropdown.style.display = 'none';
            }
        }, 300);

        chatbox.addEventListener('input', updateMentionDropdown);

        chatbox.addEventListener('keydown', (e) => {
            if (mentionDropdown.style.display === 'block' && e.key === 'Tab') {
                e.preventDefault();
                const firstUser = mentionDropdown.querySelector('span');
                if (firstUser) firstUser.click();
            }
        });

        document.addEventListener('click', (event) => {
            if (!mentionDropdown.contains(event.target)) {
                mentionDropdown.style.display = 'none';
            }
        });
    }
    //mention end
})();
