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

    // DB에서 사용자 정보 조회 및 auth_id 업데이트
    const fetchDbUser = async (authUser: User) => {
        // 1. 먼저 provider_id로 사용자 조회
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('provider_id', authUser.id)
            .single();

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
