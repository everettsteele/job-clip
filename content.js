(function () {
  'use strict';

  var HOST_ID = 'snag-host';
  var TOAST_ID = 'snag-toast-host';

  console.log('[Snag] content script loaded on', window.location.href);

  function isJobPage() {
    return window.location.href.includes('linkedin.com/jobs');
  }

  function clean(el) {
    if (!el) return null;
    return el.textContent.replace(/\s+/g, ' ').trim();
  }

  function extractJobData() {
    var title = null;
    var company = null;
    var salary = null;
    var description = null;

    // Strategy 1: look for h1 elements — find all, pick the one that looks like a job title
    // Job title h1s are short (under 100 chars) and not generic navigation text
    var allH1s = document.querySelectorAll('h1');
    var genericPhrases = ['jobs based on', 'top job picks', 'job search', 'linkedin'];
    for (var i = 0; i < allH1s.length; i++) {
      var h1Text = allH1s[i].textContent.replace(/\s+/g, ' ').trim();
      if (h1Text.length < 5 || h1Text.length > 120) continue;
      var isGeneric = false;
      for (var j = 0; j < genericPhrases.length; j++) {
        if (h1Text.toLowerCase().indexOf(genericPhrases[j]) !== -1) {
          isGeneric = true;
          break;
        }
      }
      if (!isGeneric) {
        title = h1Text;
        console.log('[Snag] title from h1 scan:', title);
        break;
      }
    }

    // Strategy 2: company — look for any element with "company" in class near the title
    var companySelectors = [
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      '[class*="company-name"]',
      '[class*="topcard__org-name"]',
      '.jobs-unified-top-card__subtitle-primary-grouping'
    ];
    for (var k = 0; k < companySelectors.length; k++) {
      var el = document.querySelector(companySelectors[k]);
      if (el) {
        var text = clean(el);
        // Strip trailing pipe characters and extra info sometimes appended
        text = text.replace(/\s*[·|•].*$/, '').trim();
        if (text.length > 0 && text.length < 100) {
          company = text;
          console.log('[Snag] company from selector:', companySelectors[k], company);
          break;
        }
      }
    }

    // Strategy 3: salary
    var salarySelectors = [
      '.job-details-jobs-unified-top-card__salary-info',
      '.jobs-unified-top-card__salary-info',
      '[class*="salary"]',
      '[class*="compensation"]'
    ];
    for (var s = 0; s < salarySelectors.length; s++) {
      var sel = document.querySelector(salarySelectors[s]);
      if (sel) {
        salary = clean(sel);
        break;
      }
    }

    // Strategy 4: description
    var descSelectors = [
      '.jobs-description__content',
      '.jobs-description-content__text',
      '#job-details',
      '.jobs-details__main-content',
      '[class*="description__content"]',
      '[class*="job-description"]'
    ];
    for (var d = 0; d < descSelectors.length; d++) {
      var desc = document.querySelector(descSelectors[d]);
      if (desc) {
        description = desc.textContent.replace(/\s+/g, ' ').trim().substring(0, 3000);
        break;
      }
    }

    // Strategy 5: page title fallback for title AND company
    // LinkedIn formats: "Job Title at Company | LinkedIn" or "Job Title - Company | LinkedIn"
    if (!title || !company) {
      var pageTitle = document.title || '';
      console.log('[Snag] page title:', pageTitle);
      var atMatch = pageTitle.match(/^(.+?)\s+(?:at|@)\s+(.+?)(?:\s*[|\-]|$)/);
      var dashMatch = pageTitle.match(/^(.+?)\s+-\s+(.+?)(?:\s*[|\-]|$)/);
      if (atMatch) {
        if (!title) title = atMatch[1].trim();
        if (!company) company = atMatch[2].trim();
        console.log('[Snag] from page title (at match):', title, company);
      } else if (dashMatch) {
        if (!title) title = dashMatch[1].trim();
        if (!company) company = dashMatch[2].trim();
        console.log('[Snag] from page title (dash match):', title, company);
      }
    }

    // Strategy 6: if company still missing, try og:title meta tag
    if (!company) {
      var ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        var og = ogTitle.getAttribute('content') || '';
        var ogAt = og.match(/^(.+?)\s+(?:at|@)\s+(.+?)(?:\s*[|\-]|$)/);
        if (ogAt) {
          if (!title) title = ogAt[1].trim();
          if (!company) company = ogAt[2].trim();
          console.log('[Snag] from og:title:', title, company);
        }
      }
    }

    return {
      title: title || 'Unknown Title',
      company: company || 'Unknown Company',
      salary: salary,
      url: window.location.href,
      description: description || '',
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
