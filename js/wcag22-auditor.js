/**
 * @file
 * WCAG 2.2 In-Page Auditor & Accessibility Companion.
 *
 * Implements real-time browser evaluation for:
 * - 2.5.8 Target Size (Minimum 24x24 CSS px)
 * - 2.4.11 Focus Not Obscured (Minimum AA)
 * - 3.3.7 Redundant Entry (Form autocomplete auditing)
 */

(function (Drupal, drupalSettings, once) {
  'use strict';

  // State store for active audit results.
  const auditState = {
    targetSizeViolations: [],
    obscuredFocusEvents: [],
    redundantEntryWarnings: [],
    highlightsActive: true,
    hudExpanded: false,
    settings: {
      minTargetSize: 24,
      checkTargetSize: true,
      checkFocusObscured: true,
      checkRedundantEntry: true,
      showFloatingHud: true,
      hudPosition: 'bottom-right',
    },
  };

  /**
   * Helper: check if element is visible on screen.
   */
  function isVisible(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    const style = window.getComputedStyle(el);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      el.getAttribute('aria-hidden') === 'true'
    ) {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * Helper: check if an element is an inline text link (exempt from 2.5.8).
   */
  function isInlineTextLink(el) {
    if (el.tagName.toLowerCase() !== 'a') return false;
    const parent = el.parentElement;
    if (!parent) return false;
    const parentTag = parent.tagName.toLowerCase();
    const isProseContainer = ['p', 'li', 'dd', 'blockquote', 'span'].includes(parentTag);
    // If it is inside prose and shares line with sibling text nodes
    return isProseContainer && el.getClientRects().length <= 2;
  }

  /**
   * Helper: check if two DOM rects intersect/overlap significantly.
   */
  function rectsOverlap(r1, r2) {
    const overlapX = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
    const overlapY = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
    const overlapArea = overlapX * overlapY;
    const r1Area = r1.width * r1.height;
    return r1Area > 0 && overlapArea / r1Area > 0.25; // 25% or more obscured
  }

  /**
   * Scan for 2.5.8 Target Size violations.
   */
  function scanTargetSizes(context, minSize) {
    auditState.targetSizeViolations = [];
    const selector = 'a, button, input:not([type="hidden"]), select, textarea, [role="button"], [tabindex="0"]';
    const elements = (context || document).querySelectorAll(selector);

    elements.forEach((el) => {
      // Ignore elements inside the HUD or admin toolbar
      if (el.closest('.wcag22-hud') || el.closest('#toolbar-administration')) return;
      if (!isVisible(el)) return;
      if (isInlineTextLink(el)) return;

      const rect = el.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);

      if (width < minSize || height < minSize) {
        el.setAttribute('data-wcag22-target-violation', 'true');
        el.setAttribute('data-wcag22-size', `${width}×${height}px`);
        auditState.targetSizeViolations.push({
          element: el,
          width,
          height,
          required: minSize,
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || el.getAttribute('aria-label') || el.title || 'Interactive element').trim().slice(0, 30),
        });
      } else {
        el.removeAttribute('data-wcag22-target-violation');
        el.removeAttribute('data-wcag22-size');
      }
    });
  }

  /**
   * Scan for 3.3.7 Redundant Entry & Autocomplete audit.
   */
  function scanRedundantEntry(context) {
    auditState.redundantEntryWarnings = [];
    const forms = (context || document).querySelectorAll('form:not(.wcag22-hud-form)');

    forms.forEach((form) => {
      const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
      inputs.forEach((input) => {
        const name = (input.name || input.id || '').toLowerCase();
        const type = (input.type || 'text').toLowerCase();
        const hasAutocomplete = input.hasAttribute('autocomplete') && input.getAttribute('autocomplete') !== 'off';

        const needsAutocomplete = /email|name|phone|address|street|city|postal|zip|country/.test(name) || type === 'email' || type === 'tel';

        if (needsAutocomplete && !hasAutocomplete) {
          auditState.redundantEntryWarnings.push({
            element: input,
            fieldName: name || 'input',
            reason: 'Missing autocomplete token for personal data field (WCAG 3.3.7 / 1.3.5).',
          });
          input.setAttribute('data-wcag22-form-flag', 'true');
        }
      });
    });
  }

  /**
   * Setup 2.4.11 Focus Obscuration Listener.
   */
  function setupFocusObscuredListener() {
    window.addEventListener('focusin', (event) => {
      if (!auditState.settings.checkFocusObscured) return;
      const target = event.target;
      if (!target || target.closest('.wcag22-hud') || target.closest('#toolbar-administration')) return;

      const targetRect = target.getBoundingClientRect();
      if (targetRect.width === 0 && targetRect.height === 0) return;

      // Find all fixed or sticky elements on the page
      const stickyCandidates = document.querySelectorAll('*');
      let isObscured = false;
      let obscuringElement = null;

      for (let i = 0; i < stickyCandidates.length; i++) {
        const el = stickyCandidates[i];
        if (el === target || el.contains(target) || el.closest('.wcag22-hud')) continue;

        const pos = window.getComputedStyle(el).position;
        if (pos === 'fixed' || pos === 'sticky') {
          const stickyRect = el.getBoundingClientRect();
          if (isVisible(el) && rectsOverlap(targetRect, stickyRect)) {
            isObscured = true;
            obscuringElement = el;
            break;
          }
        }
      }

      if (isObscured && obscuringElement) {
        target.classList.add('wcag22-focus-obscured');
        auditState.obscuredFocusEvents.push({
          time: new Date().toLocaleTimeString(),
          target: target.tagName.toLowerCase(),
          obscuredBy: obscuringElement.tagName.toLowerCase() + (obscuringElement.className ? '.' + obscuringElement.className.split(' ')[0] : ''),
        });
        updateHudCounts();
        showNotification(`⚠️ Focus Obscured (2.4.11): Active focus concealed by sticky ${obscuringElement.tagName.toLowerCase()}`);
      } else {
        target.classList.remove('wcag22-focus-obscured');
      }
    });
  }

  /**
   * Temporary Toast Notification.
   */
  function showNotification(msg) {
    let toast = document.querySelector('.wcag22-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'wcag22-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('is-visible');
    setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 3500);
  }

  /**
   * Build Floating HUD Component.
   */
  function renderHud() {
    if (document.querySelector('.wcag22-hud')) return;

    const hud = document.createElement('aside');
    hud.className = `wcag22-hud wcag22-hud--${auditState.settings.hudPosition}`;
    hud.setAttribute('role', 'region');
    hud.setAttribute('aria-label', 'WCAG 2.2 Auditor HUD');

    hud.innerHTML = `
      <div class="wcag22-hud-badge" id="wcag22-hud-toggle" tabindex="0" role="button" aria-expanded="false" title="Toggle WCAG 2.2 Companion">
        <span class="wcag22-badge-icon" aria-hidden="true">♿</span>
        <span class="wcag22-badge-title">WCAG 2.2</span>
        <span class="wcag22-badge-count" id="wcag22-total-count">0</span>
      </div>
      <div class="wcag22-hud-panel" id="wcag22-hud-panel" hidden>
        <div class="wcag22-panel-header">
          <div>
            <h4 class="wcag22-panel-title">WCAG 2.2 Companion</h4>
            <span class="wcag22-panel-subtitle">Real-time AA Compliance Inspector</span>
          </div>
          <button type="button" class="wcag22-close-btn" id="wcag22-panel-close" aria-label="Close panel">&times;</button>
        </div>
        <div class="wcag22-panel-body">
          <div class="wcag22-metric-row">
            <div class="wcag22-metric">
              <span class="wcag22-metric-val" id="wcag22-target-count">0</span>
              <span class="wcag22-metric-label">Target Size &lt; ${auditState.settings.minTargetSize}px (2.5.8)</span>
            </div>
            <div class="wcag22-metric">
              <span class="wcag22-metric-val" id="wcag22-obscured-count">0</span>
              <span class="wcag22-metric-label">Focus Obscured (2.4.11)</span>
            </div>
            <div class="wcag22-metric">
              <span class="wcag22-metric-val" id="wcag22-redundant-count">0</span>
              <span class="wcag22-metric-label">Redundant Entry (3.3.7)</span>
            </div>
          </div>
          <div class="wcag22-actions">
            <button type="button" class="wcag22-btn" id="wcag22-toggle-highlights">
              ${auditState.highlightsActive ? 'Hide Visual Overlays' : 'Show Visual Overlays'}
            </button>
            <button type="button" class="wcag22-btn wcag22-btn--secondary" id="wcag22-rescan-btn">
              🔄 Re-scan Page
            </button>
            <button type="button" class="wcag22-btn wcag22-btn--outline" id="wcag22-export-btn">
              📥 Export JSON Report
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(hud);

    // Event listeners
    const toggle = document.getElementById('wcag22-hud-toggle');
    const panel = document.getElementById('wcag22-hud-panel');
    const closeBtn = document.getElementById('wcag22-panel-close');
    const highlightBtn = document.getElementById('wcag22-toggle-highlights');
    const rescanBtn = document.getElementById('wcag22-rescan-btn');
    const exportBtn = document.getElementById('wcag22-export-btn');

    function togglePanel() {
      auditState.hudExpanded = !auditState.hudExpanded;
      toggle.setAttribute('aria-expanded', auditState.hudExpanded.toString());
      panel.hidden = !auditState.hudExpanded;
    }

    toggle.addEventListener('click', togglePanel);
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        togglePanel();
      }
    });

    closeBtn.addEventListener('click', () => {
      auditState.hudExpanded = false;
      toggle.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
    });

    highlightBtn.addEventListener('click', () => {
      auditState.highlightsActive = !auditState.highlightsActive;
      document.body.classList.toggle('wcag22-hide-overlays', !auditState.highlightsActive);
      highlightBtn.textContent = auditState.highlightsActive ? 'Hide Visual Overlays' : 'Show Visual Overlays';
    });

    rescanBtn.addEventListener('click', () => {
      runFullAudit(document);
      showNotification('✅ WCAG 2.2 audit refreshed.');
    });

    exportBtn.addEventListener('click', () => {
      exportReport();
    });
  }

  /**
   * Update HUD violation counters.
   */
  function updateHudCounts() {
    const targetEl = document.getElementById('wcag22-target-count');
    const obscuredEl = document.getElementById('wcag22-obscured-count');
    const redundantEl = document.getElementById('wcag22-redundant-count');
    const totalEl = document.getElementById('wcag22-total-count');

    const targetCount = auditState.targetSizeViolations.length;
    const obscuredCount = auditState.obscuredFocusEvents.length;
    const redundantCount = auditState.redundantEntryWarnings.length;
    const total = targetCount + obscuredCount + redundantCount;

    if (targetEl) targetEl.textContent = targetCount;
    if (obscuredEl) obscuredEl.textContent = obscuredCount;
    if (redundantEl) redundantEl.textContent = redundantCount;
    if (totalEl) {
      totalEl.textContent = total;
      totalEl.className = 'wcag22-badge-count ' + (total > 0 ? 'has-violations' : 'is-clean');
    }
  }

  /**
   * Export JSON Audit Report.
   */
  function exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      standard: 'WCAG 2.2 AA',
      config: auditState.settings,
      summary: {
        targetSizeViolations: auditState.targetSizeViolations.length,
        focusObscuredEvents: auditState.obscuredFocusEvents.length,
        redundantEntryWarnings: auditState.redundantEntryWarnings.length,
      },
      details: {
        targetSize: auditState.targetSizeViolations.map((v) => ({
          tag: v.tag,
          text: v.text,
          dimensions: `${v.width}x${v.height}px`,
          required: `${v.required}px`,
        })),
        focusObscured: auditState.obscuredFocusEvents,
        redundantEntry: auditState.redundantEntryWarnings.map((r) => ({
          field: r.fieldName,
          reason: r.reason,
        })),
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wcag22-audit-${window.location.hostname}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Run full audit passes.
   */
  function runFullAudit(context) {
    if (auditState.settings.checkTargetSize) {
      scanTargetSizes(context, auditState.settings.minTargetSize);
    }
    if (auditState.settings.checkRedundantEntry) {
      scanRedundantEntry(context);
    }
    updateHudCounts();
  }

  /**
   * Main Drupal Behavior integration.
   */
  Drupal.behaviors.wcag22Auditor = {
    attach(context, settings) {
      const config = settings.wcag22Checker || {};
      auditState.settings = Object.assign(auditState.settings, config);

      if (!auditState.settings.enabled) return;

      once('wcag22-init', 'body', context).forEach(() => {
        if (auditState.settings.showFloatingHud) {
          renderHud();
        }
        setupFocusObscuredListener();
      });

      // Run initial audit on load and AJAX content replacement
      runFullAudit(context);
    },
  };
})(Drupal, drupalSettings, once);
