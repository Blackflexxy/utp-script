export class Utils {
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