const API_BASE = '/api';

export const api = {
  /**
   * Check backend & blockchain status
   */
  async getStatus() {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error('Failed to reach backend service');
    return res.json();
  },

  /**
   * Step 2: Generate SHA-256 hash from file via backend
   */
  async calculateHash(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/evidence/hash`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to calculate file hash');
    }
    return res.json();
  },

  /**
   * Step 1 & 3: Register evidence on Ethereum blockchain
   */
  async registerEvidence(formData) {
    const res = await fetch(`${API_BASE}/evidence/register`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register evidence on blockchain');
    }
    return data;
  },

  /**
   * Step 4: Verify integrity by Evidence ID and SHA-256 hash
   */
  async verifyIntegrity(evidenceId, fileHash) {
    const res = await fetch(`${API_BASE}/evidence/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evidence_id: evidenceId, file_hash: fileHash }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Verification query failed');
    }
    return data;
  },

  /**
   * Step 4: Verify integrity by uploading a suspect file directly
   */
  async verifySuspectFile(file, evidenceId = '') {
    const formData = new FormData();
    formData.append('file', file);
    if (evidenceId) {
      formData.append('evidence_id', evidenceId);
    }
    const res = await fetch(`${API_BASE}/evidence/verify-file`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'File verification failed');
    }
    return data;
  },

  /**
   * Retrieve all registered evidence from Ethereum ledger
   */
  async getEvidenceList() {
    const res = await fetch(`${API_BASE}/evidence/list`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch evidence list');
    }
    return data;
  },

  /**
   * Get single evidence details
   */
  async getEvidence(evidenceId) {
    const res = await fetch(`${API_BASE}/evidence/${encodeURIComponent(evidenceId)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Evidence record not found');
    }
    return data;
  },

  /**
   * Tamper demonstration
   */
  async demonstrateTampering(evidenceId) {
    const res = await fetch(`${API_BASE}/evidence/tamper-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evidence_id: evidenceId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Tamper simulation failed');
    }
    return data;
  }
};
