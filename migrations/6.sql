
-- Limpiar datos existentes y comenzar fresh
DELETE FROM streamers;

-- Insertar los 20 streamers del Marvel Rivals SoloQ Challenge
INSERT INTO streamers (
    name, ingame_username, twitch_username, youtube_username, twitter_username, 
    instagram_username, tiktok_username, avatar_url, rank, games_played, wins, 
    is_live, stream_url, created_at, updated_at
) VALUES
-- Top Tier Streamers
('TheGrefg', 'TheGrefg_MR', 'thegrefg', 'TheGrefg', 'TheGrefg', 'thegrefg', 'thegrefg', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ElRubius', 'Rubius_Gaming', 'elrubius', 'elrubiusOMG', 'Rubiu5', 'rubius', 'rubius', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AuronPlay', 'AuronMR', 'auronplay', 'AuronPlay', 'auronplay', 'auronplay', 'auronplay', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ElSpreen', 'Spreen_MR', 'elspreen', 'SpreenDMC', 'SpreenDMC', 'spreen', 'spreen', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('IlloJuan', 'IlloJuan_MR', 'illojuan', 'IlloJuan', 'IlloJuan', 'illojuan', 'illojuan', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Gaming Specialists
('TheKiddac', 'Kiddac_Gaming', 'thekiddac', 'TheKiddac', 'TheKiddac', 'thekiddac', 'thekiddac', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Carreraaa', 'Carrera_MR', 'carreraaa', 'Carreraaa', 'Carreraaa', 'carreraaa', 'carreraaa', 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Knekro', 'Knekro_MR', 'knekro', 'Knekro', 'Knekro', 'knekro', 'knekro', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ElMillor', 'Millor_Gaming', 'elmillor', 'ElMillor', 'ElMillor', 'elmillor', 'elmillor', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Abby', 'AbbyMR', 'abby', 'AbbyGaming', 'AbbyTwitch', 'abby', 'abby', 'https://images.unsplash.com/photo-1494790108755-2616b612b890?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Rising Stars
('Vicens', 'Vicens_MR', 'vicens', 'Vicens', 'Vicens', 'vicens', 'vicens', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Perxita', 'Perxita_MR', 'perxita', 'Perxita', 'Perxita', 'perxita', 'perxita', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Rivers', 'Rivers_Gaming', 'rivers', 'RiversGG', 'Rivers', 'rivers', 'rivers', 'https://images.unsplash.com/photo-1507081323647-4d250478b919?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Carre', 'Carre_MR', 'carre', 'Carre', 'Carre', 'carre', 'carre', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Cristinini', 'Cristinini_MR', 'cristinini', 'Cristinini', 'Cristinini', 'cristinini', 'cristinini', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Competitive Players
('Paracetamor', 'Paracetamor_MR', 'paracetamor', 'Paracetamor', 'Paracetamor', 'paracetamor', 'paracetamor', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Zeling', 'Zeling_MR', 'zeling', 'ZelingTV', 'Zeling', 'zeling', 'zeling', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ElMariana', 'Mariana_Gaming', 'elmariana', 'ElMariana', 'ElMariana', 'elmariana', 'elmariana', 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Quackity', 'Quackity_MR', 'quackity', 'QuackityHQ', 'Quackity', 'quackity', 'quackityhq', 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ElXokas', 'Xokas_Gaming', 'elxokas', 'ElXokasTV', 'ElXokas', 'elxokas', 'elxokas', 'https://images.unsplash.com/photo-1522075469751-3847ae2e9742?w=400&h=400&fit=crop&crop=face', NULL, 0, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
