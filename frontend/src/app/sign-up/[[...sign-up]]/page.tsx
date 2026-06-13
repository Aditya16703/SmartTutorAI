import CustomSignUpForm from "@/components/auth/CustomSignUpForm";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <CustomSignUpForm />
      </div>
    </div>
  );
}
