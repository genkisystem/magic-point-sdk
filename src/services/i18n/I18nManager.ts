import i18next from 'i18next';
import resources from './resources';

const Iso639_1LanguageCodes = [
    "en",
    "ja",
    // "es",
    // "fr",
    // "de",
    // "zh",
    // "ru",
    // "ar",
    // "pt",
    // "it",
    // "hi",
    // "nl",
    // "sv",
    // "el",
    // "ko"
    // Add more languages as needed
] as const

export type Iso639_1LanguageCodesValue = typeof Iso639_1LanguageCodes[number]

//for init purpose only
export class I18nManager {
    public t;
    constructor(lng: Iso639_1LanguageCodesValue) {
        i18next.init({
            lng,
            fallbackLng: {
                'default': ['en']
            },
            resources: resources
        })
        this.t = i18next.t
    }
}
