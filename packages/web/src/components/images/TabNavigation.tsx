"use client";

import { ShoppingCart, Image as ImageIcon, Wand2 } from "lucide-react";
import { useImagesStore } from "@contractor-platform/utils";

export function TabNavigation() {
  const { activeTab, setActiveTab, libraryImages } = useImagesStore();

  const tabs = [
    {
      id: "shopping" as const,
      label: "Shopping",
      icon: ShoppingCart,
    },
    {
      id: "library" as const,
      label: `My Library (${libraryImages.length})`,
      icon: ImageIcon,
    },
    {
      id: "generator" as const,
      label: "AI Generator",
      icon: Wand2,
    },
  ];

  return (
    <div className="flex items-center space-x-1 mb-6 bg-blue-50 rounded-lg p-1 w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
