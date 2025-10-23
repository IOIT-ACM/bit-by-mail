import { useEffect, useRef } from "react";

export const useDebouncedEffect = (
  callback: () => void,
  delay: number,
  deps: React.DependencyList,
) => {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const handler = setTimeout(() => {
      callback();
    }, delay);

    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, ...deps]);
};
