export class MediaInfoParser {
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