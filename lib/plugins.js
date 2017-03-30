'use strict';

const fs = require('fs');
const _ = require('lodash');

class Plugins {
    constructor() {
        this.plugins = {};
    }

    initialize(core) {
        this.core = core;
    }

    load() {
        const self = this;

        try {
            const plugins = fs.readdirSync(self.core.options['plugin-location']);
            _.forEach(plugins, (plugin_name) => {
                try {
                    const plugin_path = `${self.core.options['plugin-location']}/${plugin_name}`;

                    _.each(_.keys(require.cache), (cache) => {
                        if(cache.indexOf(plugin_path) != -1)
                            delete require.cache[cache];
                    });

                    const plugin = require(plugin_path);

                    if((_.isString(plugin.type) && plugin.type == 'core') || (_.isArray(plugin.type) && _.contains(plugin.type, 'core'))) {
                        plugin.initialize(self.core);
                        self.core.loggers['containership.core'].log('verbose', `Loaded ${plugin_name} plugin`);
                        self.plugins[plugin_name] = plugin;
                    }
                } catch(err) {
                    self.core.loggers['containership.core'].log('warn', `Failed to load ${plugin_name} plugin`);
                    self.core.loggers['containership.core'].log('warn', err.message);
                }
            });

            self.core.loggers['containership.core'].log('info', `Successfully loaded ${_.keys(self.plugins).length} plugins!`);
        } catch(err) {
            self.core.loggers['containership.core'].log('warn', 'Invalid plugin path provided!');
            self.core.loggers['containership.core'].log('warn', err.message);
        }
    }

    reload () {
        const plugins = _.values(module.exports.plugins);
        _.forEach(plugins, (plugin) => { plugin.reload(); });
        module.exports.plugins = {};
        module.exports.load();
    }

    stop() {
        const plugins = _.values(module.exports.plugins);
        _.forEach(plugins, (plugin) => { plugin.stop && plugin.stop(this.core); });
    }

}

module.exports = new Plugins();
