import axios from "axios";

const BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

const api = axios.create({
  baseURL: BASE
});

async function generateSignature(studentAccount, pollId) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode("secret123"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(studentAccount + pollId)
  );

  const bytes = new Uint8Array(signature);

  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ============================================================
// 🔵 API COMPLETO
// ============================================================
export default {
  // -----------------------------
  // Importar CSV de estudiantes
  // -----------------------------
  uploadStudentsCSV: (
    file,
    token
  ) => {
    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    return axios.post(
      `${BASE}/admin/import-csv`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "multipart/form-data"
        }
      }
    );
  },

  // -----------------------------
  // Estudiante
  // -----------------------------
  verifyStudent: (
    accountNumber,
    center
  ) =>
    api.post(
      `/student/verify`,
      {
        accountNumber,
        center
      }
    ),

  castVote: (
    payload
  ) =>
    api.post(
      `/votes/cast`,
      payload
    ),

  checkVote: (
    pollId,
    studentAccount
  ) =>
    api.get(
      `/votes/check`,
      {
        params: {
          pollId,
          studentAccount
        }
      }
    ),

  getPublicResults:
    () =>
      api.get(
        `/votes/public/results`
      ),

  // 🔥 NUEVO
  // Resultados admin generales
  getAllResults: (
    token
  ) =>
    api.get(
      `/votes/results`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  // -----------------------------
  // ADMIN LOGIN
  // -----------------------------
  adminLogin: (
    username,
    password
  ) =>
    api.post(
      `/auth/login`,
      {
        username,
        password
      }
    ),

    changeOwnPassword: (data, token) =>
      api.post("/admin-users/change-own-password", data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }),

  // -----------------------------
  // Reportes
  // -----------------------------
  getAllVotes: (
    token
  ) =>
    api.get(
      `/votes/admin/all`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  exportExcelAll: (
    token,
    pollId
  ) =>
    api.get(
      `/votes/admin/export/excel`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          pollId
        },
        responseType:
          "blob"
      }
    ),

  exportExcelResults: (
    token,
    pollId
  ) =>
    api.get(
      `/votes/admin/export/excel/results`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          pollId
        },
        responseType:
          "blob"
      }
    ),

  // -----------------------------
  // Elección pública activa
  // -----------------------------
  getActiveElection:
    () =>
      api.get(
        `/elections/active`
      ),

  // -----------------------------
  // Admin Elecciones
  // -----------------------------
  getElections: (
    token
  ) =>
    api.get(
      `/elections`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  createElection: (
    formData,
    token
  ) =>
    axios.post(
      `${BASE}/elections/create`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "multipart/form-data"
        }
      }
    ),

  updateElectionStatus: (
    pollId,
    status,
    token
  ) =>
    api.patch(
      `/elections/${pollId}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  editElection: (
    pollId,
    formData,
    token
  ) =>
    axios.put(
      `${BASE}/elections/${pollId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "multipart/form-data"
        }
      }
    ),

  deleteElection: (
    pollId,
    token
  ) =>
    api.delete(
      `/elections/${pollId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  deleteVotes: (
    pollId,
    token
  ) =>
    api.delete(
      `/elections/${pollId}/votes`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  // -----------------------------
  // Admin Users
  // -----------------------------
  getAdmins: (
    token
  ) =>
    api.get(
      `/admin-users`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  createAdmin: (
    payload,
    token
  ) =>
    api.post(
      `/admin-users`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  deleteAdmin: (
    id,
    token
  ) =>
    api.delete(
      `/admin-users/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  getLogs: (token, page = 1) =>
    api.get(`/admin-logs?page=${page}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }),

  getDetailedResults: (
    pollId,
    token
  ) =>
    api.get(
      `/votes/admin/results/${pollId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  // -----------------------------
  // Solicitudes
  // -----------------------------
  requestDeleteElection: (
    pollId,
    token
  ) =>
    api.post(
      `/approvals/elections/${pollId}/request-delete`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  requestEditElection: (
    pollId,
    formData,
    token
  ) =>
    axios.post(
      `${BASE}/approvals/elections/${pollId}/request-edit`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "multipart/form-data"
        }
      }
    ),

  getApprovalRequests: (
    token
  ) =>
    api.get(
      `/approvals/requests`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  getApprovalRequest: (
    id,
    token
  ) =>
    api.get(
      `/approvals/requests/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  approveRequest: (
    id,
    token,
    comment = ""
  ) =>
    api.post(
      `/approvals/requests/${id}/approve`,
      { comment },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

  rejectRequest: (
    id,
    token,
    comment = ""
  ) =>
    api.post(
      `/approvals/requests/${id}/reject`,
      { comment },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    
};
// 🔥 AUTO LOGOUT SI TOKEN EXPIRA
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("admin_token");
      window.location.replace("/votaciones/");
    }
    return Promise.reject(err);
  }
);

export { generateSignature };