"use client";

import React, { useState, useEffect } from "react";
import { Announcement } from "@/types";
import { AnnouncementService } from "@/lib/firebase/announcement-service";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  Megaphone,
  Plus,
  Pin,
  Calendar,
  Sparkles,
  Trash2,
} from "lucide-react";

interface AnnouncementManagerProps {
  initialAnnouncements: Announcement[];
  onRefresh?: () => void;
}

export function AnnouncementManager({ initialAnnouncements, onRefresh }: AnnouncementManagerProps) {
  const { user, currentRole } = useAuth();
  const { success, error } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Announcement["category"]>("general");
  const [priority, setPriority] = useState<Announcement["priority"]>("medium");
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    setAnnouncements(initialAnnouncements);
  }, [initialAnnouncements]);

  const refreshData = async () => {
    try {
      const list = await AnnouncementService.getAnnouncements();
      setAnnouncements(list);
    } catch {}
  };

  useEffect(() => {
    const handleStoreUpdate = () => refreshData();
    window.addEventListener("coralgenz_store_updated", handleStoreUpdate);
    return () => window.removeEventListener("coralgenz_store_updated", handleStoreUpdate);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      error("Missing Information", "Please provide announcement title and content.");
      return;
    }

    const res = await AnnouncementService.addAnnouncement({
      organizationId: "org-coralgenz-01",
      title,
      content,
      category,
      priority,
      authorId: user?.id || "usr-superadmin-01",
      authorName: user?.displayName || "Super Admin",
      authorRole: currentRole.replace("_", " ").toUpperCase(),
      isPinned,
    });

    if (res) {
      success("Announcement Broadcasted", "Published company-wide notification on the server.");
      setShowModal(false);
      setTitle("");
      setContent("");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
      }
      refreshData();
      onRefresh?.();
    } else {
      error("Error", "Failed to save announcement to server.");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete announcement "${title}"?`)) return;
    const res = await AnnouncementService.deleteAnnouncement(id);
    if (res) {
      success("Announcement Deleted", "Removed announcement from server.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("coralgenz_store_updated"));
      }
      refreshData();
      onRefresh?.();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Company Announcements
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Broadcast official company news, holiday schedules, payroll disbursements, and policies.
          </p>
        </div>

        {currentRole !== "employee" && (
          <Button
            variant="coral"
            size="sm"
            onClick={() => setShowModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Post Announcement
          </Button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <Card
            key={ann.id}
            hoverEffect
            className={ann.isPinned ? "border-coral-300 dark:border-coral-800/80 shadow-md" : ""}
          >
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {ann.isPinned && (
                    <Badge variant="coral" size="sm" className="gap-1">
                      <Pin className="w-3 h-3" /> Pinned
                    </Badge>
                  )}
                  <Badge variant="secondary" size="sm" className="capitalize">
                    {ann.category}
                  </Badge>
                </div>
                <CardTitle className="text-base pt-1">{ann.title}</CardTitle>
              </div>

              <span className="text-xs text-slate-400">
                {formatDate(ann.publishedAt, "dd MMM yyyy, hh:mm a")}
              </span>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Posted by <span className="font-semibold text-slate-700 dark:text-slate-300">{ann.authorName}</span> ({ann.authorRole})
                </span>
                {currentRole !== "employee" && (
                  <button
                    type="button"
                    onClick={() => handleDelete(ann.id, ann.title)}
                    className="text-red-500 hover:text-red-700 p-1 transition-colors flex items-center gap-1"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL: POST ANNOUNCEMENT */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Publish Announcement"
        description="Broadcast an official notification to all employees"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Announcement Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual Company Offsite & Celebration"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Announcement["category"])}
            >
              <option value="general">General Notice</option>
              <option value="holiday">Holiday Notice</option>
              <option value="payroll">Payroll Alert</option>
              <option value="event">Company Event</option>
              <option value="policy">Policy Update</option>
            </Select>

            <Select
              label="Priority Level"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Announcement["priority"])}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Announcement Message
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the full broadcast message..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-coral-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinned-checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded text-coral-500 focus:ring-coral-500"
            />
            <label htmlFor="pinned-checkbox" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Pin to top of employee dashboards
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="coral" size="sm">
              Broadcast Message
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
