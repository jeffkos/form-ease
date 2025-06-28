// Utilitaire pour journaliser les actions admin/audit trail
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Log une action admin/audit
 * @param {Object} params
 * @param {number|null} params.userId
 * @param {string} params.action
 * @param {string} [params.entity]
 * @param {number} [params.entityId]
 * @param {Object} [params.details]
 */
async function logAction({ userId = null, action, entity = null, entityId = null, details = null }) {
  await prisma.actionLog.create({
    data: {
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      details
    }
  });
}

module.exports = { logAction };
