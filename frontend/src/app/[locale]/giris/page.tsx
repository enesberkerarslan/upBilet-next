import { Suspense } from "react";
import { LoginPage } from "@/components/auth/LoginPage";

export default function GirisPage() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-16 text-center text-sm text-gray-500">
            Yükleniyor…
          </div>
        }
      >
        <LoginPage />
      </Suspense>
    </div>
  );
}
