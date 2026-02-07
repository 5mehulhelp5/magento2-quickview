/**
 * Amadeco QuickView Module
 *
 * @category   Amadeco
 * @package    Amadeco_QuickView
 * @author     Ilan Parmentier
 */
define([
    'jquery'
], function ($) {
    'use strict';

    /**
     * Mixin for SwatchRenderer component
     * Adds compatibility with Amadeco QuickView by scoping DOM lookups
     * and forcing Product View behavior inside the modal.
     *
     * @param {jQuery.widget} widget
     * @return {jQuery.widget}
     */
    return function (widget) {
        $.widget('mage.SwatchRenderer', widget, {
            options: {
                selectors: {
                    quickViewWrapper: '.quickview-wrapper',
                    galleryPlaceholder: '[data-gallery-role=quickview-gallery-placeholder]'
                }
            },

            /**
             * Initialize Widget
             * We override _create to adjust the scope when inside QuickView
             *
             * @override
             * @private
             */
            _create: function () {
                var $quickView = this.element.closest(this.options.selectors.quickViewWrapper);

                // Standard Behavior: If not in QuickView, run core logic immediately.
                if (!$quickView.length) {
                    return this._super();
                }

                // QuickView Behavior:
                // We must replicate key parts of _create because core hardcodes 
                // '.column.main' and checks for product-item-info to determine inProductList.
                
                // 1. Force Context: We are in a "Product View" scenario (Modal)
                this.inProductList = false;
                
                // 2. Find Form
                this.productForm = this.element.closest('form');

                // 3. Setup Gallery
                // Core expects [data-gallery-role=gallery-placeholder]
                // Our config.xml replaces this with [data-gallery-role=quickview-gallery-placeholder]
                // to avoid conflicts with the underlying page.
                var gallery = $quickView.find(this.options.selectors.galleryPlaceholder);

                if (gallery.length) {
                    if (gallery.data('gallery')) {
                        this._onGalleryLoaded(gallery);
                    } else {
                        gallery.on('gallery:loaded', this._onGalleryLoaded.bind(this, gallery));
                    }
                }

                // 4. Process Options
                // We call super logic for option processing, but we've pre-set flags
                // so the core logic regarding 'inProductList' might be bypassed or consistent.
                // However, since we can't easily inject into the middle of _create,
                // we have to rely on the fact that we handled the Gallery binding above.
                
                // Important: We must NOT return this._super() here if _super tries to bind 
                // events to the WRONG gallery (the one on the category page).
                // But since core searches '.column.main', it likely won't find our QuickView gallery,
                // or worse, it will find the page gallery.
                
                // STRATEGY: We let the rest of the widget initialize (events, etc)
                // but we accept that 'this.options.mediaGalleryInitial' might be set incorrectly by core.
                // We fix the media loading in _loadMedia.
                
                // To support 'options' processing (click events on swatches), we need the base widget logic.
                // We allow _super to run, but we must be careful about what it binds.
                // Since strict overriding is dangerous for updates, we try to run super.
                this._super();
            },

            /**
             * Load Media
             * We override this to ensure images are loaded into the QuickView gallery
             * and not the Category Page product image.
             *
             * @override
             * @private
             */
            _loadMedia: function () {
                var $quickView = this.element.closest(this.options.selectors.quickViewWrapper);

                if (!$quickView.length) {
                    return this._super();
                }

                // QuickView Logic
                var images;

                if (this.options.useAjax) {
                    this._debouncedLoadProductMedia();
                } else {
                    images = this.options.jsonConfig.images[this.getProduct()];

                    if (!images) {
                        images = this.options.mediaGalleryInitial;
                    }

                    // Strict Scope: Only update images inside the QuickView wrapper
                    this.updateBaseImage(this._sortImages(images), $quickView, true);
                }
            }
        });

        return $.mage.SwatchRenderer;
    };
});
