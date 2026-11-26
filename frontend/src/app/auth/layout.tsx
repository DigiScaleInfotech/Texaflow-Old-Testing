import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-[#202936]">
      {/* Left side - Decorative */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-blue-500 to-blue-400 dark:from-primary/90 dark:to-primary/70 p-8">
        <div className="h-full w-full flex flex-col justify-center items-center text-gray-900 dark:text-white glass-effect rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-4">Welcome to TextTile CRM</h2>
          <p className="text-lg mb-8 text-center">
            Comprehensive management system for your textile business
          </p>
          <div className="relative size-[220px] rounded-lg overflow-hidden">
            <Image
              src="/auth.jpg"
              alt="Textile Management"
              width={500}
              height={500}
              className="w-fit h-fit object-cover"
              priority
            />
            {/* Subtle overlay for aesthetic purposes */}
            <div className="absolute inset-0 bg-black/10 dark:bg-black/20"></div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-white dark:bg-[#1e293b]">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              TextTile CRM
            </h1>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
