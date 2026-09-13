"use client";

import { useState, useEffect } from "react";
import { api, apiMultipart } from "@/lib/api";
import type { Document } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UploadCloud, FileText, Loader2, Trash2, CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  queued: { label: "Queued", icon: Clock, className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  processing: { label: "Processing", icon: Loader2, className: "bg-blue-50 text-blue-700 border-blue-200" },
  ready: { label: "Ready", icon: CheckCircle2, className: "bg-green-50 text-green-700 border-green-200" },
  failed: { label: "Failed", icon: XCircle, className: "bg-red-50 text-red-700 border-red-200" },
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const loadDocuments = async () => {
    try {
      const docs = await api<Document[]>("/documents");
      setDocuments(docs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocuments(); }, []);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setError("");

    const form = e.currentTarget;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      await apiMultipart<Document>("/documents/upload", formData);
      fileInput.value = "";
      await loadDocuments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api<{ success: boolean }>(`/documents/${id}`, { method: "DELETE" });
      setDocuments((docs) => docs.filter((d) => d.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground mt-1">Upload PDFs to build your knowledge base</p>
      </div>

      {/* Upload Card */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="file">PDF File</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,application/pdf"
                required
                className="mt-1.5"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={uploading} className="gap-2">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Upload PDF
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Documents</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-shimmer" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted text-muted-foreground mx-auto mb-4">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="font-semibold mb-1">No documents yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Upload a PDF to get started. Your documents will be processed and ready for AI-powered search.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.queued;
              const StatusIcon = status.icon;
              return (
                <Card key={doc.id} className="transition-shadow hover:shadow-sm">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{doc.filename}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`
                            inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border
                            ${status.className}
                          `}>
                            <StatusIcon className={`h-3 w-3 ${doc.status === 'processing' ? 'animate-spin' : ''}`} />
                            {status.label}
                          </span>
                          {doc.error_message && (
                            <span className="text-xs text-destructive">{doc.error_message}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
