import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // 사용자 정보 확인 후 온보딩 필요 여부 체크
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // users 테이블에서 닉네임 확인
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('nickname')
                    .eq('provider_id', user.id)
                    .single();

                // 닉네임이 없으면 온보딩으로
                if (!existingUser?.nickname) {
                    return NextResponse.redirect(`${origin}/onboarding`);
                }
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // 에러 발생 시 로그인 페이지로 리다이렉트
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
