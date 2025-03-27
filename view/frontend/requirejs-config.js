/**
 * Amadeco QuickView Module
 *
 * @category   Amadeco
 * @package    Amadeco_QuickView
 * @author     Ilan Parmentier
 */
var config = {
    map: {
        '*': {
            amadecoQuickView: 'Amadeco_QuickView/js/amadeco-quickview'
        }
    },
    config: {
        mixins: {
            'Magento_Swatches/js/swatch-renderer': {
                'Amadeco_QuickView/js/swatch-renderer-mixin': true
            }
        }
    }
};