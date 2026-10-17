import { createContext } from "react";

/** Barre d'onglets (Home) : un écran peut la masquer tant qu'il est affiché. */
const TabBarContext = createContext({
    setTabBarHidden: (_hidden: boolean) => { },
});

export default TabBarContext;
