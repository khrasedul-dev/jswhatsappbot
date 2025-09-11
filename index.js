import axios from 'axios'
import express from 'express'
import Context from './context.js'
import Markup from './markup.js'
import { sessionStore as defaultSessionStore } from './sessionStore.js'
import {session} from './session.js'
import { Scene, SceneManager } from './scenes.js'

class WhatsAppBot {
  catch(fn) {
    this.errorHandler = fn
  }
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

  use(fn) {
    this.middlewares.push(fn)
  }

  useErrorHandler(fn) {
    this.errorHandler = fn
  }

  on(event, fn) {
    if (!this.handlers[event]) this.handlers[event] = []
    this.handlers[event].push(fn)
  }

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
  action(payload, fn) {
    // No-op for WhatsApp. Included for API compatibility only.
    // Use hears() for button actions.
  }

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

export default WhatsAppBot
export { Markup , session , Scene, SceneManager }
