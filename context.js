/**
 * Context for a WhatsApp event. Provides reply helpers and session access.
 * @class
 */
class Context {
  /**
   * Creates a Context instance.
   * @param {WhatsAppBot} bot Bot instance
   * @param {object} event WhatsApp event object
   * @param {string} senderId Sender's WhatsApp ID
   */
  constructor(bot, event, senderId) {
    this.bot = bot
    this.chat = { id: senderId }
    // Extract text from all possible WhatsApp event formats
    // Prefer button_reply.id for button actions, fallback to title/text
    this.text =
      event.interactive?.button_reply?.id ||
      event.interactive?.button_reply?.title ||
      event.text?.body ||
      event.button?.text ||
      null
    this.event = event
    this.session = {} // will be filled by session middleware

    // Attachments
    this.attachments =
      event.image || event.document
        ? [event.image, event.document].filter(Boolean)
        : []
    this.images = event.image ? [event.image] : []
    this.files = event.document ? [event.document] : []
    this.audio = event.audio ? [event.audio] : []
    this.video = event.video ? [event.video] : []
  }

  /**
   * Reply with text or payload.
   * @param {string|object} textOrPayload Text or message payload
   * @returns {Promise<object|Error>} API response or error
   */
  async reply(textOrPayload) {
    this._handled = true
    return this.bot.sendMessage(this.chat.id, textOrPayload)
  }

  /**
   * Reply with an image.
   * @param {string} url Image URL
   * @param {object} [payload] Optional payload for buttons
   * @returns {Promise<object|Error>} API response or error
   */
  async replyWithPhoto(url) {
    this._handled = true
    // Support optional Markup payload for buttons
    let payload = {
      messaging_product: 'whatsapp',
      type: 'image',
      image: { link: url },
    }
    if (
      arguments.length > 1 &&
      arguments[1] &&
      typeof arguments[1] === 'object'
    ) {
      Object.assign(payload, arguments[1])
    }
    return this.bot.sendMessage(this.chat.id, payload)
  }

  /**
   * Reply with a document.
   * @param {string} url Document URL
   * @returns {Promise<object|Error>} API response or error
   */
  async replyWithDocument(url) {
    this._handled = true
    return this.bot.sendMessage(this.chat.id, {
      messaging_product: 'whatsapp',
      type: 'document',
      document: { link: url },
    })
  }

  /**
   * Reply with audio.
   * @param {string} url Audio URL
   * @returns {Promise<object|Error>} API response or error
   */
  async replyWithAudio(url) {
    this._handled = true
    return this.bot.sendMessage(this.chat.id, {
      messaging_product: 'whatsapp',
      type: 'audio',
      audio: { link: url },
    })
  }

  /**
   * Reply with video.
   * @param {string} url Video URL
   * @returns {Promise<object|Error>} API response or error
   */
  async replyWithVideo(url) {
    this._handled = true
    return this.bot.sendMessage(this.chat.id, {
      messaging_product: 'whatsapp',
      type: 'video',
      video: { link: url },
    })
  }
}

export default Context
