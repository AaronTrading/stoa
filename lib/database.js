/** @typedef {'member'|'coaching'|'admin'} UserRole */
/** @typedef {'locked'|'in_progress'|'completed'} ProgressStatus */
/** @typedef {'onboarding'|'active'|'paused'|'completed'|'cancelled'} CoachingAccessStatus */
/** @typedef {'manual'|'stripe'|'legacy'|'gift'} CoachingAccessSource */

/**
 * @typedef {Object} Profile
 * @property {string} id UUID lié à auth.users
 * @property {string|null} full_name
 * @property {string|null} first_name
 * @property {string|null} last_name
 * @property {string|null} username
 * @property {string|null} avatar_url
 * @property {string|null} department
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
 * @property {string} slug
 * @property {'chat'|'announcements'|'questions'|'polls'} kind
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
 * @property {string|null} parent_message_id
 * @property {string|null} reply_to_message_id
 * @property {string|null} shared_message_id
 * @property {string} content
 * @property {string|null} announcement_expires_at
 * @property {string} created_at
 * @property {string|null} edited_at
 * @property {string|null} deleted_at
 * @property {string|null} deleted_by
 * @property {string|null} pinned_at
 * @property {string|null} pinned_by
 */

/**
 * @typedef {Object} MessageReaction
 * @property {string} id
 * @property {string} message_id
 * @property {string} user_id
 * @property {'❤️'|'👍'|'👏'|'💡'} emoji
 */

/**
 * @typedef {Object} CommunityPoll
 * @property {string} id
 * @property {string} channel_id
 * @property {string} user_id
 * @property {string} question
 * @property {string} created_at
 * @property {string} expires_at
 */

/**
 * @typedef {Object} CoachingClient
 * @property {string} id
 * @property {string} client_id
 * @property {string|null} coach_id
 * @property {CoachingAccessStatus} status
 * @property {CoachingAccessSource} access_source
 * @property {string|null} stripe_subscription_id
 * @property {number} onboarding_step
 * @property {boolean} onboarding_completed
 * @property {string|null} ends_at
 */

/**
 * @typedef {Object} CoachingGoal
 * @property {string} id
 * @property {string} client_id
 * @property {string} title
 * @property {string} description
 * @property {'active'|'completed'|'paused'|'cancelled'} status
 * @property {number} progress
 * @property {string|null} target_date
 */

/**
 * @typedef {Object} CoachingCheckin
 * @property {string} id
 * @property {string} client_id
 * @property {string} period_start
 * @property {string} period_end
 * @property {'draft'|'submitted'|'reviewed'|'late'} status
 * @property {number|null} energy
 * @property {number|null} sleep
 * @property {number|null} nutrition
 * @property {number|null} activity
 * @property {string} main_difficulty
 * @property {string} main_win
 * @property {string} next_focus
 * @property {string} help_needed
 */

/**
 * @typedef {Object} CoachingMessage
 * @property {string} id
 * @property {string} client_id
 * @property {string} sender_id
 * @property {string} content
 * @property {string} created_at
 * @property {string|null} read_at
 */

export {};
