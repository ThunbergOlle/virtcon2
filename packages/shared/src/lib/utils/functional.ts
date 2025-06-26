export const pMap = async <T, R>(arr: T[], mapper: (item: T) => Promise<R>, { concurrency = 10 } = {}): Promise<R[]> => {
  const results: R[] = [];
  for (let i = 0; i < arr.length; i += concurrency) {
    const chunk = arr.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(mapper));
    results.push(...chunkResults);
  }

  return results;
};

export const every = (x: number) => {
  let count = 0;
  return () => {
    count++;
    return count % x === 0;
  };
};

export const debounce = <T extends (...args: any[]) => void>(func: T, wait: number): T => {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};
