/**
 * MY PRETTY FAMILY - Système de traduction i18n
 * Gère le changement de langue et la persistance
 * Version avec menu mobile 3/4 et popup langue
 */

(function () {
  'use strict';

  // Configuration des langues supportées
  const SUPPORTED_LANGUAGES = {
    fr: { name: 'Français', flag: '<img src="/assets/ui/flags/fr.svg" alt="FR" class="flag-icon">', code: 'fr' },
    en: { name: 'English', flag: '<img src="/assets/ui/flags/gb.svg" alt="EN" class="flag-icon">', code: 'en' },
    it: { name: 'Italiano', flag: '<img src="/assets/ui/flags/it.svg" alt="IT" class="flag-icon">', code: 'it' },
    es: { name: 'Español', flag: '<img src="/assets/ui/flags/es.svg" alt="ES" class="flag-icon">', code: 'es' },
    pt: { name: 'Português', flag: '<img src="/assets/ui/flags/pt.svg" alt="PT" class="flag-icon">', code: 'pt' },
    de: { name: 'Deutsch', flag: '<img src="/assets/ui/flags/de.svg" alt="DE" class="flag-icon">', code: 'de' },
    nl: { name: 'Nederlands', flag: '<img src="/assets/ui/flags/nl.svg" alt="NL" class="flag-icon">', code: 'nl' }
  };

  const DEFAULT_LANGUAGE = 'fr';
  const STORAGE_KEY = 'mpf_language';

  // État actuel
  // État actuel
  let currentLanguage = DEFAULT_LANGUAGE;

  /**
   * Récupère la langue depuis l'URL (SSG)
   * Supporte les structures /en/ et dist/en/
   */
  function getLanguageFromPath() {
    const path = window.location.pathname;

    // Check for language code in path segments
    const segments = path.split('/');
    for (const segment of segments) {
      if (SUPPORTED_LANGUAGES[segment]) {
        return segment;
      }
    }

    return DEFAULT_LANGUAGE;
  }

  /**
   * Sauvegarde la langue dans le localStorage
   */
  function saveLanguage(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Unable to save language preference:', e);
    }
  }

  /**
   * Récupère une traduction imbriquée (Utilitaire pour scripts potentiels)
   */
  function getNestedTranslation(path, lang) {
    if (!window.translations) return null;
    const keys = path.split('.');
    let result = window.translations;
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return null;
      }
    }
    return result && typeof result === 'object' && lang in result ? result[lang] : null;
  }

  /**
   * Met à jour l'affichage des sélecteurs de langue (desktop et mobile)
   */
  function updateLanguageSelectors(lang) {
    const langData = SUPPORTED_LANGUAGES[lang];
    if (!langData) return;

    // Desktop
    const currentFlag = document.querySelector('.lang-current-flag');
    const currentCode = document.querySelector('.lang-current-code');
    if (currentFlag) currentFlag.innerHTML = langData.flag;
    if (currentCode) currentCode.textContent = lang.toUpperCase();

    // Desktop dropdown
    document.querySelectorAll('.lang-option').forEach(option => {
      option.classList.toggle('active', option.getAttribute('data-lang') === lang);
    });

    // Mobile toggle button
    const mobileToggleFlag = document.querySelector('.lang-mobile-toggle .lang-flag');
    const mobileToggleCurrent = document.querySelector('.lang-mobile-toggle-current');
    if (mobileToggleFlag) mobileToggleFlag.innerHTML = langData.flag;
    if (mobileToggleCurrent) mobileToggleCurrent.textContent = langData.name;

    // Mobile popup
    document.querySelectorAll('.lang-popup-option').forEach(option => {
      option.classList.toggle('active', option.getAttribute('data-lang') === lang);
    });
  }

  /**
   * Change la langue (Navigation vers URL)
   */
  function setLanguage(lang) {
    if (!SUPPORTED_LANGUAGES[lang]) return;

    // Sauvegarde la préférence
    saveLanguage(lang);

    if (lang === currentLanguage) return;

    // Calcul de la nouvelle URL
    const currentLocation = window.location.pathname;
    let newPath = currentLocation;
    const search = window.location.search;
    const hash = window.location.hash;

    // Détecter si on est dans un sous-dossier de langue (ex: /en/)
    // La regex regarde le début ou après un slash
    const langMatch = currentLocation.match(new RegExp(`\/(${Object.keys(SUPPORTED_LANGUAGES).join('|')})(\/|$)`));

    if (langMatch) {
      // Cas 1: Une langue est présente (ex: /en/page.html ou /dist/en/page.html)
      // On remplace le code langue
      newPath = currentLocation.replace(`/${langMatch[1]}`, lang === DEFAULT_LANGUAGE ? '' : `/${lang}`);
      // Nettoyage des doubles slashs éventuels
      newPath = newPath.replace('//', '/');
    } else {
      // Cas 2: Pas de langue (ex: /page.html ou /dist/page.html) -> C'est du FR (Default)
      if (lang !== DEFAULT_LANGUAGE) {
        // On doit insérer le code langue.
        // Si le chemin commence par /dist, on insère APRES /dist
        if (newPath.startsWith('/dist/')) {
          newPath = newPath.replace('/dist/', `/dist/${lang}/`);
        } else {
          // Sinon on met au début
          // Attention au slash initial
          const cleanPath = newPath.startsWith('/') ? newPath : '/' + newPath;
          newPath = `/${lang}${cleanPath}`;
        }
      }
    }

    // Correction finale pour éviter les urls bizarres si on revient au défaut
    if (newPath === '') newPath = '/';

    // Navigation
    window.location.href = newPath + search + hash;
  }

  /**
   * Crée le HTML du sélecteur de langue desktop
   */
  function createDesktopLanguageSelector() {
    const selector = document.createElement('div');
    selector.className = 'lang-selector';
    selector.innerHTML = `
      <button class="lang-toggle" aria-label="Changer de langue" aria-expanded="false">
        <span class="lang-current-flag">${SUPPORTED_LANGUAGES[currentLanguage].flag}</span>
        <span class="lang-current-code">${currentLanguage.toUpperCase()}</span>
        <i class="fa-solid fa-chevron-down lang-arrow"></i>
      </button>
      <div class="lang-dropdown">
        ${Object.entries(SUPPORTED_LANGUAGES).map(([code, data]) => `
          <button class="lang-option ${code === currentLanguage ? 'active' : ''}" data-lang="${code}">
            <span class="lang-flag">${data.flag}</span>
            <span class="lang-name">${data.name}</span>
          </button>
        `).join('')}
      </div>
    `;
    return selector;
  }

  /**
   * Crée le HTML du bouton langue mobile (compact)
   */
  function createMobileLanguageButton() {
    const container = document.createElement('div');
    container.className = 'lang-selector-mobile';
    container.innerHTML = `
      <button class="lang-mobile-toggle" aria-label="Changer de langue">
        <div class="lang-mobile-toggle-content">
          <span class="lang-flag">${SUPPORTED_LANGUAGES[currentLanguage].flag}</span>
          <div class="lang-mobile-toggle-text">
            <span class="lang-mobile-toggle-label" data-i18n="nav.langLabel">Langue</span>
            <span class="lang-mobile-toggle-current">${SUPPORTED_LANGUAGES[currentLanguage].name}</span>
          </div>
        </div>
        <i class="fa-solid fa-chevron-right lang-mobile-toggle-arrow"></i>
      </button>
    `;
    return container;
  }

  /**
   * Crée le popup de sélection de langue (mobile)
   */
  function createLanguagePopup() {
    const popup = document.createElement('div');
    popup.className = 'lang-popup-overlay';
    popup.id = 'langPopup';
    popup.innerHTML = `
      <div class="lang-popup">
        <div class="lang-popup-handle"><span></span></div>
        <div class="lang-popup-header">
          <h3 class="lang-popup-title" data-i18n="nav.popupChoisirLangue">Choisir la langue</h3>
          <button class="lang-popup-close" aria-label="Fermer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="lang-popup-list">
          ${Object.entries(SUPPORTED_LANGUAGES).map(([code, data]) => `
            <button class="lang-popup-option ${code === currentLanguage ? 'active' : ''}" data-lang="${code}">
              <span class="lang-flag">${data.flag}</span>
              <div class="lang-popup-option-info">
                <span class="lang-popup-option-name">${data.name}</span>
                <span class="lang-popup-option-code">${code.toUpperCase()}</span>
              </div>
              <span class="lang-popup-option-check">
                <i class="fa-solid fa-check"></i>
              </span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    return popup;
  }

  /**
   * Ouvre le popup de langue
   */
  function openLanguagePopup() {
    const popup = document.getElementById('langPopup');
    if (popup) {
      popup.classList.add('open');
      document.body.classList.add('lang-popup-open');
    }
  }

  /**
   * Ferme le popup de langue
   */
  function closeLanguagePopup() {
    const popup = document.getElementById('langPopup');
    if (popup) {
      popup.classList.remove('open');
      document.body.classList.remove('lang-popup-open');
    }
  }

  /**
   * Injecte les sélecteurs de langue
   */
  function injectLanguageSelectors() {
    // Desktop nav
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !navLinks.querySelector('.lang-selector')) {
      const selector = createDesktopLanguageSelector();
      navLinks.appendChild(selector);
    }

    // Mobile nav - Bouton compact
    const mobileContent = document.querySelector('.nav-mobile-content');
    if (mobileContent && !mobileContent.querySelector('.lang-selector-mobile')) {
      const mobileButton = createMobileLanguageButton();
      mobileContent.appendChild(mobileButton);
    }

    // Popup langue (ajouté au body)
    if (!document.getElementById('langPopup')) {
      const popup = createLanguagePopup();
      document.body.appendChild(popup);
    }
  }

  /**
   * Initialise les événements des sélecteurs
   */
  function initLanguageSelectorEvents() {
    document.addEventListener('click', function (e) {
      // Desktop toggle
      const toggle = e.target.closest('.lang-toggle');
      if (toggle) {
        e.stopPropagation();
        const dropdown = toggle.nextElementSibling;
        const isOpen = toggle.classList.contains('open');

        // Fermer tous
        document.querySelectorAll('.lang-toggle').forEach(t => t.classList.remove('open'));
        document.querySelectorAll('.lang-dropdown').forEach(d => d.classList.remove('open'));

        if (!isOpen) {
          toggle.classList.add('open');
          toggle.setAttribute('aria-expanded', 'true');
          if (dropdown) dropdown.classList.add('open');
        } else {
          toggle.setAttribute('aria-expanded', 'false');
        }
        return;
      }

      // Desktop option
      const option = e.target.closest('.lang-option');
      if (option) {
        const lang = option.getAttribute('data-lang');
        setLanguage(lang);
        return;
      }

      // Mobile toggle - ouvrir popup
      const mobileToggle = e.target.closest('.lang-mobile-toggle');
      if (mobileToggle) {
        e.stopPropagation();
        openLanguagePopup();
        return;
      }

      // Popup close button
      const popupClose = e.target.closest('.lang-popup-close');
      if (popupClose) {
        closeLanguagePopup();
        return;
      }

      // Popup option
      const popupOption = e.target.closest('.lang-popup-option');
      if (popupOption) {
        const lang = popupOption.getAttribute('data-lang');
        setLanguage(lang);
        closeLanguagePopup();
        return;
      }

      // Clic sur overlay du popup
      const popupOverlay = e.target.closest('.lang-popup-overlay');
      if (popupOverlay && e.target === popupOverlay) {
        closeLanguagePopup();
        return;
      }

      // Clic ailleurs - fermer dropdown desktop
      document.querySelectorAll('.lang-toggle').forEach(t => {
        t.classList.remove('open');
        t.setAttribute('aria-expanded', 'false');
      });
      document.querySelectorAll('.lang-dropdown').forEach(d => d.classList.remove('open'));
    });

    // Escape pour fermer
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        // Fermer dropdown desktop
        document.querySelectorAll('.lang-toggle').forEach(t => {
          t.classList.remove('open');
          t.setAttribute('aria-expanded', 'false');
        });
        document.querySelectorAll('.lang-dropdown').forEach(d => d.classList.remove('open'));

        // Fermer popup mobile
        closeLanguagePopup();
      }
    });
  }

  /**
   * Initialisation principale
   */
  function init() {
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // 1. Détecter la langue via l'URL (SSG)
    currentLanguage = getLanguageFromPath();

    // 2. Injecter les sélecteurs
    injectLanguageSelectors();

    // 3. Initialiser les événements
    initLanguageSelectorEvents();

    // 4. Mettre à jour l'UI des sélecteurs
    updateLanguageSelectors(currentLanguage);

    // NOTE: On ne lance PAS translatePage() car le HTML est déjà généré en statique (SSG).
    // Les traductions runtime sont désactivées pour éviter les conflits.
  }

  // API publique
  window.i18n = {
    setLanguage: setLanguage,
    getCurrentLanguage: () => currentLanguage,
    translate: (key) => getNestedTranslation(key, currentLanguage),
    getSupportedLanguages: () => ({ ...SUPPORTED_LANGUAGES }),
    openLanguagePopup: openLanguagePopup,
    closeLanguagePopup: closeLanguagePopup
  };

  // Lancer l'initialisation
  init();

})();

