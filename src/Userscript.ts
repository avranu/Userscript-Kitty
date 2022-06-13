/**
 * 
 */
import Notify from "./Notify";
import { Registry } from './DomElements';
import Page from './Pages';
import { sleep, isString } from "./functions";
//import * as sass from 'sass';
import * as GMStorage from 'gm-storage';
import { debug } from "console";
import Automator from "./Automator";

const $ = jQuery;

/**
 * The types we will accept in any query (such as this.find())
 */
type Query = string | JQuery<HTMLElement> | Document | Window;

export default class Userscript {
    readonly selectors: Registry;
    context: JQuery<any>;
    static #store: GMStorage.default;
    protected page : Page;
    auto : Automator;

    /**
     * 
     */
    constructor() {
        Userscript.load_scripts();
        Notify.debug('store')

        /** Initialize the store object */
        Userscript.store();
        Notify.debug("auto");

        /** Initialize the automator */
        this.auto = new Automator();

        Notify.debug("constructor done");
        /** Run the init function to set up subclass logic */
        this.init();
    }

    /**
     * Intended to be overriden in subclasses
     * @returns {void} nothing
     */
    init() : void {
    }

    /**
     * Returns our page or generates a new one
     * @returns {Page} the page
     */
    getPage() : Page {
        Notify.debug("Calling getPage: " + typeof this.page);
        return this.page ?? new Page({ auto: this.auto });
    }

    /**
     * Get the GMStorage instance, allowing us to access settings that persist between sessions.
     * @return {GMStorage} The storage object
     */
    static store(): GMStorage.default {
        /** If not set, then create it */
        if (typeof Userscript.#store === "undefined") {
            Userscript.#store = new GMStorage.default();
        }
        return Userscript.#store;
    }

    /**
     * 
     */
    static async load_scripts() {
        Notify.debug("Loading scripts");
        await Notify.load_toasts();
        Notify.debug("Done loading scripts");
    };

    /**
     * Override the default "confirm" function to click "ok" automatically
     * @param {Window | JQuery} context 
     */
    static override_confirm(context: Window | JQuery = window) : void {
        /**
         * Use array notation here because JQuery doesn't have a built in "confirm" property
         */
        var realConfirm = context["confirm"];
        context["confirm"] = function () {
            /** restore the old confirm function */
            context["confirm"] = realConfirm;
            /** return true which is identical to clicking "ok" */
            return true;
        };
    }

    /**
     * A shortcut for accessing this.getPage().find
     * If selector is array, returns an array of jQuery objects.
     * Otherwise, returns a single jQuery object.
     * @param {string | JQuery<HTMLElement> | Document | Window} selector The css selector string to search for. If a JQuery object, then just return it. If a Document or Window, return jQuery(body) of that object
     * @returns {JQuery<HTMLElement>}
     */
    find(selector: Query): JQuery<HTMLElement> {
        return this.getPage().find(selector);
    }

    /**
     * Wait for the context to reload, then issue a callback with a parameter. 
     * 
     * This is useful if the context is an iframe
     */
    reload_callback(callback: Function, ...params: any): void {
        Notify.debug("Registering reload callback: ", callback.name);

        this.context.one("load", callback.bind(this, ...params));
    }

    /**
     * Wait for the context to reload, then issue a callback with a parameter. 
     * 
     * This is useful if the context is an iframe
     */
    reload_cb(callback: Function): void {
        Notify.debug("Registering reload callback: ", callback.name);

        this.context.one("load", callback());
    }

    /**
     * Render a JSX element using React
     */
    /**
    render(element: JSX.Element, container: Query): void {
        ReactDOM.render(
            element,
            this.find(container)[0]
        );
    }
    */


    async ready(timeout_seconds: number = 10): Promise<void> {
        return this.page.ready(timeout_seconds);
    }
}