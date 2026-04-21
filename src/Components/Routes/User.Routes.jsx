// Central registry for all /user/* routes used in the app.
// Fill in the `component` fields as you implement actual pages.

import { Spin } from "antd";
import { lazy, Suspense } from "react";
import HouseholdTable from "../Pages/User/Clients/HouseholdTable";
import MyClients from "../Pages/User/Clients/MyClients";
import DashboardPage from "../Pages/User/Dashboard/DashboardPage";
import CDFProspects from "../Pages/User/Prospects/CDFProspects";
import MyTeam from "../Pages/User/MyTeam/MyTeam";
import IncomeExpenses from "../Pages/User/Discovery/IncomeExpenses/IncomeExpenses.jsx";
import EmploymentModal from "../Pages/User/Discovery/IncomeExpenses/components/EmploymentSection/EmploymentModal.jsx";
import GeneralLiving from "../Pages/User/Discovery/IncomeExpenses/components/GeneralLiving/GeneralLiving.jsx";
import SoleTraderModal from "../Pages/User/Discovery/IncomeExpenses/components/SoleTraderSection/SoleTraderModal.jsx";
import PartnershipModal from "../Pages/User/Discovery/IncomeExpenses/components/PartnershipSection/PartnershipModal.jsx";
import CentrelinkModal from "../Pages/User/Discovery/IncomeExpenses/components/CentrelinkSection/CentrelinkModal.jsx";
import LifetimePensionModal from "../Pages/User/Discovery/IncomeExpenses/components/LifetimePensionSection/LifetimePensionModal.jsx";
import OverseasPensionModal from "../Pages/User/Discovery/IncomeExpenses/components/OverseasPensionSection/OverseasPensionModal.jsx";
import AssetAndDebt from "../Pages/User/Discovery/AssetsAndDebt/AssetAndDebt.jsx";
import FamilyHome from "../Pages/User/Discovery/AssetsAndDebt/components/FamilyHome/FamilyHome.jsx";
import AssetInfoModal from "../Pages/User/Discovery/AssetsAndDebt/components/AssetInfoSection/AssetInfoModal.jsx";
import PersonalLoanModal from "../Pages/User/Discovery/AssetsAndDebt/components/personalLoan/personalLoanModal.jsx";
import CreditCardModal from "../Pages/User/Discovery/AssetsAndDebt/components/CreditCard/CreditCardModal.jsx";
import FinancialInvestments from "../Pages/User/Discovery/FinancialInvestments/FinancialInvestments.jsx";
import MiddleWare from "../Pages/User/Discovery/MiddleWare/MiddleWare.jsx";
import InvestmentLoanModal from "../Pages/User/Discovery/FinancialInvestments/components/InvestmentLoanSection/InvestmentLoanModal.jsx";
import BankTermDetailsModal from "../Pages/User/Discovery/FinancialInvestments/components/Bankandterm/BankTermDetailsModal.jsx";
import AustralianShare from "../Pages/User/Discovery/FinancialInvestments/components/AustralianShare/AustralianShare.jsx";
import PlatformInvestments from "../Pages/User/Discovery/FinancialInvestments/components/PlatformInvestment and Investment Bond/PlatformInvestments.jsx";
import SuperFunds from "../Pages/User/Discovery/FinancialInvestments/components/SuperFunds/SuperFunds.jsx";
import InvestmentPropertiesModal from "../Pages/User/Discovery/FinancialInvestments/components/InvestmentProperties/InvestmentPropertiesModal.jsx";
import AccountBasedPension from "../Pages/User/Discovery/FinancialInvestments/components/AccountBasedPension/AccountBasedPension.jsx";
import superFundsIcon from "../../assets/image/SectionImages/SuperFunds.jpeg";
import Annuities from "../Pages/User/Discovery/FinancialInvestments/components/Annuities/Annuities.jsx";
import EstatePlanning from "../Pages/User/Discovery/EstatePlanning/EstatePlanning.jsx";
import EstatePlanningWill from "../Pages/User/Discovery/EstatePlanning/components/wills/EstatePlanningWill.jsx";
import BusinessEntities from "../Pages/User/Discovery/BusinessEntities/BusinessEntities.jsx";
import TradingCompanyModal from "../Pages/User/Discovery/BusinessEntities/coponents/TradingCompanySection/TradingCompanyModal.jsx";
import BusinessTrustModal from "../Pages/User/Discovery/BusinessEntities/coponents/BusinessTrustSection/BusinessTrustModal.jsx";
import PowerOfAttorney from "../Pages/User/Discovery/EstatePlanning/components/PowerOfAttorney/PowerOfAttorney.jsx";
import ProfessionalAdvisers from "../Pages/User/Discovery/EstatePlanning/components/ProfessionalAdvisers/ProfessionalAdvisers.jsx";
import PersonalInsurance from "../Pages/User/Discovery/PersonalInsurance/PersonalInsurance.jsx";
import PersonalInsuranceModal from "../Pages/User/Discovery/PersonalInsurance/components/PersonalInsuranceModal.jsx";
import SMSF from "../Pages/User/Discovery/SMSF/SMSF.jsx";
import FamilyTrust from "../Pages/User/Discovery/FamilyTrust/FamilyTrust.jsx";

/** Lazy so `PersonalDetails` can import route helpers from this file without a circular dependency. */
const PersonalDetailsLazy = lazy(() =>
  import("../Pages/User/Discovery/PersonalDetails/PersonalDetails.jsx").then(
    (m) => ({ default: m.PersonalDetails }),
  ),
);

const personalDetailsElement = (
  <Suspense
    fallback={
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    }
  >
    <PersonalDetailsLazy />
  </Suspense>
);

const DISCOVERY_SECTION_METADATA_KEYS = new Set([
  "_id",
  "__v",
  "createdAt",
  "updatedAt",
  "clientId",
  "userId",
]);

function hasMeaningfulValue(value) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  if (typeof value === "object") {
    return Object.entries(value).some(([key, nestedValue]) => {
      if (DISCOVERY_SECTION_METADATA_KEYS.has(key)) {
        return false;
      }
      return hasMeaningfulValue(nestedValue);
    });
  }
  return false;
}

function getDiscoverySectionValue(data, keys = []) {
  if (!data || typeof data !== "object") return null;

  for (const key of keys) {
    if (key in data) {
      return data[key];
    }
  }

  return null;
}

function createSectionCompletionCheck(...keys) {
  return ({ discoveryData }) =>
    hasMeaningfulValue(getDiscoverySectionValue(discoveryData, keys));
}

function createCardsCompletionCheck(cards = []) {
  return ({ discoveryData }) =>
    (cards || []).some((card) => {
      const keys =
        Array.isArray(card?.completionKeys) && card.completionKeys.length > 0
          ? card.completionKeys
          : [card?.key];

      return keys.some((key) =>
        hasMeaningfulValue(getDiscoverySectionValue(discoveryData, [key])),
      );
    });
}

const INCOME_EXPENSE_CARDS = [
  {
    title: "Employment",
    key: "incomeFromOwnBusiness",
    icon: "👔",
    component: <EmploymentModal />,
    modalWidth: "1200px",
  },
  {
    title: "Sole Trader",
    key: "incomeFromSoleTrader",
    icon: "💼",
    component: <SoleTraderModal />,
    modalWidth: "1100px",
  },
  {
    title: "Partnership",
    key: "incomeFromPartnership",
    icon: "🤝",
    component: <PartnershipModal />,
    modalWidth: "1200px",
  },
  {
    title: "Centerlink",
    key: "incomeFromCentrelink",
    icon: "⚙️",
    component: <CentrelinkModal />,
    info: "This includes Family Tax Benefit (A&B) Payments and any Centrelink Cards.",
    modalWidth: "1100px",
  },
  {
    title: "Lifetime Pension",
    key: "incomeFromSuperPayment",
    icon: "💵",
    component: <LifetimePensionModal />,
    modalWidth: "800px",
  },
  {
    title: "Overseas Pension",
    key: "incomeFromOverseasPension",
    icon: "🌍",
    component: <OverseasPensionModal />,
    modalWidth: "800px",
  },
  {
    title: "Living Expenses",
    key: "incomeFromRegularLivingExpenses",
    completionKeys: ["generalLivingExpenses", "retirementLivingExpenses"],
    icon: "💰",
    component: <GeneralLiving />,
    modalWidth: "600px",
    variant: "case3",
    firstTotalKey: "generalLivingExpensesTotal",
    secondTotalKey: "retirementLivingExpense",
    firstNameKey: "General Living",
    secondNameKey: "Retirement Living",
    alwaysShow: true,
    showSecondTotal: true,
    secondisFormInput: true,
  },
];

const ASSETS_DEBT_CARDS = [
  {
    title: "Family Home",
    key: "familyHome",
    icon: "🏠",
    component: <FamilyHome />,
    modalWidth: "1200px",
    firstNameKey: "Value",
    secondNameKey: "Loan",
    secondTotalKey: "loanAmount",
    showSecondTotal: true,
  },
  {
    title: "Car",
    key: "car",
    icon: "🚗",
    component: <AssetInfoModal />,
    modalWidth: "700px",
  },
  {
    title: "Contents",
    key: "houseHold",
    icon: "🏪",
    component: <AssetInfoModal />,
    modalWidth: "550px",
    firstNameKey: "Joint",
    firstTotalKey: "jointTotal",
    showSecondTotal: false,
  },
  {
    title: "Boat",
    key: "boat",
    icon: "⛵",
    component: <AssetInfoModal />,
    modalWidth: "550px",
    firstNameKey: "Joint",
    firstTotalKey: "jointTotal",
    showSecondTotal: false,
  },
  {
    title: "Caravan",
    key: "caravan",
    icon: "🚌",
    component: <AssetInfoModal />,
    modalWidth: "550px",
    firstNameKey: "Joint",
    firstTotalKey: "jointTotal",
    showSecondTotal: false,
  },
  {
    title: "Other Assets",
    key: "otherAssets",
    icon: "⚙️",
    component: <AssetInfoModal />,
    modalWidth: "550px",
    firstNameKey: "Joint",
    firstTotalKey: "jointTotal",
    showSecondTotal: false,
  },
  {
    title: "Personal Loan",
    key: "personalLoans",
    icon: "🤝",
    component: <PersonalLoanModal />,
    modalWidth: "1200px",
    firstNameKey: "Joint",
    showSecondTotal: false,
  },
  {
    title: "Credit Card",
    key: "creditCards",
    icon: "💳",
    component: <CreditCardModal />,
    modalWidth: "1200px",
    firstNameKey: "Joint",
    showSecondTotal: false,
  },
];

const FINANCIAL_INVESTMENTS_CARDS = [
  {
    title: "Bank Accounts",
    key: "bankAccountFinance",
    icon: "🏦",
    component: <MiddleWare />,
    innerComponent: <BankTermDetailsModal />,
    modalWidth: "620px",
    tableRows: 10,
  },
  {
    title: "Term Deposits",
    key: "termDepositsFinance",
    icon: "⏱️",
    component: <MiddleWare />,
    innerComponent: <BankTermDetailsModal />,
    modalWidth: "620px",
    tableRows: 10,
  },
  {
    title: "Australian Shares/ETFs",
    key: "australianShareMarket",
    icon: "📊",
    component: <MiddleWare />,
    innerComponent: <AustralianShare />,
    modalWidth: "620px",
    tableRows: 50,
  },
  {
    title: "Platform Investments",
    key: "managedFund",
    icon: "💼",
    component: <MiddleWare />,
    innerComponent: <PlatformInvestments />,
    modalWidth: "620px",
    tableRows: 5,
  },
  {
    title: "Investment Bond",
    key: "investmentBondFinance",
    icon: "🏅",
    component: <MiddleWare />,
    innerComponent: <PlatformInvestments />,
    modalWidth: "620px",
    tableRows: 5,
  },
  //SuperAndRetirement
  {
    title: "Super Funds",
    key: "superAnnuationIssues",
    icon: (
      <img
        src={superFundsIcon}
        alt="Super Funds"
        width={30}
        height={32}
        style={{ mixBlendMode: "multiply" }}
      />
    ),
    component: <MiddleWare />,
    innerComponent: <SuperFunds />,
    modalWidth: "620px",
    tableRows: 10,
  },
  {
    title: "Account Based Pension",
    key: "accountBasedPensionIssues",
    icon: "🐷",
    component: <MiddleWare />,
    innerComponent: <AccountBasedPension />,
    modalWidth: "620px",
    tableRows: 3,
  },
  {
    title: "Annuities",
    key: "annuitiesIssues",
    icon: "📅",
    component: <MiddleWare />,
    innerComponent: <Annuities />,
    modalWidth: "620px",
    tableRows: 3,
  },
  // Investment
  {
    title: "Investment Properties",
    key: "investmentPropertyDetails",
    icon: "🏘️",
    component: <InvestmentPropertiesModal />,
    modalWidth: "1500px",
    tableRows: 10,
    firstNameKey: "Property Portfolio",
    secondNameKey: "Total Debt",
    firstTotalKey: "propertyPortfolio",
    secondTotalKey: "totalDebt",
    showSecondTotal: true,
  },
  {
    title: "Investment Loan",
    key: "managedFundsLOC",
    icon: "📋",
    component: <InvestmentLoanModal />,
    modalWidth: "1300px",
  },
  {
    title: "Margin Loan",
    key: "managedFundsMarginLoan",
    icon: "📉",
    component: <InvestmentLoanModal />,
    modalWidth: "1200px",
  },
];

const BUSINESS_ENTITIES_CARDS = [
  {
    title: "Trading Company",
    key: "BusinessAsCompanyStructure",
    icon: "🏢",
    component: <MiddleWare />,
    innerComponent: <TradingCompanyModal />,
    modalWidth: "620px",
    tableRows: 3,
  },
  {
    title: "Business Trust",
    key: "BusinessAsTrusts",
    icon: "💼",
    component: <MiddleWare />,
    innerComponent: <BusinessTrustModal />,
    modalWidth: "620px",
    tableRows: 3,
  },
];

const ESTATE_PLANNING_CARDS = [
  {
    title: "Wills",
    key: "will",
    icon: "📄",
    component: <EstatePlanningWill />,
    modalWidth: "1000px",
  },
  {
    title: "Power of Attorneys",
    key: "POA",
    icon: "🤝",
    component: <PowerOfAttorney />,
    modalWidth: "700px",
  },
  {
    title: "Professional Advisers",
    key: "professionalAdviser",
    icon: "👔",
    component: <ProfessionalAdvisers />,
    modalWidth: "1000px",
  },
];

const PERSONAL_INSURANCE_CARDS = [
  {
    title: "Life",
    key: "lifeInsurance",
    icon: "📋",
    component: <PersonalInsuranceModal />,
    modalWidth: "1800px",
    firstTotalKey: "clientLifeInsuranceTotal",
    secondTotalKey: "partnerLifeInsuranceTotal",
  },
  {
    title: "TPD",
    key: "TPDInsurance",
    icon: "♿",
    modalWidth: "1800px",
    component: <PersonalInsuranceModal />,
    firstTotalKey: "clientTPDTotal",
    secondTotalKey: "partnerTPDTotal",
  },
  {
    title: "Trauma",
    key: "TraumaInsurance",
    modalWidth: "1800px",
    icon: "⬜",
    component: <PersonalInsuranceModal />,
    firstTotalKey: "clientTraumaTotal",
    secondTotalKey: "partnerTraumaTotal",
  },
  {
    title: "Income Protection",
    key: "IncomeProtection",
    modalWidth: "1800px",
    icon: "☂️",
    component: <PersonalInsuranceModal />,
    firstTotalKey: "clientIncomeProtectionTotal",
    secondTotalKey: "partnerIncomeProtectionTotal",
  },
];

const SMSF_CARDS = [
  {
    title: "Details",
    key: "SMSFDetails",
    icon: "📄",
    component: null,
  },
  {
    title: "Accumulation Account",
    key: "SMSFAccumulationDetails",
    icon: "🐷",
    component: null,
  },
  {
    title: "Pension Account",
    key: "SMSFPensionPhase",
    icon: "🐷",
    component: null,
  },
  {
    title: "Bank Accounts",
    key: "SMSFBank",
    icon: "🏦",
    component: <MiddleWare />,
    innerComponent: <BankTermDetailsModal />,
    modalWidth: "620px",
    tableRows: 3,
    firstNameKey: "SMSF",
    firstTotalKey: "SMSFTotal",
    showSecondTotal: false,
  },
  {
    title: "Term Deposits",
    key: "SMSFTermDeposits",
    icon: "⏱️",
    component: <MiddleWare />,
    innerComponent: <BankTermDetailsModal />,
    modalWidth: "620px",
    tableRows: 5,
    firstNameKey: "SMSF",
    firstTotalKey: "SMSFTotal",
    showSecondTotal: false,
  },
  {
    title: "Australian Shares/ETFs",
    key: "SMSFAustralianShares",
    icon: "📊",
    component: <MiddleWare />,
    innerComponent: <AustralianShare />,
    modalWidth: "620px",
    tableRows: 50,
    firstNameKey: "SMSF",
    firstTotalKey: "SMSFTotal",
    showSecondTotal: false,
  },
  {
    title: "Platform Investments",
    key: "SMSFManagedFunds",
    icon: "💼",
    component: <MiddleWare />,
    innerComponent: <PlatformInvestments />,
    modalWidth: "620px",
    tableRows: 5,
    firstNameKey: "SMSF",
    firstTotalKey: "SMSFTotal",
    showSecondTotal: false,
  },
  {
    title: "Investment Loan",
    key: "SMSFInvestmentLoan",
    icon: "📉",
    component: null,
  },
  {
    title: "Investment Properties",
    key: "SMSFInvestmentProperties",
    icon: "🏘️",
    component: null,
  },
  {
    title: "Other Investments",
    key: "SMSFOtherInvestment",
    icon: "📈",
    component: null,
  },
];
const FAMILY_TRUST_CARDS = [
  {
    title: "Details",
    key: "familyDetails",
    icon: "📄",
    component: null,
  },
  {
    title: "Bank Accounts",
    key: "familyBank",
    icon: "🏦",
    component: <MiddleWare />,
    innerComponent: <BankTermDetailsModal />,
    modalWidth: "620px",
    tableRows: 3,
    firstNameKey: "trust",
    firstTotalKey: "trustTotal",
    showSecondTotal: false,
  },
  {
    title: "Term Deposits",
    key: "familyTermDeposit",
    icon: "⏱️",
    component: <MiddleWare />,
    innerComponent: <BankTermDetailsModal />,
    modalWidth: "620px",
    tableRows: 5,
    firstNameKey: "trust",
    firstTotalKey: "trustTotal",
    showSecondTotal: false,
  },
  {
    title: "Australian Shares/ETFs",
    key: "familyAustralianShare",
    icon: "📊",
    component: <MiddleWare />,
    innerComponent: <AustralianShare />,
    modalWidth: "620px",
    tableRows: 50,
    firstNameKey: "trust",
    firstTotalKey: "trustTotal",
    showSecondTotal: false,
  },
  {
    title: "Platform Investments",
    key: "familyMangedFunds",
    icon: "💼",
    component: <MiddleWare />,
    innerComponent: <PlatformInvestments />,
    modalWidth: "620px",
    tableRows: 5,
    firstNameKey: "trust",
    firstTotalKey: "trustTotal",
    showSecondTotal: false,
  },
  {
    title: "Investment Loan",
    key: "familyInvestmentHomeLoan",
    icon: "📋",
    component: null,
  },
  {
    title: "Investment Property",
    key: "familyInvestmentProperties",
    icon: "🏘️",
    component: null,
  },
  {
    title: "Other Investments",
    key: "familyOtherInvestment",
    icon: "📈",
    component: null,
  },
];

export const withSpacing = ({
  icon,
  label,
  marginLeft = 0,
  fontSize = "12px",
  color = "inherit",
  fontWeight = "400",
}) => ({
  label: (
    <span
      style={{
        marginLeft: marginLeft + "px",
        fontWeight: fontWeight,
        fontSize: fontSize,
        color: color,
      }}
    >
      <span>{icon}</span> {label}
    </span>
  ),
});

export const userRoutes = [
  {
    key: "/user",
    path: "/",
    ...withSpacing({ icon: "🏠", label: "Dashboard", fontSize: "13px" }),
    component: <DashboardPage />,
    condition: () => true,
  },
  {
    key: "/user/clients",
    path: "/clients",
    ...withSpacing({ icon: "👥", label: "My Clients", fontSize: "13px" }),
    component: <MyClients />,
    condition: () => true,
  },
  {
    key: "/user/prospects",
    path: "/prospects",
    ...withSpacing({ icon: "📊", label: "Prospects", fontSize: "13px" }),
    component: <CDFProspects />,
    condition: () => true,
  },
  {
    key: "/user/my-team",
    path: "/my-team",
    ...withSpacing({ icon: "👤", label: "My Team", fontSize: "13px" }),
    component: <MyTeam />,
    condition: () => true,
  },
];

/**
 * Discovery section: `relativePath` is the segment under `/user/discovery/:segment`.
 * `stepTitle` / `stepIcon` drive DiscoveryFlowLayout heading + stepper (keep in sync with labels).
 * `showInDiscoveryStepper: false` — show in sidebar only, not in the horizontal stepper.
 */
export const discoveryRoutes = [
  {
    key: "/user/discovery/client-summary",
    relativePath: "client-summary",
    stepTitle: "Client Summary",
    stepIcon: "📄",
    path: "/user/discovery/client-summary",
    showInDiscoveryStepper: false,
    ...withSpacing({
      icon: "📄",
      label: "Client Summary",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/user/discovery/personal-details",
    relativePath: "personal-details",
    stepTitle: "Personal Details",
    stepIcon: "👤",
    path: "/user/discovery/personal-details",
    ...withSpacing({
      icon: "👤",
      label: "Personal Details",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: personalDetailsElement,
    condition: () => true,
    isCompleted: createSectionCompletionCheck(
      "personaldetails",
      "personalDetails",
    ),
  },
  {
    key: "/user/discovery/income-expenses",
    relativePath: "income-expenses",
    stepTitle: "Income & Expenses",
    cardsSelectionTitle: "Income & Expenses",
    stepIcon: "💲",
    showDiscoveryAddButton: true,
    path: "/user/discovery/income-expenses",
    ...withSpacing({
      icon: "💲",
      label: "Income & Expenses",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <IncomeExpenses />,
    condition: () => true,
    isCompleted: createCardsCompletionCheck(INCOME_EXPENSE_CARDS),
    Cards: INCOME_EXPENSE_CARDS,
  },
  {
    key: "/user/discovery/assets-debt",
    relativePath: "assets-debt",
    stepTitle: "Assets & Debt",
    cardsSelectionTitle: "Personal Assets & Liabilities",
    stepIcon: "🏡",
    showDiscoveryAddButton: true,
    path: "/user/discovery/assets-debt",
    ...withSpacing({
      icon: "🏡",
      label: "Assets & Debt",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <AssetAndDebt />,
    condition: () => true,
    isCompleted: createCardsCompletionCheck(ASSETS_DEBT_CARDS),
    Cards: ASSETS_DEBT_CARDS,
  },
  {
    key: "/user/discovery/financial-investments",
    relativePath: "financial-investments",
    stepTitle: "Financial Investments",
    cardsSelectionTitle: "Financial Investments",
    stepIcon: "📈",
    showDiscoveryAddButton: true,
    path: "/user/discovery/financial-investments",
    ...withSpacing({
      icon: "📈",
      label: "Financial Investments",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <FinancialInvestments />,
    condition: () => true,
    isCompleted: createCardsCompletionCheck(FINANCIAL_INVESTMENTS_CARDS),
    Cards: FINANCIAL_INVESTMENTS_CARDS,
  },
  {
    key: "/user/discovery/estate-planning",
    relativePath: "estate-planning",
    stepTitle: "Estate Planning",
    cardsSelectionTitle: "Estate Planning & Professional Adviser",
    stepIcon: "📋",
    showDiscoveryAddButton: true,
    path: "/user/discovery/estate-planning",
    ...withSpacing({
      icon: "📋",
      label: "Estate Planning",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <EstatePlanning />,
    condition: () => true,
    isCompleted: createCardsCompletionCheck(ESTATE_PLANNING_CARDS),
    Cards: ESTATE_PLANNING_CARDS,
  },
  {
    key: "/user/discovery/personal-insurance",
    relativePath: "personal-insurance",
    stepTitle: "Personal Insurance",
    cardsSelectionTitle: "Personal Insurance",
    stepIcon: "🛡️",
    showDiscoveryAddButton: true,
    path: "/user/discovery/personal-insurance",
    ...withSpacing({
      icon: "🛡️",
      label: " Personal Insurance",
      fontSize: "12px",
      color: "#6b7280",
    }),
    condition: (q) =>
      String(q?.personalInsuranceTab ?? "").toLowerCase() === "yes",
    component: <PersonalInsurance />,
    isCompleted: createSectionCompletionCheck(
      "personalInsuranceTab",
      "personalInsurance",
    ),
    Cards: PERSONAL_INSURANCE_CARDS,
  },
  {
    key: "/user/discovery/business-entities",
    relativePath: "business-entities",
    stepTitle: "Business Entities",
    cardsSelectionTitle: "Business Entities",
    stepIcon: "🏢",
    showDiscoveryAddButton: true,
    path: "/user/discovery/business-entities",
    ...withSpacing({
      icon: "🏢",
      label: "Business Entities",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <BusinessEntities />,
    condition: (q) => {
      return (
        String(q?.BusinessAsCompanyStructure ?? "").toLowerCase() === "yes" ||
        String(q?.BusinessAsTrusts ?? "").toLowerCase() === "yes"
      );
    },
    isCompleted: createCardsCompletionCheck(BUSINESS_ENTITIES_CARDS),
    Cards: BUSINESS_ENTITIES_CARDS,
  },
  {
    key: "/user/discovery/smsf",
    relativePath: "smsf",
    stepTitle: "SMSF",
    stepIcon: "🔐",
    cardsSelectionTitle: "Self Manged Super Fund",
    showDiscoveryAddButton: true,
    path: "/user/discovery/smsf",
    ...withSpacing({
      icon: "🔐",
      label: " SMSF",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <SMSF />,
    condition: (q) =>
      String(q?.SMSFManagedFundsTab ?? "").toLowerCase() === "yes",
    isCompleted: createCardsCompletionCheck(SMSF_CARDS),
    Cards: SMSF_CARDS,
  },
  {
    key: "/user/discovery/investment-trust",
    relativePath: "investment-trust",
    stepTitle: "Investment Trust",
    cardsSelectionTitle: "Family Trust",
    stepIcon: "📊",
    showDiscoveryAddButton: true,
    path: "/user/discovery/investment-trust",
    ...withSpacing({
      icon: "📊",
      label: " Investment Trust",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: <FamilyTrust />,
    condition: (q) =>
      String(q?.businessAsInvestmentTab ?? "").toLowerCase() === "yes",
    isCompleted: createCardsCompletionCheck(FAMILY_TRUST_CARDS),
    Cards: FAMILY_TRUST_CARDS,
  },
  {
    key: "/user/discovery/goals-objectives",
    relativePath: "goals-objectives",
    stepTitle: "Goals & Objectives",
    stepIcon: "🎯",
    showDiscoveryAddButton: true,
    path: "/user/discovery/goals-objectives",
    ...withSpacing({
      icon: "🎯",
      label: "Goals & Objectives",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
    isCompleted: createSectionCompletionCheck(
      "goalsobjectives",
      "goalsObjectives",
    ),
  },
  {
    key: "/user/discovery/risk-profile",
    relativePath: "risk-profile",
    stepTitle: "Risk Profile",
    stepIcon: "🌐",
    path: "/user/discovery/risk-profile",
    ...withSpacing({
      icon: "🌐",
      label: "Risk Profile",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
    isCompleted: createSectionCompletionCheck("riskprofile", "riskProfile"),
  },
  {
    key: "/user/discovery/add-section",
    relativePath: "add-section",
    stepTitle: "Add Section",
    stepIcon: "＋",
    path: "/user/discovery/add-section",
    /** No page route — opens `AddDiscoverySectionsModal` via Jotai (see UserLayout / DiscoveryFlowLayout). */
    modalOnly: true,
    ...withSpacing({
      icon: "＋",
      label: "Add Section",
      fontSize: "12px",
      color: "rgb(34, 197, 94)",
      fontWeight: "700",
    }),
    component: null,
    condition: () => true,
  },
];

/** Menu / stepper key for Add Section (opens modal instead of navigating). */
export const DISCOVERY_ADD_SECTION_KEY = "/user/discovery/add-section";

/** Routes shown in nav + stepper for the current discovery questionnaire state. */
export function getVisibleDiscoveryRoutes(questions = {}) {
  return discoveryRoutes.filter((r) => r.condition?.(questions) !== false);
}

/** Routes that appear in DiscoveryFlowLayout’s horizontal stepper (sidebar can list more). */
export function getDiscoveryStepperRoutes(questions = {}) {
  return getVisibleDiscoveryRoutes(questions).filter(
    (r) => r.showInDiscoveryStepper !== false,
  );
}

export function pathMatchesDiscoveryRoute(pathname, route) {
  if (!route?.relativePath) return false;
  const p = pathname.replace(/\/$/, "");
  return (
    p === route.key ||
    p.endsWith(`/user/discovery/${route.relativePath}`) ||
    p.endsWith(`/${route.relativePath}`)
  );
}

export function matchDiscoveryRoute(pathname, questions) {
  return getVisibleDiscoveryRoutes(questions).find((r) =>
    pathMatchesDiscoveryRoute(pathname, r),
  );
}

export function isDiscoveryRouteCompleted(route, context = {}) {
  if (!route || typeof route.isCompleted !== "function") {
    return false;
  }

  try {
    return Boolean(route.isCompleted({ route, ...context }));
  } catch {
    return false;
  }
}

export function getNextDiscoveryNavKey(pathname, questions) {
  const visible = getVisibleDiscoveryRoutes(questions).filter(
    (r) => !r.modalOnly,
  );
  const idx = visible.findIndex((r) => pathMatchesDiscoveryRoute(pathname, r));
  if (idx >= 0 && idx < visible.length - 1) return visible[idx + 1].key;
  return null;
}

export const strategyRoutes = [
  {
    key: "/strategy/denaro-deck",
    path: "/strategy/denaro-deck",
    ...withSpacing({
      icon: "🃏",
      label: "Denaro Deck",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/scenarios",
    path: "/strategy/scenarios",
    ...withSpacing({
      icon: "📍",
      label: "Scenarios",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/inputs",
    path: "/strategy/inputs",
    ...withSpacing({
      icon: "⬛",
      label: "Inputs",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/cashflow",
    path: "/strategy/cashflow",
    ...withSpacing({
      icon: "$",
      label: "Cashflow",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/networth",
    path: "/strategy/networth",
    ...withSpacing({
      icon: "↗",
      label: "Networth",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/reports",
    path: "/strategy/reports",
    ...withSpacing({
      icon: "📄",
      label: "Reports",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/compare",
    path: "/strategy/compare",
    ...withSpacing({
      icon: "⚖️",
      label: "Compare",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
  {
    key: "/strategy/advice",
    path: "/strategy/advice",
    ...withSpacing({
      icon: "✍️",
      label: "Advice",
      fontSize: "12px",
      color: "#6b7280",
    }),
    component: null,
    condition: () => true,
  },
];

/** Flat routes rendered inside UserLayout (Discovery uses nested routes + DiscoveryFlowLayout). */
export const allUserRoutes = [...userRoutes, ...strategyRoutes];
