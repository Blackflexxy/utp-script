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
        const line = lines.find((line) => line.trim().startsWith(field));
        return line ? line.split(":")[1].trim() : "";
    }

    formatChannels(channels) {
        const numChannels = channels.replace(" channels", "").replace(" channel", "");
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