import i18next from 'i18next'
import resources from './resources'
import { Iso639_1LanguageCodesValue } from '../../base'

//for init purpose only
export class I18nManager {
    constructor(lng: Iso639_1LanguageCodesValue) {
        i18next.init({
            lng,
            fallbackLng: {
                'default': ['en']
            },
            resources: resources
        })
    }
}
