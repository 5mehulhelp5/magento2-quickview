<?php
/**
 * Amadeco QuickView Module
 *
 * @category   Amadeco
 * @package    Amadeco_QuickView
 * @author     Ilan Parmentier
 */
declare(strict_types=1);

namespace Amadeco\QuickView\Plugin\View\Result;

use Amadeco\QuickView\Helper\Data;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\App\ResponseInterface;
use Magento\Framework\View\Result\Layout;

/**
 * Plugin to change element identifiers in the response
 */
class ChangeIdentifier
{
    public function __construct(
        private readonly RequestInterface $request,
        private readonly Data $dataHelper
    ) {}

    /**
     * Modify element identifiers in response HTML
     *
     * @param Layout $subject
     * @param Layout $result
     * @param ResponseInterface $httpResponse
     * @return Layout
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    public function afterRenderResult(
        Layout $subject,
        Layout $result,
        ResponseInterface $httpResponse
    ): Layout {
        if ($this->request->getFullActionName() != 'quickview_index_view') {
            return $result;
        }

        if (!$this->dataHelper->isEnabled()) {
            return $result;
        }

        $content = (string)$httpResponse->getContent();
        $identifier = $this->dataHelper->getWrapperIdentifier();

        if (str_contains($content, $identifier)) {
            $identifierToSearchAndReplace = $this->dataHelper->getIdentifierReplacements();

            $content = str_replace(
                array_keys($identifierToSearchAndReplace),
                array_values($identifierToSearchAndReplace),
                $content
            );

            $httpResponse->setContent($content);
        }

        return $result;
    }
}