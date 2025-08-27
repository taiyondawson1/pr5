import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Info, X, Clock, CheckCircle, Asterisk, ArrowLeft, BarChart, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SetfilesPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ email?: string } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Authorized email addresses
  const AUTHORIZED_EMAILS = [
    'support@platinumai.co.uk',
    'taiyondawson212@gmail.com'
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        
        if (user?.email) {
          const authorized = AUTHORIZED_EMAILS.includes(user.email.toLowerCase());
          setIsAuthorized(authorized);
          
          if (!authorized) {
            toast({
              title: "Access Restricted",
              description: "Only authorized users can upload and manage setfiles",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, [toast]);

  // Load setfiles from database
  useEffect(() => {
    const loadSetfiles = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('setfiles')
          .select('*')
          .or('category.neq.community,category.is.null')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading setfiles:', error);
          toast({
            title: "Error loading setfiles",
            description: "Failed to load setfiles from database",
            variant: "destructive"
          });
          return;
        }

        // Transform data to match our state structure
        const transformedFiles = (data || []).map(file => ({
          id: file.id,
          name: file.name,
          description: file.description,
          uploadedAt: new Date(file.created_at).toISOString().split('T')[0],
          size: file.file_size,
          downloads: file.downloads,
          rating: file.rating,
          status: file.status,
          storagePath: file.storage_path,
          category: file.category,
          riskLevel: file.risk_level
        }));

        setFiles(transformedFiles);
      } catch (error) {
        console.error('Failed to load setfiles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSetfiles();
  }, [toast]);
  const [files, setFiles] = useState<Array<{
    id: string;
    name: string;
    description: string;
    uploadedAt: string;
    size: number;
    downloads: number;
    rating: number;
    status: 'active' | 'inactive' | 'testing';
    storagePath?: string;
    category?: string;
    riskLevel?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'forex',
    riskLevel: 'medium'
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.set')) {
      setSelectedFile(file);
      setUploadForm(prev => ({ ...prev, name: file.name }));
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a .set file",
        variant: "destructive"
      });
    }
  };

  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      console.log('Uploading file:', fileName, 'Size:', file.size);
      
      const { data, error } = await supabase.storage
        .from('setfiles')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      console.log('Upload successful:', data);
      return fileName;
    } catch (error) {
      console.error('Storage upload failed:', error);
      return null;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.name || !uploadForm.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload file to Supabase Storage
      const fileName = await uploadFileToStorage(selectedFile);
      
      if (!fileName) {
        toast({
          title: "Upload failed",
          description: "Failed to upload file to storage",
          variant: "destructive"
        });
        return;
      }

      // Get current user for the upload
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Upload failed",
          description: "User not authenticated",
          variant: "destructive"
        });
        return;
      }

      // Insert into database
      const { data: dbFile, error: dbError } = await supabase
        .from('setfiles')
        .insert({
          name: uploadForm.name,
          description: uploadForm.description,
          storage_path: fileName,
          file_size: selectedFile.size,
          category: uploadForm.category,
          risk_level: uploadForm.riskLevel,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        toast({
          title: "Upload failed",
          description: "Failed to save file record to database",
          variant: "destructive"
        });
        return;
      }

      // Create new file record for state
      const newFile = {
        id: dbFile.id,
        name: dbFile.name,
        description: dbFile.description,
        uploadedAt: new Date(dbFile.created_at).toISOString().split('T')[0],
        size: dbFile.file_size,
        downloads: dbFile.downloads,
        rating: dbFile.rating,
        status: dbFile.status,
        storagePath: dbFile.storage_path,
        category: dbFile.category,
        riskLevel: dbFile.risk_level
      };

      console.log('Created file record:', newFile);

      setFiles(prev => [newFile, ...prev]);
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadForm({ name: '', description: '', category: 'forex', riskLevel: 'medium' });

      toast({
        title: "File uploaded successfully",
        description: `${uploadForm.name} has been uploaded and is pending review`
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "An error occurred during upload",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (file: any) => {
    try {
      console.log('Downloading file:', file.name, 'Storage path:', file.storagePath);
      
      // For existing files without storagePath, use dummy content
      if (!file.storagePath) {
        console.log('No storage path, using dummy content');
        const dummyContent = `[Settings]
Name=${file.name}
Description=${file.description}
Version=1.0
Created=${file.uploadedAt}

[Parameters]
// This is a sample .set file content
// In production, this would be the actual setfile data from storage
`;

        const blob = new Blob([dummyContent], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Download actual file from Supabase Storage
        console.log('Downloading from storage:', file.storagePath);
        const { data, error } = await supabase.storage
          .from('setfiles')
          .download(file.storagePath);

        if (error) {
          console.error('Download error:', error);
          toast({
            title: "Download failed",
            description: "Failed to download file from storage",
            variant: "destructive"
          });
          return;
        }

        console.log('Download successful, file size:', data.size);
        // Create download link
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      // Update download count in database
      const { error: updateError } = await supabase
        .from('setfiles')
        .update({ downloads: file.downloads + 1 })
        .eq('id', file.id);

      if (updateError) {
        console.error('Failed to update download count:', updateError);
      } else {
        // Update local state
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, downloads: f.downloads + 1 }
            : f
        ));
      }

      toast({
        title: "Download started",
        description: `${file.name} is being downloaded`
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download failed",
        description: "An error occurred during download",
        variant: "destructive"
      });
    }
  };

  const handleAnalytics = (file: any) => {
    toast({
      title: "Analytics",
      description: `${file.name} - Downloads: ${file.downloads}, Rating: ${file.rating.toFixed(1)}/5.0`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-500/10';
      case 'testing': return 'text-yellow-500 bg-yellow-500/10';
      case 'inactive': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'testing': return <Clock className="w-4 h-4" />;
      case 'inactive': return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8">
      <div className="space-y-6">
        {/* Header */}
        <section 
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Setfiles</h1>
              <p className="text-muted-foreground mt-2">
                {isAuthorized 
                  ? "Upload and manage your MT4/MT5 setfiles" 
                  : "View MT4/MT5 setfiles (Upload restricted to authorized users)"
                }
              </p>
              {!isAuthorized && currentUser && (
                <p className="text-sm text-amber-500 mt-1">
                  Logged in as: {currentUser.email}
                </p>
              )}
            </div>
            {isAuthorized && (
              <Button onClick={() => setUploadDialogOpen(true)} className="bg-galaxy-blue-600 hover:bg-galaxy-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Upload Setfile
              </Button>
            )}
          </div>
          </div>
        </section>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Total Files</p>
                  <p className="text-2xl font-bold text-white">{files.length}</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Download className="w-4 h-4 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
          <div 
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Active Files</p>
                  <p className="text-2xl font-bold text-white">{files.filter(f => f.status === 'active').length}</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>
          <div 
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Total Downloads</p>
                  <p className="text-2xl font-bold text-white">{files.reduce((sum, f) => sum + f.downloads, 0)}</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <BarChart className="w-4 h-4 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
          <div 
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Avg Rating</p>
                  <p className="text-2xl font-bold text-white">
                    {(files.reduce((sum, f) => sum + f.rating, 0) / files.length).toFixed(1)}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Asterisk className="w-4 h-4 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div 
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          <div className="relative z-10">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Your Setfiles</h2>
              <p className="text-sm text-white/70 mt-1">Manage and track your uploaded setfiles</p>
            </div>
            <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-galaxy-blue-500 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading setfiles...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12">
                <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No setfiles uploaded</h3>
                <p className="text-muted-foreground mb-4">
                  {isAuthorized 
                    ? "Upload your first setfile to get started" 
                    : "Only authorized users can upload setfiles"
                  }
                </p>
                {isAuthorized && (
                  <Button onClick={() => setUploadDialogOpen(true)}>Upload Setfile</Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-lg bg-galaxy-blue-500/10 flex items-center justify-center">
                        <Download className="w-5 h-5 text-galaxy-blue-500" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{file.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(file.status)} flex items-center space-x-1`}>
                            {getStatusIcon(file.status)}
                            <span className="capitalize">{file.status}</span>
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span>Uploaded {file.uploadedAt}</span>
                          <span>{formatFileSize(file.size)}</span>
                          <span>{file.downloads} downloads</span>
                          <span>★ {file.rating.toFixed(1)}</span>
                          {file.storagePath && (
                            <span className="text-green-500">✓ Stored</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAnalytics(file)}
                      >
                        <BarChart className="w-4 h-4 mr-2" />
                        Analytics
                      </Button>
                      {isAuthorized && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <X className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Setfile</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{file.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                try {
                                  // Delete from database
                                  const { error: deleteError } = await supabase
                                    .from('setfiles')
                                    .delete()
                                    .eq('id', file.id);

                                  if (deleteError) {
                                    console.error('Delete error:', deleteError);
                                    toast({
                                      title: "Delete failed",
                                      description: "Failed to delete file from database",
                                      variant: "destructive"
                                    });
                                    return;
                                  }

                                  // Delete from storage if it exists
                                  if (file.storagePath) {
                                    const { error: storageError } = await supabase.storage
                                      .from('setfiles')
                                      .remove([file.storagePath]);

                                    if (storageError) {
                                      console.error('Storage delete error:', storageError);
                                    }
                                  }

                                  // Update local state
                                  setFiles(prev => prev.filter(f => f.id !== file.id));
                                  toast({
                                    title: "Setfile deleted",
                                    description: `${file.name} has been removed`
                                  });
                                } catch (error) {
                                  console.error('Delete failed:', error);
                                  toast({
                                    title: "Delete failed",
                                    description: "An error occurred while deleting the file",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Upload Dialog - Only show if authorized */}
      {isAuthorized && (
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Setfile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">File</label>
              <input
                type="file"
                accept=".set"
                onChange={handleFileSelect}
                className="w-full mt-1 p-2 border border-border/50 rounded-md bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={uploadForm.name}
                onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter setfile name"
                className="w-full mt-1 p-2 border border-border/50 rounded-md bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your setfile strategy"
                rows={3}
                className="w-full mt-1 p-2 border border-border/50 rounded-md bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full mt-1 p-2 border border-border/50 rounded-md bg-background"
                >
                  <option value="forex">Forex</option>
                  <option value="indices">Indices</option>
                  <option value="crypto">Crypto</option>
                  <option value="commodities">Commodities</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Risk Level</label>
                <select
                  value={uploadForm.riskLevel}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, riskLevel: e.target.value }))}
                  className="w-full mt-1 p-2 border border-border/50 rounded-md bg-background"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || !uploadForm.name || !uploadForm.description}>
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}
    </main>
  );
};

export default SetfilesPage;
