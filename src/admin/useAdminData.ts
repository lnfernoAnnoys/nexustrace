import { useCallback, useEffect, useState } from "react";
import { adminApi, errorText } from "./adminApi";

type Result<T> = { path: string; data: T } | { path: string; error: string };

/** Loads GET /api/admin<path>. `data` is null while loading (including after `path` changes). */
export function useAdminData<T>(path: string) {
  const [result, setResult] = useState<Result<T> | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    adminApi<T>(path)
      .then((data) => !cancelled && setResult({ path, data }))
      .catch((err) => !cancelled && setResult({ path, error: errorText(err) }));
    return () => {
      cancelled = true;
    };
  }, [path, version]);

  const current = result?.path === path ? result : null;
  return {
    data: current && "data" in current ? current.data : null,
    error: current && "error" in current ? current.error : "",
    reload: useCallback(() => setVersion((v) => v + 1), []),
  };
}
