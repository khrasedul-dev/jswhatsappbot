import axios from 'axios'
import express from 'express'
import Context from './context.js'
import Markup from './markup.js'
import { Scene, SceneManager } from './scenes.js'
import { session } from './session.js'
import { sessionStore as defaultSessionStore } from './sessionStore.js'
/**
 * Main class for WhatsApp bot framework.
 * Handles middleware, command/event registration, and message sending.
 * @class
 */
class WhatsAppBot {
  /**
   * Registers a global error handler.
   * @param {function} fn Error handler function
   */
  catch(fn) {
    this.errorHandler = fn
  }
  /**
   * Creates a WhatsAppBot instance.
   * @param {object} options
   * @param {string} options.accessToken WhatsApp Cloud API access token
   * @param {string} options.phoneNumberId WhatsApp phone number ID
   * @param {string} options.verifyToken Webhook verification token
   * @param {object} [options.sessionStore] Custom session store
   * @param {function} [options.errorHandler] Error handler
   * @param {string} [options.apiVersion] WhatsApp API version
   */
  constructor({
    accessToken,
    phoneNumberId,
    verifyToken,
    sessionStore,
    errorHandler = null,
    apiVersion = 'v23.0',
  }) {
    if (!accessToken || !phoneNumberId || !verifyToken) {
      throw new Error(
        'WhatsAppBot requires accessToken, phoneNumberId, and verifyToken'
      )
    }

    this.accessToken = accessToken
    this.phoneNumberId = phoneNumberId
    this.verifyToken = verifyToken
    this.sessionStore = sessionStore || defaultSessionStore
    this.errorHandler = errorHandler
    this.apiVersion = apiVersion

    this.handlers = { message: [], postback: [] }
    this.middlewares = []
    this.actions = {}

    this.app = express()
    this.app.use(express.json())
  }

  /**
   * Registers a middleware function.
   * @param {function} fn Middleware function
   */
  use(fn) {
    this.middlewares.push(fn)
  }

  /**
   * Registers an error handler function.
   * @param {function} fn Error handler function
   */
  useErrorHandler(fn) {
    this.errorHandler = fn
  }

  /**
   * Registers an event handler.
   * @param {string} event Event name
   * @param {function} fn Handler function
   */
  on(event, fn) {
    if (!this.handlers[event]) this.handlers[event] = []
    this.handlers[event].push(fn)
  }

  /**
   * Registers a command handler for text messages.
   * @param {string|Array<string>} cmd Command(s) to match
   * @param {function} fn Handler function
   */
  command(cmd, fn) {
    this.on('message', (ctx) => {
      if (!ctx.text || ctx._handled) return
      if (Array.isArray(cmd)) {
        for (const c of cmd) {
          if (ctx.text === c) {
            ctx._handled = true
            fn(ctx)
            break
          }
        }
      } else {
        if (ctx.text === cmd) {
          ctx._handled = true
          fn(ctx)
        }
      }
    })
  }

  // WhatsApp does not support postback/callback actions. Use hears() for button actions.
  /**
   * No-op for WhatsApp. Included for API compatibility only.
   * Use hears() for button actions.
   * @param {*} payload
   * @param {function} fn
   */
  action(payload, fn) {
    // No-op for WhatsApp. Included for API compatibility only.
    // Use hears() for button actions.
  }

  /**
   * Registers a handler for matching text or regex patterns.
   * @param {string|RegExp|Array<string|RegExp>} pattern Pattern(s) to match
   * @param {function} fn Handler function
   */
  hears(pattern, fn) {
    this.on('message', (ctx) => {
      if (!ctx.text || ctx._handled) return
      if (Array.isArray(pattern)) {
        for (const p of pattern) {
          if (typeof p === 'string' && ctx.text === p) {
            ctx._handled = true
            fn(ctx)
            break
          } else if (p instanceof RegExp && p.test(ctx.text)) {
            ctx._handled = true
            fn(ctx)
            break
          }
        }
      } else if (typeof pattern === 'string') {
        if (ctx.text === pattern) {
          ctx._handled = true
          fn(ctx)
        }
      } else if (pattern instanceof RegExp) {
        if (pattern.test(ctx.text)) {
          ctx._handled = true
          fn(ctx)
        }
      }
    })
  }

  /**
   * Runs all registered middlewares for a context.
   * @param {Context} ctx
   */
  async runMiddlewares(ctx) {
    let index = -1
    const runner = async (i) => {
      if (i <= index) return
      index = i
      const fn = this.middlewares[i]
      if (fn) {
        try {
          await fn(ctx, () => runner(i + 1))
        } catch (err) {
          if (this.errorHandler) await this.errorHandler(err, ctx)
          else throw err
        }
      }
    }
    await runner(0)
  }

  /**
   * Handles an incoming WhatsApp event.
   * @param {object} event WhatsApp event object
   */
  async handleEvent(event) {
    const senderId = event.from
    const ctx = new Context(this, event, senderId)

    try {
      // Load session
      if (this.sessionStore) {
        ctx.session = (await this.sessionStore.get(ctx.chat.id)) || {}
      }

      await this.runMiddlewares(ctx)

      // Map 'text' and 'interactive' event types to 'message' for handler matching
      let eventType =
        event.type === 'text' || event.type === 'interactive'
          ? 'message'
          : event.type

      if (this.handlers[eventType]) {
        for (const fn of this.handlers[eventType]) {
          if (ctx._handled) break
          await fn(ctx)
        }
      }

      // WhatsApp does not support postback/callback actions. No action simulation.

      // Save session
      if (this.sessionStore) {
        await this.sessionStore.set(ctx.chat.id, ctx.session)
      }
    } catch (err) {
      if (this.errorHandler) await this.errorHandler(err, ctx)
      else throw err
    }
  }

  /**
   * Sends a message to a WhatsApp user.
   * @param {string} to Recipient phone number
   * @param {string|object} textOrPayload Text or message payload
   * @returns {Promise<object|Error>} API response or error
   */
  async sendMessage(to, textOrPayload) {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`
    let data

    if (!to) {
      console.error('[sendMessage] Error: recipient (to) is missing')
      return
    }

    if (typeof textOrPayload === 'string') {
      data = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: textOrPayload },
      }
    } else if (typeof textOrPayload === 'object' && textOrPayload !== null) {
      data = {
        messaging_product: 'whatsapp',
        to,
        ...textOrPayload,
      }
    } else {
      return
    }

    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      return response
    } catch (err) {
      return err
    }
  }

  /**
   * Starts the Express server and webhook endpoints.
   * @param {number} [port=3000] Port to listen on
   */
  start(port = 3000) {
    // Verification endpoint
    this.app.get('/webhook', (req, res) => {
      const mode = req.query['hub.mode']
      const token = req.query['hub.verify_token']
      const challenge = req.query['hub.challenge']

      if (mode === 'subscribe' && token === this.verifyToken) {
        res.status(200).send(challenge)
      } else {
        res.sendStatus(403)
      }
    })

    // Incoming webhook events
    this.app.post('/webhook', async (req, res) => {
      const body = req.body
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            const messages = change.value.messages
            if (messages) {
              // Handle multiple messages concurrently
              await Promise.all(messages.map((msg) => this.handleEvent(msg)))
            }
          }
        }
        res.sendStatus(200)
      } else {
        res.sendStatus(404)
      }
    })

    this.app.listen(port, (cb) => {
      console.log(`🚀 WhatsappJs running on port ${port}`)
    })
  }
}

/**
 * Markup utility for WhatsApp reply buttons and keyboards.
 * @see Markup
 */
// ...existing code...
/**
 * Session middleware for WhatsApp bots.
 * @see session
 */
// ...existing code...
/**
 * Scene system for multi-step conversational flows.
 * @see Scene, SceneManager
 */
// ...existing code...
export default WhatsAppBot
export { Markup, Scene, SceneManager, session }
