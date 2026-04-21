import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const loggedInUser = atomWithStorage("loggedInUser", {
  token: "",
  email: "",
  user: null,
  permissions: [],
});

export const CDFProspectsData = atomWithStorage("CDFProspectsData", []);
export const MyClientsData = atomWithStorage("MyClientsData", { clients: [] });

/** Team / employees list from GET /api/user/Employees (bootstrap). */
export const MyTeamData = atomWithStorage("MyTeamData", []);


export const InvestmentOffersData = atomWithStorage("InvestmentOffersData", []);

/** Currently selected household row from My Clients (set when user chooses Select). */
export const SelectedClient = atomWithStorage(null);

export const userDashboardLoading = atom(false);
export const userDashboardError = atom(null);

export const discoveryDataAtom = atomWithStorage("discoveryDataAtom", {});
export const discoverySectionQuestionsAtom = atomWithStorage(
  "discoverySectionQuestionsAtom",
  {},
);

/** Opens Add Discovery Sections modal (no route change; sidebar + stepper only). */
export const addDiscoverySectionsModalOpen = atom(false);
