# Amadeco QuickView for Magento 2

[![Latest Stable Version](https://img.shields.io/github/v/release/Amadeco/magento2-quickview)](https://github.com/Amadeco/magento2-quickview/releases)
[![License](https://img.shields.io/github/license/Amadeco/magento2-quickview)](https://github.com/Amadeco/magento2-quickview/blob/main/LICENSE)
[![Magento](https://img.shields.io/badge/Magento-2.4.x-brightgreen.svg)](https://magento.com)
[![PHP](https://img.shields.io/badge/PHP-8.3-blue.svg)](https://www.php.net)

[SPONSOR: Amadeco](https://www.amadeco.fr)

A highly configurable QuickView module for Magento 2 that allows customers to quickly preview product details without leaving the current page. Engineered for performance and strict adherence to modern Magento coding standards.

## Features

- **Performance Optimized:** Implements `IntersectionObserver` for lazy loading of QuickView buttons, reducing initial DOM impact.
- **Modern Architecture:** Built on PHP 8.3 using strict typing, constructor promotion, and readonly properties.
- **Broad Compatibility:** Supports all product types (Simple, Configurable, Grouped, Bundle, Downloadable, Virtual).
- **AJAX-Powered:** Fast loading of modal content.
- **Fully Responsive:** Adapts seamlessly to mobile and desktop viewports.
- **Theme Friendly:** Extensive configuration options to target specific CSS selectors.
- **Seamless Integration:** "Add to Cart" functionality without page reload.

## Requirements

- **Magento:** 2.4.6+ (Tested on 2.4.8)
- **PHP:** 8.3 (Strict Requirement)
- **jQuery:** (Included in Magento)

## Installation

### Using Composer (Recommended)

```bash
composer require amadeco/module-quickview
bin/magento module:enable Amadeco_QuickView
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento setup:static-content:deploy

```

### Manual Installation

1. Create directory `app/code/Amadeco/QuickView` in your Magento installation.
2. Clone or download this repository into that directory.
3. Enable the module and update the database:

```bash
bin/magento module:enable Amadeco_QuickView
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento setup:static-content:deploy

```

## Configuration

Navigate to **Stores > Configuration > Amadeco > Quick View**.

1. **General Settings:**
* Enable/Disable the module.
* **Elements Selector:** Define which product container triggers the button initialization (default: `.product-item`).
* **Button Container:** Specify where to inject the button (default: `.product-item-info`).
* **Button Label:** Customize the text (e.g., "Quick View").


2. **Modal Settings:**
* Set Modal Title.
* Toggle visibility for Product Details, Reviews, and Downloadable Samples.
* Enable/Disable "Go to Product" button.


3. **Theme Selectors:**
* Customize CSS selectors for Tabs and Review links to match your theme's structure.


4. **HTML Identifiers Replacement:**
* Advanced configuration to swap HTML IDs or Classes dynamically within the modal to prevent conflicts with the main page.

## Customisation

The module is designed to be highly customizable. You can configure almost all behavior via Magento's Layout XML system, avoiding the need to write custom JavaScript for simple configuration changes.

### Customizing via Layout XML (Recommended)

To change options like selectors, labels, or disable lazy loading, extend the layout in your theme (e.g., `app/design/frontend/Vendor/Theme/Amadeco_QuickView/layout/default.xml`).

Target the `amadeco.quickview.init` block and define arguments in `jsLayout`:

```xml
<?xml version="1.0"?>
<page xmlns:xsi="[http://www.w3.org/2001/XMLSchema-instance](http://www.w3.org/2001/XMLSchema-instance)" xsi:noNamespaceSchemaLocation="urn:magento:framework:View/Layout/etc/page_configuration.xsd">
    <body>
        <referenceBlock name="amadeco.quickview.init">
            <arguments>
                <argument name="jsLayout" xsi:type="array">
                    <item name="lazy" xsi:type="boolean">false</item>
                    
                    <item name="modalTitle" xsi:type="string" translate="true">Fast Preview</item>
                    
                    <item name="selectors" xsi:type="array">
                        <item name="btnContainer" xsi:type="string">.custom-photo-container</item>
                    </item>
                </argument>
            </arguments>
        </referenceBlock>
    </body>
</page>

CSS Customization

The module includes minimal styling. You can extend the styling in your theme by targeting these classes:
CSS

.quickview-button       /* The trigger button */
.quickview-wrapper      /* The main modal wrapper */
.quickview-media        /* Left column (Images) */
.quickview-main         /* Right column (Details) */


### Why this is better:
1.  **Centralized Config:** All config remains in XML/PHP, adhering to Magento's architecture.
2.  **Translation Support:** XML arguments support `translate="true"` (as seen in the example), which is harder to handle in a raw JS file mixin.
3.  **Clean Code:** No need to pollute the frontend with `mixins` just to change a CSS selector.

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](https://www.google.com/search?q=CONTRIBUTING.md).

## Support

For issues or feature requests, please create an issue on our GitHub repository.

## License

This module is licensed under the **Open Software License ("OSL") v3.0**. See the [LICENSE.txt](https://www.google.com/search?q=LICENSE.txt) file for details.
