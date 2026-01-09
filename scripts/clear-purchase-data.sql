-- Script para limpar dados de compras e cursos vinculados aos usuários
-- ⚠️ ATENÇÃO: Este script apaga TODAS as compras e dados relacionados!

-- 1. Apagar progresso dos cursos (vinculado às aulas dos cursos comprados)
DELETE FROM progress;

-- 2. Apagar certificados (vinculados aos cursos comprados)
DELETE FROM certificates;

-- 3. Apagar relacionamento compra-curso (purchase_courses)
DELETE FROM purchase_courses;

-- 4. Apagar compras (purchases)
-- Isso também apaga automaticamente os purchase_courses devido ao CASCADE
DELETE FROM purchases;

-- Verificar se foi apagado corretamente
SELECT 
    (SELECT COUNT(*) FROM purchases) as total_purchases,
    (SELECT COUNT(*) FROM purchase_courses) as total_purchase_courses,
    (SELECT COUNT(*) FROM progress) as total_progress,
    (SELECT COUNT(*) FROM certificates) as total_certificates;

