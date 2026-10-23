<?php

declare(strict_types=1);

namespace Drupal\Tests\wcag22_checker\Functional;

use Drupal\Tests\BrowserTestBase;

/**
 * Tests access and configuration saving for WCAG 2.2 Checker.
 *
 * @group wcag22_checker
 */
class Wcag22SettingsAccessTest extends BrowserTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'toolbar',
    'wcag22_checker',
  ];

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * Tests anonymous and authenticated access control.
   */
  public function testSettingsAccess(): void {
    // Anonymous user should be denied access.
    $this->drupalGet('/admin/config/content/wcag22-checker');
    $this->assertSession()->statusCodeEquals(403);

    // Create user with permission.
    $admin_user = $this->drupalCreateUser([
      'administer wcag22 checker',
      'access administration pages',
    ]);
    $this->drupalLogin($admin_user);

    // Verify access is granted.
    $this->drupalGet('/admin/config/content/wcag22-checker');
    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->pageTextContains('WCAG 2.2 Accessibility Companion Settings');
    $this->assertSession()->checkboxChecked('edit-check-target-size');
  }

}
