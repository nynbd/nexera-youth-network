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

  if (!window.firebaseAuthFunctions || !window.firebaseAuth) {
    err.textContent = "Still connecting — please wait a second and try again.";
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
      renderTeamTable();
      renderParticipantsTable();
      loadFormFieldsIntoBuilder();
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
    'team-adm': 'Manage Team',
    'network-adm': 'Our Network',
    'part-adm': 'Participants',
    'site-adm': 'Site Info'
  };
  document.getElementById('adm-ptitle').textContent = titles[secId] || secId;

  const actions = document.getElementById('adm-topbar-actions');
  actions.innerHTML = '';
  if (secId === 'home-ed') {
    actions.innerHTML = `<button class="save-btn" onclick="saveHomeContent()">💾 Save Changes</button>`;
  } else if (secId === 'prog-adm') {
    actions.innerHTML = `<button class="add-btn" onclick="openProgramForm()">+ Add Program</button>`;
  } else if (secId === 'team-adm') {
    actions.innerHTML = `<button class="add-btn" onclick="openTeamForm()">+ Add Member</button>`;
  } else if (secId === 'network-adm') {
    actions.innerHTML = `<button class="add-btn" onclick="openNetworkForm()">+ Add Page</button>`;
  } else if (secId === 'part-adm') {
    actions.innerHTML = `<button class="save-btn" onclick="renderParticipantsTable()">🔄 Refresh</button>`;
  } else if (secId === 'site-adm') {
    actions.innerHTML = `<button class="save-btn" onclick="saveSiteInfo()">💾 Save Changes</button>`;
  }

  // Re-fetch fresh data every time these tabs are opened, instead of only
  // once at login — otherwise a submission made after login never shows
  // up until the admin manually reloads the whole page.
  if (secId === 'prog-adm') renderProgramsTable();
  if (secId === 'team-adm') renderTeamTable();
  if (secId === 'network-adm') renderNetworkTable();
  if (secId === 'part-adm') { renderParticipantsTable(); loadFormFieldsIntoBuilder(); }

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
let cachedParticipants = [];

async function renderProgramsTable() {
  const body = document.getElementById('ptbl-body');
  body.innerHTML = `<tr class="empty-row"><td colspan="5">Loading...</td></tr>`;
  cachedPrograms = await loadPrograms();
  renderProgramsTableFromCache();
}

function renderProgramsTableFromCache() {
  const body = document.getElementById('ptbl-body');
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
  const newParts = cachedParticipants.filter(p => p.status === 'new').length;
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('db-prog-total', total);
  setText('db-prog-active', active);
  setText('db-prog-upcoming', upcoming);
  setText('db-prog-draft', draft);
  setText('db-part-new', newParts);
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

// Resize/compress an image client-side before upload — keeps uploads fast on slow connections.
function compressImage(file, maxDim = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality);
    };
    img.onerror = () => resolve(file);
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

async function prevProgramImage(input) {
  if (!input.files?.[0]) return;
  const prev = document.getElementById('p-image-prev');
  prev.innerHTML = `<div style="color:var(--muted);font-size:.82rem;">⏳ Uploading...</div>`;
  const compressed = await compressImage(input.files[0]);
  const result = await uploadToImgBB(compressed);
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

  const saveBtn = document.querySelector('.fs-btn');
  const prevLabel = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  const result = id ? await updateProgram(id, program) : await addProgram(program);

  saveBtn.disabled = false;
  saveBtn.textContent = prevLabel;

  if (result.success) {
    toast(id ? "Program updated!" : "Program added!");
    closeProgramForm();
    if (id) {
      const idx = cachedPrograms.findIndex(p => p.id === id);
      if (idx !== -1) cachedPrograms[idx] = { ...cachedPrograms[idx], ...program };
    } else {
      cachedPrograms.unshift({ id: result.id, ...program, createdAt: Date.now() });
    }
    renderProgramsTableFromCache();
  } else {
    toast(result.error || "Save failed!", true);
  }
}

async function deleteProgramAction(id) {
  if (!confirm("Delete this program?")) return;
  if (await deleteProgram(id)) {
    toast("Program deleted.");
    cachedPrograms = cachedPrograms.filter(p => p.id !== id);
    renderProgramsTableFromCache();
  } else {
    toast("Delete failed!", true);
  }
}

/*===== PARTICIPANTS ("Join This Program" submissions) =====*/
let joinFormFields = [];
let ffFieldCount = 0;

async function loadFormFieldsIntoBuilder() {
  const content = await loadSiteContent();
  joinFormFields = (content && content.joinFormFields) || [
    { id: 'phone', label: 'Phone', type: 'tel', required: false },
    { id: 'message', label: 'Message', type: 'textarea', required: false }
  ];
  renderFormFieldsBuilder();
}

function renderFormFieldsBuilder() {
  const list = document.getElementById('form-fields-list');
  if (!list) return;
  if (!joinFormFields.length) {
    list.innerHTML = `<p style="color:var(--muted);font-size:.85rem;padding:6px 0;">No extra fields — the form will only ask for Name and Email. Click "+ Add Field" to add more.</p>`;
    return;
  }
  list.innerHTML = joinFormFields.map((f, i) => `
    <div class="ff-row" data-idx="${i}">
      <input type="text" class="ff-label" value="${f.label}" placeholder="Field label, e.g. Phone">
      <select class="ff-type">
        <option value="text" ${f.type === 'text' ? 'selected' : ''}>Short text</option>
        <option value="tel" ${f.type === 'tel' ? 'selected' : ''}>Phone</option>
        <option value="email" ${f.type === 'email' ? 'selected' : ''}>Email</option>
        <option value="number" ${f.type === 'number' ? 'selected' : ''}>Number</option>
        <option value="textarea" ${f.type === 'textarea' ? 'selected' : ''}>Long text</option>
      </select>
      <label class="req"><input type="checkbox" class="ff-required" ${f.required ? 'checked' : ''}> Required</label>
      <button class="ff-del" onclick="removeFormFieldRow(${i})">🗑</button>
    </div>`).join('');
}

function addFormFieldRow() {
  ffFieldCount++;
  joinFormFields.push({ id: 'f' + Date.now() + ffFieldCount, label: '', type: 'text', required: false });
  renderFormFieldsBuilder();
}

function removeFormFieldRow(i) {
  joinFormFields.splice(i, 1);
  renderFormFieldsBuilder();
}

async function saveFormFields() {
  // Read whatever is currently in the DOM rows back into joinFormFields
  // (preserving each field's id) before saving.
  const rows = document.querySelectorAll('#form-fields-list .ff-row');
  const updated = [];
  rows.forEach(row => {
    const idx = Number(row.dataset.idx);
    const original = joinFormFields[idx] || {};
    const label = row.querySelector('.ff-label').value.trim();
    if (!label) return; // skip empty rows
    updated.push({
      id: original.id || ('f' + Date.now() + idx),
      label,
      type: row.querySelector('.ff-type').value,
      required: row.querySelector('.ff-required').checked
    });
  });
  joinFormFields = updated;

  const result = await saveSiteContent({ joinFormFields });
  if (result.success) {
    toast("Form fields saved! ✅");
    renderFormFieldsBuilder();
  } else {
    toast(result.error || "Save failed!", true);
  }
}

async function renderParticipantsTable() {
  const body = document.getElementById('partbl-body');
  if (!body) return;
  body.innerHTML = `<tr class="empty-row"><td colspan="6">Loading...</td></tr>`;
  cachedParticipants = await loadParticipants();
  updateDashboardStats();

  if (!cachedParticipants.length) {
    body.innerHTML = `<tr class="empty-row"><td colspan="6">No one has joined a program yet.</td></tr>`;
    return;
  }

  body.innerHTML = cachedParticipants.map(p => {
    const dateStr = p.submittedAt ? new Date(p.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const phoneVal = p.phone || (p.fields && Object.entries(p.fields).find(([k]) => /phone/i.test(k))?.[1]);
    return `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td>${p.programTitle || '—'}</td>
      <td style="font-size:.8rem;color:var(--muted);">${p.email}${phoneVal ? '<br>' + phoneVal : ''}</td>
      <td><span class="bs ${p.status || 'new'}">${p.status || 'new'}</span></td>
      <td style="font-size:.8rem;color:var(--muted);white-space:nowrap;">${dateStr}</td>
      <td class="tbl-acts">
        <button class="e-btn" onclick="openPartForm('${p.id}')">View</button>
        <button class="d-btn" onclick="deletePartAction('${p.id}')">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

function openPartForm(id) {
  const p = cachedParticipants.find(x => x.id === id);
  if (!p) return;
  document.getElementById('part-id').value = p.id;
  document.getElementById('part-name').value = p.name || '';
  document.getElementById('part-email').value = p.email || '';
  document.getElementById('part-program').value = p.programTitle || '';
  document.getElementById('part-status').value = p.status || 'new';

  // Dynamic extra answers (new submissions use p.fields; older ones may
  // still have separate phone/message properties — show both gracefully).
  const extra = document.getElementById('part-extra-fields');
  const entries = [];
  if (p.fields && typeof p.fields === 'object') {
    Object.entries(p.fields).forEach(([label, val]) => { if (val) entries.push([label, val]); });
  }
  if (!p.fields) {
    if (p.phone) entries.push(['Phone', p.phone]);
    if (p.message) entries.push(['Message', p.message]);
  }
  extra.innerHTML = entries.length
    ? entries.map(([label, val]) => `<div class="fg"><label>${label}</label><textarea class="fi" disabled>${val}</textarea></div>`).join('')
    : `<p style="color:var(--muted);font-size:.85rem;">No additional answers.</p>`;

  document.getElementById('partmodal').classList.add('open');
}

function closePartForm() {
  document.getElementById('partmodal').classList.remove('open');
}

async function savePartStatus() {
  const id = document.getElementById('part-id').value;
  const status = document.getElementById('part-status').value;
  const result = await updateParticipant(id, { status });
  if (result.success) {
    toast("Status updated!");
    closePartForm();
    renderParticipantsTable();
  } else {
    toast(result.error || "Update failed!", true);
  }
}

async function deletePartAction(id) {
  if (!confirm("Delete this participant entry?")) return;
  if (await deleteParticipant(id)) {
    toast("Deleted.");
    renderParticipantsTable();
  } else {
    toast("Delete failed!", true);
  }
}

/*===== TEAM MEMBERS =====*/
let cachedTeam = [];

async function renderTeamTable() {
  const body = document.getElementById('ttbl-body');
  if (!body) return;
  body.innerHTML = `<tr class="empty-row"><td colspan="5">Loading...</td></tr>`;
  cachedTeam = await loadTeam();

  if (!cachedTeam.length) {
    body.innerHTML = `<tr class="empty-row"><td colspan="5">No team members yet. Click "+ Add Member" to create one.</td></tr>`;
    return;
  }

  body.innerHTML = cachedTeam.map(t => `
    <tr>
      <td>${t.photo ? `<img class="thumb" src="${t.photo}">` : `<div class="thumb-ph">👤</div>`}</td>
      <td><strong>${t.name}</strong></td>
      <td>${t.role || '—'}</td>
      <td><span class="bs ${t.status || 'active'}">${t.status || 'active'}</span></td>
      <td class="tbl-acts">
        <button class="e-btn" onclick="editTeamMember('${t.id}')">Edit</button>
        <button class="d-btn" onclick="deleteTeamAction('${t.id}')">Delete</button>
      </td>
    </tr>`).join('');
}

function openTeamForm() {
  document.getElementById('tmodal-title').textContent = "Add Team Member";
  document.getElementById('t-id').value = '';
  document.getElementById('t-name').value = '';
  document.getElementById('t-role').value = '';
  document.getElementById('t-bio').value = '';
  document.getElementById('t-status').value = 'active';
  document.getElementById('t-photo').value = '';
  document.getElementById('t-photo-url').value = '';
  document.getElementById('t-photo-prev').innerHTML = '';
  document.getElementById('tmodal').classList.add('open');
}

function editTeamMember(id) {
  const t = cachedTeam.find(x => x.id === id);
  if (!t) return;
  document.getElementById('tmodal-title').textContent = "Edit Team Member";
  document.getElementById('t-id').value = t.id;
  document.getElementById('t-name').value = t.name || '';
  document.getElementById('t-role').value = t.role || '';
  document.getElementById('t-bio').value = t.bio || '';
  document.getElementById('t-status').value = t.status || 'active';
  document.getElementById('t-photo').value = t.photo || '';
  document.getElementById('t-photo-url').value = t.photo || '';
  document.getElementById('t-photo-prev').innerHTML = t.photo ? `<img src="${t.photo}">` : '';
  document.getElementById('tmodal').classList.add('open');
}

function closeTeamForm() {
  document.getElementById('tmodal').classList.remove('open');
}

async function prevTeamPhoto(input) {
  if (!input.files?.[0]) return;
  const prev = document.getElementById('t-photo-prev');
  prev.innerHTML = `<div style="color:var(--muted);font-size:.82rem;">⏳ Uploading...</div>`;
  const result = await uploadToImgBB(input.files[0]);
  if (result.success) {
    document.getElementById('t-photo').value = result.url;
    document.getElementById('t-photo-url').value = result.url;
    prev.innerHTML = `<img src="${result.url}">`;
  } else {
    prev.innerHTML = `<div style="color:#c0392b;font-size:.82rem;">❌ Upload failed</div>`;
  }
}

async function saveTeamMember() {
  const id = document.getElementById('t-id').value;
  const name = document.getElementById('t-name').value.trim();
  const role = document.getElementById('t-role').value.trim();
  if (!name) return toast("Name is required!", true);
  if (!role) return toast("Role / Position is required!", true);

  const member = {
    name,
    role,
    bio: document.getElementById('t-bio').value.trim(),
    status: document.getElementById('t-status').value,
    photo: document.getElementById('t-photo').value.trim()
  };

  const result = id ? await updateTeamMember(id, member) : await addTeamMember(member);
  if (result.success) {
    toast(id ? "Team member updated!" : "Team member added!");
    closeTeamForm();
    renderTeamTable();
  } else {
    toast(result.error || "Save failed!", true);
  }
}

async function deleteTeamAction(id) {
  if (!confirm("Remove this team member?")) return;
  if (await deleteTeamMember(id)) {
    toast("Removed.");
    renderTeamTable();
  } else {
    toast("Delete failed!", true);
  }
}

/*===== OUR NETWORK (affiliated pages) =====*/
let cachedNetwork = [];

async function renderNetworkTable() {
  const body = document.getElementById('nptbl-body');
  body.innerHTML = `<tr class="empty-row"><td colspan="5">Loading...</td></tr>`;
  cachedNetwork = await loadNetworkPages();

  if (!cachedNetwork.length) {
    body.innerHTML = `<tr class="empty-row"><td colspan="5">No network pages yet. Click "+ Add Page" to create one.</td></tr>`;
    return;
  }

  body.innerHTML = cachedNetwork.map(p => `
    <tr>
      <td><strong style="color:var(--navy)">${p.order || '—'}</strong></td>
      <td>${p.logo ? `<img class="thumb" src="${p.logo}">` : `<div class="thumb-ph">🌐</div>`}</td>
      <td><strong>${p.name}</strong></td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><a href="${p.url}" target="_blank" rel="noopener">${p.url}</a></td>
      <td class="tbl-acts">
        <button class="e-btn" onclick="editNetworkPage('${p.id}')">Edit</button>
        <button class="d-btn" onclick="deleteNetworkAction('${p.id}')">Delete</button>
      </td>
    </tr>`).join('');
}

function openNetworkForm() {
  document.getElementById('npmodal-title').textContent = "Add Network Page";
  document.getElementById('np-id').value = '';
  document.getElementById('np-name').value = '';
  document.getElementById('np-url').value = '';
  document.getElementById('np-desc').value = '';
  document.getElementById('np-order').value = '';
  document.getElementById('np-logo').value = '';
  document.getElementById('np-logo-url').value = '';
  document.getElementById('np-logo-prev').innerHTML = '';
  document.getElementById('npmodal').classList.add('open');
}

function editNetworkPage(id) {
  const p = cachedNetwork.find(x => x.id === id);
  if (!p) return;
  document.getElementById('npmodal-title').textContent = "Edit Network Page";
  document.getElementById('np-id').value = p.id;
  document.getElementById('np-name').value = p.name || '';
  document.getElementById('np-url').value = p.url || '';
  document.getElementById('np-desc').value = p.description || '';
  document.getElementById('np-order').value = p.order || '';
  document.getElementById('np-logo').value = p.logo || '';
  document.getElementById('np-logo-url').value = p.logo || '';
  document.getElementById('np-logo-prev').innerHTML = p.logo ? `<img src="${p.logo}">` : '';
  document.getElementById('npmodal').classList.add('open');
}

function closeNetworkForm() {
  document.getElementById('npmodal').classList.remove('open');
}

async function prevNetworkLogo(input) {
  if (!input.files?.[0]) return;
  const prev = document.getElementById('np-logo-prev');
  prev.innerHTML = `<div style="color:var(--muted);font-size:.82rem;">⏳ Uploading...</div>`;
  const result = await uploadToImgBB(input.files[0]);
  if (result.success) {
    document.getElementById('np-logo').value = result.url;
    document.getElementById('np-logo-url').value = result.url;
    prev.innerHTML = `<img src="${result.url}">`;
  } else {
    prev.innerHTML = `<div style="color:#c0392b;font-size:.82rem;">❌ Upload failed</div>`;
  }
}

async function saveNetworkPage() {
  const id = document.getElementById('np-id').value;
  const name = document.getElementById('np-name').value.trim();
  let url = document.getElementById('np-url').value.trim();
  if (!name) return toast("Page name is required!", true);
  if (!url) return toast("Website/Facebook URL is required!", true);
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  const page = {
    name,
    url,
    description: document.getElementById('np-desc').value.trim(),
    order: parseInt(document.getElementById('np-order').value) || 999,
    logo: document.getElementById('np-logo').value.trim()
  };

  const result = id ? await updateNetworkPage(id, page) : await addNetworkPage(page);
  if (result.success) {
    toast(id ? "Network page updated!" : "Network page added!");
    closeNetworkForm();
    renderNetworkTable();
  } else {
    toast(result.error || "Save failed!", true);
  }
}

async function deleteNetworkAction(id) {
  if (!confirm("Remove this network page?")) return;
  if (await deleteNetworkPage(id)) {
    toast("Removed.");
    renderNetworkTable();
  } else {
    toast("Delete failed!", true);
  }
}
