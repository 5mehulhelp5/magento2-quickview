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

use Magento\Catalog\Controller\Product\View as ProductViewController;
use Magento\Catalog\Helper\Product\View as ViewHelper;
use Magento\Framework\App\Action\Context;
use Magento\Framework\App\Action\HttpGetActionInterface;
use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Controller\Result\ForwardFactory;
use Magento\Framework\Data\Form\FormKey\Validator;
use Magento\Framework\DataObject;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\View\Result\PageFactory;
use Psr\Log\LoggerInterface;

/**
 * QuickView product view controller
 */
class View extends ProductViewController implements HttpGetActionInterface, HttpPostActionInterface
{
    /**
     * @var Validator
     */
    protected Validator $formKeyValidator;

    /**
     * @var LoggerInterface
     */
    private LoggerInterface $logger;

    /**
     * @param Context $context
     * @param ViewHelper $viewHelper
     * @param ForwardFactory $resultForwardFactory
     * @param PageFactory $resultPageFactory
     * @param Validator $formKeyValidator
     * @param LoggerInterface|null $logger
     */
    public function __construct(
        Context $context,
        ViewHelper $viewHelper,
        ForwardFactory $resultForwardFactory,
        PageFactory $resultPageFactory,
        Validator $formKeyValidator,
        ?LoggerInterface $logger = null
    ) {
        parent::__construct(
            $context,
            $viewHelper,
            $resultForwardFactory,
            $resultPageFactory
        );

        $this->formKeyValidator = $formKeyValidator;
        $this->logger = $logger ?: ObjectManager::getInstance()->get(LoggerInterface::class);
    }

    /**
     * Product view modal action
     *
     * @return \Magento\Framework\View\Result\Page|\Magento\Framework\Controller\Result\Forward|void
     */
    public function execute()
    {
        if (
            !$this->getRequest()->isAjax() ||
            !$this->formKeyValidator->validate($this->getRequest())
        ) {
            return $this->_forward('noroute');
        }

        try {
            // Get initial data from request
            $categoryId = (int)$this->getRequest()->getParam('category', false);
            $productId = (int)$this->getRequest()->getParam('id');
            $specifyOptions = $this->getRequest()->getParam('options');

            // Prepare helper and params
            $params = new DataObject();
            $params->setCategoryId($categoryId)
                ->setSpecifyOptions($specifyOptions);

            // Create isolated result page
            $resultPage = $this->resultPageFactory->create(false, [
                'isIsolated' => true,
                'template' => 'Amadeco_QuickView::root.phtml'
            ]);

            // Render product view
            $this->viewHelper->prepareAndRender($resultPage, $productId, $this, $params);

            return $resultPage;
        } catch (NoSuchEntityException $e) {
            return $this->noProductRedirect();
        } catch (\Exception $e) {
            $this->logger->critical($e);
            return $this->_forward('noroute');
        }
    }
}