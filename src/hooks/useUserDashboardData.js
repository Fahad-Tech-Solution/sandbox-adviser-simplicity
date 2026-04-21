import { useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import useApi from "./useApi";
import {
  CDFProspectsData,
  MyClientsData,
  MyTeamData,
  userDashboardError,
  userDashboardLoading,
  discoveryDataAtom,
  InvestmentOffersData,
} from "../store/authState";
import { normalizeMyClientsList, wrapMyClientsState } from "./helpers";

export function useOwnerOptions() {
  const discoveryData = useAtomValue(discoveryDataAtom);

  return useMemo(
    () => [
      {
        label:
          discoveryData.personalDetails?.client?.clientPreferredName || "N/A",
        value: "client",
      },
      {
        label:
          discoveryData.personalDetails?.partner?.partnerPreferredName || "N/A",
        value: "partner",
      },
    ],
    [discoveryData],
  );
}

export function getOwnerDisplayName(owner) {
  const discoveryData = useAtomValue(discoveryDataAtom);
  console.log(owner, "owner");
  
  return owner.trim === "Joint" || owner === "joint"
    ? (discoveryData.personalDetails?.client?.clientPreferredName || "Client") +
        " & " +
        (discoveryData.personalDetails?.partner?.partnerPreferredName ||
          "Partner")
    : owner === "client" || owner === "Client"
      ? discoveryData.personalDetails?.client?.clientPreferredName || "Client"
      : discoveryData.personalDetails?.partner?.partnerPreferredName ||
        "Partner";
}

const getDisplayName = (person = {}) =>
  person?.preferredName ||
  person?.firstName ||
  person?.name ||
  person?.fullName ||
  "";

const getAddress = (person = {}) =>
  person?.address || person?.residentialAddress || person?.postalAddress || "";

export function normalizeCDFProspect(item, index) {
  const client = item?.client || {};
  const partner = item?.partner || {};
  const relationshipStatus = client?.relationshipStatus?.toLowerCase() || "";
  const hasPartner =
    relationshipStatus === "couple" && Boolean(getDisplayName(partner));

  return {
    key: item?._id || item?.id || String(index + 1),
    number: index + 1,
    household: client?.lastName || item?.household || "Unknown",
    clients: [
      { name: getDisplayName(client) || "Unknown", role: "Primary" },
      ...(hasPartner
        ? [{ name: getDisplayName(partner), role: "Partner" }]
        : []),
    ],
    ages: [client?.age || "--", ...(hasPartner ? [partner?.age || "--"] : [])],
    contacts: [
      client?.phoneNumber || client?.phone || "--",
      ...(hasPartner ? [partner?.phoneNumber || partner?.phone || "--"] : []),
    ],
    emails: [
      client?.email || "--",
      ...(hasPartner ? [partner?.email || "--"] : []),
    ],
    addresses: [
      getAddress(client) || "--",
      ...(hasPartner ? [getAddress(partner) || "--"] : []),
    ],
    lastUpdated: item?.updatedAt
      ? new Date(item.updatedAt).toLocaleDateString("en-AU")
      : "--",
    status: item?.status
      ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()
      : "Pending",
    raw: item,
  };
}

export default function useUserDashboardData({ enabled = true } = {}) {
  const { get } = useApi();
  const setCDFProspectsData = useSetAtom(CDFProspectsData);
  const setMyClientsData = useSetAtom(MyClientsData);
  const setMyTeamData = useSetAtom(MyTeamData);
  const setInvestmentOffersData = useSetAtom(InvestmentOffersData);

  const setDashboardLoading = useSetAtom(userDashboardLoading);
  const setDashboardError = useSetAtom(userDashboardError);

  const fetchedRef = useRef(false);
  const inFlightRef = useRef(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled || fetchedRef.current || inFlightRef.current) {
      return;
    }

    let mounted = true;
    const abortController = new AbortController();

    const fetchDashboardData = async () => {
      inFlightRef.current = true;
      setDashboardLoading(true);
      setDashboardError(null);

      try {
        const userApis = [
          {
            call: () => get("/api/CDF/", { signal: abortController.signal }),
            setter: setCDFProspectsData,
            normalize: (cdfResponse) =>
              Array.isArray(cdfResponse)
                ? cdfResponse.map(normalizeCDFProspect)
                : [],
          },
          {
            call: () =>
              get("/api/user/Clients", { signal: abortController.signal }),
            setter: setMyClientsData,
            normalize: (res) => wrapMyClientsState(normalizeMyClientsList(res)),
          },
          {
            call: () =>
              get("/api/user/Employees", { signal: abortController.signal }),
            setter: setMyTeamData,
          },
          {
            call: () =>
              get("/api/investmentoffer", { signal: abortController.signal }),
            setter: setInvestmentOffersData,
          },
        ];

        const results = await Promise.allSettled(
          userApis.map((api) => api.call()),
        );

        if (!mounted) return;

        const errors = [];

        console.log(results, "results");

        results.forEach((result, index) => {
          const api = userApis[index];

          if (result.status === "fulfilled") {
            const value = api.normalize
              ? api.normalize(result.value)
              : result.value;
            api.setter?.(value);
            return;
          }

          const error = result.reason;
          if (error?.name === "AbortError" || error?.code === "ERR_CANCELED") {
            return;
          }
          errors.push(error);
        });

        if (errors.length) {
          console.error("User dashboard bootstrap error", errors[0]);
          setDashboardError(errors[0]);
          fetchedRef.current = false;
        } else {
          fetchedRef.current = true;
        }
      } catch (error) {
        if (error?.name === "AbortError" || error?.code === "ERR_CANCELED") {
          return;
        }

        console.error("User dashboard bootstrap error", error);
        if (mounted) {
          setDashboardError(error);
        }
      } finally {
        // if (mounted) {
          setDashboardLoading(false);
        // }
        inFlightRef.current = false;
      }
    };

    fetchDashboardData();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [
    enabled,
    get,
    reloadKey,
    setCDFProspectsData,
    setDashboardError,
    setDashboardLoading,
    setMyClientsData,
    setMyTeamData,
    setInvestmentOffersData,
  ]);

  const refetch = () => {
    fetchedRef.current = false;
    setReloadKey((prev) => prev + 1);
  };

  return { refetch };
}
