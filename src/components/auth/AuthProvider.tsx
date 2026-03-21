'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { User as DbUser } from '@/types/database';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    dbUser: DbUser | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshDbUser: () => Promise<void>;
    isDbUserLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [dbUser, setDbUser] = useState<DbUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDbUserLoaded, setIsDbUserLoaded] = useState(false);
    const isInitialized = useRef(false);

    const supabase = createClient();

    const fetchDbUser = async (authUser: User) => {
        // 1. 먼저 provider_id로 사용자 조회
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('provider_id', authUser.id)
            .single();

        // 에러가 발생했는데, "데이터가 없다(PGRST116)"는 에러가 아닌 네트워크/타임아웃 등에러라면
        // 유저가 진짜 없는 게 아니라 통신 실패이므로 dbUser를 null로 덮어쓰지 않고 무시합니다.
        if (error && error.code !== 'PGRST116') {
            console.error('[AuthProvider] fetchDbUser 에러 (네트워크/타임아웃 등):', error);
            setIsDbUserLoaded(true);
            return;
        }

        if (data) {
            // 2. auth_id가 없거나 다르면 업데이트 (RLS 정책 호환성)
            if (data.auth_id !== authUser.id) {
                await supabase
                    .from('users')
                    .update({ auth_id: authUser.id })
                    .eq('id', data.id);

                // 업데이트된 데이터로 설정
                setDbUser({ ...data, auth_id: authUser.id });
            } else {
                setDbUser(data);
            }
        } else {
            // 진짜 데이터가 없는 경우에만 null 처리 (= 신규 유저 온보딩 대상)
            setDbUser(null);
        }
        setIsDbUserLoaded(true); // dbUser 조회가 끝났음을 갱신
    };

    // DB 사용자 정보 새로고침
    const refreshDbUser = async () => {
        if (user) {
            await fetchDbUser(user);
        }
    };

    // 로그아웃
    const signOut = async () => {
        if (user && dbUser) {
            await supabase.from('user_login_history').insert({
                user_id: dbUser.id,
                provider: dbUser.provider,
                action: 'logout'
            });
        }
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setDbUser(null);
        setIsDbUserLoaded(false);
    };

    useEffect(() => {
        // 초기 세션 확인 (최초 1회만 실행되어 isLoading 해제 담당)
        const initializeAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                await fetchDbUser(session.user);
            } else {
                // 세션 없으면 isDbUserLoaded도 완료로 설정 (비로그인 상태)
                setIsDbUserLoaded(true);
            }

            isInitialized.current = true;
            setIsLoading(false);
        };

        initializeAuth();

        // 인증 상태 변경 리스너 (초기화 완료 이후 변경사항만 처리)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                // INITIAL_SESSION은 initializeAuth에서 처리하므로 무시
                if (!isInitialized.current) {
                    return;
                }

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchDbUser(session.user);
                } else {
                    setDbUser(null);
                    setIsDbUserLoaded(false);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                dbUser,
                isLoading,
                signOut,
                refreshDbUser,
                isDbUserLoaded
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
