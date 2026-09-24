// Le Nord Financier — interactions (sélecteurs par classe, rien n'est injecté dans le contenu)

var mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Menu mobile
document.querySelectorAll('.nav__burger').forEach(function (bouton) {
  bouton.addEventListener('click', function () {
    var nav = bouton.closest('.nav');
    var ouvert = nav.classList.toggle('ouvert');
    bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
  });
});

// En-tête : toujours fixe ; il devient bleu nuit opaque dès qu'on quitte le haut de page
document.querySelectorAll('.entete').forEach(function (entete) {
  var defile = null;
  function verifier() {
    var etat = window.scrollY > 40;
    if (etat === defile) return;
    defile = etat;
    entete.classList.toggle('entete--defile', etat);
  }
  window.addEventListener('scroll', verifier, { passive: true });
  verifier();
});

// FAQ : une seule question ouverte à la fois
document.querySelectorAll('.faq__liste').forEach(function (liste) {
  liste.querySelectorAll('.question').forEach(function (q) {
    q.addEventListener('toggle', function () {
      if (!q.open) return;
      liste.querySelectorAll('.question').forEach(function (autre) {
        if (autre !== q) autre.open = false;
      });
    });
  });
});

// Titre du héros : chaque mot apparaît à son tour (le texte reste lisible sans script).
// Construit avec textContent et createElement : un titre saisi dans l'éditeur ne peut pas injecter de code.
document.querySelectorAll('.hero__titre').forEach(function (titre) {
  if (mouvementReduit || titre.children.length) return;   // titre enrichi : on le laisse tel quel
  var texte = titre.textContent.trim();
  titre.setAttribute('aria-label', texte);
  titre.textContent = '';
  texte.split(/\s+/).forEach(function (mot, i) {
    if (i) titre.appendChild(document.createTextNode(' '));
    var span = document.createElement('span');
    span.className = 'mot';
    span.setAttribute('aria-hidden', 'true');
    span.style.setProperty('--m', i);
    span.textContent = mot;
    titre.appendChild(span);
  });
});

// Formulaire de contact (maquette) : validation du navigateur, piège à robots, message honnête.
// En production, l'envoi est pris en charge par Contact Form 7 côté serveur.
document.querySelectorAll('.formulaire').forEach(function (form) {
  var anglais = document.documentElement.lang === 'en';
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var statut = form.querySelector('.formulaire__statut');
    var piege = form.querySelector('[name="site_web"]');
    if (piege && piege.value) return;                      // robot : on ignore sans rien dire
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (statut) statut.textContent = anglais
      ? 'Thank you! (Preview: sending will be enabled when the site goes live.)'
      : 'Merci ! (Maquette : l’envoi sera activé à la mise en ligne.)';
    form.reset();
  });
});

// Apparition progressive au défilement
(function () {
  // [sélecteur, variante, décalage de départ en ms]
  var cibles = [
    ['.hero__texte', '', 520],
    ['.hero__actions', '', 640],
    ['.hero__photo', '', 300],
    ['.hero__carte', 'surgir', 1100],
    ['.hero__badge', 'surgir', 1300],
    ['.hero__signature', '', 900],
    ['.etiquette', '', 0],
    ['.titre-section, .apropos__nom, .publics h2, .appel h2', '', 80],
    ['.chapo, .apropos__texte > p, .appel p, .mission__colonnes', '', 160],
    ['.apropos__texte > .bouton, .pourquoi .bouton, .appel .bouton', '', 240],
    ['.apropos__photo, .pourquoi__photo, .parcours__photo, .mission__image', 'image', 0],
    ['.mission__enonce', '', 80],
    ['.mission__encart, .formulaire, .faq__aide', 'surgir', 0],
    ['.faq__groupe > h2', '', 0],
    ['.defile', '', 150],
    ['.appel__bloc', 'surgir', 0],
    ['.pied__haut > div:first-child, .pied__bas', '', 0]
  ];
  // Grilles : les enfants arrivent l'un après l'autre
  var grilles = ['.apropos__infos', '.services__grille', '.pourquoi__cartes', '.temoignages__grille', '.faq__liste', '.pied__colonnes',
                 '.offres__grille', '.etapes__liste', '.jalons', '.valeurs__grille', '.faq__themes', '.coordonnees'];

  var elements = [];
  function marquer(el, variante, delai, rang) {
    el.classList.add('apparait');
    if (variante) el.classList.add('apparait--' + variante);
    if (delai) el.style.setProperty('--d', delai + 'ms');
    if (rang) el.style.setProperty('--i', rang);
    elements.push(el);
  }
  cibles.forEach(function (c) {
    document.querySelectorAll(c[0]).forEach(function (el) { marquer(el, c[1], c[2], 0); });
  });
  grilles.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (grille) {
      Array.prototype.forEach.call(grille.children, function (enfant, i) { marquer(enfant, '', 0, i % 4); });
    });
  });

  if (mouvementReduit || !('IntersectionObserver' in window)) {
    elements.forEach(function (el) { el.classList.add('visible'); });
    return;
  }
  // Ce qui est déjà à l'écran au chargement s'anime tout de suite
  var hauteur = window.innerHeight;
  var restants = elements.filter(function (el) {
    var r = el.getBoundingClientRect();
    if (r.top < hauteur && r.bottom > 0) { el.classList.add('visible'); return false; }
    return true;
  });
  var obs = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      obs.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
  restants.forEach(function (el) { obs.observe(el); });
})();

// Chiffres qui s'animent quand ils deviennent visibles
(function () {
  var compteurs = document.querySelectorAll('.compteur');
  if (mouvementReduit || !('IntersectionObserver' in window)) return;
  var obs = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      var el = e.target, cible = parseInt(el.textContent, 10), debut = null, duree = 1400;
      if (isNaN(cible)) return;
      function pas(t) {
        if (debut === null) debut = t;
        var p = Math.min((t - debut) / duree, 1);
        el.textContent = Math.round(cible * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(pas);
      }
      el.textContent = '0';
      requestAnimationFrame(pas);
    });
  }, { threshold: 0.6 });
  compteurs.forEach(function (c) { obs.observe(c); });
})();
