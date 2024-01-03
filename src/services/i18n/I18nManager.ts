import i18next from 'i18next'
import resources from './resources'

//for init purpose only
export class I18nManager {
    constructor(lng: string) {
        i18next.init({
            lng,
            fallbackLng: {
                'default': ['en']
            },
            resources: resources
        })
    }
}
