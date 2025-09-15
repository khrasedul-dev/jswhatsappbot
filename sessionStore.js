import fs from 'fs'
const SESSION_FILE = 'sessions.json'

function readSessions() {
  if (!fs.existsSync(SESSION_FILE)) return {}
  return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'))
}

function writeSessions(sessions) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2))
}

/**
 * File-based session store for WhatsApp bot sessions.
 * @type {{ get: function(string): Promise<object>, set: function(string, object): Promise<void> }}
 */
export const sessionStore = {
  /**
   * Gets session data by ID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async get(id) {
    const sessions = readSessions()
    return sessions[id] || {}
  },
  /**
   * Sets session data by ID.
   * @param {string} id
   * @param {object} session
   * @returns {Promise<void>}
   */
  async set(id, session) {
    const sessions = readSessions()
    sessions[id] = session
    writeSessions(sessions)
  },
}
