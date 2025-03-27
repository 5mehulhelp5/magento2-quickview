<?php
/**
 * Amadeco QuickView Module
 *
 * @category   Amadeco
 * @package    Amadeco_QuickView
 * @author     Ilan Parmentier
 */
declare(strict_types=1);

namespace Amadeco\QuickView\Controller\Cart;

use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Checkout\Controller\Cart\Add as MagentoCartAdd;
use Magento\Checkout\Helper\Cart as CartHelper;
use Magento\Checkout\Model\Session as CheckoutSession;
use Magento\Checkout\Model\Cart as CustomerCart;
use Magento\Checkout\Model\Cart\RequestQuantityProcessor;
use Magento\Framework\App\Action\Context;
use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Controller\Result\Json;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Data\Form\FormKey\Validator;
use Magento\Framework\Filter\LocalizedToNormalized;
use Magento\Framework\Locale\ResolverInterface;
use Magento\Store\Model\StoreManagerInterface;
use Psr\Log\LoggerInterface;

/**
 * AJAX cart adding controller
 */
class Add extends MagentoCartAdd implements HttpPostActionInterface
{
    /**
     * @var JsonFactory
     */
    private readonly JsonFactory $resultJsonFactory;

    /**
     * @var RequestQuantityProcessor
     */
    private readonly RequestQuantityProcessor $quantityProcessor;

    /**
     * @var LoggerInterface
     */
    private readonly LoggerInterface $logger;

    /**
     * @var ResolverInterface
     */
    private readonly ResolverInterface $localeResolver;

    /**
     * @var CartHelper
     */
    private readonly CartHelper $cartHelper;

    /**
     * @param Context $context
     * @param ScopeConfigInterface $scopeConfig
     * @param CheckoutSession $checkoutSession
     * @param StoreManagerInterface $storeManager
     * @param Validator $formKeyValidator
     * @param CustomerCart $cart
     * @param ProductRepositoryInterface $productRepository
     * @param JsonFactory $resultJsonFactory
     * @param CartHelper $cartHelper
     * @param RequestQuantityProcessor|null $quantityProcessor
     * @param LoggerInterface|null $logger
     * @param ResolverInterface|null $localeResolver
     */
    public function __construct(
        Context $context,
        ScopeConfigInterface $scopeConfig,
        CheckoutSession $checkoutSession,
        StoreManagerInterface $storeManager,
        Validator $formKeyValidator,
        CustomerCart $cart,
        ProductRepositoryInterface $productRepository,
        JsonFactory $resultJsonFactory,
        CartHelper $cartHelper,
        ?RequestQuantityProcessor $quantityProcessor = null,
        ?LoggerInterface $logger = null,
        ?ResolverInterface $localeResolver = null
    ) {
        parent::__construct(
            $context,
            $scopeConfig,
            $checkoutSession,
            $storeManager,
            $formKeyValidator,
            $cart,
            $productRepository,
            $quantityProcessor
        );

        $this->resultJsonFactory = $resultJsonFactory;
        $this->quantityProcessor = $quantityProcessor ?: ObjectManager::getInstance()->get(RequestQuantityProcessor::class);
        $this->logger = $logger ?: ObjectManager::getInstance()->get(LoggerInterface::class);
        $this->localeResolver = $localeResolver ?: ObjectManager::getInstance()->get(ResolverInterface::class);
        $this->cartHelper = $cartHelper;
    }

    /**
     * Add product to shopping cart action via AJAX
     *
     * @return Json
     */
    public function execute(): Json
    {
        $resultJson = $this->resultJsonFactory->create();

        if (!$this->getRequest()->isAjax()) {
            return $resultJson->setData([
                'status' => false,
                'message' => __('Request not allowed.')
            ]);
        }

        if (!$this->_formKeyValidator->validate($this->getRequest())) {
            return $resultJson->setData([
                'status' => false,
                'message' => __('Your session has expired.')
            ]);
        }

        $result = ['status' => false];
        $params = $this->getRequest()->getParams();
        $related = $params['related_product'] ?? null;

        try {
            if (isset($params['qty'])) {
                $filter = new LocalizedToNormalized([
                    'locale' => $this->localeResolver->getLocale()
                ]);
                $params['qty'] = $this->quantityProcessor->prepareQuantity($params['qty']);
                $params['qty'] = $filter->filter($params['qty']);
            }

            $product = $this->_initProduct();

            if (!$product) {
                $result['message'] = __('This product was not found.');
                return $resultJson->setData($result);
            }

            $this->cart->addProduct($product, $params);
            if (!empty($related)) {
                $this->cart->addProductsByIds(explode(',', $related));
            }
            $this->cart->save();

            $this->_eventManager->dispatch(
                'checkout_cart_add_product_complete',
                ['product' => $product, 'request' => $this->getRequest(), 'response' => $this->getResponse()]
            );

            if ($this->cart->getQuote()->getHasError()) {
                $result['status'] = false;
                $errors = $this->cart->getQuote()->getErrors();
                foreach ($errors as $error) {
                    $result['message'] = $error->getText();
                    break;
                }
            } else {
                $result['status'] = true;
                $result['message'] = __(
                    'You added %1 to your shopping cart.',
                    $product->getName()
                );

                if ($this->cartHelper->getShouldRedirectToCart()) {
                    $result['cartUrl'] = $this->cartHelper->getCartUrl();
                }
            }
        } catch (\Magento\Framework\Exception\LocalizedException $e) {
            if ($this->_checkoutSession->getUseNotice(true)) {
                $result['message'] = $e->getMessage();
            } else {
                $messages = array_unique(explode("\n", $e->getMessage()));
                $result['message'] = implode('<br>', $messages);
            }
        } catch (\Exception $e) {
            $this->logger->critical($e);
            $result['message'] = __("We can't add this item to your shopping cart right now.");
        }

        return $resultJson->setData($result);
    }
}