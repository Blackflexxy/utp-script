// ==UserScript==
// @name         UTP Request Checker
// @namespace    Violentmonkey Scripts
// @version      1.2.1
// @description  Compare amounts and modify the vote button on UTP requests.
// @match        https://utp.to/requests/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/maksii/utp-script/main/utp-requests-voter.js
// @downloadURL  https://raw.githubusercontent.com/maksii/utp-script/main/utp-requests-voter.js
// ==/UserScript==

(function() {
    'use strict';

    // Function to extract numerical value from a string
    function extractNumber(str) {
        return parseFloat(str.replace(/[^0-9.]/g, ''));
    }

    // Function to format date
    function formatDate(date) {
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };
        return date.toLocaleString('en-GB', options).replace(',', '');
    }

    // Process amounts
    const panelSection = document.querySelector('section.panelV2');
    if (!panelSection) return;

    const heading = panelSection.querySelector('h2.panel__heading');
    if (!heading) return;

    const currentAmountText = heading.innerHTML.split('text-gold')[1];
    const currentAmount = extractNumber(currentAmountText);

    const firstLi = panelSection.querySelector('div.panel__body.bbcode-rendered ul li');
    if (!firstLi) return;

    const requiredAmountText = firstLi.textContent;
    const requiredAmount = extractNumber(requiredAmountText);

    const voteButton = document.querySelector('menu.torrent__buttons button');
    if (!voteButton) return;

    if (currentAmount < requiredAmount) {
        voteButton.style.backgroundColor = '#8e49c1';
    } else {
        voteButton.setAttribute('disabled', 'true');
        voteButton.style.cursor = 'not-allowed';
    }

    // Process table
    const tableWrapper = document.querySelector('div.data-table-wrapper');
    if (!tableWrapper) return;

    const table = tableWrapper.querySelector('table.data-table');
    if (!table) return;

    // Remove last column from the table
    const rows = Array.from(table.querySelectorAll('tr'));
    rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length > 0) {
            cells[cells.length - 1].remove();
        }
    });

    // Sum values and keep track of last donation date
    const donations = {};
    rows.slice(1).forEach(row => { // Skip header row
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) return;

        const userCell = cells[0];
        const user = userCell.innerHTML.trim();
        const amount = extractNumber(cells[1].textContent);
        const date = new Date(cells[2].querySelector('time').getAttribute('datetime'));

        if (!donations[user]) {
            donations[user] = { total: 0, lastDate: date, userCellHTML: userCell.innerHTML };
        }

        donations[user].total += amount;
        if (date > donations[user].lastDate) {
            donations[user].lastDate = date;
        }
    });

    // Convert to array, sort, and update table
    const sortedDonations = Object.entries(donations)
        .sort(([, a], [, b]) => b.total - a.total || b.lastDate - a.lastDate);

    // Clear existing rows and add sorted rows
    table.querySelector('tbody').innerHTML = '';
    sortedDonations.forEach(([user, { total, lastDate, userCellHTML }]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${userCellHTML}</td>
            <td>${total.toFixed(2)}</td>
            <td>${formatDate(lastDate)}</td>
        `;
        table.querySelector('tbody').appendChild(row);
    });
})();