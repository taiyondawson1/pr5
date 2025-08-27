
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { Download, Upload, Star, Clock, User, X, MessageCircle, Trash2 } from "lucide-react";

type CommunitySetfile = {
  id: string;
  name: string;
  description: string;
  author: string | null;
  created_at: string;
  storage_path: string;
  file_size: number;
  downloads: number;
  rating: number;
  status: string;
  category: string;
  risk_level: string;
  discord_name?: string | null;
  averageRating?: number;
  ratingCount?: number;
  userRating?: number;
};

const CommunitySetfiles = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState<CommunitySetfile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ratingBusy, setRatingBusy] = useState<string | null>(null);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    pair: '',
    timeframe: 'H1',
    riskLevel: 'medium',
    status: 'testing',
    discordName: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("setfiles")
          .select("id,name,description,created_at,storage_path,file_size,downloads,rating,status,category,risk_level,discord_name")
          .eq('category', 'community')
          .order("created_at", { ascending: false });

        if (error) {
          console.error('Error loading setfiles:', error);
          return;
        }

        // Get average ratings for each setfile
        const { data: ratingData, error: ratingError } = await supabase
          .from('setfile_rating_summary')
          .select('setfile_id, average_rating, rating_count');

        if (ratingError) {
          console.error('Error loading ratings:', ratingError);
        }

        // Get current user's ratings
        const { data: { user } } = await supabase.auth.getUser();
        let userRatingData: any[] = [];
        
        if (user) {
          setIsAdmin(user.email === 'support@platinumai.co.uk');
          
          const { data: userRatings, error: userRatingError } = await supabase
            .from('setfile_ratings')
            .select('setfile_id, rating')
            .eq('user_id', user.id);
          
          if (!userRatingError && userRatings) {
            userRatingData = userRatings;
          }
        }

        const transformedFiles = data?.map(file => {
          const ratingInfo = ratingData?.find(r => r.setfile_id === file.id);
          const averageRating = ratingInfo?.average_rating || 0;
          const ratingCount = ratingInfo?.rating_count || 0;
          const userRating = userRatingData.find(r => r.setfile_id === file.id)?.rating;
          
          return {
            ...file,
            author: file.discord_name || 'Community Member',
            averageRating: averageRating,
            ratingCount: ratingCount,
            userRating: userRating
          };
        }) || [];

        setFiles(transformedFiles);
        
        const userRatingsMap: Record<string, number> = {};
        userRatingData.forEach(rating => {
          userRatingsMap[rating.setfile_id] = rating.rating;
        });
        setUserRatings(userRatingsMap);
        
      } catch (error) {
        console.error('Error loading setfiles:', error);
        toast({
          title: "Error",
          description: "Failed to load community setfiles",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toast]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('setfiles')
        .upload(fileName, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      const insertData = {
        name: uploadForm.name,
        description: uploadForm.description,
        storage_path: fileName,
        file_size: selectedFile.size,
        category: 'community',
        risk_level: uploadForm.riskLevel,
        status: uploadForm.status,
        discord_name: uploadForm.discordName || null,
        uploaded_by: user?.id || null
      };
      
      const { data: dbFile, error: dbError } = await supabase
        .from('setfiles')
        .insert(insertData)
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      toast({ 
        title: "Uploaded successfully", 
        description: "Your setfile is now available to the community." 
      });
      
      setUploadForm({
        name: '',
        description: '',
        pair: '',
        timeframe: 'H1',
        riskLevel: 'medium',
        status: 'testing',
        discordName: ''
      });
      setSelectedFile(null);
      setUploadDialogOpen(false);
      
      // Reload files
      window.location.reload();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload setfile",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRating = async (setfileId: string, rating: number) => {
    try {
      setRatingBusy(setfileId);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to rate setfiles",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('setfile_ratings')
        .upsert({
          setfile_id: setfileId,
          user_id: user.id,
          rating: rating
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Rating submitted",
        description: "Thank you for your rating!"
      });

      // Update local state
      setFiles(prev => prev.map(file => 
        file.id === setfileId 
          ? { ...file, userRating: rating }
          : file
      ));
      setUserRatings(prev => ({ ...prev, [setfileId]: rating }));

    } catch (error) {
      console.error('Rating error:', error);
      toast({
        title: "Rating failed",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRatingBusy(null);
    }
  };

  const handleDelete = async (setfileId: string, storagePath: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      const { error: deleteError } = await supabase
        .from('setfiles')
        .delete()
        .eq('id', setfileId);

      if (deleteError) {
        throw deleteError;
      }

      const { error: storageError } = await supabase.storage
        .from('setfiles')
        .remove([storagePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      toast({
        title: "Deleted successfully",
        description: "Setfile has been removed from the community."
      });

      setFiles(prev => prev.filter(file => file.id !== setfileId));

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete setfile. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8">
      <div className="grid gap-6">
        {/* Header Card */}
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
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-white" />
                <h2 className="text-xl font-semibold text-white">Community Setfiles</h2>
              </div>
              <Button 
                onClick={() => setUploadDialogOpen(true)}
                className="relative overflow-hidden group rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700
                              bg-gradient-to-r from-transparent via-purple-500/20 to-transparent
                              translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000
                              pointer-events-none" />
                <Upload className="w-4 h-4 mr-2" />
                Upload Setfile
              </Button>
            </div>
            <p className="text-white/70">
              Share your trading strategies with the community. Click "Upload Setfile" to add your .set file.
            </p>
          </div>
        </div>

        {/* Files List Card */}
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
          <div className="relative z-10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-5 h-5 text-white" />
              <h2 className="text-xl font-semibold text-white">Community Setfiles ({files.length})</h2>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-galaxy-blue-500 mx-auto mb-4"></div>
                <p className="text-white/70">Loading community setfiles...</p>
              </div>
            ) : (
              <ScrollArea className="h-[720px]">
                <div className="grid gap-3">
                  {files.map((f) => (
                    <div 
                      key={f.id} 
                      className="rounded-2xl p-4 relative overflow-hidden group"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700
                                    bg-gradient-to-r from-transparent via-purple-500/20 to-transparent
                                    translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000
                                    pointer-events-none" />
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg text-white">{f.name}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                f.status === 'active' ? 'bg-green-500/10 text-green-400' :
                                f.status === 'testing' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-red-500/10 text-red-400'
                              }`}>
                                {f.status}
                              </span>
                            </div>
                            <p className="text-white/70 mb-2">{f.description}</p>
                            <div className="flex items-center gap-4 text-sm text-white/70">
                              <span className="flex items-center gap-1">
                                {f.discord_name ? (
                                  <MessageCircle className="w-4 h-4 text-blue-400" />
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                                {f.author}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(f.created_at).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Download className="w-4 h-4" />
                                {f.downloads} downloads
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400" />
                                {f.averageRating ? f.averageRating.toFixed(1) : '0.0'}/5.0
                                {f.ratingCount > 0 && (
                                  <span className="text-xs text-white/60">({f.ratingCount})</span>
                                )}
                              </span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => handleRating(f.id, star)}
                                    disabled={ratingBusy === f.id}
                                    className={`text-sm transition-colors ${
                                      f.userRating && f.userRating >= star 
                                        ? 'text-yellow-400 hover:text-yellow-300' 
                                        : 'text-white/60 hover:text-yellow-400'
                                    } ${ratingBusy === f.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              onClick={async () => {
                                try {
                                  const { data, error } = await supabase.storage
                                    .from('setfiles')
                                    .download(f.storage_path);
                                  
                                  if (error) {
                                    const { data: { publicUrl } } = supabase.storage
                                      .from('setfiles')
                                      .getPublicUrl(f.storage_path);
                                    
                                    if (!publicUrl) {
                                      throw new Error('Could not generate download URL');
                                    }
                                    
                                    const link = document.createElement('a');
                                    link.href = publicUrl;
                                    const downloadName = f.name.toLowerCase().endsWith('.set') ? f.name : `${f.name}.set`;
                                    link.download = downloadName;
                                    link.target = '_blank';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  } else {
                                    const url = window.URL.createObjectURL(data);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    const downloadName = f.name.toLowerCase().endsWith('.set') ? f.name : `${f.name}.set`;
                                    link.download = downloadName;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                  }

                                  const { error: updateError } = await supabase
                                    .from('setfiles')
                                    .update({ downloads: f.downloads + 1 })
                                    .eq('id', f.id);

                                  if (!updateError) {
                                    setFiles(prev => prev.map(file => 
                                      file.id === f.id 
                                        ? { ...file, downloads: file.downloads + 1 }
                                        : file
                                    ));
                                  }

                                  toast({
                                    title: "Download started",
                                    description: `${f.name} is being downloaded`
                                  });
                                } catch (error) {
                                  console.error('Download failed:', error);
                                  toast({
                                    title: "Download failed",
                                    description: "An error occurred during download",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              className="relative overflow-hidden group rounded-lg"
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                color: '#ffffff',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download ({f.downloads})
                            </Button>

                            <Button 
                              variant="outline" 
                              onClick={() => {
                                const newId = expandedId === f.id ? null : f.id;
                                setExpandedId(newId);
                              }}
                              className="relative overflow-hidden group rounded-lg"
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                color: '#ffffff',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                              }}
                            >
                              {expandedId === f.id ? 'Hide Details' : 'View Details'}
                            </Button>

                            {isAdmin && (
                              <Button 
                                variant="outline" 
                                onClick={() => handleDelete(f.id, f.storage_path, f.name)}
                                className="relative overflow-hidden group rounded-lg"
                                style={{
                                  background: 'rgba(255, 0, 0, 0.1)',
                                  border: '1px solid rgba(255, 0, 0, 0.2)',
                                  backdropFilter: 'blur(10px)',
                                  color: '#ff6b6b',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)';
                                  e.currentTarget.style.border = '1px solid rgba(255, 0, 0, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)';
                                  e.currentTarget.style.border = '1px solid rgba(255, 0, 0, 0.2)';
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>

                        {expandedId === f.id && (
                          <div className="mt-4 p-4 relative overflow-hidden rounded-2xl"
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              backdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/3 to-transparent opacity-50"></div>
                            <div className="relative z-10">
                              <h4 className="font-semibold text-sm mb-3 text-white/80">Setfile Information</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                  <div>
                                    <span className="font-medium text-white/70">Strategy Name:</span>
                                    <p className="text-white">{f.name}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-white/70">Description:</span>
                                    <p className="text-white">{f.description}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-white/70">Uploaded By:</span>
                                    <p className="text-white">{f.author}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-white/70">Upload Date:</span>
                                    <p className="text-white">{new Date(f.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <div>
                                    <span className="font-medium text-white/70">Category:</span>
                                    <p className="text-white">{f.category || 'Community'}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-white/70">Risk Level:</span>
                                    <p className="text-white capitalize">{f.risk_level}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-white/70">File Size:</span>
                                    <p className="text-white">{(f.file_size / 1024).toFixed(1)} KB</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-white/70">Status:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      f.status === 'active' ? 'bg-green-500/10 text-green-400' :
                                      f.status === 'testing' ? 'bg-yellow-500/10 text-yellow-400' :
                                      'bg-red-500/10 text-red-400'
                                    }`}>
                                      {f.status}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-white/10">
                                <h5 className="font-medium text-sm mb-2 text-white/80">Statistics</h5>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div>
                                    <p className="text-2xl font-bold text-white">{f.downloads}</p>
                                    <p className="text-xs text-white/60">Downloads</p>
                                  </div>
                                  <div>
                                    <p className="text-2xl font-bold text-white">{f.averageRating ? f.averageRating.toFixed(1) : '0.0'}</p>
                                    <p className="text-xs text-white/60">Rating {f.ratingCount > 0 && `(${f.ratingCount} votes)`}</p>
                                    <div className="flex justify-center mt-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          onClick={() => handleRating(f.id, star)}
                                          disabled={ratingBusy === f.id}
                                          className={`text-xs transition-colors ${
                                            f.userRating && f.userRating >= star 
                                              ? 'text-yellow-400 hover:text-yellow-300' 
                                              : 'text-white/60 hover:text-yellow-400'
                                          } ${ratingBusy === f.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                          ★
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-2xl font-bold text-white">
                                      {f.status === 'active' ? '✓' : f.status === 'testing' ? '⏳' : '✗'}
                                    </p>
                                    <p className="text-xs text-white/60">Status</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {files.length === 0 && (
                    <div className="text-center py-12">
                      <Download className="w-12 h-12 text-white/60 mx-auto mb-4" />
                      <p className="text-white/70">No community setfiles uploaded yet.</p>
                      <p className="text-sm text-white/60 mt-1">Be the first to share a strategy!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      {uploadDialogOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Upload Setfile</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUploadDialogOpen(false)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white/70">
                    Setfile Name *
                  </label>
                  <Input
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter setfile name"
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/70">
                    Description *
                  </label>
                  <Textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your trading strategy"
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/70">
                    Discord Name (Optional)
                  </label>
                  <Input
                    value={uploadForm.discordName}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, discordName: e.target.value }))}
                    placeholder="Your Discord username"
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/70">
                    Timeframe
                  </label>
                  <Select 
                    value={uploadForm.timeframe} 
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, timeframe: value }))}
                  >
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M1">M1 (1 Minute)</SelectItem>
                      <SelectItem value="M5">M5 (5 Minutes)</SelectItem>
                      <SelectItem value="M15">M15 (15 Minutes)</SelectItem>
                      <SelectItem value="M30">M30 (30 Minutes)</SelectItem>
                      <SelectItem value="H1">H1 (1 Hour)</SelectItem>
                      <SelectItem value="H4">H4 (4 Hours)</SelectItem>
                      <SelectItem value="D1">D1 (Daily)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-white/70">
                    Risk Level
                  </label>
                  <Select 
                    value={uploadForm.riskLevel} 
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, riskLevel: value }))}
                  >
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-white/70">
                    Status
                  </label>
                  <Select 
                    value={uploadForm.status} 
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-white/60 mt-1">
                    Choose the current status of your strategy
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-white/70">
                    Setfile (.set) *
                  </label>
                  <Input
                    type="file"
                    accept=".set"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                  {selectedFile && (
                    <p className="text-xs text-white/60 mt-1">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile || !uploadForm.name || !uploadForm.description}
                    className="flex-1 relative overflow-hidden group rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      color: '#ffffff',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))';
                      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))';
                      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700
                                  bg-gradient-to-r from-transparent via-purple-500/20 to-transparent
                                  translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000
                                  pointer-events-none" />
                    {uploading ? "Uploading..." : "Upload Setfile"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setUploadDialogOpen(false)}
                    disabled={uploading}
                    className="relative overflow-hidden group rounded-lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      color: '#ffffff',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitySetfiles;
