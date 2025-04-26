export class UIHandler {
    constructor(mediaInfoParser, utils, config, dataValidator) {
        this.mediaInfoParser = mediaInfoParser;
        this.utils = utils;
        this.config = config;
        this.dataValidator = dataValidator;
        this.mediaInfoTextarea = null;
        this.outputDiv = null;
        this.fileInput = null;
    }

    initialize() {
        this.utils.log('Initializing UI Handler');
        
        // Use setInterval to wait for the DOM to be ready
        const interval = setInterval(() => {
            this.mediaInfoTextarea = document.querySelector(this.config.DOM_SELECTORS.MEDIAINFO_TEXTAREA);
            if (this.mediaInfoTextarea) {
                clearInterval(interval);
                this.setupUI();
            }
        }, 500);
    }

    setupUI() {
        try {
            this.createFileInput();
            this.createOutputDiv();
            this.setupEventListeners();
            this.utils.log('UI setup completed');
        } catch (error) {
            this.utils.error('Error setting up UI:', error);
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
        this.outputDiv.id = this.config.DOM_SELECTORS.OUTPUT_DIV.slice(1);
        
        const mediaInfoGroup = this.mediaInfoTextarea.closest(this.config.DOM_SELECTORS.MEDIAINFO_GROUP);
        mediaInfoGroup.parentNode.insertBefore(this.outputDiv, mediaInfoGroup);
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

            const isValid = row.title && row.format ? this.dataValidator.validateRow(row.title, row.format) : false;
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