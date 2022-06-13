import Notify from "./Notify";
import Userscript from './Userscript';

const $ = jQuery;


/**
 * The types we will accept in any query (such as this.find())
 */
export type Query = string | JQuery<HTMLElement> | Document | Window | HTMLElement;
export type QueryList = { [key: string]: Query };

/**
 * Turns a query parameter into a jquery object
 * 
 * @param {Query} selector 
 * @returns {Jquery<HTMLElement>}
 */
export function normalize_query(selector : Query = document) : JQuery<HTMLElement> {
	if(selector instanceof jQuery) {
		return selector as JQuery;
	}

	if (selector instanceof HTMLElement) {
		return $(selector);
	}

	if (selector instanceof Document) {
		/** We only want HTMLElements here. */
		return $(selector.body as HTMLElement);
	}

	if (selector instanceof Window) {
		/** We only want HTMLElements here. */
		return $(selector.document.body as HTMLElement);
	}

	if (isString(selector)) {
		return $(selector as string);
	}

	throw new Error("Unknown type for normalize_query: " + typeof selector);
}

/**
 * Sleep a certain number of milliseconds before continuing
 * @param {int} ms The milliseconds
 * @param {int} random A random number of milliseconds to add to the time
 * @returns {Promise} The promise to await
 */
export function sleep(ms? : number, random : number = 0) : Promise<void> {
	/** Allow us to standarize this amount from an option in the settings page */
	if (typeof ms === "undefined") {
		ms = Userscript.store().get('waitTime', 200) as number;
	}
    
	// Randomize the amount
	const time = ms + (Math.random() * random);
	const seconds = Math.floor(time/100) / 10;
	if (seconds > 0) {
		Notify.debug(`Waiting ${seconds} seconds`);
	}

	return new Promise(resolve => setTimeout(resolve, time));
}

/**
 * Allows us to wait until a condition is met, or a timeout is hit.
 * Note that, for the time being, condition_fn can never return false on success (because that's what we're using to indicate failure).
 * 
 * @param {Function<boolean>} condition_fn A function to run. If it returns false, we continue checking it. If it returns anything else, we return successfully.
 * @param {number} timeout_seconds The number of seconds to wait until we time out
 * @returns {Promise<any>} On success, returns the anything the condition_fn returns (except false). On failure, throws an error.
 * @throws Error
 */
export async function until( condition_fn : Function, timeout_seconds : number = 10 ) : Promise<any> {
	/** Performance is a convenient way to keep track of time */
	let start_time = performance.now();
	/** Loop until timeout */
	while (performance.now() < start_time + timeout_seconds * 1000) {
		let result = condition_fn();
		if (result !== false) {
			return result;
		}
		/** Wait before looping again. */
		await sleep(10);
	}

	/** Failure */
	let ms = performance.now() - start_time;
	throw new Error(`Until condition never met. Waited ${ms} ms.`);
}

/**
 * Override the default "confirm" function to click on a button (such as "ok") automatically
 * @param {string<"OK"|"Cancel">} button The button to click on
 * @param {Window | JQuery} context 
 * @returns {void} nothing
 */
export function override_confirm(button : "ok" | "cancel" = "ok", context: Window | JQuery = window) : void {
	/**
	 * Use array notation here because JQuery doesn't have a built in "confirm" property
	 */
	var realConfirm = context["confirm"];
	context["confirm"] = function () {
		/** restore the old confirm function */
		context["confirm"] = realConfirm;
		if (button === "ok") {
			/** return true which is identical to clicking "ok" */
			Notify.debug("Clicking ok on confirm automatically.");
			return true;
		}
		/** Click cancel */
		Notify.debug("Clicking cancel on confirm automatically.");
		return false;
	};
}

/**
 * 
 */
export function title_case(input : string) : string {
    return input.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
        }
    );
}

/**
 * Because javascript sucks.
 */
export function isString( input : any ) : boolean {
	return (typeof input === "string" || input instanceof String);
}

/**
 * Get a cookie of the provided name
 * @param {string} name the Name of the cookie
 * @returns {string|null} The cookie
 */
function getCookie(name : string) : string | null {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) {
		return parts.pop().split(';').shift();
	}
	return null;
}

/**
 * Utility to select a random element from an array
 * @param {array} arr The array
 * @return {mixed} The element at a random index
 */
export function _select( arr : Array<any> ) : any {
	let index = Math.floor(Math.random() * arr.length);
	return arr[index];
}
