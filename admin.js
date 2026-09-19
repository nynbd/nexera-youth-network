function toast(msg, isErr) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.toggle('err', !!isErr);
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function doLogin() {
  const u = document.getElementById('lu').value.trim();
  const p = document.getElementById('lp').value;
  const err = document.getElementById('lerr');
  const btn = document.getElementById('login-btn');
  err.classList.remove('show');

  if (!u || !p) {
    err.textContent = "Please enter both email and password.";
    err.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.textContent = "Logging in...";
  const { signInWithEmailAndPassword } = window.firebaseAuthFunctions;
  signInWithEmailAndPassword(window.firebaseAuth, u, p)
    .catch((error) => {
      err.textContent = "Incorrect email or password.";
      err.classList.add('show');
      console.error(error.code);
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Login";
    });
}

function doLogout() {
  const { signOut } = window.firebaseAuthFunctions;
  signOut(window.firebaseAuth);
}

function initAuthListener() {
  const { onAuthStateChanged } = window.firebaseAuthFunctions;
  onAuthStateChanged(window.firebaseAuth, (user) => {
    const login = document.getElementById('login-wrap');
    const shell = document.getElementById('shell');
    if (user) {
      login.style.display = 'none';
      shell.style.display = 'block';
      populateForm();
    } else {
      login.style.display = 'flex';
      shell.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await waitForFirebase();
  initAuthListener();
});

async function populateForm() {
  const content = await loadSiteContent();
  if (!content) return; // nothing saved yet — leave placeholders showing

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  };

  setVal('hero-eyebrow', content.hero?.eyebrow);
  setVal('hero-headline', content.hero?.headline);
  setVal('hero-sub', content.hero?.sub);

  (content.stats || []).forEach((s, i) => {
    setVal(`stat${i + 1}-num`, s?.num);
    setVal(`stat${i + 1}-label`, s?.label);
  });

  setVal('about-title', content.about?.title);
  setVal('about-text1', content.about?.text1);
  setVal('about-text2', content.about?.text2);

  (content.programs || []).forEach((p, i) => {
    setVal(`prog${i + 1}-title`, p?.title);
    setVal(`prog${i + 1}-desc`, p?.desc);
    setVal(`prog${i + 1}-img`, p?.image);
    setVal(`prog${i + 1}-badge`, p?.badge);
    setVal(`prog${i + 1}-date`, p?.date);
    setVal(`prog${i + 1}-tag`, p?.tag);
    setVal(`prog${i + 1}-location`, p?.location);
    setVal(`prog${i + 1}-link`, p?.link);
  });

  setVal('join-title', content.joinBanner?.title);
  setVal('join-text', content.joinBanner?.text);

  setVal('contact-email', content.contact?.email);
  setVal('contact-phone', content.contact?.phone);
  setVal('contact-location', content.contact?.location);

  setVal('social-fb', content.social?.facebook);
  setVal('social-ig', content.social?.instagram);
  setVal('social-li', content.social?.linkedin);

  setVal('footer-desc', content.footerDesc);
}

async function saveAll() {
  const val = (id) => document.getElementById(id).value.trim();
  const btn = document.getElementById('save-btn');

  const content = {
    hero: {
      eyebrow: val('hero-eyebrow'),
      headline: val('hero-headline'),
      sub: val('hero-sub')
    },
    stats: [1, 2, 3, 4].map(i => ({ num: val(`stat${i}-num`), label: val(`stat${i}-label`) })),
    about: {
      title: val('about-title'),
      text1: val('about-text1'),
      text2: val('about-text2')
    },
    programs: [1, 2, 3, 4].map(i => ({
      title: val(`prog${i}-title`),
      desc: val(`prog${i}-desc`),
      image: val(`prog${i}-img`),
      badge: val(`prog${i}-badge`),
      date: val(`prog${i}-date`),
      tag: val(`prog${i}-tag`),
      location: val(`prog${i}-location`),
      link: val(`prog${i}-link`)
    })),
    joinBanner: {
      title: val('join-title'),
      text: val('join-text')
    },
    contact: {
      email: val('contact-email'),
      phone: val('contact-phone'),
      location: val('contact-location')
    },
    social: {
      facebook: val('social-fb'),
      instagram: val('social-ig'),
      linkedin: val('social-li')
    },
    footerDesc: val('footer-desc')
  };

  btn.disabled = true;
  btn.textContent = "Saving...";
  const result = await saveSiteContent(content);
  btn.disabled = false;
  btn.textContent = "💾 Save All Changes";

  if (result.success) {
    toast("Saved! Refresh the website to see changes. ✅");
  } else {
    toast(result.error || "Save failed!", true);
  }
}
