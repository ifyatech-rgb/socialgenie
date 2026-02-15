"use client";

export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-lg bg-gray-100 dark:bg-gray-800 p-6">
      <div className="h-8 w-2/3 rounded-md bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-full rounded-md bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-[80%] rounded-md bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-2/3 rounded-md bg-gray-200 dark:bg-gray-700" />
      <div className="h-12 w-48 rounded-md bg-gray-200 dark:bg-gray-700 mt-6" />
    </div>
  );
}
