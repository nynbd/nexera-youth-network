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
