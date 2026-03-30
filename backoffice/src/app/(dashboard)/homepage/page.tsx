'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { homepageService } from '@/services/homepage.service';
import { HomePage } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import MediaUrlPickerField from '@/components/ui/MediaUrlPickerField';
import { Save, Plus, Trash2 } from 'lucide-react';

const emptyHero: HomePage['hero'] = {
  backgroundImageUrl: '',
  homeTeamName: '',
  homeTeamLink: '',
  awayTeamName: '',
  awayTeamLink: '',
  dateText: '',
  timeText: '',
  venue: '',
  description: '',
  ticketLink: '',
};

export default function HomepagePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hero, setHero] = useState<HomePage['hero']>(emptyHero);
  const [banners, setBanners] = useState<HomePage['banners']>([]);
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const doc = await homepageService.get();
        if (doc) {
          setHero(doc.hero ?? emptyHero);
          setBanners(doc.banners ?? []);
          setIsPublished(doc.isPublished ?? true);
        }
      } catch {
        // first time, no data
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await homepageService.upsert({ hero, banners, isPublished });
      toast.success('Anasayfa kaydedildi.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const setHeroField = (key: keyof typeof emptyHero, val: string) => {
    setHero((p) => ({ ...p, [key]: val }));
  };

  const addBanner = () => setBanners((p) => [...p, { imageUrl: '', link: '', label: '' }]);
  const removeBanner = (i: number) => setBanners((p) => p.filter((_, idx) => idx !== i));
  const setBanner = (i: number, key: string, val: string) => {
    setBanners((p) => p.map((b, idx) => idx === i ? { ...b, [key]: val } : b));
  };

  if (loading) return <p className="text-sm text-gray-400">Yükleniyor...</p>;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Anasayfa Ayarları"
        description="Hero bölümü ve banner yönetimi"
        action={
          <Button icon={<Save size={16} />} loading={saving} onClick={handleSave}>
            Kaydet
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Publish toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Yayın Durumu</p>
              <p className="text-sm text-gray-500 mt-0.5">Anasayfayı canlı olarak yayınla</p>
            </div>
            <button
              onClick={() => setIsPublished((p) => !p)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublished ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${isPublished ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Hero Bölümü</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MediaUrlPickerField
              label="Arka Plan Görseli URL"
              value={hero.backgroundImageUrl}
              onChange={(url) => setHeroField('backgroundImageUrl', url)}
              placeholder="https://... veya Medyadan seç"
            />
            <Input label="Bilet Linki" value={hero.ticketLink} onChange={(e) => setHeroField('ticketLink', e.target.value)} placeholder="https://..." />
            <Input label="Ev Sahibi Takım" value={hero.homeTeamName} onChange={(e) => setHeroField('homeTeamName', e.target.value)} />
            <Input label="Ev Sahibi Takım Linki" value={hero.homeTeamLink} onChange={(e) => setHeroField('homeTeamLink', e.target.value)} />
            <Input label="Deplasman Takım" value={hero.awayTeamName} onChange={(e) => setHeroField('awayTeamName', e.target.value)} />
            <Input label="Deplasman Takım Linki" value={hero.awayTeamLink} onChange={(e) => setHeroField('awayTeamLink', e.target.value)} />
            <Input label="Tarih Metni" value={hero.dateText} onChange={(e) => setHeroField('dateText', e.target.value)} placeholder="25 Ocak 2025" />
            <Input label="Saat Metni" value={hero.timeText} onChange={(e) => setHeroField('timeText', e.target.value)} placeholder="19:00" />
            <Input label="Mekan" value={hero.venue} onChange={(e) => setHeroField('venue', e.target.value)} />
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Açıklama</label>
            <textarea
              rows={3}
              value={hero.description}
              onChange={(e) => setHeroField('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Banners */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Bannerlar ({banners.length})</h2>
            <Button size="sm" variant="outline" icon={<Plus size={14} />} onClick={addBanner}>
              Banner Ekle
            </Button>
          </div>
          <div className="space-y-4">
            {banners.map((banner, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start bg-gray-50 rounded-lg p-3">
                <MediaUrlPickerField
                  label="Görsel URL"
                  value={banner.imageUrl}
                  onChange={(url) => setBanner(i, 'imageUrl', url)}
                  placeholder="https://... veya Medyadan seç"
                />
                <Input label="Link" value={banner.link} onChange={(e) => setBanner(i, 'link', e.target.value)} placeholder="https://..." />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input label="Etiket" value={banner.label} onChange={(e) => setBanner(i, 'label', e.target.value)} placeholder="Banner açıklama" />
                  </div>
                  <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => removeBanner(i)}>
                    Sil
                  </Button>
                </div>
              </div>
            ))}
            {banners.length === 0 && <p className="text-sm text-gray-400">Henüz banner eklenmemiş.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
