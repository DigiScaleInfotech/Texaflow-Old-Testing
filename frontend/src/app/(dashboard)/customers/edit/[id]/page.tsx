"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { customerService } from "@/services/customer.service";
import {
  ArrowLeft,
  Save,
  Building2,
  Mail,
  Copy,
  Info,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  ChevronDown,
  Phone,
  Camera,
  UserCircle,
  X,
} from "lucide-react";

interface ContactPerson {
  id: string;
  name: string;
  designation: string;
  phone: string;
}

type TabType =
  | "other"
  | "address"
  | "brokerage"
  | "contacts"
  | "bank"
  | "remarks";

export default function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("other");
  const [copiedBilling, setCopiedBilling] = useState(false);
  const [showAccountNum, setShowAccountNum] = useState(false);
  const [showReAccountNum, setShowReAccountNum] = useState(false);

  // Profile Image
  const [image, setImage] = useState<string>("");

  // Primary Information
  const [accountType, setAccountType] = useState<string>("Customer");
  const [salutation, setSalutation] = useState<string>("Mr.");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [gstNumber, setGstNumber] = useState<string>("");
  const [workPhoneCode, setWorkPhoneCode] = useState<string>("+91");
  const [workPhone, setWorkPhone] = useState<string>("");
  const [mobileCode, setMobileCode] = useState<string>("+91");
  const [mobile, setMobile] = useState<string>("");
  const [partyLanguage, setPartyLanguage] = useState<string>("ENGLISH");

  // Other Details
  const [pan, setPan] = useState<string>("");
  const [accountsPayable, setAccountsPayable] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR - INDIAN RUPEE");
  const [paymentTerms, setPaymentTerms] = useState<string>("Due on Receipt");
  const [openingBalance, setOpeningBalance] = useState<string>("0");
  const [creditLimit, setCreditLimit] = useState<string>("0");
  const [isMsmeRegistered, setIsMsmeRegistered] = useState<boolean>(false);
  const [msmeType, setMsmeType] = useState<string>("");
  const [msmeRegNumber, setMsmeRegNumber] = useState<string>("");
  const [tds, setTds] = useState<string>("");
  const [allowPortalAccess, setAllowPortalAccess] = useState<boolean>(false);

  // Address - Billing
  const [billingAttention, setBillingAttention] = useState<string>("");
  const [billingCountry, setBillingCountry] = useState<string>("");
  const [billingStreet1, setBillingStreet1] = useState<string>("");
  const [billingStreet2, setBillingStreet2] = useState<string>("");
  const [billingCity, setBillingCity] = useState<string>("");
  const [billingState, setBillingState] = useState<string>("");
  const [billingPinCode, setBillingPinCode] = useState<string>("");
  const [billingPhone, setBillingPhone] = useState<string>("");

  // Address - Shipping
  const [shippingAttention, setShippingAttention] = useState<string>("");
  const [shippingCountry, setShippingCountry] = useState<string>("");
  const [shippingStreet1, setShippingStreet1] = useState<string>("");
  const [shippingStreet2, setShippingStreet2] = useState<string>("");
  const [shippingCity, setShippingCity] = useState<string>("");
  const [shippingState, setShippingState] = useState<string>("");
  const [shippingPinCode, setShippingPinCode] = useState<string>("");
  const [shippingPhone, setShippingPhone] = useState<string>("");

  // Brokerage
  const [brokerName, setBrokerName] = useState<string>("");
  const [brokerWorkPhone, setBrokerWorkPhone] = useState<string>("");
  const [brokerMobile, setBrokerMobile] = useState<string>("");
  const [brokerPercentage, setBrokerPercentage] = useState<string>("");
  const [brokerEmail, setBrokerEmail] = useState<string>("");

  // Contact Persons
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
  const [newContactName, setNewContactName] = useState<string>("");
  const [newContactDesignation, setNewContactDesignation] = useState<string>("");
  const [newContactPhone, setNewContactPhone] = useState<string>("");

  // Bank Details
  const [accountHolderName, setAccountHolderName] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [reAccountNumber, setReAccountNumber] = useState<string>("");
  const [ifsc, setIfsc] = useState<string>("");
  const [upiId, setUpiId] = useState<string>("");
  const [qrCodeSetup, setQrCodeSetup] = useState<"auto" | "custom">("auto");

  // Remarks
  const [remarks, setRemarks] = useState<string>("");

  const handleCopyBillingAddress = () => {
    setShippingAttention(billingAttention);
    setShippingCountry(billingCountry);
    setShippingStreet1(billingStreet1);
    setShippingStreet2(billingStreet2);
    setShippingCity(billingCity);
    setShippingState(billingState);
    setShippingPinCode(billingPinCode);
    setShippingPhone(billingPhone);
    setCopiedBilling(true);
    setTimeout(() => setCopiedBilling(false), 2000);
  };

  const handleAddContact = () => {
    if (!newContactName.trim()) return;
    const newPerson: ContactPerson = {
      id: Date.now().toString(),
      name: newContactName.trim(),
      designation: newContactDesignation.trim(),
      phone: newContactPhone.trim(),
    };
    setContactPersons((prev) => [...prev, newPerson]);
    setNewContactName("");
    setNewContactDesignation("");
    setNewContactPhone("");
  };

  const handleRemoveContact = (id: string) => {
    setContactPersons((prev) => prev.filter((p) => p.id !== id));
  };

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        setIsLoading(true);
        const data = await customerService.getCustomerById(params.id);
        if (data) {
          setImage(data.image || "");
          setAccountType(data.accountType || "Customer");
          setSalutation(data.salutation || "Mr.");
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setCompanyName(data.companyName || "");
          setDisplayName(data.displayName || data.name || "");
          setEmail(data.email || "");
          setGstNumber(data.gstNumber || "");
          setWorkPhone(data.workPhone || "");
          setMobile(data.mobile || data.phone || "");
          setPartyLanguage(data.partyLanguage || "ENGLISH");

          setPan(data.pan || "");
          setAccountsPayable(data.accountsPayable || "");
          setCurrency(data.currency || "INR - INDIAN RUPEE");
          setPaymentTerms(data.paymentTerms || "Due on Receipt");
          setOpeningBalance(String(data.openingBalance ?? 0));
          setCreditLimit(String(data.creditLimit ?? 0));
          setIsMsmeRegistered(!!data.isMsmeRegistered);
          setMsmeType(data.msmeType || "");
          setMsmeRegNumber(data.msmeRegNumber || "");
          setTds(data.tds || "");
          setAllowPortalAccess(!!data.allowPortalAccess);

          if (data.billingAddress) {
            setBillingAttention(data.billingAddress.attention || "");
            setBillingCountry(data.billingAddress.country || "");
            setBillingStreet1(data.billingAddress.street1 || "");
            setBillingStreet2(data.billingAddress.street2 || "");
            setBillingCity(data.billingAddress.city || "");
            setBillingState(data.billingAddress.state || "");
            setBillingPinCode(data.billingAddress.pinCode || "");
            setBillingPhone(data.billingAddress.phone || "");
          } else if (data.address) {
            setBillingStreet1(typeof data.address === "string" ? data.address : "");
            setBillingCity(data.city || "");
            setBillingState(data.state || "");
            setBillingPinCode(data.postalCode || "");
          }

          if (data.shippingAddress) {
            setShippingAttention(data.shippingAddress.attention || "");
            setShippingCountry(data.shippingAddress.country || "");
            setShippingStreet1(data.shippingAddress.street1 || "");
            setShippingStreet2(data.shippingAddress.street2 || "");
            setShippingCity(data.shippingAddress.city || "");
            setShippingState(data.shippingAddress.state || "");
            setShippingPinCode(data.shippingAddress.pinCode || "");
            setShippingPhone(data.shippingAddress.phone || "");
          }

          if (data.brokerage) {
            setBrokerName(data.brokerage.brokerName || "");
            setBrokerWorkPhone(data.brokerage.workPhone || "");
            setBrokerMobile(data.brokerage.mobile || "");
            setBrokerPercentage(data.brokerage.percentage || "");
            setBrokerEmail(data.brokerage.email || "");
          }

          if (Array.isArray(data.contactPersons) && data.contactPersons.length > 0) {
            setContactPersons(
              data.contactPersons.map((p: any, idx: number) => ({
                id: p.id || String(idx + 1),
                name: p.name || "",
                designation: p.designation || "",
                phone: p.phone || "",
              }))
            );
          }

          if (data.bankDetails) {
            setAccountHolderName(data.bankDetails.accountHolderName || "");
            setBankName(data.bankDetails.bankName || "");
            setAccountNumber(data.bankDetails.accountNumber || "");
            setReAccountNumber(data.bankDetails.accountNumber || "");
            setIfsc(data.bankDetails.ifsc || "");
            setUpiId(data.bankDetails.upiId || "");
            setQrCodeSetup(data.bankDetails.qrCodeSetup || "NONE");
          }

          setRemarks(data.remarks || data.notes || "");
        }
      } catch (err) {
        console.error("Failed to load customer:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadCustomer();
    }
  }, [params.id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (accountNumber && reAccountNumber && accountNumber !== reAccountNumber) {
      alert("Bank Account Numbers do not match!");
      return;
    }

    const calculatedName =
      displayName.trim() ||
      companyName.trim() ||
      `${firstName} ${lastName}`.trim();

    const formattedMobile = mobile.trim()
      ? mobile.startsWith("+")
        ? mobile.trim()
        : `${mobileCode} ${mobile.trim()}`
      : "";
    const formattedWorkPhone = workPhone.trim()
      ? workPhone.startsWith("+")
        ? workPhone.trim()
        : `${workPhoneCode} ${workPhone.trim()}`
      : "";
    const calculatedPhone = formattedMobile || formattedWorkPhone;

    if (!calculatedName) {
      alert("Please provide a Display Name, Company Name, or Contact Name.");
      return;
    }
    if (!calculatedPhone) {
      alert("Please provide a Mobile or Work Phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      await customerService.updateCustomer(params.id, {
        name: calculatedName,
        phone: calculatedPhone,
        mobile: formattedMobile,
        workPhone: formattedWorkPhone,
        email: email.trim(),
        companyName: companyName.trim(),
        gstNumber: gstNumber.trim(),
        pan: pan.trim(),
        address:
          billingStreet1.trim() +
          (billingStreet2.trim() ? `, ${billingStreet2.trim()}` : ""),
        city: billingCity.trim(),
        state: billingState.trim(),
        postalCode: billingPinCode.trim(),
        country: billingCountry.trim(),
        notes: remarks.trim(),
        gender: "male",

        accountType,
        salutation,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim(),
        partyLanguage,
        accountsPayable,
        currency,
        paymentTerms,
        openingBalance: parseFloat(openingBalance) || 0,
        creditLimit: parseFloat(creditLimit) || 0,
        image,
        isMsmeRegistered,
        msmeType: isMsmeRegistered ? msmeType : "",
        msmeRegNumber: isMsmeRegistered ? msmeRegNumber : "",
        tds,
        allowPortalAccess,

        billingAddress: {
          attention: billingAttention.trim(),
          country: billingCountry.trim(),
          street1: billingStreet1.trim(),
          street2: billingStreet2.trim(),
          city: billingCity.trim(),
          state: billingState.trim(),
          pinCode: billingPinCode.trim(),
          phone: billingPhone.trim(),
        },

        shippingAddress: {
          attention: shippingAttention.trim(),
          country: shippingCountry.trim(),
          street1: shippingStreet1.trim(),
          street2: shippingStreet2.trim(),
          city: shippingCity.trim(),
          state: shippingState.trim(),
          pinCode: shippingPinCode.trim(),
          phone: shippingPhone.trim(),
        },

        brokerage: {
          brokerName: brokerName.trim(),
          workPhone: brokerWorkPhone.trim(),
          mobile: brokerMobile.trim(),
          percentage: brokerPercentage.trim(),
          email: brokerEmail.trim(),
        },

        contactPersons,

        bankDetails: {
          accountHolderName: accountHolderName.trim(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifsc: ifsc.trim(),
          upiId: upiId.trim(),
          qrCodeSetup,
        },

        remarks: remarks.trim(),
      });

      router.push("/customers");
    } catch (error: any) {
      console.error("Error updating customer:", error);
      alert(error?.message || "Failed to update customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountTypeOptions = [
    "Supplier",
    "Customer",
    "Dyeing & Printing Mill",
    "Job Work",
    "Broker",
    "Trading Partner",
    "Internal Firm",
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading customer details...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        {/* Card 1: Primary Information */}
        <div className="glass-card rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Primary Information
            </h2>
          </div>

          {/* Customer Photo / Logo Upload */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
              {image ? (
                <Image src={image} alt="Customer" fill className="object-cover" />
              ) : (
                <UserCircle className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                Customer Photo / Logo
              </label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-xs font-medium transition-colors">
                  <Camera size={14} />
                  <span>{image ? "Change Photo" : "Upload Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X size={13} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                JPG, PNG or WEBP up to 2MB
              </p>
            </div>
          </div>

          {/* Account Type Radio Options */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-red-500 dark:text-red-400">
              Account Type*
            </label>
            <div className="md:col-span-3 flex flex-wrap gap-4 items-center">
              {accountTypeOptions.map((type) => (
                <label
                  key={type}
                  className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="radio"
                    name="accountType"
                    value={type}
                    checked={accountType === type}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Primary Contact: Salutation + First Name + Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Primary Contact
            </label>
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={salutation}
                onChange={(e) => setSalutation(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Salutation">Salutation</option>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
              </select>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Company Name */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Company Name
            </label>
            <div className="md:col-span-3">
              <input
                type="text"
                placeholder="e.g. Vardhman Thread Mills"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Display Name */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-red-500 dark:text-red-400">
              Display Name*
            </label>
            <div className="md:col-span-3 space-y-1">
              <input
                type="text"
                placeholder="Select or type to add"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                If left blank, Company Name will be used.
              </p>
            </div>
          </div>

          {/* Email Address */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <div className="md:col-span-3 relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                placeholder="vendor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* GST */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              GST
            </label>
            <div className="md:col-span-3">
              <input
                type="text"
                placeholder="E.G. 24AABCU9603R1ZM"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
              />
            </div>
          </div>

          {/* Phone: Work Phone + Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone
            </label>
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Work Phone */}
              <div className="flex gap-2">
                <div className="relative w-20 flex-shrink-0">
                  <select
                    value={workPhoneCode}
                    onChange={(e) => setWorkPhoneCode(e.target.value)}
                    style={{ backgroundImage: "none" }}
                    className="w-full appearance-none pl-2.5 pr-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+971">+971</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                <div className="relative flex-1">
                  <Phone
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    placeholder="Work Phone"
                    value={workPhone}
                    onChange={(e) => setWorkPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Mobile */}
              <div className="flex gap-2">
                <div className="relative w-20 flex-shrink-0">
                  <select
                    value={mobileCode}
                    onChange={(e) => setMobileCode(e.target.value)}
                    style={{ backgroundImage: "none" }}
                    className="w-full appearance-none pl-2.5 pr-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+971">+971</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                <div className="relative flex-1">
                  <Phone
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Party Language */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Party Language
            </label>
            <div className="md:col-span-3">
              <select
                value={partyLanguage}
                onChange={(e) => setPartyLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ENGLISH">ENGLISH</option>
                <option value="GUJARATI">GUJARATI</option>
                <option value="HINDI">HINDI</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Tabbed Sections */}
        <div className="glass-card rounded-xl p-6 space-y-6">
          {/* Tabs Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setActiveTab("other")}
              className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "other"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Other Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("address")}
              className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "address"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Address
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("brokerage")}
              className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "brokerage"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Brokerage
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contacts")}
              className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "contacts"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Contact Persons
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bank")}
              className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "bank"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Bank Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("remarks")}
              className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "remarks"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Remarks
            </button>
          </div>

          {/* Tab 1: Other Details */}
          {activeTab === "other" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                    PAN
                  </label>
                  <input
                    type="text"
                    placeholder="E.G. AAACV1234F"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="INR - INDIAN RUPEE">INR - INDIAN RUPEE</option>
                    <option value="USD - US DOLLAR">USD - US DOLLAR</option>
                    <option value="EUR - EURO">EUR - EURO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                    Opening Balance
                  </label>
                  <div className="flex">
                    <span className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-r-0 border-gray-200 dark:border-gray-600 rounded-l-lg text-xs font-mono text-gray-700 dark:text-gray-300 flex items-center">
                      INR
                    </span>
                    <input
                      type="number"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                    Credit Limit
                  </label>
                  <div className="flex">
                    <span className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-r-0 border-gray-200 dark:border-gray-600 rounded-l-lg text-xs font-mono text-gray-700 dark:text-gray-300 flex items-center">
                      INR
                    </span>
                    <input
                      type="number"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                    TDS
                  </label>
                  <select
                    value={tds}
                    onChange={(e) => setTds(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">SELECT TAX</option>
                    <option value="TDS 0.1%">TDS 0.1%</option>
                    <option value="TDS 1%">TDS 1%</option>
                    <option value="TDS 2%">TDS 2%</option>
                    <option value="TDS 5%">TDS 5%</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                    Accounts Payable / Receivable
                  </label>
                  <select
                    value={accountsPayable}
                    onChange={(e) => setAccountsPayable(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">SELECT AN ACCOUNT</option>
                    <option value="Accounts Receivable">Accounts Receivable</option>
                    <option value="Sundry Debtors">Sundry Debtors</option>
                    <option value="Trade Debtors">Trade Debtors</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>

                <div className="pt-3 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={isMsmeRegistered}
                      onChange={(e) => setIsMsmeRegistered(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900 dark:text-white">This party is MSME registered</span>
                  </label>

                  {/* Conditional MSME options */}
                  {isMsmeRegistered && (
                    <div className="border-l-2 border-blue-500 pl-4 py-2 space-y-3 ml-2">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          MSME/Udyam Type
                        </label>
                        <div className="md:col-span-3">
                          <select
                            value={msmeType}
                            onChange={(e) => setMsmeType(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="">SELECT THE REGISTRATION TYPE</option>
                            <option value="MICRO">MICRO</option>
                            <option value="SMALL">SMALL</option>
                            <option value="MEDIUM">MEDIUM</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          MSME Reg Number
                        </label>
                        <div className="md:col-span-3">
                          <input
                            type="text"
                            placeholder="Enter the Registration Number"
                            value={msmeRegNumber}
                            onChange={(e) => setMsmeRegNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={allowPortalAccess}
                      onChange={(e) => setAllowPortalAccess(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                    />
                    <span>Allow portal access for this party</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Address */}
          {activeTab === "address" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
              {/* Billing Address */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase text-gray-800 dark:text-gray-200 tracking-wider pb-2 border-b border-gray-200 dark:border-gray-700">
                  Billing Address
                </h3>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Attention
                  </label>
                  <input
                    type="text"
                    value={billingAttention}
                    onChange={(e) => setBillingAttention(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Country/Region
                  </label>
                  <select
                    value={billingCountry}
                    onChange={(e) => setBillingCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="INDIA">INDIA</option>
                    <option value="USA">USA</option>
                    <option value="UAE">UAE</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="Street 1"
                    value={billingStreet1}
                    onChange={(e) => setBillingStreet1(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Street 2"
                    value={billingStreet2}
                    onChange={(e) => setBillingStreet2(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={billingCity}
                      onChange={(e) => setBillingCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={billingState}
                      onChange={(e) => setBillingState(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Pin Code
                    </label>
                    <input
                      type="text"
                      value={billingPinCode}
                      onChange={(e) => setBillingPinCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={billingPhone}
                      onChange={(e) => setBillingPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold uppercase text-gray-800 dark:text-gray-200 tracking-wider">
                    Shipping Address
                  </h3>
                  <button
                    type="button"
                    onClick={handleCopyBillingAddress}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {copiedBilling ? (
                      <>
                        <Check size={14} className="text-green-500" />
                        <span className="text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy billing address
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Attention
                  </label>
                  <input
                    type="text"
                    value={shippingAttention}
                    onChange={(e) => setShippingAttention(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Country/Region
                  </label>
                  <select
                    value={shippingCountry}
                    onChange={(e) => setShippingCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="INDIA">INDIA</option>
                    <option value="USA">USA</option>
                    <option value="UAE">UAE</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="Street 1"
                    value={shippingStreet1}
                    onChange={(e) => setShippingStreet1(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Street 2"
                    value={shippingStreet2}
                    onChange={(e) => setShippingStreet2(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={shippingState}
                      onChange={(e) => setShippingState(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Pin Code
                    </label>
                    <input
                      type="text"
                      value={shippingPinCode}
                      onChange={(e) => setShippingPinCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={shippingPhone}
                      onChange={(e) => setShippingPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Brokerage */}
          {activeTab === "brokerage" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs">
                <Info size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  Provide details of the broker or agent mediating this relationship.
                  This information applies to Supplier (Purchases), Customer (Sales),
                  or Both.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Broker Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter broker name"
                      value={brokerName}
                      onChange={(e) => setBrokerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mobile
                    </label>
                    <div className="flex gap-2">
                      <div className="relative w-20 flex-shrink-0">
                        <select
                          style={{ backgroundImage: "none" }}
                          className="w-full appearance-none pl-2.5 pr-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                        >
                          <option value="+91">+91</option>
                          <option value="+1">+1</option>
                          <option value="+44">+44</option>
                          <option value="+971">+971</option>
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                      <div className="relative flex-1">
                        <Phone
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="tel"
                          placeholder="Enter mobile number"
                          value={brokerMobile}
                          onChange={(e) => setBrokerMobile(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Broker Email
                    </label>
                    <input
                      type="email"
                      placeholder="broker@example.com"
                      value={brokerEmail}
                      onChange={(e) => setBrokerEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Work Phone
                    </label>
                    <div className="flex gap-2">
                      <div className="relative w-20 flex-shrink-0">
                        <select
                          style={{ backgroundImage: "none" }}
                          className="w-full appearance-none pl-2.5 pr-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                        >
                          <option value="+91">+91</option>
                          <option value="+1">+1</option>
                          <option value="+44">+44</option>
                          <option value="+971">+971</option>
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                      <div className="relative flex-1">
                        <Phone
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="tel"
                          placeholder="Enter phone number"
                          value={brokerWorkPhone}
                          onChange={(e) => setBrokerWorkPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Percentage Brokerage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 2.5"
                      value={brokerPercentage}
                      onChange={(e) => setBrokerPercentage(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Contact Persons */}
          {activeTab === "contacts" && (
            <div className="space-y-6 pt-2">
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/40 space-y-3">
                <h4 className="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                  Add New Contact Person
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="Name"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="Designation"
                      value={newContactDesignation}
                      onChange={(e) => setNewContactDesignation(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddContact}
                    className="h-10 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus size={16} />
                    Add Contact
                  </button>
                </div>
              </div>

              {contactPersons.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase text-gray-700 dark:text-gray-300">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Designation</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {contactPersons.map((person) => (
                        <tr
                          key={person.id}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {person.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {person.designation || "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-300">
                            {person.phone || "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveContact(person.id)}
                              className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete Contact"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  No contact persons added yet. Use the form above to add key contacts.
                </p>
              )}
            </div>
          )}

          {/* Tab 5: Bank Details */}
          {activeTab === "bank" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vardhman Thread Mills"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-red-500 dark:text-red-400 mb-1">
                    Account Number*
                  </label>
                  <div className="relative">
                    <input
                      type={showAccountNum ? "text" : "password"}
                      placeholder="Bank Account Number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 pr-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccountNum(!showAccountNum)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {showAccountNum ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-red-500 dark:text-red-400 mb-1">
                    IFSC*
                  </label>
                  <input
                    type="text"
                    placeholder="E.G. HDFC0000102"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
                    QR Code Setup
                  </label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="qrCodeSetup"
                        value="auto"
                        checked={qrCodeSetup === "auto"}
                        onChange={() => setQrCodeSetup("auto")}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                      />
                      <span>Auto Generate from UPI</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="qrCodeSetup"
                        value="custom"
                        checked={qrCodeSetup === "custom"}
                        onChange={() => setQrCodeSetup("custom")}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                      />
                      <span>Upload Custom QR</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-red-500 dark:text-red-400 mb-1">
                    Re-enter Account Number*
                  </label>
                  <div className="relative">
                    <input
                      type={showReAccountNum ? "text" : "password"}
                      placeholder="Re-enter Account Number"
                      value={reAccountNumber}
                      onChange={(e) => setReAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 pr-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowReAccountNum(!showReAccountNum)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {showReAccountNum ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1234567890@ybl"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Remarks */}
          {activeTab === "remarks" && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                Internal Remarks & Customer Notes
              </label>
              <textarea
                rows={5}
                placeholder="Enter any specific notes regarding lead time, yarn quality standards, or payment agreements..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Perfectly Fixed Bottom Actions Bar */}
        <div className="fixed bottom-0 right-0 left-0 md:left-[var(--sidebar-width,16rem)] h-16 px-6 md:px-8 bg-white/95 dark:bg-[#202936]/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700/80 flex items-center justify-end gap-3 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-all duration-300">
          <Link
            href="/customers"
            className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Updating Customer...
              </>
            ) : (
              <>
                <Save size={16} />
                Update Customer
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
