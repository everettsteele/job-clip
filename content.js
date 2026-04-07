(function () {
  'use strict';

  let lastInjectedUrl = null;

  function extractJobData() {
    const titleEl = document.querySelector([
      '.job-details-jobs-unified-top-card__job-title h1',
      '.jobs-unified-top-card__job-title h1',
      '.t-24.t-bold.inline',
      'h1'
    ].join(','));

    const companyEl = document.querySelector([
      '.job-details-jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__subtitle-primary-grouping a'
    ].join(','));

    const salaryEl = document.querySelector([
      '.job-details-jobs-unified-top-card__salary-info',
      '.jobs-unified-top-card__salary-info',
      '[data-test-salary-insight]'
    ].join(','));

    const descEl = document.querySelector([
      '.jobs-description__content',
      '.jobs-description-content__text',
      '#job-details'
    ].join(','));

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
    var existing = document.getElementById('job-clip-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'job-clip-toast';
    toast.textContent = message;
    toast.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'background:' + color,
      'color:white',
      'padding:12px 20px',
      'border-radius:8px',
      'font-size:14px',
      'font-weight:600',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'z-index:99999',
      'box-shadow:0 4px 12px rgba(0,0,0,0.2)',
      'transition:opacity 0.3s'
    ].join(';');
    document.body.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
  }

  function injectButton() {
    var currentUrl = window.location.href;
    if (lastInjectedUrl === currentUrl && document.getElementById('job-clip-btn')) return;

    var existing = document.getElementById('job-clip-btn');
    if (existing) existing.remove();

    // Try multiple container selectors — LinkedIn updates these often
    var selectors = [
      '.jobs-apply-button--top-card',
      '.job-details-jobs-unified-top-card__container--two-pane .mt4',
      '.jobs-unified-top-card__content--two-pane .mt4',
      '.jobs-s-apply',
      '.jobs-apply-button'
    ];

    var container = null;
    for (var i = 0; i < selectors.length; i++) {
      container = document.querySelector(selectors[i]);
      if (container) break;
    }

    if (!container) return;

    var btn = document.createElement('button');
    btn.id = 'job-clip-btn';
    btn.textContent = '\uD83D\uDCCE Clip Job';
    btn.style.cssText = [
      'margin-left:8px',
      'padding:0 16px',
      'height:40px',
      'background:#0a66c2',
      'color:white',
      'border:none',
      'border-radius:20px',
      'font-size:14px',
      'font-weight:600',
      'cursor:pointer',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'white-space:nowrap',
      'vertical-align:middle'
    ].join(';');

    btn.addEventListener('mouseenter', function() { btn.style.background = '#004182'; });
    btn.addEventListener('mouseleave', function() { btn.style.background = '#0a66c2'; });

    btn.addEventListener('click', function() {
      btn.textContent = '\u23F3 Clipping...';
      btn.disabled = true;

      var jobData = extractJobData();

      chrome.runtime.sendMessage({ type: 'CLIP_JOB', data: jobData }, function(response) {
        if (response && response.success) {
          btn.textContent = '\u2705 Clipped!';
          btn.style.background = '#057642';
          showToast('\u2705 Clipped: ' + jobData.company + ' \u2014 ' + jobData.title, '#057642');
        } else {
          btn.textContent = '\u274C Error';
          btn.style.background = '#cc0000';
          var errMsg = (response && response.error) ? response.error : 'Unknown error';
          showToast('\u274C ' + errMsg, '#cc0000');
        }
        setTimeout(function() {
          btn.textContent = '\uD83D\uDCCE Clip Job';
          btn.style.background = '#0a66c2';
          btn.disabled = false;
        }, 2500);
      });
    });

    // Insert after first button, or append
    var firstBtn = container.querySelector('button');
    if (firstBtn) {
      firstBtn.insertAdjacentElement('afterend', btn);
    } else {
      container.appendChild(btn);
    }

    lastInjectedUrl = currentUrl;
  }

  // Watch for LinkedIn SPA navigation
  var lastUrl = window.location.href;
  var observer = new MutationObserver(function() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(injectButton, 1200);
    } else if (!document.getElementById('job-clip-btn') && window.location.href.includes('/jobs/')) {
      injectButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(injectButton, 1500);

})();
