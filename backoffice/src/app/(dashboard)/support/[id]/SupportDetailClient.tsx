'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, Paperclip } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import type { SupportTopicDetailPayload, SupportMessageRow, SupportAttachment } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { supportService } from '@/services/support.service';

interface Props {
  topicId: string;
  initial: SupportTopicDetailPayload | null;
}

function authorLabel(m: SupportMessageRow) {
  if (m.fromRole === 'admin') {
    const u = m.fromUserId;
    if (u && typeof u === 'object' && 'fullName' in u) {
      return (u as { fullName?: string }).fullName || 'Yönetici';
    }
    return 'Yönetici';
  }
  const mem = m.fromMemberId;
  if (mem && typeof mem === 'object') {
    const x = mem as { name?: string; surname?: string };
    return [x.name, x.surname].filter(Boolean).join(' ') || 'Üye';
  }
  return 'Üye';
}

function AttachmentList({ items, onDark }: { items: SupportAttachment[]; onDark?: boolean }) {
  if (!items?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((a, i) =>
        a.kind === 'image' ? (
          <a
            key={`${a.url}-${i}`}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.url}
              alt={a.originalName || 'ek'}
              className={
                onDark
                  ? 'max-h-32 rounded border border-indigo-300/40 object-contain'
                  : 'max-h-32 rounded border border-gray-200 object-contain'
              }
            />
          </a>
        ) : (
          <a
            key={`${a.url}-${i}`}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className={
              onDark
                ? 'text-xs text-indigo-100 hover:underline'
                : 'text-xs text-indigo-600 hover:underline'
            }
          >
            PDF: {a.originalName || 'dosya'}
          </a>
        )
      )}
    </div>
  );
}

export default function SupportDetailClient({ topicId, initial }: Props) {
  const router = useRouter();
  const [detail, setDetail] = useState<SupportTopicDetailPayload | null>(initial);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    const d = await supportService.getTopic(topicId);
    setDetail(d);
    router.refresh();
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    const next = [...files, ...list].slice(0, 5);
    setFiles(next);
    e.target.value = '';
  };

  const send = async () => {
    const t = body.trim();
    if (!t && files.length === 0) {
      toast.error('Mesaj veya ek dosya girin');
      return;
    }
    setSending(true);
    try {
      await supportService.postMessage(topicId, t, files);
      toast.success('Gönderildi');
      setBody('');
      setFiles([]);
      await reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  const setStatus = async (status: 'open' | 'closed') => {
    setStatusBusy(true);
    try {
      await supportService.setTopicStatus(topicId, status);
      toast.success(status === 'closed' ? 'Konu kapatıldı' : 'Konu açıldı');
      await reload();
    } catch {
      toast.error('Durum güncellenemedi');
    } finally {
      setStatusBusy(false);
    }
  };

  if (!detail?.topic) {
    return (
      <div className="space-y-4">
        <Link href="/support" className="text-sm text-indigo-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft size={16} /> Listeye dön
        </Link>
        <p className="text-gray-600">Talep bulunamadı veya yüklenemedi.</p>
      </div>
    );
  }

  const { topic, messages } = detail;
  const member = topic.memberId;
  const memberName =
    member && typeof member === 'object'
      ? [member.name, member.surname].filter(Boolean).join(' ') || member.email
      : '—';

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/support" className="text-sm text-indigo-600 hover:underline inline-flex items-center gap-1">
        <ArrowLeft size={16} /> Tüm talepler
      </Link>

      <PageHeader
        title={topic.subject}
        description={`${memberName} · ${member && typeof member === 'object' ? member.email : ''}`}
      />

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-600">
          Durum:{' '}
          <strong>{topic.status === 'open' ? 'Açık' : 'Kapalı'}</strong>
        </span>
        {topic.status === 'open' ? (
          <Button
            size="sm"
            variant="outline"
            loading={statusBusy}
            onClick={() => void setStatus('closed')}
          >
            Konuyu kapat
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            loading={statusBusy}
            onClick={() => void setStatus('open')}
          >
            Yeniden aç
          </Button>
        )}
      </div>

      <div className="space-y-3 border border-gray-200 rounded-xl p-4 bg-gray-50/50 min-h-[200px]">
        {messages.map((m) => {
          const admin = m.fromRole === 'admin';
          return (
            <div
              key={m._id}
              className={`flex ${admin ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                  admin ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <div className={`text-[11px] mb-1 ${admin ? 'text-indigo-100' : 'text-gray-500'}`}>
                  {authorLabel(m)} · {formatDateTime(m.createdAt)}
                </div>
                {m.body ? <p className="whitespace-pre-wrap">{m.body}</p> : null}
                <div className={m.body ? 'mt-1' : ''}>
                  <AttachmentList items={m.attachments} onDark={admin} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {topic.status === 'closed' ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Konu kapalı. Yanıt vermek için önce &quot;Yeniden aç&quot; kullanın.
        </p>
      ) : (
        <div className="space-y-3 border border-gray-200 rounded-xl p-4 bg-white">
          <label className="text-sm font-medium text-gray-700">Yanıt yaz</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Mesajınız…"
          />
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              multiple
              className="hidden"
              onChange={onPickFiles}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Paperclip size={14} />}
              onClick={() => inputRef.current?.click()}
            >
              Ek ekle (en fazla 5, JPG/PNG/WEBP/PDF)
            </Button>
            {files.length > 0 && (
              <span className="text-xs text-gray-600">
                {files.length} dosya seçildi
              </span>
            )}
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Send size={14} />}
              loading={sending}
              onClick={() => void send()}
            >
              Gönder
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
