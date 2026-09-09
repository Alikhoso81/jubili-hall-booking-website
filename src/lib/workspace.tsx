import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from './supabase';
import { Venue, CompanySettings } from './types';
import { toNumber } from './format';

const DEFAULT_SETTINGS: CompanySettings = {
  id: 1,
  name: 'JUBLII GROUP',
  address: '',
  phone: '',
  tax_rate: 0,
  currency: 'PKR',
  event_types: ['Wedding', 'Walima', 'Mehndi', 'Barat', 'Engagement', 'Birthday', 'Corporate', 'Other'],
  time_slots: ['Breakfast', 'Lunch', 'Dinner', 'Full Day'],
};

interface WorkspaceContextValue {
  venues: Venue[];
  settings: CompanySettings;
  loading: boolean;
  reloadVenues: () => Promise<void>;
  reloadSettings: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const reloadVenues = useCallback(async () => {
    const { data } = await supabase.from('venues').select('*').order('created_at', { ascending: true });
    if (data) {
      setVenues(
        (data as Venue[]).map((v) => ({ ...v, capacity: v.capacity == null ? null : Number(v.capacity) }))
      );
    }
  }, []);

  const reloadSettings = useCallback(async () => {
    const { data } = await supabase.from('company_settings').select('*').eq('id', 1).maybeSingle();
    if (data) {
      const s = data as CompanySettings;
      setSettings({ ...DEFAULT_SETTINGS, ...s, tax_rate: toNumber(s.tax_rate) });
    }
  }, []);

  useEffect(() => {
    Promise.all([reloadVenues(), reloadSettings()]).finally(() => setLoading(false));
  }, [reloadVenues, reloadSettings]);

  return (
    <WorkspaceContext.Provider value={{ venues, settings, loading, reloadVenues, reloadSettings }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return ctx;
}
