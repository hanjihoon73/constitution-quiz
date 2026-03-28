import { getAdminUsers } from '@/actions/admin/users';
import { UsersClient } from '@/components/admin/UsersClient';

export default async function AdminUsersPage() {
    const { users, total } = await getAdminUsers();

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 고정 영역: 타이틀 */}
            <div className="shrink-0">
                <h2 className="text-3xl font-bold text-white tracking-tight">사용자 관리</h2>
                <p className="text-slate-400 mt-1">회원 정보 조회 및 권한을 관리합니다.</p>
            </div>

            {/* 고정 영역 + 스크롤 영역 분리는 UsersClient 내에서 처리 */}
            <UsersClient initialUsers={users} total={total} />
        </div>
    );
}
