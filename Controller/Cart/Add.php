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
use Magento\Catalog\Model\Product;
use Magento\Checkout\Helper\Cart as CartHelper;
use Magento\Checkout\Model\Cart;
use Magento\Checkout\Model\Cart\RequestQuantityProcessor;
use Magento\Checkout\Model\Session as CheckoutSession;
use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\Controller\Result\Json;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Data\Form\FormKey\Validator;
use Magento\Framework\Event\ManagerInterface as EventManagerInterface;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Filter\LocalizedToNormalized;
use Magento\Framework\Locale\ResolverInterface;
use Magento\Store\Model\StoreManagerInterface;
use Psr\Log\LoggerInterface;

/**
 * AJAX cart adding controller
 * Implements dedicated logic for QuickView to avoid redirect dependencies
 */
class Add extends Action implements HttpPostActionInterface
{
    /**
     * @param Context $context
     * @param RequestInterface $request
     * @param Validator $formKeyValidator
     * @param CheckoutSession $checkoutSession
     * @param Cart $cart
     * @param ProductRepositoryInterface $productRepository
     * @param StoreManagerInterface $storeManager
     * @param RequestQuantityProcessor $quantityProcessor
     * @param JsonFactory $resultJsonFactory
     * @param CartHelper $cartHelper
     * @param LoggerInterface $logger
     * @param ResolverInterface $localeResolver
     * @param EventManagerInterface $eventManager
     */
    public function __construct(
        Context $context,
        private readonly RequestInterface $request,
        private readonly Validator $formKeyValidator,
        private readonly CheckoutSession $checkoutSession,
        private readonly Cart $cart,
        private readonly ProductRepositoryInterface $productRepository,
        private readonly StoreManagerInterface $storeManager,
        private readonly RequestQuantityProcessor $quantityProcessor,
        private readonly JsonFactory $resultJsonFactory,
        private readonly CartHelper $cartHelper,
        private readonly LoggerInterface $logger,
        private readonly ResolverInterface $localeResolver,
        private readonly EventManagerInterface $eventManager
    ) {
        parent::__construct($context);
    }

    /**
     * Add product to shopping cart action via AJAX
     *
     * @return Json
     */
    public function execute(): Json
    {
        $resultJson = $this->resultJsonFactory->create();

        if (!$this->request->isAjax()) {
            return $resultJson->setData([
                'status' => false,
                'message' => __('Request not allowed.')
            ]);
        }

        if (!$this->formKeyValidator->validate($this->request)) {
            return $resultJson->setData([
                'status' => false,
                'message' => __('Your session has expired.')
            ]);
        }

        $params = $this->request->getParams();
        $result = ['status' => false, 'message' => ''];

        try {
            $this->processParams($params);

            $product = $this->initProduct();

            $this->cart->addProduct($product, $params);

            if (!empty($params['related_product'])) {
                $this->cart->addProductsByIds(explode(',', $params['related_product']));
            }

            $this->cart->save();

            // Dispatch event to allow other modules to hook into the add to cart action
            $this->eventManager->dispatch(
                'quickview_checkout_cart_add_product_complete',
                ['product' => $product, 'request' => $this->request, 'response' => $this->request]
            );

            if ($this->cart->getQuote()->getHasError()) {
                $errors = $this->cart->getQuote()->getErrors();
                $message = '';
                foreach ($errors as $error) {
                    $message .= $error->getText() . "\n";
                }
                $result['message'] = $message;
            } else {
                $result['status'] = true;
                $result['message'] = __('You added %1 to your shopping cart.', $product->getName());

                if ($this->cartHelper->getShouldRedirectToCart()) {
                    $result['cartUrl'] = $this->cartHelper->getCartUrl();
                }
            }
        } catch (LocalizedException $e) {
            if ($this->checkoutSession->getUseNotice(true)) {
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

    /**
     * Initialize product instance from request data
     *
     * @return Product
     * @throws NoSuchEntityException
     */
    private function initProduct(): Product
    {
        $productId = (int)$this->request->getParam('product');
        if ($productId) {
            $storeId = $this->storeManager->getStore()->getId();
            return $this->productRepository->getById($productId, false, $storeId);
        }
        throw new NoSuchEntityException(__('Product not found.'));
    }

    /**
     * Process request parameters
     * * @param array $params
     * @return void
     */
    private function processParams(array &$params): void
    {
        if (isset($params['qty'])) {
            $filter = new LocalizedToNormalized([
                'locale' => $this->localeResolver->getLocale()
            ]);
            $params['qty'] = $this->quantityProcessor->prepareQuantity($params['qty']);
            $params['qty'] = $filter->filter($params['qty']);
        }
    }
}