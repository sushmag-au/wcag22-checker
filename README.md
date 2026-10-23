# WCAG 2.2 Accessibility Companion (`wcag22_checker`)

[![Drupal 10 & 11 Compatible](https://img.shields.io/badge/Drupal-10%20%7C%2011-blue.svg)](https://www.drupal.org)
[![License: GPL v2+](https://img.shields.io/badge/License-GPL%20v2%2B-blue.svg)](LICENSE.txt)
[![WCAG Standard](https://img.shields.io/badge/WCAG-2.2%20AA-success.svg)](https://www.w3.org/TR/WCAG22/)

The **WCAG 2.2 Accessibility Companion** is a Drupal 10 and 11 module designed to audit, detect, and enforce the newest W3C WCAG 2.2 AA success criteria directly inside the browser.

While existing accessibility tools effectively scan for standard WCAG 2.1 elements (such as contrast and alternative text), WCAG 2.2 introduced criteria that require dynamic interaction testing (touch target geometry, focus obscuration by sticky headers, and redundant data entry). This module provides site builders, theme developers, and editors with a lightweight in-page HUD and automated evaluation tools to ensure full compliance.

---

## Targeted WCAG 2.2 Success Criteria

### 1. 2.5.8 Target Size (Minimum) — Level AA
* **Rule:** Interactive pointer/touch targets must be at least **24×24 CSS pixels**, or have sufficient spacing from neighboring targets (with exceptions for inline text prose links).
* **Module Action:** Automatically computes the bounding client box of all interactive controls (`<a>`, `<button>`, form controls, custom widgets). Highlights non-compliant targets with an overlay badge indicating exact dimensions (e.g., `18×18px`).

### 2. 2.4.11 Focus Not Obscured (Minimum) — Level AA
* **Rule:** When an interactive element receives keyboard focus, it must not be entirely hidden or covered by author-created sticky/fixed content (such as sticky navigation bars, floating banners, cookie notices, or admin toolbars).
* **Module Action:** Intercepts keyboard navigation (`focusin`) and checks geometry overlap against all `position: fixed` and `position: sticky` containers. Triggers a live toast alert and outlines the obscuring element if focus is concealed.

### 3. 3.3.7 Redundant Entry — Level A
* **Rule:** Information previously entered by or provided to the user that is required again in the same process must be either auto-populated or available for the user to select.
* **Module Action:** Audits form inputs to verify that standard personal data fields use appropriate HTML5 `autocomplete` tokens.

---

## Features

- **Floating Auditor HUD:** A non-intrusive floating badge on the page that expands to reveal violation counts, overlay toggles, and manual re-scan controls.
- **Admin Toolbar Integration:** Quick link from the Drupal administration toolbar into the WCAG 2.2 Compliance Dashboard.
- **Real-Time Visual Overlays:** Red/amber bounding indicators with live pixel dimensions.
- **JSON Report Export:** Single-click export of discovered issues for compliance auditing, Jira tickets, or client reporting.
- **Configurable Scope:** Whitelist/blacklist paths, customize the target size threshold (e.g., 44px for AAA), and optionally exclude backend administrative routes.

---

## Requirements

- Drupal 10.0 or Drupal 11.x
- PHP 8.1 or higher

---

## Installation

Install using Composer:

```bash
composer require drupal/wcag22_checker
```

Enable the module via Drush or the Drupal Admin interface:

```bash
drush pm:install wcag22_checker
```

---

## Configuration

1. Navigate to **Administration > Configuration > Content Authoring > WCAG 2.2 Checker Settings** (`/admin/config/content/wcag22-checker`).
2. Configure active criteria:
   - Minimum Target Size threshold (default: `24px`).
   - Enable/disable individual criteria audits.
   - Adjust floating HUD position (Bottom Right, Bottom Left, Top Right).
   - Configure excluded path patterns.
3. Assign permissions at `/admin/people/permissions`:
   - `Administer WCAG 2.2 Checker settings`
   - `Use WCAG 2.2 interactive auditor`

---

## Maintainers

- **Sushma Gogula** - [sushmag-au](https://github.com/sushmag-au) / [Drupal.org Profile](https://www.drupal.org)
