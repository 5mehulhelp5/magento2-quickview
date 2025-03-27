/**
 * Amadeco QuickView Module
 *
 * @category   Amadeco
 * @package    Amadeco_QuickView
 * @author     Ilan Parmentier
 */
define([
    "jquery",
    "mage/url",
    "mage/translate",
    "Magento_Ui/js/modal/modal",
    "jquery-ui-modules/widget"
], function (
    $,
    urlBuilder,
    $t,
    modal
) {
    "use strict";

    $.widget('amadeco.amadecoQuickView', {
        options: {
            handlerClassName: 'quickview-button',
            modalClass: '#quickview-modal',
            modalTitle: $t('Quick View'),
            btnLabel: $t('Quick View'),
            btnTitle: $t('Quick overview of the product'),
            btnPlacement: 'before',
            enableBtnGoToProduct: true,
            enableNav: false,
            selectors: {
                // Product & container selectors
                btnContainer: '.product-item-photo-container',
                productItem: '.product-item',
                productPhotoLink: 'a.product.photo[href!=""][href]',
                priceBox: '[data-role=priceBox]',

                // Button & container selectors
                btnContainerClass: 'quickview-btn-container',

                // Form selectors
                addToCartForm: '#quickview_product_addtocart_form',
                addToCartButton: '.action.tocart',
                addToCartButtonDisabledClass: 'disabled',

                // Tab selectors
                reviewTabSelector: '#tab-label-reviews-title[data-role=trigger]',
                tabTitleClass: '.quickview-tab-title',
                tabContentClass: '.quickview-tab-content',
                bundleTabLink: '#tab-label-quickview-product-bundle-title',
                bundleButton: '#bundle-slide',

                // Product type specific selectors
                downloadableLinks: '#downloadable-links-list',
                qtyField: '.box-tocart .field.qty',
                reviewsActions: '.reviews-actions a.view, .reviews-actions a.add',

                // Misc selectors
                estimateRates: '[data-block=product-estimate-rates]',
                videoCloseBtn: '.fotorama__video-close.fotorama-show-control',

                // CSS classes
                htmlOpenModalClass: 'open-modal',
                bodyOpenedClass: 'quickview-opened',
                initializedClass: 'quickview-initialized',
                disabledClass: 'quickview-disabled'
            },
            texts: {
                addToCartTextWhileAdding: $t('Adding...'),
                addToCartTextAdded: $t('Added'),
                addToCartTextDefault: $t('Add to Cart'),
                goToProductText: $t('Go To Product')
            }
        },

        /**
         * Modal element cache
         * @type {jQuery|null}
         */
        $modal: null,

        /**
         * Initialize the QuickView widget
         *
         * @private
         */
        _create: function () {
            window.amadecoQuickViewOptions = this.options;
            this.$modal = $(this.options.modalClass);
            this._bind();
        },

        /**
         * Initialize QuickView buttons and bind events
         *
         * @private
         * @return {Object} this
         */
        _bind: function() {
            var self = this,
                $el = this.element,
                $parent = $el.closest(this.options.selectors.productItem),
                $productLink,
                productId;

            // Find product link and ID
            $productLink = $parent.find(this.options.selectors.productPhotoLink);
            productId = $parent.find(this.options.selectors.priceBox).attr('data-product-id');

            // Skip initialization if product ID is missing
            if (typeof(productId) === 'undefined') {
                return;
            }

            // Skip if already initialized or disabled
            if ($el.hasClass(this.options.selectors.disabledClass) ||
                $el.hasClass(this.options.selectors.initializedClass)) {
                return this;
            }

            // Create quickview button
            this._createQuickViewButton($el);

            // Mark as initialized
            $el.addClass(this.options.selectors.initializedClass);

            return this;
        },

        /**
         * Create QuickView button and attach event handlers
         *
         * @private
         * @param {jQuery} $el - Element to attach QuickView button to
         */
        _createQuickViewButton: function($el) {
            var self = this,
                $btnContainer = $el.find(this.options.selectors.btnContainer),
                $btnQuickView,
                $btnQuickViewBtn;

            // Create button container
            $btnQuickView = $('<div />', {
                'class': this.options.selectors.btnContainerClass,
                'data-action': 'quickview'
            });

            // Create button
            $btnQuickViewBtn = $('<button />', {
                'type': 'button',
                'title': this.options.btnTitle,
                'class': this.options.handlerClassName,
                'data-target': this.options.modalClass,
                'data-toggle': 'modal',
                'tabindex': '-1'
            }).text(this.options.btnLabel);

            // Append button to container
            $btnQuickViewBtn.appendTo($btnQuickView);

            // Insert button into DOM
            if (this.options.btnPlacement === 'before') {
                $btnContainer.prepend($btnQuickView);
            } else {
                $btnContainer.append($btnQuickView);
            }

            // Bind click handler
            $btnQuickViewBtn.on('touch.amadecoQuickView click.amadecoQuickView', function() {
                self._handleQuickViewClick($(this));
            });
        },

        /**
         * Handle QuickView button click
         * Load product data via AJAX and display in modal
         *
         * @private
         * @param {jQuery} $button - Clicked button element
         */
        _handleQuickViewClick: function($button) {
            var self = this,
                $parent = $button.closest(this.options.selectors.productItem),
                $productLink = $parent.find(this.options.selectors.productPhotoLink),
                productId = $parent.find(this.options.selectors.priceBox).attr('data-product-id'),
                optionsModal;

            // Skip if product ID is missing
            if (typeof(productId) === 'undefined') {
                return;
            }

            // Modal options configuration
            optionsModal = {
                type: 'popup',
                responsive: true,
                innerScroll: true,
                title: this.options.modalTitle,
                buttons: []
            };

            // Load product data via AJAX
            $.ajax({
                url: urlBuilder.build('quickview/index/view'),
                showLoader: true,
                cache: true,
                dataType: 'html',
                data: {
                    id: productId,
                    form_key: $.mage.cookies.get('form_key')
                }
            }).done(function(data) {
                // Update modal content
                self.$modal.html(data)
                    .trigger('contentUpdated');

                // Initialize rate estimation if present
                self._initializeEstimateRates();

                // Bind product-specific functionality
                self._bindProductConfigurable()
                    ._bindProductBundle()
                    ._bindProductDownloadable()
                    ._bindProductReviews($productLink)
                    ._bindProductAddToCart();

                // Add Go To Product button if enabled
                self._addGoToProductButton(optionsModal, $productLink);

                // Open modal with configured options
                self._openQuickViewModal(optionsModal);
            });
        },

        /**
         * Initialize shipping rate estimation if present
         *
         * @private
         */
        _initializeEstimateRates: function() {
            var $estimateRates = this.$modal.find(this.options.selectors.estimateRates);
            if ($estimateRates.length) {
                $estimateRates.applyBindings();
            }
        },

        /**
         * Add Go To Product button to modal if enabled
         *
         * @private
         * @param {Object} optionsModal - Modal options object
         * @param {jQuery} $productLink - Product link element
         */
        _addGoToProductButton: function(optionsModal, $productLink) {
            if (this.options.enableBtnGoToProduct && $productLink.length) {
                $.extend(true, optionsModal, {
                    buttons: [{
                        text: this.options.texts.goToProductText,
                        class: 'action secondary',
                        click: function() {
                            window.location.href = $productLink.prop('href');
                        }
                    }]
                });
            }
        },

        /**
         * Open QuickView modal with configured options
         *
         * @private
         * @param {Object} optionsModal - Modal options object
         */
        _openQuickViewModal: function(optionsModal) {
            var self = this;

            self.$modal.modal(optionsModal)
                .trigger('openModal')
                .on('modalopened.amadecoQuickView', function() {
                    $('html').addClass(self.options.selectors.htmlOpenModalClass);
                    $('body').addClass(self.options.selectors.bodyOpenedClass);
                })
                .on('modalclosed.amadecoQuickView', function() {
                    $('html').removeClass(self.options.selectors.htmlOpenModalClass);
                    $('body').removeClass(self.options.selectors.bodyOpenedClass);
                    self.$modal.empty();

                    // Bugfix: Fotorama ProductVideo
                    var $videoCloseBtn = $(self.options.selectors.videoCloseBtn);
                    if ($videoCloseBtn.length) {
                        $videoCloseBtn.remove();
                    }
                });
        },

        /**
         * Bind configurable product functionality
         *
         * @private
         * @return {Object} this
         */
        _bindProductConfigurable: function() {
            // Will be implemented in future releases
            return this;
        },

        /**
         * Bind bundle product functionality
         * Hide bundle tab initially and show it when bundle button is clicked
         *
         * @private
         * @return {Object} this
         */
        _bindProductBundle: function() {
            var $bundleBtn = this.$modal.find(this.options.selectors.bundleButton),
                $bundleTabLink = this.$modal.find(this.options.selectors.bundleTabLink);

            if ($bundleBtn.length) {
                $bundleTabLink.parent().hide();

                $bundleBtn.off('click')
                    .on('click', function(e) {
                        e.preventDefault();

                        $bundleTabLink.parent()
                            .show()
                            .trigger('click');
                    });
            }

            return this;
        },

        /**
         * Bind downloadable product functionality
         * Hide quantity field for downloadable products
         *
         * @private
         * @return {Object} this
         */
        _bindProductDownloadable: function() {
            if (this.$modal.find(this.options.selectors.downloadableLinks).length) {
                this.$modal.find(this.options.selectors.qtyField).hide();
            }
            return this;
        },

        /**
         * Bind product reviews functionality
         * Connect review tab links and review actions
         *
         * @private
         * @param {jQuery} $productLink - Product link element
         * @return {Object} this
         */
        _bindProductReviews: function($productLink) {
            var $reviewsTabLink = this.$modal.find(this.options.selectors.reviewTabSelector);

            if ($reviewsTabLink.length) {
                this.$modal.find(this.options.selectors.reviewsActions).click(function() {
                    $reviewsTabLink.trigger('click');
                });
            }

            return this;
        },

        /**
         * Bind add to cart functionality
         * Add form key to the add to cart form
         *
         * @private
         * @return {Object} this
         */
        _bindProductAddToCart: function() {
            var $addToCartForm = this.$modal.find(this.options.selectors.addToCartForm);

            if ($addToCartForm.length) {
                var $formKeyInput = $('<input />')
                    .attr('type', 'hidden')
                    .attr('name', 'form_key')
                    .val($.mage.cookies.get('form_key'));

                $addToCartForm.prepend($formKeyInput);
            }

            return this;
        }
    });

    return $.amadeco.amadecoQuickView;
});