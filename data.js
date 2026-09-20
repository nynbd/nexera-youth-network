// All editable site text lives in one Firestore document: content/site.
// The public page renders its own hardcoded defaults first (so it never
// looks broken/empty), then overwrites with whatever is saved here, if
// anything. The admin panel reads/writes this same document.

function waitForFirebase() {
  return new Promise((resolve) => {
    const check = setInterval(() => {
      if (window.firebaseDB && window.firebaseFunctions) {
        clearInterval(check);
        resolve();
      }
    }, 80);
  });
}

async function loadSiteContent() {
  await waitForFirebase();
  const { doc, getDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    const snap = await getDoc(doc(db, "content", "site"));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("Load site content error:", err);
    return null;
  }
}

async function saveSiteContent(content) {
  await waitForFirebase();
  const { doc, setDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await setDoc(doc(db, "content", "site"), content, { merge: true });
    return { success: true };
  } catch (err) {
    console.error("Save site content error:", err);
    return { success: false, error: err.message };
  }
}

/*===== PROGRAMS (full list — unlimited, add/edit/delete) =====*/
async function loadPrograms() {
  await waitForFirebase();
  const { collection, getDocs, query, orderBy } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    const snap = await getDocs(query(collection(db, "programs"), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Load programs error:", err);
    return [];
  }
}

async function addProgram(program) {
  await waitForFirebase();
  const { collection, addDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    program.createdAt = Date.now();
    const ref = await addDoc(collection(db, "programs"), program);
    return { success: true, id: ref.id };
  } catch (err) {
    console.error("Add program error:", err);
    return { success: false, error: err.message };
  }
}

async function updateProgram(id, program) {
  await waitForFirebase();
  const { doc, updateDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await updateDoc(doc(db, "programs", id), program);
    return { success: true };
  } catch (err) {
    console.error("Update program error:", err);
    return { success: false, error: err.message };
  }
}

async function deleteProgram(id) {
  await waitForFirebase();
  const { doc, deleteDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await deleteDoc(doc(db, "programs", id));
    return true;
  } catch (err) {
    console.error("Delete program error:", err);
    return false;
  }
}

// Free-tier ImgBB upload — used for program cover images in the admin panel.
async function uploadToImgBB(file) {
  const key = "b374ae6a3edcf12a90a5b7be9ec39f50";
  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const form = new FormData();
    form.append("image", base64);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, { method: "POST", body: form });
    const data = await res.json();
    if (data.success) return { success: true, url: data.data.url };
    return { success: false, error: "Upload failed" };
  } catch (err) {
    console.error("ImgBB upload error:", err);
    return { success: false, error: err.message };
  }
}

/*===== PARTICIPANTS ("Join This Program" submissions) =====*/
async function loadParticipants() {
  await waitForFirebase();
  const { collection, getDocs, query, orderBy } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    const snap = await getDocs(query(collection(db, "participants"), orderBy("submittedAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Load participants error:", err);
    return [];
  }
}

async function addParticipant(entry) {
  await waitForFirebase();
  const { collection, addDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    entry.submittedAt = Date.now();
    entry.status = entry.status || 'new';
    const ref = await addDoc(collection(db, "participants"), entry);
    return { success: true, id: ref.id };
  } catch (err) {
    console.error("Add participant error:", err);
    return { success: false, error: err.message };
  }
}

async function updateParticipant(id, changes) {
  await waitForFirebase();
  const { doc, updateDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await updateDoc(doc(db, "participants", id), changes);
    return { success: true };
  } catch (err) {
    console.error("Update participant error:", err);
    return { success: false, error: err.message };
  }
}

async function deleteParticipant(id) {
  await waitForFirebase();
  const { doc, deleteDoc } = window.firebaseFunctions;
  const db = window.firebaseDB;
  try {
    await deleteDoc(doc(db, "participants", id));
    return true;
  } catch (err) {
    console.error("Delete participant error:", err);
    return false;
  }
}
