const $ = jQuery;

/** 
 * Used to keep track of a count on a list of keys
 */
export default class Counter extends Map<string, number> {
    constructor( keys : Array<string> = [] ) {
        super();

        for (let key of keys) {
            this.set(key, 0);
        }
    }

    add( key : string, amount : number = 1 ) : number {
        let val = this.get(key);
        if (typeof val === "undefined") {
            val = 0;
        }

        val += amount;

        this.set(key, val);
        return val;
    }

    subtract( key : string, amount : number = 1 ) {
        return this.add(key, amount * -1);
    }

    incriment(amount : number = 1, keys? : Array<string> | IterableIterator<string>) : number {
        let entries_changed = 0;

        /**
         * Default to every key
         */
        if (typeof keys === "undefined") {
            keys = this.keys();
        }

        for (let key in keys) {
            this.add(key, amount);
            entries_changed += 1;
        }

        return entries_changed;
    }

    decriment(amount: number = 1, keys?: Array<string> | IterableIterator<string>) : number {
        return this.incriment(amount * -1, keys);
    }

    total(keys?: Array<string> | IterableIterator<string>) : number {
        /**
         * Default to every key
         */
        if (typeof keys === "undefined") {
            keys = this.keys();
        }

        let total = 0;
        for ( const key of keys ) {
            total += this.get(key);
        }

        return total;
    }

    reset( key : string ) {
        this.set(key, 0);
    }

    max() : [string, number] {
        let highest_key : string;
        let highest_val : number;

        if (this.size < 1) {
            throw "Counter is empty. No max";
        }

        for ( const [key, value ] of this ) {
            if ( typeof highest_val === "undefined" || value > highest_val ) {
                highest_key = key;
                highest_val = value;
            }
        }

        return [highest_key, highest_val];
    }

    min() : [string, number] {
        let lowest_key: string;
        let lowest_val: number;

        if (this.size < 1) {
            throw "Counter is empty. No min";
        }

        for (const [key, value] of this) {
            if (typeof lowest_val === "undefined" || value < lowest_val) {
                lowest_key = key;
                lowest_val = value;
            }
        }

        return [lowest_key, lowest_val];
    }

    /**
     * Returns a map of sorted values for this counter
     * @param {number} limit The number of (top) entries to return. If negative, the number of (bottom) entries to return. If 0, return all (default).
     * @returns {Map<string, number>} The sorted map
     */
    sort( limit : number = 0 ) : Map<string, number> {
        let result : Array<[string, number]>;

        if ( limit < 0 ) {
            /** Sort by lowest */
            result = [...this.entries()].sort((a, b) => a[1] - b[1]);
            /** Normalize the limit to a positive number */
            limit *= -1;
        } else {
            /** Sort by highest */
            result = [...this.entries()].sort((a, b) => b[1] - a[1]);   
        }

        /** Slice it up based on the limit */
        if (limit !== 0) {
            result = result.slice(0, limit);
        }

        /** Always return a map */
        return new Map(result);
    }
}