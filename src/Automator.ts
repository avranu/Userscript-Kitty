import { sleep } from './functions';
import * as DOM from './DomElements';
import Notify from './Notify';
import Actions from './Actions';
import Userscript from './Userscript';
import GMStorage from 'gm-storage';
//import jQuery from 'jquery';

const $ = jQuery;

interface Automator_Config {
  waitTime? : number;
  randomTime? : number;
  logLevel? : number;
}

export default class Automator {
  	waitTime : number;
  	randomTime : number;
  	logLevel : number;
  	actions;
	// A bool to signal that we're ready to continue automating an action
  	ready : boolean = false;
	// Something happened. Terminate the loop at the end of this cycle.
  	terminate : boolean = false;
	/** Convenient access to Userscript.store() */
	readonly store : GMStorage;

	/**
	 * Setup variables
	 */
	constructor({ waitTime = 3000, randomTime = 2000, logLevel = 1} : Automator_Config = {}) {
		this.waitTime = waitTime;
		this.randomTime = randomTime;
		this.logLevel = logLevel;
		this.store = Userscript.store();

		// Load settings for the first time
		this.reloadSettings();
	}

	reloadSettings() {
		Notify.debug('Loading settings');

		try {
			this.waitTime = this.store.get('waitTime') as number;
			this.randomTime = this.store.get('randomTime') as number;
			this.logLevel = this.store.get('logLevel') as number;
		} catch (err) {
			// Catch and log it. Then throw it again.
			console.error('Caught an error while loading settings', err);
			throw err;
		}
	}

	/**
	 * Simulate an event triggered by a real mouse
	 * @param {Object} element The element to trigger it on
	 * @param {string} eventName the name of the event (i.e. click)
	 * @param {int} coordX the X coordinate of the mouse click
	 * @param {int} coordY The Y coordinate of the mouse click
	 * @returns {MouseEvent} MouseEvent created
	 * @throws exception if mouse event fails
	 */
	simulateMouseEvent(element, eventName : string, coordX : number, coordY : number) : MouseEvent {
		try {
			let evt = new MouseEvent(eventName, {
				//view: window,
				bubbles: true,
				cancelable: true,
				clientX: coordX,
				clientY: coordY,
				button: 0
			});
			element.dispatchEvent(evt); 
	
			return evt;
		} catch (err) {
			/** Log it and throw it again */
			Notify.error("Unable to simulate mouse event");
			Notify.log('Caught an error', err);
			throw err;
		}
	}

	/**
	 * Visibly shows where a click occurred on the screen
	 * @param {number} x The x position
	 * @param {number} y The y position
	 * @param {string} color The color of the dot
	 * @returns {null} void
	 */
	showClick( x : number, y : number, color : string ) : void {
		const top = y + 5;
		const left = x - 5;
		const style = 'position:absolute;top:'+top+'px;left:'+left+'px;background:'+color+';border-radius:5px;width:10px;height:10px;border: 1px solid black;z-index:99999;display:none;';

		//$('body').append('<div style="position:absolute;top:'+top+'px;left:'+left+'px;background:'+color+';border-radius:5px;width:10px;height:10px;border: 1px solid black;z-index:99999;"></div>');
		$('<div style="'+style+'"></div>').appendTo('body').fadeIn(300, function() {
			$(this).fadeOut(2000);
		});
	}

	/**
	 * Scrolls the viewport so that the element is visible
	 * @param {Clickable|Object} element the element. Either a clickable obj, or a DOM obj.
	 * @param {Object} options The key/value pairs for options
	 * @returns {null} void
	 */
	scrollIntoView( element, options? : Object ) {
		let config = {block: 'center', behavior: 'smooth', ...options};
		element.scrollIntoView(config);
	}

	/**
	 * Simulate a series of mouse events to look like a real mouse click
	 * @param {Object} element The element to click on
	 * @returns {Promise<boolean>} Success
	 */
	async simulateClick( element ) : Promise<boolean> {
		let box = element.getBoundingClientRect(),
			x = box.left + 2 + Math.random() * Math.max(1, box.width - 4) + window.scrollX,
			y = box.top + 2 + Math.random() * Math.max(1, box.height - 4) + window.scrollY;

		Notify.debug('Simulating click', element);

		// Randomize pixels just a little bit
		// move from exact center a random amount between -(1/2 length) to +(1/2 length) with a padding of 2 pixels on each side
		//x += Math.random() * (box.width - 4) - ((box.width - 4) / 2);
		//y += Math.random() * (box.height - 4) - ((box.height - 4) / 2);

		try {
			// Make sure element is in view
			this.scrollIntoView(element);
			await sleep(100, 100);
			// Hover over it
			this.simulateMouseEvent(element, 'mouseover', x, y);
			await sleep(100, 300);
			// Mouse button down
			this.simulateMouseEvent(element, 'mousedown', x, y);
			await sleep(100, 100);
			// Mouse button up
			this.simulateMouseEvent(element, 'mouseup', x, y);
			await sleep(50, 50);
			// Fire click event
			let mouseEvent = this.simulateMouseEvent(element, 'click', x, y);
			this.showClick(mouseEvent.clientX, mouseEvent.clientY, '#222');
			await sleep(200, 500);
			// Move out of the element
			this.simulateMouseEvent(element, 'mouseout', x, y);
		} catch (err) {
			Notify.error("Unable to simulate a click", err);
			return false;
		}

		return true;
	}

	/**
	 * Create our custom buttons to interact with this tool
	 * @returns {bool} Success
	 */
	createButtons() : boolean {
		// Save "this" for jquery stuff later
		let auto = this;
		let header = document.querySelector('body');
		if (!header) {
			console.log('Unable to create new IG buttons');
			return false;
		}

		const html = `
			<div id="automation">
				<div id="menu">
					<button class="hamburger">&#9776;</button>
					<button class="cross">×</button>
				</div>
				<div id="actions">
					<button class="waves-effect waves-light btn" id="like">Like</button>
					<button class="waves-effect waves-light btn" id="follow">Follow</button>
					<button class="waves-effect waves-light btn" id="unfollow">Unfollow</button>
					<button class="waves-effect waves-light btn" id="test">Test</button>
					<button class="waves-effect waves-light btn" id="settings">Settings</button>
				</div>
		   	</div>`;
		$(html).appendTo($('body'));

		$( '#automation #menu .cross' ).hide();
		$( '#automation #actions' ).hide();
		$( '#automation .hamburger' ).on("click",function() {
			$( '#automation #actions' ).slideToggle( 'slow', function() {
				$( '#automation .hamburger' ).hide();
				$( '#automation .cross' ).show();
			});
		});

		$( '#automation .cross' ).on("click",function() {
			$( '#automation #actions' ).slideToggle( 'slow', function() {
				$( '#automation .cross' ).hide();
				$( '#automation .hamburger' ).show();
			});
		});

		$('#automation #settings').click(function(e) {
			e.preventDefault();
			try {
				if ($(this).hasClass('open')) {
					//GM_config.close();
					Notify.error("todo");
				} else {
					//GM_config.open();
					Notify.error("todo");
				}
				$(this).toggleClass('open');
			} catch (err) {
				Notify.error('Unable to open settings', {object: err});
			}
		});
		return true;
	}

	init() {
		this.actions = new Actions();
		this.createButtons();
	}

}
