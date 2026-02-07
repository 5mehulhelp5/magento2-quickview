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

use Amadeco\QuickView\Model\Config;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\App\ResponseInterface;
use Magento\Framework\View\Result\Layout;

/**
 * Plugin to modify element identifiers in the response output.
 * Allows reusing core templates by scoping IDs to the QuickView modal.
 */
class ChangeIdentifier
{
    /**
     * Full action view controller name for Amadeco_Quickview
     */
    private const string KEY_FULL_ACTION_NAME = 'quickview_index_view';

    /**
     * @param RequestInterface $request
     * @param Data $dataHelper
     */
    public function __construct(
        private readonly RequestInterface $request,
        private readonly Config $config
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
        // 1. Context Check: Only run on the specific QuickView layout handle
        if ($this->request->getFullActionName() !== 'quickview_index_view') {
            return $result;
        }

        // 2. Config Check: Is module enabled?
        if (!$this->config->isEnabled()) {
            return $result;
        }

        $content = (string)$httpResponse->getContent();
        $wrapperIdentifier = $this->config->getWrapperIdentifier();

        // 3. Performance Guard: Scan for the wrapper ID first.
        // If the wrapper isn't there, we don't need to do any heavy lifting.
        if (!str_contains($content, $wrapperIdentifier)) {
            return $result;
        }

        // 4. Data Retrieval
        $replacements = $this->config->getIdentifierReplacements();

        if (empty($replacements)) {
            return $result;
        }

        // 5. Execution: strtr is the fastest method for 1:1 string mapping in PHP.
        // It prevents recursive replacement issues and is memory efficient.
        $content = strtr($content, $replacements);

        $httpResponse->setContent($content);

        return $result;
    }
}
