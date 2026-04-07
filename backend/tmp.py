with open('C:/AcadMix/frontend/src/services/api.js', 'r', encoding='utf-8') as f:
    text = f.read()

bad_text = "export const tpoAPI = {"
idx = text.rfind(bad_text)
if idx != -1:
    text = text[:idx].strip() + "\n\n" + '''export const tpoAPI = {
  getCompanies: () => api.get('/api/tpo/companies'),
  createCompany: (data) => api.post('/api/tpo/companies', data),
  getDrives: () => api.get('/api/tpo/drives'),
  createDrive: (data) => api.post('/api/tpo/drives', data),
  updateDrive: (id, data) => api.put(/api/tpo/drives/, data),
  getApplicants: (id) => api.get(/api/tpo/drives//applicants),
  shortlistBulk: (id, ids) => api.put(/api/tpo/drives//shortlist, { student_ids: ids }),
  logResult: (id, data) => api.put(/api/tpo/drives//results, data),
  selectCandidate: (id, data) => api.put(/api/tpo/drives//select, data),
  getStats: () => api.get('/api/tpo/statistics'),
};
'''
    with open('C:/AcadMix/frontend/src/services/api.js', 'w', encoding='utf-8') as f:
        f.write(text)
