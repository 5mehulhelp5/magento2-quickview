/**
 * Amadeco QuickView Module
 *
 * @category   Amadeco
 * @package    Amadeco_QuickView
 * @author     Ilan Parmentier
 */
define([
    'jquery',
    'jquery-ui-modules/widget'
], function ($) {
    'use strict';

    /**
     * Mixin for SwatchRenderer component
     * Adds compatibility with Amadeco QuickView
     */
    var mixin = {
        /**
         * Override _create method to add QuickView support
         * Detects if we're in QuickView context and sets appropriate elements
         *
         * @private
         */
        _create: function () {
            var options = this.options,
                gallery = $('[data-gallery-role=gallery-placeholder]', '.column.main'),
                productData = this._determineProductData(),
                $main = productData.isInProductView ?
                    this.element.parents('.column.main') :
                    this.element.parents('.product-item-info');

            // Handle QuickView context
            if ($('#quickview-info-main').length) {
                $main = this.element.parents('.quickview-wrapper');
                gallery = $('[data-gallery-role=gallery-placeholder]', '.quickview-wrapper');
            }

            if (productData.isInProductView) {
                gallery.data('gallery') ?
                    this._onGalleryLoaded(gallery) :
                    gallery.on('gallery:loaded', this._onGalleryLoaded.bind(this, gallery));
            } else {
                options.mediaGalleryInitial = [{
                    'img': $main.find('.product-image-photo').attr('src')
                }];
            }

            this.productForm = this.element.parents(this.options.selectorProductTile).find('form:first');
            this.inProductList = this.productForm.length > 0;
        },

        /**
         * Override _loadMedia method to add QuickView support
         * Loads media gallery using ajax or json config
         *
         * @private
         */
        _loadMedia: function () {
            var $main = this.inProductList ?
                    this.element.parents('.product-item-info') :
                    this.element.parents('.column.main'),
                images;

            // Handle QuickView context
            if ($('#quickview-info-main').length) {
                $main = this.element.parents('.quickview-wrapper');
            }

            if (this.options.useAjax) {
                this._debouncedLoadProductMedia();
            } else {
                images = this._getImagesForProduct();
                this.updateBaseImage(this._sortImages(images), $main, !this.inProductList);
            }
        },

        /**
         * Get images for the selected product
         * Falls back to initial gallery if no images found
         *
         * @private
         * @return {Array} Array of image objects
         */
        _getImagesForProduct: function () {
            var images = this.options.jsonConfig.images[this.getProduct()];

            if (!images) {
                images = this.options.mediaGalleryInitial;
            }

            return images;
        }
    };

    /**
     * Apply mixin to SwatchRenderer widget
     *
     * @param {Object} swatchRenderer - Original SwatchRenderer widget
     * @return {Object} Modified SwatchRenderer widget
     */
    return function (swatchRenderer) {
        $.widget('mage.SwatchRenderer', swatchRenderer, mixin);
        return $.mage.SwatchRenderer;
    };
});