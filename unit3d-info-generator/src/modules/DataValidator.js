export class DataValidator {
    constructor() {
        this.requiredFields = {
            video: ['Format', 'Language'],
            audio: ['Format', 'Language', 'Channel(s)', 'Bit rate'],
            subtitles: ['Format', 'Language']
        };
    }

    validateRow(title, format) {
        if (!title || !format) {
            return false;
        }

        const titleParts = title.split(" | ").map(part => part.trim());
        const formatParts = format.split(" | ").map(part => part.trim());

        if (titleParts.length !== formatParts.length) {
            return false;
        }

        return formatParts.every((part, index) => part === titleParts[index]);
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