export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            constitution_info: {
                Row: {
                    article_number: number
                    chapter_number: number
                    chapter_title: string
                    id: number
                }
                Insert: {
                    article_number: number
                    chapter_number: number
                    chapter_title: string
                    id?: number
                }
                Update: {
                    article_number?: number
                    chapter_number?: number
                    chapter_title?: string
                    id?: number
                }
                Relationships: []
            }
            notices: {
                Row: {
                    category: Database["public"]["Enums"]["notice_type"] | null
                    content: string
                    created_at: string | null
                    created_by: number
                    deleted_at: string | null
                    deleted_by: number | null
                    id: number
                    is_deleted: boolean | null
                    is_important: boolean | null
                    is_published: boolean | null
                    modified_at: string | null
                    modified_by: number | null
                    published_at: string | null
                    title: string
                    view_count: number | null
                }
                Insert: {
                    category?: Database["public"]["Enums"]["notice_type"] | null
                    content: string
                    created_at?: string | null
                    created_by: number
                    deleted_at?: string | null
                    deleted_by?: number | null
                    id?: number
                    is_deleted?: boolean | null
                    is_important?: boolean | null
                    is_published?: boolean | null
                    modified_at?: string | null
                    modified_by?: number | null
                    published_at?: string | null
                    title: string
                    view_count?: number | null
                }
                Update: {
                    category?: Database["public"]["Enums"]["notice_type"] | null
                    content?: string
                    created_at?: string | null
                    created_by?: number
                    deleted_at?: string | null
                    deleted_by?: number | null
                    id?: number
                    is_deleted?: boolean | null
                    is_important?: boolean | null
                    is_published?: boolean | null
                    modified_at?: string | null
                    modified_by?: number | null
                    published_at?: string | null
                    title?: string
                    view_count?: number | null
                }
                Relationships: []
            }
            quiz_choices: {
                Row: {
                    blank_position: number | null
                    choice_order: number
                    choice_text: string
                    created_at: string | null
                    id: number
                    is_correct: boolean | null
                    modified_at: string | null
                    quiz_id: number
                }
                Insert: {
                    blank_position?: number | null
                    choice_order: number
                    choice_text: string
                    created_at?: string | null
                    id?: number
                    is_correct?: boolean | null
                    modified_at?: string | null
                    quiz_id: number
                }
                Update: {
                    blank_position?: number | null
                    choice_order?: number
                    choice_text?: string
                    created_at?: string | null
                    id?: number
                    is_correct?: boolean | null
                    modified_at?: string | null
                    quiz_id?: number
                }
                Relationships: []
            }
            quiz_difficulty: {
                Row: {
                    created_at: string | null
                    id: number
                    label: string | null
                    modified_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: number
                    label?: string | null
                    modified_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: number
                    label?: string | null
                    modified_at?: string | null
                }
                Relationships: []
            }
            quiz_statistics: {
                Row: {
                    correct_count: number | null
                    correct_rate: number | null
                    created_at: string | null
                    id: number
                    incorrect_count: number | null
                    modified_at: string | null
                    play_count: number | null
                    quiz_id: number
                }
                Insert: {
                    correct_count?: number | null
                    correct_rate?: number | null
                    created_at?: string | null
                    id?: number
                    incorrect_count?: number | null
                    modified_at?: string | null
                    play_count?: number | null
                    quiz_id: number
                }
                Update: {
                    correct_count?: number | null
                    correct_rate?: number | null
                    created_at?: string | null
                    id?: number
                    incorrect_count?: number | null
                    modified_at?: string | null
                    play_count?: number | null
                    quiz_id?: number
                }
                Relationships: []
            }
            quizpack_loadmap: {
                Row: {
                    id: number
                    order: number
                    quizpack_id: number | null
                }
                Insert: {
                    id?: number
                    order: number
                    quizpack_id?: number | null
                }
                Update: {
                    id?: number
                    order?: number
                    quizpack_id?: number | null
                }
                Relationships: []
            }
            quizpack_statistics: {
                Row: {
                    average_correct_rate: number | null
                    average_rating: number | null
                    created_at: string | null
                    id: number
                    modified_at: string | null
                    quizpack_id: number
                    rating_count: number | null
                    rating_sum: number | null
                    total_completions: number | null
                    total_correct_count: number | null
                    total_quiz_count: number | null
                }
                Insert: {
                    average_correct_rate?: number | null
                    average_rating?: number | null
                    created_at?: string | null
                    id?: number
                    modified_at?: string | null
                    quizpack_id: number
                    rating_count?: number | null
                    rating_sum?: number | null
                    total_completions?: number | null
                    total_correct_count?: number | null
                    total_quiz_count?: number | null
                }
                Update: {
                    average_correct_rate?: number | null
                    average_rating?: number | null
                    created_at?: string | null
                    id?: number
                    modified_at?: string | null
                    quizpack_id?: number
                    rating_count?: number | null
                    rating_sum?: number | null
                    total_completions?: number | null
                    total_correct_count?: number | null
                    total_quiz_count?: number | null
                }
                Relationships: []
            }
            quizpacks: {
                Row: {
                    created_at: string | null
                    deleted_at: string | null
                    deleted_by: number | null
                    id: number
                    is_active: boolean | null
                    is_deleted: boolean | null
                    keywords: string
                    modified_at: string | null
                    quiz_count_all: number | null
                    quiz_max: number | null
                }
                Insert: {
                    created_at?: string | null
                    deleted_at?: string | null
                    deleted_by?: number | null
                    id?: number
                    is_active?: boolean | null
                    is_deleted?: boolean | null
                    keywords?: string
                    modified_at?: string | null
                    quiz_count_all?: number | null
                    quiz_max?: number | null
                }
                Update: {
                    created_at?: string | null
                    deleted_at?: string | null
                    deleted_by?: number | null
                    id?: number
                    is_active?: boolean | null
                    is_deleted?: boolean | null
                    keywords?: string
                    modified_at?: string | null
                    quiz_count_all?: number | null
                    quiz_max?: number | null
                }
                Relationships: []
            }
            quizzes: {
                Row: {
                    blank_count: number | null
                    constitution_info_id: number | null
                    created_at: string | null
                    deleted_at: string | null
                    deleted_by: number | null
                    difficulty_id: number | null
                    explanation: string
                    hint: string
                    id: number
                    is_active: boolean | null
                    is_deleted: boolean | null
                    modified_at: string | null
                    passage: string
                    question: string
                    quiz_order: number
                    quiz_type: Database["public"]["Enums"]["quiz_type"]
                    quizpack_id: number | null
                }
                Insert: {
                    blank_count?: number | null
                    constitution_info_id?: number | null
                    created_at?: string | null
                    deleted_at?: string | null
                    deleted_by?: number | null
                    difficulty_id?: number | null
                    explanation: string
                    hint: string
                    id?: number
                    is_active?: boolean | null
                    is_deleted?: boolean | null
                    modified_at?: string | null
                    passage: string
                    question: string
                    quiz_order: number
                    quiz_type: Database["public"]["Enums"]["quiz_type"]
                    quizpack_id?: number | null
                }
                Update: {
                    blank_count?: number | null
                    constitution_info_id?: number | null
                    created_at?: string | null
                    deleted_at?: string | null
                    deleted_by?: number | null
                    difficulty_id?: number | null
                    explanation?: string
                    hint?: string
                    id?: number
                    is_active?: boolean | null
                    is_deleted?: boolean | null
                    modified_at?: string | null
                    passage?: string
                    question?: string
                    quiz_order?: number
                    quiz_type?: Database["public"]["Enums"]["quiz_type"]
                    quizpack_id?: number | null
                }
                Relationships: []
            }
            user_login_history: {
                Row: {
                    action: string
                    created_at: string | null
                    id: number
                    provider: Database["public"]["Enums"]["auth_provider"]
                    user_id: number
                }
                Insert: {
                    action?: string
                    created_at?: string | null
                    id?: number
                    provider: Database["public"]["Enums"]["auth_provider"]
                    user_id: number
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    id?: number
                    provider?: Database["public"]["Enums"]["auth_provider"]
                    user_id?: number
                }
                Relationships: []
            }
            user_quizpack_ratings: {
                Row: {
                    created_at: string | null
                    id: number
                    modified_at: string | null
                    quizpack_id: number
                    rating: number
                    user_id: number
                }
                Insert: {
                    created_at?: string | null
                    id?: number
                    modified_at?: string | null
                    quizpack_id: number
                    rating: number
                    user_id: number
                }
                Update: {
                    created_at?: string | null
                    id?: number
                    modified_at?: string | null
                    quizpack_id?: number
                    rating?: number
                    user_id?: number
                }
                Relationships: []
            }
            user_quizpacks: {
                Row: {
                    completed_at: string | null
                    correct_count: number | null
                    correct_rate: number | null
                    created_at: string | null
                    current_quiz_order: number | null
                    id: number
                    incorrect_count: number | null
                    last_played_at: string | null
                    modified_at: string | null
                    quizpack_id: number
                    quizpack_order: number
                    session_number: number | null
                    solved_quiz_count: number | null
                    started_at: string | null
                    status: Database["public"]["Enums"]["quizpack_status"] | null
                    total_quiz_count: number
                    total_time_seconds: number | null
                    user_id: number
                    pending_xp: number | null
                    earned_xp: number | null
                }
                Insert: {
                    completed_at?: string | null
                    correct_count?: number | null
                    correct_rate?: number | null
                    created_at?: string | null
                    current_quiz_order?: number | null
                    id?: number
                    incorrect_count?: number | null
                    last_played_at?: string | null
                    modified_at?: string | null
                    quizpack_id: number
                    quizpack_order: number
                    session_number?: number | null
                    solved_quiz_count?: number | null
                    started_at?: string | null
                    status?: Database["public"]["Enums"]["quizpack_status"] | null
                    total_quiz_count: number
                    total_time_seconds?: number | null
                    user_id: number
                    pending_xp?: number | null
                    earned_xp?: number | null
                }
                Update: {
                    completed_at?: string | null
                    correct_count?: number | null
                    correct_rate?: number | null
                    created_at?: string | null
                    current_quiz_order?: number | null
                    id?: number
                    incorrect_count?: number | null
                    last_played_at?: string | null
                    modified_at?: string | null
                    quizpack_id?: number
                    quizpack_order?: number
                    session_number?: number | null
                    solved_quiz_count?: number | null
                    started_at?: string | null
                    status?: Database["public"]["Enums"]["quizpack_status"] | null
                    total_quiz_count?: number
                    total_time_seconds?: number | null
                    user_id?: number
                    pending_xp?: number | null
                    earned_xp?: number | null
                }
                Relationships: []
            }
            user_quizzes: {
                Row: {
                    answered_at: string | null
                    created_at: string | null
                    id: number
                    is_correct: boolean
                    modified_at: string | null
                    quiz_id: number
                    quiz_order: number
                    selected_answers: Json
                    started_at: string | null
                    time_seconds: number | null
                    user_id: number
                    user_quizpack_id: number
                }
                Insert: {
                    answered_at?: string | null
                    created_at?: string | null
                    id?: number
                    is_correct: boolean
                    modified_at?: string | null
                    quiz_id: number
                    quiz_order: number
                    selected_answers: Json
                    started_at?: string | null
                    time_seconds?: number | null
                    user_id: number
                    user_quizpack_id: number
                }
                Update: {
                    answered_at?: string | null
                    created_at?: string | null
                    id?: number
                    is_correct?: boolean
                    modified_at?: string | null
                    quiz_id?: number
                    quiz_order?: number
                    selected_answers?: Json
                    started_at?: string | null
                    time_seconds?: number | null
                    user_id?: number
                    user_quizpack_id?: number
                }
                Relationships: []
            }
            users: {
                Row: {
                    created_at: string | null
                    id: number
                    is_active: boolean | null
                    modified_at: string | null
                    nickname: string
                    provider: Database["public"]["Enums"]["auth_provider"]
                    provider_id: string
                    role: Database["public"]["Enums"]["user_role"] | null
                    title: string | null
                    title_code: string | null
                    total_xp: number
                    weekly_xp: number
                }
                Insert: {
                    created_at?: string | null
                    id?: number
                    is_active?: boolean | null
                    modified_at?: string | null
                    nickname: string
                    provider: Database["public"]["Enums"]["auth_provider"]
                    provider_id: string
                    role?: Database["public"]["Enums"]["user_role"] | null
                    title?: string | null
                    title_code?: string | null
                    total_xp?: number
                    weekly_xp?: number
                }
                Update: {
                    created_at?: string | null
                    id?: number
                    is_active?: boolean | null
                    modified_at?: string | null
                    nickname?: string
                    provider?: Database["public"]["Enums"]["auth_provider"]
                    provider_id?: string
                    role?: Database["public"]["Enums"]["user_role"] | null
                    title?: string | null
                    title_code?: string | null
                    total_xp?: number
                    weekly_xp?: number
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            auth_provider: "google" | "kakao"
            notice_type: "general" | "important"
            quiz_type: "multiple" | "truefalse" | "choiceblank"
            quizpack_status: "closed" | "opened" | "in_progress" | "completed"
            user_role: "user" | "admin"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// 편의 타입 별칭
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]

// 주요 테이블 타입 내보내기
export type User = Tables<"users">
export type Quiz = Tables<"quizzes">
export type QuizChoice = Tables<"quiz_choices">
export type Quizpack = Tables<"quizpacks">
export type UserQuizpack = Tables<"user_quizpacks">
export type UserQuiz = Tables<"user_quizzes">
export type QuizDifficulty = Tables<"quiz_difficulty">
export type ConstitutionInfo = Tables<"constitution_info">
export type Notice = Tables<"notices">

// Enum 타입 별칭
export type AuthProvider = Enums<"auth_provider">
export type QuizType = Enums<"quiz_type">
export type QuizpackStatus = Enums<"quizpack_status">
export type UserRole = Enums<"user_role">
export type NoticeType = Enums<"notice_type">
