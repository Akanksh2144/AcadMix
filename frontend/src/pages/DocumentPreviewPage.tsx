import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { resumeVaultAPI } from '../services/api';
import { CircleNotch } from '@phosphor-icons/react';

export default function DocumentPreviewPage() {
  const { filename } = useParams<{ filename: string }>();
  const id = sessionStorage.getItem('preview_resume_id');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (!id) {
      setError(true);
      return;
    }
    
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    // Set document title strictly to filename
    if (filename) document.title = filename;

    resumeVaultAPI.download(id)
      .then(response => {
        const fileType = filename?.toLowerCase().endsWith('.docx') 
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
          : 'application/pdf';
          
        const blob = new Blob([response.data || response], { type: fileType });
        setBlobUrl(URL.createObjectURL(blob));
        
        // If it's a DOCX, the iframe will instinctively trigger a silent download
      })
      .catch((err) => {
        console.error('Failed to preview document', err);
        setError(true);
      });
  }, [id, filename]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#333] flex flex-col items-center justify-center text-slate-300">
        <p className="font-medium">Failed to load preview.</p>
        <p className="text-xs mt-1 text-slate-500">The file may no longer exist or you lack permission.</p>
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="min-h-screen bg-[#333] flex flex-col items-center justify-center text-slate-300">
        <CircleNotch size={32} className="animate-spin text-indigo-500 mb-3" />
        <p className="text-sm font-bold tracking-wide">Decrypting & Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#333' }}>
      <iframe 
        src={blobUrl} 
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} 
        title={filename || 'Document Preview'}
      />
    </div>
  );
}
