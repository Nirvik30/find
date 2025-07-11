import React, { useEffect, useState } from 'react';
import { FileText, Download, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentPreviewProps {
  url: string;
  fileName: string;
}

export function DocumentPreview({ url, fileName }: DocumentPreviewProps) {
  const [fullUrl, setFullUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!url) {
        setError("No document URL provided");
        setLoading(false);
        return;
      }

      if (url.startsWith('http')) {
        setFullUrl(url);
      } else {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        setFullUrl(`${baseUrl.replace('/api', '')}${url}`);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error processing URL:", err);
      setError("Failed to process document URL");
      setLoading(false);
    }
  }, [url]);

  const fileExt = fileName?.split('.').pop()?.toLowerCase();
  const isPdf = fileExt === 'pdf';
  const isDoc = fileExt === 'doc' || fileExt === 'docx';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !fullUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-center text-red-500">{error || "Document URL is invalid"}</p>
        {fullUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={fullUrl} download={fileName} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Download File
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="bg-accent/50 p-4 rounded-lg w-full mb-4 min-h-[500px]">
        {isPdf ? (
          <object
            data={fullUrl}
            type="application/pdf"
            width="100%"
            height="500px"
            className="w-full h-full border-0"
            onError={() => setError("Failed to load PDF. Please download to view.")}
          >
            <p className="text-center p-8">
              Your browser doesn't support PDF preview. 
              <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="text-primary ml-1">
                Click here to view the PDF
              </a>
            </p>
          </object>
        ) : (
          <iframe 
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`}
            title="Document Preview"
            width="100%" 
            height="500px"
            className="border-0 rounded-md bg-white"
            onError={() => setError("Failed to load document. Please download to view.")}
          />
        )}
      </div>
      
      <div className="flex justify-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <a href={fullUrl} download={fileName} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-2" />
            Download
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={fullUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </a>
        </Button>
      </div>
    </div>
  );
}