import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import fallbackTracks from '../list.json';
import './styles.css';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
const appState = {
  tracks: normalizeTracks(fallbackTracks),
  query: localStorage.getItem('sig:lastQuery') || '',
  route: window.location.pathname === '/admin' ? 'admin' : 'search',
  editingDocId: null,
  authUser: null,
  isAdmin: false,
  status: '',
  loading: false,
  firebaseReady: hasFirebaseConfig,
  db: null,
  auth: null
};

if (hasFirebaseConfig) {
  const firebaseApp = initializeApp(firebaseConfig);
  appState.db = getFirestore(firebaseApp);
  appState.auth = getAuth(firebaseApp);
}

function normalizeTracks(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const id = Number(item.id);
      const title = String(item.title || '').trim();
      const alias = Array.isArray(item.alias)
        ? item.alias.flatMap((value) => String(value).split(',')).map((value) => value.trim()).filter(Boolean)
        : [];

      if (!Number.isInteger(id) || id <= 0 || !title) return null;

      return {
        docId: item.docId || null,
        id,
        title,
        alias
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.id - b.id || a.title.localeCompare(b.title, 'ko'));
}

function trackPayload(track) {
  const payload = {
    id: Number(track.id),
    title: String(track.title || '').trim(),
    alias: Array.isArray(track.alias) ? track.alias.filter(Boolean) : [],
    updatedAt: serverTimestamp()
  };

  if (payload.alias.length === 0) {
    delete payload.alias;
  }

  return payload;
}

function getSearchResults() {
  const queryText = appState.query.trim().toLowerCase();
  if (!queryText) return appState.tracks;

  return appState.tracks.filter((track) => {
    const aliasText = Array.isArray(track.alias) ? track.alias.join(' ') : '';
    return String(track.id).includes(queryText)
      || track.title.toLowerCase().includes(queryText)
      || aliasText.toLowerCase().includes(queryText);
  });
}

function setStatus(message) {
  appState.status = message || '';
  render();
}

async function loadFirebaseTracks() {
  if (!appState.db) {
    appState.tracks = normalizeTracks(fallbackTracks);
    return;
  }

  appState.loading = true;
  render();

  try {
    const snapshot = await getDocs(query(collection(appState.db, 'signatures'), orderBy('id', 'asc')));
    const loaded = snapshot.docs.map((item) => ({
      docId: item.id,
      ...item.data()
    }));
    appState.tracks = loaded.length > 0 ? normalizeTracks(loaded) : normalizeTracks(fallbackTracks);
    appState.status = loaded.length > 0
      ? 'Firebase에서 목록을 불러왔습니다.'
      : 'Firebase 목록이 비어 있어 기본 목록을 표시합니다.';
  } catch (error) {
    console.error(error);
    appState.tracks = normalizeTracks(fallbackTracks);
    appState.status = 'Firebase를 읽지 못해 기본 목록을 표시합니다.';
  } finally {
    appState.loading = false;
    render();
  }
}

async function checkAdmin(user) {
  appState.authUser = user;
  appState.isAdmin = false;

  if (!user || !appState.db) {
    render();
    return;
  }

  try {
    const adminDoc = await getDoc(doc(appState.db, 'admins', user.uid));
    appState.isAdmin = adminDoc.exists();
    appState.status = appState.isAdmin
      ? '관리자 권한이 확인되었습니다.'
      : `관리자 권한이 없습니다. Firebase Console에서 admins/${user.uid} 문서를 추가하세요.`;
  } catch (error) {
    console.error(error);
    appState.status = '관리자 권한 확인에 실패했습니다.';
  }

  render();
}

function goTo(route) {
  appState.route = route;
  const path = route === 'admin' ? '/admin' : '/';
  window.history.pushState({}, '', path);
  render();
}

function appShell(content) {
  return `
    <main class="shell">
      <header class="topbar">
        <div class="brand">
          <img src="/logo.png" alt="로고" />
          <h1>시그 검색기</h1>
        </div>
        <nav class="nav">
          <button class="nav-button" data-route="search" type="button">검색</button>
          <button class="nav-button" data-route="admin" type="button">관리</button>
        </nav>
      </header>
      ${content}
    </main>
  `;
}

function renderSearch() {
  const results = getSearchResults();
  const rows = results.map((track) => `
    <tr>
      <td class="id-cell">${track.id}</td>
      <td>${escapeHtml(track.title)}</td>
      <td class="alias-cell">${escapeHtml(track.alias.join(', '))}</td>
    </tr>
  `).join('');

  return appShell(`
    <section class="panel">
      <input
        id="searchInput"
        class="search-input"
        type="search"
        value="${escapeAttr(appState.query)}"
        placeholder="입력하는 즉시 검색됩니다 (제목, 갯수, 별칭)"
        autocomplete="off"
      />
      <div class="info-bar">
        <span>총 ${results.length}개의 곡이 있습니다.</span>
        <span>${appState.firebaseReady ? 'Firebase 연결 준비됨' : '기본 목록 모드'}</span>
      </div>
    </section>
    <section class="table-wrap" aria-label="검색 결과">
      <table>
        <thead>
          <tr>
            <th class="id-cell">갯수</th>
            <th>곡 제목</th>
            <th>별칭</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${rows ? '' : '<div class="empty">검색된 곡이 없습니다.</div>'}
    </section>
  `);
}

function renderAdmin() {
  const rows = getSearchResults().map((track) => `
    <tr>
      <td class="id-cell">${track.id}</td>
      <td>${escapeHtml(track.title)}</td>
      <td class="alias-cell">${escapeHtml(track.alias.join(', '))}</td>
      <td class="actions">
        <button class="btn subtle" data-edit="${escapeAttr(track.docId || '')}" data-id="${track.id}" type="button">수정</button>
        <button class="btn danger" data-delete="${escapeAttr(track.docId || '')}" data-id="${track.id}" type="button">삭제</button>
      </td>
    </tr>
  `).join('');

  const authPanel = appState.firebaseReady
    ? `
      <div class="auth-row">
        <span>${appState.authUser ? escapeHtml(appState.authUser.email || appState.authUser.uid) : '로그인이 필요합니다.'}</span>
        <button id="authBtn" class="btn" type="button">${appState.authUser ? '로그아웃' : 'Google 로그인'}</button>
      </div>
    `
    : '<div class="notice">Firebase 환경변수를 Vercel에 설정하면 로그인과 저장 기능이 활성화됩니다.</div>';

  return appShell(`
    <section class="panel admin-panel">
      ${authPanel}
      <div class="notice">${escapeHtml(appState.status)}</div>
      <form id="entryForm" class="entry-form">
        <label>
          <span>갯수</span>
          <input id="idInput" type="number" min="1" inputmode="numeric" required />
        </label>
        <label>
          <span>곡 제목</span>
          <input id="titleInput" type="text" required />
        </label>
        <label>
          <span>별칭</span>
          <input id="aliasInput" type="text" placeholder="별칭1, 별칭2" />
        </label>
        <div class="form-actions">
          <button class="btn" type="submit">${appState.editingDocId ? '수정 저장' : '추가'}</button>
          <button id="resetFormBtn" class="btn subtle" type="button">초기화</button>
          <button id="seedBtn" class="btn subtle" type="button">기본 목록 Firebase에 넣기</button>
        </div>
      </form>
    </section>
    <section class="panel">
      <input
        id="searchInput"
        class="search-input"
        type="search"
        value="${escapeAttr(appState.query)}"
        placeholder="관리할 항목 검색"
        autocomplete="off"
      />
    </section>
    <section class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="id-cell">갯수</th>
            <th>곡 제목</th>
            <th>별칭</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${rows ? '' : '<div class="empty">표시할 항목이 없습니다.</div>'}
    </section>
  `);
}

function render() {
  document.getElementById('app').innerHTML = appState.route === 'admin'
    ? renderAdmin()
    : renderSearch();

  bindCommonEvents();
  if (appState.route === 'admin') bindAdminEvents();
}

function bindCommonEvents() {
  document.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => goTo(button.dataset.route));
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.focus();
    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    searchInput.addEventListener('input', (event) => {
      appState.query = event.target.value;
      localStorage.setItem('sig:lastQuery', appState.query);
      render();
    });
  }
}

function bindAdminEvents() {
  const authBtn = document.getElementById('authBtn');
  if (authBtn) {
    authBtn.addEventListener('click', async () => {
      if (!appState.auth) return;
      if (appState.authUser) {
        await signOut(appState.auth);
        return;
      }
      await signInWithPopup(appState.auth, new GoogleAuthProvider());
    });
  }

  document.getElementById('entryForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await saveTrack();
  });

  document.getElementById('resetFormBtn')?.addEventListener('click', resetForm);
  document.getElementById('seedBtn')?.addEventListener('click', seedFallbackTracks);

  document.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => startEdit(button.dataset.edit, Number(button.dataset.id)));
  });

  document.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', () => removeTrack(button.dataset.delete, Number(button.dataset.id)));
  });
}

async function saveTrack() {
  if (!canWrite()) return;

  const track = {
    id: Number(document.getElementById('idInput').value),
    title: document.getElementById('titleInput').value,
    alias: document.getElementById('aliasInput').value.split(',').map((item) => item.trim()).filter(Boolean)
  };
  const normalized = normalizeTracks([track])[0];

  if (!normalized) {
    setStatus('갯수와 곡 제목을 확인하세요.');
    return;
  }

  try {
    if (appState.editingDocId) {
      await updateDoc(doc(appState.db, 'signatures', appState.editingDocId), trackPayload(normalized));
      setStatus('항목을 수정했습니다.');
    } else {
      await addDoc(collection(appState.db, 'signatures'), {
        ...trackPayload(normalized),
        createdAt: serverTimestamp()
      });
      setStatus('항목을 추가했습니다.');
    }
    appState.editingDocId = null;
    await loadFirebaseTracks();
  } catch (error) {
    console.error(error);
    setStatus('저장에 실패했습니다. 관리자 권한과 Firestore 규칙을 확인하세요.');
  }
}

function startEdit(docId, id) {
  const track = appState.tracks.find((item) => item.docId === docId || item.id === id);
  if (!track) return;

  appState.editingDocId = track.docId;
  render();
  document.getElementById('idInput').value = track.id;
  document.getElementById('titleInput').value = track.title;
  document.getElementById('aliasInput').value = track.alias.join(', ');
}

async function removeTrack(docId, id) {
  if (!canWrite()) return;
  if (!docId) {
    setStatus('Firebase에 저장된 항목만 삭제할 수 있습니다.');
    return;
  }

  const track = appState.tracks.find((item) => item.docId === docId || item.id === id);
  if (!confirm(`${track?.id || id} ${track?.title || ''} 항목을 삭제할까요?`)) return;

  try {
    await deleteDoc(doc(appState.db, 'signatures', docId));
    setStatus('항목을 삭제했습니다.');
    await loadFirebaseTracks();
  } catch (error) {
    console.error(error);
    setStatus('삭제에 실패했습니다.');
  }
}

async function seedFallbackTracks() {
  if (!canWrite()) return;
  if (!confirm('기본 list.json 목록을 Firebase에 추가할까요? 중복 확인 없이 새 문서로 추가됩니다.')) return;

  try {
    for (const track of normalizeTracks(fallbackTracks)) {
      await addDoc(collection(appState.db, 'signatures'), {
        ...trackPayload(track),
        createdAt: serverTimestamp()
      });
    }
    setStatus('기본 목록을 Firebase에 넣었습니다.');
    await loadFirebaseTracks();
  } catch (error) {
    console.error(error);
    setStatus('기본 목록 넣기에 실패했습니다.');
  }
}

function canWrite() {
  if (!appState.firebaseReady || !appState.db) {
    setStatus('Firebase 설정이 필요합니다.');
    return false;
  }
  if (!appState.authUser) {
    setStatus('먼저 로그인하세요.');
    return false;
  }
  if (!appState.isAdmin) {
    setStatus('관리자 권한이 필요합니다.');
    return false;
  }
  return true;
}

function resetForm() {
  appState.editingDocId = null;
  render();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}

window.addEventListener('popstate', () => {
  appState.route = window.location.pathname === '/admin' ? 'admin' : 'search';
  render();
});

if (appState.auth) {
  onAuthStateChanged(appState.auth, checkAdmin);
}

loadFirebaseTracks();
