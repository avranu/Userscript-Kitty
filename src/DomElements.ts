import Notify from './Notify';
import Page from './Pages';
import * as fn from './functions';

const $ = jQuery;

//import * as ReactClient from 'react-dom/client';

/** The main react section */
export const REACT_MAIN = "main";

/**
 * Base class for all HTML elements in this file
 */
export class HTML_Element { 
	element : HTMLElement;
	page : Page;
	
	constructor( element : HTMLElement, page : Page ) {
		if (typeof element === 'undefined') {
			throw new Error('Required param not passed to HTML_Element');
		}
		this.element = element;
		this.page = page;
	}

	/**
	 * Dispatches a new mouseevent
	 * @param {string} eventType The type of event (i.e. "mouseover")
	 * @param {object} config The config object with key/value pairs
	 * @returns {bool} Success
	 */
	mouseEvent( eventType : string, config : Object = {'bubbles': true} ) : boolean {
		this.page.auto.scrollIntoView( this.element );
		const result = this.element.dispatchEvent(new MouseEvent(eventType, config));
		if (result !== true) {
			console.log('Tried to dispatch '+eventType+', but did not succeed: ', result);
			return false;
		}
		return true;
	}

	/**
	 * Hovers over the element
	 * @returns {bool} success
	 */
	hover() : boolean {
		this.page.auto.scrollIntoView( this.element );
		return this.mouseEvent('mouseover');
	}

	/**
	 * Ends hovering over the element
	 * @returns {bool} success
	 */
	endHover() : boolean {
		this.page.auto.scrollIntoView( this.element );
		return this.mouseEvent('mouseout');
	}

	/**
	 * Find a containing dom element by selector
	 * @param {string} selector The selection stirng
	 * @returns {Object} The DOM element found
	 */
	find( selector : string ) : JQuery {
		return $(this.element).find( selector );
	}

	/**
	 * Pass through to element.getAttribute(name)
	 * @param {string} name The attribute name
	 * @returns {string} The value
	 */
	getAttribute( name ) : string {
		return this.element.getAttribute(name);
	}
}

export class Clickable extends HTML_Element {
	/**
	 * Click on the element by simulating a mouse click
	 * @returns {bool} Success (always true)
	 */
	click() {
		this.page.auto.simulateClick(this.element);
		return true;
	}

	/**
	 * Pass on scrollIntoView functionality from the DOM element
	 * @param {Array} config The config options
	 * @returns {null} void
	 */
	scrollIntoView( config : Object ) : void {
		return this.page.auto.scrollIntoView( this.element, config );
	}
}

/**
 * A class to represent a button HTML object
 */
export class Button extends Clickable {
	buttonType : string;

	constructor(element, page : Page) {
		super(element, page);

		this.buttonType = null;
	}

	/**
	 * Get the button text
	 * @returns {string} The text
	 */
	text() : string {
		let text = this.element.querySelectorAll('div');
		if (!(text && text.length > 0)) {
			Notify.log('Unable to find text for button', this.element);
			return null;
		}
		return text[0].textContent;
	}

	/**
	 * Click on the button (simulated)
	 * @overrides Clickable:click()
	 * @returns {bool} Success
	 */
	click() : boolean {
		/** Log the action */
		if (this.buttonType !== null) {
			this.page.auto.actions.log(this.buttonType);
			Notify.debug('Clicking '+this.buttonType+' button', this.element);
		} else {
			Notify.debug('Clicking button', this.element);
		}

		this.page.auto.simulateClick(this.element);
		return true;
	}
}

/**
 * Represents an HTML anchor tag
 */
export class Link extends Clickable {

	/**
	 * Simulates a mouse click on the link
	 * @returns {bool} Success
	 */
	click() : boolean {
		Notify.debug('Clicking link', {object: this.element});
		this.page.auto.simulateClick(this.element);
		return true;
	}
}

export class Registry extends Map<string, string> {
	context : JQuery<HTMLElement>;

	constructor( map? : Object, context : fn.Query = document ) {
		if (typeof map !== "undefined") {
			super(Object.entries(map));
		} else {
			super();
		}

		this.context = this.normalize_query( context );
	}

	find( name : string ) : JQuery<HTMLElement> {
		if (!this.has(name)) {
			Notify.log(`Registry does not have "${name}" field`);
			return jQuery();
		}

		let selector = this.get(name);
		let entry = this.context.find(selector);

		if (entry.length < 1) {
			Notify.warn(`Could not find "${name}"`);
		}

		return entry;
	}

	count( name : string ) : number {
		if (!this.has(name)) {
			return 0;
		}

		let entry = this.context.find( this.get(name) );
		return entry.length;
	}

	/**
	 * Turns a query parameter into a jquery object
	 * 
	 * @param {Query} selector 
	 * @returns {Jquery<HTMLElement>}
	 */
	protected normalize_query(selector: fn.Query): JQuery<HTMLElement> {
		if (selector instanceof jQuery) {
			return selector as JQuery;
		}

		if (selector instanceof Document) {
			/** We only want HTMLElements here. */
			return $(selector.body as HTMLElement);
		}

		if (selector instanceof Window) {
			/** We only want HTMLElements here. */
			return $(selector.document.body as HTMLElement);
		}

		if (fn.isString(selector)) {
			return $(this.get(selector as string));
		}

		throw new Error("Unknown type for normalize_query: " + typeof selector);
	}
}