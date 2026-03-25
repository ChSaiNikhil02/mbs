import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/integrations/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Shield, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface KycDocument {
  id: number;
  document_type: string;
  file_name: string;
  file_path: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: "Passport",
  drivers_license: "Driver's License",
  national_id: "National ID Card",
};

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-warning/10 text-warning", label: "Pending Review" },
  approved: { icon: CheckCircle2, color: "bg-success/10 text-success", label: "Approved" },
  verified: { icon: CheckCircle2, color: "bg-success/10 text-success", label: "Verified" },
  rejected: { icon: XCircle, color: "bg-destructive/10 text-destructive", label: "Rejected" },
};

export default function KycPage() {
  const { user, token, refreshUser } = useAuth();
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    if (!token) return;
    try {
      const data = await apiClient("users/me/kyc/documents/", { token });
      setDocuments(data as KycDocument[]);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [token]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !docType || !token) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", docType);

      // We use fetch directly here because apiClient might be configured for JSON
      const response = await fetch(`${"https://mbs-production.up.railway.app"}/users/me/kyc/upload/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      toast({ title: "Document uploaded", description: "Your document has been submitted for review." });
      setDocType("");
      await fetchDocuments();
      await refreshUser(); // Update user kyc_status in context
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (doc: KycDocument) => {
    if (!token) return;
    try {
      await fetch(`${"https://mbs-production.up.railway.app"}/users/me/kyc/documents/${doc.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        },
      });
      toast({ title: "Document removed" });
      fetchDocuments();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
    }
  };

  const kycStatus = user?.kyc_status || "unverified";

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold">KYC Verification</h1>
        <p className="text-muted-foreground mt-1">
          Submit your identity documents for verification
        </p>
      </div>

      {/* Current KYC Status */}
      <Card className="shadow-banking">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${
              kycStatus === "verified" ? "bg-success/10" : "bg-warning/10"
            }`}>
              <Shield className={`h-7 w-7 ${kycStatus === "verified" ? "text-success" : "text-warning"}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Verification Status</p>
              <p className="text-xl font-display font-bold capitalize">{kycStatus}</p>
              {kycStatus === "unverified" && (
                <p className="text-xs text-muted-foreground mt-0.5">Upload an ID document below to get started</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Form */}
      {kycStatus !== "verified" && (
        <Card className="shadow-banking">
          <CardHeader>
            <CardTitle className="font-display">Upload Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                  <SelectItem value="national_id">National ID Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>File</Label>
              <div
                onClick={() => docType && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  docType
                    ? "border-primary/30 hover:border-primary/60 cursor-pointer"
                    : "border-border opacity-50 cursor-not-allowed"
                }`}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  {uploading ? "Uploading..." : "Click to upload"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, or PDF — max 10MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={handleUpload}
                disabled={!docType || uploading}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submitted Documents */}
      <Card className="shadow-banking">
        <CardHeader>
          <CardTitle className="font-display">Submitted Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No documents submitted yet.
            </p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;
                return (
                  <div key={doc.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.file_name} · {formatDate(doc.created_at)}
                        </p>
                        {doc.rejection_reason && (
                          <p className="text-xs text-destructive mt-0.5">{doc.rejection_reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={statusCfg.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusCfg.label}
                      </Badge>
                      {doc.status === "pending" && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
