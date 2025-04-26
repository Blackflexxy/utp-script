export class Config {
    constructor() {
        this.DOM_SELECTORS = {
            MEDIAINFO_TEXTAREA: '#upload-form-mediainfo',
            MEDIAINFO_GROUP: '.form__group',
            OUTPUT_DIV: '#output'
        };

        this.UI_CONFIG = {
            FILE_INPUT_ID: 'fileInput',
            FILE_INPUT_ACCEPT: '.txt',
            FILE_INPUT_STYLE: {
                marginRight: '10px'
            },
            UPLOAD_WRAPPER_STYLE: {
                display: 'flex',
                alignItems: 'center'
            }
        };

        this.LANGUAGE_FLAGS = {
            Chinese: "cn",
            Spanish: "es",
            English: "us",
            Hindi: "in",
            Arabic: "sa",
            Bengali: "bd",
            Portuguese: "pt",
            Russian: "ru",
            Japanese: "jp",
            Punjabi: "in",
            German: "de",
            Javanese: "id",
            Korean: "kr",
            French: "fr",
            Telugu: "in",
            Marathi: "in",
            Turkish: "tr",
            Tamil: "in",
            Vietnamese: "vn",
            Italian: "it",
            Thai: "th",
            Greek: "gr",
            Dutch: "nl",
            Polish: "pl",
            Romanian: "ro",
            Hungarian: "hu",
            Czech: "cz",
            Swedish: "se",
            Bulgarian: "bg",
            Danish: "dk",
            Finnish: "fi",
            Norwegian: "no",
            Hebrew: "il",
            Ukrainian: "ua",
            Persian: "ir",
            Indonesian: "id",
            Malay: "my",
            Urdu: "pk",
            Cantonese: "hk",
            Unknown: "unknown"
        };

        this.CODEC_FORMATTING = {
            "AAC LC": "AAC",
            "MLP FBA": "TrueHD",
            "MLP FBA 16-ch": "TrueHD Atmos",
            "DTS XLL": "DTS-HD MA"
        };

        this.TYPE_ICONS = {
            'Video': '🎬',
            'Audio': '🔊',
            'Subtitles': '💬'
        };
    }
} 