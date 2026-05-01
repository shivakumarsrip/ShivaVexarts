import { useEffect } from "react";
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
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, ShoppingBag, MessageSquare, ArrowLeft } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-[#F59E0B]/15 text-[#F59E0B]",
  paid: "bg-[#16A34A]/15 text-[#16A34A]",
  processing: "bg-blue-500/15 text-blue-400",
  shipped: "bg-purple-500/15 text-purple-400",
  delivered: "bg-gray-500/15 text-gray-400",
  cancelled: "bg-[#DC2626]/15 text-[#DC2626]",
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, isLoading, navigate]);

  const { data: allOrders, isLoading: ordersLoading } = trpc.order.listAll.useQuery(undefined, {
    enabled: isAdmin,
  });

  const { data: allContacts, isLoading: contactsLoading } = trpc.contact.listAll.useQuery(undefined, {
    enabled: isAdmin,
  });

  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      utils.order.listAll.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 size={32} className="text-[#F59E0B] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#09090B] pt-20 pb-12">
      <div className="container-vex max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/")}
            className="text-[#A1A1AA] hover:text-[#F59E0B] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={24} className="text-[#F59E0B]" />
            <h1 className="font-display text-[32px] text-white">Admin Dashboard</h1>
          </div>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-[#18181B] border border-[#27272A]">
            <TabsTrigger value="orders" className="data-[state=active]:bg-[#F59E0B] data-[state=active]:text-[#09090B]">
              <ShoppingBag size={14} className="mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-[#F59E0B] data-[state=active]:text-[#09090B]">
              <MessageSquare size={14} className="mr-2" />
              Messages
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="bg-[#18181B] rounded-2xl border border-[#27272A] overflow-hidden">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={24} className="text-[#F59E0B] animate-spin" />
                </div>
              ) : !allOrders?.length ? (
                <div className="text-center py-16">
                  <ShoppingBag size={40} className="text-[#52525B] mx-auto mb-3" />
                  <p className="font-body text-[#A1A1AA]">No orders yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#27272A] hover:bg-transparent">
                        <TableHead className="text-[#A1A1AA] font-body">Order ID</TableHead>
                        <TableHead className="text-[#A1A1AA] font-body">Customer</TableHead>
                        <TableHead className="text-[#A1A1AA] font-body">Items</TableHead>
                        <TableHead className="text-[#A1A1AA] font-body">Total</TableHead>
                        <TableHead className="text-[#A1A1AA] font-body">Status</TableHead>
                        <TableHead className="text-[#A1A1AA] font-body">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allOrders.map((order) => (
                        <TableRow key={order.id} className="border-[#27272A] hover:bg-[#27272A]/30">
                          <TableCell className="font-mono text-[13px] text-[#F59E0B]">
                            {order.orderId}
                          </TableCell>
                          <TableCell>
                            <p className="font-body text-[13px] text-white">{order.customerName}</p>
                            <p className="font-body text-[12px] text-[#A1A1AA]">{order.customerEmail}</p>
                          </TableCell>
                          <TableCell className="font-body text-[13px] text-[#A1A1AA]">
                            {order.items?.length || 0} items
                          </TableCell>
                          <TableCell className="font-mono text-[13px] text-white">
                            Rs. {order.totalAmount?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.status || "pending"}
                              onValueChange={(status) =>
                                updateStatus.mutate({
                                  orderId: order.orderId,
                                  status: status as "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled",
                                })
                              }
                            >
                              <SelectTrigger className="w-[130px] h-7 bg-transparent border-0">
                                <Badge className={`${statusColors[order.status || "pending"]} border-0 font-body text-[11px]`}>
                                  {order.status}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent className="bg-[#18181B] border-[#27272A]">
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="font-mono text-[12px] text-[#A1A1AA]">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            <div className="bg-[#18181B] rounded-2xl border border-[#27272A] overflow-hidden">
              {contactsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={24} className="text-[#F59E0B] animate-spin" />
                </div>
              ) : !allContacts?.length ? (
                <div className="text-center py-16">
                  <MessageSquare size={40} className="text-[#52525B] mx-auto mb-3" />
                  <p className="font-body text-[#A1A1AA]">No messages yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#27272A] hover:bg-transparent">
                        <TableHead className="text-[#A1A1AA] font-body">Name</TableHead>
                        <TableHead className="text-[#A1A1AA] font-body">Email</TableHead>
                        <TableHead className="text-[#A1A1AA] font-body">Subject</TableHead>
                        <TableHead className="text-[#A1A1AA] font-body">Message</TableHead>
                        <TableHead className="text-[#A1A1AA] font-body">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allContacts.map((contact) => (
                        <TableRow key={contact.id} className="border-[#27272A] hover:bg-[#27272A]/30">
                          <TableCell className="font-body text-[13px] text-white">{contact.name}</TableCell>
                          <TableCell className="font-body text-[13px] text-[#A1A1AA]">{contact.email}</TableCell>
                          <TableCell>
                            <Badge className="bg-[#27272A] text-[#F59E0B] border-0 font-body text-[11px]">
                              {contact.subject}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-body text-[13px] text-[#A1A1AA] max-w-[300px] truncate">
                            {contact.message}
                          </TableCell>
                          <TableCell className="font-mono text-[12px] text-[#A1A1AA]">
                            {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
