import LoginClient from './LoginClient';

export default function LoginPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vdizlbrqxjzssuqtdkhy.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_2-_de_EkwfZ11RzGEW9flQ_OOj0ImiF';

  return <LoginClient supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />;
}
