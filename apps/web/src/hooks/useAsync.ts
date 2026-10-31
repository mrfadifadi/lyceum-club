import { useEffect, useState } from "react";

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [state, set] = useState<{ data?: T; loading: boolean; error?: Error }>({ loading: true });
  useEffect(() => {
    let alive = true;
    set({ loading: true });
    fn().then((data) => alive && set({ data, loading: false }), (error) => alive && set({ loading: false, error }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
