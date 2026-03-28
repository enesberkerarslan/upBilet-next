'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { venueService } from '@/services/venue.service';
import { tagService } from '@/services/tag.service';
import { VenueStructure, Tag } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

function venueTagId(v: VenueStructure): string {
  const vid = v.venueId;
  if (typeof vid === 'object' && vid && '_id' in vid) return (vid as Tag)._id;
  return String(vid ?? '');
}

function apiErr(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object' || !('response' in err)) return fallback;
  const d = (err as { response?: { data?: { message?: string; error?: string } } }).response?.data;
  const m = d?.message || d?.error;
  return typeof m === 'string' && m.trim() ? m : fallback;
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<VenueStructure[]>([]);
  const [venueTags, setVenueTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editItem, setEditItem] = useState<VenueStructure | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VenueStructure | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({ venueId: '' });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBlockByCategory, setNewBlockByCategory] = useState<Record<string, string>>({});
  const [catEdit, setCatEdit] = useState<{ structureId: string; categoryId: string; name: string } | null>(null);
  const [blockEdit, setBlockEdit] = useState<{
    structureId: string;
    categoryId: string;
    blockId: string;
    name: string;
  } | null>(null);
  const [structBusy, setStructBusy] = useState(false);

  const [deleteCat, setDeleteCat] = useState<{ sid: string; cid: string; label: string } | null>(null);
  const [deleteBlock, setDeleteBlock] = useState<{
    sid: string;
    cid: string;
    bid: string;
    label: string;
  } | null>(null);
  const [deleteNestedLoading, setDeleteNestedLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [venueRes, tagRes] = await Promise.all([
        venueService.getAll(),
        tagService.getAll({ tag: 'EtkinlikAlanı' }),
      ]);
      const venuesList = Array.isArray(venueRes) ? venueRes : (venueRes as { data?: VenueStructure[] })?.data ?? [];
      setVenues(venuesList);
      const tagsRaw = tagRes?.data ?? [];
      setVenueTags(tagsRaw.filter((t: Tag) => t.tag === 'EtkinlikAlanı'));
    } catch {
      toast.error('Mekanlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setNewCategoryName('');
    setNewBlockByCategory({});
    setCatEdit(null);
    setBlockEdit(null);
  }, [expanded]);

  const selectableVenueTags = useMemo(() => {
    const takenIds = new Set(
      venues
        .filter((v) => !editItem || v._id !== editItem._id)
        .map((v) => venueTagId(v))
        .filter(Boolean)
    );
    return venueTags.filter((t) => !takenIds.has(t._id));
  }, [venueTags, venues, editItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.venueId) {
      toast.error('Mekan zorunludur.');
      return;
    }
    setFormLoading(true);
    try {
      if (editItem) {
        await venueService.update(editItem._id, form);
        toast.success('Güncellendi.');
      } else {
        await venueService.create(form);
        toast.success('Mekan yapısı oluşturuldu.');
      }
      setFormOpen(false);
      load();
    } catch (err: unknown) {
      toast.error(apiErr(err, 'İşlem başarısız.'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await venueService.delete(deleteTarget._id);
      toast.success('Silindi.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(apiErr(err, 'Silinemedi.'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const addCategory = async (structureId: string) => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error('Kategori adı girin.');
      return;
    }
    setStructBusy(true);
    try {
      await venueService.addCategory(structureId, { name });
      toast.success('Kategori eklendi.');
      setNewCategoryName('');
      load();
    } catch (err) {
      toast.error(apiErr(err, 'Kategori eklenemedi.'));
    } finally {
      setStructBusy(false);
    }
  };

  const saveCategoryEdit = async () => {
    if (!catEdit) return;
    const name = catEdit.name.trim();
    if (!name) {
      toast.error('Kategori adı zorunludur.');
      return;
    }
    setStructBusy(true);
    try {
      await venueService.updateCategory(catEdit.structureId, catEdit.categoryId, { name });
      toast.success('Kategori güncellendi.');
      setCatEdit(null);
      load();
    } catch (err) {
      toast.error(apiErr(err, 'Güncellenemedi.'));
    } finally {
      setStructBusy(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCat) return;
    setDeleteNestedLoading(true);
    try {
      await venueService.deleteCategory(deleteCat.sid, deleteCat.cid);
      toast.success('Kategori silindi.');
      setDeleteCat(null);
      load();
    } catch (err) {
      toast.error(apiErr(err, 'Silinemedi.'));
    } finally {
      setDeleteNestedLoading(false);
    }
  };

  const addBlock = async (structureId: string, categoryId: string) => {
    const name = (newBlockByCategory[categoryId] ?? '').trim();
    if (!name) {
      toast.error('Blok adı girin.');
      return;
    }
    setStructBusy(true);
    try {
      await venueService.addBlock(structureId, categoryId, { name });
      toast.success('Blok eklendi.');
      setNewBlockByCategory((p) => ({ ...p, [categoryId]: '' }));
      load();
    } catch (err) {
      toast.error(apiErr(err, 'Blok eklenemedi.'));
    } finally {
      setStructBusy(false);
    }
  };

  const saveBlockEdit = async () => {
    if (!blockEdit) return;
    const name = blockEdit.name.trim();
    if (!name) {
      toast.error('Blok adı zorunludur.');
      return;
    }
    setStructBusy(true);
    try {
      await venueService.updateBlock(
        blockEdit.structureId,
        blockEdit.categoryId,
        blockEdit.blockId,
        { name }
      );
      toast.success('Blok güncellendi.');
      setBlockEdit(null);
      load();
    } catch (err) {
      toast.error(apiErr(err, 'Güncellenemedi.'));
    } finally {
      setStructBusy(false);
    }
  };

  const confirmDeleteBlock = async () => {
    if (!deleteBlock) return;
    setDeleteNestedLoading(true);
    try {
      await venueService.deleteBlock(deleteBlock.sid, deleteBlock.cid, deleteBlock.bid);
      toast.success('Blok silindi.');
      setDeleteBlock(null);
      load();
    } catch (err) {
      toast.error(apiErr(err, 'Silinemedi.'));
    } finally {
      setDeleteNestedLoading(false);
    }
  };

  const getVenueName = (v: VenueStructure) => {
    if (typeof v.venueId === 'object') return (v.venueId as Tag).name;
    const tag = venueTags.find((t) => t._id === v.venueId);
    return tag?.name ?? v.venueId;
  };

  return (
    <div>
      <PageHeader
        title="Mekan Yapısı"
        description={`Toplam ${venues.length} mekan · kategori ve blokları genişleterek yönetin`}
        action={
          <Button
            icon={<Plus size={16} />}
            onClick={() => {
              setEditItem(null);
              setForm({ venueId: '' });
              setFormOpen(true);
            }}
          >
            Mekan Ekle
          </Button>
        }
      />

      {loading ? (
        <p className="text-sm text-gray-400">Yükleniyor...</p>
      ) : venues.length === 0 ? (
        <p className="text-sm text-gray-400">Henüz mekan yapısı yok.</p>
      ) : (
        <div className="space-y-3">
          {venues.map((venue) => (
            <div key={venue._id} className="bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  type="button"
                  className="flex items-center gap-2 text-left font-medium text-gray-900"
                  onClick={() => setExpanded(expanded === venue._id ? null : venue._id)}
                >
                  {expanded === venue._id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  {getVenueName(venue)}
                  <span className="text-sm text-gray-400 font-normal">
                    ({venue.categories?.length ?? 0} kategori)
                  </span>
                </button>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Pencil size={13} />}
                    onClick={() => {
                      setEditItem(venue);
                      setForm({
                        venueId:
                          typeof venue.venueId === 'object' ? (venue.venueId as Tag)._id : venue.venueId,
                      });
                      setFormOpen(true);
                    }}
                  >
                    Düzenle
                  </Button>
                  <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => setDeleteTarget(venue)}>
                    Sil
                  </Button>
                </div>
              </div>

              {expanded === venue._id && (
                <div className="border-t px-4 py-4 space-y-4 bg-gray-50/50">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Yeni kategori</p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                      <div className="flex-1 min-w-0">
                        <Input
                          label="Kategori adı"
                          placeholder="Örn. VIP, Maraton, Kale arkası"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          disabled={structBusy}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        icon={<Plus size={14} />}
                        loading={structBusy}
                        onClick={() => addCategory(venue._id)}
                      >
                        Kategori ekle
                      </Button>
                    </div>
                  </div>

                  {!venue.categories?.length ? (
                    <p className="text-sm text-gray-400">Henüz kategori yok. Yukarıdan ekleyin.</p>
                  ) : (
                    <div className="space-y-3">
                      {venue.categories.map((cat) => (
                        <div
                          key={cat._id}
                          className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {catEdit?.categoryId === cat._id && catEdit.structureId === venue._id ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <input
                                    className="flex-1 min-w-[140px] px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                                    value={catEdit.name}
                                    onChange={(e) => setCatEdit({ ...catEdit, name: e.target.value })}
                                    disabled={structBusy}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    icon={<Check size={14} />}
                                    loading={structBusy}
                                    onClick={saveCategoryEdit}
                                  >
                                    Kaydet
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    icon={<X size={14} />}
                                    disabled={structBusy}
                                    onClick={() => setCatEdit(null)}
                                  >
                                    İptal
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                              )}
                            </div>
                            {!(catEdit?.categoryId === cat._id && catEdit.structureId === venue._id) && (
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2"
                                  icon={<Pencil size={13} />}
                                  disabled={structBusy}
                                  onClick={() =>
                                    setCatEdit({
                                      structureId: venue._id,
                                      categoryId: cat._id,
                                      name: cat.name,
                                    })
                                  }
                                >
                                  <span className="sr-only">Kategori düzenle</span>
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="dangerOutline"
                                  className="h-8 px-2"
                                  icon={<Trash2 size={13} />}
                                  disabled={structBusy}
                                  onClick={() =>
                                    setDeleteCat({ sid: venue._id, cid: cat._id, label: cat.name })
                                  }
                                >
                                  <span className="sr-only">Kategori sil</span>
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 pl-3 border-l-2 border-indigo-200">
                            <p className="text-[11px] font-medium text-gray-500 uppercase mb-2">Bloklar</p>
                            <div className="flex flex-col sm:flex-row gap-2 sm:items-end mb-2">
                              <input
                                className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                                placeholder="Blok adı (örn. A Blok)"
                                value={newBlockByCategory[cat._id] ?? ''}
                                onChange={(e) =>
                                  setNewBlockByCategory((p) => ({ ...p, [cat._id]: e.target.value }))
                                }
                                disabled={structBusy}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                icon={<Plus size={13} />}
                                loading={structBusy}
                                onClick={() => addBlock(venue._id, cat._id)}
                              >
                                Blok ekle
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(cat.blocks ?? []).map((block) => (
                                <div
                                  key={block._id}
                                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs"
                                >
                                  {blockEdit?.blockId === block._id &&
                                  blockEdit.categoryId === cat._id &&
                                  blockEdit.structureId === venue._id ? (
                                    <>
                                      <input
                                        className="w-28 px-1 py-0.5 border rounded text-xs"
                                        value={blockEdit.name}
                                        onChange={(e) =>
                                          setBlockEdit({ ...blockEdit, name: e.target.value })
                                        }
                                        disabled={structBusy}
                                      />
                                      <button
                                        type="button"
                                        className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                                        disabled={structBusy}
                                        onClick={saveBlockEdit}
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className="p-0.5 text-gray-500 hover:bg-gray-100 rounded"
                                        disabled={structBusy}
                                        onClick={() => setBlockEdit(null)}
                                      >
                                        <X size={14} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-gray-700">{block.name}</span>
                                      <button
                                        type="button"
                                        className="p-0.5 text-gray-500 hover:text-indigo-600"
                                        disabled={structBusy}
                                        onClick={() =>
                                          setBlockEdit({
                                            structureId: venue._id,
                                            categoryId: cat._id,
                                            blockId: block._id,
                                            name: block.name,
                                          })
                                        }
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        className="p-0.5 text-gray-500 hover:text-red-600"
                                        disabled={structBusy}
                                        onClick={() =>
                                          setDeleteBlock({
                                            sid: venue._id,
                                            cid: cat._id,
                                            bid: block._id,
                                            label: block.name,
                                          })
                                        }
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              ))}
                              {(cat.blocks ?? []).length === 0 && (
                                <span className="text-xs text-gray-400">Henüz blok yok.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editItem ? 'Mekanı Düzenle' : 'Mekan Yapısı Ekle'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Mekan (Etkinlik Alanı etiketi) *"
            value={form.venueId}
            onChange={(e) => setForm({ venueId: e.target.value })}
            options={selectableVenueTags.map((t) => ({ value: t._id, label: t.name }))}
            placeholder="Etkinlik alanı etiketi seçin"
          />
          {venueTags.length > 0 && selectableVenueTags.length === 0 && !editItem && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Tüm etkinlik alanı etiketleri için zaten mekan yapısı var. Yeni yapı için yeni etiket ekleyin veya mevcut
              yapıyı düzenleyin.
            </p>
          )}
          {venueTags.length === 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Liste boş: önce <strong>Etiketler</strong> sayfasından türü <strong>Etkinlik Alanı</strong> olan etiket
              oluşturun.
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => setFormOpen(false)}>
              İptal
            </Button>
            <Button type="submit" loading={formLoading}>
              {editItem ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Mekan Yapısını Sil"
        description="Bu mekan yapısını silmek istediğinize emin misiniz?"
        confirmLabel="Sil"
      />

      <ConfirmDialog
        open={!!deleteCat}
        onClose={() => setDeleteCat(null)}
        onConfirm={confirmDeleteCategory}
        loading={deleteNestedLoading}
        title="Kategoriyi Sil"
        description={
          deleteCat
            ? `"${deleteCat.label}" kategorisini ve içindeki tüm blokları silmek istediğinize emin misiniz?`
            : ''
        }
        confirmLabel="Sil"
      />

      <ConfirmDialog
        open={!!deleteBlock}
        onClose={() => setDeleteBlock(null)}
        onConfirm={confirmDeleteBlock}
        loading={deleteNestedLoading}
        title="Bloğu Sil"
        description={deleteBlock ? `"${deleteBlock.label}" bloğunu silmek istediğinize emin misiniz?` : ''}
        confirmLabel="Sil"
      />
    </div>
  );
}
