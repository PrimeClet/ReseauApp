import api from '@/axios';

export type ImportType = 'coffrets' | 'equipements' | 'ports' | 'liaisons' | 'systems';

export interface ImportResult {
  success: boolean;
  message: string;
  imported?: number;
  errors?: string[];
  total?: number;
}

const importService = {
  async importCsv(file: File, type: ImportType): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await api.post<ImportResult>('/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async downloadTemplate(type: ImportType): Promise<void> {
    const response = await api.get(`/import/template/${type}`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default importService;
