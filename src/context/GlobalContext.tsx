import React, { PropsWithChildren, createContext, useContext, useEffect } from "react";
import { Asset, Metadata } from "../declarations/file_manager/file_manager.did";
import Methods from "src/api/methods";

interface IGlobalContext {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  assets: Asset[];
  getAssets: (parentId: [] | [bigint]) => Promise<void>;
  ownerOnlyAssets: boolean;
  setOwnerOnlyAssets: (ownerOnlyAssets: boolean) => void;
  metadata: Metadata | null;
  principal: string | null;
  setPrincipal: (principal: string | null) => void;
}

export const GlobalContextValue = createContext<IGlobalContext>({
  assets: [],
  isLoading: false,
  setIsLoading: () => {},
  getAssets: () => Promise.resolve(),
  metadata: null,
  principal: null,
  setPrincipal: () => {},
  ownerOnlyAssets: false,
  setOwnerOnlyAssets: () => {},
});

export default function GlobalContextProvider({ children }: PropsWithChildren<{}>) {
  const [state, setState] = React.useState<IGlobalContext>({
    assets: [],
    isLoading: false,
    setIsLoading,
    getAssets,
    metadata: null,
    principal: null,
    setPrincipal,
    ownerOnlyAssets: false,
    setOwnerOnlyAssets,
  });

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      await getAssets();
      setIsLoading(false);
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ownerOnlyAssets]);

  function setIsLoading(isLoading: boolean) {
    setState((prevState) => ({ ...prevState, isLoading }));
  }

  function setPrincipal(principal: string | null) {
    setState((prevState) => ({ ...prevState, principal }));
  }

  function setOwnerOnlyAssets(ownerOnlyAssets: boolean) {
    setState((prevState) => ({ ...prevState, ownerOnlyAssets }));
  }

  async function getAssets(parentId: [] | [bigint] = []) {
    try {
      setState((prevState) => ({ ...prevState }));
      let assets = await Methods.getAssetTree(parentId, state.ownerOnlyAssets);
      let metadata = await Methods.getMetadata();
      setState((prevState) => {
        return { ...prevState, assets, metadata };
      });
    } catch (error) {
      console.log(error);
    }
  }

  return <GlobalContextValue.Provider value={state}>{children}</GlobalContextValue.Provider>;
}

export function useGlobal() {
  return useContext(GlobalContextValue);
}
