import i18next from "i18next"
import { EventBusInstance } from "../components/EventBus"
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"

export type Breakpoints = Readonly<{
    [key: string]: number
}>

export const SCREEN_SIZES = {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
}

type WindowSizeRange = { from: number, to: number }
export const getCurrentScreenSizeRange = (currentScreenWidth: number = window.innerWidth, breakpoints: Breakpoints = SCREEN_SIZES): WindowSizeRange => {
    let from = 0
    let to = Number.MAX_VALUE

    // find lower bound
    for (const key of Object.keys(breakpoints)) {
        if (breakpoints[key] <= currentScreenWidth) {
            if (from === null || breakpoints[key] > from) {
                from = breakpoints[key];
            }
        }
    }

    for (const key in breakpoints) {
        if (breakpoints[key] > currentScreenWidth) {
            if (to === null || breakpoints[key] < to) {
                to = breakpoints[key];
            }
        }
    }

    return { from, to }
}


export const checkTaskScreenSizeToRender = (taskScreenSize: number, currentWindowScreenSize: WindowSizeRange = getCurrentScreenSizeRange()): boolean => {
    return taskScreenSize >= currentWindowScreenSize.from && taskScreenSize < currentWindowScreenSize.to
}

// Define your screen size ranges
export const defindeMediaQueriesAndSetupEventListener = (breakpoints: Breakpoints = SCREEN_SIZES) => {
    const sortedBreakpoints = Object.entries(breakpoints).sort((a, b) => a[1] - b[1]);
    const mediaQueries = []
    for (let i = 0; i < sortedBreakpoints.length; i++) {
        if (i === 0) {
            mediaQueries.push({ query: window.matchMedia(`(max-width: ${sortedBreakpoints[i][1] - 1}px)`), label: i18next.t('screenSize:size.smallestScreen'), lowerBound: 0, upperBound: sortedBreakpoints[i][1] - 1 })
            continue
        }

        if (i === sortedBreakpoints.length - 1) {
            mediaQueries.push({ query: window.matchMedia(`(min-width: ${sortedBreakpoints[i][1]}px)`), label: i18next.t('screenSize:size.largestSreen'), lowerBound: sortedBreakpoints[i][1], upperBound: Number.MAX_VALUE })
            continue
        }

        mediaQueries.push({ query: window.matchMedia(`(min-width: ${sortedBreakpoints[i][1]}px) and (max-width: ${sortedBreakpoints[i + 1][1] - 1}px)`), label: sortedBreakpoints[i][0], lowerBound: sortedBreakpoints[i][1], upperBound: sortedBreakpoints[i + 1][1] - 1 })
    }

    mediaQueries.forEach(mq => {
        mq.query.onchange = (e: MediaQueryListEvent) => handleWindowSizeChange(e, mq.label, mq.lowerBound, mq.upperBound)
    })
}

const handleWindowSizeChange = (e: MediaQueryListEvent, label: string, lowerBound: number, upperBound: number) => {
    if (e.matches) {
        let toastText = upperBound === Number.MAX_VALUE ? i18next.t('screenSize:toast.enterBiggestScreenRange', { lowerBound }) : i18next.t('screenSize:toast.enterNewScreenRange', { lowerBound: lowerBound, upperBound: upperBound })
        Toastify({
            text: toastText,
            duration: 3000,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: {
                background: "linear-gradient(to right, #00b09b, #96c93d)",
            },
            close: true,
            offset: {
                x: 60,
                y: -4
            }
        }).showToast()
        EventBusInstance.emit("clear-tags")
        EventBusInstance.emit('reset-tasks-is-render-state')
        EventBusInstance.emit('re-render-tasks')
    }
}
