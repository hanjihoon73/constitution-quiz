import { getAdminUsers } from '@/actions/admin/users';
import { UserTable } from '@/components/admin/UserTable';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PageProps {
    searchParams: Promise<{
        search?: string;
        provider?: string;
        role?: string;
        status?: string;
        test?: string;
        sort?: string;
    }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
    const params = await searchParams;
    
    // 필터 데이터 변환
    const filters = {
        search: params.search,
        provider: params.provider ? params.provider.split(',') : undefined,
        role: params.role ? params.role.split(',') : undefined,
        is_active: params.status === 'active' ? true : params.status === 'inactive' ? false : undefined,
        is_test: params.test === 'true' ? true : params.test === 'false' ? false : undefined,
        sortBy: (params.sort?.split(':')[0] as any) || 'id',
        sortOrder: (params.sort?.split(':')[1] as any) || 'asc',
    };

    const { users, total } = await getAdminUsers(filters);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">사용자 관리</h2>
                    <p className="text-slate-400 mt-1">회원 정보 조회 및 권한을 관리합니다.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <form action="/admin/users" method="GET">
                            <Input 
                                name="search"
                                placeholder="ID 또는 닉네임 검색" 
                                defaultValue={params.search}
                                className="pl-10 bg-slate-900/50 border-slate-800 focus:ring-indigo-600 transition-all"
                            />
                        </form>
                    </div>
                </div>
            </div>

            <UserTable users={users} total={total} />
        </div>
    );
}
