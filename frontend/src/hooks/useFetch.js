import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../services/api';

export default function useFetch(url, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const key = JSON.stringify(params || {});

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(url, { params: JSON.parse(key) })
      .then((r) => { setData(r.data); setError(null); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [url, key]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}
