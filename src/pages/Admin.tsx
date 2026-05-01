import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, ShoppingBag, MessageSquare, ArrowLeft, Image as ImageIcon, Edit2, LayoutDashboard, Plus, Upload, X, CheckCircle2, LayoutGrid, List, Search } from "lucide-react";
import type { Artwork, Contact, Order } from "@db/schema";
import { getArtworkImageFallback } from "@/lib/artwork-images";

const statusColors: Record<string, string> = {
  pending: "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/20",
  paid: "bg-[#16A34A]/15 text-[#16A34A] border border-[#16A34A]/20",
  processing: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  shipped: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  delivered: "bg-gray-500/15 text-gray-400 border border-gray-500/20",
  cancelled: "bg-[#DC2626]/15 text-[#DC2626] border border-[#DC2626]/20",
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Artwork>>({});
  const [isAddingNewCollection, setIsAddingNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("inventory");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, isLoading, navigate]);

  const { data: allArtworks, isLoading: artworksLoading } = trpc.artwork.listAll.useQuery(undefined, {
    enabled: isAdmin,
  });

  const { data: allOrders, isLoading: ordersLoading } = trpc.order.listAll.useQuery(undefined, {
    enabled: isAdmin,
  });

  const { data: allContacts, isLoading: contactsLoading } = trpc.contact.listAll.useQuery(undefined, {
    enabled: isAdmin,
  });

  // ── Search Filtering Logic ──
  const filteredArtworks = useMemo(() => {
    if (!allArtworks) return [];
    if (!searchQuery) return allArtworks;
    const q = searchQuery.toLowerCase();
    return allArtworks.filter((a: Artwork) => 
      a.title.toLowerCase().includes(q) || 
      a.collection.toLowerCase().includes(q) || 
      a.category.toLowerCase().includes(q)
    );
  }, [allArtworks, searchQuery]);

  const filteredOrders = useMemo(() => {
    if (!allOrders) return [];
    if (!searchQuery) return allOrders;
    const q = searchQuery.toLowerCase();
    return allOrders.filter((o: Order) => 
      o.customerName.toLowerCase().includes(q) || 
      o.customerEmail.toLowerCase().includes(q) || 
      o.orderId.toLowerCase().includes(q)
    );
  }, [allOrders, searchQuery]);

  const filteredContacts = useMemo(() => {
    if (!allContacts) return [];
    if (!searchQuery) return allContacts;
    const q = searchQuery.toLowerCase();
    return allContacts.filter((c: Contact) => 
      c.name.toLowerCase().includes(q) || 
      c.email.toLowerCase().includes(q) || 
      c.subject.toLowerCase().includes(q) || 
      c.message.toLowerCase().includes(q)
    );
  }, [allContacts, searchQuery]);

  const existingCollections: string[] = Array.from(
    new Set<string>(allArtworks?.map((a: Artwork) => a.collection) || []),
  );

  const createArtwork = trpc.artwork.create.useMutation({
    onSuccess: () => {
      utils.artwork.listAll.invalidate();
      utils.artwork.list.invalidate();
      resetForm();
    },
  });

  const updateArtwork = trpc.artwork.update.useMutation({
    onSuccess: () => {
      utils.artwork.listAll.invalidate();
      utils.artwork.list.invalidate();
      setEditingArtwork(null);
    },
  });

  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      utils.order.listAll.invalidate();
    },
  });

  const resetForm = () => {
    setIsAddingNew(false);
    setEditingArtwork(null);
    setEditForm({});
    setUploadFile(null);
    setUploadPreview(null);
    setUploading(false);
    setIsAddingNewCollection(false);
    setNewCollectionName("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setUploadPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAndSave = async () => {
    if (!uploadFile || !editForm.title || !editForm.category) return;
    
    setUploading(true);
    const finalCollection = isAddingNewCollection ? newCollectionName : editForm.collection;
    if (!finalCollection) return;

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const blob = await response.json();

      await createArtwork.mutateAsync({
        title: editForm.title,
        category: editForm.category,
        collection: finalCollection,
        image: blob.url,
        basePrice: editForm.basePrice || 2000,
        description: editForm.description || "",
      });

    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 size={32} className="text-[#F59E0B] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#09090B] pt-24 pb-16">
      <div className="container-vex max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#A1A1AA] hover:text-[#F59E0B] hover:border-[#F59E0B]/50 transition-all group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#F59E0B]">
                <Shield size={18} />
                <span className="font-body text-[12px] font-bold tracking-widest uppercase">Admin Terminal</span>
              </div>
              <h1 className="font-display text-[32px] md:text-[40px] text-white">Command Center</h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-[320px] group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#71717A] group-focus-within:text-[#F59E0B] transition-colors">
                <Search size={18} />
              </div>
              <Input 
                placeholder="Search everything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 pr-10 bg-[#18181B] border-[#27272A] text-white placeholder:text-[#52525B] focus:border-[#F59E0B]/50 focus:ring-[#F59E0B]/10 rounded-2xl transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-4 flex items-center text-[#71717A] hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <Button 
              onClick={() => setIsAddingNew(true)}
              className="w-full sm:w-auto bg-[#F59E0B] text-[#09090B] hover:bg-[#D97706] font-bold h-14 px-8 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <Plus size={20} strokeWidth={3} />
              Import Art
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex items-center justify-between w-full">
            <TabsList className="bg-[#18181B] border border-[#27272A] p-1.5 h-14 rounded-xl inline-flex items-center">
              <TabsTrigger 
                value="inventory" 
                className="px-6 h-full rounded-lg font-body font-bold text-[14px] text-[#A1A1AA] hover:text-white data-[state=active]:bg-[#F59E0B] data-[state=active]:text-[#09090B] transition-all"
              >
                <ImageIcon size={16} className="mr-2" />
                Inventory
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="px-6 h-full rounded-lg font-body font-bold text-[14px] text-[#A1A1AA] hover:text-white data-[state=active]:bg-[#F59E0B] data-[state=active]:text-[#09090B] transition-all"
              >
                <ShoppingBag size={16} className="mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger 
                value="contacts" 
                className="px-6 h-full rounded-lg font-body font-bold text-[14px] text-[#A1A1AA] hover:text-white data-[state=active]:bg-[#F59E0B] data-[state=active]:text-[#09090B] transition-all"
              >
                <MessageSquare size={16} className="mr-2" />
                Messages
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 flex justify-end">
              {activeTab === "inventory" && (
                <div className="flex bg-[#18181B] border border-[#27272A] p-1.5 rounded-xl h-14 w-[120px] shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                  <button 
                    onClick={() => setViewMode("list")}
                    className={`flex-1 flex items-center justify-center rounded-lg transition-all ${viewMode === "list" ? "bg-[#27272A] text-[#F59E0B] shadow-inner" : "text-[#52525B] hover:text-white"}`}
                  >
                    <List size={20} />
                  </button>
                  <button 
                    onClick={() => setViewMode("grid")}
                    className={`flex-1 flex items-center justify-center rounded-lg transition-all ${viewMode === "grid" ? "bg-[#27272A] text-[#F59E0B] shadow-inner" : "text-[#52525B] hover:text-white"}`}
                  >
                    <LayoutGrid size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <TabsContent value="inventory" className="focus-visible:outline-none m-0">
            {artworksLoading ? (
              <div className="flex items-center justify-center py-32 bg-[#18181B] rounded-2xl border border-[#27272A]">
                <Loader2 size={32} className="text-[#F59E0B] animate-spin" />
              </div>
            ) : viewMode === "list" ? (
              <div className="bg-[#18181B] rounded-2xl border border-[#27272A] overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#09090B]">
                      <TableRow className="border-[#27272A] hover:bg-transparent h-16">
                        <TableHead className="text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider pl-8">Preview</TableHead>
                        <TableHead className="text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider">Title</TableHead>
                        <TableHead className="text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider">Collection</TableHead>
                        <TableHead className="text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider">Category</TableHead>
                        <TableHead className="text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider">Price</TableHead>
                        <TableHead className="text-right pr-8 text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredArtworks?.map((artwork: Artwork) => (
                        <TableRow key={artwork.id} className="border-[#27272A] hover:bg-[#27272A]/40 transition-colors h-20 group">
                          <TableCell className="pl-8">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/5 group-hover:border-[#F59E0B]/30 transition-colors">
                              <img
                                src={artwork.image}
                                className="w-full h-full object-cover"
                                alt=""
                                onError={(event) => {
                                  event.currentTarget.src = getArtworkImageFallback(artwork.image);
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-body text-[14px] text-white font-bold">{artwork.title}</TableCell>
                          <TableCell>
                            <Badge className="bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 font-body text-[11px] capitalize px-3 py-1">
                              {artwork.collection.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-body text-[14px] text-[#A1A1AA]">{artwork.category}</TableCell>
                          <TableCell className="font-mono text-[14px] text-white font-bold">Rs. {artwork.basePrice}</TableCell>
                          <TableCell className="text-right pr-8">
                            <Button 
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingArtwork(artwork);
                                setEditForm(artwork);
                              }}
                              className="text-[#52525B] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-all rounded-xl"
                            >
                              <Edit2 size={18} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredArtworks?.map((artwork: Artwork) => (
                  <div 
                    key={artwork.id} 
                    className="group bg-[#18181B] border border-[#27272A] rounded-3xl overflow-hidden hover:border-[#F59E0B] transition-all duration-500 shadow-xl hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)] hover:-translate-y-2 flex flex-col"
                  >
                    <div className="relative aspect-square overflow-hidden bg-[#18181B]">
                      {/* Fixed: Initial scale 1.02 to seal edge gaps + hardware acceleration */}
                      <img 
                        src={artwork.image} 
                        className="w-full h-full object-cover scale-[1.02] transition-transform duration-700 ease-out group-hover:scale-110 will-change-transform transform-gpu" 
                        alt={artwork.title} 
                        onError={(event) => {
                          event.currentTarget.src = getArtworkImageFallback(artwork.image);
                        }}
                      />
                      
                      {/* Full coverage gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#18181B] via-[#09090B]/30 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none" />
                      
                      <button 
                        onClick={() => {
                          setEditingArtwork(artwork);
                          setEditForm(artwork);
                        }}
                        className="absolute bottom-6 right-6 w-12 h-12 rounded-2xl bg-[#F59E0B] text-[#09090B] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-75 shadow-[0_10px_20px_rgba(245,158,11,0.3)] active:scale-90 z-20"
                      >
                        <Edit2 size={22} strokeWidth={2.5} />
                      </button>

                      <div className="absolute top-4 left-4 z-10">
                        <Badge variant="outline" className="bg-[#09090B]/80 backdrop-blur-md text-[#F59E0B] border-[#F59E0B]/30 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full group-hover:bg-[#F59E0B] group-hover:text-[#09090B] transition-colors duration-500">
                          {artwork.collection.split("_")[0]}
                        </Badge>
                      </div>
                    </div>

                    {/* Fixed: Seam overlap using negative margin to prevent sub-pixel gaps */}
                    <div className="p-6 space-y-4 bg-[#18181B] relative z-10 -mt-0.5 pt-6.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="text-white font-bold text-[17px] leading-tight group-hover:text-[#F59E0B] transition-colors duration-300">{artwork.title}</h3>
                          <p className="text-[#71717A] text-[12px] font-medium uppercase tracking-wider">{artwork.category}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[#F59E0B] font-mono text-[16px] font-bold block">₹{artwork.basePrice}</span>
                        </div>
                      </div>
                      
                      <div className="pt-2 flex items-center gap-2">
                        <div className="h-px flex-1 bg-[#27272A] group-hover:bg-[#F59E0B]/20 transition-colors" />
                        <LayoutDashboard size={14} className="text-[#3F3F46] group-hover:text-[#F59E0B]/40 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!artworksLoading && filteredArtworks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 bg-[#18181B] rounded-2xl border border-[#27272A]">
                <Search size={48} className="text-[#27272A] mb-4" />
                <p className="text-[#71717A] font-body text-[16px]">No results found for "<span className="text-white">{searchQuery}</span>"</p>
              </div>
            )}
          </TabsContent>

          {/* Tab contents for Orders and Messages remain same */}
          <TabsContent value="orders" className="focus-visible:outline-none m-0">
            <div className="bg-[#18181B] rounded-2xl border border-[#27272A] overflow-hidden shadow-2xl">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={32} className="text-[#F59E0B] animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#09090B]">
                      <TableRow className="border-[#27272A] hover:bg-transparent h-16">
                        <TableHead className="text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider pl-8">Order ID</TableHead>
                        <TableHead className="text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider">Customer</TableHead>
                        <TableHead className="text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider">Amount</TableHead>
                        <TableHead className="text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-right pr-8 text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider">Update</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders?.map((order) => (
                        <TableRow key={order.id} className="border-[#27272A] hover:bg-[#27272A]/40 transition-colors h-20">
                          <TableCell className="pl-8 font-mono text-[13px] text-white font-bold">{order.orderId}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-white font-bold text-[14px]">{order.customerName}</span>
                              <span className="text-[#71717A] text-[12px]">{order.customerEmail}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[14px] text-white">Rs. {order.totalAmount}</TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[order.status] || ""} capitalize px-3 py-1 font-body text-[11px]`}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <Select 
                              defaultValue={order.status} 
                              onValueChange={(val) => updateStatus.mutate({ orderId: order.orderId, status: val as any })}
                            >
                              <SelectTrigger className="w-[140px] h-10 bg-[#09090B] border-[#27272A] text-white rounded-xl focus:ring-[#F59E0B]/20 ml-auto">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#18181B] border-[#27272A] text-white">
                                {Object.keys(statusColors).map(status => (
                                  <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            {!ordersLoading && filteredOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 bg-[#18181B] rounded-2xl border border-[#27272A]">
                <Search size={48} className="text-[#27272A] mb-4" />
                <p className="text-[#71717A] font-body text-[16px]">No orders found for "<span className="text-white">{searchQuery}</span>"</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="focus-visible:outline-none m-0">
            <div className="bg-[#18181B] rounded-2xl border border-[#27272A] overflow-hidden shadow-2xl">
              {contactsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={32} className="text-[#F59E0B] animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#09090B]">
                      <TableRow className="border-[#27272A] hover:bg-transparent h-16">
                        <TableHead className="text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider pl-8">Date</TableHead>
                        <TableHead className="text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider">From</TableHead>
                        <TableHead className="text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider">Subject</TableHead>
                        <TableHead className="text-[#71717A] font-body font-bold text-[12px] uppercase tracking-wider pr-8">Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts?.map((contact: Contact) => (
                        <TableRow key={contact.id} className="border-[#27272A] hover:bg-[#27272A]/40 transition-colors align-top">
                          <TableCell className="pl-8 py-6 text-[#71717A] text-[12px] font-mono">
                            {new Date(contact.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex flex-col">
                              <span className="text-white font-bold text-[14px]">{contact.name}</span>
                              <span className="text-[#71717A] text-[12px]">{contact.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 text-white font-bold text-[14px]">{contact.subject}</TableCell>
                          <TableCell className="py-6 pr-8 text-[#A1A1AA] text-[13px] leading-relaxed max-w-md">
                            {contact.message}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            {!contactsLoading && filteredContacts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 bg-[#18181B] rounded-2xl border border-[#27272A]">
                <Search size={48} className="text-[#27272A] mb-4" />
                <p className="text-[#71717A] font-body text-[16px]">No messages found for "<span className="text-white">{searchQuery}</span>"</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!editingArtwork} onOpenChange={() => setEditingArtwork(null)}>
        <DialogContent className="bg-[#18181B] border border-[#3F3F46] text-white sm:max-w-[500px] p-0 overflow-hidden rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="bg-gradient-to-br from-[#18181B] to-[#09090B] p-8">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-3 text-[#F59E0B] mb-2">
                <Edit2 size={16} />
                <span className="font-body text-[11px] font-bold tracking-[0.2em] uppercase">Modify Artwork</span>
              </div>
              <DialogTitle className="font-display text-[32px] text-white leading-tight">Edit Details</DialogTitle>
              <DialogDescription className="text-[#71717A] font-body text-[14px] mt-2">
                Updating: <span className="text-white font-bold">"{editingArtwork?.title}"</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[#A1A1AA] text-[12px] font-bold uppercase tracking-wider pl-1">Title</Label>
                  <Input
                    id="title"
                    value={editForm.title || ""}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="h-12 bg-[#09090B] border-[#27272A] text-white placeholder:text-[#3F3F46] focus:border-[#F59E0B] focus:ring-[#F59E0B]/20 rounded-xl transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between pl-1">
                    <Label htmlFor="collection" className="text-[#A1A1AA] text-[12px] font-bold uppercase tracking-wider">Collection</Label>
                    <button 
                      onClick={() => setIsAddingNewCollection(!isAddingNewCollection)}
                      className="text-[#F59E0B] hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                    >
                      {isAddingNewCollection ? <ArrowLeft size={10} /> : <Plus size={10} />}
                      {isAddingNewCollection ? "Use Existing" : "New Collection"}
                    </button>
                  </div>
                  
                  {isAddingNewCollection ? (
                    <Input
                      placeholder="Enter new collection name..."
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      className="h-12 bg-[#09090B] border-[#F59E0B]/50 text-white placeholder:text-[#3F3F46] focus:border-[#F59E0B] rounded-xl transition-all"
                      autoFocus
                    />
                  ) : (
                    <Select 
                      value={editForm.collection} 
                      onValueChange={(val) => setEditForm({ ...editForm, collection: val as any })}
                    >
                      <SelectTrigger className="h-12 bg-[#09090B] border-[#27272A] text-white rounded-xl focus:ring-[#F59E0B]/20">
                        <SelectValue placeholder="Select collection" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#18181B] border-[#27272A] text-white shadow-2xl rounded-xl">
                        {existingCollections.map(col => (
                          <SelectItem key={col} value={col} className="focus:bg-[#F59E0B] focus:text-[#09090B] py-3 cursor-pointer capitalize">
                            {col.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[#A1A1AA] text-[12px] font-bold uppercase tracking-wider pl-1">Category</Label>
                    <Input
                      id="category"
                      value={editForm.category || ""}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="h-12 bg-[#09090B] border-[#27272A] text-white rounded-xl focus:border-[#F59E0B] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-[#A1A1AA] text-[12px] font-bold uppercase tracking-wider pl-1">Price (Rs.)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={editForm.basePrice || 0}
                      onChange={(e) => setEditForm({ ...editForm, basePrice: parseInt(e.target.value) })}
                      className="h-12 bg-[#09090B] border-[#27272A] text-white rounded-xl focus:border-[#F59E0B] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-10 gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setEditingArtwork(null)}
                className="flex-1 h-12 text-[#71717A] hover:text-white hover:bg-white/5 font-bold rounded-xl transition-all"
              >
                Discard
              </Button>
              <Button 
                onClick={() => {
                  if (!editForm.id) return;
                  const finalCollection = isAddingNewCollection ? newCollectionName : editForm.collection;
                  updateArtwork.mutate({
                    id: editForm.id,
                    title: editForm.title,
                    category: editForm.category,
                    collection: finalCollection,
                    basePrice: editForm.basePrice,
                  });
                }}
                className="flex-[2] h-12 bg-[#F59E0B] text-[#09090B] hover:bg-[#D97706] font-bold rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all active:scale-[0.98]"
                disabled={updateArtwork.isPending}
              >
                {updateArtwork.isPending ? <Loader2 size={18} className="animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingNew} onOpenChange={resetForm}>
        <DialogContent className="bg-[#18181B] border border-[#3F3F46] text-white sm:max-w-[600px] p-0 overflow-hidden rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="bg-gradient-to-br from-[#18181B] to-[#09090B] p-8">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-3 text-[#F59E0B] mb-2">
                <Upload size={16} />
                <span className="font-body text-[11px] font-bold tracking-[0.2em] uppercase">Add to Gallery</span>
              </div>
              <DialogTitle className="font-display text-[32px] text-white leading-tight">Import Artwork</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* File Upload Area */}
              <div className="space-y-4">
                <Label className="text-[#A1A1AA] text-[12px] font-bold uppercase tracking-wider pl-1">Image File</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                    uploadPreview ? "border-[#F59E0B]/50 bg-[#F59E0B]/5" : "border-[#27272A] hover:border-[#3F3F46] bg-[#09090B]"
                  }`}
                >
                  {uploadPreview ? (
                    <img src={uploadPreview} className="w-full h-full object-cover rounded-xl" alt="Preview" />
                  ) : (
                    <>
                      <ImageIcon size={40} className="text-[#3F3F46] mb-3" />
                      <p className="text-[#71717A] text-[13px] font-medium text-center px-4">Click or drag to upload image</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
                {uploadFile && (
                  <div className="flex items-center gap-2 text-[#16A34A] text-[12px] font-bold bg-[#16A34A]/10 p-2 rounded-lg border border-[#16A34A]/20">
                    <CheckCircle2 size={14} />
                    <span className="truncate">{uploadFile.name}</span>
                  </div>
                )}
              </div>

              {/* Form Data Area */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[#A1A1AA] text-[12px] font-bold uppercase tracking-wider pl-1">Title</Label>
                  <Input
                    placeholder="E.g. The Dark Knight"
                    value={editForm.title || ""}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="h-11 bg-[#09090B] border-[#27272A] rounded-xl focus:border-[#F59E0B]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[#A1A1AA] text-[12px] font-bold uppercase tracking-wider">Collection</Label>
                    <button 
                      onClick={() => setIsAddingNewCollection(!isAddingNewCollection)}
                      className="text-[#F59E0B] text-[10px] font-bold uppercase"
                    >
                      {isAddingNewCollection ? "Use Existing" : "+ New"}
                    </button>
                  </div>
                  {isAddingNewCollection ? (
                    <Input
                      placeholder="New collection name..."
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      className="h-11 bg-[#09090B] border-[#F59E0B]/50 rounded-xl"
                    />
                  ) : (
                    <Select value={editForm.collection} onValueChange={(val) => setEditForm({...editForm, collection: val})}>
                      <SelectTrigger className="h-11 bg-[#09090B] border-[#27272A] rounded-xl">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#18181B] border-[#27272A] text-white">
                        {existingCollections.map(col => (
                          <SelectItem key={col} value={col} className="capitalize">{col.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A1A1AA] text-[12px] font-bold uppercase tracking-wider pl-1">Category</Label>
                  <Input
                    placeholder="E.g. DC Comics"
                    value={editForm.category || ""}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="h-11 bg-[#09090B] border-[#27272A] rounded-xl focus:border-[#F59E0B]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A1A1AA] text-[12px] font-bold uppercase tracking-wider pl-1">Price (Rs.)</Label>
                  <Input
                    type="number"
                    value={editForm.basePrice || 2000}
                    onChange={(e) => setEditForm({ ...editForm, basePrice: parseInt(e.target.value) })}
                    className="h-11 bg-[#09090B] border-[#27272A] rounded-xl focus:border-[#F59E0B]"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-10 gap-3">
              <Button 
                variant="ghost" 
                onClick={resetForm}
                className="flex-1 h-12 text-[#71717A] hover:text-white rounded-xl"
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUploadAndSave}
                className="flex-[2] h-12 bg-[#F59E0B] text-[#09090B] hover:bg-[#D97706] font-bold rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                disabled={uploading || !uploadFile || !editForm.title || !editForm.category}
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Uploading Art...</span>
                  </div>
                ) : (
                  "Import & Launch"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
