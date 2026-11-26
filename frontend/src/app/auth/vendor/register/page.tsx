"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  AtSign,
  Lock,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
} from "lucide-react";
import { authService } from "@/services/auth.service";

export default function VendorRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    companyName: "",
    gstNumber: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.companyName.trim())
        newErrors.companyName = "Company name is required";
    }

    if (step === 2) {
      if (!formData.contactPerson.trim())
        newErrors.contactPerson = "Contact person name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      if (!formData.email.includes("@"))
        newErrors.email = "Please enter a valid email";
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
      if (!formData.address.trim()) newErrors.address = "Address is required";
    }

    if (step === 3) {
      if (!formData.username.trim())
        newErrors.username = "Username is required";
      if (formData.username.length < 4)
        newErrors.username = "Username must be at least 4 characters";
      if (!formData.password) newErrors.password = "Password is required";
      if (formData.password.length < 6)
        newErrors.password = "Password must be at least 6 characters";
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) return;

    setLoading(true);

    try {
      const nameParts = formData.contactPerson.trim().split(" ");
      const firstName = nameParts[0] || formData.contactPerson;
      const lastName = nameParts.slice(1).join(" ") || "Vendor";

      const payload = {
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        username: formData.username,
        password: formData.password,
        organizationDetails: {
          name: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          gstNumber: formData.gstNumber || undefined,
          businessType: "Manufacturer & Wholesaler",
        },
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.pincode,
          country: "India",
        },
      };

      await authService.registerVendor(payload);
      alert("Vendor registration successful! Your application has been submitted to the admin for review.");
      router.push("/auth/login");
    } catch (err: any) {
      console.error("Vendor registration error:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Please check your details and try again.";
      setErrors((prev) => ({ ...prev, general: errMsg }));
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step titles for progress indicator
  const stepTitles = [
    "Company Information",
    "Contact Details",
    "Account Setup",
  ];

  // Render the appropriate form step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Company Information
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="companyName"
                  className="flex items-center gap-2 text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                >
                  <Building size={16} className="text-blue-500" />
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`w-full p-3 bg-gray-100 dark:bg-gray-700 border ${
                    errors.companyName
                      ? "border-red-400 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 transition-all`}
                  placeholder="Enter your textile company name"
                />
                {errors.companyName && (
                  <p className="mt-1 text-red-500 text-sm">
                    {errors.companyName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="gstNumber"
                  className="flex items-center gap-2 text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                >
                  <FileText size={16} className="text-blue-500" />
                  GST Number (Optional)
                </label>
                <input
                  type="text"
                  id="gstNumber"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 font-mono transition-all"
                  placeholder="e.g. 24AAACH7409R1ZZ"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Note:</span> TextTile CRM is
                  specifically designed for textile industry businesses.
                </p>
              </div>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Contact Details
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="contactPerson"
                  className="flex items-center gap-2 text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                >
                  <User size={16} className="text-blue-500" />
                  Contact Person
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className={`w-full p-3 bg-gray-100 dark:bg-gray-700 border ${
                    errors.contactPerson
                      ? "border-red-400 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 transition-all`}
                  placeholder="Enter contact person name"
                />
                {errors.contactPerson && (
                  <p className="mt-1 text-red-500 text-sm">
                    {errors.contactPerson}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="email"
                    className="flex items-center gap-2 text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                  >
                    <Mail size={16} className="text-blue-500" />
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full p-3 bg-gray-100 dark:bg-gray-700 border ${
                      errors.email
                        ? "border-red-400 dark:border-red-600"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 transition-all`}
                    placeholder="Enter business email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="flex items-center gap-2 text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                  >
                    <Phone size={16} className="text-blue-500" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full p-3 bg-gray-100 dark:bg-gray-700 border ${
                      errors.phone
                        ? "border-red-400 dark:border-red-600"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 transition-all`}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-red-500 text-sm">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="flex items-center gap-2 text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                >
                  <MapPin size={16} className="text-blue-500" />
                  Business Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full p-3 bg-gray-100 dark:bg-gray-700 border ${
                    errors.address
                      ? "border-red-400 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 transition-all`}
                  rows={2}
                  placeholder="Enter your business address"
                />
                {errors.address && (
                  <p className="mt-1 text-red-500 text-sm">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                  >
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pincode"
                    className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                  >
                    Pincode
                  </label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                    placeholder="Pincode"
                  />
                </div>
              </div>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Account Setup
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="flex items-center gap-2 text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                >
                  <User size={16} className="text-blue-500" />
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full p-3 bg-gray-100 dark:bg-gray-700 border ${
                    errors.username
                      ? "border-red-400 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 transition-all`}
                  placeholder="Choose a username"
                />
                {errors.username && (
                  <p className="mt-1 text-red-500 text-sm">{errors.username}</p>
                )}
                {formData.username && !errors.username && (
                  <p className="mt-1 text-green-500 text-sm flex items-center gap-1">
                    <CheckCircle size={14} /> Username is available
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="flex items-center gap-2 text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                >
                  <Lock size={16} className="text-blue-500" />
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full p-3 bg-gray-100 dark:bg-gray-700 border ${
                    errors.password
                      ? "border-red-400 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 transition-all`}
                  placeholder="Create a password"
                />
                {errors.password && (
                  <p className="mt-1 text-red-500 text-sm">{errors.password}</p>
                )}
                {formData.password && formData.password.length >= 6 && (
                  <p className="mt-1 text-green-500 text-sm flex items-center gap-1">
                    <CheckCircle size={14} /> Password is strong
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="flex items-center gap-2 text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
                >
                  <Lock size={16} className="text-blue-500" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full p-3 bg-gray-100 dark:bg-gray-700 border ${
                    errors.confirmPassword
                      ? "border-red-400 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 transition-all`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-red-500 text-sm">
                    {errors.confirmPassword}
                  </p>
                )}
                {formData.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <p className="mt-1 text-green-500 text-sm flex items-center gap-1">
                      <CheckCircle size={14} /> Passwords match
                    </p>
                  )}
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="glass-card p-8 rounded-xl shadow-lg bg-white dark:bg-[#1e293b] border border-gray-300 dark:border-gray-600">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
        Vendor Registration
      </h2>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between w-full">
          {stepTitles.map((title, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep === stepNumber;
            const isCompleted = currentStep > stepNumber;

            return (
              <div
                key={title}
                className={`flex flex-col items-center ${
                  stepNumber !== stepTitles.length ? "w-1/3" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {isCompleted ? <CheckCircle size={16} /> : stepNumber}
                </div>
                <span
                  className={`text-xs ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400 font-medium"
                      : isCompleted
                      ? "text-green-500 font-medium"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {title}
                </span>

                {/* Connector line */}
                {stepNumber !== stepTitles.length && (
                  <div
                    className={`h-0.5 w-full mt-4 ${
                      isCompleted
                        ? "bg-green-500"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={
          currentStep === totalSteps ? handleSubmit : (e) => e.preventDefault()
        }
      >
        {renderStep()}

        <div className="mt-6 flex justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-2 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 flex items-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Registering...
                </span>
              ) : (
                "Complete Registration"
              )}
            </button>
          )}
        </div>
      </form>

      {/* We still show the login link at the bottom but without the step buttons */}
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-gray-700 dark:text-gray-300">
          Already have a vendor account?{" "}
          <Link
            href="/auth/login"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
