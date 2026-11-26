"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Check, X, ChevronRight } from "lucide-react";
import Iridescence from "./Iridescence";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle:
    | "monthly"
    | "quarterly"
    | "yearly"
    | "3 months"
    | "6 months"
    | "1 year";
  features: string[];
  isActive: boolean;
}

interface SubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionDialog({
  isOpen,
  onClose,
}: SubscriptionDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "plan-1",
      name: "Basic",
      price: 999,
      billingCycle: "monthly",
      features: [
        "1-month duration",
        "₹999 per month",
        "Ideal for new users",
        "Monthly renewal option",
      ],
      isActive: true,
    },
    {
      id: "plan-2",
      name: "Starter",
      price: 2699,
      billingCycle: "3 months",
      features: [
        "3-month duration",
        "₹899 per month (₹2,699 total)",
        "Great for short-term users",
        "10% savings vs monthly",
      ],
      isActive: true,
    },
    {
      id: "plan-3",
      name: "Pro",
      price: 4799,
      billingCycle: "6 months",
      features: [
        "6-month duration",
        "₹799 per month (₹4,799 total)",
        "Most popular choice",
        "20% savings vs monthly",
        "Best value for versatility",
      ],
      isActive: true,
    },
    {
      id: "plan-4",
      name: "Masterpiece",
      price: 9999,
      billingCycle: "1 year",
      features: [
        "Full 1-year duration",
        "₹833 per month (₹9,999 total)",
        "Maximum value for serious users",
        "17% savings vs monthly",
        "Priority support",
      ],
      isActive: true,
    },
  ];

  // Auto-select the "Pro (Popular)" plan by default
  const [selectedPlan, setSelectedPlan] = useState<string>("plan-3");

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleConfirmSubscription = () => {
    setLoading(true);

    // Simulate API call for subscription
    setTimeout(() => {
      // In a real app, you would store the selected plan in user's profile
      localStorage.setItem("vendorSubscriptionPlan", selectedPlan);
      setLoading(false);
      onClose();
      router.push("/dashboard");
    }, 1500);
  };

  const handleSkip = () => {
    // Set a flag that user skipped subscription
    localStorage.setItem("vendorSubscriptionSkipped", "true");
    onClose();
    router.push("/dashboard");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 -top-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full flex flex-col overflow-hidden"
          >
            {/* Iridescence background */}
            <div className="absolute inset-0 z-0">
              <Iridescence
                color={[1, 1, 1]}
                mouseReact={false}
                amplitude={0.1}
                speed={1.0}
              />
            </div>
            <h2
              className="text-6xl font-bold  drop-shadow-md  mx-auto text-center pt-10 pb-6 z-10"
              style={{
              textShadow: "0 0 15px rgba(0, 0, 0, 0.5)",
              mixBlendMode: "overlay",
              WebkitTextStroke: "0.2px white",
              }}
            >
              Choose Your Plan
            </h2>

            {/* Header with shadow for better readability */}
            <div className="relative z-10 text-center pb-6">
              <p className="text-gray-800 mt-2 text-lg font-medium drop-shadow-md">
                Select a subscription plan that fits your needs
              </p>
            </div>

            {/* Plans - Scrollable area */}
            <div className="overflow-y-auto flex-grow relative z-10 px-6 md:px-12 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={` relative border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 backdrop-blur-md ${
                      selectedPlan === plan.id
                        ? "border-blue-800  ring-2 ring-blue-800/30 transform scale-[1.05] bg-white/5"
                        : "border-gray-800/20 hover:border-blue-800/60 bg-white/40"
                    } ${plan.id === "plan-3" ? "scale-[1.05] bg-white/5" : ""}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      maxHeight: "480px", // Fixed height instead of percentage
                      minWidth: "270px",
                      margin: "0 auto",
                    }}
                  >
                    {/* Popular tag for Pro plan */}
                    {plan.id === "plan-3" && (
                      <div className="z-[9999] absolute top-0 right-0 bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        MOST POPULAR
                      </div>
                    )}

                    {/* Plan header */}
                    <div
                      className={`p-4 backdrop-blur-sm ${
                        selectedPlan === plan.id
                          ? "bg-blue-100/80"
                          : "bg-white/5"
                      }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <h3 className="font-semibold text-xl text-gray-900 mb-1">
                          {plan.name}
                        </h3>

                        {selectedPlan === plan.id && (
                          <div className="bg-blue-700 text-white p-1 rounded-full mb-2">
                            <Check size={16} />
                          </div>
                        )}

                        <div className="mt-2 flex flex-col items-center">
                          <span className="text-3xl font-bold text-gray-900">
                            ₹{plan.price.toLocaleString("en-IN")}
                          </span>
                          <span className="mt-0.5 text-sm text-gray-700 font-medium">
                            per {plan.billingCycle}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="p-4 bg-gray-100/80 backdrop-blur-sm flex-grow">
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <Check
                              size={16}
                              className="mt-0.5 mr-2 text-green-700 flex-shrink-0"
                            />
                            <span className="text-gray-800 text-sm font-medium">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Selection button */}
                    <div className="p-3 text-center bg-white/40 backdrop-blur-sm">
                      <button
                        className={`w-full py-2 rounded-lg transition-colors ${
                          selectedPlan === plan.id
                            ? "bg-blue-700 text-white"
                            : "bg-gray-800/70 text-white hover:bg-gray-800/90"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPlan(plan.id);
                        }}
                      >
                        {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                      </button>
                    </div>

                    {/* Selection indicator */}
                    {selectedPlan === plan.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-blue-700"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="p-8 flex justify-between items-center flex-shrink-0 relative z-10 max-w-5xl mx-auto w-full">
              <button
                onClick={handleSkip}
                className="px-8 py-3 border border-gray-800/40 rounded-lg text-gray-900 bg-white/40 hover:bg-white/5 transition-colors backdrop-blur-sm text-base font-medium"
              >
                Skip for now
              </button>

              <button
                onClick={handleConfirmSubscription}
                disabled={loading}
                className="px-8 py-3 rounded-lg bg-blue-700 text-white flex items-center justify-center gap-2 hover:bg-blue-800 min-w-[220px] text-base"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
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
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Subscription
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
