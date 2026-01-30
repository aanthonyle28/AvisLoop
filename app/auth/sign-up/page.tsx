import { AuthSplitLayout } from '@/components/auth/auth-split-layout'
import { SignUpForm } from '@/components/sign-up-form'

export default function Page() {
  return (
    <AuthSplitLayout>
      <SignUpForm />
    </AuthSplitLayout>
  )
}
