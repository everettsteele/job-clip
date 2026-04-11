(function () {
  'use strict';

  var HOST_ID = 'snag-host';
  var TOAST_ID = 'snag-toast-host';

  // ── Tier 1: JSON-LD structured data (highest confidence) ──────────
  function extractFromJsonLd() {
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < scripts.length; i++) {
      try {
        var data = JSON.parse(scripts[i].textContent);
        var items = Array.isArray(data) ? data : [data];
        for (var j = 0; j < items.length; j++) {
          if (items[j]['@type'] === 'JobPosting') {
            return {
              title: items[j].title || '',
              company: (items[j].hiringOrganization && items[j].hiringOrganization.name) || '',
              description: (items[j].description || '').substring(0, 3000),
              source: 'jsonld'
            };
          }
        }
      } catch (e) {}
    }
    return null;
  }

  // ── Tier 2: Explicit DOM selectors (known sites) ──────────────────
  var SELECTORS = {
    'greenhouse.io': {
      title: ['h1.app-title'],
      company: ['.company-name']
    },
    'lever.co': {
      title: ['.posting-headline h2'],
      company: ['.main-header-logo img[alt]']
    },
    'workday.com': {
      title: ['h2[data-automation-id="jobPostingHeader"]'],
      company: ['.css-1q2dra3']
    },
    'icims.com': {
      title: ['h1.iCIMS_Header'],
      company: ['.iCIMS_MainColumn h2']
    },
    'smartrecruiters.com': {
      title: ['h1[data-qa="job-title"]'],
      company: ['[data-qa="company-name"]']
    },
    'jobvite.com': {
      title: ['h1.jv-header'],
      company: ['.jv-company']
    },
    'ashbyhq.com': {
      title: ['h1'],
      company: ['.ashby-job-posting-company-name']
    },
    'bamboohr.com': {
      title: ['h2.BambooHR-ATS-header'],
      company: ['.BambooHR-ATS-companyName']
    },
    'rippling.com': {
      title: ['h1[data-testid="job-title"]'],
      company: ['.company-name']
    }
  };

  function clean(el) {
    if (!el) return '';
    return el.textContent.replace(/\s+/g, ' ').trim();
  }

  function getMatchedDomain() {
    var host = location.hostname.replace(/^www\./, '');
    for (var domain in SELECTORS) {
      if (host === domain || host.indexOf('.' + domain) === host.length - domain.length - 1) return domain;
    }
    return null;
  }

  function queryFirst(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) {
        if (el.tagName === 'IMG' && el.alt) return el.alt;
        return clean(el);
      }
    }
    return '';
  }

  function extractFromSelectors(domain) {
    var map = SELECTORS[domain];
    if (!map) return null;
    var title = queryFirst(map.title);
    var company = queryFirst(map.company);
    if (!title) return null;
    return { title: title, company: company, description: '', source: 'selector' };
  }

  // ── LinkedIn-specific extraction (document.title is most reliable) ─
  function isLinkedIn() {
    return location.hostname.indexOf('linkedin.com') !== -1;
  }

  function isLinkedInJobPage() {
    return isLinkedIn() && location.href.indexOf('/jobs/') !== -1;
  }

  function extractFromLinkedIn() {
    var title = null;
    var company = null;

    // PRIMARY: parse document.title — most reliable on LinkedIn
    // Format: "Chief of Staff to the CTO | Machinify | LinkedIn"
    // Also handles: "(32) Title | Company | LinkedIn"
    var pt = (document.title || '').replace(/^\(\d+\)\s*/, '').trim();

    var m = pt.match(/^(.+?)\s*\|\s*(.+?)\s*\|\s*LinkedIn\s*$/i);
    if (m) {
      title = m[1].trim();
      company = m[2].trim();
    }

    // FALLBACK A: any pipe pattern
    if (!title || !company) {
      var m2 = pt.match(/^(.+?)\s*\|\s*(.+?)(?:\s*\|.*)?$/i);
      if (m2) {
        if (!title && m2[1].toLowerCase().indexOf('linkedin') === -1) title = m2[1].trim();
        if (!company && m2[2].toLowerCase().indexOf('linkedin') === -1) company = m2[2].trim();
      }
    }

    // FALLBACK B: DOM selectors
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

    if (!title) return null;
    return { title: title, company: company || 'Unknown Company', description: '', source: 'linkedin' };
  }

  // ── Tier 3: Heuristic detection (unknown sites) ───────────────────
  function scorePageAsJobPosting() {
    var score = 0;
    var url = location.href.toLowerCase();
    var jobPaths = ['/jobs/', '/careers/', '/position/', '/opening/', '/vacancy/'];
    for (var i = 0; i < jobPaths.length; i++) {
      if (url.indexOf(jobPaths[i]) !== -1) { score += 2; break; }
    }

    var buttons = document.querySelectorAll('button, a[role="button"], input[type="submit"]');
    var applyPatterns = /apply\s*(now|for\s*this|here)?|submit\s*application/i;
    for (var j = 0; j < buttons.length; j++) {
      if (applyPatterns.test(buttons[j].textContent)) { score += 3; break; }
    }

    var text = (document.body && document.body.innerText) || '';
    var sections = ['responsibilities', 'requirements', 'qualifications'];
    for (var k = 0; k < sections.length; k++) {
      if (text.toLowerCase().indexOf(sections[k]) !== -1) score += 2;
    }

    if (/salary|compensation|\$\d{2,3}[,kK]/i.test(text)) score += 1;

    return score;
  }

  function extractFromHeuristics() {
    var h1 = document.querySelector('h1');
    var title = h1 ? clean(h1) : '';
    var ogSite = document.querySelector('meta[property="og:site_name"]');
    var company = (ogSite && ogSite.content) || location.hostname.replace(/^www\./, '').split('.')[0] || '';
    return { title: title, company: company, description: '', source: 'heuristic' };
  }

  // ── Detection orchestration ───────────────────────────────────────
  function detectJob() {
    // LinkedIn gets its own path
    if (isLinkedIn()) {
      if (!isLinkedInJobPage()) return null;
      // Still try JSON-LD first
      var jsonLd = extractFromJsonLd();
      if (jsonLd && jsonLd.title) return jsonLd;
      return extractFromLinkedIn();
    }

    // Tier 1: JSON-LD
    var jsonLdResult = extractFromJsonLd();
    if (jsonLdResult && jsonLdResult.title) return jsonLdResult;

    // Tier 2: Known site selectors
    var domain = getMatchedDomain();
    if (domain) {
      var sel = extractFromSelectors(domain);
      if (sel && sel.title) return sel;
    }

    // Tier 3: Heuristic
    var score = scorePageAsJobPosting();
    if (score >= 5) {
      var heur = extractFromHeuristics();
      if (heur.title) return heur;
    }

    return null;
  }

  // ── Get description text ──────────────────────────────────────────
  function getDescription() {
    var descSelectors = [
      '.jobs-description__content',
      '.jobs-description-content__text',
      '#job-details',
      '.jobs-details__main-content',
      '.job-description',
      '.posting-page .content',
      '[data-qa="job-description"]',
      '.jv-job-detail-description'
    ];
    for (var i = 0; i < descSelectors.length; i++) {
      var el = document.querySelector(descSelectors[i]);
      if (el) return el.textContent.replace(/\s+/g, ' ').trim().substring(0, 3000);
    }
    return '';
  }

  // ── Toast notification ────────────────────────────────────────────
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

  // ── Snag button (Shadow DOM to survive LinkedIn CSS) ──────────────
  function createHost(jobData) {
    var host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = 'all:initial;position:fixed;bottom:80px;right:24px;z-index:2147483647;display:block;';
    var sh = host.attachShadow({ mode: 'open' });
    var style = document.createElement('style');
    style.textContent = '#b{all:initial;display:flex;align-items:center;gap:6px;background:#1a1a1a;color:#fff;border:none;border-radius:24px;padding:0 22px;height:46px;font-size:15px;font-weight:700;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.35);white-space:nowrap;transition:transform .15s,box-shadow .15s,background .15s}#b:hover{background:#333!important;transform:translateY(-2px);box-shadow:0 6px 22px rgba(0,0,0,.5)}#b:disabled{cursor:default}';
    var btn = document.createElement('button');
    btn.id = 'b';
    btn.textContent = '\u26A1 Snag';

    btn.addEventListener('click', function () {
      btn.textContent = '\u23F3 Snagging...';
      btn.disabled = true;
      btn.style.cssText = 'background:#555;box-shadow:none;';

      // Re-detect to get freshest data
      var fresh = detectJob();
      var data = fresh || jobData;
      var desc = getDescription();

      var payload = {
        company: data.company || 'Unknown Company',
        role: data.title || 'Unknown Title',
        source_url: location.href,
        description: desc
      };

      chrome.runtime.sendMessage({ type: 'SNAG_JOB', data: payload }, function (response) {
        if (chrome.runtime.lastError) {
          showToast('\u274C ' + chrome.runtime.lastError.message, '#cc0000');
          btn.textContent = '\u26A1 Snag'; btn.style.cssText = ''; btn.disabled = false;
          return;
        }
        if (response && response.success) {
          btn.textContent = '\u2705 Snagged!';
          btn.style.cssText = 'background:#057642;box-shadow:0 4px 18px rgba(5,118,66,.5);';
          showToast('\u2705 ' + payload.company + ' \u2014 ' + payload.role, '#057642');
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

  // ── Injection ─────────────────────────────────────────────────────
  function inject() {
    if (!document.documentElement) return;

    var result = detectJob();
    if (!result) {
      // No job detected — remove button if present
      var e = document.getElementById(HOST_ID);
      if (e) e.remove();
      return;
    }

    if (!document.getElementById(HOST_ID)) {
      document.documentElement.appendChild(createHost(result));
    }
  }

  // Poll for injection (handles SPA loading delays)
  var n = 0;
  var iv = setInterval(function () { inject(); if (++n >= 20) clearInterval(iv); }, 500);

  // Watch for SPA navigation
  var lastUrl = location.href;
  try {
    new MutationObserver(function () {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        // Remove old button on navigation
        var e = document.getElementById(HOST_ID);
        if (e) e.remove();
        n = 0;
        iv = setInterval(function () { inject(); if (++n >= 20) clearInterval(iv); }, 500);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
