var I18n = require('i18n');
var Boom = require('boom');
var Hoek = require('hoek');
var _ = require('lodash');
var pkg = require('./package.json');

exports.extractDefaultLocale = function(allLocales) {
  if (!allLocales) {
    throw new Error('No locales defined!');
  }
  if (allLocales.length === 0) {
    throw new Error('Locales array is empty!');
  }
  return allLocales[0];
};

exports.plugin = {
  name: pkg.name,
  version: pkg.version,
  pkg: pkg,
  register: function(server, options) {
    var pluginOptions = {};
    if (options) {
      pluginOptions = options;
    }
    I18n.configure(pluginOptions);

    var defaultLocale =
      pluginOptions.defaultLocale ||
      exports.extractDefaultLocale(pluginOptions.locales);
    
    const authCredentialsLanguageCode =
      pluginOptions.authCredentialsLanguageCode || 'languageCode';

    if (!pluginOptions.locales) {
      throw Error('No locales defined!');
    }
    /**
     * because we use the request.auth.credentials
     * we run this module onCredentials.
     * The original ran onPreAuth which always returned null.
     */
    server.ext('onPostAuth', function(request, h) {
      request.i18n = {};
      I18n.init(request, request.i18n);
      request.i18n.setLocale(defaultLocale);
      if (request.params && request.params.languageCode) {
        if (
          _.includes(pluginOptions.locales, request.params.languageCode) ==
          false
        ) {
          throw Boom.notFound(
            'No localization available for ' + request.params.languageCode
          );
        }
        request.i18n.setLocale(request.params.languageCode);
      } else if (
        pluginOptions.queryParameter &&
        request.query &&
        request.query[pluginOptions.queryParameter]
      ) {
        if (
          _.includes(
            pluginOptions.locales,
            request.query[pluginOptions.queryParameter]
          ) == false
        ) {
          throw Boom.notFound(
            'No localization available for ' +
              request.query[pluginOptions.queryParameter]
          );
        }
        request.i18n.setLocale(request.query[pluginOptions.queryParameter]);
      } else if (
        pluginOptions.languageHeaderField &&
        request.headers[pluginOptions.languageHeaderField]
      ) {
        var languageCode = request.headers[pluginOptions.languageHeaderField];
        if (languageCode) {
          request.i18n.setLocale(languageCode);
        }
      } else if (
        /**
         * The request.auth.credentials is used commonly in JWT.
         *
         * @see https://github.com/dwyl/hapi-auth-jwt2-cookie-example
         */
        request.auth.credentials &&
        request.auth.credentials[authCredentialsLanguageCode]
      ) {
        if (
          _.includes(
            pluginOptions.locales,
            request.auth.credentials[authCredentialsLanguageCode]
          ) == false
        ) {
          throw Boom.notFound(
            'No localization available for ' +
              request.auth.credentials[authCredentialsLanguageCode]
          );
        }
        request.i18n.setLocale(request.auth.credentials[authCredentialsLanguageCode]);
      }
      return h.continue;
    });

    server.ext('onPreResponse', function(request, h) {
      if (!request.i18n || !request.response) {
        return h.continue;
      }
      var response = request.response;

      if (Boom.isBoom(response)) {
        return response;
      }

      if (response.variety === 'view') {
        response.source.context = Hoek.merge(
          response.source.context || {},
          request.i18n
        );
        response.source.context.languageCode = request.i18n.getLocale();
      }
      return h.continue;
    });
  }
};
