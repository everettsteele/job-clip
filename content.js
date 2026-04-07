(function () {
  'use strict';

  var HOST_ID = 'snag-host';
  var TOAST_ID = 'snag-toast-host';

  console.log('[Snag] content script loaded on', window.location.href);

  function isJobPage() {
    return window.location.href.includes('linkedin.com/jobs');
  }

  function extractJobData() {
    var titleEl =
      document.querySelector('.job-details-jobs-unified-top-card__job-title h1') ||
      document.querySelector('.jobs-unified-top-card__job-title h1') ||
      document.querySelector('.jobs-details-top-card__job-title') ||
      document.querySelector('.t-24.t-bold.inline') ||
      document.querySelector('.job-details h1') ||
      document.querySelector('.jobs-details h1') ||
      document.querySelector('h1');

    var companyEl =
      document.querySelector('.job-details-jobs-unified-top-card__company-name a') ||
      document.querySelector('.jobs-unified-top-card__company-name a') ||
      document.querySelector('.jobs-unified-top-card__subtitle-primary-grouping a') ||
      document.querySelector('[data-tracking-control-name="public_jobs_topcard-org-name"]') ||
      document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
      document.querySelector('.jobs-unified-top-card__company-name');

    var salaryEl =
      document.querySelector('.job-details-jobs-unified-top-card__salary-info') ||
      document.querySelector('.jobs-unified-top-card__salary-info') ||
      document.querySelector('.compensation__salary');

    var descEl =
      document.querySelector('.jobs-description__content') ||
      document.querySelector('.jobs-description-content__text') ||
      document.querySelector('#job-details') ||
      document.querySelector('.jobs-details__main-content');

    return {
      title: titleEl ? titleEl.textContent.trim() : 'Unknown Title',
      company: companyEl ? companyEl.textContent.trim() : 'Unknown Company',
      salary: salaryEl ? salaryEl.textContent.trim() : null,
      url: window.location.href,
      description: descEl ? descEl.textContent.trim().substring(0, 3000) : '',
      clippedAt: new Date().toISOString()
    };
  }

  function showToast(message, color) {
    var existing = document.getElementById(TOAST_ID);
    if (existing) existing.remove();

    var toastHost = document.createElement('div');
    toastHost.id = TOAST_ID;
    toastHost.style.cssText = [
      'position:fixed',
      'bottom:84px',
      'right:24px',
      'z-index:2147483647',
      'all:initial',
      'display:block'
    ].join(';');

    var shadow = toastHost.attachShadow({ mode: 'open' });
    var toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = [
      'background:' + color,
      'color:white',
      'padding:10px 16px',
      'border-radius:8px',
      'font-size:13px',
      'font-weight:600',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'box-shadow:0 4px 16px rgba(0,0,0,0.25)',
      'max-width:300px',
      'white-space:nowrap',
      'pointer-events:none',
      'opacity:1',
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
    // Outer host sits on <html>, not <body>, to escape any LinkedIn stacking context
    var host = document.createElement('div');
    host.id = HOST_ID;

    // Reset ALL inherited styles — LinkedIn cannot touch anything inside
    host.style.cssText = [
      'all:initial',
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'z-index:2147483647',
      'display:block'
    ].join(';');

    var shadow = host.attachShadow({ mode: 'open' });

    var btn = document.createElement('button');
    btn.id = 'snag-btn';

    var style = document.createElement('style');
    style.textContent = [
      '#snag-btn {',
      '  all: initial;',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  background: #0a66c2;',
      '  color: #ffffff;',
      '  border: none;',
      '  border-radius: 24px;',
      '  padding: 0 22px;',
      '  height: 46px;',
      '  font-size: 15px;',
      '  font-weight: 700;',
      '  cursor: pointer;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '  box-shadow: 0 4px 18px rgba(10,102,194,0.5);',
      '  letter-spacing: -0.01em;',
      '  line-height: 1;',
      '  white-space: nowrap;',
      '  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;',
      '}',
      '#snag-btn:hover {',
      '  background: #004182;',
      '  transform: translateY(-2px);',
      '  box-shadow: 0 6px 22px rgba(10,102,194,0.65);',
      '}',
      '#snag-btn:disabled { cursor: default; }'
    ].join('\n');

    btn.textContent = '\u26A1 Snag';

    btn.addEventListener('click', function () {
      btn.textContent = '\u23F3 Snagging...';
      btn.disabled = true;
      btn.style.background = '#555';
      btn.style.boxShadow = 'none';
      btn.style.transform = 'none';

      var jobData = extractJobData();
      console.log('[Snag] snagging:', jobData.company, '-', jobData.title);

      chrome.runtime.sendMessage({ type: 'CLIP_JOB', data: jobData }, function (response) {
        if (chrome.runtime.lastError) {
          console.error('[Snag] runtime error:', chrome.runtime.lastError.message);
          showToast('\u274C Extension error. Try reloading.', '#cc0000');
          btn.textContent = '\u26A1 Snag';
          btn.style.background = '';
          btn.style.boxShadow = '';
          btn.disabled = false;
          return;
        }
        if (response && response.success) {
          btn.textContent = '\u2705 Snagged!';
          btn.style.background = '#057642';
          btn.style.boxShadow = '0 4px 18px rgba(5,118,66,0.5)';
          showToast('\u2705 ' + jobData.company + ' \u2014 ' + jobData.title, '#057642');
        } else {
          btn.textContent = '\u274C Failed';
          btn.style.background = '#cc0000';
          var errMsg = (response && response.error) ? response.error : 'Check Settings.';
          showToast('\u274C ' + errMsg, '#cc0000');
        }
        setTimeout(function () {
          btn.textContent = '\u26A1 Snag';
          btn.style.background = '';
          btn.style.boxShadow = '';
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

  // Poll every 500ms for first 10 seconds
  var pollCount = 0;
  var interval = setInterval(function () {
    inject();
    if (++pollCount >= 20) clearInterval(interval);
  }, 500);

  // Watch for SPA navigation
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
