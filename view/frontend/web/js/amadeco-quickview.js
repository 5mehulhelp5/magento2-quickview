/**
 * Amadeco QuickView Module
 *
 * @category   Amadeco
 * @package    Amadeco_QuickView
 * @author     Ilan Parmentier
 */
define([
    'jquery',
    'mage/url',
    'mage/translate',
    'Magento_Ui/js/modal/modal',
    'jquery-ui-modules/widget'
], function (
    $,
    urlBuilder,
    $t,
    modal,
    widget
) {
    'use strict';

    $.widget('amadeco.amadecoQuickView', {
        options: {
            lazy: true,
            handlerClassName: 'quickview-button',
            modalClass: '#quickview-modal',
            modalTitle: $t('Quick View'),
            btnLabel: $t('Quick View'),
            btnTitle: $t('Quick overview of the product'),
            btnPlacement: 'before',
            enableBtnGoToProduct: true,
            enableNav: false,
            selectors: {
                btnContainer: '.product-item-photo-container',
                productItem: '.product-item',
                productPhotoLink: 'a.product.photo[href!=""][href]',
                priceBox: '[data-role=priceBox]',
                btnContainerClass: 'quickview-btn-container',
                addToCartForm: '#quickview_product_addtocart_form',
                addToCartButton: '.action.tocart',
                addToCartButtonDisabledClass: 'disabled',
                reviewTabSelector: '#tab-label-reviews-title[data-role=trigger]',
                tabTitleClass: '.quickview-tab-title',
                tabContentClass: '.quickview-tab-content',
                bundleTabLink: '#tab-label-quickview-product-bundle-title',
                bundleButton: '#bundle-slide',
                downloadableLinks: '#downloadable-links-list',
                qtyField: '.box-tocart .field.qty',
                reviewsActions: '.reviews-actions a.view, .reviews-actions a.add',
                estimateRates: '[data-block=product-estimate-rates]',
                videoCloseBtn: '.fotorama__video-close.fotorama-show-control',
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
         * @private
         */
        _$modal: null,

        /**
         * IntersectionObserver instance for lazy init
         * @type {IntersectionObserver|null}
         * @private
         */
        _observer: null,

        /**
         * Initializes the QuickView widget.
         * @private
         */
        _create: function () {
            this._options = this.options;
            this._$modal = $(this.options.modalClass);

            if (this.options.lazy && 'IntersectionObserver' in window) {
                this._setupLazyObserver();
            } else {
                this._initialize();
            }
        },

        /**
         * Sets up IntersectionObserver for lazy initialization.
         * @private
         */
        _setupLazyObserver: function () {
            const self = this;
            this._observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        self._initialize();
                        self._observer.disconnect();
                    }
                });
            }, { rootMargin: '100px' });

            this._observer.observe(this.element[0]);
        },

        /**
         * Sets up the widget, creates buttons, and binds events.
         * @private
         * @returns {Object} Chainable this
         */
        _initialize: function () {
            const $el = this.element;
            const $parent = $el.closest(this.options.selectors.productItem);
            const $productLink = $parent.find(this.options.selectors.productPhotoLink);
            const productId = $parent.find(this.options.selectors.priceBox).attr('data-product-id') ||
                              $parent.attr('data-product-id');
            const productHref = $productLink.prop('href') || '';

            if (typeof productId === 'undefined') {
                console.warn('QuickView initialization skipped: Missing product ID');
                return this;
            }

            if ($el.hasClass(this.options.selectors.disabledClass) ||
                $el.hasClass(this.options.selectors.initializedClass)) {
                return this;
            }

            this._createQuickViewButton($el, productId, productHref);
            $el.addClass(this.options.selectors.initializedClass);

            return this;
        },

        /**
         * Creates the QuickView button and attaches delegated event handler.
         * Stores product data on button to avoid repeated DOM queries.
         * @private
         * @param {jQuery} $el - The element to attach the button to.
         * @param {string} productId - Cached product ID.
         * @param {string} productHref - Cached product link href.
         */
        _createQuickViewButton: function ($el, productId, productHref) {
            const self = this;
            const $btnContainer = $el.find(this.options.selectors.btnContainer);
            const $btnQuickView = $('<div />', {
                'class': this.options.selectors.btnContainerClass,
                'data-action': 'quickview'
            });
            const $btnQuickViewBtn = $('<button />', {
                'type': 'button',
                'title': this.options.btnTitle,
                'class': this.options.handlerClassName,
                'data-target': this.options.modalClass,
                'data-toggle': 'modal',
                'tabindex': '-1',
                'data-product-id': productId,
                'data-product-href': productHref
            }).text(this.options.btnLabel);

            $btnQuickViewBtn.appendTo($btnQuickView);

            if (this.options.btnPlacement === 'before') {
                $btnContainer.prepend($btnQuickView);
            } else {
                $btnContainer.append($btnQuickView);
            }

            $el.on('click.amadecoQuickView touch.amadecoQuickView', `.${this.options.handlerClassName}`, (event) => {
                event.preventDefault();
                self._handleQuickViewClick($(event.currentTarget));
            });
        },

        /**
         * Handles the QuickView button click, loads product data via AJAX, and opens modal.
         * Uses data attributes to avoid DOM traversals.
         * @private
         * @param {jQuery} $button - The clicked button element.
         */
        _handleQuickViewClick: function ($button) {
            const self = this;
            const productId = $button.data('product-id');
            const productHref = $button.data('product-href');

            if (typeof productId === 'undefined') {
                console.warn('QuickView click ignored: Missing product ID');
                return;
            }

            const optionsModal = {
                type: 'popup',
                responsive: true,
                innerScroll: true,
                title: this.options.modalTitle,
                buttons: []
            };

            $.ajax({
                url: urlBuilder.build('quickview/index/view'),
                showLoader: true,
                cache: true,
                dataType: 'html',
                data: {
                    id: productId,
                    form_key: $.mage.cookies.get('form_key')
                }
            }).done((data) => {
                self._$modal.html(data).trigger('contentUpdated');
              
                self._initializeEstimateRates();
              
                self._bindProductConfigurable()
                    ._bindProductBundle()
                    ._bindProductDownloadable()
                    ._bindProductReviews(productHref)
                    ._bindProductAddToCart();
                self._addGoToProductButton(optionsModal, productHref);
                self._openQuickViewModal(optionsModal);
            }).fail((jqXHR, textStatus, errorThrown) => {
                console.error('QuickView AJAX failed:', textStatus, errorThrown);
            });
        },

        /**
         * Initializes shipping rate estimation if the block exists.
         * @private
         */
        _initializeEstimateRates: function () {
            const $estimateRates = this._$modal.find(this.options.selectors.estimateRates);
            if ($estimateRates.length) {
                $estimateRates.applyBindings();
            }
        },

        /**
         * Adds 'Go To Product' button to modal if enabled.
         * @private
         * @param {Object} optionsModal - Modal configuration object.
         * @param {string} productHref - Product link href.
         */
        _addGoToProductButton: function (optionsModal, productHref) {
            if (this.options.enableBtnGoToProduct && productHref) {
                optionsModal.buttons.push({
                    text: this.options.texts.goToProductText,
                    class: 'action secondary',
                    click: () => {
                        window.location.href = productHref;
                    }
                });
            }
        },

        /**
         * Opens the QuickView modal and manages body classes for state.
         * @private
         * @param {Object} optionsModal - Modal configuration object.
         */
        _openQuickViewModal: function (optionsModal) {
            const self = this;
            this._$modal.modal(optionsModal)
                .trigger('openModal')
                .on('modalopened.amadecoQuickView', () => {
                    $('html').addClass(this.options.selectors.htmlOpenModalClass);
                    $('body').addClass(this.options.selectors.bodyOpenedClass);
                })
                .on('modalclosed.amadecoQuickView', () => {
                    $('html').removeClass(this.options.selectors.htmlOpenModalClass);
                    $('body').removeClass(this.options.selectors.bodyOpenedClass);
                    self._$modal.empty();
                    const $videoCloseBtn = $(this.options.selectors.videoCloseBtn);
                    if ($videoCloseBtn.length) {
                        $videoCloseBtn.remove();
                    }
                });
        },

        /**
         * Public method to retrieve the widget's options for external access.
         * @public
         * @param {string} [key] - Optional specific option key to retrieve.
         * @returns {Object|string|undefined} All options or value for specific key.
         */
        getOptions: function (key) {
            if (key) {
                return this.options[key];
            }
            return $.extend(true, {}, this.options);
        },

        /**
         * Placeholder for configurable product bindings (extendable).
         * @private
         * @returns {Object} Chainable this
         */
        _bindProductConfigurable: function () {
            return this;
        },

        /**
         * Binds bundle product functionality, hiding tab until button click.
         * @private
         * @returns {Object} Chainable this
         */
        _bindProductBundle: function () {
            const $bundleBtn = this._$modal.find(this.options.selectors.bundleButton);
            const $bundleTabLink = this._$modal.find(this.options.selectors.bundleTabLink);
            if ($bundleBtn.length) {
                $bundleTabLink.parent().hide();
                $bundleBtn.off('click').on('click', (e) => {
                    e.preventDefault();
                    $bundleTabLink.parent().show().trigger('click');
                });
            }
            return this;
        },

        /**
         * Binds downloadable product functionality, hiding qty if links present.
         * @private
         * @returns {Object} Chainable this
         */
        _bindProductDownloadable: function () {
            if (this._$modal.find(this.options.selectors.downloadableLinks).length) {
                this._$modal.find(this.options.selectors.qtyField).hide();
            }
            return this;
        },

        /**
         * Binds reviews tab and actions.
         * @private
         * @param {string} productHref - Product link href (for extensibility).
         * @returns {Object} Chainable this
         */
        _bindProductReviews: function (productHref) {
            const $reviewsTabLink = this._$modal.find(this.options.selectors.reviewTabSelector);
            if ($reviewsTabLink.length) {
                this._$modal.find(this.options.selectors.reviewsActions).click(() => {
                    $reviewsTabLink.trigger('click');
                });
            }
            return this;
        },

        /**
         * Binds add-to-cart form by injecting form key.
         * @private
         * @returns {Object} Chainable this
         */
        _bindProductAddToCart: function () {
            const $addToCartForm = this._$modal.find(this.options.selectors.addToCartForm);
            if ($addToCartForm.length) {
                const formKey = $.mage.cookies.get('form_key');
                const $formKeyInput = $('<input />', {
                    type: 'hidden',
                    name: 'form_key',
                    value: formKey
                });
              
                $addToCartForm.prepend($formKeyInput);
            }
            return this;
        }
    });

    return $.amadeco.amadecoQuickView;
});
