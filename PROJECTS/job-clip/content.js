(function () {
  'use strict';

  let lastInjectedUrl = null;

  // ── Tier 1: JSON-LD structured data (highest confidence) ──────────
  function extractFromJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'JobPosting') {
            return {
              title: item.title || '',
              company: item.hiringOrganization?.name || '',
              description: (item.description || '').substring(0, 3000),
              location: item.jobLocation?.address?.addressLocality || '',
              source: 'jsonld'
            };
          }
        }
      } catch (e) {}
    }
    return null;
  }

  // ── Tier 2: Explicit DOM selectors (known sites) ──────────────────
  const SELECTORS = {
    'linkedin.com': {
      title: [
        '.job-details-jobs-unified-top-card__job-title h1',
        '.jobs-unified-top-card__job-title h1',
        '.t-24.t-bold.inline',
        'h1'
      ],
      company: [
        '.job-details-jobs-unified-top-card__company-name a',
        '.jobs-unified-top-card__company-name a',
        '.jobs-unified-top-card__subtitle-primary-grouping a'
      ]
    },
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

  function getMatchedDomain() {
    const host = location.hostname.replace(/^www\./, '');
    for (const domain of Object.keys(SELECTORS)) {
      if (host === domain || host.endsWith('.' + domain)) return domain;
    }
    return null;
  }

  function queryFirst(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        // For img[alt] selectors (e.g. Lever logo), use alt text
        if (el.tagName === 'IMG' && el.alt) return el.alt;
        return el.textContent.trim();
      }
    }
    return '';
  }

  function extractFromSelectors(domain) {
    const map = SELECTORS[domain];
    if (!map) return null;
    const title = queryFirst(map.title);
    const company = queryFirst(map.company);
    if (!title) return null;
    return { title, company, description: '', location: '', source: 'selector' };
  }

  // ── Tier 3: Heuristic detection (unknown sites) ───────────────────
  function scorePageAsJobPosting() {
    let score = 0;
    const url = location.href.toLowerCase();
    const jobPaths = ['/jobs/', '/careers/', '/position/', '/opening/', '/vacancy/'];
    for (const p of jobPaths) {
      if (url.includes(p)) { score += 2; break; }
    }

    const buttons = document.querySelectorAll('button, a[role="button"], input[type="submit"]');
    const applyPatterns = /apply\s*(now|for\s*this|here)?|submit\s*application/i;
    for (const btn of buttons) {
      if (applyPatterns.test(btn.textContent)) { score += 3; break; }
    }

    const text = document.body?.innerText || '';
    const sections = ['responsibilities', 'requirements', 'qualifications'];
    for (const s of sections) {
      if (text.toLowerCase().includes(s)) score += 2;
    }

    if (/salary|compensation|\$\d{2,3}[,kK]/i.test(text)) score += 1;

    return score;
  }

  function extractFromHeuristics() {
    const h1 = document.querySelector('h1');
    const title = h1?.textContent?.trim() || '';
    // Try to get company from meta tags or og:site_name
    const ogSite = document.querySelector('meta[property="og:site_name"]');
    const company = ogSite?.content || location.hostname.replace(/^www\./, '').split('.')[0] || '';
    return { title, company, description: '', location: '', source: 'heuristic' };
  }

  // ── Detection orchestration ───────────────────────────────────────
  function detectJob() {
    // Tier 1: JSON-LD
    const jsonLd = extractFromJsonLd();
    if (jsonLd && jsonLd.title) return { tier: 1, data: jsonLd };

    // Tier 2: Known site selectors
    const domain = getMatchedDomain();
    if (domain) {
      const sel = extractFromSelectors(domain);
      if (sel && sel.title) return { tier: 2, data: sel };
    }

    // Tier 3: Heuristic
    const score = scorePageAsJobPosting();
    if (score >= 5) {
      const heur = extractFromHeuristics();
      if (heur.title) return { tier: 3, data: heur };
    }

    return null;
  }

  // ── Get job description text ──────────────────────────────────────
  function getDescription() {
    const descSelectors = [
      '.jobs-description__content',
      '.jobs-description-content__text',
      '#job-details',
      '.job-description',
      '.posting-page .content',
      '[data-qa="job-description"]',
      '.jv-job-detail-description'
    ];
    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el) return el.textContent.trim().substring(0, 3000);
    }
    return '';
  }

  // ── Snag button UI ────────────────────────────────────────────────
  function createSnagButton(tier, jobData) {
    const existing = document.getElementById('snag-btn');
    if (existing) existing.remove();

    const isFloating = tier === 3;

    const btn = document.createElement('button');
    btn.id = 'snag-btn';

    if (isFloating) {
      btn.textContent = 'Snag this job?';
      btn.style.cssText = [
        'position:fixed', 'bottom:24px', 'right:24px', 'z-index:999999',
        'padding:10px 18px', 'background:#1a1a1a', 'color:white',
        'border:none', 'border-radius:24px', 'font-size:13px',
        'font-weight:600', 'cursor:pointer', 'box-shadow:0 2px 12px rgba(0,0,0,0.25)',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        'transition:all 0.15s ease'
      ].join(';');
    } else {
      btn.textContent = '\u26A1 Snag';
      btn.style.cssText = [
        'margin-left:8px', 'padding:8px 16px',
        'background:#1a1a1a', 'color:white',
        'border:none', 'border-radius:20px', 'font-size:14px',
        'font-weight:600', 'cursor:pointer',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
      ].join(';');
    }

    btn.addEventListener('mouseenter', () => { btn.style.background = '#333'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#1a1a1a'; });

    let confirmed = !isFloating; // Tier 1/2 skip confirmation

    btn.addEventListener('click', async () => {
      if (isFloating && !confirmed) {
        // Show confirmation with editable fields
        confirmed = true;
        btn.innerHTML = '';
        btn.style.cssText = [
          'position:fixed', 'bottom:24px', 'right:24px', 'z-index:999999',
          'padding:16px', 'background:#1a1a1a', 'color:white',
          'border:none', 'border-radius:12px', 'font-size:13px',
          'cursor:default', 'box-shadow:0 2px 12px rgba(0,0,0,0.25)',
          'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
          'display:flex', 'flex-direction:column', 'gap:8px', 'min-width:240px'
        ].join(';');

        const makeInput = (label, value) => {
          const wrap = document.createElement('div');
          const lbl = document.createElement('div');
          lbl.textContent = label;
          lbl.style.cssText = 'font-size:11px;color:#888;margin-bottom:2px;';
          const inp = document.createElement('input');
          inp.value = value;
          inp.style.cssText = 'width:100%;padding:6px 8px;border:1px solid #444;border-radius:6px;background:#222;color:white;font-size:13px;box-sizing:border-box;';
          wrap.appendChild(lbl);
          wrap.appendChild(inp);
          return { wrap, inp };
        };

        const titleField = makeInput('Title', jobData.title);
        const companyField = makeInput('Company', jobData.company);

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = '\u26A1 Snag it';
        confirmBtn.style.cssText = 'padding:8px;background:#057642;color:white;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;margin-top:4px;';

        btn.appendChild(titleField.wrap);
        btn.appendChild(companyField.wrap);
        btn.appendChild(confirmBtn);

        confirmBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          jobData.title = titleField.inp.value.trim() || jobData.title;
          jobData.company = companyField.inp.value.trim() || jobData.company;
          await doSnag(btn, jobData, true);
        });
        return;
      }

      await doSnag(btn, jobData, isFloating);
    });

    return btn;
  }

  async function doSnag(btn, jobData, isFloating) {
    if (isFloating) {
      btn.innerHTML = '';
      btn.style.cssText = [
        'position:fixed', 'bottom:24px', 'right:24px', 'z-index:999999',
        'padding:10px 18px', 'background:#555', 'color:white',
        'border:none', 'border-radius:24px', 'font-size:13px',
        'font-weight:600', 'cursor:default', 'box-shadow:0 2px 12px rgba(0,0,0,0.25)',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
      ].join(';');
      btn.textContent = '\u23F3 Snagging...';
    } else {
      btn.textContent = '\u23F3 Snagging...';
      btn.disabled = true;
    }

    const desc = jobData.description || getDescription();
    const payload = {
      company: jobData.company,
      role: jobData.title,
      source_url: location.href,
      description: desc,
      location: jobData.location || ''
    };

    const response = await chrome.runtime.sendMessage({ type: 'SNAG_JOB', data: payload });

    if (response.success) {
      btn.innerHTML = '';
      btn.textContent = '\u2705 Snagged!';
      btn.style.background = '#057642';
      if (!isFloating) btn.disabled = true;
      setTimeout(() => { btn.remove(); }, 2500);
    } else {
      btn.innerHTML = '';
      btn.textContent = '\u274C Failed';
      btn.style.background = '#cc0000';
      console.error('Snag error:', response.error);
      setTimeout(() => {
        btn.textContent = isFloating ? 'Snag this job?' : '\u26A1 Snag';
        btn.style.background = '#1a1a1a';
        if (!isFloating) btn.disabled = false;
      }, 2500);
    }
  }

  // ── Injection logic ───────────────────────────────────────────────
  function tryInject() {
    const currentUrl = location.href;
    if (lastInjectedUrl === currentUrl && document.getElementById('snag-btn')) return;

    const result = detectJob();
    if (!result) return;

    const btn = createSnagButton(result.tier, result.data);

    if (result.tier === 3) {
      // Floating badge — append to body
      document.body.appendChild(btn);
    } else {
      // Try to place inline near an apply button
      const containers = [
        '.jobs-apply-button--top-card',
        '.job-details-jobs-unified-top-card__container--two-pane',
        '.jobs-unified-top-card__content--two-pane .mt4',
        '.jobs-s-apply',
        '.posting-btn-submit',
        '.postings-btn',
        '[data-qa="apply-button"]'
      ];
      const container = document.querySelector(containers.join(','));
      if (container) {
        const applyBtn = container.querySelector('button, a');
        if (applyBtn) {
          applyBtn.insertAdjacentElement('afterend', btn);
        } else {
          container.appendChild(btn);
        }
      } else {
        // Fall back to floating if no container found
        btn.style.cssText = [
          'position:fixed', 'bottom:24px', 'right:24px', 'z-index:999999',
          'padding:10px 18px', 'background:#1a1a1a', 'color:white',
          'border:none', 'border-radius:24px', 'font-size:13px',
          'font-weight:600', 'cursor:pointer', 'box-shadow:0 2px 12px rgba(0,0,0,0.25)',
          'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
        ].join(';');
        document.body.appendChild(btn);
      }
    }

    lastInjectedUrl = currentUrl;
  }

  // ── SPA navigation watcher ────────────────────────────────────────
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      lastInjectedUrl = null;
      setTimeout(tryInject, 1200);
    } else if (!document.getElementById('snag-btn')) {
      tryInject();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(tryInject, 1500);
})();
