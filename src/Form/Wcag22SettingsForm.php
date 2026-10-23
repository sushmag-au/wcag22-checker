<?php

declare(strict_types=1);

namespace Drupal\wcag22_checker\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure WCAG 2.2 Accessibility Companion settings.
 */
class Wcag22SettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'wcag22_checker_settings_form';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames(): array {
    return ['wcag22_checker.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config('wcag22_checker.settings');

    $form['general'] = [
      '#type' => 'details',
      '#title' => $this->t('General Settings'),
      '#open' => true,
    ];

    $form['general']['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable WCAG 2.2 In-Page Auditor'),
      '#description' => $this->t('When enabled, authorized users will see the real-time WCAG 2.2 auditor toolbar and overlay on pages.'),
      '#default_value' => $config->get('enabled') ?? true,
    ];

    $form['general']['show_floating_hud'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Display Floating Auditor HUD Badge'),
      '#description' => $this->t('Shows a floating badge on the page indicating live violations and audit toggles.'),
      '#default_value' => $config->get('show_floating_hud') ?? true,
    ];

    $form['general']['hud_position'] = [
      '#type' => 'select',
      '#title' => $this->t('Floating HUD Position'),
      '#options' => [
        'bottom-right' => $this->t('Bottom Right'),
        'bottom-left' => $this->t('Bottom Left'),
        'top-right' => $this->t('Top Right'),
      ],
      '#default_value' => $config->get('hud_position') ?? 'bottom-right',
    ];

    $form['criteria'] = [
      '#type' => 'details',
      '#title' => $this->t('WCAG 2.2 Criteria Audits'),
      '#description' => $this->t('Select which WCAG 2.2 AA success criteria to audit on page render and during user interaction.'),
      '#open' => true,
    ];

    $form['criteria']['check_target_size'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Audit 2.5.8: Target Size (Minimum 24×24 CSS px)'),
      '#description' => $this->t('Flags buttons, touch controls, and icons whose hit-target area is less than the threshold (excluding inline prose links).'),
      '#default_value' => $config->get('check_target_size') ?? true,
    ];

    $form['criteria']['min_target_size'] = [
      '#type' => 'number',
      '#title' => $this->t('Minimum Target Size (px)'),
      '#description' => $this->t('WCAG 2.2 AA specifies 24 CSS pixels. Level AAA recommends 44 CSS pixels.'),
      '#default_value' => $config->get('min_target_size') ?? 24,
      '#min' => 16,
      '#max' => 60,
      '#states' => [
        'visible' => [
          ':input[name="check_target_size"]' => ['checked' => true],
        ],
      ],
    ];

    $form['criteria']['check_focus_obscured'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Audit 2.4.11: Focus Not Obscured (Minimum)'),
      '#description' => $this->t('Tracks keyboard tab navigation. Alerts when sticky headers, admin bars, or floating modals overlap the currently focused element.'),
      '#default_value' => $config->get('check_focus_obscured') ?? true,
    ];

    $form['criteria']['check_redundant_entry'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Audit 3.3.7: Redundant Entry Helper'),
      '#description' => $this->t('Audits forms for autocomplete attributes and detects repeated entry requests across steps.'),
      '#default_value' => $config->get('check_redundant_entry') ?? true,
    ];

    $form['exclusions'] = [
      '#type' => 'details',
      '#title' => $this->t('Scope & Path Exclusions'),
      '#open' => false,
    ];

    $form['exclusions']['exclude_admin_theme'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Exclude Admin Theme'),
      '#description' => $this->t('If checked, only public front-end pages will be audited, skipping backend administration routes.'),
      '#default_value' => $config->get('exclude_admin_theme') ?? false,
    ];

    $form['exclusions']['excluded_paths'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Excluded Path Patterns'),
      '#description' => $this->t('Enter one path pattern per line (e.g., /media/*, /batch). Wildcard * is supported.'),
      '#default_value' => $config->get('excluded_paths') ?? '',
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $this->config('wcag22_checker.settings')
      ->set('enabled', (bool) $form_state->getValue('enabled'))
      ->set('show_floating_hud', (bool) $form_state->getValue('show_floating_hud'))
      ->set('hud_position', $form_state->getValue('hud_position'))
      ->set('check_target_size', (bool) $form_state->getValue('check_target_size'))
      ->set('min_target_size', (int) $form_state->getValue('min_target_size'))
      ->set('check_focus_obscured', (bool) $form_state->getValue('check_focus_obscured'))
      ->set('check_redundant_entry', (bool) $form_state->getValue('check_redundant_entry'))
      ->set('exclude_admin_theme', (bool) $form_state->getValue('exclude_admin_theme'))
      ->set('excluded_paths', (string) $form_state->getValue('excluded_paths'))
      ->save();

    parent::submitForm($form, $form_state);
  }

}
