# Amadeco QuickView for Magento 2

[![Latest Stable Version](https://img.shields.io/github/v/release/Amadeco/magento2-quickview)](https://github.com/Amadeco/magento2-quickview/releases)
[![License](https://img.shields.io/github/license/Amadeco/magento2-quickview)](https://github.com/Amadeco/magento2-quickview/blob/main/LICENSE)
[![Magento](https://img.shields.io/badge/Magento-2.4.x-brightgreen.svg)](https://magento.com)
[![PHP](https://img.shields.io/badge/PHP-8.3+-blue.svg)](https://www.php.net)

[SPONSOR: Amadeco](https://www.amadeco.fr)

A highly configurable QuickView module for Magento 2 that allows customers to quickly preview product details without leaving the current page.

## Features

- Compatible with Magento 2.4.x (tested up to 2.4.7)
- Supports all product types (simple, configurable, grouped, bundle, downloadable, virtual)
- AJAX-powered for fast loading
- Fully responsive design
- Easy to customize with extensive configuration options
- Compatible with custom themes
- Optimized for performance with proper caching
- Add to cart functionality without page reload

## Requirements

- Magento 2.4.x
- PHP 8.3
- jQuery (included in Magento)

## Installation

### Using Composer (recommended)

```bash
composer require amadeco/module-quickview
bin/magento module:enable Amadeco_QuickView
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento setup:static-content:deploy
```

### Manual Installation

1. Create directory `app/code/Amadeco/QuickView` in your Magento installation
2. Clone or download this repository into that directory
3. Enable the module and update the database:

```bash
bin/magento module:enable Amadeco_QuickView
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento setup:static-content:deploy
```

## Configuration

1. Go to Stores > Configuration > Amadeco > Quick View
2. Set the basic settings:
    - Enable/disable the module
    - Configure selectors for product items
    - Customize button label and appearance
3. Configure the modal settings:
    - Set modal title
    - Enable/disable product details tab
    - Enable/disable "Go to Product" button
4. Customize selectors for theme compatibility
5. Configure HTML identifiers replacement for advanced theme integration

## Customisation

The module is designed to be highly customizable to work with any Magento theme. All selectors and HTML identifiers are configurable in the admin panel without needing to modify code.

### CSS Customization

The module includes minimal styling. You can extend the styling in your theme by targeting these classes:

```css
.quickview-button
.quickview-btn-container
.quickview-wrapper
.quickview-media
.quickview-main
```

### JavaScript Configuration

For advanced customization, you can override the JavaScript options in your theme:

```js
define([
    'jquery',
    'Amadeco_QuickView/js/amadeco-quickview'
], function ($) {
    'use strict';

    // Override options
    $.widget('amadeco.amadecoQuickView').prototype.options = $.extend(
        {},
        $.amadeco.amadecoQuickView.prototype.options,
        {
            // Your custom options here
        }
    );
});
```

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md).

## Support

For issues or feature requests, please create an issue on our GitHub repository.

## License

This module is licensed under the Open Software License ("OSL") v3.0. See the [LICENSE.txt](LICENSE.txt) file for details.
