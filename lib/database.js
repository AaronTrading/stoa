/** @typedef {'member'|'coaching'|'admin'} UserRole */
/** @typedef {'locked'|'in_progress'|'completed'} ProgressStatus */

/**
 * @typedef {Object} Profile
 * @property {string} id UUID lié à auth.users
 * @property {string|null} full_name
 * @property {string|null} first_name
 * @property {string|null} last_name
 * @property {string|null} username
 * @property {string|null} avatar_url
 * @property {string} created_at ISO 8601
 * @property {UserRole} role
 * @property {boolean} onboarding_completed
 */

/**
 * @typedef {Object} Chapter
 * @property {string} id
 * @property {string} category
 * @property {string} title
 * @property {string} description
 * @property {number} order_index
 * @property {string} created_at
 */

/**
 * @typedef {Object} Module
 * @property {string} id
 * @property {string} chapter_id
 * @property {string} title
 * @property {string} description
 * @property {number} duration_minutes
 * @property {string|null} video_url
 * @property {number} order_index
 * @property {string} created_at
 */

/**
 * @typedef {Object} Subchapter
 * @property {string} id
 * @property {string} module_id
 * @property {string} title
 * @property {string} content Texte ou Markdown
 * @property {number} order_index
 */

/**
 * @typedef {Object} UserProgress
 * @property {string} id
 * @property {string} user_id
 * @property {string} module_id
 * @property {string|null} subchapter_id
 * @property {ProgressStatus} status
 * @property {string|null} completed_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} CommunityChannel
 * @property {string} id
 * @property {string} name
 * @property {string|null} description
 * @property {number} order_index
 * @property {string} created_at
 */

/**
 * @typedef {Object} CommunityMessage
 * @property {string} id
 * @property {string} channel_id
 * @property {string} user_id
 * @property {string} content
 * @property {string} created_at
 * @property {string|null} edited_at
 */

/**
 * @typedef {Object} MessageReaction
 * @property {string} id
 * @property {string} message_id
 * @property {string} user_id
 * @property {'👍'|'❤️'|'👏'|'💡'} emoji
 */

export {};
