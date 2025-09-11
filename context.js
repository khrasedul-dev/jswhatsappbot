class Context {
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

  // Reply with text
  async reply(textOrPayload) {
    this._handled = true
    return this.bot.sendMessage(this.chat.id, textOrPayload)
  }

  // Reply with image
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

  // Reply with document
  async replyWithDocument(url) {
    this._handled = true
    return this.bot.sendMessage(this.chat.id, {
      messaging_product: 'whatsapp',
      type: 'document',
      document: { link: url },
    })
  }

  // Reply with audio
  async replyWithAudio(url) {
    this._handled = true
    return this.bot.sendMessage(this.chat.id, {
      messaging_product: 'whatsapp',
      type: 'audio',
      audio: { link: url },
    })
  }

  // Reply with video
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
