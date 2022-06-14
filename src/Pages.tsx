/**
 * 
 */
import React from 'react';
import MButton from '@mui/material/Button';

import Notify from "./Notify";
import { Registry, Clickable, Button } from './DomElements';
import { sleep, isString, normalize_query, until } from "./functions";
//import * as sass from 'sass';
import Automator from "./Automator";

const $ = jQuery;

/**
 * The types we will accept in any query (such as this.find())
 */
export type Query = string | JQuery<HTMLElement> | Document | Window;

/**
 * Use destructuring to simulate named params with types
 */
interface Page_Parameters {
    selectors?: Registry;
    auto? : Automator;
}

interface Element_Parameters {
    text?: string | null;
    container?: JQuery | string | null;
    id?: string | null;
    classname?: string | null;
}

interface Button_Parameters {
    text?: string | null;
    container?: JQuery | string | null;
    callback?: Function | null;
    id?: string | null;
    classname?: string | null;
    button?: JQuery | null;
    disabled?: boolean;
}

interface JSX_Button_Parameters {
    text?: string | null;
    container?: string;
    callback?: Function;
    id?: string | null;
    className?: string | null;
    disabled?: boolean;
}

export default class Page {
    readonly selectors: Registry;
    readonly auto: Automator;
    static readonly page_name: string;
//    sections : ReactTemplate;

    /**
     * 
     */
    constructor({ selectors, auto }: Page_Parameters = {}) {
        if (typeof selectors === "undefined") {
            selectors = new Registry();
        }
        this.selectors = selectors;

        Notify.debug(`Creating new page ("${this.get_page_name()}") with ${this.selectors.size} selectors.`);

        /** Set or Initialize the automator */
        this.auto = auto ?? new Automator();

        /** Run the init function to set up subclass logic */
        this.init();
        this.init_react();
    }

    /**
     * Intended to be overriden in subclasses
     * @returns {void} nothing
     */
    init() : void {
    }

    init_react() : void {
        /** Setup our template to record react locations */
//        this.sections = new ReactTemplate();

        this.ready().then(() => {
//            this.sections.create('main', document.body);
//            this.sections.create('notifications', document.body);

            /** If there are any buttons to create, do it */
            this.setup_buttons();
        });
    }

    /**
     * Intended to be overriden in subclasses
     * @returns {void} nothing
     */
    setup_buttons(): void {
        //this.sections.create('buttons', document.body);
    }

    /**
     * Gets the page name of any subclass
     * @returns {string} The name, or "Unknown page" if it isn't set.
     */
    get_page_name() : string {
        /** Get the top-most subclass's static page_name property */
        return (this.constructor as typeof Page).page_name ?? "Unknown page (" + this.constructor.name + ")";
    }

    /** 
     * Clicks on an element on this page
     * In case we want to add to this behavior in the future 
     * @param {Clickable} element The element to click on
     * @returns {bool} Success
     */
    click(element: Clickable): boolean {
        return element.click();
    }

    /**
     * @param {string} inline_sass A string of sass declarations to compile
     * @returns {void} nothing
     */
    addStyle(inline_sass: string): void {
        //const result = sass.compileString(inline_sass);
        //return this.addcss(result.css);
    }

    /**
     * @param {string} css A set of css rules to include on the page
     * @returns {void} nothing
     */
    addcss(css: string): void {
        GM_addStyle(css);
    }

    /** 
     * Find an array of elements using this object's single find method
     * @param {Array<string | JQuery<HTMLElement> | Document | Window>} An array of objects to find jQuery objects for.
     * @returns {JQuery<HTMLElement>} A jquery object referring to all found elements
     */
    find(selector: Array<string | JQuery<HTMLElement> | Document | Window>): JQuery<HTMLElement>;
    /** 
     * Find a single element using jQuery
     * @param {string | JQuery<HTMLElement> | Document | Window} selector The css selector string to search for. If a JQuery object, then just return it. If a Document or Window, return jQuery(body) of that object
     * @returns {JQuery<HTMLElement>}
     */
    find(selector: Query): JQuery<HTMLElement>;
    /**
     * A shortcut for accessing this.getContext().find
     * If selector is array, returns an array of jQuery objects.
     * Otherwise, returns a single jQuery object.
     * @param {string | JQuery<HTMLElement> | Document | Window} selector The css selector string to search for. If a JQuery object, then just return it. If a Document or Window, return jQuery(body) of that object
     * @returns {JQuery<HTMLElement>}
     */
    find(selector: Query | Array<any>): JQuery<HTMLElement> {

        /** Strings get handled specially by calling an overridable this.query() */
        if (isString(selector)) {
            return this.query( selector as string );
        }

        /** Arrays are not part of the Query type, so handle them specially too */
        if (Array.isArray(selector)) {
            let set: JQuery<HTMLElement> = jQuery();
            let entry: string | JQuery<HTMLElement> | Document | Window;
            for (entry of selector) {
                /** Tell jquery to add on these results */
                set.add(this.find(entry));

                // If the above fails in the future (because jQuery.add(JQuery) == error), we will have to get the values instead.
                //set.add( Object.values( this.find(entry) ) );
            }

            return set;
        }

        /** Everything else can be handled by normalize_query in any subclass of Page */
        return (this.constructor as typeof Page).normalize_query( selector );
    }

    /**
     * Turns a query parameter into a jquery object. This function exists so it can be overridden by subclasses.
     * By default, we outsource this work to functions.normalize_query()
     * 
     * @param {Query} selector 
     * @returns {Jquery<HTMLElement>}
     */
    protected static normalize_query( selector : Query ) : JQuery<HTMLElement> {
        return normalize_query(selector);
    }

    /**
     * Runs a query (via jquery) to find elements on the page using a css string
     * 
     * This function exists so it can be overridden in subclasses (for example, for pages with iframes)
     * 
     * @param {string} selector The selector string 
     * @returns {JQuery<HTMLElement>} The results found
     */
    query(selector: string) : JQuery<HTMLElement> {
        return $(selector);
    }

    /** 
     * Check if the selector exists
     * 
     * We use this function so we don't have to care about the internal type of our selectors list
     */
    has_selector(name: string): boolean {
        return this.selectors.has(name);
    }

    /**
     * Grab a selector from the map.
     * 
     * We use this function so we don't have to care about the internal type of our selectors list
     */
    get_selector(name: string): string {
        return this.selectors.get(name);
    }

    /**
     * A shortcut to get an element within a body context.
     * 
     * @throws error if the element can't be found
     */
    get_elements(name: string, selector?: string): JQuery {
        /** Automatically use known selectors */
        if (typeof selector === "undefined") {
            if (!this.selectors.has(name)) {
                Notify.error("An internal error occurred: Unable to find selector for " + name);
                throw "get_element: unable to find " + name;
            }
            selector = this.get_selector(name);
        }

        /** Find the field using the given selector */
        let field = this.find(selector);

        if (field.length < 1) {
            Notify.error(`Unable to find the ${name} element`, { selector: selector });
            throw `Unable to find the ${name} element: ${selector}`;
        }

        return field;
    }

    /**  
     * Get a single element from the set returned by selector
     * 
     * @throws error if the element can't be found
     */
    get_element(name: string, selector?: string): HTMLElement {
        let element = this.get_elements(name, selector);

        return element[0];
    }

    /**
     * Count the number of elements matching this selector. We use this to figure out if an element is present without
     * generating any errors or notifications.
     * 
     * @param {string} name The name of the element
     * @param {string} selector Optional: if provided, a css string to query. If not provided, we will use name to find a known selector
     * @returns {number} The number of results found
     */
    count_elements(name: string, selector?: string): number {
        /** Automatically use known selectors */
        if (typeof selector === "undefined") {
            if (!this.selectors.has(name)) {
                Notify.error("An internal error occurred: Unable to find selector for " + name);
                throw "count_elements: unable to find " + name;
            }
            selector = this.get_selector(name);
        }

        let elements = this.find(selector);

        return elements.length;
    }

    /**
     * A shortcut to get the field value for a given selector
     * 
     * @throws error if the element can't be found
     */
    get_field_value(name: string, selector?: string): string {
        let field = this.get_elements(name, selector);

        let value = field.val();

        if (typeof value === typeof [""]) {
            return (value as string[]).join(", ");
        }

        return value as string;
    }

    /**
     * Get the text of the element at the selector
     * 
     * @throws error if the element can't be found
     */
    get_element_text(name: string, selector?: string): string {
        let elements = this.get_elements(name, selector);
        let text = elements.text();
        return text.trim();
    }

    /**
     * A shortcut to set the field value for a given selector
     * 
     * Delays execution to simulate human behavior
     * 
     * @throws error if the element can't be found
     */
    async set_field_value(name: string, value: string, selector?: string) {
        let field = this.get_elements(name, selector);

        field.trigger('focus');
        await sleep(0, 50);
        field.val(value);
        await sleep(0, 50);
        field.trigger('change');

        /** confirm it was set, because the page's javascript could change it */
        if (field.val() !== value) {
            Notify.error("Unable to set the " + name);
            throw `Unable to set the ${name} field`;
        }

        return true;
    }

    /**
     * 
     */
    async select_radio(parent: string, selector: string): Promise<void> {
        try {
            let element = $(parent);
            element[0].scrollIntoView();
            await sleep(100, 50);

            /** Click the option */
            let option = element.find(selector);
            if (option) {
                option.trigger('click');
            } else {
                Notify.error("Unable to find radio button for " + selector);
            }

            await sleep(100, 50);

        } catch (err) {
            Notify.error("Error funding radio button for " + selector);
            Notify.log(err);
        }
    }

    /**
     * Validate that a given field is equal to a provided value
     * 
     * @throws error if the element can't be found
     */
    validate_field(name: string, expected_value: string | number, selector?: string): boolean {
        let actual_value = this.get_field_value(name, selector);

        if (actual_value !== expected_value) {
            Notify.error(`Validation error: ${name} is not what we expected.`);
            Notify.log(`${name}: "${actual_value}" !== "${expected_value}"`);
            return false;
        }
        return true;
    }

    /**
     * Validates that a given field is equal to something
     * 
     * @throws error if the element can't be found
     */
    validate_field_notempty(name: string, selector?: string): boolean {
        let value = this.get_field_value(name, selector);

        if ((/([^\s])/).test(value) !== true) {
            Notify.error(`Validation error: ${name} is empty.`);
            Notify.log(`${name}: empty value => "${value}`);
            return false;
        }

        return true;
    }

    /**
     * 
     */
    scrollTo(element: JQuery) {
        element[0].scrollIntoView({
            behavior: "smooth"
        });
    }

    create_element(tag: string | JQuery, { text = null, container, id = null, classname = null }: Element_Parameters): JQuery {
        /** If we only have a tagname (this is the typical workflow), then create a new jQuery object */
        if (isString(tag)) {
            tag = $(`<${tag}></${tag}>`);
        }

        /** 
         * $($("element")) === $("element") 
         * -- so this basically casts any acceptable type to a jquery object
         */
        let element = this.find(tag);

        /** Add our properties */
        if (id !== null) {
            element.prop('id', id);
        }
        if (classname !== null) {
            element.addClass(classname);
        }
        if (text !== null) {
            element.text(text);
        }

        /**
         * If no container, then add it to the body and signal that it is a floating element
         */
        let parent = container;
        if (typeof container === "undefined") {
            Notify.debug("Adding floating button: ", arguments);
            element.addClass('monkey-floating-button');
            parent = $(document.body);
        } else if (isString(container)) {
            parent = this.find(container);
        }

        /** Respect that null means don't add it to anything */
        if (parent !== null) {
            if (parent.length < 1) {
                Notify.warn("Unable to find container.", ...arguments)

                let t = async function () {
                    let start_time = performance.now();
                    while (performance.now() < start_time + 10000) {
                        let element = this.find(container);
                        if (element.length > 0) {
                            break;
                        }
                        await sleep(10);
                    }

                    if (element.length > 0) {
                        console.debug("Found after " + (performance.now() - start_time) + " ms.");
                    } else {
                        console.debug("Never found ", container);
                    }
                }.bind(this)();
            }
            element.appendTo(parent);
        }

        return element;
    }

    /**
     * Creates a single button somewhere on the page
     */
    create_button({ text = null, container, callback = null, id = null, classname = null, button = null, disabled = false }: Button_Parameters): Button {
        if (button === null) {
            button = $('<button></button>');
        }
        button.addClass('btn btn-primary');

        if (disabled === true) {
            button.prop('disabled', 'disabled');
        }

        let element = this.create_element(button, { text: text, id: id, classname: classname, container: container });

        if (callback !== null) {
            element.on('click', (evt) => {
                evt.preventDefault();
                callback();
            });
        }

        return new Button( element, this );
    }

    create_jsx_button({ text = "Button", container = "buttons", callback = () => {}, id = null, className = "", disabled = false }: JSX_Button_Parameters) : JSX.Element {
        console.debug("Creating new jsx button");

        const button = this.create_jsx_button_internal({ text: text, container: container, callback: callback, id: id, className: className, disabled: disabled });
        const jsx = this.create_jsx_button_wrap(button);

        return jsx;
    }

    create_jsx_button_wrap( button : JSX.Element | Array<JSX.Element> ) {
        const jsx = <React.StrictMode><div className="Buttons">
            <header className="App-header">
                { button }
            </header>
        </div></React.StrictMode>;

        return jsx;
    }

    create_jsx_button_internal({ text = "Button", container = "buttons", callback = () => { }, id = null, className = "", disabled = false }: JSX_Button_Parameters): JSX.Element {
        className = "btn btn-primary userscript_btn " + className;
        return <MButton id={id} className={className} variant="contained" onClick={() => { Notify.debug(`clicked ${id}`); callback(); }}>{text}</MButton>
    }

    create_jsx_buttons(list: Array<JSX_Button_Parameters>): JSX.Element {
        let buttons: Array<JSX.Element> = new Array<JSX.Element>();

        for (let data of list) {
            let button = this.create_jsx_button_internal(data);
            buttons.push(button);
        }

        return this.create_jsx_button_wrap( buttons );
    }

    /**
     * Creates a series of buttons and returns an array of jquery references to them
     */
    create_buttons(list: Array<Button_Parameters>): Array<Button> {
        let buttons : Array<Button> = new Array<Button>();

        for (let data of list) {
            let button = this.create_button(data);
            buttons.push(button);
        }

        return buttons;
    }

    /**
     * Waits for an iframe to report it is ready. This bypasses issues of the main document being ready before the iframe.
     *
     * @param {string} iframe The css selector for the iframe
     * @param {number} timeout_seconds The number of seconds to wait before timing out.
     * @returns {Promise<Jquery<HTMLObjectElement>>} The iframe on success. Throws an error on failure.
     * @throws An error on timeout.
     */
    async iframe_ready(selector: string, timeout_seconds: number = 10): Promise<JQuery<HTMLObjectElement>> {
        let start = performance.now();
        let iframe: JQuery<HTMLObjectElement>;
        while (performance.now() < start + timeout_seconds * 1000) {
            iframe = $(selector);

            if (iframe.length > 0) {
                let doc = iframe[0].contentDocument || iframe[0].contentWindow.document;

                if (doc.readyState === "complete") {
                    Notify.debug(`Iframe (${selector}) ready`);
                    return iframe;
                }
            }
        }

        Notify.debug("Iframe never readied: " + selector, iframe);
        throw "Iframe never readied: " + selector;
    }

    /**
     * Waits for an element within an iframe to be ready. This bypasses issues of the main document being ready before the iframe,
     * as well as the iframe being ready before javascript loads in additional content.
     *
     * @param {string} iframe_selector The css selector for the iframe
     * @param {string} element_selector The css selector for the element inside the iframe
     * @param {number} timeout_seconds The number of seconds to wait before timing out.
     * @returns {Promise<Jquery<HTMLElement>>} The element on success. Throws an error on failure.
     * @throws An error on timeout.
     */
    async iframe_element_ready(iframe_selector: string, element_selector: string, timeout_seconds: number = 10): Promise<JQuery<HTMLElement>> {
        let iframe: JQuery<HTMLElement>;
        let element: JQuery<HTMLElement>;

        let start_time = performance.now();
        await this.iframe_ready(iframe_selector, timeout_seconds);

        while (performance.now() < start_time + timeout_seconds * 1000) {
            /** Get the iframe via selector every time in case the page changes. */
            iframe = $(iframe_selector);

            if (iframe.length < 1) {
                Notify.warn("The page changed before the iframe element was ready.");
                break;
            }

            element = iframe.contents().find(element_selector);

            if (element.length > 0) {
                Notify.debug(`Iframe element (${element_selector}) ready`);
                return element;
            }

            await sleep(10);
        }

        throw `Unable to find iframe element: ${iframe_selector} -> ${element_selector}`;
    }

    /**
     * Waits for the page to be ready. Expected to be overridden by subclasses.
     * 
     * @returns {Promise<void>} nothing on success, throws an error on failure.
     * @throws Error if the page doesn't ready in time
     */
    async ready(timeout_seconds: number = 10) {
        await until(function() {
            /** When document.body can be found */
            return $(document.body).length > 0;
        }, timeout_seconds);
    }

    /**
     * Checks if the current page is this page type. Subclasses will define this behavior. 
     * By default, always returns false until implemented by a subclass.
     * @returns {Boolean}
     */
    static isPage( ) : boolean {
        return false;
    }
}