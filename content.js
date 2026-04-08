(function () {
  'use strict';

  var HOST_ID = 'snag-host';
  var TOAST_ID = 'snag-toast-host';

  console.log('[Snag] content script loaded on', window.location.href);

  function isJobPage() {
    return window.location.href.includes('linkedin.com/jobs');
  }

  function extractJobData() {
    // Try every known LinkedIn title selector, most specific first
    var titleEl =
      document.querySelector('.job-details-jobs-unified-top-card__job-title h1') ||
      document.querySelector('.jobs-unified-top-card__job-title h1') ||
      document.querySelector('.jobs-details-top-card__job-title') ||
      document.querySelector('[class*="job-title"] h1') ||
      document.querySelector('[class*="top-card"] h1') ||
      document.querySelector('.t-24.t-bold.inline') ||
      document.querySelector('.jobs-details h1') ||
      document.querySelector('h1');

    // Try every known company selector
    var companyEl =
      document.querySelector('.job-details-jobs-unified-top-card__company-name a') ||
      document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
      document.querySelector('.jobs-unified-top-card__company-name a') ||
      document.querySelector('.jobs-unified-top-card__company-name') ||
      document.querySelector('[class*="top-card"] [class*="company-name"]') ||
      document.querySelector('[class*="top-card"] [class*="company"] a') ||
      document.querySelector('[class*="job-details"] [class*="company"]') ||
      document.querySelector('.jobs-unified-top-card__subtitle-primary-grouping a');

    var salaryEl =
      document.querySelector('.job-details-jobs-unified-top-card__salary-info') ||
      document.querySelector('.jobs-unified-top-card__salary-info') ||
      document.querySelector('[class*="salary"]');

    var descEl =
      document.querySelector('.jobs-description__content') ||
      document.querySelector('.jobs-description-content__text') ||
      document.querySelector('#job-details') ||
      document.querySelector('.jobs-details__main-content') ||
      document.querySelector('[class*="description__content"]');

    // Clean extracted text — strip extra whitespace and newlines
    function clean(el) {
      if (!el) return null;
      return el.textContent.replace(/\s+/g, ' ').trim();
    }

    var title = clean(titleEl) || 'Unknown Title';
    var company = clean(companyEl) || 'Unknown Company';

    // Last resort: if still unknown, try to parse from page title
    if (title === 'Unknown Title' || company === 'Unknown Company') {
      var pageTitle = document.title || '';
      // LinkedIn page titles are typically "Job Title at Company | LinkedIn" or "Job Title - Company"
      var atMatch = pageTitle.match(/^(.+?)\s+(?:at|@)\s+(.+?)\s*[|\-]/);
      var dashMatch = pageTitle.match(/^(.+?)\s+-\s+(.+?)\s*[|\-]/);
      if (atMatch) {
        if (title === 'Unknown Title') title = atMatch[1].trim();
        if (company === 'Unknown Company') company = atMatch[2].trim();
      } else if (dashMatch) {
        if (title === 'Unknown Title') title = dashMatch[1].trim();
        if (company === 'Unknown Company') company = dashMatch[2].trim();
      }
    }

    console.log('[Snag] extracted:', title, 'at', company);

    return {
      title: title,
      company: company,
      salary: clean(salaryEl),
      url: window.location.href,
      description: descEl ? descEl.textContent.replace(/\s+/g, ' ').trim().substring(0, 3000) : '',
      clippedAt: new Date().toISOString()
    };
  }

  function showToast(message, color) {
    var existing = document.getElementById(TOAST_ID);
    if (existing) existing.remove();

    var toastHost = document.createElement('div');
    toastHost.id = TOAST_ID;
    toastHost.style.cssText = [
      'all:initial', 'position:fixed', 'bottom:90px', 'right:24px',
      'z-index:2147483647', 'display:block'
    ].join(';');

    var shadow = toastHost.attachShadow({ mode: 'open' });
    var toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = [
      'background:' + color, 'color:white', 'padding:10px 16px',
      'border-radius:8px', 'font-size:13px', 'font-weight:600',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'box-shadow:0 4px 16px rgba(0,0,0,0.25)', 'max-width:300px',
      'white-space:nowrap', 'pointer-events:none', 'opacity:1',
      'transition:opacity 0.4s ease'
    ].join(';');
    shadow.appendChild(toast);
    document.documentElement.appendChild(toastHost);

    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { if (toastHost.parentNode) toastHost.remove(); }, 400);
    }, 2800);
  }

  function createHost() {
    var host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = [
      'all:initial', 'position:fixed', 'bottom:80px', 'right:24px',
      'z-index:2147483647', 'display:block'
    ].join(';');

    var shadow = host.attachShadow({ mode: 'open' });

    var style = document.createElement('style');
    style.textContent = [
      '#snag-btn {',
      '  all: initial;',
      '  display: flex; align-items: center; gap: 6px;',
      '  background: #0a66c2; color: #ffffff;',
      '  border: none; border-radius: 24px;',
      '  padding: 0 22px; height: 46px;',
      '  font-size: 15px; font-weight: 700; cursor: pointer;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '  box-shadow: 0 4px 18px rgba(10,102,194,0.5);',
      '  letter-spacing: -0.01em; line-height: 1; white-space: nowrap;',
      '  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;',
      '}',
      '#snag-btn:hover { background: #004182 !important; transform: translateY(-2px); box-shadow: 0 6px 22px rgba(10,102,194,0.65); }',
      '#snag-btn:disabled { cursor: default; }'
    ].join('\n');

    var btn = document.createElement('button');
    btn.id = 'snag-btn';
    btn.textContent = '\u26A1 Snag';

    btn.addEventListener('click', function () {
      btn.textContent = '\u23F3 Snagging...';
      btn.disabled = true;
      btn.style.cssText = 'background:#555;box-shadow:none;';

      var jobData = extractJobData();

      chrome.runtime.sendMessage({ type: 'CLIP_JOB', data: jobData }, function (response) {
        if (chrome.runtime.lastError) {
          console.error('[Snag] runtime error:', chrome.runtime.lastError.message);
          showToast('\u274C Extension error. Try reloading.', '#cc0000');
          btn.textContent = '\u26A1 Snag';
          btn.style.cssText = '';
          btn.disabled = false;
          return;
        }
        if (response && response.success) {
          btn.textContent = '\u2705 Snagged!';
          btn.style.cssText = 'background:#057642;box-shadow:0 4px 18px rgba(5,118,66,0.5);';
          showToast('\u2705 ' + jobData.company + ' \u2014 ' + jobData.title, '#057642');
        } else {
          btn.textContent = '\u274C Failed';
          btn.style.cssText = 'background:#cc0000;';
          var errMsg = (response && response.error) ? response.error : 'Check Settings.';
          showToast('\u274C ' + errMsg, '#cc0000');
        }
        setTimeout(function () {
          btn.textContent = '\u26A1 Snag';
          btn.style.cssText = '';
          btn.disabled = false;
        }, 2500);
      });
    });

    shadow.appendChild(style);
    shadow.appendChild(btn);
    return host;
  }

  function inject() {
    if (!document.documentElement) return;
    if (!isJobPage()) {
      var existing = document.getElementById(HOST_ID);
      if (existing) existing.remove();
      return;
    }
    if (!document.getElementById(HOST_ID)) {
      console.log('[Snag] injecting button via shadow DOM');
      document.documentElement.appendChild(createHost());
    }
  }

  var pollCount = 0;
  var interval = setInterval(function () {
    inject();
    if (++pollCount >= 20) clearInterval(interval);
  }, 500);

  var lastUrl = window.location.href;
  try {
    new MutationObserver(function () {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log('[Snag] URL changed:', lastUrl);
        setTimeout(inject, 800);
        setTimeout(inject, 1800);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {
    console.error('[Snag] observer error:', e);
  }

})();
