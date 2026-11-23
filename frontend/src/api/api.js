const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const opts = {
    credentials: "include",
    headers: options.headers || {},
    method: (options.method || "GET").toUpperCase(),
    body: options.body ?? null,
  };

  // Some environments reject a body for GET/HEAD requests — remove it.
  if (opts.method === "GET" || opts.method === "HEAD") delete opts.body;

  const res = await fetch(url, opts);
  if (!res.ok) {
    // Try to get a helpful error message from JSON, otherwise text.
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { parsed = text; }
    const coreMsg = parsed && typeof parsed === "object" ? parsed.message || parsed : parsed;
    const message = typeof coreMsg === "string" ? coreMsg : JSON.stringify(coreMsg);
    const err = new Error(message || `Request failed ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res;
}

export async function signIn(credentials) {
  return request("/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

export async function signUp(payload) {
  return request("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}


export async function logout() {
  return request("/auth/logout", { method: "POST" });
}





export async function uploadFile(file, folderId, onProgress) {
  const chunkSize = 10 * 1024 * 1024; // 10MB
  const chunks = [];
  for (let i = 0; i < file.size; i += chunkSize) {
    chunks.push(file.slice(i, i + chunkSize));
  }

  const uploadId = await getUploadIdForChunksUpload(file.name, file.type, file.size, folderId);
  const uploadedParts = [];
  let bytesUploaded = 0;
  const totalSize = file.size;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const presigned = await getPresignedURLForChunk(uploadId, i + 1, chunk.size);
    const url = (typeof presigned === "string") ? presigned : (presigned?.url || presigned?.presignedUrl || presigned?.uploadUrl || presigned);
    try {
      await uploadChunk(url, chunk, (loadedInChunk) => {
        if (onProgress) onProgress((bytesUploaded + (loadedInChunk || 0)) / totalSize);
      });
    } catch (e) {
      throw new Error(`Chunk upload failed for part ${i + 1}: ${e.message}`);
    }
    // backend expects 1-based part numbers
    uploadedParts.push(i + 1);
    bytesUploaded += chunk.size;
    if (onProgress) onProgress(bytesUploaded / totalSize);
  }

  return notifyUploadComplete(uploadId, uploadedParts);
}

export async function notifyUploadComplete(uploadId, partNumbers) {
  return request("/file/upload/chunks-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadId, partNumbers }),
  });
}

export async function getUploadIdForChunksUpload(name, contentType, size, folderId) {
  const res = await request("/file/upload/chunks-initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, contentType, size: String(size), folderId }),
  });
  return res?.data || res?.uploadId || res?.id || res;
}

export async function uploadChunk(presignedURL, chunk, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedURL);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded);
    };
    xhr.onload = () => {
      const ok = xhr.status >= 200 && xhr.status < 300;
      resolve({ ok, status: xhr.status, response: xhr.response });
    };
    xhr.onerror = () => reject(new Error("Network error during chunk upload"));
    xhr.send(chunk);
  });
}

export async function getPresignedURLForChunk(uploadId, partNumber, chunkSize) {
  const res = await request("/file/upload/chunks-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadId, partNumber, chunkSize }),
  });
  return res?.data || res?.url || res?.presignedUrl || res?.uploadUrl || res;
}


export async function getUploadPresignedURL({ name, contentType, size }) {
  const res = await request("/file/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, contentType, size }),
  });
  return res?.data || res;
}

export async function getFiles(folderId) {
  const q = folderId ? `?folderId=${encodeURIComponent(folderId)}` : "";
  const res = await request(`/files${q}`);
  return res?.data || res;
}

export async function getDownloadPresignedURL(id) {
  const res = await request(`/file/download-url/${encodeURIComponent(id)}`);
  return res?.data || res;
}

export async function downloadFile(id) {
  const res = await request(`/file/download/${encodeURIComponent(id)}`);
  return res.blob();
}

export async function deleteFile(id) {
  return request(`/file/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function createFolder(payload) {
  const res = await request(`/folder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res?.data || res;
}

export async function getFolders(parentId) {
  const q = parentId ? `?parentId=${encodeURIComponent(parentId)}` : "";
  const res = await request(`/folders${q}`);
  return res?.data || res;
}

export async function getFolderContents(folderId) {
  const q = folderId ? `?folderId=${encodeURIComponent(folderId)}` : "";
  const res = await request(`/folder/contents${q}`);
  return res?.data || res;
}

export async function deleteFolder(id) {
  return request(`/folder/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function shareFile(payload) {
  return request(`/share/file`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getSharedWithMe() {
  const res = await request(`/share/files`);
  return res?.data || res;
}

export async function getSharedFileDownloadUrl(shareId) {
  const res = await request(`/share/file/download-url/${encodeURIComponent(shareId)}`);
  return res?.data || res;
}

export async function downloadSharedFile(shareId) {
  const res = await request(`/share/file/download/${encodeURIComponent(shareId)}`);
  return res.blob ? res.blob() : res;
}

export async function deleteSharedFile(shareId) {
  return request(`/share/file/${encodeURIComponent(shareId)}`, { method: "DELETE" });
}

export default {
  signIn,
  signUp,
  logout,
  uploadFile,
  notifyUploadComplete,
  getUploadIdForChunksUpload,
  getPresignedURLForChunk,
  uploadChunk,
  getUploadPresignedURL,
  getFiles,
  getDownloadPresignedURL,
  downloadFile,
  deleteFile,
  createFolder,
  getFolders,
  getFolderContents,
  deleteFolder,
  shareFile,
  getSharedWithMe,
  getSharedFileDownloadUrl,
  downloadSharedFile,
  deleteSharedFile,
};
