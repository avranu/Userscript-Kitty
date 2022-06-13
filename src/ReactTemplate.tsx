import ReactClient from 'react-dom/client';
import * as fn from './functions';
import Notify from './Notify';

const $ = jQuery;

/**
 * Stores a list of locations where we have react code rendering on this page
 */
export default class ReactTemplate extends Map<string, ReactClient.Root> {

    /** Allow passing an object of key/value pairs to the constructor */
    constructor(map: fn.QueryList = {}) {
        super();

        /** Create a new area for each area we pass in */
        for (const [name, query] of Object.entries(map)) {
            this.create(name, query);
        }
    }

    /**
     * Creates a new react root and adds it to this map
     * 
     * @param {string} name The name of the area to create 
     * @param {fn.Query} container The container to put the root in 
     * @returns {JSX.Element} The root we created
     */
    create(name: string, container: fn.Query = document.body, nowrap: "nowrap" | false = false): ReactClient.Root {
        Notify.debug("Creating new react area: " + name);

        /** Convert it into a JQuery object */
        let parent = fn.normalize_query(container);

        /** Create a wrapper inside */
        if (nowrap === false) {
            parent = $(`<div id="userscript-root-${name}" className="react-wrapper"></div>`).appendTo(parent);
        }

        /** Create a new react root inside that container */
        try {
            const root = ReactClient.createRoot(parent[0]);

            /** Add it to our map */
            this.set(name, root);

            /** Return it for good measure */
            return root;
        } catch (error) {
            Notify.error(`Unable to create a new react area: "${name}"`, parent[0]);
            throw error;
        }
    }

    render(section_name: string, element: JSX.Element): void {
        Notify.debug(`Rendering ${section_name}`);
        try {
            this.get(section_name).render(element);
        } catch (error) {
            if (!this.has(section_name)) {
                Notify.error(`Rendering section ${section_name} before it exists.`);
            } else {
                Notify.error(`Unable to render ${section_name}`, { error: error, element: element, sections: this });
            }
        }
    }
}