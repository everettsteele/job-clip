(function () {
  'use strict';

  var HOST_ID = 'snag-host';
  var TOAST_ID = 'snag-toast-host';

  console.log('[Snag] v4 loaded on', window.location.href);

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

    // PRIMARY: parse document.title — most reliable on LinkedIn
    // Format: "Chief of Staff to the CTO | Machinify | LinkedIn"
    // Also handles: "(32) Title | Company | LinkedIn"
    var pt = (document.title || '').replace(/^\(\d+\)\s*/, '').trim();
    console.log('[Snag] document.title:', pt);

    // Match "Title | Company | LinkedIn" — the standard LinkedIn format
    var m = pt.match(/^(.+?)\s*\|\s*(.+?)\s*\|\s*LinkedIn\s*$/i);
    if (m) {
      title = m[1].trim();
      company = m[2].trim();
      console.log('[Snag] title from page title:', title, '|', company);
    }

    // FALLBACK A: any pipe pattern if LinkedIn suffix not present
    if (!title || !company) {
      var m2 = pt.match(/^(.+?)\s*\|\s*(.+?)(?:\s*\|.*)?$/i);
      if (m2) {
        if (!title && m2[1].toLowerCase().indexOf('linkedin') === -1) title = m2[1].trim();
        if (!company && m2[2].toLowerCase().indexOf('linkedin') === -1) company = m2[2].trim();
      }
    }

    // FALLBACK B: DOM selectors for right-panel detail view
    if (!title) {
      var titleEl =
        document.querySelector('.job-details-jobs-unified-top-card__job-title h1') ||
        document.querySelector('.jobs-unified-top-card__job-title h1') ||
        document.querySelector('[class*="top-card"] h1') ||
        document.querySelector('h1');
      if (titleEl) title = clean(titleEl);
    }

    if (!company) {
      var companyEl =
        document.querySelector('.job-details-jobs-unified-top-card__company-name a') ||
        document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
        document.querySelector('.jobs-unified-top-card__company-name a') ||
        document.querySelector('.jobs-unified-top-card__company-name') ||
        document.querySelector('[class*="company-name"]');
      if (companyEl) company = clean(companyEl).replace(/\s*[·|•].*$/, '').trim();
    }

    // FALLBACK C: active job card in left panel
    if (!title || !company) {
      var card =
        document.querySelector('.job-card-container--active') ||
        document.querySelector('li[aria-selected="true"]');
      if (card) {
        if (!title) {
          var ct = card.querySelector('[class*="job-title"]') || card.querySelector('strong');
          if (ct) title = clean(ct);
        }
        if (!company) {
          var cc = card.querySelector('[class*="primary-description"]') || card.querySelector('[class*="subtitle"]');
          if (cc) company = clean(cc).replace(/\s*[·|•].*$/, '').trim();
        }
      }
    }

    var salaryEl =
      document.querySelector('.job-details-jobs-unified-top-card__salary-info') ||
      document.querySelector('[class*="salary-info"]');

    var descEl =
      document.querySelector('.jobs-description__content') ||
      document.querySelector('.jobs-description-content__text') ||
      document.querySelector('#job-details') ||
      document.querySelector('.jobs-details__main-content');

    var result = {
      title: title || 'Unknown Title',
      company: company || 'Unknown Company',
      salary: clean(salaryEl),
      url: window.location.href,
      description: descEl ? descEl.textContent.replace(/\s+/g, ' ').trim().substring(0, 3000) : '',
      clippedAt: new Date().toISOString()
    };

    console.log('[Snag] final:', result.title, '|', result.company);
    return result;
  }

  function showToast(message, color) {
    var existing = document.getElementById(TOAST_ID);
    if (existing) existing.remove();
    var host = document.createElement('div');
    host.id = TOAST_ID;
    host.style.cssText = 'all:initial;position:fixed;bottom:90px;right:24px;z-index:2147483647;display:block;';
    var sh = host.attachShadow({ mode: 'open' });
    var t = document.createElement('div');
    t.textContent = message;
    t.style.cssText = 'background:' + color + ';color:white;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.25);max-width:320px;white-space:nowrap;pointer-events:none;';
    sh.appendChild(t);
    document.documentElement.appendChild(host);
    setTimeout(function () {
      t.style.transition = 'opacity .4s';
      t.style.opacity = '0';
      setTimeout(function () { if (host.parentNode) host.remove(); }, 400);
    }, 2800);
  }

  function createHost() {
    var host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = 'all:initial;position:fixed;bottom:80px;right:24px;z-index:2147483647;display:block;';
    var sh = host.attachShadow({ mode: 'open' });
    var style = document.createElement('style');
    style.textContent = '#b{all:initial;display:flex;align-items:center;gap:6px;background:#0a66c2;color:#fff;border:none;border-radius:24px;padding:0 22px;height:46px;font-size:15px;font-weight:700;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 4px 18px rgba(10,102,194,.5);white-space:nowrap;transition:transform .15s,box-shadow .15s,background .15s}#b:hover{background:#004182!important;transform:translateY(-2px);box-shadow:0 6px 22px rgba(10,102,194,.65)}#b:disabled{cursor:default}';
    var btn = document.createElement('button');
    btn.id = 'b';
    btn.textContent = '\u26A1 Snag';
    btn.addEventListener('click', function () {
      btn.textContent = '\u23F3 Snagging...';
      btn.disabled = true;
      btn.style.cssText = 'background:#555;box-shadow:none;';
      var jobData = extractJobData();
      chrome.runtime.sendMessage({ type: 'CLIP_JOB', data: jobData }, function (response) {
        if (chrome.runtime.lastError) {
          showToast('\u274C ' + chrome.runtime.lastError.message, '#cc0000');
          btn.textContent = '\u26A1 Snag'; btn.style.cssText = ''; btn.disabled = false;
          return;
        }
        if (response && response.success) {
          btn.textContent = '\u2705 Snagged!';
          btn.style.cssText = 'background:#057642;box-shadow:0 4px 18px rgba(5,118,66,.5);';
          showToast('\u2705 ' + jobData.company + ' \u2014 ' + jobData.title, '#057642');
        } else {
          btn.textContent = '\u274C Failed';
          btn.style.cssText = 'background:#cc0000;';
          showToast('\u274C ' + ((response && response.error) || 'Check Settings.'), '#cc0000');
        }
        setTimeout(function () { btn.textContent = '\u26A1 Snag'; btn.style.cssText = ''; btn.disabled = false; }, 2500);
      });
    });
    sh.appendChild(style);
    sh.appendChild(btn);
    return host;
  }

  function inject() {
    if (!document.documentElement) return;
    if (!isJobPage()) { var e = document.getElementById(HOST_ID); if (e) e.remove(); return; }
    if (!document.getElementById(HOST_ID)) {
      console.log('[Snag] injecting');
      document.documentElement.appendChild(createHost());
    }
  }

  var n = 0;
  var iv = setInterval(function () { inject(); if (++n >= 20) clearInterval(iv); }, 500);
  var lastUrl = window.location.href;
  try {
    new MutationObserver(function () {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(inject, 800);
        setTimeout(inject, 1800);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch(e) { console.error('[Snag]', e); }

})();
