<?php
/**
 * Amadeco QuickView Module
 *
 * @category   Amadeco
 * @package    Amadeco_QuickView
 * @author     Ilan Parmentier
 */
declare(strict_types=1);

namespace Amadeco\QuickView\Controller\Index;

use Magento\Catalog\Controller\Product\View\ViewInterface;
use Magento\Catalog\Helper\Product\View as ViewHelper;
use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Magento\Framework\App\Action\HttpGetActionInterface;
use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\Controller\Result\ForwardFactory;
use Magento\Framework\Controller\ResultInterface;
use Magento\Framework\Data\Form\FormKey\Validator;
use Magento\Framework\DataObject;
use Magento\Framework\Registry;
use Magento\Framework\View\Result\PageFactory;
use Psr\Log\LoggerInterface;

/**
 * QuickView product view controller
 *
 * Renders an isolated layout for the product modal.
 * Implements ViewInterface to satisfy Magento\Catalog\Helper\Product\View strict check.
 */
class View extends Action implements HttpGetActionInterface, HttpPostActionInterface, ViewInterface
{
    /**
     * @param Context $context
     * @param ViewHelper $viewHelper
     * @param ForwardFactory $resultForwardFactory
     * @param PageFactory $resultPageFactory
     * @param Validator $formKeyValidator
     * @param Registry $coreRegistry
     * @param LoggerInterface $logger
     */
    public function __construct(
        Context $context,
        private readonly ViewHelper $viewHelper,
        private readonly ForwardFactory $resultForwardFactory,
        private readonly PageFactory $resultPageFactory,
        private readonly Validator $formKeyValidator,
        private readonly Registry $coreRegistry,
        private readonly LoggerInterface $logger
    ) {
        parent::__construct($context);
    }

    /**
     * Product view modal action
     *
     * @return ResultInterface
     */
    public function execute()
    {
        $request = $this->getRequest();

        // 1. Security & Request Validation
        if (!$request->isAjax() || !$this->formKeyValidator->validate($request)) {
            $this->logger->warning('QuickView 404: Invalid AJAX request or Form Key', [
                'is_ajax' => $isAjax,
                'form_key_valid' => $this->formKeyValidator->validate($request)
            ]);
            return $this->resultForwardFactory->create()->forward('noroute');
        }

        // 2. Product ID Validation
        $productId = (int)$request->getParam('id');
        if (!$productId) {
            return $this->resultForwardFactory->create()->forward('noroute');
        }

        try {
            // 3. Prepare Layout
            // Create isolated result page to avoid rendering global layout handles (header/footer)
            $resultPage = $this->resultPageFactory->create(false, [
                'isIsolated' => true,
                'template' => 'Amadeco_QuickView::root.phtml'
            ]);

            // 4. Prepare Product Logic (Restored)
            // We use DataObject to pass strict types to the legacy helper
            $params = new DataObject();
            $params->setCategoryId((int)$request->getParam('category', false));
            $params->setSpecifyOptions($request->getParam('options'));

            // The helper loads the product, registers it in the Registry,
            // and initializes layout handles (critical for 3rd party compatibility)
            $this->viewHelper->prepareAndRender($resultPage, $productId, $this, $params);

            // 5. Verify Product Existence
            // prepareAndRender does not throw 404s directly, so we verify the registry was populated.
            $product = $this->coreRegistry->registry('product');

            if (!$product || !$product->getId()) {
                // If the helper failed to load the product (e.g., disabled/deleted), we 404.
                return $this->resultForwardFactory->create()->forward('noroute');
            }

            return $resultPage;

        } catch (\Exception $e) {
            $this->logger->critical($e);
            return $this->resultForwardFactory->create()->forward('noroute');
        }
    }
}