import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CHAIN_ID, readStoredChainId, storeChainId, TOLS_CHAINS } from "./chains";

export function useTolsChain() {
  const [chainId, setChainIdState] = useState(DEFAULT_CHAIN_ID);

  useEffect(() => {
    setChainIdState(readStoredChainId());
  }, []);

  const setChainId = useCallback((id: number) => {
    setChainIdState(id);
    storeChainId(id);
  }, []);

  return { chainId, setChainId, chains: TOLS_CHAINS };
}
