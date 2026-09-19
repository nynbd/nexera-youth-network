function toast(msg, isErr) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.toggle('err', !!isErr);
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/*===== AUTH =====*/
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
    const login = document.getElementById('adm-login');
    const shell = document.getElementById('adm-shell');
    if (user) {
      login.style.display = 'none';
      shell.style.display = 'flex';
      populateForm();
      renderProgramsTable();
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

/*===== SIDEBAR =====*/
function openSidebar() {
  document.getElementById('adm-sb').classList.add('open');
  document.getElementById('sb-ov').classList.add('open');
}
function closeSidebar() {
  document.getElementById('adm-sb').classList.remove('open');
  document.getElementById('sb-ov').classList.remove('open');
}

/*===== NAVIGATION =====*/
function goSec(btn) {
  const secId = btn.getAttribute('data-sec');

  document.querySelectorAll('.adm-sec').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById(secId);
  if (sec) sec.classList.add('active');

  document.querySelectorAll('.adm-nb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const titles = {
    'dash': 'Dashboard',
    'home-ed': 'Home Page Editor',
    'prog-adm': 'Manage Programs',
    'site-adm': 'Site Info'
  };
  document.getElementById('adm-ptitle').textContent = titles[secId] || secId;

  const actions = document.getElementById('adm-topbar-actions');
  actions.innerHTML = '';
  if (secId === 'home-ed') {
    actions.innerHTML = `<button class="save-btn" onclick="saveHomeContent()">💾 Save Changes</button>`;
  } else if (secId === 'prog-adm') {
    actions.innerHTML = `<button class="add-btn" onclick="openProgramForm()">+ Add Program</button>`;
  } else if (secId === 'site-adm') {
    actions.innerHTML = `<button class="save-btn" onclick="saveSiteInfo()">💾 Save Changes</button>`;
  }

  closeSidebar();
}

/*===== HOME PAGE CONTENT (hero, stats, about, join banner) =====*/
async function populateForm() {
  const content = await loadSiteContent();
  if (content) {
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
}

async function saveHomeContent() {
  const val = (id) => document.getElementById(id).value.trim();
  const btn = document.querySelector('#adm-topbar-actions .save-btn');

  const partial = {
    hero: { eyebrow: val('hero-eyebrow'), headline: val('hero-headline'), sub: val('hero-sub') },
    stats: [1, 2, 3, 4].map(i => ({ num: val(`stat${i}-num`), label: val(`stat${i}-label`) })),
    about: { title: val('about-title'), text1: val('about-text1'), text2: val('about-text2') },
    joinBanner: { title: val('join-title'), text: val('join-text') }
  };

  if (btn) { btn.disabled = true; btn.textContent = "Saving..."; }
  const result = await saveSiteContent(partial);
  if (btn) { btn.disabled = false; btn.textContent = "💾 Save Changes"; }

  toast(result.success ? "Saved! Refresh the website to see changes. ✅" : (result.error || "Save failed!"), !result.success);
}

async function saveSiteInfo() {
  const val = (id) => document.getElementById(id).value.trim();
  const btn = document.querySelector('#adm-topbar-actions .save-btn');

  const partial = {
    contact: { email: val('contact-email'), phone: val('contact-phone'), location: val('contact-location') },
    social: { facebook: val('social-fb'), instagram: val('social-ig'), linkedin: val('social-li') },
    footerDesc: val('footer-desc')
  };

  if (btn) { btn.disabled = true; btn.textContent = "Saving..."; }
  const result = await saveSiteContent(partial);
  if (btn) { btn.disabled = false; btn.textContent = "💾 Save Changes"; }

  toast(result.success ? "Saved! Refresh the website to see changes. ✅" : (result.error || "Save failed!"), !result.success);
}

/*===== PROGRAMS (list — add/edit/delete) =====*/
let cachedPrograms = [];

async function renderProgramsTable() {
  const body = document.getElementById('ptbl-body');
  body.innerHTML = `<tr class="empty-row"><td colspan="5">Loading...</td></tr>`;
  cachedPrograms = await loadPrograms();

  updateDashboardStats();

  if (!cachedPrograms.length) {
    body.innerHTML = `<tr class="empty-row"><td colspan="5">No programs yet. Click "+ Add Program" to create one.</td></tr>`;
    return;
  }

  body.innerHTML = cachedPrograms.map(p => `
    <tr>
      <td>${p.image ? `<img class="thumb" src="${p.image}">` : `<div class="thumb-ph">📋</div>`}</td>
      <td><strong>${p.title}</strong></td>
      <td>${p.category || '—'}</td>
      <td><span class="bs ${p.status || 'active'}">${p.status || 'active'}</span></td>
      <td class="tbl-acts">
        <button class="e-btn" onclick="editProgram('${p.id}')">Edit</button>
        <button class="d-btn" onclick="deleteProgramAction('${p.id}')">Delete</button>
      </td>
    </tr>`).join('');
}

function updateDashboardStats() {
  const total = cachedPrograms.length;
  const active = cachedPrograms.filter(p => p.status === 'active').length;
  const upcoming = cachedPrograms.filter(p => p.status === 'upcoming').length;
  const draft = cachedPrograms.filter(p => p.status === 'draft').length;
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('db-prog-total', total);
  setText('db-prog-active', active);
  setText('db-prog-upcoming', upcoming);
  setText('db-prog-draft', draft);
}

function openProgramForm() {
  document.getElementById('pmodal-title').textContent = "Add Program";
  document.getElementById('p-id').value = '';
  document.getElementById('p-title').value = '';
  document.getElementById('p-category').value = 'Leadership';
  document.getElementById('p-status').value = 'active';
  document.getElementById('p-short').value = '';
  document.getElementById('p-full').value = '';
  document.getElementById('p-image').value = '';
  document.getElementById('p-image-url').value = '';
  document.getElementById('p-image-prev').innerHTML = '';
  document.getElementById('pmodal').classList.add('open');
}

function editProgram(id) {
  const p = cachedPrograms.find(x => x.id === id);
  if (!p) return;
  document.getElementById('pmodal-title').textContent = "Edit Program";
  document.getElementById('p-id').value = p.id;
  document.getElementById('p-title').value = p.title || '';
  document.getElementById('p-category').value = p.category || 'Leadership';
  document.getElementById('p-status').value = p.status || 'active';
  document.getElementById('p-short').value = p.short || '';
  document.getElementById('p-full').value = p.full || '';
  document.getElementById('p-image').value = p.image || '';
  document.getElementById('p-image-url').value = p.image || '';
  document.getElementById('p-image-prev').innerHTML = p.image ? `<img src="${p.image}">` : '';
  document.getElementById('pmodal').classList.add('open');
}

function closeProgramForm() {
  document.getElementById('pmodal').classList.remove('open');
}

async function prevProgramImage(input) {
  if (!input.files?.[0]) return;
  const prev = document.getElementById('p-image-prev');
  prev.innerHTML = `<div style="color:var(--muted);font-size:.82rem;">⏳ Uploading...</div>`;
  const result = await uploadToImgBB(input.files[0]);
  if (result.success) {
    document.getElementById('p-image').value = result.url;
    document.getElementById('p-image-url').value = result.url;
    prev.innerHTML = `<img src="${result.url}">`;
  } else {
    prev.innerHTML = `<div style="color:#c0392b;font-size:.82rem;">❌ Upload failed</div>`;
  }
}

async function saveProgram() {
  const id = document.getElementById('p-id').value;
  const title = document.getElementById('p-title').value.trim();
  const short = document.getElementById('p-short').value.trim();
  if (!title) return toast("Program title is required!", true);
  if (!short) return toast("Short description is required!", true);

  const program = {
    title,
    category: document.getElementById('p-category').value,
    status: document.getElementById('p-status').value,
    short,
    full: document.getElementById('p-full').value.trim(),
    image: document.getElementById('p-image').value.trim()
  };

  const result = id ? await updateProgram(id, program) : await addProgram(program);
  if (result.success) {
    toast(id ? "Program updated!" : "Program added!");
    closeProgramForm();
    renderProgramsTable();
  } else {
    toast(result.error || "Save failed!", true);
  }
}

async function deleteProgramAction(id) {
  if (!confirm("Delete this program?")) return;
  if (await deleteProgram(id)) {
    toast("Program deleted.");
    renderProgramsTable();
  } else {
    toast("Delete failed!", true);
  }
}
