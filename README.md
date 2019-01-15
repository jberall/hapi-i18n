# hapi-i18n

Translation module for hapi based on mashpie's i18n module.

**The latest version is for Hapi 17+. For Hapi versions < 17 use [version 1.0.5](https://github.com/funktionswerk/hapi-i18n/releases/tag/1.0.5)**

## Installation

```
npm install hapi-i18n
```

## Why I wrote this module.

This has all the same functionality of the funktionswerk/hapi-i18n except:
We added another validation option that request.auth.credentials[authCredentialsLanguageCode].
The authCredentialsLanguageCode defaults to languageCode.
You can change that in the options {
...
authCredentialsLanguageCode: 'languageCode' (or whatever your model says.)
}
In order to accomplish the above we where the i18n runs. In funktionswerk/hapi-i18n it runs on the onPreAuth.
This module runs onPostAuth. We do this otherwise every request.auth.credentials[authCredentialsLanguageCode] will return null.
I use this in conjunction with hapi-jwt2. https://github.com/dwyl/hapi-auth-jwt2

## To Do

write test for the token.

## Usage

For details see the examples in the [mocha tests](test/test.js).

The i18n module is attached to the request object configured with the requested locale. This ensures that the correct locale is set for the request when processing multiple requests at the same time.

#### JavaScript

```js
function (request, h){
  return {
    message: request.i18n.__('My localized string')
  };
});

```

#### Jade Template

```js
doctype html
html(lang=languageCode)
  body
    p!= __("My localized string")
    p!= __("hello", {name:"Manu"})
```

#### Nunjucks Template

```
<p>{{ __("My localized string") }}</p>
<p>{{ __("hello", {name:"Manu"}) }}</p>
<p>{{ __("hello", name="Manu2") }}</p>
```

#### Handlebars Template

```html
<p>{{#i18n "My localized string"}}{{/i18n}}</p>
```

For Handlebars you need to specify a helper:

```js
Handlebars.registerHelper('i18n', function(context) {
  return this.__(context);
});
server.route({
  ...
  options: {
    handler: function (request, h) {
      return h.view('A localized webpage', {
        ...
        languageCode: request.params.languageCode
      })
    }
  }
});

```

## Register Plugin

There are three possibilities to pass and read the language code.

### Path parameter

The first option is passing the language code with a path parameter.
The basic configuration to define the supported locales and the directory to load the translation files from is as follows:

```js
await server.register({
  plugin: require('hapi-i18n'),
  options: {
    locales: ['de', 'en', 'fr'],
    directory: __dirname + '/locales'
  });
}
```

The configuration options are passed directly to mashpie's i18n module.
To get the full list of available options see [mashpie/i18n-node](https://github.com/mashpie/i18n-node). The default locale is the first locale found in the list, in this example "de".

The requested language is specified by a path parameter _languageCode_ in your resource urls:

```js
server.route({
  method: 'GET',
  path: '/{languageCode}/localized/resource',
  options: {
    handler: function(request, h) {
      return {
        message: request.i18n.__('My localized string')
      };
    }
  }
});
```

Example request:

```
http://localhost/fr/localized/resource.
```

The language code is evaluated automatically. If a language code is found for the requested path parameter then the according locale is set.
If the language code does not match any of the configured language codes, the plugin returns 404 (NotFound).

### Language code from the request header

The second option is reading the language code from the request header:

```js
await server.register({
  plugin: require('hapi-i18n'),
  options: {
    locales: ['de', 'en', 'fr'],
    directory: __dirname + '/locales',
    languageHeaderField: 'language'
  });
}
```

### Query parameter

A third option is passing the language code with a query parameter (plugin option `queryParameter`). Example:

```js
await server.register({
  plugin: require('hapi-i18n'),
  options: {
    locales: ['de', 'en', 'fr'],
    directory: __dirname + '/locales',
    queryParameter: 'lang'
  });
}
```

The requested locale can be passed with the `lang` query parameter. Example request:

```
http://localhost/my/localized/resource?lang=fr.
```

If the language code does not match any of the configured language codes, the plugin returns 404 (NotFound).

## Define default locale

If no locale is defined, the default locale is selected. By default, the default locale is the first element in the `locales` option.
However, you can specify this with the `defaultLocale` parameter :

```js
await server.register({
  plugin: require('hapi-i18n'),
  options: {
    locales: ['de', 'en', 'fr'],
    directory: __dirname + '/locales',
    defaultLocale: 'en'
  });
}
```
