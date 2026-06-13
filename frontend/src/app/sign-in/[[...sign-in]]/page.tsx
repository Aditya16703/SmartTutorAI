import CustomSignInForm from "@/components/auth/CustomSignInForm";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <CustomSignInForm />
      </div>
    </div>
  );
}
