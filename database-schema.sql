-- Xknow Learning Platform Database Schema
-- 创建时间: 2024

-- 开启UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 学习会话主表
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Clerk用户ID
    original_query TEXT NOT NULL,
    ai_classification JSONB NOT NULL,
    user_confirmed_category TEXT CHECK (user_confirmed_category IN ('science', 'history', 'others')),
    learning_config JSONB NOT NULL, -- {level: string, style: string}
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    current_stage TEXT DEFAULT 'learning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_learning_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_duration INTEGER DEFAULT 0 -- 秒数
);

-- 2. 学习交互记录表
CREATE TABLE learning_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    stage_index INTEGER NOT NULL CHECK (stage_index >= 0 AND stage_index <= 2),
    stage_type TEXT NOT NULL CHECK (stage_type IN ('life_connection', 'observation', 'concept_building')),
    ai_question TEXT NOT NULL,
    follow_up_hint TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    answer_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_analysis JSONB -- {analysis: string, insights: string[], generated_at: timestamp}
);

-- 3. 知识检测记录表
CREATE TABLE quiz_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    interaction_id UUID REFERENCES learning_interactions(id) ON DELETE CASCADE,
    quiz_question TEXT NOT NULL,
    quiz_options JSONB NOT NULL, -- string[]
    correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
    explanation TEXT NOT NULL,
    user_answer INTEGER CHECK (user_answer >= 0 AND user_answer <= 3),
    is_correct BOOLEAN,
    answered_at TIMESTAMP WITH TIME ZONE,
    time_spent INTEGER -- 答题耗时(秒)
);

-- 4. 深度反思记录表
CREATE TABLE reflection_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    ai_reflection_question TEXT NOT NULL,
    placeholder_hint TEXT NOT NULL,
    user_reflection_text TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    reflection_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_spent INTEGER -- 思考耗时(秒)
);

-- 5. 游戏学习记录表
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    game_title TEXT NOT NULL,
    game_type TEXT NOT NULL,
    game_instructions TEXT NOT NULL,
    game_html_code TEXT NOT NULL, -- 完整的HTML5游戏代码
    game_design_concept JSONB, -- 游戏设计概念
    times_played INTEGER DEFAULT 0,
    first_played_at TIMESTAMP WITH TIME ZONE,
    last_played_at TIMESTAMP WITH TIME ZONE,
    total_play_duration INTEGER DEFAULT 0 -- 总游戏时间(秒)
);

-- 6. 视频学习记录表 (历史专用)
CREATE TABLE video_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES learning_sessions(id) ON DELETE CASCADE,
    video_prompt TEXT NOT NULL,
    minimax_task_id TEXT,
    video_status TEXT DEFAULT 'generating' CHECK (video_status IN ('generating', 'completed', 'failed', 'timeout')),
    video_download_url TEXT,
    video_filename TEXT,
    view_count INTEGER DEFAULT 0,
    total_watch_duration INTEGER DEFAULT 0, -- 总观看时间(秒)
    first_viewed_at TIMESTAMP WITH TIME ZONE,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 用户学习统计表
CREATE TABLE user_stats (
    user_id TEXT PRIMARY KEY, -- Clerk用户ID
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    total_learning_time INTEGER DEFAULT 0, -- 总学习时间(秒)
    subjects_studied JSONB DEFAULT '{"science": 0, "history": 0, "others": 0}',
    average_session_duration REAL DEFAULT 0,
    preferred_learning_level TEXT DEFAULT 'intermediate',
    preferred_learning_style TEXT DEFAULT 'structured',
    quiz_accuracy_rate REAL DEFAULT 0, -- 测试正确率 0-1
    last_learning_date TIMESTAMP WITH TIME ZONE,
    learning_streak INTEGER DEFAULT 0, -- 连续学习天数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_learning_sessions_status ON learning_sessions(status);
CREATE INDEX idx_learning_sessions_category ON learning_sessions(user_confirmed_category);
CREATE INDEX idx_learning_sessions_created_at ON learning_sessions(created_at);

CREATE INDEX idx_learning_interactions_session_id ON learning_interactions(session_id);
CREATE INDEX idx_learning_interactions_stage_index ON learning_interactions(stage_index);

CREATE INDEX idx_quiz_records_session_id ON quiz_records(session_id);
CREATE INDEX idx_quiz_records_interaction_id ON quiz_records(interaction_id);
CREATE INDEX idx_quiz_records_is_correct ON quiz_records(is_correct);

CREATE INDEX idx_reflection_records_session_id ON reflection_records(session_id);

CREATE INDEX idx_game_sessions_session_id ON game_sessions(session_id);

CREATE INDEX idx_video_sessions_session_id ON video_sessions(session_id);
CREATE INDEX idx_video_sessions_status ON video_sessions(video_status);

-- 创建触发器函数来自动更新用户统计
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 当学习会话状态变为completed时，更新用户统计
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO user_stats (user_id, total_sessions, completed_sessions, last_learning_date)
        VALUES (NEW.user_id, 1, 1, NEW.completed_at)
        ON CONFLICT (user_id) DO UPDATE SET
            total_sessions = user_stats.total_sessions + 1,
            completed_sessions = user_stats.completed_sessions + 1,
            total_learning_time = user_stats.total_learning_time + COALESCE(NEW.total_duration, 0),
            subjects_studied = jsonb_set(
                user_stats.subjects_studied,
                ('{"' || NEW.user_confirmed_category || '"}')::text[],
                ((user_stats.subjects_studied->>NEW.user_confirmed_category)::int + 1)::text::jsonb
            ),
            last_learning_date = NEW.completed_at,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_user_stats
    AFTER UPDATE ON learning_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- 启用行级安全(RLS) - 确保用户只能访问自己的数据
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略 - 用户只能访问自己的数据
-- 注意：需要根据Clerk的JWT中的用户ID字段来设置策略

-- 学习会话策略
CREATE POLICY "Users can only access their own learning sessions" ON learning_sessions
    FOR ALL USING (auth.uid()::text = user_id);

-- 学习交互策略
CREATE POLICY "Users can only access their own learning interactions" ON learning_interactions
    FOR ALL USING (
        session_id IN (
            SELECT id FROM learning_sessions WHERE user_id = auth.uid()::text
        )
    );

-- 测验记录策略
CREATE POLICY "Users can only access their own quiz records" ON quiz_records
    FOR ALL USING (
        session_id IN (
            SELECT id FROM learning_sessions WHERE user_id = auth.uid()::text
        )
    );

-- 反思记录策略
CREATE POLICY "Users can only access their own reflection records" ON reflection_records
    FOR ALL USING (
        session_id IN (
            SELECT id FROM learning_sessions WHERE user_id = auth.uid()::text
        )
    );

-- 游戏会话策略
CREATE POLICY "Users can only access their own game sessions" ON game_sessions
    FOR ALL USING (
        session_id IN (
            SELECT id FROM learning_sessions WHERE user_id = auth.uid()::text
        )
    );

-- 视频会话策略
CREATE POLICY "Users can only access their own video sessions" ON video_sessions
    FOR ALL USING (
        session_id IN (
            SELECT id FROM learning_sessions WHERE user_id = auth.uid()::text
        )
    );

-- 用户统计策略
CREATE POLICY "Users can only access their own stats" ON user_stats
    FOR ALL USING (auth.uid()::text = user_id); 