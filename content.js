(function () {
  'use strict';

  var BTN_ID = 'snag-btn';
  var TOAST_ID = 'snag-toast';

  // Show on any LinkedIn jobs page — split pane, search, collections, view
  function isJobPage() {
    return window.location.href.includes('linkedin.com/jobs');
  }

  function extractJobData() {
    // Title: try job detail panel first, fall back to any visible h1
    var titleEl =
      document.querySelector('.job-details-jobs-unified-top-card__job-title h1') ||
      document.querySelector('.jobs-unified-top-card__job-title h1') ||
      document.querySelector('.jobs-details-top-card__job-title') ||
      document.querySelector('.t-24.t-bold.inline') ||
      document.querySelector('.job-details h1') ||
      document.querySelector('.jobs-details h1') ||
      document.querySelector('h1');

    // Company: try anchors in the top card, then any visible company link
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
      document.querySelector('.compensation__salary') ||
      document.querySelector('[class*="salary"]');

    var descEl =
      document.querySelector('.jobs-description__content') ||
      document.querySelector('.jobs-description-content__text') ||
      document.querySelector('#job-details') ||
      document.querySelector('.jobs-details__main-content') ||
      document.querySelector('[class*="description"]');

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

    var toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.textContent = message;
    toast.style.cssText = [
      'position:fixed',
      'bottom:84px',
      'right:24px',
      'background:' + color,
      'color:white',
      'padding:10px 16px',
      'border-radius:8px',
      'font-size:13px',
      'font-weight:600',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'z-index:100000',
      'box-shadow:0 4px 16px rgba(0,0,0,0.25)',
      'max-width:300px',
      'opacity:1',
      'transition:opacity 0.4s ease',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { if (toast.parentNode) toast.remove(); }, 400);
    }, 2800);
  }

  function createButton() {
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.innerHTML = '\u26A1 Snag';
    btn.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'z-index:2147483647',
      'background:#0a66c2',
      'color:white',
      'border:none',
      'border-radius:24px',
      'padding:0 22px',
      'height:46px',
      'font-size:15px',
      'font-weight:700',
      'cursor:pointer',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'box-shadow:0 4px 18px rgba(10,102,194,0.5)',
      'display:flex',
      'align-items:center',
      'gap:6px',
      'letter-spacing:-0.01em',
      'transition:transform 0.15s ease,box-shadow 0.15s ease,background 0.15s ease'
    ].join(';');

    btn.addEventListener('mouseenter', function () {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 6px 22px rgba(10,102,194,0.6)';
      btn.style.background = '#004182';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = '';
      btn.style.boxShadow = '0 4px 18px rgba(10,102,194,0.5)';
      btn.style.background = '#0a66c2';
    });

    btn.addEventListener('click', function () {
      btn.innerHTML = '\u23F3 Snagging...';
      btn.disabled = true;
      btn.style.background = '#555';
      btn.style.boxShadow = 'none';
      btn.style.transform = '';

      var jobData = extractJobData();

      chrome.runtime.sendMessage({ type: 'CLIP_JOB', data: jobData }, function (response) {
        if (response && response.success) {
          btn.innerHTML = '\u2705 Snagged!';
          btn.style.background = '#057642';
          btn.style.boxShadow = '0 4px 18px rgba(5,118,66,0.5)';
          showToast('\u2705 ' + jobData.company + ' \u2014 ' + jobData.title, '#057642');
        } else {
          btn.innerHTML = '\u274C Failed';
          btn.style.background = '#cc0000';
          btn.style.boxShadow = '0 4px 18px rgba(204,0,0,0.4)';
          var errMsg = (response && response.error) ? response.error : 'Check extension settings.';
          showToast('\u274C ' + errMsg, '#cc0000');
        }
        setTimeout(function () {
          btn.innerHTML = '\u26A1 Snag';
          btn.style.background = '#0a66c2';
          btn.style.boxShadow = '0 4px 18px rgba(10,102,194,0.5)';
          btn.disabled = false;
        }, 2500);
      });
    });

    return btn;
  }

  function updateVisibility() {
    var btn = document.getElementById(BTN_ID);
    var onJob = isJobPage();

    if (onJob && !btn) {
      document.body.appendChild(createButton());
    } else if (!onJob && btn) {
      btn.remove();
    }
  }

  // Watch for LinkedIn SPA navigation
  var lastUrl = window.location.href;
  var observer = new MutationObserver(function () {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(updateVisibility, 800);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial inject — retry a few times in case page is still loading
  setTimeout(updateVisibility, 500);
  setTimeout(updateVisibility, 1500);
  setTimeout(updateVisibility, 3000);

})();
