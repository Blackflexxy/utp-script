export class DataValidator {
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