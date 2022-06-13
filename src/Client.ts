import Notify from "./Notify"; 
//import jQuery from 'jquery';

const $ = jQuery;

/**
 * 
 */
export default class Client {
    static #location_data : Object | null = null;
    static #location_status : string = "unknown";

    /**
     * 
     */
    constructor() {

    }

    /**
     * 
     */
    static location_status() : string {
        return Client.#location_status;
    }

    /**
     * 
     */
    static location_data() : Object {
        return Client.#location_data;
    }

    /**
     * 
     */
    static set_location_status( value : string ) : void {
        /** Only allow valid statuses */
        if (!["unknown", "requested", "received", "failed"].includes(value)) {
            Notify.error("Internal error: bad location status: " + value);
            throw "Internal error: bad location status: " + value;
        }
        Client.#location_status = value;
    }

    /**
     * Get the location data from the geolocation-db
     */
    static determine_location( callback? : Function ) : void {
        if (Client.#location_data === null && Client.location_status() === "unknown") {
            Client.set_location_status('requested');

            window["location_response"] = function( response, status ) {
                console.log("Found location ", location);
            };

            $.ajax({
                url: "https://geolocation-db.com/json/geoip.php&dataType=json",
            }).done(function(response) {
                    Client.#location_data = JSON.parse(response);
                    Notify.log("Location data ready: ", Client.#location_data);
                    Client.set_location_status('received');
            }).fail(function(options, textStatus) {
                    Notify.warn("Location could not be determined.");
                    Client.set_location_status('failed');
            }).then(function (response, status, jqXHR) {
                /** Always run our callback */
                if (typeof callback !== "undefined") {
                    callback(response, status, jqXHR);
                }
            });
        }
    };

    /**
     * 
     */
    static location_ready() : boolean {
        return Client.location_status() === "received";
    }

    /**
     * 
     */
    static get_location() : Object {
        if (Client.#location_data === null) {
            Notify.log("Location data empty when requested");
            /** Only make one request */
            if (Client.location_status() === null) {
                Client.determine_location();
            }

            /** If we're waiting on it, then wait */
            if (Client.location_status() === "requested") {

                let start_time = performance.now();
                let current_time = start_time;
                while (Client.#location_data === null) {
                    current_time = performance.now();
                    if (current_time - start_time > 10000) {
                        Notify.log("Unable to find the location in 10 seconds");
                        return null;
                    }
                }
            }
        }
        return Client.#location_data;
    }

    /**
     * Use the location data to figure out the city this computer is located in right now
     */
    static get_city() : string {
        let location = Client.get_location();

        return location["city"];
    }

    /**
     * Get the user's IP address right now
     */
    static get_ip () : string {
        let location = Client.get_location();

        return location["IPv4"];
    };
}