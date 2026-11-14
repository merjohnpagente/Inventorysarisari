import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../services/api';

export default function useFetch<T = any>(url: string, params?: Record<string, unknown>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(params || {});

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<T>(url, { params: JSON.parse(key) })
      .then((r) => { setData(r.data); setError(null); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [url, key]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}
