export class MediaInfoParser {
    constructor(dataValidator, utils) {
        this.dataValidator = dataValidator;
        this.utils = utils;
    }

    parseMediaInfo(text) {
        if (!this.dataValidator.validateMediaInfo(text)) {
            this.utils.error('Invalid MediaInfo text');
            return [];
        }

        const sections = text.split("\n\n");
        const rows = [];

        sections.forEach((section) => {
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
                    rows.push(this.parseVideoInfo(lines));
                    break;
                case "audio":
                    rows.push(this.parseAudioInfo(lines));
                    break;
                case "text":
                    rows.push(this.parseSubtitleInfo(lines));
                    break;
            }
        });

        return rows;
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

        return info;
    }

    parseSubtitleInfo(lines) {
        const info = this.extractCommonInfo(lines);
        info.type = "Subtitles";

        if (!this.dataValidator.validateSubtitleInfo(info)) {
            this.utils.error('Invalid subtitle info');
            return null;
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