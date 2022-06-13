// config-overrides.js
module.exports = {
    webpack: function (config, env) {
        if (env === "production") {
            //JS Overrides
            config.output.filename = 'static/js/[name].js';
            config.output.chunkFilename = 'static/js/[name].chunk.js';
        }

        return config;
    }
};