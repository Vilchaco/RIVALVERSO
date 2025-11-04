// Script de limpieza para datos huérfanos
// Este endpoint limpia estadísticas de streamers que ya no existen

export async function cleanupOrphanedStats(db: any): Promise<{
  cleanedHeroStats: number;
  cleanedRoleStats: number;
  logs: string[];
}> {
  const logs: string[] = [];
  
  logs.push('🧹 Iniciando limpieza de estadísticas huérfanas...');
  
  // Find orphaned hero stats
  const orphanedHeroStats = await db.prepare(`
    SELECT h.id, h.streamer_id, h.hero_name 
    FROM streamer_hero_stats h 
    LEFT JOIN streamers s ON h.streamer_id = s.id 
    WHERE s.id IS NULL
  `).all();
  
  const orphanedHeroCount = orphanedHeroStats.results.length;
  logs.push(`🔍 Encontradas ${orphanedHeroCount} estadísticas de héroes huérfanas`);
  
  if (orphanedHeroCount > 0) {
    // Log which hero stats will be deleted
    orphanedHeroStats.results.forEach((stat: any) => {
      logs.push(`   • Hero stat ID ${stat.id}: ${stat.hero_name} (streamer_id: ${stat.streamer_id})`);
    });
    
    // Delete orphaned hero stats
    await db.prepare(`
      DELETE FROM streamer_hero_stats 
      WHERE streamer_id NOT IN (SELECT id FROM streamers)
    `).run();
    
    logs.push(`✅ ${orphanedHeroCount} estadísticas de héroes huérfanas eliminadas`);
  }
  
  // Find orphaned role stats
  const orphanedRoleStats = await db.prepare(`
    SELECT r.id, r.streamer_id, r.role_name 
    FROM streamer_role_stats r 
    LEFT JOIN streamers s ON r.streamer_id = s.id 
    WHERE s.id IS NULL
  `).all();
  
  const orphanedRoleCount = orphanedRoleStats.results.length;
  logs.push(`🔍 Encontradas ${orphanedRoleCount} estadísticas de roles huérfanas`);
  
  if (orphanedRoleCount > 0) {
    // Log which role stats will be deleted
    orphanedRoleStats.results.forEach((stat: any) => {
      logs.push(`   • Role stat ID ${stat.id}: ${stat.role_name} (streamer_id: ${stat.streamer_id})`);
    });
    
    // Delete orphaned role stats
    await db.prepare(`
      DELETE FROM streamer_role_stats 
      WHERE streamer_id NOT IN (SELECT id FROM streamers)
    `).run();
    
    logs.push(`✅ ${orphanedRoleCount} estadísticas de roles huérfanas eliminadas`);
  }
  
  if (orphanedHeroCount === 0 && orphanedRoleCount === 0) {
    logs.push('✨ No se encontraron estadísticas huérfanas. Base de datos limpia.');
  }
  
  logs.push('🏁 Limpieza completada');
  
  return {
    cleanedHeroStats: orphanedHeroCount,
    cleanedRoleStats: orphanedRoleCount,
    logs
  };
}
