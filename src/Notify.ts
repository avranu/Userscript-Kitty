/**
 * 
 */
import Toastify from 'toastify-js';

const $ = jQuery;

const debug_mode = true;

interface Custom_Parameters {
    message : string;
    type? : string;
    duration_ms? : number;
    style? : Object;
    onClick? : Function;
    toast? : boolean;
}

const default_options = {
    color: "inherit",
    duration: 3000,
    toast: false,
    label: "inherit",
    onClick: function() { },
};
const options : {[key: string] : typeof default_options} = {
    error: {
        ...default_options,
        color: "#f44336", // red
        label: "#b71c1c",
        duration: 10000,
        toast: true,
    },
    info: {
        ...default_options,
        color: "#2196f3", // blue
        label: "#0d47a1",
        toast: true,
    },
    warn: {
        ...default_options,
        color: "#ffc107", // orange
        label: "#ff6f00",
        duration: 8000,
        toast: true, 
    },
    success: {
        ...default_options,
        color: "#4caf50", // green
        label: "#1b5e20",
        toast: true,
    },
    log: {
        ...default_options,
        color: "#795548", // brown
    },
    debug: {
        ...default_options,
        color: "rgba(158, 158, 158, 0.5)", //"#9e9e9e", // grey
    }
};

/**
 * Add a success function to console
 */
declare global {
    interface Console {
        success: Function
    }
}

/**
 * Set up debugging via the debug npm package
 */
const debug = require('debug');
debug.enable("userscript:*");
class ConsoleLogger {
    error;
    info; 
    log;
    success;
    warn;
    debug;

    constructor() {
        console.debug("Setting up the console logger");

        /** Define console.success => console.log */
        if (typeof console.success === "undefined") {
            console.success = console.log;
        }

        for (let category of ["error", "info", "log", "success", "warn", "debug"]) {
            /** Use the debug package for all logs */
            let output = debug(`userscript:${category}`);
            if (options[category].hasOwnProperty("color")) {
                output.color = options[category].color;
            }

            /** Tell typescript this is a (typed) property of console */
            const prop = category as keyof typeof this;
            const console_prop = category as keyof typeof console;

            /** Set our object param */
            this[prop] = output;
            /** Redirect output to the console */
            output.log = (console[console_prop] as Function).bind(console);
        }

        if (debug_mode !== true) {
            debug.disable("userscript:debug");
        }
    }

    print( type : string, message : string ) {
        if (typeof options[type].label === "undefined") {
            this[type](`%c${message}`, `color:${options[type].color}`);
        } else {
            this[type](`%c${type}%c ${message}`, `background:${options[type].label};padding:0.5em 1em;border-radius:5px;border:1px solid rgba(0,0,0,0.1);font-weight:bold;color:#fff;`, `color:${options[type].color}`);
        }
    }
}
const log : ConsoleLogger = new ConsoleLogger();

export default class Notify {
    /**
     * Log a provided set of objects. We create a function here so we can expand it (say... with labels) later.
     * @param {any} objects The objects to log
     * @returns {number} The number of objects logged
     */
    static #log_objects( ...objects : any ) : number {
        let count = 0;

        for (let obj of objects) {
            console.dir({obj});
            count += 1;
        }

        return count;
    }

    /**
     * Sends a custom notification message, defaulting to the parameters specified for the given type.
     */
    static custom({ message, type = "log", duration_ms, style = {}, onClick, toast } : Custom_Parameters) {
        duration_ms = duration_ms || options[type].duration;
        onClick = onClick || options[type].onClick;
        toast = toast || options[type].toast;
        /** Merge the style with default options. Style overrides the defaults */
        style = {
            background: options[type].color,
            ...style,
        }

        /** Send a notification to the user */
        if (toast === true && typeof Toastify !== "undefined") {
            Toastify({ text: message, style: style, duration: duration_ms }).showToast();
            //M.toast({html: message, displayLength: duration_ms, classes: `toast-${type}`});
        }

        log.print(type, message);
    }

    /**
     * Sends a notification message and optionally logs a set of objects to the console
     * @param {string} message The message to send in a notification
     * @param {any} objects The objects to log to the console
     * @returns {void} nothing
     */
    static notify(message : string, ...objects) : void {
        Notify.custom({message: message, type: "log"});

        /** Log all objects */
        this.#log_objects(...objects);
    }

    /**
     * Sends a notification message and optionally logs a set of objects to the console
     * @param {string} message The message to send in a notification
     * @param {any} objects The objects to log to the console
     * @returns {void} nothing
     */
    static error(message: string, ...objects) {
        Notify.custom({ message: message, type: "error" });

        /** Log all objects */
        this.#log_objects(...objects);
    }

    /**
     * Sends a notification message and optionally logs a set of objects to the console
     * @param {string} message The message to send in a notification
     * @param {any} objects The objects to log to the console
     * @returns {void} nothing
     */
    static warn(message: string, ...objects) {
        Notify.custom({ message: message, type: "warn" });

        /** Log all objects */
        this.#log_objects(...objects);
    }

    /**
     * Sends a notification message and optionally logs a set of objects to the console
     * @param {string} message The message to send in a notification
     * @param {any} objects The objects to log to the console
     * @returns {void} nothing
     */
    static info(message: string, ...objects) {
        Notify.custom({ message: message, type: "info" });

        /** Log all objects */
        this.#log_objects(...objects);
    }

    /**
    * Sends a notification message and optionally logs a set of objects to the console
    * @param {string} message The message to send in a notification
    * @param {any} objects The objects to log to the console
    * @returns {void} nothing
    */
    static success(message: string, ...objects) {
        Notify.custom({ message: message, type: "success" });

        /** Log all objects */
        this.#log_objects(...objects);
    }

    /**
     * Sends a notification message and optionally logs a set of objects to the console
     * @param {string} message The message to send in a notification
     * @param {any} objects The objects to log to the console
     * @returns {void} nothing
     */
    static log(message: string, ...objects) {
        Notify.custom({ message: message, type: "log" });

        /** Log all objects */
        this.#log_objects(...objects);
    }

    /**
     * Sends a notification message and optionally logs a set of objects to the console
     * @param {string} message The message to send in a notification
     * @param {any} objects The objects to log to the console
     * @returns {void} nothing
     */
    static debug(message: string, ...objects) {
        Notify.custom({ message: message, type: "debug" });

        /** Log all objects */
        this.#log_objects(...objects);
    }

    /**
     * TODO
     */
    static async load_toasts () {
        /** Setup toast stuff */
        let css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css";
        document.head.appendChild(css);
    }

    static clear_console(): void {
        /** Reset everything */
        try {
            console.clear();
        } catch (err) {
            /** Should never happen */
            console.error("Error encountered resetting the page. Bailing out.");
            return;
        }
    };
}

/**
Notify.debug("Test");
Notify.success("Test");
Notify.error("Test");
Notify.log("Test");
Notify.notify("Test");
Notify.warn("Test");
Notify.info("Test");
*/