import fs from 'fs'

/**
 * In-memory session store for WhatsApp bot sessions.
 * @class
 */
class MemorySessionStore {
  /**
   * Creates a MemorySessionStore instance.
   */
  constructor() {
    this.sessions = {}
  }
  /**
   * Gets session data by ID.
   * @param {string} id
   * @returns {object}
   */
  async get(id) {
    return this.sessions[id] || {}
  }
  /**
   * Sets session data by ID.
   * @param {string} id
   * @param {object} session
   */
  async set(id, session) {
    this.sessions[id] = session
  }
  /**
   * Clears session data by ID.
   * @param {string} id
   */
  async clear(id) {
    delete this.sessions[id]
  }
}

/**
 * File-based session store for WhatsApp bot sessions.
 * @class
 */
class FileSessionStore {
  /**
   * Creates a FileSessionStore instance.
   * @param {string} [filePath='sessions.json']
   */
  constructor(filePath = 'sessions.json') {
    this.filePath = filePath
    if (!fs.existsSync(this.filePath)) fs.writeFileSync(this.filePath, '{}')
  }
  /**
   * Reads all sessions from file.
   * @returns {object}
   */
  _read() {
    return JSON.parse(fs.readFileSync(this.filePath, 'utf8'))
  }
  /**
   * Writes all sessions to file.
   * @param {object} sessions
   */
  _write(sessions) {
    fs.writeFileSync(this.filePath, JSON.stringify(sessions, null, 2))
  }
  /**
   * Gets session data by ID.
   * @param {string} id
   * @returns {object}
   */
  async get(id) {
    const sessions = this._read()
    return sessions[id] || {}
  }
  /**
   * Sets session data by ID.
   * @param {string} id
   * @param {object} session
   */
  async set(id, session) {
    const sessions = this._read()
    sessions[id] = session
    this._write(sessions)
  }
  /**
   * Clears session data by ID.
   * @param {string} id
   */
  async clear(id) {
    const sessions = this._read()
    delete sessions[id]
    this._write(sessions)
  }
}

/**
 * Session middleware for WhatsApp bots.
 * @param {object} [options]
 * @param {string} [options.type='memory'] Session store type ('memory' or 'file')
 * @param {string} [options.filePath='sessions.json'] File path for file store
 * @returns {function} Middleware function
 */
export function session(options = {}) {
  const { type = 'memory', filePath = 'sessions.json' } = options
  const store =
    type === 'file' ? new FileSessionStore(filePath) : new MemorySessionStore()
  return async (ctx, next) => {
    const chatId = ctx.chat?.id || ctx.from?.id || 'default'
    ctx.session = await store.get(chatId)
    await next()
    await store.set(chatId, ctx.session)
  }
}
