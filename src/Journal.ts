const $ = jQuery;

export default class Journal extends Map<number, string> {
    #parse_parameters( param : string | number, timestamp : number | null = null ) : [string | null, number | null] {
        let entry : string | null = null;
        if (typeof param === "number") {
            timestamp = param as number;
        } else if (typeof param === "string") {
            entry = param as string;
        } else {
            /** future proof */
            throw "Error parsing Journal parameters";
        }
        return [entry, timestamp];
    }

    /**
     * Adds an entry to the journal at the current timestamp
     * @param {string} entry The entry to add at this timestamp
     * @param {number} timestamp The timestamp to add it, or if not provided, the current timestamp is used
     * @return {number} The timestamp (key) this entry was added at.
     */
    add( entry : string, timestamp : number | null = null ) : number {
        if (timestamp === null) {
            /** Default to now */
            let date = new Date();
            timestamp = date.valueOf();
        }

        this.set(timestamp as number, entry);
        return timestamp;
    }

    /**
     * Filter a list of actions 
     * @param {string} entry the name of the entry
     * @param {number} since The timestamp to search after
     * @returns {Journal} The filtered journal
     */
    filter(entry: string, timestamp: number | null): Journal;
    filter(since_timestamp: number): Journal;
    filter(param: string | number, since_timestamp: number | null = null): Journal {
        let list : Journal = this;

        const [entry, since] = this.#parse_parameters(param, since_timestamp);

        if (entry !== null) {
            /** Make a new map filtered by this entry */
            list = new Journal(
                [...list]
                    .filter(([_key, value]) => value === entry)
            );
        }

        if (since !== null) {
            /** Make a new map, filtered by entries occurring after the timestamp */
            list = new Journal(
                [...list]
                    .filter(([key, _value]) => key >= since)
            );
        }

        return list;
    }

    /**
     * Counts the number of times an entry occurs in our data
     * @param {string} entry The entry to search for
     * @param {number} since_timestamp A timestamp to look after
     * @returns {int} The number of entries found
     */
    count( entry : string, timestamp : number | null ) : number;
    count( since_timestamp : number ) : number;
    count( param : string | number, since_timestamp : number | null = null ) : number {
        let list : Journal;

        const [entry, since] = this.#parse_parameters(param, since_timestamp);

        if (entry !== null) {
            list = this.filter(entry, since);
        } else {
            list = this.filter(since);
        } 

        return list.size;
    }

    /**
     * Clears the journal up to a given time
     * @param {number} before A timestamp to clear entries before
     * @returns {number} The number of entries removed
     */
    trim(before?: number) : number {
        let count = 0;

        // Clear everything
        if (typeof before === "undefined") {
            let date = new Date();
            before = date.valueOf();
        }

        for (const [key, _value] of this) {
            if (key < before) {
                this.delete(key);
                count += 1;
            }
        }

        return count;
    }

    /**
     * Split the journal at the provided timestamp
     * @param {number} timestamp The timestamp to split on
     * @returns {[Journal, Journal]} An array of journals: [before, after]
     */
    split( timestamp : number ) : [Journal, Journal] {
        let before = new Journal();
        let after = new Journal();

        for (const [key, value] of this) {
            if (key < timestamp) {
                before.set(key, value);
            } else {
                after.set(key, value);
            }
        }

        return [before, after];
    }
}