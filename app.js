// ==================== FIREBASE IMPORTS ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getDatabase, ref, push, set, onValue, update, remove
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

// ==================== YOUR FIREBASE CONFIG ====================
const firebaseConfig = {
  apiKey: "AIzaSyC5X7HeMocaovpzhV6sNsH96Mfvh0ocGVE",
  authDomain: "smart-complaint-system-3531b.firebaseapp.com",
  databaseURL: "https://smart-complaint-system-3531b-default-rtdb.firebaseio.com",
  projectId: "smart-complaint-system-3531b",
  storageBucket: "smart-complaint-system-3531b.firebasestorage.app",
  messagingSenderId: "526152639726",
  appId: "1:526152639726:web:c780846d3828e396127fff"
};

// ==================== FIREBASE INIT ====================
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const contactsRef = ref(db, "contacts");

// ==================== DOM ====================
const contactForm = document.getElementById("contactForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const addBtn = document.getElementById("addBtn");
const formMessage = document.getElementById("formMessage");
const searchInput = document.getElementById("searchInput");
const contactList = document.getElementById("contactList");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");
const deleteAllBtn = document.getElementById("deleteAllBtn");
const contactCount = document.getElementById("contactCount");
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const editId = document.getElementById("editId");
const editName = document.getElementById("editName");
const editEmail = document.getElementById("editEmail");
const editMessage = document.getElementById("editMessage");

let contacts = [];

function message(el, text, type = "") {
  el.textContent = text;
  el.className = `message ${type}`;
}

function validGmail(email) {
  return /^[^\s@]+@gmail\.com$/i.test(email.trim());
}

function escapeHtml(value) {
  return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function initials(name) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0,2)
    .map(x => x[0].toUpperCase()).join("") || "?";
}

// ==================== REAL-TIME LOAD ====================
onValue(contactsRef, snapshot => {
  const data = snapshot.val() || {};
  contacts = Object.entries(data).map(([id, value]) => ({
    id,
    name: value?.name || "",
    email: value?.email || ""
  }));
  contacts.sort((a,b) => a.name.localeCompare(b.name));
  render();
}, error => {
  console.error("Firebase read error:", error);
  loading.textContent = "Firebase read failed. Check Realtime Database Rules.";
  message(formMessage, "Firebase permission denied. Check Database Rules.", "error");
});

// ==================== RENDER ====================
function render() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)
  );

  loading.classList.add("hidden");
  contactList.innerHTML = "";
  contactCount.textContent = `${contacts.length} ${contacts.length === 1 ? "contact" : "contacts"}`;

  if (!filtered.length) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  filtered.forEach(c => {
    const row = document.createElement("article");
    row.className = "contact-row";
    row.innerHTML = `
      <div class="avatar">${escapeHtml(initials(c.name))}</div>
      <div class="contact-info"><div class="contact-name">${escapeHtml(c.name)}</div><p class="contact-email">${escapeHtml(c.email)}</p></div>
      <div class="row-actions">
        <button class="icon-btn" data-action="edit" data-id="${escapeHtml(c.id)}" title="Edit">✎</button>
        <button class="icon-btn delete" data-action="delete" data-id="${escapeHtml(c.id)}" title="Delete">⌫</button>
      </div>`;
    contactList.appendChild(row);
  });
}

// ==================== ADD CONTACT ====================
contactForm.addEventListener("submit", async e => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();

  if (!name) return message(formMessage, "Please enter a name.", "error");
  if (!validGmail(email)) return message(formMessage, "Email must end with @gmail.com.", "error");

  addBtn.disabled = true;
  addBtn.textContent = "Saving...";

  try {
    const newRef = push(contactsRef);
    await set(newRef, { name, email, createdAt: Date.now() });
    contactForm.reset();
    message(formMessage, "✓ Contact saved to Firebase successfully.", "success");
  } catch (error) {
    console.error("Firebase write error:", error);
    if (error.code === "PERMISSION_DENIED") {
      message(formMessage, "Permission denied — change Realtime Database Rules.", "error");
    } else {
      message(formMessage, `Firebase error: ${error.message}`, "error");
    }
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = "＋ Add Contact";
  }
});

// ==================== SEARCH ====================
searchInput.addEventListener("input", render);

// ==================== EDIT / DELETE ====================
contactList.addEventListener("click", async e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const contact = contacts.find(c => c.id === id);
  if (!contact) return;

  if (btn.dataset.action === "edit") {
    editId.value = id;
    editName.value = contact.name;
    editEmail.value = contact.email;
    message(editMessage, "");
    editModal.classList.remove("hidden");
    editName.focus();
  }

  if (btn.dataset.action === "delete") {
    if (!confirm(`Delete ${contact.name}?`)) return;
    try {
      await remove(ref(db, `contacts/${id}`));
      message(formMessage, "Contact deleted successfully.", "success");
    } catch (error) {
      console.error(error);
      message(formMessage, "Could not delete contact.", "error");
    }
  }
});

// ==================== SAVE EDIT ====================
editForm.addEventListener("submit", async e => {
  e.preventDefault();
  const id = editId.value;
  const name = editName.value.trim();
  const email = editEmail.value.trim().toLowerCase();

  if (!name) return message(editMessage, "Please enter a name.", "error");
  if (!validGmail(email)) return message(editMessage, "Email must end with @gmail.com.", "error");

  try {
    await update(ref(db, `contacts/${id}`), {
      name, email, updatedAt: Date.now()
    });
    closeEdit();
    message(formMessage, "Contact updated successfully.", "success");
  } catch (error) {
    console.error(error);
    message(editMessage, "Could not update contact.", "error");
  }
});

// ==================== DELETE ALL ====================
deleteAllBtn.addEventListener("click", async () => {
  if (!contacts.length) return message(formMessage, "There are no contacts to delete.", "error");
  if (!confirm(`Delete all ${contacts.length} contacts?`)) return;

  deleteAllBtn.disabled = true;
  deleteAllBtn.textContent = "Deleting...";
  try {
    await remove(contactsRef);
    message(formMessage, "All contacts deleted successfully.", "success");
  } catch (error) {
    console.error(error);
    message(formMessage, "Could not delete all contacts.", "error");
  } finally {
    deleteAllBtn.disabled = false;
    deleteAllBtn.textContent = "Delete All";
  }
});

// ==================== MODAL ====================
function closeEdit() {
  editModal.classList.add("hidden");
  editForm.reset();
  message(editMessage, "");
}
document.getElementById("closeModal").addEventListener("click", closeEdit);
document.getElementById("cancelEdit").addEventListener("click", closeEdit);
editModal.addEventListener("click", e => { if (e.target === editModal) closeEdit(); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !editModal.classList.contains("hidden")) closeEdit();
});
