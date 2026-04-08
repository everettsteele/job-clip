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

    // ---- STRATEGY 1: Scan all h1s, pick first one that looks like a job title ----
    var genericPhrases = ['jobs based on', 'top job picks', 'job search', 'linkedin', 'similar jobs'];
    var allH1s = document.querySelectorAll('h1');
    for (var i = 0; i < allH1s.length; i++) {
      var h1Text = allH1s[i].textContent.replace(/\s+/g, ' ').trim();
      if (h1Text.length < 3 || h1Text.length > 150) continue;
      var generic = false;
      for (var g = 0; g < genericPhrases.length; g++) {
        if (h1Text.toLowerCase().indexOf(genericPhrases[g]) !== -1) { generic = true; break; }
      }
      if (!generic) { title = h1Text; break; }
    }

    // ---- STRATEGY 2: Company from known selectors ----
    var companySelectors = [
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      '[class*="company-name"]',
      '.jobs-unified-top-card__subtitle-primary-grouping a',
      '.jobs-unified-top-card__subtitle-primary-grouping'
    ];
    for (var c = 0; c < companySelectors.length; c++) {
      var el = document.querySelector(companySelectors[c]);
      if (el) {
        var t = clean(el).replace(/\s*[·|•·].*$/, '').trim();
        if (t.length > 0 && t.length < 100) { company = t; break; }
      }
    }

    // ---- STRATEGY 3: Active job card in left panel (search results split pane) ----
    if (!title || !company) {
      var activeCard =
        document.querySelector('.job-card-container--active') ||
        document.querySelector('[class*="job-card"][class*="active"]') ||
        document.querySelector('[aria-selected="true"] [class*="job-card"]') ||
        document.querySelector('li[aria-selected="true"]');

      if (activeCard) {
        if (!title) {
          var ct = activeCard.querySelector('[class*="job-title"]') ||
                   activeCard.querySelector('a[href*="/jobs/view/"]') ||
                   activeCard.querySelector('strong');
          if (ct) title = clean(ct);
        }
        if (!company) {
          var cc = activeCard.querySelector('[class*="primary-description"]') ||
                   activeCard.querySelector('[class*="subtitle"]') ||
                   activeCard.querySelector('[class*="company"]');
          if (cc) company = clean(cc).replace(/\s*[·|•·].*$/, '').trim();
        }
        console.log('[Snag] active card:', title, '|', company);
      }
    }

    // ---- STRATEGY 4: Page title parsing ----
    // Formats: "Title at Company | LinkedIn" / "Title - Company | LinkedIn" / "(N) Title..."
    if (!title || !company) {
      var pt = (document.title || '').replace(/^\(\d+\)\s*/, '').trim();
      console.log('[Snag] page title:', pt);

      var patterns = [
        /^(.+?)\s+hiring\s*\|\s*(.+?)\s*\|/i,
        /^(.+?)\s+(?:at|@)\s+(.+?)\s*[|\u2014]/i,
        /^(.+?)\s*-\s*(.+?)\s*\|/i,
        /^(.+?)\s*\|\s*([^|]{2,50})\s*\|/i
      ];

      for (var p = 0; p < patterns.length; p++) {
        var m = pt.match(patterns[p]);
        if (m) {
          var mt = m[1].trim();
          var mc = m[2].trim();
          if (mt && mt.toLowerCase().indexOf('linkedin') === -1 && !title) title = mt;
          if (mc && mc.toLowerCase().indexOf('linkedin') === -1 && !company) company = mc;
          if (title && company) break;
        }
      }
    }

    // ---- STRATEGY 5: og:title meta tag ----
    if (!title || !company) {
      var og = document.querySelector('meta[property="og:title"]');
      if (og) {
        var ogContent = og.getAttribute('content') || '';
        var ogAt = ogContent.match(/^(.+?)\s+(?:at|@)\s+(.+?)(?:\s*[|\-]|$)/i);
        if (ogAt) {
          if (!title) title = ogAt[1].trim();
          if (!company) company = ogAt[2].trim();
          console.log('[Snag] og:title:', title, '|', company);
        }
      }
    }

    // ---- Salary & description ----
    var salaryEl =
      document.querySelector('.job-details-jobs-unified-top-card__salary-info') ||
      document.querySelector('.jobs-unified-top-card__salary-info') ||
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

    console.log('[Snag] final result:', result.title, '|', result.company);
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
    setTimeout(function () { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(function () { if (host.parentNode) host.remove(); }, 400); }, 2800);
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
