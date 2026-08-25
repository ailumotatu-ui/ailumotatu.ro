(function () {
  "use strict";

  const GOOGLE_TAG_ID = "G-65DG76RDPH";
  const CONSENT_KEY = "am-analytics-consent";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied"
  });

  function readConsent() {
    try {
      return window.localStorage.getItem(CONSENT_KEY);
    } catch (error) {
      return null;
    }
  }

  function saveConsent(value) {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch (error) {
      // Alegerea rămâne valabilă pentru pagina curentă dacă stocarea este blocată.
    }
  }

  function loadGoogleTag() {
    if (document.querySelector("script[data-google-tag]")) return;

    window.gtag("js", new Date());
    window.gtag("config", GOOGLE_TAG_ID);

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`;
    script.dataset.googleTag = GOOGLE_TAG_ID;
    script.referrerPolicy = "origin";
    document.head.appendChild(script);
  }

  function grantAnalytics() {
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    saveConsent("granted");
    loadGoogleTag();
  }

  function removeAnalyticsCookies() {
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    const domains = [hostname, `.${hostname}`];
    if (parts.length > 2) domains.push(`.${parts.slice(-2).join(".")}`);

    document.cookie.split(";").forEach(function (cookie) {
      const name = cookie.split("=")[0].trim();
      if (name === "_ga" || name.indexOf("_ga_") === 0) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
        domains.forEach(function (domain) {
          document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}; SameSite=Lax`;
        });
      }
    });
  }

  function denyAnalytics(reloadAfter) {
    window.gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    saveConsent("denied");
    removeAnalyticsCookies();
    if (reloadAfter) window.location.reload();
  }

  function buildConsentBanner() {
    const banner = document.createElement("section");
    banner.className = "cookie-consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-labelledby", "cookie-consent-title");
    banner.innerHTML = [
      '<div class="cookie-consent-copy">',
      '<strong id="cookie-consent-title">Preferințe de confidențialitate</strong>',
      '<p>Folosim Google Analytics numai cu acordul tău, pentru a înțelege cum este vizitat site-ul. Poți continua și fără măsurare.</p>',
      '<a href="/confidentialitate/">Află mai multe</a>',
      "</div>",
      '<div class="cookie-consent-actions">',
      '<button type="button" data-consent="denied">Doar necesare</button>',
      '<button type="button" data-consent="granted">Acceptă Analytics</button>',
      "</div>"
    ].join("");

    banner.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-consent]");
      if (!button) return;
      if (button.dataset.consent === "granted") grantAnalytics();
      else denyAnalytics(false);
      banner.remove();
    });

    document.body.appendChild(banner);
    const firstButton = banner.querySelector("button");
    if (firstButton) firstButton.focus({ preventScroll: true });
  }

  function addSettingsButton() {
    const privacyLink = document.querySelector('a[href="/confidentialitate/"]');
    if (!privacyLink || document.querySelector("[data-cookie-settings]")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "cookie-settings";
    button.dataset.cookieSettings = "";
    button.textContent = "Setări cookie";
    button.addEventListener("click", function () {
      const existing = document.querySelector(".cookie-consent");
      if (existing) {
        existing.querySelector("button")?.focus();
        return;
      }
      buildConsentBanner();
    });
    privacyLink.insertAdjacentElement("afterend", button);
  }

  document.addEventListener("DOMContentLoaded", function () {
    addSettingsButton();
    const consent = readConsent();
    if (consent === "granted") grantAnalytics();
    else if (consent !== "denied") buildConsentBanner();
  });
})();
