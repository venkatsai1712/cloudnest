import React, { useEffect, useRef, useState } from "react";
import * as api from "./api/api";

const user = () => {
  try { return JSON.parse(localStorage.getItem("cloudnest_user")); }
  catch { return null; }
};

const formatSize = (size) => {
  if (!size) return "0 B";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const fileIcon = (name = "") => {
  const lower = name.toLowerCase();
  if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return "IMG";
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.match(/\.(doc|docx|txt)$/)) return "DOC";
  if (lower.match(/\.(zip|rar|7z)$/)) return "ZIP";
  if (lower.match(/\.(mp3|wav)$/)) return "AUD";
  return "FILE";
};

function AuthPage({ mode, onDone }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      if (mode === "signup") {
        await api.signUp({ name, email, password });
        onDone("signin");
      } else {
        const response = await api.signIn({ email, password });
        localStorage.setItem("cloudnest_user", JSON.stringify(response.data));
        onDone("files");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <div className="brand-mark">CN</div>
        <h1>CloudNest</h1>
        <p>Your personal place to store and share files.</p>
      </section>
      <form className="auth-card" onSubmit={submit}>
        <span className="auth-label">{mode === "signin" ? "Welcome back" : "Get started"}</span>
        <h2>{mode === "signin" ? "Sign in" : "Create account"}</h2>
        {mode === "signup" && (
          <label>Name<input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required /></label>
        )}
        <label>Email<input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" placeholder="At least 6 characters" minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <div className="error">{error}</div>}
        <button className="primary-button" type="submit">{mode === "signin" ? "Sign in" : "Create account"}</button>
        <button type="button" className="link-button" onClick={() => onDone(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "Create a new account" : "Sign in instead"}
        </button>
      </form>
    </main>
  );
}

function App() {
  const [screen, setScreen] = useState(() => user() ? "files" : "signin");
  const [currentUser, setCurrentUser] = useState(user);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState(null);
  const [folderName, setFolderName] = useState("");
  const [shared, setShared] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const fileInput = useRef(null);

  async function loadFiles(nextFolder = folderId) {
    setLoading(true);
    try {
      if (nextFolder) {
        const data = await api.getFolderContents(nextFolder);
        setFiles(data.files || []);
        setFolders(data.folders || []);
      } else {
        setFiles(await api.getFiles());
        setFolders(await api.getFolders());
      }
    } catch (err) {
      setMessage(err.message || "Could not load files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (screen === "files") loadFiles();
  }, [screen]);

  async function openFolder(folder) {
    setFolderId(folder?.id || null);
    setFolderName(folder?.name || "");
    await loadFiles(folder?.id || null);
  }

  async function createFolder() {
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;
    try {
      await api.createFolder({ name: name.trim(), parentId: folderId });
      await loadFiles(folderId);
    } catch (err) {
      setMessage(err.message || "Could not create folder");
    }
  }

  async function upload(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setLoading(true);
    try {
      await api.uploadFile(selected, folderId);
      await loadFiles(folderId);
      setMessage("Upload complete");
    } catch (err) {
      setMessage(err.message || "Upload failed");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  async function download(file) {
    try {
      const url = await api.getDownloadPresignedURL(file.id);
      window.open(typeof url === "string" ? url : url.data, "_blank");
    } catch (err) {
      setMessage(err.message || "Download failed");
    }
  }

  async function removeFile(file) {
    if (!window.confirm(`Delete ${file.name}?`)) return;
    try {
      await api.deleteFile(file.id);
      await loadFiles(folderId);
    } catch (err) {
      setMessage(err.message || "Delete failed");
    }
  }

  async function share(file) {
    const email = window.prompt("Share with (email)");
    if (!email?.trim()) return;
    try {
      await api.shareFile({ fileId: file.id, sharedUserEmail: email.trim(), permission: "DOWNLOAD", expireSeconds: 3600 });
      setMessage("File shared");
    } catch (err) {
      setMessage(err.message || "Share failed");
    }
  }

  async function showShared() {
    setScreen("shared");
    setLoading(true);
    try {
      setShared(await api.getSharedWithMe());
    } catch (err) {
      setMessage(err.message || "Could not load shared files");
    } finally {
      setLoading(false);
    }
  }

  async function downloadShared(file) {
    try {
      const url = await api.getSharedFileDownloadUrl(file.id);
      window.open(typeof url === "string" ? url : url.data, "_blank");
    } catch (err) {
      setMessage(err.message || "Download failed");
    }
  }

  async function logout() {
    try { await api.logout(); } catch {}
    localStorage.removeItem("cloudnest_user");
    setCurrentUser(null);
    setScreen("signin");
  }

  function authDone(next) {
    setCurrentUser(user());
    setScreen(next);
  }

  if (screen === "signin" || screen === "signup") {
    return <AuthPage mode={screen} onDone={authDone} />;
  }

  const visibleFiles = files.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );
  const visibleShared = shared.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

  return (
    <div className="app-shell">
      <aside>
        <div className="sidebar-brand"><div className="brand-mark small">CN</div><h2>CloudNest</h2></div>
        <button className="upload-button" onClick={() => fileInput.current.click()} disabled={loading}>
          <span>+</span> Upload file
        </button>
        <input ref={fileInput} type="file" hidden onChange={upload} />
        <nav>
          <button className={`plain ${screen === "files" ? "active" : ""}`} onClick={() => openFolder(null)}>My files</button>
          <button className={`plain ${screen === "shared" ? "active" : ""}`} onClick={showShared}>Shared with me</button>
        </nav>
        <div className="sidebar-section">
          <span>Folders</span>
          <button className="new-folder" onClick={createFolder}>+ New folder</button>
        </div>
        {folders.map((folder) => (
          <button className={`plain folder-link ${folderId === folder.id ? "active" : ""}`} key={folder.id} onClick={() => openFolder(folder)}>
            <span className="folder-icon">F</span>{folder.name}
          </button>
        ))}
      </aside>

      <main>
        <header>
          <div className="search-box">
            <span>Search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files" />
          </div>
          <div className="user-menu">
            <div className="avatar">{(currentUser?.name || currentUser?.email || "U")[0].toUpperCase()}</div>
            <div className="user-details">
              <strong>{currentUser?.name || "Student"}</strong>
              <span>{currentUser?.email}</span>
            </div>
            <button className="logout-button" onClick={logout}>Logout</button>
          </div>
        </header>

        {message && <div className="notice">{message}<button onClick={() => setMessage("")}>x</button></div>}

        {loading ? <p className="loading">Loading...</p> : (
          screen === "shared" ? (
            <div className="content">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">Access</span>
                  <h1>Shared with me</h1>
                </div>
                <button className="secondary-button" onClick={() => { setScreen("files"); loadFiles(folderId); }}>Back to files</button>
              </div>
              <div className="file-card">
                <table>
                  <thead><tr><th>Name</th><th>Size</th><th>Permission</th><th>Actions</th></tr></thead>
                  <tbody>
                    {visibleShared.map((file) => (
                      <tr key={file.id}>
                        <td><div className="file-name"><span className="file-type">{fileIcon(file.name)}</span><strong>{file.name}</strong></div></td>
                        <td>{formatSize(file.size)}</td><td><span className="permission">{file.permission}</span></td>
                        <td><button className="table-action" onClick={() => downloadShared(file)}>Download</button></td>
                      </tr>
                    ))}
                    {!visibleShared.length && <tr><td colSpan="4"><div className="empty-state"><strong>No shared files</strong><span>Files shared with you will appear here.</span></div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="content">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">Workspace</span>
                  <h1>{folderName || "My files"}</h1>
                </div>
                {folderId && <button className="secondary-button" onClick={() => openFolder(null)}>All files</button>}
              </div>
              <div className="stats">
                <div><span>Files</span><strong>{files.length}</strong></div>
                <div><span>Folders</span><strong>{folders.length}</strong></div>
                <div><span>Storage used</span><strong>{formatSize(totalSize)}</strong></div>
              </div>
              {folders.length > 0 && (
                <section className="folders-grid">
                  {folders.map((folder) => (
                    <button key={folder.id} className="folder-card" onClick={() => openFolder(folder)}>
                      <span className="folder-icon large">F</span>
                      <strong>{folder.name}</strong>
                    </button>
                  ))}
                </section>
              )}
              <div className="file-card">
                <table>
                  <thead><tr><th>Name</th><th>Size</th><th>Actions</th></tr></thead>
                  <tbody>
                    {visibleFiles.map((file) => (
                      <tr key={file.id}>
                        <td><div className="file-name"><span className="file-type">{fileIcon(file.name)}</span><strong>{file.name}</strong></div></td>
                        <td>{formatSize(file.size)}</td>
                        <td>
                          <button className="table-action" onClick={() => download(file)}>Download</button>
                          <button className="table-action" onClick={() => share(file)}>Share</button>
                          <button className="table-action delete" onClick={() => removeFile(file)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {!visibleFiles.length && <tr><td colSpan="3"><div className="empty-state"><strong>{search ? "No matching files" : "No files here"}</strong><span>{search ? "Try another search." : "Upload a file to get started."}</span></div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;