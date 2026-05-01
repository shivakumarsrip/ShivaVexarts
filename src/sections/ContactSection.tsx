import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Instagram, Globe, MapPin, Mail, CheckCircle, Loader2 } from "lucide-react";

export default function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const contactMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setTimeout(() => setSubmitted(false), 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;
    contactMutation.mutate({ name, email, subject, message });
  };

  return (
    <section id="contact" className="relative py-20 md:py-32 bg-[#09090B] border-t border-[#27272A]">
      <div className="container-vex">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left - Contact Form */}
          <div>
            <h2 className="font-display text-[32px] sm:text-[40px] text-white mb-2">
              GET IN TOUCH
            </h2>
            <p className="font-body text-[16px] text-[#A1A1AA] mb-8">
              For commissions, collaborations, or custom artwork inquiries.
            </p>

            {submitted ? (
              <div className="bg-[#18181B] rounded-xl p-8 border border-[#16A34A]/30 text-center">
                <CheckCircle size={48} className="text-[#16A34A] mx-auto mb-4" />
                <h3 className="font-body text-[20px] font-bold text-white mb-2">
                  Message Sent!
                </h3>
                <p className="font-body text-[14px] text-[#A1A1AA]">
                  Thank you for reaching out. I will get back to you within 24-48 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label className="font-body text-[13px] text-[#A1A1AA] mb-1.5 block">
                    Name
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="bg-[#18181B] border-[#52525B] text-white placeholder:text-[#52525B] focus:border-[#F59E0B] focus:ring-[#F59E0B]/20 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <Label className="font-body text-[13px] text-[#A1A1AA] mb-1.5 block">
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-[#18181B] border-[#52525B] text-white placeholder:text-[#52525B] focus:border-[#F59E0B] focus:ring-[#F59E0B]/20 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <Label className="font-body text-[13px] text-[#A1A1AA] mb-1.5 block">
                    Subject
                  </Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger className="bg-[#18181B] border-[#52525B] text-white focus:border-[#F59E0B] focus:ring-[#F59E0B]/20 rounded-lg">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181B] border-[#52525B]">
                      <SelectItem value="Commission">Commission</SelectItem>
                      <SelectItem value="Collaboration">Collaboration</SelectItem>
                      <SelectItem value="Custom Art">Custom Art</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-body text-[13px] text-[#A1A1AA] mb-1.5 block">
                    Message
                  </Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell me about your project..."
                    rows={5}
                    className="bg-[#18181B] border-[#52525B] text-white placeholder:text-[#52525B] focus:border-[#F59E0B] focus:ring-[#F59E0B]/20 rounded-lg resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={contactMutation.isPending}
                  className="w-full bg-[#F59E0B] text-[#09090B] hover:bg-[#D97706] font-body font-semibold rounded-lg py-6 text-[14px]"
                >
                  {contactMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : null}
                  Send Message
                </Button>
              </form>
            )}
          </div>

          {/* Right - Info */}
          <div className="lg:pl-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#27272A] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Instagram size={18} className="text-[#F59E0B]" />
                </div>
                <div>
                  <h4 className="font-body text-[14px] font-medium text-white mb-1">Instagram</h4>
                  <a
                    href="https://www.instagram.com/shiva_vexarts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-[14px] text-[#A1A1AA] hover:text-[#F59E0B] transition-colors"
                  >
                    @shiva_vexarts
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#27272A] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe size={18} className="text-[#F59E0B]" />
                </div>
                <div>
                  <h4 className="font-body text-[14px] font-medium text-white mb-1">Behance</h4>
                  <a
                    href="https://www.behance.net/Sivadigitalart"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-[14px] text-[#A1A1AA] hover:text-[#F59E0B] transition-colors"
                  >
                    behance.net/Sivadigitalart
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#27272A] rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-[#F59E0B]" />
                </div>
                <div>
                  <h4 className="font-body text-[14px] font-medium text-white mb-1">Location</h4>
                  <p className="font-body text-[14px] text-[#A1A1AA]">
                    Chennai, Tamil Nadu, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#27272A] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-[#F59E0B]" />
                </div>
                <div>
                  <h4 className="font-body text-[14px] font-medium text-white mb-1">Email</h4>
                  <p className="font-body text-[14px] text-[#A1A1AA]">
                    Available on request via contact form
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-[#18181B] rounded-xl border border-[#27272A]">
              <p className="font-body text-[13px] text-[#A1A1AA]">
                I typically respond within <span className="text-[#F59E0B]">24-48 hours</span>.
                For urgent inquiries, please reach out via Instagram direct message.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
