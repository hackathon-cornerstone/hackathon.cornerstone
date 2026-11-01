"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Megaphone, MessageSquare, Users, FolderOpen,
  BarChart3, Plus, Pin, Pencil, Trash2, X, Send, RefreshCw
} from "lucide-react";

type Community = {
  id: string;
  community_name: string;
  description: string | null;
  status: string;
  activity?: {
    title: string;
    category: string;
    activity_date: string;
    venue: string;
  } | null;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
};

type Message = {
  id: string;
  message: string;
  created_at: string;
  updated_at: string;
};

type CommunityMember = {
  id: string;
  person_id: string;
  member_role: string;
  membership_status: string;
  invited_at: string;
  joined_at: string | null;
  person: {
    id: string;
    person_type: string;
    full_name: string;
    email: string;
    phone?: string;
    student_id?: string;
    student_class?: string;
    section?: string;
    employee_id?: string;
    designation?: string;
    department?: string;
    status: string;
  } | null;
};

type DirectoryPerson = {
  id: string;
  person_type: string;
  full_name: string;
  email: string;
  student_id?: string;
  employee_id?: string;
  status: string;
};

type Tab = "overview" | "announcements" | "discussions" | "members" | "resources" | "polls";

export default function CommunityWorkspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [community, setCommunity] = useState<Community | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [directoryPeople, setDirectoryPeople] = useState<DirectoryPerson[]>([]);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedMemberRole, setSelectedMemberRole] = useState("student");
  const [memberSearch, setMemberSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<string | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");

  const [messageText, setMessageText] = useState("");
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");

  const loadCommunity = useCallback(async () => {
    const response = await fetch("/api/admin/communities");
    if (!response.ok) throw new Error("Unable to load community.");
    const data = await response.json();
    const found = (data.communities || []).find(
      (item: Community) => item.id === id
    );
    if (!found) throw new Error("Community not found.");
    setCommunity(found);
  }, [id]);

  const loadAnnouncements = useCallback(async () => {
    const response = await fetch(
      `/api/admin/communities/announcements?community_id=${encodeURIComponent(id)}`
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load announcements.");
    setAnnouncements(data.announcements || []);
  }, [id]);

  const loadMessages = useCallback(async () => {
    const response = await fetch(
      `/api/admin/communities/messages?community_id=${encodeURIComponent(id)}`
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load discussions.");
    setMessages(data.messages || []);
  }, [id]);

  const loadMembers = useCallback(async () => {
  const response = await fetch(
    `/api/admin/communities/members?community_id=${encodeURIComponent(id)}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to load community members.");
  }

  setMembers(data.members || []);
}, [id]);

const loadDirectoryPeople = useCallback(async () => {
  const response = await fetch("/api/admin/people");

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to load People directory.");
  }

  setDirectoryPeople(
    (data.people || []).filter(
      (person: DirectoryPerson) => person.status === "active"
    )
  );
}, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        await loadCommunity();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load community.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [loadCommunity]);

  useEffect(() => {
  if (activeTab === "announcements") {
    loadAnnouncements().catch((err) =>
      setError(err instanceof Error ? err.message : "Unable to load announcements.")
    );
  }

  if (activeTab === "discussions") {
    loadMessages().catch((err) =>
      setError(err instanceof Error ? err.message : "Unable to load discussions.")
    );
  }

  if (activeTab === "members") {
    Promise.all([
      loadMembers(),
      loadDirectoryPeople(),
    ]).catch((err) =>
      setError(err instanceof Error ? err.message : "Unable to load members.")
    );
  }
}, [
  activeTab,
  loadAnnouncements,
  loadMessages,
  loadMembers,
  loadDirectoryPeople,
]);
  async function saveAnnouncement() {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      setError("Enter both an announcement title and content.");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/communities/announcements", {
        method: editingAnnouncement ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingAnnouncement
            ? {
                id: editingAnnouncement,
                community_id: id,
                title: announcementTitle,
                content: announcementContent,
              }
            : {
                community_id: id,
                title: announcementTitle,
                content: announcementContent,
              }
        ),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save announcement.");

      setAnnouncementTitle("");
      setAnnouncementContent("");
      setEditingAnnouncement(null);
      setShowAnnouncementForm(false);
      await loadAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save announcement.");
    } finally {
      setActionLoading(false);
    }
  }

  async function togglePin(item: Announcement) {
    setActionLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/communities/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          community_id: id,
          is_pinned: !item.is_pinned,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update pin.");
      await loadAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update pin.");
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteAnnouncement(itemId: string) {
    if (!window.confirm("Delete this announcement?")) return;

    setActionLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/communities/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, community_id: id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete announcement.");
      await loadAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete announcement.");
    } finally {
      setActionLoading(false);
    }
  }

  function startEditAnnouncement(item: Announcement) {
    setEditingAnnouncement(item.id);
    setAnnouncementTitle(item.title);
    setAnnouncementContent(item.content);
    setShowAnnouncementForm(true);
  }

  async function postMessage() {
    if (!messageText.trim()) {
      setError("Write a message before posting.");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/communities/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community_id: id,
          message: messageText,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to post message.");

      setMessageText("");
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to post message.");
    } finally {
      setActionLoading(false);
    }
  }

  async function updateMessage(messageId: string) {
    if (!editingMessageText.trim()) {
      setError("Message cannot be empty.");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/communities/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: messageId,
          community_id: id,
          message: editingMessageText,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update message.");

      setEditingMessage(null);
      setEditingMessageText("");
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update message.");
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteMessage(messageId: string) {
    if (!window.confirm("Delete this message?")) return;

    setActionLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/communities/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: messageId,
          community_id: id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete message.");

      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete message.");
    } finally {
      setActionLoading(false);
    }
  }
async function inviteMember() {
  if (!selectedPersonId) {
    setError("Please select a person to invite.");
    return;
  }

  setActionLoading(true);
  setError("");

  try {
    const response = await fetch("/api/admin/communities/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        community_id: id,
        person_id: selectedPersonId,
        member_role: selectedMemberRole,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to invite member.");
    }

    await loadMembers();

    setSelectedPersonId("");
    setSelectedMemberRole("student");
    setMemberSearch("");
    setShowMemberForm(false);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to invite member."
    );
  } finally {
    setActionLoading(false);
  }
}
  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "discussions", label: "Discussions", icon: MessageSquare },
    { id: "members", label: "Members", icon: Users },
    { id: "resources", label: "Resources", icon: FolderOpen },
    { id: "polls", label: "Polls", icon: BarChart3 },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070B16] text-white flex items-center justify-center">
        Loading community...
      </main>
    );
  }

  if (!community) {
    return (
      <main className="min-h-screen bg-[#070B16] text-white p-10">
        <p>{error || "Community not found."}</p>
        <Link href="/admin/communities" className="text-cyan-400 mt-4 inline-block">
          Back to communities
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070B16] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link
          href="/dashboard/connect"
          className="inline-flex items-center gap-2 text-sm text-[#81796E] hover:text-cyan-300 mb-7"
        >
          <ArrowLeft size={16} /> Back to Connect
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 mb-2">
              KRIYALAYA CONNECT / COMMUNITY WORKSPACE
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold">
              {community.community_name}
            </h1>
            <p className="text-[#81796E] mt-2">
              {community.description || "Official activity community"}
            </p>
            {community.activity && (
              <p className="text-sm text-slate-500 mt-2">
                {community.activity.category} · {community.activity.venue}
              </p>
            )}
          </div>

          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            {community.status}
          </span>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
            <button
              onClick={() => setError("")}
              className="float-right"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto border-b border-[#E5DEC9] mb-7 pb-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setError("");
                  setActiveTab(tab.id);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm transition ${
                  activeTab === tab.id
                    ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30"
                    : "text-[#81796E] hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {tab.id === "announcements" && announcements.length > 0 && (
                  <span className="text-xs">{announcements.length}</span>
                )}
                {tab.id === "discussions" && messages.length > 0 && (
                  <span className="text-xs">{messages.length}</span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "overview" && (
          <section className="grid gap-5 md:grid-cols-3">
            {[
              { label: "Announcements", value: announcements.length, icon: Megaphone },
              { label: "Discussion Messages", value: messages.length, icon: MessageSquare },
              { label: "Community Status", value: community.status, icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-[#E5DEC9] bg-white/[0.03] p-6">
                  <Icon className="text-cyan-400 mb-4" size={22} />
                  <p className="text-sm text-[#81796E]">{item.label}</p>
                  <p className="text-2xl font-semibold mt-2 capitalize">{item.value}</p>
                </div>
              );
            })}
          </section>
        )}

        {activeTab === "announcements" && (
          <section>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div>
                <h2 className="text-xl font-semibold">Community Announcements</h2>
                <p className="text-sm text-[#81796E] mt-1">
                  Important updates for this activity.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingAnnouncement(null);
                  setAnnouncementTitle("");
                  setAnnouncementContent("");
                  setShowAnnouncementForm(!showAnnouncementForm);
                  setError("");
                }}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-400"
              >
                <Plus size={16} /> New Announcement
              </button>
            </div>

            {showAnnouncementForm && (
              <div className="rounded-2xl border border-cyan-400/20 bg-white/[0.03] p-5 mb-6">
                <h3 className="font-semibold mb-4">
                  {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
                </h3>
                <input
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="Announcement title"
                  className="w-full rounded-xl bg-[#101827] border border-[#E5DEC9] p-3 mb-3 outline-none focus:border-cyan-400"
                />
                <textarea
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="Write your announcement..."
                  rows={4}
                  className="w-full rounded-xl bg-[#101827] border border-[#E5DEC9] p-3 outline-none focus:border-cyan-400"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    disabled={actionLoading}
                    onClick={saveAnnouncement}
                    className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-medium text-slate-950 disabled:opacity-50"
                  >
                    {actionLoading ? "Saving..." : "Publish"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAnnouncementForm(false);
                      setEditingAnnouncement(null);
                    }}
                    className="rounded-xl border border-[#E5DEC9] px-5 py-2.5 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {announcements.map((item) => (
                <article key={item.id} className="rounded-2xl border border-[#E5DEC9] bg-white/[0.03] p-5">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {item.is_pinned && <Pin size={14} className="text-cyan-400" />}
                        <h3 className="font-semibold">{item.title}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => togglePin(item)} disabled={actionLoading} title="Pin or unpin" className="p-2 rounded-lg hover:bg-white/10 text-cyan-300">
                        <Pin size={16} />
                      </button>
                      <button onClick={() => startEditAnnouncement(item)} title="Edit" className="p-2 rounded-lg hover:bg-white/10">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => deleteAnnouncement(item.id)} disabled={actionLoading} title="Delete" className="p-2 rounded-lg hover:bg-red-500/10 text-red-300">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#2B1E1F] mt-4 whitespace-pre-wrap">{item.content}</p>
                </article>
              ))}
              {announcements.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#E5DEC9] p-10 text-center text-[#81796E]">
                  No announcements yet.
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "discussions" && (
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Community Discussions</h2>
              <p className="text-sm text-[#81796E] mt-1">
                Share updates and discuss this activity with the community.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5DEC9] bg-white/[0.03] p-5 mb-6">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Write a message to this community..."
                rows={3}
                maxLength={5000}
                className="w-full rounded-xl bg-[#101827] border border-[#E5DEC9] p-3 outline-none focus:border-cyan-400"
              />
              <div className="flex justify-between items-center gap-3 mt-3">
                <span className="text-xs text-slate-500">
                  {messageText.length}/5000
                </span>
                <button
                  onClick={postMessage}
                  disabled={actionLoading || !messageText.trim()}
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-medium text-slate-950 disabled:opacity-50"
                >
                  <Send size={15} />
                  {actionLoading ? "Posting..." : "Post Message"}
                </button>
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <button
                onClick={() => loadMessages()}
                disabled={actionLoading}
                className="flex items-center gap-2 text-sm text-[#81796E] hover:text-cyan-300"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            <div className="space-y-4">
              {messages.map((item) => (
                <article key={item.id} className="rounded-2xl border border-[#E5DEC9] bg-white/[0.03] p-5">
                  {editingMessage === item.id ? (
                    <>
                      <textarea
                        value={editingMessageText}
                        onChange={(e) => setEditingMessageText(e.target.value)}
                        rows={3}
                        maxLength={5000}
                        className="w-full rounded-xl bg-[#101827] border border-[#E5DEC9] p-3 outline-none focus:border-cyan-400"
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => updateMessage(item.id)}
                          disabled={actionLoading}
                          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm text-slate-950"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingMessage(null)}
                          className="rounded-lg border border-[#E5DEC9] px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap">{item.message}</p>
                      <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
                        <span className="text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleString()}
                          {item.updated_at !== item.created_at && " · Edited"}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingMessage(item.id);
                              setEditingMessageText(item.message);
                              setError("");
                            }}
                            title="Edit message"
                            className="p-2 rounded-lg hover:bg-white/10"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => deleteMessage(item.id)}
                            disabled={actionLoading}
                            title="Delete message"
                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-300"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </article>
              ))}

              {messages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#E5DEC9] p-10 text-center">
                  <MessageSquare size={28} className="mx-auto text-slate-500 mb-3" />
                  <p className="text-[#2B1E1F]">No discussions yet.</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Start the conversation with the first message.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "members" && (
  <section className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold">Community Members</h2>
        <p className="text-sm text-[#81796E] mt-1">
          Manage invitations and membership for this activity.
        </p>
      </div>

      <button
        onClick={() => {
          setShowMemberForm(!showMemberForm);
          setError("");
        }}
        className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-400"
      >
        <Plus size={16} />
        Invite Members
      </button>
    </div>

    {showMemberForm && (
      <div className="rounded-2xl border border-cyan-400/20 bg-white/[0.03] p-5">
        <h3 className="font-semibold mb-4">Invite a Student or Staff Member</h3>

        <input
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          placeholder="Search by name, email or ID..."
          className="w-full rounded-xl bg-[#101827] border border-[#E5DEC9] p-3 mb-4 outline-none focus:border-cyan-400"
        />

        <div className="max-h-56 overflow-y-auto space-y-2 mb-4">
          {directoryPeople
            .filter((person) => {
              const search = memberSearch.toLowerCase();
              const alreadyInvited = members.some(
                (member) => member.person_id === person.id
              );

              return (
                !alreadyInvited &&
                (
                  person.full_name.toLowerCase().includes(search) ||
                  person.email.toLowerCase().includes(search) ||
                  (person.student_id || "").toLowerCase().includes(search) ||
                  (person.employee_id || "").toLowerCase().includes(search)
                )
              );
            })
            .map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => {
                  setSelectedPersonId(person.id);
                  setSelectedMemberRole(
                    person.person_type === "student" ? "student" : "staff"
                  );
                }}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selectedPersonId === person.id
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-[#E5DEC9] bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <p className="font-medium">{person.full_name}</p>
                <p className="text-xs text-[#81796E] mt-1">
                  {person.email} · {person.person_type}
                </p>
              </button>
            ))}

          {directoryPeople.length === 0 && (
            <p className="text-sm text-[#81796E]">
              No active people found in the directory.
            </p>
          )}
        </div>

        <label className="block text-sm text-[#81796E] mb-2">
          Community Role
        </label>

        <select
          value={selectedMemberRole}
          onChange={(e) => setSelectedMemberRole(e.target.value)}
          className="w-full rounded-xl bg-[#101827] border border-[#E5DEC9] p-3 mb-4"
        >
          <option value="student">Student</option>
          <option value="staff">Staff</option>
          <option value="coordinator">Coordinator</option>
        </select>

        <div className="flex gap-3">
          <button
            onClick={inviteMember}
            disabled={actionLoading || !selectedPersonId}
            className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-medium text-slate-950 disabled:opacity-50"
          >
            {actionLoading ? "Sending..." : "Send Invitation"}
          </button>

          <button
            onClick={() => {
              setShowMemberForm(false);
              setSelectedPersonId("");
              setMemberSearch("");
              setSelectedMemberRole("student");
            }}
            className="rounded-xl border border-[#E5DEC9] px-5 py-2.5 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    )}

    <div className="grid gap-4 sm:grid-cols-3">
      {[
        {
          label: "Total Members",
          value: members.length,
        },
        {
          label: "Active Members",
          value: members.filter((member) => member.membership_status === "active").length,
        },
        {
          label: "Pending Invitations",
          value: members.filter((member) => member.membership_status === "invited").length,
        },
      ].map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-[#E5DEC9] bg-white/[0.03] p-5"
        >
          <p className="text-sm text-[#81796E]">{item.label}</p>
          <p className="text-2xl font-semibold mt-2">{item.value}</p>
        </div>
      ))}
    </div>

    <div className="space-y-3">
      <h3 className="font-semibold">Member Directory</h3>

      {members.map((member) => (
        <article
          key={member.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E5DEC9] bg-white/[0.03] p-4"
        >
          <div>
            <p className="font-medium">
              {member.person?.full_name || "Unknown person"}
            </p>
            <p className="text-xs text-[#81796E] mt-1">
              {member.person?.email || "No email"} · {member.member_role}
            </p>
            <span className="inline-block mt-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300 capitalize">
              {member.membership_status}
            </span>
          </div>

          <button
            disabled={actionLoading}
            onClick={async () => {
              if (!window.confirm("Remove this person from the community?")) return;

              setActionLoading(true);
              setError("");

              try {
                const response = await fetch("/api/admin/communities/members", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: member.id,
                    community_id: id,
                  }),
                });

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.error || "Unable to remove member.");
                }

                await loadMembers();
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Unable to remove member."
                );
              } finally {
                setActionLoading(false);
              }
            }}
            className="rounded-lg p-2 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
            title="Remove member"
          >
            <Trash2 size={16} />
          </button>
        </article>
      ))}

      {members.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#E5DEC9] p-10 text-center">
          <Users size={30} className="mx-auto text-slate-500 mb-3" />
          <p className="text-[#2B1E1F]">No members yet.</p>
          <p className="text-sm text-slate-500 mt-1">
            Invite students or staff to this community.
          </p>
        </div>
      )}
    </div>
  </section>
)}

{["resources", "polls"].includes(activeTab) && (
  <section className="rounded-2xl border border-[#E5DEC9] bg-white/[0.03] p-10 text-center">
    <p className="text-lg font-semibold capitalize">{activeTab}</p>
    <p className="text-sm text-[#81796E] mt-2">
      This community feature will be implemented next.
    </p>
  </section>
)}
        
      </div>
    </main>
  );
}