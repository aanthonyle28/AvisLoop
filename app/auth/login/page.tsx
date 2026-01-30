import { AuthSplitLayout } from '@/components/auth/auth-split-layout'
import { LoginForm } from '@/components/login-form'

export default function Page() {
  return (
    <AuthSplitLayout>
      <LoginForm />
    </AuthSplitLayout>
  )
}
