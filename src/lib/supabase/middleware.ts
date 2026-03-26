import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 세션 새로고침 - 중요: await 필수
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 공개 페이지 목록 (로그인 불필요)
    const publicPaths = ['/login', '/auth/callback'];
    const isPublicPage = publicPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    );

    // 로그인 후에만 접근 가능한 페이지
    const authRequiredPaths = ['/onboarding'];
    const isAuthRequiredPage = authRequiredPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    );

    // 로그인하지 않은 사용자가 보호된 페이지에 접근
    if (!user && !isPublicPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // 어드민 경로 특별 권한 관리
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }

        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('auth_id', user.id)
            .single();

        if (!userData || userData.role !== 'admin') {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }
    }

    // 로그인한 사용자가 로그인 페이지에 접근
    if (user && request.nextUrl.pathname === '/login') {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
