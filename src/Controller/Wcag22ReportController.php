<?php

declare(strict_types=1);

namespace Drupal\wcag22_checker\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;

/**
 * Controller for the WCAG 2.2 Compliance Dashboard.
 */
class Wcag22ReportController extends ControllerBase {

  /**
   * Builds the WCAG 2.2 compliance overview page.
   *
   * @return array
   *   A render array representing the dashboard.
   */
  public function overview(): array {
    $config = $this->config('wcag22_checker.settings');
    $enabled = $config->get('enabled') ?? true;
    $min_size = $config->get('min_target_size') ?? 24;

    $build = [];

    $build['status_banner'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['wcag22-status-banner', $enabled ? 'is-enabled' : 'is-disabled'],
        'style' => 'background: #f0fdf4; border-left: 5px solid #16a34a; padding: 1.25rem; border-radius: 6px; margin-bottom: 1.5rem;',
      ],
      'message' => [
        '#markup' => '<h3>' . ($enabled ? $this->t('✅ WCAG 2.2 In-Page Auditor is Active') : $this->t('⚠️ WCAG 2.2 Auditor is Currently Disabled')) . '</h3>' .
          '<p>' . $this->t('The companion is auditing live pages for authorized roles. Target size threshold is set to <strong>@size px</strong>.', ['@size' => $min_size]) . '</p>',
      ],
    ];

    $build['criteria_table'] = [
      '#type' => 'table',
      '#header' => [
        $this->t('Criterion'),
        $this->t('Level'),
        $this->t('Description'),
        $this->t('Companion Status'),
        $this->t('Official Spec'),
      ],
      '#rows' => [
        [
          'criterion' => $this->t('<strong>2.5.8 Target Size (Minimum)</strong>'),
          'level' => 'AA',
          'description' => $this->t('Ensures touch/pointer interactive elements are at least @size×@size CSS px or have 24px spacing from neighboring targets.', ['@size' => $min_size]),
          'status' => $config->get('check_target_size') ? $this->t('🟢 Enabled') : $this->t('⚪ Disabled'),
          'spec' => [
            'data' => [
              '#type' => 'link',
              '#title' => $this->t('W3C 2.5.8 Spec ↗'),
              '#url' => Url::fromUri('https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html', ['attributes' => ['target' => '_blank']]),
            ],
          ],
        ],
        [
          'criterion' => $this->t('<strong>2.4.11 Focus Not Obscured (Minimum)</strong>'),
          'level' => 'AA',
          'description' => $this->t('Monitors keyboard focus to ensure sticky headers, floating navs, or modals do not completely cover focused elements.'),
          'status' => $config->get('check_focus_obscured') ? $this->t('🟢 Enabled') : $this->t('⚪ Disabled'),
          'spec' => [
            'data' => [
              '#type' => 'link',
              '#title' => $this->t('W3C 2.4.11 Spec ↗'),
              '#url' => Url::fromUri('https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html', ['attributes' => ['target' => '_blank']]),
            ],
          ],
        ],
        [
          'criterion' => $this->t('<strong>3.3.7 Redundant Entry</strong>'),
          'level' => 'A',
          'description' => $this->t('Ensures multi-step forms auto-populate or provide option to reuse previously entered information.'),
          'status' => $config->get('check_redundant_entry') ? $this->t('🟢 Enabled') : $this->t('⚪ Disabled'),
          'spec' => [
            'data' => [
              '#type' => 'link',
              '#title' => $this->t('W3C 3.3.7 Spec ↗'),
              '#url' => Url::fromUri('https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html', ['attributes' => ['target' => '_blank']]),
            ],
          ],
        ],
      ],
    ];

    $build['actions'] = [
      '#type' => 'actions',
      'configure' => [
        '#type' => 'link',
        '#title' => $this->t('⚙️ Configure Settings & Thresholds'),
        '#url' => Url::fromRoute('wcag22_checker.settings'),
        '#attributes' => ['class' => ['button', 'button--primary']],
      ],
    ];

    return $build;
  }

}
