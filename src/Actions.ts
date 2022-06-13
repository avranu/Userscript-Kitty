import Notify from './Notify';
import spacetime, { Spacetime } from 'spacetime';
import { Value } from 'gm-storage';
import Userscript from './Userscript';
//import jQuery from 'jquery';

const $ = jQuery;

interface Filter_Types {
	action?: string;
	since? : Spacetime;
	list? : Map<number, string>;
}

interface Action_Types {
	action?: string;
	since?: Spacetime;
}

export default class Actions {
	actions_list : Map<number, string>;

	/**
	 * Set up the actions object
	 */
	constructor() {
		this.load();
	}

	/**
	 * Filter a list of actions 
	 * @param {string} action the name of the action
	 * @param {number} since The since time as key/value pairs. See _timestamp
	 * @param {object} list The list of actions we're working with
	 * @returns {object} The new list
	 */
	_filter({ action, since, list } : Filter_Types = {}) : Map<number, string> {
		/** Default to our known action list. This is the typical use case */
		if (typeof list === "undefined") {
			list = this.actions_list;
		}

		if (typeof action !== "undefined") {
			/** Make a new map filtered by this action */
			list = new Map(
				[...list]
					.filter(([_key, value]) => value === action)
			);
		}

		if (typeof since !== "undefined") {

			/** Make a new map, filtered by actions occurring after the timestamp */
			list = new Map(
				[...list]
					.filter(([key, _value]) => spacetime(key) >= since)
			);
		}

		return list;
	}
	
	/**
	 * Get a full list of actions performed in the past
	 * @returns {object} A map of {timestamp : action}
	 */
	load() {
		let result = Userscript.store().get('actions_list', new Map<Number, string>());

		this.actions_list = result as Map<number, string>;

		return this.actions_list;
	}

	/**
	 * Save the current working list to the DB
	 * @return {null} void
	 */
	save() : void {
		Notify.debug('Saving actions_list');
		let list: { [key: string]: Value } = Object.fromEntries( this.actions_list );
		Userscript.store().set('actions_list', list);
	}

	/**
	 * Get a list of actions (optionally filtered)
	 * @param {string} action the name of the action type
	 * @param {object} since A description of the time to search from in key/value pairs. See _timestamp
	 * @returns {object} A map of {timestamp : action}
	 */
	get({ action, since } : Action_Types = {}) {
		let list = this._filter({action: action, since: since});

		return list;
	}

	/**
	 * Log that an action occurred
	 * @param {string} action the action
	 * @param {int} ts The timestamp it happened
	 * @returns {null} void
	 */
	log( action : string, ts? ) {
		/** Allow other times. We don't need this now but maybe will in the future */
		if (typeof ts === "undefined") {
			ts = spacetime.now().valueOf();
		}

		/** Add it to the existing list */
		this.actions_list[ts] = action;

		/** Save it immediately */
		this.save();
	}

	/**
	 * Counts the number of times an action has occurred
	 * @param {string} action the action
	 * @param {int} since A timestamp to look from
	 * @returns {int} The number of actions found.
	 */
	count({ action, since } : Action_Types = {}) {
		let list = this._filter({ action: action, since: since });

		return Object.keys(list).length;
	}

	/**
	 * Clears the actions list up to a given time
	 * @param {object|null} before In the format of {month, day, hour, minute, second}
	 * @returns {Object} the new list after being (selectively) cleared
	 */
	clear( before? : Spacetime ) {
		// Clear everything
		let since;
		if (typeof before === "undefined") {
			since = spacetime.now();
		} else {
			since = spacetime( before );
		}

		this.actions_list = this._filter({ since: since });
		this.save();

		return this.actions_list;
	}
}
