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
      title: titleEl?.textContent?.trim() || 'Unknown Title',
      company: companyEl?.textContent?.trim() || 'Unknown Company',
      salary: salaryEl?.textContent?.trim() || null,
      url: window.location.href,
      description: descEl?.textContent?.trim()?.substring(0, 3000) || '',
      clippedAt: new Date().toISOString()
    };
  }

  function injectButton() {
    const currentUrl = window.location.href;
    if (lastInjectedUrl === currentUrl && document.getElementById('job-clip-btn')) return;

    const existing = document.getElementById('job-clip-btn');
    if (existing) existing.remove();

    // Try multiple container selectors — LinkedIn changes these frequently
    const container = document.querySelector([
      '.jobs-apply-button--top-card',
      '.job-details-jobs-unified-top-card__container--two-pane',
      '.jobs-unified-top-card__content--two-pane .mt4',
      '.jobs-s-apply'
    ].join(','));

    if (!container) return;

    const btn = document.createElement('button');
    btn.id = 'job-clip-btn';
    btn.textContent = '\uD83D\uDCCE Clip Job';
    btn.style.cssText = [
      'margin-left:8px',
      'padding:8px 16px',
      'background:#0a66c2',
      'color:white',
      'border:none',
      'border-radius:20px',
      'font-size:14px',
      'font-weight:600',
      'cursor:pointer',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
    ].join(';');

    btn.addEventListener('mouseenter', () => { btn.style.background = '#004182'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#0a66c2'; });

    btn.addEventListener('click', async () => {
      btn.textContent = '\u23F3 Clipping...';
      btn.disabled = true;

      const jobData = extractJobData();
      const response = await chrome.runtime.sendMessage({ type: 'CLIP_JOB', data: jobData });

      if (response.success) {
        btn.textContent = '\u2705 Clipped!';
        btn.style.background = '#057642';
        setTimeout(() => {
          btn.textContent = '\uD83D\uDCCE Clip Job';
          btn.style.background = '#0a66c2';
          btn.disabled = false;
        }, 2000);
      } else {
        btn.textContent = '\u274C Failed';
        btn.style.background = '#cc0000';
        console.error('Job Clip error:', response.error);
        setTimeout(() => {
          btn.textContent = '\uD83D\uDCCE Clip Job';
          btn.style.background = '#0a66c2';
          btn.disabled = false;
        }, 2000);
      }
    });

    // Insert next to existing apply button if present, otherwise append
    const applyBtn = container.querySelector('button');
    if (applyBtn) {
      applyBtn.insertAdjacentElement('afterend', btn);
    } else {
      container.appendChild(btn);
    }

    lastInjectedUrl = currentUrl;
  }

  // Watch for SPA navigation
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
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
